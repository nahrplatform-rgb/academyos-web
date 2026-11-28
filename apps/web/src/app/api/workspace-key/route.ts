import {randomUUID} from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';
import {STAGING_AUTH_ORIGINS} from '@/lib/config';
import {onboardingSession, rpc, JourneyError} from '@/lib/onboarding-server';
import {GatewayError} from '@/lib/onboarding-gateway';
import {InvalidWorkspaceKeyRequest, openWorkspaceKey, workspaceKeyRequest, workspaceWrappingKey, wrapWorkspaceKey} from '@/lib/workspace-key-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

/** Closed until protected workspace custody and activation are configured. */
export async function POST(req: NextRequest) {
  const respond = (body: unknown, status = 200) => NextResponse.json(body, {status,
    headers: {'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'}});
  try {
    if (process.env.APP_ENV !== 'staging' || req.method !== 'POST' || !STAGING_AUTH_ORIGINS.includes(req.nextUrl.origin) ||
        req.headers.get('origin') !== req.nextUrl.origin ||
        req.headers.get('content-type')?.split(';')[0] !== 'application/json') return respond({error:'denied'},403);
    if (process.env.LOCAL_OWNER_WORKSPACE_KEY_ENABLED !== 'true') return respond({error:'unavailable'},503);
    if (Number(req.headers.get('content-length')) > 512) return respond({error:'invalid'},413);
    const reader = req.body?.getReader();
    if (!reader) throw new InvalidWorkspaceKeyRequest();
    const bytes = new Uint8Array(512);
    let size = 0;
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      if (size + value.byteLength > bytes.length) { await reader.cancel(); return respond({error:'invalid'},413); }
      bytes.set(value, size);
      size += value.byteLength;
    }
    let decoded: string;
    try { decoded = new TextDecoder('utf-8', {fatal:true}).decode(bytes.subarray(0,size)); }
    catch { throw new InvalidWorkspaceKeyRequest(); }
    const command = workspaceKeyRequest(JSON.parse(decoded));
    const {subject, client} = await onboardingSession();
    if (command.subject !== subject) return respond({error:'denied'},403);
    const root = workspaceWrappingKey();
    try {
      const namespace = command.action === 'prepare' ? randomUUID() : command.namespace;
      const result = await rpc(client, 'x21_workspace_key_v1', {
        a: command.academy, device: command.device, expected_subject: subject, act: command.action, ns: namespace,
        envelope: command.action === 'prepare' ? wrapWorkspaceKey(command,namespace,root) : null,
      });
      return respond({data:openWorkspaceKey(command,result,root)});
    } finally { root.fill(0); }
  } catch (error) {
    if (error instanceof JourneyError || error instanceof GatewayError) return respond({error:error.code},error.http);
    if (error instanceof InvalidWorkspaceKeyRequest || error instanceof SyntaxError) return respond({error:'invalid'},422);
    return respond({error:'unavailable'},503);
  }
}
