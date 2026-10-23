#!/usr/bin/env python3
"""v9 -> v10: pile results get their own tab that runs the analysis on open."""
SRC = '/home/claude/BR13A_grillage_dashboard_v9.html'
DST = '/home/claude/BR13A_grillage_dashboard_v10.html'
h = open(SRC, encoding='utf-8').read()

def rep(a, b):
    global h
    assert h.count(a) == 1, ('anchor count', h.count(a), a[:80])
    h = h.replace(a, b, 1)

# tab + pane
rep("{id:'an',label:'Analysis',pane:'paneAn',build:()=>anBuild(),draw:()=>anDraw()}",
    "{id:'an',label:'Analysis',pane:'paneAn',build:()=>anBuild(),draw:()=>anDraw()},\n{id:'pr',label:'Pile results',pane:'panePR',build:()=>prBuild(),draw:()=>prDraw()}")
rep('<div id="paneAn" style="display:none"></div>',
    '<div id="paneAn" style="display:none"></div>\n<div id="panePR" style="display:none"></div>')

# Analysis tab: replace the pile card with a pointer (avoids duplicate ids); keep ANS.piles for the CSV
a = h.index("  if(ANS.piles.length){\n    var abs=[];")
b = h.index("  /* element inspector */", a)
h = h[:a] + """  if(ANS.piles.length){
    h+='<div class="card"><div class="sdh">4b. Piles and columns</div><div class="msbar"><span>Deflection, bending, shear and axial force for the '+ANS.piles.length+' piles are on their own tab.</span>'
      +'<button class="b" id="an_topr">Open Pile results</button></div></div>';
  }
""" + h[b:]
rep("  if(ANS.piles.length){ $('an_pab').onchange=anPileCharts; $('an_pdir').onchange=anPileCharts; }\n  anCharts(); anElem(); if(ANS.piles.length) anPileCharts();",
    "  if(ANS.piles.length) $('an_topr').onclick=function(){ showTab('pr'); };\n  anCharts(); anElem();\n  if($('panePR') && $('panePR').dataset.built) prRender();")

# failure path also reaches the pile tab
rep(".catch(function(e){ $('an_run').disabled=false; st.textContent='';",
    ".catch(function(e){ if($('pr_stat')) $('pr_stat').textContent='Analysis stopped: '+e.message; $('an_run').disabled=false; st.textContent='';")

PR_JS = r"""
/* ===== Pile results tab: runs the frozen MCT (the model with the substructure) and shows the pile diagrams ===== */
function prBuild(){
  var pane=$('panePR'); if(pane.dataset.built) return; pane.dataset.built=1;
  pane.innerHTML='<div class="card"><div class="sdh">Pile results: deflection, bending moment, shear and axial force (self weight)</div>'
    +'<div class="msbar"><label>Abutment <select id="an_pab"></select></label>'
    +'<label>Direction <select id="an_pdir"><option value="l">Longitudinal (normal to the sill)</option><option value="t">Transverse (along the sill)</option><option value="r">Resultant</option></select></label>'
    +'<button class="b" id="pr_run">Re-run analysis</button><span id="pr_stat" class="n"></span></div>'
    +'<div class="n" id="pr_src" style="margin-top:2px"></div>'
    +'<div id="an_pch" class="anpgrid"></div><div id="an_ppk"></div>'
    +'<div class="bbnote">Each pile is drawn from the sill soffit (column top) to the toe, against RL. The dashed line at RL B is where the column extension meets the pile (1 m segments below it). '
    +'<b>Longitudinal</b> = horizontal, normal to the sill line, + toward the span; <b>transverse</b> = along the sill, + toward the north end. '
    +'Bending moment is the moment about the axis normal to that direction (longitudinal bending = moment about the sill axis). Axial force is compression +. '
    +'Deflection is cubic between nodes from the nodal displacements and rotations. Toes are fixed and there are no soil springs yet. '
    +'Self-weight rules, shear deformation and the element-by-element detail are on the Analysis tab.</div></div>';
  $('an_pab').onchange=anPileCharts; $('an_pdir').onchange=anPileCharts;
  $('pr_run').onclick=function(){ prRun(true); };
}
function prRun(force){
  anBuild();                                               // the Analysis tab owns the solver inputs
  if(ANS.mode==='live'){ ANS.mode='mct'; ANS.stale=true; }  // live mesh is deck-only: piles need the frozen MCT
  if(!force && ANS.res && !ANS.stale && ANS.piles && ANS.piles.length){ prRender(); return; }
  $('pr_stat').textContent='Running the self-weight analysis…'; $('an_pch').innerHTML=''; $('an_ppk').innerHTML='';
  anRun();
}
function prDraw(){ prRun(false); }
function prRender(){
  if(!ANS.res) return;
  ANS.piles=anPileChains();
  $('pr_src').textContent='Model: '+ANS.src+(ANS.res.secs?' · solved in '+ANS.res.secs.toFixed(1)+' s':'');
  if(!ANS.piles.length){
    $('pr_stat').textContent=''; $('an_pch').innerHTML='<div class="bbnote bbflag">This model has no pile elements. The live dashboard mesh is deck-only; choose the frozen .mct on the Analysis tab.</div>'; $('an_ppk').innerHTML=''; return;
  }
  var abs=[]; ANS.piles.forEach(function(p){ if(abs.indexOf(p.abut)<0) abs.push(p.abut); });
  var cur=$('an_pab').value;
  $('an_pab').innerHTML=abs.map(function(a){ return '<option value="'+a+'">Abutment '+a+'</option>'; }).join('');
  if(abs.indexOf(cur)>=0) $('an_pab').value=cur;
  $('pr_stat').textContent='';
  anPileCharts();
}
"""
rep("function anMat(A,d){", PR_JS + "function anMat(A,d){")

open(DST, 'w', encoding='utf-8').write(h)
print('written', DST, len(h))
