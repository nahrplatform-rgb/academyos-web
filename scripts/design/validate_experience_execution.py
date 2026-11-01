"""Structural traceability only: never proves runtime, acceptance or security."""
import csv
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
delivery = ROOT / 'docs/06-delivery'
with (delivery / 'experience-execution.csv').open(newline='') as stream:
    rows = list(csv.DictReader(stream))
assert rows and all(None not in row and None not in row.values() for row in rows)
ids = {row['work_id'] for row in rows}
assert len(ids) == len(rows), 'Duplicate work ID'
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
print(f'PASS: {len(rows)} execution batches, {len(findings)} findings, G01–G09, canonical joins, dependencies and separate evidence states')

subprocess.run([sys.executable, str(ROOT / 'scripts/design/build_continuation_prompt.py'), '--check'], check=True)
