import test from "node:test";
import assert from "node:assert/strict";
import { invitationToken, tokenHash, signProof, verifiedEmails, onboardingKey, databaseError } from "./onboarding";
import { sealInvitation, openInvitation } from "./invitation-cookie";
const key = "a".repeat(64), id = "00000000-0000-4000-8000-000000000001";
test('invitation secrets are reproducible per generation, opaque and hashed at rest', () => {
  const token = invitationToken(id, 1, key); assert.match(token, /^[a-f0-9]{64}$/); assert.equal(token, invitationToken(id, 1, key)); assert.notEqual(token, invitationToken(id, 2, key)); assert.notEqual(tokenHash(token), token); assert.throws(() => onboardingKey({ APP_ENV: 'staging', ONBOARDING_PROOF_KEY: '' }));
});
test('only current verified addresses enter subject and target bound proof', () => {
  const emails = verifiedEmails({ emailAddresses: [{ emailAddress: 'OWNER@academy.example', verification: { status: 'verified' } }, { emailAddress: 'attacker@academy.example', verification: { status: 'unverified' } }] }); assert.deepEqual(emails, ['owner@academy.example']);
  const a = signProof('recipient', id, 'user_A', emails, key, 1); assert.notEqual(a.signature, signProof('recipient', id, 'user_B', emails, key, 1).signature); assert.notEqual(a.signature, signProof('recipient', id + 'x', 'user_A', emails, key, 1).signature); assert.throws(() => signProof('recipient', id, 'user_A', ['a\nb@example.com'], key));
});
test('invitation handoff cookie conceals secret, rejects tampering and expires', () => {
  const token = invitationToken(id, 1, key), cookie = sealInvitation(id, token, key, 100); assert.ok(!cookie.includes(token)); assert.deepEqual(openInvitation(cookie, key, 1000), { invitation: id, token }); assert.throws(() => openInvitation(cookie, key, 1000000)); assert.throws(() => openInvitation('x' + cookie.slice(1), key)); assert.throws(() => openInvitation(cookie, 'b'.repeat(64)));
});

test('business version conflicts remain conflicts across the HTTP boundary', () => {
  assert.equal(databaseError('PT409'), 'conflict');
  assert.equal(databaseError('23505'), 'conflict');
  assert.equal(databaseError('42501'), 'denied');
});
