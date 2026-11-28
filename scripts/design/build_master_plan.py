"""Generate metadata/crosswalks for the master plan; never infer runtime approval."""
import argparse
import csv
import hashlib
import io
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKAGE = ROOT / 'docs/06-delivery/master-plan-v2'
DELIVERY = ROOT / 'docs/06-delivery'


def rows(path):
    with path.open(newline='') as stream:
        return list(csv.DictReader(stream))


def refs(value):
    return {x.strip() for x in value.split(';') if x.strip() and x.strip() != 'none'}


def csv_text(fields, values):
    out = io.StringIO(newline='')
    writer = csv.DictWriter(out, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    writer.writerows(values)
    return out.getvalue()


def json_text(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def source_inventory():
    # Deliberately limited safe source metadata: never environment/data/credential files.
    paths = sorted({p for p in (ROOT / 'apps/web/src').rglob('*')
                    if p.is_file() and p.suffix in {'.ts', '.tsx', '.css'}} |
                   {p for p in (ROOT / 'apps/web/public').glob('*')
                    if p.is_file() and (p.name.startswith('prepared-') and p.suffix == '.js'
                                        or p.name in {'manifest.json', 'manifest.webmanifest'})} |
                   {p for p in (ROOT / 'supabase/migrations').glob('*.sql')} |
                   {ROOT / 'apps/web/package.json', ROOT / 'package-lock.json'})
    files = [{'path': str(p.relative_to(ROOT)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(),
              'bytes': p.stat().st_size} for p in paths]
    previous = PACKAGE / 'academy-source-inventory.json'
    old = json.loads(previous.read_text()) if previous.exists() else {}
    anchor = old.get('source_anchor') if old.get('files') == files else None
    if not anchor:
        anchor = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    pages = [f['path'] for f in files if f['path'].endswith('/page.tsx')]
    api = [f['path'] for f in files if '/app/api/' in f['path'] and f['path'].endswith('/route.ts')]
    selectors = []
    for p in sorted((ROOT / 'apps/web/src/lib').glob('*.ts')):
        if p.name.endswith('.test.ts'):
            continue
        for number, line in enumerate(p.read_text().splitlines(), 1):
            values = re.findall(r"case\s+['\"]([a-zA-Z0-9_-]+)['\"]\s*:", line)
            if values:
                selectors.append({'path': str(p.relative_to(ROOT)), 'line': number, 'case_labels': values})
    return {
        'purpose': 'Safe inspected-source metadata, not complete semantic reachability or runtime proof',
        'source_anchor': anchor,
        'anchor_rule': 'Keep the inspected source base while selected file hashes are unchanged; docs commits do not fabricate a new product baseline',
        'files': files, 'page_paths': pages, 'api_route_paths': api, 'case_selector_index': selectors,
        'counts': {'source_files': len(files), 'page_paths': len(pages), 'api_routes': len(api),
                   'migrations': sum('/migrations/' in x['path'] for x in files)},
        'pwa_metadata': {'public_manifest_present': any(Path(f['path']).name in {'manifest.json', 'manifest.webmanifest'} for f in files),
                         'scope_note': 'Manifest presence alone does not establish OS installation/launch, offline coverage or acceptance'},
        'limits': ['Case labels are textual navigation aids, not an AST/API contract or exposed-endpoint count',
                   'Tests/source paths do not prove passing tests, current live SHA, authorization or full feature coverage',
                   'No private records, .env, tokens, provider payloads, SQL contents or credentials copied'],
    }


def generate():
    domains = rows(PACKAGE / 'domain-coverage.csv')
    requirements = rows(DELIVERY / 'requirements-traceability.csv')
    actions = rows(DELIVERY / 'app-implementation-action-matrix.csv')
    links = {r['requirement_id']: r for r in rows(DELIVERY / 'app-implementation-requirement-links.csv')}
    by_domain = {r['domain_id']: r for r in domains}
    outcomes = rows(PACKAGE / 'product-outcomes.csv')
    def value_ids(domain_id):
        return '; '.join(r['outcome_id'] for r in outcomes if domain_id in refs(r['domain_ids']))
    action_ids = {r['work_item_id'] for r in actions}
    crosswalk = []
    for req in requirements:
        linked = refs(links[req['requirement_id']]['action_work_items']) & action_ids
        ds = [d for d in domains if req['domain'] in refs(d['canonical_domain_names'])
              or linked & refs(d['canonical_work_ids'])]
        if not ds:
            raise ValueError(f"Requirement has no master domain: {req['requirement_id']}")
        screens = set()
        for action in actions:
            if action['work_item_id'] in linked:
                screens |= refs(action['screen_ids'])
        crosswalk.append({
            'requirement_id': req['requirement_id'], 'acceptance_test_id': req['acceptance_test_id'],
            'canonical_domain': req['domain'], 'requirement': req['requirement'],
            'action_work_items': '; '.join(sorted(linked)) or 'broad_unmapped_requires_action_packet',
            'screen_ids': '; '.join(sorted(screens)) or 'not_yet_precisely_mapped',
            'master_domain_ids': '; '.join(d['domain_id'] for d in ds),
            'delivery_batch_ids': '; '.join(sorted(set().union(*(refs(d['batch_ids']) for d in ds)))),
            'canonical_record': 'docs/06-delivery/requirements-traceability.csv',
            'evidence_reference': req['evidence_reference'] or 'no_current_evidence_recorded',
            'coverage_rule': 'Scope retained; broad joins do not close the parent requirement or infer runtime/acceptance',
        })
    adoption = []
    for ref in rows(PACKAGE / 'pysa-capabilities.csv'):
        domain = by_domain[ref['domain_id']]
        adoption.append({
            'reference_id': ref['reference_id'], 'domain_id': ref['domain_id'],
            'capability': ref['capability'], 'delivery_batch_ids': domain['batch_ids'],
            'product_outcome_ids': value_ids(ref['domain_id']),
            'canonical_work_ids': domain['canonical_work_ids'],
            'academy_contract': domain['contract'],
            'academy_current_scope': domain['implementation_summary'],
            'reference_adoption': ref['adoption'],
            'target_gap': ref['gap_summary'], 'policy_dependencies': domain['policy_dependencies'],
            'simplicity_rule': 'Keep the useful job;justify fields/steps/reviews;adapt or replace legacy machinery;do not silently remove canonical business scope',
            'evidence_rule': 'Reference observation only; exact field/action pipeline and accepted policy before dependent implementation',
        })
    field_domains = {'Player': 'D05', 'Guardian': 'D05', 'Staff': 'D06', 'Metric': 'D12',
                     'Evaluation': 'D12', 'Scheduling': 'D07', 'Attendance': 'D08',
                     'Financials': 'D10', 'Player Finance': 'D10', 'Trainer Finance': 'D11',
                     'Academies': 'D02', 'Communications': 'D16', 'Report': 'D13',
                     'Media': 'D14', 'Inventory': 'D21', 'Support': 'D15',
                     'Privacy request': 'D17', 'Privacy review': 'D17', 'Consent': 'D17',
                     'Retention': 'D17', 'Platform setting': 'D20'}
    field_adoption = []
    for ref in rows(PACKAGE / 'pysa-fields.csv'):
        did = field_domains[ref['entity']]
        if ref['entity'] == 'Financials' and ref['section'] in {'createPayoutSchema', 'updatePayoutStatusSchema'}:
            did = 'D11'  # Legacy generic finance schema also declares staff payouts; never mix them into family billing.
        if ref['entity'] == 'Staff' and any(k in ref['field_key'] for k in ['salary_rate', 'contract_type']):
            did = 'D11'
        domain = by_domain[did]
        field_adoption.append({
            'reference_field_id': ref['reference_field_id'], 'entity': ref['entity'],
            'field_key': ref['field_key'], 'domain_id': did, 'delivery_batch_ids': domain['batch_ids'],
            'product_outcome_ids': value_ids(did),
            'academy_contract': domain['contract'], 'policy_dependencies': domain['policy_dependencies'],
            'pipeline_evidence': ref['pipeline_evidence'],
            'current_rule': 'Compare with current scoped implementation; reference field is not an accepted AcademyOS column/permission/local download',
            'next_check': 'Justify user job and minimum input;select purpose/requiredness/type/unit/visibility;trace create/edit/read/import/export/local/sync and recovery before adopting',
        })
    return {
        'academy-source-inventory.json': json_text(source_inventory()),
        'requirements-crosswalk.csv': csv_text(list(crosswalk[0]), crosswalk),
        'pysa-adoption-map.csv': csv_text(list(adoption[0]), adoption),
        'field-adoption-map.csv': csv_text(list(field_adoption[0]), field_adoption),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    outputs = generate()
    for name, content in outputs.items():
        path = PACKAGE / name
        if args.check:
            if not path.exists() or path.read_text() != content:
                raise SystemExit(f'FAIL: stale master artifact {name}; run python3 scripts/design/build_master_plan.py')
        else:
            path.write_text(content)
    print('PASS master-plan generated artifacts current' if args.check else 'Updated four master-plan source/crosswalk/adoption artifacts')


if __name__ == '__main__':
    main()
