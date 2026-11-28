import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import PlatformCommerceWorkspace from '@/components/platform-commerce-workspace';

export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await auth.protect();
  const { locale } = await params;
  if (!['en', 'ar'].includes(locale)) notFound();
  return <PlatformCommerceWorkspace locale={locale} view="platform" />;
}
