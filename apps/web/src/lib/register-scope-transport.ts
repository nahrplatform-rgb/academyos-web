import {identifier} from './local-register-codec';
import type {RegisterScope} from './local-register-repository';

export function registerScopeHeaders(scope: Pick<RegisterScope, 'namespace' | 'device' | 'subject'>) {
  return {'x-academyos-register-namespace': scope.namespace,
    'x-academyos-register-device': scope.device, 'x-academyos-original-subject': scope.subject};
}

export function registerScopeArguments(headers: Headers) {
  const ns = headers.get('x-academyos-register-namespace'), device = headers.get('x-academyos-register-device');
  const expected_subject = headers.get('x-academyos-original-subject');
  if (!expected_subject || !/^user_[a-zA-Z0-9_]{1,120}$/.test(expected_subject)) return null;
  try {return {ns:identifier(ns), device:identifier(device), expected_subject};}
  catch {return null;}
}

export function registerWithdrawn(value: unknown) {
  return Boolean(value && typeof value === 'object' &&
    Object.keys(value).length === 1 && 'error' in value && value.error === 'withdrawn');
}
