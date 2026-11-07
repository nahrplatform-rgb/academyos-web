import {auth}from'@clerk/nextjs/server';
import {notFound}from'next/navigation';
import CorrectionWorkspace from'@/components/correction-workspace';
import {uuidPattern}from'@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{locale:string;academy:string}>;searchParams:Promise<{event?:string;player?:string}>}){await auth.protect();const p=await params,q=await searchParams;if(!uuidPattern.test(p.academy)||q.event!==undefined&&!uuidPattern.test(q.event)||q.player!==undefined&&(!q.event||!uuidPattern.test(q.player)))notFound();return <CorrectionWorkspace {...p} event={q.event} player={q.player}/>;}
