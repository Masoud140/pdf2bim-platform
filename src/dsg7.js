/* ===== v26: limit state as its own "Analyse for" entry, AS 5100.2 combinations, steel-stress check, M–N and V–M at the point ===== */
DG.an.type='sls'; DG.an.res='all'; DG.an.comb='b';
DG_AN_TYPES=[['sec','Section properties'],['tr','Transfer'],['ere','Beam erection / lifting',1],['cs','Construction stages',1],['sls','Serviceability limit state (in service, composite)'],['uls','Ultimate limit state (in service, composite)'],['dt','Differential temperature primary stress',1],['shc','Shrinkage / creep primary',1]];
function dgAnLS(){ return {sec:'—',tr:'Transfer',sls:'SLS',uls:'ULS'}[DG.an.type]||'—'; }
function dgAnResList(){ var a=DG.an;
  if(a.type==='sec') return [['Ic','Second moment of area — composite'],['Ig','Second moment of area — Super-T'],['Ac','Area — composite'],['yc','Centroid depth below deck top']];
  if(a.type==='tr') return [['all','Fibre stresses — top and soffit'],['top','Super-T top fibre'],['bot','Super-T soffit']];
  if(a.type==='sls') return [['all','Fibre stresses — all'],['dtop','Fibre stress — deck top'],['gtop','Fibre stress — Super-T top'],['gbot','Fibre stress — Super-T soffit'],['stl','Steel stress increment — bars and strands (Table 8.6.2.1)'],['crk','Crack control — M_{s}* vs M_{s,allow}']];
  return [['bend','Bending — M* vs φM_{u}'],['shear','Shear — V* vs φV_{u}'],['tors','Torsion — T* vs φT_{us}'],['util','Utilisations']]; }
function dgAnKind(){ var a=DG.an; if(a.type==='sec') return 'sec'; if(a.type==='tr') return 'transfer'; if(a.type==='sls') return (a.res==='crk'||a.res==='stl')?'crack':'sls'; return a.res==='bend'?'uls':'shear'; }

/* ---------- combinations available to the girder design (factors read from the Combos register) ---------- */
/* (b): permanent effects (adverse / beneficial) + road traffic; (a): permanent effects only. SLS uses the register's SLS factors, with and without traffic. */
function dgCombA(lc){ var q=JSON.parse(JSON.stringify(lc)); q.brk.a.TRF={M:0,V:0,T:0,src:'not in combination (a)',mM:lc.brk.a.TRF.mM};
  dgTotals(q); q.gam.TRF={M:0,V:0,T:0,s:0}; q.name=lc.name; q.comb='a'; return q; }
function dgCombList(){ var g=function(id,c){ var v=dgFac(id,c); return v===null?'—':v; }, ls=DG.an.type;
  if(ls==='uls') return [['b','ULS (b) — permanent '+g('DLc',4)+'/'+g('DLc',5)+' DL, '+g('SDLp',4)+'/'+g('SDLp',5)+' SDL, '+g('SCR',4)+'/'+g('SCR',5)+' creep & shrinkage + '+g('M1600',4)+' M1600 / S1600'],['a','ULS (a) — permanent effects only, same factors, no traffic']];
  if(ls==='sls') return [['b','SLS — permanent effects + '+g('M1600',6)+' M1600 / S1600'],['a','SLS — permanent effects only']];
  return null; }
var DG_CB_STY={b:{dash:null,wd:2,suf:' — (b) permanent + traffic'},a:{dash:'7 3',wd:1.4,suf:' — (a) permanent only'}};
function dgCombsOn(){ var c=DG.an.comb; return c==='env'?['b','a']:[c]; }
function dgCB(r,k){ return r.cb&&r.cb[k]?r.cb[k]:(k==='b'?{lc:r.lc,o:r.o}:null); }

