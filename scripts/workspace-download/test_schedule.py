"""Connected EX-18 Schedule contract on disposable PostgreSQL."""
import json
from pathlib import Path
import runpy
import unittest
import uuid

boundary = runpy.run_path(str(Path(__file__).with_name('test_boundary.py')))
ROOT, WorkspaceBoundary, literal = (boundary[name] for name in ('ROOT', 'WorkspaceBoundary', 'literal'))
TrainerBoundary = runpy.run_path(str(ROOT / 'scripts/trainers/test_boundary.py'))['TrainerBoundary']


class ScheduleBoundary(WorkspaceBoundary):
    def test_multisport_schedule(self):
        academy, branch = self.academy()
        self.sql((ROOT / 'supabase/migrations/20261121014923_ex17_multisport_foundation.sql').read_text())
        self.save(academy, 3, 'enable_sport', {'key': 'football'})
        self.save(academy, 3, 'enable_sport', {'key': 'swimming'})
        setup = json.loads(self.sql(f"select public.m1_setup_v1('{academy}')", 'user_owner'))
        sports = {sport['catalog_key']: sport['id'] for sport in setup['sports']}
        first, last = '2099-11-01', '2100-01-31'
        definition = dict(self.definition(), **{'from': first, 'to': last})
        football = self.ready(academy, dict(definition, name='Football sessions', sport_id=sports['football']))
        swimming = self.ready(academy, dict(definition, name='Swimming sessions', sport_id=sports['swimming'], to=first))
        self.assertEqual(football['total'], 40)
        self.assertEqual(swimming['total'], 1)

        coach, _ = self.staff(academy, branch)
        swim_email = 'swim@example.invalid'
        _, invitation, token, _, _ = TrainerBoundary.command(self, academy, branch, email=swim_email)
        TrainerBoundary.recipient(self, invitation, token, 'accept', str(uuid.uuid4()),
                                  subject='user_swim_trainer', email=swim_email)
        swim_coach = self.sql(f"select staff_id from academy.trainer_invitations where id='{invitation}'")
        player = self.person(academy, branch)
        swimmer = self.person(academy, branch, 'Swim Player')
        self.assertEqual(json.loads(self.plan(academy, football, day=first, capacity=4,
                                             trainer=coach, add=[player]))['version'], 1)
        self.assertEqual(json.loads(self.plan(academy, swimming, day=first, capacity=3,
                                             trainer=swim_coach, add=[player]))['error'], 'overlap')
        self.assertEqual(json.loads(self.plan(academy, swimming, day=first, capacity=3,
                                             trainer=swim_coach, add=[swimmer]))['version'], 1)

        rules = literal(json.dumps(self.rules(coach)))
        proposal = json.loads(self.sql(
            f"select public.r7_create_v1('{academy}','{football['id']}',gen_random_uuid(),'{first}','{last}',{rules}::jsonb)",
            'user_owner'))
        for weekday in (0, 2, 4):
            proposal = self.mutation(academy, proposal, 'players', weekday=weekday, add=[player])
        proposal = self.prepared(academy, proposal)
        self.assertEqual(self.mutation(academy, proposal, 'activate')['state'], 'committed')
        self.assertEqual(self.sql(f"select count(*) from academy.date_plans where program_id='{football['id']}'"), '40')
        original_plan = json.loads(self.planning_read(academy, football, day=first))
        self.assertEqual((original_plan['capacity'], original_plan['count']), (4, 1))

        _, invitation, token, _, _ = self.guardian_command(academy, p=player)
        accepted = json.loads(self.guardian_recipient(invitation, token, 'accept', str(uuid.uuid4())))
        link = accepted['link_id']
        self.sql(f"insert into academy.guardian_training_access values('{link}',true)")
        self.assertEqual(self.schedule(academy)['items'], [])
        for program, through in [(football, last), (swimming, first)]:
            job = self.prepare_pub(academy, self.pub(academy, program, first=first, last=through))
            self.assertEqual(self.mutate(academy, job, 'activate')['state'], 'committed')

        rows = self.calendar(academy, first=first, last=first)['items']
        self.assertEqual({(row['sport'], row['sport_ar']) for row in rows},
                         {('Football', 'كرة القدم'), ('Swimming', 'السباحة')})
        self.assertEqual(len({row['starts_at'] for row in rows}), 1)
        self.assertTrue(all(row['published'] for row in rows))
        event = next(row['id'] for row in rows if row['program'] == football['id'])
        self.assertEqual({row['program'] for row in self.schedule(academy)['items']}, {football['id']})
        self.assertEqual([row['program'] for row in self.schedule(academy, subject='user_swim_trainer')['items']],
                         [swimming['id']])
        family = self.calendar(academy, actor='guardian', who='user_guardian', link=link, first=first, last=first)
        self.assertEqual([row['id'] for row in family['items']], [event])
        self.assertEqual(self.change(academy, football, first)['error'], 'published_locked')

        withdrawal = self.prepare_pub(academy, self.pub(academy, football, 'withdraw', first=first, last=first))
        self.assertEqual(self.mutate(academy, withdrawal, 'activate')['state'], 'committed')
        self.assertNotIn(event, [row['id'] for row in self.schedule(academy)['items']])
        self.family_read(academy, link, first, event=event, ok=False)
        self.assertEqual(len(self.schedule(academy, subject='user_swim_trainer')['items']), 1)

        moved_day = '2100-02-02'
        before = self.change_read(academy, football, first)
        self.assertTrue(self.change(academy, football, first, new=moved_day, read=before, save=False)['reviewed'])
        operation = str(uuid.uuid4())
        moved = self.change(academy, football, first, new=moved_day, read=before, op=operation)
        self.assertTrue(moved['changed'])
        recovered = json.loads(self.sql(f"select public.t9_operation_v1('{academy}','{operation}')", 'user_owner'))
        self.assertEqual(recovered, moved)
        self.assertEqual(self.change(academy, football, first, new=moved_day, read=before, op=operation), moved)
        self.assertEqual(self.change(academy, football, first, new=moved_day, read=before)['error'], 'stale')
        reopened = self.change_read(academy, football, first)
        self.assertEqual((reopened['plan']['day'], reopened['plan']['scheduled_day']), (first, moved_day))
        self.assertEqual((reopened['plan']['capacity'], reopened['plan']['count']), (4, 1))
        self.assertEqual(len(reopened['history']), 1)
        rows = self.calendar(academy, first=moved_day, last=moved_day)['items']
        self.assertEqual([(row['day'], row['state']) for row in rows], [(first, 'moved')])

        republish = self.prepare_pub(academy, self.pub(academy, football, first=first, last=first))
        self.assertEqual(self.mutate(academy, republish, 'activate')['state'], 'committed')
        moved_event = self.schedule(academy, first=moved_day)['items'][0]
        self.assertEqual((moved_event['program'], moved_event['day']), (football['id'], moved_day))
        family = self.calendar(academy, actor='guardian', who='user_guardian', link=link,
                               first=moved_day, last=moved_day)
        self.assertEqual([row['id'] for row in family['items']], [moved_event['id']])
        self.assertEqual(self.mutate(academy, self.prepare_pub(academy, self.pub(
            academy, football, 'withdraw', first=first, last=first)), 'activate')['state'], 'committed')
        self.assertTrue(self.change(academy, football, first, kind='cancel')['changed'])
        cancelled = self.change_read(academy, football, first)
        self.assertEqual(len(cancelled['history']), 2)
        self.assertEqual(cancelled['plan']['count'], 1)
        self.assertEqual(self.calendar(academy, first=moved_day, last=moved_day)['items'][0]['state'], 'cancelled')
        self.assertEqual(self.schedule(academy, first=moved_day)['items'], [])


if __name__ == '__main__':
    unittest.main(defaultTest='ScheduleBoundary.test_multisport_schedule', verbosity=2)
