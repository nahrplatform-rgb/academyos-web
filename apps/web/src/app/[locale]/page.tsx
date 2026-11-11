import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { authenticationConfigured } from "@/lib/config";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const ready = authenticationConfigured(process.env);
  const modules = ar
    ? [
        "الأكاديمية والأعضاء",
        "الجداول والحضور",
        "الشؤون المالية",
        "التقييمات والتواصل",
      ]
    : [
        "Academy & people",
        "Scheduling & attendance",
        "Finance & billing",
        "Evaluations & communication",
      ];
  return (
    <WorkspaceShell locale={locale} context={ar ? "مساحة الأكاديمية" : "Academy workspace"}
      title={ar ? "البداية" : "Overview"} homeHref={`/${locale}`} languageHref={ar ? "/en" : "/ar"}
      navigation={[{ href: `/${locale}`, label: ar ? "البداية" : "Overview", current: true }]}>
          <p className="eyebrow">
            {ar ? "مرحباً بك في أكاديمي أو إس" : "WELCOME TO ACADEMYOS"}
          </p>
          <h1>
            {ar ? "أكاديميتك، في مكان واحد." : "Your academy, connected."}
          </h1>
          <p className="intro">
            {ar
              ? "مساحة واضحة لإدارة الأشخاص والتدريب والعمليات اليومية."
              : "A considered workspace for your people, training, and everyday operations."}
          </p>
          <section className="welcome">
            <div className="symbol" aria-hidden="true">
              ↗
            </div>
            <div>
              <h2>{ar ? "ابدأ بحسابك" : "Start with your account"}</h2>
              <p>
                {ar
                  ? "سجّل الدخول للمتابعة. يتم منح صلاحيات الأكاديمية بعد التحقق من العضوية."
                  : "Sign in to continue. Academy access is granted through a verified membership."}
              </p>
              {ready ? (
                <Link className="button" href={`/${locale}/sign-in`}>
                  {ar ? "تسجيل الدخول" : "Sign in"}
                  <span aria-hidden="true"> →</span>
                </Link>
              ) : (
                <p className="notice">
                  {ar
                    ? "تسجيل الدخول غير متاح حالياً. إعداد الخدمة لم يكتمل بعد."
                    : "Sign-in is not available yet. Service setup is still in progress."}
                </p>
              )}
            </div>
          </section>
          <div className="section-heading">
            <h2>
              {ar
                ? "ما الذي يجمعه أكاديمي أو إس؟"
                : "A home for every part of your academy"}
            </h2>
            <span>{ar ? "قيد التطوير" : "In development"}</span>
          </div>
          <div className="grid">
            {modules.map((name, i) => (
              <article key={name}>
                <span className="module-number">0{i + 1}</span>
                <h3>{name}</h3>
                <p>
                  {ar
                    ? "مخطط للتنفيذ · غير متاح بعد"
                    : "Planned · Not available yet"}
                </p>
              </article>
            ))}
          </div>
          <footer>
            {ar
              ? "هذه نسخة تأسيسية. لم تتم إضافة أكاديميات أو سجلات حقيقية."
              : "Foundation preview. No real academies or operational records have been added."}
          </footer>
    </WorkspaceShell>
  );
}
