
/* ===== Super-T design (AS 5100.5:2017) — v17: design-tab section editor (shape, deck, strands, bars), to-scale drawing, step layout =====
   The design tab owns its section (DG.sec). It is seeded from the Hog Calculator tab and the model, then every dimension,
   strand and bar can be edited here. Units: mm, MPa, kN.                                                                  */
var DG={gi:0, tIdx:-1, sel:0, det:{svd:null,svn:null,svs:null,tvd:null,tvn:null,tvs:null,cs:null,ct:null,dg:null,fsyf:null,ex:false},
  lc:[], res:null, sec:null, mdl:null, fx:true, auto:false, view:null, sub:'shape', show:{str:1,gb:1,db:1,tie:1,cen:1,dim:1}};
var DG_PT=['Soffit outer corner','Soffit chamfer top','Web outer face &mdash; top','Top flange haunch','Flange underside &mdash; outer end','Flange tip chamfer','Flange top &mdash; tip','Top inner edge','Inner lip underside','Inner lip &mdash; web','Inner web &mdash; bottom (fillet)','Bottom flange top &mdash; centre'];

/* ---------- model + Hog seed ---------- */
function dgModel(){
  if(DG.mdl) return DG.mdl; var src=$('an_mct_src').textContent, M=AN.parseMCT(src), parts=csParts(src), g=[];
  for(var gi=0;gi<4;gi++){ var nm='G'+(gi+1)+'-M_composite', sid=Object.keys(M.secs).filter(function(k){ return M.secs[k].name===nm; })[0], p=sid?parts[sid]:null;
    g.push({H:p&&p[0]?(p[0].ztop+p[0].zbot)*1000:null, A:p&&p[0]?p[0].A*1e6:null, Wd:p&&p[1]?p[1].gross/P.slab*1000:null}); }
  DG.mdl={g:g, Eg:M.mats[1].E/1000, Ed:M.mats[2].E/1000, fcg:+(/(\d+)\s*MPa/.exec(M.mats[1].name)||[0,null])[1], fcd:+(/(\d+)\s*MPa/.exec(M.mats[2].name)||[0,null])[1], tD:P.slab*1000};
  return DG.mdl;
}
function dgSecInit(force, keepShape){
  if(DG.sec&&!force) return DG.sec;
  var s=dgSnap(), m=dgModel(), g=m.g[DG.gi], res=(s.r&&s.r.res)||[], ti=DG.tIdx<0?res.length-1:Math.min(DG.tIdx,res.length-1), Pm=ti>=0?res[ti].Pm:null, Ap=s.p.Ap, old=DG.sec;
  if(!s.R) throw new Error('The Hog Calculator section is not a Super-T');
  var Q={name:s.cur, R:JSON.parse(JSON.stringify(s.R)), tD:m.tD, Wd:g.Wd, fcg:m.fcg, Eg:m.Eg, fcd:m.fcd, Ed:m.Ed, Es:s.p.Es||200000, fsy:s.p.fsy||500,
    Ep:s.p.Ep, Ap:Ap, db:s.p.db, mbl:s.p.mbl, time:ti>=0?res[ti].label:'—',
    strands:s.S.map(function(t,i){ return {x:t.x, y:t.y, on:!!t.on, sp:Pm&&Pm[i]!=null?Pm[i]*1000/Ap:null}; }),
    gbars:s.B.map(function(b){ return {x:b.x, y:b.y, d:b.d}; }),
    dbars:old?old.dbars:[{pos:'top',d:null,s:null,c:null},{pos:'bot',d:null,s:null,c:null}]};
  if(old&&keepShape){ ['name','R','tD','Wd','fcg','Eg','fcd','Ed','Es','fsy','Ep','Ap','db','mbl','gbars'].forEach(function(k){ Q[k]=old[k]; });
    /* keep the user's strand layout, refresh only the stresses at the new time where the strand matches a Hog strand */
    Q.strands=old.strands.map(function(t){ var j=s.S.findIndex(function(h){ return Math.abs(h.x-t.x)<0.5&&Math.abs(h.y-t.y)<0.5; }); return {x:t.x,y:t.y,on:t.on,sp:j>=0&&Pm?Pm[j]*1000/Ap:t.sp}; }); }
  Q.orig=JSON.parse(JSON.stringify({name:Q.name,R:Q.R,tD:Q.tD,Wd:Q.Wd,fcg:Q.fcg,Eg:Q.Eg,fcd:Q.fcd,Ed:Q.Ed,Es:Q.Es,fsy:Q.fsy,Ep:Q.Ep,Ap:Q.Ap,db:Q.db,mbl:Q.mbl,strands:s.S.length,gbars:s.B.length}));
  Q.edited=old&&keepShape?old.edited:{};
  DG.sec=Q; return Q;
}
function dgH(R){ return Math.max.apply(null,R.map(function(p){ return p[1]; })); }
function dgPoly(R){ return [[0,0]].concat(R.map(function(p){ return p.slice(); }), R.slice(0,-1).reverse().map(function(p){ return [-p[0],p[1]]; })); }
function dgPolyProps(P){ var A=0,Sy=0,Ix=0; for(var i=0;i<P.length;i++){ var a=P[i], b=P[(i+1)%P.length], c=a[0]*b[1]-b[0]*a[1]; A+=c; Sy+=(a[1]+b[1])*c; Ix+=c*(a[1]*a[1]+a[1]*b[1]+b[1]*b[1]); }
  A/=2; var yc=Sy/(6*A); return {A:A, yb:yc, I:Ix/12-A*yc*yc}; }
function dgInPoly(P,x,y){ var c=false; for(var i=0,j=P.length-1;i<P.length;j=i++){ var a=P[i], b=P[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c; }
function dgEdgeDist(P,x,y){ var m=1e9; for(var i=0;i<P.length;i++){ var a=P[i], b=P[(i+1)%P.length], dx=b[0]-a[0], dy=b[1]-a[1], L2=dx*dx+dy*dy, t=L2?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/L2)):0;
  m=Math.min(m,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)); } return m; }
/* clear cover of a bar of diameter d centred at (x,y above soffit); negative = outside the Super-T */
function dgCover(P,x,y,d){ var e=dgEdgeDist(P,x,y); return dgInPoly(P,x,y)?e-d/2:-(e+d/2); }
/* deck bars: n = floor(W / s) bars centred on the girder; y from the deck top */
function dgDeckBarPos(Q){ var out=[]; Q.dbars.forEach(function(r,li){ if(!(r.d>0&&r.s>0&&r.c>=0&&r.c!==null)) return; var n=Math.max(1,Math.floor(Q.Wd/r.s)), y=r.pos==='top'?r.c+r.d/2:Q.tD-r.c-r.d/2;
  for(var i=0;i<n;i++) out.push({x:-(n-1)*r.s/2+i*r.s, y:y, d:r.d, li:li, n:n}); }); return out; }
function dgFpb(Q){ return Q.mbl&&Q.Ap?Q.mbl*1000/Q.Ap:null; }

/* ---------- engine section from DG.sec ---------- */
function dgSection(){
  var Q=dgSecInit(), H=dgH(Q.R), Pg=dgPoly(Q.R), tD=Q.tD, Wd=Q.Wd, fpb=dgFpb(Q);
  if(!(Wd>0)) throw new Error('Deck width is missing');
  var conc=DSG.stripsFromPolygon(Pg,H,tD,Q.Eg,Q.fcg,'g',3).concat(DSG.stripsFromLayers([{h:tD,b1:Wd,b2:Wd,E:Q.Ed,fc:Q.fcd,grp:'d'}],3));
  var gb=Q.gbars.map(function(b){ return {y:tD+H-b.y, A:Math.PI*b.d*b.d/4, E:Q.Es, fsy:Q.fsy, grp:'g', d:b.d, x:b.x}; });
  var db=[]; Q.dbars.forEach(function(r){ if(!(r.d>0&&r.s>0&&r.c!==null&&r.c>=0)) return; var n=Math.max(1,Math.floor(Wd/r.s)), y=r.pos==='top'?r.c+r.d/2:tD-r.c-r.d/2; db.push({y:y, A:n*Math.PI*r.d*r.d/4, E:Q.Es, fsy:Q.fsy, grp:'d', n:n, d:r.d}); });
  var tend=Q.strands.filter(function(t){ return t.on; }).map(function(t){ return {y:tD+H-t.y, A:Q.Ap, E:Q.Ep, fpb:fpb, eu:0.035, sp:t.sp, grp:'g', x:t.x}; });
  var pp=dgPolyProps(Pg);
  var info={sec:Q.name, H:H, A:pp.A, I:pp.I, yb:pp.yb, tD:tD, Wd:Wd, Eg:Q.Eg, Ed:Q.Ed, fcg:Q.fcg, fcd:Q.fcd, Ap:Q.Ap, Ep:Q.Ep, fpb:fpb, nS:tend.length, nB:gb.length, time:Q.time, fsy:Q.fsy, Es:Q.Es, mbl:Q.mbl, db:Q.db};
  return {S:{conc:conc, bars:gb.concat(db), tend:tend}, info:info, Pg:Pg, R:Q.R, deckBars:db};
}

