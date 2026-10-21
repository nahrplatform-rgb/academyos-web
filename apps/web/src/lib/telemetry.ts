import type { ErrorEvent } from "@sentry/nextjs";

export const SETUP_ERROR = "AcademyOS synthetic monitoring verification";

// Keep diagnostic structure; never forward business payloads or free-text errors.
export function privateErrorEvent(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    environment: "staging",
    release: event.release,
    debug_meta: {
      images: event.debug_meta?.images?.flatMap((image) =>
        image.type === "sourcemap" && /^[a-f0-9-]{36}$/i.test(image.debug_id)
          ? [
              {
                type: "sourcemap" as const,
                debug_id: image.debug_id,
                code_file: safeFrameFilename(image.code_file) ?? "unknown",
              },
            ]
          : [],
      ),
    },
    exception: event.exception && {
      values: event.exception.values?.map((exception) => ({
        type: /^[A-Za-z][A-Za-z0-9_.]{0,79}$/.test(exception.type ?? "")
          ? exception.type
          : "Error",
        value:
          exception.value === SETUP_ERROR
            ? SETUP_ERROR
            : "Error details withheld",
        mechanism: exception.mechanism && {
          type: exception.mechanism.type,
          handled: exception.mechanism.handled,
        },
        stacktrace: exception.stacktrace && {
          frames: exception.stacktrace.frames?.map((frame) => ({
            filename: safeFrameFilename(frame.filename),
            function: /^[\w.$<> /-]{1,120}$/.test(frame.function ?? "")
              ? frame.function
              : undefined,
            lineno: frame.lineno,
            colno: frame.colno,
            in_app: frame.in_app,
            debug_id: /^[a-f0-9-]{36}$/i.test(frame.debug_id ?? "")
              ? frame.debug_id
              : undefined,
          })),
        },
      })),
    },
  };
}

function safeFrameFilename(filename?: string) {
  if (!filename) return undefined;
  const clean = filename.split(/[?#]/, 1)[0];
  // Next static assets and webpack sources are needed for source-map matching.
  const staticIndex = clean.indexOf("/_next/");
  if (staticIndex >= 0) return clean.slice(staticIndex);
  if (/^(webpack|app):\/\//.test(clean)) return clean;
  // Do not disclose developer home directories or arbitrary remote URL paths.
  return clean.split(/[\\/]/).pop();
}

export const privateTelemetryOptions = {
  environment: "staging",
  tracesSampleRate: 0,
  maxBreadcrumbs: 0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
    frameContextLines: 0,
  },
  beforeSend: privateErrorEvent,
  beforeSendLog: () => null,
  beforeSendMetric: () => null,
};
