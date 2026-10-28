"""Join design inventories into documentation-only implementation registers.
Existing requirement/journey status is quoted, never promoted by a prototype.
"""
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DELIVERY = ROOT / 'docs/06-delivery'
DESIGN = ROOT / 'design/experience-prototype-v1/docs'
DATE = '2026-10-25'

def read(path):
    with path.open(newline='') as stream:
        return list(csv.DictReader(stream))

def write(name, rows):
    with (DELIVERY / name).open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)

def ids(text, prefix):
    # Accept AO-085–092 and AO-085–AO-092; identifiers stay canonical.
    result = set()
    pattern = rf'{prefix}-?(\d+)(?:[–—-](?:{prefix}-?)?(\d+))?'
    for match in re.finditer(pattern, text):
        lo, hi = int(match[1]), int(match[2] or match[1])
        result.update(f'{prefix}-{i:03}' if prefix == 'AO' else f'{prefix}{i:02}' for i in range(lo, hi + 1))
    return sorted(result)

screens = read(DESIGN / 'coverage-screens.csv')
actions = read(DESIGN / 'page-action-matrix.csv')
requirements = read(DELIVERY / 'requirements-traceability.csv')
journeys = read(ROOT / 'docs/03-design/journey-register.csv')
loading = read(ROOT / 'docs/03-design/screen-data-loading-matrix.csv')
requirement_by_id = {r['requirement_id']: r for r in requirements}
journey_by_id = {r['journey_family_id']: r for r in journeys}
loading_ids = {r['matrix_id'] for r in loading}
implemented_screens = {
 'S16': 'apps/web/src/components/people-workspace.tsx',
 'S17': 'apps/web/src/components/people-workspace.tsx',
 'S18': 'apps/web/src/components/people-workspace.tsx',
 'S19': 'apps/web/src/components/guardian-workspace.tsx',
 'S20': 'apps/web/src/components/trainer-workspace.tsx',
 'S01': 'apps/web/src/app/[locale]/sign-in/[[...sign-in]]/page.tsx',
 'S02': 'apps/web/src/components/onboarding-workspace.tsx',
 'S03': 'apps/web/src/components/onboarding-workspace.tsx',
 'S06': 'apps/web/src/components/onboarding-workspace.tsx',
 'S07': 'apps/web/src/components/onboarding-workspace.tsx',
 'S13': 'apps/web/src/components/onboarding-workspace.tsx',
 'S14': 'apps/web/src/components/onboarding-workspace.tsx',
 'S15': 'apps/web/src/components/onboarding-workspace.tsx',
 'S21': 'apps/web/src/components/onboarding-workspace.tsx',
 'S59': 'apps/web/src/components/onboarding-workspace.tsx',
 'S60': 'apps/web/src/components/onboarding-workspace.tsx',
 'S61': 'apps/web/src/components/onboarding-workspace.tsx',
 'S62': 'apps/web/src/components/onboarding-workspace.tsx',
}
base_components = 'WorkspaceShell; Button; Input; Select; StatusBadge; semantic CSS tokens'

def component_plan(number):
    if number in implemented_screens_as_numbers:
        return base_components, 'Remaining: table/inspection/receipt presentation as required by actual M1 data'
    if number in range(16, 22) or number in (59, 60, 66, 67):
        return base_components, 'Proposed: scoped directory; duplicate review; relationship review; import result list'
    if number in range(22, 31):
        return base_components, 'Proposed: session preview; complete roster; attendance mark; operation receipt; correction diff'
    if number in range(36, 46) or number in (8, 9):
        return base_components, 'Proposed: versioned contract review; money field after currency policy; allocations; immutable receipt'
    if number >= 51 and number <= 58:
        return base_components, 'Proposed: observation/freshness; impact detail; cost provenance; incident and recovery evidence'
    return base_components, 'Proposed: domain-specific detail/progress/review pattern; inspect actual repeated needs first'

