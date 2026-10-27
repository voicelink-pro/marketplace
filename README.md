# BoostLink

Marketplace where companies list subscription apps and creators earn recurring commission for customers they refer. Scope: `MARKETPLACE_BRIEF_I_PROMPTY.md`. Progress: `docs/IMPLEMENTATION_STATUS.md`.

Stack: Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4 + shadcn/ui, Supabase (Postgres, Auth, RLS), Zod, Vitest.

## Parallel frontend and backend work

Frontend/UI/UX handoff for stages 1–4: [docs/FRONTEND_SCOPE_STAGES_1_4.md](docs/FRONTEND_SCOPE_STAGES_1_4.md). It defines screens, ownership, acceptance checks and PR order. Backend work continues separately with stage 5; frontend polish must preserve the existing server contracts.

The product name is **BoostLink**, configured in `src/config/site.ts` and reused by navigation and page titles. The existing GitHub repository name and local Supabase project ID `marketplace-roch` remain technical identifiers; changing them is a separate infrastructure operation.

## Local setup

Requirements: Node 24+, pnpm 10, Docker (for the local Supabase stack).

```bash
pnpm install
pnpm db:start                 # local Supabase; applies migrations
cp .env.example .env.local    # fill in from: pnpm exec supabase status -o env
pnpm dev                      # http://localhost:3000
```

Confirmation and password-reset emails are caught by the local mail viewer (Mailpit) at http://127.0.0.1:55324.

Make someone an admin (there is no other way to get the role):

```bash
pnpm admin:grant --email person@example.com --by "your name" --note "reason"
```

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm db:reset && pnpm db:advisors && pnpm test:integration   # needs pnpm db:start
```

`pnpm test` runs the migrations on in-process Postgres (PGlite) and checks RLS, grants and limits without Docker. The integration suite checks the same rules through the real Data API, plus concurrency, company review and private Storage. It reads local credentials from `supabase status` when explicit test credentials are absent, and fails instead of silently skipping when no stack is available.

This project uses ports **55321–55329** so it can run beside other Supabase projects. The app remains on port 3000. `pnpm dev` and `pnpm build` use Next.js Webpack with the official Tailwind PostCSS plugin; Instrument Sans is bundled locally with its OFL license. Cache Components and Partial Prefetching are explicitly enabled.

For an existing local database, apply pending migrations without deleting data:

```bash
pnpm exec supabase db push --local --yes
pnpm db:types
pnpm db:advisors
pnpm test:integration
```

`db:reset` deletes local database data; use it only for a disposable database. `db:types` generates the committed types atomically and CI fails on drift.

Company media can be uploaded from App profile (PNG/JPEG/WebP up to 10 MB, MP4/WebM up to 25 MB). Uploaded objects are immutable and private; only references in the current approved release become public through `/media/apps/...`. New files receive new paths. External URLs are already public and cannot be made private by this app. The in-memory demo does not emulate Storage and is always forbidden in production.

The Stage 1–4 repair and verification record is in `docs/IMPLEMENTATION_STATUS.md`. Stage 5 sandbox attribution is documented in [docs/ATTRIBUTION_INTEGRATION.md](docs/ATTRIBUTION_INTEGRATION.md), including app-scoped credentials, redirects, customer registration and the local integration demo. Payment integrations remain stage 6.

## Payment integrations (stage 6)

See [docs/PAYMENT_INTEGRATIONS.md](docs/PAYMENT_INTEGRATIONS.md) for authenticated webhook delivery, durable asynchronous processing, identity/plan mapping and frontend contracts. Apply the E6 migration, run `pnpm payments:setup`, restart Next, then run `pnpm payments:worker`. Actual Stripe/RevenueCat sandbox acceptance requires provider access; local fixtures do not imply provider verification. Live payment processing remains disabled. Stage 7 adds explicitly configured sandbox commission accounting; real funding and payout execution remain disabled.

## Commission accounting (stage 7)

See [docs/COMMISSION_ACCOUNTING.md](docs/COMMISSION_ACCOUNTING.md) for explicit sandbox policy/basis declarations, the immutable balanced journal, historical rates, corrections, operator month closure and fixture funding. Apply the E7 migration and run `pnpm commissions:worker` alongside the E6 worker. No platform fee is configured automatically. Provider access preparation: [docs/PROVIDER_SANDBOX_PLAYBOOK.md](docs/PROVIDER_SANDBOX_PLAYBOOK.md).

## Company funding and creator payouts (stage 8 sandbox)

See [docs/FUNDING_AND_PAYOUTS.md](docs/FUNDING_AND_PAYOUTS.md). Apply the E8 migrations, then run `pnpm finance:worker` alongside the payment and commission workers. Funding, automatic top-ups, recipient setup, Withdraw and reconciliation use a durable test provider; this is separate from Stripe app-sales sandbox. No real money moves and no live adapter is registered. Fault injection: `pnpm finance:operator` (explicit `--fixture` required). Funding failure notifications appear in the company panel.

## Pilot operations (stage 9)

See [docs/PILOT_CHECKLIST.md](docs/PILOT_CHECKLIST.md), [docs/OPERATIONS_AND_RECOVERY.md](docs/OPERATIONS_AND_RECOVERY.md) and [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md). E9 adds real administrative queues, private support conversations, in-app notifications, append-only audit and worker heartbeats. `pnpm ops:check` reports actionable queue/liveness signals; `pnpm test:pilot` builds an isolated local HTTP acceptance environment and verifies the connected lifecycle plus nonempty backup/restore. `pnpm backup:local` is explicitly local-only. Hosted monitoring, off-site encrypted backups, the merged frontend acceptance and all live-money requirements need their separate checks.
