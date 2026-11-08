/* Prestress losses, camber / hog and transfer stresses along a pretensioned girder (AS 5100.5:2017).
   Extracted verbatim from the platform's original grillage dashboard (base v15); verified in tests/test_engines.js. */
var HOG=(function(){
const T312=[[20,22,24000],[25,28,26700],[32,35,30100],[40,43,32800],[50,53,34800],[65,68,37400],[80,82,39600],[100,99,42200]];
const t312=fc=>{const T=T312;if(fc<=T[0][0])return{fcmi:T[0][1],E:T[0][2]};for(let i=1;i<T.length;i++)if(fc<=T[i][0]){const r=(fc-T[i-1][0])/(T[i][0]-T[i-1][0]);return{fcmi:T[i-1][1]+r*(T[i][1]-T[i-1][1]),E:T[i-1][2]+r*(T[i][2]-T[i-1][2])}}return{fcmi:T[T.length-1][1],E:T[T.length-1][2]}};
const STR={9.3:[52,94],9.5:[55,102],11.1:[74,139],12.7:[98.6,184],15.2:[140,250],15.7:[150,279],17.8:[189,355]};
const CCB=[[20,5.2],[25,4.2],[32,3.4],[40,2.8],[50,2.4],[65,2],[80,1.7],[100,1.5]];
const interp=(t,x)=>{if(x<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(x<=t[i][0])return t[i-1][1]+(t[i][1]-t[i-1][1])*(x-t[i-1][0])/(t[i][0]-t[i-1][0]);return t[t.length-1][1]};
function shrink(age,p){// AS 5100.5:2017 (A1) cl. 3.1.7.2. Autogenous time from setting (taken as concrete age), drying time from start of drying.
 const tAuto=Math.max(age,0),tDry=Math.max(age-p.ts,0),th=2*p.A/p.ue;
 const fse=(p.fc<=50?0.07*p.fc-0.5:0.08*p.fc-1)*50e-6,ecse=fse*(1-Math.exp(-0.07*tAuto)); // Eq 3.1.7.2(2),(3) – verified against supplied clause
 const a1=0.8+1.2*Math.exp(-0.005*th),k1=a1*Math.pow(tDry,.8)/(Math.pow(tDry,.8)+0.15*th),ecsdb=(0.9-0.005*p.fc)*p.eb*1e-6,ecsd=k1*p.k4*ecsdb; // Eq 3.1.7.2(4),(5), Fig 3.1.7.2 – verified; reproduces Table 3.1.7.2 within ±5 µε
 return{v:ecse+ecsd,t:tDry,tAuto,tDry,th,fse,ecse,a1,k1,ecsdb,ecsd}}
function relaxD(p,td){const j=p.jt+td,k6=Math.log10(5.4*Math.pow(j,1/6));return{j,k6,k7:p.k7,k8:p.k8,Rb:p.Rb,R:k6*p.k7*p.k8*p.Rb}} // cl. 3.3.4.3: R = k6·k7·k8·Rb, j = days after prestressing
function relax(p,td){return relaxD(p,td).R}
function creep(age,p){const t=Math.max(age-p.tau,0),th=2*p.A/p.ue,a2=1+1.12*Math.exp(-0.008*th),k2=a2*Math.pow(t,.8)/(Math.pow(t,.8)+0.15*th);
 const k3=2.7/(1+Math.log10(p.tau+(p.k3s||0))),a3=0.7/(p.k4*a2),k5=p.fc<=50?1:(2-a3)-0.02*(1-a3)*p.fc,pb=interp(CCB,p.fc);
 return{v:k2*k3*p.k4*k5*pb,t,a2,k2,k3,a3,k5,pb,tauT:p.tau+(p.k3s||0)}} // Eq 3.1.8.3 without k9; k9 (nonlinear creep) applied in run() to creep loaded at transfer
// girder drying perimeter changes at the deck pour: increments after the pour use ueC (continuous strain history)
function shG(age,p){const ap=p.tau+p.pour;if(!p.uesw||!p.fl.dk||age<=ap)return shrink(age,p).v;const q={...p,ue:p.ueC};return shrink(ap,p).v+shrink(age,q).v-shrink(ap,q).v}
function phG(age,p){const ap=p.tau+p.pour,q={...p,ue:p.ueC};if(!p.uesw||!p.fl.dk||age<=ap)return creep(age,p).v;if(p.tau>=ap)return creep(age,q).v;return creep(ap,p).v+creep(age,q).v-creep(ap,q).v}
const k9f=(so,fcmi)=>so>0.45*fcmi?Math.exp(1.5*(so/fcmi-0.45)):1; // cl. 3.1.8.3
// Gross concrete section for all stress and curvature. Steel restraint is carried once, through the strand-force losses;
// a transformed section on top of the after-loss force would count the steel stiffness twice (hog wrongly falls with time).
const gsec=p=>({A:p.A,y:p.yb,I:p.I});
function run(p){const N=100,xa=p.a,xb=p.L-p.a;
 const set=new Set([0,p.L,xa,xb,p.L/2]);for(let i=0;i<=N;i++)set.add(p.L*i/N);p.sl.forEach(s=>{const l=p.lt*p.db;[s.d,s.d+l,p.L-s.d2,p.L-s.d2-l].forEach(v=>set.add(v))});
 const X=[...set].filter(x=>x>=0&&x<=p.L).sort((a,b)=>a-b),lt=p.lt*p.db,Ai=p.Ap,P0=p.ji*p.mbl*(1-p.rel);
 const Mb=(w,x,sa)=>{const l=sa,r=p.L-sa;if(x<l)return-w*(l-x)**2/2e6;if(x>r)return-w*(x-r)**2/2e6;return(w*(x-l)*(r-x)-w*sa*sa)/2e6}; // span moment includes the overhang (cantilever) moment −w·a²/2
 const Msw=x=>Mb(p.rho*p.A/1e6,x,xa),Mw=(w,x)=>Mb(w,x,xa),sas=isFinite(p.asup)?p.asup:xa;
 const st=X.map(x=>{const f=p.sl.map(s=>Math.min(Math.max(x-s.d,0),lt)/lt*Math.min(Math.max(p.L-x-s.d2,0),lt)/lt);const w=f.map(v=>v*Ai),P=f.map(v=>v*P0),M=Msw(x);let Pr=P.slice(),s0;
  for(let it=0;it<40;it++){s0=gsec(p);const T=Pr.reduce((a,b)=>a+b,0),Mn=M-Pr.reduce((a,b,i)=>a+b*(s0.y-p.sy[i]),0)/1e3;
   Pr=P.map((v,i)=>w[i]?v-w[i]*p.Ep/p.Ect*(T*1e3/s0.A+Mn*1e6*(p.sy[i]-s0.y)/s0.I)/1e3:0)}
  const T=Pr.reduce((a,b)=>a+b,0),Mn=M-Pr.reduce((a,b,i)=>a+b*(s0.y-p.sy[i]),0)/1e3;
  return{x,w,Pr,M,Mst:Mb(p.rho*p.A/1e6,x,sas),Md:Mw(p.wd,x),Ms:Mw(p.sidl,x),s0,Mn,T,Ti:P.reduce((a,b)=>a+b,0),top:T*1e3/s0.A+Mn*1e6*(p.H-s0.y)/s0.I,bot:T*1e3/s0.A-Mn*1e6*s0.y/s0.I}});
 const mi=X.indexOf(p.L/2),ia=X.indexOf(xa),ib=X.indexOf(xb);
 const defl=kap=>{let th=0,d=0;const D=[0];for(let i=1;i<X.length;i++){const h=X[i]-X[i-1],th1=th+(kap[i]+kap[i-1])/2*h;d+=(th+th1)/2*h;th=th1;D.push(d)}return D.map((v,i)=>v-D[ia]-(D[ib]-D[ia])*(X[i]-xa)/(xb-xa))};
 if(p.meth)return runDet(p,{X,st,mi,defl,P0});
 const m0=st[mi],res=[{label:'Transfer',t:0,phi:0,hog:defl(st.map(s=>s.Mn*1e6/(p.Ect*s.s0.I))),mid:{T:m0.T,M:m0.Mn,A:m0.s0.A,y:m0.s0.y,I:m0.s0.I,Ee:p.Ect,kap:m0.Mn*1e6/(p.Ect*m0.s0.I)*1e6,Ti:m0.Ti}}];
 let prev=st.map(s=>({P:s.Pr.slice(),s:s.s0})),eS=0,ph0=0,rP=relax(p,0),sciMax=0;const sh0=shrink(p.tau,p),es0=p.fl.sh*sh0.v,R0=relax(p,0);eS=es0;
 let sigo=0;st.forEach(s=>{const W=s.w.reduce((a,b)=>a+b,0);if(W){const y=s.w.reduce((a,b,i)=>a+b*p.sy[i],0)/W;sigo=Math.max(sigo,s.T*1e3/p.A+s.Mn*1e6*(y-p.yb)/p.I)}});const k9=k9f(sigo,p.fcmi); // σo = max sustained stress at tendon centroid at transfer
 // ---- Staged time loop: A transfer | B bare girder | C wet deck on bare girder | D composite (girder + deck) ----
 const cp=!!(p.deck&&p.fl.dk),tcR=cp?p.pour+p.dhard:Infinity,Ig=p.I,Ag=p.A,yb=p.yb;
 const Adk=cp?p.beff*p.dth:0,ydk=cp?p.H+p.dgap+p.dth/2:0,Idk=cp?p.beff*p.dth**3/12:0,pd=cp?{...p,A:Adk,ue:p.ued,fc:p.fcd,ts:p.tsd,tau:p.dhard}:null;
 // composite section solve (moments about soffit, tension +): free strain a (axial at component centroid) and b (strain gradient) per component
 const solve=(Eg,Ed,N,M0,ag,bg,ad)=>{const K11=Eg*Ag+Ed*Adk,K12=Eg*Ag*yb+Ed*Adk*ydk,K22=Eg*(Ig+Ag*yb*yb)+Ed*(Idk+Adk*ydk*ydk),R1=N+Eg*ag*Ag+Ed*ad*Adk,R2=M0+Eg*(ag*Ag*yb+bg*Ig)+Ed*ad*Adk*ydk,D=K11*K22-K12*K12;return{e0:(R1*K22-R2*K12)/D,psi:(K11*R2-K12*R1)/D}};
 const C={};let tP=0;
 p.times.forEach(td=>{const age=p.tau+td,sh=shrink(age,p),cr=creep(age,p),es=p.fl.sh*shG(age,p),ph=p.fl.cr*phG(age,p)*k9,dk=cp&&td>=p.pour?1:0,sk=cp&&td>=p.sidlA?1:0,comp=cp&&td>tcR,
  phd=dk?p.fl.cr*phG(age,{...p,tau:p.tau+p.pour}):0,phs=sk?p.fl.cr*phG(age,{...p,tau:p.tau+p.sidlA}):0,rx=relax(p,td),dR=(rx-rP)*p.fl.rl*p.rlx,dRc=Math.max(rx-R0,0)*p.fl.rl*p.rlx,dEs=es-eS,dPh=ph-ph0,dkL=cp&&tP>=p.pour?1:0,kap=[],da_=td-p.pour,KC={creep:[],shG:[],shD:[],loss:[],sidl:[],base:[]};let mid;
  // composite-stage scalars (same at every station)
  let Z=null;if(comp){const phgc=p.fl.cr*phG(age,{...p,tau:p.tau+tcR}),phdk=p.fl.cr*creep(da_,pd).v,shd=p.fl.sh*shrink(da_,pd).v/(1+15*(p.rd||0));
   Z={dph:ph-C.ph,dphp:phd-C.phd,dsg:es-C.es,dsd:shd-C.shd,phgc,phdk,Eg:1/(1/p.Ecp+p.chi*phgc/p.Ec),Ed:p.Ed/(1+p.chi*phdk),shd};
   if(sk){const pgs=p.fl.cr*phG(age,{...p,tau:p.tau+p.sidlA}),pds=p.fl.cr*creep(da_,{...pd,tau:p.sidlA-p.pour}).v;Z.pgs=pgs;Z.pds=pds;Z.Egs=1/(1/p.Ecs+pgs/p.Ec);Z.Eds=p.Ed/(1+pds)}}
  st.forEach((s,k)=>{let lsh=0,lcr=0,lrl=0;
   // cl. 3.4.3.3: σci at the tendon centroid from the initial force (after elastic shortening, before time-dependent losses) + sustained loads, each creeping from its own load age
   const Wb=s.w.reduce((a,b)=>a+b,0),yg=Wb?s.w.reduce((a,b,i)=>a+b*p.sy[i],0)/Wb:yb,sc0=s.T*1e3/Ag+s.Mn*1e6*(yg-yb)/Ig,scd=dk*s.Md*1e6*(yg-yb)/Ig,scs=sk&&p.Ic?s.Ms*1e6*(yg-p.yc)/p.Ic:0;
   if(Wb)sciMax=Math.max(sciMax,sc0,sc0+scd,sc0+scd+scs);
   const ecc=0.8*(sc0*ph+scd*phd+scs*phs)/p.Ec,dsh=es-es0;
   const P2=s.Pr.map((v,i)=>{if(!s.w[i])return 0;const a=s.w[i]*p.Ep*dsh/(1+15*p.rb)/1e3,b=s.w[i]*p.Ep*ecc/1e3,cs=a+b,c=v*dRc/100*Math.max(0,1-cs/v);lsh+=a;lcr+=b;lrl+=c;return Math.max(v-cs-c,0)}); // cl. 3.4.3.2–3.4.3.4, cumulative from transfer
   const s2=gsec(p),T2=P2.reduce((a,b)=>a+b,0),M2=s.M+dk*s.Md-P2.reduce((a,b,i)=>a+b*(s2.y-p.sy[i]),0)/1e3,Mp=M2-dk*s.Md,N0=-s.T,Np=-T2;let kk,X_={};
   if(!comp){// stages A–C: bare girder, AAEM; wet deck sustained on bare girder from the pour
    kk=(s.Mn*(1/p.Ect+ph/p.Ec)+(Mp-s.Mn)*(1/p.Ect+p.chi*ph/p.Ec))*1e6/Ig+(dk?s.Md*(1/p.Ecp+phd/p.Ec)*1e6/Ig:0); // elastic at load-age modulus, creep strain φ·σ/Ec
    if(cp&&td===tcR)C[k]={Mp,Np,P:P2.slice(),kc:kk}}
   else{// stage D: increments since hardening on the composite section (AAEM over tc → t)
    const c=C[k],ag=(N0+(c.Np-N0)*p.chi)*Z.dph*1e3/(p.Ec*Ag)-Z.dsg,ksf=((s.Mn+(c.Mp-s.Mn)*p.chi)*Z.dph+s.Md*Z.dphp)*1e6/(p.Ec*Ig),ad=-Z.dsd;
    const dP=P2.map((v,i)=>v-c.P[i]),N=-dP.reduce((a,b)=>a+b,0)*1e3,M0=-dP.reduce((a,b,i)=>a+b*p.sy[i],0)*1e3;
    const r1=solve(Z.Eg,Z.Ed,N,M0,ag,-ksf,ad),dks=-r1.psi;let ks=0;if(sk)ks=-solve(Z.Egs,Z.Eds,0,-s.Ms*1e6,0,0,0).psi;
    // component split at this station (for reporting): restraint of girder creep, girder shrinkage, deck shrinkage, losses after hardening
    const one=(N_,M_,a1,b1,a2)=>-solve(Z.Eg,Z.Ed,N_,M_,a1,b1,a2).psi;X_={kc:c.kc,ksf,ag,ad,dkCreep:one(0,0,ag+Z.dsg,-ksf,0),dkShG:one(0,0,-Z.dsg,0,0),dkShD:one(0,0,0,0,ad),dkLoss:one(N,M0,0,0,0),dks,ks};
    KC.base.push(c.kc);KC.creep.push(X_.dkCreep);KC.shG.push(X_.dkShG);KC.shD.push(X_.dkShD);KC.loss.push(X_.dkLoss);KC.sidl.push(ks);
    kk=c.kc+dks+ks}
   kap.push(kk);prev[k]={P:P2,s:s2};
   if(k===mi)mid={T:T2,M:M2,M0:s.Mn,Mp,A:s2.A,y:s2.y,I:s2.I,c1:1/p.Ect+ph/p.Ec,c2:1/p.Ect+p.chi*ph/p.Ec,kap:kk*1e6,lsh,lcr,lrl,Md:dk*s.Md,Ms:sk*s.Ms,phd,phs,comp,X:X_,yg,sc0,scd,scs,ecc,dsh,Pr:s.T}});
  if(cp&&td===tcR){C.ph=ph;C.phd=phd;C.es=es;C.shd=p.fl.sh*shrink(p.dhard,pd).v/(1+15*(p.rd||0))}
  res.push({label:td+' d',t:td,phi:ph,eps:es,hog:defl(kap),dc:comp?Object.fromEntries(Object.entries(KC).map(([k,v])=>[k,defl(v)[mi]])):null,sh,cr,dEs,dPh,mid,Z,Pm:prev[mi].P.slice(),rl:{...relaxD(p,td),dR,dRc}});eS=es;ph0=ph;rP=rx;tP=td});
 return{X,st,res,mi,P0,tcR,Adk,ydk,sciMax,sigo,k9,sw:defl(st.map(s=>s.M*1e6/(p.Ect*p.I)))}}
// ===== Detailed method (option C): time-step section analysis =====
// Girder (and, once composite, deck) concrete + bonded strands + bonded reinforcing bars; plane sections; equilibrium of N and M at every sub-step.
// Concrete strain: ε(y,t) = Σj J(t,tj)·Δσj(y) + εcs(t);  J(t,tj) = 1/E(tj) + φcc(t,tj)/Ec  (creep strain φ·σ/Ec as in Eq. 3.4.3.3; φcc per cl. 3.1.8.3, k9 on the transfer increment).
// Strands: F = F0 + Ep·Ap·Δε(y) − relaxation (R per cl. 3.3.4.3, reduced by (1 − loss_cs/σpi) per Eq. 3.4.3.4).  Bars: F = Es·As·Δε(y).
// Each stress increment is applied at the end of its sub-step (backward scheme); sub-steps are geometric (ratio 1.15) so the error is small.
function runDet(p,C){const {X,st,mi,defl,P0}=C,N=X.length,cp=!!(p.deck&&p.fl.dk),tcR=cp?p.pour+p.dhard:Infinity;
 // net concrete section: every strand (bonded or not) and bar displaces concrete, so steel is counted once (n − 1, not n)
 const sA=p.sy.reduce((a,y)=>a+p.Ap,0)+(p.fl.bar===0?0:(p.bars||[]).reduce((a,b)=>a+b.A,0)),sB=p.sy.reduce((a,y)=>a+p.Ap*y,0)+(p.fl.bar===0?0:(p.bars||[]).reduce((a,b)=>a+b.A*b.y,0)),sI=p.sy.reduce((a,y)=>a+p.Ap*y*y,0)+(p.fl.bar===0?0:(p.bars||[]).reduce((a,b)=>a+b.A*b.y*b.y,0));
 const Ag=p.A-sA,yb=(p.A*p.yb-sB)/Ag,Ig=p.I+p.A*p.yb*p.yb-sI-Ag*yb*yb,Adk=cp?p.beff*p.dth:0,ydk=cp?p.H+p.dgap+p.dth/2:0,Idk=cp?p.beff*p.dth**3/12:0;
 const pd=cp?{...p,A:Adk,ue:p.ued,fc:p.fcd,ts:p.tsd}:null,bars=p.fl.bar===0?[]:(p.bars||[]);
 const keys=new Set([0,...p.times]);if(cp){keys.add(p.pour);keys.add(tcR);keys.add(p.sidlA)}const tmax=Math.max(...keys);for(let t=0.25;t<tmax;t*=(p.subr||1.15))keys.add(+t.toFixed(3));
 const T=[...keys].filter(t=>t>=0&&t<=tmax).sort((a,b)=>a-b),K=T.length,age=t=>p.tau+t;
 // girder modulus vs age: knots (τ, Ect), (28 d, Ec), (pour, Ecp), (SIDL, Ecs); log-linear between knots (development curve not codified)
 const kn=[[p.tau,p.Ect]];if(p.tau<28)kn.push([28,p.Ec]);if(cp){kn.push([age(p.pour),p.Ecp]);kn.push([age(p.sidlA),p.Ecs])}kn.sort((a,b)=>a[0]-b[0]);
 const Eg0=a=>{if(a<=kn[0][0])return kn[0][1];for(let i=1;i<kn.length;i++)if(a<=kn[i][0]){const[a0,e0]=kn[i-1],[a1,e1]=kn[i];return a1>a0?e0+(e1-e0)*Math.log(a/a0)/Math.log(a1/a0):e1}return kn[kn.length-1][1]};
 const Eg=a=>{if(p.emodel===2){const s_=p.mcs||0.25;return p.Ec*Math.pow(Math.exp(s_*(1-Math.sqrt(28/a))),0.3)}if(p.emodel===1){let e=kn[0][1];for(const[ka,ke]of kn)if(a>=ka)e=ke;return e}return Eg0(a)}; // emodel 1 = stepped, 2 = fib MC2010 E(t)=Ec·βcc^0.3 (sensitivity checks only)
 const shGa=T.map(t=>p.fl.sh*shG(age(t),p)),shD=T.map(t=>cp&&t>=tcR?p.fl.sh*(p.fl.shd===0?0:1)*shrink(t-p.pour,pd).v/(1+15*(p.rd||0)):0); // deck bars restrain free shrinkage: 1/(1+15ρd), Eq. 3.4.3.2 form
 const Rc=T.map(t=>Math.max(relax(p,t)-relax(p,0),0)*p.fl.rl*p.rlx);
 const tE=isFinite(p.terec)?p.terec:-1,Msag=(s,k)=>(T[k]>=tE?s.M:s.Mst)+(cp&&T[k]>=p.pour?s.Md:0)+(cp&&T[k]>=p.sidlA?s.Ms:0); // storage support until erection
 // transfer pre-pass for k9 (σo = max sustained compression at the tendon centroid at transfer)
 const steel=s=>{const o=[];p.sy.forEach((y,i)=>{if(s.w[i])o.push({y,k:p.Ep*s.w[i],F0:P0*1e3*s.w[i]/p.Ap,i,A:s.w[i],x:p.sx?p.sx[i]:NaN})});bars.forEach(b=>o.push({y:b.y,k:p.Es*b.A,F0:0,bar:1,A:b.A,x:b.x,d:b.d}));return o};
 const sol=(a,b,c,r1,r2)=>{const D=a*c-b*b;return[(r1*c-r2*b)/D,(a*r2-b*r1)/D]};
 let sigo=0;const sos=[];const k9s=st.map(s=>{const S=steel(s),E=p.Ect;let a=E*Ag,b=E*Ag*yb,c=E*(Ig+Ag*yb*yb),r1=0,r2=-Msag(s,0)*1e6;S.forEach(q=>{a+=q.k;b+=q.k*q.y;c+=q.k*q.y*q.y;r1-=q.F0;r2-=q.F0*q.y});const[e,ps]=sol(a,b,c,r1,r2);
  const W=s.w.reduce((u,v)=>u+v,0);if(!W){sos.push(0);return 1}const y=s.w.reduce((u,v,i)=>u+v*p.sy[i],0)/W,so=-E*(e+ps*y);sigo=Math.max(sigo,so);sos.push(so);return p.k9off?1:k9f(so,p.fcmi)});const k9=p.k9off?1:k9f(sigo,p.fcmi); // k9 per station (cl. 3.1.8.3), applied to creep of the transfer increment
 // compliances (girder: loaded at age(tj); deck: loaded at deck age tj − pour)
 const Jg=T.map((t,k)=>T.map((tj,j)=>j>k?0:1/Eg(age(tj))+(j<k?p.fl.cr*phG(age(t),{...p,tau:age(tj)})/p.Ec:0)));
 const dOn=T.map(t=>cp&&t>tcR);
 const Jd=cp?T.map((t,k)=>T.map((tj,j)=>j>k||!dOn[j]?0:1/p.Ed+(j<k?p.fl.cr*creep(t-p.pour,{...pd,tau:tj-p.pour}).v/p.Ed:0))):null;
 const kap=T.map(()=>new Array(N)),MS={},SX={};let sciMax=0;const secN=Number.isInteger(p.secN)?p.secN:-1;
 st.forEach((s,n)=>{const S=steel(s),gn=[],gm=[],dn=[],dm=[],F=S.map(q=>q.F0),Lr=S.map(()=>0),k9n=k9s[n];let e0=0,ps=0,e00=0,ps0=0,Fpi=null,sn=0,sm=0,tn=0,tm=0,eEl=0,pEl=0;
  const Wb=s.w.reduce((u,v)=>u+v,0),yg=Wb?s.w.reduce((u,v,i)=>u+v*p.sy[i],0)/Wb:NaN;
  for(let k=0;k<K;k++){const Ek=1/Jg[k][k],on=dOn[k],Edk=on?1/Jd[k][k]:0;
   // free strain increments over the sub-step: creep of earlier increments + shrinkage (girder from transfer, deck from composite age)
   let ag=k?-(shGa[k]-shGa[k-1]):0,bg=0;for(let j=0;j<k;j++){const dJ=(Jg[k][j]-Jg[k-1][j])*(j===0?k9n:1);ag+=gn[j]*dJ;bg+=gm[j]*dJ}
   let ad=0,bd=0;if(on){ad=T[k-1]>=tcR?-(shD[k]-shD[k-1]):0;for(let j=0;j<k;j++)if(dOn[j]){const dJ=Jd[k][j]-Jd[k-1][j];ad+=dn[j]*dJ;bd+=dm[j]*dJ}}
   // relaxation increment (explicit on the previous creep + shrinkage loss), Eq. 3.4.3.4
   const dR=S.map((q,i)=>{if(q.bar||!k)return 0;const lcs=Math.max(0,-q.k*((e0+ps*q.y)-(e00+ps0*q.y)-(eEl+pEl*q.y))),L=Fpi[i]*Rc[k]/100*Math.max(0,1-lcs/Fpi[i]),d=L-Lr[i];Lr[i]=L;return d});
   let a=Ek*Ag+Edk*Adk,b=Ek*Ag*yb+Edk*Adk*ydk,c=Ek*(Ig+Ag*yb*yb)+Edk*(Idk+Adk*ydk*ydk);
   let r1=Ek*ag*Ag+Edk*ad*Adk,r2=-(Msag(s,k)-(k?Msag(s,k-1):0))*1e6+Ek*(ag*Ag*yb+bg*Ig)+Edk*(ad*Adk*ydk+bd*Idk);
   S.forEach((q,i)=>{const kq=(p.frz&&k&&!q.bar)?0:q.k;a+=kq;b+=kq*q.y;c+=kq*q.y*q.y;const f=k?(p.frz?0:dR[i]):-q.F0;r1+=f;r2+=f*q.y});
   const[de,dp]=sol(a,b,c,r1,r2);e0+=de;ps+=dp;const dM=k?Msag(s,k)-Msag(s,k-1):0;if(dM){const[ee,pe]=sol(a,b,c,0,-dM*1e6);eEl+=ee;pEl+=pe} // elastic part of load changes, excluded from loss_cs (Eq. 3.4.3.4)
   gn[k]=Ek*(de+dp*yb-ag);gm[k]=Ek*(dp-bg);sn+=gn[k];sm+=gm[k];if(on){dn[k]=Edk*(de+dp*ydk-ad);dm[k]=Edk*(dp-bd);tn+=dn[k];tm+=dm[k]}
   S.forEach((q,i)=>{F[i]+=((p.frz&&k&&!q.bar)?0:q.k)*(de+dp*q.y)-(k&&!p.frz?dR[i]:0)});
   if(!k){e00=e0;ps0=ps;Fpi=F.slice();const Pv=p.sy.map(()=>0);S.forEach((q,i)=>{if(!q.bar)Pv[q.i]=F[i]/1e3});s.Pr=Pv;s.T=Pv.reduce((u,v)=>u+v,0);s.Mn=s.M-Pv.reduce((u,v,i)=>u+v*(yb-p.sy[i]),0)/1e3;s.top=-(sn+sm*(p.H-yb));s.bot=-(sn-sm*yb);s.k9=k9n;s.Fb0=F.filter((v,i)=>S[i].bar).reduce((u,v)=>u+v,0)/1e3}
   if(Wb)sciMax=Math.max(sciMax,-(sn+sm*(yg-yb)));
   kap[k][n]=-ps;
   if(n===secN&&p.times.concat([0]).includes(T[k]))SX[T[k]]={sn,sm,tn,tm,on,Ek,Edk,F:F.slice(),S,M:Msag(s,k),T:T[k]}; // section-check state (stresses tension +, about net centroid)
   if(n===mi){const Ps=p.sy.map(()=>0);S.forEach((q,i)=>{if(!q.bar)Ps[q.i]=F[i]/1e3});MS[k]={k9:k9n,T:Ps.reduce((u,v)=>u+v,0),Pm:Ps,Fb:F.filter((v,i)=>S[i].bar).reduce((u,v)=>u+v,0)/1e3,rel:Lr.reduce((u,v)=>u+v,0)/1e3,
    top:-(sn+sm*(p.H-yb)),bot:-(sn-sm*yb),sci:-(sn+sm*(yg-yb)),dtop:on?-(tn+tm*(p.dth/2)):NaN,e0,ps,eqN:(sn*Ag+tn*Adk+F.reduce((u,v)=>u+v,0))/1e3,eqM:(sn*Ag*yb+sm*Ig+tn*Adk*ydk+tm*Idk+F.reduce((u,v,i)=>u+v*S[i].y,0))/1e6+Msag(s,k),E:Ek,Ed:Edk,Nc:sn*Ag/1e3,Nd:tn*Adk/1e3,Ns:F.reduce((u,v,i)=>S[i].bar?u:u+v,0)/1e3,Mc:(sn*Ag*yb+sm*Ig)/1e6,Mdk:(tn*Adk*ydk+tm*Idk)/1e6,Msn:F.reduce((u,v,i)=>S[i].bar?u:u+v*S[i].y,0)/1e6,Mbr:F.reduce((u,v,i)=>S[i].bar?u+v*S[i].y:u,0)/1e6,Mext:Msag(s,k),Ti:S.filter(q=>!q.bar).reduce((u,q)=>u+q.F0,0)/1e3}}}});
 const res=[],e0s=p.fl.sh*shrink(p.tau,p).v;let eP=e0s,phP=0;
 T.forEach((t,k)=>{if(k&&!p.times.includes(t))return;const ag_=age(t),sh=shrink(ag_,p),cr=creep(ag_,p),ph=k?p.fl.cr*k9s[mi]*cr.v:0,es=p.fl.sh*sh.v,m=MS[k],Md=cp&&t>=p.pour?st[mi].Md:0,Ms=cp&&t>=p.sidlA?st[mi].Ms:0;
  const mid={...m,M:(t>=(isFinite(p.terec)?p.terec:-1)?st[mi].M:st[mi].Mst)+Md+Ms,Md,Ms,kap:m.ps*-1e6,comp:dOn[k],lcs:MS[0].T-m.T-m.rel,lrl:m.rel,Pr:MS[0].T,A:Ag,y:yb,I:Ig,M0:st[mi].Mn};
  res.push({label:k?t+' d':'Transfer',t,phi:ph,eps:k?p.fl.sh*shG(ag_,p):undefined,hog:defl(kap[k]),sh,cr,dEs:k?es-eP:0,dPh:ph-phP,mid,Pm:m.Pm,rl:{...relaxD(p,t),dR:0,dRc:Rc[k]},det:1});eP=es;phP=ph});
 return{X,st,res,mi,P0,tcR,Adk,ydk,sciMax,sigo,k9,k9mid:k9s[mi],somid:sos[mi],net:{A:Ag,y:yb,I:Ig,sA},SX,det:1,nsub:K,sw:defl(st.map(s=>s.M*1e6/(p.Ect*p.I)))}}
// ===================== Word (.docx) calculation report =====================
// Builds an engineering-report style document from the current run (LAST.p, LAST.r) with clause references.
// Uses the embedded docx library (global `docx`). SVG figures are rasterised to PNG in the browser.
return {run:run, runDet:runDet, shrink:shrink, creep:creep, relax:relax, relaxD:relaxD, t312:t312, STR:STR, interp:interp};
})();
if(typeof module!=='undefined') module.exports=HOG;
