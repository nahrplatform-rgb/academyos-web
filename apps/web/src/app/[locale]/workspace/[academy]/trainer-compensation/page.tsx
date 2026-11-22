import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';
import TrainerCompensationWorkspace from '@/components/trainer-compensation-workspace';

export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ locale: string; academy: string }> }) {
  await auth.protect();
  const props = await params;
  if (!uuidPattern.test(props.academy) || !['en', 'ar'].includes(props.locale)) notFound();
  return <TrainerCompensationWorkspace {...props} />;
}
