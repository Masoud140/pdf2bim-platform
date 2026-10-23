const D=require('../../src/dsg_engine.js');
const L=[{h:200,b1:4020,b2:4020,E:34800,fc:50},{h:35,b1:4020,b2:4020,v1:1410,v2:1410,E:37400,fc:65},{h:55,b1:4020,b2:4020,v1:1310,v2:1299.2144056989364,E:37400,fc:65},
 {h:75,b1:2019.0669891393554,b2:1819.0669891393554,v1:1299.2144056989364,v2:1284.506777106577,E:37400,fc:65},{h:1667,b1:1819.0669891393554,b2:1492.1654309598443,v1:1284.506777106577,v2:957.6052189270657,E:37400,fc:65},
 {h:58,b1:1492.1654309598443,b2:1480.7915315150863,v1:957.6052189270657,v2:0,E:37400,fc:65},{h:310,b1:1480.7915315150863,b2:1420,E:37400,fc:65}];
const bars=[[28,16,27],[137,16,27],[255,20,2],[1432,12,2],[1632,12,2],[1832,12,2],[2032,24,2],[2092,28,2],[2364,32,2]].map(r=>({y:r[0],A:Math.PI/4*r[1]*r[1]*r[2],E:200000,fsy:500}));
const tend=[[2130,18,909],[2180,26,907],[2230,26,904],[2280,26,902],[2230,24,900]].map(r=>({y:r[0],A:143*r[1],E:195000,fpb:1830,eu:0.06,spe:r[2],pre:r[2]/195000}));
const S={conc:D.stripsFromLayers(L,2),bars,tend};
for(const Er of [34800,37400]){ const e=D.elastic(S,Er); console.log('Eref',Er,'A',e.A.toFixed(0),'yc',e.yc.toFixed(2),'I',e.I.toExponential(5)); }
console.log('target   A 2769809  yc 961.59  I 2.63408e13');
// prestress state: adjust tendon prestrain so stress = spe with no external load (uncracked)
const yr=D.elastic(S,37400).yc;
for(let it=0;it<6;it++){ const s=D.solveSLS(S,0,0,yr,false); S.tend.forEach(t=>{ const ec=s.e0+s.k*t.y; t.pre=t.spe/t.E-ec; }); }
let s0=D.solveSLS(S,0,0,yr,false); console.log('check tendon stress at zero load', S.tend.map(t=>(t.E*(s0.e0+s0.k*t.y+t.pre)).toFixed(1)).join(' '));
// SLS stresses at M=15000 kNm (uncracked)
const st=(M,crack)=>{ const s=D.solveSLS(S,0,M*1e6,yr,crack); const top=S.conc[0], bot=S.conc[S.conc.length-1]; const H=2400;
  return {top:(top.E*(s.e0+s.k*0)), bot:(bot.E*(s.e0+s.k*H)), s}; };
let r=st(15000,false); console.log('M=15000 uncracked: top',r.top.toFixed(3),'bot',r.bot.toFixed(3),' target -3.709 / -8.915');
r=st(15000,true); console.log('M=15000 cracked-solver: top',r.top.toFixed(3),'bot',r.bot.toFixed(3));
// ULS
S.tend.forEach(t=>t.epe=t.pre);
const u=D.ulsBend(S,{}); console.log('ULS dn',u.dn.toFixed(1),'kuo',u.kuo.toFixed(4),'Mu',u.Mu.toFixed(0),'phi',u.phi,'phiMu',u.phiMu.toFixed(0),'gamma',u.gamma,' target dn 240.9 kuo 0.10190 Mu 68979 phiMu 55183');
const tp=u.det.filter(d=>d.t==='tend').map(d=>d.s.toFixed(0)+'@'+d.e.toFixed(4)); console.log('tendon stresses',tp.join(' '));
module.exports={S,yr};
