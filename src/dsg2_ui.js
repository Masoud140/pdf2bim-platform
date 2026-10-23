
/* ===== Super-T design (AS 5100.5:2017) — spreadsheet-style layout =====
   0 Summary · 1 General inputs and derived parameters · 2 Section · 3 Load cases (up to 8 columns)
   4 SLS crack control · 5 ULS bending + N–M diagram · 6 ULS shear and torsion + V–M diagram · 7 Benchmark
   Section: Super-T from the Hog Calculator tab + deck slab. Staged: prestress + girder-only moments lock strains
   into the Super-T; composite moments act on the composite section.                                            */
var DG={deckBars:[{pos:'top',d:null,s:null,c:null},{pos:'bottom',d:null,s:null,c:null}], gi:0, tIdx:-1, sel:0,
  det:{svd:null,svn:null,svs:null,tvd:null,tvn:null,tvs:null,cs:null,ct:null,dg:null,fsyf:null,ex:false}, lc:[], res:null};
DG.ACT=[{k:'SW',n:'Super-T self weight (CS2)',st:'nc',f:'DLc'},{k:'WET',n:'Wet deck + diaphragms (CS3)',st:'nc',f:'DLc'},{k:'REL',n:'Roll-restraint release (CS4)',st:'c',f:'DLc'},
        {k:'SDL',n:'Surfacing + barriers (CS5)',st:'c',f:'SDLp'},{k:'CSH',n:'Creep + shrinkage secondary (CS6)',st:'c',f:'SCR'},{k:'TRF',n:'Traffic (M1600 / S1600 envelope)',st:'c',f:'M1600'}];
function dgNewLC(i,pos){ var nm={mid:'Midspan',q:'Quarter span',sup:'Support + dv',user:'User'}[pos];
  return {name:'LC'+(i+1)+' '+nm, pos:pos, s:null, fscr:200, ftcr:200, Mnc:0, Ms:0, Ns:0, Mu:0, Nu:0, Vu:0, Tu:0, brk:null, src:'not filled'}; }
DG.lc=[dgNewLC(0,'mid'),dgNewLC(1,'q'),dgNewLC(2,'sup')];

function dgBuild(){
  var pane=$('paneDG'); if(pane.dataset.built) return; pane.dataset.built=1;
  pane.innerHTML='<div class="card dgtop"><div class="msbar"><label>Girder <select id="dg_g"><option value="0">G1</option><option value="1">G2</option><option value="2">G3</option><option value="3">G4</option></select></label>'
   +'<label>Prestress at <select id="dg_t"></select></label><button class="b" id="dg_hog">Refresh from Hog Calculator</button>'
   +'<button class="b" id="dg_fill">Fill load cases from the model</button><button class="b" id="dg_run">Run design checks</button><span class="n" id="dg_st"></span></div>'
   +'<div class="bbnote" style="margin:6px 0 0">Work down the page like the reference spreadsheet: inputs are shaded, every calculated row shows its formula and clause. Tags: <span class="tg tD">Direct</span> from the drawings / model, <span class="tg tC">Calculated</span>, <span class="tg tS">Standard &mdash; verify</span>, <span class="tg" style="color:var(--flag)">Missing &mdash; Flagged</span>.</div></div>'
   +'<div class="card"><div class="sdh">0. Design summary</div><div id="dg_sum"><div class="bbnote">Fill the load cases and run the checks.</div></div></div>'
   +'<div class="card"><div class="sdh">1. General inputs and derived parameters</div><div id="dg_gen"></div></div>'
   +'<div class="card"><div class="sdh">2. Section &mdash; Super-T (Hog Calculator tab) + deck slab</div><div id="dg_sec"></div><div id="dg_db"></div><div id="dg_prop"></div></div>'
   +'<div class="card"><div class="sdh">3. Load cases</div><div id="dg_lc"></div></div>'
   +'<div class="card"><div class="sdh">4. Serviceability &mdash; stresses and crack control (Cl 8.6.2)</div><div id="dg_sls"></div></div>'
   +'<div class="card"><div class="sdh">5. Ultimate &mdash; bending (Cl 8.1) and N&ndash;M interaction</div><div id="dg_ulb"></div></div>'
   +'<div class="card"><div class="sdh">6. Ultimate &mdash; shear and torsion (Cl 8.2, general method) and V&ndash;M interaction</div><div id="dg_det"></div><div id="dg_ulv"></div></div>'
   +'<div class="card"><div class="sdh">7. Engine benchmark &mdash; reference spreadsheet example (Design_SuperT.xlsx)</div><div id="dg_bm"></div></div>';
  $('dg_g').onchange=function(){ DG.gi=+$('dg_g').value; DG.res=null; dgSecView(); dgAll(); };
  $('dg_hog').onclick=function(){ HOG_API.calc(); DG.res=null; dgSecView(); dgAll(); };
  $('dg_fill').onclick=dgFill; $('dg_run').onclick=dgRun;
  dgSecView(); dgAll(); setTimeout(dgBench,30);
}
/* ---------- helpers ---------- */
function dgFac(id,col){ if(!DG.facTxt){ DG.facTxt=[].map.call(document.querySelectorAll('script'),function(x){ return x.textContent; }).join('\n'); }
  var m=new RegExp("\\['"+id+"','[^']*','[A-Z]+','[^']*',([\\d.]+),([\\d.]+),([\\d.]+)").exec(DG.facTxt);
  if(!m) return null; return +({4:m[1],5:m[2],6:m[3]}[col]); }
function dgSnap(){ var s=HOG_API.snap(); if(!s.p){ HOG_API.calc(); s=HOG_API.snap(); } return s; }
function dgF(v,d){ return anFmt(v,d); }
function dgE(v){ return (v===null||v===undefined||!isFinite(v))?'—':Number(v).toExponential(3); }
function dgOK(b){ return b===null||b===undefined?'<span class="bbflag">—</span>':(b?'<b class="good">OK</b>':'<b class="bbflag">NG</b>'); }
function dgU(u){ if(u===null||u===undefined||!isNaN(u)&&!isFinite(u)) return '<span class="bbflag">'+(u===Infinity?'&infin;':'—')+'</span>'; return '<span class="'+(u>1?'bbflag':'good')+'"><b>'+anFmt(u,3)+'</b></span>'; }
var DGTAG={D:'<span class="tg tD">Direct</span>',C:'<span class="tg tC">Calculated</span>',S:'<span class="tg tS">Standard &mdash; verify</span>',I:'<span class="tg tD">Input</span>',M:'<span class="tg" style="color:var(--flag)">Missing &mdash; Flagged</span>',X:'<span class="tg" style="color:var(--flag)">Example only &mdash; not BR13A</span>'};
/* spreadsheet-style table: rows [kind, symbol, description, formula, values[], unit, ref]; kind h=heading, i=input, o=output, c=check, u=utilisation */
function dgTab(rows, heads){
  var n=heads.length, h='<div class="dgx"><table class="dt dgt"><tr><th class="l">Symbol</th><th class="l">Description</th><th class="l">Formula / basis</th>'+heads.map(function(x){ return '<th>'+x+'</th>'; }).join('')+'<th class="l">Unit</th><th class="l">Ref.</th></tr>';
  rows.forEach(function(r){
    if(r[0]==='h'){ h+='<tr class="dgh"><td colspan="'+(n+5)+'">'+r[1]+'</td></tr>'; return; }
    var v=r[4].map(function(x){ return '<td class="v">'+x+'</td>'; }).join('');
    h+='<tr class="dg'+r[0]+'"><td class="l sym">'+r[1]+'</td><td class="l">'+r[2]+'</td><td class="l fx">'+(r[3]||'')+'</td>'+v+'<td class="l">'+(r[5]||'')+'</td><td class="l ref">'+(r[6]||'')+'</td></tr>'; });
  return h+'</table></div>';
}
/* SVG x-y plot: o={w,h,xl,yl,series:[{p:[[x,y]],c,dash,wd,lab}], pts:[{x,y,lab,c}], zero:true} */
function dgPlot(o){
  var W=o.w||560, H=o.h||340, L=64, R=14, T=14, B=44, xs=[], ys=[];
  o.series.forEach(function(s){ s.p.forEach(function(q){ if(isFinite(q[0])&&isFinite(q[1])){ xs.push(q[0]); ys.push(q[1]); } }); });
  (o.pts||[]).forEach(function(q){ xs.push(q.x); ys.push(q.y); }); xs.push(0); ys.push(0);
  var nice=function(a,b){ if(a===b){ a-=1; b+=1; } var r=b-a, st=Math.pow(10,Math.floor(Math.log10(r/5))), m=r/5/st; st*=m>5?10:m>2?5:m>1?2:1; return {a:Math.floor(a/st)*st, b:Math.ceil(b/st)*st, st:st}; };
  var X=nice(Math.min.apply(null,xs),Math.max.apply(null,xs)), Y=nice(Math.min.apply(null,ys),Math.max.apply(null,ys));
  var px=function(x){ return L+(x-X.a)/(X.b-X.a)*(W-L-R); }, py=function(y){ return H-B-(y-Y.a)/(Y.b-Y.a)*(H-T-B); };
  var g='', fmt=function(v,st){ var d=st<1?Math.min(3,Math.ceil(-Math.log10(st))):0; return Number(v).toFixed(d); };
  for(var x=X.a; x<=X.b+X.st/2; x+=X.st){ g+='<line x1="'+px(x)+'" x2="'+px(x)+'" y1="'+T+'" y2="'+(H-B)+'" stroke="var(--line)" stroke-width=".5"/><text x="'+px(x)+'" y="'+(H-B+14)+'" text-anchor="middle" class="dgax">'+fmt(x,X.st)+'</text>'; }
  for(var y=Y.a; y<=Y.b+Y.st/2; y+=Y.st){ g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+py(y)+'" y2="'+py(y)+'" stroke="var(--line)" stroke-width=".5"/><text x="'+(L-5)+'" y="'+(py(y)+3.5)+'" text-anchor="end" class="dgax">'+fmt(y,Y.st)+'</text>'; }
  g+='<line x1="'+px(0)+'" x2="'+px(0)+'" y1="'+T+'" y2="'+(H-B)+'" stroke="var(--fg)" stroke-width=".8"/><line x1="'+L+'" x2="'+(W-R)+'" y1="'+py(0)+'" y2="'+py(0)+'" stroke="var(--fg)" stroke-width=".8"/>';
  o.series.forEach(function(s){ var p=s.p.filter(function(q){ return isFinite(q[0])&&isFinite(q[1]); }); if(!p.length) return;
    g+='<polyline fill="none" stroke="'+s.c+'" stroke-width="'+(s.wd||1.8)+'"'+(s.dash?' stroke-dasharray="'+s.dash+'"':'')+' points="'+p.map(function(q){ return px(q[0]).toFixed(1)+','+py(q[1]).toFixed(1); }).join(' ')+'"/>'; });
  (o.pts||[]).forEach(function(q){ g+='<circle cx="'+px(q.x)+'" cy="'+py(q.y)+'" r="4.5" fill="'+(q.c||'var(--flag)')+'" stroke="var(--bg)" stroke-width="1.2"/><text x="'+(px(q.x)+7)+'" y="'+(py(q.y)-6)+'" class="dglb">'+q.lab+'</text>'; });
  g+='<text x="'+((L+W-R)/2)+'" y="'+(H-8)+'" text-anchor="middle" class="dgal">'+o.xl+'</text><text transform="translate(14 '+((T+H-B)/2)+') rotate(-90)" text-anchor="middle" class="dgal">'+o.yl+'</text>';
  var leg=o.series.filter(function(s){ return s.lab; }).map(function(s){ return '<span><i style="border-top:2px '+(s.dash?'dashed':'solid')+' '+s.c+'"></i>'+s.lab+'</span>'; }).join('')+(o.pts&&o.pts.length?'<span><i class="dot" style="background:'+(o.pts[0].c||'var(--flag)')+'"></i>load case(s)</span>':'');
  return '<svg viewBox="0 0 '+W+' '+H+'" class="dgplot" style="max-width:'+W+'px">'+g+'</svg><div class="dgleg">'+leg+'</div>';
}

