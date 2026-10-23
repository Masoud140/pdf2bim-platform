/* ===== v23: ASBD-style Design tab — Analysis (chart along the girder + points of interest) / Beam inputs / Load cases ===== */
DG.an={pg:'an', type:'svc', ls:'SLS', res:'all', comb:'env', poi:null, sym:true, setp:'gen'};
DG.ver=0;
var DG_AN_TYPES=[['sec','Section properties'],['tr','Transfer'],['ere','Beam erection / lifting',1],['cs','Construction stages',1],['svc','In service (composite)'],['dt','Differential temperature primary stress',1],['shc','Shrinkage / creep primary',1]];
function dgAnResList(){ var a=DG.an;
  if(a.type==='sec') return [['Ic','Second moment of area — composite'],['Ig','Second moment of area — Super-T'],['Ac','Area — composite'],['yc','Centroid depth below deck top']];
  if(a.type==='tr') return [['all','Fibre stresses — top and soffit'],['top','Super-T top fibre'],['bot','Super-T soffit']];
  if(a.ls==='SLS') return [['all','Fibre stresses — all'],['dtop','Fibre stress — deck top'],['gtop','Fibre stress — Super-T top'],['gbot','Fibre stress — Super-T soffit'],['crk','Crack control — M_{s}* vs M_{s,allow}']];
  return [['bend','Bending — M* vs φM_{u}'],['shear','Shear — V* vs φV_{u}'],['tors','Torsion — T* vs φT_{us}'],['util','Utilisations']]; }
function dgAnKind(){ var a=DG.an; if(a.type==='sec') return 'sec'; if(a.type==='tr') return 'transfer'; if(a.ls==='SLS') return a.res==='crk'?'crack':'sls'; return a.res==='bend'?'uls':'shear'; }
var dgAnOpt=function(list,v){ return list.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===v?' selected':'')+(o[2]?' disabled':'')+'>'+dgMk(o[1])+(o[2]?' — later stage':'')+'</option>'; }).join(''); };

/* ---------- page shell ---------- */
function dgBuild(){
  var pane=$('paneDG'); if(pane.dataset.built) return; pane.dataset.built=1;
  var card=function(t,p,body){ return '<section class="dgcard"><header class="dghd"><span></span><div><h3>'+t+'</h3>'+(p?'<p>'+p+'</p>':'')+'</div><span></span></header><div class="dgbody">'+body+'</div></section>'; };
  pane.innerHTML='<div class="dgwrap dgv3'+(DG.fx?'':' dgnofx')+'" id="dg_wrap"><div class="dgmain">'
   +'<div class="dgbar"><label>Girder <select id="dg_g"><option value="0">G1</option><option value="1">G2</option><option value="2">G3</option><option value="3">G4</option></select></label>'
   +'<label>Prestress at <select id="dg_t"></select></label><button class="b" id="dg_fill">&#9654; Fill load cases from the model</button><button class="b" id="dg_run">Run checks</button>'
   +'<span class="dgrep"><button class="b dgx1" id="dg_docx" title="Word calculation report: inputs, every check with substitution and clause reference, figures, summary, needs-review list">&#128462; Word report</button><button class="b" id="dg_xl" title="Workbook with live formulas">Excel</button><button class="b" id="dg_rep" title="Printable HTML report">HTML</button></span>'
   +'<label class="v3dchk"><input type="checkbox" id="dg_fx"'+(DG.fx?' checked':'')+'> Show formulas</label><span class="n" id="dg_st"></span></div>'
   +'<div class="dgtabs" role="tablist"><button data-pg="an">Analysis</button><button data-pg="in">Beam inputs</button><button data-pg="lc">Load cases</button>'
   +'<span class="dglegend"><span class="tg tD">Direct</span> <span class="tg tC">Calculated</span> <span class="tg tS">Standard — verify</span> <span class="tg tU">Input (user)</span> <span class="tg" style="color:var(--flag)">Missing — Flagged</span></span></div>'
   +'<div class="dgpg" id="dg_pg_an"><div class="dgctl" id="dg_ctl"></div><div class="dgansum" id="dg_ansum"></div><div class="dgchart" id="dg_chart"></div><div class="dgpoi" id="dg_poi"></div>'
     +'<details class="dgmore"><summary>Along-girder envelopes, strand elevation and critical sections</summary><div id="dg_gird"></div></details>'
     +'<details class="dgmore"><summary>Engine benchmark — this engine re-run on the reference spreadsheet example</summary><div id="dg_bm"></div></details></div>'
   +'<div class="dgpg" id="dg_pg_in" hidden>'+card('Super-T, deck and girder (view)','Drawn to scale, read only. Everything shown here is defined in Properties &rarr; Girder definition.','<div id="dg_s1"></div>')
     +card('Set parameters for <select id="dg_setp"><option value="gen">Materials and derived parameters</option></select>','','<div data-set="gen"><div id="dg_gen"></div></div>')+'</div>'
   +'<div class="dgpg" id="dg_pg_lc" hidden>'+card('Load cases','Your own stations along the girder, kept separate from the automatic points of interest. Each appears in the Analysis stepper as LC<i>n</i>.','<div id="dg_lc"></div>')
     +card('Results by load case — summary','','<div id="dg_sum"></div>')+card('Transfer and serviceability (Cl 8.6.2)','','<div id="dg_sls"></div>')
     +card('Ultimate bending (Cl 8.1)','','<div id="dg_ulb"></div>')+card('Ultimate shear and torsion (Cl 8.2)','','<div id="dg_ulv"></div>')+'</div>'
   +'</div></div>';
  [].forEach.call(pane.querySelectorAll('.dgtabs [data-pg]'),function(b){ b.onclick=function(){ dgAnPage(b.getAttribute('data-pg')); }; });
  if(DG.an.setp==='det') DG.an.setp='gen'; $('dg_setp').value=DG.an.setp; $('dg_setp').onchange=function(){ DG.an.setp=$('dg_setp').value; [].forEach.call(pane.querySelectorAll('[data-set]'),function(d){ d.hidden=d.getAttribute('data-set')!==DG.an.setp; }); };
  $('dg_setp').onchange();
  $('dg_g').value=DG.gi; $('dg_g').onchange=function(){ DG.gi=+$('dg_g').value; var k=DG.sec; DG.sec=null; try{ dgSecInit(true); if(k) DG.sec.dbars=k.dbars; }catch(e){} DG.res=null; DG.gird=null; dgAll(); dgAutoRun(); };
  $('dg_fill').onclick=function(){ dgFill(); }; $('dg_run').onclick=function(){ dgRun(); }; $('dg_xl').onclick=function(){ dgExportXL(); }; $('dg_rep').onclick=function(){ dgReport(); };
  $('dg_docx').onclick=function(){ dgDocx().catch(function(e){ $('dg_st').textContent='Word report failed: '+e.message; console.error(e); }); };
  $('dg_fx').onchange=function(){ DG.fx=$('dg_fx').checked; $('dg_wrap').classList.toggle('dgnofx',!DG.fx); };
  dgAnPage(DG.an.pg); dgTimeSel(); dgAll(); setTimeout(dgBench,30);
}
function dgAnPage(p){ DG.an.pg=p; ['an','in','lc'].forEach(function(k){ var e=$('dg_pg_'+k); if(e) e.hidden=k!==p; }); [].forEach.call(document.querySelectorAll('#paneDG .dgtabs [data-pg]'),function(b){ b.classList.toggle('on',b.getAttribute('data-pg')===p); b.setAttribute('aria-selected',b.getAttribute('data-pg')===p); }); if(p==='an') dgAnView(); }
function dgAll(){ var X=null, B=null; try{ X=dgSection(); B=dgBase(X); }catch(e){ $('dg_s1').innerHTML='<div class="bbnote bbflag">'+e.message+'</div>'; }
  dgS1(X,B); dgGenView(X,B); dgLCView(); dgSLSView(); dgULBView(); dgDetView(X,B); dgULVView(); dgSumView(); dgGirdView(); dgChips(); dgAnView(); }
