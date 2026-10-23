/* ===== v35: open / solid section zones along the girder (ASBD-style). Zones are solid stretches [a, b] in metres from the
   left girder end; everything else is the open (span) section. Replaces the single symmetric solid end-block length. ===== */
var DG_ZCOL={open:'rgba(76,160,90,.42)', solid:'rgba(214,150,80,.55)', deck:'rgba(120,175,215,.55)'};
function dgZones(){ var Q=DG.sec; if(!Q) return []; if(!Q.zones){ Q.zones=[];
    if(Q.solidLen>0){ var G=dgGirdPar(), L=Q.solidLen/1000; Q.zones=[{a:0,b:L}]; if(G&&G.Lg) Q.zones.push({a:G.Lg-L,b:G.Lg}); } }
  Q.solidLen=null; return Q.zones; }
function dgZoneClean(Lg){ var Z=dgZones().filter(function(z){ return isFinite(z.a)&&isFinite(z.b); }).map(function(z){ var a=Math.max(0,Math.min(z.a,z.b)), b=Math.max(z.a,z.b); if(Lg) b=Math.min(b,Lg); return {a:+a.toFixed(4),b:+b.toFixed(4)}; }).filter(function(z){ return z.b>z.a; }).sort(function(p,q){ return p.a-q.a; });
  var out=[]; Z.forEach(function(z){ var l=out[out.length-1]; if(l&&z.a<=l.b+1e-6) l.b=Math.max(l.b,z.b); else out.push(z); }); DG.sec.zones=out; return out; }
function dgSolidAt(x,G){ return dgZones().some(function(z){ return x>=z.a-1e-6&&x<=z.b+1e-6; }); }
function dgLCType(lc){ if(lc.sec==='solid') return true; if(lc.sec==='open') return false; if(lc.s===null||lc.s===undefined) return false; return dgSolidAt(lc.s,dgGirdPar()); }
/* stations: zone boundaries on both sides so the step in section shows in the along-girder results */
var dgGirdStations11=dgGirdStations; dgGirdStations=function(G){ var xs=dgGirdStations11(G), set={}; xs.forEach(function(v){ set[v.toFixed(3)]=v; });
  dgZones().forEach(function(z){ [z.a,z.b].forEach(function(v){ [v-0.001,v,v+0.001].forEach(function(u){ if(u>=0&&u<=G.Lg) set[u.toFixed(3)]=u; }); }); });
  return Object.keys(set).map(function(k){ return set[k]; }).sort(function(a,b){ return a-b; }); };
var dgPOIs11=dgPOIs; dgPOIs=function(){ var out=dgPOIs11(); if(!DG.sec) return out; var G=dgGirdPar(); if(!G.Lg) return out; var lim=DG.an.sym?G.Lg/2+1e-6:G.Lg+1e-6;
  dgZones().forEach(function(z,i){ [[z.a,'Solid zone '+(i+1)+' start'],[z.b,'Solid zone '+(i+1)+' end']].forEach(function(q){ if(q[0]>1e-6&&q[0]<G.Lg-1e-6&&q[0]<=lim) out.push({x:q[0],lab:q[1],kind:'auto'}); }); });
  out.sort(function(a,b){ return a.x-b.x||(a.kind==='lc'?1:-1); });
  var res=[]; out.forEach(function(p){ var q=res[res.length-1]; if(q&&q.kind===p.kind&&Math.abs(q.x-p.x)<0.0005){ if(q.lab.indexOf(p.lab)<0) q.lab+=' · '+p.lab; return; } res.push(p); });
  res.forEach(function(p,k){ p.n=k+1; p.key=p.kind+':'+p.x.toFixed(4)+':'+(p.i===undefined?'':p.i); }); return res; };

