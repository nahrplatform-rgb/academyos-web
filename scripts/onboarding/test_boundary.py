"""Disposable PostgreSQL M1 contract checks. Never point this runner at hosted data.
Run: python3 scripts/onboarding/test_boundary.py
Creates an isolated temporary PG17 cluster and removes it after tests.
"""
import concurrent.futures
import hashlib
import hmac
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import unittest
import uuid

ROOT=Path(__file__).resolve().parents[2]
BIN=Path(os.environ.get('M1_POSTGRES_BIN','/opt/homebrew/opt/postgresql@17/bin'))
KEY='a'*64
ISS='https://immune-grizzly-7875.clerk.accounts.dev'

def literal(value):
    return "'"+str(value).replace("'","''")+"'"

class Boundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (BIN/'initdb').exists():
            raise RuntimeError('PostgreSQL runtime missing; set M1_POSTGRES_BIN. No skipped pass.')
        cls.tmp=tempfile.mkdtemp(prefix='academyos-m1-')
        subprocess.run([str(BIN/'initdb'),'-D',cls.tmp+'/db','-A','trust','--no-locale','--encoding=UTF8'],check=True,stdout=subprocess.DEVNULL)
        subprocess.run([str(BIN/'pg_ctl'),'-D',cls.tmp+'/db','-l',cls.tmp+'/log','-o',f'-p 55441 -h 127.0.0.1 -k {cls.tmp}','start'],check=True,stdout=subprocess.DEVNULL)
        cls.base=[str(BIN/'psql'),'-X','-qAt','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','55441','postgres']
        # Storage migration does not belong to this plain PG authorization harness.
        for f in ['supabase/tests/harness.sql','supabase/migrations/20261021165259_identity_baseline.sql','supabase/migrations/20261021165332_membership_reads.sql','supabase/migrations/20261021165645_restrict_auto_rls_trigger.sql','supabase/migrations/20261022111911_controlled_onboarding_m1.sql','supabase/tests/membership_boundary.sql']:
            subprocess.run(cls.base+['-f',str(ROOT/f)],check=True,stdout=subprocess.DEVNULL)
        cls.sql("insert into academy.m1_secrets values('onboarding',"+literal(KEY)+"); insert into academy.platform_grants(subject,granted_by,reason) values('user_platform','test-harness','synthetic fixture only');")

    @classmethod
    def tearDownClass(cls):
        subprocess.run([str(BIN/'pg_ctl'),'-D',cls.tmp+'/db','stop','-m','fast'],check=True,stdout=subprocess.DEVNULL)
        shutil.rmtree(cls.tmp)

    @classmethod
    def sql(cls,query,subject=None,role='authenticated',ok=True):
        if subject:
            claims=json.dumps(dict(iss=ISS,sub=subject,role='authenticated'))
            query=f"begin;set local role {role};set local request.jwt.claims={literal(claims)};"+query+';commit;'
        r=subprocess.run(cls.base,input=query,text=True,capture_output=True)
        if ok and r.returncode: raise AssertionError(r.stderr)
        if not ok and not r.returncode:raise AssertionError('Expected denial: '+query)
        return r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ''

    def create(self):
        op,inv=str(uuid.uuid4()),str(uuid.uuid4());token='b'*64
        q=f"select public.m1_create_v1('{op}','{inv}','Synthetic Academy','owner@academy.example','{hashlib.sha256(token.encode()).hexdigest()}')"
        result=json.loads(self.sql(q,'user_platform'));return result,op,inv,token,q

    def proof(self,inv,token,subject='user_owner',email='owner@academy.example',delta=0):
        target=inv+':'+hashlib.sha256(token.encode()).hexdigest();issued=int(time.time())+delta
        values=['recipient',target,subject,str(issued),email]
        p=dict(purpose='recipient',target=target,subject=subject,issued=issued,emails=email,signature=hmac.new(KEY.encode(),'\n'.join(values).encode(),hashlib.sha256).hexdigest())
        return literal(json.dumps(p))+'::jsonb'

    def accept(self,inv,token,subject='user_owner',email='owner@academy.example',op=None,ok=True,delta=0):
        return self.sql(f"select public.m1_invitation_v1('{inv}','{token}',{self.proof(inv,token,subject,email,delta)},'{op or uuid.uuid4()}')",subject,ok=ok)

    def save(self,a,version,step,fields,subject='user_owner',op=None,ok=True):
        return self.sql(f"select public.m1_save_setup_v1('{a}','{op or uuid.uuid4()}',{version},'{step}',{literal(json.dumps(fields))}::jsonb)",subject,ok=ok)

    def test_01_ordinary_signup_and_direct_tables_denied(self):
        r=json.loads(self.sql('select public.m1_context_v1()','user_signup'));self.assertFalse(r['platform']);self.assertEqual(r['memberships'],[])
        for table in ['academies','memberships','platform_grants','owner_invitations','m1_secrets','operations','audit_events','branches','sports','initial_setup']:
            self.sql('select * from academy.'+table,'user_signup',ok=False)
        self.sql("select public.m1_platform_list_v1()",'user_signup',ok=False)
        rls=self.sql("select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='academy' and c.relkind='r'")
        self.assertEqual(rls,'t')

    def test_02_duplicate_create_payload_and_concurrency(self):
        r,op,inv,token,q=self.create()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
            results=list(pool.map(lambda _:self.sql(q,'user_platform'),range(10)))
        self.assertTrue(all(json.loads(x)==r for x in results))
        self.sql(q.replace('Synthetic Academy','Changed payload'),'user_platform',ok=False)
        self.assertEqual(self.sql(f"select count(*) from academy.owner_invitations where id='{inv}'"),'1')
        self.assertEqual(self.sql(f"select count(*) from academy.audit_events where operation_id='{op}'"),'1')
        self.assertEqual(json.loads(self.sql(f"select public.m1_operation_v1('{op}')",'user_platform'))['result'],r)

    def test_03_recipient_expiry_revoke_and_proof_forgery(self):
        r,op,inv,token,q=self.create()
        self.accept(inv,token,email='wrong@academy.example',ok=False)
        self.accept(inv,token,delta=-60,ok=False)
        self.accept(inv,'c'*64,ok=False)
        self.sql(f"select public.m1_invitation_v1('{inv}','{token}','{{}}'::jsonb)",'user_owner',ok=False)
        self.sql(f"update academy.owner_invitations set expires_at=now()-interval '1 second' where id='{inv}'")
        self.accept(inv,token,ok=False)
        self.sql(f"update academy.owner_invitations set expires_at=now()+interval '1 hour',revoked=true where id='{inv}'")
        self.accept(inv,token,ok=False)
        self.assertEqual(self.sql(f"select count(*) from academy.memberships where academy_id='{r['academy_id']}'"),'0')

    def test_04_accept_race_resume_conflict_and_atomic_completion(self):
        r,_,inv,token,_=self.create();a=r['academy_id'];op=str(uuid.uuid4())
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
            results=list(pool.map(lambda _:self.accept(inv,token,op=op),range(10)))
        self.assertTrue(all(json.loads(x)['accepted'] for x in results))
        self.assertEqual(self.sql(f"select count(*) from academy.memberships where academy_id='{a}'"),'1')
        self.accept(inv,token,subject='user_other',ok=False)
        self.save(a,0,'complete',{},ok=False)
        self.assertEqual(json.loads(self.sql(f"select public.m1_setup_v1('{a}')",'user_owner'))['version'],0)
        b=json.loads(self.save(a,0,'branch',{'name':'Synthetic branch','timezone':'Africa/Cairo'}));self.assertEqual(b['version'],1)
        self.save(a,0,'branch',{'name':'stale','timezone':'Africa/Cairo'},ok=False)
        self.save(a,1,'branch',{'name':'bad timezone','timezone':'invented/zone'},ok=False)
        self.save(a,1,'sport',{'label_en':'Synthetic Sport','label_ar':'رياضة اختبار'})
        result=json.loads(self.save(a,2,'complete',{}));self.assertTrue(result['complete'])
        self.assertEqual(json.loads(self.sql(f"select public.m1_setup_v1('{a}')",'user_owner')),result)
        self.assertEqual(self.sql(f"select count(*) from academy.branches where academy_id='{a}'"),'1')
        self.assertEqual(self.sql(f"select count(*) from academy.sports where academy_id='{a}'"),'1')

    def test_05_two_academies_wrong_roles_revocation(self):
        r,_,inv,token,_=self.create();a=r['academy_id'];self.accept(inv,token)
        other,_,iv,tk,_=self.create();b=other['academy_id'];self.accept(iv,tk,subject='user_b')
        self.sql(f"select public.m1_setup_v1('{b}')",'user_owner',ok=False)
        self.save(b,0,'branch',{'name':'foreign','timezone':'Africa/Cairo'},ok=False)
        for role in ['manager','trainer','guardian','player']:
            subject='user_'+role
            self.sql(f"insert into academy.identities(clerk_subject) values('{subject}') on conflict do nothing;insert into academy.memberships(identity_id,academy_id,role,status) select id,'{a}','{role}','active' from academy.identities where clerk_subject='{subject}';")
            self.save(a,0,'branch',{'name':'wrong role','timezone':'Africa/Cairo'},subject=subject,ok=False)
        self.sql(f"select public.m1_setup_v1('{a}')",'user_platform',ok=False)
        self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'")
        self.sql(f"select public.m1_setup_v1('{a}')",'user_owner',ok=False)
        self.accept(inv,token,ok=False)

    def test_06_concurrent_edits_have_one_winner(self):
        r,_,inv,token,_=self.create();a=r['academy_id'];self.accept(inv,token)
        def run(n):
            try:self.save(a,0,'branch',{'name':f'Branch {n}','timezone':'Africa/Cairo'});return True
            except AssertionError as e:
                self.assertIn('Version conflict',str(e));return False
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:results=list(pool.map(run,range(10)))
        self.assertEqual(sum(results),1)
        self.assertEqual(self.sql(f"select count(*) from academy.branches where academy_id='{a}'"),'1')

    def test_07_aborted_operation_rolls_back(self):
        r,_,inv,token,_=self.create();a=r['academy_id'];self.accept(inv,token)
        self.sql(f"begin;set local role authenticated;set local request.jwt.claims={literal(json.dumps(dict(iss=ISS,sub='user_owner',role='authenticated')))};select public.m1_save_setup_v1('{a}','{uuid.uuid4()}',0,'branch','{{\"name\":\"Interrupted\",\"timezone\":\"Africa/Cairo\"}}');rollback;")
        result=json.loads(self.sql(f"select public.m1_setup_v1('{a}')",'user_owner'));self.assertEqual(result['version'],0);self.assertIsNone(result['branch'])

    def test_08_lease_proof_and_unknown_delivery(self):
        _,_,inv,_,_=self.create()
        def proof(lease=None,outcome=None):
            target=f'{inv}:1:{lease or "claim"}:{outcome or ""}';issued=int(time.time());subject='user_delivery_worker';msg='\n'.join(['delivery',target,subject,str(issued),'']);return literal(json.dumps(dict(purpose='delivery',target=target,subject=subject,issued=issued,emails='',signature=hmac.new(KEY.encode(),msg.encode(),hashlib.sha256).hexdigest())))+'::jsonb'
        self.sql(f"select public.m1_delivery_v1('{inv}',1,'{{}}')",'user_signup',ok=False)
        result=json.loads(self.sql(f"select public.m1_delivery_v1('{inv}',1,{proof()})"));self.assertTrue(result['send'])
        second=json.loads(self.sql(f"select public.m1_delivery_v1('{inv}',1,{proof()})"));self.assertFalse(second['send'])
        lease=result['lease'];self.sql(f"select public.m1_delivery_v1('{inv}',1,{proof(lease,'unknown')},'{lease}','unknown')")
        final=json.loads(self.sql(f"select public.m1_delivery_v1('{inv}',1,{proof()})"));self.assertFalse(final['send'])

    def test_09_backup_restore_preserves_private_boundary(self):
        dump=self.tmp+'/synthetic.dump'
        subprocess.run([str(BIN/'pg_dump'),'-h','127.0.0.1','-p','55441','-Fc','-f',dump,'postgres'],check=True,capture_output=True)
        subprocess.run([str(BIN/'createdb'),'-h','127.0.0.1','-p','55441','m1_restored'],check=True,capture_output=True)
        subprocess.run([str(BIN/'pg_restore'),'-h','127.0.0.1','-p','55441','--no-owner','--exit-on-error','-d','m1_restored',dump],check=True,capture_output=True)
        result=subprocess.run(self.base[:-1]+['m1_restored'],input="select count(*) from academy.owner_invitations; select bool_and(c.relrowsecurity and not has_table_privilege('authenticated',c.oid,'select')) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='academy' and c.relkind='r';",text=True,capture_output=True,check=True)
        self.assertTrue(int(result.stdout.strip().splitlines()[0])>0)
        self.assertEqual(result.stdout.strip().splitlines()[1],'t')

    def test_10_reissue_invalidates_old_secret_and_revoked_grant(self):
        r,_,inv,token,_=self.create()
        new_token='d'*64;new_hash=hashlib.sha256(new_token.encode()).hexdigest()
        self.sql(f"select public.m1_manage_invitation_v1('{inv}','{uuid.uuid4()}',1,'reissue','{new_hash}')",'user_platform')
        self.accept(inv,token,ok=False)
        self.accept(inv,new_token)
        self.sql(f"select public.m1_manage_invitation_v1('{inv}','{uuid.uuid4()}',2,'revoke')",'user_platform',ok=False)
        self.sql("update academy.platform_grants set active=false where subject='user_platform'")
        self.sql("select public.m1_platform_list_v1()",'user_platform',ok=False)
        self.sql("update academy.platform_grants set active=true where subject='user_platform'")

    def test_11_membership_paging_is_complete_and_bounded(self):
        self.sql("insert into academy.identities(clerk_subject) values('user_many'); with created as (insert into academy.academies(name) select 'Synthetic page '||n from generate_series(1,30) n returning id) insert into academy.memberships(identity_id,academy_id,role,status) select i.id,c.id,'owner','active' from academy.identities i cross join created c where i.clerk_subject='user_many'")
        first=json.loads(self.sql('select public.m1_context_v1()','user_many'))
        self.assertEqual(len(first['memberships']),25);self.assertTrue(first['more'])
        cursor=first['memberships'][-1]['membership_id']
        second=json.loads(self.sql(f"select public.m1_context_v1('{cursor}')",'user_many'))
        self.assertEqual(len(second['memberships']),5);self.assertFalse(second['more'])
        self.assertEqual(len({m['membership_id'] for m in first['memberships']+second['memberships']}),30)

    def test_12_revoke_accept_race_has_consistent_authority(self):
        _,_,inv,token,_=self.create()
        def accept():
            try:self.accept(inv,token);return 'accepted'
            except AssertionError as e:
                self.assertIn('Invitation unavailable',str(e));return 'denied'
        def revoke():
            try:self.sql(f"select public.m1_manage_invitation_v1('{inv}','{uuid.uuid4()}',1,'revoke')",'user_platform');return 'revoked'
            except AssertionError as e:
                self.assertIn('Invitation unavailable',str(e));return 'denied'
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            first=pool.submit(accept);second=pool.submit(revoke);results=[first.result(),second.result()]
        self.assertIn(results,[['accepted','denied'],['denied','revoked']])
        record=json.loads(self.sql(f"select json_build_object('revoked',revoked,'accepted',redeemed_by is not null) from academy.owner_invitations where id='{inv}'"))
        self.assertNotEqual(record['revoked'],record['accepted'])

if __name__=='__main__':unittest.main(verbosity=2)
