"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyValueButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  toastMessage = "Copied to clipboard.",
  ariaLabel,
  variant = "outline",
  size = "sm",
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  toastMessage?: string;
  ariaLabel?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  /** The icon sizes show only the icon; give them an `ariaLabel`. */
  size?: "sm" | "default" | "lg" | "icon" | "icon-sm";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(toastMessage);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically. Select and copy the text.");
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={ariaLabel ?? `${label}: ${value}`}
      className={className}
    >
      {size.startsWith("icon") ? (
        <Icon />
      ) : (
        <>
          <Icon data-icon="inline-start" />
          <span>{copied ? copiedLabel : label}</span>
        </>
      )}
    </Button>
  );
}

export function CopyableField({
  label,
  value,
  copyLabel = "Copy",
  toastMessage,
  mono = true,
  hint,
}: {
  label: string;
  value: string;
  copyLabel?: string;
  toastMessage?: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          className={`flex min-h-10 min-w-0 flex-1 items-center rounded-lg border bg-muted/50 px-3 py-2 text-sm select-all ${
            mono ? "font-mono" : "font-medium"
          }`}
        >
          {/* Full value, wrapped — creators must be able to read the whole link. */}
          <span className="min-w-0 break-all">{value}</span>
        </div>
        <CopyValueButton
          value={value}
          label={copyLabel}
          toastMessage={toastMessage}
          ariaLabel={`${copyLabel} (${label})`}
          className="shrink-0 sm:w-auto"
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
