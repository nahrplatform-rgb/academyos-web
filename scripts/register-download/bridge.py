"""Test-only JSON bridge to actual disposable PG17. No provider/hosted secrets."""
import json
import runpy
import sys
import subprocess
import traceback
import time
from pathlib import Path

module = runpy.run_path(str(Path(__file__).with_name('test_boundary.py')))
Boundary = module['DownloadBoundary']
ready = False
try:
    Boundary.setUpClass()
    ready = True
    test = Boundary()
    print(json.dumps({'ready': True}), flush=True)
    for line in sys.stdin:
        command = json.loads(line)
        try:
            action = command['action']
            if action == 'close':
                break
            if action == 'fixture':
                size = command.get('size', 60)
                if size == 0:
                    a, b, ev, _, _ = test.pair()
                    test.sql(f"delete from academy.publication_rosters where event_id='{ev}';update academy.publication_events set roster_count=0 where id='{ev}'")
                else:
                    a, b, ev = test.scale(size, command.get('wide', False))
                data = {'academy': a, 'event': ev}
            elif action == 'rpc':
                args = command['args']
                data = test.download(args['a'], args['ev'], args['act'], args['previous'],
                    args['expected'], args['after_id'], command.get('who', 'user_owner'))
            elif action == 'mark':
                a, ev = command['academy'], command['event']
                player = test.sql(f"select player_id from academy.publication_rosters where event_id='{ev}'order by player_id limit 1")
                data = test.mark(a, ev, player, 'user_owner')
            elif action == 'revoke':
                test.sql(f"update academy.memberships set status='suspended'where academy_id='{command['academy']}'and role='owner'")
                data = True
            elif action == 'withdraw':
                test.sql(f"delete from academy.publication_heads where event_id='{command['event']}'")
                data = True
            elif action == 'baseline':
                after, pages, rows, size = None, 0, 0, 0
                start = time.perf_counter()
                while True:
                    page = test.roster(command['academy'], command['event'], 'user_owner', after=after)
                    pages += 1
                    rows += len(page['players'])
                    size += len(json.dumps({'data': page}, ensure_ascii=False, separators=(',', ':')).encode())
                    if not page['more']:
                        break
                    after = page['players'][-1]['id']
                data = {'requests': pages, 'rows': rows, 'bytes': size, 'ms': (time.perf_counter()-start)*1000,
                    'coherence': 'per-row-only', 'transport': 'Direct fixture RPC; same PG/psql bridge, no API/WebCrypto'}
            elif action == 'explain':
                a, ev = command['academy'], command['event']
                query = 'begin;' + test.caller('user_owner', '/rpc/x17_register_download_v1') + f"explain(analyze,buffers,format json)select public.x17_register_download_v1('{a}','{ev}','manifest');commit;"
                result = subprocess.run(test.base, input=query, text=True, capture_output=True, check=True)
                data = json.loads(result.stdout.strip())
            else:
                raise ValueError('Unsupported fixture action')
            print(json.dumps({'id': command['id'], 'data': data}), flush=True)
        except Exception as error:
            # Do not emit SQL, claims, HMACs or fixture key material into receipts.
            print(json.dumps({'id': command['id'], 'error': 'database_refused_' + type(error).__name__ + '_' + str(traceback.extract_tb(error.__traceback__)[-1].lineno)}), flush=True)
finally:
    if ready:
        Boundary.tearDownClass()
