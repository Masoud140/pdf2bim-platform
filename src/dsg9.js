/* ===== v29: cross-section stress / strain diagrams — section drawn to scale on the left, every profile on the same depth scale beside it ===== */
/* spec: {o, title, note, deck:true|'ghost'|false, na:{y,lab}, panels:[{t, unit, fmt, segs:[{y1,y2,v1,v2,lab1,lab2,mat}], bars:[{y,v,col,lab}], lims:[{v,y1,y2,lab,dash}]}]} */
function dgXSec(spec){
  var o=spec.o, X=o.X, I=X.info, Q=DG.sec, tD=I.tD, D=tD+I.H, Wd=I.Wd, Pg=X.Pg;
  var T=34, Hd=270, sc=Hd/D, Y=function(y){ return T+y*sc; }, Ws=Math.min(300,Math.max(Wd,X.P.Bt)*sc+20), cx=10+Ws/2, sx=sc, PW=172, GAP=26;
  var nP=spec.panels.length, W=10+Ws+GAP+nP*(PW+GAP), H=T+Hd+44, g='';
  /* guide lines at deck top, deck soffit / Super-T top, soffit */
  [0,tD,D].forEach(function(y){ g+='<line x1="8" x2="'+(W-8)+'" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="var(--line)" stroke-width=".8" stroke-dasharray="2 3"/>'; });
  /* section */
  if(spec.deck!==false) g+='<rect x="'+(cx-Wd/2*sx)+'" y="'+Y(0)+'" width="'+(Wd*sx)+'" height="'+(tD*sc)+'" fill="'+(spec.deck==='ghost'?'none':'var(--dgdeck,rgba(125,135,150,.34))')+'" stroke="var(--fg)" stroke-width=".8"'+(spec.deck==='ghost'?' stroke-dasharray="4 3" opacity=".6"':'')+'/>';
  g+='<path d="M'+Pg.map(function(p){ return (cx+p[0]*sx).toFixed(1)+','+Y(D-p[1]).toFixed(1); }).join('L')+'Z" fill="var(--dgconc,rgba(125,135,150,.20))" stroke="var(--fg)" stroke-width=".8"/>';
  (spec.shade||[]).forEach(function(z){ g+='<rect x="'+(cx-Ws/2+2)+'" y="'+Y(z.y1)+'" width="'+(Ws-4)+'" height="'+((z.y2-z.y1)*sc)+'" fill="'+(z.col||'var(--flag)')+'" opacity=".16"/>'+(z.lab?'<text x="'+(cx+Ws/2-4)+'" y="'+(Y(z.y2)-3)+'" font-size="9" text-anchor="end" fill="var(--flag)">'+z.lab+'</text>':''); });
  X.S.tend.forEach(function(t){ g+='<circle cx="'+(cx+(t.x||0)*sx).toFixed(1)+'" cy="'+Y(t.y).toFixed(1)+'" r="1.8" fill="var(--instr)"/>'; });
  X.S.bars.forEach(function(b){ if(b.grp==='g') g+='<circle cx="'+(cx+(b.x||0)*sx).toFixed(1)+'" cy="'+Y(b.y).toFixed(1)+'" r="1.9" fill="none" stroke="var(--eng)" stroke-width="1.2"/>'; });
  if(spec.deck!==false&&spec.deck!=='ghost') dgDeckBarPos(Q).forEach(function(b){ g+='<circle cx="'+(cx+b.x*sx).toFixed(1)+'" cy="'+Y(b.y).toFixed(1)+'" r="1.4" fill="none" stroke="var(--eng)" stroke-width="1"/>'; });
  if(spec.cy) spec.cy.forEach(function(c){ g+='<line x1="'+(cx-Ws/2+4)+'" x2="'+(cx+Ws/2-4)+'" y1="'+Y(c.y)+'" y2="'+Y(c.y)+'" stroke="var(--muted)" stroke-width=".8" stroke-dasharray="6 3"/><text x="'+(cx+Ws/2-4)+'" y="'+(Y(c.y)-3)+'" font-size="9" text-anchor="end" fill="var(--muted)">'+c.lab+'</text>'; });
  if(spec.na&&isFinite(spec.na.y)&&spec.na.y>0&&spec.na.y<D) g+='<line x1="8" x2="'+(W-8)+'" y1="'+Y(spec.na.y)+'" y2="'+Y(spec.na.y)+'" stroke="var(--flag)" stroke-width="1" stroke-dasharray="7 3"/><text x="'+(W-10)+'" y="'+(Y(spec.na.y)-3)+'" font-size="9.5" text-anchor="end" fill="var(--flag)">'+spec.na.lab+'</text>';
  g+='<text x="'+cx+'" y="14" font-size="10.5" font-weight="600" text-anchor="middle" fill="var(--fg)">Section'+(spec.deck==='ghost'?' (deck not yet acting)':'')+'</text>';
  g+='<text x="'+(cx-Ws/2+2)+'" y="'+(Y(D)+14)+'" font-size="9" fill="var(--muted)">D = '+dgF(D,0)+' mm</text>';
  /* profile panels */
  spec.panels.forEach(function(P,i){
    var x0=10+Ws+GAP+i*(PW+GAP), vals=[0];
    P.segs.forEach(function(s){ vals.push(s.v1,s.v2); }); (P.bars||[]).forEach(function(b){ vals.push(b.v); }); (P.lims||[]).forEach(function(l){ vals.push(l.v); });
    var vmin=Math.min.apply(null,vals), vmax=Math.max.apply(null,vals), span=(vmax-vmin)||1; vmin-=span*0.08; vmax+=span*0.08;
    var V=function(v){ return x0+(v-vmin)/(vmax-vmin)*PW; }, f=P.fmt||function(v){ return anFmt(v,Math.abs(v)<10?2:1); };
    g+='<text x="'+(x0+PW/2)+'" y="14" font-size="10.5" font-weight="600" text-anchor="middle" fill="var(--fg)">'+P.t+'</text>';
    g+='<text x="'+(x0+PW/2)+'" y="26" font-size="9" text-anchor="middle" fill="var(--muted)">'+(P.sub||'')+'</text>';
    g+='<line x1="'+V(0)+'" x2="'+V(0)+'" y1="'+Y(0)+'" y2="'+Y(D)+'" stroke="var(--fg)" stroke-width=".9"/>';
    P.segs.forEach(function(s){
      /* split at zero so tension and compression fill differently */
      var parts=[[s.y1,s.v1,s.y2,s.v2]]; if(s.v1*s.v2<0){ var yz=s.y1+(s.y2-s.y1)*s.v1/(s.v1-s.v2); parts=[[s.y1,s.v1,yz,0],[yz,0,s.y2,s.v2]]; }
      parts.forEach(function(q){ var tens=(q[1]+q[3])>0; g+='<path d="M'+V(0)+','+Y(q[0])+' L'+V(q[1])+','+Y(q[0])+' L'+V(q[3])+','+Y(q[2])+' L'+V(0)+','+Y(q[2])+'Z" fill="'+(tens?'var(--flag)':'var(--instr)')+'" fill-opacity=".16" stroke="none"/>'; });
      g+='<line x1="'+V(s.v1)+'" x2="'+V(s.v2)+'" y1="'+Y(s.y1)+'" y2="'+Y(s.y2)+'" stroke="'+(s.mat==='d'?'var(--calc)':'var(--instr)')+'" stroke-width="1.8"/>';
      [[s.y1,s.v1,s.lab1],[s.y2,s.v2,s.lab2]].forEach(function(e,k){ if(e[2]===false) return; var txt=String(e[2]||f(e[1])), tw=txt.length*5.6, right=e[1]>=0; if(right&&V(e[1])+4+tw>x0+PW+4) right=false; if(!right&&V(e[1])-4-tw<x0-4) right=true; var tx=V(e[1])+(right?4:-4);
        g+='<text x="'+tx+'" y="'+(Y(e[0])+(k===0?10:-3))+'" font-size="9.5" text-anchor="'+(right?'start':'end')+'" fill="'+(e[1]>0?'var(--flag)':'var(--fg)')+'" font-weight="600">'+(e[2]||f(e[1]))+'</text>'; }); });
    (P.bars||[]).forEach(function(b){ g+='<line x1="'+V(0)+'" x2="'+V(b.v)+'" y1="'+Y(b.y)+'" y2="'+Y(b.y)+'" stroke="'+(b.col||'var(--eng)')+'" stroke-width="2.2"/>'+(b.lab?'<text x="'+(V(b.v)+(b.v>=0?3:-3))+'" y="'+(Y(b.y)+3)+'" font-size="9" text-anchor="'+(b.v>=0?'start':'end')+'" fill="'+(b.col||'var(--eng)')+'">'+b.lab+'</text>':''); });
    (P.lims||[]).forEach(function(l,k){ var y1=l.y1===undefined?0:l.y1, y2=l.y2===undefined?D:l.y2; g+='<line x1="'+V(l.v)+'" x2="'+V(l.v)+'" y1="'+Y(y1)+'" y2="'+Y(y2)+'" stroke="var(--flag)" stroke-width="1.1" stroke-dasharray="'+(l.dash||'4 3')+'"/><text x="'+V(l.v)+'" y="'+(Y(D)+14+k*11)+'" font-size="9" text-anchor="middle" fill="var(--flag)">'+l.lab+'</text>'; });
    if(P.custom) g+=P.custom(x0,PW,Y,D);
    g+='<text x="'+(x0+PW/2)+'" y="'+(H-4)+'" font-size="9" text-anchor="middle" fill="var(--muted)">'+P.unit+'</text>';
  });
  return dgCap(spec.title,'<svg viewBox="0 0 '+W+' '+H+'" class="dgdiag dgxs">'+g+'</svg>',spec.note);
}

