"""Fictional Owner working-day database and signed RPC transport fixture."""
import datetime
import json
import re
import runpy
import subprocess
import sys
import uuid
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
module = runpy.run_path(str(ROOT / 'scripts/experience-projections/test_boundary.py'))
Boundary = module['ExperienceBoundary']
PublicationBoundary = runpy.run_path(str(ROOT / 'scripts/publication/test_boundary.py'))['PublicationBoundary']
TrainerBoundary = runpy.run_path(str(ROOT / 'scripts/trainers/test_boundary.py'))['TrainerBoundary']
dispatch = runpy.run_path(str(ROOT / 'scripts/offline-register/dispatch_bridge.py'))
literal = dispatch['literal']
ROUTES = {
    'x15_owner_home_v1', 'x15_owner_calendar_v1', 'x16_owner_current_calendar_v1',
    'p5_dates_v1', 'q6_read_v1', 'x20_register_download_v1', 'x20_register_dispatch_v1',
    'x19_owner_register_key_v1', 'x23_owner_register_key_v2', 'a10_roster_v1', 'a10_history_v1', 'a10_register_v1',
    'c12_list_v1', 'c12_context_v1', 'c12_detail_v1', 'c12_decide_v1', 'c12_operation_v1',
    'e14_context_v1', 'e14_queue_v1', 'e14_detail_v1', 'e14_command_v1', 'e14_operation_v1',
    'p5_read_v1', 'p5_list_v1', 'q6_review_v2', 'q6_save_v2', 'q6_operation_v1', 'm1_context_v1',
    's8_owner_dates_v1', 's8_jobs_v1', 's8_read_v1', 's8_create_v1',
    's8_change_v1', 's8_operation_v1',
}


BILLING_ROUTES = {'f21_players_v1','f21_payers_v1','f21_grants_v1','f21_preview_v1',
                  'f21_command_v1','f21_operation_v1','f21_statement_v1'}
COMPENSATION_ROUTES = {'c22_context_v1', 'c22_command_v1', 'c22_operation_v1', 'x15_trainer_home_v1'}

FAMILY_ROUTES = {
    'x15_trainer_home_v1', 'x15_trainer_calendar_v1', 'x15_guardian_home_v1',
    'x15_guardian_calendar_v1', 'g3_links_v1', 'b11_links_v1', 'b11_schedule_v1',
    'b11_detail_v1', 'e14_links_v1', 'e14_family_list_v1', 'e14_family_detail_v1',
    'e14_sessions_v1', 'e14_roster_v1', 'e14_history_v1', 'c12_submit_v1', 'c12_history_v1',
}


def family_day(test):
    academy, branch, _, staff, child, _, event, link, _ = test.family()
    sibling = test.person(academy, branch, 'Fictional second child')
    _, invitation, token, _, _ = test.guardian_command(academy, p=sibling)
    sibling_link = json.loads(test.guardian_recipient(invitation, token, 'accept', str(uuid.uuid4())))['link_id']
    test.sql(f"insert into academy.guardian_training_access values('{sibling_link}',true);"
             f"insert into academy.development_access values('{link}',true),('{sibling_link}',true)")
    # Keep the session ended and inside today's branch date at any UTC hour.
    zones = ('Africa/Cairo', 'Pacific/Kiritimati', 'America/Adak')
    zone = min(zones, key=lambda z: abs(datetime.datetime.now(ZoneInfo(z)).hour - 12))
    test.sql(f"begin;delete from academy.publication_heads where event_id='{event}';"
             f"update academy.publication_events set projection=jsonb_set(projection,'{{timezone}}',to_jsonb('{zone}'::text)) where id='{event}';"
             f"insert into academy.publication_heads select academy_id,program_id,day,id from academy.publication_events where id='{event}';commit")
    test.retime(event, "clock_timestamp()-interval '45 minutes'", "clock_timestamp()-interval '15 minutes'")
    test.sql(f"update academy.academies set timezone='{zone}' where id='{academy}'")
    day = test.sql(f"select (starts_at at time zone '{zone}')::date from academy.publication_events where id='{event}'")
    assert test.mark(academy, event, child)['version'] == 1
    duplicate = test.person(academy, branch, 'Fictional player outside the assignment')
    return dict(academy=academy, event=event, child=child, link=link, siblingLink=sibling_link,
                **({'sibling': sibling} if '--billing' in sys.argv else {}),
                unrostered=duplicate, day=day, staff=staff)


