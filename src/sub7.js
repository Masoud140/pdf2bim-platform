/* ===== v44: temperature gradient (TGP / TGN) and long-term shrinkage + creep shortening (SCR) on the integrated model.
   Gradient: the AS 5100.2 profile entered in Design → options (DG.temp) — or, when none is entered, an ASSUMED profile stated
   on the page — integrated over the composite girder section (fibres of the design section) into a free axial strain ε0 and a
   free curvature φ, imposed on every composite girder element (fixed-end forces −K·u_free). Shortening: a uniform strain on
   the superstructure. ===== */
var TG={T0:32, negF:0.5, eps:300, res:null};
function tgProf(T0){ var a=[]; for(var d=0;d<=1200;d+=100) a.push(d+':'+(T0*Math.pow((1200-d)/1200,5)).toFixed(2)); return a.join(', '); }
function tgProfNeg(T0,f){ var a=[]; for(var d=0;d<=1200;d+=100) a.push(d+':'+(-f*T0*Math.pow((1200-d)/1200,5)).toFixed(2)); return a.join(', '); }
/* assumed gradient profiles when none is entered (stated on the Temperature page and in Design → options) */
(function(){ try{ if(typeof DG!=='undefined'&&DG.temp&&!(DG.temp.alpha>0)&&!DG.temp.pos&&!DG.temp.neg){ DG.temp.alpha=(typeof TM!=='undefined'?TM.alpha*1e6:10); DG.temp.pos=tgProf(TG.T0); DG.temp.neg=tgProfNeg(TG.T0,TG.negF); DG.temp.auto=true; } }catch(e){}
  document.addEventListener('change',function(e){ var id=e.target&&e.target.id; if(id==='dgo_al'||id==='dgo_tp'||id==='dgo_tn'){ DG.temp.auto=false; TG.res=null; try{ RX.res=null; }catch(x){} } },true);
  if(typeof dgOptHTML==='function'){ var o0=dgOptHTML; dgOptHTML=function(){ var h=o0.apply(this,arguments); if(DG.temp&&DG.temp.auto) h=h.replace('<p><b>Temperature gradient</b>','<p class="wdas"><span class="tg" style="color:#b45309">Assumed</span> <b>profiles below used</b> — positive T = '+TG.T0+'·((1200 − d)/1200)<sup>5</sup> °C over the top 1200 mm, negative = −'+TG.negF+' × the positive shape, α = '+DG.temp.alpha+' ×10⁻⁶ /°C (Loads → Temperature). Replace them with the AS 5100.2 Cl 18.3 profile for this deck and surfacing.</p><p><b>Temperature gradient</b>').replace(/(id="dgo_tn"[^>]*>\s*<\/label>\s*)<span class="tg tU">Input \(user\)<\/span>/,'$1<span class="tg" style="color:#b45309">Assumed</span>').replace(/(id="dgo_al"[^>]*><\/label> )<span class="tg tU">Input \(user\)<\/span>/,'$1<span class="tg" style="color:#b45309">Assumed</span>'); return h; }; } })();
/* free axial strain and curvature of the composite girder section for a profile (positive 'pos' / negative 'neg') */
function tgFree(which){ var t=DG.temp||{}, pts=dgParseProf(which==='pos'?t.pos:t.neg), al=(t.alpha||0)*1e-6; if(!pts||!(al>0)) return null;
  var X; try{ if(!DG.sec) dgSecInit(); X=dgSection(false); }catch(e){ return null; }
  var EA=0, Ey=0, N=0, c=X.S.conc; c.forEach(function(f){ var A=f.b*f.h; EA+=f.E*A; Ey+=f.E*A*f.y; N+=f.E*A*al*dgProfAt(pts,f.y); });
  var yc=Ey/EA, EI=0, Mt=0; c.forEach(function(f){ var A=f.b*f.h, d=f.y-yc; EI+=f.E*(A*d*d+f.b*f.h*f.h*f.h/12); Mt+=f.E*A*al*dgProfAt(pts,f.y)*d; });
  var kd=Mt/EI;   /* strain change per mm of depth (depth measured downwards) */
  return {e0:N/EA, phi:-kd*1000, yc:yc, EA:EA, EI:EI, N:N, M:Mt}; }   /* phi: per m, + = strain increasing upwards (top hotter) */
