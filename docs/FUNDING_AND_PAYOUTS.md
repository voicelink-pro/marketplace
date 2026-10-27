# Funding and payouts — E8 sandbox

Implemented 27 October 2026. Scope: `MARKETPLACE_BRIEF_I_PROMPTY.md`, stage 8. Live finance is disabled in the database contract and has no registered adapter. This document does not authorize real payments.

## What runs

- `/company/funding`: confirmed available funding, reserved gross commissions, outstanding gross commissions, manual deposits, owner-controlled automatic top-up threshold/amount, deposit history and in-app failure notifications. Organization members can read; only owners can authorize methods or request deposits.
- `/creator/payouts`: funded, reconciled earnings from closed months, provider recipient setup, explicit withdrawal confirmation, costs and provider minimum, transfer and bank references, status history and bank retry.
- `/admin/finance`, `/admin/payouts`: funding, payouts, processing queue, discrepancies, expected versus provider amounts/currencies/statuses, audit and review notes. Admins cannot type a replacement balance.
- `/sandbox/finance/[id]`: the test provider's local substitute for hosted payment authorization / recipient onboarding. Sessions belong to the requesting user and expire after 30 minutes. Completion requires explicit sandbox consent. No card, bank details, national identifiers or KYC documents are collected.

This is a **durable test-provider simulation**, not a Stripe Connect sandbox integration. The earlier Stripe sales integration remains separate. An authenticated purchase webhook never supplies marketplace cash, and connecting an app's sales account does not grant debit rights.

## Run locally

Apply migrations with `pnpm exec supabase migration up --local`; this preserves existing local data. Use the existing server-side payment backend credential configured with `pnpm payments:setup`. Do not publish this token or add it to a `NEXT_PUBLIC_` variable.

Run the three separate workers when exercising the complete sandbox flow:

```sh
pnpm payments:worker
pnpm commissions:worker
pnpm finance:worker
```

The finance worker also supports `--once` and `--app <app UUID>`. It reconciles provider objects, schedules eligible top-ups, then processes at most 100 operations per iteration. App filters keep acceptance fixtures separate from other queues.

1. As the company owner, open Funding → Set up sandbox payment method. Complete the test-provider authorization.
2. Request a EUR deposit. The initial status is pending, with no cash credit. Run the finance worker; only an authoritative `available` provider object credits the immutable commission journal.
3. Save the company's automatic top-up threshold and amount. The amount must exceed the threshold. The finance worker schedules the top-up after available funding falls below the threshold.
4. Process customer payments, declare their sandbox commission bases and run the commission worker as described in `COMMISSION_ACCOUNTING.md`. Current accruals reserve company funding but stay unavailable to creators until monthly closing.
5. After a completed UTC month is reconciled, close it through the existing commission operator. Older closed positions funded later release immediately, without another close.
6. As the creator, complete sandbox recipient onboarding, then confirm Withdraw. Run the finance worker. Observe `requested` → `transferred` → `paid` with distinct provider transfer and bank payout references.

Use a new deposit/withdrawal form after a completed request. A repeated form submission with its original key returns the original operation, even if new earnings have appeared. A stale amount or changed provider fee requires a fresh confirmation.

## Accounting and isolation

All new tables live in `private`, have RLS and have no direct `anon`/`authenticated` grants. Narrow RPCs check identity, organization ownership, creator identity or `platform_admins`. Worker RPCs authenticate through the expiring/revocable backend-token mechanism from E6. Fault-injection functions are service-role only.

Amounts use integer minor units throughout. The UI parses decimal strings directly into `bigint`. The test provider supports **EUR only**, a **1-cent provider minimum** and **zero provider fee**. These are explicit test-provider capabilities, not live policy defaults. Other commission currencies stay separate and are not converted or withdrawn through this adapter.

The immutable E7 journal remains the source for funding. Available company funding is confirmed credits minus allocations. Reserved funding covers funded, unpaid commission positions, including current accruals and disputed positions. Paid positions remain consumed funding, not spendable company cash. Outstanding funding includes unfunded accruals and closed obligations. Reservations are per app/currency; no company can consume another company's funding.

A funding success allocates outstanding whole positions in E7 order (period, transaction date, ID; P-14 remains sandbox). It clears only the funding pause, and only if outstanding positions are financed. Publication and other eligibility checks are unchanged. No custom 30-day hold or platform withdrawal minimum is added.

## Concurrency, unknown outcomes and retries

