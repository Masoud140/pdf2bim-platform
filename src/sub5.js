/* ===== v41: Loads → Earthquake (step 4) — response spectrum analysis of the integrated model.
   Modes of the one model (deck + bearings + headstocks + piles + ground springs) with the superimposed dead load added as deck mass,
   site hazard spectrum kp·Z·Ch(T) to AS 1170.4 as called up by AS 5100.2, divided by the structural response factor,
   CQC modal combination (5 % damping) plus a missing-mass (residual) term, then 100 % / 30 % directional combinations.
   Inputs not in the drawing set are ASSUMED so the model runs; the value used is stated next to each input. ===== */
var EQ={kp:1.7, Z:0.08, site:'Ce', Rf:1.0, zeta:0.05, nModes:30, wbar:8, vert:false, res:null, modes:null, ver:0};
/* spectral shape factor Ch(T) for modal analysis, AS 1170.4 Table 6.4 as transcribed here — verify against the Standard */
var EQ_CH={Ae:[0.8,15.5,2.35,0.704,1.056], Be:[1.0,19.4,2.94,0.882,1.32], Ce:[1.3,23.8,3.68,1.25,1.874], De:[1.1,25.8,3.68,1.98,2.97], Ee:[1.1,25.8,3.68,3.08,4.62]};
function eqCh(T,s){ var c=EQ_CH[s||EQ.site]; if(T<=0) return c[0]; if(T<=0.1) return Math.min(c[0]+c[1]*T,c[2]); if(T<=0.3) return c[2]; if(T<=1.5) return Math.min(c[2],c[3]/T); return c[4]/(T*T); }
function eqSa(T){ return EQ.kp*EQ.Z*eqCh(T)/EQ.Rf; }   /* in g */
/* small dense symmetric eigen (Jacobi) and generalised A z = λ B z */
function eqJacobi(C,m){ var V=[]; for(var i=0;i<m;i++){ V.push(new Array(m).fill(0)); V[i][i]=1; }
  for(var sw=0;sw<80;sw++){ var off=0; for(var p=0;p<m;p++) for(var q=p+1;q<m;q++) off+=C[p][q]*C[p][q]; if(off<1e-22) break;
    for(var p2=0;p2<m;p2++) for(var q2=p2+1;q2<m;q2++){ if(Math.abs(C[p2][q2])<1e-30) continue; var th=(C[q2][q2]-C[p2][p2])/(2*C[p2][q2]), t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1)), c=1/Math.sqrt(t*t+1), s=t*c;
      for(var k=0;k<m;k++){ var a=C[k][p2], b=C[k][q2]; C[k][p2]=c*a-s*b; C[k][q2]=s*a+c*b; }
      for(var k2=0;k2<m;k2++){ var a2=C[p2][k2], b2=C[q2][k2]; C[p2][k2]=c*a2-s*b2; C[q2][k2]=s*a2+c*b2; }
      for(var k3=0;k3<m;k3++){ var a3=V[k3][p2], b3=V[k3][q2]; V[k3][p2]=c*a3-s*b3; V[k3][q2]=s*a3+c*b3; } } }
  return {lam:C.map(function(r,i){ return r[i]; }), V:V}; }
function eqGen(A,B,m){ var L=[]; for(var i=0;i<m;i++) L.push(new Array(m).fill(0));
  for(var j=0;j<m;j++){ var s=B[j][j]; for(var k=0;k<j;k++) s-=L[j][k]*L[j][k]; L[j][j]=Math.sqrt(Math.max(s,1e-300)); for(var i2=j+1;i2<m;i2++){ var t=B[i2][j]; for(var k2=0;k2<j;k2++) t-=L[i2][k2]*L[j][k2]; L[i2][j]=t/L[j][j]; } }
  var solveL=function(b){ var x=new Array(m); for(var i=0;i<m;i++){ var s=b[i]; for(var k=0;k<i;k++) s-=L[i][k]*x[k]; x[i]=s/L[i][i]; } return x; };
  var solveLt=function(b){ var x=new Array(m); for(var i=m-1;i>=0;i--){ var s=b[i]; for(var k=i+1;k<m;k++) s-=L[k][i]*x[k]; x[i]=s/L[i][i]; } return x; };
  var Y=[]; for(var c=0;c<m;c++) Y.push(solveL(A.map(function(r){ return r[c]; })));          /* Y[c] = L^-1 A[:,c] */
  var C=[]; for(var r=0;r<m;r++) C.push(new Array(m).fill(0));
  for(var r2=0;r2<m;r2++){ var row=solveL(Y.map(function(y){ return y[r2]; })); for(var c2=0;c2<m;c2++) C[r2][c2]=row[c2]; }      /* C = L^-1 A L^-T (symmetric) */
  for(var a=0;a<m;a++) for(var b=a+1;b<m;b++){ var v=0.5*(C[a][b]+C[b][a]); C[a][b]=C[b][a]=v; }
  var J=eqJacobi(C,m), Z=[]; for(var k3=0;k3<m;k3++){ var z=solveLt(J.V.map(function(r){ return r[k3]; })); Z.push(z); }
  return {lam:J.lam, Z:Z}; }   /* Z[k] = eigenvector k (length m) */
