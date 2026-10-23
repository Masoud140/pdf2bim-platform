const { chromium } = require('playwright');
const XL=require('path').resolve(__dirname,'xlout'); require('fs').mkdirSync(XL,{recursive:true}); const fs=require('fs');
const temp=process.argv[2]==='temp';
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const ctx=await b.newContext({ viewport:{width:1500,height:1300}, acceptDownloads:true }); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(1500);
  await p.click('#tg_des'); await p.click('#tb_dg'); await p.waitForTimeout(1200);
  await p.click('[data-pg="in"]'); await p.evaluate(()=>document.getElementById('dg_ex').click()); await p.click('[data-pg="an"]');
  await p.click('#dg_fill');
  await p.waitForFunction(()=>DG.gird&&DG.gird.ver===DG.ver&&!DG.girdBusy,null,{timeout:240000});
  if(temp){ await p.evaluate(()=>{ DG.temp.alpha=10; DG.temp.pos='0:12, 150:3, 400:0, 1925:0, 2025:2'; DG.temp.neg='0:-6, 150:-1, 400:0, 1825:0, 2025:-1'; });
}
  await p.evaluate(()=>{ DG.res=null; dgRun(true); });
  await p.waitForTimeout(500);
  if(temp){ await p.evaluate(()=>{ DG.lc.forEach(function(lc){ lc.Tsel=1; lc.Tf=dgK1(); }); DG.res.lc=DG.res.lc.map(function(o,i){ var q=JSON.parse(JSON.stringify(DG.lc[i])); q.free=dgFreeFor('b+'); var o2=dgLC(o.X,o.B,q); o2.X=o.X; o2.B=o.B; o2.solid=o.solid; o2.Mu=o.Mu; o2.dn=o.dn; o2.phiMu=o.phiMu; o2.sh=o.sh; return o2; }); }); }
  const res=await p.evaluate(()=>JSON.stringify(DG.res.lc.map((o,i)=>({lc:DG.lc[i].name, Ns:DG.lc[i].Ns, s1b:o.g1bot, s1t:o.g1top, sb:o.sv.girBot, sgt:o.sv.girTop, sdk:o.sv.deckTop, Mdec:o.Mdec, Mal:o.Mal, MdecT:o.MdecT, MalT:o.MalT, Mcr:o.Mcr, dn:o.dn, kuo:o.kuo, Mu:o.Mu, phMu:o.phiMu, uV:o.sh&&o.sh.uV, uL:o.sh&&o.sh.uL, uT:o.sh&&o.sh.uT, free:!!DG.lc[i].free}))));
  fs.writeFileSync(XL+'/engine.json',res);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#dg_xl')]); await dl.saveAs(XL+'/export.xlsx');
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
