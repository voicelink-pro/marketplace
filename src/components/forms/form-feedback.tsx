"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field";
import type { FormState } from "@/lib/forms";

/** Inline status for a form. Errors stay visible; successes can also toast. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle") return null;
  const isError = state.status === "error";
  return (
    <Alert variant={isError ? "destructive" : "default"} role={isError ? "alert" : "status"}>
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
  return errors ? <FieldError errors={errors} /> : null;
}
