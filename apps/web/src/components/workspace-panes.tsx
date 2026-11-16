"use client";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from './ui/controls';
import {inspectorDefault,inspectorMax,inspectorMin,useWorkspaceLayout} from './workspace-layout';
import WorkspaceSeparator from './workspace-separator';
import WorkspacePanelIcon from './workspace-panel-icon';
/** Presentation only. Domain owns selection, data retrieval, dirty guards and recovery. */
export default function WorkspacePanes({ children, inspector, title, arabic, selected = false, onBack, blocked = false, plain = false, selectionKey, backLabel, contextLabel, modalOnPhone = true, task = false, focusTargetId, paneActions }: { children: ReactNode; inspector: ReactNode; title: string; arabic: boolean; selected?: boolean; onBack?: () => void; blocked?: boolean; plain?: boolean; selectionKey?: string; backLabel?: string; contextLabel?: string; modalOnPhone?: boolean; task?: boolean; focusTargetId?: string; paneActions?: ReactNode }) {
  const {preferences,update}=useWorkspaceLayout();
  const frame=useRef<HTMLDivElement>(null),inspectorId=useId();
  const [maximum,setMaximum]=useState(inspectorMax);
  const centerScroll=useRef(0);
  const centerRef=useCallback((node:HTMLDivElement|null)=>{if(node)node.scrollTop=centerScroll.current;},[]);

  const width=Math.min(preferences.inspectorWidth,maximum);
  const [contextOpen, setContextOpen] = useState(false);
  const phoneDialog = useRef<HTMLDialogElement>(null);
  const [phone, setPhone] = useState(false);
  useEffect(()=>{if(task||plain||!frame.current)return;const node=frame.current;const measure=()=>setMaximum(Math.max(inspectorMin,Math.min(inspectorMax,node.clientWidth-572)));const observer=new ResizeObserver(measure);observer.observe(node);measure();return()=>observer.disconnect();},[task,plain,phone]);
  useEffect(() => { if(!modalOnPhone)return; const media=window.matchMedia("(max-width: 1279px)");const update=()=>setPhone(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update); },[modalOnPhone]);
  useEffect(()=>{if(!task&&modalOnPhone&&phone&&(selected||contextOpen))phoneDialog.current?.showModal();else phoneDialog.current?.close();},[task,modalOnPhone,phone,selected,contextOpen]);
  const heading = useRef<HTMLHeadingElement>(null), opener = useRef<HTMLButtonElement>(null), reveal = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (selected && (task || phoneDialog.current?.open || (!phone && !preferences.detailsHidden))) (focusTargetId?document.getElementById(focusTargetId):heading.current)?.focus({preventScroll:!task}); }, [selected, selectionKey, phone, focusTargetId, task, preferences.detailsHidden]);
  useEffect(()=>{if(selected&&!task)update({detailsHidden:false});/* Selection reveals context; refresh alone never changes focus. */
  },[selected,selectionKey,task,update]);
  function back() { if (blocked) return; if (contextOpen) { setContextOpen(false); requestAnimationFrame(() => opener.current?.focus()); } else onBack?.(); }
  function toggleDetails() {
    const hidden=preferences.detailsHidden;
    update({detailsHidden:!hidden});
    requestAnimationFrame(()=>{
      if(hidden)heading.current?.focus({preventScroll:true});
      else reveal.current?.focus({preventScroll:true});
    });
  }
  if (plain) return <>{children}</>;
  const narrow=modalOnPhone&&phone;
  const hideLabel=arabic?'إخفاء التفاصيل':'Hide details';
  const showLabel=arabic?'إظهار التفاصيل':'Show details';
  const contextName=contextLabel??(arabic?'التفاصيل والسياق':'Details & context');
  const backAction=(selected||contextOpen)&&(onBack||contextOpen)&&<Button disabled={blocked} onClick={back}>{backLabel??(arabic?'رجوع':'Back')}</Button>;
  const titleHeading=<h2 ref={heading} tabIndex={-1}>{title}</h2>;
  if(task)return <div className="workspace-task">{children}<section className="workspace-task-body"><header className="inspector-heading">{titleHeading}{backAction}</header>{inspector}</section></div>;
  const center=<div className="workspace-center" ref={centerRef} onScroll={e=>{centerScroll.current=e.currentTarget.scrollTop;}}>
    {(paneActions||narrow)&&<div className="pane-controls">{paneActions}{narrow&&
      <Button type="button" ref={opener} className="context-toggle workspace-icon-button" disabled={blocked} aria-label={contextName} title={contextName} aria-haspopup="dialog" aria-controls={inspectorId} onClick={()=>setContextOpen(true)}>
        <WorkspacePanelIcon side="end" expanded={false} arabic={arabic}/>
      </Button>}</div>}
    <div className="workspace-content">{children}</div>
  </div>;
  if(narrow)return <div className="workspace-panes phone-dialog-panes">{center}<dialog ref={phoneDialog} id={inspectorId} className="workspace-detail-dialog" aria-label={title} onCancel={e=>{e.preventDefault();back();}}>
    <header className="inspector-heading">{titleHeading}{backAction}</header>{inspector}
  </dialog></div>;
  return <div ref={frame} style={{'--inspector-width':`${width}px`} as CSSProperties} data-details={preferences.detailsHidden?'hidden':'visible'} className={`workspace-panes${selected || contextOpen ? ' pane-selected' : ''}`} onKeyDown={e => { if (e.key === 'Escape' && (selected || contextOpen) && !blocked) { e.preventDefault(); back(); } }}>
    {center}
    <WorkspaceSeparator pane="inspector" label={arabic?'تغيير عرض التفاصيل':'Resize details'} controls={inspectorId} width={width} minimum={inspectorMin} initial={inspectorDefault} maximum={maximum} arabic={arabic} hidden={preferences.detailsHidden} onResize={inspectorWidth=>update({inspectorWidth})}/>
    {preferences.detailsHidden&&<div className="workspace-inspector-rail"><Button type="button" ref={reveal} className="workspace-icon-button" aria-expanded={false} aria-controls={inspectorId} aria-label={showLabel} title={showLabel} disabled={blocked} onClick={toggleDetails}>
      <WorkspacePanelIcon side="end" expanded={false} arabic={arabic}/>
    </Button></div>}
    <aside id={inspectorId} hidden={preferences.detailsHidden} className="workspace-inspector" aria-label={arabic ? 'التفاصيل والإجراءات السياقية' : 'Contextual details and actions'}>
      <header className="inspector-heading">{titleHeading}<div className="inspector-actions">{backAction}<Button type="button" className="workspace-icon-button" aria-expanded={true} aria-controls={inspectorId} aria-label={hideLabel} title={hideLabel} disabled={blocked} onClick={toggleDetails}>
        <WorkspacePanelIcon side="end" expanded arabic={arabic}/>
      </Button></div></header>{inspector}
    </aside>
  </div>;
}
