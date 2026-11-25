import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ClassMediaWorkspace from '@/components/class-media-workspace';
import { localClassMediaEnabled, stagingClassMediaAcademy } from '@/lib/class-media-store';
import { uuidPattern } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; academy: string; event: string }> }) {
  const props = await params;
  const hosted = stagingClassMediaAcademy() === props.academy;
  if (!localClassMediaEnabled() && !hosted) notFound();
  await auth.protect();
  if (!['en', 'ar'].includes(props.locale) || !uuidPattern.test(props.academy) || !uuidPattern.test(props.event)) notFound();
  return <ClassMediaWorkspace {...props} chunkedUploads={hosted} />;
}