- Deposit requests serialize on the app accounting lock. A request key has one economic effect, and a partial unique index allows only one pending deposit per app/currency.
- Automatic top-ups use the same lock and a threshold-episode latch. Pending requests are deduplicated. A successful top-up consumed by arrears cannot immediately trigger an unlimited series of new charges while still below the same threshold. The latch rearms when available funding rises to the threshold or an owner explicitly saves new settings.
- A definitive automatic funding failure produces one durable **in-app notification** and pauses new joins, clicks and referred-customer acquisition. Existing customer registration retries remain idempotent; organic registrations and existing subscription renewals remain intact. Existing renewals still accrue obligations. Email delivery belongs to E9 and is not claimed here.
- Withdrawal locks the creator and then all relevant apps in UUID order, matching completion. Eligible whole positions are atomically moved to `in_payout` and attached to one immutable request snapshot.
- Worker claims use `FOR UPDATE SKIP LOCKED` and a 60-second lease. Provider calls occur outside the accounting transaction. Each provider operation has a permanent idempotency key equal to its job UUID. The simulator stores the provider object in its own table before returning, so it survives worker crashes and lost responses.
- Transport/pending retries have 5/10-second backoff and at most three attempts. An exhausted unknown outcome becomes a review case and **retains reservations**. A missing response never releases funds or creates a new transfer key.
- A definitive transfer failure releases the original positions once. A contradictory later transfer success is held for investigation; it cannot automatically transfer funds already released to another withdrawal.
- A bank failure or return keeps the original platform transfer. The creator can request at most three bank attempts in total, each with a new bank operation key. No bank retry creates another platform transfer. A bank return moves the original positions from `paid` back to `in_payout` through a new balanced journal entry.

## Provider fault scenarios

Find the operation UUID in the admin processing queue. Before processing, select an explicit test fixture:

```sh
pnpm finance:operator scenario --fixture --job <UUID> --scenario timeout_once
pnpm finance:operator scenario --fixture --job <UUID> --scenario decline
pnpm finance:operator scenario --fixture --job <UUID> --scenario pending
pnpm finance:operator scenario --fixture --job <UUID> --scenario unavailable
```

`timeout_once` creates the provider object and loses the first response. The next lookup finds the same object. `decline` is definitive failure. `pending` creates a provider object whose funds/outcome are not yet available. `unavailable` supplies no authoritative response, reaching review after three transport attempts.

Resolve a pending provider object, then run the worker again after its backoff:

```sh
pnpm finance:operator resolve --fixture --job <UUID> --state available
```

Use `succeeded` for a transfer or `paid` for a bank payout; `failed` also works. For an unavailable test provider with no object, an operator can restore the `success` scenario on a review job; this resets the bounded transport attempts while preserving its idempotency key and audit history. This operation does not exist in the browser.

To simulate a return after bank payment:

```sh
pnpm finance:operator return --fixture --payout <payout UUID>
pnpm finance:worker --once
```

The worker's reconciliation queues the bank return, then records it against the journal. Creator bank retry reuses the earlier transfer. The E7 `simulate-payout` fixture is for old commission acceptance tests only; use E8 requests for the real sandbox workflow.

## Reconciliation and review

The worker compares permanent provider objects with the expected owner/recipient, operation kind, amount, currency, request state and funding journal. It checks current bank-attempt positions and detects missing funding postings. A late bank return is reconciled automatically. Other mismatches and unknown outcomes create durable cases.

An admin adds a 10–500 character review note and queues another evidence check. The note is audited, and the case is closed only after the worker validates authoritative evidence. Replaying a completed funding object cannot add another credit. A terminal successful funding/transfer cannot be undone by an inconsistent response. Refunds of marketplace funding, transfer reversals and liability allocation require explicit policy and remain blocked for live.

No external provider webhooks are exposed in this test adapter. The provider boundary is `src/modules/finance/provider.mjs`, with durable simulator RPCs behind it. A future real adapter must preserve the same guarantees and add authenticated provider webhook ingress, account/country/currency checks and reconciliation of actual balance transactions.

## Live blockers and operator research

The entity's country, recipient countries and provider approval are not established in this repository. There is no basis to promise this prefunding model works for BoostLink's intended entity or all recipients.

Stripe documents platform top-ups with market/approval restrictions, including private-preview availability in the EU. This does not establish that arbitrary third-party company deposits can be treated as platform top-ups. Separate charges/transfers, the permitted payment purpose, custody/holding constraints, settlement timing and responsibility for refunds/disputes must be confirmed for the actual entity with the provider before any real adapter is enabled.

Stripe-hosted onboarding can collect real identity requirements at the provider; the marketplace must not replicate KYC collection. A Connect transfer and a bank payout use separate operations. Manual payout holding limits also depend on country and cannot be interpreted as unrestricted escrow.

Sources checked 27 October 2026:

- [Stripe: adding funds to platform balance](https://docs.stripe.com/connect/top-ups)
- [Stripe: separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- [Stripe: hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding)
- [Stripe: manual payouts and holding limits](https://docs.stripe.com/connect/manual-payouts)
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

Live also requires the owner decisions listed in E9: platform percentage, commission basis/rounding, attribution, refunds after payout, countries/currencies, provider costs, reconciliation documents and closure rules. Stage 8 does not settle these decisions or execute real payments.