/* concrete tension / compression limits for the selected SLS options */
function dgSLSLims(o){ var Q=DG.sec, L=dgCCLim(), S=DG.svLim, tD=o.X.info.tD, D=tD+o.X.info.H, out=[];
  if(DG.cc.opt!=='b') out.push({v:L.g,y1:tD,y2:D,lab:'+'+anFmt(L.g,2)+' ('+L.txt.replace(/_\{c\}/,'c')+')'});
  if(S.kc>0) out.push({v:-S.kc*Q.fcg,y1:tD,y2:D,lab:anFmt(-S.kc*Q.fcg,1)+' ('+S.kc+'f\'c)',dash:'7 3'});
  return out; }

/* SLS staged stresses — stage 1, composite increment, total */
function dgSLSDiag(o,lc){
  if(!o||!o.sv) return '';
  var X=o.X, I=X.info, B=o.B, tD=I.tD, D=tD+I.H, s2=o.sv.s, e2=function(y){ return s2.e0+s2.k*y; }, f2=function(v){ return anFmt(v,2); };
  var dT2=o.sv.deckTop, dB2=o.sv.deckBot, gT2=o.sv.girTop-o.g1top, gB2=o.sv.girBot-o.g1bot;   /* increments include temperature / differential shrinkage when present */
  var faces=typeof dgFaces==='function'?dgFaces(o):[], worst=faces.filter(function(F){ return F.s>F.lim; }).map(function(F){ return F.n+' '+f2(F.s)+' MPa > '+f2(F.lim)+' MPa'; });
  return dgXSec({o:o, title:'SLS stresses through the section — '+lc.name, deck:true, cy:[{y:o.yc,lab:'y<tspan font-size="75%" dy="2">c</tspan><tspan dy="-2"> composite</tspan>'},{y:B.eg.yc,lab:'y<tspan font-size="75%" dy="2">g</tspan><tspan dy="-2"> Super-T</tspan>'}],
    panels:[{t:'1. Super-T alone',sub:'prestress + M<tspan font-size="75%" dy="2">nc</tspan><tspan dy="-2"> = '+dgF(lc.Mnc,0)+' kN·m (SW + wet deck)</tspan>',unit:'σ (MPa)',segs:[{y1:tD,y2:D,v1:o.g1top,v2:o.g1bot}]},
      {t:'2. + Composite increment',sub:'after the deck acts: M<tspan font-size="75%" dy="2">s</tspan><tspan dy="-2">* = '+dgF(lc.Ms,0)+' kN·m</tspan>',unit:'Δσ (MPa)',segs:[{y1:0,y2:tD,v1:dT2,v2:dB2,mat:'d',lab2:false},{y1:tD,y2:D,v1:gT2,v2:gB2}]},
      {t:'3. = Total at the SLS',sub:'uncracked, '+(lc.comb==='a'?'permanent effects':'with traffic'),unit:'σ (MPa)',segs:[{y1:0,y2:tD,v1:o.sv.deckTop,v2:o.sv.deckBot,mat:'d',lab2:false},{y1:tD,y2:D,v1:o.sv.girTop,v2:o.sv.girBot}],lims:dgSLSLims(o)}],
    note:'Compression negative, tension positive (red fill). Stage 1 is carried by the Super-T alone and locked in; stage 2 acts on the composite section; the total is their sum. '
      +(worst.length?'<b style="color:var(--flag)">Tension over the selected limit: '+worst.join('; ')+'.</b>':'All faces within the selected tension limit ('+dgCCLim().txt.replace(/_\{c\}/,'c')+').')});
}