/* ---------- section (engine form) ---------- */
function dgSection(){
  var s=dgSnap(); if(!s.props) throw new Error('Hog Calculator has no section selected');
  var M=AN.parseMCT($('an_mct_src').textContent), parts=csParts($('an_mct_src').textContent);
  var gname='G'+(DG.gi+1)+'-M_composite', sid=Object.keys(M.secs).filter(function(k){ return M.secs[k].name===gname; })[0];
  var tD=P.slab*1000, Wd=sid&&parts[sid]&&parts[sid][1]?parts[sid][1].gross/P.slab*1000:null;
  var Eg=M.mats[1].E/1000, Ed=M.mats[2].E/1000, fcg=+(/(\d+)\s*MPa/.exec(M.mats[1].name)||[0,s.p.fc])[1], fcd=+(/(\d+)\s*MPa/.exec(M.mats[2].name)||[0,40])[1];
  var H=s.props.H, Pg=s.props.P;
  var conc=DSG.stripsFromPolygon(Pg,H,tD,Eg,fcg,'g',3).concat(DSG.stripsFromLayers([{h:tD,b1:Wd,b2:Wd,E:Ed,fc:fcd,grp:'d'}],3));
  var Es=s.p.Es||200000, fsy=s.p.fsy||500;
  var gb=s.B.map(function(b){ return {y:tD+H-b.y, A:Math.PI*b.d*b.d/4, E:Es, fsy:fsy, grp:'g', d:b.d, x:b.x}; });
  var db=[]; DG.deckBars.forEach(function(r){ if(!(r.d>0&&r.s>0&&r.c>=0)) return; var n=Wd/r.s, y=r.pos==='top'?r.c+r.d/2:tD-r.c-r.d/2; db.push({y:y, A:n*Math.PI*r.d*r.d/4, E:Es, fsy:fsy, grp:'d'}); });
  var res=s.r&&s.r.res?s.r.res:[], ti=DG.tIdx<0?res.length-1:Math.min(DG.tIdx,res.length-1), Pm=ti>=0?res[ti].Pm:null;
  var Ap=s.p.Ap, Ep=s.p.Ep, fpb=s.p.mbl?s.p.mbl*1000/Ap:null;
  var on=s.S.map(function(t,i){ return {t:t,i:i}; }).filter(function(q){ return q.t.on; });
  var tend=on.map(function(q){ var P_=Pm?Pm[q.i]:null; return {y:tD+H-q.t.y, A:Ap, E:Ep, fpb:fpb, eu:0.035, sp:P_!==null&&P_!==undefined?P_*1000/Ap:null, grp:'g', x:q.t.x}; });
  var info={sec:s.cur, H:H, A:s.props.A, I:s.props.I, yb:s.props.yb, tD:tD, Wd:Wd, Eg:Eg, Ed:Ed, fcg:fcg, fcd:fcd, Ap:Ap, Ep:Ep, fpb:fpb, nS:tend.length, nB:gb.length, time:ti>=0?res[ti].label:'—', L:s.p.L, fsy:fsy, Es:Es, hogFc:s.p.fc, mbl:s.p.mbl};
  return {S:{conc:conc, bars:gb.concat(db), tend:tend}, info:info, Pg:Pg, R:s.R, deckBars:db, res:res};
}
function dgSecView(){
  var sel=$('dg_t'), s=dgSnap(), res=(s.r&&s.r.res)||[];
  if(sel.options.length!==res.length){ sel.innerHTML=res.map(function(q,i){ return '<option value="'+i+'"'+(i===res.length-1?' selected':'')+'>'+q.label+'</option>'; }).join(''); sel.onchange=function(){ DG.tIdx=+sel.value; DG.res=null; dgSecView(); dgAll(); }; }
  var X; try{ X=dgSection(); }catch(e){ $('dg_sec').innerHTML='<div class="bbnote bbflag">'+e.message+'</div>'; return; }
  var I=X.info, mg=AN.parseMCT($('an_mct_src').textContent), parts=csParts($('an_mct_src').textContent), sid=Object.keys(mg.secs).filter(function(k){ return mg.secs[k].name==='G'+(DG.gi+1)+'-M_composite'; })[0], p1=sid?parts[sid][0]:null;
  var Hm=p1?(p1.ztop+p1.zbot)*1000:null, Am=p1?p1.A*1e6:null;
  var warn=[]; if(Hm&&Math.abs(Hm-I.H)>5) warn.push('Hog section depth '+I.H+' mm &ne; model girder '+anFmt(Hm,0)+' mm');
  if(Am&&Math.abs(Am-I.A)/Am>0.03) warn.push('Hog section area '+anFmt(I.A/1e6,4)+' m&sup2; &ne; model girder '+anFmt(Am/1e6,4)+' m&sup2;');
  if(I.hogFc!==I.fcg) warn.push("Hog f'c "+I.hogFc+' MPa &ne; model girder '+I.fcg+' MPa');
  if(!I.fpb) warn.push('strand breaking strength not available from the Hog tab');
  DG.warn=warn;
  var sp=X.S.tend.map(function(t){ return t.sp; }).filter(function(v){ return v; }), spm=sp.length?sp.reduce(function(a,b){ return a+b; },0)/sp.length:null;
  var h='<div class="dg2"><div>'+dgSvg(X)+'</div><div><table class="dt dgt"><tr><th class="l">Item</th><th>Value</th><th class="l">Source</th></tr>'
   +'<tr><td class="l">Super-T</td><td class="v">'+I.sec+'</td><td class="l">Hog Calculator tab</td></tr>'
   +'<tr><td class="l">Girder depth / area / I</td><td class="v">'+I.H+' mm / '+anFmt(I.A/1e6,4)+' m&sup2; / '+anFmt(I.I/1e12,4)+' m&#8308;</td><td class="l">Hog section outline</td></tr>'
   +'<tr><td class="l">Strands on / area / E<sub>p</sub> / f<sub>pb</sub></td><td class="v">'+I.nS+' &times; '+I.Ap+' mm&sup2; / '+I.Ep+' / '+(I.fpb?anFmt(I.fpb,0):'—')+' MPa</td><td class="l">Hog tab strand</td></tr>'
   +'<tr><td class="l">Prestress after losses ('+I.time+')</td><td class="v">'+(spm?anFmt(spm,0)+' MPa mean ('+anFmt(spm*I.Ap/1000,1)+' kN / strand)':'run the Hog tab')+'</td><td class="l">Hog time-dependent losses</td></tr>'
   +'<tr><td class="l">Girder bars</td><td class="v">'+I.nB+' bars</td><td class="l">Hog tab reinforcement</td></tr>'
   +'<tr><td class="l">Deck slab thickness / width</td><td class="v">'+anFmt(I.tD,0)+' / '+anFmt(I.Wd,0)+' mm</td><td class="l">Thickness: deck section '+DGTAG.D+'; width: model composite section G'+(DG.gi+1)+' '+DGTAG.C+'</td></tr></table>'
   +(warn.length?'<div class="bbnote bbflag" style="margin-top:6px">Check: '+warn.join('; ')+'. Set the BR13A girder in the Hog Calculator tab (section, flange width, length, strands) &mdash; the design reads that tab.</div>':'')
   +'<div class="bbnote">Deck width is the full composite width the model uses for this girder; an AS 5100.5 effective-flange-width reduction is not applied [check].</div></div></div>';
  $('dg_sec').innerHTML=h; dgDeckBars();
}
function dgSvg(X){
  var I=X.info, Wt=Math.max(I.Wd||0, 2*Math.max.apply(null,X.Pg.map(function(p){ return Math.abs(p[0]); }))), Ht=I.tD+I.H, W=420, sc=(W-20)/Wt, Hh=Ht*sc+20;
  var cx=W/2, Y=function(yd){ return 10+yd*sc; };
  var g='<rect x="'+(cx-I.Wd/2*sc)+'" y="'+Y(0)+'" width="'+(I.Wd*sc)+'" height="'+(I.tD*sc)+'" fill="var(--dummy)" opacity=".55" stroke="var(--fg)" stroke-width=".6"/>';
  g+='<path d="M'+X.Pg.map(function(p){ return (cx+p[0]*sc).toFixed(1)+','+Y(I.tD+I.H-p[1]).toFixed(1); }).join('L')+'Z" fill="var(--panel)" stroke="var(--fg)" stroke-width=".8"/>';
  var G=DG.res&&DG.res.base?DG.res.base.geo:null;
  if(G&&G.lig) g+='<path d="M'+G.lig.map(function(p){ return (cx+p[0]*sc).toFixed(1)+','+Y(p[1]).toFixed(1); }).join('L')+'Z" fill="none" stroke="var(--calc)" stroke-width="1" stroke-dasharray="4 2"/>';
  X.S.tend.forEach(function(t){ g+='<circle cx="'+(cx+t.x*sc)+'" cy="'+Y(t.y)+'" r="2.4" fill="var(--instr)"/>'; });
  X.S.bars.forEach(function(b){ if(b.grp==='g') g+='<rect x="'+(cx+b.x*sc-2)+'" y="'+(Y(b.y)-2)+'" width="4" height="4" fill="var(--eng)"/>'; else g+='<line x1="'+(cx-I.Wd/2*sc+3)+'" x2="'+(cx+I.Wd/2*sc-3)+'" y1="'+Y(b.y)+'" y2="'+Y(b.y)+'" stroke="var(--eng)" stroke-width="1.6" stroke-dasharray="3 2"/>'; });
  return '<svg viewBox="0 0 '+W+' '+Hh+'" style="width:100%;max-width:440px;height:auto;display:block;background:var(--bg)">'+g+'</svg><div class="bbnote">Blue = strands, green = bars (deck bars dashed). Deck shaded.'+(G&&G.lig?' Orange dashed = closed-tie centreline used for torsion (A<sub>oh</sub>, u<sub>h</sub>).':'')+'</div>';
}
function dgDeckBars(){
  var I; try{ I=dgSection().info; }catch(e){ return; }
  var h='<div class="sdh" style="margin-top:8px">Deck slab reinforcement (longitudinal, over the girder&rsquo;s deck width) &mdash; input</div><table class="dt dgt" style="max-width:760px"><tr><th class="l">Layer</th><th>Bar &Oslash; (mm)</th><th>Spacing (mm)</th><th>Cover (mm)</th><th>Area</th><th class="l">Tag</th></tr>';
  DG.deckBars.forEach(function(r,i){ var A=(r.d>0&&r.s>0)?(I.Wd/r.s)*Math.PI*r.d*r.d/4:null;
    h+='<tr class="dgi"><td class="l">'+r.pos+'</td><td class="v"><input class="f dgb" data-i="'+i+'" data-k="d" value="'+(r.d||'')+'"></td><td class="v"><input class="f dgb" data-i="'+i+'" data-k="s" value="'+(r.s||'')+'"></td><td class="v"><input class="f dgb" data-i="'+i+'" data-k="c" value="'+(r.c===null?'':r.c)+'"></td><td class="v">'+(A?anFmt(A,0)+' mm&sup2;':'—')+'</td><td class="l">'+(A?DGTAG.I:DGTAG.M+' deck reinforcement drawing not in this set')+'</td></tr>'; });
  $('dg_db').innerHTML=h+'</table>';
  document.querySelectorAll('.dgb').forEach(function(inp){ inp.onchange=function(){ var v=inp.value.trim(); DG.deckBars[+inp.getAttribute('data-i')][inp.getAttribute('data-k')]=v===''?null:+v; DG.res=null; dgSecView(); dgAll(); }; });
}

/* ---------- section-level derived values (independent of the load case) ---------- */
function dgBase(X){
  var I=X.info, S=X.S, Sg={conc:S.conc.filter(function(c){ return c.grp==='g'; }), bars:S.bars.filter(function(b){ return b.grp==='g'; }), tend:S.tend};
  var eg=DSG.elastic(Sg,I.Eg), ec=DSG.elastic(S,I.Eg), D=I.tD+I.H;
  var At=0, yt=0, Pt=0; S.tend.forEach(function(t){ At+=t.A; yt+=t.A*t.y; Pt+=(t.sp||0)*t.A; }); yt=At?yt/At:null;
  var b={I:I, D:D, eg:eg, ec:ec, Pt:Pt/1e3, ep:yt!==null?yt-eg.yc:null, ypt:yt,
    a2g:DSG.a2(I.fcg), a2d:DSG.a2(I.fcd), gg:DSG.gam(I.fcg), gd:DSG.gam(I.fcd), fctfg:0.6*Math.sqrt(I.fcg), fctfd:0.6*Math.sqrt(I.fcd), fct25:0.25*Math.sqrt(I.fcg)};
  /* effective depth of tension steel for dv (sagging: from the deck top; hogging: from the soffit), weighted by yield force */
  b.dres=function(face){ var n=0, d=0; S.bars.forEach(function(r){ var z=face==='top'?r.y:D-r.y; if(z>D/2){ n+=r.A*r.fsy; d+=r.A*r.fsy*z; } }); S.tend.forEach(function(t){ var z=face==='top'?t.y:D-t.y; if(z>D/2){ n+=t.A*(t.fpb||0); d+=t.A*(t.fpb||0)*z; } }); return n?d/n:null; };
  b.dv=function(face){ var d=b.dres(face); return Math.max(0.72*D, d?0.9*d:0); };
  b.geo=dgGeo(X, D);
  return b;
}
/* torsion / shear geometry of the closed box (Super-T trough closed by the deck), from the Hog half outline R (12 points, y up from the soffit) */
function dgGeo(X, D){
  var R=X.R, I=X.info, det=DG.det, g={ok:false};
  if(!R||R.length!==12){ g.why='Hog outline is not the 12-point Super-T form'; return g; }
  var x0=R[0][0], sl=(R[2][0]-R[0][0])/(R[2][1]-R[0][1]), si=(R[9][0]-R[10][0])/(R[9][1]-R[10][1]), cs=Math.cos(Math.atan(sl));
  var xo=function(y){ return x0+sl*y; }, xi=function(y){ return R[10][0]+si*(y-R[10][1]); };
  var y1=R[10][1], y2=Math.min(R[9][1],R[2][1]), tw=1e9, ytw=null; for(var k=0;k<=40;k++){ var y=y1+(y2-y1)*k/40, t=(xo(y)-xi(y))*cs; if(t<tw){ tw=t; ytw=y; } }
  g.sl=sl; g.tw=tw; g.ytw=ytw; g.bv=2*tw; g.tb=R[11][1]; g.Acp=2*(x0*D+sl*D*D/2); g.uc=2*x0+2*(x0+sl*D)+2*D*Math.sqrt(1+sl*sl);
  var yb=g.tb/2, yt=I.H+I.tD/2, ym=(yb+yt)/2; g.Ao=2*(yt-yb)*(xo(ym)+xi(ym))/2;
  g.xoTop=xo(D); g.Pv=0;
  if(det.cs>=0&&det.ct>=0&&det.tvd>0&&det.cs!==null&&det.ct!==null){
    var a=det.cs+det.tvd/2, at=det.ct+det.tvd/2, lb=a, lt=D-at, xl=function(y){ return xo(y)-a/cs; };
    g.Aoh=2*(lt-lb)*xl((lb+lt)/2); g.uh=2*xl(lb)+2*xl(lt)+2*(lt-lb)*Math.sqrt(1+sl*sl); g.y1=lt-lb;
    /* drawing coordinates (y down from deck top) */
    g.lig=[[-xl(lb),D-lb],[xl(lb),D-lb],[xl(lt),D-lt],[-xl(lt),D-lt]]; g.ok=true;
  } else g.why='closed-tie diameter and covers are needed for A_oh, u_h, y1';
  return g;
}

