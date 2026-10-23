/* Dump the live state of a built dashboard (takeoff data, parameters, Hog, design section, integrated-model and load inputs)
   to JSON — the input of projects/<bridge>/import_dashboard.py.  Usage: node tools/dump_dashboard_state.js [dashboard.html] [out.json] */
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const DASH=path.resolve(process.argv[2]||path.join(__dirname,'../dist/BR13A_grillage_dashboard.html')), OUT=path.resolve(process.argv[3]||'dashboard_state.json');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext()).newPage();
  await p.goto('file://'+DASH); await p.waitForTimeout(2500);
  const d=await p.evaluate(()=>{ dgSecInit(); var hdr=document.querySelector('header')||document.body;  const s=HOG_API.snap(); return JSON.stringify({ABT:DATA.ABT, PIL:DATA.PIL, PRM:DATA.PRM, VAL:DATA.VAL, LIVE:DATA.LIVE, P:P, DEF:DEF, META:META,
     STAG:typeof STAG!=='undefined'?STAG:null, SROWS:typeof SROWS!=='undefined'?SROWS:null, SKEYS:typeof SKEYS!=='undefined'?SKEYS:null,
     hog:{cur:s.cur, p:s.p, S:s.S, B:s.B, R:s.R}, DGsec:(()=>{ const q=Object.assign({},DG.sec); delete q.orig; return q; })(), gird:DG.sec.gird,
     SUBM:{bA:SUBM.bA,bB:SUBM.bB,ea:SUBM.ea,eb:SUBM.eb,eT:SUBM.eT,eG:SUBM.eG,kFix:SUBM.kFix,khRock:SUBM.khRock,fac:SUBM.fac,toe:SUBM.toe,colSoil:SUBM.colSoil,soil:SUBM.soil,piles:SUBM.info.piles.map(q=>({id:q.id,ab:q.ab,x:q.x,y:q.y,rock:q.rock,zTop:q.zTop,zToe:q.zToe,ground:q.ground}))},
     SL, TM:{Tmax:TM.Tmax,Tmin:TM.Tmin,Tset:TM.Tset,alpha:TM.alpha}, TG:{T0:TG.T0,negF:TG.negF,eps:TG.eps}, temp:DG.temp, WD:Object.assign({},WD,{res:null}), EQ:{kp:EQ.kp,Z:EQ.Z,site:EQ.site,Rf:EQ.Rf,zeta:EQ.zeta,nModes:EQ.nModes,wbar:EQ.wbar,vert:EQ.vert}, RX:{Vs:RX.Vs,V35:RX.V35}, LD:LD,
     CB:CBX.R.map(r=>({id:r.id,on:r.on,u:r.u,b:r.b,s:r.s})), cbopt:CBX.opt(), header:(document.querySelector('.hdr,header,#hdr')||document.body).innerText.slice(0,1500), mdlG:dgModel().g, links:AN.parseMCT(document.getElementById('an_mct_src').textContent).links, mctHead:document.getElementById('an_mct_src').textContent.split('\n').filter(l=>/^;/.test(l)).slice(0,80), DGopt:DG.opt, DGlc:DG.lc.map(l=>({name:l.name,pos:l.pos,s:l.s,sec:l.sec})), GD:(typeof GD!=='undefined')?{name:GD.name,gap:gdGap(),gapUser:GD.gap,setback:GD.setback}:null, secGeo:(()=>{ const g=secGeom(); return {D:g.D,bw:g.bw,tw:g.tw,d1:g.d1,d2:g.d2,ttf:g.ttf,S:g.S,fW:g.fW,fD:g.fD,r:g.r,ch:g.ch,W:g.W,A:g.A,yb:g.yb,Ix:g.Ix,type:SEC.type,conf:SEC.conf,ov:SEC.ov}; })(), SROWS:typeof SROWS!=='undefined'?SROWS:null, flange:(typeof gwFlange==='function')?gwGeom().G.map((g,j)=>({k:g.k,pts:GW_T.map(t=>{ const q=gwFlange(j,t), w=gwWidth(j,t); return {t:t,L:q&&q.L,R:q&&q.R,deck:w&&w.W}; })})):null, gw:gwGeom().G.map(g=>({k:g.k,o:g.o,Ltot:g.Ltot,sA:g.sA,sB:g.sB,PA:g.PA,PB:g.PB})) }); });
  fs.writeFileSync(OUT,d); console.log(d.length); await b.close(); })();
