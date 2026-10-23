/* ===== v40: Loads → Wind on the integrated model (step 3, second part).
   Transverse wind on the superstructure and on vehicles, vertical wind (uplift / downward, eccentric) and longitudinal wind,
   as unfactored nodal load cases on the girder lines of the one model (deck + bearings + headstocks + piles + ground springs).
   Site and code values not in the drawing set are ASSUMED so the model runs (engineer instruction 2026-10-23); each input
   says what was assumed, right next to it. ===== */
var WD={V:45, rho:1.2, Cd:1.5, hBar:1.1, CL:0.75, eL:0.25, fLon:0.25, wVeh:1.5, hVeh:2.0, res:null, ver:0};
function wdGeom(){ var D=ldDeck(), M=AN.parseMCT(document.getElementById('an_mct_src').textContent);
  var lines=D.lines.filter(function(l){ var g=l.p.filter(function(q){ return D.role[q.id]==='girder'; }).length; return g>=l.p.length/2&&l.p.length>2; })
    .map(function(l){ return {o:l.o, p:l.p.filter(function(q){ return M.nodes[q.id]; }).slice().sort(function(a,b){ return a.c-b.c; })}; });
  var all=D.lines.map(function(l){ return l.o; }), oL=Math.min.apply(null,all), oR=Math.max.apply(null,all);
  var gd=1.515, tD=(typeof P!=='undefined'&&P.slab)||0.2, ts=(typeof P!=='undefined'&&P.surf)||0.075;
  return {M:M, lines:lines, oL:oL, oR:oR, b:oR-oL, oc:(oL+oR)/2, gd:gd, tD:tD, ts:ts}; }
function wdQ(){ return 0.5*WD.rho*WD.V*WD.V/1000; }   /* kPa */
function wdCases(G){ var q=wdQ(), nG=G.lines.length, add=function(L,n,f){ var a=L[n]=L[n]||[0,0,0,0,0,0]; for(var i=0;i<6;i++) a[i]+=f[i]||0; };
  var dExp=G.gd+G.tD+WD.hBar, eSup=(WD.hBar-(G.gd+G.tD))/2, eVeh=G.ts+WD.hVeh;   /* lever arms above the node plane (top of deck slab) */
  var wT=q*WD.Cd*dExp, wV=q*WD.CL*G.b, wL=WD.fLon*wT;
  var tan=function(c){ var a=pt(c-0.5,0), b=pt(c+0.5,0), v=[b[0]-a[0],b[1]-a[1]], L=Math.hypot(v[0],v[1]); return [v[0]/L,v[1]/L]; };
  var nor=function(c){ var a=pt(c,0), b=pt(c,1), v=[b[0]-a[0],b[1]-a[1]], L=Math.hypot(v[0],v[1]); return [v[0]/L,v[1]/L]; };   /* towards +offset */
  var C={}, mk=function(id,n,cl){ C[id]={id:id,n:n,cl:cl,L:{}}; return C[id]; };
  var ys=G.lines.map(function(l){ return l.o-G.oc; }), Syy=ys.reduce(function(a,y){ return a+y*y; },0);
  mk('WT+','Transverse wind on the superstructure, towards +offset','q·C<sub>d</sub>·d = '+wT.toFixed(2)+' kN/m at '+eSup.toFixed(2)+' m above the node plane');
  mk('WT−','Transverse wind on the superstructure, towards −offset','as WT+, reversed');
  mk('WTV+','Transverse wind on vehicles, towards +offset',WD.wVeh.toFixed(2)+' kN/m at '+eVeh.toFixed(2)+' m above the node plane, full length');
  mk('WTV−','Transverse wind on vehicles, towards −offset','as WTV+, reversed');
  mk('WVU+','Vertical wind — uplift, wind towards +offset','q·C<sub>L</sub>·b = '+wV.toFixed(2)+' kN/m at '+(WD.eL*G.b).toFixed(2)+' m to windward of the deck centre');
  mk('WVU−','Vertical wind — uplift, wind towards −offset','as WVU+, mirrored');
  mk('WVD+','Vertical wind — downward, wind towards +offset','as WVU+, downward');
  mk('WVD−','Vertical wind — downward, wind towards −offset','as WVD+, mirrored');
  mk('WL+','Longitudinal wind, towards increasing chainage (abutment B)',WD.fLon+' × transverse superstructure wind = '+wL.toFixed(2)+' kN/m');
  mk('WL−','Longitudinal wind, towards abutment A','as WL+, reversed');
  G.lines.forEach(function(l,j){ var y=ys[j];
    l.p.forEach(function(p,i){ var a=i>0?(p.c-l.p[i-1].c)/2:0, b=i<l.p.length-1?(l.p[i+1].c-p.c)/2:0, t=a+b; if(t<=0) return; var n=nor(p.c), s=tan(p.c), sh=t/nG;
      var hz=function(w,e,sg){ var f=[sg*w*sh*n[0],sg*w*sh*n[1],0]; return [f[0],f[1],0,-e*f[1],e*f[0],0]; };   /* M = (0,0,e) × F */
      add(C['WT+'].L,p.id,hz(wT,eSup,1)); add(C['WT−'].L,p.id,hz(wT,eSup,-1));
      add(C['WTV+'].L,p.id,hz(WD.wVeh,eVeh,1)); add(C['WTV−'].L,p.id,hz(WD.wVeh,eVeh,-1));
      /* vertical: total wV per metre at e = eL·b on the windward side (windward = −offset side for wind towards +offset) */
      var vz=function(sg,side){ var Mx=wV*WD.eL*G.b*side, f=wV/nG+(Syy>0?Mx*y/Syy:0); return [0,0,sg*f*t]; };
      add(C['WVU+'].L,p.id,vz(1,-1)); add(C['WVU−'].L,p.id,vz(1,1)); add(C['WVD+'].L,p.id,vz(-1,-1)); add(C['WVD−'].L,p.id,vz(-1,1));
      add(C['WL+'].L,p.id,[wL*sh*s[0],wL*sh*s[1],0,-eSup*wL*sh*s[1],eSup*wL*sh*s[0],0]); add(C['WL−'].L,p.id,[-wL*sh*s[0],-wL*sh*s[1],0,eSup*wL*sh*s[1],-eSup*wL*sh*s[0],0]); }); });
  return {list:Object.keys(C).map(function(k){ return C[k]; }), wT:wT, wV:wV, wL:wL, dExp:dExp, eSup:eSup, eVeh:eVeh, q:q}; }
