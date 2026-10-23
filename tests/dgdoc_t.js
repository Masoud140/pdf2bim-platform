const { chromium } = require('playwright');
const XL=require('path').resolve(__dirname,'xlout'); require('fs').mkdirSync(XL,{recursive:true}); const fs=require('fs');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p=await (await b.newContext({ viewport:{width:1500,height:1300} })).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+(process.env.DASH||require('path').resolve(__dirname,'../dist/BR13A_grillage_dashboard.html'))); await p.waitForTimeout(1500);
  await p.click('#tg_des'); await p.click('#tb_dg'); await p.waitForTimeout(1200);
  await p.click('[data-pg="in"]'); await p.evaluate(()=>document.getElementById('dg_ex').click()); await p.click('[data-pg="an"]');
  await p.click('#dg_fill');
  await p.waitForFunction(()=>DG.gird&&DG.gird.ver===DG.ver&&!DG.girdBusy,null,{timeout:240000});
  const bl=await p.evaluate(async()=>{ const bl=await dgDocx(); const ab=await bl.arrayBuffer(); let s=''; const u=new Uint8Array(ab); for(let i=0;i<u.length;i+=8192) s+=String.fromCharCode.apply(null,u.subarray(i,i+8192)); return btoa(s); });
  fs.writeFileSync(XL+'/report33.docx',Buffer.from(bl,'base64'));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
