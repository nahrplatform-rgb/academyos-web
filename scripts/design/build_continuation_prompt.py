"""Generate the copyable continuation prompt from the authoritative tracker."""
import argparse
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACKER = ROOT / 'docs/06-delivery/experience-execution.csv'
OUTPUT = ROOT / 'docs/06-delivery/continue-academyos.md'


def validate_worker_assignments(items, rows, batches):
    """Validate scoped work records without creating another execution queue."""
    parents = {r['work_id']: r for r in rows}
    catalog = {b['batch_id']: b for b in batches}
    allowed = {'ready_for_handoff', 'running', 'submitted_for_review', 'in_review',
               'reviewed_corrected', 'reviewed_retained', 'blocked', 'cancelled'}
    seen, owned = set(), {}
    for item in items:
        task = item.get('task_id', '')
        if not task.startswith('DS-') or not task[3:].isdigit() or task in seen:
            raise ValueError('Worker task needs a stable unique DS ID')
        seen.add(task)
        parent = parents.get(item.get('parent_work_id'))
        batch = catalog.get(item.get('delivery_batch'))
        if parent is None or batch is None or batch['execution_work_id'] != item['parent_work_id']:
            raise ValueError('Worker task must join its existing EX/batch')
        if item.get('status') not in allowed or any(not str(value).strip() for value in item.values()):
            raise ValueError('Worker task status/fields missing')
        paths = [p.strip() for p in item['owned_write_paths'].split(';') if p.strip()]
        for raw in paths + [item['brief']]:
            path = Path(raw)
            if path.is_absolute() or '..' in path.parts:
                raise ValueError('Worker paths must stay in the repository')
        if not (ROOT / item['brief']).is_file():
            raise ValueError('Worker task brief missing')
        if item['status'] == 'submitted_for_review' or item['status'].startswith('reviewed_'):
            if not paths or any(not (ROOT / path).is_file() for path in paths):
                raise ValueError('Submitted/reviewed worker task needs its actual output files')
        if item['status'] in {'ready_for_handoff', 'running', 'submitted_for_review'}:
            for path in paths:
                if path in owned:
                    raise ValueError('Worker output ownership overlaps')
                owned[path] = task
        evidence = item['review_evidence']
        if item['status'].startswith('reviewed_') and (evidence == 'none_yet' or not (ROOT / evidence).is_file()):
            raise ValueError('Reviewed worker task needs coordinator evidence')
    return items


def execution_route(rows):
    """Choose only an explicit tracker priority, never the first unfinished ID."""
    if not rows:
        raise ValueError('Execution tracker is empty')
    allowed_states = {'current', 'queued', 'supporting', 'retained', 'checkpoint_passed'}
    lanes = {'baseline', 'primary', 'supporting'}
    seen = set()
    for row in rows:
        if row.get('execution_lane') not in lanes or row.get('execution_state') not in allowed_states:
            raise ValueError(f"Invalid execution routing for {row.get('work_id')}")
        order = row.get('execution_order', '')
        if not order.isdecimal():
            raise ValueError('Execution order must be a nonnegative integer')
        pair = (row['execution_lane'], int(order))
        if pair in seen or not row.get('dependency_gate', '').strip():
            raise ValueError('Duplicate lane/order or missing scoped dependency gate')
        seen.add(pair)
        if row['execution_lane'] == 'primary':
            if row['execution_state'] not in {'current', 'queued', 'checkpoint_passed'}:
                raise ValueError('Primary work needs a current, queued or checkpoint_passed route state')
        elif row['execution_state'] != {'baseline': 'retained', 'supporting': 'supporting'}[row['execution_lane']]:
            raise ValueError('Baseline/supporting route state does not match lane')
    primary = sorted((r for r in rows if r['execution_lane'] == 'primary'), key=lambda r: int(r['execution_order']))
    if [int(r['execution_order']) for r in primary] != list(range(1, len(primary) + 1)):
        raise ValueError('Primary execution order must be consecutive from 1')
    current = [r for r in rows if r['execution_state'] == 'current']
    if len(current) != 1 or current[0]['execution_lane'] != 'primary':
        raise ValueError('Exactly one primary work item must be explicitly current')
    active = current[0]
    for row in primary:
        before = int(row['execution_order']) < int(active['execution_order'])
        if before and row['execution_state'] != 'checkpoint_passed':
            raise ValueError('Earlier primary checkpoint is not explicitly passed; record any reprioritization')
        if not before and row is not active and row['execution_state'] != 'queued':
            raise ValueError('Later primary work must remain queued')
    return active, primary