def compensation_day(test):
    academy, branch = test.academy()
    trainer, _ = test.staff(academy, branch)
    email = 'cover-fixture@example.invalid'
    _, invite, token, _, _ = TrainerBoundary.command(test, academy, branch, email=email, name='Fictional scheduled trainer')
    TrainerBoundary.recipient(test, invite, token, 'accept', str(uuid.uuid4()), subject='user_other_trainer', email=email)
    other = test.sql(f"select staff_id from academy.trainer_invitations where id={literal(invite)}")
    test.sql("insert into academy.identities(clerk_subject) values('user_manager') on conflict do nothing;"
             "insert into academy.memberships(identity_id,academy_id,role,status) "
             f"select id,{literal(academy)},'manager','active' from academy.identities where clerk_subject='user_manager'")
    program = test.ready(academy, {'name': 'Fictional compensation program', 'from': '2026-11-15', 'to': '2026-11-21',
                                   'rules': [{'day': n, 'start': '17:00', 'end': '18:00'} for n in range(7)]})
    p, a, b, job = map(literal, (program['id'], academy, branch, uuid.uuid4()))
    test.sql(f"insert into academy.publication_jobs(id,academy_id,program_id,actor,kind,first_date,last_date,weekdays,state) "
             f"values({job},{a},{p},'user_owner','publish','2026-11-15','2026-11-21','{{0,1,2,3,4,5,6}}','committed')")
    # Historical publication fixtures use the actual stored instants. The normal program editor
    # currently creates same-day slots; the overnight boundary here exercises the compensation reader.
    slots = [('overnight', '15', '2026-11-15 23:30+02', '2026-11-16 00:30+02', trainer, False),
             ('cancelled', '17', '2026-11-17 17:00+02', '2026-11-17 18:00+02', trainer, True),
             ('short', '18', '2026-11-18 17:00+02', '2026-11-18 17:45+02', trainer, False),
             ('substitute', '20', '2026-11-20 17:00+02', '2026-11-20 18:00+02', other, False),
             ('absent', '21', '2026-11-21 17:00+02', '2026-11-21 18:00+02', trainer, False)]
    events = {}
    for key, number, starts, ends, assigned, cancelled in slots:
        day = f'2026-11-{number}'
        event = str(uuid.uuid4())
        d, e, s, finish, t = map(literal, (day, event, starts, ends, assigned))
        published = 'false' if cancelled else 'true'
        test.sql(f"update academy.training_dates set starts_at={s},ends_at={finish},canceled=not {published} "
                 f"where program_id={p} and local_date={d};"
                 f"insert into academy.date_plans(academy_id,program_id,local_date,branch_id,capacity,trainer_id,starts_at,ends_at) "
                 f"values({a},{p},{d},{b},10,{t},{s},{finish});"
                 f"insert into academy.publication_events(id,academy_id,program_id,day,job_id,published,plan_version,trainer_id,branch_id,capacity,roster_count,starts_at,ends_at,projection) "
                 f"values({e},{a},{p},{d},{job},{published},1,{t},{b},10,0,{s},{finish},"
                 "'{\"name\":\"Fictional compensation program\",\"timezone\":\"Africa/Cairo\"}');"
                 f"insert into academy.publication_heads values({a},{p},{d},{e})")
        events[key] = {'id': event, 'day': day}
    return dict(academy=academy, trainer=trainer, other=other, events=events)


