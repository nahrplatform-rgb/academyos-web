import 'server-only';
import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';
import {uuidPattern} from './onboarding';
import type {WorkspaceScope,WorkspaceTicket} from './local-workspace-codec';

export class InvalidWorkspaceKeyRequest extends Error {}
export type WorkspaceKeyRequest = {academy: string; device: string; subject: string} &
  ({action: 'prepare'} | {action: 'recover'; namespace: string});

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function uuid(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value) && value === value.toLowerCase();
}
export function workspaceKeyRequest(value: unknown): WorkspaceKeyRequest {
  const input = object(value);
  if (!input) throw new InvalidWorkspaceKeyRequest();
  const {action, academy, device, subject, namespace} = input;
  if (!uuid(academy) || !uuid(device) || typeof subject !== 'string' || !/^user_[a-zA-Z0-9_]{1,120}$/.test(subject)) {
    throw new InvalidWorkspaceKeyRequest();
  }
  const fields = Object.keys(input).sort().join(',');
  if (action === 'prepare' && fields === 'academy,action,device,subject') return {action, academy, device, subject};
  if (action === 'recover' && fields === 'academy,action,device,namespace,subject' && uuid(namespace)) {
    return {action, academy, device, subject, namespace};
  }
  throw new InvalidWorkspaceKeyRequest();
}
export function workspaceWrappingKey() {
  const key = process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1;
  if (!key || !/^[a-f0-9]{64}$/.test(key) || key === process.env.LOCAL_REGISTER_WRAP_KEY_V1 ||
      key === process.env.ONBOARDING_PROOF_KEY) throw new Error('Workspace key unavailable');
  return Buffer.from(key, 'hex');
}
function scopeOf(input: WorkspaceKeyRequest, namespace: string): WorkspaceScope {
  return {environment: 'staging', subject: input.subject, academy: input.academy, device: input.device,
    epoch: 1, capability: 'owner-workspace-v1', namespace};
}
function associatedData(scope: WorkspaceScope) {
  return Buffer.from(JSON.stringify(['owner-workspace-wrap-v1', scope.environment, scope.subject, scope.academy,
    scope.device, scope.epoch, scope.capability, scope.namespace]), 'utf8');
}
export function wrapWorkspaceKey(input: WorkspaceKeyRequest, namespace: string, root: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', root, iv);
  cipher.setAAD(associatedData(scopeOf(input, namespace)));
  const material = randomBytes(32);
  try {
    return Buffer.concat([iv, cipher.update(material), cipher.final(), cipher.getAuthTag()]).toString('base64url');
  } finally { material.fill(0); }
}
export function openWorkspaceKey(input: WorkspaceKeyRequest, reply: unknown, root: Buffer):
  {scope: WorkspaceScope; ticket: WorkspaceTicket} {
  const result = object(reply);
  if (!result || Object.keys(result).sort().join(',') !== 'capability,device,field_epoch,namespace,subject,verified_at,wrapped' ||
      result.subject !== input.subject || result.device !== input.device || result.capability !== 'owner-workspace-v1' ||
      result.field_epoch !== 1 || !uuid(result.namespace) ||
      (input.action === 'recover' && input.namespace !== result.namespace) ||
      typeof result.wrapped !== 'string' || !/^[a-zA-Z0-9_-]{80}$/.test(result.wrapped) ||
      typeof result.verified_at !== 'number' || !Number.isSafeInteger(result.verified_at) || result.verified_at <= 0) {
    throw new Error('Workspace key unavailable');
  }
  const scope = scopeOf(input, result.namespace);
  const bytes = Buffer.from(result.wrapped, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', root, bytes.subarray(0, 12));
  decipher.setAAD(associatedData(scope));
  decipher.setAuthTag(bytes.subarray(44));
  const material = decipher.update(bytes.subarray(12, 44));
  try {
    decipher.final();
    return {scope, ticket: {material: material.toString('base64'), verifiedAt: result.verified_at}};
  } finally { material.fill(0); }
}