/* solve nodal-load cases on the integrated model (all members active, self weight off) */
function wdSolve(M,cases){ var P2=AN.prepare(M,{shear:true,weightOn:function(){ return false; }}), K=AN.assembleK(P2); AN.cholesky(K,P2.nf);
  var piles=SUBM&&SUBM.info?SUBM.info.piles:[], links=P2.els.filter(function(e){ return e.link; }), lnk={}; (M.links||[]).forEach(function(l){ lnk['L'+l.id]=l; });
  return cases.map(function(cs){ var F=new Float64Array(P2.nf), tot=[0,0,0];
    Object.keys(cs.L).forEach(function(n){ var v=cs.L[n], i0=6*P2.idx[n]; if(!isFinite(i0)) return; for(var k=0;k<6;k++){ var r=P2.freeMap[i0+k]; if(r>=0) F[r]+=v[k]; } tot[0]+=v[0]; tot[1]+=v[1]; tot[2]+=v[2]; });
    var u=AN.cholSolve(K,P2.nf,F), U=new Float64Array(P2.ndof); for(var i=0;i<P2.ndof;i++) if(P2.freeMap[i]>=0) U[i]=u[P2.freeMap[i]];
    var ef={}; P2.els.forEach(function(e){ var ue=e.dof.map(function(d){ return U[d]; }), ul=e.T.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ue[j]; return s; }); ef[e.id]=e.Kl.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ul[j]; return s; }); });
    var brg=links.map(function(e){ var f=ef[e.id]; return {id:e.id,ab:/AbutB/i.test((lnk[e.id]||{}).group||'')?'B':'A',v:f[0],tr:-f[1],lon:-f[2]}; });
    var pl=piles.map(function(pi){ var mx=0,vx=0,zM=null; P2.els.forEach(function(e){ if(e.link||pi.chain.indexOf(e.n1)<0||pi.chain.indexOf(e.n2)<0) return; var f=ef[e.id];
        [[f[4],f[5],f[1],f[2],M.nodes[e.n1][2]],[f[10],f[11],f[7],f[8],M.nodes[e.n2][2]]].forEach(function(q){ var m=Math.hypot(q[0],q[1]), v=Math.hypot(q[2],q[3]); if(m>mx){ mx=m; zM=q[4]; } vx=Math.max(vx,v); }); });
      var it=6*P2.idx[pi.top]; return {ab:pi.ab,id:pi.id,M:mx,zM:zM,V:vx,dx:Math.hypot(U[it],U[it+1])*1000}; });
    var sx=0, sy=0, sz=0; (P2.spr||[]).forEach(function(s){ var f=s.k*U[s.dof]; if(s.k6===0) sx+=f; if(s.k6===1) sy+=f; if(s.k6===2) sz+=f; });
    var dh=0; Object.keys(cs.L).forEach(function(n){ var i0=6*P2.idx[n]; if(isFinite(i0)) dh=Math.max(dh,Math.hypot(U[i0],U[i0+1])); });
    return {cs:cs,tot:tot,brg:brg,piles:pl,sprX:sx,sprY:sy,dh:dh*1000}; }); }
