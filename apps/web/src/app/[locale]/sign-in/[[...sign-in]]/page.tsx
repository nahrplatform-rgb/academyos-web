import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { authenticationConfigured } from "@/lib/config";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main className="auth">
      <Link href={`/${locale}`}>← AcademyOS</Link>
      {authenticationConfigured(process.env) ? (
        <SignIn
          routing="path"
          path={`/${locale}/sign-in`}
          forceRedirectUrl={`/${locale}/workspace`}
        />
      ) : (
        <p>Sign-in is not configured yet.</p>
      )}
    </main>
  );
}
