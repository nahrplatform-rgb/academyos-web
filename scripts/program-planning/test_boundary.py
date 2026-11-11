"""Disposable actual atomic program planning tests; never hosted fixtures."""
import runpy,sys,json,uuid,time,concurrent.futures,subprocess
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'planning/test_boundary.py'));PlanningBoundary,literal,ROOT=m['PlanningBoundary'],m['literal'],m['ROOT']
class ProgramPlanningBoundary(PlanningBoundary):
 extra_authenticated_calls={**PlanningBoundary.extra_authenticated_calls,'r7_create_v1':"r7_create_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'2026-11-01','2026-11-02','{}')",'r7_list_v1':'r7_list_v1(gen_random_uuid(),gen_random_uuid())','r7_read_v1':'r7_read_v1(gen_random_uuid(),gen_random_uuid())','r7_change_v1':"r7_change_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),1,'cancel')",'r7_operation_v1':'r7_operation_v1(gen_random_uuid(),gen_random_uuid())'}
 @classmethod
 def setUpClass(cls):super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261027022133_i3c_atomic_program_planning.sql').read_text())
 def rules(self,trainer=None):return {str(d):{'capacity':2,'trainer':trainer}for d in [0,2,4]}
 def proposal(self,a,p,rules=None,op=None,subject='user_owner',ok=True):return json.loads(self.sql(f"select public.r7_create_v1('{a}','{p['id']}','{op or uuid.uuid4()}','2026-11-01','2027-01-31',{literal(json.dumps(rules or self.rules()))}::jsonb)",subject,ok=ok))
 def mutation(self,a,j,act='prepare',op=None,weekday=None,add=None,remove=None,subject='user_owner',ok=True):
  ids=lambda v:literal('{'+','.join(v or [])+'}')+'::uuid[]'
  raw=self.sql(f"select public.r7_change_v1('{a}','{j['job']}','{op or uuid.uuid4()}',{j['version']},{literal(act)},{weekday if weekday is not None else 'null'},{ids(add)},{ids(remove)})",subject,ok=ok)
  return json.loads(raw) if ok else raw
 def proposal_read(self,a,j,**kwargs):
  ok=kwargs.get('ok',True);raw=self.sql(f"select public.r7_read_v1('{a}','{j['job']}')",subject=kwargs.pop('subject','user_owner'),**kwargs);return json.loads(raw)if ok else raw
 def prepared(self,a,j):
  while j['state']!='ready':j=self.mutation(a,j)
  return j
 def test_program_planning_01_prepare_atomic_activation_preserve_and_replay(self):
  a,b=self.academy();p=self.ready(a);x=self.person(a,b);self.plan(a,p,capacity=4)
  op=str(uuid.uuid4());j=self.proposal(a,p,op=op);self.assertEqual(self.proposal(a,p,op=op),j);r=self.proposal_read(a,j);self.assertEqual(r['total'],40);self.assertEqual(r['preserved'],1);self.assertEqual(len(r['items']),25);self.assertTrue(r['more'])
  for day in [0,2,4]:j=self.mutation(a,j,'players',weekday=day,add=[x])
  j=self.mutation(a,j);self.assertEqual(self.proposal_read(a,j)['prepared'],25);self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{a}'"),'1')
  j=self.prepared(a,j);op=str(uuid.uuid4());done=self.mutation(a,j,'activate',op=op);self.assertEqual(done['state'],'committed');self.assertEqual(self.mutation(a,j,'activate',op=op),done)
  self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{a}'"),'40');self.assertEqual(self.sql(f"select count(*)from academy.date_rosters where academy_id='{a}'"),'39');self.assertEqual(json.loads(self.planning_read(a,p))['capacity'],4)
  self.assertEqual(self.sql(f"select count(*)from academy.audit_events where action='program_plan.activate'and academy_id='{a}'"),'1')
 def test_program_planning_02_injected_last_child_failure_rolls_back_every_date(self):
  a,b=self.academy();p=self.ready(a);x=self.person(a,b);j=self.proposal(a,p)
  for day in [0,2,4]:j=self.mutation(a,j,'players',weekday=day,add=[x])
  j=self.prepared(a,j)
  self.sql("create function academy.test_fail_program_child()returns trigger language plpgsql as $$begin if new.local_date=TG_ARGV[0]::date then raise exception 'synthetic child failure';end if;return new;end$$")
  for failure_day in ['2026-11-01','2026-12-01','2027-01-31']:
   self.sql(f"create trigger test_program_fail before insert on academy.date_rosters for each row execute function academy.test_fail_program_child('{failure_day}')")
   self.mutation(a,j,'activate',ok=False)
   self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{a}'"),'0');self.assertEqual(self.sql(f"select count(*)from academy.date_rosters where academy_id='{a}'"),'0');self.assertEqual(self.proposal_read(a,j)['state'],'ready');self.assertEqual(self.sql(f"select count(*)from academy.audit_events where action='program_plan.activate'and academy_id='{a}'"),'0')
   self.sql('drop trigger test_program_fail on academy.date_rosters')
  self.assertEqual(self.mutation(a,j,'activate')['state'],'committed')

 def test_program_planning_03_overlap_blocks_whole_and_no_partial_ready_subset(self):
  a,b=self.academy();p=self.ready(a);x=self.person(a,b);staff,iv=self.staff(a,b)
  d=self.definition();d['to']='2026-11-03';d['rules']=[{'day':2,'start':'19:30','end':'20:30'}];other=self.ready(a,d);self.plan(a,other,day='2026-11-03',trainer=staff,add=[x])
  j=self.proposal(a,p,self.rules(staff));j=self.prepared(a,j);r=self.proposal_read(a,j);self.assertEqual(r['blocked'],1);self.assertEqual(self.mutation(a,j,'activate')['error'],'not_ready');self.assertEqual(self.sql(f"select count(*)from academy.date_plans where program_id='{p['id']}'"),'0')
  j2=self.proposal(a,p);j2=self.prepared(a,j2);self.assertEqual(self.mutation(a,j2,'activate')['state'],'committed')
 def test_program_planning_04_scope_current_roles_foreign_people_and_acl(self):
  a,b=self.academy();aa,bb=self.academy('user_other_owner');p=self.ready(a);j=self.proposal(a,p);foreign=self.person(aa,bb,subject='user_other_owner')
  for subject in ['user_platform','user_other_owner','user_signup']:
   self.proposal_read(a,j,subject=subject,ok=False);self.mutation(a,j,'cancel',subject=subject,ok=False)
  self.mutation(a,j,'players',weekday=0,add=[foreign],ok=False)
  self.sql(f"update academy.memberships set role='manager'where academy_id='{a}'");self.mutation(a,j,'cancel',ok=False);self.sql(f"update academy.memberships set role='owner',status='suspended'where academy_id='{a}'");self.proposal_read(a,j,ok=False)
  for table in ['program_plans','program_plan_players','program_plan_targets','program_plan_operations']:
   self.sql(f'select * from academy.{table}','user_signup',ok=False)
  self.sql(f"select academy.r7_job('{a}','{j['job']}')",'user_signup',ok=False)
 def test_program_planning_05_single_date_race_stale_and_cancel_fence(self):
  a,b=self.academy();p=self.ready(a);j=self.prepared(a,self.proposal(a,p));self.plan(a,p,capacity=9)
  self.assertEqual(self.mutation(a,j,'activate')['error'],'stale');self.assertEqual(self.sql(f"select count(*)from academy.date_plans where program_id='{p['id']}'"),'1');self.assertEqual(json.loads(self.planning_read(a,p))['capacity'],9)
  j2=self.prepared(a,self.proposal(a,p));op=str(uuid.uuid4());self.sql(f"select public.r7_operation_v1('{a}','{op}')",'user_owner');self.assertEqual(self.mutation(a,j2,'activate',op=op)['error'],'conflict');self.assertEqual(self.mutation(a,j2,'cancel')['state'],'cancelled');self.assertEqual(self.mutation(a,j2,'activate')['error'],'stale')
 def test_program_planning_06_concurrent_activation_and_individual_save(self):
  a,b=self.academy();p=self.ready(a);j=self.prepared(a,self.proposal(a,p));j2=self.prepared(a,self.proposal(a,p))
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:r=list(pool.map(lambda proposal:self.mutation(a,proposal,'activate'),[j,j2]))
  self.assertEqual(sum(x.get('state')=='committed'for x in r),1);self.assertEqual(sum(x.get('error')=='stale'for x in r),1);self.assertEqual(self.sql(f"select count(*)from academy.date_plans where program_id='{p['id']}'"),'40')
  q=self.ready(a);jq=self.prepared(a,self.proposal(a,q))
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:
   left=pool.submit(self.mutation,a,jq,'activate');right=pool.submit(self.plan,a,q,capacity=8)
   r1=left.result();r2=json.loads(right.result())
  self.assertTrue((r1.get('state')=='committed'and r2.get('error')=='stale')or(r1.get('error')=='stale'and r2.get('version')==1));self.assertEqual(self.sql(f"select count(*)from academy.date_plans where program_id='{q['id']}'"),'40'if r1.get('state')=='committed'else'1')
 def test_program_planning_07_large_roster_pagination_revision_and_ended_trainer(self):
  a,b=self.academy();p=self.ready(a);staff,iv=self.staff(a,b);rules=self.rules(staff)
  for r in rules.values():r['capacity']=1001
  j=self.proposal(a,p,rules)
  rows=self.sql(f"with inserted as(insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}','Synthetic person '||n,'synthetic person '||n from generate_series(1,1001)n returning id)select json_agg(id)from inserted")
  players=json.loads(rows)
  for offset in range(0,len(players),25):j=self.mutation(a,j,'players',weekday=0,add=players[offset:offset+25])
  j=self.prepared(a,j);read=json.loads(self.sql(f"select public.r7_read_v1('{a}','{j['job']}',null,0)",'user_owner'));self.assertEqual(read['player_counts']['0'],1001);self.assertEqual(len(read['players']),25);self.assertTrue(read['players_more'])
  TrainerBoundary=m['TrainerBoundary'];TrainerBoundary.command(self,a,act='end',iv=iv,version=2,reason='Synthetic atomic program end')
  self.assertEqual(self.mutation(a,j,'activate')['error'],'trainer_unavailable');self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{a}'"),'0')
 def test_program_planning_08_observed_activation_staff_end_and_cancel_both_orders(self):
  TrainerBoundary=m['TrainerBoundary']
  for activate_first in [False,True]:
   a,b=self.academy();p=self.ready(a);staff,iv=self.staff(a,b);j=self.prepared(a,self.proposal(a,p,self.rules(staff)))
   op=str(uuid.uuid4());activate=self.caller('user_owner','/rpc/r7_change_v1')+f"select public.r7_change_v1('{a}','{j['job']}','{op}',{j['version']},'activate')"
   end=self.trainer_end_statement(a,iv)
   self.observed_order(activate if activate_first else end,end if activate_first else activate)
   self.assertEqual(self.proposal_read(a,j)['state'],'committed'if activate_first else'ready')
  for activate_first in [False,True]:
   a,b=self.academy();p=self.ready(a);j=self.prepared(a,self.proposal(a,p));op=str(uuid.uuid4());cancel_op=str(uuid.uuid4())
   activate=self.caller('user_owner','/rpc/r7_change_v1')+f"select public.r7_change_v1('{a}','{j['job']}','{op}',{j['version']},'activate')"
   cancel=self.caller('user_owner','/rpc/r7_change_v1')+f"select public.r7_change_v1('{a}','{j['job']}','{cancel_op}',{j['version']},'cancel')"
   self.observed_order(activate if activate_first else cancel,cancel if activate_first else activate)
   self.assertEqual(self.proposal_read(a,j)['state'],'committed'if activate_first else'cancelled');self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{a}'"),'40'if activate_first else'0')
 def trainer_end_statement(self,a,iv):
  return self.caller('user_owner','/rpc/t4_command_v1')+f"select public.t4_command_v1('{a}','{uuid.uuid4()}','end','{iv}',null,null,null,null,2,'Synthetic program race')"
 def test_program_planning_09_atomic_activation_scale(self):
  metrics={}
  for size in [20,40,100,1000]:
   a,b=self.academy();last=(__import__('datetime').date(2026,11,1)+__import__('datetime').timedelta(days=size-1)).isoformat()
   definition={'name':'Synthetic atomic scale','from':'2026-11-01','to':last,'rules':[{'day':d,'start':'17:00','end':'18:00'}for d in range(7)]};p=self.ready(a,definition)
   rules={str(d):{'capacity':100,'trainer':None}for d in range(7)};j=json.loads(self.sql(f"select public.r7_create_v1('{a}','{p['id']}','{uuid.uuid4()}','2026-11-01','{last}',{literal(json.dumps(rules))}::jsonb)",'user_owner'));x=self.person(a,b)
   for day in range(7):j=self.mutation(a,j,'players',weekday=day,add=[x])
   j=self.prepared(a,j);samples=[]
   for _ in range(50):
    op=str(uuid.uuid4());q=self.caller('user_owner','/rpc/r7_change_v1')+f"select public.r7_change_v1('{a}','{j['job']}','{op}',{j['version']},'activate')"
    q="begin;set local statement_timeout='3s';"+q+';rollback;'
    start=time.perf_counter();run=subprocess.run(self.base,input=q,text=True,capture_output=True);samples.append((time.perf_counter()-start)*1000);self.assertEqual(run.returncode,0,run.stderr);self.assertIn('committed',run.stdout)
   metrics[str(size)]={'observations':50,'process_inclusive_p95_ms':sorted(samples)[47],'max_ms':max(samples),'statement_budget_ms':3000,'roster_per_date':1}
   self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{a}'"),'0')
   self.assertEqual(self.mutation(a,j,'activate')['state'],'committed');self.assertEqual(self.sql(f"select count(*)from academy.date_rosters where academy_id='{a}'"),str(size))
  dest=ROOT/'docs/07-handoff/evidence/i3c-local-2026-10-27';dest.mkdir(parents=True,exist_ok=True);(dest/'atomic-scale.json').write_text(json.dumps({'status':'passed','scope':'Disposable actual PG17 transaction with outer3s statement timeout. Includes local process launch, excludes HTTP/identity/provider/cold/hosted/physical proof. Roster1 per date only; larger cross-product remains separate.', 'metrics':metrics},indent=2)+'\n')
 def test_program_planning_10_large_date_roster_product_and_audit_failure(self):
  a,b=self.academy();p=self.ready(a);rules=self.rules()
  for rule in rules.values():rule['capacity']=1001
  j=self.proposal(a,p,rules);players=json.loads(self.sql(f"with rows as(insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}','Synthetic large '||n,'synthetic large '||n from generate_series(1,1001)n returning id)select json_agg(id)from rows"))
  for day in [0,2,4]:
   for offset in range(0,len(players),25):j=self.mutation(a,j,'players',weekday=day,add=players[offset:offset+25])
  j=self.prepared(a,j);op=str(uuid.uuid4());q="begin;set local statement_timeout='3s';"+self.caller('user_owner','/rpc/r7_change_v1')+f"select public.r7_change_v1('{a}','{j['job']}','{op}',{j['version']},'activate');commit;"
  start=time.perf_counter();run=subprocess.run(self.base,input=q,text=True,capture_output=True);elapsed=(time.perf_counter()-start)*1000;self.assertEqual(run.returncode,0,run.stderr);self.assertIn('committed',run.stdout);self.assertEqual(self.sql(f"select count(*)from academy.date_rosters where academy_id='{a}'"),'40040');self.assertEqual(self.sql(f"select sum(roster_count)from academy.date_plans where academy_id='{a}'"),'40040')
  dest=ROOT/'docs/07-handoff/evidence/i3c-local-2026-10-27';dest.mkdir(parents=True,exist_ok=True);(dest/'large-roster.json').write_text(json.dumps({'status':'passed','scope':'Actual disposable PG17 activation; outer3s timeout, process-inclusive elapsed, no HTTP/hosted proof','dates':40,'players_each':1001,'roster_rows':40040,'elapsed_ms':elapsed,'observations':1},indent=2)+'\n')
  aa,bb=self.academy();pp=self.ready(aa);jj=self.prepared(aa,self.proposal(aa,pp));self.sql("create function academy.test_fail_program_audit()returns trigger language plpgsql as $$begin if new.action='program_plan.activate'then raise exception 'synthetic audit failure';end if;return new;end$$;create trigger test_program_audit before insert on academy.audit_events for each row execute function academy.test_fail_program_audit()")
  self.mutation(aa,jj,'activate',ok=False);self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{aa}'"),'0');self.assertEqual(self.proposal_read(aa,jj)['state'],'ready');self.sql('drop trigger test_program_audit on academy.audit_events');self.assertEqual(self.mutation(aa,jj,'activate')['state'],'committed')
if __name__=='__main__':import unittest;unittest.main(defaultTest='ProgramPlanningBoundary')
