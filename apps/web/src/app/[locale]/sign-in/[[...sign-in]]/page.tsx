import { SignIn } from "@clerk/nextjs";
import WorkspaceShell from "@/components/workspace-shell";
import { authenticationConfigured } from "@/lib/config";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <WorkspaceShell locale={locale} context={locale === "ar" ? "حساب AcademyOS" : "AcademyOS account"}
      title={locale === "ar" ? "تسجيل الدخول" : "Sign in"} homeHref={`/${locale}`}
      languageHref={`/${locale === "ar" ? "en" : "ar"}/sign-in`}
      navigation={[{ href: `/${locale}`, label: locale === "ar" ? "البداية" : "Overview" }]}>
      <section className="auth">
      {authenticationConfigured(process.env) ? (
        <SignIn
          routing="path"
          path={`/${locale}/sign-in`}
          forceRedirectUrl={`/${locale}/workspace`}
        />
      ) : (
        <p className="notice">{locale === "ar" ? "تسجيل الدخول غير متاح حالياً." : "Sign-in is not configured yet."}</p>
      )}
      </section>
    </WorkspaceShell>
  );
}
