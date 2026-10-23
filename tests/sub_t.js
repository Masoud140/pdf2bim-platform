const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1200} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(2000);
  console.log(await p.evaluate(()=>{ const M=AN.parseMCT(document.getElementById('an_mct_src').textContent); return JSON.stringify({spr:M.springs.length, sprNodes:M.springs.reduce((a,s)=>a+s.nodes.length,0), cons:M.cons, links:M.links.map(l=>[l.group,l.k.slice(0,3).map(v=>+v.toPrecision(3))]), info:SUBM.info.piles.map(q=>[q.ab,q.chain.length,q.rock,q.zTop,q.zToe]).slice(0,2), warn:M.warn}); }));
  await p.click('#tg_bnd'); await p.click('#tb_bd'); await p.waitForTimeout(800);
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/sub1.png',fullPage:true});
  console.log('check', await p.evaluate(()=>JSON.stringify(SUBM.check())));
  // self-weight analysis + pile results
  await p.click('#tg_an'); await p.click('#tb_pr'); await p.waitForTimeout(500);
  await p.waitForFunction(()=>typeof ANS!=='undefined'&&ANS.res&&!ANS.stale,null,{timeout:180000}).catch(()=>{});
  console.log('anres', await p.evaluate(()=>{ const r=ANS.res; if(!r) return 'none'; const S=r.S||r; return JSON.stringify({keys:Object.keys(r).slice(0,10), spr:(S.spr||[]).length, sprSum:(S.spr||[]).reduce((a,s)=>a+s.f,0).toFixed(3)}); }));
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/sub2.png',fullPage:true});
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
