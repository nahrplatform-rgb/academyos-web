import * as Sentry from "@sentry/nextjs";
import { privateTelemetryOptions } from "./lib/telemetry";

Sentry.init({
  ...privateTelemetryOptions,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