var dgRun0=dgRun; dgRun=function(q){ DG.ver++; DG.poiCache=null; return dgRun0(q); };

/* ---------- along-girder run, kept in step with the checks ---------- */
function dgAnGird(){ if(!DG.res) return; if(DG.girdBusy){ DG.girdPend=true; return; } if(DG.gird&&DG.gird.ver===DG.ver) return; dgGirdRun(); }
function dgAnGirdDone(){ DG.girdBusy=false; if(DG.girdPend||DG.gird.ver!==DG.ver){ DG.girdPend=false; dgAnGird(); return; } DG.poiCache=null; dgAnView(); }

/* ---------- points of interest ---------- */
function dgPOIs(){
  var Q=DG.sec; if(!Q) return []; var G=dgGirdPar(); if(!G.Lg) return [];
  var L=G.Lg, D=(Q.tD+Q.P.D)/1000, Lp=G.Lpt/1000, out=[], add=function(x,lab,kind,i){ if(x===null||!isFinite(x)||x<0||x>L) return; out.push({x:x,lab:lab,kind:kind||'auto',i:i}); };
  var on=Q.strands.filter(function(t){ return t.on; }), dLs={}, dRs={}; on.forEach(function(t){ if(t.dL>0) dLs[t.dL]=1; if(t.dR>0) dRs[t.dR]=1; });
  add(G.asup,'Support at transfer'); add(Lp,'End of transmission length');
  Object.keys(dLs).forEach(function(d){ add(d/1000,'Debond end ('+d+' mm)'); add(d/1000+Lp,'Full transfer after debond ('+d+' mm)'); });
  if(Q.solidLen>0) add(Q.solidLen/1000,'End of solid end block');
  if(G.a!==null){ add(G.a,'Bearing'); add(G.a+D/2,'h/2 from bearing'); var xb=L-G.a2; add(G.a+(xb-G.a)/4,'Quarter span'); add(G.a+(xb-G.a)/2,'Midspan'); }
  if(!DG.an.sym){ add(L-G.asup,'Support at transfer (right)'); add(L-Lp,'End of transmission length (right)');
    Object.keys(dRs).forEach(function(d){ add(L-d/1000,'Debond end, right ('+d+' mm)'); add(L-d/1000-Lp,'Full transfer after debond, right ('+d+' mm)'); });
    if(Q.solidLen>0) add(L-Q.solidLen/1000,'End of solid end block (right)');
    if(G.a!==null){ var xb2=L-G.a2; add(xb2,'Bearing (right)'); add(xb2-D/2,'h/2 from bearing (right)'); add(G.a+3*(xb2-G.a)/4,'Three-quarter span'); } }
  DG.lc.forEach(function(lc,i){ if(lc.s!==null&&lc.s!==undefined) add(lc.s,lc.name,'lc',i); });
  var lim=DG.an.sym?L/2+1e-6:L+1e-6; out=out.filter(function(p){ return p.x<=lim; });
  out.sort(function(a,b){ return a.x-b.x||(a.kind==='lc'?1:-1); });
  var res=[]; out.forEach(function(p){ var q=res[res.length-1]; if(q&&q.kind===p.kind&&Math.abs(q.x-p.x)<0.0005){ q.lab+=' · '+p.lab; return; } res.push(p); });
  res.forEach(function(p,k){ p.n=k+1; p.key=p.kind+':'+p.x.toFixed(4)+':'+(p.i===undefined?'':p.i); });
  return res;
}
function dgPOIEval(p){
  if(!DG.res) return null;
  var C=DG.poiCache&&DG.poiCache.ver===DG.ver?DG.poiCache:(DG.poiCache={ver:DG.ver,m:{}}); if(C.m[p.key]) return C.m[p.key];
  var r;
  if(p.kind==='lc'){ var o=DG.res.lc[p.i], lc=DG.lc[p.i]; if(!o.tr) o.tr=dgTransfer(o,lc); r={o:o,lc:lc}; }
  else { var G=dgGirdPar(), sol=dgSolidAt(p.x,G), Xb=sol?DG.res.Xs:DG.res.X, X=dgStationX(Xb,p.x,G), B=dgBase(X), lc0=DG.lc[0];
    var lc={name:'POI '+p.n+' — '+p.lab,s:p.x,fscr:lc0.fscr,ftcr:lc0.ftcr,Ns:0,Nu:0,brk:dgActAt(DG.gi,p.x)}; dgTotals(lc);
    var o2=null; try{ if(X.S.tend.length){ o2=dgLC(X,B,lc); o2.X=X; o2.B=B; o2.solid=sol; o2.tr=dgTrAt(Xb,p.x,G); } }catch(e){ o2=null; }
    r={o:o2,lc:lc,why:X.S.tend.length?null:'no strand is bonded at this point'}; }
  C.m[p.key]=r; return r;
}

