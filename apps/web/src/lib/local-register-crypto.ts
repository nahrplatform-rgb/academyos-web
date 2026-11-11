/** Shared automatic-protection primitives. No storage, credentials or network. */
export type SealedRecord = {
  v: 1; scope: string; purpose: string; id: string;
  iv: Uint8Array<ArrayBuffer>; cipher: ArrayBuffer;
};
const encoder = new TextEncoder();
const aad = (scope: string, purpose: string, id: string) =>
  encoder.encode(JSON.stringify([1, scope, purpose, id]));

export async function newLocalKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
}

export function checkLocalKey(key: unknown): CryptoKey {
  if (!(key instanceof CryptoKey) || key.extractable || key.type !== 'secret' ||
      key.algorithm.name !== 'AES-GCM' || (key.algorithm as AesKeyAlgorithm).length !== 256 ||
      !key.usages.includes('decrypt')) throw new Error('local_key_missing_or_invalid');
  return key;
}

export async function seal(key: CryptoKey, scope: string, purpose: string, id: string,
  bytes: BufferSource): Promise<SealedRecord> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({name: 'AES-GCM', iv,
    additionalData: aad(scope, purpose, id), tagLength: 128}, key, bytes);
  return {v: 1, scope, purpose, id, iv, cipher};
}

export async function unseal(key: CryptoKey, scope: string, purpose: string, id: string,
  record: SealedRecord): Promise<ArrayBuffer> {
  if (!record || record.v !== 1 || record.scope !== scope || record.purpose !== purpose ||
      record.id !== id || !(record.iv instanceof Uint8Array) || record.iv.byteLength !== 12 ||
      !(record.cipher instanceof ArrayBuffer)) throw new Error('envelope_mismatch');
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: record.iv,
    additionalData: aad(scope, purpose, id), tagLength: 128}, key, record.cipher);
}

export type ProtectedOriginal = {payload: SealedRecord; wrapped: SealedRecord};
export async function protectOriginal(device: CryptoKey, recovery: CryptoKey, scope: string,
  id: string, bytes: BufferSource): Promise<ProtectedOriginal> {
  // Only this transient data key is exportable, to wrap it; raw bytes are never stored.
  const dataKey = await crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt', 'decrypt']);
  const payload = await seal(dataKey, scope, 'original', id, bytes);
  const wrapped = await crypto.subtle.wrapKey('raw', dataKey, recovery, 'AES-KW');
  return {payload, wrapped: await seal(device, scope, 'original-key', id, wrapped)};
}

export async function openOriginal(device: CryptoKey, recovery: CryptoKey, scope: string,
  id: string, record: ProtectedOriginal): Promise<ArrayBuffer> {
  const wrapped = await unseal(device, scope, 'original-key', id, record.wrapped);
  const dataKey = await crypto.subtle.unwrapKey('raw', wrapped, recovery, 'AES-KW',
    {name: 'AES-GCM', length: 256}, false, ['decrypt']);
  return unseal(dataKey, scope, 'original', id, record.payload);
}
