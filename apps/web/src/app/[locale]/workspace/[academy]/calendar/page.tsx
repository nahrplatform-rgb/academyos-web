import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ExperienceWorkspace from '@/components/experience-workspace';
import { isCivilDay } from '@/lib/experience-format';
import { uuidPattern } from '@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{locale:string;academy:string}>;searchParams:Promise<{anchor?:string|string[]}>}){
 await auth.protect();const {locale,academy}=await params;if(!uuidPattern.test(academy))notFound();
 const {anchor}=await searchParams;
 return <ExperienceWorkspace locale={locale} academy={academy} role="owner" calendar anchor={isCivilDay(anchor)?anchor:undefined}/>;
}
