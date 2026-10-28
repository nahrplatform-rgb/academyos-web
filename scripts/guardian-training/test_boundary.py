"""I4b actual disposable PG17; synthetic exact-link opt-ins only; no hosted grant."""
import runpy,json,uuid,unittest
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'attendance/test_boundary.py'));Base,ROOT=m['AttendanceBoundary'],m['ROOT']
G=runpy.run_path(str(Path(__file__).resolve().parents[1]/'guardians/test_boundary.py'))['GuardianBoundary']
class FamilyBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,'b11_links_v1':'b11_links_v1(gen_random_uuid())','b11_schedule_v1':"b11_schedule_v1(gen_random_uuid(),gen_random_uuid(),current_date)",'b11_detail_v1':'b11_detail_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())'}
 def guardian_command(self,*args,**kwargs):return G.command(self,*args,**kwargs)
 def guardian_recipient(self,*args,**kwargs):return G.recipient(self,*args,**kwargs)
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261028122658_i4b_guardian_training.sql').read_text())
 def family(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture()
  # Actual Guardian invitation acceptance uses the inherited canonical helpers.
  r,inv,tk,op,q=self.guardian_command(a,p=x)
  accepted=json.loads(self.guardian_recipient(inv,tk,'accept',str(uuid.uuid4())))
  link=accepted['link_id'];self.sql(f"insert into academy.guardian_training_access values('{link}',true)")
  return a,b,p,staff,x,dates,ev,link,inv
 def family_read(self,a,link,day,event=None,ok=True,who='user_guardian',after=None):
  q=f"select public.b11_detail_v1('{a}','{link}','{event}')"if event else f"select public.b11_schedule_v1('{a}','{link}','{day}'"+(f",'{after[0]}','{after[1]}'"if after else'')+")"
  raw=self.sql(q,who,ok=ok);return json.loads(raw)if ok else raw
 def test_zzz_family_01_current_own_projection_and_correction(self):
  a,b,p,staff,x,dates,ev,link,iv=self.family();day=self.sql(f"select(starts_at at time zone(projection->>'timezone'))::date from academy.publication_events where id='{ev}'")
  d=self.family_read(a,link,day,event=ev);self.assertIsNone(d['item']['status']);self.assertFalse(d['item']['corrected']);self.assertNotIn('players',d['item']);self.assertNotIn('capacity',d['item'])
  self.mark(a,ev,x);self.mark(a,ev,x,'user_owner',version=1,status='absent',reason='PRIVATE INTERNAL CORRECTION')
  d=self.family_read(a,link,day,event=ev);self.assertEqual(d['item']['status'],'absent');self.assertTrue(d['item']['corrected']);self.assertIsNotNone(d['item']['updated_at']);self.assertNotIn('PRIVATE',json.dumps(d));self.assertNotIn('actor',json.dumps(d));self.assertNotIn('reason',json.dumps(d));self.assertLess(len(json.dumps(d).encode()),32768)
  rows=self.family_read(a,link,day);self.assertEqual(rows['items'][0],d['item']);self.assertEqual(rows['context']['link'],link)
  self.assertEqual(len(self.family_read(a,link,'2000-01-01')['items']),0)
 def test_zzz_family_02_denials_optin_exactlink_and_ending(self):
  a,b,p,staff,x,dates,ev,link,iv=self.family();day='2026-10-28'
  for who in ['user_owner','user_platform','user_trainer','user_other','user_unknown']:
   self.family_read(a,link,day,event=ev,who=who,ok=False)
  foreign,br=self.academy('user_other_owner');self.family_read(foreign,link,day,event=ev,ok=False);self.family_read(a,str(uuid.uuid4()),day,event=ev,ok=False)
  self.sql(f"update academy.guardian_training_access set enabled=false where link_id='{link}'");self.family_read(a,link,day,event=ev,ok=False);self.assertEqual(json.loads(self.sql(f"select public.b11_links_v1('{a}')",'user_guardian'))['items'],[])
  self.sql(f"update academy.guardian_training_access set enabled=true where link_id='{link}'");self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='guardian'");self.family_read(a,link,day,event=ev,ok=False)
  self.sql(f"update academy.memberships set status='active'where academy_id='{a}'and role='guardian'");self.guardian_command(a,'end',iv,version=2,reason='Synthetic family test ended');self.family_read(a,link,day,event=ev,ok=False)
  self.sql('select *from academy.guardian_training_access','user_guardian',ok=False)
 def test_zzz_family_03_withdraw_and_sibling_without_roster(self):
  a,b,p,staff,x,dates,ev,link,iv=self.family();sibling=self.person(a,b)
  r,inv,tk,op,q=self.guardian_command(a,p=sibling);accepted=json.loads(self.guardian_recipient(inv,tk,'accept',str(uuid.uuid4())));other=accepted['link_id'];self.sql(f"insert into academy.guardian_training_access values('{other}',true)")
  self.family_read(a,other,dates[0],event=ev,ok=False)
  self.sql(f"delete from academy.publication_heads where event_id='{ev}'");self.family_read(a,link,dates[0],event=ev,ok=False);self.assertNotIn(ev,[r['id']for r in self.family_read(a,link,dates[0])['items']])
 def test_zzz_family_04_read_revoke_and_publication_lock_order(self):
  a,b,p,staff,x,dates,ev,link,iv=self.family()
  read=self.caller('user_guardian','/rpc/b11_detail_v1')+f"select public.b11_detail_v1('{a}','{link}','{ev}')"
  end=f"select academy.g3_lock('{a}');update academy.guardian_links set state='ended'where id='{link}'"
  self.observed_order(read,end);self.family_read(a,link,dates[0],event=ev,ok=False)
  self.sql(f"update academy.guardian_links set state='active'where id='{link}'")
  self.observed_order(f"select academy.t4_lock('{a}');delete from academy.publication_heads where event_id='{ev}'",read,second_ok=False)
 def test_zzz_family_04b_link_chooser_pages_pending_and_gateway(self):
  a,b,p,staff,x,dates,ev,link,iv=self.family()
  for i in range(26):
   child=self.person(a,b);r,inv,tk,op,q=self.guardian_command(a,p=child);accepted=json.loads(self.guardian_recipient(inv,tk,'accept',str(uuid.uuid4())));self.sql(f"insert into academy.guardian_training_access values('{accepted['link_id']}',true)")
  one=json.loads(self.sql(f"select public.b11_links_v1('{a}')",'user_guardian'));self.assertTrue(one['more']);self.assertEqual(len(one['items']),25);two=json.loads(self.sql(f"select public.b11_links_v1('{a}','{one['items'][-1]['id']}')",'user_guardian'));self.assertFalse(two['more']);self.assertEqual(len(two['items']),2);self.assertEqual(len(set(z['id']for z in one['items']+two['items'])),27)
  self.sql(f"update academy.guardian_invitations set state='pending',expires_at=now()-interval '1 hour'where id='{iv}'");self.family_read(a,link,dates[0],event=ev,ok=False)
  self.sql(f"select public.b11_detail_v1('{a}','{link}','{ev}')",'user_guardian',ok=False)
  for rpc,args in [('b11_links_v1',f"'{a}'"),('b11_detail_v1',f"'{a}','{link}','{ev}'"),('b11_schedule_v1',f"'{a}','{link}','2026-11-01'")]:
   self.sql(f"select public.{rpc}({args})",role='anon',ok=False)
  self.sql('select academy.b11_player(gen_random_uuid(),gen_random_uuid())','user_guardian',ok=False)
 def test_zzz_family_05_thousand_sessions_equal_time_cursor_bytes_and_history(self):
  a,b,p,staff,x,dates,ev,link,iv=self.family()
  # Administrator-only disposable workload, not a product write or hosted grant.
  self.sql(f"""do $$declare np uuid;nj uuid;ne uuid;i integer;src academy.publication_events;begin
  select *into src from academy.publication_events where id='{ev}';
  for i in 1..1000 loop np:=gen_random_uuid();nj:=gen_random_uuid();ne:=gen_random_uuid();
  insert into academy.training_programs select(jsonb_populate_record(null::academy.training_programs,to_jsonb(z)||jsonb_build_object('id',np))).*from academy.training_programs z where z.id=src.program_id;
  insert into academy.training_dates select(jsonb_populate_record(null::academy.training_dates,to_jsonb(z)||jsonb_build_object('program_id',np))).*from academy.training_dates z where z.program_id=src.program_id and z.local_date=src.day;
  insert into academy.date_plans select(jsonb_populate_record(null::academy.date_plans,to_jsonb(z)||jsonb_build_object('program_id',np))).*from academy.date_plans z where z.program_id=src.program_id and z.local_date=src.day;
  insert into academy.publication_jobs select(jsonb_populate_record(null::academy.publication_jobs,to_jsonb(z)||jsonb_build_object('id',nj,'program_id',np))).*from academy.publication_jobs z where z.id=src.job_id;
  insert into academy.publication_events select(jsonb_populate_record(null::academy.publication_events,to_jsonb(src)||jsonb_build_object('id',ne,'program_id',np,'job_id',nj,'projection',src.projection||jsonb_build_object('name',repeat('界',160))))).*;
  insert into academy.publication_heads values('{a}',np,src.day,ne);insert into academy.publication_rosters values(ne,'{x}','Synthetic player');
  end loop;end$$""")
  day=self.sql(f"select(starts_at at time zone(projection->>'timezone'))::date from academy.publication_events where id='{ev}'")
  seen=[];after=None
  while True:
   r=self.family_read(a,link,day,after=after);self.assertLess(len(json.dumps({"data":r},ensure_ascii=False).encode()),32768);self.assertLessEqual(len(r['items']),25);seen.extend(z['id']for z in r['items'])
   if not r['more']:break
   self.assertTrue(r['items']);last=r['items'][-1];after=(last['starts_at'],last['id'])
  self.assertEqual(len(seen),1001);self.assertEqual(len(set(seen)),1001)
  timing=json.loads(self.sql("create temporary table measured(ms double precision);do $$declare started timestamptz;begin for i in 1..40 loop started:=clock_timestamp();perform public.b11_schedule_v1('"+a+"','"+link+"','"+day+"');insert into measured values(extract(epoch from clock_timestamp()-started)*1000);end loop;end$$;select json_build_object('samples',count(*),'p95_ms',percentile_cont(0.95)within group(order by ms),'max_ms',max(ms))from measured",'user_guardian'))
  self.assertLess(timing['p95_ms'],300)
  out=ROOT/'docs/07-handoff/evidence/i4b-local-2026-10-28';out.mkdir(parents=True,exist_ok=True);(out/'sql-scale.json').write_text(json.dumps({'scope':'Disposable PG17:1001 same-time own published sessions;40 warm SQL reads; excludes hosted/network/device/cost proof','metrics':timing,'unique_events':len(seen)},indent=2)+'\n')
if __name__=='__main__':
 suite=unittest.TestSuite();suite.addTests(unittest.defaultTestLoader.loadTestsFromNames([n for n in unittest.defaultTestLoader.getTestCaseNames(FamilyBoundary)if n.startswith('test_zzz_family_')],FamilyBoundary));r=unittest.TextTestRunner(verbosity=2).run(suite);raise SystemExit(not r.wasSuccessful())
