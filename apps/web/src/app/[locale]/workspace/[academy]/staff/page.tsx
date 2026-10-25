import { auth } from '@clerk/nextjs/server';
import { authenticationConfigured } from '@/lib/config';
import TrainerWorkspace from '@/components/trainer-workspace';
import { notFound } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: {
    params: Promise<{
        locale: string;
        academy?: string;
    }>;
}) {
    await auth.protect();
    const p = await params;
    if (!authenticationConfigured(process.env)) return <main><h1>{p.locale === 'ar' ? 'الدعوات غير متاحة حالياً' : 'Invitations are currently unavailable'}</h1></main>;
    if ((p.academy && !uuidPattern.test(p.academy)))
        notFound();
    return <TrainerWorkspace {...p} mode='owner'/>;
}
