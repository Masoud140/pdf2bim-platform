const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1200} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(2000);
  console.log(await p.evaluate(()=>typeof CBX+' '+CBX.genAll(Object.assign(CBX.opt(),{tm:'s'})).rows.length));
  await p.evaluate(()=>showTab('rx')); await p.waitForTimeout(500);
  await p.click('#rx_run');
  await p.waitForFunction(()=>/Done|Stopped/.test(document.getElementById('rx_st').textContent),null,{timeout:600000});
  console.log(await p.evaluate(()=>document.getElementById('rx_st').textContent));
  console.log(await p.evaluate(()=>{ const R=RX.res; return JSON.stringify({tr:R.tr,err:R.trErr,miss:R.C.miss,nQ:RX.Q.length}); }));
  console.log(await p.evaluate(()=>{ const Q=RX.Q,U=RX.res.C.out.ULS,S=RX.res.C.out.SLS,Pm=RX.res.Pm; const o=[]; Q.forEach((q,i)=>{ if(q.k==='B'&&(q.t==='V'||q.t==='Hl'||q.t==='dl')) o.push(q.nm+' '+q.t+' DL '+Pm.DLc.e.s[i].toFixed(0)+' SDL '+Pm.SDLp.e.s[i].toFixed(0)+' M1600 '+(Pm.M1600?Pm.M1600.e.max[i].toFixed(0)+'/'+Pm.M1600.e.min[i].toFixed(0):'-')+' ULS '+U.max[i].toFixed(0)+'/'+U.min[i].toFixed(0)+' SLS '+S.max[i].toFixed(1)+'/'+S.min[i].toFixed(1)); }); return o.join('\n'); }));
  console.log(await p.evaluate(()=>{ const Q=RX.Q,Pm=RX.res.Pm; let n=0,dl=0; Q.forEach((q,i)=>{ if(q.k==='B'&&q.t==='V'){ dl+=Pm.DLc.e.s[i]; n+=Pm.SDLp.e.s[i]; } }); return 'sum DL brg '+dl.toFixed(0)+' SDL '+n.toFixed(0)+' sdlTot '+RX.st._sdl.tot.toFixed(0); }));
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/rx1.png',fullPage:true});
  await p.evaluate(()=>showTab('nr')); await p.waitForTimeout(800); await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/nr1.png',fullPage:true});
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
