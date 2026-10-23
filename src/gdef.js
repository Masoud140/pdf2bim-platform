/* ===== v45: ONE Super-T definition (Properties → Girder definition → Section shape).
   The drawing-based Section designer shape is the master. From it:
     - the Hog Calculator gets the section "Girder definition" (half outline, flange width) and uses it,
     - the design section follows the Hog section (as before), so the design uses the drawing shape,
     - earth pressure and wind read the depth from it (no hard-coded 1.515).
   Flange widths per girder along its length (straight between bearings) come from the model geometry:
     inner flange edge = half the distance to the next girder − half the gap between flanges,
     outer flange edge of an edge girder = deck edge − setback (engineer: setback 0, the flange lines up with the deck edge). ===== */
var GD={name:'Girder definition', gap:null, setback:0, ready:false, busy:false};
function gdDepth(){ try{ return secGeom().D/1000; }catch(e){ return 1.515; } }
/* default gap between adjacent precast flanges: girder spacing − flange width (dashboard parameters) */
function gdGapDefault(){ try{ return Math.round((P.gspac-P.flange)*1000*10)/10; }catch(e){ return 30; } }
function gdGap(){ return GD.gap===null||!isFinite(GD.gap)?gdGapDefault():GD.gap; }
/* Hog half outline (12 points, x from the centreline, y up from the soffit) in the Hog "895 mm half flange" frame; the Hog flange width input sets the real width */
function gdHogR(){ var g=secGeom(), D=g.D, bw=g.bw, ch=g.ch, S=g.S, th=g.th, yfu=g.yfu, fW=g.fW, fD=g.fD, r=g.r, yf=g.yf, d2=g.d2;
  var xo=function(y){ return bw/2+y/S; }, xi=function(y){ return xo(y)-th; }, xr=xi(D-r), f=function(v){ return Math.round(v*1000)/1000; };
  return [[bw/2-ch,0],[xo(ch),ch],[xo(yfu-fD),yfu-fD],[xo(yfu)+fW,yfu],[894,yfu],[895,yfu+1],[895,D],[xr+r,D],[xr+r,D-r],[xr,D-r],[xi(yf),yf],[0,d2]].map(function(p){ return [f(p[0]),f(p[1])]; }); }
/* standard strand / bar layout of the nearest TfNSW product (placeholder until the girder drawings give the real pattern) */
function gdLike(){ try{ var D=STD[SEC.type].D; return {750:'750 Super-T',1000:'1000 Super-T',1200:'1200 Super-T',1500:'1500 Super-T',1800:'1825 Super-T'}[D]||null; }catch(e){ return null; } }
function gdHogSec(){ var g=secGeom(); return {t:'T', H:Math.round(g.D*1000)/1000, R:gdHogR(), src:'Girder definition (Section designer, drawing values)'}; }
/* push the definition into the Hog Calculator and the design section */
function gdSync(quiet){ if(GD.busy||typeof HOG_API==='undefined'||!HOG_API.addSec) return; GD.busy=true;
  try{ var g=secGeom(), fw=document.getElementById('hog_fw');
    HOG_API.addSec(GD.name, gdHogSec());
    if(HOG_API.cur()!==GD.name) HOG_API.pick(GD.name, gdLike());
    if(fw&&Math.abs(+fw.value-g.W)>0.05){ fw.value=(Math.round(g.W*10)/10); }
    HOG_API.addSec(GD.name, gdHogSec());   /* refresh the Hog section properties with the flange width */
    try{ HOG_API.calc(); }catch(e){}
    if(typeof DG!=='undefined'&&DG.sec){ dgSecInit(true,true); var s=HOG_API.snap(); if(s.R){ DG.sec.P=dgParFromR(s.R); DG.sec.name=s.cur; if(DG.sec.orig){ DG.sec.orig.P=dgParFromR(s.R); DG.sec.orig.name=s.cur; } } try{ dgSyncR(); }catch(e){} DG.res=null; DG.gird=null; DG.poiCache=null; DG.ver=(DG.ver||0)+1; }
    GD.ready=true;
  }catch(e){ console.error('girder definition sync',e); } finally{ GD.busy=false; }
  var st=document.getElementById('srf_st'); if(st&&!quiet) st.textContent='Girder definition applied to the Hog analysis and the design section '+new Date().toTimeString().slice(0,8)+'.'; }
