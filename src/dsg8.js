/* ===== v27: SLS crack control per AS 5100.5:2017 Cl 8.6.2.1 (three options) and reinforcing-steel stress per Cl 8.6.1 (Tables 8.6.1(A) and (B)) =====
   Values below are the code values supplied by the user from AS 5100.5:2017 (Cl 8.6.1, Cl 8.6.2.1, Tables 8.6.1(A), 8.6.1(B), 8.6.2.1). Tag: Standard — verify. */
DG.cc={opt:'a', exp:''};
var DG_CC_OPT=[['u','σ_{t} ≤ 0.25√f\'_{c} — deemed controlled, no further requirement'],['a','Cl 8.6.2.1(a) — σ_{t} ≤ 0.5√f\'_{c} (transfer 0.5√f\'_{cp}), bars/tendons ≤ 200 mm near the tension face'],['b','Cl 8.6.2.1(b) — Δσ_{s} ≤ Table 8.6.2.1, bars/tendons ≤ 200 mm near the tension face']];
var DG_EXP=['A1','A2','B1','B2','C1','C2','U'];
/* Table 8.6.2.1 — maximum increment of steel stress, prestressed beams */
function dgT8621(db){ if(!(db>0)) return {v:200,why:'no bar near the tension face — bonded tendons value'}; var r=[[12,330],[16,280],[20,240],[24,210]]; for(var i=0;i<r.length;i++) if(db<=r[i][0]) return {v:r[i][1],why:'d_{b} = '+db+' mm'+(db===r[i][0]||i===0?'':' → next listed diameter '+r[i][0]+' mm')}; return {v:200,why:'d_{b} = '+db+' mm (≥ 28 mm)'}; }
/* Table 8.6.1(A) — maximum steel stress for tension or flexure, by bar diameter; case 'i' = Item (c)(i) SLS combinations, 'ii' = Item (c)(ii) permanent effects */
var DG_T861A={10:[360,275],12:[330,250],16:[280,215],20:[240,185],24:[210,160],28:[185,140],32:[160,125],36:[140,110],40:[120,95]};
function dgT861A(db,cs){ var k=cs==='ii'?1:0; if(DG_T861A[db]) return {v:DG_T861A[db][k],src:'Table 8.6.1(A)'}; return {v:cs==='ii'?575-130*Math.log(db):760-173*Math.log(db),src:'Table 8.6.1(A) Note '+(cs==='ii'?'(b): 575 − 130 ln d_{b}':'(a): 760 − 173 ln d_{b}')}; }
/* Table 8.6.1(B) — maximum steel stress for flexure, by centre-to-centre spacing (the table is the Note equation) */
function dgT861B(s,cs){ if(s>300) return {v:null,out:true,src:'s = '+Math.round(s)+' mm is beyond the table (spacings to 300 mm) — not applicable, Table 8.6.1(A) governs; spacing measured across the Super-T void between web bar groups — verify'};
  return {v:cs==='ii'?320-0.8*s:400-0.8*s,src:'Table 8.6.1(B): '+(cs==='ii'?'320':'400')+' − 0.8s'}; }
function dgCCLoad(k){ return k==='a'?'ii':'i'; }    /* combination (a) = permanent effects → Item (c)(ii); (b) = SLS combination → Item (c)(i) */
function dgExpCii(){ return ['B2','C1','C2','U'].indexOf(DG.cc.exp)>=0; }

