const D=require('../../src/dsg_engine.js'); const {S}=require('./dsg_test.js');
S.tend.forEach(t=>t.epe=t.pre);
for (const g of [0.845,0.8075,0.775,0.70]) { const u=D.ulsBend(S,{gamma:g}); console.log('gamma',g,'dn',u.dn.toFixed(2),'kuo',u.kuo.toFixed(5),'Mu',u.Mu.toFixed(1),'tendon',u.det.filter(d=>d.t==='tend').map(d=>d.s.toFixed(1)).join('/')); }
console.log('target   dn 240.90 kuo 0.10190 Mu 68978.9 ; DH73/74 = 1759.56 / 1763.72');