/* ---------- controls ---------- */
function dgAnCtl(P){
  var a=DG.an, box=$('dg_ctl'); if(!box) return;
  var rl=dgAnResList(); if(!rl.some(function(q){ return q[0]===a.res; })) a.res=rl[0][0];
  var cl=dgCombList(); if(cl&&!cl.some(function(q){ return q[0]===a.comb; })) a.comb='b';
  var cur=P.findIndex(function(p){ return p.key===a.poi; }); if(cur<0){ cur=P.findIndex(function(p){ return /Midspan/.test(p.lab); }); if(cur<0) cur=0; a.poi=P[cur]?P[cur].key:null; }
  var p=P[cur];
  var h='<label>Analyse for <select id="dg_aty">'+dgAnOpt(DG_AN_TYPES,a.type)+'</select></label>';
  if(a.type!=='sec') h+='<span class="dgls">Limit state <b>'+dgAnLS()+'</b></span>';
  if(cl) h+='<label>Combination <select id="dg_acb">'+dgAnOpt(cl,a.comb)+'</select></label>';
  h+='<label>Result <select id="dg_ars">'+dgAnOpt(rl,a.res)+'</select></label>';
  h+='<label class="v3dchk"><input type="checkbox" id="dg_asy"'+(a.sym?' checked':'')+'> Symmetrical beam</label>';
  h+='<span class="dgpoist"><span>Point of interest</span><button class="b" id="dg_ap">&#9664;</button><select id="dg_apl">'+P.map(function(q){ return '<option value="'+q.key+'"'+(q.key===a.poi?' selected':'')+'>'+q.n+' · '+q.x.toFixed(3)+' m · '+q.lab+'</option>'; }).join('')+'</select><button class="b" id="dg_an">&#9654;</button></span>';
  box.innerHTML=h;
  var re=function(){ dgAnView(); };
  $('dg_aty').onchange=function(){ a.type=this.value; re(); };
  if($('dg_acb')) $('dg_acb').onchange=function(){ a.comb=this.value; re(); };
  $('dg_ars').onchange=function(){ a.res=this.value; re(); };
  $('dg_asy').onchange=function(){ a.sym=this.checked; re(); };
  $('dg_apl').onchange=function(){ a.poi=this.value; re(); };
  $('dg_ap').onclick=function(){ if(cur>0){ a.poi=P[cur-1].key; re(); } };
  $('dg_an').onclick=function(){ if(cur<P.length-1){ a.poi=P[cur+1].key; re(); } };
  return p;
}

