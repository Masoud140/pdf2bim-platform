SRC='/home/claude/BR13A_grillage_dashboard_v10.html'; DST='/home/claude/BR13A_grillage_dashboard_v11.html'
h=open(SRC,encoding='utf-8').read()
def rep(a,b):
    global h
    assert h.count(a)==1,(h.count(a),a[:80]); h=h.replace(a,b,1)
rep("{id:'pr',label:'Pile results',pane:'panePR',build:()=>prBuild(),draw:()=>prDraw()}",
    "{id:'pr',label:'Pile results',pane:'panePR',build:()=>prBuild(),draw:()=>prDraw()},\n{id:'tr',label:'Traffic (AS 5100.2)',pane:'paneTR',build:()=>trBuild(),draw:()=>{}}")
rep('<div id="panePR" style="display:none"></div>','<div id="panePR" style="display:none"></div>\n<div id="paneTR" style="display:none"></div>')
rep("ANS.res={P:P,S:AN.solveStatic(P,fac),modes:[]};","ANS.res={P:P,S:AN.solveStatic(P,fac),modes:[],fac:fac};")
rep("  if($('panePR') && $('panePR').dataset.built) prRender();",
    "  if($('panePR') && $('panePR').dataset.built) prRender();\n  if(ANS.after){ var fa=ANS.after; ANS.after=null; setTimeout(fa,0); }")
rep(".catch(function(e){ if($('pr_stat'))", ".catch(function(e){ ANS.after=null; if($('tr_stat')) $('tr_stat').textContent='Analysis stopped: '+e.message; if($('pr_stat'))")
rep(".anpgrid{", ".tg{font-weight:600;white-space:nowrap}.tD{color:var(--eng)}.tC{color:var(--calc)}.tS{color:var(--std)}\n.anpgrid{")
js=open('/tmp/claude-0/-home-claude/26ed6757-087c-514d-944a-fb75ed869c40/scratchpad/traffic.js').read()
rep("function anMat(A,d){", js+"\nfunction anMat(A,d){")
open(DST,'w',encoding='utf-8').write(h); print('ok',len(h))
