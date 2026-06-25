import * as Sentry from "@sentry/nextjs";

/**
 * Report an error to Sentry (when DSN is configured) and also log it.
 * Use this instead of bare `console.error` in server-side code.
 */
export function captureError(context: string, err: unknown): void {
  console.error(`[${context}]`, err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, { tags: { context } });
  }
}
