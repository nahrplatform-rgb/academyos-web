import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ProgramWorkspace from '@/components/program-workspace';
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
    return <ProgramWorkspace locale={locale} academy={academy}/>;
}