/* ---------- controls ---------- */
function dgAnCtl(P){
  var a=DG.an, box=$('dg_ctl'); if(!box) return;
  if(a.type==='tr') a.ls='Transfer'; else if(a.type==='svc'&&a.ls==='Transfer') a.ls='SLS';
  var rl=dgAnResList(); if(!rl.some(function(q){ return q[0]===a.res; })) a.res=rl[0][0];
  var cur=P.findIndex(function(p){ return p.key===a.poi; }); if(cur<0){ cur=P.findIndex(function(p){ return /Midspan/.test(p.lab); }); if(cur<0) cur=0; a.poi=P[cur]?P[cur].key:null; }
  var p=P[cur], lim=DG.trLim;
  var h='<label>Analyse for <select id="dg_aty">'+dgAnOpt(DG_AN_TYPES,a.type)+'</select></label>';
  if(a.type!=='sec') h+='<label>Limit state <select id="dg_als"'+(a.type==='tr'?' disabled':'')+'>'+(a.type==='tr'?'<option>Transfer</option>':dgAnOpt([['SLS','Serviceability (SLS)'],['ULS','Ultimate (ULS)']],a.ls))+'</select></label>';
  if(a.type==='svc') h+='<label>Combination <select id="dg_acb">'+dgAnOpt([['env','Envelope — all combinations'],['one','Single combination',1]],a.comb)+'</select></label>';
  h+='<label>Result <select id="dg_ars">'+dgAnOpt(rl,a.res)+'</select></label>';

  h+='<label class="v3dchk"><input type="checkbox" id="dg_asy"'+(a.sym?' checked':'')+'> Symmetrical beam</label>';
  h+='<span class="dgpoist"><span>Point of interest</span><button class="b" id="dg_ap">&#9664;</button><select id="dg_apl">'+P.map(function(q){ return '<option value="'+q.key+'"'+(q.key===a.poi?' selected':'')+'>'+q.n+' · '+q.x.toFixed(3)+' m · '+q.lab+'</option>'; }).join('')+'</select><button class="b" id="dg_an">&#9654;</button></span>';
  box.innerHTML=h;
  var re=function(){ DG.poiCache=DG.poiCache; dgAnView(); };
  $('dg_aty').onchange=function(){ a.type=this.value; re(); };
  if($('dg_als')) $('dg_als').onchange=function(){ a.ls=this.value; re(); };
  $('dg_ars').onchange=function(){ a.res=this.value; re(); };

  $('dg_asy').onchange=function(){ a.sym=this.checked; re(); };
  $('dg_apl').onchange=function(){ a.poi=this.value; re(); };
  $('dg_ap').onclick=function(){ if(cur>0){ a.poi=P[cur-1].key; re(); } };
  $('dg_an').onclick=function(){ if(cur<P.length-1){ a.poi=P[cur+1].key; re(); } };
  return p;
}