/* ---------- layout ---------- */
var DG_STEPS=[['0','Summary','Pass / fail and governing utilisations for every load case'],['1','Section and reinforcement','Super-T shape, deck slab, strands and bars &mdash; all editable, drawn to scale'],
  ['2','Materials and derived parameters','Concrete, steel and strand properties, stress-block factors, crack-control targets'],['3','Load cases','Stations along the girder, actions from the model and the factored design actions'],
  ['4','SLS &mdash; crack control','Staged stresses, decompression, allowable SLS moment (Cl 8.6.2)'],['5','ULS &mdash; bending','Strain compatibility, &phi;M<sub>u</sub>, ductility, minimum strength, N&ndash;M diagram (Cl 8.1)'],
  ['6','ULS &mdash; shear and torsion','General method, capacities, utilisations, minimum reinforcement, V&ndash;M diagram (Cl 8.2)'],['7','Along the girder','Debonding and transmission, transfer, SLS and ULS envelopes, critical sections'],['8','Engine benchmark','This engine re-run on the reference spreadsheet example']];
function dgBuild(){
  var pane=$('paneDG'); if(pane.dataset.built) return; pane.dataset.built=1;
  var ids=['dg_sum','dg_s1','dg_gen','dg_lc','dg_sls','dg_ulb','dg_v6','dg_gird','dg_bm'];
  pane.innerHTML='<div class="dgwrap'+(DG.fx?'':' dgnofx')+'" id="dg_wrap"><nav class="dgnav" id="dg_nav">'+DG_STEPS.map(function(s,i){ return '<a href="javascript:void 0" data-i="'+i+'"><span class="dgn">'+s[0]+'</span><span class="dgt2">'+s[1]+'</span><span class="dgchip" id="dg_ch'+i+'"></span></a>'; }).join('')+'</nav><div class="dgmain">'
   +'<div class="dgbar"><label>Girder <select id="dg_g"><option value="0">G1</option><option value="1">G2</option><option value="2">G3</option><option value="3">G4</option></select></label>'
   +'<label>Prestress at <select id="dg_t"></select></label><button class="b" id="dg_fill">&#9654; Fill load cases from the model</button><button class="b" id="dg_run">Run checks</button>'
   +'<button class="b dgx1" id="dg_xl" title="Workbook with live formulas: inputs, section strips, SLS, ULS, shear and summary">&#11015; Excel (live formulas)</button><button class="b dgx1" id="dg_rep" title="Printable calculation report with every table, drawing, plot and worked calculation">&#128196; Calculation report</button><button class="b dgx1" id="dg_docx" title="Word (.docx) calculation report: inputs, every check line with substitution and clause reference, figures, summary, needs-review list">&#128462; Word report (.docx)</button>'
   +'<label class="v3dchk"><input type="checkbox" id="dg_fx"'+(DG.fx?' checked':'')+'> Show formulas</label><span class="n" id="dg_st"></span>'
   +'<div class="dglegend"><span class="tg tD">Direct</span> from drawings / model &nbsp; <span class="tg tC">Calculated</span> &nbsp; <span class="tg tS">Standard &mdash; verify</span> &nbsp; <span class="tg tU">Input (user)</span> &nbsp; <span class="tg" style="color:var(--flag)">Missing &mdash; Flagged</span> &nbsp; <span class="dgin">shaded</span> = editable</div></div>'
   +DG_STEPS.map(function(s,i){ return '<section class="dgcard" id="dg_c'+i+'"><header class="dghd"><span class="dgnum">'+s[0]+'</span><div><h3>'+s[1]+'</h3><p>'+s[2]+'</p></div><span class="dgchip" id="dg_hc'+i+'"></span></header><div class="dgbody">'
      +(i===6?'<div id="dg_det"></div><div id="dg_ulv"></div>':'<div id="'+ids[i]+'"></div>')+'</div></section>'; }).join('')+'</div></div>';
  [].forEach.call(pane.querySelectorAll('.dgnav a'),function(a){ a.onclick=function(){ var c=$('dg_c'+a.getAttribute('data-i')); if(c) c.scrollIntoView({behavior:'smooth',block:'start'}); }; });
  $('dg_g').value=DG.gi; $('dg_g').onchange=function(){ DG.gi=+$('dg_g').value; var k=DG.sec; DG.sec=null; try{ dgSecInit(true); if(k) DG.sec.dbars=k.dbars; }catch(e){} DG.res=null; dgAll(); dgAutoRun(); };
  $('dg_fill').onclick=dgFill; $('dg_run').onclick=dgRun; $('dg_xl').onclick=function(){ dgExportXL(); }; $('dg_rep').onclick=function(){ dgReport(); }; $('dg_docx').onclick=function(){ dgDocx().catch(function(e){ $('dg_st').textContent='Word report failed: '+e.message; console.error(e); }); }; $('dg_fx').onchange=function(){ DG.fx=$('dg_fx').checked; $('dg_wrap').classList.toggle('dgnofx',!DG.fx); };
  dgTimeSel(); dgAll(); setTimeout(dgBench,30);
}
function dgTimeSel(){ var sel=$('dg_t'), s=dgSnap(), res=(s.r&&s.r.res)||[];
  sel.innerHTML=res.map(function(q,i){ return '<option value="'+i+'"'+((DG.tIdx<0?i===res.length-1:i===DG.tIdx)?' selected':'')+'>'+q.label+'</option>'; }).join('');
  sel.onchange=function(){ DG.tIdx=+sel.value; dgSecInit(true,true); DG.res=null; dgAll(); dgAutoRun(); }; }
var dgAutoT=null;
function dgAutoRun(){ if(!DG.auto) return; clearTimeout(dgAutoT); dgAutoT=setTimeout(function(){ dgRun(true); },250); }
function dgAll(){ var X=null, B=null; try{ X=dgSection(); B=dgBase(X); }catch(e){ $('dg_s1').innerHTML='<div class="bbnote bbflag">'+e.message+'</div>'; }
  dgS1(X,B); dgGenView(X,B); dgLCView(); dgSLSView(); dgULBView(); dgDetView(X,B); dgULVView(); dgSumView(); dgGirdView(); dgChips(); }
function dgSec1Only(){ var X=null,B=null; try{ X=dgSection(); B=dgBase(X); }catch(e){} DG.res=null; dgS1(X,B); dgGenView(X,B); dgAutoRun(); if(!DG.auto){ dgSLSView(); dgULBView(); dgDetView(X,B); dgULVView(); dgSumView(); } dgChips(); }