/* ---------- series along the girder ---------- */
function dgAnSeries(){
  var a=DG.an, D=DG.gird, G=D.G, S=D.st.filter(function(r){ return !a.sym||r.x<=G.Lg/2+1e-6; }), nan=NaN, CB=dgCombsOn();
  var fin=function(v){ return v===null||v===undefined||!isFinite(v)?nan:v; };
  var ser=function(lab,c,f,o){ return Object.assign({lab:lab,c:c,p:S.map(function(r){ var v; try{ v=f(r); }catch(e){ v=nan; } return [r.x,fin(v)]; })},o||{}); };
  /* one line per combination shown: (b) solid, (a) dashed */
  var cser=function(lab,c,f,o){ return CB.map(function(k){ var st=DG_CB_STY[k]; return Object.assign({lab:lab+(CB.length>1?st.suf:''),c:c,dash:(o&&o.dash)||st.dash,wd:(o&&o.wd)||st.wd,p:S.map(function(r){ var q=dgCB(r,k), v; try{ v=q?f(q.lc,q.o,r):nan; }catch(e){ v=nan; } return [r.x,fin(v)]; })},o&&o.extra||{}); }); };
  var add=function(arr){ out.ser=out.ser.concat(arr); };
  var hl=function(lab,v,o){ return Object.assign({lab:lab,c:'var(--flag)',dash:'6 4',wd:1.2,p:[[S[0].x,v],[S[S.length-1].x,v]]},o||{}); };
  var lim=DG.trLim, out={yl:'',ser:[],note:''}, fct=DG.res&&DG.res.base?DG.res.base.fct25:null;
  if(a.type==='sec'){ var m={Ic:['I composite (m⁴)',function(r){ return r.B.ec.I/1e12; }],Ig:['I Super-T (m⁴)',function(r){ return r.B.eg.I/1e12; }],Ac:['Area composite (m²)',function(r){ return r.B.ec.A/1e6; }],yc:['Centroid below deck top (mm)',function(r){ return r.B.ec.yc; }]}[a.res];
    out.yl=m[0]; out.ser.push(ser(m[0],'var(--instr)',m[1])); if(a.res==='yc') out.ser.push(ser('Super-T centroid','var(--calc)',function(r){ return r.B.eg.yc; })); out.flip=a.res==='yc'; return out; }
  if(a.type==='tr'){ out.yl='Stress at transfer (MPa, compression −)';
    if(a.res!=='bot') out.ser.push(ser('Super-T top','var(--instr)',function(r){ return r.tr.top; }));
    if(a.res!=='top') out.ser.push(ser('Super-T soffit','var(--calc)',function(r){ return r.tr.bot; }));
    if(lim.c>0) out.ser.push(hl('Permissible compression '+dgLimTxt('tc')+' (Cl 8.1.4.2)',-lim.c,{val:true})); if(lim.t!==null&&lim.t!=='') out.ser.push(hl('Permissible tension '+dgLimTxt('tt')+' (Cl 8.6.2(a)(i))',+lim.t,{dash:'2 3',val:true}));
    return out; }
  if(a.type==='sls'){
    if(a.res==='crk'){ out.yl='Composite SLS moment (kN·m)'; add(cser('M_{s}*','var(--instr)',function(lc){ return lc.Ms; })); add(cser('M_{s,allow}','var(--flag)',function(lc,o){ return o.Mal>0?o.Mal:NaN; },{wd:1.2,extra:{}})); return out; }
    if(a.res==='stl'){ var l0=DG.lc[0]; out.yl='Stress increment above decompression (MPa)';
      add(cser('Δσ_{s} bars','var(--calc)',function(lc,o){ return o.inc&&o.inc.b>-1e8?o.inc.b:0; })); add(cser('Δσ_{p} strands','var(--instr)',function(lc,o){ return o.inc&&o.inc.t>-1e8?o.inc.t:0; }));
      out.ser.push(hl('f_{scr} = '+l0.fscr+' MPa (Table 8.6.2.1)',+l0.fscr,{val:true})); if(+l0.ftcr!==+l0.fscr) out.ser.push(hl('f_{tcr} = '+l0.ftcr+' MPa (Table 8.6.2.1)',+l0.ftcr,{val:true,dash:'2 3'}));
      out.note='Zero where the section stays uncracked at M_{s}* (σ_{b} ≤ 0.25√f\'_{c}); the increment is measured from decompression on the cracked section (Cl 8.6.2).'; return out; }
    out.yl='Service stress (MPa, compression −)';
    if(a.res==='all'||a.res==='dtop') add(cser('Deck top','var(--std)',function(lc,o){ return o.sv.deckTop; }));
    if(a.res==='all'||a.res==='gtop') add(cser('Super-T top','var(--instr)',function(lc,o){ return o.sv.girTop; }));
    if(a.res==='all'||a.res==='gbot') add(cser('Super-T soffit','var(--calc)',function(lc,o){ return o.sv.girBot; }));
    if(fct&&(a.res==='all'||a.res==='gbot')) out.ser.push(hl('Permissible tension 0.25√f\'_{c} (Cl 8.6.2 uncracked)',fct,{dash:'2 3',val:true}));
    var sl=DG.svLim, Q=DG.sec; if(sl.kc>0){ if(a.res!=='dtop') out.ser.push(hl('Permissible compression, Super-T '+sl.kc+'f\'_{c} = '+anFmt(sl.kc*Q.fcg,1)+' MPa',-sl.kc*Q.fcg,{val:true})); if(a.res==='all'||a.res==='dtop') out.ser.push(hl('Permissible compression, deck '+sl.kc+'f\'_{c} = '+anFmt(sl.kc*Q.fcd,1)+' MPa',-sl.kc*Q.fcd,{val:true,dash:'8 3 2 3'})); }
    return out; }
  if(a.res==='bend'){ out.yl='Moment (kN·m, sagging +)'; add(cser('Design moment M*','var(--eng)',function(lc){ return lc.Mu; }));
    out.ser.push(ser('Permissible moment φM_{u} (positive)','var(--instr)',function(r){ return r.phMs; },{wd:1.6}));
    out.ser.push(ser('Permissible moment φM_{u} (negative)','var(--instr)',function(r){ return r.phMh?-Math.abs(r.phMh):NaN; },{dash:'2 3',wd:1.6}));
    if(!dgGirdPar().Ld) out.note='Development length L_{d} is not entered, so φM_{u} near the ends is reduced only by the transmission length, not by development (Beam inputs → Debonding & girder).'; return out; }
  if(a.res==='shear'){ out.yl='Shear (kN)'; add(cser('Design shear V*','var(--eng)',function(lc){ return lc.Vu; }));
    add(cser('φ(V_{uc} + V_{us})','var(--instr)',function(lc,o){ return 0.7*(o.sh.Vuc+o.sh.Vus)/1e3; },{wd:1.6})); add(cser('φV_{u.max} web crushing','var(--flag)',function(lc,o){ return 0.7*o.sh.Vumax/1e3; },{wd:1.2}));
    if(!S.some(function(r){ return r.o&&r.o.sh; })) out.note='Shear capacity not calculated — shear and torsion detailing missing (Beam inputs → Set parameters for → Shear & torsion detailing).'; return out; }
  if(a.res==='tors'){ out.yl='Torsion (kN·m)'; add(cser('Design torsion T*','var(--eng)',function(lc){ return lc.Tu; })); add(cser('φT_{us}','var(--instr)',function(lc,o){ return 0.7*o.sh.Tus/1e6; },{wd:1.6})); return out; }
  out.yl='Utilisation';
  add(cser('M*/φM_{u}','var(--instr)',function(lc,o){ return o.uB; })); add(cser('Shear','var(--calc)',function(lc,o){ return o.sh.uV; })); add(cser('Web crushing','var(--eng)',function(lc,o){ return o.sh.uCr; }));
  add(cser('Torsion','var(--muted)',function(lc,o){ return o.sh.uT; })); add(cser('Longitudinal steel','var(--fg)',function(lc,o){ return o.sh.uL; })); out.ser.push(hl('1.0',1)); return out;
}