/* Section designer → Girder definition → Section shape (one place); the separate tab goes */
(function(){
  var moveSec=function(){ var ps=document.getElementById('paneSec'), host=document.getElementById('srf_shape'); if(!ps||!host) return;
    if(ps.parentNode!==host){ host.innerHTML=''; host.appendChild(ps); }
    ps.style.display=''; if(!ps.dataset.gd){ try{ secPanel(); }catch(e){} ps.dataset.gd=1; ps.addEventListener('change',function(){ clearTimeout(GD.t); GD.t=setTimeout(function(){ gdSync(); srfRenderSafe('shape'); },250); }); }
    try{ secRender(); }catch(e){} };
  window.srfRenderSafe=function(k){ try{ var c=document.querySelector('#gd_note'); if(c) c.innerHTML=gdNoteHTML(); }catch(e){} };
  if(typeof window.srfRender==='function'){ var r0=window.srfRender; window.srfRender=function(k){ var kk=k||(document.querySelector('.srfdb.on')||{getAttribute:function(){ return ''; }}).getAttribute('data-def');
      if(kk==='shape'){ var host=document.getElementById('srf_shape'), keep=document.getElementById('paneSec'); if(keep&&host&&keep.parentNode===host) host.removeChild(keep); r0.apply(this,arguments); moveSec(); var sec=host.closest('.card'), n=document.getElementById('gd_note'); if(!n){ n=document.createElement('div'); n.id='gd_note'; sec.insertBefore(n,host); } n.innerHTML=gdNoteHTML(); return; }
      return r0.apply(this,arguments); }; }
  /* the Section designer tab is now part of Girder definition */
  try{ var G=TAB_GROUPS.filter(function(g){ return g.g==='prop'; })[0]; if(G){ var i=G.ids.indexOf('sec'); if(i>=0) G.ids.splice(i,1); } var act=typeof ACTIVE!=='undefined'?ACTIVE:null; initTabs(); if(act&&act!=='sec') try{ showTab(act); }catch(e){} }catch(e){}
  /* first sync once the Hog Calculator has run */
  var go=function(){ try{ gdSync(true); }catch(e){} }; if(document.readyState==='complete') setTimeout(go,400); else window.addEventListener('load',function(){ setTimeout(go,400); });
  /* the design-side shape editor no longer edits the shape: show where it is defined */
  if(typeof window.srfOpen==='function'){ document.addEventListener('click',function(e){ var a=e.target.closest&&e.target.closest('[data-gd]'); if(!a) return; e.preventDefault(); srfOpen('shape'); }); }
})();
function gdNoteHTML(){ var g; try{ g=secGeom(); }catch(e){ return ''; } var f=function(v,d){ return (+v).toFixed(d===undefined?0:d); };
  return '<div class="bbnote" style="margin-bottom:8px"><b>This is the only place the Super-T is defined.</b> The Hog Calculator (section "'+GD.name+'"), the Super-T design checks, earth pressure and wind all use it. Depth '+f(g.D)+' mm, top flange '+f(g.W,1)+' mm (constant width here; per girder and along its length see Sections along girder), A '+f(g.A)+' mm², centroid '+f(g.yb,1)+' mm above the soffit. '
   +(GD.ready?'<span class="tg tC">Applied</span>':'<span class="bbflag">not applied yet</span>')+'</div>'; }
