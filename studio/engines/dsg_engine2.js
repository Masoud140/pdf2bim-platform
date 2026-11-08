
/* ===== DSG2: general ULS (either face, any N), N-M curve, shear and torsion (AS 5100.5:2017 Cl 8.2 general method) ===== */
var DSG2 = (function(){
  var ecu=0.003;
  function depth(S){ return S.conc.reduce(function(m,c){ return Math.max(m,c.y+c.h/2); },0); }
  /* forces for neutral axis depth dn measured from the compression face ('top' = sagging, 'bot' = hogging) */
  function at(S, dn, face, yr){
    var D=depth(S), z=function(y){ return face==='top'?y:D-y; };
    var fcF=null, zmin=1e9; S.conc.forEach(function(c){ var zc=z(c.y); if(zc<zmin){ zmin=zc; fcF=c.fc; } });
    var g=DSG.gam(fcF), blk=g*dn, N=0, M=0;
    S.conc.forEach(function(c){ var z1=z(c.y)-c.h/2, z2=z(c.y)+c.h/2, hi=Math.min(z2,blk); if(hi>z1){ var f=-DSG.a2(c.fc)*c.fc*c.b*(hi-z1), zm=(z1+hi)/2, ym=face==='top'?zm:D-zm; N+=f; M+=f*(ym-yr); } });
    (S.bars||[]).forEach(function(b){ var e=-ecu*(dn-z(b.y))/dn, s=Math.max(-b.fsy,Math.min(b.fsy,b.E*e)); if(z(b.y)<blk){ var cc=DSG.conAt(S,b.y); if(cc&&s<0) s+=DSG.a2(cc.fc)*cc.fc; } var f=s*b.A; N+=f; M+=f*(b.y-yr); });
    (S.tend||[]).forEach(function(t){ var e=-ecu*(dn-z(t.y))/dn+t.epe, s=DSG.fp(t,e), f=s*t.A; N+=f; M+=f*(t.y-yr); });
    var dmax=0; (S.bars||[]).concat(S.tend||[]).forEach(function(s){ dmax=Math.max(dmax,z(s.y)); });
    return {N:N, M:M, dn:dn, kuo:dn/dmax, gamma:g};
  }
  function phiB(kuo){ return Math.max(0.6,Math.min(0.8,1.19-13*kuo/12)); }
  /* capacity at a given axial force (tension +, N) */
  function muAtN(S, Nt, face, yr){
    var D=depth(S), lo=1, hi=50*D, flo=at(S,lo,face,yr).N-Nt;
    if(flo<0) return null;                                    // beyond tension capacity
    if(at(S,hi,face,yr).N-Nt>0) return null;                   // beyond squash load
    for(var i=0;i<120;i++){ var m=Math.sqrt(lo*hi), f=at(S,m,face,yr).N-Nt; if(f>0) lo=m; else hi=m; }
    return at(S,Math.sqrt(lo*hi),face,yr);
  }
  /* N-M interaction (nominal and factored) for one face; phi per Table 2.3.2: 0.6..0.8 from kuo in bending, 0.6 above the balanced load */
  function nm(S, face, yr){
    var D=depth(S), pts=[], dmax=0; (S.bars||[]).concat(S.tend||[]).forEach(function(s){ dmax=Math.max(dmax,face==='top'?s.y:D-s.y); });
    var dnb=ecu/(ecu+0.0025)*dmax, Nub=at(S,dnb,face,yr).N;
    for(var i=0;i<=90;i++){ var dn=dmax*Math.pow(10,-2.2+3.6*i/90), r=at(S,dn,face,yr), ph;
      if(r.N>=0) ph=phiB(r.kuo); else ph=(r.N<=Nub)?0.6:0.6+(phiB(r.kuo)-0.6)*(1-r.N/Nub);
      pts.push({N:r.N/1e3, M:r.M/1e6, phi:ph, dn:dn}); }
    var Tt=0, Mt=0; (S.bars||[]).forEach(function(b){ Tt+=b.fsy*b.A; Mt+=b.fsy*b.A*(b.y-yr); }); (S.tend||[]).forEach(function(t){ Tt+=t.fpb*t.A; Mt+=t.fpb*t.A*(t.y-yr); });
    pts.unshift({N:Tt/1e3, M:Mt/1e6, phi:0.8, dn:0});
    return {pts:pts, Nub:Nub/1e3};
  }
  /* ---- shear and torsion, general method ---- */
  function shear(Q, L){            /* Q: section data (N, mm, MPa), L: {V,T,M,N} in kN, kNm (N tension +) */
    var V=Math.abs(L.V)*1e3, T=Math.abs(L.T||0)*1e6, M=Math.abs(L.M||0)*1e6, N=(L.N||0)*1e3, phi=0.7, o={};
    var sf=Math.min(Math.sqrt(Q.fc),8);
    o.Teq=Q.Ao>0?0.9*T*Q.uh/(2*Q.Ao):0;                                     // torsion as an equivalent shear on the walls
    o.Veff=Math.sqrt(Math.pow(Math.max(V-Q.Pv,0),2)+o.Teq*o.Teq);
    o.num=M/Q.dv+o.Veff+0.5*N-Q.Apt*Q.spo;
    o.den1=2*(Q.Es*Q.Ast+Q.Ep*Q.Apt); o.ex=o.num/o.den1; o.denUsed='2(EsAst + EpApt)';
    if(o.ex<0){ o.den2=2*(Q.Es*Q.Ast+Q.Ep*Q.Apt+Q.Ec*Q.Act); o.ex=o.num/o.den2; o.denUsed='2(EsAst + EpApt + EcAct)'; }
    o.ex=Math.max(-0.2e-3,Math.min(3e-3,o.ex));
    o.th=29+7000*o.ex; var ct=1/Math.tan(o.th*Math.PI/180); o.cot=ct;
    o.AsvMin=0.08*Math.sqrt(Q.fc)*Q.bv/Q.fsyf;                               // mm2/mm
    o.Asv=Q.AsvS+2*Q.AswS;                                                   // all vertical legs (shear-only set + closed-tie legs in both webs)
    o.minV=o.Asv>=o.AsvMin; o.kdg=Math.max(0.8,32/(16+Q.dg));
    o.kv=0.4/(1+1500*o.ex)*(o.minV?1:1300/(1000+o.kdg*Q.dv));
    /* transverse steel is shared: the closed-tie legs needed for torsion are not available for shear (shear + torsion steel additive) */
    o.AswReq=(T>0&&Q.Ao>0&&ct>0)?T/(phi*Q.fsyf*2*Q.Ao*ct):0; o.AsvNet=Q.AsvS+2*Math.max(0,Q.AswS-o.AswReq);
    o.Vuc=o.kv*Q.bv*Q.dv*sf; o.Vus=o.AsvNet*Q.fsyf*Q.dv*ct; o.Vumax=0.55*Q.fc*Q.bv*Q.dv*ct/(1+ct*ct);
    o.Tus=Q.AswS*Q.fsyf*2*Q.Ao*ct; o.AswMin=0.2*Q.y1/Q.fsyf; o.minT=Q.AswS>=o.AswMin;
    o.Tcr=0.33*Math.sqrt(Q.fc)*Q.Acp*Q.Acp/Q.uc;
    /* longitudinal reinforcement (tension side): force demand vs capacity */
    o.Ftd=M/(0.8*Q.dv)+0.5*N/phi+ct*Math.sqrt(Math.pow(Math.max(V/phi-Q.Pv-0.5*o.Vus,0),2)+Math.pow(0.45*Q.uh*T/(2*Q.Ao*phi),2));
    o.Ftp=Q.Ast*Q.fsy+(Q.Fpt!==undefined?Q.Fpt:Q.Apt*Q.fpb);   /* tendon force capacity at this station (transmission / development limited) */
    o.uCr=o.Veff/(phi*o.Vumax); o.uV=o.Veff/(phi*(o.Vuc+o.Vus)); o.uT=Q.AswS>0?T/(phi*o.Tus):(T>0?Infinity:0); o.uL=o.Ftd/o.Ftp;
    o.u=Math.max(o.uCr,o.uV,o.uT,o.uL); o.phi=phi; return o;
  }
  /* V-M interaction for fixed T, N: capacity phiVu(M) found by bisection on V where the governing shear utilisation = 1 */
  function vm(Q, L, Mmax){
    var out=[]; for(var i=0;i<=40;i++){ var Mi=Mmax*i/40, lo=0, hi=1e5;
      for(var k=0;k<60;k++){ var v=(lo+hi)/2, o=shear(Q,{V:v,T:L.T,M:Mi,N:L.N}), u=Math.max(o.uCr,o.uV,o.uL); if(u<1) lo=v; else hi=v; }
      out.push({M:Mi, V:lo}); }
    return out;
  }
  return {at:at, muAtN:muAtN, nm:nm, shear:shear, vm:vm, depth:depth, phiB:phiB};
})();
if(typeof module!=='undefined') module.exports=DSG2;
