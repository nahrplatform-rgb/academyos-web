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
dispatch = runpy.run_path(str(ROOT / 'scripts/offline-register/dispatch_bridge.py'))
literal = dispatch['literal']
ROUTES = {
    'x15_owner_home_v1', 'x15_owner_calendar_v1', 'x16_owner_current_calendar_v1',
    'p5_dates_v1', 'q6_read_v1', 'x20_register_download_v1', 'x20_register_dispatch_v1',
    'x19_owner_register_key_v1', 'a10_roster_v1', 'a10_history_v1', 'a10_register_v1',
    'c12_list_v1', 'c12_context_v1', 'c12_detail_v1', 'c12_decide_v1', 'c12_operation_v1',
    'e14_context_v1', 'e14_queue_v1', 'e14_detail_v1', 'e14_command_v1', 'e14_operation_v1',
    'p5_read_v1', 's8_owner_dates_v1', 's8_jobs_v1', 's8_read_v1', 's8_create_v1',
    's8_change_v1', 's8_operation_v1',
}


def seed(test):
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
    for event in events:
        # Disposable timing setup. Canonical dispatch still uses the real server clock.
        test.retime(event['event'], 'clock_timestamp()')
    return dict(academy=academy, otherAcademy=other, program=program['id'],
                dates=len(dates), events=events, players=len(players), sameAcademyEvent=same_academy_event)


def rpc(test, command):
    name = command['name']
    assert name in ROUTES
    args = []
    for key, value in command['args'].items():
        assert re.fullmatch(r'[a-z_]+', key)
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
        print(json.dumps({'ready': seed(test)}), flush=True)
        for line in sys.stdin:
            command = json.loads(line)
            if command['action'] == 'close':
                break
            try:
                if command['action'] == 'queue_fixture':
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
