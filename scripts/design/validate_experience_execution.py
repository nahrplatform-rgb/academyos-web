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
assert 'LF-v2' in local_body and 'supersedes' in local_body
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
print(f'PASS: {len(rows)} execution batches, {len(findings)} findings, G01–G09, canonical joins, dependencies and separate evidence states; current {active['work_id']}; {len(cases)} planned/evidence-linked working-day cases across {len(behaviours)} WB clauses')

subprocess.run([sys.executable, str(ROOT / 'scripts/design/build_continuation_prompt.py'), '--check'], check=True)
