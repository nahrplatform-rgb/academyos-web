"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './ui/controls';
/** Presentation only. Domain owns selection, data retrieval, dirty guards and recovery. */
export default function WorkspacePanes({ children, inspector, title, arabic, selected = false, onBack, blocked = false, plain = false }: { children: ReactNode; inspector: ReactNode; title: string; arabic: boolean; selected?: boolean; onBack?: () => void; blocked?: boolean; plain?: boolean }) {
  const [contextOpen, setContextOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null), opener = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (selected) heading.current?.focus(); }, [selected]);
  function back() { if (blocked) return; if (contextOpen) { setContextOpen(false); requestAnimationFrame(() => opener.current?.focus()); } else onBack?.(); }
  if (plain) return <>{children}</>;
  return <div className={`workspace-panes${selected || contextOpen ? ' pane-selected' : ''}`} onKeyDown={e => { if (e.key === 'Escape' && (selected || contextOpen) && !blocked) { e.preventDefault(); back(); } }}>
    <div className="workspace-center"><Button ref={opener} className="context-toggle" disabled={blocked} onClick={() => { setContextOpen(true); requestAnimationFrame(() => heading.current?.focus()); }}>{arabic ? 'عرض السياق' : 'View context'}</Button>{children}</div>
    <aside className="workspace-inspector" aria-label={arabic ? 'التفاصيل والإجراءات السياقية' : 'Contextual details and actions'}>
      <header className="inspector-heading"><h2 ref={heading} tabIndex={-1}>{title}</h2>{(selected || contextOpen) && (onBack || contextOpen) && <Button disabled={blocked} onClick={back}>{arabic ? 'رجوع' : 'Back'}</Button>}</header>{inspector}
    </aside>
  </div>;
}
