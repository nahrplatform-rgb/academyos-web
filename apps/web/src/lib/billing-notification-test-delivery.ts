import { createHash } from "node:crypto";
import { sendStagingEmail, stagingEmailConfig } from "./email";

const operation = "academyos-staging/ex30-fictional-payment-failure-v1";
const startedKey = `${operation}:started`;
const receiptKey = `${operation}:receipt`;
const approvedRecipientHash = "5c9e66461986a89d7f6a47e0b6a361ae80ab545d812ff9850071b2b894520011";
// Resend retains the original key for 24 hours. Keep a margin for clock skew.
const replayWindowMs = 12 * 60 * 60 * 1000;

type DeliveryStore = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: { nx: true }): Promise<unknown>;
};

export async function deliverFictionalBillingNotification(
  env: Record<string, string | undefined>,
  store: DeliveryStore,
  transport: typeof fetch = fetch,
  now = Date.now(),
) {
  const config = stagingEmailConfig(env);
  if (createHash("sha256").update(config.to[0]).digest("hex") !== approvedRecipientHash)
    throw new Error("Unexpected billing test recipient");

  const receipt = await store.get<string>(receiptKey);
  if (receipt) return { status: "accepted" as const, id: receipt };

  await store.set(startedKey, now, { nx: true });
  const started = await store.get<number>(startedKey);
  if (typeof started !== "number" || !Number.isSafeInteger(started) || started <= 0 || started > now)
    throw new Error("Missing billing delivery original");
  if (now - started >= replayWindowMs) return { status: "review_required" as const };

  const sent = await sendStagingEmail(config, operation, {
    subject: "[AcademyOS staging] Fictional payment failed / تعذّر الدفع التجريبي",
    text: "A fictional subscription payment failed in AcademyOS staging. This message tests billing notifications. No payment or action is required.\n\nتعذّر دفع اشتراك افتراضي في بيئة اختبار AcademyOS. هذه الرسالة لاختبار إشعارات الفوترة. لا يلزم دفع أي مبلغ أو اتخاذ أي إجراء.",
  }, transport);
  await store.set(receiptKey, sent.id, { nx: true });
  return { status: "accepted" as const, id: sent.id };
}
