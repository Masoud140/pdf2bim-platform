/* ===== v32: review fixes — combinations (a) per AS 5100.2 builder factors, temperature gradient and differential shrinkage at the SLS,
   per-station losses from the Hog time analysis, top-face crack control, transfer supports, analysis options ===== */
DG.opt=DG.opt||{useN:true, kuoLim:true, tend:'sc', k1p:0.4, dsh:true};
DG.temp=DG.temp||{alpha:null, pos:'', neg:''};

/* ---------- ULS (a): permanent effects only, factors from the Combos builder (A1 maximum / A2 minimum); creep & shrinkage and traffic not included ---------- */
function dgA12(){ if(DG.a12) return DG.a12; var txt=[].map.call(document.querySelectorAll('script'),function(x){ return x.textContent; }).join('\n'), m=/const A1=\{([^}]*)\},A2=\{([^}]*)\}/.exec(txt), p=function(s){ var o={}; s.split(',').forEach(function(kv){ var q=kv.split(':'); if(q.length===2) o[q[0].trim()]=+q[1]; }); return o; };
  DG.a12=m?{A1:p(m[1]),A2:p(m[2])}:null; return DG.a12; }
function dgCombA(lc){ var q=JSON.parse(JSON.stringify(lc)); q.brk.a.TRF={M:0,V:0,T:0,N:0,src:'not in combination (a)',mM:lc.brk.a.TRF.mM};
  dgTotals(q); var F=dgA12(); q.comb='a';
  if(F){ var sum={}; ['M','V','T','N'].forEach(function(k){ var adv=0; DG.ACT.forEach(function(a){ var f=F.A1[a.f]; if(f===undefined) return; adv+=f*(q.brk.a[a.k][k]||0); }); var sg=adv>=0?1:-1, t=0;
      DG.ACT.forEach(function(a){ var v=q.brk.a[a.k][k]||0, f1=F.A1[a.f], f2=F.A2[a.f], g=(f1===undefined)?0:(v*sg>=0?f1:f2); if(k!=='N') q.gam[a.k][k]=g; t+=g*v; }); sum[k]=t; });
    q.Mu=sum.M; q.Vu=Math.abs(sum.V); q.Tu=Math.abs(sum.T); q.Nu=DG.opt.useN===false?0:sum.N; q.facSrc='Combos tab, combination (a): maximum '+JSON.stringify(F.A1).replace(/"/g,'')+', minimum '+JSON.stringify(F.A2).replace(/"/g,''); }
  return q; }

/* ---------- SLS free strains: differential shrinkage (Hog time analysis) and temperature gradient (user profile) ---------- */
function dgHogRes(){ var s=dgSnap(), r=s.r; if(!r||!r.res) return null; var ti=DG.tIdx<0?r.res.length-1:Math.min(DG.tIdx,r.res.length-1); return {s:s,r:r,q:r.res[ti]}; }
function dgDshEps(){ var h=dgHogRes(); if(!h||!h.q) return null; var d=h.q.dsh; if(!d) return null; return {eps:-(d.sd-d.sg)/(1+d.chi*d.phd), sd:d.sd, sg:d.sg, phd:d.phd, chi:d.chi}; }
function dgParseProf(t){ var pts=String(t||'').split(/[,;\n]+/).map(function(p){ var q=p.split(/[:=\s]+/).filter(Boolean).map(Number); return q.length>=2&&isFinite(q[0])&&isFinite(q[1])?q:null; }).filter(Boolean).sort(function(a,b){ return a[0]-b[0]; }); return pts.length>=2?pts:null; }
function dgProfAt(pts,y){ if(!pts) return 0; if(y<pts[0][0]||y>pts[pts.length-1][0]) return 0; for(var i=1;i<pts.length;i++){ var a=pts[i-1], b=pts[i]; if(y<=b[0]) return b[0]===a[0]?b[1]:a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0]); } return 0; }
function dgTempOn(){ return DG.temp.alpha>0&&(dgParseProf(DG.temp.pos)||dgParseProf(DG.temp.neg)); }
function dgK1(){ var e=document.getElementById('cb_k1'), v=e?parseFloat(e.value):NaN; return isFinite(v)?v:0.7; }
/* free strain for a combination key: 'b' / 'a' (shrinkage only), 'b+' / 'b-' (traffic lead, k1 × gradient), 't+' / 't-' (gradient lead) */
function dgFreeFor(k){ var sh=DG.opt.dsh?dgDshEps():null, o={sh:sh?sh.eps:0}, al=(DG.temp.alpha||0)*1e-6;
  if(/[+-]$/.test(k)&&al>0){ var pts=dgParseProf(k.slice(-1)==='+'?DG.temp.pos:DG.temp.neg), f=k[0]==='b'?dgK1():1; if(pts) o.T=function(y){ return al*f*dgProfAt(pts,y); }; }
  return (o.sh||o.T)?o:null; }
