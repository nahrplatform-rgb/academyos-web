import assert from 'node:assert/strict';
import {test} from 'node:test';
import {localCaptureWindow} from './local-register-codec';

const server=Date.parse('2026-11-04T19:00:00Z');
const wall=server+3600000; // Device clock is one hour ahead at verification.
const clock={verifiedAt:server,verifiedWallAt:wall,observedWallAt:wall};
const header={starts_at:'2026-11-04T19:30:00Z',closes_at:'2026-11-05T20:30:00Z'};

test('prepared capture opens at the session start using elapsed time from verification',()=>{
  assert.deepEqual(localCaptureWindow(header,clock,wall),{state:'before',open:false,nextChangeAt:wall+1800000});
  assert.equal(localCaptureWindow(header,clock,wall+1799999).open,false);
  assert.equal(localCaptureWindow(header,clock,wall+1800000).open,true);
  assert.equal(localCaptureWindow(header,clock,wall+1800001).open,true);
});

test('capture closes after the inclusive deadline without a new download',()=>{
  const closes=Date.parse(header.closes_at)-server;
  assert.deepEqual(localCaptureWindow(header,clock,wall+closes),{state:'open',open:true,nextChangeAt:wall+closes+1});
  assert.deepEqual(localCaptureWindow(header,clock,wall+closes+1),{state:'closed',open:false,nextChangeAt:null});
});

test('missing or backwards device clock basis requires online verification',()=>{
  for(const invalid of [
    {...clock,verifiedAt:0}, {...clock,verifiedAt:NaN},
    {...clock,verifiedWallAt:undefined}, {...clock,observedWallAt:undefined},
    {...clock,observedWallAt:wall-1}, {...clock,observedWallAt:wall+1},
  ]) assert.throws(()=>localCaptureWindow(header,invalid,wall),/clock_verification_required/);
  assert.throws(()=>localCaptureWindow(header,clock,wall-1),/clock_verification_required/);
});
