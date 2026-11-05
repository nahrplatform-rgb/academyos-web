"""Structural traceability only: never proves runtime, acceptance or security."""
import csv
import re
import subprocess
import sys
from pathlib import Path
from build_continuation_prompt import execution_route

ROOT = Path(__file__).resolve().parents[2]
delivery = ROOT / 'docs/06-delivery'
with (delivery / 'experience-execution.csv').open(newline='') as stream:
    rows = list(csv.DictReader(stream))
assert rows and all(None not in row and None not in row.values() for row in rows)
ids = {row['work_id'] for row in rows}
assert len(ids) == len(rows), 'Duplicate work ID'
assert {'EX-10','EX-11'} <= ids, 'Missing explicit working-day gates'
assert 'EX-12' in ids, 'Dedicated-role preparation/verification must remain tracked'
staging_policy = ROOT / 'docs/00-governance/staging-delivery-and-review-policy.md'
role_plan = ROOT / 'docs/06-delivery/staging-role-separation-plan.md'
assert staging_policy.is_file() and role_plan.is_file(), 'Missing current review/role policy records'
ai_policy = ROOT / 'docs/00-governance/ai-delegation-and-cost-policy.md'
assert ai_policy.is_file(), 'Missing bounded AI delegation/cost policy'
for path in ['AGENTS.md', 'README.md', 'docs/00-governance/engineering-charter.md',
             'docs/06-delivery/app-implementation-plan.md', 'docs/06-delivery/full-experience-redesign.md',
             'docs/06-delivery/roadmap-and-backlog.md', 'docs/06-delivery/experience-execution.md',
             'docs/06-delivery/cost-capacity-and-operations.md', 'docs/06-delivery/test-strategy-and-acceptance.md',
             'docs/07-handoff/start-here-for-builders.md', 'docs/07-handoff/setup-index.md']:
    assert ai_policy.name in (ROOT / path).read_text(), f'Missing AI execution policy pointer: {path}'
for path in ['AGENTS.md', 'README.md', 'docs/00-governance/engineering-charter.md',
             'docs/06-delivery/app-implementation-plan.md', 'docs/06-delivery/full-experience-redesign.md',
             'docs/06-delivery/experience-execution.md', 'docs/07-handoff/start-here-for-builders.md']:
    body = (ROOT / path).read_text()
    assert staging_policy.name in body, f'Missing current staging review policy pointer: {path}'
    assert role_plan.name in body, f'Missing dedicated-role plan pointer: {path}'
active, primary = execution_route(rows)
findings = set(re.findall(r'^### (NR\d+) ', (ROOT / 'docs/04-engineering/request-findings-register.md').read_text(), re.M))
mapped = set()
with (delivery / 'app-implementation-action-matrix.csv').open(newline='') as stream:
    canonical = {row['work_item_id'] for row in csv.DictReader(stream)}
dependencies = {}
for row in rows:
    assert re.fullmatch(r'EX-\d{2}', row['work_id'])
    refs = set(filter(None, row['finding_ids'].split('; ')))
    assert refs <= findings | {f'G{i:02}' for i in range(1, 10)}, refs
    mapped |= refs
    assert set(row['canonical_work_ids'].split('; ')) <= canonical
    dependencies[row['work_id']] = set(filter(None, row['dependencies'].split('; ')))
    assert dependencies[row['work_id']] <= ids
    assert (ROOT / row['evidence']).is_file(), row['evidence']
    for field in ['design_status', 'implementation_status', 'local_status', 'deployment_status',
                  'hosted_status', 'owner_acceptance_status', 'independent_security_status', 'next_action']:
        assert row[field].strip(), (row['work_id'], field)
assert findings <= mapped, f'Untracked findings: {findings - mapped}'
assert {f'G{i:02}' for i in range(1, 10)} <= mapped, 'Measurement gaps must remain tracked'

def visit(node, ancestors):
    assert node not in ancestors, f'Circular dependency: {node}'
    for dependency in dependencies[node]:
        visit(dependency, ancestors | {node})

for work_id in ids:
    visit(work_id, set())
for path in ['AGENTS.md', 'docs/06-delivery/app-implementation-plan.md',
             'docs/06-delivery/roadmap-and-backlog.md', 'docs/06-delivery/full-experience-redesign.md',
             'docs/07-handoff/start-here-for-builders.md']:
    assert 'experience-execution' in (ROOT / path).read_text(), f'Missing execution pointer: {path}'