/* ---------- governing values ---------- */
function dgAnSum(){
  var D=DG.gird, box=$('dg_ansum'); if(!box) return; if(!D){ box.innerHTML=''; return; }
  var S=D.st, lim=DG.trLim, fct=DG.res&&DG.res.base?DG.res.base.fct25:null, l0=DG.lc[0];
  var mx=function(f){ var m=null, x=null, kk=null; S.forEach(function(r){ Object.keys(r.cb||{b:1}).forEach(function(k){ var q=dgCB(r,k); if(!q) return; var u; try{ u=f(q.lc,q.o,r); }catch(e){ u=null; } if(u!==null&&u!==undefined&&isFinite(u)&&(m===null||u>m)){ m=u; x=r.x; kk=k; } }); }); return {u:m,x:x,k:kk}; };
  var it=[['tr','Transfer','all',lim.c>0&&lim.t!==null?mx(function(lc,o,r){ return Math.max(-r.tr.top/lim.c,-r.tr.bot/lim.c,lim.t>0?r.tr.top/lim.t:0,lim.t>0?r.tr.bot/lim.t:0); }):{u:null,why:'limits missing'}],
    ['sls','SLS soffit tension','gbot',fct?mx(function(lc,o){ return Math.max(0,o.sv.girBot)/fct; }):{u:null}],
    ['sls','SLS compression','all',DG.svLim.kc>0?mx(function(lc,o){ var Q=DG.sec; return Math.max(-Math.min(o.sv.girTop,o.sv.girBot)/(DG.svLim.kc*Q.fcg),-o.sv.deckTop/(DG.svLim.kc*Q.fcd)); }):{u:null,why:'no limit set'}],
    ['sls','Steel stress','stl',mx(function(lc,o){ return Math.max(o.inc&&o.inc.b>-1e8?o.inc.b/l0.fscr:0,o.inc&&o.inc.t>-1e8?o.inc.t/l0.ftcr:0); })],
    ['uls','Bending','bend',mx(function(lc,o){ return o.uB; })],['uls','Shear','shear',mx(function(lc,o){ return Math.max(o.sh.uV,o.sh.uCr); })],['uls','Torsion','tors',mx(function(lc,o){ return o.sh.uT; })],['uls','Longitudinal steel','util',mx(function(lc,o){ return o.sh.uL; })]];
  box.innerHTML='<span class="dgsumh">Governing along the girder</span>'+it.map(function(q,k){ var u=q[3].u, cls=u===null?'mi':u>1?'ng':u>0.9?'wa':'ok';
    return '<button class="dgsc '+cls+'" data-k="'+k+'" title="Show this result"><span>'+q[1]+'</span><b>'+(u===null?(q[3].why||'not available'):anFmt(u,2))+'</b>'+(u!==null?'<i>at '+anFmt(q[3].x,2)+' m'+(q[0]!=='tr'&&q[3].k?' · ('+q[3].k+')':'')+'</i>':'')+'</button>'; }).join('');
  [].forEach.call(box.querySelectorAll('.dgsc'),function(b){ b.onclick=function(){ var q=it[+b.getAttribute('data-k')]; DG.an.type=q[0]; DG.an.res=q[2];
    if(q[3].x!==null&&q[3].x!==undefined){ var P=dgPOIs(), best=null; P.forEach(function(p){ if(!best||Math.abs(p.x-q[3].x)<Math.abs(best.x-q[3].x)) best=p; }); if(best) DG.an.poi=best.key; } dgAnView(); }; });
}

