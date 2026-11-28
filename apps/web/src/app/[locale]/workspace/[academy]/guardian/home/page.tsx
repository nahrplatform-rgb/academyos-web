import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ExperienceWorkspace from '@/components/experience-workspace';
import { uuidPattern } from '@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{locale:string;academy:string}>;searchParams:Promise<{link?:string|string[]}>}){
 await auth.protect();
 const [{locale,academy},{link}]=await Promise.all([params,searchParams]);
 if(!uuidPattern.test(academy)||(link!==undefined&&(typeof link!=='string'||!uuidPattern.test(link))))notFound();
 return <ExperienceWorkspace locale={locale} academy={academy} role="guardian" initialLink={link}/>;
}