function dgCombKeys(){ var k=['b','a']; if(dgTempOn()){ if(dgParseProf(DG.temp.pos)) k.push('b+','t+'); if(dgParseProf(DG.temp.neg)) k.push('b-','t-'); } return k; }
function dgCombBuild(lc,X,B,sol){ var out={};
  dgCombKeys().forEach(function(k){ var q;
    if(k==='b') q=lc; else if(k==='a') q=dgCombA(lc);
    else { q=JSON.parse(JSON.stringify(lc)); if(k[0]==='t'){ var f=dgK1(); ['M','V','T','N'].forEach(function(c){ q.brk.a.TRF[c]=(q.brk.a.TRF[c]||0)*f; }); dgTotals(q); } q.comb=k; }
    q.free=dgFreeFor(k); var o=dgLC(X,B,q); o.X=X; o.B=B; o.solid=sol; out[k]={lc:q,o:o}; });
  return out; }
DG_CB_STY['b+']={dash:null,wd:2,suf:' — (b) traffic + k₁·TG+'}; DG_CB_STY['b-']={dash:null,wd:2,suf:' — (b) traffic + k₁·TG−'}; DG_CB_STY['t+']={dash:null,wd:2,suf:' — TG+ lead'}; DG_CB_STY['t-']={dash:null,wd:2,suf:' — TG− lead'};
var dgCombList10=dgCombList; dgCombList=function(){ var l=dgCombList10(); if(DG.an.type==='sls'&&l){ var k1=dgK1(), f=function(k,t){ if(dgCombKeys().indexOf(k)>=0) l.push([k,t]); };
    f('b+','SLS — permanent + traffic + '+k1+' × temperature gradient positive'); f('b-','SLS — permanent + traffic + '+k1+' × temperature gradient negative');
    f('t+','SLS — permanent + temperature gradient positive + '+k1+' × traffic'); f('t-','SLS — permanent + temperature gradient negative + '+k1+' × traffic'); }
  return l; };

/* ---------- per-station strand stress from the Hog time analysis (detailed method exports every station) ---------- */
function dgHogSp(x,G){ var h=dgHogRes(); if(!h||!h.q||!h.q.Pall||!h.r.X) return null; var Q=DG.sec, Ap=Q.Ap, Xh=h.r.X, Lh=h.s.p.L, d=Math.min(x,G.Lg-x)*1000;
  if(d>Lh/2) d=Lh/2; var xh=x<=G.Lg/2?d:Lh-d, j=0; while(j<Xh.length-2&&Xh[j+1]<xh) j++; var a=Xh[j], b=Xh[j+1], w=b>a?Math.max(0,Math.min(1,(xh-a)/(b-a))):0, P0=h.q.Pall[j], P1=h.q.Pall[j+1]||P0;
  if(!P0) return null; var on=Q.strands.filter(function(t){ return t.on; }); if(P0.length!==on.length) return null;   /* Pall is indexed over the ON strands, in order */
  return on.map(function(t,k){ var v=(P0[k]||0)*(1-w)+(P1[k]||0)*w; return v>0?v*1000/Ap:null; }); }

