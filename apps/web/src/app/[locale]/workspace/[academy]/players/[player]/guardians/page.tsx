import GuardianWorkspace from '@/components/guardian-workspace';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: {
    params: Promise<{
        locale: string;
        academy?: string;
        player?: string;
    }>;
}) {
    await auth.protect();
    const p = await params;
    if ((p.academy && !uuidPattern.test(p.academy)) || (p.player && !uuidPattern.test(p.player)))
        notFound();
    return <GuardianWorkspace {...p} mode='owner'/>;
}
