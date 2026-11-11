import{auth}from'@clerk/nextjs/server';import{notFound}from'next/navigation';import PublicationWorkspace from'@/components/publication-workspace';import{uuidPattern}from'@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{locale:string;academy:string;}>}){await auth.protect();const p=await params;if(!uuidPattern.test(p.academy))notFound();return <PublicationWorkspace {...p} mode="trainer"/>;}