/* imposed-strain load cases: map element index → local free end displacements (12) */
function tgImposed(M,P2,K){ var sup=tmSuper(M), out={};
  var mk=function(fn){ var m={}; P2.els.forEach(function(e,ix){ if(e.link||!sup[e.id]) return; var u=fn(e); if(u) m[ix]=u; }); return m; };
  var grad=function(fr){ return mk(function(e){ if(!/composite/i.test((M.secs[e.sec]||{}).name||'')) return null; var L=e.L, u=new Array(12).fill(0); u[6]=fr.e0*L; u[8]=-fr.phi*L*L/2; u[10]=fr.phi*L; return u; }); };
  var fp=tgFree('pos'), fn=tgFree('neg'); if(fp) out.TGP=grad(fp); if(fn) out.TGN=grad(fn);
  var es=-(TG.eps||0)*1e-6; out.SCR=mk(function(e){ var u=new Array(12).fill(0); u[6]=es*e.L; return u; });
  out._f={pos:fp,neg:fn}; return out; }
/* solve one imposed-strain case; returns U and the element end-force function */
function tgSolve(P2,K,map){ var n=P2.nf, F=new Float64Array(n), KU={};
  Object.keys(map).forEach(function(ix){ var e=P2.els[ix], u=map[ix], ku=e.Kl.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*u[j]; return s; }); KU[ix]=ku;
    var g=e.Tt.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ku[j]; return s; }); for(var a=0;a<12;a++){ var rr=P2.freeMap[e.dof[a]]; if(rr>=0) F[rr]+=g[a]; } });
  var x=AN.cholSolve(K,n,F), U=new Float64Array(P2.ndof); for(var i=0;i<P2.ndof;i++) if(P2.freeMap[i]>=0) U[i]=x[P2.freeMap[i]];
  var ef=function(e,ix){ var ue=e.dof.map(function(d){ return U[d]; }), ul=e.T.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ue[j]; return s; }), f=e.Kl.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ul[j]; return s; }); if(KU[ix]) for(var a=0;a<12;a++) f[a]-=KU[ix][a]; return f; };
  return {U:U, ef:ef}; }
/* Temperature page: gradient + shortening, bearing movements and forces */
function tgRun(){ var M=AN.parseMCT(document.getElementById('an_mct_src').textContent), P2=AN.prepare(M,{shear:true,weightOn:function(){ return false; }}), K=AN.assembleK(P2); AN.cholesky(K,P2.nf);
  var C=tgImposed(M,P2,K), lnk={}; (M.links||[]).forEach(function(l){ lnk['L'+l.id]=l; }); var links=P2.els.map(function(e,ix){ return {e:e,ix:ix}; }).filter(function(q){ return q.e.link; });
  var sup=tmSuper(M), mid=null; /* midspan deck node of the first girder line for the camber check */
  var res={}; ['TGP','TGN','SCR'].forEach(function(id){ if(!C[id]) return; var S=tgSolve(P2,K,C[id]);
    var brg=links.map(function(q){ var f=S.ef(q.e,q.ix), ue=q.e.dof.map(function(d){ return S.U[d]; }), ul=q.e.T.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ue[j]; return s; }), dd=brgDef(ul,q.e.L,lnk[q.e.id]);
      return {id:q.e.id,ab:/AbutB/i.test((lnk[q.e.id]||{}).group||'')?'B':'A',v:f[0],tr:-f[1],lon:-f[2],dtr:dd[0],dlon:dd[1]}; });
    var zmax=0; Object.keys(sup).forEach(function(eid){ var e=P2.els.find(function(q){ return String(q.id)===String(eid); }); if(!e) return; [e.n1,e.n2].forEach(function(n){ var v=S.U[6*P2.idx[n]+2]; if(Math.abs(v)>Math.abs(zmax)) zmax=v; }); });
    res[id]={brg:brg,zmax:zmax*1000}; });
  var LA=(M.links||[]).filter(function(l){ return /AbutA/i.test(l.group); }), LB=(M.links||[]).filter(function(l){ return /AbutB/i.test(l.group); }), Ls=LA.map(function(a,i){ var b=LB[i]; if(!b) return null; var p=M.nodes[a.n2], q=M.nodes[b.n2]; return Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2]); }).filter(Boolean);
  TG.res={res:res,f:C._f,L:Ls.length?Ls.reduce(function(a,b){ return a+b; },0)/Ls.length:null,at:new Date()}; return TG.res; }
