import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import CheckButton from "./check-button";

export default async function Page() {
  if (
    process.env.SERVICE_SETUP_ENABLED !== "true" ||
    process.env.APP_ENV !== "staging"
  )
    notFound();
  await auth.protect();
  return (
    <main className="auth">
      <h1>Staging service verification</h1>
      <p>
        Temporary operator check. This creates only short-lived synthetic Redis
        keys, a fixed Sentry error and, when configured, a signed QStash test
        receipt. No academy permissions or records are created.
      </p>
      <CheckButton />
    </main>
  );
}