contract_path = ROOT / 'docs/03-design/academy-working-behavior-contract.md'
contract = contract_path.read_text()
behaviours = set(re.findall(r'^\| (WB-\d{2}) \|', contract, re.M))
assert len(behaviours) == 24, 'Behaviour clauses missing or changed without coverage review'
assert all(f'WB-P{i:02}' in contract for i in range(1, 5)), 'Retired proposal ID history missing'
local_plan = delivery / 'local-data-and-sync-plan.md'
assert local_plan.is_file(), 'Missing current durable-local target'
local_body = local_plan.read_text()
assert 'LF-v3' in local_body and 'supersedes' in local_body, 'Current local-data/offline-edit revision or superseded history missing'
assert all(f'LF-P{i:02}' in local_body for i in range(1, 7)), 'Exact local-data policy gates missing'
assert all(f'LD-{i:02}' in local_body for i in range(1, 11)), 'Dataset scope classes missing'
assert (ROOT / 'docs/04-engineering/shift-ios-local-data-reference-review.md').is_file()
assert 'superseded' in (ROOT / 'docs/04-engineering/working-day-pilot-architecture.md').read_text().lower(), 'Old pilot must be visibly superseded'
assert 'SUPERSEDED V1' in (ROOT / 'design/working-day-pilot/index.html').read_text(), 'Old storyboard must not solicit current approval'
with (delivery / 'academy-working-day-cases.csv').open(newline='') as stream:
    cases = list(csv.DictReader(stream))
assert cases and all(None not in case and None not in case.values() for case in cases)
assert len({case['case_id'] for case in cases}) == len(cases), 'Duplicate working-day case ID'
with (ROOT / 'docs/03-design/screen-data-loading-matrix.csv').open(newline='') as stream:
    loading_rows = list(csv.DictReader(stream))
    loading = {row['matrix_id'] for row in loading_rows}
with (ROOT / 'docs/04-engineering/journey-security-matrix.csv').open(newline='') as stream:
    security_rows = list(csv.DictReader(stream))
for row in security_rows:
    assert row.get('independent_review_status', '').strip(), 'Missing independent-review scheduling status'
    policy_ref = row.get('independent_review_policy', '')
    assert policy_ref and (ROOT / policy_ref).is_file(), 'Missing independent-review policy reference'
assert all('local-data-and-sync-plan.md' in row.get('local_data_design', '') for row in loading_rows), 'Missing local-data loading join'
with (delivery / 'app-implementation-action-matrix.csv').open(newline='') as stream:
    assert all('local-data-and-sync-plan.md' in row.get('local_data_design', '') for row in csv.DictReader(stream)), 'Missing action local-data join'
covered = set()
for case in cases:
    assert re.fullmatch(r'WD-\d{2}', case['case_id'])
    refs = set(case['behavior_ids'].split('; '))
    assert refs <= behaviours, (case['case_id'], refs - behaviours)
    covered |= refs
    assert set(case['canonical_work_ids'].split('; ')) <= canonical, case['case_id']
    assert set(case['loading_ids'].split('; ')) <= loading, case['case_id']
    assert all(value.strip() for value in case.values()), case['case_id']
    assert case['status'] in {'planned','future_not_in_pilot','blocked','evidence_linked'}, 'Plan status is not a runtime pass'
    if case['status'] == 'evidence_linked':
        assert (ROOT / case['execution_evidence']).is_file(), case['execution_evidence']
    else:
        assert case['execution_evidence'] == 'not_executed', 'Do not imply executed results in a planned case'
assert covered == behaviours, f'Unmapped working behaviour: {behaviours - covered}'
assert {f'WD-{i:02}' for i in range(33, 51)} <= {case['case_id'] for case in cases}, 'Persistent-local acceptance cases missing'
assert {f'WD-{i:02}' for i in range(51, 58)} <= {case['case_id'] for case in cases}, 'Offline-edit/conflict planned cases missing'
assert {f'WD-{i:02}' for i in range(58, 68)} <= {case['case_id'] for case in cases}, 'Normal-workspace acceptance cases missing'
assert {f'WD-{i:02}' for i in range(68, 72)} <= {case['case_id'] for case in cases}, 'Refresh regression cases missing'
assert (ROOT / 'docs/04-engineering/offline-edit-and-conflict-contract.md').is_file(), 'Offline command decision/design contract missing'
for path in ['AGENTS.md', 'README.md', 'docs/06-delivery/app-implementation-plan.md',
             'docs/06-delivery/roadmap-and-backlog.md', 'docs/06-delivery/full-experience-redesign.md',
             'docs/06-delivery/experience-execution.md', 'docs/06-delivery/request-hygiene-and-offline-standard.md',
             'docs/07-handoff/start-here-for-builders.md', 'docs/07-handoff/setup-index.md',
             'docs/03-design/experience-performance-and-data-loading.md',
             'docs/06-delivery/test-strategy-and-acceptance.md']:
    body = (ROOT / path).read_text()
    assert 'academy-working-behavior-contract.md' in body, f'Missing behaviour pointer: {path}'
    assert 'academy-working-day-acceptance.md' in body, f'Missing acceptance pointer: {path}'
    assert 'local-data-and-sync-plan.md' in body, f'Missing current persistent-local target: {path}'
assert (delivery / 'academy-working-day-acceptance.md').is_file()
# Installed PWA is a supporting delivery overlay; structural checks are not runtime proof.
pwa_contract = delivery / 'pwa-delivery-and-readiness.md'
pwa_trace = delivery / 'pwa-delivery-traceability.csv'
assert pwa_contract.is_file() and pwa_trace.is_file(), 'Missing canonical PWA delivery records'
pwa_packages = {'EX-14', 'EX-15', 'EX-16'}
assert pwa_packages <= ids, 'PWA supporting packages must remain tracked'
for row in rows:
    if row['work_id'] in pwa_packages:
        assert row['execution_lane'] == 'supporting' and row['execution_state'] == 'supporting', 'PWA work must not replace the current primary'
        assert row['evidence'] == 'docs/06-delivery/pwa-delivery-and-readiness.md', 'PWA package needs its canonical contract'