/* reinforcing bars in the tensile zone at M_s* (cracked section): stress, largest diameter, largest spacing of adjacent parallel bars (bars < half the largest diameter ignored) */
function dgBarZone(o){
  var S=o.X.S, sb=o.sc&&o.sc.bars?o.sc.bars:[], Q=DG.sec, tb=[];
  S.bars.forEach(function(b,j){ if(sb[j]>0) tb.push({j:j,b:b,s:sb[j]}); });
  if(!tb.length) return {n:0,sig:0,db:null,sp:null};
  var dmax=Math.max.apply(null,tb.map(function(t){ return t.b.d||0; })), sig=Math.max.apply(null,tb.map(function(t){ return t.s; })), sp=null;
  var use=tb.filter(function(t){ return (t.b.d||0)>=dmax/2; }), layers={};
  use.forEach(function(t){ if(t.b.grp==='d'){ var r=Q.dbars.filter(function(q){ return q.d===t.b.d&&q.s>0; })[0]; if(r) sp=Math.max(sp||0,r.s); return; } var key=Math.round(t.b.y/5); (layers[key]=layers[key]||[]).push(t.b.x); });
  /* spacing is measured only between neighbours joined by Super-T concrete — a gap across the open void between the top flanges (or between webs) is not a bar spacing */
  var Ht=o.X.info.tD+o.X.info.H, Pg=null; try{ Pg=dgPoly(o.solid&&Q.Rs?Q.Rs:Q.R); }catch(e){}
  Object.keys(layers).forEach(function(k){ var yU=Ht-(+k)*5, xs=layers[k].filter(function(x){ return x!==undefined; }).sort(function(a,b){ return a-b; });
    for(var i=1;i<xs.length;i++){ var xm=(xs[i]+xs[i-1])/2; if(Pg&&!dgInPoly(Pg,xm,yU)) continue; sp=Math.max(sp||0,xs[i]-xs[i-1]); } });
  return {n:tb.length,sig:sig,db:dmax,sp:sp,grp:tb.some(function(t){ return t.b.grp==='d'; })?'deck':'Super-T'};
}
/* Cl 8.6.1 steel stress check for one combination */
function dgRst(o,k){ var z=dgBarZone(o), cs=dgCCLoad(k), need=cs==='i'||dgExpCii();
  if(!z.n) return {z:z,cs:cs,need:need,lim:null,u:0};
  var A=dgT861A(z.db,cs), B=z.sp?dgT861B(z.sp,cs):null, lim=Math.max(A.v,B&&B.v!==null?B.v:-1e9);
  return {z:z,cs:cs,need:need,A:A,B:B,lim:lim,u:z.sig/lim}; }
/* bars and bonded tendons near the tension face (sagging: the lowest layer group within the bottom flange) — largest centre-to-centre spacing */
function dgNearFaceSp(){ var Q=DG.sec, tbf=Q.P.tb||200, pts=[]; Q.gbars.forEach(function(b){ if(b.y<=tbf) pts.push({x:b.x,y:b.y}); }); Q.strands.forEach(function(t){ if(t.on&&t.y<=tbf) pts.push({x:t.x,y:t.y}); });
  if(!pts.length) return null; var y0=Math.min.apply(null,pts.map(function(p){ return p.y; })), row=pts.filter(function(p){ return p.y<=y0+60; }).map(function(p){ return p.x; }).sort(function(a,b){ return a-b; }), m=0;
  for(var i=1;i<row.length;i++) m=Math.max(m,row[i]-row[i-1]); return {s:m,n:row.length,y0:y0}; }
function dgGirderDb(){ var Q=DG.sec, H=Q.P.D, d=0; Q.gbars.forEach(function(b){ if(b.y<H/2) d=Math.max(d,b.d); }); return d||null; }
/* concrete tension limit for the selected option */
function dgCCLim(){ var Q=DG.sec, o=DG.cc.opt, k=o==='a'?0.5:0.25; return {k:k,g:k*Math.sqrt(Q.fcg),d:k*Math.sqrt(Q.fcd),txt:k+'√f\'_{c}'}; }

/* keep the load-case increment limits on Table 8.6.2.1 and the transfer tension on the selected option */
function dgCCSync(){ if(!DG.sec) return; var t=dgT8621(dgGirderDb()); DG.cc.fscr=t; (DG.lc||[]).forEach(function(lc){ lc.fscr=t.v; lc.ftcr=200; });
  if(DG.trLim.src==='std') DG.trLim.kt=DG.cc.opt==='u'?0.25:0.5; }
