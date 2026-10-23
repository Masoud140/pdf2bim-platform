
/* ===== Calculation report: printable document with every step, table, drawing, plot and a worked calculation per load case ===== */
function dgStatic(node){
  var c=node.cloneNode(true);
  [].forEach.call(c.querySelectorAll('input'),function(i){ var s=document.createElement('span'); s.className='rv'; s.textContent=i.type==='checkbox'?(i.checked?'yes':'no'):i.value; i.replaceWith(s); });
  [].forEach.call(c.querySelectorAll('select'),function(sel){ var o=sel.options[sel.selectedIndex], s=document.createElement('span'); s.className='rv'; s.textContent=o?o.textContent:''; sel.replaceWith(s); });
  [].forEach.call(c.querySelectorAll('button,.dgtools,.dgsubtabs,.msbar,details>summary'),function(b){ b.remove(); });
  [].forEach.call(c.querySelectorAll('details'),function(d){ var v=document.createElement('div'); v.innerHTML=d.innerHTML; d.replaceWith(v); });
  [].forEach.call(c.querySelectorAll('[id]'),function(e){ e.removeAttribute('id'); });
  return c.innerHTML;
}
/* force breakdown at ultimate for the worked calculation (same model as DSG2.at) */
function dgUltParts(S,dn,face,yr){
  var D=DSG2.depth(S), z=function(y){ return face==='top'?y:D-y; }, fcF=null, zmin=1e9; S.conc.forEach(function(c){ var zc=z(c.y); if(zc<zmin){ zmin=zc; fcF=c.fc; } });
  var g=DSG.gam(fcF), blk=g*dn, C=0, Cm=0, Tb=0, Tbm=0, Tp=0, Tpm=0, sp=[];
  S.conc.forEach(function(c){ var z1=z(c.y)-c.h/2, z2=z(c.y)+c.h/2, hi=Math.min(z2,blk); if(hi>z1){ var f=-DSG.a2(c.fc)*c.fc*c.b*(hi-z1), zm=(z1+hi)/2, ym=face==='top'?zm:D-zm; C+=f; Cm+=f*(ym-yr); } });
  (S.bars||[]).forEach(function(b){ var e=-0.003*(dn-z(b.y))/dn, s=Math.max(-b.fsy,Math.min(b.fsy,b.E*e)); if(z(b.y)<blk){ var cc=DSG.conAt(S,b.y); if(cc&&s<0) s+=DSG.a2(cc.fc)*cc.fc; } Tb+=s*b.A; Tbm+=s*b.A*(b.y-yr); });
  (S.tend||[]).forEach(function(t){ var e=-0.003*(dn-z(t.y))/dn+t.epe, s=DSG.fp(t,e); Tp+=s*t.A; Tpm+=s*t.A*(t.y-yr); sp.push(s); });
  return {g:g, blk:blk, C:C/1e3, Cm:Cm/1e6, Tb:Tb/1e3, Tbm:Tbm/1e6, Tp:Tp/1e3, Tpm:Tpm/1e6, spMin:Math.min.apply(null,sp), spMax:Math.max.apply(null,sp)};
}
function dgWorked(i){
  var R=DG.res, o=R.lc[i], lc=DG.lc[i], B=o.B, I=o.X.info, f=function(v,d){ return anFmt(v,d===undefined?1:d); }, e=dgE, D=B.D, Q=o.Q, sh=o.sh;
  var L=function(sym,expr,sub,res,unit,ref){ return '<tr><td class="ws">'+sym+'</td><td class="we">= '+expr+(sub?'<br>= '+sub:'')+'</td><td class="wr">= <b>'+res+'</b> '+(unit||'')+'</td><td class="wref">'+(ref||'')+'</td></tr>'; };
  var h='<h3>'+lc.name+' &mdash; station s = '+f(lc.s,3)+' m &mdash; '+(o.solid?'solid end-block section':'open (span) section')+'</h3>';
  h+='<h4>Design actions</h4><table class="wk">'+L('M<sub>nc</sub>','&Sigma;&gamma;<sub>SLS</sub>M (Super-T alone)','',f(lc.Mnc,1),'kN·m')+L('M<sub>s</sub>*','&Sigma;&gamma;<sub>SLS</sub>M (composite)','',f(lc.Ms,1),'kN·m')
    +L('M*','&Sigma;&gamma;<sub>ULS</sub>M','',f(lc.Mu,1),'kN·m','AS 5100.2')+L('V*','|&Sigma;&gamma;<sub>ULS</sub>V|','',f(lc.Vu,1),'kN')+L('T*','|&Sigma;&gamma;<sub>ULS</sub>T|','',f(lc.Tu,1),'kN·m')+'</table>';
  if(lc.brk){ h+='<table class="dt dgt sm"><tr><th class="l">Action</th><th class="l">Acts on</th><th>M</th><th>V</th><th>T</th><th>&gamma;<sub>ULS,M</sub></th><th>&gamma;<sub>SLS</sub></th></tr>'+DG.ACT.map(function(a){ var v=lc.brk.a[a.k], g=lc.gam[a.k]; return '<tr><td class="l">'+a.n+'</td><td class="l">'+(a.st==='nc'?'Super-T':'composite')+'</td><td>'+f(v.M,0)+'</td><td>'+f(v.V,0)+'</td><td>'+f(v.T,0)+'</td><td>'+g.M+'</td><td>'+g.s+'</td></tr>'; }).join('')+'</table>'; }
  h+='<h4>Serviceability (Cl 8.6.2)</h4><table class="wk">'
    +L('P','&Sigma;&sigma;<sub>pe</sub>A<sub>p</sub>','',f(B.Pt,0),'kN','')
    +L('&epsilon;<sub>0,1</sub>, &kappa;<sub>1</sub>','stage 1 strain plane: strand force + M<sub>nc</sub> on the Super-T (concrete + bars)','',e(o.sg.e0)+', '+e(o.sg.k),'—, 1/mm')
    +L('&sigma;<sub>1,bot</sub>','E<sub>c</sub>(&epsilon;<sub>0,1</sub> + &kappa;<sub>1</sub>D)',f(I.Eg,0)+' &times; ('+e(o.sg.e0)+' + '+e(o.sg.k)+' &times; '+f(D,0)+')',f(o.g1bot,2),'MPa')
    +L('&epsilon;<sub>0,2</sub>, &kappa;<sub>2</sub>','stage 2 strain plane: M<sub>s</sub>* on the composite (uncracked)','',e(o.sv.s.e0)+', '+e(o.sv.s.k),'—, 1/mm')
    +L('&sigma;<sub>b</sub>','E<sub>c</sub>(&epsilon;<sub>1</sub> + &epsilon;<sub>2</sub>) at the soffit',f(I.Eg,0)+' &times; ('+e(o.sg.e0+o.sg.k*D)+' + '+e(o.sv.s.e0+o.sv.s.k*D)+')',f(o.sv.girBot,2),'MPa')
    +L('0.25&radic;f\'<sub>c</sub>','0.25 &times; &radic;'+I.fcg,'',f(B.fct25,2),'MPa',o.uncr?'&sigma;<sub>b</sub> &le; limit: uncracked':'cracked: check increments')
    +L('M<sub>dec</sub>','composite moment at which &sigma;<sub>b</sub> = 0','',f(o.Mdec,0),'kN·m')
    +L('M<sub>s,allow</sub>','largest M with &Delta;&sigma;<sub>s</sub> &le; '+lc.fscr+' MPa and &Delta;&sigma;<sub>p</sub> &le; '+lc.ftcr+' MPa (cracked section)','increments at M<sub>s,allow</sub>: '+f(o.qa.b,0)+' / '+f(o.qa.t,0)+' MPa',f(o.Mal,0),'kN·m','Table 8.6.2.1')
    +L('M<sub>s</sub>*/M<sub>s,allow</sub>',f(lc.Ms,0)+' / '+f(o.Mal,0),'',f(Math.max(0,o.uS),3),'',o.okS?'OK':'NG')+'</table>';
  var P=dgUltParts(o.Su,o.dn,o.face,o.yc);
  h+='<h4>Ultimate bending (Cl 8.1)</h4><table class="wk">'
    +L('&gamma;','0.97 &minus; 0.0025 f\'<sub>c</sub> (compression-face concrete), 0.67&ndash;0.85','',f(P.g,3),'','Cl 8.1.3')
    +L('d<sub>n</sub>','neutral-axis depth for C + T = N* = '+f(lc.Nu,0)+' kN','',f(o.dn,1),'mm')
    +L('C','&minus;&Sigma;&alpha;<sub>2</sub>f\'<sub>c</sub>b&middot;&Delta;z over &gamma;d<sub>n</sub> = '+f(P.blk,1)+' mm','',f(P.C,0),'kN')
    +L('T<sub>bars</sub>','&Sigma;&sigma;<sub>s</sub>A<sub>s</sub> (&plusmn;f<sub>sy</sub>, &epsilon; = &epsilon;<sub>cu</sub>(z &minus; d<sub>n</sub>)/d<sub>n</sub>)','',f(P.Tb,0),'kN')
    +L('T<sub>strands</sub>','&Sigma;&sigma;<sub>p</sub>A<sub>p</sub>, &sigma;<sub>p</sub> from the strand curve: '+f(P.spMin,0)+' &hellip; '+f(P.spMax,0)+' MPa','',f(P.Tp,0),'kN')
    +L('M<sub>u</sub>','&Sigma;F(y &minus; y<sub>c</sub>)',f(P.Cm,0)+' + '+f(P.Tbm,0)+' + '+f(P.Tpm,0),f(o.Mu,0),'kN·m','Cl 8.1')
    +L('k<sub>uo</sub>','d<sub>n</sub> / d<sub>o</sub>',f(o.dn,1)+' / '+f(o.dn/o.kuo,1),f(o.kuo,4),'',o.kuo<=0.36?'&le; 0.36 OK':'&gt; 0.36 NG')
    +L('&phi;','1.19 &minus; 13k<sub>uo</sub>/12, within 0.6&ndash;0.8','1.19 &minus; 13 &times; '+f(o.kuo,4)+' / 12 = '+f(1.19-13*o.kuo/12,3),f(o.phi,3),'','Table 2.3.2')
    +L('&phi;M<sub>u</sub>','&phi; &times; M<sub>u</sub>',f(o.phi,3)+' &times; '+f(o.Mu,0),f(o.phiMu,0),'kN·m','Cl 8.1.5')
    +L('M<sub>uo,min</sub>','1.2 M<sub>cr</sub>','1.2 &times; '+f(o.face==='top'?o.Mcr:o.McrH,0),f(o.Muomin,0),'kN·m',o.okMin?'M<sub>uo</sub> = '+f(o.Muo,0)+' OK':'NG')
    +L('M*/&phi;M<sub>u</sub>',f(lc.Mu,0)+' / '+f(o.phiMu,0),'',f(o.uB,3),'',o.uB<=1?'OK':'NG')+'</table>';
  if(sh){ var ct=sh.cot;
    h+='<h4>Shear and torsion (Cl 8.2, general method)</h4><table class="wk">'
      +L('d<sub>v</sub>','max(0.72D, 0.9d)','max(0.72 &times; '+f(D,0)+', 0.9 &times; '+f(o.dres,0)+')',f(o.dv,1),'mm','Cl 8.2.1.9')
      +L('b<sub>v</sub>','2 &times; min. web thickness','',f(Q.bv,1),'mm','Cl 8.2.1.5')
      +L('V<sub>eff</sub>','&radic;[(V* &minus; P<sub>v</sub>)&sup2; + (0.9T*u<sub>h</sub>/2A<sub>o</sub>)&sup2;]','&radic;['+f(lc.Vu,0)+'&sup2; + ('+f(sh.Teq/1e3,0)+')&sup2;]',f(sh.Veff/1e3,0),'kN')
      +L('&epsilon;<sub>x</sub>','[|M*|/d<sub>v</sub> + V<sub>eff</sub> + 0.5N* &minus; A<sub>pt</sub>&sigma;<sub>po</sub>] / '+sh.denUsed,'['+f(Math.abs(lc.Mu)*1e3/o.dv,0)+' + '+f(sh.Veff/1e3,0)+' + '+f(0.5*lc.Nu,0)+' &minus; '+f(Q.Apt*Q.spo/1e3,0)+'] kN / '+e((sh.ex<0?sh.den2:sh.den1)/1e3)+' kN',e(sh.ex),'','Cl 8.2.4.4')
      +L('&theta;<sub>v</sub>','29 + 7000&epsilon;<sub>x</sub>','29 + 7000 &times; '+e(sh.ex),f(sh.th,2),'&deg;','Cl 8.2.4.2')
      +L('k<sub>v</sub>','0.4/(1 + 1500&epsilon;<sub>x</sub>)'+(sh.minV?'':' &times; 1300/(1000 + k<sub>dg</sub>d<sub>v</sub>)'),'',f(sh.kv,4),'','Cl 8.2.4.2')
      +L('&phi;V<sub>uc</sub>','&phi;k<sub>v</sub>b<sub>v</sub>d<sub>v</sub>&radic;f\'<sub>c</sub>','0.7 &times; '+f(sh.kv,4)+' &times; '+f(Q.bv,1)+' &times; '+f(o.dv,1)+' &times; '+f(Math.min(Math.sqrt(Q.fc),8),3)+' / 1000',f(0.7*sh.Vuc/1e3,0),'kN','Cl 8.2.4.1')
      +L('&phi;V<sub>us</sub>','&phi;(A<sub>sv</sub>/s)f<sub>sy.f</sub>d<sub>v</sub>cot&theta;<sub>v</sub>','0.7 &times; '+f(sh.Asv,3)+' &times; '+Q.fsyf+' &times; '+f(o.dv,1)+' &times; '+f(ct,4)+' / 1000',f(0.7*sh.Vus/1e3,0),'kN','Cl 8.2.5.2')
      +L('&phi;V<sub>u.max</sub>','&phi;0.55f\'<sub>c</sub>b<sub>v</sub>d<sub>v</sub>cot&theta;/(1 + cot&sup2;&theta;)','0.7 &times; 0.55 &times; '+Q.fc+' &times; '+f(Q.bv,1)+' &times; '+f(o.dv,1)+' &times; '+f(ct,4)+' / '+f(1+ct*ct,4)+' / 1000',f(0.7*sh.Vumax/1e3,0),'kN','Cl 8.2.3.3')
      +L('&phi;T<sub>us</sub>','&phi;(A<sub>sw</sub>/s)f<sub>sy.f</sub>2A<sub>o</sub>cot&theta;<sub>v</sub>','0.7 &times; '+f(Q.AswS,3)+' &times; '+Q.fsyf+' &times; 2 &times; '+f(Q.Ao,0)+' &times; '+f(ct,4)+' / 10&#8310;',f(0.7*sh.Tus/1e6,0),'kN·m','Cl 8.2.5.6')
      +L('F<sub>td</sub> / F<sub>t,cap</sub>','longitudinal tension demand / A<sub>st</sub>f<sub>sy</sub> + A<sub>pt</sub>f<sub>pb</sub>','',f(sh.Ftd/1e3,0)+' / '+f(sh.Ftp/1e3,0),'kN','Cl 8.2.7')
      +L('Utilisations','crushing / shear / torsion / longitudinal','',[sh.uCr,sh.uV,sh.uT,sh.uL].map(function(x){ return f(x,3); }).join(' / '),'',sh.u<=1?'OK':'NG')
      +L('A<sub>sv,min</sub>/s','0.08&radic;f\'<sub>c</sub>b<sub>v</sub>/f<sub>sy.f</sub>','',f(sh.AsvMin*1000,1)+' &le; '+f(sh.Asv*1000,0),'mm&sup2;/m',sh.minV?'OK':'NG')
      +L('A<sub>sw,min</sub>/s','0.2y<sub>1</sub>/f<sub>sy.f</sub>','',f(sh.AswMin*1000,1)+' &le; '+f(Q.AswS*1000,0),'mm&sup2;/m',sh.minT?'OK':'NG')+'</table>';
  } else h+='<h4>Shear and torsion</h4><p class="flag">Not calculated &mdash; '+(o.shWhy||'inputs missing').replace(/<[^>]+>/g,'')+'.</p>';
  return h;
}
function dgReport(){
  if(!DG.res){ alert('Run the checks first (Fill load cases, then Run checks).'); return; }
  var css=[].map.call(document.querySelectorAll('style'),function(s){ return s.textContent; }).join('\n');
  var keepSel=DG.sel, plots=[], i;
  /* capture plots for every load case */
  for(i=0;i<DG.lc.length;i++){ DG.sel=i; dgSLSView(); dgULBView(); dgULVView();
    var caps=[]; ['dg_sls','dg_ulb','dg_ulv'].forEach(function(id){ [].forEach.call($(id).querySelectorAll('.dgcap'),function(c){ caps.push(c.outerHTML); }); });
    var nmv=$('dg_ulb').querySelector('.dg2 svg.dgplot'), vmv=$('dg_ulv').querySelector('.dg2 svg.dgplot');
    plots.push({caps:caps, nm:nmv?nmv.outerHTML+nmv.parentNode.querySelector('.dgleg').outerHTML:'', vm:vmv?vmv.outerHTML+vmv.parentNode.querySelector('.dgleg').outerHTML:''}); }
  DG.sel=keepSel; dgSLSView(); dgULBView(); dgULVView();
  var v0=DG.view; DG.view=null; dgDraw(); var secSvg=$('dg_svg').outerHTML.replace('class="dgsec"','class="dgsec rep"'); DG.view=v0; dgDraw();
  var Q=DG.sec, stat=function(id){ var n=$(id); return n?dgStatic(n):''; };
  var tbl=function(id){ var n=$(id); if(!n) return ''; var c=n.cloneNode(true); [].forEach.call(c.querySelectorAll('svg.dgplot,.dgleg,.dg2>div:last-child'),function(x){ x.remove(); }); var w=document.createElement('div'); w.appendChild(c); return dgStatic(w); };
  var now=new Date(), ds=now.toISOString().slice(0,10);
  var strRows=dgGroup(Q.strands,function(t){ return dgF(t.y,1); }).map(function(g){ var on=g.items.filter(function(t){ return t.on; }); return '<tr><td>'+g.key+'</td><td class="l">'+dgXs(on)+'</td><td>'+on.length+'</td><td>'+dgF(on.length?on.reduce(function(a,t){ return a+(t.sp||0); },0)/on.length:0,0)+'</td></tr>'; }).join('');
  var barRows=dgGroup(Q.gbars,function(b){ return dgF(b.y,1)+'|'+b.d; }).map(function(g){ return '<tr><td>'+dgF(g.items[0].y,1)+'</td><td>N'+g.items[0].d+'</td><td class="l">'+dgXs(g.items)+'</td><td>'+g.items.length+'</td></tr>'; }).join('');
  var dbRows=Q.dbars.map(function(r,k){ var ok=r.d>0&&r.s>0&&r.c!==null; return '<tr><td>'+(k+1)+'</td><td>'+r.pos+'</td><td>'+(ok?'N'+r.d+' @ '+r.s:'<span class="flag">missing</span>')+'</td><td>'+(ok?r.c:'—')+'</td><td>'+(ok?Math.max(1,Math.floor(Q.Wd/r.s)):'—')+'</td></tr>'; }).join('');
  var sec=[['1','Design summary',stat('dg_sum')],
    ['2','Section and reinforcement','<div class="fig">'+secSvg+'</div><p class="cap">Figure 1 &mdash; Composite section to scale ('+(dgEdited('shape')?'custom shape from '+Q.name:Q.name)+', deck '+Q.tD+' &times; '+dgF(Q.Wd,0)+' mm). Strands blue, bars green.</p>'+stat('dg_side')
      +'<h4>Strands (y above the Super-T soffit)</h4><table class="dt dgt"><tr><th>y (mm)</th><th class="l">x positions (mm)</th><th>No.</th><th>&sigma;<sub>pe</sub> (MPa)</th></tr>'+strRows+'</table><p class="cap">A<sub>p</sub> = '+Q.Ap+' mm&sup2;, &Oslash;'+Q.db+', MBL '+Q.mbl+' kN, E<sub>p</sub> = '+Q.Ep+' MPa; &sigma;<sub>pe</sub> after losses at '+Q.time+'.</p>'
      +'<h4>Super-T longitudinal bars</h4><table class="dt dgt"><tr><th>y (mm)</th><th>Bar</th><th class="l">x positions (mm)</th><th>No.</th></tr>'+barRows+'</table>'
      +'<h4>Deck longitudinal bars</h4><table class="dt dgt"><tr><th>Layer</th><th>Face</th><th>Bars</th><th>Cover (mm)</th><th>No. over width</th></tr>'+dbRows+'</table>'],
    ['3','Materials and derived parameters',stat('dg_gen')],['4','Load cases',stat('dg_lc')],['5','Serviceability &mdash; crack control (Cl 8.6.2)',tbl('dg_sls')],
    ['6','Ultimate &mdash; bending (Cl 8.1)',tbl('dg_ulb')],['7','Ultimate &mdash; shear and torsion (Cl 8.2)',stat('dg_det')+tbl('dg_ulv')],['7b','Along the girder (debonding, transfer, SLS and ULS envelopes)',DG.gird?stat('dg_gird'):'<p class="flag">Not run &mdash; press Run along-girder analysis in step 7.</p>'],
    ['8','Diagrams: transfer, SLS stages, crack control, moment–curvature, ULS section, interaction',DG.lc.map(function(lc,k){ var p=plots[k]; return '<h3>'+lc.name+'</h3>'+p.caps.join('')+'<div class="pgrid">'+(p.nm?'<div>'+p.nm+'<p class="cap">N&ndash;M interaction</p></div>':'')+(p.vm?'<div>'+p.vm+'<p class="cap">V&ndash;M interaction at T* = '+anFmt(lc.Tu,0)+' kN&middot;m</p></div>':'')+'</div>'; }).join('')],
    ['9','Worked calculations by load case',DG.lc.map(function(lc,k){ return '<div class="wkc">'+dgWorked(k)+'</div>'; }).join('')],
    ['10','Engine benchmark',stat('dg_bm')]];
  var html='<!doctype html><html><head><meta charset="utf-8"><title>BR13A Super-T design report — G'+(DG.gi+1)+'</title><style>'+css+'\n'
    +':root{--bg:#ffffff!important;--panel:#ffffff!important;--fg:#141d28!important;--muted:#5e6b7d!important;--line:#ccd4de!important;--rule2:#e3e8ee!important;--instr:#0E7C86!important;--instr-soft:rgba(14,124,134,.10)!important;--eng:#1d8a4e!important;--calc:#b7791f!important;--flag:#c0392b!important;--std:#6b5bb5!important;--dummy:#dfe5ec!important;color-scheme:light}'
    +'body{background:#fff!important;color:#141d28;font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:11.5px;margin:0}.page{max-width:1000px;margin:0 auto;padding:24px 32px 60px}'
    +'.rbar{position:sticky;top:0;background:#141d28;color:#fff;padding:8px 16px;display:flex;gap:12px;align-items:center;z-index:9}.rbar button{font:inherit;padding:5px 12px;border:0;border-radius:3px;background:#0E7C86;color:#fff;cursor:pointer}'
    +'.cover{border:1.5px solid #141d28;margin-bottom:22px}.cover h1{margin:0;padding:14px 16px;font-size:20px;border-bottom:1.5px solid #141d28}.cover table{width:100%;border-collapse:collapse}.cover td{border-top:1px solid #ccd4de;padding:6px 16px;font-size:12px}.cover td:first-child{width:28%;color:#5e6b7d}'
    +'h2{font-size:16px;margin:26px 0 8px;padding-bottom:4px;border-bottom:2px solid #141d28;break-after:avoid}h2 .n{display:inline-block;min-width:28px}h3{font-size:13.5px;margin:16px 0 6px;break-after:avoid}h4{font-size:12px;margin:12px 0 4px;color:#0E7C86;break-after:avoid}'
    +'.toc{columns:2;font-size:12px}.toc a{color:#141d28;text-decoration:none}.rv{font-variant-numeric:tabular-nums}.flag{color:#c0392b}.cap{font-size:10.5px;color:#5e6b7d;margin:4px 0 10px}'
    +'.fig svg{width:100%;height:auto;max-height:520px;border:1px solid #ccd4de}.dgsec.rep{cursor:default}.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pgrid svg{width:100%;height:auto}'
    +'table.wk{width:100%;border-collapse:collapse;margin:4px 0 8px;font-size:11.5px}table.wk td{border-bottom:1px solid #e3e8ee;padding:4px 6px;vertical-align:top}.ws{width:13%;font-weight:600}.we{width:55%;color:#2a3644}.wr{width:20%;white-space:nowrap;font-variant-numeric:tabular-nums}.wref{color:#5e6b7d;font-size:10.5px}'
    +'.wkc{break-inside:auto;border-top:1px solid #ccd4de;margin-top:10px}.dgx{overflow:visible}.dgt{font-size:10.5px}.dgnofx .fx{display:table-cell}table.sm{margin:4px 0 8px}.dgcards{grid-template-columns:repeat(3,1fr)}'
    +'.dgkpi{break-inside:avoid}section.rs{break-before:page}section.rs:first-of-type{break-before:auto}'
    +'@page{size:A4;margin:14mm 12mm 16mm}@media print{.rbar{display:none}.page{padding:0;max-width:none}a{color:inherit}}'
    +'</style></head><body><div class="rbar"><b>Calculation report</b><span>BR13A Super-T G'+(DG.gi+1)+'</span><button onclick="window.print()">Print / Save as PDF</button></div><div class="page">'
    +'<div class="cover"><h1>Super-T girder design check &mdash; AS 5100.5:2017</h1><table>'
    +'<tr><td>Project</td><td>BR13A bridge</td></tr><tr><td>Element</td><td>Girder G'+(DG.gi+1)+' &mdash; '+(dgEdited('shape')?'custom shape from '+Q.name:Q.name)+' + '+Q.tD+' mm deck</td></tr>'
    +'<tr><td>Load cases</td><td>'+DG.lc.map(function(l){ return l.name; }).join(', ')+'</td></tr><tr><td>Prestress</td><td>After losses at '+Q.time+' (Hog Calculator tab)</td></tr>'
    +'<tr><td>Method</td><td>Fibre-section strain compatibility; staged SLS (Super-T alone, then composite); rectangular stress block at ULS; Cl 8.2 general method for shear and torsion.</td></tr>'
    +'<tr><td>Date</td><td>'+ds+'</td></tr><tr><td>Prepared / checked</td><td>&nbsp;</td></tr>'
    +'<tr><td>Data tags</td><td><span class="tg tD">Direct</span> from drawings / model &nbsp; <span class="tg tC">Calculated</span> &nbsp; <span class="tg tS">Standard &mdash; verify</span> &nbsp; <span class="tg tU">Input (user)</span> &nbsp; <span class="tg" style="color:#c0392b">Missing &mdash; Flagged</span></td></tr></table></div>'
    +'<div class="toc"><b>Contents</b><br>'+sec.map(function(s){ return '<a href="#s'+s[0]+'">'+s[0]+'. '+s[1]+'</a>'; }).join('<br>')+'</div>'
    +sec.map(function(s){ return '<section class="rs" id="s'+s[0]+'"><h2><span class="n">'+s[0]+'</span>'+s[1]+'</h2>'+s[2]+'</section>'; }).join('')
    +'<p class="cap" style="margin-top:30px">Clause numbers refer to AS 5100.5:2017 and AS 5100.2:2017 for navigation; the text of the standards is not reproduced. Values tagged Standard &mdash; verify, and every Missing &mdash; Flagged item, must be confirmed before this check is relied on.</p></div></body></html>';
  var blob=new Blob([html],{type:'text/html'}), url=URL.createObjectURL(blob), w=null;
  try{ w=window.open(url,'_blank'); }catch(e){}
  if(!w){ var a=document.createElement('a'); a.href=url; a.download='BR13A_SuperT_G'+(DG.gi+1)+'_report.html'; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },500); }
  DG.lastReport=html; return html;
}