/* model, mass and directions */
function eqModel(){ var M=AN.parseMCT(document.getElementById('an_mct_src').textContent), P2=AN.prepare(M,{shear:true}), K=AN.assembleK(P2); AN.cholesky(K,P2.nf);
  var G=wdGeom(), sl=slGeom(), n=P2.nf, md=new Float64Array(n);
  /* superimposed dead load as lumped translational mass on the girder lines: surfacing over the carriageway + two barriers */
  var gam=(typeof LD!=='undefined'&&LD.gamma)||22, ts=(typeof LD!=='undefined'&&LD.tsurf)?(LD.tsurf>1?LD.tsurf/1000:LD.tsurf):G.ts, cw=trCW(), wbar=(typeof LD!=='undefined'&&LD.wbar)?LD.wbar:EQ.wbar;
  var wSDL=gam*ts*cw.b+2*wbar, nG=G.lines.length, mSum=0;
  G.lines.forEach(function(l){ l.p.forEach(function(p,i){ var a=i>0?(p.c-l.p[i-1].c)/2:0, b=i<l.p.length-1?(l.p[i+1].c-p.c)/2:0, mm=wSDL*(a+b)/nG/AN.G; mSum+=mm;
    var i0=6*P2.idx[p.id]; for(var k=0;k<3;k++){ var r=P2.freeMap[i0+k]; if(r>=0) md[r]+=mm; } }); });
  var Mop=function(x){ var y=AN.applyM(P2,x); for(var i=0;i<n;i++) y[i]+=md[i]*x[i]; return y; };
  /* bridge axes: longitudinal = abutment A → B (headstock centroids), transverse = horizontal normal */
  var cA=sl.abs.A.c, cB=sl.abs.B.c, d=[cB[0]-cA[0],cB[1]-cA[1]], dl=Math.hypot(d[0],d[1]); d=[d[0]/dl,d[1]/dl];
  var dirs={L:[d[0],d[1],0], T:[-d[1],d[0],0], V:[0,0,1]};
  var rv=function(v){ var r=new Float64Array(n); for(var nd=0;nd<P2.ids.length;nd++) for(var k=0;k<3;k++){ var f=P2.freeMap[6*nd+k]; if(f>=0) r[f]=v[k]; } return r; };
  var R={}, mtot={}; Object.keys(dirs).forEach(function(k){ R[k]=rv(dirs[k]); var Mr=Mop(R[k]), s=0; for(var i=0;i<n;i++) s+=R[k][i]*Mr[i]; mtot[k]=s; });
  var mStr=0; P2.els.forEach(function(e){ mStr+=e.mu*e.L; });
  return {M:M,P:P2,K:K,G:G,Mop:Mop,dirs:dirs,R:R,mtot:mtot,wSDL:wSDL,mSDL:mSum,mStr:mStr}; }
/* subspace iteration for the lowest modes, with the mass operator including the lumped SDL mass */
function eqModes(E,nm){ var P2=E.P, n=P2.nf, m=nm+8, X=[];
  ['L','T','V'].forEach(function(k){ X.push(Float64Array.from(E.R[k])); });
  for(var c=X.length;c<m;c++){ var v=new Float64Array(n); for(var i=0;i<n;i++) v[i]=Math.sin((i+1)*(c+1)*0.7311)+0.3*Math.cos(i*0.37*(c+2)); X.push(v); }
  var lam=null, prev=null, it;
  for(it=0;it<60;it++){ var MX=X.map(E.Mop), Y=MX.map(function(b){ return AN.cholSolve(E.K,n,b); }), MY=Y.map(E.Mop), A=[], B=[];
    for(var a=0;a<m;a++){ A.push(new Array(m)); B.push(new Array(m)); }
    for(var a2=0;a2<m;a2++) for(var b2=a2;b2<m;b2++){ var sa=0, sb=0; for(var i2=0;i2<n;i2++){ sa+=Y[a2][i2]*MX[b2][i2]; sb+=Y[a2][i2]*MY[b2][i2]; } A[a2][b2]=A[b2][a2]=sa; B[a2][b2]=B[b2][a2]=sb; }
    var g=eqGen(A,B,m), ord=g.lam.map(function(v,i){ return i; }).sort(function(p,q){ return g.lam[p]-g.lam[q]; });
    X=ord.map(function(oi){ var v=new Float64Array(n), z=g.Z[oi]; for(var k=0;k<m;k++){ if(!z[k]) continue; var yk=Y[k]; for(var i3=0;i3<n;i3++) v[i3]+=z[k]*yk[i3]; } return v; });
    lam=ord.map(function(oi){ return g.lam[oi]; });
    if(prev){ var dm=0; for(var q=0;q<nm;q++) dm=Math.max(dm,Math.abs(lam[q]-prev[q])/lam[q]); if(dm<1e-6) break; } prev=lam.slice(); }
  var modes=[]; for(var k2=0;k2<nm;k2++){ var w2=lam[k2]; if(!(w2>0)) break; var MXk=E.Mop(X[k2]), nr=0; for(var i4=0;i4<n;i4++) nr+=X[k2][i4]*MXk[i4]; nr=Math.sqrt(nr);
    var phi=new Float64Array(n); for(var i5=0;i5<n;i5++) phi[i5]=X[k2][i5]/nr; var Mphi=E.Mop(phi), gam={}, eff={};
    Object.keys(E.R).forEach(function(d){ var s=0; for(var i6=0;i6<n;i6++) s+=E.R[d][i6]*Mphi[i6]; gam[d]=s; eff[d]=s*s/E.mtot[d]; });
    modes.push({w:Math.sqrt(w2),T:2*Math.PI/Math.sqrt(w2),phi:phi,gam:gam,eff:eff}); }
  modes.iters=it; return modes; }