/* ---------- series for the chart along the girder ---------- */
function dgAnSeries(){
  var a=DG.an, D=DG.gird, G=D.G, S=D.st.filter(function(r){ return !a.sym||r.x<=G.Lg/2+1e-6; }), nan=NaN;
  var ser=function(lab,c,f,o){ return Object.assign({lab:lab,c:c,p:S.map(function(r){ var v; try{ v=f(r); }catch(e){ v=nan; } return [r.x,v===null||v===undefined||!isFinite(v)?nan:v]; })},o||{}); };
  var hl=function(lab,v,o){ return Object.assign({lab:lab,c:'var(--flag)',dash:'6 4',wd:1.2,p:[[S[0].x,v],[S[S.length-1].x,v]]},o||{}); };
  var lim=DG.trLim, out={yl:'',ser:[],note:''}, fct=DG.res&&DG.res.base?DG.res.base.fct25:null;
  if(a.type==='sec'){ var m={Ic:['I composite (m⁴)',function(r){ return r.B.ec.I/1e12; }],Ig:['I Super-T (m⁴)',function(r){ return r.B.eg.I/1e12; }],Ac:['Area composite (m²)',function(r){ return r.B.ec.A/1e6; }],yc:['Centroid below deck top (mm)',function(r){ return r.B.ec.yc; }]}[a.res];
    out.yl=m[0]; out.ser.push(ser(m[0],'var(--instr)',m[1])); if(a.res==='yc') out.ser.push(ser('Super-T centroid','var(--calc)',function(r){ return r.B.eg.yc; })); out.flip=a.res==='yc'; return out; }
  if(a.type==='tr'){ out.yl='Stress at transfer (MPa, compression −)';
    if(a.res!=='bot') out.ser.push(ser('Super-T top','var(--instr)',function(r){ return r.tr.top; }));
    if(a.res!=='top') out.ser.push(ser('Super-T soffit','var(--calc)',function(r){ return r.tr.bot; }));
    if(lim.c>0) out.ser.push(hl('Permissible compression '+dgLimTxt('tc')+' (Cl 8.1.4.2)',-lim.c,{val:true})); if(lim.t!==null&&lim.t!=='') out.ser.push(hl('Permissible tension '+dgLimTxt('tt')+' (Cl 8.6.2(a)(i))',+lim.t,{dash:'2 3',val:true}));
    return out; }
  if(a.ls==='SLS'){
    if(a.res==='crk'){ out.yl='Composite SLS moment (kN·m)'; out.ser.push(ser('M_{s}*','var(--instr)',function(r){ return r.lc.Ms; })); out.ser.push(ser('M_{s,allow}','var(--flag)',function(r){ return r.o.Mal>0?r.o.Mal:NaN; },{dash:'6 4',wd:1.2})); return out; }
    out.yl='Service stress (MPa, compression −)';
    if(a.res==='all'||a.res==='dtop') out.ser.push(ser('Deck top','var(--std)',function(r){ return r.o.sv.deckTop; }));
    if(a.res==='all'||a.res==='gtop') out.ser.push(ser('Super-T top','var(--instr)',function(r){ return r.o.sv.girTop; }));
    if(a.res==='all'||a.res==='gbot') out.ser.push(ser('Super-T soffit','var(--calc)',function(r){ return r.o.sv.girBot; }));
    if(fct&&(a.res==='all'||a.res==='gbot')) out.ser.push(hl('Permissible tension 0.25√f\'_{c} (Cl 8.6.2 uncracked)',fct,{dash:'2 3',val:true}));
    var sl=DG.svLim, Q=DG.sec; if(sl.kc!==null&&sl.kc>0){ if(a.res!=='dtop') out.ser.push(hl('Permissible compression, Super-T '+sl.kc+'f\'_{c} = '+anFmt(sl.kc*Q.fcg,1)+' MPa',-sl.kc*Q.fcg,{val:true})); if(a.res==='all'||a.res==='dtop') out.ser.push(hl('Permissible compression, deck '+sl.kc+'f\'_{c} = '+anFmt(sl.kc*Q.fcd,1)+' MPa',-sl.kc*Q.fcd,{val:true,dash:'8 3 2 3'})); }
    return out; }
  if(a.res==='bend'){ out.yl='Moment (kN·m, sagging +)'; out.ser.push(ser('M*','var(--instr)',function(r){ return r.lc.Mu; })); out.ser.push(ser('φM_{u} sagging','var(--flag)',function(r){ return r.phMs; },{dash:'6 4',wd:1.2})); out.ser.push(ser('φM_{u} hogging','var(--flag)',function(r){ return r.phMh?-Math.abs(r.phMh):NaN; },{dash:'2 3',wd:1.2})); return out; }
  if(a.res==='shear'){ out.yl='Shear (kN)'; out.ser.push(ser('V*','var(--instr)',function(r){ return r.lc.Vu; })); out.ser.push(ser('φ(V_{uc} + V_{us})','var(--flag)',function(r){ return 0.7*(r.o.sh.Vuc+r.o.sh.Vus)/1e3; },{dash:'6 4',wd:1.2})); out.ser.push(ser('φV_{u.max} (web crushing)','var(--calc)',function(r){ return 0.7*r.o.sh.Vumax/1e3; },{dash:'2 3',wd:1.2})); if(!S.some(function(r){ return r.o&&r.o.sh; })) out.note='Shear capacity not calculated — shear and torsion detailing missing (Beam inputs).'; return out; }
  if(a.res==='tors'){ out.yl='Torsion (kN·m)'; out.ser.push(ser('T*','var(--instr)',function(r){ return r.lc.Tu; })); out.ser.push(ser('φT_{us}','var(--flag)',function(r){ return 0.7*r.o.sh.Tus/1e6; },{dash:'6 4',wd:1.2})); return out; }
  out.yl='Utilisation'; out.ser.push(ser('M_{s}*/M_{s,allow}','var(--std)',function(r){ return Math.max(0,r.o.uS); })); out.ser.push(ser('M*/φM_{u}','var(--instr)',function(r){ return r.o.uB; }));
  out.ser.push(ser('Shear','var(--calc)',function(r){ return r.o.sh.uV; })); out.ser.push(ser('Web crushing','var(--eng)',function(r){ return r.o.sh.uCr; })); out.ser.push(ser('Torsion','var(--muted)',function(r){ return r.o.sh.uT; },{dash:'4 2'}));
  out.ser.push(ser('Longitudinal steel','var(--fg)',function(r){ return r.o.sh.uL; },{dash:'1 2'})); out.ser.push(hl('1.0',1)); return out;
}
var dgSvgT=function(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/_\{([^}]*)\}/g,'<tspan baseline-shift="sub" font-size="80%">$1</tspan>').replace(/\^\{([^}]*)\}/g,'<tspan baseline-shift="super" font-size="80%">$1</tspan>'); };
function dgNice(lo,hi,n){ var span=hi-lo||Math.abs(hi)||1, raw=span/(n||6), mag=Math.pow(10,Math.floor(Math.log10(raw))), st=[1,2,2.5,5,10].map(function(k){ return k*mag; }).find(function(s){ return s>=raw; }); var a=Math.floor(lo/st)*st, b=Math.ceil(hi/st)*st, t=[]; for(var v=a;v<=b+st*1e-6;v+=st) t.push(+v.toFixed(10)); return {lo:a,hi:b,t:t,st:st}; }
function dgAnChart(P,p){
  var a=DG.an, D=DG.gird, G=D.G, Q=DG.sec, sd=dgAnSeries(), x1=a.sym?G.Lg/2:G.Lg;
  var gOf=function(s){ return s.grp||s.lab.replace(/ — \((a|b)\).*$/,''); }, hid=DG.an.hide||(DG.an.hide={'Deck top':true}), allS=sd.ser; sd.ser=allS.filter(function(s){ return !hid[gOf(s)]; });
  var W=1000, L=70, R=24, T=16, Hp=300, sT=T+Hp+40, sH=96, H=sT+sH+30, X=function(x){ return L+x/x1*(W-L-R); };
  var ys=[]; sd.ser.forEach(function(s){ s.p.forEach(function(q){ if(isFinite(q[1])) ys.push(q[1]); }); }); if(!ys.length) ys=[0,1];
  var lo=Math.min.apply(null,ys), hi=Math.max.apply(null,ys); if(a.type!=='sec'){ lo=Math.min(lo,0); hi=Math.max(hi,0); } if(lo===hi){ lo-=1; hi+=1; }
  var nk=dgNice(lo-(hi-lo)*0.04,hi+(hi-lo)*0.04,6), fl=sd.flip, Y=function(v){ var f=(v-nk.lo)/(nk.hi-nk.lo); return fl?T+f*Hp:T+Hp-f*Hp; };
  var g='<rect x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+Hp+'" fill="var(--bg)" stroke="var(--line)"/>';
  nk.t.forEach(function(v){ g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--line)" stroke-width="'+(v===0?1.4:0.6)+'"'+(v===0?'':' opacity=".7"')+'/><text class="dgax" x="'+(L-6)+'" y="'+(Y(v)+3.5)+'" text-anchor="end">'+anFmt(v,nk.st<0.01?4:nk.st<1?2:0)+'</text>'; });
  var xt=dgNice(0,x1,10); xt.t.forEach(function(v){ if(v>x1+1e-9) return; g+='<line x1="'+X(v)+'" x2="'+X(v)+'" y1="'+T+'" y2="'+(T+Hp)+'" stroke="var(--line)" stroke-width=".5" opacity=".6"/><text class="dgax" x="'+X(v)+'" y="'+(T+Hp+14)+'" text-anchor="middle">'+anFmt(v,xt.st<1?1:0)+'</text>'; });
  g+='<text class="dgal" x="'+((L+W-R)/2)+'" y="'+(T+Hp+30)+'" text-anchor="middle">Distance from left end of girder (m)</text><text class="dgal" transform="translate(16,'+(T+Hp/2)+') rotate(-90)" text-anchor="middle">'+dgSvgT(sd.yl)+'</text>';
  DGX.ly=[];
  sd.ser.forEach(function(s){ var d='', pen=false; s.p.forEach(function(q){ if(!isFinite(q[1])){ pen=false; return; } d+=(pen?'L':'M')+X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1); pen=true; });
    if(d) g+='<path d="'+d+'" fill="none" stroke="'+s.c+'" stroke-width="'+(s.wd||2)+'"'+(s.dash?' stroke-dasharray="'+s.dash+'"':'')+' stroke-linejoin="round"/>';
    if(s.val&&isFinite(s.p[0][1])){ var ly=Y(s.p[0][1])+(s.p[0][1]<0?13:-5); while((DGX.ly=DGX.ly||[]).some(function(u){ return Math.abs(u-ly)<13; })) ly+=s.p[0][1]<0?13:-13; DGX.ly.push(ly); } if(s.val&&isFinite(s.p[0][1])) g+='<text x="'+(W-R-4)+'" y="'+ly+'" text-anchor="end" font-size="11" font-weight="600" fill="'+s.c+'">'+anFmt(s.p[0][1],2)+' MPa</text>'; });
  /* beam strip */
  var by=sT+12, bh=20, xe=Math.min(G.Lg,x1);
  g+='<rect x="'+X(0)+'" y="'+by+'" width="'+(X(xe)-X(0))+'" height="'+bh+'" fill="var(--dgconc,rgba(125,135,150,.2))" stroke="var(--fg)" stroke-width=".8"/>';
  if(typeof dgZones==='function') dgZones().forEach(function(z){ var za=Math.max(0,z.a), zb=Math.min(z.b,xe); if(zb>za) g+='<rect x="'+X(za)+'" y="'+by+'" width="'+(X(zb)-X(za))+'" height="'+bh+'" fill="'+DG_ZCOL.solid+'"/>'; });
  if(a.sym) g+='<line x1="'+X(x1)+'" x2="'+X(x1)+'" y1="'+(T)+'" y2="'+(by+bh+8)+'" stroke="var(--muted)" stroke-dasharray="10 3 2 3" stroke-width=".9"/><text class="dgax" x="'+(X(x1)-4)+'" y="'+(by-4)+'" text-anchor="end">&#8452; symmetry</text>';
  var tri=function(x,fill){ return '<path d="M'+X(x)+','+(by+bh)+' l-6,10 h12z" fill="'+fill+'" stroke="var(--fg)" stroke-width=".8"/>'; };
  if(G.a!==null){ g+=tri(G.a,'var(--fg)'); if(!a.sym) g+=tri(G.Lg-G.a2,'var(--fg)'); }
  if(G.asup!==null&&Math.abs(G.asup-G.a)>0.01){ g+=tri(G.asup,'none'); if(!a.sym) g+=tri(G.Lg-G.asup,'none'); }
  var seen={}; Q.strands.forEach(function(t){ if(!t.on) return; [t.dL/1000].concat(a.sym?[]:[G.Lg-t.dR/1000]).forEach(function(x){ if(x>0&&x<G.Lg&&!seen[x.toFixed(3)]){ seen[x.toFixed(3)]=1; g+='<line x1="'+X(x)+'" x2="'+X(x)+'" y1="'+(by-7)+'" y2="'+by+'" stroke="var(--instr)" stroke-width="1.6"/>'; } }); });
  /* points of interest */
  g+='<text class="dgax" x="'+(L-6)+'" y="'+(by+bh+27)+'" text-anchor="end">auto</text><text class="dgax" x="'+(L-6)+'" y="'+(by+bh+61)+'" text-anchor="end">load cases</text>';
  var lastX={auto:-99,lc:-99};
  P.forEach(function(q){ var x=X(q.x), on=p&&q.key===p.key, yy=by+bh+(q.kind==='lc'?58:24), lab=x-lastX[q.kind]>16||on; lastX[q.kind]=lab?x:lastX[q.kind];
    g+=q.kind==='lc'?'<path d="M'+x+','+(yy-6)+' l5,6 l-5,6 l-5,-6z" fill="'+(on?'var(--flag)':'var(--calc)')+'"/>':'<line x1="'+x+'" x2="'+x+'" y1="'+(yy-6)+'" y2="'+(yy+6)+'" stroke="'+(on?'var(--flag)':'var(--instr)')+'" stroke-width="'+(on?2.4:1.4)+'"/>';
    if(lab) g+='<text class="dgax" x="'+x+'" y="'+(yy+18)+'" text-anchor="middle"'+(on?' font-weight="700" fill="var(--flag)"':'')+'>'+(q.kind==='lc'?'LC'+(q.i+1):q.n)+'</text>';
    g+='<rect x="'+(x-7)+'" y="'+(yy-8)+'" width="14" height="30" fill="transparent" data-poi="'+q.key+'"><title>'+q.n+' · '+q.x.toFixed(3)+' m · '+dgMk(q.lab)+'</title></rect>'; });
  if(p){ var xp=X(p.x); g+='<line x1="'+xp+'" x2="'+xp+'" y1="'+T+'" y2="'+(by+bh+(p.kind==='lc'?52:18))+'" stroke="var(--flag)" stroke-width="1" stroke-dasharray="3 3"/>';
    sd.ser.forEach(function(s){ var v=dgInterp(s.p,p.x); if(isFinite(v)) g+='<circle cx="'+xp+'" cy="'+Y(v)+'" r="3.4" fill="'+s.c+'" stroke="var(--bg)" stroke-width="1"/>'; }); }
  var seenG={}; var leg='<div class="dgleg2">'+allS.map(function(s){ var gk=gOf(s), off=!!hid[gk]; return '<span class="dglegt'+(off?' off':'')+'" data-grp="'+gk.replace(/"/g,'&quot;')+'" title="Click to '+(off?'show':'hide')+' &ldquo;'+gk.replace(/"/g,'&quot;')+'&rdquo;"><svg width="26" height="10" aria-hidden="true"><line x1="1" x2="25" y1="5" y2="5" stroke="'+s.c+'" stroke-width="'+(s.wd||2)+'"'+(s.dash?' stroke-dasharray="'+s.dash+'"':'')+'/></svg>'+dgMk(s.lab)+'</span>'; }).join('')
    +'<span><svg width="14" height="12" aria-hidden="true"><path d="M7,1 l6,10 h-12z" fill="var(--fg)"/></svg>bearing</span>'+(G.asup!==null&&Math.abs(G.asup-G.a)>0.01?'<span><svg width="14" height="12" aria-hidden="true"><path d="M7,1 l6,10 h-12z" fill="none" stroke="var(--fg)"/></svg>support at transfer</span>':'')
    +'<span><svg width="10" height="12" aria-hidden="true"><line x1="5" x2="5" y1="1" y2="11" stroke="var(--instr)" stroke-width="1.6"/></svg>debond point / auto point of interest</span><span><svg width="12" height="12" aria-hidden="true"><path d="M6,0 l5,6 l-5,6 l-5,-6z" fill="var(--calc)"/></svg>your load case</span>'
    +(typeof dgZones==='function'&&dgZones().length?'<span><svg width="16" height="10" aria-hidden="true"><rect width="16" height="10" fill="'+DG_ZCOL.solid+'"/></svg>solid zone</span>':'')+'</div>';
  return {svg:'<svg viewBox="0 0 '+W+' '+H+'" id="dg_ansvg" role="img" aria-label="'+dgMk(sd.yl)+' along the girder">'+g+'</svg>', leg:leg, note:sd.note, X:X, W:W, x1:x1, L:L, R:R};
}
function dgInterp(p,x){ for(var i=1;i<p.length;i++){ var a=p[i-1], b=p[i]; if(x>=a[0]-1e-9&&x<=b[0]+1e-9){ if(!isFinite(a[1])||!isFinite(b[1])) return isFinite(a[1])?a[1]:b[1]; return b[0]===a[0]?a[1]:a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]); } } return NaN; }

