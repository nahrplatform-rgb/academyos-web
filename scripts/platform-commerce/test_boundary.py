"""Disposable PostgreSQL checks for the approved fictional platform trial."""
import json
import runpy
import subprocess
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Barrier

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
    review = {'claim': claim2, 'version': 1, 'decision': 'accepted', 'reason': 'Verified bank'}
    with ThreadPoolExecutor(max_workers=2) as pool:
        approvals = list(pool.map(lambda _: cmd('review', review, op=review_op), range(2)))
    assert approvals[0] == approvals[1]
    statement = context('owner', 'user_owner')
    assert statement['subscription']['status'] == 'active'
    assert statement['invoice']['paid'] == 100000 and statement['invoice']['balance'] == 0
    assert PublicationBoundary.mutate(test, a, job, 'activate', op=publication_op)['state'] == 'committed'
    assert test.sql(f"select count(*) from academy.publication_heads where academy_id='{a}'") == '1'
    assert test.sql(f"select count(*) from academy.platform_settlements where academy_id='{a}'") == '1'
    assert test.sql(f"select count(*) from academy.audit_events where operation_id='{review_op}'") == '1'
    print('PASS EX-23 admission, setup gate, trial dates, separate authority, review and one settlement')

    # Apply to a populated EX-23 ledger, then replay the original requests.
    def ledger():
        tables = ('plan_versions', 'subscriptions', 'invoices', 'claims', 'claim_reviews',
                  'settlements', 'commerce_operations')
        return {t: test.sql(f"select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') "
                            f"from academy.platform_{t} x") for t in tables}
    before_migration = ledger()
    migration, = (ROOT / 'supabase/migrations').glob('*_ex30_versioned_monthly_offer.sql')
    Boundary.sql(migration.read_text())
    assert ledger() == before_migration
    assert cmd('review', review, op=review_op) == approvals[0]
    assert json.loads(test.sql(f"select public.x23_operation_v1('{a}','{review_op}')",
                               'user_platform')) == approvals[0]
    next_op = uid()
    v2 = cmd('publish_plan', {'version': 2}, academy=None, op=next_op)['id']
    assert cmd('publish_plan', {'version': 2}, academy=None, op=next_op)['id'] == v2
    cmd('publish_plan', {}, academy=None, op=next_op, ok=False)
    cmd('publish_plan', {'version': 3}, academy=None, ok=False)
    cmd('publish_plan', {'version': 2}, academy=None, subject='user_owner', ok=False)
    current = context('owner', 'user_owner')
    assert current['invoice'] == statement['invoice']
    assert current['subscription'] == dict(statement['subscription'], planVersion=1)
    assert current['subscription']['programCount'] == 1 and current['subscription']['programLimit'] == 2

    foreign, _ = test.academy('user_other_owner')
    cmd('assign', {'plan': v2, 'start': '2026-11-16'}, academy=foreign)
    context('owner', 'user_owner', academy=foreign, ok=False)
    context('owner', 'user_other_owner', ok=False)
    cmd('issue', {'subscription': sub}, academy=foreign, ok=False)
    other = context('owner', 'user_other_owner', academy=foreign)['subscription']
    assert (other['planVersion'], other['programCount'], other['programLimit']) == (2, 0, 3)

    def create_query(number, operation, academy=a, subject='user_owner'):
        definition = dict(test.definition(), name=f'EX30 quota {number}')
        receipt = test.review(academy, definition, subject)
        return f"select public.p5_create_v1('{academy}','{operation}',{payload(definition)},3,{payload(receipt)})"

    first_op, second_op = uid(), uid()
    first = create_query(1, first_op)
    second = create_query(2, second_op)
    # An AFTER INSERT failure occurs after the quota lock/check AND provisional
    # business insert, but before the original receipt and audit can commit.
    test.sql("""
      create function academy.ex30_fixture_fail() returns trigger language plpgsql as $$
      begin raise exception 'EX30 controlled after-insert failure' using errcode='PT499'; end $$;
      create trigger ex30_fixture_fail after insert on academy.training_programs
        for each row execute function academy.ex30_fixture_fail()
    """)
    def invoke(query, subject='user_owner'):
        try:
            return json.loads(test.sql(query, subject))
        except AssertionError as failure:
            return str(failure)
    assert 'EX30 controlled after-insert failure' in invoke(first)
    assert context('owner', 'user_owner')['subscription']['programCount'] == 1
    assert test.sql(f"select count(*) from academy.training_operations where id='{first_op}'") == '0'
    test.sql('drop trigger ex30_fixture_fail on academy.training_programs')
    barrier = Barrier(2, timeout=10)
    def race(query):
        barrier.wait()
        return invoke(query)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(race, [first, second]))
    assert sum(isinstance(r, dict) for r in results) == 1, results
    assert any(isinstance(r, str) and 'Program plan limit reached' in r for r in results), results
    winner_index = 0 if isinstance(results[0], dict) else 1
    winner_query = (first, second)[winner_index]
    assert invoke(winner_query) == results[winner_index]
    assert test.sql(f"select count(*) from academy.training_operations where id in ('{first_op}','{second_op}')") == '1'
    assert test.sql(f"select count(*) from academy.audit_events where action='program.create' and operation_id in ('{first_op}','{second_op}')") == '1'
    assert context('owner', 'user_owner')['subscription']['programCount'] == 2
    blocked = create_query(3, uid())
    assert 'Program plan limit reached' in invoke(blocked)
    for actor in ('user_other_owner', 'user_platform', 'user_signup'):
        refusal = invoke(blocked, actor)
        assert isinstance(refusal, str) and 'Program plan limit reached' not in refusal, refusal
        assert 'Access denied' in refusal, refusal
    assert context('owner', 'user_other_owner', academy=foreign)['subscription']['programCount'] == 0

    # Retry the exact original after an injected failure with a slot available.
    foreign_op = uid()
    foreign_query = create_query(4, foreign_op, foreign, 'user_other_owner')
    test.sql("create trigger ex30_fixture_fail after insert on academy.training_programs "
             "for each row execute function academy.ex30_fixture_fail()")
    foreign_failure = invoke(foreign_query, 'user_other_owner')
    assert 'EX30 controlled after-insert failure' in foreign_failure, foreign_failure
    assert context('owner', 'user_other_owner', academy=foreign)['subscription']['programCount'] == 0
    test.sql('drop trigger ex30_fixture_fail on academy.training_programs')
    retried = invoke(foreign_query, 'user_other_owner')
    assert isinstance(retried, dict), retried
    assert invoke(foreign_query, 'user_other_owner') == retried
    assert context('owner', 'user_other_owner', academy=foreign)['subscription']['programCount'] == 1
    assert context('owner', 'user_owner')['subscription']['programCount'] == 2
    print('PASS EX-30 populated-ledger migration, immutable versions, same-operation settlement, quota race, rollback/retry and scope')

    memberships = test.sql("select jsonb_agg(to_jsonb(m) order by m.id) from academy.memberships m")
    pre_organization_ledger = ledger()
    organization_migration, = (ROOT / 'supabase/migrations').glob('*_ex30_multi_academy.sql')
    Boundary.sql(organization_migration.read_text())
    assert ledger() == pre_organization_ledger
    assert test.sql("select jsonb_agg(to_jsonb(m) order by m.id) from academy.memberships m") == memberships
    assert test.sql("select count(organization_id) from academy.academies") == '0'
    # Admit the same verified identity through the normal flow for a second academy.
    second_academy, _ = test.academy('user_owner')
    second_op = uid()
    second_agreement = cmd('assign', {'plan': v2, 'start': '2026-11-01'},
                           academy=second_academy, op=second_op)
    second_invoice = cmd('issue', {'subscription': second_agreement['id']},
                         academy=second_academy)['id']
    # Sharing organization metadata confers no additional membership.
    test.sql(f"update academy.academies set organization_id='{uid()}' "
             f"where id in ('{a}','{second_academy}','{foreign}')")
    other_view = context('owner', 'user_owner', academy=second_academy)
    original_view = context('owner', 'user_owner')
    assert (other_view['subscription']['planVersion'], other_view['subscription']['programCount'],
            other_view['subscription']['programLimit']) == (2, 0, 3)
    assert other_view['invoice']['id'] == second_invoice and other_view['invoice']['balance'] == 100000
    assert (original_view['subscription']['planVersion'], original_view['subscription']['programCount'],
            original_view['subscription']['programLimit']) == (1, 2, 2)
    assert original_view['invoice']['id'] == invoice and original_view['invoice']['balance'] == 0
    cmd('claim', {'invoice': second_invoice, 'amount': 100000, 'reference': 'Wrong academy'},
        subject='user_owner', ok=False)
    assert test.sql(f"select count(*) from academy.platform_claims where invoice_id='{second_invoice}'") == '0'
    context('owner', 'user_other_owner', academy=second_academy, ok=False)
    context('owner', 'user_owner', academy=foreign, ok=False)
    test.sql(f"select public.x23_operation_v1('{a}','{second_op}')", 'user_platform', ok=False)
    assert test.sql("""
      select count(*) from academy.platform_commerce_operations o where (
        select count(*) from academy.audit_events e
        where e.operation_id = o.id and e.actor = o.actor
          and e.academy_id is not distinct from o.academy_id
          and e.action = 'platform_commerce.' || coalesce(o.result->>'action', 'cancel')
      ) <> 1
    """) == '0'
    print('PASS EX-30 one verified Owner with two independent agreements, quota reads, invoices and scoped audit')

    Boundary.sql((ROOT / 'supabase/migrations/20261128120000_ex30_demo_foundation.sql').read_text())
    Boundary.sql((ROOT / 'supabase/migrations/20261128140000_ex30_demo_gateway_paths.sql').read_text())
    Boundary.sql((ROOT / 'supabase/migrations/20261130120000_ex30_demo_rpcs.sql').read_text())
    demo = json.loads(test.sql(
        "select public.x30_create_demo('Prospect Demo','prospect@example.invalid','+201000000000')",
        'user_platform'))
    demo_academy = demo['academyId']
    token_hash = demo['tokenHash']
    assert test.sql(f"select account_type from academy.academies where id='{demo_academy}'") == 'demo'
    assert test.sql(f"select count(*) from academy.platform_demo_lifecycle where academy_id='{demo_academy}'") == '1'
    test.sql(f"select public.x30_create_demo('Denied Demo',null,null)", 'user_other_owner', ok=False)
    redeemed = json.loads(test.sql(
        f"select public.x30_use_invitation('{token_hash}')", 'user_owner'))
    assert redeemed['academyId'] == demo_academy
    test.sql(f"select public.x30_use_invitation('{token_hash}')", 'user_owner', ok=False)
    test.sql("select public.x30_use_invitation('not-a-token')", 'user_owner', ok=False)
    test.sql(f"select public.x30_hold_demo('{demo_academy}')", 'user_platform')
    assert test.sql(f"select held_at is not null from academy.platform_demo_lifecycle where academy_id='{demo_academy}'") == 't'
    test.sql(f"select public.x30_delete_demo('{demo_academy}')", 'user_owner', ok=False)
    test.sql(f"select public.x30_delete_demo('{demo_academy}')", 'user_platform')
    assert test.sql(f"select deleted_at is not null from academy.platform_demo_lifecycle where academy_id='{demo_academy}'") == 't'
    assert test.sql(f"select name like '%(deleted)' from academy.academies where id='{demo_academy}'") == 't'
    print('PASS EX-30 demo foundation creation, single-use invitation, lifecycle controls and Platform Owner scope')

    before_paymob = ledger()
    migration, = (ROOT / 'supabase/migrations').glob('*_ex30_paymob_test_renewal.sql')
    Boundary.sql(migration.read_text())
    after_paymob = ledger()
    for table, previous_rows in before_paymob.items():
        rows = json.loads(after_paymob[table])
        if table == 'settlements':
            for row in rows:
                assert row.pop('paymob_test_transaction_id') is None
        assert rows == json.loads(previous_rows), table
    renewal = uid()
    wire = json.loads(subprocess.check_output(
        ['node', '--import', 'tsx', str(ROOT / 'scripts/platform-commerce/test_paymob_renewal.mjs'), renewal],
        cwd=ROOT, text=True,
    ))
    renewal_binding = wire['binding']
    assert renewal_binding['invoiceReference'] == renewal and renewal_binding['amountMinor'] == 100000
    merchant = int(renewal_binding['merchantId'])
    paymob_subscription = int(renewal_binding['subscriptionId'])
    integration = int(renewal_binding['integrationId'])
    initial_transaction = int(renewal_binding['enrollmentTransactionId'])
    test.sql(f"""
      insert into academy.platform_invoices
        (id,academy_id,subscription_id,amount,issued_on,due_on,period_start,period_end,created_by)
      values ('{renewal}','{a}','{sub}',100000,'2026-12-15','2026-12-15','2026-12-15','2027-01-14','fixture');
      insert into academy.platform_paymob_test_renewals
        values ('{renewal}',{merchant},{paymob_subscription},{integration},{initial_transaction});
    """)
    assert context('owner', 'user_owner')['invoice']['id'] == invoice
    cmd('claim', {'invoice': renewal, 'amount': 100000, 'reference': 'Renewal'},
        subject='user_owner', ok=False)

    def paymob_query(observation, academy=a, amount=100000):
        assert observation['invoiceReference'] == renewal
        stamp = literal(observation['paidAt']) if 'paidAt' in observation else 'null'
        return (f"select academy.x30_record_paymob_test_renewal('{academy}','{renewal}',"
                f"{merchant},{paymob_subscription},{integration},{int(observation['transactionId'])},"
                f"{amount},{literal(observation['status'])},"
                f"{literal(observation['occurredAt'])},{stamp})")

    callback = wire['callback']
    for role in ('anon', 'authenticated'):
        test.sql(f"set role {role}; {paymob_query(callback)}", ok=False)
    test.sql(paymob_query(dict(callback, transactionId=initial_transaction)), ok=False)
    test.sql(paymob_query(callback, academy=foreign), ok=False)
    test.sql(paymob_query(callback, amount=100001), ok=False)
    test.sql(paymob_query(dict(callback, occurredAt='2026-12-14T20:00:00Z')), ok=False)
    pending = json.loads(test.sql(paymob_query(wire['pending'])))
    assert pending['status'] == 'pending'
    declined = json.loads(test.sql(paymob_query(wire['declined'])))
    assert declined['status'] == 'review_required' and declined['id'] != pending['id']
    assert json.loads(test.sql(paymob_query(dict(wire['declined'], status='pending')))) == declined
    assert test.sql(f"select count(*) from academy.platform_settlements where invoice_id='{renewal}'") == '0'
    test.sql("""
      create function academy.fixture_refuse_paymob_audit() returns trigger language plpgsql as $$
      begin
        if new.action='platform_commerce.paymob_settled' then
          raise exception 'Fixture failure after settlement insert';
        end if;
        return new;
      end $$;
      create trigger fixture_refuse_paymob_audit before insert on academy.audit_events
        for each row execute function academy.fixture_refuse_paymob_audit();
    """)
    test.sql(paymob_query(callback), ok=False)
    assert test.sql(f"select count(*) from academy.platform_settlements where invoice_id='{renewal}'") == '0'
    assert test.sql(f"select status from academy.platform_paymob_test_transactions where id='{pending['id']}'") == 'pending'
    test.sql("drop trigger fixture_refuse_paymob_audit on academy.audit_events;")

    with ThreadPoolExecutor(max_workers=2) as pool:
        saved = list(pool.map(lambda observation: json.loads(test.sql(paymob_query(observation))),
                              (callback, wire['inquiry'])))
    assert saved == [dict(pending, status='settled')] * 2
    assert json.loads(test.sql(paymob_query(wire['declined']))) == declined
    assert json.loads(test.sql(paymob_query(wire['pending']))) == saved[0]
    conflicting = dict(wire['pending'], status='review_required')
    assert json.loads(test.sql(paymob_query(conflicting))) == dict(pending, status='review_required')
    assert json.loads(test.sql(paymob_query(conflicting))) == dict(pending, status='review_required')
    assert json.loads(test.sql(paymob_query(callback))) == saved[0]
    assert json.loads(test.sql(paymob_query(wire['competing'])))['status'] == 'review_required'
    assert test.sql(f"""
      select count(*) from academy.platform_settlements
      where invoice_id='{renewal}' and amount=100000 and claim_id is null
        and paymob_test_transaction_id='{saved[0]['id']}'
    """) == '1'
    assert test.sql(f"select count(*) from academy.audit_events where operation_id='{pending['id']}' "
                    "and action='platform_commerce.paymob_settled'") == '1'
    assert test.sql(f"select count(*) from academy.audit_events where operation_id='{pending['id']}' "
                    "and action='platform_commerce.paymob_settlement_conflict'") == '1'
    assert context('owner', 'user_owner')['invoice'] == original_view['invoice']
    assert cmd('review', review, op=review_op) == approvals[0]
    print('PASS EX-30 Paymob test migration, renewal scope, unresolved events and concurrent one-settlement replay')
finally:
    Boundary.tearDownClass()