function wdRun(){ var G=wdGeom(), C=wdCases(G); WD.res={G:G,C:C,res:wdSolve(G.M,C.list),at:new Date()}; WD.ver++; return WD.res; }
function wdBuild(){ var pane=document.getElementById('paneWD'); if(!pane) return; var $=function(i){ return document.getElementById(i); };
  var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var AS='<span class="tg" style="color:#b45309">Assumed</span>', SV='<span class="tg" style="color:#7c3aed">Standard — verify</span>', DI='<span class="tg tD">Direct</span>', CA='<span class="tg tC">Calculated</span>', MO='<span class="tg">Model</span>';
  var inp=function(k,v,w){ return '<input class="f wdin" data-k="'+k+'" value="'+v+'" style="width:'+(w||64)+'px">'; };
  var as=function(t){ return '<div class="wdas">'+AS+' '+t+'</div>'; };
  var G=null, C=null, err=null; try{ G=wdGeom(); C=wdCases(G); }catch(e){ err=e.message; }
  var h='<div class="card"><div class="sdh">Wind on the integrated model — superstructure, vehicles, vertical and longitudinal</div><div class="bbnote">Unfactored wind load cases applied to the girder lines of the one model (bearings, headstocks, piles and ground springs from Boundary &rarr; Bearings and supports). Factors and combinations stay in the AS 5100.2 Combos tab. Where the drawing set gives no value, a value is <b>assumed</b> so the model runs, and the assumption is stated under the input it applies to. Wind on the substructure is not applied: the headstocks and pile columns sit inside the spill-through embankment.</div></div>';
  if(err) h+='<div class="card bbflag">'+err+'</div>';
  if(G){ h+='<div class="card"><div class="sdh">1. Wind speed and pressure</div><table class="dt wdt" style="max-width:1150px"><tr><th class="l">Input</th><th>Value</th><th class="l">Source and assumption</th></tr>'
     +'<tr><td class="l">Design wind speed V<sub>des</sub> (m/s), ultimate</td><td>'+inp('V',WD.V)+'</td><td class="l">'+as('45 m/s used. The site wind speed (region, terrain category, shielding, topography, return period to AS 5100.2 / AS/NZS 1170.2) is not in the drawing set — replace with the site value; for the serviceability case enter the serviceability speed and re-solve.')+'</td></tr>'
     +'<tr><td class="l">Air density ρ (kg/m³)</td><td>'+inp('rho',WD.rho)+'</td><td class="l">'+SV+' 1.2 kg/m³ used (AS/NZS 1170.2 value — confirm).</td></tr>'
     +'<tr><td class="l">Dynamic pressure q = ½ρV²</td><td>'+f(C.q,3)+' kPa</td><td class="l">'+CA+'</td></tr></table></div>';
    h+='<div class="card"><div class="sdh">2. Superstructure — transverse, vertical and longitudinal</div><table class="dt wdt" style="max-width:1150px"><tr><th class="l">Input</th><th>Value</th><th class="l">Source and assumption</th></tr>'
     +'<tr><td class="l">Girder depth</td><td>'+f(G.gd,3)+' m</td><td class="l">'+DI+' Super-T, GA</td></tr>'
     +'<tr><td class="l">Deck slab</td><td>'+f(G.tD,3)+' m</td><td class="l">'+DI+' GA</td></tr>'
     +'<tr><td class="l">Barrier height above the deck slab (m)</td><td>'+inp('hBar',WD.hBar,56)+'</td><td class="l">'+as('1.1 m used. Precast barrier on DRG 202401 — its height is not given in this drawing set; solid barrier taken as fully exposed (no open rail area).')+'</td></tr>'
     +'<tr><td class="l">Exposed depth d (girder soffit to top of barrier)</td><td>'+f(C.dExp,3)+' m</td><td class="l">'+CA+'</td></tr>'
     +'<tr><td class="l">Drag coefficient C<sub>d</sub></td><td>'+inp('Cd',WD.Cd,56)+'</td><td class="l">'+as('1.5 used. Read C<sub>d</sub> from the AS 5100.2 chart for b/d = '+f(G.b/C.dExp,2)+' (deck width / exposed depth), with any superelevation adjustment.')+'</td></tr>'
     +'<tr><td class="l">Transverse wind on the superstructure q·C<sub>d</sub>·d</td><td>'+f(C.wT,2)+' kN/m</td><td class="l">'+CA+' horizontal, normal to the control line; applied at the centroid of the exposed depth, '+f(C.eSup,2)+' m above the node plane (top of deck slab) '+MO+'</td></tr>'
     +'<tr><td class="l">Deck width b (edge to edge)</td><td>'+f(G.b,3)+' m</td><td class="l">'+CA+' from the deck edge lines of the model</td></tr>'
     +'<tr><td class="l">Lift coefficient C<sub>L</sub> (±)</td><td>'+inp('CL',WD.CL,56)+'</td><td class="l">'+as('0.75 used, upward and downward. Confirm the AS 5100.2 vertical wind coefficient.')+'</td></tr>'
     +'<tr><td class="l">Eccentricity of the vertical wind, × b to windward</td><td>'+inp('eL',WD.eL,56)+'</td><td class="l">'+as('0.25 b used (quarter width to windward). Confirm with AS 5100.2.')+'</td></tr>'
     +'<tr><td class="l">Vertical wind q·C<sub>L</sub>·b</td><td>'+f(C.wV,2)+' kN/m</td><td class="l">'+CA+' shared between the girder lines as a force plus the moment of its eccentricity</td></tr>'
     +'<tr><td class="l">Longitudinal wind, fraction of the transverse superstructure wind</td><td>'+inp('fLon',WD.fLon,56)+'</td><td class="l">'+as('0.25 used for a solid superstructure. Confirm with AS 5100.2.')+'</td></tr></table></div>';
    h+='<div class="card"><div class="sdh">3. Wind on vehicles</div><table class="dt wdt" style="max-width:1150px"><tr><th class="l">Input</th><th>Value</th><th class="l">Source and assumption</th></tr>'
     +'<tr><td class="l">Line load on vehicles (kN/m), transverse</td><td>'+inp('wVeh',WD.wVeh,56)+'</td><td class="l">'+as('1.5 kN/m used over the full length. Confirm the AS 5100.2 wind-on-traffic value and the speed it goes with (wind on vehicles is combined with a reduced wind speed on the structure).')+'</td></tr>'
     +'<tr><td class="l">Height of the line load above the road surface (m)</td><td>'+inp('hVeh',WD.hVeh,56)+'</td><td class="l">'+as('2.0 m used. Confirm with AS 5100.2.')+' Lever above the node plane = surfacing '+f(G.ts,3)+' + height = '+f(C.eVeh,2)+' m '+CA+'</td></tr></table></div>';
  }
  h+='<div class="card"><div class="msbar"><button class="b" id="wd_run">Solve the wind cases</button><span class="n" id="wd_st">'+(WD.res?'Solved '+WD.res.at.toTimeString().slice(0,8):'')+'</span><button class="b" id="wd_mct">Download for MIDAS (.mct)</button></div><div id="wd_out"></div></div>';
  pane.innerHTML=h; pane.dataset.built=1;
  [].forEach.call(pane.querySelectorAll('.wdin'),function(el){ el.onchange=function(){ var k=el.getAttribute('data-k'), n=parseFloat(el.value); if(isFinite(n)) WD[k]=n; WD.res=null; wdBuild(); }; });
  $('wd_run').onclick=function(){ $('wd_st').textContent='Solving…'; setTimeout(function(){ try{ wdRun(); wdShow(); $('wd_st').textContent='Solved '+WD.res.at.toTimeString().slice(0,8)+' on the integrated model'; }catch(e){ $('wd_st').textContent='Stopped: '+e.message; console.error(e); } },20); };
  $('wd_mct').onclick=wdMCT;
  if(WD.res) wdShow(); }
