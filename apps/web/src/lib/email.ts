export function stagingEmailConfig(env: Record<string, string | undefined>) {
  if (
    env.APP_ENV !== "staging" ||
    env.EMAIL_PROVIDER !== "resend" ||
    !env.RESEND_API_KEY?.startsWith("re_")
  )
    throw new Error("Staging email is not configured");
  if (
    env.EMAIL_FROM !==
      "AcademyOS Staging <notifications@notify.academy.nahr.dev>" ||
    env.EMAIL_REPLY_TO !== "support@nahr.dev"
  )
    throw new Error("Unexpected staging sender");
  const recipients = (env.EMAIL_ALLOWED_RECIPIENTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  // Setup sends to one approved mailbox, never arbitrary caller input.
  if (
    recipients.length !== 1 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(
      recipients[0],
    )
  )
    throw new Error("Configure one approved setup recipient");
  return {
    key: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
    reply_to: env.EMAIL_REPLY_TO,
    to: recipients,
  };
}

export async function sendStagingSetupEmail(
  env: Record<string, string | undefined>,
  transport: typeof fetch = fetch,
) {
  const config = stagingEmailConfig(env);
  const release = env.VERCEL_GIT_COMMIT_SHA;
  if (!release || !/^[a-f0-9]{40}$/.test(release))
    throw new Error("A verified deployment release is required");
  const response = await transport("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `academyos-staging-setup/${release}`,
    },
    body: JSON.stringify({
      from: config.from,
      reply_to: config.reply_to,
      to: config.to,
      subject: "[AcademyOS staging] Service verification",
      text: "This is the AcademyOS staging email setup test. No academy invitation or account permission has been created.",
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("The email provider did not accept the test");
  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== "object" ||
    typeof (result as { id?: unknown }).id !== "string"
  )
    throw new Error("Invalid email receipt");
  return { accepted: true, id: (result as { id: string }).id };
}
