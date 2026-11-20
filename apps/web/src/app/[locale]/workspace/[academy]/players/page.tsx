import {ownerWorkspaceEnabled} from '@/lib/config';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import PeopleWorkspace from '@/components/people-workspace';
import { uuidPattern } from '@/lib/onboarding';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: {
    params: Promise<{
        locale: string;
        academy: string;
    }>;
}) {
    await auth.protect();
    const { locale, academy } = await params;
    if (!uuidPattern.test(academy))
        notFound();
    return <PeopleWorkspace prepared={ownerWorkspaceEnabled(process.env)}
        privateProfiles={process.env.APP_ENV === 'staging' && process.env.PLAYER_PRIVATE_PROFILE_TRIAL === 'true'}
        locale={locale} academy={academy}/>;
}