/* ---------- point evaluation: both combinations ---------- */
function dgPOIEval(p){
  if(!DG.res) return null;
  var C=DG.poiCache&&DG.poiCache.ver===DG.ver?DG.poiCache:(DG.poiCache={ver:DG.ver,m:{}}); if(C.m[p.key]) return C.m[p.key];
  var r;
  if(p.kind==='lc'){ var o=DG.res.lc[p.i], lc=DG.lc[p.i]; if(!o.tr) o.tr=dgTransfer(o,lc); r={o:o,lc:lc,cb:{b:{lc:lc,o:o}},user:true}; }
  else { var G=dgGirdPar(), sol=dgSolidAt(p.x,G), Xb=sol?DG.res.Xs:DG.res.X, X=dgStationX(Xb,p.x,G), B=dgBase(X), lc0=DG.lc[0];
    var lc={name:'POI '+p.n+' — '+p.lab,s:p.x,fscr:lc0.fscr,ftcr:lc0.ftcr,Ns:0,Nu:0,brk:dgActAt(DG.gi,p.x)}; dgTotals(lc);
    var o2=null, cb={}; try{ if(X.S.tend.length){ cb=dgCombBuild(lc,X,B,sol); var tr0=dgTrAt(Xb,p.x,G); Object.keys(cb).forEach(function(k){ cb[k].o.tr=tr0; cb[k].lc.name=lc.name; }); o2=cb.b.o; lc=cb.b.lc; } }catch(e){ o2=null; }
    r={o:o2,lc:lc,cb:cb,why:X.S.tend.length?null:'no strand is bonded at this point'}; }
  C.m[p.key]=r; return r;
}
/* the combination shown in the detail panel: the selected one, or the governing one for the current result */
function dgPOICombo(e){ var a=DG.an, ks=Object.keys(e.cb||{}); if(!ks.length) return {k:'b',q:{lc:e.lc,o:e.o}};
  if(a.comb!=='env'&&e.cb[a.comb]) return {k:a.comb,q:e.cb[a.comb]};
  var kind=dgAnKind(), u=function(q){ var o=q.o; try{ if(kind==='uls') return o.uB; if(kind==='shear') return o.sh?o.sh.u:0; if(kind==='crack') return Math.max(0,o.uS); return Math.max(o.sv.girBot,-o.sv.girTop/2); }catch(er){ return 0; } };
  var best=ks.reduce(function(b,k){ return u(e.cb[k])>u(e.cb[b])?k:b; },ks[0]); return {k:best,q:e.cb[best],gov:ks.length>1}; }