/* ---- flange widths per girder along its length (model geometry) ---- */
function gwFlange(j,t){ var w=gwWidth(j,t); if(!w) return null; var gap=gdGap(), sb=GD.setback||0;
  var L=w.edge==='L'?w.L-sb:w.L-gap/2, R=w.edge==='R'?w.R-sb:w.R-gap/2; return {L:L, R:R, W:L+R, deckW:w.W, edge:w.edge}; }
(function(){ if(typeof gwCard!=='function') return; var c0=gwCard;
  gwCard=function(){ var h=c0.apply(this,arguments), Z; try{ Z=gwGeom(); }catch(e){ return h; } var f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
    var gd=gdGapDefault(), t='<section class="card" id="gf_card"><h3>Super-T top flange width along each girder</h3><p class="ref">The precast top flange of each girder, measured square to the girder at each point (girders straight between their bearings): inner edges stop half the gap short of the half-way line to the next girder; the outer edge of an edge girder follows the deck edge. <span class="tg tC">Calculated</span> from the model geometry and the two inputs below.</p>'
      +'<table class="dt wdt" style="max-width:1100px"><tr><th class="l">Input</th><th>Value</th><th class="l">Source</th></tr>'
      +'<tr><td class="l">Gap between adjacent precast flanges (mm)</td><td><input class="f gfin" data-k="gap" value="'+(GD.gap===null?'':GD.gap)+'" placeholder="'+gd+'" style="width:70px"></td><td class="l">'+(GD.gap===null?'<span class="tg tC">Calculated</span> <b>'+gd+' mm used</b> = girder spacing '+f(P.gspac*1000,1)+' − flange width '+f(P.flange*1000,1)+' (dashboard parameters). Change it here if the girder drawings show another gap.':'<span class="tg tU">Input (user)</span> <b>'+GD.gap+' mm used</b>; blank returns to the calculated '+gd+' mm')+'</td></tr>'
      +'<tr><td class="l">Outer flange edge of the edge girders: setback from the deck edge (mm)</td><td><input class="f gfin" data-k="setback" value="'+GD.setback+'" style="width:70px"></td><td class="l"><span class="tg tU">Input (user)</span> <b>'+GD.setback+' mm used</b> — engineer instruction 2026-10-23: the outer flange edge of G1 and G4 lines up exactly with the deck edge</td></tr></table>'
      +'<div class="stfwrap" style="margin-top:8px"><table class="dt"><tr><th>Girder</th><th>Side</th>'+GW_T.map(function(x){ return '<th>'+x.toFixed(1)+'</th>'; }).join('')+'</tr>';
    Z.G.forEach(function(g,j){ var rows=[['left (−offset)','L'],['right (+offset)','R'],['total','W']];
      rows.forEach(function(r,ri){ t+='<tr>'+(ri===0?'<td rowspan="3"><b>G'+g.k+'</b>'+(g.k===(DG.gi||0)+1?' ◀':'')+'</td>':'')+'<td class="l">'+r[0]+'</td>'+GW_T.map(function(x){ var q=gwFlange(j,x); return '<td'+(r[1]==='W'?' style="font-weight:600"':'')+'>'+(q?f(q[r[1]],0):'—')+'</td>'; }).join('')+'</tr>'; }); });
    t+='</table></div><p class="ref">Half-widths from the girder centreline (mm), at tenths of the bearing-to-bearing length. Interior girders keep (spacing − gap) where the girders are parallel; the edge girders flare with the deck edge. Used in the next step for the model section properties and the design stations.</p></section>';
    return h+t; };
  document.addEventListener('change',function(e){ var el=e.target; if(!el.classList||!el.classList.contains('gfin')) return; var k=el.getAttribute('data-k'), v=el.value.trim();
    if(k==='gap') GD.gap=(v===''||!isFinite(+v))?null:+v; if(k==='setback') GD.setback=isFinite(+v)?+v:0;
    try{ DG.res=null; DG.gird=null; DG.poiCache=null; }catch(x){} srfRender('zone'); },true);
})();
