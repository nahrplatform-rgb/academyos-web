"""Disposable PG17 bridge for the connected original-dispatch test."""
import json
import re
import runpy
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
module = runpy.run_path(str(ROOT / 'scripts/register-download/test_boundary.py'))
Boundary = module['DownloadBoundary']
literal = module['literal']
RPC = 'x18_owner_register_dispatch_v1'


def execute(test, request):
    action = request['action']
    if action == 'fixture':
        academy, _, event = test.scale(request.get('size', 18))
        manifest, pages, complete, _ = test.transfer(academy, event)
        return dict(academy=academy, event=event, manifest=manifest, pages=pages, complete=complete)
    academy, event = (literal(request.get(k)) for k in ('academy', 'event'))
    if action == 'rpc':
        a = request['args']
        args = [literal(a[k]) for k in ('a', 'ev')]
        args += [literal(json.dumps(a['marks'])) + '::jsonb']
        args += [literal(a[k]) for k in ('captured_at', 'op', 'expected_subject')]
        claims = json.dumps(dict(iss='https://immune-grizzly-7875.clerk.accounts.dev',
                                 sub=request['subject'], role='authenticated'))
        headers = json.dumps({'x-academyos-gateway': request.get('proof')})
        query = ("\\set VERBOSITY verbose\nbegin;set local role authenticated;"
                 f"set local request.jwt.claims={literal(claims)};"
                 f"set local request.path='/rpc/{RPC}';set local request.method='POST';"
                 f"set local request.headers={literal(headers)};"
                 f"select public.{RPC}({','.join(args)});commit;")
        result = subprocess.run(test.base, input=query, text=True, capture_output=True)
        if result.returncode:
            match = re.search(r'ERROR:\s+([A-Z0-9]{5}):', result.stderr)
            return {'error': match.group(1) if match else 'XX000'}
        return {'data': json.loads(result.stdout.strip())}
    if action == 'counts':
        counts = {name: int(test.sql(f'select count(*) from academy.attendance_{name} where event_id={event}'))
                  for name in ('marks', 'history', 'operations')}
        counts['audit'] = int(test.sql(
            f"select count(*) from academy.audit_events where academy_id={academy} "
            f"and action='attendance.register' and operation_id={literal(request['op'])}"))
        return counts
    if action == 'role':
        test.sql(f"update academy.memberships set status='suspended' where academy_id={academy} and role='owner'")
        return True
    if action == 'withdraw':
        test.sql(f'delete from academy.publication_heads where event_id={event}')
        return True
    if action == 'expire':
        test.retime(request['event'], "clock_timestamp()-interval '26 hours'",
                    "clock_timestamp()-interval '25 hours'")
        return True
    if action == 'mark':
        return test.mark(request['academy'], request['event'], request['player'], 'user_owner')
    if action == 'foreign_owner':
        other, _ = test.academy('user_other_owner')
        return other
    if action == 'switch_owner':
        subject = literal(request['subject'])
        test.sql(f"begin;insert into academy.identities(clerk_subject) values({subject}) on conflict do nothing;"
                 f"update academy.memberships set status='suspended' where academy_id={academy} and role='owner';"
                 f"insert into academy.memberships(identity_id,academy_id,role,status) "
                 f"select id,{academy},'owner','active' from academy.identities where clerk_subject={subject} "
                 f"on conflict(identity_id,academy_id,role) do update set status='active';commit;")
        return True
    if action == 'cancel':
        return json.loads(test.sql(f"select public.a10_operation_v1({academy},{event},{literal(request['op'])})",
                                   'user_owner'))
    if action == 'acl':
        return test.sql("select has_function_privilege('anon',"
                        "'public.x18_owner_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,text)','execute')")
    raise ValueError('Unknown fixture command')


if __name__ == '__main__':
    Boundary.setUpClass()
    try:
        Boundary.sql((ROOT / 'supabase/migrations/20261104002448_owner_register_original_dispatch.sql').read_text())
        print(json.dumps({'ready': True}), flush=True)
        test = Boundary()
        for line in sys.stdin:
            request = json.loads(line)
            if request['action'] == 'close':
                break
            try:
                print(json.dumps({'id': request['id'], 'value': execute(test, request)}), flush=True)
            except Exception as error:
                # Report the failing fixture step without echoing SQL, proofs or data.
                print(json.dumps({'id': request['id'], 'error': type(error).__name__ + ':' + request['action']}),
                      flush=True)
    finally:
        Boundary.tearDownClass()
