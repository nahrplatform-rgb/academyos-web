import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { currentMemberships } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await auth.protect();
  const { locale } = await params;
  const ar = locale === "ar";
  const result = await currentMemberships();
  return (
    <main className="auth">
      <UserButton />
      {result.status === "unavailable" ? (
        <>
          <h1>
            {ar
              ? "تعذر التحقق من صلاحيات الأكاديمية"
              : "Academy access could not be checked"}
          </h1>
          <p>
            {ar
              ? "تم تسجيل الدخول، لكن اتصال العضويات غير متاح. حاول لاحقاً."
              : "You are signed in, but the membership service is unavailable. Please try again later."}
          </p>
        </>
      ) : result.memberships.length === 0 ? (
        <>
          <h1>
            {ar
              ? "لا توجد عضوية أكاديمية نشطة"
              : "No active academy membership"}
          </h1>
          <p>
            {ar
              ? "تم التحقق من حسابك. اطلب دعوة من مسؤول الأكاديمية."
              : "Your account is connected. Ask your academy administrator for an invitation."}
          </p>
        </>
      ) : (
        <>
          <h1>{ar ? "عضويات الأكاديمية" : "Your academy memberships"}</h1>
          <ul>
            {result.memberships.map((m) => (
              <li key={m.membership_id}>
                {m.academy_name} · {m.role}
              </li>
            ))}
          </ul>
          <p>
            {ar
              ? "العمليات الأكاديمية قيد التطوير."
              : "Academy operations are still in development."}
          </p>
        </>
      )}
    </main>
  );
}
