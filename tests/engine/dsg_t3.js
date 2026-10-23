const D=require('../../src/dsg_engine.js'); const {S,yr}=require('./dsg_test.js');
S.tend.forEach(t=>{ t.pre=t.spe/t.E; });                       // input = stress before elastic shortening
const H=2400, run=(M,crack)=>{ const s=D.solveSLS(S,0,M*1e6,yr,crack); const c0=S.conc[0], c1=S.conc[S.conc.length-1];
  return {top:c0.E*(s.e0), bot:c1.E*(s.e0+s.k*H), tend:S.tend.map(t=>t.E*(s.e0+s.k*t.y+t.pre)), bars:S.bars.map(b=>b.E*(s.e0+s.k*b.y)), s}; };
let r=run(15000,false); console.log('M=15000: top',r.top.toFixed(3),'bot',r.bot.toFixed(3),'tendons',r.tend.map(v=>v.toFixed(1)).join('/'),'| target top -3.709 bot -8.915 tendons 865.4..856.8');
r=run(0,false); console.log('M=0    : top',r.top.toFixed(3),'bot',r.bot.toFixed(3),'tendons',r.tend.map(v=>v.toFixed(1)).join('/'));
// decompression moment and steel stress increment to the cracked state: allowable M with dsig <= 200
function state(M){ return run(M,true); }
let s0=run(0,false); let lo=0,hi=1e5; for(let i=0;i<60;i++){ const m=(lo+hi)/2, q=run(m,false); if(q.bot<0) lo=m; else hi=m; } const Mdec=lo;
const base=run(Mdec,false);
function incr(M){ const q=state(M); const db=Math.max(...q.bars.map((v,i)=>S.bars[i].y>yr? v-base.bars[i]:-1e9)), dt=Math.max(...q.tend.map((v,i)=>v-base.tend[i])); return {db,dt}; }
lo=Mdec; hi=1e5; for(let i=0;i<60;i++){ const m=(lo+hi)/2, q=incr(m); if(Math.max(q.db,q.dt)<200) lo=m; else hi=m; }
const q=incr(lo); console.log('Mdec',Mdec.toFixed(0),'kNm; allowable Ms',lo.toFixed(0),'(bar incr',q.db.toFixed(1),', tendon incr',q.dt.toFixed(1),') | target Ms 39590.6 (bar 200.0, tendon 186.3), dna 823.2');
const qq=state(lo); console.log('neutral axis at Ms (cracked):', (-qq.s.e0/qq.s.k).toFixed(1),'mm');
