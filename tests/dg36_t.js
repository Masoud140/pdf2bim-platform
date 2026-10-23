const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1100} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(1500);
  // before design is opened
  await p.click('#tg_prop'); await p.click('#tb_srf'); await p.waitForTimeout(500);
  for(const d of ['gird','shape','zone','tend','reinf','fit']){ await p.click('.srfdb[data-def="'+d+'"]'); await p.waitForTimeout(300);
    const h=await p.evaluate(d=>{ const e=document.querySelector('.srfp[data-p="'+d+'"]'); return [e.hidden, e.innerText.length]; },d); console.log('pre',d,h); }
  // set Ld from the definition tab
  await p.click('.srfdb[data-def="gird"]'); await p.fill('#srf_gird .dgdb[data-k="g:Ld"]','1500'); await p.press('#srf_gird .dgdb[data-k="g:Ld"]','Tab'); await p.waitForTimeout(300);
  console.log('Ld', await p.evaluate(()=>DG.sec.gird.Ld));
  // design run
  await p.click('#tg_des'); await p.click('#tb_dg'); await p.waitForTimeout(800);
  await p.evaluate(()=>document.getElementById('dg_ex').click()); await p.click('#dg_fill');
  await p.waitForFunction(()=>DG.gird&&DG.gird.ver===DG.ver&&!DG.girdBusy,null,{timeout:240000});
  const v0=await p.evaluate(()=>[DG.ver,DG.res.lc[0].Mu.toFixed(0),DG.res.lc[3].sh&&DG.res.lc[3].sh.uL.toFixed(3)]); console.log('run', v0);
  await p.click('[data-pg="in"]'); await p.waitForTimeout(400); await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/d36in.png'});
  // change deck thickness from the definition tab -> checks re-run
  await p.click('#tg_prop'); await p.click('#tb_srf'); await p.click('.srfdb[data-def="shape"]'); await p.waitForTimeout(300);
  await p.fill('#srf_deck .dge[data-k="tD"]','220'); await p.press('#srf_deck .dge[data-k="tD"]','Tab');
  await p.waitForFunction(v=>DG.ver>v&&DG.res&&DG.gird&&DG.gird.ver===DG.ver&&!DG.girdBusy,v0[0],{timeout:240000});
  console.log('tD 220', await p.evaluate(()=>[DG.sec.tD, DG.res.lc[0].Mu.toFixed(0)]), await p.textContent('#srf_st'));
  for(const d of ['gird','shape','zone','tend','reinf','fit']){ await p.click('.srfdb[data-def="'+d+'"]'); await p.waitForTimeout(400); await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/d36_'+d+'.png'}); }
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
