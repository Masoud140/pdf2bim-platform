const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1100} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(2500);
  console.log(await p.evaluate(()=>{ const Z=gwGeom(); return JSON.stringify({G:Z.G.map(g=>({k:g.k,o:g.o,L:g.Ltot.toFixed(3),sA:g.sA.toFixed(3),sB:g.sB.toFixed(3),chord:Math.hypot(g.PB[0]-g.PA[0],g.PB[1]-g.PA[1]).toFixed(3)})), eL:Z.eL&&Z.eL.o, eR:Z.eR&&Z.eR.o, W:Z.G.map((g,j)=>[0,0.5,1].map(t=>{ const w=gwWidth(j,t); return w?[w.L.toFixed(0),w.R.toFixed(0),w.W.toFixed(0)].join('/'):null; })), mdl:dgModel().g.map(q=>q.Wd&&q.Wd.toFixed(0)), hog:HOGF.last, hogL:document.getElementById('hog_L').value}); }));
  await p.click('#tg_prop'); await p.click('#tb_srf'); await p.click('.srfdb[data-def="zone"]'); await p.waitForTimeout(800);
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/gw1.png',fullPage:true});
  await p.click('#tg_des'); await p.click('#tb_dg'); await p.waitForTimeout(800); await p.click('#dg_fill');
  await p.waitForFunction(()=>DG.gird&&DG.gird.ver===DG.ver&&!DG.girdBusy,null,{timeout:400000});
  console.log(await p.evaluate(()=>{ const st=DG.gird.st; return 'Wd sec '+DG.sec.Wd+' | '+st.filter((r,i)=>i%5===0).map(r=>r.x.toFixed(1)+':'+(dgWdAt(DG.gi,r.x)||0).toFixed(0)+':'+(r.o&&r.o.X?r.o.X.info.Wd:'-')+':'+(r.o&&r.o.uB?r.o.uB.toFixed(3):'')).join(' ')+' | LC '+DG.res.lc.map(o=>o.X.info.Wd+' uB '+(o.uB||0).toFixed(3)).join(', '); }));
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
