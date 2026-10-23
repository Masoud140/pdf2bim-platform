const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1200} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(2000);
  const summ=()=>p.evaluate(()=>{ const c=SUBM.check(); return JSON.stringify({nSpr:SUBM.info.nSpr, head:Math.round(c.model), all:Math.round(c.all), piles:SUBM.info.piles.map(q=>[q.id,q.ground&&+q.ground.toFixed(2),q.chain.length,q.layers.map(l=>[l.j,+l.top.toFixed(2),+l.bot.toFixed(2)]), +q.spr.filter(s=>s.t!=='rock').reduce((a,s)=>a+s.k,0).toFixed(0)])}); });
  console.log('default', await summ());
  const runSL=()=>p.evaluate(()=>{ slRun(); const r=SL.res.res; return JSON.stringify(r.map(x=>[x.cs.id, +x.tot[0].toFixed(1), +(-x.sprX).toFixed(1), +Math.max(...x.piles.map(q=>q.M)).toFixed(0)])); }).catch(e=>'slerr '+e.message);
  console.log('sl default', await runSL());
  console.log('custom', await p.evaluate(()=>{ SUBM.soil.A.g=121; SUBM.soil.A.gp={A4:123.5}; SUBM.soil.A.layers.push({nm:'Weathered',top:118,kh:50}); SUBM.soil.B.g=120; SUBM.apply(); return 1; }), await summ());
  console.log('sl custom', await runSL());
  // check node exists at 121 and 118 on A1
  console.log(await p.evaluate(()=>{ const M=AN.parseMCT(document.getElementById('an_mct_src').textContent); const q=SUBM.info.piles[0]; return q.chain.map(n=>M.nodes[n][2].toFixed(2)).join(' ')+' | '+q.spr.map(s=>s.z.toFixed(2)+':'+Math.round(s.k)+s.t).join(' '); }));
  await p.click('#tg_bnd'); await p.click('#tb_bd'); await p.waitForTimeout(800);
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/soil1.png',fullPage:true});
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
