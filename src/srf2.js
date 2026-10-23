/* ===== v44: (1) deck width acting with each Super-T along its length — girders straight between their bearings, deck edges and
   neighbouring girders from the model; chart + override table in Girder definition → Sections along girder; each design station uses
   its own composite width. (2) Hog Calculator beam length and bearing offset follow the model girder. ===== */
var GW={ov:{}, on:true, geo:null};
function gwGeom(){ if(GW.geo&&GW.geo.src===document.getElementById('an_mct_src').textContent.length) return GW.geo;
  var M=AN.parseMCT(document.getElementById('an_mct_src').textContent), D=ldDeck(), byG={};
  M.els.forEach(function(e){ var m=/^G(\d+)-/.exec((M.secs[e.sec]||{}).name||''); if(m) (byG[m[1]]=byG[m[1]]||[]).push(e); });
  var LA=(M.links||[]).filter(function(l){ return /AbutA/i.test(l.group); }), LB=(M.links||[]).filter(function(l){ return /AbutB/i.test(l.group); });
  var xy=function(n){ return [M.nodes[n][0],M.nodes[n][1]]; }, d2=function(a,b){ return Math.hypot(a[0]-b[0],a[1]-b[1]); };
  var G=Object.keys(byG).sort(function(a,b){ return +a-+b; }).map(function(k){ var els=byG[k], deg={}, adj={};
      els.forEach(function(e){ [e.n1,e.n2].forEach(function(n){ deg[n]=(deg[n]||0)+1; (adj[n]=adj[n]||[]).push(e); }); });
      var ends=Object.keys(deg).filter(function(n){ return deg[n]===1; }).map(Number), la=LA.reduce(function(b,l){ var d=Math.min.apply(null,ends.map(function(n){ return d2(xy(n),xy(l.n2)); })); return !b||d<b.d?{l:l,d:d}:b; },null);
      var A=la?la.l:null, start=A?ends.reduce(function(b,n){ return d2(xy(n),xy(A.n2))<d2(xy(b),xy(A.n2))?n:b; },ends[0]):ends[0];
      var nodes=[start], s=[0], used={}, cur=start; while(true){ var e=(adj[cur]||[]).filter(function(q){ return !used[q.id]; })[0]; if(!e) break; used[e.id]=1; var nx=e.n1===cur?e.n2:e.n1; s.push(s[s.length-1]+d2(xy(cur),xy(nx))); nodes.push(nx); cur=nx; }
      var near=function(l){ var b=0; nodes.forEach(function(n,i){ if(d2(xy(n),xy(l.n2))<d2(xy(nodes[b]),xy(l.n2))) b=i; }); return b; };
      var B=LB.reduce(function(b,l){ var d=d2(xy(l.n2),xy(nodes[nodes.length-1])); return !b||d<b.d?{l:l,d:d}:b; },null), Bl=B?B.l:null;
      var iA=A?near(A):0, iB=Bl?near(Bl):nodes.length-1;
      return {k:+k, nodes:nodes, s:s, Ltot:s[s.length-1], sA:s[iA], sB:s[iB], PA:A?xy(A.n2):xy(nodes[0]), PB:Bl?xy(Bl.n2):xy(nodes[nodes.length-1])}; });
  /* deck edge lines (model) and the offset of each girder line, to order girders across the deck */
  var lines=D.lines.map(function(l){ return {o:l.o, p:l.p.filter(function(q){ return M.nodes[q.id]; }).sort(function(a,b){ return a.c-b.c; }).map(function(q){ return xy(q.id); }), role:(D.role[(l.p[0]||{}).id])}; });
  var edges=lines.filter(function(l){ return l.role==='edge'; }).sort(function(a,b){ return a.o-b.o; }), eL=edges[0], eR=edges[edges.length-1];
  G.forEach(function(g){ var mid=xy(g.nodes[Math.floor(g.nodes.length/2)]); var best=null; lines.forEach(function(l){ l.p.forEach(function(p){ var d=d2(p,mid); if(!best||d<best.d) best={d:d,o:l.o}; }); }); g.o=best?best.o:0; });
  G.sort(function(a,b){ return a.o-b.o; });
  GW.geo={G:G, eL:eL, eR:eR, src:document.getElementById('an_mct_src').textContent.length}; return GW.geo; }