/* response quantities from a displacement vector (free dofs) */
function eqQuant(E){ var P2=E.P, M=E.M, piles=SUBM&&SUBM.info?SUBM.info.piles:[], lnk={}; (M.links||[]).forEach(function(l){ lnk['L'+l.id]=l; });
  var links=P2.els.filter(function(e){ return e.link; }), pel=[]; piles.forEach(function(pi,ip){ P2.els.forEach(function(e){ if(!e.link&&pi.chain.indexOf(e.n1)>=0&&pi.chain.indexOf(e.n2)>=0) pel.push({e:e,ip:ip}); }); });
  var names=[]; links.forEach(function(e){ ['v','tr','lon','dtr','dlon'].forEach(function(k){ names.push('B|'+e.id+'|'+k); }); });
  pel.forEach(function(q,i){ ['My1','Mz1','My2','Mz2','Vy','Vz'].forEach(function(k){ names.push('P|'+i+'|'+k); }); });
  piles.forEach(function(pi,ip){ names.push('H|'+ip+'|x','H|'+ip+'|y'); });
  names.push('S|x','S|y','S|z');
  var fn=function(u){ var U=new Float64Array(P2.ndof); for(var i=0;i<P2.ndof;i++) if(P2.freeMap[i]>=0) U[i]=u[P2.freeMap[i]]; var out=new Float64Array(names.length), j=0;
    var loc=function(e){ var ue=e.dof.map(function(d){ return U[d]; }), ul=e.T.map(function(r){ var s=0; for(var k=0;k<12;k++) s+=r[k]*ue[k]; return s; }); return {ul:ul,f:e.Kl.map(function(r){ var s=0; for(var k=0;k<12;k++) s+=r[k]*ul[k]; return s; })}; };
    links.forEach(function(e){ var o=loc(e), f=o.f, l=o.ul; out[j++]=f[0]; out[j++]=-f[1]; out[j++]=-f[2]; var dd=brgDef(l,e.L,lnk[e.id]); out[j++]=dd[0]; out[j++]=dd[1]; });
    pel.forEach(function(q){ var f=loc(q.e).f; out[j++]=f[4]; out[j++]=f[5]; out[j++]=f[10]; out[j++]=f[11]; out[j++]=f[1]; out[j++]=f[2]; });
    piles.forEach(function(pi){ var it=6*P2.idx[pi.top]; out[j++]=U[it]*1000; out[j++]=U[it+1]*1000; });
    var sx=0, sy=0, sz=0; (P2.spr||[]).forEach(function(s){ var f=s.k*U[s.dof]; if(s.k6===0) sx+=f; if(s.k6===1) sy+=f; if(s.k6===2) sz+=f; }); out[j++]=sx; out[j++]=sy; out[j++]=sz;
    return out; };
  return {names:names, fn:fn, links:links.map(function(e){ return {id:e.id,ab:/AbutB/i.test((lnk[e.id]||{}).group||'')?'B':'A'}; }), pel:pel.map(function(q){ return {ip:q.ip,z1:M.nodes[q.e.n1][2],z2:M.nodes[q.e.n2][2]}; }), piles:piles}; }
