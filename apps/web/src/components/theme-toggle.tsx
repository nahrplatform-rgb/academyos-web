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
  return <Button className="theme-toggle" onClick={() => {
    document.documentElement.dataset.theme = light ? "dark" : "light";
    window.dispatchEvent(new Event(eventName));
  }}>{light ? (arabic ? "الوضع الداكن" : "Dark mode") : (arabic ? "الوضع الفاتح" : "Light mode")}</Button>;
}
