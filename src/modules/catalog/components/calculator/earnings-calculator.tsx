"use client";

import { ArrowRight, Info, Pencil } from "lucide-react";
import Link from "next/link";
import { RadioGroup } from "radix-ui";
import { Fragment, useId, useState } from "react";
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
import type { HomeAudience } from "../../audience";
import { estimateMonthly } from "./projection";

type Assumption = {
  label: string;
  /** Unit shown beside the input in the popover. */
  addon: { text: string; align: "inline-start" | "inline-end" };
  defaultValue: number;
  min: number;
  max: number;
  decimals: boolean;
};

/** Caps what the number fields accept, so results stay within the result panel. */
const MAX_DIGITS = 9;

const CONTENT: Record<
  HomeAudience,
  {
    eyebrow: string;
    heading: string;
    subtitle: string;
    /** Same targets as the hero's primary CTA; `signedOutHref` replaces `href` for visitors without a session. */
    cta: { href: string; signedOutHref?: string; label: string };
    /**
     * The slider: a tick at every step, a label every `labelEvery`. Its number
     * field takes any whole number up to `inputMax`.
     */
    reach: {
      label: string;
      name: string;
      defaultValue: number;
      max: number;
      step: number;
      labelEvery: number;
      inputMax: number;
    };
    prices: { options: number[]; defaultValue: number };
    /** Turns the slider value into paying customers a month. */
    rate: Assumption;
    assumptionsHint: string;
    resultLabel: string;
  }
> = {
  creators: {
    eyebrow: "Earnings calculator",
    heading: "What could you earn?",
    subtitle: "You earn on every renewal, not just the first payment.",
    cta: { href: "/signup", label: "Start as a creator" },
    reach: {
      label: "Views a month",
      name: "Views a month",
      defaultValue: 150_000,
      max: 300_000,
      step: 25_000,
      labelEvery: 50_000,
      inputMax: 100_000_000,
    },
    prices: { options: [9, 19, 39, 99], defaultValue: 19 },
    rate: {
      label: "Viewers who become paying customers",
      addon: { text: "%", align: "inline-end" },
      defaultValue: 0.05,
      min: 0,
      max: 100,
      decimals: true,
    },
    assumptionsHint: "Change it to match your audience.",
    resultLabel: "Your monthly income",
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
      labelEvery: 5,
      inputMax: 99_999_999,
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
    assumptionsHint: "Change it to match your app.",
    resultLabel: "New revenue a month",
  },
};

const COMMISSIONS = { options: [10, 20, 30], defaultValue: 20 };

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const moneyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const formatNumber = (value: number) => numberFormat.format(value);
const formatMoney = (value: number) => moneyFormat.format(value);
/** 150k, 1.2M: thousands in lowercase, like the slider labels. */
const formatCompact = (value: number) => compactFormat.format(value).replace("K", "k");
const plural = (count: number, word: string) => `${formatNumber(count)} ${count === 1 ? word : `${word}s`}`;

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
  const labels = Array.from({ length: reach.max / reach.labelEvery + 1 }, (_, index) => index * reach.labelEvery);
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
        {labels.map((label) => (
          <span
            key={label}
            style={{ left: `${sliderPercent(label, 0, reach.max)}%` }}
            className="absolute top-0 -translate-x-1/2 tabular-nums"
          >
            {formatCompact(label)}
            {label === reach.max ? <span className="absolute left-full">+</span> : null}
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

/** How the figure is built, e.g. "150k views → 75 customers → $285"; wraps on phones. */
function FlowLine({ steps }: { steps: string[] }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t pt-3 text-xs text-muted-foreground tabular-nums">
      {steps.map((step, index) => (
        <Fragment key={index}>
          {index > 0 ? <ArrowRight aria-hidden className="size-3 shrink-0" /> : null}
          <span>{step}</span>
        </Fragment>
      ))}
    </p>
  );
}

/**
 * Compact monthly estimate under How it works: a title block, the inputs and
 * a result panel. The slider value times the rate assumption gives paying
 * customers for one month; the result is their payments at the chosen plan
 * price, split by the commission. One row from xl; from lg the title sits on
 * top of inputs and result; stacked below that. Inputs stay in local state.
 */
export function EarningsCalculator({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const content = CONTENT[audience];
  const ctaHref = (!signedIn && content.cta.signedOutHref) || content.cta.href;

  const [reach, setReach] = useState(content.reach.defaultValue);
  const [price, setPrice] = useState(content.prices.defaultValue);
  const [commission, setCommission] = useState(COMMISSIONS.defaultValue);
  const [rate, setRate] = useState(content.rate.defaultValue);

  const estimate = estimateMonthly({
    newCustomers: audience === "creators" ? (reach * rate) / 100 : reach * rate,
    price,
    commissionRate: commission / 100,
  });

  const assumptions =
    audience === "creators"
      ? `Assumes ${formatNumber(rate)}% of viewers become paying customers.`
      : `Assumes ${plural(rate, "paying customer")} per creator a month.`;
  const flow =
    audience === "creators"
      ? [`${formatCompact(reach)} views`, plural(estimate.customers, "customer"), formatMoney(estimate.commission)]
      : [plural(reach, "creator"), plural(estimate.customers, "customer"), formatMoney(estimate.revenue)];

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
                    <AssumptionField assumption={content.rate} value={rate} onValueChange={setRate} />
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
              {formatMoney(audience === "creators" ? estimate.commission : estimate.revenue)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ month</span>
          </p>
          {audience === "creators" ? (
            <p className="text-xs text-muted-foreground">
              From about {plural(estimate.customers, "paying customer")}. Paid again every month they stay subscribed.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              You keep <b className="text-foreground">{formatMoney(estimate.kept)}</b> · commission{" "}
              <b className="text-primary-ink">{formatMoney(estimate.commission)}</b>
            </p>
          )}
          <FlowLine steps={flow} />
        </div>
      </div>
    </section>
  );
}