def seed(test, multi_scope=False):
    now = datetime.datetime.now(datetime.timezone.utc)
    # Keep today's session publishable before retiming the disposable register.
    zones = ('Africa/Cairo', 'Pacific/Kiritimati', 'America/Adak')
    local_times = [now.astimezone(ZoneInfo(zone)) for zone in zones]
    local = min(local_times, key=lambda time: abs(time.hour - 12))
    first = local.date()
    last = first + datetime.timedelta(days=39)
    academy, branch = test.academy()
    test.sql(f'update academy.academies set timezone={literal(local.tzinfo.key)} where id={literal(academy)}')
    other, _ = test.academy('user_other_owner')
    program = test.ready(academy, {
        'name': 'Fictional working-day program', 'from': str(first), 'to': str(last),
        'rules': [{'day': n, 'start': '22:30', 'end': '23:30'} for n in range(7)],
    })
    program_id = literal(program['id'])
    dates = json.loads(test.sql(
        f"select json_agg(local_date order by local_date) from academy.training_dates where program_id={program_id}"))
    assert len(dates) == 40
    test.sql("insert into academy.players(academy_id,branch_id,display_name,normalized_name) "
             f"select {literal(academy)},{literal(branch)},'لاعب خيالي للاختبار في الأكاديمية '||n,"
             "'synthetic owner working day '||n from generate_series(1,18)n")
    players = json.loads(test.sql(f"select json_agg(id order by id) from academy.players where academy_id={literal(academy)}"))
    staff, _ = test.staff(academy, branch)
    for day in dates[:2]:
        plan = json.loads(test.plan(academy, program, capacity=18, trainer=staff, add=players, day=day))
        assert plan['version'] == 1
    job = json.loads(test.sql(f"select public.s8_create_v1({literal(academy)},{program_id},"
                              f"{literal(uuid.uuid4())},'publish',{literal(dates[0])},{literal(dates[1])},"
                              "'{0,1,2,3,4,5,6}')", 'user_owner'))
    assert test.mutate(academy, test.prepare_pub(academy, job), 'activate')['state'] == 'committed'
    events = json.loads(test.sql(
        f"select json_agg(json_build_object('event',event_id,'day',day) order by day) "
        f"from academy.publication_heads where academy_id={literal(academy)}"))
    assert len(events) == 2
    # The Arabic deadline scenario uses an independent academy's registered slot.
    second, second_branch, second_event, _, _ = dispatch['Boundary'].pair(test)
    test.sql("insert into academy.players(academy_id,branch_id,display_name,normalized_name) "
             f"select {literal(second)},{literal(second_branch)},'لاعب خيالي '||n,'second fictional '||n "
             "from generate_series(1,16)n")
    test.sql(f"insert into academy.publication_rosters select {literal(second_event)},id,display_name "
             f"from academy.players p where p.academy_id={literal(second)} and not exists "
             f"(select 1 from academy.publication_rosters r where r.event_id={literal(second_event)} and r.player_id=p.id);"
             f"update academy.publication_events set roster_count=18,capacity=18 where id={literal(second_event)}")
    same_academy_event = {**events[1], 'academy': academy}
    events = [{**events[0], 'academy': academy}, {'event': second_event, 'academy': second}]
    for event in events + ([same_academy_event] if multi_scope else []):
        # Disposable timing setup. Canonical dispatch still uses the real server clock.
        test.retime(event['event'], 'clock_timestamp()')
    return dict(academy=academy, otherAcademy=other, program=program['id'],
                dates=len(dates), events=events, players=len(players), sameAcademyEvent=same_academy_event)


def rpc(test, command):
    name = command['name']
    assert name in ROUTES or ('--family-day' in sys.argv and name in FAMILY_ROUTES) or ('--billing' in sys.argv and name in BILLING_ROUTES) or ('--compensation' in sys.argv and name in COMPENSATION_ROUTES)
    args = []
    for key, value in command['args'].items():
        assert re.fullmatch(r'[a-z_]+', key)
        if name in ('q6_review_v2', 'q6_save_v2') and key in ('add_ids', 'remove_ids'):
            encoded = literal('{' + ','.join(str(uuid.UUID(item)) for item in value) + '}') + '::uuid[]'
        else:
            encoded = 'null' if value is None else literal(json.dumps(value)) + '::jsonb' if isinstance(value, (dict, list)) else literal(value)
        args.append(f'{key}=>{encoded}')
    claims = json.dumps(dict(iss='https://immune-grizzly-7875.clerk.accounts.dev',
                             sub=command['subject'], role='authenticated'))
    headers = json.dumps({'x-academyos-gateway': command['proof']})
    query = ("\\set VERBOSITY verbose\nbegin;set local role authenticated;"
             f"set local request.jwt.claims={literal(claims)};"
             f"set local request.path='/rpc/{name}';set local request.method='POST';"
             f"set local request.headers={literal(headers)};select public.{name}({','.join(args)});commit;")
    result = subprocess.run(test.base, input=query, text=True, capture_output=True)
    if result.returncode:
        match = re.search(r'ERROR:\s+([A-Z0-9]{5}):', result.stderr)
        return {'error': match.group(1) if match else 'XX000'}
    return {'data': json.loads(result.stdout.strip())}