/* ---- elevation in the style of ASBD: deck, open (green) and solid (tan) zones, bearings, section thumbnails ---- */
function dgZoneSvg(G){ var Q=DG.sec, Lg=G.Lg||0, Z=dgZones(), W=1000, Ls=150, Rr=14, T=16, hd=9, hg=52, X=function(x){ return Ls+x*(W-Ls-Rr)/Lg; }, yb=T+hd+hg, g='';
  if(!(Lg>0)) return '<div class="bbnote bbflag">Girder length not available.</div>';
  var thumb=function(R,x0,lab){ var P=dgPoly(R), H=dgH(R), w=Math.max.apply(null,P.map(function(p){ return Math.abs(p[0]); })), s=Math.min(54/H,30/w), o='<g transform="translate('+x0+','+(yb+4)+')"><path d="M'+P.map(function(p){ return (p[0]*s).toFixed(1)+','+(-p[1]*s).toFixed(1); }).join('L')+'Z" fill="'+(lab==='open'?DG_ZCOL.open:DG_ZCOL.solid)+'" stroke="var(--fg)" stroke-width=".7"/><rect x="'+(-w*s*1.18)+'" y="'+(-H*s-5)+'" width="'+(w*s*2.36)+'" height="4" fill="'+DG_ZCOL.deck+'" stroke="var(--fg)" stroke-width=".5"/><text x="0" y="14" font-size="10" text-anchor="middle" fill="var(--muted)">'+lab+'</text></g>'; return o; };
  g+=thumb(Q.R,38,'open')+thumb(Q.Rs||Q.R,104,'solid');
  g+='<rect x="'+X(0)+'" y="'+T+'" width="'+(X(Lg)-X(0))+'" height="'+hd+'" fill="'+DG_ZCOL.deck+'" stroke="var(--fg)" stroke-width=".7"/>';
  g+='<rect x="'+X(0)+'" y="'+(T+hd)+'" width="'+(X(Lg)-X(0))+'" height="'+hg+'" fill="'+DG_ZCOL.open+'" stroke="var(--fg)" stroke-width=".8"/>';
  Z.forEach(function(z){ g+='<rect x="'+X(z.a)+'" y="'+(T+hd)+'" width="'+(X(z.b)-X(z.a))+'" height="'+hg+'" fill="'+DG_ZCOL.solid+'" stroke="var(--fg)" stroke-width=".8"/>'; });
  var dims={0:1}; dims[Lg.toFixed(3)]=1; Z.forEach(function(z){ dims[z.a.toFixed(3)]=1; dims[z.b.toFixed(3)]=1; });
  var ds=Object.keys(dims).map(Number).sort(function(a,b){ return a-b; }), yd=yb+30;
  ds.forEach(function(x){ g+='<line x1="'+X(x)+'" x2="'+X(x)+'" y1="'+(yb+2)+'" y2="'+(yd+4)+'" stroke="var(--muted)" stroke-width=".6"/>'; });
  for(var i=1;i<ds.length;i++){ var a=ds[i-1], b=ds[i], xm=(X(a)+X(b))/2; g+='<line x1="'+X(a)+'" x2="'+X(b)+'" y1="'+yd+'" y2="'+yd+'" stroke="var(--muted)" stroke-width=".6"/>'; if(X(b)-X(a)>34) g+='<text x="'+xm+'" y="'+(yd-3)+'" font-size="10" text-anchor="middle" fill="var(--fg)">'+(b-a).toFixed(3)+'</text>'; }
  var tri=function(x){ return '<path d="M'+X(x)+','+yb+' l-6,10 h12z" fill="#d4a017" stroke="var(--fg)" stroke-width=".6"/>'; };
  if(G.a!==null&&isFinite(G.a)){ g+=tri(G.a); if(G.a2!==null&&isFinite(G.a2)) g+=tri(Lg-G.a2); }
  g+='<text x="'+X(0)+'" y="'+(yd+17)+'" font-size="10" fill="var(--muted)">0</text><text x="'+X(Lg)+'" y="'+(yd+17)+'" font-size="10" text-anchor="end" fill="var(--muted)">'+Lg.toFixed(3)+' m</text>';
  return '<svg viewBox="0 0 '+W+' '+(yd+24)+'" class="dgdiag" style="max-width:none;width:100%" role="img" aria-label="Open and solid zones along the girder">'+g+'</svg>'
    +'<div class="dgleg"><span><i style="display:inline-block;width:16px;height:10px;background:'+DG_ZCOL.open+';border:1px solid var(--fg)"></i>open (span) section</span><span><i style="display:inline-block;width:16px;height:10px;background:'+DG_ZCOL.solid+';border:1px solid var(--fg)"></i>solid section (trough filled)</span><span><i style="display:inline-block;width:16px;height:6px;background:'+DG_ZCOL.deck+';border:1px solid var(--fg)"></i>deck</span><span>&#9650; bearing; dimensions in m</span></div>'; }