/* ---------- step 1: section editor ---------- */
function dgS1(X,B){
  var box=$('dg_s1'); if(!X){ return; } var Q=DG.sec, I=X.info, m=dgModel(), g=m.g[DG.gi];
  var warn=[]; if(g.H&&Math.abs(g.H-I.H)>5) warn.push('Super-T depth '+dgF(I.H,0)+' mm &ne; model girder '+dgF(g.H,0)+' mm');
  if(g.A&&Math.abs(g.A-I.A)/g.A>0.03) warn.push('Super-T area '+dgF(I.A/1e6,4)+' m&sup2; &ne; model girder '+dgF(g.A/1e6,4)+' m&sup2;');
  if(!I.fpb) warn.push('strand breaking load (MBL) missing');
  var bad=dgBadItems(X); bad.forEach(function(b){ warn.push(b); }); DG.warn=warn;
  if(!box.dataset.built){ box.dataset.built=1;
    box.innerHTML='<div class="dgsecgrid"><div class="dgfig"><div class="dgtools"><button class="b" data-z="fit">Fit</button><button class="b" data-z="bot">Bottom flange</button><button class="b" data-z="top">Deck + top flange</button><button class="b" data-z="in">+</button><button class="b" data-z="out">&minus;</button><span class="dgseg"><button class="b'+(DG.vsec==='open'?' on':'')+'" data-v="open">Open (span)</button><button class="b'+(DG.vsec==='solid'?' on':'')+'" data-v="solid">Solid end block</button></span>'
      +'<span class="dgshow">'+[['par','parameters'],['str','strands'],['gb','girder bars'],['db','deck bars'],['tie','closed tie'],['cen','centroids'],['dim','dimensions']].map(function(q){ return '<label><input type="checkbox" data-sh="'+q[0]+'"'+(DG.show[q[0]]?' checked':'')+'> '+q[1]+'</label>'; }).join('')+'</span></div>'
      +'<div class="dgsvgbox"><svg id="dg_svg" class="dgsec" preserveAspectRatio="xMidYMid meet"></svg><div id="dg_tip" class="dgtip" hidden></div></div>'
      +'<div class="bbnote">To scale; every bar and strand is drawn at its true diameter and position. Scroll to zoom, drag to pan, hover for details, strands and bars are set in <b>Properties &rarr; Girder definition</b>.</div></div>'
      +'<div class="dgside" id="dg_side"></div></div>'
      +'<div class="msbar dgdefl"><span class="n">Edit the girder in <b>Properties &rarr; Girder definition</b>:</span>'+[['gird','Girder &amp; supports'],['shape','Section shape &amp; deck'],['zone','Sections along girder'],['tend','Tendons'],['reinf','Reinforcement'],['fit','Fitments']].map(function(q){ return '<button class="b" data-go="'+q[0]+'">'+q[1]+'</button>'; }).join('')+'</div><div id="dg_ed" hidden></div>';
    [].forEach.call(box.querySelectorAll('[data-z]'),function(b){ b.onclick=function(){ dgZoom(b.getAttribute('data-z')); }; });
    [].forEach.call(box.querySelectorAll('[data-v]'),function(b){ b.onclick=function(){ DG.vsec=b.getAttribute('data-v'); [].forEach.call(box.querySelectorAll('[data-v]'),function(x){ x.classList.toggle('on',x===b); }); dgSec1Only(); }; });
    [].forEach.call(box.querySelectorAll('[data-sh]'),function(c){ c.onchange=function(){ DG.show[c.getAttribute('data-sh')]=c.checked?1:0; dgDraw(); }; });
    [].forEach.call(box.querySelectorAll('#dg_subt button'),function(b){ b.onclick=function(){ DG.sub=b.getAttribute('data-s'); [].forEach.call(box.querySelectorAll('#dg_subt button'),function(x){ x.classList.toggle('on',x===b); }); dgEditor(); }; });
    dgSvgBind(); }
  DG.X=X; DG.B=B; dgDraw(); dgSide(X,B,warn); dgEditor();
}
function dgBadItems(X){ var Q=DG.sec, P=X.Pg, out=[];
  Q.strands.forEach(function(t){ if(t.on&&dgCover(P,t.x,t.y,Q.db)<0) out.push('strand at ('+t.x+', '+t.y+') is outside the Super-T'); });
  Q.gbars.forEach(function(b){ if(dgCover(P,b.x,b.y,b.d)<0) out.push('bar &Oslash;'+b.d+' at ('+b.x+', '+b.y+') is outside the Super-T'); });
  return out.slice(0,6); }
function dgSide(X,B,warn){
  var I=X.info, Q=DG.sec, m=dgModel(), g=m.g[DG.gi], db=dgDeckBarPos(Q), on=Q.strands.filter(function(t){ return t.on; }), Aps=on.length*Q.Ap;
  var sp=on.map(function(t){ return t.sp; }).filter(function(v){ return v; }), spm=sp.length?sp.reduce(function(a,b){ return a+b; },0)/sp.length:null;
  var Ag=0; Q.gbars.forEach(function(b){ Ag+=Math.PI*b.d*b.d/4; }); var Ad=0; db.forEach(function(b){ Ad+=Math.PI*b.d*b.d/4; });
  var row=function(a,b,c){ return '<tr><td class="l">'+a+'</td><td class="v">'+b+'</td><td class="l">'+(c||'')+'</td></tr>'; };
  var h='<table class="dt dgt dgkv"><tr><th class="l" colspan="3">'+(dgEdited('shape')?'Custom shape (from '+Q.name+') <span class="tg tU">edited</span>':Q.name)+(X.solid?' &mdash; <b>solid end block</b>':' &mdash; open (span)')+'</th></tr>'
   +row('Super-T depth H',dgF(I.H,0)+' mm',g.H?'model '+dgF(g.H,0):'')
   +row('Super-T area A<sub>g</sub>',dgF(I.A/1e6,4)+' m&sup2;',g.A?'model '+dgF(g.A/1e6,4):'')
   +row('Centroid above soffit y<sub>b</sub>',dgF(I.yb,0)+' mm','')
   +row('Second moment I<sub>g</sub>',dgF(I.I/1e12,4)+' m&#8308;','')
   +row('Deck t &times; width',dgF(I.tD,0)+' &times; '+dgF(I.Wd,0)+' mm','')
   +(B?row('Composite area / I (to E<sub>c,ST</sub>)',dgF(B.ec.A/1e6,4)+' m&sup2; / '+dgF(B.ec.I/1e12,4)+' m&#8308;','')+row('Composite centroid below deck top',dgF(B.ec.yc,0)+' mm',''):'')
   +'<tr><th class="l" colspan="3">Prestress and reinforcement</th></tr>'
   +row('Strands (on)',on.length+' &times; '+Q.Ap+' mm&sup2; = '+dgF(Aps,0)+' mm&sup2;','&Oslash;'+Q.db)
   +row('&sigma;<sub>pe</sub> after losses',spm?dgF(spm,0)+' MPa mean':'<span class="bbflag">missing</span>',Q.time)
   +row('P after losses / e<sub>p</sub>',B?dgF(B.Pt,0)+' kN / '+dgF(B.ep,0)+' mm':'—','below Super-T centroid')
   +row('Super-T bars',Q.gbars.length+' bars, '+dgF(Ag,0)+' mm&sup2;','')
   +row('Deck bars',db.length?db.length+' bars, '+dgF(Ad,0)+' mm&sup2;':'<span class="bbflag">not entered</span>','')+'</table>';
  if(warn.length) h+='<div class="bbnote bbflag" style="margin-top:8px">'+warn.join('<br>')+'</div>';
  $('dg_side').innerHTML=h;
}
function dgEdited(k){ return DG.sec&&DG.sec.edited&&DG.sec.edited[k]; }
function dgMark(k){ DG.sec.edited[k]=1; }

/* ---- drawing ---- */
function dgExt(){ var Q=DG.sec, H=dgH(Q.R), W=Math.max(Q.Wd||0, 2*Math.max.apply(null,dgRv().map(function(p){ return p[0]; }))); return {W:W, H:H, D:Q.tD+H}; }
function dgZoom(z){ var e=dgExt(), v=DG.view, pad=e.W*0.08;
  if(z==='fit'||!v) DG.view={x:-e.W/2-pad, y:-pad*0.8, w:e.W+2*pad, h:e.D+pad*1.8};
  if(z==='bot'){ var bw=DG.sec.P.Bb+300, tb=DG.sec.P.tb+DG.sec.P.tt; DG.view={x:-bw/2, y:e.D-tb-250, w:bw, h:tb+330}; }
  if(z==='top'){ DG.view={x:-e.W/2-60, y:-80, w:e.W+120, h:DG.sec.tD+(e.H-DG.sec.R[3][1])+260}; }
  if(z==='in'||z==='out'){ var f=z==='in'?0.7:1/0.7, cx=v.x+v.w/2, cy=v.y+v.h/2; DG.view={x:cx-v.w*f/2, y:cy-v.h*f/2, w:v.w*f, h:v.h*f}; }
  dgDraw(); }
