"""Local disposable-Postgres proof for the prepared exact staging operator transaction.
Never accepts a hosted connection, executes a grant on hosted data, or logs credentials.
"""
import concurrent.futures
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('role_fixture', ROOT/'scripts/onboarding/test_boundary.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
Fixture = module.Boundary
SQL = (ROOT/'scripts/staging/separate_synthetic_owner.sql').read_text()
OP = 'f0e9ca53-7ecf-4c2b-aa83-47a496bfcf0b'
A = 'b2c7920d-d467-4e9f-9a68-809ac627399e'
B = 'c8a4045a-a636-4bad-86f3-68f2036666f6'
OLD = 'user_3L0kOSQNQmbTetNTefF6gqkNF64'
NEW = 'user_3L5mZMvNN95teSpCPM233gzC06S'
OLD_ID = '00000000-0000-4000-8000-000000000801'
NEW_ID = '00000000-0000-4000-8000-000000000802'
OLD_MEMBER = '889717c1-c317-4544-8aad-dfb48091c9e3'
GUARDIAN = 'e9a0266f-78cb-4bf4-8e17-4e778b3f75ce'
B_MEMBER = '67b04312-8952-4ebe-bf59-a02f0b7d93ea'


class Separation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Fixture.setUpClass()
        for name in ['20261024100827_i2a_synthetic_player_registration.sql',
                     '20261025111253_i2b_synthetic_guardian_appointments.sql']:
            Fixture.sql((ROOT/'supabase/migrations'/name).read_text())
        Fixture.sql(f"insert into academy.identities(id,clerk_subject) values('{OLD_ID}','{OLD}'),('{NEW_ID}','{NEW}');"
                    f"insert into academy.academies(id,name,setup_complete) values('{A}','AcademyOS M1 Synthetic Academy',true),('{B}','AcademyOS M1 Isolation Academy B',true);"
                    f"insert into academy.platform_grants(subject,granted_by,reason) values('{OLD}','synthetic_operator','local fixture only');")

    @classmethod
    def tearDownClass(cls):
        Fixture.tearDownClass()

    def setUp(self):
        Fixture.sql(f"delete from academy.guardian_links where academy_id='{A}';"
                    f"delete from academy.guardian_invitations where academy_id='{A}';"
                    f"delete from academy.guardian_people where academy_id='{A}';"
                    f"delete from academy.players where academy_id='{A}';"
                    f"delete from academy.branches where academy_id='{A}';"
                    f"delete from academy.audit_events where operation_id='{OP}';"
                    f"delete from academy.memberships where academy_id in ('{A}','{B}');"
                    f"insert into academy.memberships(id,identity_id,academy_id,role,status) values"
                    f"('{OLD_MEMBER}','{OLD_ID}','{A}','owner','active'),"
                    f"('{GUARDIAN}','{NEW_ID}','{A}','guardian','active'),"
                    f"('{B_MEMBER}','{NEW_ID}','{B}','owner','active');")

    def apply(self, authorized=True, ok=True, sql=SQL):
        marker = f"set academy.operator_approval='{OP}';" if authorized else ''
        return Fixture.sql(marker+sql, ok=ok)

    def summary(self):
        return Fixture.sql(f"select jsonb_build_object('old', (select status from academy.memberships where id='{OLD_MEMBER}'),"
                           f"'new', (select count(*) from academy.memberships where identity_id='{NEW_ID}' and academy_id='{A}' and role='owner' and status='active'),"
                           f"'guardian',(select status from academy.memberships where id='{GUARDIAN}'),"
                           f"'b',(select status from academy.memberships where id='{B_MEMBER}'),"
                           f"'audit',(select count(*) from academy.audit_events where operation_id='{OP}'))")

    def test_01_without_exact_marker_cannot_change_roles(self):
        before = self.summary()
        self.apply(authorized=False, ok=False)
        self.assertEqual(self.summary(), before)

    def test_02_atomic_expected_result_preserves_history_and_retries(self):
        before = Fixture.sql('select count(*) from academy.audit_events')
        self.apply()
        result = self.summary()
        self.assertEqual(Fixture.sql(f"select count(*) from academy.memberships where academy_id='{A}' and role='owner' and status='active'"), '1')
        self.assertEqual(Fixture.sql(f"select status from academy.memberships where id='{OLD_MEMBER}'"), 'ended')
        self.assertEqual(Fixture.sql(f"select status from academy.memberships where id='{GUARDIAN}'"), 'ended')
        self.assertEqual(Fixture.sql(f"select active from academy.platform_grants where subject='{OLD}'"), 't')
        self.assertEqual(int(Fixture.sql('select count(*) from academy.audit_events')), int(before)+1)
        self.apply()
        self.assertEqual(self.summary(), result)
        self.assertEqual(Fixture.sql(f"select count(*) from academy.identities where id in ('{OLD_ID}','{NEW_ID}')"), '2')

    def test_03_concurrent_retries_make_one_owner_and_one_audit(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(lambda _: self.apply(), range(4)))
        self.assertEqual(Fixture.sql(f"select count(*) from academy.audit_events where operation_id='{OP}'"), '1')
        self.assertEqual(Fixture.sql(f"select count(*) from academy.memberships where identity_id='{NEW_ID}' and academy_id='{A}' and role='owner'"), '1')

    def test_04_changed_sole_owner_aborts_without_partial_ending(self):
        Fixture.sql(f"update academy.memberships set status='suspended' where id='{OLD_MEMBER}'")
        before = self.summary()
        self.apply(ok=False)
        self.assertEqual(self.summary(), before)

    def test_05_changed_b_owner_aborts(self):
        Fixture.sql(f"update academy.memberships set status='suspended' where id='{B_MEMBER}'")
        before = self.summary()
        self.apply(ok=False)
        self.assertEqual(self.summary(), before)

    def test_06_error_after_changes_rolls_back_all(self):
        broken = SQL.replace("insert into academy.audit_events", "raise exception 'fixture failure before audit';\n insert into academy.audit_events", 1)
        before = self.summary()
        self.apply(ok=False, sql=broken)
        self.assertEqual(self.summary(), before)

    def test_07_changed_after_result_is_not_silently_restored(self):
        self.apply()
        Fixture.sql(f"update academy.memberships set status='suspended' where identity_id='{NEW_ID}' and academy_id='{A}' and role='owner'")
        before = self.summary()
        self.apply(ok=False)
        self.assertEqual(self.summary(), before)

    def test_08_ordinary_database_role_cannot_apply_operator_sql(self):
        before = self.summary()
        Fixture.sql("set role authenticated;"+f"set academy.operator_approval='{OP}';"+SQL, ok=False)
        self.assertEqual(self.summary(), before)

    def test_09_active_guardian_link_blocks_unused_membership_cleanup(self):
        ids = ['00000000-0000-4000-8000-00000000081'+str(i) for i in range(1,6)]
        branch,player,person,invitation,link = ids
        Fixture.sql(f"insert into academy.branches(id,academy_id,name) values('{branch}','{A}','Synthetic fixture branch');"
                    f"insert into academy.players(id,academy_id,branch_id,display_name,normalized_name) values('{player}','{A}','{branch}','Fictional Player','fictional player');"
                    f"insert into academy.guardian_people(id,academy_id,identity_id,membership_id) values('{person}','{A}','{NEW_ID}','{GUARDIAN}');"
                    f"insert into academy.guardian_invitations(id,academy_id,player_id,recipient,approved_by,token_hash,state,accepted_by) values('{invitation}','{A}','{player}','fictional@example.invalid','{OLD}',repeat('b',64),'accepted','{NEW}');"
                    f"insert into academy.guardian_links(id,invitation_id,academy_id,guardian_id,player_id) values('{link}','{invitation}','{A}','{person}','{player}');")
        before = self.summary()
        self.apply(ok=False)
        self.assertEqual(self.summary(), before)
        self.assertEqual(Fixture.sql(f"select state from academy.guardian_links where id='{link}'"), 'active')


if __name__ == '__main__':
    unittest.main(defaultTest='Separation', verbosity=2)