function eqRho(wi,wj,z){ var r=wj/wi; return 8*z*z*(1+r)*Math.pow(r,1.5)/(Math.pow(1-r*r,2)+4*z*z*r*(1+r)*(1+r)); }
function eqRun(){ var E=eqModel(), modes=eqModes(E,EQ.nModes), Q=eqQuant(E), n=E.P.nf, g=AN.G;
  var dirs=EQ.vert?['L','T','V']:['L','T'], resp={};
  dirs.forEach(function(d){ var Rk=modes.map(function(md){ var a=eqSa(md.T)*g*md.gam[d]/(md.w*md.w), u=new Float64Array(n); for(var i=0;i<n;i++) u[i]=a*md.phi[i]; return Q.fn(u); });
    var nq=Q.names.length, cqc=new Float64Array(nq);
    for(var i2=0;i2<modes.length;i2++) for(var j2=0;j2<modes.length;j2++){ var rho=i2===j2?1:eqRho(modes[i2].w,modes[j2].w,EQ.zeta); if(rho<1e-4) continue; for(var q=0;q<nq;q++) cqc[q]+=rho*Rk[i2][q]*Rk[j2][q]; }
    /* missing mass: static response to the rigid acceleration of the mass not captured by the modes, at the zero-period ordinate */
    var Mr=E.Mop(E.R[d]), us=AN.cholSolve(E.K,n,Mr); modes.forEach(function(md){ var c=md.gam[d]/(md.w*md.w); for(var i3=0;i3<n;i3++) us[i3]-=c*md.phi[i3]; });
    var a0=eqSa(0)*g, ures=new Float64Array(n); for(var i4=0;i4<n;i4++) ures[i4]=a0*us[i4]; var Rres=Q.fn(ures);
    var tot=new Float64Array(nq); for(var q2=0;q2<nq;q2++) tot[q2]=Math.sqrt(Math.max(0,cqc[q2])+Rres[q2]*Rres[q2]);
    var meff=modes.reduce(function(s,m){ return s+m.eff[d]; },0);
    resp[d]={R:tot, meff:meff, res:Rres}; });
  /* directional combinations: 100 % one direction + 30 % the other(s) */
  var combos=[{id:'EQ-L',n:'100 % longitudinal + 30 % transverse'+(EQ.vert?' + 30 % vertical':''),w:{L:1,T:0.3,V:0.3}},{id:'EQ-T',n:'30 % longitudinal + 100 % transverse'+(EQ.vert?' + 30 % vertical':''),w:{L:0.3,T:1,V:0.3}}];
  if(EQ.vert) combos.push({id:'EQ-V',n:'30 % longitudinal + 30 % transverse + 100 % vertical',w:{L:0.3,T:0.3,V:1}});
  var nq=Q.names.length; combos.forEach(function(c){ var v=new Float64Array(nq); dirs.forEach(function(d){ for(var q=0;q<nq;q++) v[q]+=c.w[d]*resp[d].R[q]; }); c.R=v; });
  EQ._E=E; EQ._modes=modes;
  EQ.res={E:{mtot:E.mtot,wSDL:E.wSDL,mSDL:E.mSDL,mStr:E.mStr,dirs:E.dirs},modes:modes.map(function(m){ return {T:m.T,eff:m.eff,Sa:eqSa(m.T)}; }),iters:modes.iters,Q:Q,resp:resp,combos:combos,at:new Date()}; EQ.ver++; return EQ.res; }
/* summary of one response vector */
function eqSum(Q,R){ var ix={}; Q.names.forEach(function(k,i){ ix[k]=i; }); var brg=Q.links.map(function(l){ var g=function(k){ return R[ix['B|'+l.id+'|'+k]]; }; return {id:l.id,ab:l.ab,v:g('v'),tr:g('tr'),lon:g('lon'),dtr:g('dtr'),dlon:g('dlon')}; });
  var pl=Q.piles.map(function(pi,ip){ var mx=0,zM=null,vx=0; Q.pel.forEach(function(q,i){ if(q.ip!==ip) return; var g=function(k){ return R[ix['P|'+i+'|'+k]]; }, m1=Math.hypot(g('My1'),g('Mz1')), m2=Math.hypot(g('My2'),g('Mz2')), v=Math.hypot(g('Vy'),g('Vz'));
      if(m1>mx){ mx=m1; zM=q.z1; } if(m2>mx){ mx=m2; zM=q.z2; } vx=Math.max(vx,v); });
    return {id:pi.id,ab:pi.ab,M:mx,zM:zM,V:vx,dx:Math.hypot(R[ix['H|'+ip+'|x']],R[ix['H|'+ip+'|y']])}; });
  return {brg:brg,piles:pl,S:[R[ix['S|x']],R[ix['S|y']],R[ix['S|z']]]}; }
