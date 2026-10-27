"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field";
import type { FormState } from "@/lib/forms";

function singleFieldErrorKey(state: FormState): string | null {
  if (state.status !== "error" || !state.fieldErrors) return null;
  const keys = Object.entries(state.fieldErrors)
    .filter(([, messages]) => messages && messages.length > 0)
    .map(([key]) => key);
  return keys.length === 1 ? keys[0]! : null;
}

/**
 * Inline status for a form. Errors stay visible; successes can also toast.
 * With exactly one field error that the form shows inline, the banner hides
 * so the message appears once. Any other error keeps the banner.
 */
export function FormMessage({ state }: { state: FormState }) {
  const ref = useRef<HTMLDivElement>(null);
  const singleField = singleFieldErrorKey(state);
  useLayoutEffect(() => {
    const banner = ref.current;
    if (!banner) return;
    const inline = singleField
      ? banner.closest("form")?.querySelector(`[data-field-error="${CSS.escape(singleField)}"]`)
      : null;
    banner.hidden = Boolean(inline);
  }, [singleField, state]);

  if (state.status === "idle") return null;
  const isError = state.status === "error";
  return (
    <Alert ref={ref} variant={isError ? "destructive" : "default"} role={isError ? "alert" : "status"}>
      {isError ? <TriangleAlert /> : <CircleCheck />}
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

export function useSuccessToast(state: FormState) {
  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
  }, [state]);
}

export function fieldErrorsFor(state: FormState, field: string): { message: string }[] | undefined {
  if (state.status !== "error") return undefined;
  return state.fieldErrors?.[field]?.map((message) => ({ message }));
}

export function valueFor(state: FormState, field: string): string | undefined {
  return state.status === "error" ? state.values?.[field] : undefined;
}

export function FieldErrors({ state, field }: { state: FormState; field: string }) {
  const errors = fieldErrorsFor(state, field);
  return errors ? <FieldError data-field-error={field} errors={errors} /> : null;
}