/* transfer — Super-T alone, deck not yet acting */
function dgTrPlot(o,lc){ var t=o.tr, lim=DG.trLim; if(!t||t.why) return ''; var I=o.X.info, tD=I.tD, D=tD+I.H, lims=[];
  if(lim.t!==null&&lim.t!=='') lims.push({v:+lim.t,y1:tD,y2:D,lab:'+'+anFmt(+lim.t,2)+' ('+lim.kt+'√f\'cp)'}); if(lim.c>0) lims.push({v:-lim.c,y1:tD,y2:D,lab:anFmt(-lim.c,1)+' ('+lim.kc+'f\'cp)',dash:'7 3'});
  var e=function(y){ return t.sg.e0+t.sg.k*(y-tD); };
  return dgXSec({o:o, title:'Stresses at transfer — '+lc.name, deck:'ghost', cy:[{y:o.B.eg.yc,lab:'y<tspan font-size="75%" dy="2">g</tspan>'}],
    panels:[{t:'Strain',sub:'Super-T alone',unit:'ε (×10⁻⁶)',fmt:function(v){ return anFmt(v,0); },segs:[{y1:tD,y2:D,v1:t.top/t.Ect*1e6,v2:t.bot/t.Ect*1e6}]},
      {t:'Stress',sub:'P<tspan font-size="75%" dy="2">i</tspan><tspan dy="-2"> = '+dgF(t.P0,0)+' kN, M</tspan><tspan font-size="75%" dy="2">sw</tspan><tspan dy="-2"> = '+dgF(t.Msw,0)+' kN·m</tspan>',unit:'σ (MPa)',segs:[{y1:tD,y2:D,v1:t.top,v2:t.bot}],lims:lims}],
    note:'Compression negative. The deck is not cast at transfer (dashed outline); depth is measured from the future deck top. Limits: Cl 8.1.4.2 compression, Cl 8.6.2.1 tension.'});
}