function wdShow(){ var o=document.getElementById('wd_out'); if(!o||!WD.res) return; var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var R=WD.res.res, s=function(a,k){ return a.reduce(function(t,b){ return t+b[k]; },0); };
  var h='<div class="sdh">4. Results per load case (unfactored)</div><div class="stfwrap"><table class="dt"><tr><th class="l" style="min-width:230px">Load case</th><th>Applied ΣFx / ΣFy / ΣFz (kN)</th><th>Ground springs ΣFx / ΣFy (kN)</th><th>Bearings A: Σ long. / Σ trans. (kN)</th><th>Bearings B: Σ long. / Σ trans. (kN)</th><th>Bearing vertical, min / max (kN)</th><th>Max pile |M| (kN·m)</th><th>Max pile-head deflection (mm)</th><th>Max deck horizontal deflection (mm)</th></tr>';
  R.forEach(function(r){ var A=r.brg.filter(function(b){ return b.ab==='A'; }), B=r.brg.filter(function(b){ return b.ab==='B'; }), vs=r.brg.map(function(b){ return b.v; });
    var pm=r.piles.reduce(function(a,p){ return p.M>a.M?p:a; },{M:0}), pd=Math.max.apply(null,r.piles.map(function(p){ return p.dx; }));
    h+='<tr><td class="l"><b>'+r.cs.id+'</b> '+r.cs.n+'<div class="dgg">'+r.cs.cl+'</div></td><td>'+f(r.tot[0],1)+' / '+f(r.tot[1],1)+' / '+f(r.tot[2],1)+'</td><td>'+f(-r.sprX,1)+' / '+f(-r.sprY,1)+'</td><td>'+f(s(A,'lon'),1)+' / '+f(s(A,'tr'),1)+'</td><td>'+f(s(B,'lon'),1)+' / '+f(s(B,'tr'),1)+'</td><td>'+f(Math.min.apply(null,vs),1)+' / '+f(Math.max.apply(null,vs),1)+'</td><td>'+f(pm.M,1)+(pm.id?' ('+pm.id+', RL '+f(pm.zM,2)+')':'')+'</td><td>'+f(pd,2)+'</td><td>'+f(r.dh,2)+'</td></tr>'; });
  h+='</table></div><div class="bbnote">Check: the ground springs carry the whole applied horizontal load (columns 2 and 3 equal). Hand check of the totals: transverse superstructure wind × deck length along the girder lines = ΣF of WT+; vertical wind × length = ΣFz of WVU+. Bearing vertical = force on the headstock (compression positive); the uplift cases show the reduction of the permanent bearing reaction — combine with the dead load in the Combos tab before checking for uplift.</div>';
  var Lg=WD.res.G.lines.map(function(l){ return l.p[l.p.length-1].c-l.p[0].c; }), Lm=Lg.reduce(function(a,b){ return a+b; },0)/Lg.length, C=WD.res.C, r0=R[0], rv=R[4];
  h+='<table class="dt" style="max-width:900px;margin-top:6px"><tr><th class="l">Hand check</th><th>Hand</th><th>Model</th></tr>'
   +'<tr><td class="l">WT+ total = '+f(C.wT,3)+' kN/m × mean girder-line length '+f(Lm,3)+' m</td><td>'+f(C.wT*Lm,1)+' kN</td><td>'+f(Math.hypot(r0.tot[0],r0.tot[1]),1)+' kN</td></tr>'
   +'<tr><td class="l">WVU+ total = '+f(C.wV,3)+' kN/m × '+f(Lm,3)+' m</td><td>'+f(C.wV*Lm,1)+' kN</td><td>'+f(rv.tot[2],1)+' kN</td></tr></table>';
  h+='<div class="msbar" style="margin-top:8px"><label>Detail for <select id="wd_sel">'+R.map(function(r,i){ return '<option value="'+i+'">'+r.cs.id+' — '+r.cs.n+'</option>'; }).join('')+'</select></label></div><div id="wd_det"></div>';
  o.innerHTML=h; var sel=document.getElementById('wd_sel'); sel.onchange=function(){ wdDet(+sel.value); }; wdDet(0); }
