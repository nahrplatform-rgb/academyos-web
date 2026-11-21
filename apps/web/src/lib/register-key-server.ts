import 'server-only';
import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';
import {uuidPattern} from './onboarding';
import type {RecoveryTicket, RegisterScope} from './local-register-repository';

export class InvalidRegisterKeyRequest extends Error {}

export type RegisterKeyRequest = {
  academy: string; event: string; device: string; subject: string;
} & ({action: 'prepare'} | {action: 'recover'; namespace: string});

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ?
    value as Record<string, unknown> : null;
}

function uuid(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value) && value === value.toLowerCase();
}

export function registerKeyRequest(value: unknown): RegisterKeyRequest {
  const input = object(value);
  if (!input) throw new InvalidRegisterKeyRequest();
  const {action, academy, event, device, subject, namespace} = input;
  if (!uuid(academy) || !uuid(event) || !uuid(device) ||
      typeof subject !== 'string' || !/^user_[a-zA-Z0-9_]{1,120}$/.test(subject)) {
    throw new InvalidRegisterKeyRequest();
  }
  const fields = Object.keys(input).sort().join(',');
  if (action === 'prepare' && fields === 'academy,action,device,event,subject') {
    return {action, academy, event, device, subject};
  }
  if (action === 'recover' && fields === 'academy,action,device,event,namespace,subject' && uuid(namespace)) {
    return {action, academy, event, device, subject, namespace};
  }
  throw new InvalidRegisterKeyRequest();
}

export function registerWrappingKey() {
  const key = process.env.LOCAL_REGISTER_WRAP_KEY_V1;
  if (!key || !/^[a-f0-9]{64}$/.test(key) || key === process.env.ONBOARDING_PROOF_KEY) {
    throw new Error('Register key unavailable');
  }
  return Buffer.from(key, 'hex');
}

function scopeOf(input: RegisterKeyRequest, namespace: string): RegisterScope {
  return {environment: 'staging', subject: input.subject, academy: input.academy,
    device: input.device, epoch: 'fields_v1', capability: 'owner-register-v1', namespace};
}

function bindingOf(scope: RegisterScope) {
  return JSON.stringify([1, scope.environment, scope.subject, scope.academy,
    scope.device, scope.epoch, scope.capability, scope.namespace]);
}

const recoveryKeyId = 'register-recovery-v1';
function associatedData(input: RegisterKeyRequest, scope: RegisterScope) {
  return Buffer.from(JSON.stringify(['register-wrap-v1', bindingOf(scope), input.event]), 'utf8');
}

export function wrapRegisterKey(input: RegisterKeyRequest, namespace: string, root: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', root, iv);
  cipher.setAAD(associatedData(input, scopeOf(input, namespace)));
  const material = randomBytes(32);
  try {
    return Buffer.concat([iv, cipher.update(material), cipher.final(), cipher.getAuthTag()]).toString('base64url');
  } finally {
    material.fill(0);
  }
}

export function openRegisterKey(input: RegisterKeyRequest, reply: unknown, root: Buffer) {
  const result = object(reply);
  if (!result || Object.keys(result).sort().join(',') !== 'namespace,verified_at,wrapped' ||
      !uuid(result.namespace) || typeof result.wrapped !== 'string' || !/^[a-zA-Z0-9_-]{80}$/.test(result.wrapped) ||
      typeof result.verified_at !== 'number' || !Number.isSafeInteger(result.verified_at) || result.verified_at <= 0 ||
      (input.action === 'recover' && input.namespace !== result.namespace)) {
    throw new Error('Register key unavailable');
  }
  const scope = scopeOf(input, result.namespace);
  const bytes = Buffer.from(result.wrapped, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', root, bytes.subarray(0, 12));
  decipher.setAAD(associatedData(input, scope));
  decipher.setAuthTag(bytes.subarray(44));
  const material = decipher.update(bytes.subarray(12, 44));
  try {
    decipher.final();
    const ticket: RecoveryTicket = {binding: bindingOf(scope), keyId: recoveryKeyId, material: material.toString('base64'),
      verifiedAt: result.verified_at};
    return {scope, event: input.event, ticket};
  } finally {
    material.fill(0);
  }
}
