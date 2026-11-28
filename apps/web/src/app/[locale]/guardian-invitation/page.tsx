import { authenticationConfigured } from '@/lib/config';
import GuardianWorkspace from '@/components/guardian-workspace';
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
    const p = await params;
    if (!authenticationConfigured(process.env)) return <main><h1>{p.locale === 'ar' ? 'الدعوات غير متاحة حالياً' : 'Invitations are currently unavailable'}</h1></main>;
    if ((p.academy && !uuidPattern.test(p.academy)) || (p.player && !uuidPattern.test(p.player)))
        notFound();
    return <GuardianWorkspace {...p} mode='invitation'/>;
}
