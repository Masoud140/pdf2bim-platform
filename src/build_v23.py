import os, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.environ.get('OUT') or os.path.join(ROOT,'dist','BR13A_grillage_dashboard.html')
import re
src=open(os.path.join(ROOT,'base','BR13A_grillage_dashboard_v15.html')).read()
a=src.index('/* ===== AS 5100.5:2017 section engine'); b=src.index('\nfunction anMat(')
strip=lambda s:'\n'.join(l for l in s.split('\n') if 'module.exports' not in l)
code=strip(open('dsg_engine.js').read())+'\n'+strip(open('dsg_engine2.js').read())+'\n'+open('dsg5_ui.js').read()+'\n'+open('xlw.js').read()+'\n'+open('dsg_xl.js').read()+'\n'+open('dsg_rep.js').read()+'\n'+open('dsg_calc.js').read()+'\n'+open('dsg_docx.js').read()+'\n'+open('dsg6.js').read()+'\n'+open('dsg7.js').read()+'\n'+open('dsg8.js').read()+'\n'+open('dsg9.js').read()+'\n'+open('dsg10.js').read()+'\n'+open('dsg11.js').read()+'\n'+open('dsg12.js').read()+'\n'
src=src[:a]+code+src[b:]
reps=[("R.push({t:'V',g:gi,s:s,ix:ix,x:x,sg:it.rev?1:-1}); }); });","R.push({t:'V',g:gi,s:s,ix:ix,x:x,sg:it.rev?1:-1}); R.push({t:'T',g:gi,s:s,ix:ix,x:x}); }); });"),
 ("case 'V': f=F[r.ix]; return -r.sg*f[2];","case 'V': f=F[r.ix]; return -r.sg*f[2];\n    case 'T': return -F[r.ix][3];"),
 ("case 'V': return r.sg*sc.Vz;","case 'V': return r.sg*sc.Vz;\n    case 'T': return sc.T;")]
reps2=[]
reps2.append(('const kap=T.map(()=>new Array(N)),MS={},SX={};','const kap=T.map(()=>new Array(N)),MS={},SX={},PA={};'))
reps2.append(('   kap[k][n]=-ps;','   kap[k][n]=-ps;if(!k||p.times.includes(T[k])){const Pq=p.sy.map(()=>0);S.forEach((q,i)=>{if(!q.bar)Pq[q.i]=F[i]/1e3});(PA[k]=PA[k]||[])[n]=Pq}'))
reps2.append(('rl:{...relaxD(p,t),dR:0,dRc:Rc[k]},det:1});','rl:{...relaxD(p,t),dR:0,dRc:Rc[k]},det:1,Pall:PA[k],dsh:(cp&&t>=tcR)?{sd:shD[k],sg:shGa[k]-shGa[T.findIndex(z=>z>=tcR)],phd:p.fl.cr*creep(t-p.pour,{...pd,tau:tcR-p.pour}).v,chi:p.chi||0.8}:null});'))
for o,n in reps2:
    assert src.count(o)==1,o
    src=src.replace(o,n)
for o,n in reps:
    assert src.count(o)==1,o; src=src.replace(o,n)
