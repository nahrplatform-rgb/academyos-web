"""The class-media fixture uses one disposable PostgreSQL cluster and a private socket."""

import datetime
import json
import os
from pathlib import Path
import re
import runpy
import subprocess
import sys
from tempfile import TemporaryDirectory
import uuid


ROOT = Path(__file__).resolve().parents[2]
PUBLICATION = runpy.run_path(str(ROOT / 'scripts/publication/test_boundary.py'))
Fixture = PUBLICATION['PublicationBoundary']
literal = PUBLICATION['literal']
BIN = Path(os.environ.get('M1_POSTGRES_BIN', '/opt/homebrew/opt/postgresql@17/bin'))


def sql_file(psql, path):
    subprocess.run([*psql, '-f', path], check=True, stdout=subprocess.DEVNULL)


def seed(test):
    academy, branch = test.academy()
    foreign, _ = test.academy('user_other_owner')
    program = test.ready(academy, {
        'name': 'Fictional Group Photo Class',
        'from': '2099-11-01', 'to': '2099-11-10',
        'rules': [{'day': day, 'start': '17:00', 'end': '18:00'} for day in range(7)],
    })
    staff, _ = test.staff(academy, branch)
    players = [test.person(academy, branch, name) for name in ['Fictional Player One', 'Fictional Player Two']]
    for day in range(1, 11):
        plan = json.loads(test.plan(academy, program, day=f'2099-11-{day:02d}', capacity=10, trainer=staff, add=players))
        assert plan['version'] == 1
    job = json.loads(test.sql(
        f"select public.s8_create_v1({literal(academy)},{literal(program['id'])},{literal(uuid.uuid4())},"
        "'publish','2099-11-01','2099-11-10','{0,1,2,3,4,5,6}')", 'user_owner'))
    assert test.mutate(academy, test.prepare_pub(academy, job), 'activate')['state'] == 'committed'
    events = json.loads(test.sql(
        "select json_agg(json_build_object('id',event_id,'day',day) order by day) from academy.publication_heads "
        f"where academy_id={literal(academy)}"))
    for subject, role in [('user_manager', 'manager'), ('user_unassigned', 'manager'), ('user_guardian', 'guardian')]:
        test.sql(f"insert into academy.identities(clerk_subject) values({literal(subject)}) on conflict do nothing;"
                 "insert into academy.memberships(identity_id,academy_id,role,status) "
                 f"select id,{literal(academy)},{literal(role)},'active' from academy.identities where clerk_subject={literal(subject)}")
    test.sql("insert into academy.class_media_manager_grants(academy_id,event_id,membership_id) "
             "select h.academy_id,h.event_id,m.id from academy.publication_heads h "
             "join academy.memberships m on m.academy_id=h.academy_id "
             "join academy.identities i on i.id=m.identity_id where h.academy_id="
             f"{literal(academy)} and i.clerk_subject='user_manager' "
             f"and h.event_id in ({literal(events[0]['id'])},{literal(events[2]['id'])})")
    assert len(events) == 10
    return dict(academy=academy, foreign=foreign, program=program['id'], players=players, events=events)


def scoped_rpc(test, command):
    name = command['name']
    assert name in {'x25_query_v1', 'x25_command_v1', 'x25_purge_receipts_v1', 'x25_variant_v1',
                    'x25_storage_exists_v1', 'q6_read_v1'}
    parts = []
    for key, value in command['args'].items():
        assert re.fullmatch(r'[a-z_]+', key)
        encoded = 'null' if value is None else literal(json.dumps(value)) + '::jsonb' if isinstance(value, dict) else literal(value)
        parts.append(f'{key}=>{encoded}')
    claims = json.dumps(dict(iss='https://immune-grizzly-7875.clerk.accounts.dev', sub=command['subject'], role='authenticated'))
    headers = json.dumps({'x-academyos-gateway': command['proof']})
    query = ("\\set VERBOSITY verbose\nbegin;set local role authenticated;"
             f"set local request.jwt.claims={literal(claims)};"
             f"set local request.path='/rpc/{name}';set local request.method='POST';"
             f"set local request.headers={literal(headers)};select public.{name}({','.join(parts)});commit;")
    result = subprocess.run(test.base, input=query, text=True, capture_output=True)
    if result.returncode:
        match = re.search(r'ERROR:\s+([A-Z0-9]{5}):', result.stderr)
        return {'error': match.group(1) if match else 'XX000'}
    value = result.stdout.strip()
    return {'data': {'t': True, 'f': False}[value] if value in ('t', 'f') else json.loads(value)}