/* cracked section at M_s* — strain, concrete stress (no tension), bar and strand stresses: the basis of the Cl 8.6.1 and Table 8.6.2.1 checks */
function dgCrkXDiag(o,lc){ if(!o||!o.sc) return ''; var X=o.X, I=X.info, tD=I.tD, D=tD+I.H, s=o.sc.s, sg=o.sg;
  var eT=function(y){ return s.e0+s.k*y+(y>=tD?sg.e0+sg.k*y:0); }, sC=function(y){ var v=(y>=tD?I.Eg:I.Ed)*(eT(y)-(o.fr?o.fr(y,y>=tD?'g':'d'):0)); return Math.min(v,0); };
  var na=null; if(s.k+sg.k!==0){ var yn=-(s.e0+sg.e0)/(s.k+sg.k); if(yn>tD&&yn<D) na=yn; }
  var bars=X.S.bars.map(function(b,j){ return {y:b.y,v:o.sc.bars[j],col:'var(--eng)'}; }), grp={}; bars.forEach(function(b){ var k=Math.round(b.y/10); if(!grp[k]||Math.abs(b.v)>Math.abs(grp[k].v)) grp[k]=b; });
  var bl=Object.keys(grp).map(function(k){ var b=grp[k]; b.lab=anFmt(b.v,0); return b; });
  var tg={}; X.S.tend.forEach(function(t,j){ var k=Math.round(t.y/10), v=o.sc.tend[j]; if(!tg[k]||v>tg[k].v) tg[k]={y:t.y,v:v}; });
  var rz=typeof dgBarZone==='function'?dgBarZone(o):null;
  return dgXSec({o:o, title:'Cracked section at M<sub>s</sub>* — '+lc.name, deck:true, na:na!==null?{y:na,lab:'N.A. (cracked)'}:null,
    panels:[{t:'Strain',sub:'total, cracked',unit:'ε (×10⁻⁶)',fmt:function(v){ return anFmt(v,0); },segs:[{y1:0,y2:tD,v1:eT(0)*1e6,v2:eT(tD-0.01)*1e6,mat:'d',lab2:false},{y1:tD,y2:D,v1:eT(tD)*1e6,v2:eT(D)*1e6}]},
      {t:'Concrete',sub:'compression only',unit:'σ (MPa)',segs:[{y1:0,y2:tD,v1:sC(0),v2:sC(tD-0.01),mat:'d',lab2:false},{y1:tD,y2:D,v1:sC(tD),v2:sC(D)}]},
      {t:'Reinforcing bars',sub:'σ<tspan font-size="75%" dy="2">s</tspan><tspan dy="-2"> by layer'+(rz&&rz.n?', σ</tspan><tspan font-size="75%" dy="2">scr</tspan><tspan dy="-2"> = '+anFmt(rz.sig,0):'')+'</tspan>',unit:'σ (MPa)',segs:[],bars:bl},
      {t:'Strands',sub:'total stress by row',unit:'σ (MPa)',fmt:function(v){ return anFmt(v,0); },segs:[],bars:Object.keys(tg).map(function(k){ var q=tg[k]; return {y:q.y,v:q.v,col:'var(--instr)',lab:anFmt(q.v,0)}; })}],
    note:'No concrete tension. Super-T strains include the locked-in stage-1 state. Bar stresses are total stresses (used for Cl 8.6.1); the Table 8.6.2.1 increments are measured from the zero-stress state of the tension face.'});
}

