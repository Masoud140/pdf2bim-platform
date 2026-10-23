/* ===== v39: Loads → Temperature (uniform) on the integrated model.
   Uniform temperature change of the superstructure (girders, deck strips, diaphragms, rigid offsets) from the setting temperature
   to the maximum / minimum effective bridge temperature. Headstocks and piles are not heated (buried / shaded) [Model].
   Solved as an imposed axial strain α·ΔT: fixed-end axial force E·A·α·ΔT on each heated member, equivalent nodal loads,
   member forces = K·u + fixed-end forces. Site temperatures are PLACEHOLDERS until set from AS 5100.2 for the site. ===== */
/* deformation of a bearing link's shear springs (mm), at their position along the link (MIDAS GEN link: spring at DRy / DRz of the length from node 1) */
function brgDef(l,L,lk){ var ay=(lk&&isFinite(lk.dry))?lk.dry:0.5, az=(lk&&isFinite(lk.drz))?lk.drz:0.5;
  return [((l[7]-(1-ay)*L*l[11])-(l[1]+ay*L*l[5]))*1000, ((l[8]+(1-az)*L*l[10])-(l[2]-az*L*l[4]))*1000]; }
var TM={Tmax:45, Tmin:5, Tset:20, alpha:10e-6, res:null, ver:0};
/* superstructure = the frame elements connected (without crossing bearing links) to the composite girders */
function tmSuper(M){ var adj={}, byN={}; M.els.forEach(function(e){ [e.n1,e.n2].forEach(function(n){ (byN[n]=byN[n]||[]).push(e); }); });
  var seed=M.els.filter(function(e){ return /composite/i.test((M.secs[e.sec]||{}).name||''); }), seen={}, st=seed.slice(), out={};
  seed.forEach(function(e){ seen[e.id]=1; });
  while(st.length){ var e=st.pop(); out[e.id]=e; [e.n1,e.n2].forEach(function(n){ (byN[n]||[]).forEach(function(q){ if(!seen[q.id]){ seen[q.id]=1; st.push(q); } }); }); }
  return out; }
function tmCases(){ return [{id:'TU+',n:'Uniform temperature rise',dT:TM.Tmax-TM.Tset,cl:'ΔT = T<sub>max</sub> − T<sub>set</sub> = '+(TM.Tmax-TM.Tset).toFixed(1)+' °C (expansion)'},
  {id:'TU−',n:'Uniform temperature fall',dT:TM.Tmin-TM.Tset,cl:'ΔT = T<sub>min</sub> − T<sub>set</sub> = '+(TM.Tmin-TM.Tset).toFixed(1)+' °C (contraction)'}]; }