assert int(next(r for r in rows if r['work_id'] == 'EX-13')['execution_order']) < int(next(r for r in rows if r['work_id'] == 'EX-07')['execution_order']), 'Retain EX-13 before remaining EX-07'
pwa_pointer_files = [
    'AGENTS.md', 'README.md', 'docs/00-governance/engineering-charter.md',
    'docs/00-governance/source-register.md', 'docs/01-product/scope-and-release-map.md',
    'docs/02-workflows/identity-and-tenancy.md', 'docs/02-workflows/attendance-and-offline.md',
    'docs/04-engineering/architecture.md', 'docs/04-engineering/journey-security-review.md',
    'docs/04-engineering/request-service-impact.md',
    'docs/03-design/experience-performance-and-data-loading.md',
    'docs/06-delivery/app-implementation-plan.md', 'docs/06-delivery/roadmap-and-backlog.md',
    'docs/06-delivery/full-experience-redesign.md', 'docs/06-delivery/local-data-and-sync-plan.md',
    'docs/06-delivery/request-hygiene-and-offline-standard.md',
    'docs/06-delivery/cost-capacity-and-operations.md', 'docs/06-delivery/release-and-recovery.md',
    'docs/06-delivery/test-strategy-and-acceptance.md', 'docs/06-delivery/academy-working-day-acceptance.md',
    'docs/06-delivery/experience-execution.md', 'docs/07-handoff/start-here-for-builders.md',
    'docs/07-handoff/setup-index.md', 'design/app-experience-review/README.md']
for path in pwa_pointer_files:
    assert pwa_contract.name in (ROOT / path).read_text(), f'Missing PWA integration pointer: {path}'
with (delivery / 'requirements-traceability.csv').open(newline='') as stream:
    requirement_rows = {row['requirement_id']: row for row in csv.DictReader(stream)}
with (delivery / 'app-implementation-requirement-links.csv').open(newline='') as stream:
    requirement_links = {row['requirement_id']: row for row in csv.DictReader(stream)}
with (delivery / 'app-implementation-action-matrix.csv').open(newline='') as stream:
    action_rows = list(csv.DictReader(stream))
assert all(pwa_contract.name in r['local_data_design'] for r in action_rows), 'Missing installed action overlay'
assert all(pwa_contract.name in r['local_data_design'] for r in loading_rows), 'Missing installed loading overlay'
assert all(pwa_contract.name in r['action_packet_requirement'] for r in security_rows), 'Missing installed security overlay'
with pwa_trace.open(newline='') as stream:
    pwa_rows = list(csv.DictReader(stream))
assert pwa_rows and all(None not in r and None not in r.values() and all(v.strip() for v in r.values()) for r in pwa_rows)
pwa_ids = {r['pwa_requirement_id'] for r in pwa_rows}
assert len(pwa_ids) == len(pwa_rows), 'Duplicate PWA requirement ID'
assert {f'PW-{i:02}' for i in range(1, 10)} <= pwa_ids, 'Required PWA work package coverage missing'
case_ids = {r['case_id'] for r in cases}
assert {f'WD-{i:02}' for i in range(72, 87)} <= case_ids, 'Installed working-day cases missing'
security_ids = {r['review_family_id'] for r in security_rows}
for row in pwa_rows:
    assert re.fullmatch(r'PW-\d{2}', row['pwa_requirement_id'])
    assert set(row['execution_packages'].split('; ')) <= pwa_packages
    assert set(row['canonical_work_ids'].split('; ')) <= canonical
    req_ids = set(row['requirement_ids'].split('; '))
    assert req_ids <= requirement_rows.keys(), 'Unknown PWA canonical requirement join'
    assert set(row['acceptance_case_ids'].split('; ')) == {requirement_rows[r]['acceptance_test_id'] for r in req_ids}, 'PWA AO/AT joins disagree'
    assert set(row['loading_ids'].split('; ')) <= loading
    assert set(row['security_ids'].split('; ')) <= security_ids
    assert set(row['working_day_cases'].split('; ')) <= case_ids
    assert row['contract'] == 'docs/06-delivery/pwa-delivery-and-readiness.md'
    assert all(pwa_contract.name in requirement_links[r]['next_gate'] for r in req_ids), 'Missing reverse PWA requirement pointer'
print(f'PASS: {len(pwa_rows)} PWA joins,3 supporting packages,installed WD cases and linked governance/plans; runtime and acceptance remain separate')

print(f'PASS: {len(rows)} execution batches, {len(findings)} findings, G01–G09, canonical joins, dependencies and separate evidence states; current {active['work_id']}; {len(cases)} planned/evidence-linked working-day cases across {len(behaviours)} WB clauses')

subprocess.run([sys.executable, str(ROOT / 'scripts/design/build_continuation_prompt.py'), '--check'], check=True)