css=""".dgx{overflow-x:auto;max-width:100%}.dgt th.l,.dgt td.l{text-align:left}.dgt td.v{white-space:nowrap;font-variant-numeric:tabular-nums}
.dgt td.fx{color:var(--muted);font-size:11px;min-width:180px;max-width:340px;line-height:1.35}.dgt td.sym{white-space:nowrap;font-weight:600}.dgt td.ref{color:var(--muted);font-size:11px;white-space:nowrap}
.dgt tr.dgh td{text-align:left;font-weight:700;font-size:11.5px;letter-spacing:.03em;text-transform:uppercase;color:var(--muted);padding-top:10px;border-bottom:1px solid var(--line)}
.dgt tr.dgi td.v{background:var(--instr-soft)}.dgt tr.dgu td{border-top:1px solid var(--line)}.dgt td.v input,.dgt td.v select{text-align:right}
.dgsub{font-weight:400;font-size:10.5px;color:var(--muted)}.dgg{color:var(--muted);font-size:10.5px}
.dgplot{width:100%;max-width:580px;height:auto;display:block;background:var(--bg);border:1px solid var(--line);border-radius:4px}.dgax{font-size:10px;fill:var(--muted)}.dgal{font-size:11.5px;fill:var(--fg)}.dglb{font-size:11px;fill:var(--fg);font-weight:600}
.dgleg{display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:var(--muted);margin:4px 0 0}.dgleg i{display:inline-block;width:20px;margin-right:5px;vertical-align:middle}.dgleg i.dot{width:9px;height:9px;border-radius:50%}
.dgban{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline;padding:9px 12px;border-radius:4px;margin-bottom:8px;border-left:4px solid}.dgban span{color:var(--muted)}
.dgban.ok{border-color:var(--eng);background:var(--instr-soft)}.dgban.ng{border-color:var(--flag)}.dgban.part{border-color:var(--calc)}.dgfl{margin:4px 0 0 18px;padding:0;font-size:11.5px;color:var(--flag)}
.dgstack{display:flex;flex-direction:column;gap:12px}
"""
css+=open('dg17.css').read()+open('dg23.css').read()
o="window.HOG_API={snap:function(){"; assert src.count(o)==1
src=src.replace(o,"window.HOG_API={lib:function(){ var o={}; Object.keys(SEC).forEach(function(k){ if(SEC[k].t==='T') o[k]=JSON.parse(JSON.stringify(SEC[k])); }); return o; }, snap:function(){")
o4="window.HOG_API={lib:function(){"; assert src.count(o4)==1
src=src.replace(o4,"window.HOG_API={addSec:function(k,s){ SEC[k]=s; var sel=document.getElementById('hog_sec'); if(sel&&![].some.call(sel.options,function(o){ return o.value===k; })){ var op=document.createElement('option'); op.value=k; op.textContent=k; sel.insertBefore(op,sel.firstChild); } if(cur===k){ var q=secProps(k); document.getElementById('hog_A').value=q.A.toFixed(0); document.getElementById('hog_yb').value=q.yb.toFixed(1); document.getElementById('hog_I').value=q.I.toExponential(4); document.getElementById('hog_H').value=q.H; document.getElementById('hog_ue').value=q.ue.toFixed(0); drawSec(); } }, pick:function(k,like){ var sel=document.getElementById('hog_sec'); if(sel) sel.value=k; pickSec(k); if(like&&SEC[like]){ S=grid(like); layFromS(); B=barDefault(like); barFromB(); drawSec(); } }, cur:function(){ return cur; }, lib:function(){")
o3="function showTab(id){ACTIVE=id;const G=tabGroup(id);G.last=id;"; assert src.count(o3)==1
src=src.replace(o3,o3+"{const w=document.querySelector('.wrap');if(w)w.classList.toggle('nopanel',G.g!=='view');}")
css+='.wrap.nopanel{grid-template-columns:minmax(0,1fr)}.wrap.nopanel>#panel{display:none}.dgx1{font-weight:600}'
i=src.index('.dg2{'); src=src[:i]+css+src[i:]
lib=open(os.path.join(ROOT,'vendor','docx.iife.js')).read(); assert '</script' not in lib.lower() and lib.count('"<!--"')==1; lib=lib.replace('"<!--"','"<\\x21--"').replace('<!--','< !--'); assert '<!--' not in lib
i=src.index('</head>'); src=src[:i]+'<script>/* docx 9.7.1 (MIT) */\n'+lib+'\n</script>\n'+src[i:]
# ---- v37: point springs (*SPRING, LINEAR) in the frame solver and the staged analysis ----
sr=[("    var sw=data('*SELFWEIGHT'); if(sw.length){ var v=nums(sw[0]); M.gravity=[v[0],v[1],v[2]]; }\n    return M;",
     "    M.springs=[];\n    data('*SPRING').forEach(function(l){ var p=l.split(',').map(function(x){return x.trim();}); if(p.length<8) return;\n      if(p[1].toUpperCase()!=='LINEAR'){ M.warn.push('spring '+p[0]+' type '+p[1]+' ignored'); return; }\n      var g=''; for(var q=p.length-1;q>7;q--){ if(p[q]&&isNaN(+p[q])&&p[q]!=='NO'&&p[q]!=='YES'){ g=p[q]; break; } }\n      M.springs.push({nodes:expandList(p[0]),k:[+p[2],+p[3],+p[4],+p[5],+p[6],+p[7]],group:g}); });\n    var sw=data('*SELFWEIGHT'); if(sw.length){ var v=nums(sw[0]); M.gravity=[v[0],v[1],v[2]]; }\n    return M;"),
    ("    return {M:M,ids:ids,idx:idx,ndof:ndof,nf:nf,fixed:fixed,freeMap:freeMap,els:els};",
     "    /* point springs to ground, global axes (kN/m, kN·m/rad) */\n    var spr=[]; (M.springs||[]).forEach(function(sp){ sp.nodes.forEach(function(n){ if(idx[n]===undefined) return; for(var k=0;k<6;k++) if(sp.k[k]>0) spr.push({n:n,k6:k,dof:6*idx[n]+k,k:sp.k[k],group:sp.group}); }); });\n    return {M:M,ids:ids,idx:idx,ndof:ndof,nf:nf,fixed:fixed,freeMap:freeMap,els:els,spr:spr};"),
    ("        for(var b=0;b<12;b++){ var cb=P.freeMap[e.dof[b]]; if(cb<0) continue; K[ra*nf+cb]+=e.Kg[a][b]; } }\n    });\n    return K;",
     "        for(var b=0;b<12;b++){ var cb=P.freeMap[e.dof[b]]; if(cb<0) continue; K[ra*nf+cb]+=e.Kg[a][b]; } }\n    });\n    (P.spr||[]).forEach(function(s){ var r=P.freeMap[s.dof]; if(r>=0) K[r*nf+r]+=s.k; });\n    return K;"),
    ("      return fl;\n    });\n    return {U:U,R:R,ef:ef};\n  }\n  /* internal forces at x along element",
     "      return fl;\n    });\n    var spf=(P.spr||[]).map(function(s){ return {n:s.n,k6:s.k6,f:s.k*U[s.dof],group:s.group}; });   /* force each spring exerts on the ground (= reaction, opposite sign on the structure) */\n    return {U:U,R:R,ef:ef,spr:spf};\n  }\n  /* internal forces at x along element"),
    ("    var Ms={nodes:M0.nodes,els:els,mats:M0.mats,secs:Object.assign({},secs,wetSecs),cons:cons,gravity:M0.gravity,warn:[],links:links};",
     "    var Ms={nodes:M0.nodes,els:els,mats:M0.mats,secs:Object.assign({},secs,wetSecs),cons:cons,gravity:M0.gravity,warn:[],links:links,springs:active.sub?(M0.springs||[]):[]};"),
    ("+'Deflection is cubic between nodes from the nodal displacements and rotations. Toes are fixed and there are no soil springs yet. '",
     "+'Deflection is cubic between nodes from the nodal displacements and rotations. Soil / rock springs and the toe support are set in Boundary &rarr; Bearings and supports. '"),
    ("ANS.src='embedded BR13A_grillage.mct (frozen copy)';","ANS.src='integrated model — frozen BR13A MCT + bearings and ground from Boundary → Bearings and supports';")]
