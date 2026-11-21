from pathlib import Path
import csv
root=Path(__file__).resolve().parents[3]; out=Path(__file__).resolve().parents[1]
def write(name,fields,rows):
 with (out/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
findings=[
('V00','P1','P;I','Reference workspace structure underrepresented by first review prototype','workspace-shell.tsx','Exact reference foundation: navigation / center / contextual inspector; mirrored RTL; connected phone detail','AC21'),
('V01','P1','I','Unknown write disguised as ordinary refresh','people-workspace.tsx;onboarding-workspace.tsx','Check original operation separate from read-only Refresh view','AC01;AC02;AC03'),
('V02','P1','I','Return handlers clear reviews or restart candidate review','guardian-workspace.tsx;trainer-workspace.tsx;people-workspace.tsx','Coalesce lifecycle reads; preserve input; invalidate changed approval visibly','AC04;AC05;AC06'),
('V03','P1','P;I','Mobile context is displaced; restricted academy field not projected','workspace-shell.tsx;guardian-workspace.tsx;trainer-workspace.tsx','Visible role/branch; academy projection requires explicit review','AC07;AC08'),
('V04','P1','P','Checkbox and error classes lack shared treatment','guardian-workspace.tsx;trainer-workspace.tsx;../app/globals.css','Native labelled check row; consistent visible error and focus','AC09;AC10'),
('V05','P2','P','Neutral confirmation hierarchy and misleading Back labels','guardian-workspace.tsx;trainer-workspace.tsx','Single blue task action; Edit appointment/reason; compact summary','AC11'),
('V06','P2','P','Stale setup and potentially ambiguous contact copy','onboarding-workspace.tsx;people-workspace.tsx','Acknowledge implemented Trainer path; contact does not grant access','AC12'),
('V07','P2','I','Chooser Continue setup does not know readiness','onboarding-workspace.tsx','Open academy to existing route; no inferred routing','AC13'),
('V08','P1','I','Confirmed result must remain distinct from failed follow-up read','guardian-workspace.tsx;trainer-workspace.tsx;people-workspace.tsx','Preserve receipt; retry current read; never repeat confirmed write','AC14'),
('V09','P2','P;I','Competing refresh controls and selection continuity','guardian-workspace.tsx;trainer-workspace.tsx;admission-directory.tsx','Quiet scoped read; deliberate inspect; preserve focus within authority','AC15;AC16'),
('V10','P2','P;I','Device-local expiry lacks visible time zone','guardian-workspace.tsx;trainer-workspace.tsx','Localized existing timestamp with UTC; academy zone policy separate','AC17'),
('V11','P2','I','Authentication/loading shells and dirty transitions differ','people-workspace.tsx;guardian-workspace.tsx;trainer-workspace.tsx','Stable public shell; no private cache; retain context and operation guards','AC18;AC19'),
('V12','P1','P;F','Earlier matrix snapshots lag later slice receipts','onboarding-workspace.tsx','Dated evidence overlay; separately reconcile canonical registers','AC20')]
rows=[]
for id,p,kind,before,source,after,ac in findings:
 paths=['apps/web/src/components/'+s for s in source.split(';')]
 if id=='V00':paths=['design/experience-prototype-v1/reference/AcademyOS_MacOS_Reference_Matched.html','design/implemented-journeys-review-2026-10-25/reference-foundation-contract.md']
 if id=='V12':paths=['docs/06-delivery/app-implementation-action-matrix.csv','docs/06-delivery/app-implementation-screen-matrix.csv','docs/07-handoff/people-verification-closure-board.md']
 rows.append(dict(finding_id=id,priority=p,category=kind,before=before,source_evidence=';'.join(paths),evidence_layer='Repository source and existing receipts; prototype proposal separate',recommendation=after,acceptance_cases=ac,status='Proposed; Owner review pending'))
write('findings.csv',list(rows[0]),rows)
cases=[
('AC21','V00','All implemented journeys','Desktop selection; RTL; phone details/context; unknown operation','Reference-based three-part desktop frame, compact table/toolbar and inspector actions; directory remains beside selected details; RTL mirrors; phone Back restores selection/focus; unknown blocks replacement and closing; no imitation macOS controls, invented fields or feature tabs','normal;loading;failed;denied;unknown;changed'),
('AC01','V01','All writes','Unknown operation after response loss','Only Check original operation recovers the same identity; no generic refresh alias, duplicate submission or success before confirmation','unknown'),
('AC02','V01','M1 original operation','Original M1 lookup missing or found','Retain implemented lookup and same-operation retry; no replacement invitation generation by normal reread','unknown'),
('AC03','V01','I2a/b/c original operation','Missing receipt at domain reconciliation','Explicit reconciliation may fence/cancel; new operation allowed only after authoritative cancellation; receipt ACL unchanged','unknown;cancelled'),
('AC04','V02','Owner draft','Return to tab with edited fields','Input and intended context retained; current authority revalidated; no silent clear, selection change or autosubmit','returned'),
('AC05','V02','Review/candidates','Candidate revision or appointment version changes','Keep intent; invalidate old confirmation; require complete fresh scoped review; all pages before different-person save','changed'),
('AC06','V02','Clean read view','Focus plus visibility and late response','One coalesced lifecycle read; generation guards ignore old actor/context response; no background focus theft','loading;normal'),
('AC07','V03','Every role','EN/AR desktop and phone','Role and available branch/academy context visible without overflow; restricted academy-name addition not shipped without approved projection','normal'),
('AC08','V03','Responsive layout','320/360/390px phone; 1024/1440px desktop; 200% zoom','No horizontal task overflow; wraps action groups; blue baseline; no imitation macOS window controls','normal'),
('AC09','V04','Checkbox review','Keyboard Tab/Space and phone target','Native labelled checkbox toggles and announces; label target at least44px; visual box18-22px; visible focus','normal'),
('AC10','V04','Errors','Loading then failed/denied; invalid field','Readable error text and alert; field labels; actionable retry; denied private data removed; color not sole signal','loading;failed;denied'),
('AC11','V05','Confirmation','Owner appoint/end/revoke and recipient accept','One clear primary action; exact person/scope/reason; delivery is not acceptance; edits go to named destination; no invented undo','normal;pending'),
('AC12','V06','Setup/player copy','Open completed setup and existing player profile','Trainer appointment link acknowledged; stored contact never described as invitation/consent/relationship authority','normal'),
('AC13','V07','Workspace chooser','Select existing Owner membership','Open academy reaches existing saved setup route; no guessed readiness, new membership or default branch','normal'),
('AC14','V08','Post-commit recovery','Confirmed receipt followed by failed read','Receipt remains confirmed; current projection unavailable/cleared; Retry current read never repeats write; denial shows no private projection','readback;denied'),
('AC15','V09','Inspection/list','Inspect then Back; page changes externally','I1 loaded-projection inspection no extra reads; phone Back restores appropriate row focus; paginated results never imply global totals','normal;empty'),
('AC16','V09','Guardian/Trainer exact scope','Recipient accept; Owner revoke/end; next read','Minimal name/branch or own name/Trainer/branch only; exact ended access denied next read; other roles/history preserved; no restore','normal;pending;denied'),
('AC17','V10','Invitation state','Two device zones and EN/AR','Same timestamp with explicit displayed zone; I2b/c72h unchanged; email/reference strings bidi-isolated; wrong/unverified/expired/revoked have distinct recovery','wrong;unverified;expired;revoked;delivery;provider'),
('AC18','V11','Public auth shell','Sign-in pending/failure or actor/context switch','Stable nonprivate frame; clear prior private state; no owner identity/contact leak; recover original invitation via accepted handoff contract','loading;failed;wrong'),
('AC19','V11','Navigation','Switch locale mid draft/review; unknown op; keyboard Back','Locale preserves in-memory intent; unknown/dirty guards remain; deliberate view change focuses heading and Back restores control; screen-reader/device checks separate','returned;unknown'),
('AC20','V12','Documentation','Latest receipts versus earlier register snapshots','Source/local/hosted/deploy/Owner scope separate; exact receipt joins; no broad requirement or future feature completion inferred','not-applicable')]
rows=[dict(acceptance_id=a,finding_ids=f,affected_scope=sc,trigger=tr,expected=e,prototype_states=st,design_status='Proposed; Owner review pending',implementation_verification='Required if dependent behavior changes; existing receipts not replaced') for a,f,sc,tr,e,st in cases]
write('acceptance.csv',list(rows[0]),rows)
canonical={r['work_item_id']:r for r in csv.DictReader((root/'docs/06-delivery/app-implementation-action-matrix.csv').open())}
groups=[
('M1-I1','IMP-J02-A01','admissions;admission;admit;admit-review','docs/07-handoff/m1-admission-presentation.md','V03;V04;V05;V09','Existing bounded admission and I1 presentation; design refinement pending'),
('M1-invitation-management','IMP-J03-A03','revoke-review;reissue-review','docs/07-handoff/onboarding-m1-verification.md','V01;V05;V08;V10','Existing M1 generation/delivery/original-operation boundary'),
('M1-Owner-acceptance','IMP-J03-A01','owner-invitation','docs/07-handoff/onboarding-m1-verification.md','V01;V02;V11','Intended verified recipient; accepted invitation only'),
('M1-workspace','IMP-J01-A01','workspaces','docs/07-handoff/onboarding-m1-verification.md','V03;V07;V11','Existing membership selection; no readiness inference'),
('M1-setup','IMP-J04-A01','setup;setup-branch;setup-sport;setup-review;ready','docs/07-handoff/compact-blue-design-foundation.md','V02;V03;V06','Initial branch/sport narrow setup; prior approvals scoped'),
('I2a-registration','IMP-J06-A01','players;register;duplicates;player-review;player','docs/07-handoff/i2a-registration-implementation.md','V01;V02;V06;V08;V09;V11','Working narrow registration wording/usability accepted25Oct; broader gates open'),
('I2b-guardian','IMP-J07-A01','guardian-appointments;guardian-draft;guardian-review;guardian-invitation;guardian-view;guardian-end;guardian-end-review;guardian-revoke-review;guardian-ended','docs/07-handoff/i2b-guardian-implementation.md','V01;V02;V03;V04;V05;V08;V09;V10;V11','Working narrow Guardian wording/usability accepted25Oct; broader relationship policy/gates open'),
('I2c-trainer','IMP-J05-A01','trainers;trainer-draft;trainer-review;trainer-invitation;trainer-view;trainer-end;trainer-end-review;trainer-revoke-review;trainer-ended','docs/07-handoff/i2c-trainer-implementation.md','V01;V02;V03;V04;V05;V08;V09;V10;V11','Working narrow Trainer wording/usability accepted25Oct; broad staff/transfer/dated training excluded')]
rows=[]
for sl,key,route,receipt,findings,status in groups:
 c=canonical[key]
 rows.append(dict(slice=sl,canonical_work_item=key,journey_action_ids=c['journey_action_ids'],canonical_screen_families=c['screen_ids'],requirement_ids=c['requirement_ids'],canonical_acceptance_ids=c['acceptance_case_ids'],loading_ids=c['loading_contract_ids'],security_ids=c['security_packet_ids'],prototype_routes=route,finding_ids='V00;'+findings,current_evidence=receipt,scope_note=status+'; canonical joins are broader than this slice',design_approval='Pending Owner review',trust_boundaries='Actor/current membership; academy/branch/resource; exact recipient; operation receipt; delivery provider',overlay_as_of='2026-10-25'))
# I2c exact narrow joins from accepted contract override broad combined row; transfer remains excluded.
rows[-1].update(journey_action_ids='J08-A01 proposed narrow subdivision; J03/J05 invitation/authority',canonical_screen_families='S20; S21; minimal own-Trainer profile (no broad S67 completion)',requirement_ids='AO-002;AO-003;AO-004;AO-005;AO-006;AO-007;AO-008;AO-009;AO-016;AO-019',canonical_acceptance_ids='Corresponding scoped AT cases; broad transfer AO-017/AT-017 explicitly excluded',loading_ids='L03;L05',security_ids='SEC-J03;SEC-J05;SEC-J08')
write('journey-overlay.csv',list(rows[0]),rows)
print('Wrote 13 findings, 21 acceptance cases, 8 scoped journey overlays')
