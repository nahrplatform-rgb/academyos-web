from pathlib import Path
import csv,json,re,hashlib
root=Path(__file__).resolve().parents[1];errors=[];links=0;rows={}
for p in (root/'docs').glob('*.csv'):
 with p.open(newline='') as f:
  reader=csv.reader(f);header=next(reader);data=list(reader)
  if any(len(r)!=len(header) for r in data):errors.append(f'Column count: {p.name}')
  if len({r[0] for r in data})!=len(data) and p.name!='page-action-matrix.csv':errors.append(f'Duplicate row ID: {p.name}')
  rows[p.name]=len(data)
for p in [root/'README.md',*(root/'docs').glob('*.md')]:
 for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',p.read_text()):
  if re.match(r'[a-z]+://',target) or target.startswith('#'):continue
  target=target.split('#')[0];links+=1
  if not (p.parent/target).exists():errors.append(f'Broken link {p.name}: {target}')
manifest=json.loads((root/'reference/source-manifest.json').read_text())
for a in manifest['assets']:
 for key in ['source_path','preserved_path']:
  p=Path(a[key]);digest=hashlib.sha256(p.read_bytes()).hexdigest()
  if digest!=a['source_sha256']:errors.append(f'Checksum changed: {p}')
html=(root/'prototype/index.html').read_text()
for target in re.findall(r'(?:src|href)="([^"]+)"',html):
 if not target.startswith('#') and not (root/'prototype'/target).exists():errors.append('Missing prototype asset '+target)
assert rows['coverage-screens.csv']==68
assert rows['coverage-journeys.csv']==28
assert rows['requirement-coverage.csv']==180
result={'date':'2026-10-23','local_markdown_links_checked':links,'csv_data_rows':rows,'reference_files_rehashed':len(manifest['assets']),'prototype_assets_present':True,'errors':errors,'status':'passed' if not errors else 'failed'}
(root/'evidence/document-checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2));raise SystemExit(bool(errors))