/* ---------- load cases ---------- */
function dgStation(gi,s){
  var ch=CS.chains[gi], it=null; ch.els.forEach(function(q){ if(!it&&s>=q.s0-1e-9&&s<=q.s0+q.e.L+1e-9) it=q; }); if(!it) it=ch.els[ch.els.length-1];
  var xl=Math.max(0,Math.min(it.e.L,s-it.s0)); return {it:it, x:it.rev?it.e.L-xl:xl, sg:it.rev?1:-1, ch:ch};
}
function dgActAt(gi,s){
  var st=dgStation(gi,s), steps=CS.res.steps, out={};
  var cs=function(id){ var q=steps.filter(function(z){ return z.sg.id===id; })[0], sc=q?csElemSec(q,st.it.e.id,st.x):null; return sc?{M:-sc.My,V:st.sg*sc.Vz,T:sc.T,N:sc.N,src:id+', element '+st.it.e.id}:{M:0,V:0,T:0,N:0,src:id+' n/a'}; };
  out.SW=cs('CS2'); out.WET=cs('CS3'); out.REL=cs('CS4'); out.SDL=cs('CS5');
  var O=CT.out, jB=O.PB.els.findIndex(function(e){ return e.id===st.it.e.id; });
  if(jB>=0){ var sc=AN.section(O.PB.els[jB],O.B.ef[jB],st.x); out.CSH={M:-sc.My,V:st.sg*sc.Vz,T:sc.T,N:sc.N,src:'CS6 creep/shrinkage secondary'}; } else out.CSH={M:0,V:0,T:0,N:0,src:'CS6 n/a'};
  /* traffic envelope: the two end rows of the element containing the station, interpolated linearly in s */
  var Rr=TR.inf.S.R, PE=ANS.res.P.els, eid=st.it.e.id, ends=function(t){ var e=[]; Rr.forEach(function(r,i){ if(r.t===t&&r.g===gi&&PE[r.ix].id===eid) e.push(i); }); e.sort(function(a,b){ return Rr[a].s-Rr[b].s; }); return e; };
  var trq=function(t,mode){ var e=ends(t); if(e.length<2) return {v:null,m:'—'}; var s1=Rr[e[0]].s, s2=Rr[e[1]].s, w=s2>s1?Math.max(0,Math.min(1,(s-s1)/(s2-s1))):0, best=null;
    TR.env.models.forEach(function(mn){ var E=TR.env.env[mn], mx=E.max[e[0]]*(1-w)+E.max[e[1]]*w, mi=E.min[e[0]]*(1-w)+E.min[e[1]]*w, v=mode==='max'?mx:(Math.abs(mx)>=Math.abs(mi)?mx:mi);
      if(!best||(mode==='max'?v>best.v:Math.abs(v)>Math.abs(best.v))) best={v:v,m:mn}; }); return best; };
  var tm=trq('M','max'), tv=trq('V','abs'), tt=trq('T','abs');
  out.TRF={M:tm.v||0,V:tv.v||0,T:tt.v===null?0:tt.v,N:0,src:'envelope: M '+tm.m+', V '+tv.m+(tt.v===null?', T not enveloped':', T '+tt.m), mM:tm.m, noT:tt.v===null};
  return {a:out, s:s, el:st.it.e.id};
}
function dgTotals(lc){
  var B=lc.brk; if(!B) return;
  var q=['M','V','T'], sum={}, gam={};
  q.forEach(function(k){ var adv=0; DG.ACT.forEach(function(a){ adv+=dgFac(a.k==='TRF'&&B.a.TRF.mM==='S1600'?'S1600':a.f,4)*B.a[a.k][k]; }); var sg=adv>=0?1:-1, t=0;
    DG.ACT.forEach(function(a){ var v=B.a[a.k][k], fid=a.k==='TRF'&&B.a.TRF.mM==='S1600'?'S1600':a.f, g=(v*sg>=0)?dgFac(fid,4):dgFac(fid,5); (gam[a.k]=gam[a.k]||{})[k]=g; t+=g*v; }); sum[k]=t; });
  var nc=0, c=0; DG.ACT.forEach(function(a){ var fs=dgFac(a.f,6), v=B.a[a.k].M; (gam[a.k]=gam[a.k]||{}).s=fs; if(a.st==='nc') nc+=fs*v; else c+=fs*v; });
  /* axial force from the grillage (tension +): composite-stage actions at the SLS factor; all actions at the ULS factor taking the moment's adverse / beneficial choice. Traffic N is not enveloped (0). */
  var Ns=0, Nu=0, useN=!(DG.opt&&DG.opt.useN===false); DG.ACT.forEach(function(a){ var v=B.a[a.k].N||0; if(!useN) return; if(a.st!=='nc') Ns+=dgFac(a.f,6)*v; Nu+=(gam[a.k].M||0)*v; });
  lc.Mnc=nc; lc.Ms=c; lc.Mu=sum.M; lc.Vu=Math.abs(sum.V); lc.Tu=Math.abs(sum.T); lc.gam=gam; lc.Ns=Ns/1; lc.Nu=Nu; lc.src='model';
}
function dgFill(){
  var st=$('dg_st'), need=[];
  if(!(typeof CS!=='undefined'&&CS.res&&CT.out)) need.push('cs'); if(!(typeof TR!=='undefined'&&TR.env)) need.push('tr');
  function go(){
    if(need.indexOf('cs')>=0 && !(CS.res&&CT.out)){ st.textContent='Running construction stages + creep and shrinkage…'; if(!$('paneCS').dataset.built) csBuild(); if(!CS.running){ CS.running=1; csRun(); } return setTimeout(go,800); }
    if(need.indexOf('tr')>=0 && !TR.env){ st.textContent='Running the traffic envelope…'; if(!$('paneTR').dataset.built) trBuild(); if(!TR.running){ TR.running=1; trRun(); } return setTimeout(go,800); }
    CS.running=0; TR.running=0; try{ dgFillNow(); }catch(e){ st.textContent='Fill failed: '+e.message; } }
  go();
}
/* chain stations of the bearings: nodes joined to a bearing link directly or through rigid (RIG) offsets */
function dgBearingS(ch){
  var P=ANS.res.P, M=P.M, B={}; P.els.forEach(function(e){ if(e.link){ B[e.n1]=1; B[e.n2]=1; } });
  for(var k=0;k<3;k++) P.els.forEach(function(e){ var sn=M.secs[e.sec]; if(!e.link&&sn&&/^RIG/i.test(sn.name)&&(B[e.n1]||B[e.n2])){ B[e.n1]=1; B[e.n2]=1; } });
  var nn=ch.startNode, hits=[]; if(B[nn]) hits.push(0); ch.els.forEach(function(it){ nn=it.rev?it.e.n1:it.e.n2; if(B[nn]) hits.push(it.s0+it.e.L); });
  return hits.length>=2?[hits[0],hits[hits.length-1]]:null;
}
function dgFillNow(){
  var X=dgSection(), b=dgBase(X), ch=CS.chains[DG.gi], sb=dgBearingS(ch), sb2=sb?sb[1]:ch.Ltot, sb1=sb?sb[0]:0, Lb=sb2-sb1;
  DG.lc.forEach(function(lc){ if(lc.pos==='mid') lc.s=sb1+Lb/2; else if(lc.pos==='q') lc.s=sb1+Lb/4; else if(lc.pos==='sup') lc.s=sb1+b.dv('top')/1000; else if(lc.s===null) lc.s=ch.Ltot/2;
    lc.brk=dgActAt(DG.gi,lc.s); dgTotals(lc); });
  $('dg_st').textContent='Filled '+DG.lc.length+' load cases for '+ch.name+' (chain '+anFmt(ch.Ltot,2)+' m; bearings at s = '+(sb?anFmt(sb1,2)+' and '+anFmt(sb2,2)+' m, span '+anFmt(Lb,2)+' m':'not found — span taken as the chain')+').'; DG.res=null; dgRun();
}
function dgLCView(){
  var L=DG.lc, heads=L.map(function(lc,i){ return 'LC'+(i+1); }), inp=function(i,k,v,w){ return '<input class="f dgl" data-i="'+i+'" data-k="'+k+'" value="'+v+'" style="width:'+(w||84)+'px">'; };
  var rows=[['h','Definition'],
    ['i','Name','Load-case label','',L.map(function(lc,i){ return inp(i,'name',lc.name,120); }),'',''],
    ['i','Position','Station rule','',L.map(function(lc,i){ return '<select class="f dgl" data-i="'+i+'" data-k="pos">'+[['mid','Midspan L/2'],['q','Quarter L/4'],['sup','Support + d<sub>v</sub>'],['brg','At bearing'],['user','User station']].map(function(o){ return '<option value="'+o[0]+'"'+(lc.pos===o[0]?' selected':'')+'>'+o[1].replace(/<[^>]+>/g,'')+'</option>'; }).join('')+'</select>'; }),'',''],
    ['i','Section','Section used for this load case','Auto: solid within the end-block length from a girder end (step 1)',L.map(function(lc,i){ var t=DG.sec?dgLCType(lc):false; return '<select class="f dgl" data-i="'+i+'" data-k="sec">'+[['auto','Auto'],['open','Open (span)'],['solid','Solid end block']].map(function(o){ return '<option value="'+o[0]+'"'+((lc.sec||'auto')===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select><div class="dgsub">&rarr; '+(t?'solid':'open')+'</div>'; }),'',''],
    ['i','s','Station along the girder chain (from its first node)','midspan / quarter of the bearing-to-bearing span; support case: bearing + d<sub>v</sub>',L.map(function(lc,i){ return inp(i,'s',lc.s===null?'':anFmt(lc.s,3),70); }),'m',''],
    ['o','Source','How the totals were obtained','',L.map(function(lc){ return lc.src+(lc.brk?' (el. '+lc.brk.el+')':''); }),'','']];
  /* breakdown */
  if(L.some(function(lc){ return lc.brk; })){
    rows.push(['h','Unfactored actions at the station (M sagging + / V / T), with the load factors used']);
    DG.ACT.forEach(function(a){ rows.push(['o',a.k,a.n,'on '+(a.st==='nc'?'Super-T alone':'composite')+'; M / V / T [&gamma;<sub>ULS,M</sub>, &gamma;<sub>SLS</sub>]',L.map(function(lc){ if(!lc.brk) return '—'; var v=lc.brk.a[a.k], g=lc.gam[a.k];
      return anFmt(v.M,0)+' / '+anFmt(v.V,0)+' / '+anFmt(v.T,0)+' <span class="dgg">['+g.M+', '+g.s+']</span>'+(a.k==='TRF'&&v.noT?' <span class="bbflag">T&nbsp;n/a</span>':''); }),'kN·m / kN / kN·m','Combos tab']); });
  }
  rows.push(['h','Design actions (editable; Fill recomputes them)']);
  rows.push(['i','M<sub>nc</sub>','SLS moment on the Super-T alone (prestress stage)','&Sigma; &gamma;<sub>SLS</sub>M (SW, WET)',L.map(function(lc,i){ return inp(i,'Mnc',anFmt(lc.Mnc,1)); }),'kN·m','Cl 8.6.2']);
  rows.push(['i','M<sub>s</sub>*','SLS moment on the composite section','&Sigma; &gamma;<sub>SLS</sub>M (REL, SDL, CSH, TRF)',L.map(function(lc,i){ return inp(i,'Ms',anFmt(lc.Ms,1)); }),'kN·m','Cl 8.6.2']);
  rows.push(['i','N<sub>s</sub>*','SLS axial force (tension +)','grillage girder axial not carried &rarr; 0',L.map(function(lc,i){ return inp(i,'Ns',anFmt(lc.Ns,1)); }),'kN','']);
  rows.push(['i','M*','ULS moment (sagging +)','&Sigma; &gamma;<sub>ULS</sub>M; relieving actions take the beneficial factor',L.map(function(lc,i){ return inp(i,'Mu',anFmt(lc.Mu,1)); }),'kN·m','AS 5100.2 Cl 6']);
  rows.push(['i','N*','ULS axial force (tension +)','grillage girder axial not carried &rarr; 0',L.map(function(lc,i){ return inp(i,'Nu',anFmt(lc.Nu,1)); }),'kN','']);
  rows.push(['i','V*','ULS shear','|&Sigma; &gamma;<sub>ULS</sub>V|',L.map(function(lc,i){ return inp(i,'Vu',anFmt(lc.Vu,1)); }),'kN','']);
  rows.push(['i','T*','ULS torsion','|&Sigma; &gamma;<sub>ULS</sub>T|',L.map(function(lc,i){ return inp(i,'Tu',anFmt(lc.Tu,1)); }),'kN·m','Cl 8.2.1.2']);
  $('dg_lc').innerHTML='<div class="msbar"><button class="b" id="dg_add">+ Add load case</button><button class="b" id="dg_del">&minus; Remove last</button><span class="bbnote" style="margin:0">Up to 8 columns, as in the reference spreadsheet.</span></div>'+dgTab(rows,heads)
   +'<div class="bbnote">Stage results (CS2&ndash;CS6) and the traffic envelope are read at the girder element containing the station. Traffic M, V and T are each enveloped separately (not concurrent) &mdash; conservative. Load factors are those of the Combos tab (DLc, SDLp, SCR, M1600/S1600); an action that opposes the total takes the ULS <i>beneficial</i> factor. SLS here is the short-term service combination used for crack control.</div>';
  document.querySelectorAll('.dgl').forEach(function(el){ el.onchange=function(){ var lc=DG.lc[+el.getAttribute('data-i')], k=el.getAttribute('data-k'), v=el.value.trim();
    if(k==='name') lc.name=v; else if(k==='sec'){ lc.sec=v; } else if(k==='pos'){ lc.pos=v; } else if(k==='s'){ lc.s=v===''?null:+v; lc.pos='user'; } else { lc[k]=+v||0; lc.src='user-edited'; }
    DG.res=null; if((k==='pos'||k==='s')&&typeof CS!=='undefined'&&CS.res&&CT.out&&TR.env){ dgFillNow(); } else dgAll(); }; });
  $('dg_add').onclick=function(){ if(DG.lc.length<8){ DG.lc.push(dgNewLC(DG.lc.length,'user')); DG.res=null; dgAll(); } };
  $('dg_del').onclick=function(){ if(DG.lc.length>1){ DG.lc.pop(); DG.sel=Math.min(DG.sel,DG.lc.length-1); DG.res=null; dgAll(); } };
}

/* ---------- per load case analysis ---------- */
function dgLC(X, B, lc){
  var I=X.info, S=JSON.parse(JSON.stringify(X.S)), tD=I.tD, Ht=tD+I.H, o={};
  var Sg={conc:S.conc.filter(function(c){ return c.grp==='g'; }), bars:S.bars.filter(function(b){ return b.grp==='g'; }), tend:S.tend};
  var ygr=B.eg.yc, yc=B.ec.yc, Mnc=lc.Mnc, Ns=lc.Ns*1e3;
  /* stage 1 — Super-T alone: tendon prestrain so that the tendon stress equals the Hog value under prestress + Mnc */
  Sg.tend.forEach(function(t){ t.pre=t.sp/t.E; });
  for(var it=0;it<8;it++){ var s0=DSG.solveSLS(Sg,0,Mnc*1e6,ygr,false); Sg.tend.forEach(function(t){ t.pre=t.sp/t.E-(s0.e0+s0.k*t.y); }); }
  Sg.tend.forEach(function(t){ t.pre0=t.pre; });
  var sg=DSG.solveSLS(Sg,0,Mnc*1e6,ygr,false), eg=function(y){ return sg.e0+sg.k*y; }; o.sg=sg;
  o.g1top=I.Eg*eg(tD); o.g1bot=I.Eg*eg(Ht);
  /* stage 2 — lock the Super-T state into the composite section */
  S.conc.forEach(function(c){ c.e0=c.grp==='g'?-eg(c.y):0; }); S.bars.forEach(function(b){ b.e0=b.grp==='g'?-eg(b.y):0; }); S.tend.forEach(function(t){ t.pre=t.pre+eg(t.y); });
  /* stage-2 free strains (strain tension +): temperature gradient on all materials, differential shrinkage of the deck relative to the girder; fibre stresses = E(strain − free strain) */
  var fr=function(y,g){ return lc.free?((lc.free.T?lc.free.T(y):0)+(g==='d'?(lc.free.sh||0):0)):0; }; o.fr=fr;
  if(lc.free){ var fT=lc.free.T, fs=lc.free.sh||0; S.conc.forEach(function(c){ c.e0+=(fT?fT(c.y):0)+(c.grp==='d'?fs:0); }); S.bars.forEach(function(b){ b.e0=(b.e0||0)+(fT?fT(b.y):0); }); S.tend.forEach(function(t){ t.pre-=(fT?fT(t.y):0); }); }
  var at=function(M,crack){ var s=DSG.solveSLS(S,Ns,(Mnc+M)*1e6,yc,crack);   /* M = composite increment; the locked-in Super-T state already carries Mnc */
    return {s:s, deckTop:I.Ed*(s.e0-fr(0,'d')), deckBot:I.Ed*(s.e0+s.k*tD-fr(tD,'d')), girTop:I.Eg*(s.e0+s.k*tD+eg(tD)-fr(tD,'g')), girBot:I.Eg*(s.e0+s.k*Ht+eg(Ht)-fr(Ht,'g')),
      bars:S.bars.map(function(b){ return b.E*(s.e0+s.k*b.y-(b.e0||0)); }), tend:S.tend.map(function(t){ return t.E*(s.e0+s.k*t.y+t.pre); })}; };
  o.sv=at(lc.Ms,false); o.sc=at(lc.Ms,true);
  var lo=-3e5, hi=3e5; for(var i=0;i<(DG.nb||80);i++){ var mm=(lo+hi)/2; if(at(mm,false).girBot<0) lo=mm; else hi=mm; } o.Mdec=lo; var base=at(o.Mdec,false);
  var incr=function(M){ var q=at(M,true), mb=-1e9, mt=-1e9; q.bars.forEach(function(v,j){ if(S.bars[j].y>yc) mb=Math.max(mb,v-base.bars[j]); }); q.tend.forEach(function(v,j){ mt=Math.max(mt,v-base.tend[j]); }); return {b:mb,t:mt,q:q}; };
  lo=o.Mdec; hi=o.Mdec+3e5; for(var k=0;k<(DG.nb||80);k++){ var m2=(lo+hi)/2, q=incr(m2); if(q.b<lc.fscr && q.t<lc.ftcr) lo=m2; else hi=m2; } o.Mal=lo; o.qa=incr(o.Mal);
  o.inc=lc.Ms>o.Mdec?incr(lc.Ms):{b:0,t:0}; o.atf=at; o.incr=incr;
  /* top face (Super-T top flange / deck top) in tension: decompression of the top face, then the increment of bars and tendons above the composite centroid */
  var topT=function(q){ return Math.max(q.girTop,q.deckTop); };
  lo=-3e5; hi=3e5; for(var i5=0;i5<(DG.nb||80);i5++){ var m5=(lo+hi)/2; if(topT(at(m5,false))>0) lo=m5; else hi=m5; } o.MdecT=hi; var baseT=at(o.MdecT,false);
  var incrT=function(M){ var q=at(M,true), mb=-1e9, mt=-1e9; q.bars.forEach(function(v,j){ if(S.bars[j].y<yc) mb=Math.max(mb,v-baseT.bars[j]); }); q.tend.forEach(function(v,j){ if(S.tend[j].y<yc) mt=Math.max(mt,v-baseT.tend[j]); }); return {b:mb,t:mt,q:q}; };
  o.incT=lc.Ms<o.MdecT?incrT(lc.Ms):{b:0,t:0}; o.incrT=incrT;
  /* allowable composite moment on the hogging side: smallest M whose top-face increments stay within Table 8.6.2.1 (bars near the top face, bonded tendons) */
  var fT8=lc.fscrT||lc.fscr; lo=o.MdecT-3e5; hi=o.MdecT; for(var i6=0;i6<(DG.nb||80);i6++){ var m6=(lo+hi)/2, q6=incrT(m6); if(q6.b<fT8&&q6.t<lc.ftcr) hi=m6; else lo=m6; } o.MalT=hi; o.uST=lc.Ms<o.MdecT?(o.MdecT-lc.Ms)/Math.max(1e-9,o.MdecT-o.MalT):0;
  o.uncr=o.sv.girBot<=B.fct25; o.uS=lc.Ms/o.Mal; o.okS=o.uncr||lc.Ms<=o.Mal;
  /* neutral axis and curvature of the total strain plane in the Super-T at Ms (cracked, no-tension concrete) */
  var e0t=o.sc.s.e0+sg.e0, kt=o.sc.s.k+sg.k; o.kap=kt; o.dna=kt!==0?-e0t/kt:null;
  /* cracking moments (staged): sagging — soffit at f'ct.f; hogging — deck top at f'ct.f */
  lo=-3e5; hi=3e5; for(var j=0;j<(DG.nb||80);j++){ var m3=(lo+hi)/2; if(at(m3,false).girBot<B.fctfg) lo=m3; else hi=m3; } o.Mcr=Mnc+lo;
  lo=-3e5; hi=3e5; for(var j2=0;j2<(DG.nb||80);j2++){ var m4=(lo+hi)/2; if(at(m4,false).deckTop<B.fctfd) hi=m4; else lo=m4; } o.McrH=Mnc+hi;
  /* ULS — composite section; locked-in strains neglected; tendon strain offset = prestrain at the Hog state (sigma_p/Ep + |eps_ce|) */
  var Su={conc:S.conc.map(function(c){ return Object.assign({},c,{e0:0}); }), bars:S.bars.map(function(b){ return Object.assign({},b,{e0:0}); }), tend:S.tend.map(function(t){ return Object.assign({},t,{epe:t.pre0}); })};
  if(typeof dgCodeSpu==='function') dgCodeSpu(Su,X);   /* optional: AS 5100.5 approximate tendon stress instead of the strand curve */
  var face=lc.Mu>=0?'top':'bot'; o.face=face; o.Su=Su; o.yc=yc;
  var r=DSG2.muAtN(Su,lc.Nu*1e3,face,yc), r0=DSG2.muAtN(Su,0,face,yc);
  var D=B.D, dmax=0; Su.bars.concat(Su.tend).forEach(function(z){ dmax=Math.max(dmax,face==='top'?z.y:D-z.y); });
  var Nub=DSG2.at(Su,0.003/0.0055*dmax,face,yc).N; o.Nub=Nub/1e3;
  if(r){ o.dn=r.dn; o.kuo=r.kuo; o.gam=r.gamma; o.Mu=r.M/1e6; var pb=DSG2.phiB(r.kuo), N=lc.Nu*1e3; o.phi=N>=0?pb:(N<=Nub?0.6:0.6+(pb-0.6)*(1-N/Nub)); o.phiMu=o.phi*o.Mu; o.uB=Math.abs(lc.Mu)/Math.abs(o.phiMu); }
  if(r0){ o.Muo=r0.M/1e6; o.kuo0=r0.kuo; }
  o.Muomin=face==='top'?1.2*o.Mcr:1.2*o.McrH; o.okMin=o.Muo!==undefined?(face==='top'?o.Muo>=o.Muomin:o.Muo<=o.Muomin):null;
  /* shear and torsion */
  var G=B.geo, d=X.solid?DG.detS:DG.det, Q=null; o.dv=B.dv(face); o.dres=B.dres(face);
  var Ast=0, Apt=0, Act=0, spo=0, Fpt=0; Su.bars.forEach(function(z){ if((face==='top'?z.y:D-z.y)>D/2) Ast+=z.A; }); Su.tend.forEach(function(t){ if((face==='top'?t.y:D-t.y)>D/2){ Apt+=t.A; spo+=t.A*t.E*t.pre0; Fpt+=t.A*(t.fpb||0); } }); spo=Apt?spo/Apt:0;
  Su.conc.forEach(function(c){ if((face==='top'?c.y:D-c.y)>D/2) Act+=c.b*c.h; });
  o.Ast=Ast; o.Apt=Apt; o.Act=Act; o.spo=spo;
  var ready=G.ok&&d.svd>0&&d.svn>0&&d.svs>0&&d.fsyf>0&&(d.tvn===0||d.tvd>0&&d.tvn>0&&d.tvs>0);
  if(ready){
    Q={bv:G.bv, dv:o.dv, fc:I.fcg, Ec:I.Eg, Es:I.Es, Ep:I.Ep, Ast:Ast, Apt:Apt, spo:spo, Act:Act, fsyf:d.fsyf, fsy:I.fsy, fpb:I.fpb||0, Fpt:Fpt,
       AsvS:d.svn*Math.PI*d.svd*d.svd/4/d.svs, AswS:d.tvn>0?d.tvn*Math.PI*d.tvd*d.tvd/4/d.tvs:0, dg:d.dg||0, Pv:0, uh:G.uh, Ao:G.Ao, Aoh:G.Aoh, Acp:G.Acp, uc:G.uc, y1:G.y1};
    var sh=DSG2.shear(Q,{V:lc.Vu,T:lc.Tu,M:lc.Mu,N:lc.Nu});
    if(!sh.minV&&!(d.dg>0)){ o.shWhy='A<sub>sv</sub> &lt; A<sub>sv,min</sub>: maximum aggregate size d<sub>g</sub> is needed for k<sub>v</sub>'; } else { o.sh=sh; o.Q=Q; }
  } else o.shWhy=!G.ok?G.why:'shear-only ligature (&Oslash;, legs, s), closed-tie set and f<sub>sy.f</sub> are needed';
  return o;
}
function dgRun(){
  var st=$('dg_st'), X; try{ X=dgSection(); }catch(e){ st.textContent=e.message; return; }
  if(X.S.tend.some(function(t){ return !t.sp; })){ st.textContent='Prestress after losses is missing: open the Hog Calculator tab and run it.'; return; }
  var B=dgBase(X), t0=Date.now(); DG.res={X:X, base:B, lc:DG.lc.map(function(lc){ return dgLC(X,B,lc); })};
  st.textContent='Checks run for '+DG.lc.length+' load case(s) in '+((Date.now()-t0)/1000).toFixed(1)+' s.'; dgSecView(); dgAll();
}

/* ---------- rendering ---------- */
function dgAll(){ var X=null, B=null; try{ X=dgSection(); B=DG.res?DG.res.base:dgBase(X); }catch(e){}
  dgGenView(X,B); dgPropView(X,B); dgLCView(); dgSLSView(); dgULBView(); dgDetView(X,B); dgULVView(); dgSumView(); }
function dgGenView(X,B){
  if(!X){ $('dg_gen').innerHTML=''; return; } var I=X.info;
  var rows=[['h','Code and materials'],
    ['o','Code','Design standard','','AS 5100.5:2017','',''],
    ['o',"f'<sub>c</sub>",'Super-T concrete strength','Materials tab M1',I.fcg+' '+DGTAG.D,'MPa','Table 3.1.2'],
    ['o','E<sub>c</sub>','Super-T elastic modulus','Materials tab M1',I.Eg+' '+DGTAG.D,'MPa','Cl 3.1.2'],
    ['o',"f'<sub>c,deck</sub>",'Deck concrete strength','Materials tab M2',I.fcd+' '+DGTAG.D,'MPa',''],
    ['o','E<sub>c,deck</sub>','Deck elastic modulus','Materials tab M2',I.Ed+' '+DGTAG.D,'MPa',''],
    ['o','f<sub>sy</sub> / E<sub>s</sub>','Reinforcement yield / modulus','Hog Calculator tab',I.fsy+' / '+I.Es,'MPa','Cl 3.2'],
    ['o','A<sub>p</sub> / E<sub>p</sub>','Strand area / modulus','Hog Calculator tab',I.Ap+' mm&sup2; / '+I.Ep+' MPa','',' Cl 3.3'],
    ['o','f<sub>pb</sub>','Strand breaking stress','MBL / A<sub>p</sub> = '+(I.mbl||'—')+' kN / '+I.Ap+' mm&sup2;',dgF(I.fpb,0)+' '+DGTAG.C,'MPa','Table 3.3.1'],
    ['h','Derived parameters'],
    ['o','&epsilon;<sub>cu</sub>','Concrete ultimate strain','code value','0.003 '+DGTAG.S,'','Cl 8.1.3'],
    ['o','&alpha;<sub>2</sub>','Stress-block intensity factor (deck / Super-T)','0.85 &minus; 0.0015f\'<sub>c</sub>, within 0.67&ndash;0.85',dgF(B.a2d,3)+' / '+dgF(B.a2g,3),'','Cl 8.1.3'],
    ['o','&gamma;','Stress-block depth factor (deck / Super-T)','0.97 &minus; 0.0025f\'<sub>c</sub>, within 0.67&ndash;0.85',dgF(B.gd,3)+' / '+dgF(B.gg,3),'','Cl 8.1.3'],
    ['o',"f'<sub>ct.f</sub>",'Flexural tensile strength (Super-T / deck)','0.6&radic;f\'<sub>c</sub>',dgF(B.fctfg,2)+' / '+dgF(B.fctfd,2),'MPa','Cl 3.1.1.3'],
    ['o','0.25&radic;f\'<sub>c</sub>','Tension limit below which crack control is deemed satisfied','0.25&radic;f\'<sub>c</sub> (Super-T)',dgF(B.fct25,2),'MPa','Cl 8.6.2'],
    ['o','&phi; (bending)','Capacity reduction factor range','0.6 &le; 1.19 &minus; 13k<sub>uo</sub>/12 &le; 0.8','0.6 &ndash; 0.8','','Table 2.3.2'],
    ['o','&phi; (shear, torsion)','Capacity reduction factor','','0.7','','Table 2.3.2'],
    ['h','Crack-control targets (set per load case in section 4)'],
    ['o','f<sub>scr</sub>','Target bar stress for crack control','steel stress increment from decompression; input per load case',DG.lc.map(function(l){ return l.fscr; }).join(' / ')+' '+DGTAG.I,'MPa','Table 8.6.2.1'],
    ['o','f<sub>tcr</sub>','Target tendon stress for crack control','tendon stress increment from decompression; input per load case',DG.lc.map(function(l){ return l.ftcr; }).join(' / ')+' '+DGTAG.I,'MPa','Table 8.6.2.1']];
  var h='<div class="dgx"><table class="dt dgt"><tr><th class="l">Symbol</th><th class="l">Description</th><th class="l">Formula / basis</th><th>Value</th><th class="l">Unit</th><th class="l">Ref.</th></tr>';
  rows.forEach(function(r){ if(r[0]==='h'){ h+='<tr class="dgh"><td colspan="6">'+r[1]+'</td></tr>'; return; } h+='<tr><td class="l sym">'+r[1]+'</td><td class="l">'+r[2]+'</td><td class="l fx">'+r[3]+'</td><td class="v">'+r[4]+'</td><td class="l">'+r[5]+'</td><td class="l ref">'+r[6]+'</td></tr>'; });
  $('dg_gen').innerHTML=h+'</table></div><div class="bbnote">The default 200 MPa for f<sub>scr</sub> and f<sub>tcr</sub> is the reference spreadsheet&rsquo;s entry. Set it from AS 5100.5 Table 8.6.2.1 for the bar diameter / spacing actually detailed (deck and Super-T reinforcement drawings are not in this set).</div>';
}
function dgPropView(X,B){
  if(!X){ $('dg_prop').innerHTML=''; return; } var I=X.info;
  var h='<div class="sdh" style="margin-top:10px">Section properties (transformed to E<sub>c</sub> of the Super-T)</div><div class="dgx"><table class="dt dgt"><tr><th class="l">Property</th><th>Super-T alone</th><th>Composite</th><th class="l">Basis</th></tr>'
   +'<tr><td class="l">Area A</td><td class="v">'+dgF(B.eg.A/1e6,4)+'</td><td class="v">'+dgF(B.ec.A/1e6,4)+'</td><td class="l">m&sup2;; fibre strips (3 mm) + bars and strands transformed '+DGTAG.C+'</td></tr>'
   +'<tr><td class="l">Centroid from deck top y<sub>c</sub></td><td class="v">'+dgF(B.eg.yc,0)+'</td><td class="v">'+dgF(B.ec.yc,0)+'</td><td class="l">mm (moments about this level)</td></tr>'
   +'<tr><td class="l">Second moment I</td><td class="v">'+dgF(B.eg.I/1e12,4)+'</td><td class="v">'+dgF(B.ec.I/1e12,4)+'</td><td class="l">m&#8308;</td></tr>'
   +'<tr><td class="l">Prestress after losses P / eccentricity e<sub>p</sub></td><td class="v">'+dgF(B.Pt,0)+' kN / '+dgF(B.ep,0)+' mm</td><td class="v">—</td><td class="l">&Sigma;&sigma;<sub>pe</sub>A<sub>p</sub>; e<sub>p</sub> below the Super-T centroid ('+I.time+')</td></tr>'
   +'<tr><td class="l">Overall depth D</td><td class="v">'+dgF(I.H,0)+'</td><td class="v">'+dgF(B.D,0)+'</td><td class="l">mm</td></tr></table></div>';
  $('dg_prop').innerHTML=h;
}
function dgHeads(){ return DG.lc.map(function(l,i){ return 'LC'+(i+1)+'<div class="dgsub">'+l.name.replace(/^LC\d+\s*/,'')+'</div>'; }); }
function dgNoRes(id,msg){ $(id).innerHTML='<div class="bbnote">'+(msg||'Press <b>Run design checks</b> to calculate.')+'</div>'; }
function dgSLSView(){
  var L=DG.lc, inp=function(i,k,v){ return '<input class="f dgl2" data-i="'+i+'" data-k="'+k+'" value="'+v+'" style="width:70px">'; };
  var R=DG.res, r=R?R.lc:null, B=R?R.base:null, v=function(f){ return L.map(function(lc,i){ return r&&r[i]?f(r[i],lc):'—'; }); };
  var rows=[['h','Inputs'],
    ['i','f<sub>scr</sub>','<b>Target bar stress for crack control</b>','steel stress increment above decompression',L.map(function(lc,i){ return inp(i,'fscr',lc.fscr); }),'MPa','Table 8.6.2.1'],
    ['i','f<sub>tcr</sub>','<b>Target tendon stress for crack control</b>','tendon stress increment above decompression',L.map(function(lc,i){ return inp(i,'ftcr',lc.ftcr); }),'MPa','Table 8.6.2.1'],
    ['o','M<sub>nc</sub>','SLS moment on the Super-T alone','section 3',L.map(function(lc){ return dgF(lc.Mnc,0); }),'kN·m',''],
    ['o','<b>M<sub>s</sub>*</b>','<b>SLS moment on the composite</b>','section 3',L.map(function(lc){ return '<b>'+dgF(lc.Ms,0)+'</b>'; }),'kN·m',''],
    ['o','N<sub>s</sub>*','SLS axial force (tension +)','section 3',L.map(function(lc){ return dgF(lc.Ns,0); }),'kN',''],
    ['h','Stage 1 &mdash; Super-T alone: prestress after losses + M<sub>nc</sub>'],
    ['o','&sigma;<sub>1,top</sub>','Super-T top fibre stress (compression &minus;)','P/A &minus; Pe/Z<sub>t</sub> + M<sub>nc</sub>/Z<sub>t</sub> (strain compatibility)',v(function(o){ return dgF(o.g1top,2); }),'MPa',''],
    ['o','&sigma;<sub>1,bot</sub>','Super-T soffit stress','P/A + Pe/Z<sub>b</sub> &minus; M<sub>nc</sub>/Z<sub>b</sub>',v(function(o){ return dgF(o.g1bot,2); }),'MPa',''],
    ['h','Stage 2 &mdash; composite: stage 1 locked in + M<sub>s</sub>* on the composite (uncracked)'],
    ['o','&sigma;<sub>t,deck</sub>','Deck top fibre stress','M<sub>s</sub>*&middot;y/I<sub>comp</sub>',v(function(o){ return dgF(o.sv.deckTop,2); }),'MPa',''],
    ['o','&sigma;<sub>t,ST</sub>','Super-T top fibre stress (total)','&sigma;<sub>1,top</sub> + &Delta;&sigma;',v(function(o){ return dgF(o.sv.girTop,2); }),'MPa',''],
    ['o','<b>&sigma;<sub>b</sub></b>','<b>Super-T soffit stress (total)</b>','&sigma;<sub>1,bot</sub> + &Delta;&sigma;',v(function(o){ return '<b>'+dgF(o.sv.girBot,2)+'</b>'; }),'MPa',''],
    ['c','&sigma;<sub>b</sub> &le; 0.25&radic;f\'<sub>c</sub>','Uncracked &mdash; crack control deemed satisfied',B?'limit '+dgF(B.fct25,2)+' MPa':'',v(function(o){ return o.uncr?'<b class="good">yes</b>':'no &rarr; check below'; }),'','Cl 8.6.2'],
    ['h','Crack control by steel stress increment'],
    ['o','M<sub>dec</sub>','Decompression moment (composite increment at which the soffit stress = 0)','bisection on &sigma;<sub>b</sub>(M) = 0',v(function(o){ return dgF(o.Mdec,0); }),'kN·m',''],
    ['o','&Delta;&sigma;<sub>s</sub>(M<sub>s</sub>*)','Bar stress increment at M<sub>s</sub>* (cracked, tension bars)','&sigma;<sub>s</sub>(M<sub>s</sub>*) &minus; &sigma;<sub>s</sub>(M<sub>dec</sub>); 0 if M<sub>s</sub>* &le; M<sub>dec</sub>',v(function(o,lc){ return dgF(o.inc.b>-1e8?o.inc.b:0,1)+' <span class="dgg">&le; '+lc.fscr+'</span>'; }),'MPa','Table 8.6.2.1'],
    ['o','&Delta;&sigma;<sub>p</sub>(M<sub>s</sub>*)','Tendon stress increment at M<sub>s</sub>*','&sigma;<sub>p</sub>(M<sub>s</sub>*) &minus; &sigma;<sub>p</sub>(M<sub>dec</sub>)',v(function(o,lc){ return dgF(o.inc.t>-1e8?o.inc.t:0,1)+' <span class="dgg">&le; '+lc.ftcr+'</span>'; }),'MPa','Table 8.6.2.1'],
    ['o','<b>M<sub>s,allow</sub></b>','<b>Allowable SLS moment</b> (composite)','largest M with &Delta;&sigma;<sub>s</sub> &le; f<sub>scr</sub> and &Delta;&sigma;<sub>p</sub> &le; f<sub>tcr</sub>',v(function(o){ return '<b>'+dgF(o.Mal,0)+'</b>'; }),'kN·m','Cl 8.6.2'],
    ['o','&Delta;&sigma;<sub>s</sub> / &Delta;&sigma;<sub>p</sub> at M<sub>s,allow</sub>','Increments at the allowable moment (one equals its target)','',v(function(o){ return dgF(o.qa.b,0)+' / '+dgF(o.qa.t,0); }),'MPa',''],
    ['o','d<sub>na</sub>','Depth of neutral axis at M<sub>s</sub>* (from deck top; total strain plane in the Super-T)','&minus;&epsilon;<sub>0</sub>/&kappa;',v(function(o){ return dgF(o.dna,0)+(o.dna>R.base.D||o.dna<0?' <span class="dgg">(outside)</span>':''); }),'mm',''],
    ['o','&kappa;','Curvature at M<sub>s</sub>* (sagging +)','&kappa;<sub>stage 1</sub> + &kappa;<sub>stage 2</sub>',v(function(o){ return dgE(o.kap); }),'1/mm',''],
    ['u','<b>M<sub>s</sub>*/M<sub>s,allow</sub></b>','<b>SLS utilisation</b> (at constant axial force)','M<sub>s</sub>* / M<sub>s,allow</sub>',v(function(o){ return dgU(o.uS); }),'','Cl 8.6.2'],
    ['c','Crack control','Section adequate for crack control','uncracked, or M<sub>s</sub>* &le; M<sub>s,allow</sub>',v(function(o){ return dgOK(o.okS); }),'','Cl 8.6.2']];
  var plot='';
  if(R){ var o=r[DG.sel], lcS=DG.lc[DG.sel]; plot='<div class="sdh" style="margin-top:12px">Diagrams &mdash; '+lcS.name+' (pick the load case under step 6)</div>'+dgSLSDiag(o,lcS)+'<div class="dg2b">'+dgCrackDiag(o,lcS)+dgMKDiag(o,lcS)+'</div>'; }
  $('dg_sls').innerHTML=(R?'<div class="sdh">4a. Transfer</div>'+dgTransferBlock()+'<div class="sdh" style="margin-top:14px">4b. Service</div>':'')+dgTab(rows,dgHeads())+plot
    +'<div class="bbnote">Procedure (as the reference spreadsheet): find the decompression moment, then the largest composite moment for which the steel stress increments from decompression stay within f<sub>scr</sub> (bars in the tension half) and f<sub>tcr</sub> (strands). Staged: the Super-T is stressed by prestress and M<sub>nc</sub> before the deck acts.</div>';
  ['dg_trc','dg_trt'].forEach(function(id,k){ var el=$(id); if(el) el.onchange=function(){ var v=el.value.trim(); DG.trLim[k?'t':'c']=v===''?null:+v; DG.trLim.src='user'; DG.trLim[k?'kt':'kc']=null; dgSLSView(); }; });
  document.querySelectorAll('.dgl2').forEach(function(el){ el.onchange=function(){ DG.lc[+el.getAttribute('data-i')][el.getAttribute('data-k')]=+el.value||0; if(DG.res) dgRun(); else dgAll(); }; });
  if(!R){ var n=document.createElement('div'); n.className='bbnote'; n.innerHTML='Press <b>Run design checks</b> to calculate the outputs.'; $('dg_sls').prepend(n); }
}
function dgULBView(){
  var R=DG.res; if(!R){ dgNoRes('dg_ulb'); return; }
  var r=R.lc, L=DG.lc, v=function(f){ return L.map(function(lc,i){ return f(r[i],lc); }); };
  var rows=[['h','Inputs'],
    ['o','<b>M*</b>','<b>Applied ultimate moment</b> (sagging +)','section 3',v(function(o,lc){ return '<b>'+dgF(lc.Mu,0)+'</b>'; }),'kN·m',''],
    ['o','N*','Applied ultimate axial force (tension +)','section 3',v(function(o,lc){ return dgF(lc.Nu,0); }),'kN',''],
    ['h','Analysis (rectangular stress block, strain compatibility, &epsilon;<sub>cu</sub> = 0.003)'],
    ['o','Face','Compression face','top if M* &ge; 0, else bottom',v(function(o){ return o.face==='top'?'deck top':'soffit'; }),'',''],
    ['o','d<sub>n</sub>','Depth of neutral axis at N*','&Sigma;F = N*',v(function(o){ return dgF(o.dn,1); }),'mm',''],
    ['o','k<sub>uo</sub>','Neutral axis parameter','d<sub>n</sub> / d<sub>o</sub> (d<sub>o</sub> = deepest steel)',v(function(o){ return dgF(o.kuo,4); }),'','Cl 8.1.5'],
    ['c','k<sub>uo</sub> &le; 0.36','Ductility limit','',v(function(o){ return dgOK(o.kuo<=0.36); }),'','Cl 8.1.5'],
    ['o','&gamma;','Stress-block depth factor (compression-face concrete)','0.97 &minus; 0.0025f\'<sub>c</sub>',v(function(o){ return dgF(o.gam,3); }),'','Cl 8.1.3'],
    ['o','&phi;','Capacity reduction factor','1.19 &minus; 13k<sub>uo</sub>/12 (0.6&ndash;0.8); reduced towards 0.6 for N* &lt; 0 above N<sub>ub</sub>',v(function(o){ return dgF(o.phi,3); }),'','Table 2.3.2'],
    ['o','M<sub>u</sub>','Nominal moment capacity at N*','&Sigma;F&middot;(y &minus; y<sub>c</sub>)',v(function(o){ return dgF(o.Mu,0); }),'kN·m','Cl 8.1'],
    ['o','<b>&phi;M<sub>u</sub></b>','<b>Design moment capacity</b>','&phi; &times; M<sub>u</sub>',v(function(o){ return '<b>'+dgF(o.phiMu,0)+'</b>'; }),'kN·m','Cl 8.1.5'],
    ['h','Minimum strength'],
    ['o','M<sub>cr</sub>','Cracking moment (staged: M<sub>nc</sub> + composite increment to f\'<sub>ct.f</sub>)','soffit (sagging) or deck top (hogging) at 0.6&radic;f\'<sub>c</sub>',v(function(o){ return dgF(o.face==='top'?o.Mcr:o.McrH,0); }),'kN·m','Cl 3.1.1.3'],
    ['o','M<sub>uo</sub>','Pure bending capacity (N = 0)','',v(function(o){ return dgF(o.Muo,0); }),'kN·m',''],
    ['o','M<sub>uo,min</sub>','Minimum strength requirement','1.2 M<sub>cr</sub>',v(function(o){ return dgF(o.Muomin,0); }),'kN·m','Cl 8.1.5 (verify)'],
    ['c','M<sub>uo</sub> &ge; M<sub>uo,min</sub>','Minimum strength','',v(function(o){ return dgOK(o.okMin); }),'',''],
    ['u','<b>M*/&phi;M<sub>u</sub></b>','<b>ULS bending utilisation</b>','|M*| / |&phi;M<sub>u</sub>|',v(function(o){ return dgU(o.uB); }),'','']];
  /* N-M diagram */
  var o=r[DG.sel], top=DSG2.nm(o.Su,'top',o.yc), bot=DSG2.nm(o.Su,'bot',o.yc), map=function(c,f){ return c.pts.map(function(p){ return [f?p.phi*p.M:p.M, -(f?p.phi*p.N:p.N)]; }); };
  var nmP=dgPlot({w:560,h:360,xl:'M (kN·m, sagging +)',yl:'N (kN, compression +)',series:[{p:map(top,0),c:'var(--muted)',dash:'5 3',wd:1.2,lab:'nominal M<tspan baseline-shift="sub">u</tspan>, N<tspan baseline-shift="sub">u</tspan>'},{p:map(bot,0),c:'var(--muted)',dash:'5 3',wd:1.2},{p:map(top,1),c:'var(--instr)',lab:'&phi;M<tspan baseline-shift="sub">u</tspan>, &phi;N<tspan baseline-shift="sub">u</tspan>'},{p:map(bot,1),c:'var(--instr)'}],
    pts:L.map(function(lc,i){ return {x:lc.Mu,y:-lc.Nu,lab:'LC'+(i+1),c:i===DG.sel?'var(--flag)':'var(--calc)'}; })});
  $('dg_ulb').innerHTML=dgTab(rows,dgHeads())+'<div class="sdh" style="margin-top:12px">Section analysis diagram</div>'+dgULSDiag(o,DG.lc[DG.sel])+'<div class="sdh" style="margin-top:12px">N&ndash;M interaction diagram (composite section, '+DG.lc[DG.sel].name+' prestrain)</div><div class="dg2"><div>'+nmP+'</div><div class="bbnote" style="align-self:center">Curves come from the same strain-compatibility engine, sweeping the neutral axis from each face. Right branch: deck top in compression (sagging); left branch: soffit in compression (hogging). &phi; follows Table 2.3.2 (bending value from k<sub>uo</sub>, reducing to 0.6 above the balanced load N<sub>ub</sub> = '+dgF(o.Nub,0)+' kN compression is negative here). Points are the ULS load cases (M*, N*). Strand stress from a Mattock-type curve (A = 0.025, B = 118, C = 10, capped at f<sub>pb</sub>) &mdash; <b>method, verify</b>.</div></div>';
}
function dgDetView(X,B){
  var d=DG.det, G=B?B.geo:null, inp=function(k,w){ return '<input class="f dgd" data-k="'+k+'" value="'+(d[k]===null?'':d[k])+'" style="width:'+(w||64)+'px">'; }, tg=function(ks){ return ks.every(function(k){ return d[k]!==null&&d[k]!==''; })?(d.ex?DGTAG.X:DGTAG.I):DGTAG.M; };
  var A=function(n,dd,s){ return n>0&&dd>0&&s>0?n*Math.PI*dd*dd/4*1000/s:null; };
  var h='<div class="msbar"><button class="b" id="dg_ex">Use the reference spreadsheet&rsquo;s detailing (example only)</button><button class="b" id="dg_exc">Clear</button><span class="bbnote" style="margin:0">Ligature and cover drawings for BR13A are not in this set.</span></div>'
   +'<div class="dgstack"><div class="dgx"><table class="dt dgt" style="max-width:760px"><tr><th class="l">Reinforcement provided for shear only</th><th>Value</th><th class="l">Tag</th></tr>'
   +'<tr class="dgi"><td class="l">Fitment diameter d (mm)</td><td class="v">'+inp('svd')+'</td><td class="l" rowspan="3">'+tg(['svd','svn','svs'])+'</td></tr>'
   +'<tr class="dgi"><td class="l">Number of legs n (both webs)</td><td class="v">'+inp('svn')+'</td></tr><tr class="dgi"><td class="l">Spacing s (mm)</td><td class="v">'+inp('svs')+'</td></tr>'
   +'<tr><td class="l">A<sub>sv</sub>/s = n&pi;d&sup2;/4 &times; 1000/s</td><td class="v">'+dgF(A(d.svn,d.svd,d.svs),1)+'</td><td class="l">mm&sup2;/m</td></tr>'
   +'<tr><th class="l">Reinforcement provided for torsion and shear (closed ties)</th><th></th><th></th></tr>'
   +'<tr class="dgi"><td class="l">Fitment diameter d (mm)</td><td class="v">'+inp('tvd')+'</td><td class="l" rowspan="3">'+tg(['tvd','tvn','tvs'])+'</td></tr>'
   +'<tr class="dgi"><td class="l">Number of bars per tie n</td><td class="v">'+inp('tvn')+'</td></tr><tr class="dgi"><td class="l">Spacing s (mm)</td><td class="v">'+inp('tvs')+'</td></tr>'
   +'<tr><td class="l">A<sub>sw</sub>/s = n&pi;d&sup2;/4 &times; 1000/s</td><td class="v">'+dgF(A(d.tvn,d.tvd,d.tvs),1)+'</td><td class="l">mm&sup2;/m</td></tr>'
   +'<tr><th class="l">General</th><th></th><th></th></tr>'
   +'<tr class="dgi"><td class="l">Fitment yield f<sub>sy.f</sub> (MPa)</td><td class="v">'+inp('fsyf')+'</td><td class="l">'+tg(['fsyf'])+'</td></tr>'
   +'<tr class="dgi"><td class="l">Clear cover &mdash; Super-T sides / soffit (mm)</td><td class="v">'+inp('cs')+'</td><td class="l">'+tg(['cs'])+'</td></tr>'
   +'<tr class="dgi"><td class="l">Clear cover &mdash; deck top (mm)</td><td class="v">'+inp('ct')+'</td><td class="l">'+tg(['ct'])+'</td></tr>'
   +'<tr class="dgi"><td class="l">Max. nominal aggregate size d<sub>g</sub> (mm) &mdash; only used if A<sub>sv</sub> &lt; A<sub>sv,min</sub></td><td class="v">'+inp('dg')+'</td><td class="l">'+tg(['dg'])+'</td></tr>'
   +'<tr><td class="l">Vertical component of prestress P<sub>v</sub></td><td class="v">0</td><td class="l">'+DGTAG.C+' straight strands (Hog tab)</td></tr></table></div><div class="dgx">';
  if(G){ var r=function(a,b,c,dd,e){ return '<tr><td class="l sym">'+a+'</td><td class="l">'+b+'</td><td class="l fx">'+c+'</td><td class="v">'+dd+'</td><td class="l">'+e+'</td></tr>'; };
    h+='<table class="dt dgt"><tr><th class="l">Symbol</th><th class="l">Torsion / shear geometry</th><th class="l">Basis</th><th>Value</th><th class="l">Unit</th></tr>'
     +r('b<sub>v</sub>','Effective web width (two webs)','2 &times; min. web thickness normal to the web, Hog outline',dgF(G.bv,1)+' '+DGTAG.C,'mm')
     +r('A<sub>cp</sub>','Area enclosed by the outside perimeter','trapezoid: outer web faces from soffit to deck top',dgF(G.Acp,0)+' '+DGTAG.C,'mm&sup2;')
     +r('u<sub>c</sub>','Outside perimeter','',dgF(G.uc,1)+' '+DGTAG.C,'mm')
     +r('A<sub>o</sub>','Area enclosed by the shear-flow path','wall mid-lines: webs, bottom flange (t<sub>b</sub>/2), deck mid-depth',dgF(G.Ao,0)+' '+DGTAG.C,'mm&sup2;')
     +r('A<sub>oh</sub>','Area enclosed by the closed-tie centreline','outer faces inset by cover + d/2',G.ok?dgF(G.Aoh,0)+' '+DGTAG.C:DGTAG.M,'mm&sup2;')
     +r('u<sub>h</sub>','Perimeter of the closed-tie centreline','',G.ok?dgF(G.uh,1)+' '+DGTAG.C:DGTAG.M,'mm')
     +r('y<sub>1</sub>','Larger dimension of the closed tie','',G.ok?dgF(G.y1,0)+' '+DGTAG.C:DGTAG.M,'mm')
     +'</table><div class="bbnote">The Super-T trough closed by the deck is treated as a single-cell box. Web slope '+dgF(G.sl,4)+' (horizontal per vertical) from the Hog outline.</div>'; }
  h+='</div></div>';
  $('dg_det').innerHTML=h;
  document.querySelectorAll('.dgd').forEach(function(el){ el.onchange=function(){ var v=el.value.trim(); d[el.getAttribute('data-k')]=v===''?null:+v; d.ex=false; DG.res=null; dgAll(); }; });
  $('dg_ex').onclick=function(){ Object.assign(d,{svd:20,svn:2,svs:150,tvd:20,tvn:1,tvs:150,cs:50,ct:40,dg:14,fsyf:500,ex:true}); DG.res=null; dgAll(); };
  $('dg_exc').onclick=function(){ Object.assign(d,{svd:null,svn:null,svs:null,tvd:null,tvn:null,tvs:null,cs:null,ct:null,dg:null,fsyf:null,ex:false}); DG.res=null; dgAll(); };
}
function dgULVView(){
  var R=DG.res, sel='<div class="msbar" style="margin-top:10px"><label>Plot / profile load case <select id="dg_sel">'+DG.lc.map(function(l,i){ return '<option value="'+i+'"'+(i===DG.sel?' selected':'')+'>LC'+(i+1)+' '+l.name.replace(/^LC\d+\s*/,'')+'</option>'; }).join('')+'</select></label></div>';
  if(!R){ $('dg_ulv').innerHTML=sel+'<div class="bbnote">Press <b>Run design checks</b> to calculate.</div>'; dgSelBind(); return; }
  var r=R.lc, L=DG.lc, v=function(f){ return L.map(function(lc,i){ var o=r[i]; return o.sh?f(o.sh,o,lc):'<span class="bbflag">—</span>'; }); }, vv=function(f){ return L.map(function(lc,i){ return f(r[i],lc); }); };
  var rows=[['h','Inputs'],
    ['o','<b>V*</b>','<b>Applied ultimate shear</b>','section 3',vv(function(o,lc){ return '<b>'+dgF(lc.Vu,0)+'</b>'; }),'kN',''],
    ['o','<b>T*</b>','<b>Applied ultimate torsion</b>','section 3',vv(function(o,lc){ return '<b>'+dgF(lc.Tu,0)+'</b>'; }),'kN·m','Cl 8.2.1.2'],
    ['o','M*','Concurrent ultimate moment','section 3',vv(function(o,lc){ return dgF(lc.Mu,0); }),'kN·m',''],
    ['o','N*','Concurrent axial force (tension +)','section 3',vv(function(o,lc){ return dgF(lc.Nu,0); }),'kN',''],
    ['h','Section parameters'],
    ['o','d','Depth to the resultant of tension-side steel','A&middot;f<sub>y</sub>-weighted (bars + strands in the tension half)',vv(function(o){ return dgF(o.dres,0); }),'mm',''],
    ['o','d<sub>v</sub>','Effective shear depth','max(0.72D, 0.9d)',vv(function(o){ return dgF(o.dv,1); }),'mm','Cl 8.2.1.9'],
    ['o','b<sub>v</sub>','Effective web width','section 6 geometry',vv(function(o){ return dgF(o.B.geo.bv,1)+(o.solid?' <span class="dgg">solid</span>':''); }),'mm','Cl 8.2.1.5'],
    ['o','A<sub>st</sub> / A<sub>pt</sub>','Tension-side bars / strands','in the tension half of D',vv(function(o){ return dgF(o.Ast,0)+' / '+dgF(o.Apt,0); }),'mm&sup2;',''],
    ['o','A<sub>ct</sub>','Concrete area on the tension side','',vv(function(o){ return dgF(o.Act/1e3,0)+'&times;10&sup3;'; }),'mm&sup2;',''],
    ['o','&sigma;<sub>po</sub>','Strand stress when the surrounding concrete is at zero strain','E<sub>p</sub>(&epsilon;<sub>pe</sub> + |&epsilon;<sub>ce</sub>|)',vv(function(o){ return dgF(o.spo,0); }),'MPa',''],
    ['h','General method'],
    ['o','V<sub>eff</sub>','Shear including torsion on the walls','&radic;[(V* &minus; P<sub>v</sub>)&sup2; + (0.9T*u<sub>h</sub>/2A<sub>o</sub>)&sup2;]',v(function(s){ return dgF(s.Veff/1e3,0); }),'kN',''],
    ['o','&epsilon;<sub>x</sub>','Longitudinal strain at mid-depth','[|M*|/d<sub>v</sub> + V<sub>eff</sub> + 0.5N* &minus; A<sub>pt</sub>&sigma;<sub>po</sub>] / '+'[2(E<sub>s</sub>A<sub>st</sub> + E<sub>p</sub>A<sub>pt</sub>)] (+E<sub>c</sub>A<sub>ct</sub> if negative); &minus;0.2&times;10&#8315;&sup3; &le; &epsilon;<sub>x</sub> &le; 3&times;10&#8315;&sup3;',v(function(s){ return dgE(s.ex); }),'','Cl 8.2.4.4'],
    ['o','&theta;<sub>v</sub>','Compression strut angle','29 + 7000&epsilon;<sub>x</sub>',v(function(s){ return dgF(s.th,2); }),'deg','Cl 8.2.4.2'],
    ['o','k<sub>v</sub>','Concrete shear factor','0.4/(1 + 1500&epsilon;<sub>x</sub>) [&times; 1300/(1000 + k<sub>dg</sub>d<sub>v</sub>) if A<sub>sv</sub> &lt; A<sub>sv,min</sub>]',v(function(s){ return dgF(s.kv,4); }),'','Cl 8.2.4.2'],
    ['h','Capacities (&phi; = 0.7)'],
    ['o','&phi;V<sub>uc</sub>','Concrete contribution','&phi;k<sub>v</sub>b<sub>v</sub>d<sub>v</sub>&radic;f\'<sub>c</sub> (&radic;f\'<sub>c</sub> &le; 8)',v(function(s){ return dgF(s.phi*s.Vuc/1e3,0); }),'kN','Cl 8.2.4.1'],
    ['o','&phi;V<sub>us</sub>','Shear reinforcement contribution','&phi;(A<sub>sv</sub>/s)f<sub>sy.f</sub>d<sub>v</sub>cot&theta;<sub>v</sub>',v(function(s){ return dgF(s.phi*s.Vus/1e3,0); }),'kN','Cl 8.2.5.2'],
    ['o','&phi;V<sub>u.max</sub>','Web crushing limit','&phi;0.55f\'<sub>c</sub>b<sub>v</sub>d<sub>v</sub>cot&theta;/(1 + cot&sup2;&theta;)',v(function(s){ return dgF(s.phi*s.Vumax/1e3,0); }),'kN','Cl 8.2.3.3'],
    ['o','&phi;T<sub>us</sub>','Torsion reinforcement contribution','&phi;(A<sub>sw</sub>/s)f<sub>sy.f</sub>2A<sub>o</sub>cot&theta;<sub>v</sub>',v(function(s){ return dgF(s.phi*s.Tus/1e6,0); }),'kN·m','Cl 8.2.5.6'],
    ['o','&phi;T<sub>cr</sub>','Factored cracking torsion','&phi;0.33&radic;f\'<sub>c</sub>A<sub>cp</sub>&sup2;/u<sub>c</sub>',v(function(s){ return dgF(s.phi*s.Tcr/1e6,0); }),'kN·m',''],
    ['o','F<sub>td</sub> / F<sub>t,cap</sub>','Longitudinal tension demand / capacity','|M*|/(&phi;<sub>b</sub>d<sub>v</sub>), &phi;<sub>b</sub> = 0.8; + 0.5N*/&phi; + cot&theta;&radic;[(V*/&phi; &minus; P<sub>v</sub> &minus; 0.5V<sub>us</sub>)&sup2; + (0.45u<sub>h</sub>T*/2A<sub>o</sub>&phi;)&sup2;] ; A<sub>st</sub>f<sub>sy</sub> + A<sub>pt</sub>f<sub>pb</sub>',v(function(s){ return dgF(s.Ftd/1e3,0)+' / '+dgF(s.Ftp/1e3,0); }),'kN','Cl 8.2.7'],
    ['h','Utilisations'],
    ['u','&phi;V<sub>u.max</sub>','Web crushing','V<sub>eff</sub> / &phi;V<sub>u.max</sub>',v(function(s){ return dgU(s.uCr); }),'','Cl 8.2.3.1'],
    ['u','&phi;(V<sub>uc</sub>+V<sub>us</sub>)','Shear','V<sub>eff</sub> / &phi;(V<sub>uc</sub> + V<sub>us</sub>)',v(function(s){ return dgU(s.uV); }),'','Cl 8.2.3.1'],
    ['u','&phi;T<sub>us</sub>','Torsion','T* / &phi;T<sub>us</sub>',v(function(s){ return dgU(s.uT); }),'',''],
    ['u','Long.','Longitudinal reinforcement','F<sub>td</sub> / F<sub>t,cap</sub>',v(function(s){ return dgU(s.uL); }),'','Cl 8.2.7'],
    ['u','<b>Governing</b>','<b>Governing shear / torsion utilisation</b>','max of the above',v(function(s){ return dgU(s.u); }),'',''],
    ['h','Minimum reinforcement'],
    ['o','A<sub>sv,min</sub>/s','Minimum shear reinforcement','0.08&radic;f\'<sub>c</sub>b<sub>v</sub>/f<sub>sy.f</sub>',v(function(s){ return dgF(s.AsvMin*1000,1)+' <span class="dgg">vs '+dgF(s.Asv*1000,0)+'</span>'; }),'mm&sup2;/m','Cl 8.2.1.7'],
    ['c','Shear detailing','A<sub>sv</sub>/s &ge; A<sub>sv,min</sub>/s','all vertical legs',v(function(s){ return dgOK(s.minV); }),'','Cl 8.2.1.7'],
    ['o','A<sub>sw,min</sub>/s','Minimum torsion reinforcement','0.2y<sub>1</sub>/f<sub>sy.f</sub>',v(function(s,o){ return dgF(s.AswMin*1000,1)+' <span class="dgg">vs '+dgF(o.Q.AswS*1000,0)+'</span>'; }),'mm&sup2;/m','Cl 8.2.5.5'],
    ['c','Torsion detailing','A<sub>sw</sub>/s &ge; A<sub>sw,min</sub>/s','closed ties',v(function(s){ return dgOK(s.minT); }),'','Cl 8.2.5.5']];
  var why=L.map(function(lc,i){ return r[i].shWhy?'LC'+(i+1)+': '+r[i].shWhy:null; }).filter(Boolean);
  var o=r[DG.sel], lc=L[DG.sel], plot='';
  if(o.sh){ var Mx=(o.Muo||o.Mu||1)*1.05, cv=DSG2.vm(o.Q,{T:lc.Tu,N:lc.Nu},Mx), cv0=DSG2.vm(o.Q,{T:0,N:lc.Nu},Mx);
    plot='<div class="sdh" style="margin-top:12px">V&ndash;M interaction &mdash; '+lc.name+'</div><div class="dg2"><div>'+dgPlot({w:560,h:340,xl:'M* (kN·m)',yl:'V* (kN)',
      series:[{p:cv.map(function(q){ return [q.M,q.V]; }),c:'var(--instr)',lab:'&phi;V<tspan baseline-shift="sub">u</tspan>(M) at T* = '+dgF(lc.Tu,0)+' kN·m'},{p:cv0.map(function(q){ return [q.M,q.V]; }),c:'var(--muted)',dash:'5 3',wd:1.2,lab:'T* = 0'}],
      pts:[{x:lc.Mu,y:lc.Vu,lab:'LC'+(DG.sel+1)}]})+'</div><div class="bbnote" style="align-self:center">For each moment the shear that brings the governing of web crushing, shear (V<sub>uc</sub> + V<sub>us</sub>) and longitudinal tension (Cl 8.2.7) to 1.0 is found, with the load case&rsquo;s T* and N* held. At low M web crushing usually governs, and its limit rises as &epsilon;<sub>x</sub> and so &theta;<sub>v</sub> increase with M; at high M the longitudinal tension check (Cl 8.2.7) takes over and the capacity drops to zero where |M*|/(&phi;<sub>b</sub>d<sub>v</sub>) alone uses the tension-side steel. Strand f<sub>pb</sub> is taken fully developed (transfer length near the support not deducted &mdash; check). The point is (M*, V*); inside the curve is adequate.</div></div>'; }
  $('dg_ulv').innerHTML=sel+dgTab(rows,dgHeads())+(why.length?'<div class="bbnote bbflag">Not calculated &mdash; '+why.join('; ')+'.</div>':'')+plot
    +'<div class="bbnote">Shear and torsion per the AS 5100.5 Cl 8.2 general method. Torsion uses the closed box (Super-T trough + deck). Traffic torsion is enveloped separately from shear (conservative).</div>';
  dgSelBind();
}
function dgSelBind(){ var s=$('dg_sel'); if(s) s.onchange=function(){ DG.sel=+s.value; dgSLSView(); dgULBView(); dgULVView(); }; }
function dgSumView(){
  var R=DG.res; if(!R){ $('dg_sum').innerHTML='<div class="bbnote">Fill the load cases (or type them in section 3) and press <b>Run design checks</b>.</div>'+dgFlags(); return; }
  var r=R.lc, L=DG.lc, items=[], worst={u:0,n:''};
  var h='<div class="dgx"><table class="dt dgt"><tr><th class="l">Check</th><th class="l">Clause</th>'+dgHeads().map(function(x){ return '<th>'+x+'</th>'; }).join('')+'</tr>';
  var row=function(nm,cl,f,isU){ h+='<tr><td class="l">'+nm+'</td><td class="l ref">'+cl+'</td>'+L.map(function(lc,i){ var v=f(r[i],lc); if(isU&&typeof v==='number'&&isFinite(v)&&v>worst.u) worst={u:v,n:nm+' ('+'LC'+(i+1)+')'}; return '<td class="v">'+(isU?dgU(v):v)+'</td>'; }).join('')+'</tr>'; };
  row('M<sub>s</sub>* / M<sub>s,allow</sub> &mdash; SLS crack control','Cl 8.6.2',function(o){ return Math.max(0,o.uS); },true);
  row('Soffit stress &le; 0.25&radic;f\'<sub>c</sub> (uncracked)','Cl 8.6.2',function(o){ return dgF(o.sv.girBot,2)+' MPa '+(o.uncr?'<b class="good">yes</b>':'no'); });
  row('M<sub>s</sub>* vs M<sub>s,allow</sub> (kN·m)','',function(o,lc){ return dgF(lc.Ms,0)+' / '+dgF(o.Mal,0); });
  row('M* / &phi;M<sub>u</sub> &mdash; ULS bending','Cl 8.1',function(o){ return o.uB; },true);
  row('M* vs &phi;M<sub>u</sub> (kN·m)','',function(o,lc){ return dgF(lc.Mu,0)+' / '+dgF(o.phiMu,0); });
  row('k<sub>uo</sub> &le; 0.36','Cl 8.1.5',function(o){ return dgF(o.kuo,3)+' '+dgOK(o.kuo<=0.36); });
  row('M<sub>uo</sub> &ge; 1.2M<sub>cr</sub>','Cl 8.1.5',function(o){ return dgOK(o.okMin); });
  row('Web crushing','Cl 8.2.3.1',function(o){ return o.sh?o.sh.uCr:null; },true);
  row('Shear &phi;(V<sub>uc</sub>+V<sub>us</sub>)','Cl 8.2.3.1',function(o){ return o.sh?o.sh.uV:null; },true);
  row('Torsion','Cl 8.2.5.6',function(o){ return o.sh?o.sh.uT:null; },true);
  row('Longitudinal reinforcement','Cl 8.2.7',function(o){ return o.sh?o.sh.uL:null; },true);
  row('Minimum shear / torsion reinforcement','Cl 8.2.1.7 / 8.2.5.5',function(o){ return o.sh?dgOK(o.sh.minV)+' / '+dgOK(o.sh.minT):'<span class="bbflag">—</span>'; });
  h+='</table></div>';
  var allOK=r.every(function(o){ return o.okS&&o.uB<=1&&o.kuo<=0.36&&o.okMin!==false&&(!o.sh||o.sh.u<=1&&o.sh.minV&&o.sh.minT); }), complete=r.every(function(o){ return o.sh; });
  var ban='<div class="dgban '+(allOK?(complete?'ok':'part'):'ng')+'"><b>'+(allOK?(complete?'Section adequate for the load cases checked':'Bending and SLS adequate &mdash; shear / torsion incomplete'):'Section NOT adequate')+'</b><span>Max utilisation '+anFmt(worst.u,3)+' &mdash; '+worst.n+'</span></div>';
  $('dg_sum').innerHTML=ban+h+dgFlags();
}
function dgFlags(){
  var f=[]; (DG.warn||[]).forEach(function(w){ f.push(w); });
  if(!DG.deckBars.some(function(r){ return r.d>0&&r.s>0; })) f.push('Deck slab reinforcement not entered (drawing not in this set)');
  var d=DG.det; if(d.ex) f.push('Shear / torsion detailing is the reference spreadsheet&rsquo;s example, not BR13A'); else if(!(d.svd>0&&d.tvd>0&&d.cs!==null&&d.ct!==null&&d.fsyf>0)) f.push('Ligatures, covers and f<sub>sy.f</sub> not entered &mdash; shear and torsion not checked');
  f.push('f<sub>scr</sub> / f<sub>tcr</sub> = reference default unless changed; confirm from Table 8.6.2.1');
  f.push('Barrier weight in SDL is Missing &mdash; Flagged (Loads tab)');
  if(DG.lc.some(function(lc){ return lc.brk&&lc.brk.a.TRF.noT; })) f.push('Traffic torsion not enveloped &mdash; T* has no traffic share');
  return '<div class="sdh" style="margin-top:10px">Needs review</div><ul class="dgfl">'+f.map(function(x){ return '<li>'+x+'</li>'; }).join('')+'</ul>';
}
/* engine benchmark against the reference spreadsheet's cached outputs (not fitted) */
function dgBench(){
  var L=[{h:200,b1:4020,b2:4020,E:34800,fc:50},{h:35,b1:4020,b2:4020,v1:1410,v2:1410,E:37400,fc:65},{h:55,b1:4020,b2:4020,v1:1310,v2:1299.2144,E:37400,fc:65},{h:75,b1:2019.067,b2:1819.067,v1:1299.2144,v2:1284.5068,E:37400,fc:65},
    {h:1667,b1:1819.067,b2:1492.1654,v1:1284.5068,v2:957.6052,E:37400,fc:65},{h:58,b1:1492.1654,b2:1480.7915,v1:957.6052,v2:0,E:37400,fc:65},{h:310,b1:1480.7915,b2:1420,E:37400,fc:65}];
  var bars=[[28,16,27],[137,16,27],[255,20,2],[1432,12,2],[1632,12,2],[1832,12,2],[2032,24,2],[2092,28,2],[2364,32,2]].map(function(r){ return {y:r[0],A:Math.PI/4*r[1]*r[1]*r[2],E:200000,fsy:500}; });
  var tend=[[2130,18,909],[2180,26,907],[2230,26,904],[2280,26,902],[2230,24,900]].map(function(r){ return {y:r[0],A:143*r[1],E:195000,fpb:1830,eu:0.06,pre:r[2]/195000,epe:r[2]/195000}; });
  var S={conc:DSG.stripsFromLayers(L,2),bars:bars,tend:tend}, yr=DSG.elastic(S,37400).yc, H=2400;
  var run=function(M,cr){ var s=DSG.solveSLS(S,0,M*1e6,yr,cr); return {top:S.conc[0].E*s.e0, bot:S.conc[S.conc.length-1].E*(s.e0+s.k*H), bars:S.bars.map(function(b){ return b.E*(s.e0+s.k*b.y); }), tend:S.tend.map(function(t){ return t.E*(s.e0+s.k*t.y+t.pre); })}; };
  var a=run(15000,false), lo=0, hi=1e5; for(var i=0;i<60;i++){ var m=(lo+hi)/2; if(run(m,false).bot<0) lo=m; else hi=m; } var Md=lo, b0=run(Md,false);
  var inc=function(M){ var q=run(M,true), db=-1e9, dt=-1e9; q.bars.forEach(function(v,j){ if(S.bars[j].y>yr) db=Math.max(db,v-b0.bars[j]); }); q.tend.forEach(function(v,j){ dt=Math.max(dt,v-b0.tend[j]); }); return {db:db,dt:dt}; };
  lo=Md; hi=1e5; for(var k=0;k<60;k++){ var m2=(lo+hi)/2, q=inc(m2); if(Math.max(q.db,q.dt)<200) lo=m2; else hi=m2; }
  var u=DSG2.muAtN(S,0,'top',yr), phi=DSG2.phiB(u.kuo), fctf=0.6*Math.sqrt(65), l2=0, h2=2e5; for(var j=0;j<70;j++){ var m3=(l2+h2)/2; if(run(m3,false).bot<fctf) l2=m3; else h2=m3; }
  /* shear and torsion: the spreadsheet's geometry inputs (uh, Ao, Aoh, Acp, uc, y1, bv) and detailing, with this engine's dv / eps_x */
  var half=H/2, Ast=0, Apt=0, spo=0, Act=0, nf=0, df=0;
  S.bars.forEach(function(b){ if(b.y>half){ Ast+=b.A; nf+=b.A*b.fsy; df+=b.A*b.fsy*b.y; } }); S.tend.forEach(function(t){ if(t.y>half){ Apt+=t.A; spo+=t.A*t.E*t.pre; nf+=t.A*t.fpb; df+=t.A*t.fpb*t.y; } }); spo/=Apt;
  S.conc.forEach(function(c){ if(c.y>half) Act+=c.b*c.h; }); var dv=Math.max(0.72*H,0.9*df/nf);
  var Q={bv:300,dv:dv,fc:65,Ec:37400,Es:200000,Ep:195000,Ast:Ast,Apt:Apt,spo:spo,Act:Act,fsyf:500,fsy:500,fpb:1830,AsvS:Math.PI/4*400*2/150,AswS:Math.PI/4*400/150,dg:14,Pv:0,uh:7209.8977,Ao:3207883.9,Aoh:3550460.7,Acp:3972772.9,uc:8133.6625,y1:2292};
  var o=DSG2.shear(Q,{V:4000,T:1400,M:40,N:0});
  var rows=[['h','Serviceability (M<sub>s</sub>* = 15 000 kN·m, f<sub>scr</sub> = f<sub>tcr</sub> = 200 MPa)'],['Top / bottom stress (MPa)',anFmt(a.top,3)+' / '+anFmt(a.bot,3),'&minus;3.709 / &minus;8.915'],['Decompression moment (kN·m)',anFmt(Md,0),'27 318'],['Allowable SLS moment M<sub>s,allow</sub> (kN·m)',anFmt(lo,0),'39 591'],
    ['h','Ultimate bending (M* = 45 000 kN·m)'],['&phi;M<sub>u</sub> (kN·m)',anFmt(phi*u.M/1e6,0),'55 183'],['M<sub>uo</sub> (kN·m)',anFmt(u.M/1e6,0),'68 979'],['d<sub>n</sub> (mm) / k<sub>uo</sub>',anFmt(u.dn,1)+' / '+anFmt(u.kuo,4),'240.9 / 0.1019'],['M<sub>uo,min</sub> = 1.2M<sub>cr</sub> (kN·m)',anFmt(1.2*l2,0),'40 802'],
    ['h','Shear and torsion (V* = 4000 kN, T* = 1400 kN·m, M* = 40 kN·m)'],['d<sub>v</sub> (mm)',anFmt(dv,1),'2124.5'],['&epsilon;<sub>x</sub>',dgE(o.ex),'&minus;1.615e-4'],['&theta;<sub>v</sub> (deg) / k<sub>v</sub>',anFmt(o.th,2)+' / '+anFmt(o.kv,4),'27.87 / 0.5279'],
    ['&theta;<sub>v</sub> / k<sub>v</sub> recomputed from the spreadsheet&rsquo;s own &epsilon;<sub>x</sub>',anFmt(29-7000*1.6152e-4,2)+' / '+anFmt(0.4/(1-1500*1.6152e-4),4),'27.87 / 0.5279'],
    ['&phi;V<sub>uc</sub> / &phi;V<sub>us</sub> (kN)',anFmt(0.7*o.Vuc/1e3,0)+' / '+anFmt(0.7*o.Vus/1e3,0),'1884 / 10 853'],['&phi;V<sub>u.max</sub> (kN)',anFmt(0.7*o.Vumax/1e3,0),'5932'],['&phi;T<sub>cr</sub> (kN·m)',anFmt(0.7*o.Tcr/1e6,0),'3332'],
    ['A<sub>sv,min</sub>/s / A<sub>sw,min</sub>/s (mm&sup2;/m)',anFmt(o.AsvMin*1000,1)+' / '+anFmt(o.AswMin*1000,1),'387.0 / 916.8'],
    ['Utilisation: crushing / shear / torsion / longitudinal',[o.uCr,o.uV,o.uT,o.uL].map(function(x){ return anFmt(x,3); }).join(' / '),'0.705 / 0.388 / 0.245 / 0.993']];
  $('dg_bm').innerHTML='<div class="dgx"><table class="dt dgt"><tr><th class="l">Quantity</th><th>This engine</th><th>Reference spreadsheet</th></tr>'+rows.map(function(r){ return r[0]==='h'?'<tr class="dgh"><td colspan="3">'+r[1]+'</td></tr>':'<tr><td class="l">'+r[0]+'</td><td class="v">'+r[1]+'</td><td class="v">'+r[2]+'</td></tr>'; }).join('')+'</table></div>'
    +'<div class="bbnote">The reference example (2.4 m composite trough, 50 MPa deck, 65 MPa beam, 120 strands) is re-run with this engine; the spreadsheet&rsquo;s own numbers come from a compiled add-in, so only its outputs are visible and nothing here is fitted to them. '
    +'<b>Agree:</b> SLS stresses, decompression and M<sub>s,allow</sub> (&lt; 0.1%), &phi;M<sub>u</sub> (0.2%), 1.2M<sub>cr</sub> (0.5%), minimum shear and torsion reinforcement (exact), and the &theta;<sub>v</sub> / k<sub>v</sub> formulas (exact from the spreadsheet&rsquo;s &epsilon;<sub>x</sub>). '
    +'<b>Differ:</b> k<sub>uo</sub> (add-in stress-block depth not visible; this engine uses &gamma; = 0.97 &minus; 0.0025f&prime;c); d<sub>v</sub> (this engine 0.9 &times; the yield-force-weighted tension resultant, the add-in a deeper d), which carries into &epsilon;<sub>x</sub>, &phi;V<sub>uc</sub>, &phi;V<sub>u.max</sub>; &phi;T<sub>cr</sub> (this engine has no prestress enhancement); torsion and longitudinal utilisations (the add-in&rsquo;s definitions are not documented in the workbook &mdash; its 0.993 longitudinal value is not a force ratio this engine can reproduce). Treat shear / torsion as <b>method, verify</b>.</div>';
}