var dgLimSync0=dgLimSync; dgLimSync=function(){ var L=DG.trLim; if(L.src==='std'){ L.kc=L.dist==='rect'?0.5:0.6; L.kt=DG.cc.opt==='u'?0.25:0.5; } var G=DG.sec?dgGirdPar():null, f=G&&G.fci; if(!f) return; if(L.kc!==null) L.c=L.kc*f; if(L.kt!==null) L.t=L.kt*Math.sqrt(f); };
var dgRun1=dgRun; dgRun=function(q){ dgCCSync(); return dgRun1(q); };

/* ---------- result list / kind ---------- */
var dgAnResList7=dgAnResList; dgAnResList=function(){ var l=dgAnResList7(); if(DG.an.type==='sls'){ l=l.filter(function(q){ return q[0]!=='stl'; }); l.splice(4,0,['stl','Steel stress increment Δσ_{s}, Δσ_{p} — Cl 8.6.2.1(b), Table 8.6.2.1'],['rst','Reinforcement stress σ_{scr} — Cl 8.6.1, Tables 8.6.1(A)/(B)']); } return l; };
var dgAnKind7=dgAnKind; dgAnKind=function(){ return DG.an.type==='sls'&&DG.an.res==='rst'?'rst':dgAnKind7(); };

/* ---------- chart series ---------- */
var dgAnSeries7=dgAnSeries; dgAnSeries=function(){
  var a=DG.an; if(a.type!=='sls') return dgAnSeries7();
  var D=DG.gird, G=D.G, S=D.st.filter(function(r){ return !a.sym||r.x<=G.Lg/2+1e-6; }), CB=dgCombsOn(), nan=NaN, fin=function(v){ return v===null||v===undefined||!isFinite(v)?nan:v; };
  var cser=function(lab,c,f,o){ return CB.map(function(k){ var st=DG_CB_STY[k]; return Object.assign({lab:lab+(CB.length>1?st.suf:''),c:c,dash:(o&&o.dash)||st.dash,wd:(o&&o.wd)||st.wd,val:o&&o.val,p:S.map(function(r){ var q=dgCB(r,k), v; try{ v=q?f(q.lc,q.o,r,k):nan; }catch(e){ v=nan; } return [r.x,fin(v)]; })}); }); };
  var hl=function(lab,v,o){ return Object.assign({lab:lab,c:'var(--flag)',dash:'6 4',wd:1.2,p:[[S[0].x,v],[S[S.length-1].x,v]]},o||{}); };
  if(a.res==='rst'){ var out={yl:'Reinforcing steel stress σ_{scr}, cracked section (MPa)',ser:[],note:''};
    out.ser=out.ser.concat(cser('σ_{scr} at M_{s}*','var(--calc)',function(lc,o){ return dgBarZone(o).sig; }));
    CB.forEach(function(k){ var cs=dgCCLoad(k); if(cs==='ii'&&!dgExpCii()) return; out.ser.push({lab:'Limit, Item (c)('+cs+'): max of Table 8.6.1(A) and 8.6.1(B)'+(CB.length>1?DG_CB_STY[k].suf:''),c:'var(--flag)',dash:k==='a'?'2 3':'6 4',wd:1.3,
      p:S.map(function(r){ var q=dgCB(r,k), v; try{ v=q?dgRst(q.o,k).lim:nan; }catch(e){ v=nan; } return [r.x,fin(v)]; })}); });
    out.note='Cl 8.6.1: Item (c)(i) applies to the SLS combination with traffic; Item (c)(ii) (permanent effects) applies only for exposure B2, C1, C2 or U'+(DG.cc.exp?' — exposure '+DG.cc.exp+(dgExpCii()?', so it is checked.':', so it is not required.'):' — exposure classification not set (Missing — Flagged).');
    return out; }
  var out=dgAnSeries7();
  if(a.res==='stl'){ out.ser=out.ser.filter(function(s){ return !/^f_\{scr\}|^f_\{tcr\}|^Δσ/.test(s.lab); });
    out.ser=out.ser.concat(cser('Δσ_{s} bars, soffit side','var(--calc)',function(lc,o){ return dgIncV(o.inc&&o.inc.b); }),cser('Δσ_{s} bars, top side','var(--flag)',function(lc,o){ return dgIncV(o.incT&&o.incT.b); }),cser('Δσ_{p} tendons, soffit side','var(--instr)',function(lc,o){ return dgIncV(o.inc&&o.inc.t); }),cser('Δσ_{p} tendons, top side','var(--std)',function(lc,o){ return dgIncV(o.incT&&o.incT.t); })); var t=DG.cc.fscr||dgT8621(dgGirderDb());
    out.ser.push(hl('Table 8.6.2.1 bars: '+t.v+' MPa ('+t.why+')',t.v,{val:true})); if(t.v!==200) out.ser.push(hl('Table 8.6.2.1 bonded tendons: 200 MPa',200,{val:true,dash:'2 3'}));
    if(DG.cc.opt!=='b') out.note='Crack-control option is '+(DG.cc.opt==='u'?'0.25√f\'_{c}':'Cl 8.6.2.1(a)')+'; this increment check governs only under Cl 8.6.2.1(b). '+out.note; return out; }
  if(a.res!=='crk'){ var L=dgCCLim(); out.ser=out.ser.filter(function(s){ return !/^Permissible tension/.test(s.lab); });
    if(a.res!=='dtop'&&DG.cc.opt!=='b') out.ser.push(hl('Permissible tension, Super-T '+L.txt+' = '+anFmt(L.g,2)+' MPa ('+(DG.cc.opt==='a'?'Cl 8.6.2.1(a)':'Cl 8.6.2.1')+')',L.g,{dash:'2 3',val:true}));
    out.ser.forEach(function(q){ if(/^Permissible compression, deck/.test(q.lab)) q.grp='Deck top'; });
    if(DG.cc.opt==='b') out.note='Option (b) limits the steel, not the concrete: no concrete tension line is drawn. Where a face exceeds 0.25√f\'_{c}, check Result → Steel stress increment (Table 8.6.2.1).'; }
  return out;
};

