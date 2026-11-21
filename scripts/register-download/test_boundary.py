"""EX-04 actual disposable PG17 only. No hosted schema or account changes."""
import hashlib
import json
import runpy
import time
import unittest
import uuid
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'attendance-register/test_boundary.py'))
Base,ROOT=m['RegisterBoundary'],m['ROOT']
MIGRATION='supabase/migrations/20261103165604_owner_register_download_contract.sql'
def literal(v):return "'"+str(v).replace("'","''")+"'"
class DownloadBoundary(Base):
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/MIGRATION).read_text())
 def download(self,a,ev,act='manifest',previous=None,expected=None,after=None,who='user_owner',ok=True):
  args=[literal(a),literal(ev),literal(act),'null'if previous is None else literal(json.dumps(previous))+'::jsonb',
   'null'if expected is None else literal(expected),'null'if after is None else literal(after)]
  result=self.sql('select public.x17_register_download_v1('+','.join(args)+')',who,ok=ok)
  return json.loads(result)if ok else result
 def transfer(self,a,ev,who='user_owner'):
  head=self.download(a,ev,who=who);receipt=head['receipt'];rows=[];pages=[]
  while receipt['payload']['seen']<head['header']['count']:
   page=self.download(a,ev,'page',receipt,who=who);rows+=page['roster']['players'];pages.append(page);receipt=page['receipt']
  final=self.download(a,ev,'complete',receipt,who=who)
  return head,pages,final,rows
 def scale(self,size=1000,wide=False):
  a,b,ev,x,y=self.pair()
  self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}',repeat('界',{160 if wide else 40}),'download '||n from generate_series(1,{size-2})n;insert into academy.publication_rosters select '{ev}',id,display_name from academy.players p where academy_id='{a}'and not exists(select 1 from academy.publication_rosters r where r.event_id='{ev}'and r.player_id=p.id);update academy.publication_events set roster_count={size},capacity={size} where id='{ev}'")
  return a,b,ev
 def test_download_01_manifest_pages_completion_and_unchanged(self):
  a,b,ev,x,y=self.pair();head,pages,final,rows=self.transfer(a,ev)
  self.assertEqual(len(rows),2);self.assertEqual(len(pages),1);self.assertEqual(final['revision'],head['revision']);self.assertEqual(final['receipt']['payload']['phase'],'complete');self.assertTrue(final['header']['owner'])
  self.assertTrue(self.download(a,ev,expected=final['revision'])['unchanged']);self.assertEqual(self.sql(f"select count(*)from academy.attendance_operations where event_id='{ev}'"),'0')
  self.download(a,ev,'page',final['receipt'],ok=False)
 def test_download_02_roles_tenants_revocation_and_caller_proof(self):
  a,b,ev,x,y=self.pair();head=self.download(a,ev)
  for who in ['user_trainer','user_platform','user_guardian','user_unknown','user_other_owner']:
   self.download(a,ev,who=who,ok=False);self.download(a,ev,'page',head['receipt'],who=who,ok=False)
  aa,bb=self.academy('user_other_owner');self.download(aa,ev,who='user_other_owner',ok=False)
  for role in ['manager','player']:
   self.sql(f"update academy.memberships set role='{role}'where academy_id='{a}'and identity_id=(select id from academy.identities where clerk_subject='user_owner')");self.download(a,ev,ok=False);self.download(a,ev,'page',head['receipt'],ok=False);self.sql(f"update academy.memberships set role='owner'where academy_id='{a}'and identity_id=(select id from academy.identities where clerk_subject='user_owner')")
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='owner'")
  self.download(a,ev,ok=False);self.download(a,ev,'page',head['receipt'],ok=False)
  self.assertEqual(self.sql("select has_function_privilege('anon','public.x17_register_download_v1(uuid,uuid,text,jsonb,text,uuid)','execute')"),'f')
  self.assertEqual(self.sql("select has_function_privilege('authenticated','academy.x17_scan(uuid,academy.publication_events)','execute')"),'f')
  self.sql(f"begin;set local role authenticated;select public.x17_register_download_v1('{a}','{ev}','manifest');commit",ok=False)
 def test_download_03_receipt_tampering_early_completion_and_wrong_context(self):
  a,b,ev,x,y=self.pair();head=self.download(a,ev);self.download(a,ev,'complete',head['receipt'],ok=False)
  for field,value in [('seen',2),('count',0),('cursor',x),('revision','0'*64),('a',str(uuid.uuid4())),('issued',0)]:
   altered=json.loads(json.dumps(head['receipt']));altered['payload'][field]=value;self.download(a,ev,'page',altered,ok=False)
  self.download(a,ev,'page',{**head['receipt'],'extra':True},ok=False)
  aa,bb,ee,xx,yy=self.pair();self.download(aa,ee,'page',head['receipt'],ok=False)
 def test_download_04_change_before_and_after_page_blocks_completion(self):
  for after in [False,True]:
   a,b,ev,x,y=self.pair();head=self.download(a,ev);receipt=head['receipt']
   if after:receipt=self.download(a,ev,'page',receipt)['receipt']
   self.mark(a,ev,x)
   if after:self.assertEqual(self.download(a,ev,'complete',receipt),{'error':'changed'})
   else:self.assertEqual(self.download(a,ev,'page',receipt),{'error':'changed'})
   self.assertFalse(self.download(a,ev,expected=head['revision'])['unchanged'])
 def test_download_05_same_count_correction_and_withdrawal(self):
  a,b,ev,x,y=self.pair();self.mark(a,ev,x);head=self.download(a,ev);page=self.download(a,ev,'page',head['receipt']);self.mark(a,ev,x,'user_owner',version=1,status='absent',reason='Synthetic download correction')
  self.assertEqual(self.download(a,ev,'complete',page['receipt']),{'error':'changed'})
  a,b,ev,x,y=self.pair();head=self.download(a,ev);self.sql(f"delete from academy.publication_heads where event_id='{ev}'")
  self.download(a,ev,'page',head['receipt'],ok=False)
 def test_download_06_expired_resume_reissues_checked_prefix(self):
  a,b,ev=self.scale(60);head=self.download(a,ev);page=self.download(a,ev,'page',head['receipt']);p=page['receipt']['payload'];self.assertEqual(p['seen'],50)
  # Test-only administrator signs an honestly expired receipt; no server wait/clock mutation.
  expired=json.loads(json.dumps(page['receipt']));expired['payload']['issued']-=601
  expired=json.loads(self.sql(f"select academy.x17_receipt('user_owner',{literal(json.dumps(expired['payload']))}::jsonb)"))
  self.assertEqual(self.download(a,ev,'page',expired),{'error':'expired'})
  resume=self.download(a,ev,expected=head['revision'],after=p['cursor']);self.assertEqual(resume['receipt']['payload']['acc'],p['acc']);self.assertEqual(resume['receipt']['payload']['seen'],50)
  last=self.download(a,ev,'page',resume['receipt']);self.assertEqual(len(last['roster']['players']),10);self.assertEqual(self.download(a,ev,'complete',last['receipt'])['kind'],'complete')
  self.download(a,ev,expected=head['revision'],after=str(uuid.uuid4()),ok=False)
 def test_download_07_empty_and_1000_unicode_bounds(self):
  a,b,ev,x,y=self.pair();self.sql(f"delete from academy.publication_rosters where event_id='{ev}';update academy.publication_events set roster_count=0 where id='{ev}'")
  h,p,f,r=self.transfer(a,ev);self.assertEqual(p,[]);self.assertEqual(r,[]);self.assertEqual(f['header']['count'],0)
  a,b,ev=self.scale();h,p,f,r=self.transfer(a,ev);self.assertEqual(len(r),1000);self.assertEqual(len(set(x['id']for x in r)),1000);self.assertEqual(len(p),20)
  for page in p:self.assertLess(len(json.dumps(page,ensure_ascii=False).encode()),32768);self.assertLessEqual(len(page['roster']['players']),50)
 def test_download_08_header_whitelist_and_hash_determinism(self):
  a,b,ev,x,y=self.pair();self.sql(f"update academy.publication_events set projection=projection||'{{\"internal_note\":\"Never transfer\"}}'::jsonb where id='{ev}'")
  head=self.download(a,ev);self.assertEqual(set(head['header']['projection']),{'name','branch','timezone','sport','sport_ar'})
  self.assertNotIn('Never transfer',json.dumps(head));self.assertEqual(self.download(a,ev)['revision'],head['revision'])
 def test_download_09_concurrency_completion_observed_order(self):
  a,b,ev,x,y=self.pair();head=self.download(a,ev);page=self.download(a,ev,'page',head['receipt'])
  finish=self.caller('user_owner','/rpc/x17_register_download_v1')+f"select public.x17_register_download_v1('{a}','{ev}','complete',{literal(json.dumps(page['receipt']))})"
  mark=self.caller('user_trainer','/rpc/a10_mark_v1')+f"select public.a10_mark_v1('{a}','{ev}','{x}','present',0,null,clock_timestamp(),'{uuid.uuid4()}')"
  self.observed_order(mark,finish)
  self.assertEqual(self.download(a,ev,'complete',page['receipt']),{'error':'changed'})
 def test_download_10_byte_trim_and_utf8_vectors(self):
  a,b,ev=self.scale(60,wide=True);head,pages,final,rows=self.transfer(a,ev)
  self.assertEqual(len(rows),60);self.assertGreater(len(pages),1);self.assertLess(len(pages[0]['roster']['players']),50)
  for page in pages:self.assertLess(len(json.dumps(page,ensure_ascii=False).encode()),32768)
  header=head['header'];header['projection']['name']='برنامج "quoted"\\n é 🏊 \u2028';header['projection']['branch']='فرع خيالي'
  hh=self.sql(f"select academy.x17_header_hash('{a}',{literal(json.dumps(header))}::jsonb)")
  seed=hashlib.sha256(('x17-seed-v1'+hh).encode()).hexdigest()
  vector=[{'id':str(uuid.uuid4()),'name':'سطر\\n "界" é 🏊','status':None,'version':0}]
  acc=self.sql(f"select academy.x17_chain('{seed}',{literal(json.dumps(vector))}::jsonb)")
  out=ROOT/'docs/07-handoff/evidence/register-download-vectors.json'
  out.write_text(json.dumps({'academy':a,'header':header,'head':hh,'seed':seed,'players':vector,'acc':acc,'revision':hashlib.sha256(('x17-root-v1'+hh+acc).encode()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
 def test_download_11_missing_and_oversized_source(self):
  a,b,ev,x,y=self.pair();head=self.download(a,ev)
  for field in head['receipt']['payload']:
   altered=json.loads(json.dumps(head['receipt']));del altered['payload'][field]
   self.download(a,ev,'page',altered,ok=False)
  for field in ['payload','signature']:
   altered=json.loads(json.dumps(head['receipt']));del altered[field]
   self.download(a,ev,'page',altered,ok=False)
  self.sql(f"update academy.publication_events set roster_count=1001,capacity=1001 where id='{ev}'")
  self.download(a,ev,ok=False)
  self.sql(f"update academy.publication_events set roster_count=3 where id='{ev}'")
  self.download(a,ev,ok=False)
if __name__=='__main__':
 suite=unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromNames([n for n in unittest.defaultTestLoader.getTestCaseNames(DownloadBoundary)if n.startswith('test_download_')],DownloadBoundary))
 result=unittest.TextTestRunner(verbosity=2).run(suite)
 sources=[MIGRATION,'scripts/register-download/test_boundary.py','scripts/attendance-register/test_boundary.py','scripts/onboarding/test_boundary.py']
 out=ROOT/'docs/07-handoff/evidence/register-download-database.json'
 out.write_text(json.dumps({'passed':result.wasSuccessful(),'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'hashes':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest()for p in sources},'scope':'Actual disposable PostgreSQL17; fictional current-subject gateway proofs. No hosted schema, Clerk, PostgREST, provider quotas, access grant or independent security approval.'},indent=2)+'\n')
 raise SystemExit(not result.wasSuccessful())