for o,n in sr:
    assert src.count(o)==1,('spring',o[:70],src.count(o)); src=src.replace(o,n)
# ---- v34: Hog strand drawing — extra strand locations, one colour per debond length ----
hr=[("function grid(k){if(SEC[k].tf)return[];if(TFR[k]){const o=[];TFR[k].concat([[SEC[k].H-80,[495]]]).forEach(([y,xs])=>xs.forEach(x=>[-x,x].forEach(X=>o.push({x:X,y,on:true,d:0,d2:0}))));return o}",
 "/* v34: extra strand locations added at the engineer's request (not on TfNSW B0203 Sheet B) — created OFF; click to switch on */\nconst XLOC={'1825 Super-T':[[60,[175,275]],[110,[275]],[160,[275]]]};\nfunction grid(k){if(SEC[k].tf)return[];if(TFR[k]){const o=[];TFR[k].concat([[SEC[k].H-80,[495]]]).forEach(([y,xs])=>xs.forEach(x=>[-x,x].forEach(X=>o.push({x:X,y,on:true,d:0,d2:0}))));(XLOC[k]||[]).forEach(([y,xs])=>xs.forEach(x=>[-x,x].forEach(X=>{if(!o.some(t=>t.y===y&&t.x===X))o.push({x:X,y,on:false,d:0,d2:0,xl:1})})));o.sort((a,b)=>a.y-b.y||a.x-b.x);return o}"),
 ("function drawSec(){const k=cur,s=SEC[k];",
  "/* v34: one colour per debond length (left / right pair), shared with the design drawings */\nconst DBPAL=['#e08a1e','#d6336c','#8b5cf6','#0f9d8a','#a16207','#ec4899','#65a30d','#9f1239','#0891b2','#7c2d12'];\nfunction dbKeys(){const m={};S.forEach(t=>{if(t.on&&(t.d||t.d2)){const k=(t.d||0)+'|'+(t.d2||0);m[k]=(m[k]||0)+1}});return Object.keys(m).sort((a,b)=>{const p=a.split('|').map(Number),q=b.split('|').map(Number);return Math.max(...p)-Math.max(...q)||p[0]-q[0]||p[1]-q[1]}).map(k=>({k,n:m[k],d:+k.split('|')[0],d2:+k.split('|')[1]}))}\nfunction dbCol(d,d2){const ks=dbKeys(),i=ks.findIndex(q=>q.d===(d||0)&&q.d2===(d2||0));return i<0?'var(--or)':DBPAL[i%DBPAL.length]}\nwindow.HOG_DBCOL=dbCol;window.HOG_DBKEYS=dbKeys;\nfunction drawSec(){const k=cur,s=SEC[k];"),
 ("fill=\"${t.on?((t.d||t.d2)?'var(--or)':'var(--ac)'):'var(--bg)'}\"","fill=\"${t.on?((t.d||t.d2)?dbCol(t.d,t.d2):'var(--ac)'):'var(--bg)'}\""),
 ("`Blue = bonded, orange = debonded, hollow = off, green squares = reinforcing bars. ","`Blue = bonded, coloured = debonded (one colour per debond length, key below), hollow = available location switched off, green squares = reinforcing bars. "),
 ("':''}`;drawLong()}","':''}`;{let e=document.getElementById('hog_dbleg');if(!e){e=document.createElement('div');e.id='hog_dbleg';e.className='ref';const si=document.getElementById('hog_sinfo');si.parentNode.insertBefore(e,si.nextSibling)}const ks=dbKeys();e.innerHTML=ks.length?'<b>Debond lengths</b> (left / right from each end): '+ks.map((q,i)=>`<span style=\"display:inline-flex;align-items:center;gap:4px;margin:2px 10px 2px 0\"><i style=\"display:inline-block;width:11px;height:11px;border-radius:50%;background:${DBPAL[i%DBPAL.length]};border:1px solid var(--fg)\"></i>${q.n} strand${q.n>1?'s':''}: ${(q.d/1000).toFixed(2)} m / ${(q.d2/1000).toFixed(2)} m</span>`).join(''):'No debonded strands.'}drawLong()}"),
 ("stroke=\"var(--or)\" stroke-width=\"4\"/><text x=\"${X(a1)+3}\" y=\"${y-3}\" font-size=\"9\" fill=\"var(--or)\">","stroke=\"${dbCol(q.d,q.d2)}\" stroke-width=\"4\"/><text x=\"${X(a1)+3}\" y=\"${y-3}\" font-size=\"9\" fill=\"${dbCol(q.d,q.d2)}\">"),
 ("stroke=\"var(--or)\" stroke-width=\"4\"/><text x=\"${X(L-a2)-3}\" y=\"${y-3}\" font-size=\"9\" fill=\"var(--or)\" text-anchor=\"end\">","stroke=\"${dbCol(q.d,q.d2)}\" stroke-width=\"4\"/><text x=\"${X(L-a2)-3}\" y=\"${y-3}\" font-size=\"9\" fill=\"${dbCol(q.d,q.d2)}\" text-anchor=\"end\">"),
 ("– blue bonded, orange debonded</text>","– blue bonded, coloured debonded (colours as in the section)</text>")]
