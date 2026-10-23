import re
s=open('dsg2_ui.js').read()
lines=s.split('\n'); chunks=[]; cur=[]
for l in lines:
    if re.match(r'^(function |var |DG\.|/\*)',l) and cur:
        chunks.append(cur); cur=[]
    cur.append(l)
chunks.append(cur)
drop=['dgBuild','dgSection','dgSecView','dgSvg','dgDeckBars','dgAll','dgGenView','dgPropView','dgSumView','dgU']
out=[]
for c in chunks:
    h=c[0]
    m=re.match(r'^function (\w+)\(',h)
    if m and m.group(1) in drop: continue
    if h.startswith('var DG={'): continue
    out.append('\n'.join(c))
s='\n'.join(out)
reps=[("st.textContent='Checks run for '+DG.lc.length+' load case(s) in '+((Date.now()-t0)/1000).toFixed(1)+' s.'; dgSecView(); dgAll();",
       "st.textContent='Checks run for '+DG.lc.length+' load case(s) in '+((Date.now()-t0)/1000).toFixed(1)+' s'+(DG.auto?' (auto-update on)':'')+'.'; DG.auto=true; dgAll();"),
      ("function dgRun(){","function dgRun(quiet){"),
      ("DGTAG={D:","DGTAG={U:'<span class=\"tg tU\">Input (user)</span>',D:"),
      ("if(!DG.deckBars.some(function(r){ return r.d>0&&r.s>0; }))","if(!(DG.sec&&DG.sec.dbars.some(function(r){ return r.d>0&&r.s>0; })))"),
]
for o,n in reps:
    assert s.count(o)==1,o; s=s.replace(o,n)
s=s.replace("DG.res=null; dgAll(); };","DG.res=null; dgAll(); dgAutoRun(); };").replace("DG.res=null; dgAll(); }","DG.res=null; dgAll(); dgAutoRun(); }")
s+='''
function dgU(u){ if(u===null||u===undefined||!isNaN(u)&&!isFinite(u)) return '<span class="bbflag">'+(u===Infinity?'&infin;':'—')+'</span>';
  var c=u>1?'ng':u>0.9?'warn':'ok'; return '<span class="dgub '+c+'"><i style="width:'+Math.max(0,Math.min(100,u*100))+'%"></i><b>'+anFmt(u,3)+'</b></span>'; }
function dgHeads(){ var gi=-1, gu=-1; if(DG.res) DG.res.lc.forEach(function(o,i){ var u=Math.max(Math.max(0,o.uS||0),o.uB||0,o.sh?o.sh.u:0); if(u>gu){ gu=u; gi=i; } });
  return DG.lc.map(function(l,i){ return (i===gi?'<span class="dggov" title="governing load case">&#9650; </span>':'')+'LC'+(i+1)+'<div class="dgsub">'+l.name.replace(/^LC\\d+\\s*/,'')+'</div>'; }); }
'''
s=re.sub(r'\nfunction dgHeads\(\)\{[^\n]*\n','\n',s,count=1)
open('dsg3_ui.js','w').write(open('dsg3_sec.js').read()+'\n'+s)
print([n for n in drop if ('function '+n+'(') not in open('dsg3_ui.js').read()])