function tgCard(){ var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); }, t=DG.temp||{}, fp=tgFree('pos'), fn=tgFree('neg');
  var AS='<span class="tg" style="color:#b45309">Assumed</span>', tag=t.auto?AS:'<span class="tg tU">Input (user)</span>';
  var h='<div class="card" id="tg_card"><div class="sdh">3. Temperature gradient and long-term shortening</div><table class="dt wdt" style="max-width:1150px"><tr><th class="l">Input</th><th>Value</th><th class="l">Source and assumption</th></tr>'
   +'<tr><td class="l">Positive gradient (top hot), depth from deck top (mm) : °C</td><td style="max-width:260px;font-size:11px">'+(t.pos||'—')+'</td><td class="l">'+tag+(t.auto?' <b>T = '+TG.T0+'·((1200 − d)/1200)<sup>5</sup> °C used</b> over the top 1200 mm (AS 5100.2 Cl 18.3 shape). Replace with the profile for this deck and surfacing in Design → options.':' Design → options')+'</td></tr>'
   +'<tr><td class="l">Negative gradient (top cold)</td><td style="max-width:260px;font-size:11px">'+(t.neg||'—')+'</td><td class="l">'+tag+(t.auto?' <b>−'+TG.negF+' × the positive shape used.</b> Replace with the AS 5100.2 negative profile.':'')+'</td></tr>'
   +'<tr><td class="l">Free axial strain ε<sub>0</sub> / free curvature φ of the composite girder (positive; negative)</td><td>'+(fp?f(fp.e0*1e6,1)+' ×10⁻⁶ / '+f(fp.phi*1e6,1)+' ×10⁻⁶/m':'—')+'<br>'+(fn?f(fn.e0*1e6,1)+' ×10⁻⁶ / '+f(fn.phi*1e6,1)+' ×10⁻⁶/m':'—')+'</td><td class="l"><span class="tg tC">Calculated</span> ε<sub>0</sub> = ΣEαTA / ΣEA, φ = −ΣEαTA(y − y<sub>c</sub>) / ΣEI over the design section fibres (one girder with its deck); imposed on every composite girder element. Transverse deck gradient not applied.</td></tr>'
   +'<tr><td class="l">Long-term shortening of the superstructure after the bearings are set (shrinkage + creep), ×10⁻⁶</td><td><input class="f tgin" data-k="eps" value="'+TG.eps+'" style="width:60px"></td><td class="l">'+AS+' <b>'+TG.eps+' ×10⁻⁶ used</b> as a uniform shortening (Combos tab case SCR). For reference, the Hog time analysis gives free shrinkage '+(function(){ try{ var hq=dgHogRes(); return hq&&hq.q&&hq.q.dsh?f(hq.q.dsh.sg*1e6,0)+' ×10⁻⁶ (girder) and '+f(hq.q.dsh.sd*1e6,0)+' ×10⁻⁶ (deck) at the selected age, part of it before the bearings are set':'—'; }catch(e){ return '—'; } })()+'; add creep under the prestress at the centroid.</td></tr></table>'
   +'<div class="msbar" style="margin-top:8px"><button class="b" id="tg_run">Solve gradient and shortening</button><span class="n" id="tg_st">'+(TG.res?'Solved '+TG.res.at.toTimeString().slice(0,8):'')+'</span></div><div id="tg_out"></div></div>';
  return h; }
