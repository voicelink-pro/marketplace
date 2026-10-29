"use client";

import { ArrowRight, Info, Pencil } from "lucide-react";
import Link from "next/link";
import { RadioGroup } from "radix-ui";
import { useId, useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider, SliderScale, sliderPercent } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../../audience";
import { projectEarnings } from "./projection";

type Assumption = {
  label: string;
  /** Unit shown beside the input in the popover. */
  addon: { text: string; align: "inline-start" | "inline-end" };
  defaultValue: number;
  min: number;
  max: number;
  decimals: boolean;
};

const CHURN: Omit<Assumption, "defaultValue"> = {
  label: "Customers who cancel each month",
  addon: { text: "%", align: "inline-end" },
  min: 0,
  max: 100,
  decimals: true,
};

/** Caps what the number fields accept, so results stay within the result panel. */
const MAX_DIGITS = 8;

const CONTENT: Record<
  HomeAudience,
  {
    eyebrow: string;
    heading: string;
    subtitle: string;
    /** Same targets as the hero's primary CTA; `signedOutHref` replaces `href` for visitors without a session. */
    cta: { href: string; signedOutHref?: string; label: string };
    /** The slider, labelled at every step; its number field takes any whole number up to `inputMax`. */
    reach: { label: string; name: string; defaultValue: number; max: number; step: number; inputMax: number };
    prices: { options: number[]; defaultValue: number };
    /** Turns the slider value into new paying customers a month; without it, the slider is that number. */
    rate: Assumption | null;
    churn: Assumption;
    assumptionsHint: string;
    resultLabel: string;
  }
> = {
  creators: {
    eyebrow: "Earnings calculator",
    heading: "What could you earn?",
    subtitle: "Your income stacks up every month a customer stays.",
    cta: { href: "/signup", label: "Start as a creator" },
    reach: {
      label: "New paying customers a month",
      name: "New paying customers a month",
      defaultValue: 15,
      max: 30,
      step: 5,
      inputMax: 100_000,
    },
    prices: { options: [9, 19, 39, 99], defaultValue: 19 },
    rate: null,
    churn: { ...CHURN, defaultValue: 8 },
    assumptionsHint: "Change it to match your audience.",
    resultLabel: "After 12 months",
  },
  apps: {
    eyebrow: "Growth calculator",
    heading: "What could creators bring you?",
    subtitle: "You only pay when a customer pays.",
    cta: {
      href: "/onboarding/company",
      signedOutHref: "/signup?for=apps&next=/onboarding/company",
      label: "List your app",
    },
    reach: {
      label: "Creators promoting your app",
      name: "Creators promoting your app",
      defaultValue: 10,
      max: 20,
      step: 5,
      inputMax: 10 ** MAX_DIGITS - 1,
    },
    prices: { options: [19, 39, 99], defaultValue: 39 },
    rate: {
      label: "Paying customers per creator a month",
      addon: { text: "per creator", align: "inline-end" },
      defaultValue: 1,
      min: 0,
      max: 1_000,
      decimals: true,
    },
    churn: { ...CHURN, defaultValue: 6 },
    assumptionsHint: "Change them to match your app.",
    resultLabel: "Revenue after 12 months",
  },
};

const COMMISSIONS = { options: [10, 20, 30], defaultValue: 20 };

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const moneyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const formatNumber = (value: number) => numberFormat.format(value);
const formatMoney = (value: number) => moneyFormat.format(value);

const LABEL = "text-[13px] font-semibold text-muted-foreground";

/**
 * Number field props: formatted while idle, the text as typed while editing
 * (so the caret and selection stay put). Every valid keystroke updates the
 * value, clamped to `min`..`max`; an empty field keeps the last value and
 * shows it again on blur.
 */
function useNumberField({
  value,
  onValueChange,
  min,
  max,
  decimals,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  decimals: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return {
    type: "text",
    inputMode: decimals ? "decimal" : "numeric",
    autoComplete: "off",
    value: draft ?? formatNumber(value),
    onBlur: () => setDraft(null),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value.replace(decimals ? /[^\d.,]/g : /[^\d,]/g, "");
      const digits = text.replace(/,/g, "");
      if (digits.replace(".", "").length > MAX_DIGITS) return;
      setDraft(text);
      const parsed = Number(digits);
      if (digits !== "" && digits !== "." && Number.isFinite(parsed)) {
        onValueChange(Math.min(Math.max(parsed, min), max));
      }
    },
  } as const;
}

