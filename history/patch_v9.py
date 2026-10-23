#!/usr/bin/env python3
"""v8 -> v9: pile results (deflection, bending, shear, axial) in the Analysis tab."""
SRC = '/home/claude/BR13A_grillage_dashboard_v8.html'
DST = '/home/claude/BR13A_grillage_dashboard_v9.html'
h = open(SRC, encoding='utf-8').read()

def rep(a, b):
    global h
    assert h.count(a) == 1, ('anchor count', h.count(a), a[:70])
    h = h.replace(a, b, 1)

# --- default to the frozen MCT (the only model with the substructure) ---
rep("var ANS={M:null,res:null,P:null,chains:null,src:'',groups:null,mode:'live',",
    "var ANS={M:null,res:null,P:null,chains:null,src:'',groups:null,mode:'mct',")
rep("<option value=\"live\">Live: the dashboard mesh and sections (follows every parameter)</option><option value=\"mct\">Frozen: the embedded BR13A_grillage.mct</option>",
    "<option value=\"mct\">Frozen: the embedded BR13A_grillage.mct (deck + sill, bearings, columns, piles)</option><option value=\"live\">Live: the dashboard mesh and sections (deck only, follows every parameter)</option>")
rep("  ANS.stale=false; ANS.res=null; $('an_out').innerHTML=''; anGroups();\n}",
    "  if(ANS.mode!=='file') $('an_mode').value=ANS.mode;\n  ANS.stale=false; ANS.res=null; $('an_out').innerHTML=''; anGroups();\n}")

# --- element inspector: links have no material ---
rep("s=M.secs[e.sec], m=M.mats[e.mat];\n  var nm=['N','Vy','Vz','T','My','Mz'];",
    "s=M.secs[e.sec], m=M.mats[e.mat]||{name:e.link?'elastic link (springs)':'—'};\n  var nm=['N','Vy','Vz','T','My','Mz'];")
rep("+'<b style=\"display:block;margin:10px 0 4px\">Local consistent mass matrix (t, m)</b><div class=\"stfwrap\">'+(e.mu>0?",
    "+'<b style=\"display:block;margin:10px 0 4px\">Local consistent mass matrix (t, m)</b><div class=\"stfwrap\">'+(e.mu>0&&!e.link?")

# --- reactions note was written for the pinned-bearing deck ---
rep("<div class=\"bbnote\">Rx and Ry sum to zero because the load is vertical; the pinned end carries the small horizontal reactions that the skew and curvature produce. Compare Rz node by node with MIDAS.</div>",
    "<div class=\"bbnote\">Rx and Ry sum to zero because the load is vertical; the horizontal reactions come from the skew and curvature. With the substructure in the model the supports are the pile toes. Compare node by node with MIDAS.</div>")

# --- pile card in anResults ---
rep("  /* element inspector */\n  h+='<div class=\"card\"><div class=\"sdh\">5. Element inspector",
    """  /* piles */
  ANS.piles=anPileChains();
  if(ANS.piles.length){
    var abs=[]; ANS.piles.forEach(function(p){ if(abs.indexOf(p.abut)<0) abs.push(p.abut); });
    h+='<div class="card"><div class="sdh">4b. Piles and columns: deflection, bending, shear and axial force</div><div class="msbar">'
      +'<label>Abutment <select id="an_pab">'+abs.map(function(a){ return '<option value="'+a+'">Abutment '+a+'</option>'; }).join('')+'</select></label>'
      +'<label>Direction <select id="an_pdir"><option value="l">Longitudinal (normal to the sill)</option><option value="t">Transverse (along the sill)</option><option value="r">Resultant</option></select></label>'
      +'</div><div id="an_pch" class="anpgrid"></div><div id="an_ppk"></div>'
      +'<div class="bbnote">Each pile is drawn from the sill soffit (column top) to the toe, against RL. The dashed line is RL B, where the column extension meets the pile (1 m segments below it). '
      +'<b>Longitudinal</b> = horizontal, normal to the sill line, + toward the span; <b>transverse</b> = along the sill, + toward the north end. '
      +'Bending moment is the moment about the axis normal to that direction (so longitudinal bending is the moment about the sill axis). Axial force is compression +. '
      +'Deflection is cubic between nodes from the nodal displacements and rotations. The toes are fixed and there are no soil springs yet, so the pile is a free-standing cantilever in the soil zone until those are added.</div></div>';
  }
  /* element inspector */
  h+='<div class="card"><div class="sdh">5. Element inspector""")
rep("  $('an_el').onchange=anElem; $('an_csv').onclick=anCSV;\n  anCharts(); anElem();",
    "  $('an_el').onchange=anElem; $('an_csv').onclick=anCSV;\n  if(ANS.piles.length){ $('an_pab').onchange=anPileCharts; $('an_pdir').onchange=anPileCharts; }\n  anCharts(); anElem(); if(ANS.piles.length) anPileCharts();")