/* ---------- summary strip: governing utilisation along the girder for every check ---------- */
function dgAnSum(){
  var D=DG.gird, box=$('dg_ansum'); if(!box) return; if(!D){ box.innerHTML=''; return; }
  var S=D.st, lim=DG.trLim, fct=DG.res&&DG.res.base?DG.res.base.fct25:null;
  var mx=function(f){ var m=null, x=null; S.forEach(function(r){ var u; try{ u=f(r); }catch(e){ u=null; } if(u!==null&&u!==undefined&&isFinite(u)&&(m===null||u>m)){ m=u; x=r.x; } }); return {u:m,x:x}; };
  var it=[['tr','Transfer','Transfer','all',lim.c>0&&lim.t!==null?mx(function(r){ return Math.max(-r.tr.top/lim.c,-r.tr.bot/lim.c,lim.t>0?r.tr.top/lim.t:0,lim.t>0?r.tr.bot/lim.t:0); }):{u:null,why:'limits missing'}],
    ['svc','SLS','Soffit tension','gbot',fct?mx(function(r){ return Math.max(0,r.o.sv.girBot)/fct; }):{u:null}],['svc','SLS','Crack control','crk',mx(function(r){ return Math.max(0,r.o.uS); })],
    ['svc','ULS','Bending','bend',mx(function(r){ return r.o.uB; })],['svc','ULS','Shear','shear',mx(function(r){ return Math.max(r.o.sh.uV,r.o.sh.uCr); })],['svc','ULS','Torsion','tors',mx(function(r){ return r.o.sh.uT; })],['svc','ULS','Longitudinal steel','util',mx(function(r){ return r.o.sh.uL; })]];
  box.innerHTML='<span class="dgsumh">Governing along the girder</span>'+it.map(function(q,k){ var u=q[4].u, cls=u===null?'mi':u>1?'ng':u>0.9?'wa':'ok';
    return '<button class="dgsc '+cls+'" data-k="'+k+'" title="Show this result"><span>'+q[2]+'</span><b>'+(u===null?(q[4].why||'not available'):anFmt(u,2))+'</b>'+(u!==null?'<i>at '+anFmt(q[4].x,2)+' m</i>':'')+'</button>'; }).join('');
  [].forEach.call(box.querySelectorAll('.dgsc'),function(b){ b.onclick=function(){ var q=it[+b.getAttribute('data-k')]; DG.an.type=q[0]; if(q[0]==='svc') DG.an.ls=q[1]; DG.an.res=q[3];
    if(q[4].x!==null&&q[4].x!==undefined){ var P=dgPOIs(), best=null; P.forEach(function(p){ if(!best||Math.abs(p.x-q[4].x)<Math.abs(best.x-q[4].x)) best=p; }); if(best) DG.an.poi=best.key; } dgAnView(); }; });
}

