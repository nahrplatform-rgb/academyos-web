"""Validate planning coverage/links; this cannot prove business/runtime acceptance."""
import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

from build_continuation_prompt import execution_route
from build_master_plan import refs

ROOT = Path(__file__).resolve().parents[2]
PACKAGE = ROOT / 'docs/06-delivery/master-plan-v2'


def table(name, key):
    path = PACKAGE / name
    raw = path.read_bytes()
    assert b'\r' not in raw, f'Use LF: {name}'
    with path.open(newline='') as stream:
        result = list(csv.DictReader(stream))
    assert result and all(None not in r and None not in r.values() and all(v.strip() for v in r.values()) for r in result), name
    assert len({r[key] for r in result}) == len(result), f'Duplicate ID: {name}'
    return result


def validate(reference_root=None):
    domains = table('domain-coverage.csv', 'domain_id')
    dids = {r['domain_id'] for r in domains}
    assert dids == {f'D{i:02}' for i in range(1, 22)}, 'Retain all21product domains'
    outcomes = table('product-outcomes.csv', 'outcome_id')
    vids = {r['outcome_id'] for r in outcomes}
    assert vids == {f'VAL-{i:02}' for i in range(1, 13)}, 'Retain additive product outcome IDs'
    assert set().union(*(refs(r['domain_ids']) for r in outcomes)) == dids, 'Every domain needs a value question'
    for row in outcomes:
        assert refs(row['domain_ids']) <= dids
    batches = table('delivery-batches.csv', 'batch_id')
    bids = {r['batch_id'] for r in batches}
    assert bids == {f'MP-B{i:02}' for i in range(15)}, 'Master batch catalog missing'
    graph = {r['batch_id']: refs(r['depends_on_batches']) for r in batches}
    for node, deps in graph.items():
        assert deps <= bids, (node, deps - bids)
    for row in batches:
        assert refs(row['product_outcome_ids']) and refs(row['product_outcome_ids']) <= vids
    def visit(node, ancestors):
        assert node not in ancestors, f'Batch dependency cycle: {node}'
        for dep in graph[node]:
            visit(dep, ancestors | {node})
    for node in graph:
        visit(node, set())
    with (ROOT / 'docs/06-delivery/experience-execution.csv').open(newline='') as stream:
        execution = list(csv.DictReader(stream))
    active, _ = execution_route(execution)
    exids = {r['work_id'] for r in execution}
    assert {f'EX-{i:02}' for i in range(1, 17)} <= exids, 'Existing EX history lost'
    for row in execution:
        assert row['delivery_batch'] in bids
        assert row['development_next_action'].strip() and row['release_follow_up'].strip()
    active_batch = next(b for b in batches if b['batch_id'] == active['delivery_batch'])
    assert active_batch['execution_work_id'] == active['work_id'], 'Current family must own its explicit batch'
    for batch in batches:
        if batch['execution_work_id'] == 'none_documentation_only':
            assert batch['batch_id'] == 'MP-B00'
            continue
        assert batch['execution_work_id'] in exids
        match = next(r for r in execution if r['work_id'] == batch['execution_work_id'])
        assert match['delivery_batch'] == batch['batch_id'], 'Tracker/catalog destination mismatch'

    reqs = {r['requirement_id']: r for r in csv.DictReader((ROOT / 'docs/06-delivery/requirements-traceability.csv').open())}
    actions = {r['work_item_id'] for r in csv.DictReader((ROOT / 'docs/06-delivery/app-implementation-action-matrix.csv').open())}
    crosswalk = table('requirements-crosswalk.csv', 'requirement_id')
    assert {r['requirement_id'] for r in crosswalk} == reqs.keys(), 'Canonical scope dropped or invented'
    for row in crosswalk:
        assert row['acceptance_test_id'] == reqs[row['requirement_id']]['acceptance_test_id']
        assert row['requirement'] == reqs[row['requirement_id']]['requirement']
        assert refs(row['master_domain_ids']) <= dids
        assert refs(row['delivery_batch_ids']) <= bids
    for row in domains:
        assert refs(row['canonical_work_ids']) <= actions
        assert refs(row['batch_ids']) <= bids
        assert (ROOT / row['contract']).is_file(), row['contract']
        for path in refs(row['source_evidence']):
            assert (ROOT / path).is_file(), path
    decisions = table('decision-dependencies.csv', 'decision_id')
    qids = {r['decision_id'] for r in decisions}
    decision_history = (ROOT / 'docs/00-governance/decisions-and-open-questions.md').read_text()
    for row in decisions:
        assert refs(row['batch_ids']) <= bids
        assert all(x in decision_history for x in refs(row['existing_decision_ids']))
    extensions = table('scope-extensions.csv', 'extension_id')
    for row in extensions:
        assert refs(row['domain_ids']) <= dids
        assert refs(row['batch_ids']) <= bids
        assert refs(row['requirement_ids']) <= reqs.keys()
        assert refs(row['decision_ids']) <= qids
        assert (PACKAGE / row['specification']).is_file()

    caps = table('pysa-capabilities.csv', 'reference_id')
    fields = table('pysa-fields.csv', 'reference_field_id')
    capids = {r['reference_id'] for r in caps}
    pfids = {r['reference_field_id'] for r in fields}
    assert {r['domain_id'] for r in caps} == dids, 'Reference investigation must address every domain,including unknowns'
    adoption = table('pysa-adoption-map.csv', 'reference_id')
    field_adoption = table('field-adoption-map.csv', 'reference_field_id')
    assert {r['reference_id'] for r in adoption} == capids
    assert {r['reference_field_id'] for r in field_adoption} == pfids
    for row in adoption + field_adoption:
        expected = {r['outcome_id'] for r in outcomes if row['domain_id'] in refs(r['domain_ids'])}
        assert refs(row['product_outcome_ids']) == expected, 'Stale or speculative reference/value join'
    mapped_fields = {r['reference_field_id']: r for r in field_adoption}
    for row in fields:
        if row['entity'] == 'Financials' and row['section'] in {'createPayoutSchema', 'updatePayoutStatusSchema'}:
            assert mapped_fields[row['reference_field_id']]['domain_id'] == 'D11', 'Staff payout is not family money'
        assert not row['pipeline_evidence'].startswith('Named UI control and schema declaration'), 'A key-name match is not a proven control/schema binding'
    for name in ['product-outcomes-and-simplicity.md', 'finance-simplification-and-control.md',
                 'source-conversation-review.md']:
        assert (PACKAGE / name).is_file(), name
    tools = table('design-tool-register.csv', 'tool_id')
    assert all(r['verified_status'] and r['limits'] for r in tools)
    routes = table('pysa-route-coverage.csv', 'route_path')
    index = json.loads((PACKAGE / 'pysa-source-index.json').read_text())
    assert {r['route_path'] for r in routes} == set(index['page_paths'])
    for row in routes:
        assert refs(row['reference_ids']) <= capids | {'investigate'}
        assert refs(row['domain_ids']) <= dids
    assert index['counts']['page_paths'] == len(index['page_paths'])
    assert index['counts']['action_ts_paths'] == len(index['action_ts_paths'])
    assert index['counts']['validation_ts_paths'] == len(index['validation_ts_paths'])
    assert index['counts']['exported_function_declarations'] == len(index['exported_function_declarations'])
    assert index['counts']['distinct_inspected_sources'] == len(set(index['inspected_sources']))

    inventory = json.loads((PACKAGE / 'academy-source-inventory.json').read_text())
    assert inventory['counts']['page_paths'] == len(inventory['page_paths'])
    for row in inventory['files']:
        path = Path(row['path'])
        assert not path.is_absolute() and '.env' not in str(path) and '..' not in path.parts
        assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == row['sha256'], f'Stale product source: {path}'

    # Relative package links are checked locally and in CI; external references are never fetched here.
    for md in PACKAGE.glob('*.md'):
        for raw in re.findall(r'\[[^\]]*\]\(([^)]+)\)', md.read_text()):
            target = raw.strip('<>').split('#', 1)[0]
            if not target or re.match(r'[a-z][a-z0-9+.-]*:', target, re.I) or target.startswith('/'):
                continue
            assert (md.parent / target).is_file(), f'Broken link {md.name}: {target}'
    pointer_files = [
        'AGENTS.md', 'README.md', 'docs/00-governance/engineering-charter.md',
        'docs/00-governance/source-register.md', 'docs/00-governance/decisions-and-open-questions.md',
        'docs/01-product/scope-and-release-map.md', 'docs/01-product/saas-operating-blueprint.md',
        'docs/01-product/roles-and-permissions.md', 'docs/04-engineering/architecture.md',
        'docs/02-workflows/family-finance.md', 'docs/02-workflows/trainer-compensation.md',
        'docs/02-workflows/platform-billing.md',
        'docs/04-engineering/data-model-and-dictionary.md', 'docs/03-design/design-tools-and-quality-guidance.md',
        'docs/03-design/pysa-behavior-preservation.md', 'docs/03-design/experience-performance-and-data-loading.md',
        'docs/06-delivery/app-implementation-plan.md', 'docs/06-delivery/roadmap-and-backlog.md',
        'docs/06-delivery/full-experience-redesign.md', 'docs/06-delivery/experience-execution.md',
        'docs/06-delivery/local-data-and-sync-plan.md', 'docs/06-delivery/pwa-delivery-and-readiness.md',
        'docs/06-delivery/request-hygiene-and-offline-standard.md', 'docs/06-delivery/test-strategy-and-acceptance.md',
        'docs/06-delivery/release-and-recovery.md', 'docs/06-delivery/cost-capacity-and-operations.md',
        'docs/07-handoff/start-here-for-builders.md', 'docs/07-handoff/setup-index.md',
        'design/app-experience-review/README.md']
    for name in pointer_files:
        assert 'master-plan-v2/README.md' in (ROOT / name).read_text(), name
    for name in ['docs/06-delivery/app-implementation-action-matrix.csv',
                 'docs/06-delivery/app-implementation-screen-matrix.csv',
                 'docs/06-delivery/app-implementation-requirement-links.csv',
                 'docs/03-design/screen-data-loading-matrix.csv', 'docs/04-engineering/journey-security-matrix.csv']:
        with (ROOT / name).open(newline='') as stream:
            assert all(r['master_plan_reference'] == 'docs/06-delivery/master-plan-v2/README.md' for r in csv.DictReader(stream)), name

    if reference_root:
        base = Path(reference_root).resolve()
        assert base.is_dir(), 'Requested reference root unavailable'
        for row in caps + fields:
            for value in refs(row['legacy_evidence']):
                match = re.fullmatch(r'(.+?)(?::(\d+)(?:[-–](\d+))?)?', value)
                assert match, value
                rel = Path(match.group(1))
                assert not rel.is_absolute() and '..' not in rel.parts and '.env' not in str(rel), value
                path = base / rel
                assert path.is_file(), value
                if match.group(2):
                    count = len(path.read_text().splitlines())
                    assert 1 <= int(match.group(2)) <= count, value
                    if match.group(3):
                        assert int(match.group(2)) <= int(match.group(3)) <= count, value
        findings = (base / 'engineering-audit/02-findings/findings-register.md').read_text()
        for row in caps + fields:
            assert all(fid in findings for fid in re.findall(r'FND-\d{4}', row['known_defects'])), row
        for name in index['page_paths'] + index['action_ts_paths'] + index['validation_ts_paths'] + index['inspected_sources']:
            assert (base / name).is_file(), name
        print('PASS external reference paths/line bounds/finding references;semantic pipeline/runtime proof remains separate')
    else:
        print('External PYSA checkout not required by CI;live reference-path check not executed in this mode')
    subprocess.run([sys.executable, str(ROOT / 'scripts/design/build_master_plan.py'), '--check'], check=True)
    print(f'PASS master plan: {len(domains)} domains,{len(reqs)} AO/AT,{len(batches)} batches,{len(caps)} PY capabilities,{len(fields)} reference field rows,{len(routes)} route dispositions;structural evidence only')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference-root', help='Optional local-only read-only PYSA checkout verification;never required in public CI')
    args = parser.parse_args()
    validate(args.reference_root)
