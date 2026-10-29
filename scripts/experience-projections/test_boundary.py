"""Disposable real PG17 read projections. No hosted grants or data."""
import runpy,json,uuid,unittest
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'development/test_boundary.py'));Base,ROOT=m['DevelopmentBoundary'],m['ROOT']
class ExperienceBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,'a10_register_v1':"a10_register_v1(gen_random_uuid(),gen_random_uuid(),'[]',clock_timestamp(),gen_random_uuid())",**{f'x15_{actor}_{kind}_v1':f"x15_{actor}_{kind}_v1(gen_random_uuid()"+(",gen_random_uuid()"if actor=='guardian'else'')+(",'2099-11-01','2099-12-12'"if kind=='calendar'else'')+")"for actor in ['owner','trainer','guardian']for kind in ['home','calendar']}}

 @classmethod
 def setUpClass(cls):
  super().setUpClass()
  cls.sql((ROOT/'supabase/migrations/20261029035928_attendance_register_batch.sql').read_text())
  cls.sql((ROOT/'supabase/migrations/20261029194029_experience_home_calendar_reads.sql').read_text())
 def calendar(self,a,actor='owner',who='user_owner',first='2099-11-01',last='2099-12-12',link=None,cursor=None,ok=True):
  args=f"'{a}',"+(f"'{link}',"if actor=='guardian'else'')+f"'{first}','{last}'"
  if cursor:args+=f",'{cursor['at']}','{cursor['id']}','{cursor['day']}'"
  raw=self.sql(f'select public.x15_{actor}_calendar_v1({args})',who,ok=ok)
  return json.loads(raw)if ok else raw
 def test_experience_01_owner_current_scope_and_real_dates(self):
  a,b,p,staff,iv,x,dates=self.fixture()
  result=self.calendar(a)
  self.assertGreater(result['total'],0);self.assertEqual(result['total'],len(result['items']))
  self.assertEqual(result['items'][0]['state'],'draft')
  self.calendar(a,who='user_trainer',ok=False);self.calendar(a,who='user_guardian',ok=False);self.calendar(str(uuid.uuid4()),ok=False)
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='owner'")
  self.calendar(a,ok=False)
 def test_experience_02_range_and_foreign_cursor(self):
  a,b,p,staff,iv,x,dates=self.fixture()
  for first,last in [('2026-11-01','2026-12-13'),('2026-11-02','2026-11-01')]:self.calendar(a,first=first,last=last,ok=False)
  cursor=dict(at='2026-11-01T00:00:00Z',id=str(uuid.uuid4()),day='2026-11-01')
  self.calendar(a,cursor=cursor,ok=False)
 def test_experience_03_byte_bounded_paging_authoritative_total(self):
  a,b,p,staff,iv,x,dates=self.fixture()
  self.sql(f"insert into academy.training_dates select d.*from academy.training_dates d where false")
  # Clone ready definitions with their own stable occurrence identities, not private records.
  for n in range(30):
   new=str(uuid.uuid4())
   self.sql(f"insert into academy.training_programs select(jsonb_populate_record(null::academy.training_programs,to_jsonb(p)||jsonb_build_object('id','{new}','definition',jsonb_set(p.definition,'{{name}}',to_jsonb(repeat('اسم طويل ',20)||'{n}'))))).*from academy.training_programs p where id='{p['id']}';insert into academy.training_dates select(jsonb_populate_record(null::academy.training_dates,to_jsonb(d)||jsonb_build_object('program_id','{new}'))).*from academy.training_dates d where program_id='{p['id']}'")
  result=self.calendar(a);total=result['total'];seen=[];pages=0
  while True:
   self.assertEqual(result['total'],total);self.assertLessEqual(len(result['items']),50);self.assertLess(len(json.dumps(result,ensure_ascii=False).encode()),32768)
   seen.extend((i['program'],i['day'])for i in result['items']);pages+=1
   if not result['more']:break
   self.assertIsNotNone(result['next']);result=self.calendar(a,cursor=result['next'])
  self.assertGreater(pages,1);self.assertEqual(len(seen),total);self.assertEqual(len(set(seen)),total)
  statement=f"perform public.x15_owner_calendar_v1('{a}','2099-11-01','2099-12-12');"
  metrics=json.loads(self.sql("create temporary table experience_measured(ms double precision);do $$declare started timestamptz;begin for i in 1..30 loop started:=clock_timestamp();"+statement+"insert into experience_measured values(extract(epoch from clock_timestamp()-started)*1000);end loop;end$$;select json_build_object('samples',count(*),'p95_ms',percentile_cont(0.95)within group(order by ms),'max_ms',max(ms))from experience_measured",'user_owner'))
  self.assertLess(metrics['p95_ms'],800)
  dest=ROOT/'docs/07-handoff/evidence/redesign-homes-2026-10-29';dest.mkdir(parents=True,exist_ok=True)
  (dest/'sql-read-budget.json').write_text(json.dumps({'scope':'Disposable local PostgreSQL17 functions only; excludes app/HTTP/identity/network/hosted/WAL cost','programs':31,'scoped_dates':total,'pages':pages,'samples':metrics,'page_limit':50,'utf8_payload_limit':32768},indent=2)+'\n')
 def test_experience_04_trainer_published_current_only(self):
  a,b,p,staff,iv,x,dates=self.fixture();self.assertEqual(self.calendar(a,'trainer','user_trainer')['total'],0)
  j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate')
  result=self.calendar(a,'trainer','user_trainer');self.assertGreater(result['total'],0)
  self.assertTrue(all(i['published']for i in result['items']))
  self.sql(f"update academy.trainer_assignments set state='ended',end_reason='Synthetic end',ended_at=clock_timestamp()where academy_id='{a}'")
  self.calendar(a,'trainer','user_trainer',ok=False)
 def home(self,a,actor='owner',who='user_owner',link=None,ok=True):
  args=f"'{a}'"+(f",'{link}'"if actor=='guardian'else'')
  raw=self.sql(f'select public.x15_{actor}_home_v1({args})',who,ok=ok);return json.loads(raw)if ok else raw
 def test_experience_05_guardian_opt_in_and_link_revocation(self):
  a,b,p,st,x,dates,ev,link,iv=self.family()
  result=self.calendar(a,'guardian','user_guardian',link=link);self.assertGreater(result['total'],0)
  self.assertTrue(all(i['capacity']is None and i['roster_count']is None for i in result['items']))
  result=self.home(a,'guardian','user_guardian',link);self.assertEqual(result['panels']['next_session']['state'],'ready')
  self.assertEqual(result['panels']['latest_feedback']['state'],'unavailable')
  self.sql(f"update academy.guardian_training_access set enabled=false where link_id='{link}'")
  self.calendar(a,'guardian','user_guardian',link=link,ok=False)
  self.assertEqual(self.home(a,'guardian','user_guardian',link)['panels']['today']['state'],'unavailable')
  self.sql(f"update academy.guardian_links set state='ended',end_reason='Synthetic end',ended_at=clock_timestamp()where id='{link}'")
  self.home(a,'guardian','user_guardian',link,ok=False)
 def test_experience_06_home_counts_and_current_deadline(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture()
  h=self.home(a);self.assertEqual(h['panels']['incomplete_attendance']['count'],1)
  self.assertEqual(self.home(a,'trainer','user_trainer')['panels']['incomplete_attendance']['count'],1)
  self.retime(ev,"clock_timestamp()-interval '27 hours'","clock_timestamp()-interval '25 hours'")
  self.assertEqual(self.home(a)['panels']['incomplete_attendance']['count'],0)
  for who in ['user_trainer','user_guardian','user_platform','user_other_owner']:self.home(a,who=who,ok=False)
 def test_experience_07_moved_cancelled_and_snapshot_exclusion(self):
  a,b,p,st,iv,x,dates=self.fixture();j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate')
  first=self.calendar(a)['items'][0];original=first['day'];withdraw=self.prepare_pub(a,self.pub(a,p,'withdraw'));self.mutate(a,withdraw,'activate')
  self.sql(f"update academy.training_dates set scheduled_date=scheduled_date+1,starts_at=starts_at+interval '1 day',ends_at=ends_at+interval '1 day'where program_id='{p['id']}'and local_date='{original}'")
  owner=self.calendar(a);moved=[i for i in owner['items']if i['day']==original][0];self.assertEqual(moved['state'],'moved');self.assertNotEqual(moved['date'],moved['day'])
  self.assertNotIn(original,[i['day']for i in self.calendar(a,'trainer','user_trainer')['items']])
  self.sql(f"update academy.training_dates set canceled=true where program_id='{p['id']}'and local_date='{original}'")
  self.assertEqual([i for i in self.calendar(a)['items']if i['day']==original][0]['state'],'cancelled')
 def test_experience_08_acl_and_no_gateway_bypass(self):
  self.assertEqual(self.sql("select bool_or(has_function_privilege('authenticated',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='academy'and p.proname like 'x15_%'"),'f')
  self.assertEqual(self.sql("select bool_and(has_function_privilege('authenticated',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname like 'x15_%'"),'t')
  a,b,p,st,iv,x,dates=self.fixture()
  self.sql("begin;set local role authenticated;set local request.jwt.claims='{}';select public.x15_owner_home_v1('"+a+"');commit",ok=False)
 def test_experience_09_two_academies_cursor_and_read_only_records(self):
  a,b,p,st,iv,x,dates=self.fixture();other,branch=self.academy('user_other_owner')
  result=self.calendar(a);self.assertGreater(result['total'],0)
  self.assertEqual(self.calendar(other,who='user_other_owner')['total'],0)
  self.calendar(a,who='user_other_owner',ok=False);self.calendar(other,ok=False)
  self.calendar(other,who='user_other_owner',cursor=result['items'][0]['cursor'],ok=False)
  before=self.sql("select md5(string_agg(table_name||':'||n,','order by table_name))from(select 'audit' table_name,count(*)::text n from academy.audit_events union all select 'marks',count(*)::text from academy.attendance_marks union all select 'memberships',count(*)::text from academy.memberships union all select 'plans',count(*)::text from academy.date_plans)q")
  self.home(a);self.calendar(a);self.home(a,'trainer','user_trainer');self.calendar(a,'trainer','user_trainer')
  after=self.sql("select md5(string_agg(table_name||':'||n,','order by table_name))from(select 'audit' table_name,count(*)::text n from academy.audit_events union all select 'marks',count(*)::text from academy.attendance_marks union all select 'memberships',count(*)::text from academy.memberships union all select 'plans',count(*)::text from academy.date_plans)q")
  self.assertEqual(before,after)
def load_tests(loader,tests,pattern):
 # The inherited suites have their own clean-cluster CI entry points. Discover
 # this additive read contract here, rather than mixing fixtures across classes.
 return unittest.TestSuite(ExperienceBoundary(name)for name in sorted(ExperienceBoundary.__dict__)if name.startswith('test_experience_'))
if __name__=='__main__':
 unittest.main()
