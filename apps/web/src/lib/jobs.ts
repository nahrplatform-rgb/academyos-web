import { Client, Receiver } from "@upstash/qstash";
import { STAGING_ORIGIN } from "./config";

export const SETUP_CALLBACK = `${STAGING_ORIGIN}/api/jobs/setup`;

export function stagingJobPublisher() {
  if (
    process.env.QSTASH_URL !== "https://qstash-eu-central-1.upstash.io" ||
    !process.env.QSTASH_TOKEN
  )
    throw new Error("Staging QStash is not configured");
  return new Client({
    baseUrl: process.env.QSTASH_URL,
    token: process.env.QSTASH_TOKEN,
  });
}

export async function verifyJob(
  body: string,
  signature: string,
  keys = {
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  },
) {
  if (!signature || !keys.currentSigningKey || !keys.nextSigningKey)
    return false;
  try {
    return await new Receiver({
      currentSigningKey: keys.currentSigningKey,
      nextSigningKey: keys.nextSigningKey,
    }).verify({ body, signature, url: SETUP_CALLBACK, clockTolerance: 5 });
  } catch {
    return false;
  }
}

export function isSetupJob(
  value: unknown,
): value is { kind: "setup.verify"; id: string } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).length === 2 &&
    v.kind === "setup.verify" &&
    typeof v.id === "string" &&
    /^[a-f0-9-]{36}$/.test(v.id)
  );
}
