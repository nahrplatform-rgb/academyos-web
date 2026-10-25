from pathlib import Path
import csv,re,json,hashlib,subprocess
base=Path(__file__).resolve().parents[1];root=base.parents[1]
errors=[];counts={}
for p in base.glob('*.csv'):
 with p.open(newline='') as f:
  reader=csv.DictReader(f); rows=list(reader);counts[p.name]=len(rows)
  for n,row in enumerate(rows,2):
   if None in row or any(v is None for v in row.values()):errors.append(f'{p.name}:{n}: malformed CSV')
for p in base.rglob('*.md'):
 for ref in re.findall(r'\[[^\]]*\]\(([^)]+)\)',p.read_text()):
  ref=ref.split('#')[0]
  if not ref or '://' in ref:continue
  if not (p.parent/ref).exists():errors.append(f'{p.relative_to(base)} missing link: {ref}')
findings={r['finding_id'] for r in csv.DictReader((base/'findings.csv').open())};acs={r['acceptance_id'] for r in csv.DictReader((base/'acceptance.csv').open())}
for r in csv.DictReader((base/'findings.csv').open()):
 for a in r['acceptance_cases'].split(';'):
  if a not in acs:errors.append('Unknown acceptance '+a)
 for p in r['source_evidence'].split(';'):
  if not(root/p).exists():errors.append('Missing source '+p)
for r in csv.DictReader((base/'acceptance.csv').open()):
 if r['finding_ids'] not in findings:errors.append('Unknown finding '+r['finding_ids'])
src=(base/'prototype/review.tsx').read_text()
routeblock=src.split('const routes=')[1].split(' as const;')[0]
routes=re.findall("'([^']+)'",routeblock)
overlay=list(csv.DictReader((base/'journey-overlay.csv').open()))
covered={r for row in overlay for r in row['prototype_routes'].split(';')}
if set(routes)!=covered:errors.append('Prototype/overlay route mismatch '+str(set(routes)^covered))
for p in ['review.tsx','link.tsx']:
 s=(base/'prototype'/p).read_text()
 if re.search(r'\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage)\b',s):errors.append('Unexpected network/storage API in '+p)
html=(base/'prototype/index.html').read_text()
if "connect-src 'none'" not in html:errors.append('Network-blocking CSP missing')
before=json.loads((base/'evidence/working-tree-before.json').read_text());changed=[]
for p,sha in before['files'].items():
 path=root/p
 if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest()!=sha:changed.append(p)
prefix_path=base/'evidence/reference-correction-doc-prefixes.json'
allowed=json.loads(prefix_path.read_text()) if prefix_path.exists() else {}
append_only=[]
for p in changed:
 if p in allowed:
  data=(root/p).read_bytes();meta=allowed[p]
  if hashlib.sha256(data[:meta['bytes']]).hexdigest()==meta['sha256'] and b'## Owner correction' in data[meta['bytes']:]:
   append_only.append(p);continue
 errors.append('Unexpected pre-existing change: '+p)
result={'csv_rows':counts,'prototype_routes':len(routes),'existing_files_verified_unchanged':len(before['files'])-len(changed),'authorized_append_only_design_docs':append_only,'pre_existing_changed_files':changed,'source_head_before':before['head'],'source_head_after':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'errors':errors,'scope':'Artifact/static validation only; not functional, security, hosted or Owner acceptance'}
(base/'evidence/static-checks.json').write_text(json.dumps(result,indent=2)+'\n')
(base/'evidence/component-provenance.json').write_text(json.dumps({p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['apps/web/src/components/workspace-shell.tsx','apps/web/src/components/ui/controls.tsx','apps/web/src/components/admission-directory.tsx','apps/web/src/components/timezone-select.tsx','apps/web/src/app/globals.css']},indent=2)+'\n')
print(json.dumps(result,indent=2));raise SystemExit(bool(errors))