/* ---------- AS 5100.5 approximate tendon stress at ultimate (option): σpu = fpb(1 − k1·k2/γ), k2 = (Apt·fpb + Ast·fsy)/(b·do·f'c) ---------- */
function dgCodeSpu(Su,X){ if(DG.opt.tend!=='code') return; var I=X.info, D=I.tD+I.H, Apt=0, Ay=0, Fp=0, Ast=0, fsy=I.fsy||500;
  Su.tend.forEach(function(t){ if(t.y>D/2){ Apt+=t.A; Ay+=t.A*t.y; Fp+=t.A*t.fpb; } }); Su.bars.forEach(function(b){ if(b.y>D/2) Ast+=b.A; }); if(!Apt) return;
  var fpb=Fp/Apt, dO=Ay/Apt, k2=(Apt*fpb+Ast*fsy)/(I.Wd*dO*I.fcd), g=DSG.gam(I.fcd), spu=fpb*(1-(DG.opt.k1p||0.4)*k2/g);
  Su.spu={fpb:fpb,k2:k2,g:g,spu:spu,dO:dO}; Su.tend.forEach(function(t){ t.fpb=Math.min(t.fpb,spu); t.bil=true; }); }

/* ---------- top-face crack control: Table 8.6.2.1 from the bars near the top face; spacing near the top face ---------- */
function dgTopDb(){ var Q=DG.sec, H=Q.P.D, d=0; Q.gbars.forEach(function(b){ if(b.y>=H/2) d=Math.max(d,b.d); }); (Q.dbars||[]).forEach(function(r){ if(r.d>0&&r.s>0) d=Math.max(d,r.d); }); return d||null; }
function dgNearTopSp(){ var Q=DG.sec, H=Q.P.D, pts=[]; Q.gbars.forEach(function(b){ if(b.y>=H-150) pts.push({x:b.x,y:b.y}); }); Q.strands.forEach(function(t){ if(t.on&&t.y>=H-150) pts.push({x:t.x,y:t.y}); });
  if(!pts.length) return null; var y0=Math.max.apply(null,pts.map(function(p){ return p.y; })), row=pts.filter(function(p){ return p.y>=y0-60; }).map(function(p){ return p.x; }).sort(function(a,b){ return a-b; }), m=0;
  for(var i=1;i<row.length;i++) m=Math.max(m,row[i]-row[i-1]); return {s:m,n:row.length,y0:y0}; }
var dgCCSync9=dgCCSync; dgCCSync=function(){ dgCCSync9(); if(!DG.sec) return; var t=dgT8621(dgTopDb()); DG.cc.fscrT=t; (DG.lc||[]).forEach(function(lc){ lc.fscrT=t.v; }); };
/* the crack-control lines: rebuild the top-face (b) and spacing rows with the top-face values */
var dgCCLines10=dgCCLines; dgCCLines=function(o,lc,k){ var L=dgCCLines10(o,lc,k), tT=DG.cc.fscrT||dgT8621(dgTopDb()), sp=dgNearTopSp(), f=function(v,d){ return anFmt(v,d===undefined?1:d); }, out=[], face='';
  L.forEach(function(l){ if(l.d&&/ — tensile stress$/.test(l.d)) face=l.d;
    var top=/top flange|Deck top/.test(face);
    if(top&&l.d==='(b) bar stress increment'){ var ib=dgIncV(o.incT&&o.incT.b); l=Object.assign({},l,{e:'Δσ_{s}, bars near the top face, from zero stress at that face to M_{s}* (cracked section) ≤ '+tT.v+' ('+tT.why+')',r:f(ib,0)+(ib<=tT.v?' ≤ ':' > ')+tT.v,ok:DG.cc.opt==='b'?ib<=tT.v:undefined}); }
    out.push(l);
    if(top&&/ — exceeds 0.25/.test(l.d||'')&&DG.cc.opt!=='u') out.push({d:'Bars / tendons near the top face',e:'largest centre-to-centre spacing in the top layer ≤ 200 mm',r:sp?f(sp.s,0)+(sp.s<=200?' ≤ ':' > ')+'200':'none',u:'mm',ok:sp?sp.s<=200:false,ref:'Cl 8.6.2.1'}); });
  return out; };