implemented_screens_as_numbers = {int(s[1:]) for s in implemented_screens}
action_rows = []
for index, action in enumerate(actions, 1):
    sid = ids(action['screen_ids'], 'S')
    families = sorted(set(re.findall(r'J\d{2}', action['action_id'])))
    reqs = ids(action['requirements'], 'AO')
    assert set(reqs) <= requirement_by_id.keys(), (index, reqs)
    assert set(families) <= journey_by_id.keys(), (index, families)
    matrix = sorted({l['matrix_id'] for l in loading if set(re.findall(r'J\d{2}', l['journey_family_ids'])) & set(families)})
    primary_action = re.search(r'J\d{2}-A\d{2}', action['action_id'])[0]
    existing = primary_action in {'J02-A01', 'J03-A03', 'J03-A01', 'J01-A01', 'J04-A01', 'J04-A02', 'J04-A03'}
    training = primary_action in {'J06-A01', 'J07-A01', 'J09-A01', 'J10-A01', 'J12-A01', 'J13-A01', 'J15-A01'}
    action_rows.append({
      'work_item_id': 'IMP-' + primary_action, 'as_of': DATE,
      'journey_action_ids': action['action_id'], 'screen_ids': '; '.join(sid),
      'actor_context': action['actor'], 'requirement_ids': '; '.join(reqs),
      'acceptance_case_ids': '; '.join(requirement_by_id[r]['acceptance_test_id'] for r in reqs),
      'prototype_reference': 'design/experience-prototype-v1/prototype/index.html :: ' + action['prototype_page'],
      'action_contract': 'design/experience-prototype-v1/docs/' + ('batch-1-action-contracts.md' if existing else 'batch-2-action-contracts.md' if training else 'batch-5-final-handoff.md'),
      'component_reuse': base_components,
      'domain_components': 'AdmissionDirectory exists for M1 platform projection; other domain components remain proposed' if existing else 'See screen register; design proposal only until source exists',
      'loading_contract_ids': '; '.join(matrix),
      'security_packet_ids': '; '.join('SEC-' + family for family in families),
      'policy_dependency': action['policy'],
      'policy_status': 'Bounded M1 accepted; broader policy remains open' if existing else 'Dependent policy must be resolved against current decision register; fixture is not acceptance',
      'design_status': 'Prototype source and contracts exist; rendered review pending',
      'implementation_status': 'Existing bounded M1 behavior; new shared visual source implemented locally' if existing else 'This broader action group is not implemented by the design prototype; inspect any reusable foundation before build',
      'implementation_source': 'apps/web/src/components/onboarding-workspace.tsx' if existing else '',
      'verification_status': 'Visual slice: Node24 build/typecheck/lint and31 unit tests; production/development EN/AR 360/1440px M1 interaction harness and5 foundation E2E pass; hosted/physical-device review separate' if existing else 'Prototype model/template evidence only; real UI/API/DB/job/permission/recovery cases unexecuted',
      'deployment_status': 'Approved compact-blue M1 subset deployed to staging: b57dfdb / dpl_7XgyhKgQC3UApx1ZSBn26BhqMNjk; full action group remains scoped' if existing else 'Not deployed as this design action group',
      'owner_approval_status': 'Shown compact-blue M1 visual design approved by Moamen 24 October 2026; hosted/whole-action acceptance separate' if existing else 'Pending; no acceptance inferred from reference selection',
      'applicable_states': action['states'],
      'evidence_reference': 'docs/07-handoff/compact-blue-integration-verification.md' if existing else 'design/experience-prototype-v1/docs/batch-5-final-handoff.md',
      'next_gate': 'I2a policy/design decision; I1 owner acceptance and broader hosted/device/security gates remain open' if existing else 'Expand policy and server/data/action contract; approve dependent rules; implement one full vertical slice',
    })
