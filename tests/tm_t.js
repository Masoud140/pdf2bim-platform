const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1200} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(2000);
  console.log(await p.evaluate(()=>{ const t0=Date.now(); tmRun(); const R=TM.res.res; return (Date.now()-t0)+'ms '+JSON.stringify(R.map(r=>({id:r.cs.id,nH:r.nHeat,brg:r.brg.map(b=>[b.ab,+b.lon.toFixed(1),+b.tr.toFixed(1),+b.dlon.toFixed(2),+b.dtr.toFixed(2)]),hc:r.hc.map(q=>[+q.L.toFixed(2),+q.free.toFixed(2),+q.model.toFixed(2)]),pm:r.piles.map(q=>+q.M.toFixed(0)),spr:[+r.sprX.toFixed(2),+r.sprY.toFixed(2)],gN:[Math.min(...r.gN).toFixed(0),Math.max(...r.gN).toFixed(0)]}))); }));
  await p.evaluate(()=>{ const M=AN.parseMCT(document.getElementById('an_mct_src').textContent); window._lk=M.links.map(l=>[l.n1,l.n2,l.group]); });
  console.log(JSON.stringify(await p.evaluate(()=>window._lk)));
  // free-free check: release all bearing horizontal restraint except one -> no forces
  await p.click('#tg_ld').catch(()=>{}); 
  const ids=await p.evaluate(()=>TAB_GROUPS.map(g=>g.g+':'+g.ids.join(',')).join(' | ')); console.log(ids);
  await p.evaluate(()=>showTab('tm')); await p.waitForTimeout(500); await p.click('#tm_run'); await p.waitForTimeout(4000);
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/tm1.png',fullPage:true});
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