/* ---------- calculation lines ---------- */
/* tension faces at the SLS: Super-T soffit, Super-T top flange (under the deck), deck top */
function dgFaces(o){ var Q=DG.sec, L=dgCCLim(); return [{k:'bot',n:'Super-T soffit',s:o.sv.girBot,fc:Q.fcg,lim:L.g,inc:o.inc},{k:'top',n:'Super-T top flange',s:o.sv.girTop,fc:Q.fcg,lim:L.g,inc:o.incT},{k:'deck',n:'Deck top',s:o.sv.deckTop,fc:Q.fcd,lim:L.d,inc:o.incT}]; }
function dgIncV(v){ return v!==undefined&&v!==null&&v>-1e8?v:0; }
function dgCCLines(o,lc,k){ var Q=DG.sec, L=dgCCLim(), f=function(v,d){ return anFmt(v,d===undefined?1:d); }, sp=dgNearFaceSp(), opt=DG.cc.opt, t=DG.cc.fscr||dgT8621(dgGirderDb());
  var out=[{sub:'Crack control — Cl 8.6.2.1, option: '+(opt==='u'?'0.25√f\'_{c} only':opt==='a'?'(a) tensile stress ≤ 0.5√f\'_{c}':'(b) steel stress increment')}];
  dgFaces(o).forEach(function(F){ var st=Math.max(F.s,0), u25=0.25*Math.sqrt(F.fc);
    out.push({d:F.n+' — tensile stress',e:'σ_{t} = max(σ, 0)',r:f(st,2),u:'MPa'});
    if(st<=u25){ out.push({d:F.n+' — deemed controlled',e:'σ_{t} ≤ 0.25√f\'_{c} = 0.25 × √'+F.fc,r:f(st,2)+' ≤ '+f(u25,2),u:'MPa',ok:true,ref:'Cl 8.6.2.1'}); return; }
    out.push({d:F.n+' — exceeds 0.25√f\'_{c}',e:'σ_{t} > 0.25√f\'_{c} = 0.25 × √'+F.fc+' → cracking must be controlled by (a) or (b)',r:f(st,2)+' > '+f(u25,2),u:'MPa',ok:opt==='u'?false:undefined,ref:'Cl 8.6.2.1'});
    if(opt==='u') return;
    if(F.k==='bot') out.push({d:'Bars / tendons near the soffit',e:'largest centre-to-centre spacing in the lowest layer ≤ 200 mm',r:sp?f(sp.s,0)+(sp.s<=200?' ≤ ':' > ')+'200':'none',u:'mm',ok:sp?sp.s<=200:false,ref:'Cl 8.6.2.1'});
    var lA=0.5*Math.sqrt(F.fc), okA=st<=lA, ib=dgIncV(F.inc&&F.inc.b), it=dgIncV(F.inc&&F.inc.t), okB=ib<=t.v&&it<=200;
    out.push({d:'(a) tensile stress',e:'σ_{t} ≤ 0.5√f\'_{c} = 0.5 × √'+F.fc,r:f(st,2)+(okA?' ≤ ':' > ')+f(lA,2),u:'MPa',ok:opt==='a'?okA:undefined,ref:'Cl 8.6.2.1(a)'});
    out.push({d:'(b) bar stress increment',e:'Δσ_{s}, bars near the '+(F.k==='bot'?'soffit':'top face')+', from zero stress at that face to M_{s}* (cracked section) ≤ '+t.v,r:f(ib,0)+(ib<=t.v?' ≤ ':' > ')+t.v,u:'MPa',ok:opt==='b'?ib<=t.v:undefined,ref:'Table 8.6.2.1'});
    out.push({d:'(b) tendon stress increment',e:'Δσ_{p}, bonded tendons on that side ≤ 200',r:f(it,0)+(it<=200?' ≤ ':' > ')+'200',u:'MPa',ok:opt==='b'?it<=200:undefined,ref:'Table 8.6.2.1'});
    if(opt==='a'&&!okA) out.push({d:'Note',e:'(a) is not met at this face; Cl 8.6.2.1 also accepts (b) — select option (b) to check on the increments',r:okB?'(b) would be met':'(b) not met either',ok:okB});
  });
  return out; }
