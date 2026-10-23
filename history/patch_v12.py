SRC='/home/claude/BR13A_grillage_dashboard_v11.html'; DST='/home/claude/BR13A_grillage_dashboard_v12.html'
h=open(SRC,encoding='utf-8').read()
def rep(a,b):
    global h
    assert h.count(a)==1,(h.count(a),a[:80]); h=h.replace(a,b,1)
rep("{id:'tr',label:'Traffic (AS 5100.2)',pane:'paneTR',build:()=>trBuild(),draw:()=>{}}",
    "{id:'tr',label:'Traffic (AS 5100.2)',pane:'paneTR',build:()=>trBuild(),draw:()=>{}},\n{id:'ld',label:'Loads (SDL, wind)',pane:'paneLD',build:()=>ldBuild(),draw:()=>{}},\n{id:'cs',label:'Construction stages',pane:'paneCS',build:()=>csBuild(),draw:()=>{}}")
rep('<div id="paneTR" style="display:none"></div>','<div id="paneTR" style="display:none"></div>\n<div id="paneLD" style="display:none"></div>\n<div id="paneCS" style="display:none"></div>')
js=open('/tmp/claude-0/-home-claude/26ed6757-087c-514d-944a-fb75ed869c40/scratchpad/cs.js').read()
rep("function anMat(A,d){", js+"\nfunction anMat(A,d){")
open(DST,'w',encoding='utf-8').write(h); print('ok',len(h))