function tmRun(){ var M=AN.parseMCT(document.getElementById('an_mct_src').textContent), P2=AN.prepare(M,{shear:true,weightOn:function(){ return false; }}), K=AN.assembleK(P2); AN.cholesky(K,P2.nf);
  var sup=tmSuper(M), piles=SUBM&&SUBM.info?SUBM.info.piles:[], links=P2.els.filter(function(e){ return e.link; }), heated=P2.els.filter(function(e){ return !e.link&&sup[e.id]; });
  var lnk={}; (M.links||[]).forEach(function(l){ lnk['L'+l.id]=l; });
  /* fixed point check: chord from each A bearing to the B bearing of the same girder (order of the links in the file) */
  var bA=links.filter(function(e){ return /AbutA/i.test((lnk[e.id]||{}).group||''); }), bB=links.filter(function(e){ return /AbutB/i.test((lnk[e.id]||{}).group||''); });
  var res=tmCases().map(function(cs){ var F=new Float64Array(P2.nf), FF={}, at=TM.alpha*cs.dT;
    heated.forEach(function(e){ var me=M.els.find(function(q){ return q.id===e.id; }), E=M.mats[me.mat].E, A=M.secs[me.sec].A, N=E*A*at, ex=[e.T[0][0],e.T[0][1],e.T[0][2]];
      FF[e.id]=N; [[e.n1,-1],[e.n2,1]].forEach(function(q){ var i0=6*P2.idx[q[0]]; for(var k=0;k<3;k++){ var r=P2.freeMap[i0+k]; if(r>=0) F[r]+=q[1]*N*ex[k]; } }); });
    var u=AN.cholSolve(K,P2.nf,F), U=new Float64Array(P2.ndof); for(var i=0;i<P2.ndof;i++) if(P2.freeMap[i]>=0) U[i]=u[P2.freeMap[i]];
    var ef={}, ul={}; P2.els.forEach(function(e){ var ue=e.dof.map(function(d){ return U[d]; }), l=e.T.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ue[j]; return s; }), fl=e.Kl.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*l[j]; return s; });
      if(FF[e.id]){ fl[0]+=FF[e.id]; fl[6]-=FF[e.id]; } ef[e.id]=fl; ul[e.id]=l; });
    var brg=links.map(function(e){ var f=ef[e.id], l=ul[e.id], g=(lnk[e.id]||{}).group||''; return {id:e.id,ab:/AbutB/i.test(g)?'B':'A',v:f[0],tr:-f[1],lon:-f[2],dtr:brgDef(l,e.L,lnk[e.id])[0],dlon:brgDef(l,e.L,lnk[e.id])[1]}; });
    var pl=piles.map(function(pi){ var mx=0,vx=0,zM=null; P2.els.forEach(function(e){ if(e.link||pi.chain.indexOf(e.n1)<0||pi.chain.indexOf(e.n2)<0) return; var f=ef[e.id];
        [[f[4],f[5],f[1],f[2],M.nodes[e.n1][2]],[f[10],f[11],f[7],f[8],M.nodes[e.n2][2]]].forEach(function(q){ var m=Math.hypot(q[0],q[1]), v=Math.hypot(q[2],q[3]); if(m>mx){ mx=m; zM=q[4]; } vx=Math.max(vx,v); }); });
      var it=6*P2.idx[pi.top]; return {ab:pi.ab,id:pi.id,top:pi.top,M:mx,zM:zM,V:vx,dx:Math.hypot(U[it],U[it+1])*1000}; });
    var sx=0, sy=0; (P2.spr||[]).forEach(function(s){ var f=s.k*U[s.dof]; if(s.k6===0) sx+=f; if(s.k6===1) sy+=f; });
    /* girder axial force range (composite girders) */
    var gN=heated.filter(function(e){ var me=M.els.find(function(q){ return q.id===e.id; }); return /composite/i.test(M.secs[me.sec].name); }).map(function(e){ return ef[e.id][6]; });
    /* hand check: free expansion of the deck from the fixed bearings at A, measured along each girder chord A → B */
    var hc=bA.map(function(a,i){ var b=bB[i]; if(!b) return null; var pa=M.nodes[a.n2], pb=M.nodes[b.n2], d=[pb[0]-pa[0],pb[1]-pa[1],pb[2]-pa[2]], L=Math.hypot(d[0],d[1],d[2]), ia=6*P2.idx[a.n2], ib=6*P2.idx[b.n2], du=0; for(var k=0;k<3;k++) du+=(U[ib+k]-U[ia+k])*d[k]/L; return {L:L,free:at*L*1000,model:du*1000}; }).filter(Boolean);
    return {cs:cs,brg:brg,piles:pl,sprX:sx,sprY:sy,gN:gN,hc:hc,nHeat:heated.length}; });
  TM.res={res:res,at:new Date()}; TM.ver++; return TM.res; }