/* ---------- M–N and V–M diagrams at the point ---------- */
function dgNMDiag(o,lc,tag){ var top=DSG2.nm(o.Su,'top',o.yc), bot=DSG2.nm(o.Su,'bot',o.yc), map=function(c,f){ return c.pts.map(function(p){ return [f?p.phi*p.M:p.M, -(f?p.phi*p.N:p.N)]; }); };
  return dgCap('M–N interaction (composite section) — '+lc.name,dgPlot({w:520,h:340,xl:'M (kN·m, sagging +)',yl:'N (kN, compression +)',series:[{p:map(top,0),c:'var(--muted)',dash:'5 3',wd:1.2,lab:'nominal M<tspan baseline-shift="sub">u</tspan>, N<tspan baseline-shift="sub">u</tspan>'},{p:map(bot,0),c:'var(--muted)',dash:'5 3',wd:1.2},{p:map(top,1),c:'var(--instr)',lab:'&phi;M<tspan baseline-shift="sub">u</tspan>, &phi;N<tspan baseline-shift="sub">u</tspan>'},{p:map(bot,1),c:'var(--instr)'}],
    pts:[{x:lc.Mu,y:-lc.Nu,lab:tag||'M*',c:'var(--flag)'}]}),'Strain compatibility sweeping the neutral axis from each face; &phi; from Table 2.3.2. The point is (M*, N*) for this combination; inside the solid curve is adequate.'); }
function dgVMDiag(o,lc,tag){ if(!o.sh) return ''; var Mx=(o.Muo||o.Mu||1)*1.05, cv=DSG2.vm(o.Q,{T:lc.Tu,N:lc.Nu},Mx), cv0=DSG2.vm(o.Q,{T:0,N:lc.Nu},Mx);
  return dgCap('V–M interaction — '+lc.name,dgPlot({w:520,h:320,xl:'M* (kN·m)',yl:'V* (kN)',series:[{p:cv.map(function(q){ return [q.M,q.V]; }),c:'var(--instr)',lab:'&phi;V<tspan baseline-shift="sub">u</tspan>(M) at T* = '+dgF(lc.Tu,0)+' kN·m'},{p:cv0.map(function(q){ return [q.M,q.V]; }),c:'var(--muted)',dash:'5 3',wd:1.2,lab:'T* = 0'}],
    pts:[{x:lc.Mu,y:lc.Vu,lab:tag||'(M*, V*)',c:'var(--flag)'}]}),'For each moment, the shear that brings web crushing, shear (V<sub>uc</sub> + V<sub>us</sub>) or longitudinal tension (Cl 8.2.7) to 1.0, with this combination&rsquo;s T* and N* held. Inside the curve is adequate.'); }

