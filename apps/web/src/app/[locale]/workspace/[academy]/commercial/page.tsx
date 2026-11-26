import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';
import AcademyOwnerCommercialWorkspace from '@/components/academy-owner-commercial-workspace';

export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ locale: string; academy: string }> }) {
  await auth.protect();
  const { locale, academy } = await params;
  if (!uuidPattern.test(academy) || !['en', 'ar'].includes(locale)) notFound();
  return <AcademyOwnerCommercialWorkspace locale={locale as 'en' | 'ar'} academy={academy} />;
}