# Current scoped source/evidence supersede dated prototype-only status, never whole-family closure.
scoped = {
 'J01': ('onboarding-workspace', 'onboarding-m1-verification'),
 'J02': ('onboarding-workspace', 'm1-admission-presentation'),
 'J03': ('onboarding-workspace', 'onboarding-m1-verification'),
 'J04': ('onboarding-workspace', 'onboarding-m1-verification'),
 'J06': ('people-workspace', 'i2a-registration-implementation'),
 'J07': ('guardian-workspace', 'i2b-guardian-implementation'),
 'J08': ('trainer-workspace', 'i2c-trainer-implementation'),
}
for row in action_rows:
    primary = re.search(r'J\d{2}', row['journey_action_ids'])[0]
    if primary in scoped:
        component, receipt = scoped[primary]
        canonical = journey_by_id[primary]
        row.update(implementation_source=f'apps/web/src/components/{component}.tsx',
          implementation_status=canonical['implementation_status'] + '; reference presentation refinement implemented; broader action retained',
          verification_status=canonical['verification_status'] + '; reference refinement local browser/build checks passed; hosted status in reference-refinement-implementation.md',
          deployment_status='Existing bounded functional slice deployed; reference refinement rollout recorded separately in reference-refinement-implementation.md',
          owner_approval_status=canonical['acceptance_status'] + '; Owner accepted deployed workflow clarity correction25Oct2026; broader acceptance gates retained',
          design_status='Corrected original-reference foundation confirmed by owner implementation handoff 2026-10-25',
          evidence_reference=f'docs/07-handoff/{receipt}.md',
          domain_components=f'{component}; WorkspaceShell; WorkspacePanes; native controls',
          next_gate='Accepted working presentation; broader direct API/device/performance/independent-security gates retained')
# I3a is a bounded Owner-only subset; broader action/requirement acceptance remains separate.
for row in action_rows:
    if row['work_item_id'] == 'IMP-J09-A01':
        row.update(as_of='2026-10-26',actor_context='Current Academy Owner; synthetic initial branch/sport only',
          policy_status='Owner-only draft policy accepted25Oct; weekday times requested and longer-period/window separation agreed; wider scheduling policies remain open',
          design_status='Completed I3a connected EN/AR full-period/weekday-time/preparation/recovery design explicitly approved26Oct2026',
          implementation_status='Owner-only draft subset implemented and staging deployed; broader scheduling/publish action remains open',
          implementation_source='apps/web/src/components/program-workspace.tsx',
          verification_status='Local SQL/API/product React and backup rehearsal pass; hosted40-date pause/reload/resume/finalize verified; wider negative/race/load/device gates open',
          deployment_status='Hosted migration applied and synthetic staging deployment/runtime verified26Oct2026; see current receipt',
          owner_approval_status='Policy/design approved; Moamen explicitly accepted working draft-program wording/usability after staging review; wider gates remain open',
          evidence_reference='docs/07-handoff/i3a-program-implementation.md',
          next_gate='Remaining hosted direct-API/race cases; retain independent security/device/load/cost gates')
# I3b retains broader enrollment/publication requirements and unverified gates.
for row in action_rows:
    if row['work_item_id']=='IMP-J10-A01':
        row.update(as_of='2026-10-27',actor_context='Current Academy Owner; private synthetic dated planning only',
          policy_status='I3b one-date capacity/Trainer/fictional roster policy accepted27Oct; publication/recurring enrollment/fees remain separate',
          design_status='Connected I3b EN/AR date planning and recovery design explicitly approved27Oct2026',
          implementation_status='Private individual-date and all-or-none program planning implemented and deployed; broader group open',
          implementation_source='apps/web/src/components/date-planning-workspace.tsx',
          verification_status='I3b hosted path preserved; I3c full58 local SQL groups plus focused cases, API/React/build pass; I3c staging schema/ACL and Owner prepare/resume/commit/reopen plus foreign-academy denial passed',
          deployment_status='I3c migration20261027022133 and sourceef9a87e deployed to existing synthetic staging; dpl_2sUyztivHesF4Tu9GR4mnh71697n Ready',
          owner_approval_status='I3b/I3c policy/design approved; Moamen explicitly accepted working whole-program planning wording/usability EN/AR27Oct2026; broader gates open',
          evidence_reference='docs/07-handoff/i3c-program-planning-implementation.md',
          next_gate='Remaining hosted direct-API/race checks and independent security/device/load/cost gates')
