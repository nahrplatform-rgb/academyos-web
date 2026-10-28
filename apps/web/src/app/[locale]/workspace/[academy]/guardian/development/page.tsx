import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { uuidPattern } from '@/lib/onboarding';
import DevelopmentWorkspace from '@/components/development-workspace';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: {
    params: Promise<{
        locale: string;
        academy: string;
    }>;
}) { await auth.protect(); const p = await params; if (!uuidPattern.test(p.academy) || !['en', 'ar'].includes(p.locale))
    notFound(); return <DevelopmentWorkspace {...p} family/>; }