function wdDet(i){ var r=WD.res.res[i], f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var h='<div class="srfgrid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><div><table class="dt"><tr><th>Bearing</th><th>Vertical, compression + (kN)</th><th>Transverse (kN)</th><th>Longitudinal (kN)</th></tr>';
  r.brg.forEach(function(b){ h+='<tr><td>'+b.ab+' '+b.id+'</td><td>'+f(b.v,1)+'</td><td>'+f(b.tr,1)+'</td><td>'+f(b.lon,1)+'</td></tr>'; });
  h+='</table></div><div><table class="dt"><tr><th>Pile</th><th>Max |M| (kN·m)</th><th>at RL</th><th>Max |V| (kN)</th><th>Head deflection (mm)</th></tr>';
  r.piles.forEach(function(p){ h+='<tr><td>'+p.id+'</td><td>'+f(p.M,1)+'</td><td>'+f(p.zM,2)+'</td><td>'+f(p.V,1)+'</td><td>'+f(p.dx,2)+'</td></tr>'; });
  document.getElementById('wd_det').innerHTML=h+'</table></div></div>'; }
function wdMCT(){ var C=wdCases(wdGeom()).list, id=function(s){ return s.replace('−','m').replace('+','p'); }, L=['; BR13A wind load cases — generated by the dashboard (Loads → Wind). Unfactored; inputs marked Assumed in the dashboard. VERIFY on import.','*STLDCASE    ; Static Load Cases','; LCNAME, LCTYPE, DESC'];
  C.forEach(function(c){ L.push('   '+id(c.id)+', W, '+c.n.replace(/,/g,' ')); });
  C.forEach(function(c){ L.push('*USE-STLD, '+id(c.id),'*CONLOAD    ; Nodal Loads','; NODE_LIST, FX, FY, FZ, MX, MY, MZ, GROUP');
    Object.keys(c.L).forEach(function(n){ var v=c.L[n]; L.push('   '+n+', '+v.map(function(x){ return (+x).toFixed(4); }).join(', ')+', '); }); });
  var bl=new Blob([L.join('\n')],{type:'text/plain'}), a=document.createElement('a'); a.href=URL.createObjectURL(bl); a.download='BR13A_wind_loadcases.mct.txt'; a.click(); }
(function(){ if(typeof TABS==='undefined') return; var lv=document.getElementById('paneTM')||document.getElementById('paneLD'); if(!lv) return;
  var pane=document.createElement('div'); pane.id='paneWD'; pane.style.display='none'; lv.parentNode.insertBefore(pane,lv.nextSibling);
  TABS.push({id:'wd',label:'Wind',pane:'paneWD',build:function(){ wdBuild(); },draw:function(){}});
  TABS.forEach(function(t){ if(t.id==='ld'&&/wind/i.test(t.label)) t.label='Loads (SDL)'; });   /* wind now has its own page */
  var G=TAB_GROUPS.filter(function(g){ return g.g==='load'; })[0]; if(G){ var i=G.ids.indexOf('tm'); G.ids.splice(i>=0?i+1:G.ids.length,0,'wd'); }
  var act=typeof ACTIVE!=='undefined'?ACTIVE:null; initTabs(); if(act) try{ showTab(act); }catch(e){}
  if(typeof SUBM!=='undefined'&&SUBM){ var a0=SUBM.apply; SUBM.apply=function(){ a0.apply(SUBM,arguments); WD.res=null; }; } })();
