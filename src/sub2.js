/* ===== v38: horizontal loads on the integrated model — earth pressure and traffic surcharge on the abutments,
   road braking and centrifugal force. Each is an unfactored load case solved on the one model (deck + bearings +
   headstocks + piles + rock springs). Inputs not in the drawing set are PLACEHOLDERS (engineer instruction 2026-10-22). ===== */
var SL={gam:20, phi:30, kmode:'K0', q:10, hBrg:0.15, Hov:{A:null,B:null}, Fbr:500, V:60, W:1440, res:null, ver:0};
function slGeom(){ var M=AN.parseMCT(document.getElementById('an_mct_src').textContent), sb=Object.keys(M.secs).find(function(k){ return /SB_/.test(M.secs[k].name); });
  var els=M.els.filter(function(e){ return String(e.sec)===String(sb); }), sec=M.secs[sb], d=+((/H=([\d.]+)/.exec(sec.kind||'')||[0,1.52])[1]);
  var adj={}; els.forEach(function(e){ (adj[e.n1]=adj[e.n1]||[]).push(e); (adj[e.n2]=adj[e.n2]||[]).push(e); });
  var seen={}, groups=[]; Object.keys(adj).forEach(function(n0){ n0=+n0; if(seen[n0]) return; var st=[n0], g=[]; seen[n0]=1; while(st.length){ var n=st.pop(); g.push(n); adj[n].forEach(function(e){ var o=e.n1===n?e.n2:e.n1; if(!seen[o]){ seen[o]=1; st.push(o); } }); } groups.push(g); });
  var L=M.links||[], ab=function(g){ var A=L.filter(function(l){ return /AbutA/i.test(l.group); }).map(function(l){ return l.n1; }); return g.some(function(n){ return A.indexOf(n)>=0||M.nodes[n]&&A.some(function(a){ return Math.hypot(M.nodes[a][0]-M.nodes[n][0],M.nodes[a][1]-M.nodes[n][1])<0.05; }); })?'A':'B'; };
  var out={M:M,depth:d,abs:{}};
  groups.forEach(function(g){ var a=ab(g), pts=g.map(function(n){ return M.nodes[n]; });
    /* order along the sill */ var p0=pts[0], far=g.reduce(function(b,n){ var q=M.nodes[n]; return Math.hypot(q[0]-p0[0],q[1]-p0[1])>Math.hypot(M.nodes[b][0]-p0[0],M.nodes[b][1]-p0[1])?n:b; },g[0]);
    var e0=g.reduce(function(b,n){ var q=M.nodes[n], f=M.nodes[far]; return Math.hypot(q[0]-f[0],q[1]-f[1])>Math.hypot(M.nodes[b][0]-f[0],M.nodes[b][1]-f[1])?n:b; },g[0]);
    var t=[M.nodes[far][0]-M.nodes[e0][0],M.nodes[far][1]-M.nodes[e0][1]], tl=Math.hypot(t[0],t[1]); t=[t[0]/tl,t[1]/tl];
    var s=function(n){ var q=M.nodes[n]; return (q[0]-M.nodes[e0][0])*t[0]+(q[1]-M.nodes[e0][1])*t[1]; }, ord=g.slice().sort(function(x,y){ return s(x)-s(y); });
    out.abs[a]={nodes:ord, s:ord.map(s), t:t, len:tl, c:[pts.reduce(function(a2,q){ return a2+q[0]; },0)/pts.length, pts.reduce(function(a2,q){ return a2+q[1]; },0)/pts.length]}; });
  ['A','B'].forEach(function(a){ var o=out.abs[a], other=out.abs[a==='A'?'B':'A']; if(!o||!other) return; var n=[-o.t[1],o.t[0]], v=[other.c[0]-o.c[0],other.c[1]-o.c[1]]; if(n[0]*v[0]+n[1]*v[1]<0) n=[-n[0],-n[1]]; o.n=n; });
  /* retained height: headstock depth + bearing zone + girder + deck + surfacing */
  var gd=(typeof gdDepth==='function'?gdDepth():1.515), tD=(typeof P!=='undefined'&&P.slab)||0.2, ts=(typeof P!=='undefined'&&P.surf)||0.075;
  ['A','B'].forEach(function(a){ var H=d+SL.hBrg+gd+tD+ts; out.abs[a]&&(out.abs[a].Hc=H, out.abs[a].H=(SL.Hov[a]>0?SL.Hov[a]:H)); });
  out.parts={d:d,gd:gd,tD:tD,ts:ts}; return out; }