/* ---------- detail panel ---------- */
function dgAnPOI(p){
  var box=$('dg_poi'); if(!box) return; if(!p){ box.innerHTML=''; return; }
  var e=dgPOIEval(p), a=DG.an, kind=dgAnKind();
  if(!e||!e.o){ box.innerHTML='<div class="dgpoih"><b>Point of interest '+p.n+'</b><span>'+dgMk(p.lab)+'</span></div><div class="dgpoib"><p class="bbflag">Not calculated: '+((e&&e.why)||'run the checks first')+'.</p></div>'; return; }
  var svc=a.type==='sls'||a.type==='uls', pc=svc?dgPOICombo(e):{k:'b',q:{lc:e.lc,o:e.o}}, o=pc.q.o, lc=pc.q.lc, cl=dgCombList(), cn=svc&&cl?(cl.filter(function(q){ return q[0]===pc.k; })[0]||[0,''])[1]:'';
  var head='<div class="dgpoih"><b>Point of interest '+p.n+'</b><span>'+dgMk(p.lab)+'</span><span>x = '+anFmt(p.x,3)+' m from the left end</span><span>'+(o.solid?'solid end-block section':'open section')+'</span>'
    +(svc?'<span class="dgcomb">'+(e.user?'your load case — actions as entered on the Load cases page':'Combination: <b>'+dgMk(cn)+'</b>'+(pc.gov?' (governs here)':''))+'</span>':'')+'</div>';
  var diag='';
  try{ if(kind==='transfer') diag=dgTrPlot(o,lc); else if(kind==='sls') diag=dgSLSDiag(o,lc); else if(kind==='crack') diag=dgCrackDiag(o,lc)+dgMKDiag(o,lc); else if(kind==='uls') diag=dgULSDiag(o,lc)+dgNMDiag(o,lc,'POI '+p.n); else if(kind==='shear') diag=dgVMDiag(o,lc,'POI '+p.n); else if(kind==='rst') diag=dgCrkXDiag(o,lc); }catch(er){ diag='<p class="bbflag">Diagram not available: '+er.message+'</p>'; }
  var lines; try{ lines=dgCalcLinesX(kind,o,lc); }catch(er){ lines=[{sub:'Calculation not available: '+er.message}]; }
  var act=svc?'<details class="dgact"><summary>Design actions at this point — '+dgMk(cn||'as entered')+'</summary>'+dgCalcHTML(dgCalcLines('actions',o,lc))+(lc.brk?'<table class="dgcl"><thead><tr><th>Action</th><th>Acts on</th><th class="r">M</th><th class="r">V</th><th class="r">T</th><th class="r">γ<sub>ULS,M</sub></th><th class="r">γ<sub>SLS</sub></th></tr></thead><tbody>'+DG.ACT.map(function(q){ var v=lc.brk.a[q.k], gm=lc.gam[q.k]; return '<tr><td>'+q.n+'</td><td>'+(q.st==='nc'?'Super-T':'composite')+'</td><td class="r">'+anFmt(v.M,0)+'</td><td class="r">'+anFmt(v.V,0)+'</td><td class="r">'+anFmt(v.T,0)+'</td><td class="r">'+gm.M+'</td><td class="r">'+gm.s+'</td></tr>'; }).join('')+'</tbody></table>':'')+'</details>':'';
  box.innerHTML=head+'<div class="dgpoib">'+(diag?'<div class="dgpoid">'+diag+'</div>':'')+'<div class="dgpoic">'+act+dgCalcHTML(lines)+'</div></div>';
}

