import type { ComponentProps } from "react";

/** Native controls keep form submission, browser validation and caller handlers. */
export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return <button className={`ui-button ${className}`.trim()} {...props} />;
}
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`ui-input ${className}`.trim()} {...props} />;
}
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`ui-select ${className}`.trim()} {...props} />;
}
export function StatusBadge({ className = "", ...props }: ComponentProps<"span">) {
  return <span className={`badge ${className}`.trim()} {...props} />;
}
