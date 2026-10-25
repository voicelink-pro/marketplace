"use client";

import { Plus, Trash } from "lucide-react";
import { useActionState } from "react";
import {
  FieldErrors,
  FormMessage,
  useSuccessToast,
  valueFor,
} from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
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
  formatCommissionPercent,
  formatCommissionRange,
  formatMinorCurrency,
} from "@/lib/money";
import {
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVAL_SUFFIX,
} from "@/modules/catalog/constants";
import { removeAppPlan, upsertAppPlan } from "../actions";
import type { TermsVersionSummary, WorkingAppPlan } from "../queries";

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
              <span className="tabular rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
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
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan name</TableHead>
                    <TableHead>Payment provider ID</TableHead>
                    <TableHead>Billing cycle</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Creator commission</TableHead>
                    {isOwner ? <TableHead className="w-12 text-right">Remove</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePlans.map((plan) => (
                    <TableRow key={plan.id}>
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
                        <span className="tabular inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {formatCommissionPercent(plan.commissionBps)} recurring
                        </span>
                      </TableCell>
                      {isOwner ? (
                        <TableCell className="text-right">
                          <RemovePlanButton plan={plan} />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {isOwner ? (
            <form action={action} noValidate className="border-t pt-5">
              <input type="hidden" name="appId" value={appId} />
              <FieldGroup>
                <h3 className="text-sm font-semibold">Add or update a subscription plan</h3>
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
                      defaultValue={valueFor(state, "name")}
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
                      defaultValue={valueFor(state, "externalPlanKey")}
                      aria-describedby="ext-key-hint"
                      aria-invalid={invalid(state, "externalPlanKey")}
                    />
                    <FieldDescription id="ext-key-hint">
                      Kept private from the public catalog; used to match payment events.
                    </FieldDescription>
                    <FieldErrors state={state} field="externalPlanKey" />
                  </Field>

                  <Field data-invalid={invalid(state, "billingInterval")}>
                    <FieldLabel htmlFor="plan-interval">Billing cycle</FieldLabel>
                    <select
                      id="plan-interval"
                      name="billingInterval"
                      defaultValue={valueFor(state, "billingInterval") ?? "month"}
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
                      defaultValue={valueFor(state, "priceAmount")}
                      aria-invalid={invalid(state, "priceAmount")}
                    />
                    <FieldErrors state={state} field="priceAmount" />
                  </Field>

                  <Field data-invalid={invalid(state, "currency")}>
                    <FieldLabel htmlFor="plan-currency">Currency</FieldLabel>
                    <select
                      id="plan-currency"
                      name="currency"
                      defaultValue={valueFor(state, "currency") ?? "EUR"}
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
                      defaultValue={valueFor(state, "commissionPercent")}
                      aria-invalid={invalid(state, "commissionPercent")}
                    />
                    <FieldErrors state={state} field="commissionPercent" />
                  </Field>
                </div>

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <FieldDescription>
                    Entering an existing payment provider ID updates that working plan. Published rate history is never overwritten.
                  </FieldDescription>
                  <SubmitButton pendingLabel="Saving plan…">
                    <Plus data-icon="inline-start" />
                    Save plan
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
                    <TableCell className="tabular font-medium text-primary">
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