var dgCrackDiag8=dgCrackDiag; dgCrackDiag=function(o,lc){ return dgCrkXDiag(o,lc)+dgCrackDiag8(o,lc); };

/* ULS section analysis in the same layout: section with stress block and N.A. | strain | concrete stress | steel stress | forces */
function dgULSDiag(o,lc){
  if(!o||!o.Su||!o.dn) return '';
  var X=o.X, I=X.info, D=I.tD+I.H, P=dgUltParts(o.Su,o.dn,o.face,o.yc), top=o.face==='top', zOf=function(y){ return top?y:D-y; }, ecu=0.003;
  var blk=P.blk, yb1=top?0:D-blk, yb2=top?blk:D, yNA=top?o.dn:D-o.dn, eps=function(y){ return -ecu*(o.dn-zOf(y))/o.dn; };
  var fcc=function(y){ var c=DSG.conAt(o.Su,y); return c?DSG.a2(c.fc)*c.fc:0; };
  var cs=[]; if(top){ var yd=Math.min(yb2,I.tD); cs.push({y1:yb1,y2:yd,v1:-fcc(1),v2:-fcc(1),mat:'d',lab2:false}); if(yb2>I.tD) cs.push({y1:I.tD,y2:yb2,v1:-fcc(I.tD+1),v2:-fcc(I.tD+1)}); } else cs.push({y1:yb1,y2:yb2,v1:-fcc(D-1),v2:-fcc(D-1)});
  var bl={}; o.Su.bars.forEach(function(b){ var s=Math.max(-b.fsy,Math.min(b.fsy,b.E*eps(b.y))), k=Math.round(b.y/10); if(!bl[k]||Math.abs(s)>Math.abs(bl[k].v)) bl[k]={y:b.y,v:s,col:'var(--eng)'}; });
  var tl={}; o.Su.tend.forEach(function(t){ var s=DSG.fp(t,eps(t.y)+t.epe), k=Math.round(t.y/10); if(!tl[k]) tl[k]={y:t.y,v:s,col:'var(--instr)'}; });
  var steel=Object.keys(bl).map(function(k){ return bl[k]; }).concat(Object.keys(tl).map(function(k){ var q=tl[k]; q.lab=anFmt(q.v,0); return q; }));
  var Tt=P.Tb+P.Tp, yC=o.yc+P.Cm*1e3/P.C, yT=Tt?o.yc+(P.Tbm+P.Tpm)*1e3/Tt:o.yc;
  var forces=function(x0,PW,Y){ var a=function(y,dir,col,lab){ var xa=x0+10, xb=x0+PW-24; return '<line x1="'+(dir>0?xa:xb)+'" x2="'+(dir>0?xb:xa)+'" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="'+col+'" stroke-width="2.2" marker-end="url(#dgarx)"/><text x="'+((xa+xb)/2)+'" y="'+(Y(y)-5)+'" font-size="10" text-anchor="middle" fill="'+col+'" font-weight="600">'+lab+'</text>'; };
    return '<defs><marker id="dgarx" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="context-stroke"/></marker></defs>'+a(yC,-1,'var(--flag)','C = '+dgF(-P.C,0)+' kN')+a(yT,1,'var(--instr)','T = '+dgF(Tt,0)+' kN')
      +'<line x1="'+(x0+PW-10)+'" x2="'+(x0+PW-10)+'" y1="'+Y(yC)+'" y2="'+Y(yT)+'" stroke="var(--fg)" stroke-width=".8"/><text transform="translate('+(x0+PW-2)+' '+((Y(yC)+Y(yT))/2)+') rotate(90)" font-size="9.5" text-anchor="middle" fill="var(--fg)">z = '+dgF(Math.abs(yT-yC),0)+' mm</text>'; };
  return dgXSec({o:o, title:'ULS section analysis — '+lc.name+' ('+(top?'sagging':'hogging')+', '+(o.solid?'solid end block':'open section')+')', deck:true,
    shade:[{y1:yb1,y2:yb2,lab:'γd<tspan font-size="75%" dy="2">n</tspan><tspan dy="-2"> = '+dgF(blk,0)+'</tspan>'}], na:{y:yNA,lab:'N.A. d<tspan font-size="75%" dy="2">n</tspan><tspan dy="-2"> = '+dgF(o.dn,0)+' mm</tspan>'},
    panels:[{t:'Strain',sub:'ε<tspan font-size="75%" dy="2">cu</tspan><tspan dy="-2"> = 0.003 at the '+(top?'top':'soffit')+'</tspan>',unit:'ε (‰)',fmt:function(v){ return anFmt(v,2); },segs:[{y1:0,y2:D,v1:eps(0)*1000,v2:eps(D)*1000}]},
      {t:'Concrete',sub:'rectangular stress block α<tspan font-size="75%" dy="2">2</tspan><tspan dy="-2">f\'c</tspan>',unit:'σ (MPa)',segs:cs},
      {t:'Steel',sub:'bars (green), strands (blue)',unit:'σ (MPa)',fmt:function(v){ return anFmt(v,0); },segs:[],bars:steel},
      {t:'Forces',sub:'about y<tspan font-size="75%" dy="2">c</tspan>',unit:'',segs:[],custom:forces}],
    note:'Strain compatibility with ε<sub>cu</sub> = 0.003 on the compression face (Cl 8.1.3). C = '+dgF(-P.C,0)+' kN (concrete), T<sub>bars</sub> = '+dgF(P.Tb,0)+' kN, T<sub>strands</sub> = '+dgF(P.Tp,0)+' kN; M<sub>u</sub> = '+dgF(o.Mu,0)+' kN·m, φM<sub>u</sub> = '+dgF(o.phiMu,0)+' kN·m. Strand stresses include the prestrain ε<sub>pe</sub>.'});
}

