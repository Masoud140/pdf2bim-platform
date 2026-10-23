/* ===== v36: Properties → Girder definition — the single place where the girder is defined (ASBD "Define" list):
   girder & supports, section shape and deck, sections along the girder, tendons, reinforcement, fitments.
   The Hog analysis and the AS 5100.5 design checks both read it; every change re-runs what depends on it. ===== */
(function(){
  if(typeof TABS==='undefined'||typeof TAB_GROUPS==='undefined') return;
  var $=function(i){ return document.getElementById(i); };
  var sec=$('paneSec'); if(!sec||!$('hog-root')) return;
  var DEF=[['gird','Girder &amp; supports'],['shape','Section shape &amp; deck'],['zone','Sections along girder'],['tend','Tendons'],['reinf','Reinforcement'],['fit','Shear &amp; torsion fitments']];
  var pane=document.createElement('div'); pane.id='paneSRF'; pane.style.display='none'; sec.parentNode.insertBefore(pane,sec.nextSibling);
  pane.innerHTML='<div class="srfwrap">'
    +'<div class="srfhead"><h2>Girder definition</h2><p class="ref">Everything that defines the Super-T girder, in one place. The Hog Calculator (losses, camber, transfer) and the Super-T design checks (AS 5100.5) both use it; every change re-runs the analyses that depend on it.</p></div>'
    +'<div class="srfdef" role="tablist"><span class="srfdl">Define</span>'+DEF.map(function(d,i){ return '<button class="srfdb" data-def="'+d[0]+'" role="tab">'+(i+1)+'. '+d[1]+'</button>'; }).join('')+'<span class="ref" id="srf_st"></span></div>'
    +'<div class="srfp" data-p="gird"><section class="card"><h3>Girder, bearings, supports at transfer, transmission and development length</h3><div id="srf_gird"></div></section></div>'
    +'<div class="srfp" data-p="shape"><section class="card"><h3>Deck slab</h3><div id="srf_deck"></div></section><section class="card"><h3>Super-T section</h3><div id="srf_shape"></div></section></div>'
    +'<div class="srfp" data-p="zone"><section class="card"><h3>Sections along the girder</h3><div id="srf_zone"></div></section></div>'
    +'<div class="srfp" data-p="tend"><section class="card"><h3>Pretensioned strands and debonding</h3><p class="ref" id="srf_sec"></p><div class="hogx" id="srf_cs"></div></section></div>'
    +'<div class="srfp" data-p="reinf"><div class="srfgrid"><section class="card"><h3>Super-T longitudinal reinforcement</h3><p class="ref">Used by the Hog detailed method and the design checks.</p><div class="hogx" id="srf_cb"></div></section>'
      +'<section class="card" id="srf_cd"><h3>Deck longitudinal reinforcement</h3><p class="ref">Design checks only (the Hog analysis has no deck bars).</p><div id="srf_dbed"></div></section></div></div>'
    +'<div class="srfp" data-p="fit"><section class="card" id="srf_cf"><h3>Shear and torsion fitments (open span and solid section)</h3><div id="dg_det"></div></section></div>'
    +'</div>';
  /* move the Hog strand / bar editors here (their ids and handlers move with them) */
  var cs=$('srf_cs'), cb=$('srf_cb'), mv=function(el,to){ if(el) to.appendChild(el); };
  var md=document.querySelector('input[name=hog_md]'); md=md?md.closest('p'):null;
  mv($('hog_svgw'),cs); mv(md,cs); mv($('hog_sinfo'),cs); mv($('hog_dbleg'),cs); mv($('hog_layw'),cs); mv($('hog_custw'),cs);
  var bt=$('hog_bartxt');
  if(bt){ var h3=bt.previousElementSibling&&bt.previousElementSibling.previousElementSibling, pr=bt.previousElementSibling, ap=$('hog_applyBar')?$('hog_applyBar').closest('p'):null;
    if(pr&&pr.tagName==='P') mv(pr,cb); mv(bt,cb); mv(ap,cb); if(h3&&h3.tagName==='H3'&&/Longitudinal reinforcement/.test(h3.textContent)) h3.remove(); }
  /* Hog card keeps the section choice and points here */
  var hc=$('hog_sec')?$('hog_sec').closest('.card'):null;
  if(hc){ var t=hc.querySelector('h2'); if(t) t.textContent='Section'; var pl=$('hog_plk')?$('hog_plk').closest('label'):null;
    var n=document.createElement('p'); n.className='ref'; n.innerHTML='Strand pattern, debonding and reinforcement: <a href="#" data-go="tend">Properties &rarr; Girder definition</a>.';
    (pl&&pl.parentNode===hc)?hc.insertBefore(n,pl.nextSibling):hc.appendChild(n); }
  document.addEventListener('click',function(e){ var a=e.target.closest&&e.target.closest('[data-go]'); if(!a) return; e.preventDefault(); srfOpen(a.getAttribute('data-go')); });
  /* tab registration: Properties → Materials, Section designer, Girder definition, Member Properties */
  TABS.push({id:'srf',label:'Girder definition',pane:'paneSRF',build:function(){ srfBuild(); },draw:function(){}});
  var G=TAB_GROUPS.filter(function(g){ return g.g==='prop'; })[0]; if(G){ var i=G.ids.indexOf('sec'); G.ids.splice(i>=0?i+1:G.ids.length,0,'srf'); }
  var act=typeof ACTIVE!=='undefined'?ACTIVE:null; initTabs(); if(act) try{ showTab(act); }catch(e){}

  var cur='tend'; try{ cur=localStorage.getItem('srf_def')||'tend'; }catch(e){}
  function dgReady(){ try{ if(!DG.sec) dgSecInit(); return !!DG.sec; }catch(e){ return false; } }
  /* render one of the design-side editors (dgEditor sub-tabs) into a container of this tab */
  function edInto(id,sub){ var b=$(id); if(!b) return; if(!dgReady()){ b.innerHTML='<p class="ref">Available once the Hog section is a Super-T.</p>'; return; }
    var keep=DG.sub; DG._edT=id; DG.sub=sub; try{ dgEditor(); }catch(e){ b.innerHTML='<p class="ref bbflag">'+e.message+'</p>'; } finally{ DG._edT=null; DG.sub=keep; } }
  function srfDet(){ if(!dgReady()) return; try{ var X=dgSection(), B=dgBase(X); dgDetView(X,B); }catch(e){ try{ dgDetView(null,null); }catch(e2){} } }
  function srfInfo(){ var e=$('srf_sec'), s=null; try{ s=HOG_API.snap(); }catch(x){} if(!e||!s) return;
    var on=s.S.filter(function(t){ return t.on; }), db=on.filter(function(t){ return t.d||t.d2; }).length;
    e.textContent='Section: '+s.cur+' (Hog Calculator tab). '+on.length+' strands on, '+db+' debonded; '+s.B.length+' Super-T bars.'; }
  window.srfRender=function(k){ k=k||cur;
    if(k==='gird') edInto('srf_gird','deb'); if(k==='shape'){ edInto('srf_shape','shape'); edInto('srf_deck','deck'); } if(k==='zone') edInto('srf_zone','zone');
    if(k==='tend') srfInfo(); if(k==='reinf') edInto('srf_dbed','db'); if(k==='fit') srfDet(); };
  window.srfOpen=function(k){ if(k) cur=k; try{ localStorage.setItem('srf_def',cur); }catch(e){}
    if(typeof ACTIVE==='undefined'||ACTIVE!=='srf'){ showTab('srf'); return; } srfShow(); };
  function srfShow(){ [].forEach.call(pane.querySelectorAll('.srfdb'),function(b){ var on=b.getAttribute('data-def')===cur; b.classList.toggle('on',on); b.setAttribute('aria-selected',on); });
    [].forEach.call(pane.querySelectorAll('.srfp'),function(p){ p.hidden=p.getAttribute('data-p')!==cur; }); srfRender(cur); }
  window.srfBuild=function(){ dgReady(); srfShow(); };
  [].forEach.call(pane.querySelectorAll('.srfdb'),function(b){ b.onclick=function(){ cur=b.getAttribute('data-def'); try{ localStorage.setItem('srf_def',cur); }catch(e){} srfShow(); }; });

  /* strands or Super-T bars changed: re-run the Hog analysis, then rebuild the design section from it */
  var tm=null;
  window.srfSync=function(){ clearTimeout(tm); tm=setTimeout(function(){ var st=$('srf_st'); if(st) st.textContent='Updating the Hog analysis and the design section…';
    try{ HOG_API.calc(); }catch(e){}
    try{ if(DG.sec){ var had=!!(DG.res||DG.gird); dgSecInit(true,true); DG.res=null; DG.gird=null; DG.view=null; DG.poiCache=null;
        if($('paneDG')&&$('paneDG').dataset.built){ dgAll(); if(had) dgRun(true); else if(typeof dgAutoRun==='function') dgAutoRun(); } } }catch(e){ if(st) st.textContent='Design section not updated: '+e.message; return; }
    srfInfo(); if(st) st.textContent='Hog analysis and design section updated '+new Date().toTimeString().slice(0,8)+'.'; },350); };
  $('hog-root').addEventListener('change',function(){ srfSync(); });
  [cs,cb].forEach(function(c){ c.addEventListener('click',function(ev){ var t=ev.target; if(t.tagName==='BUTTON'||t.tagName==='circle') srfSync(); });
    c.addEventListener('change',function(ev){ if(ev.target.name!=='hog_md') srfSync(); }); });
  /* design-only definitions (girder, shape, deck, zones, deck bars, fitments): after the edit is handled, re-run the checks if they had been run, and redraw this panel */
  var had=false, rt=null;
  ['gird','shape','zone','reinf','fit'].forEach(function(k){ var p=pane.querySelector('.srfp[data-p="'+k+'"]'); if(!p) return;
    var pre=function(ev){ if(k==='reinf'&&!ev.target.closest('#srf_cd')) return; had=had||!!(DG.res||DG.gird); };
    var post=function(ev){ if(k==='reinf'&&!ev.target.closest('#srf_cd')) return; if(ev.type==='click'&&ev.target.tagName!=='BUTTON') return;
      clearTimeout(rt); rt=setTimeout(function(){ var h=had; had=false; srfRender(k); var st=$('srf_st');
        if(h&&$('paneDG')&&$('paneDG').dataset.built&&!DG.res){ dgRun(true); if(st) st.textContent='Design checks re-run '+new Date().toTimeString().slice(0,8)+'.'; } },120); };
    p.addEventListener('change',pre,true); p.addEventListener('click',pre,true); p.addEventListener('change',post); p.addEventListener('click',post); });
})();
/* design UI pieces used from the definition tab before the Design tab has been opened */
(function(){ var built=function(){ var p=document.getElementById('paneDG'); return p&&p.dataset.built; };
  if(typeof dgAll==='function'){ var a0=dgAll; dgAll=function(){ if(!built()){ DG.res=null; return; } return a0.apply(this,arguments); }; }
  if(typeof dgAutoRun==='function'){ var r0=dgAutoRun; dgAutoRun=function(){ if(!built()) return; return r0.apply(this,arguments); }; }
  if(typeof dgSec1Only==='function'){ var s0=dgSec1Only; dgSec1Only=function(){ if(!built()){ DG.res=null; return; } return s0.apply(this,arguments); }; }
  if(typeof dgGirdView==='function'){ var g0=dgGirdView; dgGirdView=function(){ if(!built()) return; return g0.apply(this,arguments); }; } })();
