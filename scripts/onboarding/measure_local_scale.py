"""Synthetic local-only M1 scale checks. Never accepts a remote database target.
Run: python3 scripts/onboarding/measure_local_scale.py --output-dir <local-directory>
Uses and always removes the existing disposable PostgreSQL harness cluster.
"""
import argparse
import concurrent.futures
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import platform
import re
import shutil
import subprocess
import threading
import time
import uuid
from test_boundary import Boundary, ROOT, literal


def summary(values):
    ordered=sorted(values)
    return dict(samples=len(values),minimum_ms=min(values),p50_ms=ordered[math.ceil(len(values)*.5)-1],p95_ms=ordered[math.ceil(len(values)*.95)-1],maximum_ms=max(values))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir',required=True,type=Path)
    args=parser.parse_args()
    args.output_dir.mkdir(parents=True,exist_ok=True)
    harness=Boundary()
    samples=[]
    # setUpClass is deliberately the same migration/authority harness as the
    # correctness suite. No service credential, remote URL or external identity.
    try:
        Boundary.setUpClass()
        # Thirty valid accepted academies exercise both chooser and platform
        # cursor pages. All admission/acceptance writes use migrated operations.
        for _ in range(30):
            _,_,inv,token,_=harness.create()
            harness.accept(inv,token,subject='user_many')
        first=json.loads(harness.sql('select public.m1_context_v1()','user_many'))
        assert len(first['memberships'])==25 and first['more']
        cursor=first['memberships'][-1]['membership_id']
        second=json.loads(harness.sql(f"select public.m1_context_v1('{cursor}')",'user_many'))
        assert len(second['memberships'])==5 and not second['more']
        assert len({m['membership_id'] for m in first['memberships']+second['memberships']})==30
        academies=[]
        for label in ['small_a','small_b','skew_c']:
            subject='user_scale_'+label
            record,_,inv,token,_=harness.create()
            academy=record['academy_id']
            harness.accept(inv,token,subject=subject)
            harness.save(academy,0,'branch',{'name':'Synthetic branch','timezone':'Africa/Cairo'},subject=subject)
            harness.save(academy,1,'sport',{'label_en':'Synthetic sport','label_ar':'رياضة اختبار'},subject=subject)
            harness.save(academy,2,'complete',{},subject=subject)
            academies.append((label,academy,subject))
        _,skew,skew_subject=academies[2]
        harness.sql(f"insert into academy.identities(clerk_subject) select 'user_scale_member_'||n from generate_series(1,29) n;insert into academy.memberships(identity_id,academy_id,role,status) select id,'{skew}','manager','active' from academy.identities where clerk_subject like 'user_scale_member_%';insert into academy.branches(academy_id,name) select '{skew}','Synthetic extra branch '||n from generate_series(1,59) n;insert into academy.sports(academy_id,label_en,label_ar) select '{skew}','Synthetic extra sport '||n,'رياضة اختبار '||n from generate_series(1,59) n;analyze academy.memberships;analyze academy.academies;analyze academy.branches;analyze academy.sports;analyze academy.identities;")
        fixture=json.loads(harness.sql(f"select json_build_object('skew_memberships',(select count(*) from academy.memberships where academy_id='{skew}'),'skew_branches',(select count(*) from academy.branches where academy_id='{skew}'),'skew_sports',(select count(*) from academy.sports where academy_id='{skew}'),'total_academies',(select count(*) from academy.academies))"))
        assert fixture==dict(skew_memberships=30,skew_branches=60,skew_sports=60,total_academies=33),fixture
        profiles=[(label,f"select public.m1_setup_v1('{academy}')",subject) for label,academy,subject in academies]
        profiles += [('context_first_page','select public.m1_context_v1()','user_many'),('platform_first_page','select public.m1_platform_list_v1()','user_platform')]
        for label,query,subject in profiles:
            result=json.loads(harness.sql(query,subject))
            if label=='context_first_page':
                assert len(result['memberships'])==25 and result['more']
            elif label=='platform_first_page':
                assert len(result['items'])==25 and result['more']
                cursor=result['items'][-1]['id']
                second=json.loads(harness.sql(f"select public.m1_platform_list_v1('{cursor}')",subject))
                assert len(second['items'])==8 and not second['more']
                assert len({a['id'] for a in result['items']+second['items']})==33
            else:
                expected=next(a for l,a,_ in academies if l==label)
                assert result['academy_id']==expected and result['version']==3 and result['complete']
            payload_bytes=len(json.dumps(result,ensure_ascii=False,separators=(',',':')).encode())
            assert payload_bytes<=32768
            for index in range(50):
                started=time.perf_counter()
                name=re.search(r'public\.([a-z0-9_]+)\(',query).group(1)
                script='begin;'+harness.caller(subject,'/rpc/'+name)+'explain (analyze,buffers,format json) '+query+';commit;'
                response=subprocess.run(harness.base,input=script,text=True,capture_output=True,timeout=20)
                assert response.returncode==0,response.stderr
                # EXPLAIN JSON is a multiline field; never truncate to the last
                # line using the ordinary scalar-query helper.
                plan=json.loads(response.stdout)[0]
                wall=(time.perf_counter()-started)*1000
                node=plan['Plan']
                assert node['Actual Rows']==1
                samples.append(dict(profile=label,index=index,execution_ms=plan['Execution Time'],planning_ms=plan['Planning Time'],driver_wall_ms=round(wall,3),result_rows=node['Actual Rows'],shared_hit_blocks=node.get('Shared Hit Blocks',0),shared_read_blocks=node.get('Shared Read Blocks',0),payload_bytes=payload_bytes))
        # Twenty connections spread across three synthetic owner/academy pairs;
        # not twenty real personas, HTTP clients or production capacity.
        barrier=threading.Barrier(20)
        def read(index):
            label,academy,subject=academies[index%3]
            barrier.wait(timeout=10)
            started=time.perf_counter()
            result=json.loads(harness.sql(f"select public.m1_setup_v1('{academy}')",subject))
            assert result['academy_id']==academy and result['version']==3
            return (time.perf_counter()-started)*1000
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
            readers=list(pool.map(read,range(20)))
        def snapshot(a):
            return harness.sql(f"select json_build_object('version',setup_version,'complete',setup_complete,'operations',(select count(*) from academy.operations where academy_id='{a}'),'audits',(select count(*) from academy.audit_events where academy_id='{a}')) from academy.academies where id='{a}'")
        unrelated_before=snapshot(academies[1][1])
        before=json.loads(snapshot(skew))
        barrier=threading.Barrier(10)
        def write(index):
            op=str(uuid.uuid4())
            query=f"select public.m1_save_setup_v1('{skew}','{op}',3,'branch',"+literal(json.dumps({'name':'Synthetic competing '+str(index),'timezone':'Africa/Cairo'}))+"::jsonb)"
            script='begin;'+harness.caller(skew_subject,'/rpc/m1_save_setup_v1')+query+';commit;'
            barrier.wait(timeout=10)
            started=time.perf_counter()
            result=subprocess.run(harness.base+['--set=VERBOSITY=verbose'],input=script,text=True,capture_output=True,timeout=20)
            wall=(time.perf_counter()-started)*1000
            if result.returncode:
                assert 'PT409' in result.stderr,result.stderr
                return dict(outcome='version_conflict',driver_wall_ms=round(wall,3))
            body=json.loads(result.stdout.strip().splitlines()[-1])
            assert body['academy_id']==skew and body['version']==4 and not body['complete']
            return dict(outcome='committed',driver_wall_ms=round(wall,3))
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
            writers=list(pool.map(write,range(10)))
        assert sum(r['outcome']=='committed' for r in writers)==1
        after=json.loads(snapshot(skew))
        assert after['version']==4 and after['operations']==before['operations']+1 and after['audits']==before['audits']+1
        assert unrelated_before==snapshot(academies[1][1])
        # Same large fixture still denies every different role and foreign owner.
        for subject in ['user_scale_small_a','user_scale_small_b','user_scale_member_1']:
            script='begin;'+harness.caller(subject,'/rpc/m1_setup_v1')+f"select public.m1_setup_v1('{skew}');commit;"
            denied=subprocess.run(harness.base+['--set=VERBOSITY=verbose'],input=script,text=True,capture_output=True,timeout=20)
            assert denied.returncode!=0 and '42501' in denied.stderr,denied.stderr
        result=dict(collected_at_utc=datetime.now(timezone.utc).isoformat(),python=platform.python_version(),driver='new psql process/backend per observation; wall time includes launch and scheduling',plan_scope='outer function scan; no nested query row-examination attribution',cache_profile='warm shared buffers after fixture verification; no physical shared reads expected, no cold profile',scope='disposable local PostgreSQL; simulated JWT/gateway; no HTTP/Redis/Clerk/device/cost acceptance',postgres=harness.sql('show server_version'),os=platform.system(),os_release=platform.release(),architecture=platform.machine(),sample_source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),runner_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),fixtures=fixture,profiles={label:{'execution':summary([s['execution_ms'] for s in samples if s['profile']==label]),'driver_wall':summary([s['driver_wall_ms'] for s in samples if s['profile']==label]),'payload_bytes':next(s['payload_bytes'] for s in samples if s['profile']==label)} for label,_,_ in profiles},concurrent_readers={'connections':20,'actor_count':3,'academy_count':3,'successes':20,'driver_wall':summary(readers)},competing_writers={'connections':10,'committed':1,'version_conflicts':9,'operations_added':1,'audits_added':1,'unrelated_unchanged':True,'samples':writers},negative_access={'foreign_owners':2,'lower_role':1,'all_denied':True})
        (args.output_dir/'onboarding-m1-local-scale-samples.jsonl').write_text(''.join(json.dumps(s,sort_keys=True)+'\n' for s in samples))
        (args.output_dir/'onboarding-m1-local-scale-summary.json').write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
        print(json.dumps(result,sort_keys=True))
    finally:
        if hasattr(Boundary,'tmp'):
            if (Path(Boundary.tmp)/'db'/'postmaster.pid').exists():
                Boundary.tearDownClass()
            else:
                shutil.rmtree(Boundary.tmp,ignore_errors=True)


if __name__=='__main__':main()