/* top-side steel increment series and chip use the top-face table value */
var dgAnSeries10=dgAnSeries; dgAnSeries=function(){ var out=dgAnSeries10(), a=DG.an; if(a.type==='sls'&&a.res==='stl'&&DG.cc.fscrT&&DG.cc.fscrT.v!==(DG.cc.fscr||{}).v){ var S=DG.gird.st, x0=S[0].x, x1=a.sym?DG.gird.G.Lg/2:S[S.length-1].x;
    out.ser.push({lab:'Table 8.6.2.1, bars near the top face: '+DG.cc.fscrT.v+' MPa ('+DG.cc.fscrT.why+')',c:'var(--flag)',dash:'4 2',wd:1.2,val:true,p:[[x0,DG.cc.fscrT.v],[x1,DG.cc.fscrT.v]]}); }
  if(a.type==='sls'&&a.res==='crk'){ var S2=DG.gird.st.filter(function(r){ return !a.sym||r.x<=DG.gird.G.Lg/2+1e-6; }), c=a.comb; out.ser.push({lab:'M_{s,allow}, top face (hogging side)',c:'var(--calc)',dash:'6 4',wd:1.2,p:S2.map(function(r){ var q=dgCB(r,c); return [r.x,q&&q.o&&isFinite(q.o.MalT)?q.o.MalT:NaN]; })});
    out.note='Crack control is satisfied between the two allowable lines: M_{s}* ≤ M_{s,allow} (soffit side) and M_{s}* ≥ M_{s,allow,top} (top face).'; }
  return out; };
var dgCalcLines10=dgCalcLines; dgCalcLines=function(kind,o,lc,k){ var L=dgCalcLines10(kind,o,lc,k), f=function(v,d){ return anFmt(v,d===undefined?1:d); };
  if(kind==='crack'&&isFinite(o.MalT)) L=L.concat([{sub:'Top face (hogging side)'},{d:'Decompression of the top face',e:'composite M at which max(σ_{top,ST}, σ_{deck top}) = 0',r:f(o.MdecT,0),u:'kN·m'},
    {d:'Allowable SLS moment, top face',e:'smallest M with Δσ_{s} ≤ '+(lc.fscrT||lc.fscr)+' and Δσ_{p} ≤ '+lc.ftcr+' MPa at the top face (cracked section)',r:f(o.MalT,0),u:'kN·m',ref:'Cl 8.6.2.1(b)',k:true},
    {d:'Check',e:'M_{s}* ≥ M_{s,allow,top}',r:f(lc.Ms,0)+(lc.Ms>=o.MalT?' ≥ ':' < ')+f(o.MalT,0),ok:lc.Ms>=o.MalT,ref:'Cl 8.6.2.1'}]);
  if(kind==='uls'){ L=L.map(function(l){ if(/^Neutral-axis parameter/.test(l.d||'')&&!DG.opt.kuoLim) return Object.assign({},l,{ok:undefined,ref:'Cl 8.1.5 — limit switched off (informative)'}); return l; });
    if(o.Su&&o.Su.spu){ var s=o.Su.spu; L.splice(5,0,{d:'Tendon stress at ultimate (approximate method)',e:'σ_{pu} = f_{pb}(1 − k_{1}k_{2}/γ), k_{2} = (A_{pt}f_{pb} + A_{st}f_{sy})/(b d_{o} f\'_{c})',s:f(s.fpb,0)+' × (1 − '+DG.opt.k1p+' × '+f(s.k2,4)+' / '+f(s.g,3)+')',r:f(s.spu,0),u:'MPa',ref:'AS 5100.5 — verify'}); }
    if(lc.facSrc) L.unshift({d:'Load factors',e:lc.facSrc,r:''}); }
  if((kind==='sls'||kind==='actions')&&lc.free){ var sh=dgDshEps(); if(lc.free.sh) L.push({d:'Differential shrinkage (deck relative to girder)',e:'ε_{free,deck} = −(ε_{sh,deck} − ε_{sh,girder})/(1 + χφ_{deck}) (Hog time analysis, AAEM)',s:sh?'−('+f(sh.sd*1e6,0)+' − '+f(sh.sg*1e6,0)+')×10⁻⁶ / (1 + '+sh.chi+' × '+f(sh.phd,2)+')':'',r:f(lc.free.sh*1e6,0)+' ×10⁻⁶',ref:'AS 5100.5 Cl 3.1.7 / 3.1.8 (Hog tab)'});
    if(lc.free.T) L.push({d:'Temperature gradient',e:'free strain αT(y) on deck, Super-T and steel; self-equilibrating (simply supported)',r:'combination '+(lc.comb||'b'),ref:'AS 5100.2 Cl 18.3 (profile: input)'}); }
  return L; };

