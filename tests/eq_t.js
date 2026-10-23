const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1200} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(2000);
  console.log(await p.evaluate(()=>{ const t0=Date.now(); const r=eqRun(); const out=[(Date.now()-t0)+'ms iters '+r.iters+' nf '+r.Q.names.length, 'mtot '+JSON.stringify(r.E.mtot)+' str '+r.E.mStr.toFixed(1)+' sdl '+r.E.mSDL.toFixed(1)];
    r.modes.slice(0,12).forEach((m,i)=>out.push((i+1)+' T '+m.T.toFixed(3)+' L '+(100*m.eff.L).toFixed(1)+' T '+(100*m.eff.T).toFixed(1)+' V '+(100*m.eff.V).toFixed(1)));
    out.push('meff L '+r.resp.L.meff.toFixed(3)+' T '+r.resp.T.meff.toFixed(3));
    ['L','T'].forEach(d=>{ const s=eqSum(r.Q,r.resp[d].R); out.push(d+' S '+s.S.map(v=>v.toFixed(1))+' brgLonA '+s.brg.filter(b=>b.ab==='A').map(b=>b.lon.toFixed(1))+' brgTr '+s.brg.map(b=>b.tr.toFixed(1))+' pileM '+s.piles.map(q=>q.M.toFixed(0))+' dlonB '+s.brg.filter(b=>b.ab==='B').map(b=>b.dlon.toFixed(1))); });
    return out.join('\n'); }));
  await p.evaluate(()=>showTab('eq')); await p.waitForTimeout(500); await p.click('#eq_run'); await p.waitForFunction(()=>/Solved|Stopped/.test(document.getElementById('eq_st').textContent),null,{timeout:300000});
  console.log(await p.evaluate(()=>document.getElementById('eq_st').textContent));
  await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/eq1.png',fullPage:true});
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