function ReachField({
  reach,
  value,
  onValueChange,
}: {
  reach: (typeof CONTENT)[HomeAudience]["reach"];
  value: number;
  onValueChange: (value: number) => void;
}) {
  const field = useNumberField({ value, onValueChange, min: 0, max: reach.inputMax, decimals: false });
  const steps = Array.from({ length: reach.max / reach.step + 1 }, (_, index) => index * reach.step);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className={LABEL}>{reach.label}</span>
        <label className="inline-flex cursor-text items-center gap-1.5 rounded-[10px] border border-foreground/20 bg-background py-0.5 pr-2 pl-2.5 text-[13px] font-extrabold focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <input
            {...field}
            aria-label={`${reach.name}, type any number`}
            // Grows with the number; ch fits the digits, the extra half covers separators.
            style={{ width: `${Math.max(field.value.length, 1) + 0.5}ch` }}
            className="bg-transparent text-right tabular-nums outline-none"
          />
          <Pencil aria-hidden className="size-[13px] text-muted-foreground" />
        </label>
      </div>
      <Slider
        aria-label={reach.name}
        min={0}
        max={reach.max}
        step={reach.step}
        value={[Math.min(value, reach.max)]}
        onValueChange={([next]) => onValueChange(next)}
        ticks
        className="py-0"
      />
      {/* Each number centered under the thumb at that value; the last one's "+" hangs off to the right. */}
      <SliderScale aria-hidden className="h-4 text-xs text-muted-foreground">
        {steps.map((step) => (
          <span
            key={step}
            style={{ left: `${sliderPercent(step, 0, reach.max)}%` }}
            className="absolute top-0 -translate-x-1/2 tabular-nums"
          >
            {step}
            {step === reach.max ? <span className="absolute left-full">+</span> : null}
          </span>
        ))}
      </SliderScale>
    </div>
  );
}

