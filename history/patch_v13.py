SRC='/home/claude/BR13A_grillage_dashboard_v11.html'; DST='/home/claude/BR13A_grillage_dashboard_v13.html'
D='/tmp/claude-0/-home-claude/26ed6757-087c-514d-944a-fb75ed869c40/scratchpad/'
h=open(SRC,encoding='utf-8').read()
def rep(a,b):
    global h
    assert h.count(a)==1,(h.count(a),a[:80]); h=h.replace(a,b,1)
rep("{id:'tr',label:'Traffic (AS 5100.2)',pane:'paneTR',build:()=>trBuild(),draw:()=>{}}",
    "{id:'tr',label:'Traffic (AS 5100.2)',pane:'paneTR',build:()=>trBuild(),draw:()=>{}},\n{id:'ld',label:'Loads (SDL, wind)',pane:'paneLD',build:()=>ldBuild(),draw:()=>{}},\n{id:'cs',label:'Construction stages',pane:'paneCS',build:()=>csBuild(),draw:()=>{}},\n{id:'bd',label:'Bearings and supports',pane:'paneBD',build:()=>bdBuild(),draw:()=>{}}")
rep('<div id="paneTR" style="display:none"></div>','<div id="paneTR" style="display:none"></div>\n<div id="paneLD" style="display:none"></div>\n<div id="paneCS" style="display:none"></div>\n<div id="paneBD" style="display:none"></div>')
js=open(D+'cs.js').read()+open(D+'ct.js').read()+open(D+'bd.js').read()
rep("function anMat(A,d){", js+"\nfunction anMat(A,d){")
# ---- grouped tab bar ----
rep("function showTab(id){ACTIVE=id;TABS.forEach(t=>{$(t.pane).style.display=t.id===id?'':'none';$('tb_'+t.id).setAttribute('aria-selected',t.id===id);});",
    "const TAB_GROUPS=[{g:'view',label:'View',ids:['v3d','mesh','h','v','abA','abB','dk','pl','nr']},{g:'bnd',label:'Boundary',ids:['bd']},{g:'stage',label:'Construction stage',ids:['cs']},\n {g:'prop',label:'Properties',ids:['mat','sec','props']},{g:'load',label:'Loads',ids:['cb','ld','tr']},{g:'an',label:'Analysis',ids:['an','hog','pr','stf']},{g:'des',label:'Design',ids:['bb']}];\n"
    "function tabGroup(id){return TAB_GROUPS.find(g=>g.ids.includes(id))||TAB_GROUPS[0];}\n"
    "function showTab(id){ACTIVE=id;const G=tabGroup(id);G.last=id;TAB_GROUPS.forEach(g=>{const b=$('tg_'+g.g);if(b)b.setAttribute('aria-selected',g===G);});\n TABS.forEach(t=>{$(t.pane).style.display=t.id===id?'':'none';const b=$('tb_'+t.id);b.setAttribute('aria-selected',t.id===id);b.style.display=G.ids.includes(t.id)?'':'none';});")
rep("function initTabs(){$('tabbar').innerHTML=TABS.map(t=>`<button class=\"tab\" id=\"tb_${t.id}\" role=\"tab\" aria-selected=\"${t.id==='mesh'}\">${t.label}</button>`).join('');\n TABS.forEach(t=>{$('tb_'+t.id).onclick=()=>showTab(t.id);});}",
    "function initTabs(){const ord=TAB_GROUPS.flatMap(g=>g.ids).map(id=>TABS.find(t=>t.id===id)).filter(Boolean).concat(TABS.filter(t=>!TAB_GROUPS.some(g=>g.ids.includes(t.id))));\n"
    " $('tabbar').innerHTML=TAB_GROUPS.map(g=>`<button class=\"tab tgrp\" id=\"tg_${g.g}\" role=\"tab\" aria-selected=\"${g.g==='view'}\">${g.label}</button>`).join('');\n"
    " $('subbar').innerHTML=ord.map(t=>`<button class=\"tab tsub\" id=\"tb_${t.id}\" role=\"tab\" aria-selected=\"${t.id==='mesh'}\"${tabGroup(t.id).g==='view'?'':' style=\"display:none\"'}>${t.label}</button>`).join('');\n"
    " TABS.forEach(t=>{$('tb_'+t.id).onclick=()=>showTab(t.id);});\n"
    " TAB_GROUPS.forEach(g=>{$('tg_'+g.g).onclick=()=>{const cur=g.ids.includes(ACTIVE)?ACTIVE:(g.last&&g.ids.includes(g.last)?g.last:g.ids[0]);showTab(cur);};});}")
rep('<div class="tabs" id="tabbar" role="tablist"></div>','<div class="tabs" id="tabbar" role="tablist"></div>\n<div class="tabs subtabs" id="subbar" role="tablist"></div>')
rep(".tab[aria-selected=true]{color:var(--fg);border-bottom-color:var(--instr)}",
    ".tab[aria-selected=true]{color:var(--fg);border-bottom-color:var(--instr)}\n#tabbar{margin-bottom:0}.tgrp{font-weight:600;font-size:13.5px;padding:9px 16px 8px}\n.subtabs{margin-top:0;background:var(--panel);border:1px solid var(--line);border-top:0;padding:0 6px}.tsub{font-size:12.5px;padding:7px 11px 6px}")
open(DST,'w',encoding='utf-8').write(h); print('ok',len(h))
