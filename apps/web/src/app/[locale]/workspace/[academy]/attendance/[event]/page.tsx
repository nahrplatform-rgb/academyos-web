import {auth} from '@clerk/nextjs/server';
import {notFound} from 'next/navigation';
import AttendanceWorkspace from '@/components/attendance-workspace';
import {uuidPattern} from '@/lib/onboarding';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{locale:string;academy:string;event:string}>}){await auth.protect();const p=await params;if(!uuidPattern.test(p.academy)||!uuidPattern.test(p.event))notFound();return <AttendanceWorkspace {...p}/>;}