/* width acting with girder index j (0-based, ordered across the deck) at parameter t (0 = bearing A, 1 = bearing B), mm; also left / right parts */
function gwWidth(j,t){ var Z=gwGeom(), G=Z.G, g=G[j]; if(!g) return null; var d=[g.PB[0]-g.PA[0],g.PB[1]-g.PA[1]], L=Math.hypot(d[0],d[1]); d=[d[0]/L,d[1]/L];
  var P=[g.PA[0]+t*(g.PB[0]-g.PA[0]), g.PA[1]+t*(g.PB[1]-g.PA[1])], n=[-d[1],d[0]], cr=function(a,b){ return a[0]*b[1]-a[1]*b[0]; };
  var toR=G[j+1]?G[j+1].PA:(Z.eR?Z.eR.p[0]:null); if(toR&&((toR[0]-P[0])*n[0]+(toR[1]-P[1])*n[1])<0) n=[-n[0],-n[1]];   /* n points towards +offset */
  var hitLine=function(q,m){ var e=[q.PB[0]-q.PA[0],q.PB[1]-q.PA[1]], den=cr(m,e); if(Math.abs(den)<1e-12) return null; return cr([q.PA[0]-P[0],q.PA[1]-P[1]],e)/den; };
  var hitPoly=function(pl,m){ if(!pl) return null; var best=null; for(var i=0;i<pl.p.length-1;i++){ var a=pl.p[i], b=pl.p[i+1], e=[b[0]-a[0],b[1]-a[1]], den=cr(m,e); if(Math.abs(den)<1e-12) continue; var lam=cr([a[0]-P[0],a[1]-P[1]],e)/den, u=cr([a[0]-P[0],a[1]-P[1]],m)/den; if(u>=-1e-6&&u<=1+1e-6&&lam>0&&(best===null||lam<best)) best=lam; }
    if(best===null){ /* beyond the ends of the edge polyline: extend its end segments */ var a0=pl.p[0], a1=pl.p[1], b0=pl.p[pl.p.length-2], b1=pl.p[pl.p.length-1]; [[a0,a1],[b0,b1]].forEach(function(s){ var e=[s[1][0]-s[0][0],s[1][1]-s[0][1]], den=cr(m,e); if(Math.abs(den)<1e-12) return; var lam=cr([s[0][0]-P[0],s[0][1]-P[1]],e)/den; if(lam>0&&(best===null||lam<best)) best=lam; }); }
    return best; };
  var mR=n, mL=[-n[0],-n[1]], R=G[j+1]?hitLine(G[j+1],mR)/2:hitPoly(Z.eR,mR), Lf=G[j-1]?hitLine(G[j-1],mL)/2:hitPoly(Z.eL,mL);
  if(!(R>0)||!(Lf>0)) return null; return {W:(R+Lf)*1000, L:Lf*1000, R:R*1000, edge:!G[j+1]?'R':(!G[j-1]?'L':null)}; }
var GW_T=[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1];
function gwEff(j,k){ var o=GW.ov[j+'|'+k]; if(o!==undefined&&o!==null&&o!==''&&isFinite(+o)) return {W:+o,u:true}; var w=gwWidth(j,GW_T[k]); return w?{W:w.W,u:false}:null; }
function gwAtT(j,t){ t=Math.max(0,Math.min(1,t)); var k=Math.min(GW_T.length-2,Math.floor(t*10)), a=gwEff(j,k), b=gwEff(j,k+1); if(!a||!b) return null; var w=(t-GW_T[k])/(GW_T[k+1]-GW_T[k]); return a.W*(1-w)+b.W*w; }
/* design girder DG.gi (model girder G(gi+1)) at chain station x: project the station point onto the girder chord */
function dgWdAt(gi,x){ if(!GW.on) return null; try{ var Z=gwGeom(), j=-1; Z.G.forEach(function(g,i){ if(g.k===gi+1) j=i; }); if(j<0) return null; var g=Z.G[j], P;
    if(typeof CS!=='undefined'&&CS.chains&&CS.chains[gi]){ var st=dgStation(gi,x), e=st.it.e, Mn=AN.parseMCT.cache||(AN.parseMCT.cache={}); var nd=gwNodes(), a=nd[e.n1], b=nd[e.n2], f=e.L>0?st.x/e.L:0; P=[a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1])]; }
    else return null;
    var d=[g.PB[0]-g.PA[0],g.PB[1]-g.PA[1]], L2=d[0]*d[0]+d[1]*d[1], t=((P[0]-g.PA[0])*d[0]+(P[1]-g.PA[1])*d[1])/L2; return gwAtT(j,t); }catch(e){ return null; } }