for o,n in hr:
    assert src.count(o)==1,('hog',o[:60],src.count(o)); src=src.replace(o,n)
i0=src.index('/* === Hog Calculator scoped styles === */'); j0=src.index('#hog_warn{color:var(--ng)}',i0)+len('#hog_warn{color:var(--ng)}')
hx=src[i0:j0].replace('/* === Hog Calculator scoped styles === */','/* v33: Hog editor styles for the moved strand / bar editors */').replace('input,#hog-root select','.hogx input,.hogx select').replace('#hog-root #hog-root','.hogx').replace('#hog-root','.hogx').replace('label small','.hogx label small')
hx+='\n.hogx{background:transparent;padding:0}.srfwrap{padding:16px;max-width:1500px}.srfhead h2{margin:0 0 4px}.srfgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:12px;margin-top:10px;align-items:start}.srfgrid>.card{min-width:0}.srfstack{display:flex;flex-direction:column;gap:12px;min-width:0}.srfwide{grid-column:1/-1}.srfdef{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 12px;position:sticky;top:env(safe-area-inset-top,0px);z-index:3;background:var(--bg);padding:6px 0;border-bottom:1px solid var(--line)}.srfdl{font-weight:600;margin-right:6px}.srfdb{font:inherit;font-size:13px;padding:6px 12px;border:1px solid var(--line);border-radius:6px;background:var(--panel,transparent);color:var(--fg);cursor:pointer}.srfdb.on{background:var(--instr,#0e7c86);border-color:var(--instr,#0e7c86);color:#fff}#srf_st{margin-left:auto}.srfp>.card{margin-bottom:12px}@media(max-width:900px){.srfgrid{grid-template-columns:minmax(0,1fr)}}.sbsoil{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:14px;margin-top:8px}.sbab{min-width:0;overflow-x:auto}.sbsvg{width:100%;max-width:440px;height:auto;display:block;margin-top:8px;color:var(--fg)}.sbsw{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:middle}.sbx{padding:0 7px}.wdas{font-size:12px;line-height:1.45;margin-top:2px}.wdt td.l{max-width:640px}.srfgrid h3{margin:0 0 6px}\n'
k=src.index('</head>'); src=src[:k]+'<style>'+hx+'</style>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('srf.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('sub.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('sub2.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('sub3.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('sub4.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('sub5.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('sub6.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('sub7.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('srf2.js').read()+'\n</script>\n'+src[k:]
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+open('gdef.js').read()+'\n</script>\n'+src[k:]
assert src.count('rulesUI();regUI();draw();')==1
src=src.replace('rulesUI();regUI();draw();','window.CBX={R:R,genAll:genAll,opt:opt,caseList:caseList};R.forEach(r=>{if(r.id===\'SOo\'||r.id===\'SCR\')r.on=1;});rulesUI();regUI();draw();')
open(OUT,'w').write(src)
print(len(src))
