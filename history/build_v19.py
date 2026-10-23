import re
src=open('/home/claude/BR13A_grillage_dashboard_v15.html').read()
a=src.index('/* ===== AS 5100.5:2017 section engine'); b=src.index('\nfunction anMat(')
strip=lambda s:'\n'.join(l for l in s.split('\n') if 'module.exports' not in l)
code=strip(open('dsg_engine.js').read())+'\n'+strip(open('dsg_engine2.js').read())+'\n'+open('dsg5_ui.js').read()+'\n'+open('xlw.js').read()+'\n'+open('dsg_xl.js').read()+'\n'+open('dsg_rep.js').read()+'\n'
src=src[:a]+code+src[b:]
reps=[("R.push({t:'V',g:gi,s:s,ix:ix,x:x,sg:it.rev?1:-1}); }); });","R.push({t:'V',g:gi,s:s,ix:ix,x:x,sg:it.rev?1:-1}); R.push({t:'T',g:gi,s:s,ix:ix,x:x}); }); });"),
 ("case 'V': f=F[r.ix]; return -r.sg*f[2];","case 'V': f=F[r.ix]; return -r.sg*f[2];\n    case 'T': return -F[r.ix][3];"),
 ("case 'V': return r.sg*sc.Vz;","case 'V': return r.sg*sc.Vz;\n    case 'T': return sc.T;")]
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
css+=open('dg17.css').read()
o="window.HOG_API={snap:function(){"; assert src.count(o)==1
src=src.replace(o,"window.HOG_API={lib:function(){ var o={}; Object.keys(SEC).forEach(function(k){ if(SEC[k].t==='T') o[k]=JSON.parse(JSON.stringify(SEC[k])); }); return o; }, snap:function(){")
o3="function showTab(id){ACTIVE=id;const G=tabGroup(id);G.last=id;"; assert src.count(o3)==1
src=src.replace(o3,o3+"{const w=document.querySelector('.wrap');if(w)w.classList.toggle('nopanel',G.g!=='view');}")
css+='.wrap.nopanel{grid-template-columns:minmax(0,1fr)}.wrap.nopanel>#panel{display:none}.dgx1{font-weight:600}'
i=src.index('.dg2{'); src=src[:i]+css+src[i:]
open('/home/claude/BR13A_grillage_dashboard_v21.html','w').write(src)
print(len(src))
