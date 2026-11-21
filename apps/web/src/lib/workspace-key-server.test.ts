import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDecipheriv} from 'node:crypto';
import {spawnSync} from 'node:child_process';

if (!process.env.WORKSPACE_KEY_TEST_CHILD) {
  test('workspace key server tests under the server condition', () => {
    const env: NodeJS.ProcessEnv = {...process.env, WORKSPACE_KEY_TEST_CHILD:'1'};
    delete env.NODE_TEST_CONTEXT;
    const child = spawnSync(process.execPath, ['--conditions=react-server', '--import', 'tsx', '--test', __filename],
      {env, encoding:'utf8'});
    assert.equal(child.status, 0, child.stdout + child.stderr);
    assert.match(child.stdout, /wraps a 256-bit key/);
  });
} else {
// The server-only marker requires a separate process with the React server condition.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {openWorkspaceKey, workspaceKeyRequest, workspaceWrappingKey, wrapWorkspaceKey} = require('./workspace-key-server') as typeof import('./workspace-key-server');

const input = {action:'prepare' as const, subject:'user_abc', academy:'11111111-1111-4111-8111-111111111111', device:'22222222-2222-4222-8222-222222222222'};
const ns = '33333333-3333-4333-8333-333333333333';
const root = Buffer.alloc(32, 7);
function reply(wrapped: string) {
  return {subject:input.subject, device:input.device, namespace:ns, capability:'owner-workspace-v1', field_epoch:1, wrapped, verified_at:1234};
}
test('wraps a 256-bit key in a scoped AES-GCM envelope and releases it', () => {
  const wrapped = wrapWorkspaceKey(input,ns,root);
  assert.match(wrapped,/^[A-Za-z0-9_-]{80}$/);
  const value = openWorkspaceKey(input,reply(wrapped),root);
  const bytes = Buffer.from(wrapped,'base64url');
  const decipher = createDecipheriv('aes-256-gcm',root,bytes.subarray(0,12));
  decipher.setAAD(Buffer.from(JSON.stringify(['owner-workspace-wrap-v1','staging',input.subject,input.academy,input.device,1,'owner-workspace-v1',ns])));
  decipher.setAuthTag(bytes.subarray(44));
  assert.equal(Buffer.concat([decipher.update(bytes.subarray(12,44)),decipher.final()]).toString('base64'),value.ticket.material);
  assert.equal(Buffer.from(value.ticket.material,'base64').length,32);
  assert.deepEqual(value.scope,{environment:'staging',subject:input.subject,academy:input.academy,device:input.device,epoch:1,capability:'owner-workspace-v1',namespace:ns});
  assert.equal(value.ticket.verifiedAt,1234);
  assert.notEqual(wrapWorkspaceKey(input,ns,root),wrapped);
});
test('rejects swaps, wrong scope, root, and malformed database responses', () => {
  const wrapped = wrapWorkspaceKey(input,ns,root);
  assert.throws(() => openWorkspaceKey({...input,academy:'44444444-4444-4444-8444-444444444444'},reply(wrapped),root));
  assert.throws(() => openWorkspaceKey(input,reply(wrapped),Buffer.alloc(32,8)));
  assert.throws(() => openWorkspaceKey({...input,action:'recover',namespace:'44444444-4444-4444-8444-444444444444'},reply(wrapped),root));
  for (const bad of [{subject:'user_other'}, {device:'other'}, {namespace:'44444444-4444-4444-8444-444444444444'},
    {capability:'owner-register-v1'}, {field_epoch:2}, {verified_at:0}, {wrapped:'x'}, {extra:1}]) {
    assert.throws(() => openWorkspaceKey(input,{...reply(wrapped),...bad},root));
  }
  const altered = Buffer.from(wrapped,'base64url'); altered[15] ^= 1;
  assert.throws(() => openWorkspaceKey(input,reply(altered.toString('base64url')),root));
});
test('validates requests and independent root configuration', () => {
  assert.deepEqual(workspaceKeyRequest(input),input);
  assert.throws(() => workspaceKeyRequest({...input,namespace:ns}));
  assert.throws(() => workspaceKeyRequest({...input,subject:'user_bad!'}));
  assert.throws(() => workspaceKeyRequest({...input,device:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'.toUpperCase()}));
  const names = ['LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1','LOCAL_REGISTER_WRAP_KEY_V1','ONBOARDING_PROOF_KEY'] as const;
  const before = names.map(name => process.env[name]);
  try {
    process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1 = '07'.repeat(32);
    process.env.LOCAL_REGISTER_WRAP_KEY_V1 = '08'.repeat(32);
    process.env.ONBOARDING_PROOF_KEY = '09'.repeat(32);
    assert.deepEqual(workspaceWrappingKey(),root);
    process.env.LOCAL_REGISTER_WRAP_KEY_V1 = process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1;
    assert.throws(workspaceWrappingKey);
    process.env.LOCAL_REGISTER_WRAP_KEY_V1 = '08'.repeat(32);
    process.env.ONBOARDING_PROOF_KEY = process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1;
    assert.throws(workspaceWrappingKey);
    process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1 = 'bad';
    assert.throws(workspaceWrappingKey);
  } finally { names.forEach((name,i) => { if (before[i] === undefined) delete process.env[name]; else process.env[name] = before[i]; }); }
});

}
