"""EX-13B disposable PG17 contracts. Never connects to hosted staging."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import runpy
import re
import select
import subprocess
import threading
import time
import unittest
import uuid

module = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'experience-projections/test_boundary.py'))
Base, ROOT = module['ExperienceBoundary'], module['ROOT']
MIGRATION = 'supabase/migrations/20261105003702_owner_workspace_transfer_contract.sql'


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


class WorkspaceBoundary(Base):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        try:
            for filename in [
                '20261103165604_owner_register_download_contract.sql',
                '20261104002448_owner_register_original_dispatch.sql',
                '20261104012057_owner_register_key_custody.sql',
                '20261104013632_owner_register_bound_transport.sql',
                Path(MIGRATION).name,
            ]:
                cls.sql((ROOT / 'supabase/migrations' / filename).read_text())
        except Exception:
            super().tearDownClass()
            raise

    def key(self, academy, device=None, namespace=None, who='user_owner', act='prepare', ok=True):
        device, namespace = device or str(uuid.uuid4()), namespace or str(uuid.uuid4())
        envelope = literal('A' * 80) if act == 'prepare' else 'null'
        raw = self.sql(f"select public.x21_workspace_key_v1('{academy}','{device}',{literal(who)},'{act}','{namespace}',{envelope})", who, ok=ok)
        return json.loads(raw) if ok else raw

    def download(self, academy, slot, act='manifest', previous=None, month='2099-11-01', who='user_owner', ok=True):
        query = self.query(academy, slot, act, previous, month, who)
        raw = self.sql(query, who, ok=ok)
        return json.loads(raw) if ok else raw

    @staticmethod
    def query(academy, slot, act='manifest', previous=None, month='2099-11-01', who='user_owner'):
        prior = 'null' if previous is None else literal(json.dumps(previous)) + '::jsonb'
        anchor = literal(month) if act == 'manifest' and month is not None else 'null'
        return f"select public.x21_workspace_transfer_v1('{academy}','{slot['device']}','{slot['namespace']}',{literal(who)},'{act}',{prior},{anchor})"

    def revision(self, academy):
        return json.loads(self.sql(f"select json_build_object('people',coalesce((select people from academy.workspace_revisions where academy_id='{academy}'),0),'calendar',coalesce((select calendar from academy.workspace_revisions where academy_id='{academy}'),0))"))

    def transfer(self, academy, slot, collection='people', manifest=None):
        manifest = manifest or self.download(academy, slot)
        receipt = next(c['receipt'] for c in manifest['collections'] if c['id'] == collection)
        rows, pages = [], []
        while True:
            page = self.download(academy, slot, 'page', receipt)
            self.assertEqual(page['kind'], 'page')
            pages.append(page)
            rows.extend(page['items'])
            receipt = page['receipt']
            self.assertLess(len(json.dumps(page, ensure_ascii=False).encode()), 32768)
            self.assertLessEqual(len(page['items']), 25 if collection == 'people' else 50)
            if not page['more']:
                break
            self.assertLess(len(pages), 2000, 'No cycling cursor')
        final = self.download(academy, slot, 'complete', receipt)
        self.assertEqual(final['kind'], 'complete')
        self.assertEqual(len(rows), final['total'])
        return rows, pages, final

    def seed_people(self, academy, branch, count, wide=False):
        name = "repeat('界',160)" if wide else "'Synthetic player '||n"
        self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name) select '{academy}','{branch}',{name},'synthetic '||n from generate_series(1,{count})n")

    def test_workspace_01_empty_and_default_months(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        manifest = self.download(academy, slot, month=None)
        self.assertEqual(len(manifest['collections']), 4)
        today = self.sql("select(clock_timestamp() at time zone 'Africa/Cairo')::date")
        self.assertEqual(manifest['today'], today)
        self.assertEqual(manifest['month'], today[:7] + '-01')
        self.assertEqual(manifest['field_epoch'], 1)
        for collection in manifest['collections']:
            rows, pages, final = self.transfer(academy, slot, collection['id'], manifest)
            self.assertEqual(rows, [])
            self.assertEqual(len(pages), 1)
            self.assertEqual(final['receipt']['payload']['phase'], 'complete')
        self.download(academy, slot, month='2099-11-02', ok=False)

    def test_workspace_02_people_all_branches_page_boundaries_and_allowlist(self):
        for count in [25, 26, 1000]:
            academy, branch = self.academy()
            slot = self.key(academy)
            before = self.revision(academy)
            self.seed_people(academy, branch, count)
            self.assertEqual(self.revision(academy)['people'], before['people'] + 1, 'One revision per statement')
            rows, pages, final = self.transfer(academy, slot)
            self.assertEqual(len(rows), count)
            self.assertEqual(len(pages), (count + 24) // 25)
            self.assertEqual(len({r['id'] for r in rows}), count)
            self.assertEqual(set(rows[0]), {'id', 'display_name', 'branch_id', 'branch_name'})
        other = self.sql(f"insert into academy.branches(academy_id,name)values('{academy}','Synthetic other branch')returning id")
        self.seed_people(academy, other, 1)
        self.sql(f"update academy.players set contact_email='private@example.invalid'where academy_id='{academy}'")
        rows, _, _ = self.transfer(academy, slot)
        self.assertIn(other, {r['branch_id'] for r in rows})
        self.assertNotIn('private@example.invalid', json.dumps(rows))

    def test_workspace_03_roles_scopes_and_signed_caller(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        manifest = self.download(academy, slot)
        receipt = manifest['collections'][0]['receipt']
        for who in ['user_platform', 'user_trainer', 'user_guardian', 'user_unknown', 'user_other_owner']:
            self.download(academy, slot, who=who, ok=False)
            self.download(academy, slot, 'page', receipt, who=who, ok=False)
            self.key(academy, who=who, ok=False)
        other, _ = self.academy('user_other_owner')
        self.download(other, slot, who='user_other_owner', ok=False)
        for key in ['device', 'namespace']:
            self.download(academy, {**slot, key: str(uuid.uuid4())}, ok=False)
        stmt = self.query(academy, slot)
        for options in [dict(method='GET'), dict(proof_subject='user_unknown'), dict(proof_path='/rpc/x20_register_download_v1'), dict(delta=-61)]:
            self.sql('begin;' + self.caller('user_owner', '/rpc/x21_workspace_transfer_v1', **options) + stmt + ';commit;', ok=False)
        self.sql('begin;set local role authenticated;' + stmt + ';commit;', ok=False)
        self.sql(f"update academy.memberships set status='suspended'where academy_id='{academy}'and role='owner'")
        self.download(academy, slot, ok=False)

    def test_workspace_04_acls_and_separate_register_namespace(self):
        for relation in ['workspace_revisions', 'owner_workspace_keys', 'x21_people_rows', 'x21_calendar_rows']:
            for role in ['anon', 'authenticated']:
                self.assertEqual(self.sql(f"select has_table_privilege('{role}','academy.{relation}','select')"), 'f')
        self.assertEqual(self.sql("select bool_or(has_function_privilege('authenticated',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='academy'and p.proname like 'x21_%'"), 'f')
        self.assertEqual(self.sql("select bool_or(has_function_privilege('anon',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname like 'x21_%'"), 'f')
        academy, branch = self.academy()
        before = self.sql("select count(*)from academy.owner_register_keys")
        slot = self.key(academy)
        self.download(academy, slot)
        self.assertEqual(self.sql("select count(*)from academy.owner_register_keys"), before)
        self.assertEqual(self.sql("select bool_and(relrowsecurity)from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='academy'and c.relname in('workspace_revisions','owner_workspace_keys')"), 't')

    def test_workspace_05_registration_concurrent_replay_and_devices(self):
        academy, _ = self.academy()
        device = str(uuid.uuid4())
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda _: self.key(academy, device), range(5)))
        self.assertEqual(len({r['namespace'] for r in results}), 1)
        first = results[0]
        self.assertEqual(self.key(academy, device, first['namespace'], act='recover')['wrapped'], first['wrapped'])
        self.key(academy, device, act='recover', ok=False)
        second = self.key(academy)
        self.assertNotEqual(first['namespace'], second['namespace'])
        self.assertEqual(self.sql(f"select count(*)from academy.audit_events where academy_id='{academy}'and action='workspace.local_device_prepared'"), '2')

    def test_workspace_06_tamper_and_incomplete_transfer(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        self.seed_people(academy, branch, 26)
        seed = self.download(academy, slot)['collections'][0]['receipt']
        self.download(academy, slot, 'complete', seed, ok=False)
        for field, value in [('seen', 26), ('dataset', 'calendar'), ('revision', '999'), ('issued', 0), ('a', str(uuid.uuid4()))]:
            bad = json.loads(json.dumps(seed))
            bad['payload'][field] = value
            self.download(academy, slot, 'page', bad, ok=False)
        for key in seed['payload']:
            bad = json.loads(json.dumps(seed))
            del bad['payload'][key]
            self.download(academy, slot, 'page', bad, ok=False)
        page = self.download(academy, slot, 'page', seed)
        self.download(academy, slot, 'complete', page['receipt'], ok=False)
        again = self.download(academy, slot, 'page', seed)
        self.assertEqual(page['items'], again['items'])
        self.assertEqual(page['receipt']['payload']['acc'], again['receipt']['payload']['acc'])

    def test_workspace_07_changed_insert_name_and_removal(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        initial = self.download(academy, slot)
        self.seed_people(academy, branch, 26)
        self.assertEqual(self.download(academy, slot, 'page', initial['collections'][0]['receipt']), {'error': 'changed'})
        current = self.download(academy, slot)
        page = self.download(academy, slot, 'page', current['collections'][0]['receipt'])
        self.sql(f"update academy.players set display_name='Synthetic renamed'where id='{page['items'][0]['id']}'")
        self.assertEqual(self.download(academy, slot, 'page', page['receipt']), {'error': 'changed'})
        rows, pages, final = self.transfer(academy, slot)
        last = pages[-1]['receipt']
        self.sql(f"delete from academy.players where id='{rows[-1]['id']}'")
        self.assertEqual(self.download(academy, slot, 'complete', last), {'error': 'changed'})
        self.assertEqual(len(self.transfer(academy, slot)[0]), 25)

    def test_workspace_08_expired_resume_preserves_progress(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        self.seed_people(academy, branch, 26)
        seed = self.download(academy, slot)['collections'][0]['receipt']
        page = self.download(academy, slot, 'page', seed)
        payload = page['receipt']['payload'].copy()
        payload['issued'] -= 601
        expired = json.loads(self.sql(f"select academy.x21_receipt('user_owner',{literal(json.dumps(payload))}::jsonb)"))
        self.assertEqual(self.download(academy, slot, 'page', expired), {'error': 'expired'})
        resumed = self.download(academy, slot, 'resume', expired)['receipt']
        self.assertEqual(resumed['payload']['seen'], 25)
        self.assertEqual(resumed['payload']['acc'], payload['acc'])
        last = self.download(academy, slot, 'page', resumed)
        self.assertEqual(len(last['items']), 1)
        self.assertEqual(self.download(academy, slot, 'complete', last['receipt'])['total'], 26)

    def test_workspace_09_calendar_parity_multiple_pages_and_canonical_keys(self):
        academy, branch, program, staff, invitation, player, dates = self.fixture()
        for _ in range(4):
            clone = str(uuid.uuid4())
            self.sql(f"insert into academy.training_programs select(jsonb_populate_record(null::academy.training_programs,to_jsonb(p)||jsonb_build_object('id','{clone}'))).*from academy.training_programs p where id='{program['id']}';insert into academy.training_dates select(jsonb_populate_record(null::academy.training_dates,to_jsonb(d)||jsonb_build_object('program_id','{clone}'))).*from academy.training_dates d where program_id='{program['id']}'")
        slot = self.key(academy)
        manifest = self.download(academy, slot)
        rows, pages, final = self.transfer(academy, slot, 'calendar:2099-11', manifest)
        self.assertGreater(len(rows), 50)
        self.assertGreater(len(pages), 1)
        self.assertEqual(len({(r['program'], r['day']) for r in rows}), len(rows))
        self.assertLess(len({r['id'] for r in rows}), len(rows), 'Draft id alone is not a date key')
        ticket = manifest['collections'][1]['receipt']['payload']
        legacy = self.calendar(academy, first=ticket['first'], last=ticket['last'])
        old_rows = legacy['items'][:]
        while legacy['more']:
            legacy = self.calendar(academy, first=ticket['first'], last=ticket['last'], cursor=legacy['next'])
            old_rows.extend(legacy['items'])
        def normalize(row):
            import datetime
            row = {k: v for k, v in row.items() if k != 'cursor'}
            for k in ['starts_at', 'ends_at']:
                row[k] = datetime.datetime.fromisoformat(row[k]).astimezone(datetime.timezone.utc).isoformat()
            return row
        ordered = lambda values: sorted((normalize(r) for r in values), key=lambda r: (r['program'], r['day']))
        self.assertEqual(ordered(rows), ordered(old_rows))
        self.assertEqual(set(rows[0]), {'id','program','day','date','starts_at','ends_at','title','branch','sport','sport_ar','timezone','state','published','capacity','roster_count'})

    def test_workspace_10_projection_revisions_and_ignored_fields(self):
        academy, branch, program, staff, invitation, player, dates = self.fixture()
        slot = self.key(academy)
        before = self.revision(academy)
        self.sql(f"update academy.players set display_name=display_name,contact_email='private@example.invalid',created_at=created_at+interval '1 second'where academy_id='{academy}'")
        self.assertEqual(self.revision(academy), before)
        self.sql(f"update academy.players set display_name='Synthetic new name'where id='{player}'")
        after = self.revision(academy)
        self.assertEqual(after['people'], before['people']+1)
        self.assertEqual(after['calendar'], before['calendar'])
        before = after
        self.sql(f"update academy.date_plans set capacity=capacity+1 where program_id='{program['id']}'")
        after = self.revision(academy)
        self.assertEqual(after['calendar'], before['calendar']+1, 'One bump for many dates')
        before = after
        self.sql(f"update academy.training_programs set definition=jsonb_set(definition,'{{name}}','\"Synthetic title\"')where id='{program['id']}'")
        self.assertEqual(self.revision(academy)['calendar'], before['calendar']+1)
        before = self.revision(academy)
        self.sql(f"update academy.sports set label_ar='رياضة خيالية'where academy_id='{academy}'")
        self.assertEqual(self.revision(academy)['calendar'], before['calendar']+1)
        self.assertEqual(self.revision(academy)['people'], before['people'])
        before = self.revision(academy)
        self.sql(f"update academy.branches set name='Synthetic renamed branch'where id='{branch}'")
        self.assertEqual(self.revision(academy), {k: v+1 for k,v in before.items()})
        self.assertEqual(self.transfer(academy, slot)[0][0]['branch_name'], 'Synthetic renamed branch')
        other, _ = self.academy('user_other_owner')
        before = self.revision(academy)
        self.sql(f"update academy.academies set name='Synthetic other rename'where id='{other}'")
        self.assertEqual(self.revision(academy), before)

    def test_workspace_11_ready_publish_withdraw_and_move(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        definition = self.definition()
        definition.update({'from':'2099-11-01','to':'2100-01-31'})
        program = json.loads(self.command(academy, definition))
        while program['completed'] < program['windows']:
            program = json.loads(self.step(academy, program))
        self.assertEqual(self.transfer(academy, slot, 'calendar:2099-11')[0], [])
        receipt = self.download(academy, slot)['collections'][1]['receipt']
        before = self.revision(academy)
        program = json.loads(self.step(academy, program, 'finalize'))
        self.assertGreater(self.revision(academy)['calendar'], before['calendar'])
        self.assertEqual(self.download(academy, slot, 'page', receipt), {'error':'changed'})
        # Canonical publication path, then retained withdrawal/move semantics.
        staff, invitation = self.staff(academy, branch)
        player = self.person(academy, branch)
        dates = json.loads(self.sql(f"select json_agg(local_date order by local_date)from academy.training_dates where program_id='{program['id']}'"))
        rules = {str(day):{'capacity':3,'trainer':staff} for day in [0,2,4]}
        planning = json.loads(self.sql(f"select public.r7_create_v1('{academy}','{program['id']}','{uuid.uuid4()}','2099-11-01','2100-01-31',{literal(json.dumps(rules))}::jsonb)", 'user_owner'))
        for weekday in [0,2,4]:
            planning = self.mutation(academy,planning,'players',weekday=weekday,add=[player])
        planning = self.prepared(academy,planning)
        before = self.revision(academy)
        self.sql("create function academy.x21_synthetic_plan_fail()returns trigger language plpgsql as $$begin if new.local_date=TG_ARGV[0]::date then raise exception 'Synthetic last-date failure';end if;return new;end$$")
        self.sql(f"create trigger x21_synthetic_plan_fail before insert on academy.date_plans for each row execute function academy.x21_synthetic_plan_fail('{dates[-1]}')")
        try:
            self.mutation(academy,planning,'activate',ok=False)
            self.assertEqual(self.revision(academy),before,'Failed whole-program activation rolls revisions back too')
            self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{academy}'"),'0')
        finally:
            self.sql('drop trigger x21_synthetic_plan_fail on academy.date_plans')
        self.assertEqual(self.mutation(academy,planning,'activate')['state'],'committed')
        self.assertGreater(self.revision(academy)['calendar'],before['calendar'])
        job = self.prepare_pub(academy, self.pub(academy, program))
        before = self.revision(academy)
        self.mutate(academy, job, 'activate')
        self.assertGreater(self.revision(academy)['calendar'], before['calendar'])
        rows, _, _ = self.transfer(academy, slot, 'calendar:2099-11')
        self.assertTrue(all(r['published'] for r in rows))
        job = self.prepare_pub(academy, self.pub(academy, program, 'withdraw'))
        self.mutate(academy, job, 'activate')
        receipt = self.download(academy, slot)['collections'][1]['receipt']
        day = dates[0]
        self.assertTrue(self.change(academy,program,day,new='2100-02-01')['changed'])
        self.assertEqual(self.download(academy, slot, 'page', receipt), {'error':'changed'})
        self.assertNotIn(day, [r['day'] for r in self.transfer(academy, slot, 'calendar:2099-11')[0]])
        moved = [r for r in self.transfer(academy, slot, 'calendar:2100-02', self.download(academy, slot, month='2100-02-01'))[0] if r['day']==day]
        self.assertEqual(moved[0]['state'], 'moved')
        self.assertTrue(self.change(academy,program,day,kind='cancel')['changed'])
        cancelled = [r for r in self.transfer(academy, slot, 'calendar:2100-02', self.download(academy, slot, month='2100-02-01'))[0] if r['day']==day]
        self.assertEqual(cancelled[0]['state'], 'cancelled')

    def test_workspace_12_scope_change_and_big_revision(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        manifest = self.download(academy, slot)
        before = self.revision(academy)
        self.sql(f"update academy.academies set name='Synthetic academy renamed'where id='{academy}'")
        self.assertEqual(self.revision(academy), {k:v+1 for k,v in before.items()})
        self.assertEqual(self.download(academy, slot, 'page', manifest['collections'][0]['receipt']), {'error':'changed'})
        self.sql(f"update academy.workspace_revisions set people=9007199254740992 where academy_id='{academy}'")
        self.assertEqual(self.download(academy, slot)['revisions']['people'], '9007199254740992')
        self.sql(f"update academy.academies set setup_complete=false where id='{academy}'")
        self.download(academy, slot, ok=False)

    def test_workspace_13_atomic_revision_rollback_and_concurrent_inserts(self):
        academy, branch = self.academy()
        before = self.revision(academy)
        self.sql("create function academy.x21_synthetic_audit_fail()returns trigger language plpgsql as $$begin raise exception 'Synthetic rollback';end$$;create trigger x21_synthetic_fail before insert on academy.audit_events for each row execute function academy.x21_synthetic_audit_fail()")
        try:
            self.sql(f"select public.i2_register_v1('{academy}','{branch}','{uuid.uuid4()}','Synthetic rejected',null,0,false)", 'user_owner', ok=False)
            self.assertEqual(self.revision(academy), before)
            self.assertEqual(self.sql(f"select count(*)from academy.players where academy_id='{academy}'"), '0')
        finally:
            self.sql('drop trigger x21_synthetic_fail on academy.audit_events')
        def add(n):
            return self.sql(f"select public.i2_register_v1('{academy}','{branch}','{uuid.uuid4()}','Synthetic concurrent {n}',null,0,false)", 'user_owner')
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
            list(pool.map(add, range(10)))
        self.assertEqual(self.revision(academy)['people'], before['people']+10)
        self.assertEqual(self.sql(f"select count(*)from academy.players where academy_id='{academy}'"), '10')

    def test_workspace_14_manifest_and_completion_do_not_scan_collections(self):
        academy, branch = self.academy()
        slot = self.key(academy)
        self.seed_people(academy, branch, 1000)
        _, pages, _ = self.transfer(academy, slot)
        for act, previous in [('manifest',None),('complete',pages[-1]['receipt']),('resume',pages[0]['receipt'])]:
            query = self.query(academy, slot, act, previous)
            stats = self.sql('begin;'+self.caller('user_owner','/rpc/x21_workspace_transfer_v1')+query+";reset role;select coalesce(json_agg(json_build_object('table',relname,'sequential_rows',seq_tup_read,'index_rows',idx_tup_fetch)),'[]')from pg_stat_xact_user_tables where schemaname='academy'and relname in('players','training_dates');commit;")
            for record in json.loads(stats):
                self.assertEqual(record['sequential_rows']+record['index_rows'], 0, (act,record))

    def test_workspace_15_unicode_bytes_and_minimal_calendar(self):
        academy, branch, program, staff, invitation, player, dates = self.fixture()
        self.sql(f"update academy.branches set name=repeat('界',100)where id='{branch}';update academy.sports set label_en=repeat('界',100),label_ar=repeat('ع',100)where academy_id='{academy}';update academy.training_programs set definition=jsonb_set(definition,'{{name}}',to_jsonb(repeat('界',160)))||'{{\"private_staff_text\":\"never transfer\"}}'::jsonb where id='{program['id']}'")
        for _ in range(4):
            clone = str(uuid.uuid4())
            self.sql(f"insert into academy.training_programs select(jsonb_populate_record(null::academy.training_programs,to_jsonb(p)||jsonb_build_object('id','{clone}'))).*from academy.training_programs p where id='{program['id']}';insert into academy.training_dates select(jsonb_populate_record(null::academy.training_dates,to_jsonb(d)||jsonb_build_object('program_id','{clone}'))).*from academy.training_dates d where program_id='{program['id']}'")
        slot = self.key(academy)
        rows, pages, _ = self.transfer(academy, slot, 'calendar:2099-11')
        self.assertLess(len(pages[0]['items']), 50)
        self.assertNotIn('never transfer', json.dumps(rows))
        for page in pages:
            self.assertLessEqual(len(json.dumps(page['items'],ensure_ascii=False).encode()), 24576)
        self.seed_people(academy, branch, 100, True)
        rows, pages, _ = self.transfer(academy, slot)
        self.assertEqual(len(rows), 101)

    def test_workspace_16_existing_register_authority_replay_and_storage_unchanged(self):
        academy, branch, program, staff, invitation, player, dates, event = self.attendance_fixture()
        register_device, register_ns = str(uuid.uuid4()), str(uuid.uuid4())
        self.sql(f"select public.x19_owner_register_key_v1('{academy}','{event}','{register_device}','user_owner','prepare','{register_ns}','{'B'*80}')", 'user_owner')
        register_before = self.sql(f"select md5(jsonb_agg(to_jsonb(k))::text)from academy.owner_register_keys k where academy_id='{academy}'")
        slot = self.key(academy)
        self.transfer(academy, slot)
        self.assertEqual(register_before, self.sql(f"select md5(jsonb_agg(to_jsonb(k))::text)from academy.owner_register_keys k where academy_id='{academy}'"))
        prior = self.revision(academy)
        operation = str(uuid.uuid4())
        marks = literal(json.dumps([{'player':player,'status':'present','version':0}]))
        captured = self.sql('select clock_timestamp()')
        command = f"select public.a10_register_v1('{academy}','{event}',{marks},{literal(captured)},'{operation}')"
        first = json.loads(self.sql(command, 'user_owner'))
        self.assertEqual(first['count'], 1)
        self.assertEqual(json.loads(self.sql(command, 'user_owner')), first)
        changed_capture = command.replace(literal(captured), "clock_timestamp()+interval '1 second'")
        self.assertEqual(json.loads(self.sql(changed_capture, 'user_owner')), {'error':'conflict'})
        self.assertEqual(self.revision(academy), prior, 'Attendance is a separate collection')
        old = json.loads(self.sql(f"select public.x20_register_download_v1('{academy}','{event}','manifest',null,null,null,'{register_device}','{register_ns}','user_owner')", 'user_owner'))
        self.assertEqual(old['header']['saved'], 1)

    def test_workspace_17_fixed_snapshot_under_observed_concurrent_commit(self):
        # Preserve the full function body; the ordinary sql() helper returns its last line.
        definition = subprocess.check_output(self.base + ['-c', "select pg_get_functiondef('academy.x21_snapshot(text,uuid,uuid,uuid,jsonb,boolean)'::regprocedure)"], text=True).strip()
        marker = 'if not want_rows then return result; end if;'
        self.assertEqual(definition.count(marker), 1)
        observations = []
        try:
            for stable in [True, False]:
                academy, branch = self.academy()
                slot = self.key(academy)
                self.seed_people(academy, branch, 26)
                seed = self.download(academy, slot)['collections'][0]['receipt']
                tag = uuid.uuid4().int % (2**60)
                patched = definition.replace(marker, marker + f' perform pg_advisory_xact_lock({tag});')
                if not stable:
                    self.assertIn(' STABLE', patched)
                    patched = patched.replace(' STABLE', ' VOLATILE', 1)
                self.sql(patched)
                holder = subprocess.Popen(self.base, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
                reader = None
                try:
                    holder.stdin.write(f'\\o /dev/null\nbegin;select pg_advisory_xact_lock({tag});\n\\o\nselect pg_backend_pid();\n')
                    holder.stdin.flush()
                    pid, deadline = None, time.monotonic()+5
                    while time.monotonic()<deadline:
                        readable, _, _ = select.select([holder.stdout], [], [], .1)
                        if readable:
                            line = holder.stdout.readline().strip()
                            if line.isdigit():
                                pid = int(line)
                                break
                    self.assertIsNotNone(pid, 'Fixture barrier acquired')
                    name = 'x21_snapshot_' + uuid.uuid4().hex
                    reader = subprocess.Popen(self.base, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    query = self.query(academy, slot, 'page', seed)
                    reader.stdin.write(f"begin;set local application_name='{name}';"+self.caller('user_owner','/rpc/x21_workspace_transfer_v1')+query+';commit;\n')
                    reader.stdin.close()
                    blocked, deadline = False, time.monotonic()+2
                    while time.monotonic()<deadline:
                        blocked = self.sql(f"select exists(select from pg_stat_activity where application_name='{name}'and {pid}=any(pg_blocking_pids(pid)))") == 't'
                        if blocked:
                            break
                        self.assertIsNone(reader.poll(), 'Read must reach the after-metadata barrier')
                    self.assertTrue(blocked, 'Concurrent boundary observed, not a timing guess')
                    self.seed_people(academy, branch, 1)
                    self.assertNotEqual(self.download(academy, slot)['revisions']['people'], seed['payload']['revision'])
                    holder.stdin.write('commit;\n\\q\n')
                    holder.stdin.flush()
                    holder.wait(timeout=5)
                    reader.wait(timeout=5)
                    self.assertEqual(reader.returncode, 0, reader.stderr.read())
                    page = json.loads(reader.stdout.read().strip().splitlines()[-1])
                    self.assertEqual(page['revision'], seed['payload']['revision'])
                    self.assertEqual(page['total'], 26 if stable else 27)
                    observations.append({'stable':stable,'total':page['total'],'revision':page['revision'],'interleaving':'writer committed after metadata before count/page'})
                finally:
                    for process in [holder, reader]:
                        if process is None:
                            continue
                        if process.poll() is None:
                            process.kill()
                            process.wait()
                        for stream in [process.stdin, process.stdout, process.stderr]:
                            if stream and not stream.closed:
                                stream.close()
                self.sql(definition)
        finally:
            self.sql(definition)
        destination = Path(os.environ.get('WORKSPACE_TRANSFER_EVIDENCE_DIR','/private/tmp/academyos-workspace-transfer'))
        destination.mkdir(parents=True,exist_ok=True)
        (destination/'snapshot-interleaving.json').write_text(json.dumps(observations,indent=2)+'\n')

    def test_workspace_18_successor_owner_cannot_reuse_receipt(self):
        academy, branch = self.academy()
        self.academy('user_other_owner')
        first = self.key(academy)
        seed = self.download(academy, first)['collections'][0]['receipt']
        self.assertEqual(self.transfer(academy, first)[0], [])
        # Preserve the existing one-active-Owner constraint; never weaken it for a test.
        self.sql(f"begin;update academy.memberships set status='suspended'where academy_id='{academy}'and role='owner';insert into academy.memberships(academy_id,identity_id,role,status)select '{academy}',id,'owner','active'from academy.identities where clerk_subject='user_other_owner';commit;")
        second = self.key(academy, who='user_other_owner')
        self.download(academy, second, 'page', seed, who='user_other_owner', ok=False)
        self.download(academy, first, ok=False)
        self.sql(f"select academy.x21_proof({literal(json.dumps(seed))}::jsonb,'user_other_owner','{academy}','{first['device']}','{first['namespace']}')",ok=False)
        self.assertEqual(self.download(academy, second, who='user_other_owner')['subject'], 'user_other_owner')

    def test_workspace_19_calendar_changed_after_last_page_and_scope_switch(self):
        academy, branch, program, staff, invitation, player, dates = self.fixture()
        slot = self.key(academy)
        rows, pages, _ = self.transfer(academy, slot, 'calendar:2099-11')
        self.sql(f"update academy.training_dates set canceled=true where program_id='{program['id']}'and local_date='{rows[0]['day']}'")
        self.assertEqual(self.download(academy, slot, 'complete', pages[-1]['receipt']), {'error':'changed'})
        manifest = self.download(academy, slot)
        other_branch = self.sql(f"insert into academy.branches(academy_id,name)values('{academy}','Synthetic branch selection')returning id")
        self.sql(f"update academy.initial_setup set branch_id='{other_branch}'where academy_id='{academy}'")
        self.assertEqual(self.download(academy, slot, 'resume', manifest['collections'][1]['receipt']), {'error':'changed'})
        self.assertEqual(self.transfer(academy, slot, 'calendar:2099-11')[0], [])

    def test_workspace_20_keyset_query_plans(self):
        academy, branch, program, staff, invitation, player, dates = self.fixture()
        self.seed_people(academy, branch, 10000)
        self.sql(f"create temporary table x21_test_program_ids as select gen_random_uuid() id from generate_series(1,300);"
                 f"insert into academy.training_programs select(jsonb_populate_record(null::academy.training_programs,to_jsonb(p)||jsonb_build_object('id',n.id))).*from academy.training_programs p cross join x21_test_program_ids n where p.id='{program['id']}';"
                 f"insert into academy.training_dates select(jsonb_populate_record(null::academy.training_dates,to_jsonb(d)||jsonb_build_object('program_id',n.id))).*from academy.training_dates d cross join x21_test_program_ids n where d.program_id='{program['id']}';"
                 "analyze academy.players;analyze academy.training_dates;analyze academy.training_programs;"
                 "analyze academy.branches;analyze academy.initial_setup;analyze academy.sports;"
                 "analyze academy.date_plans;analyze academy.publication_heads;analyze academy.publication_events;")
        cursor = self.sql(f"select id from academy.players where academy_id='{academy}'order by id offset 5000 limit 1")
        slot = self.key(academy)
        manifest = self.download(academy,slot)
        context = manifest['context']
        calendar_cursor = {'date':'2099-11-14','at':'2099-11-14T00:00:00.000000Z',
                           'program':'00000000-0000-4000-8000-000000000001','day':'2099-11-14'}
        # Explain the exact page statement from the migration, not a simpler lookalike.
        source = (ROOT/MIGRATION).read_text()
        start = source.index('    with window_dates as materialized (')
        end = source.index('    ) q;',start)+len('    ) q;')
        calendar_query = re.sub(r'\binto items\b','',source[start:end])
        replacements = {'a':literal(academy)+'::uuid','p':literal(json.dumps({'first':'2099-11-01','last':'2099-12-12'}))+'::jsonb',
                        'ctx':literal(json.dumps(context))+'::jsonb','cursor':literal(json.dumps(calendar_cursor))+'::jsonb'}
        calendar_query = re.sub(r'\b(a|p|ctx|cursor)\b',lambda m:replacements[m[0]],calendar_query)
        queries = {
            'people': (f"select id,display_name,branch_id,branch_name from academy.x21_people_rows "
                       f"where academy_id='{academy}'and id>'{cursor}'order by id limit 26", 'players', 26),
            'calendar': (calendar_query,'training_dates',1),
        }
        evidence = {}
        for name, (query, relation, bound) in queries.items():
            plan = json.loads(subprocess.check_output(self.base + ['-c', 'explain(analyze,buffers,format json) '+query], text=True))[0]
            def nodes(node):
                yield node
                for child in node.get('Plans', []):
                    yield from nodes(child)
            indexes = [n['Index Name'] for n in nodes(plan['Plan']) if 'Index Name' in n]
            scans = [n for n in nodes(plan['Plan']) if n.get('Relation Name')==relation]
            self.assertTrue(scans)
            # PostgreSQL may correctly prefer the UUID PK in a dominant academy.
            # Require a bounded key seek, not an optimizer-specific index name.
            self.assertTrue(all('Index Name' in n and '>' in n.get('Index Cond','') for n in scans),name)
            self.assertTrue(all(('id >' if name=='people' else 'scheduled_date') in n['Index Cond'] for n in scans),name)
            visited = sum((n['Actual Rows']+n.get('Rows Removed by Filter',0))*n['Actual Loops'] for n in scans)
            self.assertLessEqual(visited,4*(26 if name=='people' else 51),'No full-collection sort/scan for the tested page profile')
            self.assertEqual(plan['Plan']['Actual Rows'], bound)
            if name=='calendar':
                candidates = [n for n in nodes(plan['Plan']) if n.get('Subplan Name')=='CTE window_dates']
                self.assertEqual(len(candidates),1)
                self.assertEqual(candidates[0]['Actual Rows'],51,'Display joins only receive the bounded date slice')
            evidence[name] = {'indexes': indexes, 'returned_rows': plan['Plan']['Actual Rows'],'source_rows_visited':visited,
                              'planning_ms': plan['Planning Time'], 'execution_ms': plan['Execution Time'],
                              'shared_hit_blocks': plan['Plan']['Shared Hit Blocks'],
                              'shared_read_blocks': plan['Plan']['Shared Read Blocks']}
        evidence['profile'] = {'directory_rows':10001,'calendar_programs':301,
                               'calendar_dates':301*len(dates),
                               'scope':'Private People projection and exact Calendar page SQL from the migration after ANALYZE on disposable PG17. Not the complete RPC, hosted service timing or a percentile.'}
        destination = Path(os.environ.get('WORKSPACE_TRANSFER_EVIDENCE_DIR','/private/tmp/academyos-workspace-transfer'))
        destination.mkdir(parents=True, exist_ok=True)
        (destination/'query-plans.json').write_text(json.dumps(evidence,indent=2)+'\n')

    def test_workspace_21_mixed_canonical_writers(self):
        academy, branch, program, staff, invitation, player, dates = self.fixture()
        before = self.revision(academy)
        barrier = threading.Barrier(3, timeout=5)
        def register():
            barrier.wait()
            for n in range(6):
                self.sql(f"select public.i2_register_v1('{academy}','{branch}','{uuid.uuid4()}','Synthetic mixed {n}',null,0,false)", 'user_owner')
        def planning():
            barrier.wait()
            for day in dates[:3]:
                result = json.loads(self.plan(academy,program,version=1,day=day,capacity=5,trainer=staff))
                self.assertEqual(result['version'],2)
        def program_creation():
            barrier.wait()
            definition = self.definition()
            definition.update({'from':'2101-11-01','to':'2102-01-31'})
            result = self.ready(academy,definition)
            self.assertEqual(result['state'],'ready')
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            futures = [pool.submit(work) for work in [register,planning,program_creation]]
            for future in futures:
                future.result(timeout=15)
        after = self.revision(academy)
        self.assertEqual(after['people'],before['people']+6)
        self.assertGreaterEqual(after['calendar'],before['calendar']+5)
        self.assertEqual(self.sql(f"select count(*)from academy.players where academy_id='{academy}'"),'7')


def load_tests(loader, tests, pattern):
    return unittest.TestSuite(WorkspaceBoundary(name) for name in sorted(WorkspaceBoundary.__dict__) if name.startswith('test_workspace_'))


if __name__ == '__main__':
    result = unittest.TextTestRunner(verbosity=2).run(load_tests(None, None, None))
    out = Path(os.environ.get('WORKSPACE_TRANSFER_EVIDENCE_DIR', '/private/tmp/academyos-workspace-transfer'))
    out.mkdir(parents=True, exist_ok=True)
    (out / 'database.json').write_text(json.dumps({
        'passed': result.wasSuccessful(), 'tests': result.testsRun,
        'failures': len(result.failures), 'errors': len(result.errors),
        'sources': {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in [MIGRATION, 'scripts/workspace-download/test_boundary.py']},
        'scope': 'Disposable actual PostgreSQL17; synthetic identity proofs/data. No hosted schema, key custody, browser persistence or performance percentile claim.',
    }, indent=2) + '\n')
    raise SystemExit(not result.wasSuccessful())