function dgRstLines(o,lc,k){ var r=dgRst(o,k||'b'), z=r.z, f=function(v,d){ return anFmt(v,d===undefined?1:d); }, cs=r.cs;
  var out=[{sub:'Reinforcing steel stress — Cl 8.6.1, loading case Item (c)('+cs+')'+(cs==='i'?' SLS load combination':' permanent effects at the SLS')}];
  if(cs==='ii'&&!dgExpCii()) out.push({d:'Item (c)(ii) required?',e:'only for exposure B2, C1, C2 and U',r:DG.cc.exp?('exposure '+DG.cc.exp+' — not required'):'exposure not set',ref:'Cl 8.6.1(c)(ii)'});
  if(!z.n){ out.push({d:'Bars in the tensile zone',e:'cracked section at M_{s}*',r:'none in tension',ok:true}); return out; }
  out.push({d:'Steel stress',e:'σ_{scr} = max tensile bar stress, cracked section at M_{s}* ('+z.grp+' bars, '+z.n+' in tension)',r:f(z.sig,0),u:'MPa',ref:'Cl 8.6.1(d)/(e)'});
  out.push({d:'Largest bar diameter in the tensile zone',e:'d_{b}',r:f(z.db,0),u:'mm'});
  out.push({d:'Limit by bar diameter',e:'f_{scr}('+z.db+' mm)',s:r.A.src.replace(/_\{b\}/g,'_{b}'),r:f(r.A.v,0),u:'MPa',ref:'Table 8.6.1(A)'});
  out.push({d:'Largest centre-to-centre spacing',e:'adjacent parallel bars in the tensile zone (bars < d_{b,max}/2 ignored)',r:z.sp?f(z.sp,0):'—',u:'mm'});
  if(r.B) out.push({d:'Limit by spacing',e:'f_{scr}(s)',s:r.B.v===null?r.B.src:r.B.src+' = '+f(r.B.v,0),r:r.B.v===null?'n/a':f(r.B.v,0),u:r.B.v===null?'':'MPa',ref:'Table 8.6.1(B)'});
  out.push({d:'Permissible steel stress',e:'larger of Table 8.6.1(A) and 8.6.1(B) (Item (e), flexure)',r:f(r.lim,0),u:'MPa',ref:'Cl 8.6.1(e)',k:true});
  out.push({d:'Check',e:'σ_{scr} ≤ f_{scr}',r:f(z.sig,0)+(z.sig<=r.lim?' ≤ ':' > ')+f(r.lim,0),ok:r.need?z.sig<=r.lim:undefined,ref:'Cl 8.6.1'});
  return out; }
