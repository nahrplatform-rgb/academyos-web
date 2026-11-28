"use client";
import { useSyncExternalStore } from "react";
import { Button } from "./ui/controls";

const eventName = "academyos-theme-change";
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
function isLight() { return document.documentElement.dataset.theme !== "dark"; }
/** Presentation preference only, retained during navigation; no account or private data. */
export default function ThemeToggle({ arabic }: { arabic: boolean }) {
  const light = useSyncExternalStore(subscribe, isLight, () => true);
  const label=light?(arabic?"الوضع الداكن":"Dark mode"):(arabic?"الوضع الفاتح":"Light mode");
  return <Button type="button" className="theme-toggle workspace-icon-button" aria-label={label} title={label} onClick={() => {
    document.documentElement.dataset.theme = light ? "dark" : "light";
    window.dispatchEvent(new Event(eventName));
  }}>
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      {light?<path d="M20.6 14A8.8 8.8 0 0 1 10 3.4 8.8 8.8 0 1 0 20.6 14Z"/>:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m0-14-1.5 1.5m-11 11L5 19"/></>}
    </svg>
  </Button>;
}
