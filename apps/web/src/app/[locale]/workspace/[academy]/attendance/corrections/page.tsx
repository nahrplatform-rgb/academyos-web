import {auth}from'@clerk/nextjs/server';
import {notFound}from'next/navigation';
import CorrectionWorkspace from'@/components/correction-workspace';
import {uuidPattern}from'@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{locale:string;academy:string}>;searchParams:Promise<{event?:string;player?:string;request?:string}>}){
 await auth.protect();
 const p=await params,q=await searchParams;
 const valid=(value:unknown)=>typeof value==='string'&&uuidPattern.test(value);
 if(!valid(p.academy)||q.event!==undefined&&!valid(q.event)
   ||q.player!==undefined&&(!q.event||!valid(q.player))
   ||q.request!==undefined&&(!q.event||q.player!==undefined||!valid(q.request)))notFound();
 return <CorrectionWorkspace {...p} event={q.event?.toLowerCase()} player={q.player?.toLowerCase()} initialRequest={q.request?.toLowerCase()}/>;
}