/* ---------- detail panel at the selected point ---------- */
function dgCalcLinesX(kind,o,lc){
  if(kind!=='sec') return dgCalcLines(kind,o,lc);
  var B=o.B, f=function(v,d){ return anFmt(v,d===undefined?1:d); };
  return [{sub:'Super-T alone (transformed to E_{c} of the Super-T)'},{d:'Area',e:'A_{g} = Σ concrete + (n − 1)A_{s,p}',r:f(B.eg.A/1e6,4),u:'m²'},{d:'Centroid',e:'y_{g} below deck top',r:f(B.eg.yc,0),u:'mm'},{d:'Second moment',e:'I_{g} about its centroid',r:f(B.eg.I/1e12,4),u:'m⁴'},
    {sub:'Composite (deck transformed by E_{c,deck}/E_{c})'},{d:'Area',e:'A_{c}',r:f(B.ec.A/1e6,4),u:'m²'},{d:'Centroid',e:'y_{c} below deck top',r:f(B.ec.yc,0),u:'mm'},{d:'Second moment',e:'I_{c}',r:f(B.ec.I/1e12,4),u:'m⁴'},
    {sub:'Prestress at this point'},{d:'Strands bonded',e:'transmission / debond factor > 0',r:String(o.X.S.tend.length)},{d:'Strand force after losses',e:'P = Σf_{t}σ_{pe}A_{p}',r:f(B.Pt,0),u:'kN'},{d:'Eccentricity',e:'e_{p} below the Super-T centroid',r:f(B.ep,0),u:'mm'},{d:'Section type',e:'solid end block within L_{end} of each end',r:o.solid?'solid':'open'}];
}
function dgTrPlot(o,lc){ var t=o.tr, lim=DG.trLim; if(!t||t.why) return ''; var limC=lim.c>0?-lim.c:null, limT=lim.t!==null&&lim.t!==''?+lim.t:null, Ht=t.tD+t.H;
  var ser=[{p:[[t.top,-t.tD],[t.bot,-Ht]],c:'var(--instr)',lab:'Super-T at transfer'}]; if(limC!==null) ser.push({p:[[limC,-t.tD],[limC,-Ht]],c:'var(--flag)',dash:'3 3',wd:1,lab:'compression limit'}); if(limT!==null) ser.push({p:[[limT,-t.tD],[limT,-Ht]],c:'var(--flag)',dash:'1 3',wd:1,lab:'tension limit'});
  return dgCap('Stress at transfer &mdash; '+lc.name,dgPlot({w:440,h:300,xl:'&sigma; at transfer (MPa)',yl:'Depth from deck level (mm)',series:ser,pts:[]})); }