/* ---------- symbols and terms: one glossary used for tooltips, the Analysis page and the reports ---------- */
var DG_GLOSS=[
 ['M_{nc}','SLS moment on the non-composite section — the Super-T alone. Self weight of the Super-T (stage CS2) plus the wet deck and diaphragms (CS3), carried before the deck has hardened, so only the Super-T resists it.'],
 ['M_{s}*','SLS moment on the composite section — everything added after the deck acts with the Super-T: roll-restraint release (CS4), surfacing and barriers (CS5), creep and shrinkage (CS6) and traffic.'],
 ['M*','ULS design moment: the factored sum of all actions at the point (sagging positive).'],['V*','ULS design shear.'],['T*','ULS design torsion.'],['N*','ULS axial force: the grillage girder axial force of the permanent stages when the option is on (Set parameters for → Analysis options), otherwise zero. Traffic axial force is not enveloped.'],
 ['M_{dec}','Decompression moment: the composite moment at which the tension face reaches zero stress.'],
 ['M_{s,allow}','Largest composite SLS moment for which the steel stress increments stay within Table 8.6.2.1.'],
 ['M_{cr}','Cracking moment: the moment at which the tension face reaches the flexural tensile strength f\'_{ct.f}.'],
 ['M_{u}','Nominal ultimate moment capacity from strain compatibility.'],['φM_{u}','Design moment capacity: φ × M_{u}.'],['φ','Capacity reduction factor (Table 2.3.2).'],
 ['k_{uo}','Neutral-axis depth ratio d_{n}/d_{o} (ductility check, ≤ 0.36).'],['d_{n}','Neutral-axis depth at ultimate.'],['γ','Stress-block depth factor (Cl 8.1.3).'],['α_{2}','Stress-block intensity factor (Cl 8.1.3).'],
 ['σ_{t}','Maximum concrete tensile stress at a face.'],['σ_{b}','Stress at the Super-T soffit.'],['σ_{scr}','Tensile stress in the reinforcing bars on the cracked section at the SLS (Cl 8.6.1).'],
 ['Δσ_{s}','Increase in bar stress from the zero-stress state of the tension face to M_{s}* (Cl 8.6.2.1(b)).'],['Δσ_{p}','The same increase for bonded tendons.'],
 ['f\'_{c}','Characteristic 28-day concrete strength.'],['f\'_{cp}','Concrete strength at transfer.'],['f_{scr}','Permissible steel stress for crack control.'],
 ['P','Strand force after losses.'],['P_{i}','Strand force just after transfer (after elastic shortening).'],['e_{p}','Strand eccentricity below the Super-T centroid.'],
 ['y_{c}','Depth of the composite centroid below the deck top.'],['y_{g}','Depth of the Super-T centroid below the deck top.'],
 ['L_{pt}','Transmission length: distance over which the strand force builds up from a cut end or debond point.'],['L_{d}','Development length: distance needed to develop the strand ultimate stress.'],
 ['d_{v}','Effective shear depth (Cl 8.2.1.9).'],['b_{v}','Effective web width for shear (Cl 8.2.1.5).'],['ε_{x}','Longitudinal strain at mid-depth used by the general shear method (Cl 8.2.4.4).'],
 ['θ_{v}','Angle of the diagonal compression struts (Cl 8.2.4.2).'],['V_{uc}','Concrete contribution to shear strength.'],['V_{us}','Shear reinforcement contribution.'],['V_{u.max}','Web-crushing limit.'],['T_{us}','Torsion strength of the closed ties.'],
 ['(a) / (b)','Load combinations: (b) permanent effects plus road traffic; (a) permanent effects only.'],['POI','Point of interest along the girder.']];
