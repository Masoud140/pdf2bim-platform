const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1100} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(1500);
  console.log(await p.evaluate(()=>JSON.stringify({temp:DG.temp, fp:tgFree('pos'), fn:tgFree('neg')})));
  await p.evaluate(()=>showTab('tm')); await p.waitForTimeout(400); await p.click('#tg_run'); await p.waitForFunction(()=>/Solved|Stopped/.test(document.getElementById('tg_st').textContent),null,{timeout:120000});
  console.log(await p.evaluate(()=>document.getElementById('tg_st').textContent+' '+JSON.stringify(Object.keys(TG.res.res).map(k=>[k,TG.res.res[k].zmax.toFixed(2),TG.res.res[k].brg.map(b=>[b.ab,b.lon.toFixed(1),b.dlon.toFixed(2)])]))));
  console.log(await p.evaluate(()=>document.querySelector('#tg_out .bbnote').textContent));
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/tg1.png',fullPage:true});
  await p.evaluate(()=>showTab('rx')); await p.click('#rx_run');
  await p.waitForFunction(()=>/Done|Stopped/.test(document.getElementById('rx_st').textContent),null,{timeout:600000});
  console.log(await p.evaluate(()=>document.getElementById('rx_st').textContent+' miss '+JSON.stringify(RX.res.C.miss)));
  console.log(await p.evaluate(()=>{ const Q=RX.Q,S=RX.res.C.out.SLS,Pm=RX.res.Pm; const o=[]; Q.forEach((q,i)=>{ if(q.k==='B'&&q.t==='dl'&&q.ab==='B') o.push(q.nm+' SLS '+S.min[i].toFixed(1)+' to '+S.max[i].toFixed(1)+' TGP '+Pm.TGP.e.s[i].toFixed(2)+' SCR '+Pm.SCR.e.s[i].toFixed(2)); }); return o.join('\n'); }));
  await p.click('#tg_des'); await p.click('#tb_dg'); await p.waitForTimeout(800); await p.click('#dg_fill');
  await p.waitForFunction(()=>DG.gird&&DG.gird.ver===DG.ver&&!DG.girdBusy,null,{timeout:400000});
  console.log(await p.evaluate(()=>{ const st=DG.gird.st, m=st[Math.floor(st.length/2)]; return Object.keys(m.cb).map(k=>k+': Mu '+m.cb[k].lc.Mu.toFixed(0)+' uB '+(m.cb[k].o.uB||0).toFixed(3)+' uS '+(m.cb[k].o.uS||0).toFixed(3)).join(' | '); }));
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