function eqBuild(){ var pane=document.getElementById('paneEQ'); if(!pane) return; var $=function(i){ return document.getElementById(i); };
  var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var AS='<span class="tg" style="color:#b45309">Assumed</span>', SV='<span class="tg" style="color:#7c3aed">Standard — verify</span>', CA='<span class="tg tC">Calculated</span>', MO='<span class="tg">Model</span>';
  var inp=function(k,v,w){ return '<input class="f eqin" data-k="'+k+'" value="'+v+'" style="width:'+(w||64)+'px">'; };
  var as=function(t){ return '<div class="wdas">'+AS+' '+t+'</div>'; };
  var h='<div class="card"><div class="sdh">Earthquake — response spectrum analysis of the integrated model</div><div class="bbnote">Modes of the one model (superstructure, bearings, headstocks, piles, ground springs) with the superimposed dead load added as mass on the girder lines. Each mode is loaded by the design spectrum; modal responses are combined by CQC with a missing-mass term, then directions by 100 % + 30 %. Results are unfactored earthquake actions for the AS 5100.2 combinations. Where the drawing set gives no value, a value is <b>assumed</b> so the model runs and the value used is stated under the input.</div></div>';
  h+='<div class="card"><div class="sdh">1. Hazard and spectrum</div><table class="dt wdt" style="max-width:1150px"><tr><th class="l">Input</th><th>Value</th><th class="l">Source and assumption</th></tr>'
   +'<tr><td class="l">Probability factor k<sub>p</sub></td><td>'+inp('kp',EQ.kp,56)+'</td><td class="l">'+as('<b>'+EQ.kp+' used</b>, taken as the AS 1170.4 factor for a 1/2000 annual probability of exceedance. The design return period follows the bridge importance level in AS 5100.2 — not in the drawing set; confirm both.')+'</td></tr>'
   +'<tr><td class="l">Hazard factor Z</td><td>'+inp('Z',EQ.Z,56)+'</td><td class="l">'+SV+' <b>'+EQ.Z+' used</b> — Sydney value in AS 1170.4; confirm for the site.</td></tr>'
   +'<tr><td class="l">Site sub-soil class</td><td><select class="f eqin" data-k="site">'+Object.keys(EQ_CH).map(function(k){ return '<option'+(k===EQ.site?' selected':'')+'>'+k+'</option>'; }).join('')+'</select></td><td class="l">'+as('<b>Class '+EQ.site+' used</b> (shallow soil over rock: about 10 m of fill and soil above the rock socket at RL B). Set from the geotechnical report.')+'</td></tr>'
   +'<tr><td class="l">Structural response factor (divides the spectrum)</td><td>'+inp('Rf',EQ.Rf,56)+'</td><td class="l">'+as('<b>'+EQ.Rf+' used</b> — elastic response, no ductility reduction. Confirm the AS 5100.2 value for the substructure type and the bridge earthquake design category.')+'</td></tr>'
   +'<tr><td class="l">Damping ratio</td><td>'+inp('zeta',EQ.zeta,56)+'</td><td class="l">'+SV+' <b>'+EQ.zeta+' used</b> (5 %, the basis of the AS 1170.4 spectrum).</td></tr>'
   +'<tr><td class="l">Spectral shape factor C<sub>h</sub>(T)</td><td>class '+EQ.site+'</td><td class="l">'+SV+' AS 1170.4 spectral shape for modal analysis, as transcribed in this tool — check the ordinates against the Standard. Plateau '+f(EQ_CH[EQ.site][2],2)+', S<sub>a</sub>(T) = k<sub>p</sub>·Z·C<sub>h</sub>(T) / factor; peak '+f(eqSa(0.2),3)+' g, at T = 0: '+f(eqSa(0),3)+' g '+CA+'</td></tr>'
   +'<tr><td class="l">Vertical earthquake</td><td><select class="f eqin" data-k="vert"><option value="0"'+(EQ.vert?'':' selected')+'>not included</option><option value="1"'+(EQ.vert?' selected':'')+'>included (same spectrum)</option></select></td><td class="l">'+as('<b>'+(EQ.vert?'included with the horizontal spectrum':'not included')+'</b> — confirm whether AS 5100.2 requires it for this bridge and the vertical spectrum to use.')+'</td></tr></table>'
   +'<div id="eq_spec"></div></div>';
  h+='<div class="card"><div class="sdh">2. Mass and modes</div><table class="dt wdt" style="max-width:1150px"><tr><th class="l">Input</th><th>Value</th><th class="l">Source and assumption</th></tr>'
   +'<tr><td class="l">Structural mass (self weight of every member, piles included)</td><td>from the model</td><td class="l">'+MO+' member densities from the MCT; rigid offsets massless</td></tr>'
   +'<tr><td class="l">Barrier weight per side (kN/m) as mass</td><td>'+((typeof LD!=='undefined'&&LD.wbar)?f(LD.wbar,2)+' (Loads tab)':inp('wbar',EQ.wbar,56))+'</td><td class="l">'+((typeof LD!=='undefined'&&LD.wbar)?'<span class="tg tU">Input (user)</span> Loads (SDL) tab':as('<b>'+EQ.wbar+' kN/m used.</b> Precast barrier (DRG 202401) mass not in this drawing set — enter it in Loads (SDL) to replace this.'))+'</td></tr>'
   +'<tr><td class="l">Surfacing as mass</td><td>γ '+f((typeof LD!=='undefined'&&LD.gamma)||22,1)+' kN/m³ × '+f((typeof LD!=='undefined'&&LD.tsurf)?(LD.tsurf>1?LD.tsurf/1000:LD.tsurf):0.075,3)+' m over the carriageway</td><td class="l">Same values as the Loads (SDL) tab</td></tr>'
   +'<tr><td class="l">Number of modes</td><td>'+inp('nModes',EQ.nModes,56)+'</td><td class="l">'+MO+' the missing mass beyond these modes is added as a static residual at the zero-period ordinate</td></tr></table></div>';
  h+='<div class="card"><div class="msbar"><button class="b" id="eq_run">Run the response spectrum analysis</button><span class="n" id="eq_st">'+(EQ.res?'Solved '+EQ.res.at.toTimeString().slice(0,8):'')+'</span><button class="b" id="eq_dl">Download the spectrum (.txt)</button></div><div id="eq_out"></div></div>';
  pane.innerHTML=h; pane.dataset.built=1; eqSpecSvg();
  [].forEach.call(pane.querySelectorAll('.eqin'),function(el){ el.onchange=function(){ var k=el.getAttribute('data-k'), v=el.value; if(k==='site') EQ.site=v; else if(k==='vert') EQ.vert=v==='1'; else { var n=parseFloat(v); if(isFinite(n)) EQ[k]=k==='nModes'?Math.max(3,Math.min(60,Math.round(n))):n; } if(k==='nModes'||k==='wbar') EQ._modes=null; EQ.res=null; eqBuild(); }; });
  $('eq_run').onclick=function(){ $('eq_st').textContent='Running (modes, then spectrum) — this takes a little while…'; setTimeout(function(){ try{ var t0=Date.now(); eqRun(); eqShow(); $('eq_st').textContent='Solved '+EQ.res.at.toTimeString().slice(0,8)+' in '+((Date.now()-t0)/1000).toFixed(1)+' s on the integrated model'; }catch(e){ $('eq_st').textContent='Stopped: '+e.message; console.error(e); } },30); };
  $('eq_dl').onclick=function(){ var L=['; BR13A design spectrum (dashboard, Loads → Earthquake). kp='+EQ.kp+', Z='+EQ.Z+', site class '+EQ.site+', divided by '+EQ.Rf+'. Assumed inputs — see the dashboard.','; Period (s), Sa (g)'];
    for(var T=0;T<=4.0001;T+=0.05) L.push(T.toFixed(2)+', '+eqSa(T).toFixed(5)); var bl=new Blob([L.join('\n')],{type:'text/plain'}), a=document.createElement('a'); a.href=URL.createObjectURL(bl); a.download='BR13A_design_spectrum.txt'; a.click(); };
  if(EQ.res) eqShow(); }
