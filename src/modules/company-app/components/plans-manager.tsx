"use client";

import { Pencil, Plus, Trash } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import {
  FieldErrors,
  FormMessage,
  useSuccessToast,
} from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { idleFormState, type FormState } from "@/lib/forms";
import {
  formatCommissionNumber,
  formatCommissionPercent,
  formatCommissionRange,
  formatMinorCurrency,
} from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVAL_SUFFIX,
  type BillingInterval,
} from "@/modules/catalog/constants";
import { removeAppPlan, upsertAppPlan } from "../actions";
import type { TermsVersionSummary, WorkingAppPlan } from "../queries";
import { formatMinorToInput, parseMajorMoneyToMinor, parsePercentToBps } from "../schemas";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

function RemovePlanButton({ plan }: { plan: WorkingAppPlan }) {
  const [state, action] = useActionState(removeAppPlan, idleFormState);
  useSuccessToast(state);
  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="planId" value={plan.id} />
      <SubmitButton
        variant="ghost"
        size="icon"
        aria-label={`Remove plan ${plan.name}`}
      >
        <Trash />
      </SubmitButton>
    </form>
  );
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

type PlanDraft = {
  planId: string;
  name: string;
  externalPlanKey: string;
  billingInterval: string;
  priceAmount: string;
  currency: string;
  commissionPercent: string;
};

const EMPTY_DRAFT: PlanDraft = {
  planId: "",
  name: "",
  externalPlanKey: "",
  billingInterval: "month",
  priceAmount: "",
  currency: "EUR",
  commissionPercent: "",
};

function draftFromPlan(plan: WorkingAppPlan): PlanDraft {
  return {
    planId: plan.id,
    name: plan.name,
    externalPlanKey: plan.externalPlanKey,
    billingInterval: plan.billingInterval,
    priceAmount: formatMinorToInput(plan.priceMinor, plan.currency),
    currency: plan.currency,
    commissionPercent: formatCommissionNumber(plan.commissionBps),
  };
}

/** What the plan will read like to creators, from the values typed so far. */
function creatorPreview(draft: PlanDraft): string | null {
  const rate = parsePercentToBps(draft.commissionPercent);
  if (!rate.ok) return null;
  const parts = [`${formatCommissionPercent(rate.bps)} recurring`];
  const price = parseMajorMoneyToMinor(draft.priceAmount, draft.currency);
  if (price.ok) {
    // Same integer math as the creator-side per-customer amount: rounds down.
    const perCustomer = (price.minor * BigInt(rate.bps)) / 10_000n;
    const suffix = BILLING_INTERVAL_SUFFIX[draft.billingInterval as BillingInterval] ?? "";
    parts.push(`${formatMinorCurrency(perCustomer, draft.currency)} per customer ${suffix}`.trim());
  }
  return parts.join(" · ");
}

function EditPlanButton({ plan, onEdit }: { plan: WorkingAppPlan; onEdit: (plan: WorkingAppPlan) => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(plan)} aria-label={`Edit plan ${plan.name}`}>
      <Pencil data-icon="inline-start" />
      Edit
    </Button>
  );
}

