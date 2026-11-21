"""Actual disposable PG17 I3d boundary. No hosted accounts or data."""
import runpy,json,uuid,concurrent.futures,subprocess,time
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'program-planning/test_boundary.py'))
Base,literal,ROOT=m['ProgramPlanningBoundary'],m['literal'],m['ROOT']
class PublicationBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,**{n:q for n,q in [
 ('s8_create_v1',"s8_create_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'publish','2099-11-01','2100-01-31','{0,2,4}')"),('s8_read_v1','s8_read_v1(gen_random_uuid(),gen_random_uuid())'),('s8_jobs_v1','s8_jobs_v1(gen_random_uuid(),gen_random_uuid())'),('s8_change_v1',"s8_change_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),1,'prepare')"),('s8_operation_v1','s8_operation_v1(gen_random_uuid(),gen_random_uuid())'),('s8_owner_dates_v1','s8_owner_dates_v1(gen_random_uuid(),gen_random_uuid())'),('s8_schedule_v1','s8_schedule_v1(gen_random_uuid())'),('s8_roster_v1','s8_roster_v1(gen_random_uuid(),gen_random_uuid())')]}}
 @classmethod
 def setUpClass(cls):super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261027210954_i3d_published_trainer_schedule.sql').read_text())
 def fixture(self,roster=True):
  a,b=self.academy();d=self.definition();d['from']='2099-11-01';d['to']='2100-01-31';p=self.ready(a,d);staff,iv=self.staff(a,b);x=self.person(a,b)
  dates=json.loads(self.sql(f"select json_agg(local_date order by local_date)from academy.training_dates where program_id='{p['id']}'"))
  for day in dates:self.plan(a,p,day=day,capacity=3,trainer=staff,add=[x]if roster else[])
  return a,b,p,staff,iv,x,dates
 def pub(self,a,p,kind='publish',op=None,first='2099-11-01',last='2100-01-31',subject='user_owner',ok=True):
  raw=self.sql(f"select public.s8_create_v1('{a}','{p['id']}','{op or uuid.uuid4()}','{kind}','{first}','{last}','{{0,2,4}}')",subject,ok=ok);return json.loads(raw)if ok else raw
 def mutate(self,a,j,act='prepare',op=None,version=None,ok=True,subject='user_owner'):
  raw=self.sql(f"select public.s8_change_v1('{a}','{j['job']}','{op or uuid.uuid4()}',{version or j['version']},'{act}')",subject,ok=ok);return json.loads(raw)if ok else raw
 def prepare_pub(self,a,j):
  while j['state']!='ready':j=self.mutate(a,j)
  return j
 def detail(self,a,j,subject='user_owner',ok=True):
  raw=self.sql(f"select public.s8_read_v1('{a}','{j['job']}')",subject,ok=ok);return json.loads(raw)if ok else raw
 def schedule(self,a,first='2099-11-01',subject='user_trainer',ok=True):
  raw=self.sql(f"select public.s8_schedule_v1('{a}','{first}')",subject,ok=ok);return json.loads(raw)if ok else raw
 def test_publication_01_publish_snapshot_freeze_withdraw_republish(self):
  a,b,p,staff,iv,x,dates=self.fixture();self.assertEqual(self.schedule(a)['items'],[]);op=str(uuid.uuid4());j=self.pub(a,p,op=op);self.assertEqual(self.pub(a,p,op=op),j)
  j=self.mutate(a,j);r=self.detail(a,j);self.assertEqual(r['prepared'],25);self.assertEqual(self.schedule(a)['items'],[]);self.assertEqual(len(r['items']),25);self.assertTrue(r['more'])
  j=self.prepare_pub(a,j);op=str(uuid.uuid4());result=self.mutate(a,j,'activate',op);self.assertEqual(result['state'],'committed');self.assertEqual(self.mutate(a,j,'activate',op),result)
  self.assertEqual(self.sql(f"select count(*)from academy.publication_heads where academy_id='{a}'"),str(len(dates)));items=self.schedule(a)['items'];self.assertGreater(len(items),0);event=items[0]['id']
  rr=json.loads(self.sql(f"select public.s8_roster_v1('{a}','{event}')",'user_trainer'));self.assertEqual(rr['players'],[{'id':x,'name':'Alex Demo'}]);self.assertNotIn('contact',json.dumps(rr));self.assertNotIn('recipient',json.dumps(rr))
  self.assertEqual(json.loads(self.plan(a,p,version=1,day=dates[0],capacity=4,trainer=staff))['error'],'published_locked')
  self.sql(f"update academy.players set display_name='Renamed Demo'where id='{x}'");self.assertEqual(json.loads(self.sql(f"select public.s8_roster_v1('{a}','{event}')",'user_trainer'))['players'][0]['name'],'Alex Demo')
  w=self.prepare_pub(a,self.pub(a,p,'withdraw'));self.assertEqual(self.mutate(a,w,'activate')['state'],'committed');self.assertEqual(self.schedule(a)['items'],[]);self.sql(f"select public.s8_roster_v1('{a}','{event}')",'user_trainer',ok=False)
  self.assertEqual(json.loads(self.plan(a,p,version=1,day=dates[0],capacity=4,trainer=staff))['version'],2);self.assertEqual(self.sql(f"select count(*)from academy.publication_events where academy_id='{a}'"),str(2*len(dates)))
  again=self.prepare_pub(a,self.pub(a,p));self.mutate(a,again,'activate');self.assertEqual(self.sql(f"select count(*)from academy.publication_events where academy_id='{a}'"),str(3*len(dates)))
 def test_publication_02_invalid_stale_atomic_child_audit_rollback(self):
  a,b,p,staff,iv,x,dates=self.fixture();self.plan(a,p,version=1,day=dates[1],trainer=None);j=self.prepare_pub(a,self.pub(a,p));self.assertEqual(self.detail(a,j)['blocked'],1);self.assertEqual(self.mutate(a,j,'activate')['error'],'not_ready');self.assertEqual(self.schedule(a)['items'],[])
  self.plan(a,p,version=2,day=dates[1],trainer=staff);j=self.prepare_pub(a,self.pub(a,p));self.plan(a,p,version=1,day=dates[-1],trainer=staff,capacity=4);self.assertEqual(self.mutate(a,j,'activate')['error'],'stale');self.assertEqual(self.schedule(a)['items'],[])
  j=self.prepare_pub(a,self.pub(a,p));self.sql("create function academy.synthetic_pub_fail()returns trigger language plpgsql as $$begin if TG_ARGV[0]='audit'or new.day=TG_ARGV[0]::date then raise exception 'Synthetic fail';end if;return new;end$$")
  for day in [dates[0],dates[len(dates)//2],dates[-1]]:
   self.sql(f"create trigger synthetic_pub before insert on academy.publication_events for each row execute function academy.synthetic_pub_fail('{day}')");self.mutate(a,j,'activate',ok=False);self.assertEqual(self.sql(f"select count(*)from academy.publication_heads where academy_id='{a}'"),'0');self.assertEqual(self.detail(a,j)['state'],'ready');self.sql('drop trigger synthetic_pub on academy.publication_events')
  self.sql("create trigger synthetic_pub_audit before insert on academy.audit_events for each row execute function academy.synthetic_pub_fail('audit')");self.mutate(a,j,'activate',ok=False);self.assertEqual(self.schedule(a)['items'],[]);self.sql('drop trigger synthetic_pub_audit on academy.audit_events');self.mutate(a,j,'activate')
 def test_publication_03_roles_scope_fence_and_current_appointment(self):
  a,b,p,staff,iv,x,dates=self.fixture();j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');event=self.schedule(a)['items'][0]['id']
  for who in ['user_other_owner','user_owner','user_signup','user_platform']:self.schedule(a,subject=who,ok=False);self.sql(f"select public.s8_roster_v1('{a}','{event}')",who,ok=False)
  for who in ['user_trainer','user_other_owner','user_signup','user_platform']:self.detail(a,j,subject=who,ok=False);self.pub(a,p,subject=who,ok=False)
  aa,bb=self.academy('user_other_owner');self.schedule(aa,ok=False);self.sql(f"select public.s8_roster_v1('{aa}','{event}')",'user_trainer',ok=False)
  for table in ['publication_jobs','publication_events','publication_heads','publication_rosters','publication_targets','publication_operations']:self.sql('select *from academy.'+table,'user_trainer',ok=False)
  for name in ['s8_job','s8_problem','s8_guard_plan']:self.sql("select has_function_privilege('authenticated',p.oid,'execute')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='academy'and proname="+literal(name));self.assertEqual(self.sql("select bool_or(has_function_privilege('authenticated',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='academy'and proname="+literal(name)),'f')
  fence=str(uuid.uuid4());self.assertTrue(json.loads(self.sql(f"select public.s8_operation_v1('{a}','{fence}')",'user_owner'))['cancelled']);self.assertEqual(self.pub(a,p,'withdraw',op=fence)['error'],'conflict')
  t=runpy.run_path(str(ROOT/'scripts/trainers/test_boundary.py'))['TrainerBoundary'];t.command(self,a,act='end',iv=iv,version=2,reason='Synthetic end');self.schedule(a,ok=False);self.sql(f"select public.s8_roster_v1('{a}','{event}')",'user_trainer',ok=False)
 def test_publication_04_competing_activation_and_edit_serialization(self):
  a,b,p,staff,iv,x,dates=self.fixture(False);j=self.prepare_pub(a,self.pub(a,p));other=self.prepare_pub(a,self.pub(a,p))
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:r=list(pool.map(lambda job:self.mutate(a,job,'activate'),[j,other]))
  self.assertEqual(sum(z.get('state')=='committed'for z in r),1);self.assertIn('stale',[z.get('error')for z in r]);self.assertEqual(self.sql(f"select count(*)from academy.publication_events where academy_id='{a}'"),str(len(dates)))
 def test_publication_05_dated_only_assignment_and_bounded_snapshot_roster(self):
  a,b,p,staff,iv,x,dates=self.fixture();T=runpy.run_path(str(ROOT/'scripts/trainers/test_boundary.py'))['TrainerBoundary'];_,other_iv,tk,_,_=T.command(self,a,b,email='second-trainer@example.invalid',name='Jordan Demo');T.recipient(self,other_iv,tk,'accept',str(uuid.uuid4()),subject='user_second_trainer',email='second-trainer@example.invalid');other=self.sql(f"select staff_id from academy.trainer_invitations where id='{other_iv}'")
  self.plan(a,p,day=dates[1],version=1,trainer=other);j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');one=self.schedule(a,subject='user_second_trainer')['items'];self.assertEqual(len(one),1);self.assertEqual(one[0]['day'],dates[1]);self.assertNotIn(dates[1],[r['day']for r in self.schedule(a)['items']]);self.sql(f"select public.s8_roster_v1('{a}','{one[0]['id']}')",'user_trainer',ok=False)
  w=self.prepare_pub(a,self.pub(a,p,'withdraw'));self.mutate(a,w,'activate');self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}','Synthetic scale '||n,'synthetic scale '||n from generate_series(1,1000)n;insert into academy.date_rosters select '{a}','{p['id']}','{dates[0]}',id from academy.players where academy_id='{a}'and id<>'{x}';update academy.date_plans set capacity=1001,roster_count=1001,version=version+1 where program_id='{p['id']}'and local_date='{dates[0]}'")
  j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');event=self.schedule(a)['items'][0]['id'];r=json.loads(self.sql(f"select public.s8_roster_v1('{a}','{event}')",'user_trainer'));self.assertEqual(r['count'],1001);self.assertEqual(len(r['players']),25);self.assertTrue(r['more']);self.assertLess(len(json.dumps(r).encode()),24576);next_page=json.loads(self.sql(f"select public.s8_roster_v1('{a}','{event}','{r['players'][-1]['id']}')",'user_trainer'));self.assertTrue(set(q['id']for q in r['players']).isdisjoint(q['id']for q in next_page['players']))
 def test_publication_06_observed_publish_edit_end_cancel_and_withdraw_orders(self):
  for first in [False,True]:
   a,b,p,staff,iv,x,dates=self.fixture(False);j=self.prepare_pub(a,self.pub(a,p));activate=self.caller('user_owner','/rpc/s8_change_v1')+f"select public.s8_change_v1('{a}','{j['job']}','{uuid.uuid4()}',{j['version']},'activate')";edit=self.caller('user_owner','/rpc/q6_save_v1')+f"select public.q6_save_v1('{a}','{p['id']}','{dates[0]}',1,5,'{staff}','{{}}','{{}}','{uuid.uuid4()}')"
   self.observed_order(activate if first else edit,edit if first else activate);self.assertEqual(self.detail(a,j)['state'],'committed'if first else'ready');self.assertEqual(self.sql(f"select capacity from academy.date_plans where program_id='{p['id']}'and local_date='{dates[0]}'"),'3'if first else'5')
  for first in [False,True]:
   a,b,p,staff,iv,x,dates=self.fixture(False);j=self.prepare_pub(a,self.pub(a,p));activate=self.caller('user_owner','/rpc/s8_change_v1')+f"select public.s8_change_v1('{a}','{j['job']}','{uuid.uuid4()}',{j['version']},'activate')";end=self.trainer_end_statement(a,iv)
   self.observed_order(activate if first else end,end if first else activate);self.assertEqual(self.detail(a,j)['state'],'committed'if first else'ready');self.schedule(a,ok=False)
  for first in [False,True]:
   a,b,p,staff,iv,x,dates=self.fixture(False);j=self.prepare_pub(a,self.pub(a,p));activate=self.caller('user_owner','/rpc/s8_change_v1')+f"select public.s8_change_v1('{a}','{j['job']}','{uuid.uuid4()}',{j['version']},'activate')";cancel=self.caller('user_owner','/rpc/s8_change_v1')+f"select public.s8_change_v1('{a}','{j['job']}','{uuid.uuid4()}',{j['version']},'cancel')"
   self.observed_order(activate if first else cancel,cancel if first else activate);self.assertEqual(self.detail(a,j)['state'],'committed'if first else'cancelled')
  for first in [False,True]:
   a,b,p,staff,iv,x,dates=self.fixture(False);j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');w=self.prepare_pub(a,self.pub(a,p,'withdraw'));withdraw=self.caller('user_owner','/rpc/s8_change_v1')+f"select public.s8_change_v1('{a}','{w['job']}','{uuid.uuid4()}',{w['version']},'activate')";edit=self.caller('user_owner','/rpc/q6_save_v1')+f"select public.q6_save_v1('{a}','{p['id']}','{dates[0]}',1,5,'{staff}','{{}}','{{}}','{uuid.uuid4()}')"
   self.observed_order(withdraw if first else edit,edit if first else withdraw);self.assertEqual(self.sql(f"select capacity from academy.date_plans where program_id='{p['id']}'and local_date='{dates[0]}'"),'5'if first else'3');self.assertEqual(self.schedule(a)['items'],[])
 def test_publication_07_started_dates_missing_plan_and_raw_guard(self):
  a,b,p,staff,iv,x,dates=self.fixture();self.sql(f"update academy.date_plans set starts_at=clock_timestamp()-interval '2 minutes',ends_at=clock_timestamp()-interval '1 minute'where program_id='{p['id']}'and local_date='{dates[-1]}'");j=self.prepare_pub(a,self.pub(a,p));self.assertEqual(self.detail(a,j)['blocked'],1);self.assertEqual(self.mutate(a,j,'activate')['error'],'not_ready');self.assertEqual(self.schedule(a)['items'],[])
  a,b,p,staff,iv,x,dates=self.fixture();j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');self.assertTrue(json.loads(self.planning_read(a,p,dates[0]))['published']);self.sql(f"update academy.date_plans set capacity=7 where program_id='{p['id']}'and local_date='{dates[0]}'",ok=False);self.sql(f"delete from academy.date_rosters where program_id='{p['id']}'and local_date='{dates[0]}'",ok=False)
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='trainer'");self.schedule(a,ok=False);self.sql(f"update academy.memberships set status='active'where academy_id='{a}'and role='trainer'");self.sql(f"update academy.memberships set role='manager'where academy_id='{a}'and role='trainer'");self.schedule(a,ok=False)
 def test_publication_08_atomic_scale(self):
  import datetime
  metrics={}
  for size in [20,40,100,1000]:
   a,b=self.academy();staff,iv=self.staff(a,b);x=self.person(a,b);first='2099-11-01';last=(datetime.date.fromisoformat(first)+datetime.timedelta(days=size-1)).isoformat();definition={'name':'Synthetic publication scale','from':first,'to':last,'rules':[{'day':d,'start':'17:00','end':'18:00'}for d in range(7)]};p=self.ready(a,definition);rules={str(d):{'capacity':1,'trainer':staff,'players':[x]}for d in range(7)}
   plan=json.loads(self.sql(f"select public.r7_create_v1('{a}','{p['id']}','{uuid.uuid4()}','{first}','{last}',{literal(json.dumps(rules))}::jsonb)",'user_owner'));plan=self.prepared(a,plan);self.mutation(a,plan,'activate');j=json.loads(self.sql(f"select public.s8_create_v1('{a}','{p['id']}','{uuid.uuid4()}','publish','{first}','{last}','{{0,1,2,3,4,5,6}}')",'user_owner'));j=self.prepare_pub(a,j);samples=[]
   for _ in range(50):
    query="begin;set local statement_timeout='3s';"+self.caller('user_owner','/rpc/s8_change_v1')+f"select public.s8_change_v1('{a}','{j['job']}','{uuid.uuid4()}',{j['version']},'activate');rollback;";start=time.perf_counter();r=subprocess.run(self.base,input=query,text=True,capture_output=True);samples.append((time.perf_counter()-start)*1000);self.assertEqual(r.returncode,0,r.stderr);self.assertIn('committed',r.stdout)
   self.assertEqual(self.sql(f"select count(*)from academy.publication_heads where academy_id='{a}'"),'0');self.assertEqual(self.mutate(a,j,'activate')['state'],'committed');self.assertEqual(self.sql(f"select count(*)from academy.publication_rosters r join academy.publication_events e on e.id=r.event_id where e.academy_id='{a}'"),str(size));metrics[str(size)]={'observations':50,'process_inclusive_p95_ms':sorted(samples)[47],'max_ms':max(samples),'outer_statement_budget_ms':3000,'roster_per_date':1}
  out=ROOT/'docs/07-handoff/evidence/i3d-local-2026-10-27';out.mkdir(parents=True,exist_ok=True);(out/'sql-scale.json').write_text(json.dumps({'status':'passed outer statement budget and committed counts','scope':'Actual disposable PG17 public activation, includes connection/process launch; excludes HTTP/identity/provider/hosted/device, one player per date only.300ms SQLp95 target assessed separately, not silently waived.','metrics':metrics},indent=2)+'\n')
if __name__=='__main__':import unittest;unittest.main(defaultTest='PublicationBoundary')