function eqSpecSvg(){ var o=document.getElementById('eq_spec'); if(!o) return; var W=560, H=200, Tm=3, sm=eqSa(0.2)*1.1, X=function(T){ return 46+T/Tm*(W-60); }, Y=function(s){ return H-28-s/sm*(H-44); };
  var pts=[]; for(var T=0;T<=Tm+1e-9;T+=0.01) pts.push(X(T).toFixed(1)+','+Y(eqSa(T)).toFixed(1));
  var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:600px;height:auto;color:var(--fg)" role="img" aria-label="Design spectrum">';
  [0,0.5,1,1.5,2,2.5,3].forEach(function(T){ s+='<line x1="'+X(T)+'" x2="'+X(T)+'" y1="'+Y(0)+'" y2="'+Y(sm)+'" stroke="currentColor" stroke-opacity=".12"/><text x="'+X(T)+'" y="'+(H-12)+'" font-size="10" text-anchor="middle" fill="currentColor">'+T+'</text>'; });
  [0,sm/2,sm].forEach(function(v){ s+='<text x="40" y="'+(Y(v)+3)+'" font-size="10" text-anchor="end" fill="currentColor">'+v.toFixed(3)+'</text>'; });
  s+='<polyline fill="none" stroke="#0e7c86" stroke-width="2" points="'+pts.join(' ')+'"/>';
  if(EQ.res) EQ.res.modes.forEach(function(m){ if(m.T<=Tm) s+='<circle cx="'+X(m.T)+'" cy="'+Y(m.Sa)+'" r="2.6" fill="#b45309"><title>T '+m.T.toFixed(3)+' s, Sa '+m.Sa.toFixed(3)+' g</title></circle>'; });
  s+='<text x="'+(W-14)+'" y="'+(H-12)+'" font-size="10" text-anchor="end" fill="currentColor">T (s)</text><text x="46" y="12" font-size="10" fill="currentColor">S<tspan dy="2" font-size="8">a</tspan><tspan dy="-2"> (g)</tspan>'+(EQ.res?' — dots: modes':'')+'</text></svg>';
  o.innerHTML=s; }
