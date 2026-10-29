"use client";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from './ui/controls';
import {useWorkspaceLayout} from './workspace-layout';
/** Presentation only. Domain owns selection, data retrieval, dirty guards and recovery. */
export default function WorkspacePanes({ children, inspector, title, arabic, selected = false, onBack, blocked = false, plain = false, selectionKey, backLabel, contextLabel, modalOnPhone = true, task = false, focusTargetId }: { children: ReactNode; inspector: ReactNode; title: string; arabic: boolean; selected?: boolean; onBack?: () => void; blocked?: boolean; plain?: boolean; selectionKey?: string; backLabel?: string; contextLabel?: string; modalOnPhone?: boolean; task?: boolean; focusTargetId?: string }) {
  const {preferences,update}=useWorkspaceLayout();
  const frame=useRef<HTMLDivElement>(null),drag=useRef<{x:number;width:number}|null>(null),inspectorId=useId();
  const [maximum,setMaximum]=useState(480);
  const centerScroll=useRef(0);
  const centerRef=useCallback((node:HTMLDivElement|null)=>{if(node)node.scrollTop=centerScroll.current;},[]);

  const width=Math.min(preferences.inspectorWidth,maximum);
  const [contextOpen, setContextOpen] = useState(false);
  const phoneDialog = useRef<HTMLDialogElement>(null);
  const [phone, setPhone] = useState(false);
  useEffect(()=>{if(task||plain||!frame.current)return;const node=frame.current;const measure=()=>setMaximum(Math.max(280,Math.min(480,node.clientWidth-572)));const observer=new ResizeObserver(measure);observer.observe(node);measure();return()=>observer.disconnect();},[task,plain,phone]);
  useEffect(() => { if(!modalOnPhone)return; const media=window.matchMedia("(max-width: 1279px)");const update=()=>setPhone(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update); },[modalOnPhone]);
  useEffect(()=>{if(!task&&modalOnPhone&&phone&&(selected||contextOpen))phoneDialog.current?.showModal();else phoneDialog.current?.close();},[task,modalOnPhone,phone,selected,contextOpen]);
  const heading = useRef<HTMLHeadingElement>(null), opener = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (selected && (task || phoneDialog.current?.open || (!phone && !preferences.detailsHidden))) (focusTargetId?document.getElementById(focusTargetId):heading.current)?.focus({preventScroll:!task}); }, [selected, selectionKey, phone, focusTargetId, task, preferences.detailsHidden]);
  useEffect(()=>{if(selected&&!task)update({detailsHidden:false});/* Selection reveals context; refresh alone never changes focus. */
  },[selected,selectionKey,task,update]);
  function back() { if (blocked) return; if (contextOpen) { setContextOpen(false); requestAnimationFrame(() => opener.current?.focus()); } else onBack?.(); }
  if (plain) return <>{children}</>;
  const content=<><header className="inspector-heading"><h2 ref={heading} tabIndex={-1}>{title}</h2>{(selected||contextOpen)&&(onBack||contextOpen)&&<Button disabled={blocked} onClick={back}>{backLabel??(arabic?'رجوع':'Back')}</Button>}</header>{inspector}</>;
  if(task)return <div className="workspace-task">{children}<section className="workspace-task-body">{content}</section></div>;
  if(modalOnPhone&&phone)return <div className="workspace-panes phone-dialog-panes"><div className="workspace-center" ref={centerRef} onScroll={e=>{centerScroll.current=e.currentTarget.scrollTop;}}>{<Button ref={opener} className="context-toggle" disabled={blocked} onClick={()=>setContextOpen(true)}>{contextLabel??(arabic?'التفاصيل والسياق':'Details & context')}</Button>}{children}</div><dialog ref={phoneDialog} className="workspace-detail-dialog" aria-label={title} onCancel={e=>{e.preventDefault();back();}}>{content}</dialog></div>;
  return <div ref={frame} style={{'--inspector-width':`${width}px`} as CSSProperties} data-details={preferences.detailsHidden?'hidden':'visible'} className={`workspace-panes${selected || contextOpen ? ' pane-selected' : ''}`} onKeyDown={e => { if (e.key === 'Escape' && (selected || contextOpen) && !blocked) { e.preventDefault(); back(); } }}>
    <div className="workspace-center" ref={centerRef} onScroll={e=>{centerScroll.current=e.currentTarget.scrollTop;}}><Button className="inspector-toggle" onPointerDown={e=>{e.preventDefault();e.currentTarget.focus({preventScroll:true});}} disabled={blocked} aria-expanded={!preferences.detailsHidden} aria-controls={inspectorId} onClick={()=>{update({detailsHidden:!preferences.detailsHidden});if(preferences.detailsHidden)requestAnimationFrame(()=>heading.current?.focus());}}>{preferences.detailsHidden?(arabic?'إظهار التفاصيل':'Show details'):(arabic?'إخفاء التفاصيل':'Hide details')}</Button>{contextLabel && <Button ref={opener} className="context-toggle" disabled={blocked} onClick={() => { setContextOpen(true); requestAnimationFrame(() => heading.current?.focus()); }}>{contextLabel??(arabic?'التفاصيل والسياق':'Details & context')}</Button>}{children}</div>
    <div className="inspector-resizer" role="separator" tabIndex={preferences.detailsHidden?-1:0} aria-label={arabic?'تغيير عرض التفاصيل':'Resize details'} aria-orientation="vertical" aria-controls={inspectorId} aria-valuemin={280} aria-valuemax={maximum} aria-valuenow={width} onKeyDown={e=>{let next=width;const step=e.shiftKey?32:16;if(e.key==='Home')next=280;else if(e.key==='End')next=maximum;else if(e.key==='ArrowLeft')next+=arabic?-step:step;else if(e.key==='ArrowRight')next+=arabic?step:-step;else return;e.preventDefault();e.stopPropagation();update({inspectorWidth:Math.min(maximum,Math.max(280,next))});}} onPointerDown={e=>{drag.current={x:e.clientX,width};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag.current)return;const delta=(drag.current.x-e.clientX)*(arabic?-1:1);update({inspectorWidth:Math.min(maximum,Math.max(280,drag.current.width+delta))});}} onPointerUp={e=>{drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{drag.current=null;}}/>
    <aside id={inspectorId} hidden={preferences.detailsHidden} className="workspace-inspector" aria-label={arabic ? 'التفاصيل والإجراءات السياقية' : 'Contextual details and actions'}>
      <header className="inspector-heading"><h2 ref={heading} tabIndex={-1}>{title}</h2>{(selected || contextOpen) && (onBack || contextOpen) && <Button disabled={blocked} onClick={back}>{backLabel ?? (arabic ? 'رجوع' : 'Back')}</Button>}</header>{inspector}
    </aside>
  </div>;
}
