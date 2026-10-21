import * as Sentry from "@sentry/nextjs";
import { privateTelemetryOptions } from "./lib/telemetry";

Sentry.init({
  ...privateTelemetryOptions,
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
});