function dgGlossHTML(){ return '<dl class="dggl">'+DG_GLOSS.map(function(q){ return '<dt>'+dgMk(q[0])+'</dt><dd>'+dgMk(q[1])+'</dd>'; }).join('')+'</dl>'; }
function dgGlossFor(txt){ var t=String(txt||''); return DG_GLOSS.filter(function(q){ return q[0].length>1&&t.indexOf(q[0])>=0; }).map(function(q){ return q[0].replace(/_\{([^}]*)\}/g,'$1')+': '+q[1].replace(/_\{([^}]*)\}/g,'$1'); }).join('\n'); }
/* tooltips on every calculation row: hover the item to read what each symbol means */
var dgCalcHTML9=dgCalcHTML; dgCalcHTML=function(lines){ var h=dgCalcHTML9(lines), i=0;
  return h.replace(/<tr>(<td>)/g,function(m,td){ var l; do{ l=lines[i++]; }while(l&&l.sub); var tip=l?dgGlossFor((l.d||'')+' '+(l.e||'')):''; return tip?'<tr title="'+tip.replace(/"/g,'&quot;')+'"><td class="dghelp">':m; }); };

var dgAnView9=dgAnView; dgAnView=function(){ dgAnView9(); var pg=$('dg_pg_an'); if(pg&&!$('dg_gloss')){ var d=document.createElement('details'); d.className='dgmore'; d.id='dg_gloss'; d.innerHTML='<summary>Symbols and terms (M<sub>nc</sub>, M<sub>s</sub>*, M<sub>dec</sub>, σ<sub>scr</sub> …) — hover any calculation row for the same notes</summary>'+dgGlossHTML(); var first=pg.querySelector('details.dgmore'); pg.insertBefore(d,first); } };

/* legend items switch series on and off; the explanation of (a) and (b) sits under every chart with two combinations */
DG.an.hide=DG.an.hide||{'Deck top':true};
var dgAnView10=dgAnView; dgAnView=function(){ dgAnView10(); var ch=$('dg_chart'); if(!ch) return;
  [].forEach.call(ch.querySelectorAll('.dglegt[data-grp]'),function(el){ el.onclick=function(){ var k=el.getAttribute('data-grp'); DG.an.hide[k]=!DG.an.hide[k]; dgAnView(); }; });
  if(DG.an.type==='sls'||DG.an.type==='uls'){ var n=document.createElement('p'); n.className='dgcbx'; n.innerHTML='<b>Showing combination '+(DG.an.comb==='a'?'(a) — permanent effects only (no traffic)':'(b) — permanent effects + traffic')+'.</b> Switch in “Combination”. (b) governs soffit tension and top compression (mainly midspan); (a) governs top-flange tension and soffit compression (mainly near the ends). The “Governing along the girder” boxes above always check both and show which one governs, e.g. “· (a)”. Click a legend item to hide or show a line.'; ch.appendChild(n); } };
