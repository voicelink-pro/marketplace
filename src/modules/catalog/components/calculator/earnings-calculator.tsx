"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { RadioGroup } from "radix-ui";
import { useId, useState } from "react";
import { Field, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import type { HomeAudience } from "../../audience";
import { useMediaQuery } from "../use-media-query";
import { estimateMonthly } from "./projection";

type Assumption = {
  label: string;
  /** Unit shown beside the input in the popover. */
  addon?: { text: string; align: "inline-start" | "inline-end" };
  min: number;
  max: number;
  decimals: boolean;
};

/** Caps what the number fields accept, so the heading's amount stays readable. */
const MAX_DIGITS = 9;

const CONTENT: Record<
  HomeAudience,
  {
    eyebrow: string;
    /** Same targets as the hero's primary CTA; `signedOutHref` replaces `href` for visitors without a session. */
    cta: { href: string; signedOutHref?: string; label: string };
    /**
     * The slider runs 0..`max` in `step`s; the popover's number field takes
     * any whole number up to `inputMax`, and the slider then sits at `max`.
     */
    reach: { label: string; defaultValue: number; max: number; step: number; inputMax: number };
    prices: { options: number[]; defaultValue: number };
    /** Turns the slider value into paying customers a month. */
    rate: Assumption & { defaultValue: number };
    assumptionsHint: string;
  }
> = {
  creators: {
    eyebrow: "Earnings calculator",
    cta: { href: "/signup", label: "Start as a creator" },
    reach: { label: "Views a month", defaultValue: 150_000, max: 300_000, step: 25_000, inputMax: 100_000_000 },
    prices: { options: [9, 19, 39, 99], defaultValue: 19 },
    rate: {
      label: "Viewers who subscribe",
      addon: { text: "%", align: "inline-end" },
      defaultValue: 0.05,
      min: 0,
      max: 100,
      decimals: true,
    },
    assumptionsHint: "Change them to match your audience.",
  },
  apps: {
    eyebrow: "Growth calculator",
    cta: {
      href: "/onboarding/company",
      signedOutHref: "/signup?for=apps&next=/onboarding/company",
      label: "List your app",
    },
    reach: { label: "Creators promoting your app", defaultValue: 10, max: 20, step: 5, inputMax: 99_999_999 },
    prices: { options: [19, 39, 99], defaultValue: 39 },
    rate: {
      label: "Paying customers per creator a month",
      addon: { text: "per creator", align: "inline-end" },
      defaultValue: 1,
      min: 0,
      max: 1_000,
      decimals: true,
    },
    assumptionsHint: "Change them to match your app.",
  },
};

const COMMISSIONS = { options: [10, 20, 30], defaultValue: 20 };

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const moneyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const formatNumber = (value: number) => numberFormat.format(value);
const formatMoney = (value: number) => moneyFormat.format(value);
/** 150k, 1.2M: thousands in lowercase. */
const formatCompact = (value: number) => compactFormat.format(value).replace("K", "k");
const plural = (count: number, word: string) => `${formatNumber(count)} ${count === 1 ? word : `${word}s`}`;

/** The hero's key phrase color: black on a yellow marker in light, yellow letters in dark. */
const KEY_PHRASE = "rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary";

/**
 * Restyles the shared slider from outside: a 6px track, the yellow fill and a
 * 30px white thumb. `py-3` makes the root as tall as the thumb, so the whole
 * thumb is a hit area.
 */
const SLIDER =
  "py-3 **:data-[slot=slider-track]:bg-foreground/15 dark:**:data-[slot=slider-track]:bg-[#2a2a2a] **:data-[slot=slider-range]:bg-primary **:data-[slot=slider-thumb]:size-[30px] **:data-[slot=slider-thumb]:border-0 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:shadow-[0_2px_8px_rgb(0_0_0/0.3)] **:data-[slot=slider-thumb]:transition-[box-shadow,scale] **:data-[slot=slider-thumb]:hover:scale-105";

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
    <Field>
      <FieldTitle id={labelId}>{label}</FieldTitle>
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
            className="h-[34px] rounded-full border bg-background px-3.5 text-[13px] font-bold text-foreground/80 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
          >
            {format(option)}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </Field>
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
        {assumption.addon ? (
          <InputGroupAddon align={assumption.addon.align}>
            <InputGroupText>{assumption.addon.text}</InputGroupText>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </Field>
  );
}

/**
 * Compact monthly estimate under How it works, as one centered column: the
 * result is part of the heading's sentence, a subline shows how it is built,
 * and one slider drives it. The remaining assumptions (rate, plan price,
 * commission) sit in a line under the slider; its "Change" popover edits them
 * and also takes a typed slider value beyond the slider's range. The slider
 * value times the rate gives paying customers for one month; the amount is
 * their payments at the plan price (apps) or the commission on them
 * (creators). Inputs stay in local state.
 */
export function EarningsCalculator({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const content = CONTENT[audience];
  const ctaHref = (!signedIn && content.cta.signedOutHref) || content.cta.href;
  const wide = useMediaQuery("(min-width: 640px)", true);

  const [reach, setReach] = useState(content.reach.defaultValue);
  const [price, setPrice] = useState(content.prices.defaultValue);
  const [commission, setCommission] = useState(COMMISSIONS.defaultValue);
  const [rate, setRate] = useState(content.rate.defaultValue);

  const estimate = estimateMonthly({
    newCustomers: audience === "creators" ? (reach * rate) / 100 : reach * rate,
    price,
    commissionRate: commission / 100,
  });

  const amount = (
    <span className={`${KEY_PHRASE} whitespace-nowrap tabular-nums`}>
      {formatMoney(audience === "creators" ? estimate.commission : estimate.revenue)}
    </span>
  );
  const customers = <b className="font-bold text-foreground">{plural(estimate.customers, "paying customer")}</b>;

  return (
    <section
      id="earnings-calculator"
      aria-labelledby="earnings-calculator-heading"
      className="mx-auto flex w-full max-w-6xl flex-col items-center gap-[18px] rounded-3xl border bg-card px-5 py-10 text-center sm:gap-[22px] sm:rounded-[28px] sm:px-12 sm:py-14"
    >
      <span className={`${KEY_PHRASE} text-[13px] font-bold`}>{content.eyebrow}</span>

      <h2
        id="earnings-calculator-heading"
        className="max-w-3xl text-[34px] leading-[1.05] font-extrabold tracking-[-0.045em] text-balance sm:text-5xl lg:text-[52px]"
      >
        <span aria-live="polite" aria-atomic>
          {audience === "creators" ? (
            <>Your audience could earn you {amount} a month</>
          ) : (
            <>
              {plural(reach, "creator")} could bring you {amount} a month
            </>
          )}
        </span>
      </h2>

      <p className="max-w-xl text-[15px] text-muted-foreground tabular-nums sm:text-[17px]">
        {audience === "creators" ? (
          <>
            From <b className="font-bold text-foreground">{formatCompact(reach)} views</b> a month · about {customers}
          </>
        ) : (
          <>
            {customers} a month · you keep <b className="font-bold text-foreground">{formatMoney(estimate.kept)}</b>,
            creators get <b className="font-bold text-foreground">{formatMoney(estimate.commission)}</b>
          </>
        )}
      </p>

      <div className="flex w-full max-w-[320px] flex-col gap-1.5 py-3.5 sm:max-w-[560px] sm:py-4.5">
        <Slider
          aria-label={content.reach.label}
          min={0}
          max={content.reach.max}
          step={content.reach.step}
          value={[Math.min(reach, content.reach.max)]}
          onValueChange={([next]) => setReach(next)}
          className={SLIDER}
        />
        <div aria-hidden className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>0</span>
          <span>{formatCompact(content.reach.max)}+</span>
        </div>
      </div>

      <p className="max-w-[600px] text-[13px] text-balance text-muted-foreground">
        {audience === "creators"
          ? `Assumes ${formatNumber(rate)}% of viewers subscribe to a ${formatMoney(price)} plan at ${commission}% commission.`
          : `Assumes ${plural(rate, "paying customer")} per creator a month on a ${formatMoney(price)} plan at ${commission}% commission.`}{" "}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Change assumptions"
              className="rounded-sm font-bold whitespace-nowrap text-foreground underline decoration-foreground/35 underline-offset-3 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Change
            </button>
          </PopoverTrigger>
          <PopoverContent
            align={wide ? "end" : "center"}
            // Keeps the page's 16px gutter when the trigger sits near the screen edge.
            collisionPadding={16}
            className="w-80 gap-4 rounded-2xl p-4"
          >
            <PopoverHeader>
              <PopoverTitle className="font-bold">Assumptions</PopoverTitle>
              <PopoverDescription>{content.assumptionsHint}</PopoverDescription>
            </PopoverHeader>
            <FieldGroup className="gap-4">
              <AssumptionField
                assumption={{ label: content.reach.label, min: 0, max: content.reach.inputMax, decimals: false }}
                value={reach}
                onValueChange={setReach}
              />
              <AssumptionField assumption={content.rate} value={rate} onValueChange={setRate} />
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
            </FieldGroup>
          </PopoverContent>
        </Popover>
      </p>

      <Link
        href={ctaHref}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-bold underline decoration-foreground/35 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {content.cta.label}
        <ArrowRight aria-hidden className="size-[17px]" />
      </Link>
    </section>
  );
}
