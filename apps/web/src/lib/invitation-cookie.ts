import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { uuidPattern } from "./onboarding";
export function sealInvitation(invitation: string, token: string, key: string, now = Date.now()) {
  if (!uuidPattern.test(invitation) || !/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid invitation");
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ invitation, token, expires: now + 15 * 60 * 1000 })), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function openInvitation(value: string, key: string, now = Date.now()): { invitation: string; token: string } {
  if (value.length > 1024) throw new Error("Invalid invitation");
  const b = Buffer.from(value, "base64url"), decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), b.subarray(0, 12));
  decipher.setAuthTag(b.subarray(12, 28)); const result = JSON.parse(Buffer.concat([decipher.update(b.subarray(28)), decipher.final()]).toString());
  if (result.expires <= now || !uuidPattern.test(result.invitation) || !/^[a-f0-9]{64}$/.test(result.token)) throw new Error("Invalid invitation");
  return { invitation: result.invitation, token: result.token };
}
