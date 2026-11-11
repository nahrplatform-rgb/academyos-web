import assert from 'node:assert/strict';
import test from 'node:test';
import {formatCount,formatQuantity} from './experience-format';

test('count labels preserve zero, singular and representative Arabic quantity forms',()=>{
 assert.equal(formatQuantity('en',0,'player'),'0 players');
 assert.equal(formatQuantity('en',1,'change'),'1 change');
 assert.equal(formatQuantity('en',18,'session'),'18 sessions');
 const examples=new Map([
  [0,'لا يوجد لاعبون'],[1,'لاعب واحد'],[2,'لاعبان'],[3,'٣ لاعبين'],[10,'١٠ لاعبين'],
  [11,'١١ لاعبًا'],[18,'١٨ لاعبًا'],[100,'١٠٠ لاعب'],[102,'١٠٢ لاعب'],
 ]);
 for(const [count,label]of examples)assert.equal(formatQuantity('ar',count,'player'),label);
 assert.equal(formatQuantity('ar',18,'change'),'١٨ تغييرًا');
 assert.equal(formatQuantity('ar',3,'session'),'٣ تدريبات');
 assert.equal(formatCount('ar',1250),'١٬٢٥٠');
});

test('unknown or invalid counts cannot be presented as a known zero',()=>{
 for(const count of [NaN,Infinity,-1,1.5]){
  assert.equal(formatQuantity('en',count,'session'),'Unavailable');
  assert.equal(formatCount('ar',count),'غير متاح');
 }
});
