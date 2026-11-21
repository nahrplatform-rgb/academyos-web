import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=data=>createHash('sha256').update(data).digest('hex');
const receipt=JSON.parse(await readFile(new URL('../../docs/07-handoff/evidence/device-unlock-probe-2026-11-03.json',import.meta.url),'utf8'));
if(receipt.htmlSha256!==hash(await readFile(new URL('../../design/device-unlock-probe/index.html',import.meta.url)))||receipt.harnessSha256!==hash(await readFile(new URL('./test_device_unlock_probe.mjs',import.meta.url))))throw new Error('Device diagnostic receipt is stale');
if(receipt.checks.some(c=>c.status!=='passed'))throw new Error('Diagnostic UI checks need review');
console.log('PASS device diagnostic source-specific receipt;physical/security gates remain separate');