function dgAnPOI(p){
  var box=$('dg_poi'); if(!box) return; if(!p){ box.innerHTML=''; return; }
  var e=dgPOIEval(p), a=DG.an, kind=dgAnKind();
  var head='<div class="dgpoih"><b>Point of interest '+p.n+'</b><span>'+dgMk(p.lab)+'</span><span>x = '+anFmt(p.x,3)+' m from the left end</span>'+(e&&e.o?'<span>'+(e.o.solid?'solid end-block section':'open section')+'</span>':'')+(p.kind==='lc'?'<span class="dgtagl">your load case — actions as entered on the Load cases page</span>':'<span class="dgtagl">actions: envelope at this point from the Analysis tab</span>')+'</div>';
  if(!e||!e.o){ box.innerHTML=head+'<div class="dgpoib"><p class="bbflag">Not calculated: '+((e&&e.why)||'run the checks first')+'.</p></div>'; return; }
  var o=e.o, lc=e.lc, diag='';
  try{ if(kind==='transfer') diag=dgTrPlot(o,lc); else if(kind==='sls') diag=dgSLSDiag(o,lc); else if(kind==='crack') diag=dgCrackDiag(o,lc)+dgMKDiag(o,lc); else if(kind==='uls') diag=dgULSDiag(o,lc); }catch(er){ diag='<p class="bbflag">Diagram not available: '+er.message+'</p>'; }
  var lines; try{ lines=dgCalcLinesX(kind,o,lc); }catch(er){ lines=[{sub:'Calculation not available: '+er.message}]; }
  var act=(a.type==='svc')?'<details class="dgact"><summary>Design actions at this point</summary>'+dgCalcHTML(dgCalcLines('actions',o,lc))+(lc.brk?'<table class="dgcl"><thead><tr><th>Action</th><th>Acts on</th><th class="r">M</th><th class="r">V</th><th class="r">T</th><th class="r">γ_{ULS,M}</th><th class="r">γ_{SLS}</th></tr></thead><tbody>'.replace(/_\{([^}]*)\}/g,'<sub>$1</sub>')+DG.ACT.map(function(q){ var v=lc.brk.a[q.k], gm=lc.gam[q.k]; return '<tr><td>'+q.n+'</td><td>'+(q.st==='nc'?'Super-T':'composite')+'</td><td class="r">'+anFmt(v.M,0)+'</td><td class="r">'+anFmt(v.V,0)+'</td><td class="r">'+anFmt(v.T,0)+'</td><td class="r">'+gm.M+'</td><td class="r">'+gm.s+'</td></tr>'; }).join('')+'</tbody></table>':'')+'</details>':'';
  box.innerHTML=head+'<div class="dgpoib">'+(diag?'<div class="dgpoid">'+diag+'</div>':'')+'<div class="dgpoic">'+act+dgCalcHTML(lines)+'</div></div>';
}

