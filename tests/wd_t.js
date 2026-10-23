const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1200} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(2000);
  console.log(await p.evaluate(()=>{ const t0=Date.now(); wdRun(); const R=WD.res.res, C=WD.res.C, G=WD.res.G; return (Date.now()-t0)+'ms lines '+G.lines.map(l=>l.o.toFixed(2)+':'+l.p.length).join(',')+' b='+G.b.toFixed(2)+' wT='+C.wT.toFixed(3)+' wV='+C.wV.toFixed(3)+'\n'+R.map(r=>r.cs.id+' tot '+r.tot.map(v=>v.toFixed(1))+' spr '+(-r.sprX).toFixed(1)+','+(-r.sprY).toFixed(1)+' brgV '+r.brg.map(b=>b.v.toFixed(1)).join(' ')+' pileM '+Math.max(...r.piles.map(q=>q.M)).toFixed(0)+' dh '+r.dh.toFixed(2)).join('\n'); }));
  console.log(await p.evaluate(()=>TABS.filter(t=>/ld|wd|tm/.test(t.id)).map(t=>t.id+':'+t.label).join(' | ')));
  await p.evaluate(()=>showTab('wd')); await p.waitForTimeout(500); await p.click('#wd_run'); await p.waitForTimeout(6000);
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/wd1.png',fullPage:true});
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
