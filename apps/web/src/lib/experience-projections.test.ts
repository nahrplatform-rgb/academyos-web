import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceRequest } from './experience-projections';
const academy = '00000000-0000-4000-8000-000000000001', link = '00000000-0000-4000-8000-000000000002';
test('home/calendar selectors carry no role authority or writes', () => {
  for (const actor of ['owner','trainer','guardian']) for (const kind of ['home','calendar']) {
    const request = { action: `${actor}_${kind}`, academy, ...(actor==='guardian'?{link}:{}), ...(kind==='calendar'?{from:'2026-11-01',to:'2026-12-12'}:{}) };
    const parsed = experienceRequest(request);
    assert.equal(parsed.mutating, false); assert.equal(parsed.rpc, `x15_${actor}_${kind}_v1`);
    assert.throws(()=>experienceRequest({...request,role:'owner'}));
    assert.throws(()=>experienceRequest({...request,limit:5000}));
  }
});
test('calendar bounds are inclusive and cursors remain tied to their visible period', () => {
  const request = {action:'owner_calendar',academy,from:'2026-11-01',to:'2026-12-12'};
  const cursor = {at:'2026-11-04T17:00:00+00:00',id:link,day:'2026-11-04',from:request.from,to:request.to};
  assert.equal(experienceRequest({...request,cursor}).args.after_id, link);
  for (const bad of [{to:'2026-12-13'},{to:'2026-10-31'},{from:'2026-02-30'},{from:'0000-01-01'}, {cursor:{...cursor,from:'2026-10-01'}}, {cursor:{...cursor,id:academy,role:'trainer'}}, {cursor:{...cursor,day:'2026-02-30'}}, {cursor:{...cursor,at:'tomorrow'}}]) assert.throws(()=>experienceRequest({...request,...bad}));
  assert.throws(()=>experienceRequest({action:'guardian_home',academy}));
  assert.throws(()=>experienceRequest({action:'delete',academy}));
});

import {addCivilDays,monthGridStart,shiftMonth,sessionTime,isCivilDay} from './experience-format';
test('calendar civil periods and displayed times do not use the execution host zone',()=>{
 assert.equal(monthGridStart('2026-10-29'),'2026-09-27');assert.equal(addCivilDays('2026-12-31',1),'2027-01-01');assert.equal(shiftMonth('2026-01-31',1),'2026-02-01');
 assert.match(sessionTime('en','Africa/Cairo','2026-11-01T15:00:00Z','2026-11-01T16:00:00Z').time,/17:00.*18:00/);
 assert.notEqual(sessionTime('en','Africa/Cairo','2026-11-01T15:00:00Z','2026-11-01T16:00:00Z').time,sessionTime('en','UTC','2026-11-01T15:00:00Z','2026-11-01T16:00:00Z').time);
});

test('navigation civil hints reject overflow, arrays and invalid years',()=>{
 for(const day of ['2024-02-29','2026-11-01'])assert.equal(isCivilDay(day),true);
 for(const day of ['2026-02-30','2026-02-29','0000-01-01','2026-13-01','2026-11-01T12:00:00Z',['2026-11-01'],null,{}])assert.equal(isCivilDay(day),false);
});