export function PlansManager({
  appId,
  appName,
  plans,
  termsVersions,
  isOwner,
}: {
  appId: string;
  appName: string;
  plans: WorkingAppPlan[];
  termsVersions: TermsVersionSummary[];
  isOwner: boolean;
}) {
  const [state, action] = useActionState(upsertAppPlan, idleFormState);
  useSuccessToast(state);

  // Controlled so "Edit" can pre-fill it and the preview can follow typing.
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_DRAFT);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "success") setDraft(EMPTY_DRAFT);
  }
  const formRef = useRef<HTMLFormElement>(null);
  const editing = draft.planId ? plans.find((plan) => plan.id === draft.planId) : undefined;
  const preview = creatorPreview(draft);

  function set(field: keyof PlanDraft) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.currentTarget.value;
      setDraft((current) => ({ ...current, [field]: value }));
    };
  }

  function startEditing(plan: WorkingAppPlan) {
    setDraft(draftFromPlan(plan));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("plan-name")?.focus({ preventScroll: true });
  }

  const activePlans = plans.filter((p) => p.isActive);
  const minBps =
    activePlans.length > 0 ? Math.min(...activePlans.map((p) => p.commissionBps)) : null;
  const maxBps =
    activePlans.length > 0 ? Math.max(...activePlans.map((p) => p.commissionBps)) : null;

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Working subscription plans for {appName}</CardTitle>
            {minBps !== null && maxBps !== null ? (
              <span className="tabular rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                Catalog tile range: {formatCommissionRange(minBps, maxBps)}
              </span>
            ) : null}
          </div>
          <CardDescription>
            Each subscription plan has its own human-facing name, its payment-provider plan ID, its price, and its recurring creator commission rate.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {activePlans.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No subscription plans added yet. Add at least one plan below before submitting your app for review.
            </p>
          ) : (
            <>
            {/* Phones: one tile per plan, so price and commission stay visible without side-scrolling. */}
            <ul className="flex flex-col gap-2 sm:hidden">
              {activePlans.map((plan) => (
                <li
                  key={plan.id}
                  className={cn("flex flex-col gap-2 rounded-lg border p-3", plan.id === editing?.id && "border-ring bg-muted/40")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{plan.name}</span>
                    <span className="tabular shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      {formatCommissionPercent(plan.commissionBps)} recurring
                    </span>
                  </div>
                  <span className="tabular text-sm">
                    {formatMinorCurrency(plan.priceMinor, plan.currency)}{" "}
                    <span className="text-xs text-muted-foreground">
                      {BILLING_INTERVAL_SUFFIX[plan.billingInterval]}
                    </span>
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="min-w-0 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {plan.externalPlanKey}
                    </code>
                    {isOwner ? (
                      <div className="flex shrink-0 items-center">
                        <EditPlanButton plan={plan} onEdit={startEditing} />
                        <RemovePlanButton plan={plan} />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-hidden rounded-xl border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan name</TableHead>
                    <TableHead>Payment provider ID</TableHead>
                    <TableHead>Billing cycle</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Creator commission</TableHead>
                    {isOwner ? <TableHead className="text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePlans.map((plan) => (
                    <TableRow key={plan.id} data-state={plan.id === editing?.id ? "selected" : undefined}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {plan.externalPlanKey}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {BILLING_INTERVAL_LABELS[plan.billingInterval]}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatMinorCurrency(plan.priceMinor, plan.currency)}{" "}
                        <span className="text-xs text-muted-foreground">
                          {BILLING_INTERVAL_SUFFIX[plan.billingInterval]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tabular inline-flex rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                          {formatCommissionPercent(plan.commissionBps)} recurring
                        </span>
                      </TableCell>
                      {isOwner ? (
                        <TableCell className="text-right">
                          <div className="inline-flex items-center">
                            <EditPlanButton plan={plan} onEdit={startEditing} />
                            <RemovePlanButton plan={plan} />
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}

          {isOwner ? (
            <form ref={formRef} action={action} noValidate className="scroll-mt-24 border-t pt-5">
              <input type="hidden" name="appId" value={appId} />
              {editing ? <input type="hidden" name="planId" value={editing.id} /> : null}
              <FieldGroup>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    {editing ? `Edit “${editing.name}”` : "Add a subscription plan"}
                  </h3>
                  {editing ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(EMPTY_DRAFT)}>
                      Cancel editing
                    </Button>
                  ) : null}
                </div>
                {state.status === "error" ? <FormMessage state={state} /> : null}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field data-invalid={invalid(state, "name")}>
                    <FieldLabel htmlFor="plan-name">Plan name (shown to creators)</FieldLabel>
                    <Input
                      id="plan-name"
                      name="name"
                      required
                      maxLength={80}
                      placeholder="e.g. Pro Monthly or Pro Annual"
                      value={draft.name}
                      onChange={set("name")}
                      aria-invalid={invalid(state, "name")}
                    />
                    <FieldErrors state={state} field="name" />
                  </Field>

                  <Field data-invalid={invalid(state, "externalPlanKey")}>
                    <FieldLabel htmlFor="plan-ext-key">
                      Plan ID in payment system
                    </FieldLabel>
                    <Input
                      id="plan-ext-key"
                      name="externalPlanKey"
                      required
                      maxLength={120}
                      placeholder="e.g. price_1ProMonthly or rc_annual_ent"
                      value={draft.externalPlanKey}
                      onChange={set("externalPlanKey")}
                      aria-describedby="ext-key-hint"
                      aria-invalid={invalid(state, "externalPlanKey")}
                    />
                    <FieldDescription id="ext-key-hint">
                      Find it in your payment provider, e.g. Stripe price ID{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">price_…</code>. Kept private; used to match payments.
                    </FieldDescription>
                    <FieldErrors state={state} field="externalPlanKey" />
                  </Field>

                  <Field data-invalid={invalid(state, "billingInterval")}>
                    <FieldLabel htmlFor="plan-interval">Billing cycle</FieldLabel>
                    <select
                      id="plan-interval"
                      name="billingInterval"
                      value={draft.billingInterval}
                      onChange={set("billingInterval")}
                      className={selectClassName}
                    >
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                      <option value="year">Annual</option>
                    </select>
                    <FieldErrors state={state} field="billingInterval" />
                  </Field>

                  <Field data-invalid={invalid(state, "priceAmount")}>
                    <FieldLabel htmlFor="plan-price">Subscription price</FieldLabel>
                    <Input
                      id="plan-price"
                      name="priceAmount"
                      inputMode="decimal"
                      required
                      placeholder="e.g. 14.99"
                      value={draft.priceAmount}
                      onChange={set("priceAmount")}
                      aria-invalid={invalid(state, "priceAmount")}
                    />
                    <FieldErrors state={state} field="priceAmount" />
                  </Field>

                  <Field data-invalid={invalid(state, "currency")}>
                    <FieldLabel htmlFor="plan-currency">Currency</FieldLabel>
                    <select
                      id="plan-currency"
                      name="currency"
                      value={draft.currency}
                      onChange={set("currency")}
                      className={selectClassName}
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="PLN">PLN (zł)</option>
                    </select>
                    <FieldErrors state={state} field="currency" />
                  </Field>

                  <Field data-invalid={invalid(state, "commissionPercent")}>
                    <FieldLabel htmlFor="plan-commission">Creator commission (%)</FieldLabel>
                    <Input
                      id="plan-commission"
                      name="commissionPercent"
                      inputMode="decimal"
                      required
                      placeholder="e.g. 20 or 12.5"
                      value={draft.commissionPercent}
                      onChange={set("commissionPercent")}
                      aria-invalid={invalid(state, "commissionPercent")}
                    />
                    <FieldErrors state={state} field="commissionPercent" />
                  </Field>
                </div>

                <p aria-live="polite" className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Creators will see: </span>
                  {preview ? (
                    <span className="tabular font-semibold">{preview}</span>
                  ) : (
                    <span className="text-muted-foreground">enter a commission rate to preview.</span>
                  )}
                </p>

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <FieldDescription>
                    {editing
                      ? "Changes update this working plan. Published rate history is never overwritten."
                      : "Entering an existing payment provider ID updates that working plan. Published rate history is never overwritten."}
                  </FieldDescription>
                  <SubmitButton pendingLabel="Saving plan…" className="shrink-0">
                    {editing ? null : <Plus data-icon="inline-start" />}
                    {editing ? "Save changes" : "Add plan"}
                  </SubmitButton>
                </div>
              </FieldGroup>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {termsVersions.length > 0 ? (
        <section aria-labelledby="version-history-heading" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="version-history-heading" className="text-lg font-semibold">
              Published rate & terms history (immutable snapshots)
            </h2>
            <p className="text-xs text-muted-foreground">
              Each approved publication snapshots your plan rates. Previously referred customers keep the rate version from when they were attributed.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Commission range</TableHead>
                  <TableHead>Attribution window</TableHead>
                  <TableHead className="text-right">Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termsVersions.map((tv, idx) => (
                  <TableRow key={tv.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="tabular">Terms v{tv.versionNumber}</span>
                        {idx === 0 ? <Badge variant="secondary">Current published</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="tabular font-medium text-primary-ink">
                      {formatCommissionRange(tv.minCommissionBps, tv.maxCommissionBps)}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground">
                      {tv.attributionWindowDays} days
                    </TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {dateFormat.format(new Date(tv.publishedAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
