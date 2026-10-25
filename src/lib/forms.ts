import type { z } from "zod";

export type FieldErrors = Partial<Record<string, string[]>>;

export type FormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: FieldErrors;
      /** Echoed non-secret values so the form keeps what the user typed. */
      values?: Record<string, string>;
    }
  | { status: "success"; message: string };

export const idleFormState: FormState = { status: "idle" };

export function formError(
  message: string,
  extra: { fieldErrors?: FieldErrors; values?: Record<string, string> } = {},
): FormState {
  return { status: "error", message, ...extra };
}

/** `field` names the input when the schema validates a single value. */
export function zodFormError(
  error: z.ZodError,
  values?: Record<string, string>,
  field = "form",
): FormState {
  const message = "Check the highlighted fields.";
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? field);
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return formError(message, { fieldErrors, values });
}

export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
