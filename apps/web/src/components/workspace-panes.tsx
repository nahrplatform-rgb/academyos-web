"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './ui/controls';
/** Presentation only. Domain owns selection, data retrieval, dirty guards and recovery. */
export default function WorkspacePanes({ children, inspector, title, arabic, selected = false, onBack, blocked = false, plain = false, selectionKey, backLabel, contextLabel, modalOnPhone = true, task = false, focusTargetId }: { children: ReactNode; inspector: ReactNode; title: string; arabic: boolean; selected?: boolean; onBack?: () => void; blocked?: boolean; plain?: boolean; selectionKey?: string; backLabel?: string; contextLabel?: string; modalOnPhone?: boolean; task?: boolean; focusTargetId?: string }) {
  const [contextOpen, setContextOpen] = useState(false);
  const phoneDialog = useRef<HTMLDialogElement>(null);
  const [phone, setPhone] = useState(false);
  useEffect(() => { if(!modalOnPhone)return; const media=window.matchMedia("(max-width: 1279px)");const update=()=>setPhone(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update); },[modalOnPhone]);
  useEffect(()=>{if(!task&&modalOnPhone&&phone&&(selected||contextOpen))phoneDialog.current?.showModal();else phoneDialog.current?.close();},[task,modalOnPhone,phone,selected,contextOpen]);
  const heading = useRef<HTMLHeadingElement>(null), opener = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (selected && (!phone || task || phoneDialog.current?.open)) (focusTargetId?document.getElementById(focusTargetId):heading.current)?.focus({preventScroll:!task}); }, [selected, selectionKey, phone, focusTargetId, task]);
  function back() { if (blocked) return; if (contextOpen) { setContextOpen(false); requestAnimationFrame(() => opener.current?.focus()); } else onBack?.(); }
  if (plain) return <>{children}</>;
  const content=<><header className="inspector-heading"><h2 ref={heading} tabIndex={-1}>{title}</h2>{(selected||contextOpen)&&(onBack||contextOpen)&&<Button disabled={blocked} onClick={back}>{backLabel??(arabic?'رجوع':'Back')}</Button>}</header>{inspector}</>;
  if(task)return <div className="workspace-task">{children}<section className="workspace-task-body">{content}</section></div>;
  if(modalOnPhone&&phone)return <div className="workspace-panes phone-dialog-panes"><div className="workspace-center">{<Button ref={opener} className="context-toggle" disabled={blocked} onClick={()=>setContextOpen(true)}>{contextLabel??(arabic?'التفاصيل والسياق':'Details & context')}</Button>}{children}</div><dialog ref={phoneDialog} className="workspace-detail-dialog" aria-label={title} onCancel={e=>{e.preventDefault();back();}}>{content}</dialog></div>;
  return <div className={`workspace-panes${selected || contextOpen ? ' pane-selected' : ''}`} onKeyDown={e => { if (e.key === 'Escape' && (selected || contextOpen) && !blocked) { e.preventDefault(); back(); } }}>
    <div className="workspace-center">{contextLabel && <Button ref={opener} className="context-toggle" disabled={blocked} onClick={() => { setContextOpen(true); requestAnimationFrame(() => heading.current?.focus()); }}>{contextLabel??(arabic?'التفاصيل والسياق':'Details & context')}</Button>}{children}</div>
    <aside className="workspace-inspector" aria-label={arabic ? 'التفاصيل والإجراءات السياقية' : 'Contextual details and actions'}>
      <header className="inspector-heading"><h2 ref={heading} tabIndex={-1}>{title}</h2>{(selected || contextOpen) && (onBack || contextOpen) && <Button disabled={blocked} onClick={back}>{backLabel ?? (arabic ? 'رجوع' : 'Back')}</Button>}</header>{inspector}
    </aside>
  </div>;
}
