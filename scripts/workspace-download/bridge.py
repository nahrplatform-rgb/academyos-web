"""JSONL bridge to one disposable PG17 workspace fixture; no hosted connection."""
import json
import re
import runpy
import subprocess
import sys
from pathlib import Path

module = runpy.run_path(str(Path(__file__).with_name('test_boundary.py')))
WorkspaceBoundary = module['WorkspaceBoundary']
literal = module['literal']
TARGET = 'x21_workspace_transfer_v1'
FIELDS = ('a', 'device', 'ns', 'expected_subject', 'act', 'previous', 'month_anchor')


def rpc(test, command):
    if command.get('target') != TARGET:
        raise ValueError('Unsupported target')
    args = command['args']
    if not isinstance(args, dict) or set(args) != set(FIELDS):
        raise ValueError('Invalid arguments')
    if not isinstance(command['subject'], str) or not isinstance(command['proof'], str):
        raise ValueError('Invalid caller')
    if args['previous'] is not None and not isinstance(args['previous'], dict):
        raise ValueError('Invalid receipt')
    for field in FIELDS:
        if field != 'previous' and args[field] is not None and not isinstance(args[field], str):
            raise ValueError('Invalid argument')
    sql_args = []
    for field in FIELDS:
        value = args[field]
        if value is None:
            sql_args.append('null')
        elif field == 'previous':
            sql_args.append(literal(json.dumps(value)) + '::jsonb')
        else:
            sql_args.append(literal(value))
    claims = json.dumps({'iss': 'https://immune-grizzly-7875.clerk.accounts.dev',
                         'sub': command['subject'], 'role': 'authenticated'})
    headers = json.dumps({'x-academyos-gateway': command['proof']})
    query = ("\\set VERBOSITY verbose\nbegin;set local role authenticated;"
             f"set local request.jwt.claims={literal(claims)};"
             f"set local request.path='/rpc/{TARGET}';set local request.method='POST';"
             f"set local request.headers={literal(headers)};"
             f"select public.{TARGET}({','.join(sql_args)});commit;")
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
        academy, branch = test.academy()
        test.seed_people(academy, branch, size)
        slot = test.key(academy)
        return {'academy': academy, 'branch': branch,
                'device': slot['device'], 'namespace': slot['namespace']}
    if action == 'rpc':
        return rpc(test, command)
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
