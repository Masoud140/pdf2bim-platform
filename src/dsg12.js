/* ===== v43 (step 5b): combination "x" — every AS 5100.2 combination row of the Combos tab acting on the girder at the station.
   Permanent actions keep their construction-stage values (SW, WET, REL, SDL, CSH); all other actions (traffic per model, braking,
   centrifugal, wind, uniform temperature, earthquake, earth pressure) come from Design → Combined actions on the integrated model. ===== */
(function(){ var a0=dgActAt; dgActAt=function(gi,s){ var r=a0(gi,s); try{ var st=dgStation(gi,s); r.gi=gi; r.x=st.x; r.sg=st.sg; r.L=st.it.e.L; }catch(e){} return r; }; })();
function dgXok(){ return !!(typeof RX!=='undefined'&&RX.res&&RX.Q&&!(DG.opt&&DG.opt.allx===false)&&typeof CBX!=='undefined'); }
/* station values {M,V,T,N} of a register case: static {s:{..}} or envelope {mx:{..},mn:{..}} */
function dgXprim(brk){ var Q=RX.Q, Pm=RX.res.Pm, ix={}, el=brk.el, w=brk.L?Math.max(0,Math.min(1,brk.x/brk.L)):0, sg=brk.sg||1;
  Q.forEach(function(q,i){ if(q.k==='G'&&q.id===el) ix[q.t]=i; }); if(ix.GM0===undefined) return null;
  var at=function(v){ return {M:v[ix.GM0]*(1-w)+v[ix.GM1]*w, V:sg*v[ix.GV], T:v[ix.GT], N:v[ix.GN]}; };
  var out={}; Object.keys(Pm).forEach(function(id){ if(id==='DLc'||id==='SDLp') return; var e=Pm[id].e;
    if(e.s) out[id]={s:at(e.s)}; else { var a=at(e.max), b=at(e.min), mx={}, mn={}; ['M','V','T','N'].forEach(function(k){ mx[k]=Math.max(a[k],b[k]); mn[k]=Math.min(a[k],b[k]); }); out[id]={mx:mx,mn:mn}; } });
  var A=brk.a, sum=function(ks){ var o={M:0,V:0,T:0,N:0}; ks.forEach(function(k){ ['M','V','T','N'].forEach(function(c){ o[c]+=(A[k]&&A[k][c])||0; }); }); return o; };
  out.DLc={s:sum(['SW','WET','REL'])}; out.DLnc={s:sum(['SW','WET'])}; out.SDLp={s:sum(['SDL'])}; out.CSH={s:sum(['CSH'])};
  return out; }
/* evaluate the rows of one limit state; returns governing values and rows */
function dgXrows(ls){ var o=Object.assign(CBX.opt(),{tm:'s'}), key=JSON.stringify(o)+JSON.stringify(CBX.R.map(function(r){ return [r.on,r.u,r.b,r.s]; }));
  if(!DG._xr||DG._xr.key!==key){ var all=CBX.genAll(o).rows; DG._xr={key:key,ULS:all.filter(function(r){ return r.ls==='ULS'; }),SLS:all.filter(function(r){ return r.ls==='SLS'; })}; } return DG._xr[ls]; }
