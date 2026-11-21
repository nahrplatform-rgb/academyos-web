"""Run the signed key RPC against disposable PG17 with a synthetic Clerk subject."""
from concurrent.futures import ThreadPoolExecutor
import json
import re
import runpy
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
download = runpy.run_path(str(ROOT / 'scripts/register-download/test_boundary.py'))
Boundary = download['DownloadBoundary']
literal = download['literal']
RPC = 'x19_owner_register_key_v1'
scope = runpy.run_path(str(ROOT / 'scripts/register-key/bound_fixture.py'))
dispatch = runpy.run_path(str(ROOT / 'scripts/offline-register/dispatch_bridge.py'))
RPC_FIELDS = {
    RPC: ('a', 'ev', 'device', 'expected_subject', 'act', 'ns', 'envelope'),
    'x23_owner_register_key_v2': ('a', 'ev', 'device', 'expected_subject', 'act', 'ns', 'envelope'),
    'x20_register_download_v1': ('a','ev','act','previous','expected','after_id','device','ns','expected_subject'),
    'x20_register_dispatch_v1': ('a','ev','marks','captured_at','op','device','ns','expected_subject'),
}


def rpc(test, command):
    args = command['args']
    target = command.get('target', RPC)
    fields = RPC_FIELDS[target]
    assert set(args) == set(fields)
    values = (args[name] for name in fields)
    sql_args = ','.join('null' if value is None else literal(json.dumps(value))+'::jsonb'
                        if isinstance(value,(dict,list)) else literal(value) for value in values)
    claims = json.dumps({'iss': 'https://immune-grizzly-7875.clerk.accounts.dev',
                         'sub': command['subject'], 'role': 'authenticated'})
    headers = json.dumps({'x-academyos-gateway': command['proof']})
    query = ("\\set VERBOSITY verbose\nbegin;set local role authenticated;"
             f"set local request.jwt.claims={literal(claims)};"
             f"set local request.path='/rpc/{target}';set local request.method='POST';"
             f"set local request.headers={literal(headers)};"
             f"select public.{target}({sql_args});commit;")
    result = subprocess.run(test.base, input=query, text=True, capture_output=True)
    if result.returncode:
        match = re.search(r'ERROR:\s+([A-Z0-9]{5}):', result.stderr)
        return {'error': match.group(1) if match else 'XX000'}
    return {'data': json.loads(result.stdout.strip())}


def command_result(test, command):
    action = command['action']
    if action == 'rpc':
        return rpc(test, command)
    if action == 'acl':
        return json.loads(test.sql(
            "select json_build_object('rls',(select relrowsecurity from pg_class "
            "where oid='academy.owner_register_keys'::regclass),"
            "'anon_rpc',has_function_privilege('anon','public.x19_owner_register_key_v1(uuid,uuid,uuid,text,text,uuid,text)','execute'),"
            "'authenticated_table',has_table_privilege('authenticated','academy.owner_register_keys','select'),"
            "'authenticated_insert',has_table_privilege('authenticated','academy.owner_register_keys','insert'))"))
    if action == 'acl_v2':
        return json.loads(test.sql(
            "select json_build_object('rls',(select relrowsecurity from pg_class where oid='academy.owner_register_keys_v2'::regclass),"
            "'anon_rpc',has_function_privilege('anon','public.x23_owner_register_key_v2(uuid,uuid,uuid,text,text,uuid,text)','execute'),"
            "'authenticated_table',has_table_privilege('authenticated','academy.owner_register_keys_v2','select'),"
            "'authenticated_insert',has_table_privilege('authenticated','academy.owner_register_keys_v2','insert'),"
            "'primary_key',(select array_agg(a.attname order by k.ord) from pg_index i "
            "cross join lateral unnest(i.indkey) with ordinality k(n,ord) "
            "join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.n "
            "where i.indrelid='academy.owner_register_keys_v2'::regclass and i.indisprimary),"
            "'unique_scope',exists(select 1 from pg_constraint where conrelid='academy.owner_register_keys_v2'::regclass "
            "and contype='p' and cardinality(conkey)=4))"))
    if action == 'bound_acl':
        return json.loads(test.sql(
            "select json_build_array(has_function_privilege('authenticated','public.x17_register_download_v1(uuid,uuid,text,jsonb,text,uuid)','execute'),"
            "has_function_privilege('authenticated','public.x18_owner_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,text)','execute'),"
            "has_function_privilege('anon','public.x20_register_download_v1(uuid,uuid,text,jsonb,text,uuid,uuid,uuid,text)','execute'),"
            "has_function_privilege('anon','public.x20_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,uuid,uuid,text)','execute'))"))
    if action == 'counts':
        return dispatch['execute'](test, command)
    if action == 'make':
        academy, branch, event, _, _ = test.pair()
        return {'academy': academy, 'event': event, 'branch': branch}
    academy = literal(command['academy'])
    if action == 'second':
        event = test.sql("select event_id from academy.publication_heads "
                         f"where academy_id={academy} and event_id<>{literal(command['event'])} order by day limit 1")
        assert event, 'Fixture needs another published event in the same academy'
        test.retime(event)
        branch = test.sql(f"select branch_id from academy.publication_events where id={literal(event)}")
        return {'academy': command['academy'], 'event': event, 'branch': branch}
    if action == 'inspect_v2':
        where = f"k.academy_id={academy}"
        if command.get('event'):
            where += f" and k.event_id={literal(command['event'])}"
        if command.get('device'):
            where += f" and k.device_id={literal(command['device'])}"
        return json.loads(test.sql(
            "select json_build_object('rows',count(*),'fingerprint',md5(jsonb_agg(to_jsonb(k) order by k.namespace)::text),"
            "'audit',(select count(*) from academy.audit_events ae where ae.academy_id="+academy+
            " and ae.action='attendance.local_register_scope_prepared' and ae.operation_id in "
            f"(select k.namespace from academy.owner_register_keys_v2 k where {where}))) "
            f"from academy.owner_register_keys_v2 k where {where}"))
    if action == 'inspect':
        return json.loads(test.sql(
            "select json_build_object('rows',count(*),'envelope',min(wrapped_key),'audit',"
            f"(select count(*) from academy.audit_events where academy_id={academy} "
            "and action='attendance.local_register_prepared')) from academy.owner_register_keys "
            f"where academy_id={academy}"))
    if action == 'suspend' or action == 'restore':
        status = 'suspended' if action == 'suspend' else 'active'
        test.sql(f"update academy.memberships set status='{status}' where academy_id={academy} and role='owner'")
        return True
    if action == 'withdraw':
        test.sql(f"delete from academy.publication_heads where academy_id={academy}")
        return True
    raise ValueError('Unknown fixture command')


if __name__ == '__main__':
    Boundary.setUpClass()
    try:
        Boundary.sql((ROOT / 'supabase/migrations/20261104002448_owner_register_original_dispatch.sql').read_text())
        scope['apply_bound'](Boundary)
        fixture = Boundary()
        print(json.dumps({'ready': True}), flush=True)

        def reply(command):
            try:
                value = command_result(fixture, command)
                print(json.dumps({'id': command['id'], 'value': value}), flush=True)
            except Exception as error:
                print(f"Fixture action {command.get('action')} failed: {type(error).__name__}", file=sys.stderr, flush=True)
                print(json.dumps({'id': command['id'], 'error': type(error).__name__}), flush=True)

        with ThreadPoolExecutor(max_workers=4) as executor:
            for line in sys.stdin:
                executor.submit(reply, json.loads(line))
    finally:
        Boundary.tearDownClass()
