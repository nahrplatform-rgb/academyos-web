import {auth} from '@clerk/nextjs/server';
import {notFound} from 'next/navigation';
import AttendanceWorkspace from '@/components/attendance-workspace';
import {offlineRegisterPilotEnabled} from '@/lib/config';
import {uuidPattern} from '@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{locale:string;academy:string;event:string}>}){const verified=await auth.protect();const p=await params;if(!uuidPattern.test(p.academy)||!uuidPattern.test(p.event))notFound();return <AttendanceWorkspace {...p} deviceSubject={offlineRegisterPilotEnabled(process.env)?verified.userId:undefined}/>;}
