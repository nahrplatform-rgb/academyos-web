import {ClerkProvider} from '@clerk/nextjs';
import RegisterAccountBoundary from '@/components/register-account-boundary';
import {authenticationConfigured,offlineRegisterPilotEnabled,ownerWorkspaceEnabled} from '@/lib/config';
import { notFound } from "next/navigation";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!["en", "ar"].includes(locale)) notFound();
  const content = <div lang={locale} dir={locale==="ar"?"rtl":"ltr"}>{children}</div>;
  if (!authenticationConfigured(process.env)) return content;
  return <ClerkProvider appearance={{variables:{
    colorPrimary:"var(--primary)",colorPrimaryForeground:"var(--primary-ink)",
    colorBackground:"var(--surface)",colorForeground:"var(--ink)",
    colorInput:"var(--canvas)",colorInputForeground:"var(--ink)",colorMutedForeground:"var(--muted)",
    colorDanger:"var(--error)",borderRadius:"7px",
    fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Tahoma, sans-serif',fontSize:"15px",
  }}}>
    <RegisterAccountBoundary locale={locale} enabled={offlineRegisterPilotEnabled(process.env)} workspaceEnabled={ownerWorkspaceEnabled(process.env)}>{content}</RegisterAccountBoundary>
  </ClerkProvider>;
}