function tmBuild(){ var pane=document.getElementById('paneTM'); if(!pane) return; var $=function(i){ return document.getElementById(i); };
  var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var AS='<span class="tg" style="color:#b45309">Assumed — placeholder</span>', SV='<span class="tg" style="color:#7c3aed">Standard — verify</span>', CA='<span class="tg tC">Calculated</span>', MO='<span class="tg">Model</span>';
  var inp=function(k,v,w){ return '<input class="f tmin" data-k="'+k+'" value="'+v+'" style="width:'+(w||64)+'px">'; };
  var bd=(typeof SUBM!=='undefined'&&SUBM)?('A: longitudinal '+SUBM.bA.lon+', transverse '+SUBM.bA.tra+' · B: longitudinal '+SUBM.bB.lon+', transverse '+SUBM.bB.tra):'—';
  var h='<div class="card"><div class="sdh">Uniform temperature on the integrated model — bearing movements and restraint forces</div><div class="bbnote">The superstructure expands and contracts about the restrained bearings; the bearings, headstocks, piles and ground springs set in Boundary &rarr; Bearings and supports resist it (bearings now: '+bd+'). Unfactored cases; factors and combinations stay in the AS 5100.2 Combos tab. Orange values are placeholders so the model runs.</div></div>';
  h+='<div class="card"><div class="sdh">1. Temperatures and material</div><table class="dt" style="max-width:1100px"><tr><th class="l">Item</th><th>Value</th><th class="l">Source</th></tr>'
   +'<tr><td class="l">Maximum effective bridge temperature T<sub>max</sub> (°C)</td><td>'+inp('Tmax',TM.Tmax)+'</td><td class="l">'+AS+' <b>'+TM.Tmax+' °C used.</b> Set from AS 5100.2 (effective bridge temperature for the site shade air temperatures and this superstructure type)</td></tr>'
   +'<tr><td class="l">Minimum effective bridge temperature T<sub>min</sub> (°C)</td><td>'+inp('Tmin',TM.Tmin)+'</td><td class="l">'+AS+' <b>'+TM.Tmin+' °C used.</b> Set from AS 5100.2 as above</td></tr>'
   +'<tr><td class="l">Setting temperature T<sub>set</sub> — when the bearings / joints are fixed (°C)</td><td>'+inp('Tset',TM.Tset)+'</td><td class="l">'+AS+' <b>'+TM.Tset+' °C used.</b> Not in the drawing set; run the range of possible setting temperatures if the specification gives one</td></tr>'
   +'<tr><td class="l">Coefficient of thermal expansion α (/°C)</td><td>'+inp('alpha',TM.alpha.toExponential(1),70)+'</td><td class="l">'+SV+' <b>'+TM.alpha.toExponential(1)+' /°C used</b> — concrete value from AS 5100.5 — confirm the clause and any aggregate-specific value</td></tr>'
   +'<tr><td class="l">Members heated</td><td>superstructure only</td><td class="l">'+MO+' girders, deck strips, diaphragms and rigid offsets; headstocks and piles at ground temperature</td></tr></table></div>';
  h+='<div class="card"><div class="msbar"><button class="b" id="tm_run">Solve the temperature cases</button><span class="n" id="tm_st">'+(TM.res?'Solved '+TM.res.at.toTimeString().slice(0,8):'')+'</span><button class="b" id="tm_mct">Download for MIDAS (.mct)</button></div><div id="tm_out"></div></div>';
  pane.innerHTML=h; pane.dataset.built=1;
  [].forEach.call(pane.querySelectorAll('.tmin'),function(el){ el.onchange=function(){ var k=el.getAttribute('data-k'), n=parseFloat(el.value); if(isFinite(n)) TM[k]=n; TM.res=null; tmBuild(); }; });
  $('tm_run').onclick=function(){ $('tm_st').textContent='Solving…'; setTimeout(function(){ try{ tmRun(); tmShow(); $('tm_st').textContent='Solved '+TM.res.at.toTimeString().slice(0,8)+' on the integrated model'; }catch(e){ $('tm_st').textContent='Stopped: '+e.message; console.error(e); } },20); };
  $('tm_mct').onclick=tmMCT;
  if(TM.res) tmShow(); }
