import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await auth.protect();
  const { locale } = await params;
  return (
    <main className="auth">
      <UserButton />
      <h1>
        {locale === "ar"
          ? "الوصول إلى الأكاديمية غير متاح بعد"
          : "Academy access is not available yet"}
      </h1>
      <p>
        {locale === "ar"
          ? "تم تسجيل الدخول. نظام العضويات قيد التطوير؛ لم يتم منح أي صلاحيات."
          : "You are signed in. Membership provisioning is still in development; no academy permissions have been granted."}
      </p>
    </main>
  );
}