def render(rows, batches=None, outcomes=None, work_items=None):
    """Keep ready development independent of a deferred Owner release."""
    active, primary = execution_route(rows)
    if batches is None:
        with (ROOT / 'docs/06-delivery/master-plan-v2/delivery-batches.csv').open(newline='') as stream:
            batches = list(csv.DictReader(stream))
    catalog = {r['batch_id']: r for r in batches}
    batch_id = active.get('delivery_batch', '')
    if batch_id not in catalog:
        raise ValueError(f'Current tracker has no known delivery batch: {batch_id}')
    batch = catalog[batch_id]
    if work_items is None:
        with (ROOT / 'docs/06-delivery/ai-work-items.csv').open(newline='') as stream:
            work_items = list(csv.DictReader(stream))
    validate_worker_assignments(work_items, rows, batches)
    if outcomes is None:
        with (ROOT / 'docs/06-delivery/master-plan-v2/product-outcomes.csv').open(newline='') as stream:
            outcomes = list(csv.DictReader(stream))
    value_catalog = {r['outcome_id']: r for r in outcomes}
    value_ids = [v.strip() for v in batch.get('product_outcome_ids', '').split(';') if v.strip()]
    if not value_ids or any(v not in value_catalog for v in value_ids):
        raise ValueError('Current batch needs known product outcomes')
    development = active.get('development_next_action', '').strip()
    release = active.get('release_follow_up', '').strip()
    if not development or not release:
        raise ValueError('Current work needs separate development and release actions')
    checkpoint = active.get('evidence', '').strip()
    checkpoint_path = Path(checkpoint)
    if (not checkpoint or checkpoint_path.is_absolute() or '..' in checkpoint_path.parts
            or not (ROOT / checkpoint_path).resolve().is_relative_to(ROOT)
            or not (ROOT / checkpoint_path).is_file()):
        raise ValueError('Current checkpoint must be an existing repository-relative evidence file')
    intro = """# AcademyOS living continuation prompt

Generated from `experience-execution.csv` and the v2 batch catalog. Do not edit directly. Regenerate with `python3 scripts/design/build_continuation_prompt.py`; stale routing is rejected. This prompt is an execution handoff, not a new business rule, permission, release or acceptance.

Reusable instruction: **Continue from the living continuation prompt.**

Continue AcademyOS in `/Users/moamenghareeb/AcademyOS`. Inspect the actual tree/source and retain pre-existing edits, completed work, accepted rules, stable IDs and exact evidence.

When changing AI clients, start from [the portable handoff](../07-handoff/opencode-project-handoff-2026-11-12.md), then use this generated prompt and the current tracker. The handoff's dated release snapshot is historical after later checkpoints. One coordinator owns the working checkout. Record actual available tools and configured models. Keep the same delivery and promotion authority across clients.

The reusable instruction means read these files afresh, reconcile the single current tracker row with Git and existing edits, then continue its next permitted connected checkpoint. Implement and verify authorized work, record evidence and update the tracker, and regenerate this prompt after a checkpoint or interruption. Continue through ready work until the requested outcome, a genuine blocker, required Owner decision or existing stopping condition. A handover-verification-only request stops after verification. The files carry continuity when earlier conversation context or Auto routing is unavailable.

Auto may classify this short request before reading the tracker. Determine complexity and required authority from the actual batch before implementation. If Auto cannot reconsider that context or its selected model is unsuitable, manually select an already authorized capable model for the same task. Balanced and Authority are reported paid Signor routes; verify the executed provider/model and spending authorization for manual calls too. The reported daily budget is a soft gate using estimated accounting. See the current delegation policy for evidence levels, estimated usage, explicit helpers and manual fallback limits.

For interaction with the user's browser, follow the [15 November browse session rules](local-development-and-verification.md#browser-sessions--15-november-2026). Prefer browse MCP and create an individually named session with `session_new`. Pass its ID explicitly on every call and restrict the allowlist to required origins. Snapshot before acting and verify afterward. Use handoff for logins, 2FA, passkeys and payments; the Owner handles CAPTCHAs. Nahr, Hieu and Dokkanni are shared browser profiles. Provider/profile/catalog/MCP changes require Owner approval and credentials remain private.

## Read in this order

1. `AGENTS.md`, `docs/06-delivery/master-plan-v2/README.md` and `product-outcomes-and-simplicity.md` in that package.
2. The single current tracker row, its batch definition, `baseline-and-coverage.md` and its evidence. Dated old next-step paragraphs cannot override the tracker.
3. The applicable module specification, PYSA capability/field/adoption rows, new detail/decision dependencies and existing canonical action/loading/security contracts. Reference source is read-only; field/UI presence is not a verified end-to-end behavior. Read `source-conversation-review.md` for historical chat limits and `finance-simplification-and-control.md` for financial work.
4. `docs/03-design/operations-design-reference.md`, the v2 UI/UX/sport/tenant specifications and verified design-tool register for affected work.
5. `docs/06-delivery/local-data-and-sync-plan.md`, v2 local/sync/PWA specification, existing field/key/repository/original/conflict contracts and PW/WD cases for affected work. Use the Shift iOS mechanism review as reference, not imported academy policy.
6. Engineering charter, staging/public-repository/AI-delegation policies, request findings/impact and applicable current source/tests. Read the narrow relevant evidence instead of replaying every historical packet.

## Current delivery method and authority

The Owner requested the v2 master package and larger connected outcomes on7November. That checkpoint authorizes documentation/tooling only, not product code/schema/provider/account changes. A later implementation continuation may resume previously accepted ready work; genuinely new field visibility, money, resource rules, roles and offline commands need their concrete decisions before dependent implementation. Do not infer policy approval from a catalog row. Continue ready independent work when one choice is blocked; if an entire current batch cannot advance, record the limitation and explicitly reprioritize/reorder ready tracker rows, keeping the blocked row queued. Never fabricate a passed prerequisite or a second current queue.

Build a coherent role working day or domain lifecycle, with functionality, Operations UI and scoped local/sync together. Run focused contract/boundary checks during edits; consolidate broad regressions, captures/factual HTML and release validation at meaningful checkpoints. Preserve required assertions and repair failures. Do not substitute another colour pass, tiny isolated release or new unapproved feature for the declared outcome.

Apply [the local development/verification manual](local-development-and-verification.md): `npm run dev` exposes live saved edits at `http://localhost:3000/en`; `npm run local:production` builds/runs the separate `http://localhost:3100/en` origin. Use the canonical localhost name: its numeric alias fails the installed NextURL/API same-origin comparison. Storage/worker scopes are port-specific; sign-in cookies may be shared, so verify the actual account. Use `npm run local:preflight` for configuration presence/recovery only. Configured local UI may write to shared synthetic staging; no local database or completed private offline journey is implied. Keep private settings and connected traces out of Git/chat.

Use `npm run local:verify -- --suite=<named-profile>` and compact receipts for applicable focused cases; this bounded convenience profile is not the full release gate. Scripts collect evidence and the coordinator inspects failures and selected visual checkpoints. Reuse passing unchanged evidence only with intact artifacts and its original timestamp; live-server smoke always runs fresh. Resolve routine corrections internally, inspect actual claims/assertions and retain required negative controls. A useful economical helper follows existing ownership/model limits. No perfect-work guarantee, measured token saving or stronger runtime layer is inferred. Live editing, local production proof, one coherent candidate and targeted staging verification remain separate; promotions stay Owner-only.

The Owner wants all implemented journeys functional locally, including supported offline work, with commits/pushes from this workspace. The local-only encrypted-archive loader supplies existing wrapping roots in server memory; preserve custody and keep live credentials out of fixtures. Every new feature declares its local path/settings/test data and acceptance. Do not require a promotion before routine editing or claim that HMR proves cold offline behavior. Provider-only callbacks, actual deployment/OS behavior and unbuilt modules retain their honest boundaries. See [the local functional setup](../07-handoff/local-functional-environment-2026-11-13.md).

Product purpose: make academy management understandable at any point, save Owner time, retain control and enable safe delegation. Provide a separate complete Platform business workspace for academies, subscriptions, platform finance, services and tools. Link the batch's VAL outcomes and justify required fields, steps and reviews. Preserve useful PYSA outcomes while simplifying or replacing unnecessary machinery, especially finance; inventory coverage is not a mandate to copy it. Retain all accepted controls and canonical scope; a business capability exclusion needs its actual decision. Market leadership is an ambition, not a measured claim.

The Operations reference is light default with Charcoal alternative, compact resizable panes, useful density and coherent controls. Match actual geometry/type/spacing/colour/forms/tables/dialogs/focus/return against equivalent reference states. Complete each role journey; plugins/ratings/static replay do not establish parity. Use relevant installed skills proportionately; verify availability and pinned dependencies before use. No installation/purchase/upload is implied.

Multisport includes different vocabulary, fields, groups, metric schemas, resources and allocation rules. Pool/lanes are not a renamed pitch. Shared person/core data and sport participation are distinct. Multi-academy includes global identity versus memberships, exact tenant/branch/field authority, distinct Platform navigation and safe context/local-original separation. Do not broaden Platform private tenant access.

Normal prepared-device routes read compatible permitted data online/offline, prioritize useful content then bounded directory/current-next-previous-month preparation, retain context, and sync supported commands quietly through original IDs. Reuse existing protected repositories/coordinator/workers. No competing offline engine, blanket private HTML/API cache, unbounded whole-platform preload or query-cache persistence substitute. New domains inherit typed local contracts as they are built.

Normal email/password remains sufficient: no mandatory passkey, extra local secret, inactivity lock or24-hour read cutoff. Logout/30-day replica cleanup and protected same-account originals remain. The attendance24-hour recording deadline is a different accepted rule. UTC capture and server time/version are distinct; no universal timestamp-wins overwrite.401 is missing authentication, not known role loss; exact binding refusal is not account change. Keep dirty/unknown guards, actual403/410 fences, current server checks and original reconciliation before replacement. Never delete a slot/original or request another profile as a repair shortcut.

PWA EX-14/15/16 accompanies affected slices: installation identity early, shared worker/code/local-schema compatibility and actual installed-device proof per delivered capability. Existing root workspace/narrower register workers and public-only shells stay. Installed/browser sessions, keys and storage may differ. Closed background execution is best effort; native clients are later scoped work.

Independent human/external security review remains Deferred by Owner, nonblocking for authorized synthetic staging and not performed. Real security/integrity checks/findings remain engineering obligations. SDR-06/07 standing synthetic-trial authority and completed role/configuration work stay; do not repeat per-test grant/activation questions within that scope. No production, real-data, paid commitment or irreversible deletion is inferred.

Owner-only promotions remain strict. Never promote, reassign live aliases or operate the passkey flow. A pending/deferred release does not freeze ready independent development. Do not re-ask for it on every continuation. A later combined candidate needs its own exact-source CI/readiness and preserved supersession evidence; deployment alone closes no finding. Verify Owner-reported promotion read-only when it arrives.

Follow `docs/00-governance/ai-delegation-and-cost-policy.md` for current-client routing. The Owner-supplied OpenCode technical hierarchy is Claude Sonnet 5.5, GPT-6.1 Sol, then verified GPT-6.1 Terra; this is a project preference, with actual availability checked in that client. Auto classifies/selects models; helper spawning is not automatic. Suitable economical agents handle settled routine work. The single coordinator owns decisions, architecture, authority, sync, recovery, integration and evidence. Use scripts directly for mechanical work. Default to zero or one explicitly assigned helper, maximum two with documented independent ownership and benefit. Preserve the same acceptance criteria. Verify actual configured models and tools, and continue permitted work when Auto or a particular model is unavailable. Pay-as-you-go Signor routes require explicit Owner authorization. Keep manual account/fallback and authority-escalation limits. The removed personal emergency iCloud ChatGPT development account must never be reconnected or used automatically. Record actual models, checks, repairs and available usage in the batch receipt.

For CI, run `python3 scripts/verification/wait_for_candidate.py --commit "$candidate_sha" --run-id "$foundation_run_id"` once. Record its exact run attempt, verdict and failed step when present. Use one separate read-only Vercel check for the exact ready preview when required. Keep the Owner's promotion and subsequent signed-in staging proof separate.

Retain historical DeepSeek outputs and coordinator reviews in `docs/06-delivery/ai-work-items.csv`. A worker report or coordinator review is not Owner feature acceptance or closure of its parent finding. Use the current-client delegation policy for new assignments and the EX tracker for current priority. See `docs/00-governance/ai-delegation-and-cost-policy.md`.

"""
    lines = [
        f"## Current priority — {active['work_id']}: {active['scope']}", '',
        f"Delivery batch: **{batch_id} — {batch['outcome']}**.", '',
        'Product value for this batch:', '',
        *[f"- **{v}** — {value_catalog[v]['outcome']} ({value_catalog[v]['beneficiary']})." for v in value_ids], '',
        '### Ready development action', '', development, '',
        '### Separate release follow-up', '', release, '',
        f"Scoped dependency gate: {active['dependency_gate']}", '',
        f"Read current evidence: `{active['evidence']}`.", '',
        f"Batch includes: {batch['included_work']}", '',
        f"Batch exit evidence: {batch['exit_evidence']}", '',
        f"Policy boundary: {batch['policy_boundary']}", '',
        '## Actual delivery status for the current family', '',
    ]
    fields = [('design_status', 'Design'), ('implementation_status', 'Implementation'),
              ('local_status', 'Local checks'), ('deployment_status', 'Deployment'),
              ('hosted_status', 'Hosted verification'), ('owner_acceptance_status', 'Owner acceptance'),
              ('independent_security_status', 'Independent security')]
    lines.extend(f"- {label}: {active[key]}" for key, label in fields)
    lines += ['', '## Registered scoped worker work', '',
              'Source: `docs/06-delivery/ai-work-items.csv`; the EX tracker still owns the sole current priority. A ready handoff is not a running worker or an accepted implementation.', '']
    for item in work_items:
        if item['parent_work_id'] == active['work_id'] and item['delivery_batch'] == batch_id:
            lines.append(f"- **{item['task_id']}** ({item['status']}): {item['goal']}. Brief: `{item['brief']}`. Review: `{item['review_evidence']}`. Outputs stay within its recorded ownership; coordinator controls shared updates.")
    lines += ['', '## Coherent batch catalog', '']
    for item in batches:
        lines.append(f"- **{item['batch_id']} — {item['outcome']}**. Tracker family: {item['execution_work_id']}; dependencies: {item['depends_on_batches']}. Scope/exit/policy: `docs/06-delivery/master-plan-v2/delivery-batches.csv`.")
    lines += ['', '## Ordered primary checkpoint routing', '']
    lines.extend(f"{r['execution_order']}. **{r['work_id']} — {r['scope']}** ({r['execution_state']}; {r.get('delivery_batch', 'unmapped')})." for r in primary)
    lines += ['', 'Supporting packages accompany the affected outcome; they are not a second current queue:', '']
    lines.extend(f"- {r['work_id']} — {r['scope']}. Evidence: `{r['evidence']}`." for r in sorted((r for r in rows if r['execution_lane'] == 'supporting'), key=lambda r: int(r['execution_order'])))
    lines += ['', '## Maintain after each meaningful checkpoint', '',
              'Update exact source/results/limitations, capability and field adoption, affected canonical joins and the tracker statuses/development/release actions. Preserve historical approvals and failures. Run `python3 scripts/design/build_master_plan.py`, regenerate this prompt, and run master-plan/continuation/canonical/execution validators. Maintain factual captures/HTML under its freshness contract; inventory-only is permitted for unchanged product inputs. Do not repeat unaffected heavy suites.', '',
              'Keep design, implementation, local test, exact released source, hosted/installed/device verification, Owner acceptance and deferred external review separate. No automatic completion percentage. State a genuinely blocked decision precisely and continue independent authorized work. The current tracker retains the detailed historical evidence; this prompt intentionally avoids copying every old status narrative.', '']
    resume = [
        '## Resume after compaction, interruption or a failed request', '',
        f'Resume checkpoint: [{checkpoint}](../../{checkpoint}). The tracker still owns the single current priority.', '',
        'Reread the current Owner request, this checkpoint\'s required acceptance cases and the actual changed source/Git before acting. A summary cannot waive required acceptance cases. Correct conflicting completion claims before regenerating another handoff. Preserve verified checkpoints and existing edits; a missing harness leaves its required case open while independent permitted work continues.', '',
        'Keep verified results, unresolved cases, tested source fingerprints, actual model/helper execution and one next action in the existing checkpoint. A correct href, utility output, comment or aggregate pass count does not establish a real routed journey or component lifecycle. Retain the original affected keyboard control and meaningful regression negative controls. Structural checks verify routing and generated consistency only; the coordinator must inspect the behavioral assertions.', '',
        'Reuse passing evidence only while relevant inputs/environment remain applicable; repeat checks for changes, failure or a named unresolved concern. Diagnose generic provider errors using sanitized available metadata, without assuming context overflow or quota exhaustion. Preserve ordinary authorized Git work and the separate Owner-only promotion rule. This prompt changes no global compaction, provider or spending setting.', '',
        'Apply the [continuation and claim-evidence contract](master-plan-v2/delivery-and-verification.md#continuation-after-compaction-or-interruption).', '',
    ]
    return intro.replace('## Read in this order\n', '\n'.join(resume) + '## Read in this order\n', 1) + '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    with TRACKER.open(newline='') as stream:
        expected = render(list(csv.DictReader(stream)))
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != expected:
            raise SystemExit('FAIL: continuation prompt stale; run python3 scripts/design/build_continuation_prompt.py')
        print('PASS: continuation prompt matches the execution tracker')
    else:
        OUTPUT.write_text(expected)
        print(f'Updated {OUTPUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