function dgSvgBind(){
  var svg=$('dg_svg'), drag=null;
  var toW=function(ev){ var r=svg.getBoundingClientRect(), v=DG.view, s=Math.max(v.w/r.width, v.h/r.height), ox=(r.width-v.w/s)/2, oy=(r.height-v.h/s)/2; return {x:v.x+(ev.clientX-r.left-ox)*s, y:v.y+(ev.clientY-r.top-oy)*s, s:s}; };
  svg.addEventListener('wheel',function(ev){ ev.preventDefault(); var p=toW(ev), f=ev.deltaY<0?0.85:1/0.85, v=DG.view; DG.view={x:p.x-(p.x-v.x)*f, y:p.y-(p.y-v.y)*f, w:v.w*f, h:v.h*f}; dgDraw(); },{passive:false});
  svg.addEventListener('mousedown',function(ev){ drag={p:toW(ev), v:Object.assign({},DG.view), moved:false}; });
  window.addEventListener('mouseup',function(){ setTimeout(function(){ drag=null; },0); });
  svg.addEventListener('mousemove',function(ev){
    if(drag&&ev.buttons){ var r=svg.getBoundingClientRect(), s=Math.max(drag.v.w/r.width,drag.v.h/r.height); if(!drag.x0){ drag.x0=ev.clientX; drag.y0=ev.clientY; }
      var dx=(ev.clientX-drag.x0)*s, dy=(ev.clientY-drag.y0)*s; if(Math.abs(dx)+Math.abs(dy)>2/1) drag.moved=true; DG.view={x:drag.v.x-dx, y:drag.v.y-dy, w:drag.v.w, h:drag.v.h}; dgDraw(); return; }
    var t=ev.target, k=t.getAttribute&&t.getAttribute('data-k'), tip=$('dg_tip');
    if(!k){ tip.hidden=true; return; } tip.innerHTML=dgTipText(k); tip.hidden=false; var r2=svg.parentNode.getBoundingClientRect(); tip.style.left=(ev.clientX-r2.left+14)+'px'; tip.style.top=(ev.clientY-r2.top+10)+'px'; });
  svg.addEventListener('mouseleave',function(){ $('dg_tip').hidden=true; });
  svg.addEventListener('click',function(ev){ if(drag&&drag.moved) return; var k=ev.target.getAttribute&&ev.target.getAttribute('data-k'); /* strands are switched on / off in Properties → Strands & reinforcement */ });
}
function dgTipText(k){ var Q=DG.sec, P=dgPoly(dgRv()), a=k.split(':');
  if(a[0]==='s'){ var t=Q.strands[+a[1]]; return '<b>Strand '+(+a[1]+1)+'</b> &Oslash;'+Q.db+' ('+Q.Ap+' mm&sup2;) '+(t.on?'':'<span class="bbflag">off</span>')+'<br>x = '+t.x+', y = '+t.y+' mm above soffit<br>&sigma;<sub>pe</sub> = '+dgF(t.sp,0)+' MPa ('+Q.time+')<br>clear cover '+dgF(dgCover(P,t.x,t.y,Q.db),0)+' mm'; }
  if(a[0]==='b'){ var b=Q.gbars[+a[1]]; return '<b>Super-T bar</b> N'+b.d+' ('+dgF(Math.PI*b.d*b.d/4,0)+' mm&sup2;)<br>x = '+b.x+', y = '+b.y+' mm above soffit<br>clear cover '+dgF(dgCover(P,b.x,b.y,b.d),0)+' mm'; }
  if(a[0]==='d'){ var r=Q.dbars[+a[1]], n=Math.max(1,Math.floor(Q.Wd/r.s)); return '<b>Deck bar</b> N'+r.d+' @ '+r.s+' ('+r.pos+')<br>'+n+' bars over '+dgF(Q.Wd,0)+' mm = '+dgF(n*Math.PI*r.d*r.d/4,0)+' mm&sup2;<br>cover '+r.c+' mm, centre '+dgF(r.pos==='top'?r.c+r.d/2:r.c+r.d/2,0)+' mm from the '+(r.pos==='top'?'deck top':'deck soffit'); }
  if(a[0]==='c') return a[1]==='g'?'Super-T centroid (alone)':'Composite centroid (transformed)';
  return ''; }
function dgDraw(){
  var svg=$('dg_svg'); if(!svg||!DG.sec) return; if(!DG.view) dgZoom('fit');
  var Q=DG.sec, v=DG.view, e=dgExt(), H=e.H, tD=Q.tD, Wd=Q.Wd, Y=function(yUp){ return tD+H-yUp; }, fs=v.w/55, sw=v.w/900, g='';
  svg.setAttribute('viewBox',v.x+' '+v.y+' '+v.w+' '+v.h);
  g+='<defs><pattern id="dghat" width="'+(fs*0.9)+'" height="'+(fs*0.9)+'" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="'+(fs*0.9)+'" stroke="var(--line)" stroke-width="'+sw+'"/></pattern></defs>';
  g+='<rect x="'+(-Wd/2)+'" y="0" width="'+Wd+'" height="'+tD+'" fill="var(--dgdeck)" stroke="var(--fg)" stroke-width="'+(1.4*sw)+'"/><rect x="'+(-Wd/2)+'" y="0" width="'+Wd+'" height="'+tD+'" fill="url(#dghat)"/>';
  g+='<path d="M'+dgPoly(dgRv()).map(function(p){ return p[0].toFixed(2)+','+Y(p[1]).toFixed(2); }).join('L')+'Z" fill="var(--dgconc)" stroke="var(--fg)" stroke-width="'+(1.4*sw)+'"/>';
  var B=DG.B, G=B?B.geo:null;
  if(DG.show.tie&&G&&G.lig) g+='<path d="M'+G.lig.map(function(p){ return p[0].toFixed(1)+','+p[1].toFixed(1); }).join('L')+'Z" fill="none" stroke="var(--calc)" stroke-width="'+(1.5*sw)+'" stroke-dasharray="'+(6*sw*4)+' '+(3*sw*4)+'"/>';
  if(DG.show.cen&&B){ [[B.eg.yc,'g','Super-T centroid'],[B.ec.yc,'c','composite centroid']].forEach(function(q){ g+='<line x1="'+(-e.W/2)+'" x2="'+(e.W/2)+'" y1="'+q[0]+'" y2="'+q[0]+'" stroke="'+(q[1]==='g'?'var(--muted)':'var(--instr)')+'" stroke-width="'+sw+'" stroke-dasharray="'+(10*sw*3)+' '+(5*sw*3)+'"/>'
    +'<line data-k="c:'+q[1]+'" x1="'+(-e.W/2)+'" x2="'+(e.W/2)+'" y1="'+q[0]+'" y2="'+q[0]+'" stroke="transparent" stroke-width="'+(8*sw)+'"/><text x="'+(e.W/2-fs*0.3)+'" y="'+(q[0]-fs*0.3)+'" text-anchor="end" font-size="'+(fs*0.75)+'" fill="'+(q[1]==='g'?'var(--muted)':'var(--instr)')+'">'+q[2]+' '+dgF(q[0],0)+'</text>'; }); }
  if(DG.show.db) dgDeckBarPos(Q).forEach(function(b){ g+='<circle data-k="d:'+b.li+'" cx="'+b.x+'" cy="'+b.y+'" r="'+(b.d/2)+'" fill="var(--eng)" stroke="var(--bg)" stroke-width="'+(0.6*sw)+'"/>'; });
  if(DG.show.gb) Q.gbars.forEach(function(b,i){ g+='<circle data-k="b:'+i+'" cx="'+b.x+'" cy="'+Y(b.y)+'" r="'+(b.d/2)+'" fill="var(--eng)" stroke="var(--bg)" stroke-width="'+(0.6*sw)+'"/>'; });
  if(DG.show.str) Q.strands.forEach(function(t,i){ g+='<circle data-k="s:'+i+'" cx="'+t.x+'" cy="'+Y(t.y)+'" r="'+(Q.db/2)+'" fill="'+(t.on?((t.dL||t.dR)&&window.HOG_DBCOL?HOG_DBCOL(t.dL,t.dR):'var(--instr)'):'var(--bg)')+'" stroke="var(--instr)" stroke-width="'+(t.on?0.6*sw:1.4*sw)+'" style="cursor:pointer"/>'; });
  if(DG.show.dim){ var dim=function(x1,y1,x2,y2,txt,off,vert){ var o=off*fs; if(vert){ var xx=x1+o; return '<line x1="'+x1+'" y1="'+y1+'" x2="'+xx+'" y2="'+y1+'" stroke="var(--muted)" stroke-width="'+(0.6*sw)+'"/><line x1="'+x2+'" y1="'+y2+'" x2="'+xx+'" y2="'+y2+'" stroke="var(--muted)" stroke-width="'+(0.6*sw)+'"/><line x1="'+xx+'" y1="'+y1+'" x2="'+xx+'" y2="'+y2+'" stroke="var(--fg)" stroke-width="'+sw+'" marker-start="url(#dga)" marker-end="url(#dga)"/><text transform="translate('+(xx-fs*0.35)+' '+((y1+y2)/2)+') rotate(-90)" text-anchor="middle" font-size="'+(fs*0.8)+'" fill="var(--fg)">'+txt+'</text>'; }
      var yy=y1+o; return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x1+'" y2="'+yy+'" stroke="var(--muted)" stroke-width="'+(0.6*sw)+'"/><line x1="'+x2+'" y1="'+y2+'" x2="'+x2+'" y2="'+yy+'" stroke="var(--muted)" stroke-width="'+(0.6*sw)+'"/><line x1="'+x1+'" y1="'+yy+'" x2="'+x2+'" y2="'+yy+'" stroke="var(--fg)" stroke-width="'+sw+'" marker-start="url(#dga)" marker-end="url(#dga)"/><text x="'+((x1+x2)/2)+'" y="'+(yy-fs*0.3)+'" text-anchor="middle" font-size="'+(fs*0.8)+'" fill="var(--fg)">'+txt+'</text>'; };
    g+='<defs><marker id="dga" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,2 L5,5 L0,8" fill="none" stroke="var(--fg)" stroke-width="1.2"/></marker></defs>';
    var R=dgRv(), PP=Q.P; g+=dim(-Wd/2,0,Wd/2,0,'deck '+dgF(Wd,0),-1.6)+dim(-R[0][0],Y(0),R[0][0],Y(0),'soffit '+dgF(2*R[0][0],0),1.6)+dim(-R[6][0],Y(R[4][1]),R[6][0],Y(R[4][1]),'top flange '+dgF(2*R[6][0],0),1.4)
      +dim(-Wd/2,0,-Wd/2,tD,dgF(tD,0),-1.4,true)+dim(-e.W/2,tD,-e.W/2,tD+H,'H = '+dgF(H,0),-2.8,true)+dim(R[0][0],Y(0),R[0][0],Y(PP.tb),'t<tspan font-size="70%">b</tspan> '+dgF(PP.tb,0),2.2,true); }
  if(DG.show.par) g+=dgParLabels(Y,fs,sw);
  /* scale bar */
  var sb=Math.pow(10,Math.floor(Math.log10(v.w/5))); g+='<g transform="translate('+(v.x+fs)+' '+(v.y+v.h-fs)+')"><rect x="0" y="'+(-fs*0.25)+'" width="'+sb+'" height="'+(fs*0.25)+'" fill="var(--fg)"/><text x="'+(sb+fs*0.4)+'" y="0" font-size="'+(fs*0.7)+'" fill="var(--muted)">'+sb+' mm</text></g>';
  svg.innerHTML=g;
}