function slK(){ var f=SL.phi*Math.PI/180; return SL.kmode==='Ka'?(1-Math.sin(f))/(1+Math.sin(f)):1-Math.sin(f); }
/* nodal load vectors for each case: {node:[Fx,Fy,Fz,Mx,My,Mz]} */
function slCases(G){ var K=slK(), cases=[], add=function(L,n,f){ var a=L[n]=L[n]||[0,0,0,0,0,0]; for(var i=0;i<6;i++) a[i]+=f[i]||0; };
  var earth=function(q,ab,kind){ var o=G.abs[ab]; if(!o) return; var H=o.H, d=G.depth, e, zr;
    if(kind==='EP'){ e=0.5*K*SL.gam*H*H; zr=H/3; } else { e=K*q*H; zr=H/2; }
    var dz=zr-d/2;   /* above the sill-beam centroid (node level) */
    o.nodes.forEach(function(n,i){ var a=i>0?(o.s[i]-o.s[i-1])/2:0, b=i<o.nodes.length-1?(o.s[i+1]-o.s[i])/2:0, F=e*(a+b), f=[F*o.n[0],F*o.n[1],0], m=[-dz*f[1],dz*f[0],0];   /* r = (0,0,dz): M = r × F */
      add(this,n,[f[0],f[1],0,m[0],m[1],0]); },kind==='EP'?cases.EP.L:cases['EPT'+ab].L); };
  cases.EP={id:'EP',n:'Earth pressure on both abutments (soil, '+SL.kmode+')',cl:'AS 5100.3 / AS 5100.2 soil',L:{}};
  cases.EPTA={id:'EPTA',n:'Traffic surcharge behind abutment A',cl:'AS 5100.2 earth pressure from traffic',L:{}};
  cases.EPTB={id:'EPTB',n:'Traffic surcharge behind abutment B',cl:'AS 5100.2 earth pressure from traffic',L:{}};
  earth(0,'A','EP'); earth(0,'B','EP'); earth(SL.q,'A','EPT'); earth(SL.q,'B','EPT');
  /* braking and centrifugal on the deck nodes inside the carriageway, at deck level */
  var D=ldDeck(), cw=trCW(), nds=[]; D.lines.forEach(function(l){ if(l.o<cw.L-1e-6||l.o>cw.R+1e-6) return; l.p.forEach(function(q){ if(D.role[q.id]!=='girder'&&D.role[q.id]!=='slab'&&D.role[q.id]!=='web') return; nds.push({id:q.id,c:q.c,o:l.o}); }); });
  var dir=function(c,o){ var a=pt(c-0.5,o), b=pt(c+0.5,o), v=[b[0]-a[0],b[1]-a[1]], L=Math.hypot(v[0],v[1]); return [v[0]/L,v[1]/L]; };
  var outw=function(c){ var a=pt(c-5,0), m=pt(c,0), b=pt(c+5,0), k=[a[0]+b[0]-2*m[0],a[1]+b[1]-2*m[1]], L=Math.hypot(k[0],k[1]); return L>1e-9?[-k[0]/L,-k[1]/L]:null; };
  cases.BRKp={id:'BRKp',n:'Road braking, towards abutment B',cl:'AS 5100.2 Cl 7.8.2',L:{}}; cases.BRKm={id:'BRKm',n:'Road braking, towards abutment A',cl:'AS 5100.2 Cl 7.8.2',L:{}};
  cases.CEN={id:'CEN',n:'Road centrifugal (outward)',cl:'AS 5100.2 Cl 7.8.1',L:{}};
  var R=(typeof P!=='undefined'&&P.R)||null, Fc=R?SL.W*Math.pow(SL.V/3.6,2)/(9.80665*R):0; SL.Fc=Fc; SL.nDeck=nds.length;
  nds.forEach(function(q){ var d=dir(q.c,q.o), f=SL.Fbr/nds.length; add(cases.BRKp.L,q.id,[f*d[0],f*d[1],0]); add(cases.BRKm.L,q.id,[-f*d[0],-f*d[1],0]);
    var w=outw(q.c); if(w) add(cases.CEN.L,q.id,[Fc/nds.length*w[0],Fc/nds.length*w[1],0]); });
  return ['EP','EPTA','EPTB','BRKp','BRKm','CEN'].map(function(k){ return cases[k]; }); }
