"use client";
import Link from "next/link";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { workspaceNavigation } from "./workspace-navigation";
import ThemeToggle from "./theme-toggle";
import { WorkspaceLayoutProvider, useWorkspaceLayout } from "./workspace-layout";
import { StatusBadge } from "./ui/controls";

type Module = 'training'|'attendance'|'people'|'development'|'family'|'operations';
type Role = 'owner'|'trainer'|'guardian'|'platform'|'workspace';
export type NavigationItem = { href: string; label: string; current?: boolean; group?: string; module?: Module };
type Props = { locale: string; context: string; title: string; homeHref: string; languageHref: string; navigation: NavigationItem[]; onNavigate?: ComponentProps<typeof Link>["onClick"]; account?: ReactNode; children: ReactNode; tools?: ReactNode; module?: Module; role?: Role };
function NavIcon({ href }: { href: string }) {
  const path = href.includes('attendance') || href.includes('register') ? 'M4 4h16v16H4z M7 12l3 3 7-7' : href.includes('program') || href.includes('schedule') || href.includes('calendar') ? 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4' : href.includes('players') || href.includes('guardian') || href.includes('staff') || href.includes('trainer') ? 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8' : href.includes('development') ? 'M20 4c-12-2-18 7-12 12s16-2 12-12 M5 21L17 9' : 'M3 10l9-7 9 7v11H3z M9 21v-8h6v8';
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}
/** Presentation metadata never resolves membership or grants authority. Links remain domain-owned. */
function WorkspaceShellContent({ locale, context, title, homeHref, languageHref, navigation, onNavigate, account, children, tools, module='operations', role='workspace' }: Props) {
  const {preferences,update,reset}=useWorkspaceLayout();
  const ar=locale==='ar',drawer=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null);
  const academy=navigation.map(item=>item.href.match(/^\/(?:en|ar)\/workspace\/([a-f0-9-]{36})(?:\/|$)/i)?.[1]).find(Boolean);
  const scopedRole=role==='owner'||role==='trainer'||role==='guardian'?role:null;
  const menu=academy&&scopedRole?workspaceNavigation(locale,academy,scopedRole,navigation):navigation.filter(item=>item.href!==`/${locale}/workspace`);
  const workspaceHome=academy&&scopedRole?`/${locale}/workspace/${academy}/${scopedRole==='owner'?'home':`${scopedRole}/home`}`:homeHref;
  const roleLabel=({owner:ar?'مالك الأكاديمية':'Academy Owner',trainer:ar?'مدرب':'Trainer',guardian:ar?'ولي أمر':'Guardian',platform:ar?'مالك المنصة':'Platform Owner',workspace:ar?'اختيار مساحة العمل':'Choose workspace'})[role];
  const switcher=<Link className="workspace-switch" href={`/${locale}/workspace`} onClick={e=>{onNavigate?.(e);if(!e.defaultPrevented)drawer.current?.close();}}>{ar?'تبديل مساحة العمل':'Switch workspace'}</Link>;
  function close(){drawer.current?.close();opener.current?.focus();}
  const links=(bottom=false)=><nav className={bottom?'workspace-bottom-nav':'workspace-navigation'} aria-label={ar?'التنقل في مساحة العمل':'Workspace navigation'}>{menu.map((item,i)=><div key={item.href} className="nav-entry" data-module={item.module}>{!bottom&&item.group&&menu[i-1]?.group!==item.group&&<p className="nav-group">{item.group}</p>}<Link href={item.href} onClick={e=>{onNavigate?.(e);if(!e.defaultPrevented)drawer.current?.close();}} aria-label={item.label} title={item.label} className={item.current?'selected':undefined} aria-current={item.current?'page':undefined}><NavIcon href={item.href}/><span>{item.label}</span></Link></div>)}</nav>;
  return <div className="app-scene" lang={locale} dir={ar?'rtl':'ltr'} data-module={module} data-workspace-role={role} data-navigation={preferences.compact?'compact':'expanded'}>
    <a className="skip-link" href="#main">{ar?'انتقل إلى المحتوى':'Skip to content'}</a>
    <div className="workspace-window">
      <header className="window-toolbar">
        <button type="button" ref={opener} className="navigation-toggle" aria-haspopup="dialog" onClick={()=>drawer.current?.showModal()}>{ar?'القائمة':'Menu'}</button>
        <Link onClick={onNavigate} className="brand" href={workspaceHome}><span className="mark" aria-hidden="true">A</span>AcademyOS</Link>
        <nav className="toolbar-context" aria-label={ar?'مسار التنقل':'Breadcrumb'}><Link onClick={onNavigate} href={workspaceHome} aria-label={ar?'رئيسية مساحة العمل':'Workspace home'}>{context}</Link><span aria-hidden="true"> / </span><strong aria-current="page">{title}</strong><span className="workspace-role">{roleLabel}</span></nav>
        <div className="toolbar-actions"><StatusBadge>{ar?'نسخة تجريبية':'Staging'}</StatusBadge><Link onClick={onNavigate} href={languageHref} hrefLang={ar?'en':'ar'}>{ar?'English':'العربية'}</Link><ThemeToggle arabic={ar}/><details className="layout-menu"><summary>{ar?'التخطيط':'Layout'}</summary><div><button className="layout-desktop-control" type="button" onClick={()=>update({compact:!preferences.compact})}>{preferences.compact?(ar?'توسيع التنقل':'Expand navigation'):(ar?'تصغير التنقل':'Compact navigation')}</button><button type="button" onClick={reset}>{ar?'إعادة ضبط التخطيط':'Reset layout'}</button></div></details>{tools}{account}</div>
      </header>
      <div className="shell"><aside className="workspace-sidebar"><div className="workspace-identity"><p className="sidebar-context">{context}</p><strong>{roleLabel}</strong>{switcher}</div>{links()}<p className="sidebar-note">{ar?'بيئة اختبار · بيانات اصطناعية فقط':'Staging · Synthetic data only'}</p></aside><div className="main"><main id="main">{children}</main></div></div>
      {(role==='trainer'||role==='guardian')&&links(true)}
      <dialog ref={drawer} className="workspace-drawer" aria-labelledby="workspace-navigation-title" onCancel={e=>{e.preventDefault();close();}}><header><h2 id="workspace-navigation-title">{ar?'مساحة العمل':'Workspace'}</h2><button type="button" onClick={close}>{ar?'إغلاق':'Close'}</button></header><div className="workspace-identity"><p>{context}</p><strong>{roleLabel}</strong>{switcher}</div>{links()}</dialog>
    </div>
  </div>;
}
export default function WorkspaceShell(props:Props){return <WorkspaceLayoutProvider><WorkspaceShellContent {...props}/></WorkspaceLayoutProvider>;}
export function PublicWorkspace({ locale, title, children }: { locale: string; title: string; children: ReactNode }) {
  return <WorkspaceShell locale={locale} title={title} context={locale==='ar'?'مساحة AcademyOS':'AcademyOS workspace'} homeHref={`/${locale}/workspace`} languageHref={`/${locale==='ar'?'en':'ar'}/workspace`} navigation={[{href:`/${locale}/workspace`,label:locale==='ar'?'مساحات العمل':'Your workspaces'}]}><section className="public-task">{children}</section></WorkspaceShell>;
}