function tmShow(){ var o=document.getElementById('tm_out'); if(!o||!TM.res) return; var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var R=TM.res.res, s=function(a,k){ return a.reduce(function(t,b){ return t+b[k]; },0); }, mx=function(a,k){ return a.reduce(function(t,b){ return Math.abs(b[k])>Math.abs(t)?b[k]:t; },0); };
  var h='<div class="sdh">2. Results per case (unfactored)</div><div class="stfwrap"><table class="dt"><tr><th class="l" style="min-width:210px">Case</th><th>Bearings A: Σ longitudinal / Σ transverse (kN)</th><th>Bearings B: Σ longitudinal / Σ transverse (kN)</th><th>Max movement at B bearings: longitudinal / transverse (mm)</th><th>Max movement at A bearings: longitudinal (mm)</th><th>Girder axial force range (kN)</th><th>Max pile |M| (kN·m)</th><th>Max pile-head deflection (mm)</th><th>Ground springs ΣFx / ΣFy (kN)</th></tr>';
  R.forEach(function(r){ var A=r.brg.filter(function(b){ return b.ab==='A'; }), B=r.brg.filter(function(b){ return b.ab==='B'; });
    var pm=r.piles.reduce(function(a,p){ return p.M>a.M?p:a; },{M:0}), pd=Math.max.apply(null,r.piles.map(function(p){ return p.dx; }));
    h+='<tr><td class="l"><b>'+r.cs.id+'</b> '+r.cs.n+'<div class="dgg">'+r.cs.cl+'</div></td><td>'+f(s(A,'lon'),1)+' / '+f(s(A,'tr'),1)+'</td><td>'+f(s(B,'lon'),1)+' / '+f(s(B,'tr'),1)+'</td><td>'+f(mx(B,'dlon'),2)+' / '+f(mx(B,'dtr'),2)+'</td><td>'+f(mx(A,'dlon'),2)+'</td><td>'+f(Math.min.apply(null,r.gN),0)+' to '+f(Math.max.apply(null,r.gN),0)+'</td><td>'+f(pm.M,1)+(pm.id?' ('+pm.id+', RL '+f(pm.zM,2)+')':'')+'</td><td>'+f(pd,2)+'</td><td>'+f(-r.sprX,1)+' / '+f(-r.sprY,1)+'</td></tr>'; });
  h+='</table></div><div class="bbnote">Self-equilibrated: no external load, so the ground springs carry ≈ 0 in total and the bearing forces at A balance those at B. Movement = deformation of the bearing (shear deformation of the link springs), in the bearing axes (longitudinal = along the girder). Tension positive for the girder axial force.</div>';
  /* hand check */
  var r0=R[0], hc=r0.hc, B0=r0.brg.filter(function(b){ return b.ab==='B'; });
  h+='<div class="sdh" style="margin-top:10px">Hand check — girder elongation between its bearings ('+r0.cs.id+')</div><table class="dt" style="max-width:900px"><tr><th>Girder</th><th>Chord A → B bearing (m)</th><th>Free elongation α·ΔT·L (mm)</th><th>Model: change of the A → B chord (mm)</th><th>Model / hand</th><th>Model longitudinal movement at the B bearing (mm)</th></tr>';
  hc.forEach(function(q,i){ var m=B0[i]?B0[i].dlon:null; h+='<tr><td>'+(i+1)+'</td><td>'+f(q.L,3)+'</td><td>'+f(q.free,2)+'</td><td>'+f(q.model,2)+'</td><td>'+(q.free?f(q.model/q.free,3):'—')+'</td><td>'+f(m,2)+'</td></tr>'; });
  h+='</table><div class="bbnote">The chord change checks the imposed strain (ratio ≈ 1.0; a little below 1.0 where the bearings, headstock and piles at A restrain the deck). The movement at each B bearing differs from girder to girder: the deck also grows across its width, and on the skewed abutment line that transverse growth has a component along the girders; the fixed bearings at A hold the deck end, so the deck turns slightly in plan. Use the per-bearing movements for the bearing and joint design.</div>';
  h+='<div class="msbar" style="margin-top:8px"><label>Detail for <select id="tm_sel">'+R.map(function(r,i){ return '<option value="'+i+'">'+r.cs.id+' — '+r.cs.n+'</option>'; }).join('')+'</select></label></div><div id="tm_det"></div>';
  o.innerHTML=h; var sel=document.getElementById('tm_sel'); sel.onchange=function(){ tmDet(+sel.value); }; tmDet(0); }
