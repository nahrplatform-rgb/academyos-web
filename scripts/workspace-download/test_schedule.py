"""Connected EX-18 Schedule contract on disposable PostgreSQL."""
import json
from pathlib import Path
import re
import runpy
import sys
import unittest
import uuid

boundary = runpy.run_path(str(Path(__file__).with_name('test_boundary.py')))
ROOT, WorkspaceBoundary, literal = (boundary[name] for name in ('ROOT', 'WorkspaceBoundary', 'literal'))
TrainerBoundary = runpy.run_path(str(ROOT / 'scripts/trainers/test_boundary.py'))['TrainerBoundary']


class ScheduleBoundary(WorkspaceBoundary):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.sql((ROOT / 'supabase/migrations/20261121014923_ex17_multisport_foundation.sql').read_text())

    def schedule_fixture(self, browser=False, register_size=1):
        academy, branch = self.academy()
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
        football_roster = [player] + [
            self.person(academy, branch, f'Football Player {index}')
            for index in range(2, register_size + 1)
        ]
        self.assertEqual(json.loads(self.plan(academy, football, day=first, capacity=max(4, register_size),
                                             trainer=coach, add=football_roster))['version'], 1)
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
        _, invitation, token, _, _ = self.guardian_command(academy, p=player)
        accepted = json.loads(self.guardian_recipient(invitation, token, 'accept', str(uuid.uuid4())))
        link = accepted['link_id']
        self.sql(f"insert into academy.guardian_training_access values('{link}',true)")
        if browser:
            job = self.prepare_pub(academy, self.pub(academy, swimming, first=first, last=first))
            self.assertEqual(self.mutate(academy, job, 'activate')['state'], 'committed')
            return academy, football, first, proposal['job']
        self.assertEqual(self.mutation(academy, proposal, 'activate')['state'], 'committed')
        self.assertEqual(self.sql(f"select count(*) from academy.date_plans where program_id='{football['id']}'"), '40')
        original_plan = json.loads(self.planning_read(academy, football, day=first))
        self.assertEqual((original_plan['capacity'], original_plan['count']), (max(4, register_size), register_size))
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
        return academy, football, first, link, event

    def test_multisport_schedule(self):
        academy, football, first, link, event = self.schedule_fixture()
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

    def test_attendance_and_qr_on_published_schedule(self):
        academy, football, _, _, event = self.schedule_fixture()
        self.retime(event)
        initial = self.roster(academy, event)
        self.assertEqual(initial['projection']['sport'], 'Football')
        self.assertEqual(initial['projection']['sport_ar'], 'كرة القدم')
        self.assertEqual(initial['program'], football['id'])
        player = initial['players'][0]['id']
        self.assertIsNone(initial['players'][0]['status'])

        operation = str(uuid.uuid4())
        args = f"'{academy}','{event}','{player}','present',0,null,clock_timestamp(),'{operation}'"
        committed = json.loads(self.sql(f"select public.a10_mark_v1({args})", 'user_trainer'))
        recovered = json.loads(self.sql(
            f"select public.a10_operation_v1('{academy}','{event}','{operation}')", 'user_trainer'))
        self.assertEqual(recovered, committed)
        self.assertEqual(self.roster(academy, event)['players'][0]['status'], 'present')
        self.roster(academy, event, who='user_swim_trainer', ok=False)

        correction = self.request(academy, event, player)
        self.decide(academy, event, correction['request'])
        self.assertEqual(self.roster(academy, event)['players'][0]['status'], 'absent')
        history = self.history(academy, event, player)['items']
        self.assertEqual([entry['status'] for entry in history], ['absent', 'present'])

        branch = self.sql(f"select branch_id from academy.publication_events where id='{event}'")
        self.window(academy, ev=event, before=30, after=30)
        _, code = self.credential(academy, player)
        self.assertEqual(self.capture(academy, branch, event, 'aos:qr:1:' + 'x' * 43)['error'],
                         'card_unavailable')
        self.capture(academy, branch, event, code, who='user_swim_trainer', ok=False)
        self.assertEqual(self.capture(academy, branch, event, code)['error'], 'correction_required')
        self.assertEqual(self.history(academy, event, player)['items'], history)

        self.mark(academy, event, player, who='user_owner', version=2, status='present',
                  reason='Synthetic attendance correction')
        operation = str(uuid.uuid4())
        scan = self.capture(academy, branch, event, code, op=operation)
        self.assertTrue(scan['already'])
        self.assertEqual(self.capture(academy, branch, event, code, op=operation), scan)
        self.assertEqual(self.roster(academy, event)['players'][0]['status'], 'present')
        self.assertEqual(len(self.history(academy, event, player)['items']), 3)

        swimming_event = self.schedule(academy, subject='user_swim_trainer')['items'][0]['id']
        self.retime(swimming_event)
        swimming = self.roster(academy, swimming_event, who='user_swim_trainer')
        self.assertEqual(swimming['projection']['sport_ar'], 'السباحة')
        swimmer = swimming['players'][0]['id']
        self.assertIsNone(swimming['players'][0]['status'])
        _, swim_card = self.credential(academy, swimmer)
        capture = self.capture(academy, branch, swimming_event, swim_card, who='user_swim_trainer')
        self.assertFalse(capture['already'])
        self.assertTrue(self.capture(academy, branch, swimming_event, swim_card, who='user_swim_trainer')['already'])
        self.assertEqual(self.roster(academy, swimming_event, who='user_swim_trainer')['players'][0]['status'], 'present')
        self.assertEqual(len(self.history(academy, swimming_event, swimmer, who='user_swim_trainer')['items']), 1)