/* solve all cases on the integrated model (all members active, self weight off) */
function slRun(){ var G=slGeom(), M=G.M, P2=AN.prepare(M,{shear:true,weightOn:function(){ return false; }}), K=AN.assembleK(P2); AN.cholesky(K,P2.nf);
  var C=slCases(G), piles=SUBM&&SUBM.info?SUBM.info.piles:[], links=P2.els.filter(function(e){ return e.link; });
  var res=C.map(function(cs){ var F=new Float64Array(P2.nf), tot=[0,0,0];
    Object.keys(cs.L).forEach(function(n){ var v=cs.L[n], i0=6*P2.idx[n]; if(i0===undefined||isNaN(i0)) return; for(var k=0;k<6;k++){ var r=P2.freeMap[i0+k]; if(r>=0) F[r]+=v[k]; } tot[0]+=v[0]; tot[1]+=v[1]; tot[2]+=v[2]; });
    var u=AN.cholSolve(K,P2.nf,F), U=new Float64Array(P2.ndof); for(var i=0;i<P2.ndof;i++) if(P2.freeMap[i]>=0) U[i]=u[P2.freeMap[i]];
    var ef={}; P2.els.forEach(function(e){ var ue=e.dof.map(function(d){ return U[d]; }), ul=AN.mulv?AN.mulv(e.T,ue):e.T.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ue[j]; return s; }), fl=e.Kl.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ul[j]; return s; }); ef[e.id]=fl; });
    var brg=links.map(function(e){ var f=ef[e.id]; return {id:e.id,ab:/AbutB/i.test((M.links.find(function(l){ return 'L'+l.id===e.id; })||{}).group||'')?'B':'A',v:f[0],tr:-f[1],lon:-f[2]}; });
    var pl=piles.map(function(pi){ var mx=0,vx=0,zM=null; P2.els.forEach(function(e){ if(e.link||pi.chain.indexOf(e.n1)<0||pi.chain.indexOf(e.n2)<0) return; var f=ef[e.id];
        [[f[4],f[5],f[1],f[2],M.nodes[e.n1][2]],[f[10],f[11],f[7],f[8],M.nodes[e.n2][2]]].forEach(function(q){ var m=Math.hypot(q[0],q[1]), v=Math.hypot(q[2],q[3]); if(m>mx){ mx=m; zM=q[4]; } vx=Math.max(vx,v); }); });
      var it=6*P2.idx[pi.top]; return {ab:pi.ab,id:pi.id,top:pi.top,M:mx,zM:zM,V:vx,dx:Math.hypot(U[it],U[it+1])*1000}; });
    var spr=0, sx=0, sy=0; (P2.spr||[]).forEach(function(s){ var f=s.k*U[s.dof]; if(s.k6===0) sx+=f; if(s.k6===1) sy+=f; });
    return {cs:cs,tot:tot,brg:brg,piles:pl,sprX:sx,sprY:sy}; });
  SL.res={G:G,res:res,at:new Date()}; SL.ver++; return SL.res; }
