"use client";
import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { workspaceNavigation } from "./workspace-navigation";
import ThemeToggle from "./theme-toggle";
import { WorkspaceLayoutProvider, navigationMin, navigationMax, useWorkspaceLayout } from "./workspace-layout";
import WorkspaceSeparator from "./workspace-separator";
import { RegisterAccountControl } from "./register-account-context";
import WorkspacePanelIcon from "./workspace-panel-icon";

type Module = 'training'|'attendance'|'people'|'development'|'family'|'operations';
type Role = 'owner'|'trainer'|'guardian'|'platform'|'workspace';
export type NavigationItem = { href: string; label: string; current?: boolean; group?: string; module?: Module };
type Props = { locale: string; context: string; title: string; homeHref: string; languageHref: string; navigation: NavigationItem[]; onNavigate?: ComponentProps<typeof Link>["onClick"]; account?: ReactNode; children: ReactNode; tools?: ReactNode; module?: Module; role?: Role; toolbarMinHeight?: number; scopeLabel?: string; guardianLink?: string; prefetch?: false };
function NavIcon({ href }: { href: string }) {
  const path = href.includes('attendance') || href.includes('register') ? 'M4 4h16v16H4z M7 12l3 3 7-7' : href.includes('program') || href.includes('schedule') || href.includes('calendar') ? 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4' : href.includes('players') || href.includes('guardian') || href.includes('staff') || href.includes('trainer') ? 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8' : href.includes('development') ? 'M20 4c-12-2-18 7-12 12s16-2 12-12 M5 21L17 9' : 'M3 10l9-7 9 7v11H3z M9 21v-8h6v8';
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}
function subscribeConnection(listener:()=>void) {
  window.addEventListener('online',listener);
  window.addEventListener('offline',listener);
  return ()=>{
    window.removeEventListener('online',listener);
    window.removeEventListener('offline',listener);
  };
}
function WorkspaceConnection({arabic,children}:{arabic:boolean;children?:ReactNode}) {
  const online=useSyncExternalStore(subscribeConnection,()=>navigator.onLine,()=>null);
  const label=online===null?(arabic?'الاتصال':'Connection'):online?(arabic?'متصل':'Online'):(arabic?'غير متصل':'Offline');
  return <div className="workspace-connection">
    <span className="workspace-connection-basic" data-connection={online===null?'checking':online?'online':'offline'} aria-live="polite">{label}</span>
    <div className="workspace-connection-tools">{children}</div>
  </div>;
}
/** Presentation metadata never resolves membership or grants authority. Links remain domain-owned. */
function WorkspaceShellContent({ locale, context, title, homeHref, languageHref, navigation, onNavigate, account, children, tools, module='operations', role='workspace', toolbarMinHeight=0, scopeLabel, guardianLink, prefetch }: Props) {
  const {preferences,update,reset}=useWorkspaceLayout();
  const navigationId = useId();
  const drawerId = useId();
  const shell=useRef<HTMLDivElement>(null);
  const dock=useRef<HTMLDivElement>(null);
  const [drawerOpen,setDrawerOpen]=useState(false);
  useEffect(()=>{
    const root=shell.current;if(!root)return;
    const openMenus=()=>root.querySelectorAll<HTMLDetailsElement>('details.layout-menu[open]');
    const outside=(event:Event)=>{if(!(event.target instanceof Node))return;for(const menu of openMenus())if(!menu.contains(event.target))menu.open=false;};
    const escape=(event:KeyboardEvent)=>{
      if(event.key!=='Escape')return;
      const menus=[...openMenus()];if(!menus.length)return;
      event.preventDefault();event.stopPropagation();
      menus.forEach(menu=>menu.open=false);
      menus.at(-1)?.querySelector('summary')?.focus({preventScroll:true});
    };
    root.addEventListener('pointerdown',outside,true);root.addEventListener('focusin',outside,true);root.addEventListener('keydown',escape,true);
    return()=>{root.removeEventListener('pointerdown',outside,true);root.removeEventListener('focusin',outside,true);root.removeEventListener('keydown',escape,true);};
  },[]);
  useLayoutEffect(()=>{
    const root=shell.current,footer=dock.current;
    if(!root||!footer)return;
    // Reserve the footer on the first layout so returning tasks can restore their full scroll range.
    const measure=()=>root.style.setProperty('--workspace-dock-size',`${footer.offsetHeight}px`);
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(footer);
    return ()=>observer.disconnect();
  },[]);
  const ar=locale==='ar',drawer=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null);
  const academy=navigation.map(item=>item.href.match(/^\/(?:en|ar)\/workspace\/([a-f0-9-]{36})(?:\/|$)/i)?.[1]).find(Boolean);
  const scopedRole=role==='owner'||role==='trainer'||role==='guardian'?role:null;
  const menu=academy&&scopedRole?workspaceNavigation(locale,academy,scopedRole,navigation,guardianLink):navigation.filter(item=>item.href!==`/${locale}/workspace`);
  const defaultHome=academy&&scopedRole?`/${locale}/workspace/${academy}/${scopedRole==='owner'?'home':`${scopedRole}/home`}`:homeHref;
  const workspaceHome=scopedRole==='guardian'?menu.find(item=>item.href.split('?')[0]===defaultHome)?.href??defaultHome:defaultHome;
  const roleLabel=({owner:ar?'مالك الأكاديمية':'Academy Owner',trainer:ar?'مدرب':'Trainer',guardian:ar?'ولي أمر':'Guardian',platform:ar?'مالك المنصة':'Platform Owner',workspace:ar?'اختيار مساحة العمل':'Choose workspace'})[role];
  const switcher=<Link prefetch={prefetch} className="workspace-switch" href={`/${locale}/workspace`} onClick={e=>{onNavigate?.(e);if(!e.defaultPrevented)drawer.current?.close();}}>{ar?'تبديل مساحة العمل':'Switch workspace'}</Link>;
  const homeLabel=ar?'رئيسية مساحة العمل':'Workspace home';
  const brand=<Link prefetch={prefetch} onClick={onNavigate} className="brand" href={workspaceHome} aria-label={homeLabel}><span className="mark" aria-hidden="true">A</span><span>AcademyOS</span></Link>;
  const identity=<div className="workspace-identity"><p className="sidebar-context">{context}</p><strong>{roleLabel}</strong>{scopeLabel&&<span className="workspace-scope">{scopeLabel}</span>}{switcher}</div>;
  const environment=ar?'بيئة اختبار · بيانات اصطناعية فقط':'Staging · Synthetic data only';
  const navLabel=preferences.navigationHidden?(ar?'إظهار التنقل':'Show navigation'):(ar?'إخفاء التنقل':'Hide navigation');
  const layoutLabel=ar?'التخطيط':'Layout';
  const language=ar?'English':'العربية';
  const phoneRole=role==='trainer'||role==='guardian';
  useEffect(()=>{
    const media=window.matchMedia('(min-width: 1280px)');
    const resize=()=>{if(media.matches)drawer.current?.close();};
    media.addEventListener('change',resize);
    return ()=>media.removeEventListener('change',resize);
  },[]);
  function close(){drawer.current?.close();opener.current?.focus();}
  const links=(bottom=false)=><nav className={bottom?'workspace-bottom-nav':'workspace-navigation'} aria-label={ar?'التنقل في مساحة العمل':'Workspace navigation'}>{menu.map((item,i)=><div key={item.href} className="nav-entry" data-module={item.module}>{!bottom&&item.group&&menu[i-1]?.group!==item.group&&<p className="nav-group">{item.group}</p>}<Link prefetch={prefetch} href={item.href} onClick={e=>{onNavigate?.(e);if(!e.defaultPrevented)drawer.current?.close();}} aria-label={item.label} title={item.label} className={item.current?'selected':undefined} aria-current={item.current?'page':undefined}><NavIcon href={item.href}/><span>{item.label}</span></Link></div>)}</nav>;
  const utilities=<div className="workspace-utilities">
    <WorkspaceConnection arabic={ar}>{tools}</WorkspaceConnection>
    <div className="workspace-utility-actions">
      <Link className="workspace-icon-button" prefetch={prefetch} onClick={e=>{onNavigate?.(e);if(!e.defaultPrevented)drawer.current?.close();}} href={languageHref} hrefLang={ar?'en':'ar'} aria-label={language} title={language}><span aria-hidden="true">{ar?'EN':'ع'}</span></Link>
      <ThemeToggle arabic={ar}/>
      <details className="layout-menu">
        <summary className="workspace-icon-button" aria-label={layoutLabel} title={layoutLabel}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16M8 5v4m8 1v4m-6 1v4"/></svg></summary>
        <div><button className="layout-desktop-control" type="button" onClick={()=>update({compact:!preferences.compact,navigationHidden:false})}>{preferences.compact?(ar?'توسيع التنقل':'Expand navigation'):(ar?'تصغير التنقل':'Compact navigation')}</button><button type="button" onClick={reset}>{ar?'إعادة ضبط التخطيط':'Reset layout'}</button></div>
      </details>
      {account&&<RegisterAccountControl locale={locale}>{account}</RegisterAccountControl>}
    </div>
  </div>;
  return <div ref={shell} className="app-scene" lang={locale} dir={ar?'rtl':'ltr'} data-module={module} data-workspace-role={role} data-navigation={preferences.navigationHidden?'closed':preferences.compact?'compact':'expanded'} style={{'--navigation-width':`${preferences.navigationWidth}px`} as CSSProperties}>
    <a className="skip-link" href="#main">{ar?'انتقل إلى المحتوى':'Skip to content'}</a>
    <div className="workspace-window">
      <header className="window-toolbar" style={{minHeight:toolbarMinHeight>0?toolbarMinHeight:undefined}}>
        <button type="button" ref={opener} className="navigation-toggle workspace-icon-button" aria-haspopup="dialog" aria-controls={drawerId} aria-expanded={drawerOpen} aria-label={ar?'القائمة':'Menu'} onClick={()=>{drawer.current?.showModal();setDrawerOpen(true);}}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        {brand}
      </header>
      <div className="shell">
        <aside className="workspace-sidebar">
          <div className="workspace-sidebar-head">{brand}<button type="button" className="workspace-icon-button desktop-navigation-toggle" aria-label={navLabel} title={navLabel} aria-controls={navigationId} aria-expanded={!preferences.navigationHidden} onClick={()=>update({navigationHidden:!preferences.navigationHidden})}>
            <WorkspacePanelIcon side="start" expanded={!preferences.navigationHidden} arabic={ar}/>
          </button></div>
          <div className="workspace-nav-body" id={navigationId} hidden={preferences.navigationHidden}>{identity}{links()}</div>
          <div ref={dock} className="workspace-dock">
            {phoneRole&&links(true)}
            {utilities}
            <p className="sidebar-note">{environment}</p>
          </div>
        </aside>
        <WorkspaceSeparator pane="navigation" label={ar?'تغيير عرض التنقل':'Resize navigation'} controls={navigationId} width={preferences.navigationWidth} minimum={navigationMin} maximum={navigationMax} arabic={ar} hidden={preferences.compact||preferences.navigationHidden} onResize={navigationWidth=>update({navigationWidth})}/>
        <div className="main"><main id="main" aria-label={title}>{children}</main></div>
      </div>
      <dialog ref={drawer} id={drawerId} className="workspace-drawer" aria-labelledby={`${drawerId}-title`} onClose={()=>setDrawerOpen(false)} onCancel={e=>{e.preventDefault();close();}}>
        <header><h2 id={`${drawerId}-title`}>{ar?'مساحة العمل':'Workspace'}</h2><button type="button" onClick={close}>{ar?'إغلاق':'Close'}</button></header>
        <div className="workspace-drawer-body">{identity}{links()}</div>
        <p className="sidebar-note">{environment}</p>
      </dialog>
    </div>
  </div>;
}
export default function WorkspaceShell(props:Props){return <WorkspaceLayoutProvider><WorkspaceShellContent {...props}/></WorkspaceLayoutProvider>;}
export function PublicWorkspace({ locale, title, children }: { locale: string; title: string; children: ReactNode }) {
  return <WorkspaceShell locale={locale} title={title} context={locale==='ar'?'مساحة AcademyOS':'AcademyOS workspace'} homeHref={`/${locale}/workspace`} languageHref={`/${locale==='ar'?'en':'ar'}/workspace`} navigation={[{href:`/${locale}/workspace`,label:locale==='ar'?'مساحات العمل':'Your workspaces'}]}><section className="public-task">{children}</section></WorkspaceShell>;
}