# --- CSV: pile profiles ---
rep("  var bl=new Blob([L.join('\\n')],{type:'text/csv'})",
    """  if(ANS.piles&&ANS.piles.length){ L.push('PILE PROFILES (RL m; deflection mm; M kN.m; V kN; axial compression + kN)');
    L.push('pile,RL,defl_long,defl_trans,M_long(about sill axis),M_trans,V_long,V_trans,N_comp');
    ANS.piles.forEach(function(p){ anPileProfile(p).forEach(function(q){ L.push([p.name,q.z,q.dl,q.dt,q.Ml,q.Mt,q.Vl,q.Vt,q.C].join(',')); }); }); }
  var bl=new Blob([L.join('\\n')],{type:'text/csv'})""")

# --- pile functions ---
PILE_JS = r"""
/* ===== piles: chains of 'Pile*' section elements, top (sill soffit) to toe ===== */
function anPileChains(){
  var R=ANS.res, P=R.P, M=P.M;
  var pool=P.els.filter(function(e){ return !e.link && /^pile/i.test((M.secs[e.sec]||{}).name||''); });
  if(!pool.length) return [];
  var adj={}; pool.forEach(function(e,i){ (adj[e.n1]=adj[e.n1]||[]).push(i); (adj[e.n2]=adj[e.n2]||[]).push(i); });
  var seen={}, piles=[];
  pool.forEach(function(e0,i0){ if(seen[i0]) return;
    var comp=[], st=[i0]; seen[i0]=1;
    while(st.length){ var i=st.pop(); comp.push(i); [pool[i].n1,pool[i].n2].forEach(function(n){ (adj[n]||[]).forEach(function(j){ if(!seen[j]){ seen[j]=1; st.push(j); } }); }); }
    var deg={}; comp.forEach(function(i){ [pool[i].n1,pool[i].n2].forEach(function(n){ deg[n]=(deg[n]||0)+1; }); });
    var ends=Object.keys(deg).filter(function(n){ return deg[n]===1; }).map(Number);
    if(ends.length!==2) return;
    ends.sort(function(a,b){ return M.nodes[b][2]-M.nodes[a][2]; });       // top first
    var cur=ends[0], used={}, list=[];
    while(true){ var nx=null; (adj[cur]||[]).forEach(function(j){ if(comp.indexOf(j)>=0&&!used[j]&&nx===null) nx=j; });
      if(nx===null) break; used[nx]=1; var e=pool[nx]; list.push({e:e,ix:P.els.indexOf(e)}); cur=(e.n1===cur)?e.n2:e.n1; }
    var top=M.nodes[ends[0]], toe=M.nodes[ends[1]];
    var zB=(list.length>1 && list[0].e.L>1.05)? Math.min(M.nodes[list[0].e.n1][2],M.nodes[list[0].e.n2][2]) : null;
    piles.push({els:list, top:ends[0], toe:ends[1], xy:[top[0],top[1]], ztop:top[2], ztoe:toe[2], zB:zB});
  });
  // group into abutments (tops within 15 m), A = the group nearest the MCT base point (Support A)
  var cl=[];
  piles.forEach(function(p){ var c=cl.filter(function(c){ return Math.hypot(c.p[0].xy[0]-p.xy[0],c.p[0].xy[1]-p.xy[1])<15; })[0];
    if(!c){ c={p:[]}; cl.push(c); } c.p.push(p); });
  cl.forEach(function(c){ c.x=0; c.y=0; c.p.forEach(function(p){ c.x+=p.xy[0]/c.p.length; c.y+=p.xy[1]/c.p.length; }); });
  cl.sort(function(a,b){ return Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y); });
  var out=[];
  cl.forEach(function(c,ci){
    var lab=String.fromCharCode(65+ci);
    c.p.sort(function(a,b){ return a.xy[1]-b.xy[1]; });                    // pile 01 = southmost
    var f=c.p[0].xy, l=c.p[c.p.length-1].xy, u=[l[0]-f[0], l[1]-f[1]], ul=Math.hypot(u[0],u[1]);
    u = ul>1e-6 ? [u[0]/ul,u[1]/ul] : [0,1];
    var n=[u[1],-u[0]], o=cl[ci===0?1:0];
    if(o && (n[0]*(o.x-c.x)+n[1]*(o.y-c.y))<0) n=[-n[0],-n[1]];               // + toward the span
    c.p.forEach(function(p,i){ p.abut=lab; p.name=lab+'-'+(i<9?'0':'')+(i+1); p.u=u; p.n=n; out.push(p); });
  });
  return out;
}
function anPileProfile(p){
  var R=ANS.res, P=R.P, M=P.M, S=R.S, pts=[];
  p.els.forEach(function(it){
    var e=it.e, f=S.ef[it.ix], L=e.L, z1=M.nodes[e.n1][2], z2=M.nodes[e.n2][2], Rm=e.R;
    var ue=e.dof.map(function(d){ return S.U[d]; }), ul=e.T.map(function(r){ var s=0; for(var j=0;j<12;j++) s+=r[j]*ue[j]; return s; });
    var sg=(z2>z1)?-1:1;                                                     // report on the face of the part below
    var toG=function(v){ return [0,1,2].map(function(k){ return Rm[0][k]*v[0]+Rm[1][k]*v[1]+Rm[2][k]*v[2]; }); };
    var ns=Math.max(4,Math.ceil(L/0.25));
    for(var k=0;k<=ns;k++){
      var x=L*k/ns, xi=x/L, sc=AN.section(e,f,x);
      var N1=1-3*xi*xi+2*xi*xi*xi, N2=L*(xi-2*xi*xi+xi*xi*xi), N3=3*xi*xi-2*xi*xi*xi, N4=L*(-xi*xi+xi*xi*xi);
      var v=N1*ul[1]+N2*ul[5]+N3*ul[7]+N4*ul[11], w=N1*ul[2]-N2*ul[4]+N3*ul[8]-N4*ul[10], ua=ul[0]+(ul[6]-ul[0])*xi;
      var d=toG([ua,v,w]), V=toG([0,sc.Vy,sc.Vz]).map(function(t){ return t*sg; }), Mm=toG([0,sc.My,sc.Mz]).map(function(t){ return t*sg; });
      var dl=(d[0]*p.n[0]+d[1]*p.n[1])*1000, dt=(d[0]*p.u[0]+d[1]*p.u[1])*1000;
      var Ml=Mm[0]*p.u[0]+Mm[1]*p.u[1], Mt=Mm[0]*p.n[0]+Mm[1]*p.n[1];
      var Vl=V[0]*p.n[0]+V[1]*p.n[1], Vt=V[0]*p.u[0]+V[1]*p.u[1];
      pts.push({z:z1+(z2-z1)*xi, dl:dl, dt:dt, dr:Math.hypot(dl,dt), Ml:Ml, Mt:Mt, Mr:Math.hypot(Ml,Mt), Vl:Vl, Vt:Vt, Vr:Math.hypot(Vl,Vt), C:-sc.N});
    }
  });
  pts.sort(function(a,b){ return b.z-a.z; });
  return pts;
}
/* value across, RL down: pile-style diagram */
function anChartV(title,unit,series,marks){
  var W=300, H=430, ml=46, mr=12, mt=40, mb=30, xs=[0], zs=[];
  series.forEach(function(s){ s.pts.forEach(function(q){ xs.push(q[0]); zs.push(q[1]); }); });
  var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs), z0=Math.min.apply(null,zs), z1=Math.max.apply(null,zs);
  if(x1-x0<1e-9){ x1=x0+1; } var px=(x1-x0)*0.08; x0-=px; x1+=px; var pz=(z1-z0)*0.03; z0-=pz; z1+=pz;
  var X=function(v){ return ml+(v-x0)/(x1-x0)*(W-ml-mr); }, Y=function(z){ return mt+(z1-z)/(z1-z0)*(H-mt-mb); };
  function nice(a,b,n){ var st=(b-a)/n, m=Math.pow(10,Math.floor(Math.log10(st))), r=st/m; st=(r<1.5?1:r<3?2:r<7?5:10)*m; var o=[]; for(var v=Math.ceil(a/st)*st; v<=b+1e-9; v+=st) o.push(v); return o; }
  var g='';
  nice(z0,z1,8).forEach(function(v){ g+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--rule2)"/><text x="'+(ml-5)+'" y="'+(Y(v)+3.5)+'" text-anchor="end" font-size="10" fill="var(--muted)">'+anFmt(v,0)+'</text>'; });
  nice(x0,x1,4).forEach(function(v){ g+='<line x1="'+X(v)+'" x2="'+X(v)+'" y1="'+mt+'" y2="'+(H-mb)+'" stroke="var(--rule2)"/><text x="'+X(v)+'" y="'+(H-mb+13)+'" text-anchor="middle" font-size="10" fill="var(--muted)">'+anFmt(v,Math.abs(v)<10&&v!==0?1:0)+'</text>'; });
  g+='<line x1="'+X(0)+'" x2="'+X(0)+'" y1="'+mt+'" y2="'+(H-mb)+'" stroke="var(--muted)"/>';
  (marks||[]).forEach(function(m){ if(m.z===null||m.z===undefined) return; g+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(m.z)+'" y2="'+Y(m.z)+'" stroke="var(--muted)" stroke-dasharray="4 3"/><text x="'+(W-mr-2)+'" y="'+(Y(m.z)-3)+'" text-anchor="end" font-size="9.5" fill="var(--muted)">'+m.label+'</text>'; });
  series.forEach(function(s){ g+='<polyline fill="none" stroke="'+s.color+'" stroke-width="1.8" points="'+s.pts.map(function(q){ return X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1); }).join(' ')+'"/>'; });
  var lg=''; series.forEach(function(s,i){ lg+='<rect x="'+(ml+i*58)+'" y="22" width="12" height="3" fill="'+s.color+'"/><text x="'+(ml+i*58+15)+'" y="27" font-size="10" fill="var(--fg)">'+s.name+'</text>'; });
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;background:var(--panel)"><text x="'+ml+'" y="13" font-size="11.5" font-weight="600" fill="var(--fg)">'+title+'</text><text x="'+(W-mr)+'" y="13" text-anchor="end" font-size="10.5" fill="var(--muted)">'+unit+'</text>'+lg+g
    +'<text x="12" y="'+((mt+H-mb)/2)+'" font-size="10" fill="var(--muted)" transform="rotate(-90 12 '+((mt+H-mb)/2)+')" text-anchor="middle">RL (m AHD)</text></svg>';
}
function anPileCharts(){
  var ab=$('an_pab').value, dir=$('an_pdir').value, ps=ANS.piles.filter(function(p){ return p.abut===ab; });
  var key={l:['dl','Ml','Vl'],t:['dt','Mt','Vt'],r:['dr','Mr','Vr']}[dir], dn={l:'longitudinal',t:'transverse',r:'resultant'}[dir];
  var prof=ps.map(anPileProfile), ser=function(k){ return ps.map(function(p,i){ return {name:p.name,color:AN_COL[i%AN_COL.length],pts:prof[i].map(function(q){ return [q[k],q.z]; })}; }); };
  var p0=ps[0], marks=[{z:p0.ztop,label:'sill soffit'},{z:p0.zB,label:'RL B'},{z:p0.ztoe,label:'toe'}];
  $('an_pch').innerHTML=['Deflection ('+dn+')|mm|'+key[0],'Bending moment ('+dn+')|kN·m|'+key[1],'Shear force ('+dn+')|kN|'+key[2],'Axial force, compression +|kN|C']
    .map(function(s){ var a=s.split('|'); return '<div>'+anChartV(a[0],a[1],ser(a[2]),marks)+'</div>'; }).join('');
  var R=ANS.res, P=R.P, h='<table class="dt" style="margin-top:8px"><tr><th>Pile</th><th>Top RL</th><th>RL B</th><th>Toe RL</th><th>Max deflection (mm)</th><th>at RL</th><th>Max |M| (kN·m)</th><th>at RL</th><th>Max |V| (kN)</th><th>N top (kN)</th><th>N toe (kN)</th><th>Toe Rz (kN)</th><th>Toe M (kN·m)</th></tr>';
  ANS.piles.forEach(function(p){ var q=anPileProfile(p), mx=function(k){ return q.reduce(function(b,r){ return r[k]>b[k]?r:b; },q[0]); };
    var d=mx('dr'), m=mx('Mr'), v=mx('Vr'), it=6*P.idx[p.toe], Rz=R.S.R[it+2], Mt=Math.hypot(R.S.R[it+3],R.S.R[it+4]);
    h+='<tr'+(p.abut===ab?' style="font-weight:600"':'')+'><td>'+p.name+'</td><td class="n">'+anFmt(p.ztop,3)+'</td><td class="n">'+anFmt(p.zB,3)+'</td><td class="n">'+anFmt(p.ztoe,3)+'</td><td class="n">'+anFmt(d.dr,2)+'</td><td class="n">'+anFmt(d.z,2)+'</td><td class="n">'+anFmt(m.Mr,0)+'</td><td class="n">'+anFmt(m.z,2)+'</td><td class="n">'+anFmt(v.Vr,1)+'</td><td class="n">'+anFmt(q[0].C,0)+'</td><td class="n">'+anFmt(q[q.length-1].C,0)+'</td><td class="n">'+anFmt(Rz,0)+'</td><td class="n">'+anFmt(Mt,0)+'</td></tr>'; });
  $('an_ppk').innerHTML=h+'</table><div class="bbnote">Maxima are of the resultant (both horizontal directions). N toe should equal the toe reaction Rz: a check that the pile carries the load down to the support.</div>';
}
"""
rep("function anMat(A,d){", PILE_JS + "function anMat(A,d){")

# --- css for the 4-up grid ---
rep(".bbgrid{display:grid;", ".anpgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:6px}\n.bbgrid{display:grid;")

open(DST, 'w', encoding='utf-8').write(h)
print('written', DST, len(h))