/* ---- page: Loads → Abutment soil, braking, centrifugal ---- */
function slBuild(){ var pane=document.getElementById('paneSL'); if(!pane) return; var $=function(i){ return document.getElementById(i); };
  var G=null, err=null; try{ G=slGeom(); }catch(e){ err=e.message; }
  var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); }, K=slK();
  var AS='<span class="tg" style="color:#b45309">Assumed — placeholder</span>', DI='<span class="tg tD">Direct</span>', CA='<span class="tg tC">Calculated</span>', MO='<span class="tg">Model</span>';
  var inp=function(k,v,w){ return '<input class="f slin" data-k="'+k+'" value="'+(v===null?'':v)+'" style="width:'+(w||64)+'px">'; };
  var h='<div class="card"><div class="sdh">Horizontal loads on the integrated model — abutment soil, traffic surcharge, braking and centrifugal</div><div class="bbnote">Each row below is an unfactored load case solved on the one model set in Boundary &rarr; Bearings and supports (bearings fixed at A, free longitudinally at B; rock and fill springs on the piles). Factors and combinations stay in the AS 5100.2 Combos tab. Orange values are placeholders so the model runs.</div></div>';
  if(err) h+='<div class="card bbflag">'+err+'</div>';
  if(G){ var A=G.abs.A||{}, B=G.abs.B||{}, pp=G.parts;
    h+='<div class="card"><div class="sdh">1. Earth pressure on the headstock and curtain wall</div><table class="dt" style="max-width:1100px"><tr><th class="l">Item</th><th>Value</th><th class="l">Source</th></tr>'
     +'<tr><td class="l">Fill unit weight γ (kN/m³)</td><td>'+inp('gam',SL.gam)+'</td><td class="l">'+AS+' <b>'+SL.gam+' kN/m³ used.</b> Geotechnical report not in the set</td></tr>'
     +'<tr><td class="l">Fill friction angle φ′ (°)</td><td>'+inp('phi',SL.phi)+'</td><td class="l">'+AS+' <b>'+SL.phi+'° used.</b> Geotechnical report not in the set</td></tr>'
     +'<tr><td class="l">Pressure coefficient</td><td><select class="f slin" data-k="kmode"><option value="K0"'+(SL.kmode==='K0'?' selected':'')+'>at rest K0 = 1 − sin φ′</option><option value="Ka"'+(SL.kmode==='Ka'?' selected':'')+'>active Ka (Rankine)</option></select> = '+f(K,3)+'</td><td class="l">'+AS+' <b>'+(SL.kmode==='K0'?'at rest K0':'active Ka')+' used</b> — pile-supported headstock, movement not confirmed</td></tr>'
     +'<tr><td class="l">Retained height H = headstock '+f(pp.d,2)+' + bearing zone '+inp('hBrg',SL.hBrg,48)+' + girder '+f(pp.gd,3)+' + deck '+f(pp.tD,3)+' + surfacing '+f(pp.ts,3)+' m</td><td>A '+f(A.Hc,2)+' / B '+f(B.Hc,2)+' m</td><td class="l">'+DI+' depths (GA); '+AS+' bearing + plinth height <b>'+SL.hBrg+' m used</b>; '+CA+' sum</td></tr>'
     +'<tr><td class="l">Override H (m), blank = calculated</td><td>A '+inp('HovA',SL.Hov.A,48)+' B '+inp('HovB',SL.Hov.B,48)+'</td><td class="l">Input (user)</td></tr>'
     +'<tr><td class="l">Earth pressure resultant ½Kγ H² per metre of headstock, at H/3 above the soffit</td><td>A '+f(0.5*K*SL.gam*A.H*A.H,1)+' / B '+f(0.5*K*SL.gam*B.H*B.H,1)+' kN/m</td><td class="l">'+CA+'</td></tr>'
     +'<tr><td class="l">Traffic surcharge q (kPa) → K·q·H per metre at H/2</td><td>'+inp('q',SL.q)+' → A '+f(K*SL.q*A.H,1)+' / B '+f(K*SL.q*B.H,1)+' kN/m</td><td class="l">'+AS+' <b>'+SL.q+' kPa used</b> — replace with the AS 5100.2 earth-pressure-from-traffic value</td></tr>'
     +'<tr><td class="l">Headstock length loaded (along the sill)</td><td>A '+f(A.len,2)+' / B '+f(B.len,2)+' m</td><td class="l">'+CA+' from the model; wingwalls and approach slab not included</td></tr></table>'
     +'<div class="bbnote">Applied as horizontal forces normal to the sill line, towards the span, at every headstock node (tributary length), with the moment of the resultant about the headstock centroid. The pile columns below the headstock carry no earth pressure in this case (spill-through embankment in front and behind) '+AS+'.</div></div>';
    h+='<div class="card"><div class="sdh">2. Braking and centrifugal force</div><table class="dt" style="max-width:1100px"><tr><th class="l">Item</th><th>Value</th><th class="l">Source</th></tr>'
     +'<tr><td class="l">Braking force, total on the bridge (kN), along the control line, both directions</td><td>'+inp('Fbr',SL.Fbr)+'</td><td class="l">'+AS+' <b>'+SL.Fbr+' kN used</b> — calculate to AS 5100.2 Cl 7.8.2 and enter here</td></tr>'
     +'<tr><td class="l">Spread over the deck nodes between the barrier faces ('+f(trCW().L,2)+' to '+f(trCW().R,2)+' m), at deck level</td><td>'+(SL.nDeck||'—')+' nodes</td><td class="l">'+MO+' road-surface eccentricity not included</td></tr>'
     +'<tr><td class="l">Design speed V (km/h)</td><td>'+inp('V',SL.V)+'</td><td class="l">'+AS+' <b>'+SL.V+' km/h used</b> — design speed not in the set</td></tr>'
     +'<tr><td class="l">Horizontal curve radius r (m)</td><td>'+f(P.R,1)+'</td><td class="l">'+DI+' horizontal alignment</td></tr>'
     +'<tr><td class="l">Vertical traffic load for centrifugal W (kN)</td><td>'+inp('W',SL.W)+'</td><td class="l">'+AS+' <b>'+SL.W+' kN used</b> — AS 5100.2 Cl 7.8.1 basis to confirm</td></tr>'
     +'<tr><td class="l">Centrifugal force F = W·V²/(g·r), radial outward</td><td>'+f(SL.Fc||(SL.W*Math.pow(SL.V/3.6,2)/(9.80665*P.R)),1)+' kN</td><td class="l">'+CA+' (mechanics; any code factor or limit to verify)</td></tr></table></div>';
  }
  h+='<div class="card"><div class="msbar"><button class="b" id="sl_run">Solve the load cases</button><span class="n" id="sl_st">'+(SL.res?'Solved '+SL.res.at.toTimeString().slice(0,8):'')+'</span><button class="b" id="sl_mct">Download load cases for MIDAS (.mct)</button></div><div id="sl_out"></div></div>';
  pane.innerHTML=h; pane.dataset.built=1;
  [].forEach.call(pane.querySelectorAll('.slin'),function(el){ el.onchange=function(){ var k=el.getAttribute('data-k'), v=el.value.trim();
    if(k==='kmode') SL.kmode=v; else if(k==='HovA'||k==='HovB'){ var n=parseFloat(v); SL.Hov[k.slice(3)]=isFinite(n)&&n>0?n:null; } else { var n2=parseFloat(v); if(isFinite(n2)) SL[k]=n2; }
    SL.res=null; slBuild(); }; });
  $('sl_run').onclick=function(){ $('sl_st').textContent='Solving…'; setTimeout(function(){ try{ slRun(); slShow(); $('sl_st').textContent='Solved '+SL.res.at.toTimeString().slice(0,8)+' on the integrated model'; }catch(e){ $('sl_st').textContent='Stopped: '+e.message; console.error(e); } },20); };
  $('sl_mct').onclick=slMCT;
  if(SL.res) slShow(); }
