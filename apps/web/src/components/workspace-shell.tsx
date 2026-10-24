import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { StatusBadge } from "./ui/controls";

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
};

/** Presentation only: navigation never resolves membership or grants authority. */
export default function WorkspaceShell({ locale, context, title, homeHref, languageHref, navigation, onNavigate, account, children }: Props) {
  const ar = locale === "ar";
  return <div className="app-scene" lang={locale} dir={ar ? "rtl" : "ltr"}>
    <a className="skip-link" href="#main">{ar ? "انتقل إلى المحتوى" : "Skip to content"}</a>
    <div className="workspace-window">
      <header className="window-toolbar">
        <span className="toolbar-context">{context}<span aria-hidden="true"> / </span><strong>{title}</strong></span>
        <div className="toolbar-actions">
          <StatusBadge>{ar ? "نسخة تجريبية" : "Staging"}</StatusBadge>
          <Link onClick={onNavigate} href={languageHref} hrefLang={ar ? "en" : "ar"}>{ar ? "English" : "العربية"}</Link>
          {account}
        </div>
      </header>
      <div className="shell">
        <aside className="workspace-sidebar">
          <Link onClick={onNavigate} className="brand" href={homeHref}><span className="mark" aria-hidden="true">A</span>AcademyOS</Link>
          <p className="sidebar-context">{context}</p>
          <nav aria-label={ar ? "التنقل في مساحة العمل" : "Workspace navigation"}>
            {navigation.map(item => <Link key={item.href} onClick={onNavigate} href={item.href} className={item.current ? "selected" : undefined} aria-current={item.current ? "page" : undefined}>{item.label}</Link>)}
          </nav>
          <p className="sidebar-note">{ar ? "بيئة اختبار · بيانات اصطناعية فقط" : "Staging · Synthetic data only"}</p>
        </aside>
        <div className="main"><main id="main">{children}</main></div>
      </div>
    </div>
  </div>;
}
