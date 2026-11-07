import{auth}from'@clerk/nextjs/server';import{notFound}from'next/navigation';import SessionChangeWorkspace from'@/components/session-change-workspace';import{uuidPattern}from'@/lib/onboarding';
export const dynamic='force-dynamic';
function validDate(v:string){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!v.startsWith('0000')&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}
export default async function Page({params}:{params:Promise<{locale:string;academy:string;program:string;day:string}>}){await auth.protect();const p=await params;if(!uuidPattern.test(p.academy)||!uuidPattern.test(p.program)||!validDate(p.day))notFound();return <SessionChangeWorkspace {...p}/>;}