/* ---------- the Analysis page ---------- */
function dgAnView(){
  if(DG.an.pg!=='an'||!$('dg_ctl')) { if(DG.res) dgAnGird(); return; }
  var P=dgPOIs(), p=dgAnCtl(P), ch=$('dg_chart');
  if(!DG.res){ ch.innerHTML='<p class="dgempty">Press <b>&#9654; Fill load cases from the model</b> to bring the actions in from the Analysis tab and run the checks.</p>'; $('dg_ansum').innerHTML=''; $('dg_poi').innerHTML=''; return; }
  dgAnGird();
  if(!DG.gird){ ch.innerHTML='<p class="dgempty">Running the checks along the girder&hellip;</p>'; dgAnPOI(p); return; }
  var c=dgAnChart(P,p); ch.innerHTML=dgAnLimBar()+c.svg+c.leg+(c.note?'<p class="dgnote">'+dgMk(c.note)+'</p>':'')+(DG.girdBusy?'<p class="dgnote">Updating&hellip;</p>':'');
  var sv=$('dg_ansvg'); sv.onclick=function(ev){ var bb=sv.getBoundingClientRect(), x=(ev.clientX-bb.left)/bb.width*c.W, xm=(x-c.L)/(c.W-c.L-c.R)*c.x1, best=null; P.forEach(function(q){ if(!best||Math.abs(q.x-xm)<Math.abs(best.x-xm)) best=q; }); if(best){ DG.an.poi=best.key; dgAnView(); } };
  dgAnSum(); dgAnPOI(p);
}

/* ---------- permissible stresses in the precast beam at transfer (AS 5100.5 — as cited by ASBD) ----------
   Compression Cl 8.1.4.2: 0.5f'cp for a rectangular stress distribution, 0.6f'cp for a triangular distribution.
   Tension Cl 8.6.2(a)(i): 0.5√f'cp.  Code values: tag Standard — verify; any edit becomes Input (user). */
DG.trLim.dist=DG.trLim.dist||'tri'; DG.trLim.kc=0.6; DG.trLim.kt=0.5; DG.trLim.src='std'; DG.svLim={kc:null};
function dgLimSync(){ var G=DG.sec?dgGirdPar():null, f=G&&G.fci; if(!f) return; var L=DG.trLim; if(L.src==='std'){ L.kc=L.dist==='rect'?0.5:0.6; L.kt=0.5; } if(L.kc!==null) L.c=L.kc*f; if(L.kt!==null) L.t=L.kt*Math.sqrt(f); }
function dgLimTxt(k){ var L=DG.trLim, G=dgGirdPar(), f=G.fci;
  if(k==='tc') return L.kc!==null?L.kc+'f\'_{cp} = '+L.kc+' × '+f+' = '+anFmt(L.c,2)+' MPa':(L.c>0?anFmt(L.c,2)+' MPa (entered)':'');
  return L.kt!==null?L.kt+'√f\'_{cp} = '+L.kt+' × √'+f+' = '+anFmt(L.t,2)+' MPa':(L.t!==null?anFmt(L.t,2)+' MPa (entered)':''); }
function dgAnLimBar(){
  var a=DG.an; if(!(a.type==='tr'||(a.type==='svc'&&a.ls==='SLS'&&a.res!=='crk'))) return '';
  var G=dgGirdPar(), L=DG.trLim, S=DG.svLim, Q=DG.sec, inp=function(id,v){ return '<input class="f" id="'+id+'" value="'+(v===null||v===undefined?'':v)+'" style="width:52px" inputmode="decimal">'; };
  var std='<span class="tg tS">Standard — verify</span>', usr='<span class="tg tU">Input (user)</span>', miss='<span class="tg" style="color:var(--flag)">Missing — Flagged</span>';
  var h='<div class="dglim'+(a.type==='tr'||S.kc>0?' set':'')+'"><b>Permissible stresses in the precast beam</b>';
  if(a.type==='tr'){
    h+='<span>f\'<sub>cp</sub> at transfer = <b>'+G.fci+' MPa</b> <span class="tg tD">Hog tab</span></span>'
      +'<label>Compression, Cl 8.1.4.2 <select id="dg_ldist"><option value="tri"'+(L.dist!=='rect'?' selected':'')+'>triangular distribution — 0.6f\'cp</option><option value="rect"'+(L.dist==='rect'?' selected':'')+'>rectangular distribution — 0.5f\'cp</option></select>'
      +' k = '+inp('dg_lkc',L.kc)+' &rarr; <b>'+anFmt(L.c,2)+'</b> MPa</label>'
      +'<label>Tension, Cl 8.6.2(a)(i) '+inp('dg_lkt',L.kt)+' &times; &radic;f\'<sub>cp</sub> &rarr; <b>'+anFmt(+L.t,2)+'</b> MPa</label>'+(L.src==='std'?std:usr+' <button class="b" id="dg_lstd">Reset to code values</button>');
  } else {
    h+='<span>Tension: 0.25&radic;f\'<sub>c</sub> = <b>'+(DG.res&&DG.res.base?anFmt(DG.res.base.fct25,2):'—')+'</b> MPa, Cl 8.6.2 (uncracked) '+std+'</span>'
      +'<label>Compression (optional) '+inp('dg_lsc',S.kc)+' &times; f\'<sub>c</sub> = <b>'+(S.kc>0?anFmt(S.kc*Q.fcg,1)+' / '+anFmt(S.kc*Q.fcd,1):'—')+'</b> MPa (Super-T / deck)</label>'+(S.kc>0?usr:'<span class="dgg">no service compression limit set</span>');
  }
  return h+'</div>';
}
function dgAnLimBind(){
  var num=function(el){ var v=el.value.trim(); return v===''?null:Math.abs(+v); }, upd=function(){ dgLimSync(); DG.poiCache=null; dgSLSView(); dgAnView(); };
  if($('dg_lkc')){ $('dg_lkc').onchange=function(){ DG.trLim.kc=num(this); DG.trLim.src='user'; if(DG.trLim.kc===null) DG.trLim.c=null; upd(); }; $('dg_lkt').onchange=function(){ DG.trLim.kt=num(this); DG.trLim.src='user'; if(DG.trLim.kt===null) DG.trLim.t=null; upd(); };
    $('dg_ldist').onchange=function(){ DG.trLim.dist=this.value; if(DG.trLim.src==='std') upd(); else { DG.trLim.kc=this.value==='rect'?0.5:0.6; upd(); } };
    if($('dg_lstd')) $('dg_lstd').onclick=function(){ DG.trLim.src='std'; upd(); }; }
  if($('dg_lsc')) $('dg_lsc').onchange=function(){ DG.svLim.kc=num(this); upd(); };
}
var dgAnView0=dgAnView; dgAnView=function(){ dgLimSync(); dgAnView0(); dgAnLimBind(); };
