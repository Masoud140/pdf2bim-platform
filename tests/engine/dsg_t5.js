global.DSG=require('../../src/dsg_engine.js'); const D2=require('../../src/dsg_engine2.js'); const {S}=require('./dsg_test.js');
S.tend.forEach(t=>{ t.pre=t.spe/t.E; t.epe=t.pre; });
const yr=DSG.elastic(S,37400).yc, H=2400;
// ULS at N=0 via general solver vs ulsBend
const r=D2.muAtN(S,0,'top',yr); console.log('general ULS N=0: dn',r.dn.toFixed(1),'Mu',(r.M/1e6).toFixed(0),' (ulsBend gave 220.7 / 68886)');
const h=D2.muAtN(S,0,'bot',yr); console.log('hogging Mu',(h.M/1e6).toFixed(0),'dn',h.dn.toFixed(0));
// shear section data
const half=H/2, tb=S.bars.filter(b=>b.y>half), tt=S.tend.filter(t=>t.y>half);
const Ast=tb.reduce((a,b)=>a+b.A,0), Apt=tt.reduce((a,t)=>a+t.A,0), spo=tt.reduce((a,t)=>a+t.A*t.E*t.pre,0)/Apt;
const Act=S.conc.filter(c=>c.y>half).reduce((a,c)=>a+c.b*c.h,0);
const dres=(tb.reduce((a,b)=>a+b.A*b.fsy*b.y,0)+tt.reduce((a,t)=>a+t.A*t.fpb*t.y,0))/(tb.reduce((a,b)=>a+b.A*b.fsy,0)+tt.reduce((a,t)=>a+t.A*t.fpb,0));
const dv=Math.max(0.72*H,0.9*dres);
const Q={bv:300,dv,fc:65,Ec:37400,Es:200000,Ep:195000,Ast,Apt,spo,Act,fsyf:500,fsy:500,fpb:1830,AsvS:4.18879,AswS:2.0944,dg:14,Pv:0,uh:7209.897718930369,Ao:3207883.9044027044,Aoh:3550460.6884652185,Acp:3972772.9379466055,uc:8133.662452360231,y1:2292};
console.log('d (tension resultant)',dres.toFixed(1),'dv',dv.toFixed(1),'Ast',Ast.toFixed(0),'Apt',Apt,'spo',spo.toFixed(1),'Act',Act.toFixed(0));
const o=D2.shear(Q,{V:4000,T:1400,M:40,N:0});
const f=(x,d=1)=>x.toFixed(d);
console.log('ex',o.ex.toExponential(4),'theta',f(o.th,2),'kv',f(o.kv,4),'phiVuc',f(0.7*o.Vuc/1e3),'phiVus',f(0.7*o.Vus/1e3),'phiVumax',f(0.7*o.Vumax/1e3),'phiTus',f(0.7*o.Tus/1e6),'phiTcr',f(0.7*o.Tcr/1e6),'AsvMin/s',f(o.AsvMin*1000),'AswMin/s',f(o.AswMin*1000));
console.log('util crush',f(o.uCr,3),'shear',f(o.uV,3),'tors',f(o.uT,3),'long',f(o.uL,3));
console.log('target: dv 2124.5 ex -1.6152e-4 theta 27.87 kv 0.5279 phiVuc 1884.2 phiVus 10853.3 phiVumax 5931.9 phiTus(at loads) 1400 phiTcr 3332.3 AsvMin 387.0 AswMin 916.8 | util crush 0.705 shear 0.388 tors 0.245 long 0.993');
