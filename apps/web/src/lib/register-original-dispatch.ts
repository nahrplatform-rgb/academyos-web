/** Owner register sender. The workspace owns the scope lifetime. */
import type {LocalRegisterRepository} from './local-register-repository';
import {registerScopeHeaders, registerWithdrawn} from './register-scope-transport';
import {identifier, refuse} from './local-register-codec';
import type {RegisterSessionCheck} from './register-session';

type DispatchResult = {kind: 'none' | 'confirmed' | 'unknown' | 'withdrawn' | 'scope_lost'} |
  {kind: 'needs_review'; refusal: 'conflict' | 'deadline' | 'denied'};

async function readReply(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader || Number(response.headers.get('content-length')) > 1024) {
    await reader?.cancel();
    refuse('invalid_dispatch_reply');
  }
  const bytes = new Uint8Array(1024);
  let size = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    if (size + value.byteLength > bytes.byteLength) {
      await reader.cancel();
      refuse('invalid_dispatch_reply');
    }
    bytes.set(value, size);
    size += value.byteLength;
  }
  const body: unknown = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes.subarray(0, size)));
  if (!body || typeof body !== 'object' || Array.isArray(body)) refuse('invalid_dispatch_reply');
  return body as Record<string, unknown>;
}

export function registerOriginalDispatch(repository: LocalRegisterRepository, scopeSignal: AbortSignal, beforeOnline?:RegisterSessionCheck) {
  const active = new Map<string, Promise<DispatchResult>>();
  async function run(event: string): Promise<DispatchResult> {
    await beforeOnline?.(false,scopeSignal);
    const dispatch = await repository.beginOriginalDispatch(event, scopeSignal);
    if (dispatch.kind !== 'send') return dispatch;
    const {attempt, scope, wire} = dispatch;
    scopeSignal.throwIfAborted();
    const send=async()=>{
      try {
      const response = await fetch('/api/register-dispatch', {
        method: 'POST', body: wire, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        headers: {'content-type': 'application/json', ...registerScopeHeaders(scope)},
        signal: AbortSignal.any([scopeSignal, AbortSignal.timeout(20000)]),
      });
      return {response,reply:await readReply(response)};
      } catch {
        scopeSignal.throwIfAborted();
        return null;
      }
    };
    let sent=await send();
    if(sent?.response.status===401&&sent.reply.error==='denied'&&beforeOnline){
      await beforeOnline(true,scopeSignal);
      sent=await send(); // Byte-identical original, at most one auth recovery attempt.
    }
    if(!sent)return {kind:'unknown'};
    const {response,reply}=sent;
    scopeSignal.throwIfAborted();
    if (response.status === 410 && registerWithdrawn(reply)) {
      await repository.finishOriginalDispatch(attempt,{refusal:'denied'},scopeSignal);
      return {kind: 'withdrawn'};
    }
    if(response.status===401&&Object.keys(reply).length===1&&reply.error==='denied') refuse('authentication_required');
    if (Object.keys(reply).length===1&&response.status===403&&reply.error==='account_changed') return {kind:'scope_lost'};
    const data = reply.data;
    if (response.status === 200 && Object.keys(reply).length === 1 && data && typeof data === 'object') {
      const refusal = Object.keys(data).length === 1 && 'error' in data ? data.error : null;
      if (refusal === 'stale' || refusal === 'conflict' || refusal === 'window_closed') {
        const reason = refusal === 'window_closed' ? 'deadline' : 'conflict';
        await repository.finishOriginalDispatch(attempt, {refusal: reason}, scopeSignal);
        return {kind: 'needs_review', refusal: reason};
      }
      try {
        await repository.finishOriginalDispatch(attempt, {receipt: data}, scopeSignal);
      } catch (error) {
        if (error instanceof Error && error.message === 'receipt_mismatch') return {kind: 'unknown'};
        throw error;
      }
      return {kind: 'confirmed'};
    }
    if (response.status === 403 && Object.keys(reply).length === 1 && reply.error === 'denied') {
      await repository.finishOriginalDispatch(attempt, {refusal: 'denied'}, scopeSignal);
      return {kind: 'needs_review', refusal: 'denied'};
    }
    return {kind: 'unknown'};
  }
  return function dispatch(event: string) {
    identifier(event);
    const existing = active.get(event);
    if (existing) return existing;
    const task = run(event).finally(() => active.delete(event));
    active.set(event, task);
    return task;
  };
}
