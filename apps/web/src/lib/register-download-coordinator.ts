/** Inactive scoped read coordinator. The caller must already own current scope
 * and reviewed key custody. No product caller, polling, writes or authority cache. */
import type {LocalRegisterRepository} from './local-register-repository';
import {identifier, refuse} from './local-register-codec';
import {registerDownloadRequest, registerDownloadResult,
  type DownloadCommand, type DownloadManifest, type DownloadPage, type DownloadComplete} from './register-download';

export function registerDownloadCoordinator(repository: LocalRegisterRepository, academy: string,
  transport: (command: DownloadCommand, signal: AbortSignal) => Promise<unknown>, signal: AbortSignal) {
  identifier(academy);
  const running = new Map<string, Promise<{kind: 'prepared' | 'unchanged'; revision: string; verifiedAt: number}>>();
  async function read(command: DownloadCommand) {
    signal.throwIfAborted();
    registerDownloadRequest(command);
    const data = await transport(command, signal);
    signal.throwIfAborted(); // A completed network request cannot revive a departed scope.
    const result = await registerDownloadResult(data, academy, command.event);
    signal.throwIfAborted();
    if ('error' in result) refuse(`download_${result.error}`);
    if (result.kind !== command.action) refuse('download_response_kind');
    return result;
  }
  async function run(event: string) {
    signal.throwIfAborted();
    const checkpoint = await repository.transferCheckpoint(event);
    const basis = checkpoint ? null : await repository.transferBasis(event);
    const manifest = await read({action: 'manifest', academy, event,
      expected: checkpoint?.receipt.payload.revision ?? basis?.revision ?? null,
      after: checkpoint?.receipt.payload.cursor ?? null}) as DownloadManifest;
    // A changed in-progress source is reported to the caller with the old
    // coverage and staged work intact. Replacing it is an explicit later task.
    if (checkpoint && checkpoint.receipt.payload.revision !== manifest.revision) refuse('download_changed');
    if (!checkpoint && basis && manifest.unchanged) {
      signal.throwIfAborted();
      await repository.refreshUnchanged(event, manifest);
      signal.throwIfAborted();
      return {kind: 'unchanged' as const, revision: manifest.revision, verifiedAt: Date.parse(manifest.header.server_now)};
    }
    const transfer = checkpoint?.transfer ?? crypto.randomUUID();
    signal.throwIfAborted();
    if (checkpoint) await repository.refreshTransfer(event, transfer, manifest);
    else await repository.beginImport(event, transfer, manifest);
    let receipt = manifest.receipt;
    let pages = 0;
    while (receipt.payload.seen < receipt.payload.count) {
      if (++pages > 1000) refuse('download_progress_bound');
      const page = await read({action: 'page', academy, event, receipt}) as DownloadPage;
      if (page.receipt.payload.seen <= receipt.payload.seen) refuse('download_no_progress');
      signal.throwIfAborted();
      await repository.appendPage(event, transfer, receipt.payload.cursor, page.roster, page);
      receipt = page.receipt;
    }
    const complete = await read({action: 'complete', academy, event, receipt}) as DownloadComplete;
    signal.throwIfAborted();
    await repository.finalizeTransfer(event, transfer, complete, signal);
    signal.throwIfAborted();
    return {kind: 'prepared' as const, revision: complete.revision, verifiedAt: Date.parse(complete.header.server_now)};
  }
  function prepare(event: string) {
    identifier(event);
    const existing = running.get(event);
    if (existing) return existing;
    const task = run(event).finally(() => {if (running.get(event) === task) running.delete(event);});
    running.set(event, task);
    return task;
  }
  return {prepare};
}
