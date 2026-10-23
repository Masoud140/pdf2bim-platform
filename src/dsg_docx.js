
/* ===== Word (.docx) calculation report — built in the browser with docx-js (embedded) ===== */
var DGX={W:9638, PAL:{'--fg':'#141d28','--bg':'#ffffff','--panel':'#ffffff','--line':'#ccd4de','--muted':'#5e6b7d','--instr':'#0E7C86','--instr-soft':'rgba(14,124,134,.12)','--eng':'#1d8a4e','--calc':'#b7791f','--flag':'#c0392b','--std':'#6b5bb5','--dummy':'#dfe5ec','--dgdeck':'rgba(125,135,150,.34)','--dgconc':'rgba(125,135,150,.20)','--rule2':'#e3e8ee'}};
/* --- SVG -> PNG (light palette, class styles inlined) --- */
function dgSvgPng(svgEl,pxW){
  return new Promise(function(res){
    if(!svgEl){ res(null); return; } var s=svgEl.outerHTML, vb=(svgEl.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number); if(vb.length<4||vb.some(function(v){ return !isFinite(v); })){ var bb=svgEl.getBoundingClientRect(); vb=[0,0,bb.width||600,bb.height||300]; } var w=vb[2], h=vb[3], W=pxW||1500, H=Math.max(1,Math.min(6000,Math.round(W*h/w)));
    s=s.replace(/var\((--[\w-]+)(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g,function(m,n,fb){ return DGX.PAL[n]||(fb?fb.trim():'#141d28'); }).replace(/context-stroke/g,'#141d28');
    var css='<style>.dgax{font-size:10px;fill:#5e6b7d;font-family:Arial,sans-serif}.dgal{font-size:11.5px;fill:#141d28;font-family:Arial,sans-serif}.dglb{font-size:11px;fill:#141d28;font-weight:600;font-family:Arial,sans-serif}text{font-family:Arial,sans-serif}</style>';
    s=s.replace(/<svg([^>]*)>/,function(m,a){ a=a.replace(/\s(width|height|style|class)="[^"]*"/g,''); return '<svg'+a+' xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'"><rect x="'+vb[0]+'" y="'+vb[1]+'" width="'+w+'" height="'+h+'" fill="#ffffff"/>'+css; });
    if(!/xmlns="http:\/\/www.w3.org\/2000\/svg"/.test(s)) s=s.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
    var img=new Image(); img.onload=function(){ var c=document.createElement('canvas'); c.width=W; c.height=H; var g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,W,H); g.drawImage(img,0,0,W,H);
      c.toBlob(function(b){ if(!b){ res(null); return; } b.arrayBuffer().then(function(ab){ res({data:new Uint8Array(ab), w:W, h:H}); }); },'image/png'); };
    img.onerror=function(){ res(null); }; img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
  });
}
/* --- text with _{sub} and ^{sup} markup --- */
function dgRuns(t,o){ o=o||{}; var out=[], re=/([_^])\{([^}]*)\}/g, last=0, m; t=String(t===undefined||t===null?'':t);
  while((m=re.exec(t))){ if(m.index>last) out.push(new docx.TextRun(Object.assign({text:t.slice(last,m.index)},o))); out.push(new docx.TextRun(Object.assign({text:m[2]},o,m[1]==='_'?{subScript:true}:{superScript:true}))); last=re.lastIndex; }
  if(last<t.length) out.push(new docx.TextRun(Object.assign({text:t.slice(last)},o))); return out; }
function dgP(t,o){ o=o||{}; return new docx.Paragraph({children:dgRuns(t,o.run||{}), heading:o.h, spacing:o.sp||{after:80}, alignment:o.al, keepNext:o.keep, style:o.style}); }
function dgxH(t,l){ return new docx.Paragraph({children:[new docx.TextRun({text:t})], heading:[docx.HeadingLevel.HEADING_1,docx.HeadingLevel.HEADING_2,docx.HeadingLevel.HEADING_3][l-1], keepNext:true}); }
function dgCell(t,w,o){ o=o||{}; var pars=(Array.isArray(t)?t:[t]).map(function(x){ return x instanceof docx.Paragraph?x:new docx.Paragraph({children:dgRuns(x,{size:o.size||18,bold:o.bold,color:o.color}),alignment:o.al,spacing:{after:0}}); });
  return new docx.TableCell({width:{size:w,type:docx.WidthType.DXA}, shading:o.fill?{type:docx.ShadingType.CLEAR,fill:o.fill,color:'auto'}:undefined, margins:{top:40,bottom:40,left:80,right:80}, children:pars, columnSpan:o.span}); }
function dgTbl(head,rows,ws,o){ o=o||{}; var W=ws.reduce(function(a,b){ return a+b; },0);
  var tr=[]; if(head) tr.push(new docx.TableRow({tableHeader:true, children:head.map(function(h,i){ return dgCell(h,ws[i],{bold:true,color:'FFFFFF',fill:'2F3B4C',size:17}); })}));
  rows.forEach(function(r){ if(r.sub){ tr.push(new docx.TableRow({children:[dgCell(r.sub,W,{bold:true,fill:'DCE3EB',span:ws.length,size:17})]})); return; }
    tr.push(new docx.TableRow({cantSplit:true, children:r.map(function(c,i){ var cc=(c&&c.t!==undefined)?c:{t:c}; return dgCell(cc.t,ws[i],{fill:cc.fill,bold:cc.bold,color:cc.color,al:cc.al||(o.right&&o.right.indexOf(i)>=0?docx.AlignmentType.RIGHT:undefined)}); })})); });
  var b={style:docx.BorderStyle.SINGLE,size:4,color:'BFC8D3'};
  return new docx.Table({width:{size:W,type:docx.WidthType.DXA}, columnWidths:ws, rows:tr, borders:{top:b,bottom:b,left:b,right:b,insideHorizontal:b,insideVertical:b}}); }
function dgOKc(ok){ return ok===null||ok===undefined?{t:'—'}:(ok?{t:'OK',fill:'C6EFCE',color:'006100',bold:true,al:docx.AlignmentType.CENTER}:{t:'NG',fill:'FFC7CE',color:'9C0006',bold:true,al:docx.AlignmentType.CENTER}); }
function dgImg(im,maxW){ if(!im) return dgP('(figure not available)',{run:{italics:true,color:'5E6B7D'}}); var w=Math.min(maxW||640,640), h=Math.round(w*im.h/im.w);
  return new docx.Paragraph({children:[new docx.ImageRun({type:'png',data:im.data,transformation:{width:w,height:h}})],alignment:docx.AlignmentType.CENTER,spacing:{after:40},keepNext:true}); }
function dgFig(n,cap){ return dgP('Figure '+n+' — '+cap,{run:{italics:true,size:17,color:'5E6B7D'},al:docx.AlignmentType.CENTER,sp:{after:160}}); }
/* calc-line table: description | expression (with substitution) | result | reference */
function dgCalc(lines){ var ws=[2300,4338,1700,1300], rows=lines.map(function(l){ if(l.sub) return l;
    return [{t:[l.d]},{t:[l.e].concat(l.s?['= '+l.s]:[])},{t:l.r+(l.u?' '+l.u:''),bold:l.k,al:docx.AlignmentType.RIGHT,fill:l.ok===false?'FFC7CE':l.ok===true?'E2F0D9':undefined},{t:l.ref||'',color:'5E6B7D'}]; });
  return dgTbl(['Item','Expression and substitution','Result','Reference'],rows,ws); }
var f_=function(v,d){ return anFmt(v,d===undefined?1:d); }, e_=function(v){ return dgE(v); };

async function dgDocx(){
  if(typeof dgLimSync==='function') dgLimSync();
  var st=$('dg_st'); if(!DG.res){ alert('Run the checks first (Fill load cases, then Run checks).'); return; }
  if(typeof docx==='undefined'){ alert('Word export library not loaded.'); return; }
  st.textContent='Building the Word report — rendering figures…';
  var R=DG.res, L=DG.lc, Q=DG.sec, figs={}, fn=0, nf=function(){ return ++fn; }, keepSel=DG.sel, v0=DG.view, vs0=DG.vsec;
  /* section drawings */
  for(var t of ['open','solid']){ DG.vsec=t; DG.view=null; dgDraw(); figs['sec_'+t]=await dgSvgPng($('dg_svg'),1600); }
  DG.vsec=vs0; DG.view=v0; dgDraw();
  /* per load-case diagrams */
  var lcFigs=[];
  for(var i=0;i<L.length;i++){ DG.sel=i; dgSLSView(); dgULBView(); dgULVView(); var arr=[];
    for(var id of ['dg_sls','dg_ulb','dg_ulv']){ var caps=$(id).querySelectorAll('.dgcap');
      for(var c of caps){ var title=(c.querySelector('.dgcapt')||{}).textContent||'', svgs=c.querySelectorAll('svg'), subs=c.querySelectorAll('.dgcapt2');
        for(var k=0;k<svgs.length;k++) arr.push({cap:title+(subs[k]?' — '+subs[k].textContent:''), im:await dgSvgPng(svgs[k],svgs.length>1?900:1500), key:id}); } }
    var nm=$('dg_ulb').querySelector('.dg2 svg.dgplot'); if(nm) arr.push({cap:'N–M interaction diagram — '+L[i].name, im:await dgSvgPng(nm,1300), key:'nm'});
    var vm=$('dg_ulv').querySelector('.dg2 svg.dgplot'); if(vm) arr.push({cap:'V–M interaction — '+L[i].name, im:await dgSvgPng(vm,1300), key:'vm'});
    lcFigs.push(arr); }
  DG.sel=keepSel; dgSLSView(); dgULBView(); dgULVView();
  var gFigs=[]; if(DG.gird&&$('dg_gird')){ for(var c2 of $('dg_gird').querySelectorAll('.dgcap')){ var sv=c2.querySelectorAll('svg'); for(var s2 of sv) gFigs.push({cap:(c2.querySelector('.dgcapt')||{}).textContent, im:await dgSvgPng(s2,1500)}); } }
  st.textContent='Building the Word report — writing sections…';
  var C=[], H1=function(t){ C.push(dgxH(t,1)); }, H2=function(t){ C.push(dgxH(t,2)); }, H3=function(t){ C.push(dgxH(t,3)); }, P=function(t,o){ C.push(dgP(t,o)); }, BR=function(){ C.push(new docx.Paragraph({children:[new docx.PageBreak()]})); };
  var bul=function(t){ C.push(new docx.Paragraph({children:dgRuns(t),numbering:{reference:'bul',level:0},spacing:{after:40}})); };
  var Xo=R.X, Bo=R.base, I=Xo.info, G=dgGirdPar(), D=I.tD+I.H, now=new Date();
  /* ---------- cover ---------- */
  C.push(new docx.Paragraph({spacing:{before:2400,after:200},children:[new docx.TextRun({text:'BR13A Bridge',size:28,color:'5E6B7D'})]}));
  C.push(new docx.Paragraph({spacing:{after:120},children:[new docx.TextRun({text:'Super-T Girder Design Calculation',size:48,bold:true,color:'141D28'})]}));
  C.push(new docx.Paragraph({spacing:{after:600},border:{bottom:{style:docx.BorderStyle.SINGLE,size:12,color:'0E7C86',space:6}},children:[new docx.TextRun({text:'Girder G'+(DG.gi+1)+' — AS 5100.5:2017 serviceability, transfer and ultimate checks',size:26,color:'0E7C86'})]}));
  C.push(dgTbl(null,[['Project','BR13A bridge'],['Element','Girder G'+(DG.gi+1)+': '+(dgEdited('shape')?'custom shape from '+Q.name:Q.name)+' + '+Q.tD+' mm deck'],['Design standards','AS 5100.1:2017, AS 5100.2:2017, AS 5100.5:2017'],
    ['Load cases',L.map(function(l){ return l.name; }).join('; ')],['Prestress state','After losses at '+Q.time+' (Hog Calculator tab)'],['Generated',now.toISOString().slice(0,16).replace('T',' ')+' — BR13A dashboard (Design tab)'],['Prepared by',''],['Checked by',''],['Revision','']],[2600,7038]));
  C.push(dgP('Clause numbers are given for navigation; the text of the standards is not reproduced. Every value tagged Standard — verify, and every Missing — Flagged item, must be confirmed before this calculation is relied on.',{run:{italics:true,size:17,color:'5E6B7D'},sp:{before:300}}));
  BR(); C.push(new docx.TableOfContents('Contents',{hyperlink:true,headingStyleRange:'1-3'})); BR();
  /* ---------- 1 scope ---------- */
  H1('1 Scope, method and conventions');
  P('This calculation checks a precast pretensioned Super-T girder acting compositely with a cast-in-place deck slab, at the load cases listed in Section 3 and along the girder (Section 6). Actions come from the BR13A grillage model: construction stages CS2–CS6 (self weight, wet deck, roll-restraint release, superimposed dead load, creep and shrinkage) and the AS 5100.2 moving-load envelope.');
  H2('1.1 Method');
  ['Section model: fibre strips of the Super-T outline and the deck (3 mm), bars and strands as discrete steel.',
   'Staged serviceability: stage 1 — Super-T alone carries the strand force after losses and M_{nc}; stage 2 — the composite section carries M_{s}* with the stage-1 strains locked in.',
   'Steel displaces concrete: the concrete stress at each bar and strand is deducted over the steel area (none where that concrete is cracked in tension).',
   'Strands at each station: only strands bonded at the station act; σ_{pe} is taken from the Hog time analysis at that station; inside the transmission length the strand stress at ultimate is limited to σ_{pe}.',
   'Crack control (Cl 8.6.2), soffit and top face: the tension limit follows the selected Cl 8.6.2.1 option; when cracking is permitted, the bar and tendon stress increments above decompression of that face are limited to f_{scr} and f_{tcr} (Table 8.6.2.1).',
   'SLS free strains (Section 1.5): deck differential shrinkage and the temperature gradient act on the composite section as free strains; fibre stresses are E·(ε − ε_{free}).',
   'Ultimate bending (Cl 8.1): strain compatibility with ε_{cu} = 0.003 and the rectangular stress block (α_{2}, γ, Cl 8.1.3); strand stress '+((DG.opt&&DG.opt.tend==='code')?'by the AS 5100.5 approximate expression σ_{pu} = f_{pb}(1 − k_{1}k_{2}/γ), k_{1} = '+DG.opt.k1p+' (Standard — verify)':'from a Mattock-type curve capped at f_{pb} (method — verify)')+'; φ from Table 2.3.2.',
   'Shear and torsion: AS 5100.5 Cl 8.2 general method; the open section is the Super-T trough closed by the deck (single cell); the solid end block uses A_{o} = 0.85A_{oh} (Standard — verify).',
   'Transfer: Super-T alone on its transfer supports; strand force j·MBL·(1 − relaxation) ramped over the transmission length from each end or debond point; elastic shortening from strain compatibility.'].forEach(bul);
  H2('1.2 Units and sign conventions');
  ['Units: mm, N, MPa within sections; actions in kN and kN·m.','y is measured downward from the deck top; strand and bar positions are entered as heights above the Super-T soffit.','Sagging moment positive, axial tension positive, compressive stress negative.'].forEach(bul);
  H2('1.3 Data source tags');
  C.push(dgTbl(['Tag','Meaning'],[['Direct','read from the drawings / model / Hog Calculator inputs'],['Calculated','derived by documented arithmetic from Direct values'],['Standard — verify','code or method constant, to be confirmed against the standard'],['Input (user)','entered or edited by the designer in the dashboard'],[{t:'Missing — Flagged',color:'C0392B',bold:true},'not available in this drawing set; listed in Section 8']],[2400,7238]));
  if(typeof DG_GLOSS!=='undefined'){ H2('1.4 Notation'); C.push(dgTbl(['Symbol','Meaning'],DG_GLOSS.map(function(q){ return [q[0],q[1]]; }),[1600,8038])); }
  /* 1.5 analysis options as run */
  (function(){ var O=DG.opt||{}, T=DG.temp||{}, sh=(O.dsh&&typeof dgDshEps==='function')?dgDshEps():null, tOn=typeof dgTempOn==='function'&&dgTempOn(), red={t:'Missing — Flagged',color:'C0392B',bold:true};
    H2('1.5 Analysis options and SLS free strains (as run)');
    var rows=[['Strand stress at ultimate',O.tend==='code'?'AS 5100.5 approximate σ_{pu}, k_{1} = '+O.k1p:'strain compatibility — strand curve (Mattock form)',O.tend==='code'?'Standard — verify':'method — verify'],
      ['k_{uo} ≤ 0.36',O.kuoLim===false?'informative only (φ varies with k_{uo})':'pass / fail check','Input (user)'],
      ['Axial force N* / N_{s}*',O.useN===false?'taken as zero':'grillage girder axial force, permanent stages (traffic N not enveloped)','Input (user)'],
      ['Deck differential shrinkage',O.dsh===false?'not applied':(sh?'ε_{free,deck} = −(ε_{sh,deck} − ε_{sh,girder})/(1 + χφ_{deck}) = −('+(sh.sd*1e6).toFixed(1)+' − '+(sh.sg*1e6).toFixed(1)+')×10⁻⁶/(1 + '+sh.chi+' × '+sh.phd.toFixed(3)+') = '+(sh.eps*1e6).toFixed(1)+' ×10⁻⁶':'not available (Hog tab detailed method with a deck needed)'),sh?'Calculated':red],
      ['Temperature gradient (AS 5100.2 Cl 18.3)',tOn?'α = '+T.alpha+' ×10⁻⁶/°C; positive: '+(T.pos||'—')+'; negative: '+(T.neg||'—')+'. SLS combinations: traffic + k_{1} × gradient, and gradient + k_{1} × traffic (k_{1} = '+(typeof dgK1==='function'?dgK1():'')+', Combos tab); self-equilibrating stresses only (simply supported)':'not applied — profile and α not entered',tOn?'Input (user)':red],
      ['Concrete tension option (Cl 8.6.2.1)',(DG.cc&&DG.cc.opt)?({u:'uncracked — σ_{t} ≤ 0.25√f\'_{c}',a:'Cl 8.6.2.1(a) — σ_{t} ≤ 0.5√f\'_{c}',b:'Cl 8.6.2.1(b) — cracking permitted, steel stress increments limited (Table 8.6.2.1)'}[DG.cc.opt]||DG.cc.opt):'—','Input (user)'],
      ['Exposure classification (Cl 8.6.1 Item (c)(ii))',DG.cc&&DG.cc.exp?DG.cc.exp:'not set',DG.cc&&DG.cc.exp?'Input (user)':red]];
    C.push(dgTbl(['Item','Setting','Source'],rows,[2900,5138,1600])); })();
  /* ---------- 2 inputs ---------- */
  BR(); H1('2 Design inputs');
  H2('2.1 Materials');
  C.push(dgTbl(['Property','Value','Source / reference'],[["Super-T f'_{c} / E_{c}",Q.fcg+' / '+Q.Eg+' MPa','Materials tab M1 — Direct; Table 3.1.2, Cl 3.1.2'],["Deck f'_{c} / E_{c}",Q.fcd+' / '+Q.Ed+' MPa','Materials tab M2 — Direct'],
    ['Reinforcement f_{sy} / E_{s}',Q.fsy+' / '+Q.Es+' MPa','Hog tab; Cl 3.2'],['Strand A_{p} / d_{b} / MBL / E_{p}',Q.Ap+' mm² / '+Q.db+' mm / '+Q.mbl+' kN / '+Q.Ep+' MPa','Hog tab; Cl 3.3'],
    ['Strand breaking stress f_{pb}','MBL/A_{p} = '+Q.mbl+'×1000/'+Q.Ap+' = '+f_(dgFpb(Q),0)+' MPa','Calculated; Table 3.3.1'],
    ['α_{2} deck / Super-T',f_(Bo.a2d,3)+' / '+f_(Bo.a2g,3),'0.85 − 0.0015f\'_{c} (0.67…0.85), Cl 8.1.3'],['γ deck / Super-T',f_(Bo.gd,3)+' / '+f_(Bo.gg,3),'0.97 − 0.0025f\'_{c} (0.67…0.85), Cl 8.1.3'],
    ["f'_{ct.f} Super-T / deck",f_(Bo.fctfg,2)+' / '+f_(Bo.fctfd,2)+' MPa','0.6√f\'_{c}, Cl 3.1.1.3'],['ε_{cu}','0.003','Cl 8.1.3 — Standard, verify']],[3000,3138,3500]));
  H2('2.2 Super-T and deck geometry');
  C.push(dgTbl(['Parameter','Value','Description'],DG_PAR.map(function(q){ return [q[0],f_(Q.P[q[0]],q[0]==='n'?3:1)+' '+(q[2]==='—'?'':q[2]),q[1]]; }).concat([['t_{D} × W_{d}',Q.tD+' × '+f_(Q.Wd,0)+' mm','deck thickness × width acting with the girder (model composite section)'],['Solid zones',(typeof dgZones==='function'&&dgZones().length)?dgZones().map(function(z){ return z.a.toFixed(3)+'–'+z.b.toFixed(3)+' m'; }).join(', '):'Missing — Flagged (all open)','solid section stretches, x from the left girder end; elsewhere open']]),[1500,2000,6138],{right:[1]}));
  C.push(dgImg(figs.sec_open)); C.push(dgFig(nf(),'Open (span) composite section to scale, with strands (blue), bars (green), centroids and closed-tie centreline'));
  C.push(dgImg(figs.sec_solid,520)); C.push(dgFig(nf(),'Solid end-block section'));
  H2('2.3 Section properties');
  var Bs=R.Bs, Xs=R.Xs;
  C.push(dgTbl(['Property','Open — Super-T','Open — composite','Solid — Super-T','Solid — composite'],[
    ['Area (m²)',f_(Bo.eg.A/1e6,4),f_(Bo.ec.A/1e6,4),f_(Bs.eg.A/1e6,4),f_(Bs.ec.A/1e6,4)],['Centroid below deck top (mm)',f_(Bo.eg.yc,0),f_(Bo.ec.yc,0),f_(Bs.eg.yc,0),f_(Bs.ec.yc,0)],
    ['Second moment (m⁴)',f_(Bo.eg.I/1e12,4),f_(Bo.ec.I/1e12,4),f_(Bs.eg.I/1e12,4),f_(Bs.ec.I/1e12,4)],['Strand force after losses P (kN)',f_(Bo.Pt,0),'',f_(Bs.Pt,0),''],['e_{p} below the Super-T centroid (mm)',f_(Bo.ep,0),'',f_(Bs.ep,0),'']],[2638,1750,1750,1750,1750],{right:[1,2,3,4]}));
  P('Transformed to E_{c} of the Super-T; bars and strands included net of the displaced concrete.',{run:{italics:true,size:17,color:'5E6B7D'}});
  H2('2.4 Prestressing strands');
  var srows=dgGroup(Q.strands,function(t){ return dgF(t.y,1); }).map(function(g){ var on=g.items.filter(function(t){ return t.on; }), sp=on.length?on.reduce(function(a,t){ return a+(t.sp||0); },0)/on.length:0, deb=on.filter(function(t){ return t.dL||t.dR; });
    return [g.key,dgXs(on),String(on.length),f_(sp,0),f_(on.length*Q.Ap*sp/1000,0),deb.length?deb.length+' (L/R '+deb.map(function(t){ return t.dL+'/'+t.dR; }).filter(function(v,i,a){ return a.indexOf(v)===i; }).join(', ')+')':'—']; });
  C.push(dgTbl(['y above soffit (mm)','x positions (mm)','No.','σ_{pe} (MPa)','Force (kN)','Debonded (mm)'],srows,[1300,3200,700,1200,1200,2038],{right:[0,2,3,4]}));
  P('σ_{pe} = stress after losses at '+Q.time+' from the Hog Calculator time-dependent analysis. Transmission length L_{pt} = '+f_(G.Lpt,0)+' mm (Hog tab: '+G.lt+'d_{b}). Development length L_{d} = '+(G.Ld?f_(G.Ld,0)+' mm':'Missing — Flagged')+'.',{run:{size:18}});
  H2('2.5 Reinforcement');
  C.push(dgTbl(['Location','y (mm)','Bar','x positions / spacing','No.','Area (mm²)'],dgGroup(Q.gbars,function(b){ return dgF(b.y,1)+'|'+b.d; }).map(function(g){ return ['Super-T',f_(g.items[0].y,1)+' above soffit','N'+g.items[0].d,dgXs(g.items),String(g.items.length),f_(g.items.length*Math.PI*g.items[0].d*g.items[0].d/4,0)]; })
    .concat(Q.dbars.map(function(r){ var ok=r.d>0&&r.s>0&&r.c!==null, n=ok?Math.max(1,Math.floor(Q.Wd/r.s)):0; return ['Deck '+r.pos,ok?'cover '+r.c:'—',ok?'N'+r.d:'Missing',ok?'@ '+r.s:'—',ok?String(n):'—',ok?f_(n*Math.PI*r.d*r.d/4,0):'—']; })),[1300,1700,800,3338,800,1700],{right:[4,5]}));
  H2('2.6 Shear and torsion detailing');
  var dO=DG.det, dS=DG.detS, dr=function(lbl,k){ return [lbl,dO[k]===null?'Missing':String(dO[k]),dS[k]===null?'Missing':String(dS[k])]; };
  C.push(dgTbl(['Item','Open (span)','Solid end block'],[dr('Shear fitments Ø (mm)','svd'),dr('legs','svn'),dr('spacing (mm)','svs'),dr('Closed ties Ø (mm)','tvd'),dr('bars per tie','tvn'),dr('spacing (mm)','tvs'),dr('f_{sy.f} (MPa)','fsyf'),dr('Cover sides / soffit (mm)','cs'),dr('Cover deck top (mm)','ct'),dr('d_{g} (mm)','dg')],[4638,2500,2500],{right:[1,2]}));
  if(dO.ex||dS.ex) P('The detailing above is the reference spreadsheet example, not BR13A — Missing, Flagged.',{run:{bold:true,color:'C0392B',size:18}});
  /* ---------- 3 load cases ---------- */
  BR(); H1('3 Load cases and design actions');
  P('Load factors from the Combos register (AS 5100.2): an action that opposes the total takes the ULS beneficial factor. Traffic M, V and T are each enveloped separately at the station (not concurrent) — conservative. '+((DG.opt&&DG.opt.useN)?'Ns* and N* are the grillage girder axial forces of the permanent stages (traffic axial force is not enveloped).':'Ns* and N* are taken as zero (the option to carry the grillage girder axial force is switched off).')+(DG.opt&&DG.opt.dsh?' Differential shrinkage of the deck is applied at the SLS as a free strain from the Hog time analysis.':'')+(DG.temp&&DG.temp.alpha>0&&(DG.temp.pos||DG.temp.neg)?' Temperature gradient applied at the SLS from the user-entered profile (AS 5100.2 Cl 18.3).':' Temperature gradient: not applied — profile and α not entered (Missing — Flagged).'));
  L.forEach(function(lc,i){ var o=R.lc[i];
    H3('3.'+(i+1)+' '+lc.name+' — s = '+f_(lc.s,3)+' m, '+(o.solid?'solid end block':'open section'));
    if(lc.brk){ C.push(dgTbl(['Action','Acts on','M (kN·m)','V (kN)','T (kN·m)','γ_{ULS,M}','γ_{SLS}','Source'],DG.ACT.map(function(a){ var v=lc.brk.a[a.k], g=lc.gam[a.k]; return [a.n,a.st==='nc'?'Super-T':'composite',f_(v.M,0),f_(v.V,0),f_(v.T,0),String(g.M),String(g.s),(v.src||'').replace(/<[^>]+>/g,'')]; }),[2300,1000,950,850,950,800,700,2088],{right:[2,3,4,5,6]})); }
    C.push(dgCalc([{d:'SLS, Super-T alone',e:'M_{nc} = Σγ_{SLS}M (SW, WET)',r:f_(lc.Mnc,1),u:'kN·m',ref:'Cl 8.6.2'},{d:'SLS, composite',e:'M_{s}* = Σγ_{SLS}M (REL, SDL, CSH, TRF)',r:f_(lc.Ms,1),u:'kN·m',ref:'Cl 8.6.2'},
      {d:'ULS moment',e:'M* = Σγ_{ULS}M',r:f_(lc.Mu,1),u:'kN·m',ref:'AS 5100.2 Cl 6'},{d:'ULS shear',e:'V* = |Σγ_{ULS}V|',r:f_(lc.Vu,1),u:'kN'},{d:'ULS torsion',e:'T* = |Σγ_{ULS}T|',r:f_(lc.Tu,1),u:'kN·m',ref:'Cl 8.2.1.2'}]));
  });
  /* ---------- 4 checks per load case ---------- */
  var figOf=function(i,re){ return lcFigs[i].filter(function(q){ return re.test(q.cap); }); };
  L.forEach(function(lc,i){ var o=R.lc[i], B=o.B, X=o.X, In=X.info, Dd=In.tD+In.H, tr=o.tr, sh=o.sh, Qs=o.Q, lim=DG.trLim;
    BR(); H1('4.'+(i+1)+' '+lc.name+' — section checks');
    P('Station s = '+f_(lc.s,3)+' m; '+(o.solid?'solid end-block section':'open (span) section')+'; composite centroid y_{c} = '+f_(o.yc,0)+' mm below the deck top.');
    /* transfer */
    H2('Transfer');
    if(tr&&!tr.why){ var lc_=lim.c>0?-lim.c:null, lt_=lim.t!==null&&lim.t!==''?+lim.t:null;
      C.push(dgCalc(dgCalcLines('transfer',o,lc)));
      figOf(i,/transfer/i).forEach(function(q){ C.push(dgImg(q.im,560)); C.push(dgFig(nf(),q.cap)); });
    } else P('Not calculated: '+((tr&&tr.why)||'—')+'.');
    /* SLS */
    H2('Serviceability — staged stresses');
    var s2=o.sv.s;
    C.push(dgCalc(dgCalcLines('sls',o,lc)));
    figOf(i,/SLS stresses/i).forEach(function(q){ C.push(dgImg(q.im,620)); C.push(dgFig(nf(),q.cap)); });
    H2('Serviceability — crack control by steel stress increment');
    C.push(dgCalc(dgCalcLines('crack',o,lc)));
    figOf(i,/Cracked section|Crack control|Moment.curvature/i).forEach(function(q){ C.push(dgImg(q.im,520)); C.push(dgFig(nf(),q.cap)); });
    if(typeof dgRstLines==='function'){ H2('Serviceability — reinforcing steel stress (Cl 8.6.1)'); C.push(dgCalc(dgCalcLines('rst',o,lc,'b'))); }
    /* ULS bending */
    H2('Ultimate — bending');
    var Pu=dgUltParts(o.Su,o.dn,o.face,o.yc);
    C.push(dgCalc(dgCalcLines('uls',o,lc)));
    figOf(i,/ULS section|N–M/i).forEach(function(q){ C.push(dgImg(q.im,620)); C.push(dgFig(nf(),q.cap)); });
    /* shear and torsion */
    H2('Ultimate — shear and torsion (general method)');
    if(sh){ var ct=sh.cot, Gg=B.geo;
      C.push(dgCalc(dgCalcLines('shear',o,lc)));
      figOf(i,/V–M/i).forEach(function(q){ C.push(dgImg(q.im,560)); C.push(dgFig(nf(),q.cap)); });
    } else P('Not calculated — '+String(o.shWhy||'detailing missing').replace(/<[^>]+>/g,'')+' (Missing — Flagged).',{run:{color:'C0392B'}});
  });
  /* ---------- 5 summary ---------- */
  BR(); H1('5 Summary of checks');
  var ws=[2900,1100].concat(L.map(function(){ return Math.floor(5638/L.length); })); ws[ws.length-1]+=5638-Math.floor(5638/L.length)*L.length;
  var uc=function(u){ return u===null||u===undefined||!isFinite(u)?{t:'—'}:{t:f_(u,3),fill:u>1?'FFC7CE':u>0.9?'FCE4D6':'E2F0D9',al:docx.AlignmentType.RIGHT,bold:u>0.9}; };
  C.push(dgTbl(['Check','Clause'].concat(L.map(function(l,i){ return 'LC'+(i+1)+(R.lc[i].solid?' (solid)':''); })),[
    ['M_{s}*/M_{s,allow}','Cl 8.6.2'].concat(R.lc.map(function(o){ return uc(Math.max(0,o.uS)); })),['Crack control','Cl 8.6.2'].concat(R.lc.map(function(o){ return dgOKc(o.okS); })),
    ['M*/φM_{u}','Cl 8.1'].concat(R.lc.map(function(o){ return uc(o.uB); })),['k_{uo} ≤ 0.36','Cl 8.1.5'].concat(R.lc.map(function(o){ return dgOKc(o.kuo<=0.36); })),['M_{uo} ≥ 1.2M_{cr}','Cl 8.1.5'].concat(R.lc.map(function(o){ return dgOKc(o.okMin); })),
    ['Web crushing','Cl 8.2.3.1'].concat(R.lc.map(function(o){ return uc(o.sh?o.sh.uCr:null); })),['Shear','Cl 8.2.3.1'].concat(R.lc.map(function(o){ return uc(o.sh?o.sh.uV:null); })),
    ['Torsion','Cl 8.2.5.6'].concat(R.lc.map(function(o){ return uc(o.sh?o.sh.uT:null); })),['Longitudinal steel','Cl 8.2.7'].concat(R.lc.map(function(o){ return uc(o.sh?o.sh.uL:null); })),
    ['Min. shear / torsion steel','Cl 8.2.1.7 / 8.2.5.5'].concat(R.lc.map(function(o){ return o.sh?dgOKc(o.sh.minV&&o.sh.minT):{t:'—'}; }))],ws));
  /* ---------- 6 along the girder ---------- */
  BR(); H1('6 Checks along the girder');
  if(DG.gird){ var S=DG.gird.st, Gd=DG.gird.G;
    C.push(dgCalc([{d:'Girder length',e:'L_{g}',r:f_(Gd.Lg,3),u:'m'},{d:'Bearings from girder end',e:'a, a_{2}',r:f_(Gd.a,3)+' / '+f_(Gd.a2,3),u:'m'},{d:'Supports at transfer',e:'a_{t}',r:f_(Gd.asup,3),u:'m'},
      {d:'Transmission length',e:'L_{pt} = '+Gd.lt+'d_{b}',r:f_(Gd.Lpt,0),u:'mm',ref:'Hog tab'},{d:'Development length',e:'L_{d}',r:Gd.Ld?f_(Gd.Ld,0)+' mm':'Missing — Flagged'},
      {d:'Strand force factor',e:'f = min(1, (x − d_{L})/L_{pt}) × min(1, (L_{g} − x − d_{R})/L_{pt}) ≥ 0',r:''}]));
    gFigs.forEach(function(q){ C.push(dgImg(q.im,620)); C.push(dgFig(nf(),q.cap)); });
    var pick=S.filter(function(r,i){ return i%Math.max(1,Math.round(S.length/24))===0||i===S.length-1; });
    C.push(dgTbl(['x (m)','Sec.','Bonded','σ_{i,top}','σ_{i,bot}','σ_{b} serv.','M* (kN·m)','φM_{u}','V* (kN)','u_{max}'],pick.map(function(r){ var o=r.o, u=o?Math.max(Math.max(0,o.uS),o.uB||0,o.sh?o.sh.u:0):null;
      return [f_(r.x,2),r.solid?'solid':'open',String(r.nb),f_(r.tr.top,2),f_(r.tr.bot,2),o?f_(o.sv.girBot,2):'—',f_(r.lc.Mu,0),r.phMs?f_(r.phMs,0):'—',f_(r.lc.Vu,0),uc(u)]; }),[800,700,800,950,950,1000,1100,1100,1000,1238],{right:[0,2,3,4,5,6,7,8]}));
  } else P('The along-girder analysis was not run (step 7 of the Design tab).',{run:{color:'C0392B'}});
  /* ---------- 7 assumptions ---------- */
  BR(); H1('7 Assumptions and limitations');
  ['Deck width is the composite width used in the grillage model; the effective flange width b_{ef} = B_{t} + 0.2a exceeds it, so the full width is effective (Standard — verify).','Traffic actions M, V and T are enveloped independently at each station.',
   (DG.opt&&DG.opt.useN)?'N* and Ns* are taken from the grillage girder axial forces of the permanent stages (traffic axial force is not enveloped and is taken as zero).':'N* and Ns* are taken as zero (grillage axial force option switched off).','Between the service range and ultimate the moment–curvature path is not computed (needs a non-linear concrete law).',
   'Strand stress after losses is taken from the Hog Calculator time analysis at each station (strands not yet bonded at a station are excluded).',
   (DG.opt&&DG.opt.tend==='code')?'Strand stress at ultimate uses the AS 5100.5 approximate expression σ_{pu} = f_{pb}(1 − k_{1}k_{2}/γ) — Standard, verify.':'Strand stress at ultimate uses a Mattock-type curve capped at f_{pb} — method, verify.',
   'Steel displaces concrete: the concrete stress at each bar and strand is deducted over the steel area.',
   'Deck differential shrinkage and any entered temperature gradient act at the SLS only, as free strains on the composite section; temperature is not added at the ULS.',
   'Shear and torsion of the open Super-T assume the trough acts with the deck as a closed single cell; closed-tie legs needed for torsion are not counted for shear.',
   'Inside the transmission length the strand stress at ultimate is limited to the effective prestress; between the transmission and development lengths it rises to f_{pb} only when L_{d} is entered.'].forEach(bul);
  /* ---------- 8 needs review ---------- */
  H1('8 Needs review — Missing / Flagged items');
  var fl=(DG.warn||[]).map(function(w){ return w.replace(/<[^>]+>/g,'').replace(/&ne;/g,'≠').replace(/&sup2;/g,'²').replace(/&Oslash;/g,'Ø'); });
  if(!Q.dbars.some(function(b){ return b.d>0&&b.s>0; })) fl.push('Deck longitudinal reinforcement not entered (deck drawing not in this set).');
  if(dO.ex||dS.ex) fl.push('Shear / torsion detailing are the reference spreadsheet example values, not BR13A.'); else if(!(dO.svd>0&&dO.tvd>0)) fl.push('Shear / torsion detailing not entered.');
  if(!(DG.trLim.c>0)||DG.trLim.t===null) fl.push('Transfer stress limits not entered (AS 5100.5).');
  if(DG.trLim.src==='std') fl.push('Transfer permissible stresses use AS 5100.5 Cl 8.1.4.2 ('+(DG.trLim.dist==='rect'?'rectangular, 0.5':'triangular, 0.6')+'f\'_{cp}) and Cl 8.6.2(a)(i) (0.5√f\'_{cp}) — confirm the stress-distribution case.');
  if(typeof dgTempOn==='function'&&!dgTempOn()) fl.push('Temperature gradient profile (AS 5100.2 Cl 18.3) and α not entered — SLS combinations with temperature are not checked.');
  fl.push('Torsion enters ε_{x} and web crushing through V_{eff} = √[V*² + (0.9T*u_{h}/2A_{o})²] — confirm this form against AS 5100.5 Cl 8.2 / 8.3.');
  if(DG.opt&&DG.opt.tend==='code') fl.push('Tendon stress at ultimate by the approximate σ_{pu} method with k_{1} = '+DG.opt.k1p+' — confirm k_{1} for the strand used.');
  if(!G.Ld) fl.push('Strand development length L_{d} not entered — beyond the transmission length the full f_{pb} is used at ultimate (no development ramp); inside it the strand stress is limited to σ_{pe}.');
  if(!(typeof dgZones==='function'&&dgZones().length)) fl.push('Solid zones along the girder not entered (girder drawing not in this set) — every station is designed with the open section.');
  if(G.Lg&&Math.abs(G.Lg-G.hogL)>0.05) fl.push('Girder length: model '+f_(G.Lg,3)+' m vs Hog tab '+f_(G.hogL,3)+' m.');
  if(DG.cc){ fl.push('SLS crack-control option: '+({u:'σt ≤ 0.25√f\'c',a:'Cl 8.6.2.1(a), σt ≤ 0.5√f\'c',b:'Cl 8.6.2.1(b), Table 8.6.2.1 increments'})[DG.cc.opt]+'; Table 8.6.2.1 bar increment '+L[0].fscr+' MPa from the largest Super-T bar near the tension face.'); if(!DG.cc.exp) fl.push('Exposure classification not set — Cl 8.6.1 Item (c)(ii) (permanent effects) not assessed.'); } fl.push('Barrier weight in the superimposed dead load is Missing — Flagged (Loads tab).');
  C.push(dgTbl(['#','Item'],fl.map(function(t,k){ return [String(k+1),{t:t,color:'9C0006'}]; }),[600,9038]));
  /* ---------- appendix ---------- */
  BR(); H1('Appendix A — Engine benchmark');
  P('The section engine re-run on the reference spreadsheet example (Design_SuperT.xlsx). The spreadsheet uses a compiled add-in, so only its outputs are compared; nothing is fitted to them.');
  var bm=[].map.call(document.querySelectorAll('#dg_bm tr'),function(tr){ var c=tr.children; return c.length===1?{sub:c[0].textContent}:[c[0].textContent,c[1].textContent,c[2].textContent]; }).filter(function(r){ return !(r[0]==='Quantity'); });
  C.push(dgTbl(['Quantity','This engine','Reference spreadsheet'],bm,[4638,2500,2500],{right:[1,2]}));
  H1('Appendix B — Clause index');
  C.push(dgTbl(['Reference','Used for'],[['AS 5100.2 Cl 6, Combos register','load factors (adverse / beneficial, SLS)'],['AS 5100.5 Cl 3.1.1.3','flexural tensile strength 0.6√f\'_{c}'],['Cl 3.1.2, Table 3.1.2','concrete modulus and strength'],['Cl 3.3, Table 3.3.1','strand properties, f_{pb}'],
    ['Table 2.3.2','capacity reduction factors'],['Cl 8.1.3','stress block α_{2}, γ, ε_{cu}'],['Cl 8.1.4.2','permissible compression in the precast beam at transfer, 0.5f\'_{cp} (rectangular) / 0.6f\'_{cp} (triangular)'],['Cl 8.6.2(a)(i)','permissible tension at transfer, 0.5√f\'_{cp}'],['Cl 8.1.5','k_{uo} ≤ 0.36, minimum strength'],['Cl 8.2.1.5 / 8.2.1.7 / 8.2.1.9','b_{v}, minimum shear reinforcement, d_{v}'],
    ['Cl 8.2.3.1 / 8.2.3.3','web crushing'],['Cl 8.2.4.1 / 8.2.4.2 / 8.2.4.4','V_{uc}, k_{v}, θ_{v}, ε_{x}'],['Cl 8.2.5.2 / 8.2.5.5 / 8.2.5.6','V_{us}, minimum torsion steel, T_{us}'],['Cl 8.2.7','longitudinal reinforcement'],['Cl 8.6.1, Tables 8.6.1(A), 8.6.1(B)','reinforcing steel stress σ_{scr}, loading cases (c)(i) / (c)(ii)'],['Cl 8.6.2.1, Table 8.6.2.1','crack control of prestressed beams: 0.25√f\'_{c}, option (a) 0.5√f\'_{c}, option (b) steel stress increment']],[3600,6038]));
  P('Clause numbers follow the reference spreadsheet mapping; verify against the current edition and amendments.',{run:{italics:true,size:17,color:'5E6B7D'}});
  /* ---------- document ---------- */
  var doc=new docx.Document({creator:'BR13A dashboard', title:'BR13A Super-T design calculation G'+(DG.gi+1), features:{updateFields:true},
    styles:{default:{document:{run:{font:'Calibri',size:20}}},paragraphStyles:[
      {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:30,bold:true,color:'141D28'},paragraph:{spacing:{before:240,after:120},outlineLevel:0}},
      {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:24,bold:true,color:'0E7C86'},paragraph:{spacing:{before:200,after:80},outlineLevel:1}},
      {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:21,bold:true,color:'2F3B4C'},paragraph:{spacing:{before:160,after:60},outlineLevel:2}}]},
    numbering:{config:[{reference:'bul',levels:[{level:0,format:docx.LevelFormat.BULLET,text:'•',alignment:docx.AlignmentType.LEFT,style:{paragraph:{indent:{left:400,hanging:260}}}}]}]},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1134,header:567,footer:567}}},
      headers:{default:new docx.Header({children:[new docx.Paragraph({border:{bottom:{style:docx.BorderStyle.SINGLE,size:4,color:'BFC8D3',space:4}},children:[new docx.TextRun({text:'BR13A — Super-T girder G'+(DG.gi+1)+' — AS 5100.5:2017 design calculation',size:16,color:'5E6B7D'})]})]})},
      footers:{default:new docx.Footer({children:[new docx.Paragraph({alignment:docx.AlignmentType.RIGHT,children:[new docx.TextRun({text:'Generated '+now.toISOString().slice(0,10)+'   ·   Page ',size:16,color:'5E6B7D'}),new docx.TextRun({children:[docx.PageNumber.CURRENT],size:16,color:'5E6B7D'}),new docx.TextRun({text:' of ',size:16,color:'5E6B7D'}),new docx.TextRun({children:[docx.PageNumber.TOTAL_PAGES],size:16,color:'5E6B7D'})]})]})},
      children:C}]});
  var blob=await docx.Packer.toBlob(doc); DG.lastDocx=blob;
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='BR13A_SuperT_G'+(DG.gi+1)+'_calculation_report.docx'; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },500);
  st.textContent='Word report written ('+fn+' figures).'; return blob;
}