# I3d adds only bounded publication/assigned Trainer visibility; broader actions remain open.
for row in action_rows:
    if row['work_item_id'] in ('IMP-J10-A01','IMP-J11-A01'):
        row.update(as_of='2026-10-28',
          implementation_status=row['implementation_status']+'; I3d publication and assigned Trainer read-only schedule implemented locally',
          verification_status=row['verification_status']+'; I3d67 disposable SQL tests, API/React checks and backup restore pass;1000-date300ms target missed; hosted and independent gates open',
          deployment_status='I3d migration20261027210954 and source12d33f1 serving existing staging at dpl_3qNbqJgUMz1tA92cKLcbZPhvhAV6; hosted Owner and authorized single-date publish/Trainer roster/withdraw/end smoke passed; appointment ended; broader gates open',
          owner_approval_status=row['owner_approval_status']+'; I3d policy/design approved27Oct; Moamen explicitly accepted working publication journey wording/usability28Oct2026; broader gates open',
          evidence_reference='docs/07-handoff/i3d-publication-implementation.md',
          next_gate='I3d remaining hosted direct-API/races and independent security/device/performance/load/cost gates')
# I4a implements manual capture and reasoned Owner direct correction only.
for row in action_rows:
    if row['work_item_id'] in ('IMP-J12-A01','IMP-J13-A01'):
        row.update(as_of='2026-10-28', actor_context='Current Owner or exact active assigned Trainer; Owner-only direct correction; synthetic published occurrence',
          policy_status='Bounded I4a D-012 rules accepted28Oct; QR/offline/late/excused/family/Manager and request-review policy remain open',
          design_status='Connected I4a EN/AR phone/desktop design explicitly approved28Oct2026',
          action_contract='docs/06-delivery/i4a-online-attendance-design-contract.md',
          implementation_source='apps/web/src/components/attendance-workspace.tsx',
          implementation_status='Bounded online manual register and reasoned Owner direct correction implemented locally; wider capture/scan/correction-request family remains open',
          verification_status='85 actual disposable PG17 cases; API/actual React production-development/55 units/build/lint/typecheck and13 foundation E2E pass; scoped SQL scale only; hosted attendance and independent gates open',
          deployment_status='Additive staging migration20261028024556 and appfa1fff8 deployed; dpl_B6kFNoy4Z5N9cKJ9K6RNF9HXt82p Ready; limited Owner/denied-resource smoke passed; hosted attendance pending',
          owner_approval_status='Policy and connected design approved; working-feature acceptance pending',
          evidence_reference='docs/07-handoff/i4a-attendance-implementation.md',
          next_gate='Separately authorized temporary Trainer hosted attendance test; working acceptance; remaining independent security/device/load/cost gates')
write('app-implementation-action-matrix.csv', action_rows)