/* ---- editors ---- */
function dgEditor(){
  if(!DG._edT){ var e0=$('dg_ed'); if(e0) e0.innerHTML=''; return; }   /* editors live in Properties → Girder definition */
  if(['shape','zone','deck','deb'].indexOf(DG.sub)<0&&!DG._edT) DG.sub='shape';
  var Q=DG.sec, ed=$(DG._edT||'dg_ed'); if(!Q||!ed) return; var h='', inp=function(k,v,w,cls){ return '<input class="f '+(cls||'dge')+'" data-k="'+k+'" value="'+(v===null||v===undefined?'':v)+'" style="width:'+(w||80)+'px">'; };
  var tag=function(isUser,missing){ return missing?DGTAG.M:(isUser?DGTAG.U:DGTAG.D); };
  if(DG.sub==='shape'){
    var lib={}; try{ lib=HOG_API.lib(); }catch(e){} var P=Q.P, O=Q.orig.P, sl=1/P.n, csn=Math.cos(Math.atan(sl));
    var yT=P.D-P.sd, Wv=2*(P.Bb/2+sl*yT-P.twT/csn+P.sw), Wvb=2*(P.Bb/2+sl*(P.tb+P.tt)-P.twB/csn);
    h='<div class="dged"><div><div class="sdh">Start from a standard shape</div><div class="msbar"><select id="dg_lib">'+Object.keys(lib).map(function(k){ return '<option'+(k===Q.name?' selected':'')+'>'+k+'</option>'; }).join('')+'</select><button class="b" id="dg_libgo">Load shape</button><button class="b" id="dg_hogre">Reset all to Hog tab</button></div>'
     +'<div class="sdh">Super-T parameters (the drawing labels each one)</div><table class="dt dgt dgkv"><tr><th class="l">Parameter</th><th>Value</th><th class="l">Unit</th><th class="l">Tag</th></tr>'
     +DG_PAR.map(function(q){ var v=P[q[0]], ch=Math.abs(v-O[q[0]])>1e-6; return '<tr class="dgi" title="'+q[3]+'"><td class="l"><b>'+q[0]+'</b> &nbsp;'+q[1]+'<div class="dgg">'+q[3]+'</div></td><td class="v">'+inp('P:'+q[0],dgF(v,q[0]==='n'?3:1),76)+'</td><td class="l">'+q[2]+'</td><td class="l">'+(ch?DGTAG.U:DGTAG.D+' <span class="dgg">Hog tab</span>')+'</td></tr>'; }).join('')
     +'<tr><td class="l">Web angle from horizontal (derived)</td><td class="v">'+dgF(Math.atan(P.n)*180/Math.PI,2)+'&deg;</td><td class="l"></td><td class="l">'+DGTAG.C+'</td></tr>'
     +'<tr><td class="l">Top opening (Bondek void) width (derived)</td><td class="v">'+dgF(Wv,1)+'</td><td class="l">mm</td><td class="l">'+DGTAG.C+'</td></tr>'
     +'<tr><td class="l">Void width at the bottom-flange taper (derived)</td><td class="v">'+dgF(Wvb,1)+'</td><td class="l">mm</td><td class="l">'+DGTAG.C+'</td></tr></table>'
     +'<div class="bbnote">'+(dgEdited('shape')?DGTAG.U+' shape edited in this tab (from '+Q.orig.name+')':DGTAG.D+' shape from the Hog Calculator tab ('+Q.orig.name+')')+'. The BR13A girder drawing defines the real section &mdash; check against it. Changing D moves the top flange and every strand / bar in the upper half with it.</div></div>'
     +'<div><div class="sdh">Solid sections</div><div class="bbnote">Where the girder is solid is set in <b>Girder definition &rarr; Sections along girder</b>. The solid section has the same outside shape as the span section, with the trough filled (no void, no Bondek seat). Use <b>Open / Solid end block</b> above the drawing to view either.</div>'
     +'<details class="dgdet"><summary>Derived outline points (half section, x from centreline, y above soffit)</summary><div class="dgx"><table class="dt dgt"><tr><th>#</th><th class="l">Point</th><th>x open</th><th>y open</th></tr>'
     +Q.R.map(function(p,i){ return '<tr><td>'+(i+1)+'</td><td class="l">'+DG_PT[i]+'</td><td class="v">'+dgF(p[0],1)+'</td><td class="v">'+dgF(p[1],1)+'</td></tr>'; }).join('')+'</table></div></details></div></div>';
  }
  if(DG.sub==='deck'){ var m=dgModel(), g=m.g[DG.gi];
    h='<table class="dt dgt dgkv" style="max-width:820px"><tr><th class="l">Deck slab</th><th>Value</th><th class="l">Source</th></tr>'
     +'<tr class="dgi"><td class="l">Thickness t<sub>D</sub> (mm)</td><td class="v">'+inp('tD',Q.tD)+'</td><td class="l">'+tag(Q.tD!==Q.orig.tD)+' deck section</td></tr>'
     +'<tr class="dgi"><td class="l">Width acting with this girder (mm)</td><td class="v">'+inp('Wd',dgF(Q.Wd,0))+'</td><td class="l">'+(Math.abs(Q.Wd-g.Wd)>0.5?DGTAG.U:DGTAG.C+' model composite section G'+(DG.gi+1))+' &mdash; effective-width reduction not applied [check]</td></tr>'
     +'<tr class="dgi"><td class="l">Deck f&prime;<sub>c</sub> (MPa)</td><td class="v">'+inp('fcd',Q.fcd)+'</td><td class="l">'+tag(Q.fcd!==Q.orig.fcd)+' Materials M2</td></tr>'
     +'<tr class="dgi"><td class="l">Deck E<sub>c</sub> (MPa)</td><td class="v">'+inp('Ed',Q.Ed)+'</td><td class="l">'+tag(Q.Ed!==Q.orig.Ed)+' Materials M2</td></tr></table>';
  }
  if(DG.sub==='str'){
    var rows=dgGroup(Q.strands,function(t){ return dgF(t.y,1); }), P=dgPoly(Q.R);
    h='<div class="msbar"><label>Strand area A<sub>p</sub> '+inp('Ap',Q.Ap,64)+' mm&sup2;</label><label>Diameter '+inp('db',Q.db,56)+' mm</label><label>MBL '+inp('mbl',Q.mbl,64)+' kN</label><label>E<sub>p</sub> '+inp('Ep',Q.Ep,76)+' MPa</label><span class="n">f<sub>pb</sub> = MBL/A<sub>p</sub> = '+dgF(dgFpb(Q),0)+' MPa</span></div>'
     +'<div class="dgx"><table class="dt dgt"><tr><th>Row</th><th>y above soffit (mm)</th><th class="l">x positions &mdash; strands ON (mm; &plusmn;a = symmetric pair)</th><th class="l">x positions &mdash; OFF</th><th>No. on</th><th>&sigma;<sub>pe</sub> (MPa)</th><th>Force (kN)</th><th>Min. clear cover</th><th></th></tr>'
     +rows.map(function(r,i){ var on=r.items.filter(function(t){ return t.on; }), off=r.items.filter(function(t){ return !t.on; }), sp=on.length?on.reduce(function(a,t){ return a+(t.sp||0); },0)/on.length:(r.items[0].sp||0), cv=Math.min.apply(null,r.items.map(function(t){ return dgCover(P,t.x,t.y,Q.db); }));
       return '<tr class="dgi"><td>'+(i+1)+'</td><td class="v">'+inp('sy:'+i,r.key,64,'dgsr')+'</td><td class="v l">'+inp('sx:'+i,dgXs(on),260,'dgsr')+'</td><td class="v l">'+inp('so:'+i,dgXs(off),140,'dgsr')+'</td><td class="v">'+on.length+'</td><td class="v">'+inp('sp:'+i,dgF(sp,0),64,'dgsr')+'</td><td class="v">'+dgF(on.length*Q.Ap*sp/1000,0)+'</td><td class="v '+(cv<0?'bbflag':'')+'">'+dgF(cv,0)+'</td><td><button class="b dgdel" data-g="str" data-i="'+i+'">&times;</button></td></tr>'; }).join('')
     +'</table></div><div class="msbar"><button class="b" id="dg_addr">+ Add strand row</button><span class="bbnote" style="margin:0">&sigma;<sub>pe</sub> = stress after losses at '+Q.time+' from the Hog tab ('+(dgEdited('sp')?DGTAG.U+' edited':DGTAG.C)+'). Editing it here overrides the Hog value for that row.</span></div>';
  }
  if(DG.sub==='gb'){
    var rowsB=dgGroup(Q.gbars,function(b){ return dgF(b.y,1)+'|'+b.d; }), P2=dgPoly(Q.R);
    h='<div class="dgx"><table class="dt dgt"><tr><th>Row</th><th>y above soffit (mm)</th><th>Bar &Oslash; (mm)</th><th class="l">x positions (mm; &plusmn;a = symmetric pair)</th><th>No.</th><th>Area (mm&sup2;)</th><th>Min. clear cover</th><th></th></tr>'
     +rowsB.map(function(r,i){ var cv=Math.min.apply(null,r.items.map(function(b){ return dgCover(P2,b.x,b.y,b.d); }));
       return '<tr class="dgi"><td>'+(i+1)+'</td><td class="v">'+inp('by:'+i,dgF(r.items[0].y,1),64,'dgbr')+'</td><td class="v">'+inp('bd:'+i,r.items[0].d,48,'dgbr')+'</td><td class="v l">'+inp('bx:'+i,dgXs(r.items),260,'dgbr')+'</td><td class="v">'+r.items.length+'</td><td class="v">'+dgF(r.items.length*Math.PI*r.items[0].d*r.items[0].d/4,0)+'</td><td class="v '+(cv<0?'bbflag':'')+'">'+dgF(cv,0)+'</td><td><button class="b dgdel" data-g="gb" data-i="'+i+'">&times;</button></td></tr>'; }).join('')
     +'</table></div><div class="msbar"><button class="b" id="dg_addb">+ Add bar row</button><span class="bbnote" style="margin:0">Longitudinal bars in the Super-T. '+(dgEdited('gb')?DGTAG.U+' edited here':DGTAG.D+' from the Hog tab')+'; f<sub>sy</sub> = '+Q.fsy+' MPa, E<sub>s</sub> = '+Q.Es+' MPa (section 2).</span></div>';
  }
  if(DG.sub==='db'){
    var pos=dgDeckBarPos(Q);
    h='<div class="dgx"><table class="dt dgt" style="max-width:900px"><tr><th>Layer</th><th>Face</th><th>Bar &Oslash; (mm)</th><th>Spacing s (mm)</th><th>Clear cover (mm)</th><th>No. over width</th><th>Area (mm&sup2;)</th><th>Centre from deck top</th><th class="l">Tag</th><th></th></tr>'
     +Q.dbars.map(function(r,i){ var ok=r.d>0&&r.s>0&&r.c!==null&&r.c>=0, n=ok?Math.max(1,Math.floor(Q.Wd/r.s)):null;
       return '<tr class="dgi"><td>'+(i+1)+'</td><td class="v"><select class="f dgdr" data-k="pos:'+i+'"><option value="top"'+(r.pos==='top'?' selected':'')+'>top</option><option value="bot"'+(r.pos!=='top'?' selected':'')+'>bottom</option></select></td><td class="v">'+inp('d:'+i,r.d,56,'dgdr')+'</td><td class="v">'+inp('s:'+i,r.s,56,'dgdr')+'</td><td class="v">'+inp('c:'+i,r.c,56,'dgdr')+'</td>'
         +'<td class="v">'+(n||'—')+'</td><td class="v">'+(n?dgF(n*Math.PI*r.d*r.d/4,0):'—')+'</td><td class="v">'+(ok?dgF(r.pos==='top'?r.c+r.d/2:Q.tD-r.c-r.d/2,0):'—')+'</td><td class="l">'+(ok?DGTAG.U:DGTAG.M+' deck drawing not in this set')+'</td><td><button class="b dgdel" data-g="db" data-i="'+i+'">&times;</button></td></tr>'; }).join('')
     +'</table></div><div class="msbar"><button class="b" id="dg_addd">+ Add layer</button><span class="bbnote" style="margin:0">Longitudinal deck bars over the girder&rsquo;s deck width: n = floor(W/s) bars, centred on the girder. Transverse bars are not part of this section.</span></div>';
  }
  if(DG.sub==='deb') h=dgDebHTML();
  ed.innerHTML=h; dgEdBind(); if(DG.sub==='deb') dgDebBind();
}
function dgGroup(arr,key){ var m={}, out=[]; arr.forEach(function(it,i){ var k=key(it); if(!m[k]){ m[k]={key:k.split('|')[0], items:[], idx:[]}; out.push(m[k]); } m[k].items.push(it); m[k].idx.push(i); });
  out.sort(function(a,b){ return +a.key-+b.key; }); return out; }