if __name__ == '__main__':
    Boundary.setUpClass()
    try:
        for filename in ('20261103165604_owner_register_download_contract.sql',
                         '20261104002448_owner_register_original_dispatch.sql'):
            Boundary.sql((ROOT / 'supabase/migrations' / filename).read_text())
        test = Boundary()
        dispatch['scope']['apply_bound'](test)
        if '--billing' in sys.argv or '--compensation' in sys.argv:
            Boundary.sql((ROOT / 'supabase/migrations/20261105003702_owner_workspace_transfer_contract.sql').read_text())
            for suffix in ('player_alternate_name','player_academy_member_number','player_private_profile_details',
                           'player_private_photo','player_name_correction','player_profile_and_lifecycle',
                           'ex21_family_billing'):
                path, = (ROOT / 'supabase/migrations').glob(f'*_{suffix}.sql')
                Boundary.sql(path.read_text())
        if '--compensation' in sys.argv:
            migration, = (ROOT / 'supabase/migrations').glob('*_ex22_trainer_compensation.sql')
            Boundary.sql(migration.read_text())
        data = seed(test, '--multi-scope' in sys.argv)
        if '--family-day' in sys.argv:
            data['familyDays'] = [family_day(test), family_day(test)]
        if '--compensation' in sys.argv:
            data['compensationDays'] = [compensation_day(test), compensation_day(test)]
        print(json.dumps({'ready': data}), flush=True)
        for line in sys.stdin:
            command = json.loads(line)
            if command['action'] == 'close':
                break
            try:
                if command['action'] == 'compensation_audit' and '--compensation' in sys.argv:
                    academy = literal(uuid.UUID(command['academy']))
                    operation = literal(uuid.UUID(command['operation']))
                    value = json.loads(test.sql(
                        "select json_build_object('lines',(select count(*) from academy.compensation_lines where academy_id=" + academy + "),"
                        "'payouts',(select count(*) from academy.compensation_payouts where academy_id=" + academy + "),"
                        "'operations',(select count(*) from academy.compensation_operations where id=" + operation + "),"
                        "'audits',(select count(*) from academy.audit_events where academy_id=" + academy + " and operation_id=" + operation + "))"))
                elif command['action'] == 'compensation_end_trainer' and '--compensation' in sys.argv:
                    academy = literal(uuid.UUID(command['academy']))
                    test.sql("update academy.memberships m set status='suspended' from academy.identities i "
                             f"where i.id=m.identity_id and i.clerk_subject='user_trainer' and m.academy_id={academy} and m.role='trainer'")
                    value = True
                elif command['action'] == 'billing_audit' and '--billing' in sys.argv:
                    link = literal(uuid.UUID(command['link']))
                    academy = literal(uuid.UUID(command['academy']))
                    value = json.loads(test.sql(
                        "select json_build_object('entries',coalesce((select json_agg(json_build_object('id',id,'kind',kind,'amount',amount,'bill',bill,'source',source) order by seq) from academy.billing_entries where link=" + link + "),'[]'::json),'receiptAudits',(select count(*) from academy.audit_events where action='billing.receipt' and academy_id=" + academy + "))"))
                elif command['action'] == 'family_day_audit' and '--family-day' in sys.argv:
                    assessment = literal(uuid.UUID(command['assessment']))
                    value = json.loads(test.sql(
                        "select json_build_object('publications',"
                        f"(select count(*) from academy.development_publications where assessment_id={assessment}),"
                        "'submissions',"
                        f"(select count(*) from academy.development_submissions where assessment_id={assessment}),"
                        "'currentPublication',"
                        f"(select publication_id from academy.development_assessments where id={assessment}))"))
                elif command['action'] in ('dated_plan_fixture', 'second_academy_fixture'):
                    if command['action'] == 'second_academy_fixture':
                        academy, _ = test.academy()
                        test.sql(f"update academy.academies set name='Fictional second academy' where id={literal(academy)}")
                        name = 'Fictional second academy session'
                    else:
                        academy = command['academy']
                        name = 'Fictional dated-plan check'
                    day = test.sql(f"select (now() at time zone timezone)::date from academy.academies where id={literal(academy)}")
                    program = test.ready(academy, {
                        'name': name, 'from': day, 'to': day,
                        'rules': [{'day': (datetime.date.fromisoformat(day).weekday() + 1) % 7,
                                   'start': '22:45', 'end': '23:45'}],
                    })
                    value = {'academy': academy, 'program': program['id'], 'day': day}
                elif command['action'] == 'dated_plan_counts':
                    academy = literal(command['academy'])
                    value = json.loads(test.sql(
                        f"select json_build_object('operations',(select count(*) from academy.planning_operations where academy_id={academy}),"
                        f"'audits',(select count(*) from academy.audit_events where academy_id={academy} and action='planning.save'))"))
                elif command['action'] == 'dated_plan_owner':
                    academy = literal(command['academy'])
                    subject = command['subject']
                    assert subject in ('user_owner', 'user_other_owner')
                    owner = literal(subject)
                    value = test.sql(
                        "begin;"
                        f"update academy.memberships set status='suspended' where academy_id={academy} and role='owner' and status='active';"
                        f"insert into academy.memberships(identity_id,academy_id,role,status) "
                        f"select id,{academy},'owner','active' from academy.identities where clerk_subject={owner} "
                        "on conflict (identity_id,academy_id,role) do update set status='active';"
                        "commit;"
                        "select i.clerk_subject from academy.memberships m join academy.identities i on i.id=m.identity_id "
                        f"where m.academy_id={academy} and m.role='owner' and m.status='active';")
                elif command['action'] == 'queue_fixture':
                    academy, branch, event, _, _ = dispatch['Boundary'].pair(test)
                    test.sql("insert into academy.players(academy_id,branch_id,display_name,normalized_name) "
                             f"select {literal(academy)},{literal(branch)},'Synthetic queue player '||n,"
                             "'synthetic queue player '||n from generate_series(1,16)n")
                    test.sql("insert into academy.publication_rosters "
                             f"select {literal(event)},id,display_name from academy.players p "
                             f"where academy_id={literal(academy)} and not exists "
                             "(select 1 from academy.publication_rosters r "
                             f"where r.event_id={literal(event)} and r.player_id=p.id);"
                             f"update academy.publication_events set roster_count=18,capacity=18 where id={literal(event)}")
                    test.retime(event)
                    value = {'academy': academy, 'event': event}
                elif command['action'] == 'review_fixture':
                    kind = command['kind']
                    if kind == 'correction':
                        academy, _, _, _, _, player, _, event = test.attendance_fixture()
                        assert test.mark(academy, event, player)['version'] == 1
                        item = test.request(academy, event, player)['request']
                    elif kind == 'development':
                        academy, _, _, _, player, event, _ = test.development_fixture()
                        item = test.cmd(academy, event, player)['id']
                    else:
                        raise ValueError('Unknown review fixture')
                    value = {'academy': academy, 'event': event, 'player': player, 'id': item}
                elif command['action'] == 'publication_fixture':
                    academy, _, program, *_ = PublicationBoundary.fixture(test)
                    job = PublicationBoundary.pub(test, academy, program)
                    if command['state'] == 'ready':
                        job = PublicationBoundary.prepare_pub(test, academy, job)
                    assert job['state'] == command['state']
                    value = {'academy': academy, 'program': program['id'], 'job': job['job']}
                elif command['action'] == 'future_fixture':
                    # Disposable fixture only: exercise a download before its window.
                    academy, _, event, _, _ = dispatch['Boundary'].pair(test)
                    test.retime(event,"clock_timestamp()+interval '60 seconds'",
                                "clock_timestamp()+interval '3660 seconds'")
                    value = {'academy': academy, 'event': event}
                else:
                    value = rpc(test, command) if command['action'] == 'rpc' else dispatch['execute'](test, command)
                print(json.dumps({'id': command['id'], 'value': value}), flush=True)
            except Exception as error:
                print(json.dumps({'id': command['id'], 'error': type(error).__name__ + ':' + command['action']}),
                      flush=True)
    finally:
        Boundary.tearDownClass()
