import{auth}from'@clerk/nextjs/server';import{notFound}from'next/navigation';import QrWorkspace from'@/components/qr-workspace';
export default async function Page({params}:{params:Promise<{locale:string;academy:string}>}){await auth.protect();const p=await params;if(!/^[a-f0-9-]{36}$/i.test(p.academy))notFound();return <QrWorkspace {...p} view="settings"/>}
