"""JSONL bridge to one disposable PG17 workspace fixture; no hosted connection."""
import json
import re
import runpy
import subprocess
import sys
import uuid
from pathlib import Path

module = runpy.run_path(str(Path(__file__).with_name('test_boundary.py')))
WorkspaceBoundary = module['WorkspaceBoundary']
literal = module['literal']
TARGETS = {
    'x21_workspace_transfer_v1': ('a', 'device', 'ns', 'expected_subject', 'act', 'previous', 'month_anchor'),
    'x21_workspace_key_v1': ('a', 'device', 'expected_subject', 'act', 'ns', 'envelope'),
    'i2_people_v1': ('a', 'after_id', 'query'),
    'i2_candidates_v1': ('a', 'display_name', 'after_id'),
    'i2_profile_v1': ('a', 'player'),
    'i2_register_v1': ('a', 'branch', 'op', 'display_name', 'contact', 'reviewed_revision', 'different_person'),
    'i2_operation_v1': ('a', 'op'),
}


def registration_snapshot_sql(academy, original):
    return ("jsonb_build_object("
            f"'operations',(select count(*) from academy.people_operations where academy_id={academy} and id={original}),"
            f"'audits',(select count(*) from academy.audit_events where academy_id={academy} and action='player.register' and operation_id={original}),"
            f"'players',(select count(*) from academy.players where academy_id={academy} and id=(select(result->>'player_id')::uuid from academy.people_operations where academy_id={academy} and id={original})),"
            f"'result',(select result from academy.people_operations where academy_id={academy} and id={original}))")


def rpc(test, command):
    target = command.get('target')
    if target not in TARGETS:
        raise ValueError('Unsupported target')
    fields = TARGETS[target]
    args = command['args']
    if not isinstance(args, dict) or set(args) != set(fields):
        raise ValueError('Invalid arguments')
    if not isinstance(command['subject'], str) or not isinstance(command['proof'], str):
        raise ValueError('Invalid caller')
    if args.get('previous') is not None and not isinstance(args['previous'], dict):
        raise ValueError('Invalid receipt')
    for field in fields:
        if field not in ('previous', 'reviewed_revision', 'different_person') and args[field] is not None and not isinstance(args[field], str):
            raise ValueError('Invalid argument')
    if 'reviewed_revision' in args and (type(args['reviewed_revision']) is not int or not 0 <= args['reviewed_revision'] <= 9007199254740991):
        raise ValueError('Invalid revision')
    if 'different_person' in args and type(args['different_person']) is not bool:
        raise ValueError('Invalid duplicate decision')
    sql_args = []
    for field in fields:
        value = args[field]
        if value is None:
            sql_args.append('null')
        elif field == 'previous':
            sql_args.append(literal(json.dumps(value)) + '::jsonb')
        elif field == 'reviewed_revision':
            sql_args.append(str(value))
        elif field == 'different_person':
            sql_args.append('true' if value else 'false')
        else:
            sql_args.append(literal(value))
    claims = json.dumps({'iss': 'https://immune-grizzly-7875.clerk.accounts.dev',
                         'sub': command['subject'], 'role': 'authenticated'})
    headers = json.dumps({'x-academyos-gateway': command['proof']})
    query = ("\\set VERBOSITY verbose\nbegin;set local role authenticated;"
             f"set local request.jwt.claims={literal(claims)};"
             f"set local request.path='/rpc/{target}';set local request.method='POST';"
             f"set local request.headers={literal(headers)};"
             f"select public.{target}({','.join(sql_args)});commit;")
    result = subprocess.run(test.base, input=query, text=True, capture_output=True)
    if result.returncode:
        match = re.search(r'ERROR:\s+([A-Z0-9]{5}):', result.stderr)
        return {'error': match.group(1) if match else 'XX000'}
    return {'data': json.loads(result.stdout.strip())}


def execute(test, command):
    action = command['action']
    if action == 'make':
        size = command.get('size', 56)
        if type(size) is not int or not 0 <= size <= 10000:
            raise ValueError('Invalid size')
        if command.get('calendar'):
            if size < 1:
                raise ValueError('Calendar fixture includes one player')
            academy, branch, program, *_ = test.fixture()
            size -= 1
        else:
            academy, branch = test.academy()
            program = None
        test.seed_people(academy, branch, size)
        if command.get('unregistered'):
            return {'academy': academy, 'branch': branch, 'program': program and program['id']}
        slot = test.key(academy)
        return {'academy': academy, 'branch': branch,
                'device': slot['device'], 'namespace': slot['namespace']}
    if action == 'rpc':
        return rpc(test, command)
    if action == 'calendar_change':
        program = literal(command['program'])
        test.sql(f"update academy.training_programs set definition=jsonb_set(definition,'{{name}}',to_jsonb('Synthetic changed title'::text))where id={program}")
        return True
    if action == 'workspace_context_change':
        academy = literal(command['academy'])
        test.sql(f"update academy.academies set name='Synthetic changed academy' where id={academy}")
        return True
    if action == 'registration_snapshot':
        # A read-only observer of this disposable fixture, not an application API.
        academy, op = str(uuid.UUID(command['academy'])), str(uuid.UUID(command['op']))
        a, original = literal(academy), literal(op)
        return json.loads(test.sql('select ' + registration_snapshot_sql(a, original)))
    if action == 'people_snapshot':
        # One read-only SQL statement observes the academy total and collection
        # revision together, independently from the per-operation player count.
        a = literal(str(uuid.UUID(command['academy'])))
        original = command.get('op')
        registration = registration_snapshot_sql(a, literal(str(uuid.UUID(original)))) if original else 'null'
        query = ("select jsonb_build_object("
                 f"'totalPlayers',(select count(*) from academy.players where academy_id={a}),"
                 f"'peopleRevision',coalesce((select people from academy.workspace_revisions where academy_id={a}),0)::text,"
                 f"'registration',{registration})")
        return json.loads(test.sql(query))
    if action in ('rename', 'suspend'):
        academy = command['academy']
        if not isinstance(academy, str):
            raise ValueError('Invalid academy')
        quoted = literal(academy)
        if action == 'rename':
            test.sql("update academy.players set display_name='Fictional renamed player' "
                     f"where id=(select id from academy.players where academy_id={quoted} "
                     "order by id limit 1)")
        else:
            test.sql("update academy.memberships set status='suspended' "
                     f"where academy_id={quoted} and role='owner' and status='active'")
        return True
    raise ValueError('Unsupported action')


def main():
    ready = False
    try:
        WorkspaceBoundary.setUpClass()
        ready = True
        test = WorkspaceBoundary()
        print(json.dumps({'ready': True}), flush=True)
        for line in sys.stdin:
            command = None
            try:
                command = json.loads(line)
                if not isinstance(command, dict) or 'id' not in command:
                    raise ValueError('Invalid command')
                if command.get('action') == 'close':
                    print(json.dumps({'id': command['id'], 'value': True}), flush=True)
                    break
                value = execute(test, command)
                print(json.dumps({'id': command['id'], 'value': value}), flush=True)
            except Exception:
                # Never emit SQL, claims, proofs, fixture names, or private payloads.
                identifier = command.get('id') if isinstance(command, dict) else None
                print(json.dumps({'id': identifier, 'error': 'fixture_error'}), flush=True)
    finally:
        if ready:
            WorkspaceBoundary.tearDownClass()


if __name__ == '__main__':
    main()
