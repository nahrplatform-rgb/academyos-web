import {ownerWorkspaceEnabled} from '@/lib/config';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import PeopleWorkspace from '@/components/people-workspace';
import { uuidPattern } from '@/lib/onboarding';
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }: {
    params: Promise<{
        locale: string;
        academy: string;
    }>;
    searchParams: Promise<{ player?: string | string[] }>;
}) {
    await auth.protect();
    const { locale, academy } = await params;
    if (!uuidPattern.test(academy))
        notFound();
    const { player } = await searchParams;
    const initialPlayer = typeof player === 'string' && uuidPattern.test(player) ? player : undefined;
    return <PeopleWorkspace initialPlayer={initialPlayer} prepared={ownerWorkspaceEnabled(process.env)}
        privateProfiles={process.env.APP_ENV === 'staging' && process.env.PLAYER_PRIVATE_PROFILE_TRIAL === 'true'}
        lifecycleTrial={process.env.APP_ENV === 'staging' && process.env.PLAYER_PROFILE_LIFECYCLE_TRIAL === 'true'}
        nameCorrections={process.env.APP_ENV === 'staging' && process.env.PLAYER_NAME_CORRECTION_TRIAL === 'true'}
        locale={locale} academy={academy}/>;
}