function dgXs(items){ var xs=items.map(function(t){ return t.x; }).sort(function(a,b){ return a-b; }), used={}, out=[];
  xs.forEach(function(x,i){ if(used[i]) return; if(x<0){ var j=xs.indexOf(-x); if(j>=0&&!used[j]&&j!==i){ used[i]=used[j]=1; out.push(['&plusmn;'+(-x),-x]); return; } } used[i]=1; out.push([String(x),Math.abs(x)]); });
  out.sort(function(a,b){ return a[1]-b[1]; }); return out.map(function(q){ return q[0]; }).join(', ').replace(/&plusmn;/g,'±'); }
function dgParseXs(s){ var out=[]; String(s).split(/[,;\s]+/).forEach(function(t){ if(!t) return; var pm=/^(±|\+-|\+\/-)/.test(t), v=parseFloat(t.replace(/^(±|\+-|\+\/-)/,'')); if(!isFinite(v)) return; if(pm&&v!==0){ out.push(-v); out.push(v); } else out.push(v); }); return out; }
function dgEdBind(){
  var Q=DG.sec, ch=function(){ dgSec1Only(); };
  [].forEach.call(document.querySelectorAll('#'+(DG._edT||'dg_ed')+' .dge'),function(el){ el.onchange=function(){ var k=el.getAttribute('data-k'), v=el.value.trim()===''?null:+el.value;
    if(k!=='solidLen'&&!isFinite(v)) return;
    if(k.indexOf('P:')===0){ var pk=k.slice(2), P=Q.P;
      if(pk==='D'){ var dH=v-P.D; Q.strands.concat(Q.gbars).forEach(function(t){ if(t.y>P.D/2) t.y+=dH; }); }
      P[pk]=v; dgSyncR(); dgMark('shape'); }
    else if(k==='solidLen'){ Q.solidLen=v>0?v:null; }
    else { Q[k]=v; dgMark(k); }
    DG.view=null; ch(); }; });
  var lg=$('dg_libgo'); if(lg) lg.onclick=function(){ var lib=HOG_API.lib(), k=$('dg_lib').value; if(lib[k]){ Q.P=dgParFromR(lib[k].R); dgSyncR(); Q.name=k; dgMark('shape'); DG.view=null; ch(); } };
  var hr=$('dg_hogre'); if(hr) hr.onclick=function(){ var k=DG.sec.dbars; DG.sec=null; dgSecInit(true); DG.sec.dbars=k; DG.view=null; ch(); };
  /* strands */
  var rowsS=dgGroup(Q.strands,function(t){ return dgF(t.y,1); });
  [].forEach.call(document.querySelectorAll('#'+(DG._edT||'dg_ed')+' .dgsr'),function(el){ el.onchange=function(){ var a=el.getAttribute('data-k').split(':'), r=rowsS[+a[1]], y=r.items[0].y, sp0=r.items.filter(function(t){ return t.on; }).concat(r.items)[0].sp;
    var keep=Q.strands.filter(function(t){ return r.items.indexOf(t)<0; }), on=r.items.filter(function(t){ return t.on; }), off=r.items.filter(function(t){ return !t.on; });
    if(a[0]==='sy'){ var ny=+el.value; r.items.forEach(function(t){ t.y=ny; }); dgMark('str'); }
    else if(a[0]==='sp'){ var s=+el.value; r.items.forEach(function(t){ t.sp=s; }); dgMark('sp'); }
    else { var xs=dgParseXs(el.value), isOn=a[0]==='sx', old=isOn?on:off, other=isOn?off:on;
      var nw=xs.map(function(x){ var o=old.filter(function(t){ return t.x===x; })[0]; return o||{x:x,y:y,on:isOn,sp:sp0}; });
      Q.strands=keep.concat(other,nw); dgMark('str'); }
    ch(); }; });
  /* girder bars */
  var rowsB=dgGroup(Q.gbars,function(b){ return dgF(b.y,1)+'|'+b.d; });
  [].forEach.call(document.querySelectorAll('#'+(DG._edT||'dg_ed')+' .dgbr'),function(el){ el.onchange=function(){ var a=el.getAttribute('data-k').split(':'), r=rowsB[+a[1]], keep=Q.gbars.filter(function(b){ return r.items.indexOf(b)<0; });
    if(a[0]==='by'){ r.items.forEach(function(b){ b.y=+el.value; }); } else if(a[0]==='bd'){ r.items.forEach(function(b){ b.d=+el.value; }); }
    else { var xs=dgParseXs(el.value); Q.gbars=keep.concat(xs.map(function(x){ return {x:x,y:r.items[0].y,d:r.items[0].d}; })); }
    dgMark('gb'); ch(); }; });
  /* deck bars */
  [].forEach.call(document.querySelectorAll('#'+(DG._edT||'dg_ed')+' .dgdr'),function(el){ el.onchange=function(){ var a=el.getAttribute('data-k').split(':'), r=Q.dbars[+a[1]], v=el.value.trim(); if(a[0]==='pos') r.pos=v; else r[a[0]]=v===''?null:+v; ch(); }; });
  [].forEach.call(document.querySelectorAll('#'+(DG._edT||'dg_ed')+' .dgdel'),function(b){ b.onclick=function(){ var gk=b.getAttribute('data-g'), i=+b.getAttribute('data-i');
    if(gk==='str'){ var r=rowsS[i]; Q.strands=Q.strands.filter(function(t){ return r.items.indexOf(t)<0; }); dgMark('str'); }
    if(gk==='gb'){ var r2=rowsB[i]; Q.gbars=Q.gbars.filter(function(t){ return r2.items.indexOf(t)<0; }); dgMark('gb'); }
    if(gk==='db') Q.dbars.splice(i,1); ch(); }; });
  var ad=$('dg_addr'); if(ad) ad.onclick=function(){ var ys=Q.strands.map(function(t){ return t.y; }), y=(ys.length?Math.max.apply(null,ys.filter(function(v){ return v<dgH(Q.R)/2; })):10)+50, sp=Q.strands.length?Q.strands[0].sp:null; Q.strands.push({x:-25,y:y,on:true,sp:sp},{x:25,y:y,on:true,sp:sp}); dgMark('str'); ch(); };
  var ab=$('dg_addb'); if(ab) ab.onclick=function(){ Q.gbars.push({x:-300,y:500,d:12},{x:300,y:500,d:12}); dgMark('gb'); ch(); };
  var adl=$('dg_addd'); if(adl) adl.onclick=function(){ Q.dbars.push({pos:'top',d:null,s:null,c:null}); ch(); };
}