function slShow(){ var o=document.getElementById('sl_out'); if(!o||!SL.res) return; var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var R=SL.res.res, h='<div class="sdh">3. Results per load case (unfactored)</div><div class="stfwrap"><table class="dt"><tr><th class="l">Load case</th><th>Applied ΣFx / ΣFy (kN)</th><th>Ground springs ΣFx / ΣFy (kN)</th><th>Bearings A: Σ longitudinal / transverse (kN)</th><th>Bearings B: Σ longitudinal / transverse (kN)</th><th>Max pile |M| (kN·m)</th><th>Max pile |V| (kN)</th><th>Max pile-head deflection (mm)</th></tr>';
  R.forEach(function(r){ var sA=r.brg.filter(function(b){ return b.ab==='A'; }), sB=r.brg.filter(function(b){ return b.ab==='B'; }), s=function(a,k){ return a.reduce(function(t,b){ return t+b[k]; },0); };
    var pm=r.piles.reduce(function(a,p){ return p.M>a.M?p:a; },{M:0}), pv=Math.max.apply(null,r.piles.map(function(p){ return p.V; })), pd=Math.max.apply(null,r.piles.map(function(p){ return p.dx; }));
    h+='<tr><td class="l"><b>'+r.cs.id+'</b> '+r.cs.n+'<div class="dgg">'+r.cs.cl+'</div></td><td>'+f(r.tot[0],1)+' / '+f(r.tot[1],1)+'</td><td>'+f(-r.sprX,1)+' / '+f(-r.sprY,1)+'</td><td>'+f(s(sA,'lon'),1)+' / '+f(s(sA,'tr'),1)+'</td><td>'+f(s(sB,'lon'),1)+' / '+f(s(sB,'tr'),1)+'</td><td>'+f(pm.M,1)+(pm.ab?' ('+pm.ab+', RL '+f(pm.zM,2)+')':'')+'</td><td>'+f(pv,1)+'</td><td>'+f(pd,2)+'</td></tr>'; });
  h+='</table></div><div class="bbnote">Check: the ground springs (rock socket + fill around the columns) carry the whole applied horizontal load (columns 2 and 3 equal, the toes have no lateral support). With abutment B free longitudinally, the longitudinal braking reaches the ground only through abutment A&rsquo;s bearings. Bearing forces are the forces on the headstock in the bearing axes (longitudinal = along the girder).</div>';
  /* pile detail for the selected case */
  h+='<div class="msbar" style="margin-top:8px"><label>Pile detail for <select id="sl_sel">'+R.map(function(r,i){ return '<option value="'+i+'">'+r.cs.id+' — '+r.cs.n+'</option>'; }).join('')+'</select></label></div><div id="sl_det"></div>';
  o.innerHTML=h; var sel=document.getElementById('sl_sel'); sel.onchange=function(){ slDet(+sel.value); }; slDet(0); }
