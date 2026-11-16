import {NextRequest,NextResponse} from 'next/server';
import {localRuntime} from '@/lib/local-runtime';
export const dynamic='force-dynamic';
export function GET(request:NextRequest){
  const runtime=localRuntime(process.env,request.nextUrl.origin);
  return NextResponse.json(runtime??{error:'not_found'},{status:runtime?200:404,
    headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
