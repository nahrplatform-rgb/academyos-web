import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ locale: string; academy: string }> }) {
  await auth.protect();
  const { locale, academy } = await params;
  if (!uuidPattern.test(academy) || !['en', 'ar'].includes(locale)) notFound();
  redirect(`/${locale}/workspace/${academy}/platform-plan`);
}
