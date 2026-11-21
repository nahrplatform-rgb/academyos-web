"use client";

import { useRef } from "react";

type Props = {
  pane: "navigation" | "inspector";
  label: string;
  controls: string;
  width: number;
  minimum: number;
  maximum: number;
  initial?: number;
  arabic: boolean;
  hidden?: boolean;
  onResize: (width: number) => void;
};

export default function WorkspaceSeparator({ pane, label, controls, width, minimum, maximum, initial = minimum, arabic, hidden, onResize }: Props) {
  const drag = useRef<{ pointer: number; x: number; width: number } | null>(null);
  const direction = (arabic ? -1 : 1) * (pane === "navigation" ? 1 : -1);
  const resize = (next: number) => onResize(Math.max(minimum, Math.min(maximum, next)));

  return <div
    className={`${pane}-resizer`}
    role="separator"
    hidden={hidden}
    tabIndex={hidden ? -1 : 0}
    aria-label={label}
    aria-orientation="vertical"
    aria-controls={controls}
    aria-valuemin={minimum}
    aria-valuemax={maximum}
    aria-valuenow={width}
    onKeyDown={event => {
      const step = (event.shiftKey ? 32 : 16) * direction;
      if (event.key === "ArrowLeft") resize(width - step);
      else if (event.key === "ArrowRight") resize(width + step);
      else if (event.key === "End") resize(maximum);
      else if (event.key === "Home") resize(minimum);
      else if (event.key === "Enter") resize(initial);
      else return;
      event.preventDefault();
      event.stopPropagation();
    }}
    onDoubleClick={() => resize(initial)}
    onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0) return;
      drag.current = { pointer: event.pointerId, x: event.clientX, width };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      if (drag.current?.pointer !== event.pointerId) return;
      resize(drag.current.width + (event.clientX - drag.current.x) * direction);
    }}
    onLostPointerCapture={() => { drag.current = null; }}
  />;
}