function eqShow(){ var o=document.getElementById('eq_out'); if(!o||!EQ.res) return; eqSpecSvg(); var r=EQ.res, f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var mt=r.E.mtot, h='<div class="sdh">3. Modes</div><table class="dt" style="max-width:1000px"><tr><th class="l">Mass</th><th>Value</th></tr>'
   +'<tr><td class="l">Total mass in the model (members + superimposed dead load)</td><td>'+f(mt.L,1)+' t ('+f(r.E.mStr,1)+' t members + '+f(r.E.mSDL,1)+' t SDL; SDL '+f(r.E.wSDL,2)+' kN/m)</td></tr></table>';
  var cum={L:0,T:0,V:0};
  h+='<div class="stfwrap" style="max-height:340px;overflow:auto;margin-top:6px"><table class="dt"><tr><th>Mode</th><th>T (s)</th><th>f (Hz)</th><th>S<sub>a</sub> (g)</th><th>Mass longitudinal</th><th>Mass transverse</th><th>Mass vertical</th><th>Cumulative L / T / V</th></tr>';
  r.modes.forEach(function(m,i){ cum.L+=m.eff.L; cum.T+=m.eff.T; cum.V+=m.eff.V; h+='<tr><td>'+(i+1)+'</td><td>'+f(m.T,3)+'</td><td>'+f(1/m.T,2)+'</td><td>'+f(m.Sa,3)+'</td><td>'+f(100*m.eff.L,1)+' %</td><td>'+f(100*m.eff.T,1)+' %</td><td>'+f(100*m.eff.V,1)+' %</td><td>'+f(100*cum.L,1)+' / '+f(100*cum.T,1)+' / '+f(100*cum.V,1)+' %</td></tr>'; });
  h+='</table></div><div class="bbnote">Modal mass captured by '+r.modes.length+' modes: longitudinal '+f(100*r.resp.L.meff,1)+' %, transverse '+f(100*r.resp.T.meff,1)+' %'+(r.resp.V?', vertical '+f(100*r.resp.V.meff,1)+' %':'')+'. The remainder (mostly the pile and headstock mass held by the ground springs) is included by the missing-mass term. Subspace iteration converged in '+r.iters+' iterations.</div>';
  /* base shear hand check: ΣF = sum over modes is not simple with CQC — show ground spring totals per direction */
  h+='<div class="sdh" style="margin-top:10px">4. Earthquake actions (unfactored)</div><div class="stfwrap"><table class="dt"><tr><th class="l" style="min-width:220px">Case</th><th>Ground springs |ΣF| along global x / y (kN)</th><th>Bearings A: max long. / trans. (kN)</th><th>Bearings B: max long. / trans. (kN)</th><th>Bearing vertical ± (kN)</th><th>Max movement at B bearings long. / trans. (mm)</th><th>Max pile |M| (kN·m)</th><th>Max pile |V| (kN)</th><th>Max pile-head deflection (mm)</th></tr>';
  var rows=[{id:'L',n:'Longitudinal only (100 %)',R:r.resp.L.R},{id:'T',n:'Transverse only (100 %)',R:r.resp.T.R}].concat(r.resp.V?[{id:'V',n:'Vertical only (100 %)',R:r.resp.V.R}]:[]).concat(r.combos.map(function(c){ return {id:c.id,n:c.n,R:c.R}; }));
  r._rows=rows;
  rows.forEach(function(w){ var s=eqSum(r.Q,w.R), A=s.brg.filter(function(b){ return b.ab==='A'; }), B=s.brg.filter(function(b){ return b.ab==='B'; }), mx=function(a,k){ return Math.max.apply(null,a.map(function(b){ return Math.abs(b[k]); })); };
    var pm=s.piles.reduce(function(a,p){ return p.M>a.M?p:a; },{M:0});
    h+='<tr><td class="l"><b>'+w.id+'</b> '+w.n+'</td><td>'+f(s.S[0],1)+' / '+f(s.S[1],1)+'</td><td>'+f(mx(A,'lon'),1)+' / '+f(mx(A,'tr'),1)+'</td><td>'+f(mx(B,'lon'),1)+' / '+f(mx(B,'tr'),1)+'</td><td>'+f(mx(s.brg,'v'),1)+'</td><td>'+f(mx(B,'dlon'),2)+' / '+f(mx(B,'dtr'),2)+'</td><td>'+f(pm.M,1)+(pm.id?' ('+pm.id+', RL '+f(pm.zM,2)+')':'')+'</td><td>'+f(Math.max.apply(null,s.piles.map(function(p){ return p.V; })),1)+'</td><td>'+f(Math.max.apply(null,s.piles.map(function(p){ return p.dx; })),2)+'</td></tr>'; });
  h+='</table></div><div class="bbnote">Values are peak magnitudes (signs are lost in the modal combination); apply them in both senses. Bearing forces are per bearing (largest of each abutment); movement is across the bearing, as on the Temperature page. With abutment B free longitudinally, the longitudinal inertia of the deck reaches the ground through abutment A only.</div>';
  /* hand check: single-mode longitudinal estimate */
  var mL=r.modes.reduce(function(a,m){ return m.eff.L>a.eff.L?m:a; },r.modes[0]), sL=eqSum(r.Q,r.resp.L.R);
  h+='<table class="dt" style="max-width:900px;margin-top:6px"><tr><th class="l">Hand check — longitudinal</th><th>Value</th></tr>'
   +'<tr><td class="l">Dominant longitudinal mode: T = '+f(mL.T,3)+' s, effective mass '+f(100*mL.eff.L,1)+' % of '+f(mt.L,1)+' t, S<sub>a</sub> = '+f(mL.Sa,3)+' g</td><td>'+f(mL.eff.L*mt.L*mL.Sa*AN.G,1)+' kN (equivalent static force of that mode)</td></tr>'
   +'<tr><td class="l">Model: Σ longitudinal force in the abutment A bearings (sum of peaks)</td><td>'+f(sL.brg.filter(function(b){ return b.ab==='A'; }).reduce(function(a,b){ return a+Math.abs(b.lon); },0),1)+' kN</td></tr></table>';
  h+='<div class="msbar" style="margin-top:8px"><label>Detail for <select id="eq_sel">'+rows.map(function(w,i){ return '<option value="'+i+'">'+w.id+' — '+w.n+'</option>'; }).join('')+'</select></label></div><div id="eq_det"></div>';
  o.innerHTML=h; var sel=document.getElementById('eq_sel'); sel.onchange=function(){ eqDet(+sel.value); }; eqDet(0); }