/* ---------- step 2: materials (editable) ---------- */
function dgGenView(X,B){
  if(!X||!B){ $('dg_gen').innerHTML=''; return; } var Q=DG.sec, I=X.info, o=Q.orig;
  var mi=function(k,v,src){ return '<input class="f dgm" data-k="'+k+'" value="'+v+'" style="width:80px"> '+(Q[k]!==o[k]?DGTAG.U:DGTAG.D+' <span class="dgg">'+src+'</span>'); };
  var rows=[['h','Materials (editable)'],
    ['i',"f'<sub>c</sub>",'Super-T concrete strength','Materials tab M1',mi('fcg',Q.fcg,'Materials M1'),'MPa','Table 3.1.2'],
    ['i','E<sub>c</sub>','Super-T elastic modulus','Materials tab M1',mi('Eg',Q.Eg,'Materials M1'),'MPa','Cl 3.1.2'],
    ['i',"f'<sub>c,deck</sub>",'Deck concrete strength','Materials tab M2',mi('fcd',Q.fcd,'Materials M2'),'MPa',''],
    ['i','E<sub>c,deck</sub>','Deck elastic modulus','Materials tab M2',mi('Ed',Q.Ed,'Materials M2'),'MPa',''],
    ['i','f<sub>sy</sub>','Reinforcement yield strength','Hog Calculator tab',mi('fsy',Q.fsy,'Hog tab'),'MPa','Cl 3.2'],
    ['i','E<sub>s</sub>','Reinforcement modulus','Hog Calculator tab',mi('Es',Q.Es,'Hog tab'),'MPa','Cl 3.2'],
    ['i','E<sub>p</sub>','Strand modulus','Hog Calculator tab',mi('Ep',Q.Ep,'Hog tab'),'MPa','Cl 3.3'],
    ['o','f<sub>pb</sub>','Strand breaking stress','MBL / A<sub>p</sub> = '+(Q.mbl||'—')+' kN / '+Q.Ap+' mm&sup2;',dgF(I.fpb,0)+' '+DGTAG.C,'MPa','Table 3.3.1'],
    ['h','Derived parameters'],
    ['o','&epsilon;<sub>cu</sub>','Concrete ultimate strain','code value','0.003 '+DGTAG.S,'','Cl 8.1.3'],
    ['o','&alpha;<sub>2</sub>','Stress-block intensity (deck / Super-T)','0.85 &minus; 0.0015f\'<sub>c</sub>, 0.67&ndash;0.85',dgF(B.a2d,3)+' / '+dgF(B.a2g,3),'','Cl 8.1.3'],
    ['o','&gamma;','Stress-block depth factor (deck / Super-T)','0.97 &minus; 0.0025f\'<sub>c</sub>, 0.67&ndash;0.85',dgF(B.gd,3)+' / '+dgF(B.gg,3),'','Cl 8.1.3'],
    ['o',"f'<sub>ct.f</sub>",'Flexural tensile strength (Super-T / deck)','0.6&radic;f\'<sub>c</sub>',dgF(B.fctfg,2)+' / '+dgF(B.fctfd,2),'MPa','Cl 3.1.1.3'],
    ['o','0.25&radic;f\'<sub>c</sub>','Tension below which crack control is deemed satisfied','0.25&radic;f\'<sub>c</sub> (Super-T)',dgF(B.fct25,2),'MPa','Cl 8.6.2'],
    ['o','&phi;','Capacity reduction factors','bending 0.6 &le; 1.19 &minus; 13k<sub>uo</sub>/12 &le; 0.8; shear / torsion 0.7','see steps 5, 6','','Table 2.3.2'],
    ['h','Crack-control targets (edited per load case in step 4)'],
    ['o','f<sub>scr</sub>','Target bar stress for crack control','bar stress increment above decompression',DG.lc.map(function(l){ return l.fscr; }).join(' / ')+' '+DGTAG.U,'MPa','Table 8.6.2.1'],
    ['o','f<sub>tcr</sub>','Target tendon stress for crack control','tendon stress increment above decompression',DG.lc.map(function(l){ return l.ftcr; }).join(' / ')+' '+DGTAG.U,'MPa','Table 8.6.2.1']];
  var h='<div class="dgx"><table class="dt dgt"><tr><th class="l">Symbol</th><th class="l">Description</th><th class="l fx">Formula / basis</th><th>Value</th><th class="l">Unit</th><th class="l">Ref.</th></tr>';
  rows.forEach(function(r){ if(r[0]==='h'){ h+='<tr class="dgh"><td colspan="6">'+r[1]+'</td></tr>'; return; } h+='<tr class="dg'+r[0]+'"><td class="l sym">'+r[1]+'</td><td class="l">'+r[2]+'</td><td class="l fx">'+r[3]+'</td><td class="v">'+r[4]+'</td><td class="l">'+r[5]+'</td><td class="l ref">'+r[6]+'</td></tr>'; });
  $('dg_gen').innerHTML=h+'</table></div><div class="bbnote">The default 200 MPa for f<sub>scr</sub> and f<sub>tcr</sub> is the reference spreadsheet&rsquo;s entry. Set it from AS 5100.5 Table 8.6.2.1 for the bars actually detailed.</div>';
  [].forEach.call(document.querySelectorAll('#dg_gen .dgm'),function(el){ el.onchange=function(){ var v=+el.value; if(isFinite(v)){ DG.sec[el.getAttribute('data-k')]=v; dgSec1Only(); } }; });
}