/* ---------- permissible stresses ---------- */
/* Service compression: no code limit; Cl 8.1.4.2 implies 0.6f'c (triangular) or 0.5f'c (rectangular); the ASBD concrete data supplies 0.4. */
DG.svLim={kc:0.4, src:'asbd'};
function dgAnLimBar(){
  var a=DG.an; if(!(a.type==='tr'||(a.type==='sls'&&a.res!=='crk'&&a.res!=='stl'))) return '';
  var G=dgGirdPar(), L=DG.trLim, S=DG.svLim, Q=DG.sec, inp=function(id,v){ return '<input class="f" id="'+id+'" value="'+(v===null||v===undefined?'':v)+'" style="width:52px" inputmode="decimal">'; };
  var std='<span class="tg tS">Standard — verify</span>', usr='<span class="tg tU">Input (user)</span>';
  var h='<div class="dglim set"><b>Permissible stresses in the precast beam</b>';
  if(a.type==='tr'){
    h+='<span>f\'<sub>cp</sub> at transfer = <b>'+G.fci+' MPa</b> <span class="tg tD">Hog tab</span></span>'
      +'<label>Compression, Cl 8.1.4.2 <select id="dg_ldist"><option value="tri"'+(L.dist!=='rect'?' selected':'')+'>triangular distribution — 0.6f\'cp</option><option value="rect"'+(L.dist==='rect'?' selected':'')+'>rectangular distribution — 0.5f\'cp</option></select>'
      +' k = '+inp('dg_lkc',L.kc)+' &rarr; <b>'+anFmt(L.c,2)+'</b> MPa</label>'
      +'<label>Tension, Cl 8.6.2(a)(i) '+inp('dg_lkt',L.kt)+' &times; &radic;f\'<sub>cp</sub> &rarr; <b>'+anFmt(+L.t,2)+'</b> MPa</label>'+(L.src==='std'?std:usr+' <button class="b" id="dg_lstd">Reset to code values</button>');
  } else {
    h+='<span>Tension: 0.25&radic;f\'<sub>c</sub> = <b>'+(DG.res&&DG.res.base?anFmt(DG.res.base.fct25,2):'—')+'</b> MPa, Cl 8.6.2 (uncracked) '+std+'</span>'
      +'<label>Compression <select id="dg_lsd"><option value="asbd"'+(S.src==='asbd'?' selected':'')+'>0.4f\'c — factor in the ASBD concrete data</option><option value="tri"'+(S.src==='tri'?' selected':'')+'>0.6f\'c — triangular, implied by Cl 8.1.4.2</option><option value="rect"'+(S.src==='rect'?' selected':'')+'>0.5f\'c — rectangular, implied by Cl 8.1.4.2</option><option value="user"'+(S.src==='user'?' selected':'')+'>own factor</option></select>'
      +' k = '+inp('dg_lsc',S.kc)+' &rarr; <b>'+(S.kc>0?anFmt(S.kc*Q.fcg,1)+' / '+anFmt(S.kc*Q.fcd,1):'—')+'</b> MPa (Super-T / deck)</label>'
      +(S.src==='tri'||S.src==='rect'?std:usr)+'<span class="dgg">The code gives no service compression limit; '+(S.src==='asbd'?'0.4 is the factor supplied in the ASBD concrete data.':S.src==='user'?'factor entered by you.':'Cl 8.1.4.2 implies this value.')+'</span>';
  }
  return h+'</div>';
}
function dgAnLimBind(){
  var num=function(el){ var v=el.value.trim(); return v===''?null:Math.abs(+v); }, upd=function(){ dgLimSync(); DG.poiCache=null; dgSLSView(); dgAnView(); };
  if($('dg_lkc')){ $('dg_lkc').onchange=function(){ DG.trLim.kc=num(this); DG.trLim.src='user'; if(DG.trLim.kc===null) DG.trLim.c=null; upd(); }; $('dg_lkt').onchange=function(){ DG.trLim.kt=num(this); DG.trLim.src='user'; if(DG.trLim.kt===null) DG.trLim.t=null; upd(); };
    $('dg_ldist').onchange=function(){ DG.trLim.dist=this.value; if(DG.trLim.src!=='std') DG.trLim.kc=this.value==='rect'?0.5:0.6; upd(); };
    if($('dg_lstd')) $('dg_lstd').onclick=function(){ DG.trLim.src='std'; upd(); }; }
  if($('dg_lsd')){ $('dg_lsd').onchange=function(){ var v=this.value; DG.svLim.src=v; if(v!=='user') DG.svLim.kc={asbd:0.4,tri:0.6,rect:0.5}[v]; upd(); };
    $('dg_lsc').onchange=function(){ DG.svLim.kc=num(this); DG.svLim.src='user'; upd(); }; }
}