function eqDet(i){ var w=EQ.res._rows[i], s=eqSum(EQ.res.Q,w.R), f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var h='<div class="srfgrid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)"><div><table class="dt"><tr><th>Bearing</th><th>Vertical ± (kN)</th><th>Transverse (kN)</th><th>Longitudinal (kN)</th><th>Long. movement (mm)</th><th>Trans. movement (mm)</th></tr>';
  s.brg.forEach(function(b){ h+='<tr><td>'+b.ab+' '+b.id+'</td><td>'+f(b.v,1)+'</td><td>'+f(b.tr,1)+'</td><td>'+f(b.lon,1)+'</td><td>'+f(b.dlon,2)+'</td><td>'+f(b.dtr,2)+'</td></tr>'; });
  h+='</table></div><div><table class="dt"><tr><th>Pile</th><th>Max |M| (kN·m)</th><th>at RL</th><th>Max |V| (kN)</th><th>Head deflection (mm)</th></tr>';
  s.piles.forEach(function(p){ h+='<tr><td>'+p.id+'</td><td>'+f(p.M,1)+'</td><td>'+f(p.zM,2)+'</td><td>'+f(p.V,1)+'</td><td>'+f(p.dx,2)+'</td></tr>'; });
  document.getElementById('eq_det').innerHTML=h+'</table></div></div>'; }
(function(){ if(typeof TABS==='undefined') return; var lv=document.getElementById('paneWD')||document.getElementById('paneLD'); if(!lv) return;
  var pane=document.createElement('div'); pane.id='paneEQ'; pane.style.display='none'; lv.parentNode.insertBefore(pane,lv.nextSibling);
  TABS.push({id:'eq',label:'Earthquake',pane:'paneEQ',build:function(){ eqBuild(); },draw:function(){}});
  var G=TAB_GROUPS.filter(function(g){ return g.g==='load'; })[0]; if(G){ var i=G.ids.indexOf('wd'); G.ids.splice(i>=0?i+1:G.ids.length,0,'eq'); }
  var act=typeof ACTIVE!=='undefined'?ACTIVE:null; initTabs(); if(act) try{ showTab(act); }catch(e){}
  if(typeof SUBM!=='undefined'&&SUBM){ var a0=SUBM.apply; SUBM.apply=function(){ a0.apply(SUBM,arguments); EQ.res=null; }; } })();