function dgXeval(pr,ls){ var rows=dgXrows(ls), K=['M','V','T','N'];
  var scr=(dgFac('SCR',4)===null)?1.2:dgFac('SCR',4), best={Mhi:{v:-Infinity},Mlo:{v:Infinity},V:{v:-1},T:{v:-1},Ms:{v:-Infinity}};
  rows.forEach(function(r){ var lo={M:0,V:0,T:0,N:0}, hi={M:0,V:0,T:0,N:0}, Nt=0, nc=0, hasSCR=false;
    r.t.forEach(function(t){ var id=t[0], f=t[1], p=pr[id]; if(id==='SCR') hasSCR=true; if(id==='SCR') p=pr.CSH; if(!p) return;
      if(id==='DLc') nc+=f*pr.DLnc.s.M;
      if(p.s){ K.forEach(function(k){ lo[k]+=f*p.s[k]; hi[k]+=f*p.s[k]; }); Nt+=f*p.s.N; }
      else { K.forEach(function(k){ var a=f*p.mx[k], b=f*p.mn[k]; hi[k]+=Math.max(a,b); lo[k]+=Math.min(a,b); }); Nt+=Math.max(f*p.mx.N,f*p.mn.N); } });
    /* creep + shrinkage secondary moment: always present (as the existing (b) and (a) checks); adverse factor when it adds, 0 when it relieves */
    if(!hasSCR){ var c=pr.CSH.s, fu=ls==='ULS'?scr:1; K.forEach(function(k){ var v=c[k]; if(ls==='SLS'){ lo[k]+=v; hi[k]+=v; } else { if(v>0) hi[k]+=fu*v; else lo[k]+=fu*v; } }); Nt+=(ls==='SLS'?1:(c.N>0?fu:0))*c.N; }
    if(hi.M>best.Mhi.v) best.Mhi={v:hi.M,r:r.name,N:Nt}; if(lo.M<best.Mlo.v) best.Mlo={v:lo.M,r:r.name,N:Nt};
    var vv=Math.max(Math.abs(hi.V),Math.abs(lo.V)), tt=Math.max(Math.abs(hi.T),Math.abs(lo.T)); if(vv>best.V.v) best.V={v:vv,r:r.name}; if(tt>best.T.v) best.T={v:tt,r:r.name};
    if(ls==='SLS'&&hi.M>best.Ms.v) best.Ms={v:hi.M,nc:nc,r:r.name,N:Nt-(pr.DLnc.s.N||0)}; });
  best.n=rows.length; return best; }
function dgCombX(lc){ var q=JSON.parse(JSON.stringify(lc)); q.comb='x'; q.name=lc.name; var pr=q.brk?dgXprim(q.brk):null;
  if(!pr){ q.src='x: no girder actions at this station'; return q; }
  var U=dgXeval(pr,'ULS'), S=dgXeval(pr,'SLS'), g=Math.abs(U.Mhi.v)>=Math.abs(U.Mlo.v)?U.Mhi:U.Mlo, useN=!(DG.opt&&DG.opt.useN===false);
  q.Mu=g.v; q.Vu=U.V.v; q.Tu=U.T.v; q.Nu=useN?g.N:0; q.Mnc=S.Ms.nc; q.Ms=S.Ms.v-S.Ms.nc; q.Ns=useN?S.Ms.N:0;
  q.xgov={M:g.r,V:U.V.r,T:U.T.r,Ms:S.Ms.r,nU:U.n,nS:S.n}; q.src='all Combos tab rows ('+U.n+' ULS, '+S.n+' SLS)'; q.facSrc='Combos tab rows: M* '+g.r+', V* '+U.V.r+', T* '+U.T.r+'; SLS '+S.Ms.r;
  q.gam=lc.gam; return q; }
/* register "x" with the design's combination machinery */
(function(){ var k0=dgCombKeys; dgCombKeys=function(){ var k=k0(); if(dgXok()) k.push('x'); return k; };
  var b0=dgCombBuild; dgCombBuild=function(lc,X,B,sol){ var out=b0(lc,X,B,sol); if(dgXok()){ try{ var q=dgCombX(lc); q.free=dgFreeFor('b'); var o=dgLC(X,B,q); o.X=X; o.B=B; o.solid=sol; out.x={lc:q,o:o}; }catch(e){ console.error('comb x',e); } } return out; };
  var l0=dgCombList; dgCombList=function(){ var l=l0(); if(l&&dgXok()){ var t=DG.an.type; if(t==='uls') l.push(['x','ULS — all AS 5100.2 combinations of the Combos tab (traffic, braking, wind, thermal, earthquake, soil) on the integrated model']); if(t==='sls') l.push(['x','SLS — all AS 5100.2 combinations of the Combos tab on the integrated model']); } return l; };
  DG_CB_STY.x={dash:'2 2',wd:2,suf:' — (x) all Combos tab rows'}; })();
(function(){ var c0=dgCombsOn; dgCombsOn=function(){ var l=c0(); if(DG.an&&DG.an.comb==='env'&&dgXok()&&l.indexOf('x')<0) l.push('x'); return l; }; })();
