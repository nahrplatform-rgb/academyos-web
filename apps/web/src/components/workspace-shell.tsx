import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { StatusBadge } from "./ui/controls";

function NavIcon({ href }: { href: string }) {
  const path = href.includes('players') ? 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' : href.includes('staff') || href.includes('trainer') ? 'M4 7h16v14H4z M8 7V3h8v4 M4 12h16' : href.includes('platform') ? 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5' : 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z';
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}
type NavigationItem = { href: string; label: string; current?: boolean };
type Props = {
  locale: string;
  context: string;
  title: string;
  homeHref: string;
  languageHref: string;
  navigation: NavigationItem[];
  onNavigate?: ComponentProps<typeof Link>["onClick"];
  account?: ReactNode;
  children: ReactNode;
  tools?: ReactNode;
};

/** Presentation only: navigation never resolves membership or grants authority. */
export default function WorkspaceShell({ locale, context, title, homeHref, languageHref, navigation, onNavigate, account, children, tools }: Props) {
  const ar = locale === "ar";
  return <div className="app-scene" lang={locale} dir={ar ? "rtl" : "ltr"}>
    <a className="skip-link" href="#main">{ar ? "انتقل إلى المحتوى" : "Skip to content"}</a>
    <div className="workspace-window">
      <header className="window-toolbar">
        <span className="toolbar-context">{context}<span aria-hidden="true"> / </span><strong>{title}</strong></span>
        <div className="toolbar-actions">
          <StatusBadge>{ar ? "نسخة تجريبية" : "Staging"}</StatusBadge>
          <Link onClick={onNavigate} href={languageHref} hrefLang={ar ? "en" : "ar"}>{ar ? "English" : "العربية"}</Link>
          {tools}
          {account}
        </div>
      </header>
      <div className="shell">
        <aside className="workspace-sidebar">
          <Link onClick={onNavigate} className="brand" href={homeHref}><span className="mark" aria-hidden="true">A</span>AcademyOS</Link>
          <p className="sidebar-context">{context}</p>
          <nav aria-label={ar ? "التنقل في مساحة العمل" : "Workspace navigation"}>
            {navigation.map(item => <Link key={item.href} onClick={onNavigate} href={item.href} aria-label={item.label} title={item.label} className={item.current ? "selected" : undefined} aria-current={item.current ? "page" : undefined}><NavIcon href={item.href}/><span>{item.label}</span></Link>)}
          </nav>
          <p className="sidebar-note">{ar ? "بيئة اختبار · بيانات اصطناعية فقط" : "Staging · Synthetic data only"}</p>
        </aside>
        <div className="main"><main id="main">{children}</main></div>
      </div>
    </div>
  </div>;
}

/** Public geometry only; never renders a cached academy, branch or person. */
export function PublicWorkspace({ locale, title, children }: { locale: string; title: string; children: ReactNode }) {
  return <WorkspaceShell locale={locale} title={title} context={locale === 'ar' ? 'مساحة AcademyOS' : 'AcademyOS workspace'} homeHref={`/${locale}/workspace`} languageHref={`/${locale === 'ar' ? 'en' : 'ar'}/workspace`} navigation={[{href:`/${locale}/workspace`,label:locale === 'ar' ? 'مساحات العمل' : 'Your workspaces'}]}><section className="public-task">{children}</section></WorkspaceShell>;
}
