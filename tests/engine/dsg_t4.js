const D=require('../../src/dsg_engine.js'); const {S}=require('./dsg_test.js');
S.tend.forEach(t=>{ t.pre=t.spe/t.E; t.epe=t.pre; });
const u=D.ulsBend(S,{}); console.log('code gamma: dn',u.dn.toFixed(1),'kuo',u.kuo.toFixed(4),'Mu',u.Mu.toFixed(0),'phiMu',u.phiMu.toFixed(0),'tendons',u.det.filter(d=>d.t==='tend').map(d=>d.s.toFixed(1)).join('/'));
console.log('target    : dn 240.9 kuo 0.1019 Mu 68979 phiMu 55183 tendons 1759.6..1763.7');
// Mcr and Muo,min = 1.2 Mcr (cracking with f'ct.f = 0.6 sqrt(f'c) of the beam concrete at the bottom fibre)
const yr=D.elastic(S,37400).yc, H=2400, fctf=0.6*Math.sqrt(65);
let lo=0,hi=2e5; for(let i=0;i<70;i++){ const m=(lo+hi)/2, s=D.solveSLS(S,0,m*1e6,yr,false), sb=S.conc[S.conc.length-1].E*(s.e0+s.k*H); if(sb<fctf) lo=m; else hi=m; }
console.log('Mcr',lo.toFixed(0),'kNm, 1.2 Mcr',(1.2*lo).toFixed(0),' | target Muo.min 40802');