var dgCalcLines7=dgCalcLines; dgCalcLines=function(kind,o,lc,k){ if(kind==='rst') return dgRstLines(o,lc,k||lc.comb||'b'); var L=dgCalcLines7(kind,o,lc); if(kind==='sls'){ try{ L=L.filter(function(l){ return !/^Crack control deemed|^Uncracked limit/.test(l.d||''); }).concat(dgCCLines(o,lc,k)); }catch(e){} } return L; };
/* the panel passes the combination of the point */
var dgAnPOI7=dgAnPOI; dgAnPOI=function(p){ dgAnPOI7(p); };

/* ---------- governing chips: add the Cl 8.6.1 steel stress and use the selected tension option ---------- */
var dgAnSum7=dgAnSum; dgAnSum=function(){ dgAnSum7(); var D=DG.gird, box=$('dg_ansum'); if(!D||!box) return;
  var m=null, x=null, kk=null, mt=null, xt=null, kt=null, mi=null, xi=null, ki=null, L=dgCCLim();
  D.st.forEach(function(r){ Object.keys(r.cb||{b:1}).forEach(function(k){ var q=dgCB(r,k); if(!q||!q.o) return; try{ var rr=dgRst(q.o,k); if(rr.need&&rr.lim){ if(m===null||rr.u>m){ m=rr.u; x=r.x; kk=k; } } var ut=Math.max.apply(null,dgFaces(q.o).filter(function(F){ return F.k!=='deck'; }).map(function(F){ return Math.max(0,F.s)/F.lim; })); if(mt===null||ut>mt){ mt=ut; xt=r.x; kt=k; } var tv=(DG.cc.fscr||{v:200}).v, ui=Math.max(dgIncV(q.o.inc&&q.o.inc.b)/tv,dgIncV(q.o.incT&&q.o.incT.b)/tv,dgIncV(q.o.inc&&q.o.inc.t)/200,dgIncV(q.o.incT&&q.o.incT.t)/200); if(mi===null||ui>mi){ mi=ui; xi=r.x; ki=k; } }catch(e){} }); });
  var chip=function(lab,u,x,k,res){ var cls=u===null?'mi':u>1?'ng':u>0.9?'wa':'ok'; return '<button class="dgsc '+cls+'" data-res="'+res+'"><span>'+lab+'</span><b>'+(u===null?'not available':anFmt(u,2))+'</b>'+(u!==null?'<i>at '+anFmt(x,2)+' m · ('+k+')</i>':'')+'</button>'; };
  var bs=[].slice.call(box.querySelectorAll('.dgsc')), t=bs.filter(function(b){ return /SLS soffit tension/.test(b.textContent); })[0];
  if(t) t.outerHTML=DG.cc.opt==='b'?'<button class="dgsc mi" data-res="stl"><span>SLS concrete tension</span><b>not limited</b><i>option (b): steel is checked</i></button>':chip('SLS tension, Super-T '+L.txt.replace(/_\{c\}/,'c'),mt,xt,kt,'all');
  var st=[].slice.call(box.querySelectorAll('.dgsc')).filter(function(b){ return /Steel stress/.test(b.textContent); })[0];
  if(st){ st.insertAdjacentHTML('afterend',chip('Bar stress Cl 8.6.1',m,x,kk,'rst')); st.outerHTML=chip('Steel stress increment (b)',mi,xi,ki,'stl'); }
  [].forEach.call(box.querySelectorAll('.dgsc[data-res]'),function(b){ b.onclick=function(){ DG.an.type='sls'; DG.an.res=b.getAttribute('data-res'); dgAnView(); }; });
};