def fixture_action(test, body):
    action = body['action']
    if action == 'clock':
        instant = datetime.datetime.fromisoformat(body['instant'])
        assert instant.tzinfo
        test.sql("create or replace function academy.x25_now() returns timestamptz language sql volatile "
                 f"security invoker set search_path='' as $$ select {literal(instant.isoformat())}::timestamptz $$;")
        return True
    if action == 'counts':
        item = literal(uuid.UUID(body['item']))
        return json.loads(test.sql("select json_build_object("
            f"'rows',(select count(*) from academy.class_media_items where id={item}),"
            f"'finalized',(select count(*) from academy.class_media_operations where item_id={item} and action='finalize'),"
            f"'deleted',(select count(*) from academy.class_media_audit where item_id={item} and action='delete_finish'))"))
    if action == 'membership':
        academy = literal(uuid.UUID(body['academy']))
        state = body['state']
        assert state in ('active', 'suspended')
        test.sql("update academy.memberships m set status=" + literal(state) +
                 " from academy.identities i where i.id=m.identity_id and i.clerk_subject='user_manager' "
                 f"and m.academy_id={academy} and m.role='manager'")
        return True
    if action == 'rpc':
        return scoped_rpc(test, body)
    if action == 'storage':
        name = literal(body['name'])
        headers = json.dumps({'x-academyos-class-media': body['proof']})
        claims = json.dumps(dict(iss='https://immune-grizzly-7875.clerk.accounts.dev',
                                 sub=body['subject'], role='authenticated'))
        method = body['method']
        sql = {
            'GET': f"select exists(select 1 from storage.objects where bucket_id='academy-media' and name={name});",
            'POST': f"insert into storage.objects values('academy-media',{name}) returning true;",
            'DELETE': f"delete from storage.objects where bucket_id='academy-media' and name={name} returning true;",
        }[method]
        result = subprocess.run(test.base, input=("begin;set local role authenticated;"
            f"set local request.jwt.claims={literal(claims)};set local request.headers={literal(headers)};"
            f"set local request.method={literal(method)};{sql}commit;"), capture_output=True, text=True)
        return result.returncode == 0 and result.stdout.strip() == 't'
    raise ValueError('Unknown fixture request')


def main():
    with TemporaryDirectory(prefix='academyos-media-pg-') as private:
        data = Path(private) / 'pg'
        subprocess.run([BIN/'initdb', '-D', data, '-A', 'trust', '--no-locale', '--encoding=UTF8'],
                       check=True, stdout=subprocess.DEVNULL)
        subprocess.run([BIN/'pg_ctl', '-D', data, '-l', Path(private)/'log', '-o',
                        f"-c listen_addresses='' -k {private}", 'start'], check=True, stdout=subprocess.DEVNULL)
        try:
            Fixture.base = [BIN/'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-h', private, 'postgres']
            sql_file(Fixture.base, ROOT/'supabase/tests/harness.sql')
            Fixture.sql("create schema storage; create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));"
                        "alter table storage.objects enable row level security; grant usage on schema storage to authenticated;"
                        "grant select,insert,delete on storage.objects to authenticated;")
            for migration in sorted((ROOT/'supabase/migrations').glob('*.sql')):
                if migration.name != '20261021212039_private_staging_buckets.sql':
                    sql_file(Fixture.base, migration)
            Fixture.sql("insert into academy.m1_secrets values('onboarding'," + literal('a' * 64) +
                        "); insert into academy.platform_grants(subject,granted_by,reason) "
                        "values('user_platform','test-harness','synthetic fixture only');")
            test = Fixture()
            print(json.dumps({'ready': seed(test)}), flush=True)
            for line in sys.stdin:
                msg = json.loads(line)
                if msg['action'] == 'close':
                    break
                try:
                    print(json.dumps({'id': msg['id'], 'value': fixture_action(test, msg)}), flush=True)
                except Exception as error:
                    print(json.dumps({'id': msg['id'], 'error': str(error)}), flush=True)
        finally:
            subprocess.run([BIN/'pg_ctl', '-D', data, 'stop', '-m', 'fast'], check=True, stdout=subprocess.DEVNULL)


if __name__ == '__main__':
    main()
