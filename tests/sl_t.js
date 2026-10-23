const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1200} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(1800);
  await p.click('#tg_load'); await p.click('#tb_sl'); await p.waitForTimeout(800);
  await p.click('#sl_run'); await p.waitForFunction(()=>SL.res,null,{timeout:120000});
  console.log(await p.evaluate(()=>JSON.stringify(SL.res.res.map(r=>({id:r.cs.id,tot:r.tot.map(v=>+v.toFixed(1)),spr:[+(-r.sprX).toFixed(1),+(-r.sprY).toFixed(1)],
     brgA:r.brg.filter(b=>b.ab==='A').reduce((a,b)=>[a[0]+b.lon,a[1]+b.tr],[0,0]).map(v=>+v.toFixed(1)),brgB:r.brg.filter(b=>b.ab==='B').reduce((a,b)=>[a[0]+b.lon,a[1]+b.tr],[0,0]).map(v=>+v.toFixed(1)),
     pileM:Math.max(...r.piles.map(q=>q.M)).toFixed(1), d:Math.max(...r.piles.map(q=>q.dx)).toFixed(2)})))));
  console.log(await p.evaluate(()=>JSON.stringify({H:[SL.res.G.abs.A.H,SL.res.G.abs.B.H,SL.res.G.abs.A.len], n:[SL.res.G.abs.A.n,SL.res.G.abs.B.n], Fc:SL.Fc, nDeck:SL.nDeck, K:slK()})));
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/sl1.png',fullPage:true});
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