function tmDet(i){ var r=TM.res.res[i], f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var h='<div class="srfgrid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)"><div><table class="dt"><tr><th>Bearing</th><th>Longitudinal force (kN)</th><th>Transverse force (kN)</th><th>Vertical, compression + (kN)</th><th>Longitudinal movement (mm)</th><th>Transverse movement (mm)</th></tr>';
  r.brg.forEach(function(b){ h+='<tr><td>'+b.ab+' '+b.id+'</td><td>'+f(b.lon,1)+'</td><td>'+f(b.tr,1)+'</td><td>'+f(b.v,1)+'</td><td>'+f(b.dlon,2)+'</td><td>'+f(b.dtr,2)+'</td></tr>'; });
  h+='</table></div><div><table class="dt"><tr><th>Pile</th><th>Max |M| (kN·m)</th><th>at RL</th><th>Max |V| (kN)</th><th>Head deflection (mm)</th></tr>';
  r.piles.forEach(function(p){ h+='<tr><td>'+p.id+'</td><td>'+f(p.M,1)+'</td><td>'+f(p.zM,2)+'</td><td>'+f(p.V,1)+'</td><td>'+f(p.dx,2)+'</td></tr>'; });
  document.getElementById('tm_det').innerHTML=h+'</table></div></div>'; }
function tmMCT(){ var M=AN.parseMCT(document.getElementById('an_mct_src').textContent), sup=tmSuper(M), ids=Object.keys(sup).map(Number).sort(function(a,b){ return a-b; });
  var L=['; BR13A uniform temperature cases — generated by the dashboard (Loads → Temperature). Unfactored. VERIFY on import:','; set the thermal coefficient '+TM.alpha.toExponential(2)+' /°C on the materials and the initial (setting) temperature '+TM.Tset+' °C in MIDAS before using *ELTEMPER.','*STLDCASE    ; Static Load Cases','; LCNAME, LCTYPE, DESC'];
  tmCases().forEach(function(c){ L.push('   '+c.id.replace('−','-')+', T, '+c.n); });
  tmCases().forEach(function(c){ L.push('*USE-STLD, '+c.id.replace('−','-'),'*ELTEMPER    ; Element Temperatures','; ELEM_LIST, TEMPER, GROUP');
    for(var i=0;i<ids.length;i+=20) L.push('   '+ids.slice(i,i+20).join(' ')+', '+(TM.Tset+c.dT).toFixed(1)+', '); });
  var bl=new Blob([L.join('\n')],{type:'text/plain'}), a=document.createElement('a'); a.href=URL.createObjectURL(bl); a.download='BR13A_temperature_loadcases.mct.txt'; a.click(); }
(function(){ if(typeof TABS==='undefined') return; var lv=document.getElementById('paneSL')||document.getElementById('paneLD'); if(!lv) return;
  var pane=document.createElement('div'); pane.id='paneTM'; pane.style.display='none'; lv.parentNode.insertBefore(pane,lv.nextSibling);
  TABS.push({id:'tm',label:'Temperature',pane:'paneTM',build:function(){ tmBuild(); },draw:function(){}});
  var G=TAB_GROUPS.filter(function(g){ return g.g==='load'; })[0]; if(G){ var i=G.ids.indexOf('sl'); G.ids.splice(i>=0?i+1:G.ids.length,0,'tm'); }
  var act=typeof ACTIVE!=='undefined'?ACTIVE:null; initTabs(); if(act) try{ showTab(act); }catch(e){}
  if(typeof SUBM!=='undefined'&&SUBM){ var a0=SUBM.apply; SUBM.apply=function(){ a0.apply(SUBM,arguments); TM.res=null; }; } })();