/** Single-choice pills; arrow keys move between them. */
function ChipGroup({
  label,
  options,
  value,
  onValueChange,
  format,
}: {
  label: string;
  options: number[];
  value: number;
  onValueChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className={LABEL}>
        {label}
      </span>
      <RadioGroup.Root
        aria-labelledby={labelId}
        orientation="horizontal"
        value={String(value)}
        onValueChange={(next) => onValueChange(Number(next))}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => (
          <RadioGroup.Item
            key={option}
            value={String(option)}
            className="h-8 rounded-full border bg-background px-3 text-[13px] font-bold text-foreground/80 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
          >
            {format(option)}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}

function AssumptionField({
  assumption,
  value,
  onValueChange,
}: {
  assumption: Assumption;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const id = useId();
  const field = useNumberField({
    value,
    onValueChange,
    min: assumption.min,
    max: assumption.max,
    decimals: assumption.decimals,
  });
  return (
    <Field>
      <FieldLabel htmlFor={id}>{assumption.label}</FieldLabel>
      <InputGroup className="h-10">
        <InputGroupInput id={id} {...field} className="tabular-nums" />
        <InputGroupAddon align={assumption.addon.align}>
          <InputGroupText>{assumption.addon.text}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

/** Twelve monthly bars, scaled to the last month. */
function GrowthBars({ customers, highlight }: { customers: number[]; highlight: "last" | { share: number } }) {
  const last = customers.at(-1) ?? 0;
  return (
    <div aria-hidden className="mt-1 flex h-11 items-end gap-1">
      {customers.map((count, month) => (
        <span
          key={month}
          style={{ height: `${last > 0 ? (count / last) * 100 : 0}%` }}
          className={cn(
            "relative flex-1 overflow-hidden rounded-t-[3px] rounded-b-[1px] ease-out motion-safe:transition-[height] motion-safe:duration-300",
            highlight === "last" && month === customers.length - 1 ? "bg-primary" : "bg-foreground/15",
          )}
        >
          {/* Apps: the creators' share of each month, on top of the bar. */}
          {highlight === "last" ? null : (
            <span className="absolute inset-x-0 top-0 bg-primary" style={{ height: `${highlight.share * 100}%` }} />
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Compact estimate between How it works and the benefits: a title block,
 * the inputs and a result panel. One row from xl; from lg the title sits on
 * top of inputs and result; stacked below that. Inputs stay in local state.
 */
export function EarningsCalculator({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const content = CONTENT[audience];
  const ctaHref = (!signedIn && content.cta.signedOutHref) || content.cta.href;

  const [reach, setReach] = useState(content.reach.defaultValue);
  const [price, setPrice] = useState(content.prices.defaultValue);
  const [commission, setCommission] = useState(COMMISSIONS.defaultValue);
  const [rate, setRate] = useState(content.rate?.defaultValue ?? 1);
  const [churn, setChurn] = useState(content.churn.defaultValue);

  const projection = projectEarnings({
    newPerMonth: content.rate ? reach * rate : reach,
    churn: churn / 100,
    price,
    commissionRate: commission / 100,
  });
  const customers = Math.round(projection.customers.at(-1) ?? 0);

  const assumptions =
    audience === "creators"
      ? `Assumes ${formatNumber(churn)}% of customers cancel each month.`
      : `Assumes ${formatNumber(rate)} ${rate === 1 ? "customer" : "customers"} per creator a month, ${formatNumber(churn)}% cancel monthly.`;

  return (
    <section
      id="earnings-calculator"
      aria-labelledby="earnings-calculator-heading"
      className="mx-auto w-full max-w-6xl rounded-3xl border bg-card px-5 py-6 sm:rounded-[28px] sm:px-9 sm:py-8"
    >
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-x-10 xl:grid-cols-[260px_minmax(0,1fr)_300px] xl:gap-10">
        <div className="flex flex-col items-start gap-2 lg:col-span-2 xl:col-span-1">
          {/* The hero's key phrase color: black on a yellow marker in light, yellow letters in dark. */}
          <span className="rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[13px] font-bold text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary">
            {content.eyebrow}
          </span>
          <h2
            id="earnings-calculator-heading"
            className="text-[28px] leading-[1.08] font-extrabold tracking-[-0.04em] text-balance"
          >
            {content.heading}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">{content.subtitle}</p>
          <Link
            href={ctaHref}
            className="mt-1 inline-flex items-center gap-1.5 rounded-sm text-sm font-bold underline decoration-foreground/35 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {content.cta.label}
            <ArrowRight aria-hidden className="size-[17px]" />
          </Link>
        </div>

        <div className="flex min-w-0 flex-col gap-[18px]">
          <ReachField reach={content.reach} value={reach} onValueChange={setReach} />
          <div className="flex flex-col gap-3.5 sm:flex-row sm:gap-6">
            <ChipGroup
              label="Plan price"
              options={content.prices.options}
              value={price}
              onValueChange={setPrice}
              format={formatMoney}
            />
            <ChipGroup
              label="Commission"
              options={COMMISSIONS.options}
              value={commission}
              onValueChange={setCommission}
              format={(value) => `${value}%`}
            />
          </div>
          {/* One line from lg; may wrap on smaller screens. */}
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground lg:items-center lg:whitespace-nowrap">
            <Info aria-hidden className="mt-px size-4 shrink-0 lg:mt-0" />
            <span>
              {assumptions}{" "}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Change assumptions"
                    className="rounded-sm font-bold text-foreground underline decoration-foreground/35 underline-offset-3 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    Change
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 gap-4 rounded-2xl p-4">
                  <PopoverHeader>
                    <PopoverTitle className="font-bold">Assumptions</PopoverTitle>
                    <PopoverDescription>{content.assumptionsHint}</PopoverDescription>
                  </PopoverHeader>
                  <FieldGroup className="gap-4">
                    {content.rate ? (
                      <AssumptionField assumption={content.rate} value={rate} onValueChange={setRate} />
                    ) : null}
                    <AssumptionField assumption={content.churn} value={churn} onValueChange={setChurn} />
                  </FieldGroup>
                </PopoverContent>
              </Popover>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[18px] border bg-background p-5">
          <span className="text-xs font-semibold text-muted-foreground">{content.resultLabel}</span>
          <p aria-live="polite" aria-atomic className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[40px] leading-none font-extrabold tracking-[-0.05em] tabular-nums">
              {formatMoney(audience === "creators" ? projection.commission : projection.revenue)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ month</span>
          </p>
          {audience === "creators" ? (
            <p className="text-xs text-muted-foreground">
              About {formatNumber(customers)} paying {customers === 1 ? "customer" : "customers"}. Estimate, before the
              platform fee.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              You keep <b className="text-foreground">{formatMoney(projection.kept)}</b> · commission{" "}
              <b className="text-primary-ink">{formatMoney(projection.commission)}</b>
            </p>
          )}
          <GrowthBars
            customers={projection.customers}
            highlight={audience === "creators" ? "last" : { share: commission / 100 }}
          />
        </div>
      </div>
    </section>
  );
}