/* ---------- transfer supports (C8) and the options panel ---------- */
var dgAnLimBar10=dgAnLimBar; dgAnLimBar=function(){ var h=dgAnLimBar10(); if(DG.an.type!=='tr'||!h) return h; var g=DG.sec.gird||{}, G=dgGirdPar(), mode=g.asupMode||'hog';
  var add='<label>Supports at transfer <select id="dg_tsup"><option value="hog"'+(mode==='hog'?' selected':'')+'>Hog tab (a = '+anFmt(isFinite(G.hogA)?G.hogA:G.asup,3)+' m)</option><option value="ends"'+(mode==='ends'?' selected':'')+'>girder ends (casting bed)</option><option value="user"'+(mode==='user'?' selected':'')+'>own value</option></select>'
    +(mode==='user'?' <input class="f" id="dg_tsupv" value="'+(g.asup===null||g.asup===undefined?'':g.asup)+'" style="width:56px"> m':'')+' <span class="tg tU">Input (user)</span></label>';
  return h.replace(/<\/div>$/,add+'</div>'); };
var dgAnLimBind10=dgAnLimBind; dgAnLimBind=function(){ dgAnLimBind10(); var el=$('dg_tsup'); if(!el) return; var g=DG.sec.gird||(DG.sec.gird={Lg:null,a:null,asup:null,Lpt:null,Ld:null,scl:null,src:{}}), re=function(){ DG.poiCache=null; dgRun(true); };
  el.onchange=function(){ g.asupMode=el.value; g.asup=el.value==='ends'?0:el.value==='hog'?null:g.asup; re(); };
  if($('dg_tsupv')) $('dg_tsupv').onchange=function(){ var v=this.value.trim(); g.asup=v===''?null:+v; re(); }; };
function dgOptHTML(){ var o=DG.opt, t=DG.temp, sh=dgDshEps(), k1=dgK1(), chk=function(id,v,lab){ return '<label class="v3dchk"><input type="checkbox" id="'+id+'"'+(v?' checked':'')+'> '+lab+'</label>'; };
  var G=null; try{ G=dgGirdPar(); }catch(e){} var Q=DG.sec, span=G&&G.a!==null&&G.Lg?(G.Lg-G.a-G.a2):null, bef=span?Q.P.Bt+0.2*span*1000:null;
  return '<div class="dgopt">'
   +'<h4>Strength</h4><p>'+'<label>Tendon stress at ultimate <select id="dgo_tend"><option value="sc"'+(o.tend!=='code'?' selected':'')+'>strain compatibility — strand curve (Mattock form)</option><option value="code"'+(o.tend==='code'?' selected':'')+'>AS 5100.5 approximate σpu = fpb(1 − k1k2/γ)</option></select></label> '
   +'<label>k<sub>1</sub> <input class="f" id="dgo_k1" value="'+o.k1p+'" style="width:48px"></label> <span class="tg tS">Standard — verify</span></p>'
   +'<p>'+chk('dgo_kuo',o.kuoLim,'Apply k<sub>uo</sub> ≤ 0.36 as a pass / fail check (otherwise informative — φ already varies with k<sub>uo</sub>)')+'</p>'
   +'<p>'+chk('dgo_N',o.useN,'Carry the grillage axial force N* / N<sub>s</sub>* (permanent stages; traffic N not enveloped)')+'</p>'
   +'<h4>Serviceability loads</h4><p>'+chk('dgo_dsh',o.dsh,'Differential shrinkage of the deck (from the Hog time analysis at the selected age)')+' '+(sh?'<span>ε<sub>free,deck</sub> = '+anFmt(sh.eps*1e6,0)+' ×10⁻⁶ <span class="tg tC">Calculated</span></span>':'<span class="bbflag">not available — the Hog tab must use the detailed method with a deck</span>')+'</p>'
   +'<p><b>Temperature gradient</b> (AS 5100.2 Cl 18.3) — enter the profile as depth from the deck top (mm) : temperature difference (°C) pairs.</p>'
   +'<p><label>α (×10⁻⁶ /°C) <input class="f" id="dgo_al" value="'+(t.alpha===null?'':t.alpha)+'" style="width:56px"></label> '+(t.alpha>0?'<span class="tg tU">Input (user)</span>':'<span class="tg" style="color:var(--flag)">Missing — Flagged</span>')+'</p>'
   +'<p><label>Positive (top hot) <input class="f" id="dgo_tp" value="'+t.pos+'" placeholder="0:T1, 150:T2, 400:0, …" style="width:340px"></label> <label>Negative (top cold) <input class="f" id="dgo_tn" value="'+t.neg+'" placeholder="0:−T1, …" style="width:340px"></label> '+(dgTempOn()?'<span class="tg tU">Input (user)</span>':'<span class="tg" style="color:var(--flag)">Missing — Flagged</span>')+'</p>'
   +'<p class="dgg">With a profile entered, SLS gains four combinations: traffic lead with '+k1+' × gradient, and gradient lead with '+k1+' × traffic (k<sub>1</sub> from the Combos tab). The span is simply supported, so the gradient gives self-equilibrating (primary) stresses only. Temperature is not added at ULS.</p>'
   +'<h4>Section</h4><p>Effective flange width: b<sub>ef</sub> = B<sub>t</sub> + 0.2a = '+(bef?anFmt(Q.P.Bt,0)+' + 0.2 × '+anFmt(span*1000,0)+' = '+anFmt(bef,0)+' mm':'—')+' vs deck width carried by the girder '+anFmt(Q.Wd,0)+' mm → '+(bef&&bef<Q.Wd?'<b class="bbflag">effective width governs — reduce the deck width</b>':'full deck width effective')+' <span class="tg tS">Standard — verify (T-beam rule)</span></p>'
   +'</div>'; }
