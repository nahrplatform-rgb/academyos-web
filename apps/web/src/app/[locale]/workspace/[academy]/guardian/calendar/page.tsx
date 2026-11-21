import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ExperienceWorkspace from '@/components/experience-workspace';
import { uuidPattern } from '@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{locale:string;academy:string}>}){
 await auth.protect();const {locale,academy}=await params;if(!uuidPattern.test(academy))notFound();
 return <ExperienceWorkspace locale={locale} academy={academy} role="guardian" calendar/>;
}
