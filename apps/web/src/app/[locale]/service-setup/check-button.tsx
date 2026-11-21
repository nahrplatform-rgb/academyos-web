"use client";
import { useState } from "react";
import { Button } from "@/components/ui/controls";
import { SETUP_ERROR } from "@/lib/telemetry";

export default function CheckButton() {
  const [result, setResult] = useState("No check run yet.");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  async function check() {
    setBusy(true);
    try {
      const response = await fetch("/api/setup/verify", { method: "POST" });
      const data = await response.json();
      setReceipt(data.receipt);
      const Sentry = await import("@sentry/nextjs");
      const error = new Error(SETUP_ERROR);
      error.name = "AcademyOSBrowserSetupError";
      const browserEventId = response.ok
        ? Sentry.captureException(error)
        : null;
      const browserFlushed = browserEventId ? await Sentry.flush(3000) : false;
      setResult(
        JSON.stringify(
          { status: response.status, ...data, browserEventId, browserFlushed },
          null,
          2,
        ),
      );
    } catch {
      setResult("The check could not complete.");
    } finally {
      setBusy(false);
    }
  }
  async function emailCheck() {
    setBusy(true);
    try {
      const response = await fetch("/api/setup/email", { method: "POST" });
      const data = await response.json();
      setResult(
        (previous) =>
          `${previous}\nEmail acceptance: ${JSON.stringify({ status: response.status, ...data })}`,
      );
    } catch {
      setResult((previous) => `${previous}\nEmail check failed.`);
    } finally {
      setBusy(false);
    }
  }
  async function checkReceipt() {
    setBusy(true);
    try {
      const response = await fetch(`/api/setup/verify?receipt=${receipt}`);
      const data = await response.json();
      setResult(
        (previous) => `${previous}\nCallback receipt: ${JSON.stringify(data)}`,
      );
    } catch {
      setResult((previous) => `${previous}\nReceipt check failed.`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button type="button" disabled={busy} onClick={check}>
        {busy ? "Checking…" : "Run synthetic service checks"}
      </Button>
      {receipt && (
        <Button type="button" disabled={busy} onClick={checkReceipt}>
          Check callback receipt
        </Button>
      )}
      <Button type="button" disabled={busy} onClick={emailCheck}>
        Send one setup email to the configured test mailbox
      </Button>
      <pre
        role="status"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {result}
      </pre>
    </>
  );
}
