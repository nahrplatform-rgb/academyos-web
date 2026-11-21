import assert from 'node:assert/strict';
import {test} from 'node:test';
import {decodePeopleViewContext} from './people-view-context';

const id='33333333-3333-4333-8333-333333333333';
const safe={search:'  أحمد Smith  ',selection:id,position:{generation:id,page:3,offset:12}};
test('a navigation hint preserves only the bounded query, identity and local position',()=>{
  assert.deepEqual(decodePeopleViewContext(JSON.stringify(safe)),safe);
  assert.deepEqual(decodePeopleViewContext(JSON.stringify({...safe,selection:null,position:null})),
    {...safe,selection:null,position:null});
});
test('malformed or expanded hints cannot restore private records or operation state',()=>{
  for(const value of [null,[],{...safe,contact:'private@example.invalid'},{...safe,operation:id},
    {...safe,selection:'other-record'},{...safe,search:'x'.repeat(161)},
    {...safe,position:{...safe.position,extra:'payload'}},{...safe,position:{...safe.position,offset:50}},
    {...safe,position:{...safe.position,page:-1}},{...safe,position:{...safe.position,generation:'invalid'}}]){
    assert.equal(decodePeopleViewContext(JSON.stringify(value)),null);
  }
  assert.equal(decodePeopleViewContext('{'),null);
  assert.equal(decodePeopleViewContext(' '.repeat(1025)),null);
});