/* ---------- permissible-stress bar: crack-control option, exposure, Table 8.6.2.1 value ---------- */
var dgAnLimBar7=dgAnLimBar; dgAnLimBar=function(){ var a=DG.an; if(a.type!=='sls') return dgAnLimBar7();
  var Q=DG.sec, S=DG.svLim, L=dgCCLim(), t=DG.cc.fscr||dgT8621(dgGirderDb()), inp=function(id,v){ return '<input class="f" id="'+id+'" value="'+(v===null||v===undefined?'':v)+'" style="width:52px" inputmode="decimal">'; };
  var std='<span class="tg tS">Standard — verify</span>', usr='<span class="tg tU">Input (user)</span>', miss='<span class="tg" style="color:var(--flag)">Missing — Flagged</span>';
  return '<div class="dglim set dglim2"><b>SLS stress limits — AS 5100.5</b>'
    +'<label>Concrete tension <select id="dg_cco">'+DG_CC_OPT.map(function(q){ return '<option value="'+q[0]+'"'+(DG.cc.opt===q[0]?' selected':'')+'>'+dgMk(q[1]).replace(/<[^>]+>/g,'')+'</option>'; }).join('')+'</select> &rarr; <b>'+(DG.cc.opt==='b'?'Δσ ≤ '+t.v+' / 200':anFmt(L.g,2)+' / '+anFmt(L.d,2))+'</b> MPa '+(DG.cc.opt==='b'?'(bars / tendons)':'(Super-T / deck)')+' '+std+'</label>'
    +'<label>Compression <select id="dg_lsd"><option value="asbd"'+(S.src==='asbd'?' selected':'')+'>0.4f\'c — ASBD concrete data</option><option value="tri"'+(S.src==='tri'?' selected':'')+'>0.6f\'c — triangular (Cl 8.1.4.2 implied)</option><option value="rect"'+(S.src==='rect'?' selected':'')+'>0.5f\'c — rectangular (Cl 8.1.4.2 implied)</option><option value="user"'+(S.src==='user'?' selected':'')+'>own factor</option></select> k = '+inp('dg_lsc',S.kc)+' &rarr; <b>'+(S.kc>0?anFmt(S.kc*Q.fcg,1)+' / '+anFmt(S.kc*Q.fcd,1):'—')+'</b> MPa '+(S.src==='tri'||S.src==='rect'?std:usr)+'</label>'
    +'<label>Exposure classification <select id="dg_cce"><option value="">— not set —</option>'+DG_EXP.map(function(e){ return '<option'+(DG.cc.exp===e?' selected':'')+'>'+e+'</option>'; }).join('')+'</select> '+(DG.cc.exp?usr:miss)+'</label>'
    +'<span class="dgg">Steel: Table 8.6.2.1 increment '+t.v+' MPa ('+dgMk(t.why)+'), bonded tendons 200 MPa; Cl 8.6.1 bar stress by Tables 8.6.1(A)/(B), Item (c)(i) for the combination with traffic, (c)(ii) for permanent effects when exposure is B2, C1, C2 or U.</span></div>';
};
var dgAnLimBind7=dgAnLimBind; dgAnLimBind=function(){ dgAnLimBind7(); var upd=function(){ dgCCSync(); dgLimSync(); DG.poiCache=null; dgRun(true); };
  if($('dg_cco')) $('dg_cco').onchange=function(){ DG.cc.opt=this.value; upd(); };
  if($('dg_cce')) $('dg_cce').onchange=function(){ DG.cc.exp=this.value; DG.poiCache=null; dgAnView(); }; };