/* ---------- summary cards + nav chips ---------- */
function dgSumView(){
  var R=DG.res; if(!R){ $('dg_sum').innerHTML='<div class="dgempty">Press <b>&#9654; Fill load cases from the model</b> (or type actions in step 3), then <b>Run checks</b>. After the first run the checks update automatically whenever you edit the section, materials or load cases.</div>'+dgFlags(); return; }
  var r=R.lc, L=DG.lc, gov=function(f){ var b={u:-1,i:-1}; r.forEach(function(o,i){ var u=f(o); if(u!==null&&u!==undefined&&isFinite(u)&&u>b.u) b={u:u,i:i}; }); return b; };
  var cards=[['SLS crack control','Cl 8.6.2',gov(function(o){ return Math.max(0,o.uS); }),'M<sub>s</sub>* / M<sub>s,allow</sub>',4],['ULS bending','Cl 8.1',gov(function(o){ return o.uB; }),'M* / &phi;M<sub>u</sub>',5],
    ['Web crushing','Cl 8.2.3.1',gov(function(o){ return o.sh?o.sh.uCr:null; }),'V<sub>eff</sub> / &phi;V<sub>u.max</sub>',6],['Shear','Cl 8.2.3.1',gov(function(o){ return o.sh?o.sh.uV:null; }),'V<sub>eff</sub> / &phi;(V<sub>uc</sub>+V<sub>us</sub>)',6],
    ['Torsion','Cl 8.2.5.6',gov(function(o){ return o.sh?o.sh.uT:null; }),'T* / &phi;T<sub>us</sub>',6],['Longitudinal steel','Cl 8.2.7',gov(function(o){ return o.sh?o.sh.uL:null; }),'F<sub>td</sub> / F<sub>t,cap</sub>',6]];
  var ok=r.every(function(o){ return o.okS&&o.uB<=1&&o.kuo<=0.36&&o.okMin!==false&&(!o.sh||o.sh.u<=1&&o.sh.minV&&o.sh.minT); }), complete=r.every(function(o){ return o.sh; });
  var worst=cards.reduce(function(a,c){ return c[2].u>a[2].u?c:a; },cards[0]);
  var h='<div class="dgban '+(ok?(complete?'ok':'part'):'ng')+'"><b>'+(ok?(complete?'Section adequate for the load cases checked':'Bending and SLS adequate &mdash; shear / torsion not checked'):'Section NOT adequate')+'</b><span>Governing: '+worst[0]+' '+anFmt(worst[2].u,3)+' at LC'+(worst[2].i+1)+'</span></div><div class="dgcards">'
   +cards.map(function(c){ var u=c[2].u, has=c[2].i>=0, cls=!has?'na':u>1?'ng':u>0.9?'warn':'ok';
     return '<a class="dgkpi '+cls+'" href="javascript:void 0" data-go="'+c[4]+'"><span class="dgk1">'+c[0]+'</span><span class="dgk2">'+(has?anFmt(u,3):'—')+'</span><span class="dgbarw"><i style="width:'+(has?Math.min(100,u*100):0)+'%"></i></span><span class="dgk3">'+c[3]+(has?' &middot; LC'+(c[2].i+1)+' '+L[c[2].i].name.replace(/^LC\d+\s*/,''):' &middot; not calculated')+'</span><span class="dgk3 ref">'+c[1]+'</span></a>'; }).join('')+'</div>';
  var row=function(nm,cl,f,isU){ return '<tr><td class="l">'+nm+'</td><td class="l ref">'+cl+'</td>'+L.map(function(lc,i){ var v=f(r[i],lc); return '<td class="v">'+(isU?dgU(v):v)+'</td>'; }).join('')+'</tr>'; };
  h+='<details class="dgdet"><summary>All checks by load case</summary><div class="dgx"><table class="dt dgt"><tr><th class="l">Check</th><th class="l">Clause</th>'+dgHeads().map(function(x){ return '<th>'+x+'</th>'; }).join('')+'</tr>'
   +row('M<sub>s</sub>* / M<sub>s,allow</sub>','Cl 8.6.2',function(o){ return Math.max(0,o.uS); },true)
   +row('Soffit stress (uncracked if &le; 0.25&radic;f\'<sub>c</sub>)','Cl 8.6.2',function(o){ return dgF(o.sv.girBot,2)+' MPa '+(o.uncr?'<b class="good">uncracked</b>':'cracked'); })
   +row('M* / &phi;M<sub>u</sub>','Cl 8.1',function(o){ return o.uB; },true)
   +row('k<sub>uo</sub> &le; 0.36','Cl 8.1.5',function(o){ return dgF(o.kuo,3)+' '+dgOK(o.kuo<=0.36); })
   +row('M<sub>uo</sub> &ge; 1.2M<sub>cr</sub>','Cl 8.1.5',function(o){ return dgOK(o.okMin); })
   +row('Web crushing','Cl 8.2.3.1',function(o){ return o.sh?o.sh.uCr:null; },true)+row('Shear','Cl 8.2.3.1',function(o){ return o.sh?o.sh.uV:null; },true)
   +row('Torsion','Cl 8.2.5.6',function(o){ return o.sh?o.sh.uT:null; },true)+row('Longitudinal steel','Cl 8.2.7',function(o){ return o.sh?o.sh.uL:null; },true)
   +row('Minimum shear / torsion steel','Cl 8.2.1.7 / 8.2.5.5',function(o){ return o.sh?dgOK(o.sh.minV)+' / '+dgOK(o.sh.minT):'<span class="bbflag">—</span>'; })+'</table></div></details>';
  $('dg_sum').innerHTML=h+dgFlags();
  [].forEach.call(document.querySelectorAll('#dg_sum [data-go]'),function(a){ a.onclick=function(){ $('dg_c'+a.getAttribute('data-go')).scrollIntoView({behavior:'smooth',block:'start'}); }; });
}
function dgChips(){
  var R=DG.res, set=function(i,txt,cls){ ['dg_ch'+i,'dg_hc'+i].forEach(function(id){ var e=$(id); if(e){ e.innerHTML=txt; e.className='dgchip '+(cls||''); } }); };
  var Q=DG.sec, nb=Q?dgDeckBarPos(Q).length:0, miss=(Q&&!nb?1:0)+((DG.warn||[]).length?1:0);
  set(1,Q?(miss?miss+' to review':'complete'):'—',miss?'warn':'ok'); set(2,'',''); set(3,DG.lc.some(function(l){ return l.brk; })?'from model':'not filled',DG.lc.some(function(l){ return l.brk; })?'ok':'warn');
  if(!R){ [0,4,5,6].forEach(function(i){ set(i,'not run',''); }); set(8,'reference',''); dgGirdChip(set); return; }
  var mx=function(f){ var m=-1; R.lc.forEach(function(o){ var u=f(o); if(u!==null&&isFinite(u)) m=Math.max(m,u); }); return m; };
  var c=function(u){ return u<0?['—','']:[anFmt(u,2),u>1?'ng':u>0.9?'warn':'ok']; };
  var s4=c(mx(function(o){ return Math.max(0,o.uS); })), s5=c(mx(function(o){ return o.uB; })), s6=c(mx(function(o){ return o.sh?o.sh.u:null; }));
  set(4,s4[0],s4[1]); set(5,s5[0],s5[1]); set(6,R.lc.every(function(o){ return o.sh; })?s6[0]:'inputs missing',R.lc.every(function(o){ return o.sh; })?s6[1]:'warn');
  var all=Math.max(mx(function(o){ return Math.max(0,o.uS); }),mx(function(o){ return o.uB; }),mx(function(o){ return o.sh?o.sh.u:null; })); var a=c(all); set(0,a[0],a[1]); set(8,'reference',''); dgGirdChip(set);
}