function slDet(i){ var r=SL.res.res[i], f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var h='<table class="dt" style="max-width:1000px"><tr><th>Pile</th><th>Max |M| (kN·m)</th><th>at RL</th><th>Max |V| (kN)</th><th>Head deflection (mm)</th></tr>';
  var cnt={A:0,B:0}; r.piles.forEach(function(p){ cnt[p.ab]++; h+='<tr><td>'+(p.id||p.ab+cnt[p.ab])+'</td><td>'+f(p.M,1)+'</td><td>'+f(p.zM,2)+'</td><td>'+f(p.V,1)+'</td><td>'+f(p.dx,2)+'</td></tr>'; });
  h+='</table><table class="dt" style="max-width:1000px;margin-top:8px"><tr><th>Bearing</th><th>Vertical, compression + (kN)</th><th>Transverse (kN)</th><th>Longitudinal (kN)</th></tr>';
  r.brg.forEach(function(b){ h+='<tr><td>'+b.ab+' '+b.id+'</td><td>'+f(b.v,1)+'</td><td>'+f(b.tr,1)+'</td><td>'+f(b.lon,1)+'</td></tr>'; });
  document.getElementById('sl_det').innerHTML=h+'</table>'; }
function slMCT(){ var G=slGeom(), C=slCases(G), L=['; BR13A horizontal load cases — generated by the dashboard (Loads → Abutment soil, braking, centrifugal). Unfactored. VERIFY on import.','*STLDCASE    ; Static Load Cases','; LCNAME, LCTYPE, DESC'];
  C.forEach(function(c){ L.push('   '+c.id+', USER, '+c.n.replace(/,/g,' ')); });
  C.forEach(function(c){ L.push('*USE-STLD, '+c.id,'*CONLOAD    ; Nodal Loads','; NODE_LIST, FX, FY, FZ, MX, MY, MZ, GROUP');
    Object.keys(c.L).forEach(function(n){ var v=c.L[n]; L.push('   '+n+', '+v.map(function(x){ return (+x).toFixed(4); }).join(', ')+', '); }); });
  var bl=new Blob([L.join('\n')],{type:'text/plain'}), a=document.createElement('a'); a.href=URL.createObjectURL(bl); a.download='BR13A_horizontal_loadcases.mct.txt'; a.click(); }
/* register the page: Loads → Abutment soil, braking, centrifugal */
(function(){ if(typeof TABS==='undefined') return; var lv=document.getElementById('paneLD'); if(!lv) return;
  var pane=document.createElement('div'); pane.id='paneSL'; pane.style.display='none'; lv.parentNode.insertBefore(pane,lv.nextSibling);
  TABS.push({id:'sl',label:'Abutment soil, braking, centrifugal',pane:'paneSL',build:function(){ slBuild(); },draw:function(){}});
  var G=TAB_GROUPS.filter(function(g){ return g.g==='load'; })[0]; if(G){ var i=G.ids.indexOf('ld'); G.ids.splice(i>=0?i+1:G.ids.length,0,'sl'); }
  var act=typeof ACTIVE!=='undefined'?ACTIVE:null; initTabs(); if(act) try{ showTab(act); }catch(e){}
  /* the integrated model may be rebuilt in the Boundary tab: results then go stale */
  if(typeof SUBM!=='undefined'&&SUBM){ var a0=SUBM.apply; SUBM.apply=function(){ a0.apply(SUBM,arguments); SL.res=null; }; } })();
