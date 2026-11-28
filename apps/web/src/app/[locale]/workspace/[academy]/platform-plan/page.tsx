import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';
import PlatformCommerceWorkspace from '@/components/platform-commerce-workspace';

export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ locale: string; academy: string }> }) {
  await auth.protect();
  const { locale, academy } = await params;
  if (!uuidPattern.test(academy) || !['en', 'ar'].includes(locale)) notFound();
  return <PlatformCommerceWorkspace locale={locale} view="owner" academy={academy} />;
}
