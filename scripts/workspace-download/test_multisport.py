"""Exercise the EX-17 upgrade and connected workflow on disposable PostgreSQL."""
import json
from pathlib import Path
import runpy
import unittest
import uuid

boundary = runpy.run_path(str(Path(__file__).with_name('test_boundary.py')))
ROOT, WorkspaceBoundary, literal = (boundary[name] for name in ('ROOT', 'WorkspaceBoundary', 'literal'))


class MultisportBoundary(WorkspaceBoundary):
    def test_upgrade_setup_program_and_operating_reads(self):
        a, _, invitation, token, _ = self.create()
        academy = a['academy_id']
        self.accept(invitation, token)
        self.save(academy, 0, 'branch', {'name': 'Main', 'timezone': 'Africa/Cairo'})
        self.save(academy, 1, 'sport', {'label_en': 'Football', 'label_ar': 'كرة القدم'})
        self.save(academy, 2, 'complete', {})
        setup = json.loads(self.sql(f"select public.m1_setup_v1('{academy}')", 'user_owner'))
        branch = setup['branch']['id']
        football = setup['sport']['id']
        definition = {'name': 'Shared session', 'from': '2099-11-01', 'to': '2099-11-07',
                      'rules': [{'day': 0, 'start': '09:00', 'end': '10:00'}]}
        original = uuid.uuid4()
        review = self.review(academy, definition)
        original_create = (
            f"select public.p5_create_v1('{academy}','{original}',"
            f"{literal(json.dumps(definition))}::jsonb,3,{literal(json.dumps(review))}::jsonb)"
        )
        legacy = json.loads(self.sql(original_create, 'user_owner'))
        foreign, _ = self.academy('user_other_owner')
        migration, = (ROOT / 'supabase/migrations').glob('*_ex17_multisport_foundation.sql')
        self.sql(migration.read_text())

        operation = str(uuid.uuid4())
        fields = {'key': 'swimming'}
        enabled = json.loads(self.save(academy, 3, 'enable_sport', fields, op=operation))
        swim = enabled['enabled_sport_id']
        self.assertEqual([(s['id'], s['catalog_key']) for s in enabled['sports']],
                         [(football, 'football'), (swim, 'swimming')])
        self.assertTrue(enabled['complete'])
        self.assertEqual(enabled['version'], 3)
        self.assertEqual(json.loads(self.save(academy, 3, 'enable_sport', fields, op=operation)), enabled)
        self.assertEqual(json.loads(self.save(academy, 3, 'enable_sport', fields))['enabled_sport_id'], swim)
        self.save(academy, 3, 'enable_sport', fields, subject='user_other_owner', ok=False)
        self.save(academy, 3, 'enable_sport', {'key': 'tennis'}, ok=False)
        self.assertEqual(json.loads(self.sql(original_create, 'user_owner'))['id'], legacy['id'])
        self.assertEqual(json.loads(self.sql(
            f"select public.m1_operation_v1('{operation}')", 'user_owner'))['result'], enabled)

        swim_definition = dict(definition, sport_id=swim)
        self.sql(f"select public.p5_create_v1('{academy}',gen_random_uuid(),"
                 f"{literal(json.dumps(swim_definition))}::jsonb,3,{literal(json.dumps(review))}::jsonb)",
                 'user_owner', ok=False)
        swim_definition['rules'] = [{'day': 0, 'start': '11:00', 'end': '12:00'}]
        self.sql(f"select public.p5_preview_v1('{foreign}',"
                 f"{literal(json.dumps(swim_definition))}::jsonb,3,0)", 'user_other_owner', ok=False)
        swim_program = self.ready(academy, swim_definition)
        legacy = json.loads(self.step(academy, legacy))
        legacy = json.loads(self.step(academy, legacy, 'finalize'))
        expected = {legacy['id']: ('Football', 'كرة القدم'), swim_program['id']: ('Swimming', 'السباحة')}

        player = self.person(academy, branch)
        staff, _ = self.staff(academy, branch)
        for program, sport in [(legacy, football), (swim_program, swim)]:
            reopened = json.loads(self.read(academy, program))
            self.assertEqual(reopened['program']['sport_id'], sport)
            self.assertEqual((reopened['program']['sport_name'], reopened['program']['sport_name_ar']),
                             expected[program['id']])
            self.read(foreign, program, subject='user_other_owner', ok=False)
            day = reopened['dates'][0]['date']
            saved = json.loads(self.plan(academy, program, day=day, trainer=staff, add=[player]))
            self.assertEqual(saved.get('version'), 1, saved)
            job = self.prepare_pub(academy, self.pub(academy, program, first=day, last=day))
            self.assertEqual(self.mutate(academy, job, 'activate')['state'], 'committed')

        slot = self.key(academy)
        prepared, _, _ = self.transfer(academy, slot, 'calendar:2099-11')
        online = self.calendar(academy)['items']
        for rows in [online, prepared]:
            self.assertEqual({r['program']: (r['sport'], r['sport_ar']) for r in rows}, expected)
        self.calendar(academy, who='user_other_owner', ok=False)

        schedule = self.schedule(academy)['items']
        self.assertEqual({r['program']: (r['projection']['sport'], r['projection']['sport_ar'])
                          for r in schedule}, expected)
        day = schedule[0]['day']
        qr = json.loads(self.sql(f"select public.q13_sessions_v1('{academy}','{branch}','{day}')",
                                 'user_owner'))['items']
        self.assertEqual({r['id']: r['projection'] for r in qr},
                         {r['id']: r['projection'] for r in schedule})
        for session in schedule:
            roster = self.roster(academy, session['id'], who='user_owner')
            self.assertEqual(roster['projection'], session['projection'])
            self.assertEqual([row['id'] for row in roster['players']], [player])
            self.roster(academy, session['id'], who='user_other_owner', ok=False)
        self.sql(f"select public.q13_sessions_v1('{academy}','{branch}','{day}')",
                 'user_other_owner', ok=False)


if __name__ == '__main__':
    unittest.main(defaultTest='MultisportBoundary.test_upgrade_setup_program_and_operating_reads', verbosity=2)