function gwNodes(){ var src=document.getElementById('an_mct_src').textContent; if(GW._nd&&GW._ndl===src.length) return GW._nd; GW._nd=AN.parseMCT(src).nodes; GW._ndl=src.length; return GW._nd; }
/* each design station uses its own composite width */
(function(){ if(typeof dgStationX!=='function') return; var s0=dgStationX, cache={};
  dgStationX=function(Xb,x,G){ var w=dgWdAt(DG.gi,x); if(w&&DG.sec&&Math.abs(w-DG.sec.Wd)>2){ var key=(Xb.solid?'s':'o')+Math.round(w/2)*2+'|'+DG.ver, X=cache[key];
      if(!X){ var keep=DG.sec.Wd; DG.sec.Wd=Math.round(w/2)*2; try{ X=dgSection(!!Xb.solid); } finally{ DG.sec.Wd=keep; } cache[key]=X; if(Object.keys(cache).length>400) cache={}; }
      Xb=X; } return s0(Xb,x,G); }; })();
/* card in Girder definition → Sections along girder */
function gwCard(){ var Z; try{ Z=gwGeom(); }catch(e){ return '<section class="card"><h3>Deck width along each girder</h3><p class="bbflag">'+e.message+'</p></section>'; }
  var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); }, mdl=null; try{ mdl=dgModel(); }catch(e){}
  var cols=['#0e7c86','#b45309','#7c3aed','#c2410c','#1d4ed8','#15803d'], W=900, H=260, ml=56, mr=16, mt=22, mb=34, all=[];
  var ser=Z.G.map(function(g,j){ var p=[]; for(var i=0;i<=40;i++){ var t=i/40, w=gwWidth(j,t); if(w) p.push([t,w.W]); } var e=GW_T.map(function(t,k){ var q=gwEff(j,k); return q?[t,q.W,q.u]:null; }).filter(Boolean); p.forEach(function(q){ all.push(q[1]); }); e.forEach(function(q){ all.push(q[1]); }); return {p:p,e:e}; });
  var y0=Math.min.apply(null,all)-100, y1=Math.max.apply(null,all)+100, X=function(t){ return ml+t*(W-ml-mr); }, Y=function(v){ return mt+(y1-v)/((y1-y0)||1)*(H-mt-mb); };
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;color:var(--fg)" role="img" aria-label="Deck width along each girder">';
  for(var v=Math.ceil(y0/200)*200; v<=y1; v+=200) svg+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="currentColor" stroke-opacity=".12"/><text x="'+(ml-6)+'" y="'+(Y(v)+3)+'" font-size="10" text-anchor="end" fill="currentColor">'+v+'</text>';
  GW_T.forEach(function(t){ svg+='<text x="'+X(t)+'" y="'+(H-mb+14)+'" font-size="10" text-anchor="middle" fill="currentColor">'+t.toFixed(1)+'</text>'; });
  ser.forEach(function(s,j){ var c=cols[j%cols.length], sel=Z.G[j].k===(DG.gi||0)+1; svg+='<polyline fill="none" stroke="'+c+'" stroke-width="'+(sel?2.6:1.4)+'" stroke-dasharray="5 3" points="'+s.p.map(function(q){ return X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1); }).join(' ')+'"/>'
      +'<polyline fill="none" stroke="'+c+'" stroke-width="'+(sel?2.6:1.6)+'" points="'+s.e.map(function(q){ return X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1); }).join(' ')+'"/>'+s.e.filter(function(q){ return q[2]; }).map(function(q){ return '<circle cx="'+X(q[0])+'" cy="'+Y(q[1])+'" r="3.5" fill="'+c+'"/>'; }).join('')
      +'<rect x="'+(ml+8+j*110)+'" y="'+(mt-2)+'" width="14" height="3" fill="'+c+'"/><text x="'+(ml+26+j*110)+'" y="'+(mt+2)+'" font-size="10.5" fill="'+c+'">G'+Z.G[j].k+(sel?' (design)':'')+'</text>'; if(mdl&&mdl.g[Z.G[j].k-1]&&mdl.g[Z.G[j].k-1].Wd) svg+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(mdl.g[Z.G[j].k-1].Wd)+'" y2="'+Y(mdl.g[Z.G[j].k-1].Wd)+'" stroke="'+c+'" stroke-opacity=".35" stroke-width="1"/>'; });
  svg+='<text x="'+((ml+W-mr)/2)+'" y="'+(H-6)+'" font-size="10" text-anchor="middle" fill="currentColor">position along the girder, bearing A (0) to bearing B (1) — width in mm; dashed: from the geometry, solid: used (dots = override), faint: constant width of the model section</text></svg>';
  var h='<section class="card" id="gw_card"><h3>Deck width acting with each girder, along its length</h3><p class="ref">Each Super-T is straight between its bearings (model bearing nodes). At each point the width is half the distance to the neighbouring girder on each side, measured square to the girder, or the full distance to the deck edge (model edge line) for an edge girder. The width is the deck slab acting with that girder in its composite section; the effective-width rule is checked separately in the design options. <span class="tg tC">Calculated</span> from the model geometry (alignment, deck edges and bearing positions from the drawings).</p>'
   +'<label style="display:flex;gap:6px;align-items:center;margin:6px 0"><input type="checkbox" id="gw_on"'+(GW.on?' checked':'')+'> Use this width at every design station (otherwise the constant model width '+f(DG.sec?DG.sec.Wd:null,0)+' mm)</label>'+svg
   +'<div class="stfwrap" style="margin-top:6px"><table class="dt"><tr><th>Girder</th><th>Offset</th><th>Bearing chord (m)</th>'+GW_T.map(function(t){ return '<th>'+t.toFixed(1)+'</th>'; }).join('')+'<th>Model section</th></tr>';
  Z.G.forEach(function(g,j){ var L=Math.hypot(g.PB[0]-g.PA[0],g.PB[1]-g.PA[1]);
    h+='<tr><td><b>G'+g.k+'</b>'+(g.k===(DG.gi||0)+1?' ◀':'')+'</td><td>'+f(g.o,2)+'</td><td>'+f(L,3)+'</td>'+GW_T.map(function(t,k){ var w=gwWidth(j,t), o=GW.ov[j+'|'+k]; return '<td><div style="font-size:11px;color:var(--muted)">'+(w?f(w.W,0):'—')+'</div><input class="f gwov" data-k="'+j+'|'+k+'" value="'+(o===undefined?'':o)+'" placeholder="auto" style="width:58px"></td>'; }).join('')
      +'<td>'+(mdl&&mdl.g[g.k-1]?f(mdl.g[g.k-1].Wd,0):'—')+'</td></tr>'; });
  h+='</table></div><p class="ref">Grey: width from the geometry (mm). Type a value to override it at that point (<span class="tg tU">Input (user)</span>); blank returns to the geometry. Between the points the width is interpolated; beyond the bearings it is held at the bearing value. The selected design girder is marked ◀ (Design tab).</p></section>';
  return h; }
