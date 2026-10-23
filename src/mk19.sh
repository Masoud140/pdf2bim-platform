python3 mk17.py >/dev/null && python3 - <<'PY'
import re
base=open('dsg3_ui.js').read(); over=open('dsg4.js').read()
names=set(re.findall(r'^function (\w+)\(',over,re.M))
lines=base.split('\n'); chunks=[]; cur=[]
for l in lines:
    if re.match(r'^(function |var |DG\.|/\*)',l) and cur: chunks.append(cur); cur=[]
    cur.append(l)
chunks.append(cur); out=[]
for c in chunks:
    m=re.match(r'^function (\w+)\(',c[0])
    if m and m.group(1) in names: continue
    if c[0].startswith('DG.lc=['): continue
    out.append('\n'.join(c))
open('dsg5_ui.js','w').write('\n'.join(out)+'\n'+over)
PY
python3 build_v23.py