function dgZoneHTML(){ var G=dgGirdPar(), Z=dgZoneClean(G.Lg), inp=function(k,v,w){ return '<input class="f dgzn" data-k="'+k+'" value="'+(v===null||v===undefined?'':v)+'" style="width:'+(w||80)+'px">'; };
  var h='<div class="sdh">Open and solid section along the girder</div>'+dgZoneSvg(G)
   +'<div class="dgx"><table class="dt dgt" style="max-width:760px"><tr><th>Zone</th><th>Section</th><th>From x (m)</th><th>To x (m)</th><th>Length (m)</th><th class="l">Tag</th><th></th></tr>'
   +(Z.length?Z.map(function(z,i){ return '<tr class="dgi"><td>'+(i+1)+'</td><td>solid</td><td class="v">'+inp('a:'+i,z.a)+'</td><td class="v">'+inp('b:'+i,z.b)+'</td><td>'+(z.b-z.a).toFixed(3)+'</td><td class="l">'+DGTAG.U+'</td><td><button class="b dgzdel" data-i="'+i+'">&times;</button></td></tr>'; }).join(''):'<tr><td colspan="7" class="l">'+DGTAG.M+' no solid zones entered (girder drawing not in this set) &mdash; every station is designed with the open section.</td></tr>')
   +'</table></div>'
   +(function(){ var L=G.Lg||0, mir=Z.map(function(z){ return {a:+(L-z.b).toFixed(3),b:+(L-z.a).toFixed(3)}; }).sort(function(p,q){ return p.a-q.a; }), sym=Z.length===mir.length&&Z.every(function(z,i){ return Math.abs(z.a-mir[i].a)<0.002&&Math.abs(z.b-mir[i].b)<0.002; });
       return Z.length&&!sym?'<div class="bbnote bbflag">These zones are not symmetric about midspan &mdash; untick <b>Symmetrical beam</b> on the Analysis page to see and check the right half.</div>':''; })()
   +'<div class="msbar"><button class="b" id="dg_zadd">+ Add solid zone</button><span>or solid end blocks of</span>'+inp('ends','',70)+'<span>mm from each girder end</span><button class="b" id="dg_zends">Apply</button><button class="b" id="dg_zclr">Clear all</button></div>'
   +'<div class="bbnote">x is measured from the left end of the girder (girder length '+(G.Lg?G.Lg.toFixed(3)+' m':'—')+'). Outside the solid zones the girder is the open span section. Solid = the same outside shape with the trough filled (no void, no Bondek seat), drawn left. The along-girder checks, the points of interest, the self weight at transfer and every load case set to <i>Auto</i> use these zones; a station on a zone boundary is checked on both sides.</div>';
  return h; }
function dgZoneBind(T){ T=T||'dg_ed'; var G=dgGirdPar(), Q=DG.sec, upd=function(){ dgZoneClean(G.Lg); var had=!!(DG.res||DG.gird); DG.res=null; DG.gird=null; DG.poiCache=null; if(typeof srfRender==='function') srfRender('zone'); if($('paneDG')&&$('paneDG').dataset.built){ dgAll(); if(had) dgRun(true); } };
  [].forEach.call(document.querySelectorAll('#'+T+' .dgzn'),function(el){ el.onchange=function(){ var k=el.getAttribute('data-k').split(':'), v=parseFloat(el.value); if(k[0]==='ends') return; if(!isFinite(v)) return; Q.zones[+k[1]][k[0]]=v; upd(); }; });
  [].forEach.call(document.querySelectorAll('#'+T+' .dgzdel'),function(b){ b.onclick=function(){ Q.zones.splice(+b.getAttribute('data-i'),1); upd(); }; });
  var ad=$('dg_zadd'); if(ad) ad.onclick=function(){ var Z=dgZones(), L=G.Lg||0, cuts=[0].concat(Z.reduce(function(a,z){ return a.concat([z.a,z.b]); },[]),[L]), best=null;
    for(var i=0;i<cuts.length;i+=2){ var g0=cuts[i], g1=cuts[i+1]; if(g1-g0>0.2&&(!best||g1-g0>best[1]-best[0])) best=[g0,g1]; }
    if(!best) return; var m=(best[0]+best[1])/2, h=Math.min(0.5,(best[1]-best[0])/4); Z.push({a:+(m-h).toFixed(3),b:+(m+h).toFixed(3)}); upd(); };
  var en=$('dg_zends'); if(en) en.onclick=function(){ var e=document.querySelector('#'+T+' .dgzn[data-k="ends"]'), v=parseFloat(e&&e.value); if(!(v>0)||!G.Lg) return; var L=v/1000; Q.zones=[{a:0,b:L},{a:G.Lg-L,b:G.Lg}]; upd(); };
  var cl=$('dg_zclr'); if(cl) cl.onclick=function(){ Q.zones=[]; upd(); }; }
var dgEditor11=dgEditor; dgEditor=function(){ if(DG.sub==='zone'&&DG._edT){ var T=DG._edT, ed=$(T); if(!DG.sec||!ed) return; ed.innerHTML=dgZoneHTML(); dgZoneBind(T); return; } return dgEditor11(); };