(function(){ if(typeof window.srfRender!=='function') return; var r0=window.srfRender;
  window.srfRender=function(k){ r0.apply(this,arguments); var kk=k||(document.querySelector('.srfdb.on')||{getAttribute:function(){ return ''; }}).getAttribute('data-def'); if(kk!=='zone') return;
    var host=document.getElementById('srf_zone'); if(!host) return; var sec=host.closest('.card'), old=document.getElementById('gw_card'); if(old) old.remove(); var d=document.createElement('div'); d.innerHTML=gwCard(); sec.parentNode.insertBefore(d.firstChild,sec.nextSibling);
    var stale=function(){ try{ DG.res=null; DG.gird=null; DG.poiCache=null; DG.ver=(DG.ver||0)+1; }catch(e){} };
    var on=document.getElementById('gw_on'); if(on) on.onchange=function(){ GW.on=on.checked; stale(); };
    [].forEach.call(document.querySelectorAll('.gwov'),function(el){ el.onchange=function(){ var v=el.value.trim(); if(v===''||!isFinite(+v)) delete GW.ov[el.getAttribute('data-k')]; else GW.ov[el.getAttribute('data-k')]=+v; stale(); }; }); }; })();
/* ---- Hog Calculator: beam length and bearing offset follow the model girder ---- */
var HOGF={on:true, busy:false, last:null};
function hogFollow(force){ if(!HOGF.on) return null; var L=document.getElementById('hog_L'), a=document.getElementById('hog_a'); if(!L||!a) return null;
  var Z; try{ Z=gwGeom(); }catch(e){ return null; } var gi=(typeof DG!=='undefined'&&DG.gi)||0, g=Z.G.filter(function(q){ return q.k===gi+1; })[0]; if(!g) return null;
  var Lm=Math.round(g.Ltot*1000), am=Math.round(g.sA*1000), a2=Math.round((g.Ltot-g.sB)*1000); HOGF.last={L:Lm,a:am,a2:a2,k:g.k,was:{L:+L.value,a:+a.value}};
  if(!force&&+L.value===Lm&&+a.value===am) return HOGF.last;
  HOGF.busy=true; L.value=Lm; a.value=am; try{ L.dispatchEvent(new Event('input',{bubbles:true})); L.dispatchEvent(new Event('change',{bubbles:true})); a.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} HOGF.busy=false;
  hogNote(); return HOGF.last; }
