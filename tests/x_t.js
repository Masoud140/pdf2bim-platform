const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1100} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(1500);
  await p.evaluate(()=>showTab('rx')); await p.click('#rx_run');
  await p.waitForFunction(()=>/Done|Stopped/.test(document.getElementById('rx_st').textContent),null,{timeout:600000});
  console.log(await p.evaluate(()=>document.getElementById('rx_st').textContent));
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/rx2.png',fullPage:true});
  await p.click('#tg_des'); await p.click('#tb_dg'); await p.waitForTimeout(800);
  await p.click('#dg_fill');
  await p.waitForFunction(()=>DG.gird&&DG.gird.ver===DG.ver&&!DG.girdBusy,null,{timeout:400000});
  console.log(await p.evaluate(()=>{ const o=[]; DG.lc.forEach((lc,i)=>{ const X=DG.res.lc[i].X, B=DG.res.lc[i].B; const q=dgCombX(lc); o.push(lc.name+' b: Mu '+lc.Mu.toFixed(0)+' Vu '+lc.Vu.toFixed(0)+' Tu '+lc.Tu.toFixed(0)+' Nu '+(lc.Nu||0).toFixed(0)+' Ms '+lc.Ms.toFixed(0)+' | x: Mu '+q.Mu.toFixed(0)+' Vu '+q.Vu.toFixed(0)+' Tu '+q.Tu.toFixed(0)+' Nu '+q.Nu.toFixed(0)+' Mnc '+q.Mnc.toFixed(0)+'/'+lc.Mnc.toFixed(0)+' Ms '+q.Ms.toFixed(0)+' gov '+JSON.stringify(q.xgov)); }); return o.join('\n'); }));
  console.log(await p.evaluate(()=>{ const st=DG.gird.st; let n=0,x=0; st.forEach(r=>{ if(r.cb){ n++; if(r.cb.x) x++; } }); const m=st.filter(r=>r.cb&&r.cb.x).map(r=>[r.x.toFixed(1), r.cb.b.lc.Mu.toFixed(0), r.cb.x.lc.Mu.toFixed(0), r.cb.b.o.uB&&r.cb.b.o.uB.toFixed(3), r.cb.x.o.uB&&r.cb.x.o.uB.toFixed(3)]); return n+' stations, x on '+x+'\n'+m.filter((r,i)=>i%6===0).map(r=>r.join(' ')).join('\n'); }));
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
