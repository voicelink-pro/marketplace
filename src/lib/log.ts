type LoggableError = { code?: string | null; message?: string | null } | null | undefined;

/**
 * Logs an unexpected failure with only its error code and message. Never pass
 * request bodies, tokens, emails or query details here.
 */
export function logUnexpected(scope: string, error: LoggableError | unknown): void {
  const value = (error ?? {}) as LoggableError & object;
  console.error(`[${scope}]`, {
    code: "code" in value ? value.code : undefined,
    message: "message" in value ? value.message : String(error),
  });
}
