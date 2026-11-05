import {NextRequest, NextResponse} from 'next/server';
import {STAGING_AUTH_ORIGINS} from '@/lib/config';
import {onboardingSession, rpc, JourneyError} from '@/lib/onboarding-server';
import {GatewayError} from '@/lib/onboarding-gateway';
import {rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis} from '@/lib/rate-limit';
import {WorkspaceDownloadInputError, workspaceDownloadRequest, workspaceScopeArguments} from '@/lib/workspace-download';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/** Closed transfer seam until the protected normal-workspace client is ready. */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const respond = (body: unknown, status = 200) => NextResponse.json(body,{status,headers:{
    'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
    'Server-Timing':`total;dur=${(performance.now()-start).toFixed(1)}`,
  }});
  try {
    if (process.env.APP_ENV !== 'staging' || req.method !== 'POST' ||
        req.headers.get('origin') !== req.nextUrl.origin || !STAGING_AUTH_ORIGINS.includes(req.nextUrl.origin) ||
        req.headers.get('content-type')?.split(';')[0] !== 'application/json') return respond({error:'denied'},403);
    if (process.env.OWNER_WORKSPACE_TRANSFER_ENABLED !== 'true') return respond({error:'unavailable'},503);
    if (Number(req.headers.get('content-length')) > 8192) return respond({error:'invalid'},413);
    const reader = req.body?.getReader();
    if (!reader) throw new WorkspaceDownloadInputError();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) {await reader.cancel(); return respond({error:'invalid'},413);}
      chunks.push(value);
    }
    const operation = workspaceDownloadRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    const scope = workspaceScopeArguments(req.headers);
    if (!scope) return respond({error:'invalid'},422);
    const {subject,client} = await onboardingSession();
    if (subject !== scope.expected_subject) return respond({error:'account_changed'},403);
    if (!rateLimitAllowed(await stagingLimiter(stagingRedis(),'onboarding-entry-read',60)
      .limit(rateLimitSubject(subject)))) return respond({error:'limited'},429);
    const data = await rpc(client,operation.rpc,{...operation.args,...scope});
    if (Buffer.byteLength(JSON.stringify({data}),'utf8') >= 32768) return respond({error:'unavailable'},503);
    return respond({data});
  } catch (e) {
    if (e instanceof JourneyError || e instanceof GatewayError) return respond({error:e.code},e.http);
    if (e instanceof WorkspaceDownloadInputError || e instanceof SyntaxError) return respond({error:'invalid'},422);
    return respond({error:'unavailable'},503);
  }
}