function dgOptBind(){ var re=function(){ DG.poiCache=null; dgCCSync(); dgRun(true); var b=$('dg_opt'); if(b){ b.innerHTML=dgOptHTML(); dgOptBind(); } };
  var on=function(id,f){ var e=$(id); if(e) e.onchange=function(){ f(e); re(); }; };
  on('dgo_tend',function(e){ DG.opt.tend=e.value; }); on('dgo_k1',function(e){ var v=parseFloat(e.value); DG.opt.k1p=isFinite(v)?v:0.4; });
  on('dgo_kuo',function(e){ DG.opt.kuoLim=e.checked; }); on('dgo_N',function(e){ DG.opt.useN=e.checked; DG.lc.forEach(function(lc){ if(lc.brk) dgTotals(lc); }); }); on('dgo_dsh',function(e){ DG.opt.dsh=e.checked; });
  on('dgo_al',function(e){ var v=parseFloat(e.value); DG.temp.alpha=isFinite(v)?v:null; }); on('dgo_tp',function(e){ DG.temp.pos=e.value; }); on('dgo_tn',function(e){ DG.temp.neg=e.value; }); }
var dgBuild10=dgBuild; dgBuild=function(){ var first=!($('paneDG')&&$('paneDG').dataset.built); dgBuild10(); if(!first||!$('dg_setp')) return;
  $('dg_setp').insertAdjacentHTML('beforeend','<option value="opt">Analysis options, temperature, shrinkage, N*</option>');
  var host=$('dg_setp').closest('.dgcard').querySelector('.dgbody'); host.insertAdjacentHTML('beforeend','<div data-set="opt" hidden><div id="dg_opt"></div></div>');
  $('dg_opt').innerHTML=dgOptHTML(); dgOptBind();
  $('dg_setp').addEventListener('change',function(){ if($('dg_setp').value==='opt'){ $('dg_opt').innerHTML=dgOptHTML(); dgOptBind(); } }); };
/* kuo pass / fail in the summary follows the option */
var dgAnSum10=dgAnSum; dgAnSum=function(){ dgAnSum10(); };
/* D2: Cl 8.6.1 is the reinforced-beam clause — label it informative */
var dgAnResList10=dgAnResList; dgAnResList=function(){ return dgAnResList10().map(function(q){ return q[0]==='rst'?['rst','Reinforcement stress σ_{scr} — Cl 8.6.1 (reinforced-beam clause; informative for this prestressed beam)']:q; }); };