screen_rows = []
for screen in screens:
    sid = screen['screen_id']; number = int(sid[1:])
    links = [a for a in action_rows if sid in a['screen_ids'].split('; ')]
    reqs = sorted({r for a in links for r in a['requirement_ids'].split('; ') if r})
    shared, proposed = component_plan(number)
    existing = sid in implemented_screens
    screen_rows.append({
      'screen_id': sid, 'id_origin': screen['id_origin'], 'screen': screen['screen'], 'as_of': DATE,
      'release_scope': screen['release_scope'], 'design_batch': screen['batch'],
      'prototype_reference': 'design/experience-prototype-v1/prototype/index.html :: ' + screen['new_prototype_route'],
      'action_work_items': '; '.join(a['work_item_id'] for a in links),
      'requirement_ids': '; '.join(reqs),
      'canonical_requirements': 'docs/06-delivery/requirements-traceability.csv; mapped action requirements are scoped links, not full screen acceptance',
      'shared_components_existing': shared, 'domain_components_proposed': proposed,
      'loading_contract_ids': '; '.join(sorted({m for a in links for m in a['loading_contract_ids'].split('; ') if m})),
      'security_packet_ids': '; '.join(sorted({m for a in links for m in a['security_packet_ids'].split('; ') if m})),
      'policy_dependency': screen['policy_dependency'],
      'design_status': 'Source/contract exists or explicit blocked/later concept; rendered review pending',
      'implementation_status': 'Bounded M1 subset only; shared visual source locally replaced; full catalog screen remains incomplete' if existing else 'Custom product screen not implemented by this design task; provider/foundation primitives do not establish the whole screen',
      'implementation_source': implemented_screens.get(sid, ''),
      'verification_status': 'Local build/typecheck/lint/31 unit checks; M1 EN/AR keyboard/recovery harness and5 foundation E2E pass; API/DB/full-screen evidence separate' if existing else 'Prototype evidence only; functional acceptance unexecuted',
      'deployment_status': 'Compact-blue M1 subset including I1 admission detail deployed to staging b57dfdb; full catalog screen not established' if existing else 'No functional screen deployment established by this register',
      'owner_approval_status': 'Shared foundation/shown M1 visual subset approved 24 October 2026; full catalog screen acceptance pending' if existing else 'Pending new screen/visual acceptance',
      'next_gate': 'Broader hosted/device/security verification; full catalog screen remains incomplete' if existing else 'Select bounded action, current policy and real data operation; retain full required/later scope',
    })
for row in screen_rows:
    if row['implementation_source']:
        row.update(implementation_status='Bounded functional subset exists in named source; original-reference presentation refinement implemented; wider catalog screen incomplete',
          verification_status='Per-slice canonical receipt and current refinement tests are separate; no whole-screen/security acceptance',
          deployment_status='Existing bounded slice deployed; reference refinement rollout recorded in reference-refinement-implementation.md',
          design_status='Owner confirmed original-reference foundation 2026-10-25',
          owner_approval_status='Prior per-slice functional approvals preserved; deployed workflow clarity presentation accepted25Oct2026; broader screen acceptance open')
for row in screen_rows:
    if row['screen_id']=='S27':
        row.update(as_of='2026-10-28',implementation_source='apps/web/src/components/attendance-workspace.tsx',
          design_status='Bounded I4a connected register design approved28Oct',
          implementation_status='Manual published-session register and Owner direct correction implemented locally; full Trainer Today/scanning/Manager scope remains open',
          verification_status='Per-slice local SQL/API/React/build receipts; no full-screen or independent-security acceptance',
          deployment_status='Staging schema and appfa1fff8 deployed; actual attendance verification pending',
          owner_approval_status='Policy/design approved; working-feature acceptance pending',next_gate='Hosted attendance and broader screen/security/device/load gates')
write('app-implementation-screen-matrix.csv', screen_rows)

requirement_rows = []
for req in requirements:
    rid = req['requirement_id']; links = [a for a in action_rows if rid in a['requirement_ids'].split('; ')]
    requirement_rows.append({
      'requirement_id': rid, 'as_of': DATE, 'release_stage': req['release_stage'],
      'acceptance_test_id': req['acceptance_test_id'], 'canonical_record': 'docs/06-delivery/requirements-traceability.csv#' + rid,
      'canonical_implementation_status_snapshot': req['implementation_status'],
      'canonical_test_status_snapshot': req['test_status'],
      'canonical_evidence_snapshot': req['evidence_reference'],
      'action_work_items': '; '.join(a['work_item_id'] for a in links),
      'design_contract': req['design_document'],
      'mapping_status': 'Scoped action joins; not full requirement completion' if links else 'Cross-cutting/domain requirement retained; expand exact action mapping before its slice',
      'source_status_rule': 'Canonical requirement record and dated evidence govern; snapshots may lag later work; no prototype promotion',
      'next_gate': 'Reconcile actual requirement cases, policy, source, verification, deployment and owner approval independently',
    })
write('app-implementation-requirement-links.csv', requirement_rows)
print(f'Wrote {len(screen_rows)} screens, {len(action_rows)} action groups, {len(requirement_rows)} requirement joins.')