function hogNote(){ var L=document.getElementById('hog_L'); if(!L) return; var n=document.getElementById('hogf_note'); if(!n){ n=document.createElement('div'); n.id='hogf_note'; n.className='wdas'; var row=L.closest('tr')||L.parentNode; (row.parentNode.closest('table')||row.parentNode).insertAdjacentElement('beforebegin',n); }
  var q=HOGF.last; n.innerHTML=HOGF.on&&q?'<span class="tg tC">Calculated</span> Beam length <b>'+q.L+' mm</b> and bearing offset <b>'+q.a+' mm</b> follow the model girder G'+q.k+' (end to end along the girder line; bearing A offset; bearing B offset '+q.a2+' mm). <label><input type="checkbox" id="hogf_on" checked> follow the model</label>':'<span class="tg tU">Input (user)</span> Beam length and bearing offset entered here. <label><input type="checkbox" id="hogf_on"> follow the model girder</label>';
  var c=document.getElementById('hogf_on'); if(c) c.onchange=function(){ HOGF.on=c.checked; if(HOGF.on) hogFollow(true); else hogNote(); }; }
(function(){ var go=function(){ try{ hogFollow(false); }catch(e){ console.error('hog follow',e); } };
  document.addEventListener('change',function(e){ var id=e.target&&e.target.id; if(!HOGF.busy&&(id==='hog_L'||id==='hog_a')&&e.isTrusted){ HOGF.on=false; hogNote(); } },true);
  if(document.readyState==='complete') setTimeout(go,300); else window.addEventListener('load',function(){ setTimeout(go,300); });
  /* follow the design girder when it changes */
  if(typeof dgSecInit==='function'){ var s0=dgSecInit; dgSecInit=function(){ var r=s0.apply(this,arguments); try{ if(HOGF.on&&!HOGF.busy&&HOGF.last&&HOGF.last.k!==(DG.gi||0)+1) setTimeout(function(){ hogFollow(false); },0); }catch(e){} return r; }; } })();
