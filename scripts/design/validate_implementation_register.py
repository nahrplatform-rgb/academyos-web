"""Structural integrity checks only; no runtime, policy or acceptance proof."""
import csv
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'docs/06-delivery'

def read(path):
    with path.open(newline='') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        assert all(None not in row and None not in row.values() for row in rows), path
        return rows

def tokens(text):
    return [v for v in text.split('; ') if v]

screens = read(D / 'app-implementation-screen-matrix.csv')
actions = read(D / 'app-implementation-action-matrix.csv')
reqs = read(D / 'app-implementation-requirement-links.csv')
canonical = read(D / 'requirements-traceability.csv')
design = read(ROOT / 'design/experience-prototype-v1/docs/coverage-screens.csv')
source_actions = read(ROOT / 'design/experience-prototype-v1/docs/page-action-matrix.csv')
assert {s['screen_id'] for s in screens} == {s['screen_id'] for s in design}
assert {r['requirement_id'] for r in reqs} == {r['requirement_id'] for r in canonical}
assert {a['journey_action_ids'] for a in actions} == {a['action_id'] for a in source_actions}
for rows, key in [(screens,'screen_id'),(actions,'work_item_id'),(reqs,'requirement_id')]:
    assert len({r[key] for r in rows}) == len(rows), key
known_screens = {s['screen_id'] for s in screens}
known_actions = {a['work_item_id'] for a in actions}
known_requirements = {r['requirement_id'] for r in canonical}
loading = {r['matrix_id'] for r in read(ROOT / 'docs/03-design/screen-data-loading-matrix.csv')}
security = {r['review_family_id'] for r in read(ROOT / 'docs/04-engineering/journey-security-matrix.csv')}
for row in actions:
    assert set(tokens(row['screen_ids'])) <= known_screens
    assert set(tokens(row['requirement_ids'])) <= known_requirements
    assert set(tokens(row['loading_contract_ids'])) <= loading
    assert set(tokens(row['security_packet_ids'])) <= security
    assert row['work_item_id'] == 'IMP-' + re.search(r'J\d{2}-A\d{2}',row['journey_action_ids'])[0]
for row in screens + reqs:
    assert set(tokens(row['action_work_items'])) <= known_actions
for row in screens + actions:
    for field in ['design_status','implementation_status','verification_status','deployment_status','owner_approval_status']:
        assert row[field], field
    if row['implementation_source']:
        assert (ROOT / row['implementation_source']).is_file()
for row in actions:
    assert (ROOT / row['action_contract']).is_file()
    assert (ROOT / row['evidence_reference']).is_file()
canonical_by_id = {r['requirement_id']:r for r in canonical}
for row in reqs:
    original = canonical_by_id[row['requirement_id']]
    assert row['canonical_implementation_status_snapshot'] == original['implementation_status']
    assert row['canonical_test_status_snapshot'] == original['test_status']
    assert row['canonical_evidence_snapshot'] == original['evidence_reference']
print(f'PASS: {len(screens)} screen IDs, {len(actions)} stable action groups, {len(reqs)} preserved requirements; valid source/loading/security links and separate status fields.')
