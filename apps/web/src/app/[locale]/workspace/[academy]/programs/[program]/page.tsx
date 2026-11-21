import{auth}from'@clerk/nextjs/server';import{notFound}from'next/navigation';import ProgramWorkspace from'@/components/program-workspace';import{uuidPattern}from'@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{locale:string;academy:string;program:string}>}){await auth.protect();const p=await params;if(!uuidPattern.test(p.academy)||!uuidPattern.test(p.program))notFound();return <ProgramWorkspace locale={p.locale} academy={p.academy} initialProgram={p.program}/>;}
