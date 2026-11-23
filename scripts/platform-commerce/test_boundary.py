"""Disposable PostgreSQL checks for the approved fictional platform trial."""
import json
import runpy
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
fixture = runpy.run_path(str(ROOT / 'scripts/working-day/owner_db.py'))
Boundary = fixture['Boundary']
PublicationBoundary = fixture['PublicationBoundary']
dispatch = fixture['dispatch']

def uid():
    return str(uuid.uuid4())

def literal(value):
    return "'" + str(value).replace("'", "''") + "'"

def payload(value):
    return literal(json.dumps(value)) + '::jsonb'

Boundary.setUpClass()
try:
    for name in ('20261103165604_owner_register_download_contract.sql',
                 '20261104002448_owner_register_original_dispatch.sql'):
        Boundary.sql((ROOT / 'supabase/migrations' / name).read_text())
    test = Boundary()
    dispatch['scope']['apply_bound'](test)
    Boundary.sql((ROOT / 'supabase/migrations/20261105003702_owner_workspace_transfer_contract.sql').read_text())
    for suffix in ('player_alternate_name', 'player_academy_member_number', 'player_private_profile_details',
                   'player_private_photo', 'player_name_correction', 'player_profile_and_lifecycle',
                   'ex21_family_billing', 'ex22_trainer_compensation'):
        path, = (ROOT / 'supabase/migrations').glob(f'*_{suffix}.sql')
        Boundary.sql(path.read_text())
    Boundary.sql((ROOT / 'supabase/migrations/20261122075500_ex23_platform_commerce.sql').read_text())
    admission, _, invitation, token, _ = test.create()
    a = admission['academy_id']
    test.sql("create or replace function academy.x23_now() returns timestamptz language sql stable as $$ select '2026-11-01 12:00+02'::timestamptz $$")
    def cmd(act, data, subject='user_platform', academy=a, op=None, ok=True):
        scope = 'null' if academy is None else literal(academy)
        query = f"select public.x23_command_v1({scope},'{op or uid()}',{literal(act)},{payload(data)})"
        result = test.sql(query, subject, ok=ok)
        return json.loads(result) if ok else result
    def context(view, subject, academy=a, ok=True):
        scope = 'null' if academy is None else literal(academy)
        result = test.sql(f"select public.x23_context_v1({scope},{literal(view)})", subject, ok=ok)
        return json.loads(result) if ok else result
    plan = cmd('publish_plan', {}, academy=None)['id']
    assignment = {'plan': plan, 'start': '2026-11-01'}
    assignment_op = uid()
    cmd('assign', assignment, op=assignment_op, ok=False)
    context('owner', 'user_owner', ok=False)
    test.accept(invitation, token, subject='user_other_owner', email='other@academy.example', ok=False)
    test.accept(invitation, token)
    test.save(a, 0, 'branch', {'name': 'Synthetic branch', 'timezone': 'Africa/Cairo'})
    test.save(a, 1, 'sport', {'label_en': 'Synthetic Sport', 'label_ar': 'رياضة'})
    cmd('assign', assignment, op=assignment_op, ok=False)
    assert test.sql(f"select count(*) from academy.platform_subscriptions where academy_id='{a}'") == '0'
    setup = json.loads(test.save(a, 2, 'complete', {}))
    assert setup['complete'] and setup['timezone'] == 'Africa/Cairo'
    b = setup['branch']['id']
    assigned = cmd('assign', assignment, op=assignment_op)
    assert cmd('assign', assignment, op=assignment_op) == assigned
    sub = assigned['id']
    assert test.sql(f"select count(*) from academy.platform_subscriptions where academy_id='{a}'") == '1'
    view = context('owner', 'user_owner')
    assert view['subscription']['status'] == 'trial'
    assert view['subscription']['trialEnd'] == '2026-11-14'
    assert view['subscription']['periodStart'] == '2026-11-15'
    assert view['subscription']['periodEnd'] == '2026-12-14'
    assert view['subscription']['due'] == '2026-11-21'
    assert view['subscription']['graceEnd'] == '2026-11-28'
    registration_op = uid()
    registration = json.loads(test.register(a, b, op=registration_op))
    plan_day = '2099-11-01'
    program = test.ready(a, {'name': 'Fictional restricted publication', 'from': plan_day, 'to': plan_day,
                            'rules': [{'day': 0, 'start': '17:00', 'end': '18:00'}]})
    staff, _ = test.staff(a, b)
    test.plan(a, program, capacity=4, trainer=staff, add=[registration['player_id']], day=plan_day)
    job = PublicationBoundary.pub(test, a, program, first=plan_day, last=plan_day)
    job = PublicationBoundary.prepare_pub(test, a, job)
    cmd('issue', {'subscription': sub}, ok=False)
    context('platform', 'user_owner', ok=False)
    context('owner', 'user_platform', ok=False)
    test.sql("create or replace function academy.x23_now() returns timestamptz language sql stable as $$ select '2026-11-15 12:00+02'::timestamptz $$")
    invoice = cmd('issue', {'subscription': sub})['id']
    claim_op = uid()
    claim = cmd('claim', {'invoice': invoice, 'amount': 100000, 'reference': 'Fictional bank 1'}, subject='user_owner', op=claim_op)
    assert cmd('claim', {'invoice': invoice, 'amount': 100000, 'reference': 'Fictional bank 1'}, subject='user_owner', op=claim_op) == claim
    cmd('claim', {'invoice': invoice, 'amount': 100000, 'reference': 'Fictional bank 2'}, subject='user_owner', ok=False)
    cmd('review', {'claim': claim['id'], 'version': 2, 'decision': 'accepted', 'reason': 'Verified'}, ok=False)
    cmd('review', {'claim': claim['id'], 'version': 1, 'decision': 'rejected', 'reason': 'Review'}, subject='user_owner', ok=False)
    cmd('review', {'claim': claim['id'], 'version': 1, 'decision': 'rejected', 'reason': 'Needs correction'})
    claim2 = cmd('claim', {'invoice': invoice, 'amount': 100000, 'reference': 'Fictional bank 2'}, subject='user_owner')['id']
    test.sql("create or replace function academy.x23_now() returns timestamptz language sql stable as $$ select '2026-11-29 12:00+02'::timestamptz $$")
    assert context('owner', 'user_owner')['subscription']['status'] == 'restricted'
    test.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name) values('{a}','{b}','Blocked','blocked')", ok=False)
    assert json.loads(test.register(a, b, op=registration_op)) == registration
    publication_op = uid()
    try:
        PublicationBoundary.mutate(test, a, job, 'activate', op=publication_op)
    except AssertionError as error:
        assert 'Academy subscription restricts new work' in str(error), str(error)
    else:
        raise AssertionError('Restricted publication activation unexpectedly succeeded')
    assert test.sql(f"select count(*) from academy.publication_heads where academy_id='{a}'") == '0'
    review_op = uid()
    approval = cmd('review', {'claim': claim2, 'version': 1, 'decision': 'accepted', 'reason': 'Verified bank'}, op=review_op)
    assert cmd('review', {'claim': claim2, 'version': 1, 'decision': 'accepted', 'reason': 'Verified bank'}, op=review_op) == approval
    statement = context('owner', 'user_owner')
    assert statement['subscription']['status'] == 'active'
    assert statement['invoice']['paid'] == 100000 and statement['invoice']['balance'] == 0
    assert PublicationBoundary.mutate(test, a, job, 'activate', op=publication_op)['state'] == 'committed'
    assert test.sql(f"select count(*) from academy.publication_heads where academy_id='{a}'") == '1'
    assert test.sql(f"select count(*) from academy.platform_settlements where academy_id='{a}'") == '1'
    assert test.sql(f"select count(*) from academy.audit_events where operation_id='{review_op}'") == '1'
    print('PASS EX-23 admission, setup gate, trial dates, separate authority, review and one settlement')
finally:
    Boundary.tearDownClass()
