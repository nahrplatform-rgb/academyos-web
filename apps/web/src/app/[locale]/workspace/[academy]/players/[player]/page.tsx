import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';

export default async function PlayerProfileLink({ params }: {
    params: Promise<{ locale: string; academy: string; player: string }>;
}) {
    await auth.protect();
    const { locale, academy, player } = await params;
    if (!uuidPattern.test(academy) || !uuidPattern.test(player)) notFound();
    redirect(`/${locale}/workspace/${academy}/players?player=${player}`);
}