function tgShow(){ var o=document.getElementById('tg_out'); if(!o||!TG.res) return; var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); }, R=TG.res.res;
  var nm={TGP:'Temperature gradient — positive',TGN:'Temperature gradient — negative',SCR:'Shrinkage + creep shortening'}, h='<div class="stfwrap"><table class="dt"><tr><th class="l" style="min-width:220px">Case</th><th>Max deck vertical displacement (mm, up +)</th><th>Bearings A: Σ long. / max |long.| (kN)</th><th>Bearings B: max |trans.| (kN)</th><th>Movement at B bearings, longitudinal (mm)</th><th>Bearing vertical, min / max (kN)</th></tr>';
  Object.keys(R).forEach(function(id){ var r=R[id], A=r.brg.filter(function(b){ return b.ab==='A'; }), B=r.brg.filter(function(b){ return b.ab==='B'; }), mx=function(a,k){ return Math.max.apply(null,a.map(function(b){ return Math.abs(b[k]); })); }, vs=r.brg.map(function(b){ return b.v; });
    h+='<tr><td class="l"><b>'+id+'</b> '+nm[id]+'</td><td>'+f(r.zmax,2)+'</td><td>'+f(A.reduce(function(s,b){ return s+b.lon; },0),1)+' / '+f(mx(A,'lon'),1)+'</td><td>'+f(mx(B,'tr'),1)+'</td><td>'+f(Math.min.apply(null,B.map(function(b){ return b.dlon; })),2)+' to '+f(Math.max.apply(null,B.map(function(b){ return b.dlon; })),2)+'</td><td>'+f(Math.min.apply(null,vs),1)+' / '+f(Math.max.apply(null,vs),1)+'</td></tr>'; });
  var fp=TG.res.f.pos, L=TG.res.L;
  h+='</table></div><div class="bbnote">Positive gradient lifts the span (camber up) and lengthens it; the fixed bearings at A and the piles restrain only the end rotation offset and the elongation, so the forces are small. Hand check of the camber of a simply supported span: φL²/8 with L = mean bearing-to-bearing chord'+(fp&&L?' = '+f(fp.phi*1e6,1)+'×10⁻⁶ × '+f(L,2)+'² / 8 = '+f(fp.phi*L*L/8*1000,2)+' mm (model '+f(R.TGP?R.TGP.zmax:null,2)+' mm)':'')+'.</div>';
  o.innerHTML=h; }
(function(){ if(typeof tmBuild!=='function') return; var b0=tmBuild; tmBuild=function(){ b0.apply(this,arguments); var pane=document.getElementById('paneTM'); if(!pane) return; var d=document.createElement('div'); d.innerHTML=tgCard(); pane.appendChild(d.firstChild);
    [].forEach.call(pane.querySelectorAll('.tgin'),function(el){ el.onchange=function(){ var n=parseFloat(el.value); if(isFinite(n)) TG[el.getAttribute('data-k')]=n; TG.res=null; try{ RX.res=null; }catch(e){} tmBuild(); }; });
    var r=document.getElementById('tg_run'); r.onclick=function(){ var st=document.getElementById('tg_st'); st.textContent='Solving…'; setTimeout(function(){ try{ tgRun(); tgShow(); st.textContent='Solved '+TG.res.at.toTimeString().slice(0,8); }catch(e){ st.textContent='Stopped: '+e.message; console.error(e); } },20); };
    if(TG.res) tgShow(); };
  if(typeof SUBM!=='undefined'&&SUBM){ var a0=SUBM.apply; SUBM.apply=function(){ a0.apply(SUBM,arguments); TG.res=null; }; } })();