def browser_fixture(attendance=False):
    ScheduleBoundary.setUpClass()
    try:
        test = ScheduleBoundary()
        if attendance:
            academy, football, _, _, event = test.schedule_fixture(register_size=18)
            swim_event = test.schedule(academy, subject='user_swim_trainer')['items'][0]['id']
            second = next(row['id'] for row in test.schedule(academy)['items'] if row['id'] != event)
            start = literal(test.sql("select date_trunc('minute',clock_timestamp())")) + '::timestamptz'
            test.retime(event, start, f"{start}+interval '10 seconds'")
            test.retime(swim_event, start)
            # Adjacent sessions share an eligible player and their scan windows overlap.
            test.retime(second, f"{start}+interval '10 seconds'", f"{start}+interval '45 minutes'")
            roster = test.roster(academy, event)
            test.assertEqual(len(roster['players']), 18)
            swimmer = test.roster(academy, swim_event, who='user_swim_trainer')['players'][0]['id']
            day = test.sql(f"select (starts_at at time zone 'Africa/Cairo')::date from academy.publication_events where id='{swim_event}'")
            shared = test.roster(academy, second)['players'][0]['id']
            shared_name = next(player['name'] for player in roster['players'] if player['id'] == shared)
            info = dict(academy=academy, event=event, swimEvent=swim_event, swimmer=swimmer,
                        shared=shared, sharedName=shared_name, day=day)
        else:
            academy, football, first, proposal = test.schedule_fixture(browser=True)
            info = dict(academy=academy, program=football['id'], day=first, proposal=proposal)
        program = info.get('program')
        print(json.dumps(info), flush=True)
        for line in sys.stdin:
            request = json.loads(line)
            rpc = request['rpc']
            if rpc not in {
                't9_read_v1', 't9_review_v1', 't9_save_v1', 't9_operation_v1',
                'q6_read_v1', 'p5_dates_v1', 'x15_owner_calendar_v1', 'x16_owner_current_calendar_v1',
                'p5_read_v1', 'r7_list_v1', 'r7_read_v1', 'r7_change_v1',
                's8_owner_dates_v1', 's8_jobs_v1', 's8_read_v1', 's8_create_v1', 's8_change_v1',
                'g3_links_v1', 'x15_trainer_calendar_v1', 'x15_guardian_calendar_v1',
                'a10_roster_v1', 'a10_register_v1', 'a10_operation_v1', 'a10_mark_v1', 'a10_history_v1',
                'q13_context_v1', 'q13_sessions_v1', 'q13_card_v1', 'q13_card_change_v1',
                'q13_resolve_v1', 'q13_capture_v1', 'q13_operation_v1',
            }:
                raise ValueError(f'Unsupported Schedule fixture request: {rpc}')
            args = request['args']
            if args['a'] != academy or (not attendance and args.get('p', program) != program):
                raise ValueError('Request is outside the Schedule fixture')
            if any(not re.fullmatch('[a-z_]+', key) for key in args):
                raise ValueError('Unsupported fixture argument')
            def encode(key, value):
                if value is None:
                    return 'null'
                if key in ('weekdays', 'add_ids', 'remove_ids', 'events'):
                    return literal('{' + ','.join(map(str, value)) + '}')
                if key == 'marks':
                    return literal(json.dumps(value)) + '::jsonb'
                return literal(value)

            arguments = ','.join(f"{key}=>{encode(key, value)}" for key, value in args.items())
            subject = {
                'g3_links_v1': 'user_guardian',
                'x15_guardian_calendar_v1': 'user_guardian',
                'x15_trainer_calendar_v1': 'user_trainer',
            }.get(rpc, 'user_owner')
            result = test.sql(f'select public.{rpc}({arguments})', subject)
            print(result, flush=True)
    finally:
        ScheduleBoundary.tearDownClass()


if __name__ == '__main__':
    if sys.argv[1:] == ['--browser-fixture']:
        browser_fixture()
    elif sys.argv[1:] == ['--attendance-browser-fixture']:
        browser_fixture(attendance=True)
    else:
        unittest.main(defaultTest=[
            'ScheduleBoundary.test_multisport_schedule',
            'ScheduleBoundary.test_attendance_and_qr_on_published_schedule',
        ], verbosity=2)
