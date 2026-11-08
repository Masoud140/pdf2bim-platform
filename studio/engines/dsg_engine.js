/* ===== AS 5100.5:2017 section engine: composite prestressed section, fibre (strip) discretisation =====
   Units: N, mm, MPa. y measured DOWN from the top of the section. Sagging moment +, axial tension +.
   Concrete: list of strips {y, h, b, E, fc, e0 (locked-in strain, + = tension), grp}
   Bars:     {y, A, E, fsy, e0}       Tendons: {y, A, E, fpb, eu, spe (effective prestress), grp}            */
var DSG = (function(){
  /* --- build strips from trapezoid layers {h, b1, b2, v1, v2, E, fc, grp} (v = void widths) --- */
  function stripsFromLayers(layers, dz){
    var out=[], y0=0; dz=dz||5;
    layers.forEach(function(L){ var n=Math.max(1,Math.ceil(L.h/dz)), d=L.h/n;
      for(var i=0;i<n;i++){ var t=(i+0.5)/n, b=(L.b1+(L.b2-L.b1)*t)-((L.v1||0)+((L.v2||0)-(L.v1||0))*t);
        if(b>0) out.push({y:y0+(i+0.5)*d, h:d, b:b, E:L.E, fc:L.fc, e0:L.e0||0, grp:L.grp||''}); }
      y0+=L.h; });
    return out;
  }
  /* --- strips from a closed polygon [[x,y]] (y up from soffit) placed with its top at yTop (down-positive) --- */
  function stripsFromPolygon(P, H, yTop, E, fc, grp, dz){
    var out=[]; dz=dz||5; var n=Math.ceil(H/dz), d=H/n;
    for(var i=0;i<n;i++){ var yu=H-(i+0.5)*d, xs=[];                         // y above soffit at strip mid
      for(var k=0;k<P.length;k++){ var a=P[k], b=P[(k+1)%P.length];
        if((a[1]<=yu&&b[1]>yu)||(b[1]<=yu&&a[1]>yu)) xs.push(a[0]+(b[0]-a[0])*(yu-a[1])/(b[1]-a[1])); }
      xs.sort(function(p,q){ return p-q; }); var w=0; for(var j=0;j+1<xs.length;j+=2) w+=xs[j+1]-xs[j];
      if(w>0) out.push({y:yTop+(i+0.5)*d, h:d, b:w, E:E, fc:fc, e0:0, grp:grp}); }
    return out;
  }
  function a2(fc){ return Math.max(0.67, Math.min(0.85, 0.85-0.0015*fc)); }
  function gam(fc){ return Math.max(0.67, Math.min(0.85, 0.97-0.0025*fc)); }
  /* strand stress-strain (Mattock / modified Ramberg-Osgood; PCI form for low-relaxation strand) */
  function fpMattock(T,e){ var s=Math.abs(e), A=0.025, B=118, C=10;
    var f=T.bil?T.E*s:T.E*s*(A+(1-A)/Math.pow(1+Math.pow(B*s,C),1/C)); f=Math.min(f,T.fpb); return e<0?-f:f; }   /* T.bil: elastic-plastic, capped at the code tendon stress */
  /* ---------- elastic, uncracked, transformed (ref E = Eref) ---------- */
  function elastic(S, Eref){
    var A=0, Sy=0, I=0; S.conc.forEach(function(c){ var n=c.E/Eref, a=c.b*c.h*n; A+=a; Sy+=a*c.y; I+=a*c.y*c.y+n*c.b*c.h*c.h*c.h/12; });
    (S.bars||[]).concat(S.tend||[]).forEach(function(s){ var n=s.E/Eref-(conAt(S,s.y)?conAt(S,s.y).E/Eref:0), a=s.A*n; A+=a; Sy+=a*s.y; I+=a*s.y*s.y; });
    var yc=Sy/A; return {A:A, yc:yc, I:I-A*yc*yc, Eref:Eref};
  }
  function conAt(S,y){ for(var i=0;i<S.conc.length;i++){ var c=S.conc[i]; if(Math.abs(c.y-y)<=c.h/2) return c; } return null; }
  /* ---------- generic section response for strain plane e(y) = e0 + k*y (k>0: sagging, tension at bottom) ----------
     mode 'sls': linear elastic concrete, no tension (cracked) or with tension (uncracked); steel linear
     returns N (tension +) and M (sagging +, about the top fibre then shifted)                      */
  /* index of the concrete strip holding each bar / tendon (cached on S; indices survive JSON cloning) */
  function steelStrips(S){ if(S._ci&&S._ci.n===S.conc.length) return S._ci; var f=function(y){ for(var i=0;i<S.conc.length;i++){ var c=S.conc[i]; if(Math.abs(c.y-y)<=c.h/2) return i; } return -1; };
    S._ci={n:S.conc.length, b:(S.bars||[]).map(function(b){ return f(b.y); }), t:(S.tend||[]).map(function(t){ return f(t.y); })}; return S._ci; }
  function respSLS(S, e0, k, crack){
    var N=0, M=0, ci=steelStrips(S); S.conc.forEach(function(c){ var e=e0+k*c.y-c.e0; var s=c.E*e; if(crack && s>0) s=0; var f=s*c.b*c.h; N+=f; M+=f*c.y; });
    /* steel displaces concrete: deduct the concrete stress at the steel location over the steel area (none where the concrete is cracked in tension) */
    var disp=function(j,y,A){ if(j<0) return 0; var c=S.conc[j], sc=c.E*(e0+k*y-c.e0); return (crack&&sc>0)?0:sc*A; };
    (S.bars||[]).forEach(function(b,i){ var e=e0+k*b.y-(b.e0||0); var f=b.E*e*b.A-disp(ci.b[i],b.y,b.A); N+=f; M+=f*b.y; });
    (S.tend||[]).forEach(function(t,i){ var e=e0+k*t.y+t.pre; var f=t.E*e*t.A-disp(ci.t[i],t.y,t.A); N+=f; M+=f*t.y; });
    return {N:N, M:M};
  }
  /* solve SLS strain plane for given N (tension +) and M about the reference depth yr (sagging +) */
  function solveSLS(S, N, M, yr, crack){
    var e0=0, k=0;
    for(var it=0; it<200; it++){
      var r=respSLS(S,e0,k,crack), Mr=r.M-r.N*yr, R1=N-r.N, R2=M-Mr;
      if(Math.abs(R1)<1e-3*(1+Math.abs(N)) && Math.abs(R2)<1e-1*(1+Math.abs(M))) break;
      var h1=1e-9, h2=1e-12, a=respSLS(S,e0+h1,k,crack), b=respSLS(S,e0,k+h2,crack);
      var J11=(a.N-r.N)/h1, J12=(b.N-r.N)/h2, J21=((a.M-a.N*yr)-Mr)/h1, J22=((b.M-b.N*yr)-Mr)/h2, D=J11*J22-J12*J21;
      if(!isFinite(D)||D===0) break;
      e0+=(R1*J22-R2*J12)/D; k+=(J11*R2-J21*R1)/D;
    }
    return {e0:e0, k:k};
  }
  /* ---------- ULS: rectangular stress block (Cl 8.1.3), strain compatibility, sagging ---------- */
  function ulsBend(S, opt){
    opt=opt||{}; var ecu=0.003, top=Math.min.apply(null,S.conc.map(function(c){ return c.y-c.h/2; }));
    var fcTop=S.conc.filter(function(c){ return c.y-c.h/2<=top+1e-6; })[0].fc, g=opt.gamma||gam(fcTop);
    var dmax=Math.max.apply(null,(S.bars||[]).concat(S.tend||[]).map(function(s){ return s.y; }));
    function forces(dn){
      var C=0, Mc=0, yb=top+g*dn;
      S.conc.forEach(function(c){ var y1=c.y-c.h/2, y2=c.y+c.h/2, lo=Math.max(y1,top), hi=Math.min(y2,yb); if(hi>lo){ var f=a2(c.fc)*c.fc*c.b*(hi-lo); C+=f; Mc+=f*(lo+hi)/2; } });
      var T=0, Mt=0, det=[];
      (S.bars||[]).forEach(function(b){ if(opt.noComp && b.y<dn) return; var e=ecu*(b.y-top-dn)/dn; var s=Math.max(-b.fsy,Math.min(b.fsy,b.E*e));
        var inBlock=(b.y<yb)? a2(conAt(S,b.y)?conAt(S,b.y).fc:50)*(conAt(S,b.y)?conAt(S,b.y).fc:50) : 0;   // remove displaced concrete
        var f=(s+ (s<0?inBlock:0))*b.A; T+=f; Mt+=f*b.y; det.push({t:'bar',y:b.y,s:s}); });
      (S.tend||[]).forEach(function(t){ var e=t.epe+ecu*(t.y-top-dn)/dn; var s=fpMattock(t,e); var f=s*t.A; T+=f; Mt+=f*t.y; det.push({t:'tend',y:t.y,s:s,e:e}); });
      return {N:T-C, M:Mt-Mc, C:C, T:T, det:det};
    }
    var lo=1, hi=S.conc.reduce(function(m,c){ return Math.max(m,c.y+c.h/2); },0);
    for(var i=0;i<100;i++){ var mid=(lo+hi)/2, f=forces(mid); if(f.N>0) lo=mid; else hi=mid; }
    var dn=(lo+hi)/2, F=forces(dn), kuo=dn/dmax, Mu=F.M/1e6;     // N*mm -> kN m
    var phi=Math.max(0.6,Math.min(0.8,1.19-13*kuo/12));
    return {dn:dn, kuo:kuo, Mu:Mu, phi:phi, phiMu:phi*Mu, det:F.det, gamma:g, C:F.C};
  }
  return {stripsFromLayers:stripsFromLayers, stripsFromPolygon:stripsFromPolygon, elastic:elastic, respSLS:respSLS, solveSLS:solveSLS, ulsBend:ulsBend, a2:a2, gam:gam, fp:fpMattock, conAt:conAt};
})();
if(typeof module!=='undefined') module.exports=DSG;
