
/* ===== v19: parametric Super-T (open span section + solid end block), per-load-case section type ===== */
var DG_PAR=[['D','Overall Super-T depth','mm','Total girder depth, soffit to top of flange'],['Bt','Top flange width','mm','Overall width across the flange tips'],
 ['tf','Top flange thickness','mm','At the flange tip, top to flange underside'],['tc','Flange tip chamfer','mm','45° chamfer on the underside of the tip'],
 ['cW','Web–flange haunch width','mm','Horizontal leg of the haunch under the flange'],['cD','Web–flange haunch depth','mm','Vertical leg of the haunch'],
 ['n','Web slope 1 in n','—','Outer web face: n vertical per 1 horizontal (angle from horizontal = atan n)'],['Bb','Soffit width','mm','Between the outer web faces extended to the soffit'],
 ['scW','Soffit chamfer width','mm','Horizontal leg of the bottom corner chamfer'],['scH','Soffit chamfer height','mm','Vertical leg of the bottom corner chamfer'],
 ['twT','Web thickness at top','mm','Normal to the web, at the underside of the Bondek seat'],['twB','Web thickness at bottom','mm','Normal to the web, at the top of the bottom-flange taper'],
 ['tb','Bottom flange thickness','mm','At the centreline (top of the bottom flange)'],['tt','Bottom flange taper depth','mm','Rise of the void floor from the centre to the web face'],
 ['sw','Bondek seat width','mm','Horizontal recess at the top inner edge'],['sd','Bondek seat depth','mm','Vertical recess at the top inner edge']];
/* half outline (x from centreline, y above soffit). Open: 12 points (outer face then the void). Solid: outer face closed across the top. */
function dgGenR(P,solid){
  var s=1/P.n, cs=Math.cos(Math.atan(s)), xo=function(y){ return P.Bb/2+s*y; }, yh=P.D-P.tf-P.cD, yT=P.D-P.sd, yB=P.tb+P.tt;
  var xiT=xo(yT)-P.twT/cs, xiB=xo(yB)-P.twB/cs;
  var out=[[P.Bb/2-P.scW,0],[xo(P.scH),P.scH],[xo(yh),yh],[xo(yh)+P.cW,P.D-P.tf],[P.Bt/2-P.tc,P.D-P.tf],[P.Bt/2,P.D-P.tf+P.tc],[P.Bt/2,P.D]];
  if(solid) return out.concat([[0,P.D]]);
  return out.concat([[xiT+P.sw,P.D],[xiT+P.sw,yT],[xiT,yT],[xiB,yB],[0,P.tb]]);
}
/* parameters from a 12-point Hog Super-T outline (exact inverse of dgGenR) */
function dgParFromR(R){
  var s=(R[2][0]-R[1][0])/(R[2][1]-R[1][1]), cs=Math.cos(Math.atan(s)), Bb=2*(R[1][0]-s*R[1][1]), xo=function(y){ return Bb/2+s*y; }, D=R[6][1];
  var r=function(v){ return Math.round(v*1000)/1000; };
  return {D:D, Bt:r(2*R[6][0]), tf:r(D-R[4][1]), tc:r(R[6][0]-R[4][0]), cW:r(R[3][0]-R[2][0]), cD:r(R[3][1]-R[2][1]), n:r(1/s), Bb:r(Bb), scW:r(Bb/2-R[0][0]), scH:r(R[1][1]),
    twT:r((xo(R[9][1])-R[9][0])*cs), twB:r((xo(R[10][1])-R[10][0])*cs), tb:r(R[11][1]), tt:r(R[10][1]-R[11][1]), sw:r(R[7][0]-R[9][0]), sd:r(D-R[8][1])};
}
function dgSyncR(){ var Q=DG.sec; Q.R=dgGenR(Q.P,false); Q.Rs=dgGenR(Q.P,true); }
function dgRv(){ var Q=DG.sec; return DG.vsec==='solid'?Q.Rs:Q.R; }
DG.vsec='open'; DG.detS={svd:null,svn:null,svs:null,tvd:null,tvn:null,tvs:null,cs:null,ct:null,dg:null,fsyf:null,ex:false};
DG.show.par=1;
function dgSecInit(force, keepShape){
  if(DG.sec&&!force) return DG.sec;
  var s=dgSnap(), m=dgModel(), g=m.g[DG.gi], res=(s.r&&s.r.res)||[], ti=DG.tIdx<0?res.length-1:Math.min(DG.tIdx,res.length-1), Pm=ti>=0?res[ti].Pm:null, Ap=s.p.Ap, old=DG.sec;
  if(!s.R) throw new Error('The Hog Calculator section is not a Super-T');
  var Q={name:s.cur, P:dgParFromR(s.R), tD:m.tD, Wd:g.Wd, fcg:m.fcg, Eg:m.Eg, fcd:m.fcd, Ed:m.Ed, Es:s.p.Es||200000, fsy:s.p.fsy||500,
    Ep:s.p.Ep, Ap:Ap, db:s.p.db, mbl:s.p.mbl, time:ti>=0?res[ti].label:'—', solidLen:old?old.solidLen:null, zones:old?old.zones:null,
    /* strands come only from the Strands & reinforcement tab (Hog strand list). The Hog losses Pm / Pall and debond list sl are indexed over the strands that are ON, in order */
    strands:(function(){ var nOn=s.S.filter(function(t){ return t.on; }).length, okP=Pm&&Pm.length===nOn, rk=-1;
      return s.S.map(function(t){ var r=t.on?++rk:-1, sl=r>=0&&s.p.sl?s.p.sl[r]:null; return {x:t.x, y:t.y, on:!!t.on, sp:okP&&r>=0&&Pm[r]!=null?Pm[r]*1000/Ap:null, dL:t.d!=null?(+t.d||0):(sl?sl.d||0:0), dR:t.d2!=null?(+t.d2||0):(sl?sl.d2||0:0)}; }); })(),
    gbars:s.B.map(function(b){ return {x:b.x, y:b.y, d:b.d}; }),
    dbars:old?old.dbars:[{pos:'top',d:null,s:null,c:null},{pos:'bot',d:null,s:null,c:null}]};
  if(old&&keepShape){ ['name','P','tD','Wd','fcg','Eg','fcd','Ed','Es','fsy','Ep','solidLen','zones'].forEach(function(k){ Q[k]=old[k]; }); }   /* strands, bars and strand properties always follow the Strands & reinforcement tab */
  Q.gird=old&&old.gird?old.gird:{Lg:null,a:null,asup:null,Lpt:s.p.lt*s.p.db,Ld:null,scl:null,src:{}};
  Q.orig=JSON.parse(JSON.stringify({name:Q.name,P:dgParFromR(s.R),tD:Q.tD,Wd:Q.Wd,fcg:Q.fcg,Eg:Q.Eg,fcd:Q.fcd,Ed:Q.Ed,Es:Q.Es,fsy:Q.fsy,Ep:Q.Ep,Ap:Q.Ap,db:Q.db,mbl:Q.mbl,strands:s.S.length,gbars:s.B.length}));
  Q.edited=old&&keepShape?old.edited:{};
  DG.sec=Q; dgSyncR(); return Q;
}
function dgSection(solid){
  var Q=dgSecInit(); if(solid===undefined) solid=DG.vsec==='solid';
  var R=solid?Q.Rs:Q.R, H=dgH(R), Pg=dgPoly(R), tD=Q.tD, Wd=Q.Wd, fpb=dgFpb(Q);
  if(!(Wd>0)) throw new Error('Deck width is missing');
  var dz=DG.dz||3, conc=DSG.stripsFromPolygon(Pg,H,tD,Q.Eg,Q.fcg,'g',dz).concat(DSG.stripsFromLayers([{h:tD,b1:Wd,b2:Wd,E:Q.Ed,fc:Q.fcd,grp:'d'}],dz));
  var gb=Q.gbars.map(function(b){ return {y:tD+H-b.y, A:Math.PI*b.d*b.d/4, E:Q.Es, fsy:Q.fsy, grp:'g', d:b.d, x:b.x}; });
  var db=[]; Q.dbars.forEach(function(r){ if(!(r.d>0&&r.s>0&&r.c!==null&&r.c>=0)) return; var n=Math.max(1,Math.floor(Wd/r.s)), y=r.pos==='top'?r.c+r.d/2:tD-r.c-r.d/2; db.push({y:y, A:n*Math.PI*r.d*r.d/4, E:Q.Es, fsy:Q.fsy, grp:'d', n:n, d:r.d}); });
  var tend=Q.strands.filter(function(t){ return t.on; }).map(function(t){ return {y:tD+H-t.y, A:Q.Ap, E:Q.Ep, fpb:fpb, eu:0.035, sp:t.sp, grp:'g', x:t.x}; });
  var pp=dgPolyProps(Pg);
  var info={sec:Q.name+(solid?' — solid end block':''), H:H, A:pp.A, I:pp.I, yb:pp.yb, tD:tD, Wd:Wd, Eg:Q.Eg, Ed:Q.Ed, fcg:Q.fcg, fcd:Q.fcd, Ap:Q.Ap, Ep:Q.Ep, fpb:fpb, nS:tend.length, nB:gb.length, time:Q.time, fsy:Q.fsy, Es:Q.Es, mbl:Q.mbl, db:Q.db, solid:solid};
  return {S:{conc:conc, bars:gb.concat(db), tend:tend}, info:info, Pg:Pg, R:R, P:Q.P, solid:solid, deckBars:db};
}
/* shear / torsion geometry from the parameters. Open: Super-T trough closed by the deck (single-cell box). Solid end block: solid trapezoid. */
function dgGeo(X, D){
  var P=X.P, I=X.info, det=X.solid?DG.detS:DG.det, g={ok:false, solid:X.solid};
  var sl=1/P.n, cs=Math.cos(Math.atan(sl)), x0=P.Bb/2, xo=function(y){ return x0+sl*y; };
  var yT=P.D-P.sd, yB=P.tb+P.tt, xiT=xo(yT)-P.twT/cs, xiB=xo(yB)-P.twB/cs, xi=function(y){ return xiB+(xiT-xiB)*(y-yB)/(yT-yB); };
  g.sl=sl; g.Acp=2*(x0*D+sl*D*D/2); g.uc=2*x0+2*(x0+sl*D)+2*D*Math.sqrt(1+sl*sl); g.Pv=0; g.tb=P.tb;
  if(X.solid){ g.tw=null; g.bv=2*xo(P.scH); g.bvWhy='solid: width of the section at the top of the soffit chamfer'; }
  else { g.tw=Math.min(P.twT,P.twB); g.bv=2*g.tw; g.bvWhy='2 &times; minimum web thickness (normal to the web)';
    var yb=P.tb/2, yt=I.H+I.tD/2, ym=(yb+yt)/2; g.Ao=2*(yt-yb)*(xo(ym)+xi(ym))/2; }
  if(det.cs>=0&&det.ct>=0&&det.tvd>0&&det.cs!==null&&det.ct!==null){
    var a=det.cs+det.tvd/2, at=det.ct+det.tvd/2, lb=a, lt=D-at, xl=function(y){ return xo(y)-a/cs; };
    g.Aoh=2*(lt-lb)*xl((lb+lt)/2); g.uh=2*xl(lb)+2*xl(lt)+2*(lt-lb)*Math.sqrt(1+sl*sl); g.y1=lt-lb;
    if(X.solid){ g.Ao=0.85*g.Aoh; g.AoWhy='0.85 A<sub>oh</sub> (solid section)'; }
    g.lig=[[-xl(lb),D-lb],[xl(lb),D-lb],[xl(lt),D-lt],[-xl(lt),D-lt]]; g.ok=true;
  } else g.why='closed-tie diameter and covers are needed for A<sub>oh</sub>, u<sub>h</sub>, y<sub>1</sub>'+(X.solid?' (solid end block detailing)':'');
  return g;
}
/* which section a load case uses */
function dgLCType(lc){
  if(lc.sec==='solid') return true; if(lc.sec==='open') return false;
  var L=DG.sec.solidLen, ch=(typeof CS!=='undefined'&&CS.chains)?CS.chains[DG.gi]:null;
  if(!(L>0)||lc.s===null||lc.s===undefined) return false;
  var dEnd=ch?Math.min(lc.s,ch.Ltot-lc.s):lc.s; return dEnd*1000<=L;
}
function dgRun(quiet){
  var st=$('dg_st'), Xo, Xs; try{ Xo=dgSection(false); Xs=dgSection(true); }catch(e){ st.textContent=e.message; return; }
  if(Xo.S.tend.some(function(t){ return !t.sp; })){ st.textContent='Prestress after losses is missing: open the Hog Calculator tab and run it.'; return; }
  var Bo=dgBase(Xo), Bs=dgBase(Xs), t0=Date.now();
  var Gp=null; try{ Gp=dgGirdPar(); }catch(e){}
  DG.res={X:Xo, base:Bo, Xs:Xs, Bs:Bs, lc:DG.lc.map(function(lc){ var sol=dgLCType(lc), Xb=sol?Xs:Xo, Bb=sol?Bs:Bo, X=Xb, B=Bb;
    /* the load case's own station: strand force from the transmission / debond factor and the Hog losses at that point */
    if(Gp&&Gp.Lg&&lc.s!==null&&lc.s!==undefined){ var Xt=dgStationX(Xb,lc.s,Gp); if(Xt.S.tend.length){ X=Xt; B=dgBase(Xt); } }
    if(typeof dgFreeFor==='function') lc.free=dgFreeFor('b');
    var o=dgLC(X, B, lc); o.X=X; o.B=B; o.solid=sol; return o; })};
  st.textContent='Checks run for '+DG.lc.length+' load case(s) in '+((Date.now()-t0)/1000).toFixed(1)+' s'+(DG.auto?' (auto-update on)':'')+'.'; DG.auto=true; dgAll();
}
function dgNewLC(i,pos,sec){ var nm={mid:'Midspan',q:'Quarter span',sup:'Support + dv',brg:'End block at bearing',user:'User'}[pos];
  return {name:'LC'+(i+1)+' '+nm, pos:pos, sec:sec||'auto', s:null, fscr:200, ftcr:200, Mnc:0, Ms:0, Ns:0, Mu:0, Nu:0, Vu:0, Tu:0, brk:null, src:'not filled'}; }
DG.lc=[dgNewLC(0,'mid'),dgNewLC(1,'q'),dgNewLC(2,'sup'),dgNewLC(3,'brg','solid')];
function dgFillNow(){
  var X=dgSection(false), b=dgBase(X), ch=CS.chains[DG.gi], sb=dgBearingS(ch), sb2=sb?sb[1]:ch.Ltot, sb1=sb?sb[0]:0, Lb=sb2-sb1;
  DG.lc.forEach(function(lc){ if(lc.pos==='mid') lc.s=sb1+Lb/2; else if(lc.pos==='q') lc.s=sb1+Lb/4; else if(lc.pos==='sup') lc.s=sb1+b.dv('top')/1000; else if(lc.pos==='brg') lc.s=sb1; else if(lc.s===null) lc.s=ch.Ltot/2;
    lc.brk=dgActAt(DG.gi,lc.s); dgTotals(lc); });
  $('dg_st').textContent='Filled '+DG.lc.length+' load cases for '+ch.name+' (chain '+anFmt(ch.Ltot,2)+' m; bearings at s = '+(sb?anFmt(sb1,2)+' and '+anFmt(sb2,2)+' m, span '+anFmt(Lb,2)+' m':'not found — span taken as the chain')+').'; DG.res=null; dgRun();
}
function dgHeads(){ var gi=-1, gu=-1; if(DG.res) DG.res.lc.forEach(function(o,i){ var u=Math.max(Math.max(0,o.uS||0),o.uB||0,o.sh?o.sh.u:0); if(u>gu){ gu=u; gi=i; } });
  return DG.lc.map(function(l,i){ var sol=DG.res&&DG.res.lc[i]?DG.res.lc[i].solid:(DG.sec?dgLCType(l):false); return (i===gi?'<span class="dggov" title="governing load case">&#9650; </span>':'')+'LC'+(i+1)+'<div class="dgsub">'+l.name.replace(/^LC\d+\s*/,'')+'</div><div class="dgsub '+(sol?'dgsol':'')+'">'+(sol?'solid end':'open')+'</div>'; }); }
/* parameter call-outs on the drawing (right half) */
function dgParLabels(Y,fs,sw){
  var P=DG.sec.P, s=1/P.n, cs=Math.cos(Math.atan(s)), xo=function(y){ return P.Bb/2+s*y; }, solid=DG.vsec==='solid';
  var yT=P.D-P.sd, yB=P.tb+P.tt, xiT=xo(yT)-P.twT/cs, xiB=xo(yB)-P.twB/cs, xi=function(y){ return xiB+(xiT-xiB)*(y-yB)/(yT-yB); }, yh=P.D-P.tf-P.cD, g='';
  var lab=function(x,y,t,dx,dy){ var X2=x+dx*fs, Y2=Y(y)+dy*fs; g+='<line x1="'+x+'" y1="'+Y(y)+'" x2="'+X2+'" y2="'+Y2+'" stroke="var(--calc)" stroke-width="'+(0.8*sw)+'"/><circle cx="'+x+'" cy="'+Y(y)+'" r="'+(1.6*sw)+'" fill="var(--calc)"/>'
    +'<text x="'+(X2+(dx>=0?0.25:-0.25)*fs)+'" y="'+(Y2+0.3*fs)+'" text-anchor="'+(dx>=0?'start':'end')+'" font-size="'+(0.72*fs)+'" font-weight="600" fill="var(--calc)">'+t+'</text>'; };
  lab(P.Bt/2,P.D-P.tf/2,'t<tspan font-size="75%" dy="2">f</tspan>',2.2,0);
  if(P.tc>0) lab(P.Bt/2-P.tc/2,P.D-P.tf+P.tc/2,'t<tspan font-size="75%" dy="2">c</tspan>',1.6,1.4);
  lab(xo(yh)+P.cW/2,yh+P.cD/2,'c<tspan font-size="75%" dy="2">W</tspan> &times; c<tspan font-size="75%" dy="2">D</tspan>',2.4,1.6);
  lab(xo(P.D*0.45),P.D*0.45,'web 1 : n',2.6,0);
  if(P.scW>0||P.scH>0) lab(P.Bb/2-P.scW/2,P.scH/2,'sc<tspan font-size="75%" dy="2">W</tspan> &times; sc<tspan font-size="75%" dy="2">H</tspan>',2.2,1.2);
  if(!solid){
    lab((xo(yT-260)+xi(yT-260))/2,yT-260,'tw<tspan font-size="75%" dy="2">T</tspan>',-2.6,1.2);
    lab((xo(yB+60)+xi(yB+60))/2,yB+60,'tw<tspan font-size="75%" dy="2">B</tspan>',-2.6,-0.6);
    lab(0,P.tb/2,'t<tspan font-size="75%" dy="2">b</tspan>',-1.8,0);
    lab(xiB/2,P.tb+P.tt/2,'t<tspan font-size="75%" dy="2">t</tspan>',-0.6,-2.2);
    lab(xiT+P.sw/2,P.D-P.sd/2,'s<tspan font-size="75%" dy="2">w</tspan> &times; s<tspan font-size="75%" dy="2">d</tspan>',-1.2,-2.2);
  } else lab(0,P.D/2,'solid end block',-1.5,0);
  return g;
}
/* detailing for the open span section and the solid end block, side by side */
function dgDetView(X,B){
  if(!$('dg_det')) return;
  var Q=DG.sec, A=function(d,n,dd,s){ return n>0&&dd>0&&s>0?n*Math.PI*dd*dd/4*1000/s:null; };
  var col=function(d,key){ return function(k,w){ return '<input class="f dgd" data-set="'+key+'" data-k="'+k+'" value="'+(d[k]===null||d[k]===undefined?'':d[k])+'" style="width:'+(w||60)+'px">'; }; };
  var tg=function(d,ks){ return ks.every(function(k){ return d[k]!==null&&d[k]!==''&&d[k]!==undefined; })?(d.ex?DGTAG.X:DGTAG.I):DGTAG.M; };
  var o=DG.det, s=DG.detS, io=col(o,'o'), is=col(s,'s');
  var row=function(lbl,k){ return '<tr class="dgi"><td class="l">'+lbl+'</td><td class="v">'+io(k)+'</td><td class="v">'+is(k)+'</td></tr>'; };
  var h='<div class="msbar"><button class="b" id="dg_ex">Use the reference spreadsheet&rsquo;s detailing (example only)</button><button class="b" id="dg_cp">Copy open &rarr; solid</button><button class="b" id="dg_exc">Clear</button><span class="bbnote" style="margin:0">Ligature and cover drawings for BR13A are not in this set.</span></div>'
   +'<div class="dgstack"><div class="dgx"><table class="dt dgt" style="max-width:820px"><tr><th class="l">Detailing</th><th>Open (span)</th><th>Solid end block</th></tr>'
   +'<tr class="dgh"><td colspan="3">Reinforcement provided for shear only</td></tr>'+row('Fitment diameter d (mm)','svd')+row('Number of legs n (all webs)','svn')+row('Spacing s (mm)','svs')
   +'<tr><td class="l">A<sub>sv</sub>/s = n&pi;d&sup2;/4 &times; 1000/s (mm&sup2;/m)</td><td class="v">'+dgF(A(o,o.svn,o.svd,o.svs),1)+'</td><td class="v">'+dgF(A(s,s.svn,s.svd,s.svs),1)+'</td></tr>'
   +'<tr class="dgh"><td colspan="3">Reinforcement for torsion and shear (closed ties)</td></tr>'+row('Fitment diameter d (mm)','tvd')+row('Number of bars per tie n','tvn')+row('Spacing s (mm)','tvs')
   +'<tr><td class="l">A<sub>sw</sub>/s (mm&sup2;/m)</td><td class="v">'+dgF(A(o,o.tvn,o.tvd,o.tvs),1)+'</td><td class="v">'+dgF(A(s,s.tvn,s.tvd,s.tvs),1)+'</td></tr>'
   +'<tr class="dgh"><td colspan="3">General</td></tr>'+row('Fitment yield f<sub>sy.f</sub> (MPa)','fsyf')+row('Clear cover &mdash; Super-T sides / soffit (mm)','cs')+row('Clear cover &mdash; deck top (mm)','ct')+row('Max. aggregate size d<sub>g</sub> (mm) &mdash; only if A<sub>sv</sub> &lt; A<sub>sv,min</sub>','dg')
   +'<tr><td class="l">Tag</td><td class="v">'+tg(o,['svd','svn','svs','tvd','tvn','tvs','fsyf','cs','ct'])+'</td><td class="v">'+tg(s,['svd','svn','svs','tvd','tvn','tvs','fsyf','cs','ct'])+'</td></tr>'
   +'<tr><td class="l">Vertical component of prestress P<sub>v</sub></td><td class="v" colspan="2">0 '+DGTAG.C+' straight strands</td></tr></table></div>';
  if(Q){ var D=Q.tD+Q.P.D, Go=dgGeo({P:Q.P,info:{H:Q.P.D,tD:Q.tD},solid:false},D), Gs=dgGeo({P:Q.P,info:{H:Q.P.D,tD:Q.tD},solid:true},D);
    var r=function(a,b,c,vo,vs,e){ return '<tr><td class="l sym">'+a+'</td><td class="l">'+b+'</td><td class="l fx">'+c+'</td><td class="v">'+vo+'</td><td class="v">'+vs+'</td><td class="l">'+e+'</td></tr>'; };
    var v=function(G,k,d){ return G[k]!==undefined&&G[k]!==null?dgF(G[k],d)+' '+DGTAG.C:DGTAG.M; };
    h+='<div class="dgx"><table class="dt dgt"><tr><th class="l">Symbol</th><th class="l">Shear / torsion geometry</th><th class="l fx">Basis</th><th>Open (span)</th><th>Solid end block</th><th class="l">Unit</th></tr>'
     +r('b<sub>v</sub>','Effective web width','open: 2 &times; min(tw<sub>T</sub>, tw<sub>B</sub>); solid: width at the top of the soffit chamfer',v(Go,'bv',1),v(Gs,'bv',1),'mm')
     +r('A<sub>cp</sub>','Area inside the outside perimeter','trapezoid between the outer web faces, soffit to deck top',v(Go,'Acp',0),v(Gs,'Acp',0),'mm&sup2;')
     +r('u<sub>c</sub>','Outside perimeter','',v(Go,'uc',1),v(Gs,'uc',1),'mm')
     +r('A<sub>o</sub>','Area inside the shear-flow path','open: wall mid-lines (webs, t<sub>b</sub>/2, deck mid-depth); solid: 0.85 A<sub>oh</sub> '+DGTAG.S,v(Go,'Ao',0),v(Gs,'Ao',0),'mm&sup2;')
     +r('A<sub>oh</sub>','Area inside the closed-tie centreline','outer faces inset by cover + d/2',v(Go,'Aoh',0),v(Gs,'Aoh',0),'mm&sup2;')
     +r('u<sub>h</sub>','Closed-tie perimeter','',v(Go,'uh',1),v(Gs,'uh',1),'mm')
     +r('y<sub>1</sub>','Larger dimension of the closed tie','',v(Go,'y1',0),v(Gs,'y1',0),'mm')+'</table></div>'; }
  h+='</div>';
  $('dg_det').innerHTML=h;
  document.querySelectorAll('#dg_det .dgd').forEach(function(el){ el.onchange=function(){ var d=el.getAttribute('data-set')==='s'?DG.detS:DG.det, v=el.value.trim(); d[el.getAttribute('data-k')]=v===''?null:+v; d.ex=false; DG.res=null; dgAll(); dgAutoRun(); }; });
  var EX={svd:20,svn:2,svs:150,tvd:20,tvn:1,tvs:150,cs:50,ct:40,dg:14,fsyf:500,ex:true}, CLR={svd:null,svn:null,svs:null,tvd:null,tvn:null,tvs:null,cs:null,ct:null,dg:null,fsyf:null,ex:false};
  $('dg_ex').onclick=function(){ Object.assign(DG.det,EX); Object.assign(DG.detS,EX); DG.res=null; dgAll(); dgAutoRun(); };
  $('dg_cp').onclick=function(){ Object.assign(DG.detS,JSON.parse(JSON.stringify(DG.det))); DG.res=null; dgAll(); dgAutoRun(); };
  $('dg_exc').onclick=function(){ Object.assign(DG.det,CLR); Object.assign(DG.detS,CLR); DG.res=null; dgAll(); dgAutoRun(); };
}
/* ======================= v20: section diagrams (ULS, SLS stages, crack control, M–κ, transfer) ======================= */
function dgCap(title,body,note){ return '<div class="dgcap" data-cap="'+title.replace(/<[^>]+>/g,'').replace(/"/g,'')+'"><div class="dgcapt">'+title+'</div>'+body+(note?'<div class="bbnote">'+note+'</div>':'')+'</div>'; }
/* ULS: section with neutral axis and stress block | strain | stress | force resultants, one depth scale */
function dgULSDiag(o,lc){
  if(!o||!o.Su||!o.dn) return '';
  var X=o.X, I=X.info, D=I.tD+I.H, P=dgUltParts(o.Su,o.dn,o.face,o.yc), top=o.face==='top', zOf=function(y){ return top?y:D-y; };
  var Wp=170, H=330, pad=26, sc=(H-2*pad)/D, Y=function(y){ return pad+y*sc; }, g='', cx0=10+Wp/2;
  var Wd=I.Wd, sx=(Wp-14)/Math.max(Wd,X.P.Bt), Pg=X.Pg;
  /* panel 1: section */
  g+='<rect x="'+(cx0-Wd/2*sx)+'" y="'+Y(0)+'" width="'+(Wd*sx)+'" height="'+(I.tD*sc)+'" fill="var(--dgdeck,rgba(125,135,150,.34))" stroke="var(--fg)" stroke-width=".7"/>';
  g+='<path d="M'+Pg.map(function(p){ return (cx0+p[0]*sx).toFixed(1)+','+Y(I.tD+I.H-p[1]).toFixed(1); }).join('L')+'Z" fill="rgba(125,135,150,.20)" stroke="var(--fg)" stroke-width=".7"/>';
  var blk=P.blk, yb1=top?0:D-blk, yb2=top?blk:D;
  g+='<rect x="10" y="'+Y(yb1)+'" width="'+Wp+'" height="'+((yb2-yb1)*sc)+'" fill="var(--flag)" opacity=".18"/>';
  var yNA=top?o.dn:D-o.dn; g+='<line x1="6" x2="'+(Wp+14)+'" y1="'+Y(yNA)+'" y2="'+Y(yNA)+'" stroke="var(--flag)" stroke-width="1.2" stroke-dasharray="5 3"/><text x="'+(Wp+12)+'" y="'+(Y(yNA)-3)+'" font-size="9.5" text-anchor="end" fill="var(--flag)">N.A. d<tspan font-size="75%" dy="2">n</tspan><tspan dy="-2"> = '+dgF(o.dn,0)+'</tspan></text>';
  X.S.tend.forEach(function(t){ g+='<circle cx="'+(cx0+t.x*sx)+'" cy="'+Y(t.y)+'" r="1.7" fill="var(--instr)"/>'; });
  /* panel 2: strain (εcu at the compression face, linear) */
  var x2=Wp+40, W2=150, ecu=0.003, eBot=-ecu*(o.dn-D)/o.dn, emax=Math.max(ecu,Math.abs(eBot)), ex=function(e){ return x2+W2/2+e/emax*(W2/2-8); };
  g+='<line x1="'+ex(0)+'" x2="'+ex(0)+'" y1="'+Y(0)+'" y2="'+Y(D)+'" stroke="var(--fg)" stroke-width=".7"/>';
  var eTop=top?-ecu:-ecu*(o.dn-D)/o.dn, eBt=top?eBot:-ecu;
  g+='<path d="M'+ex(0)+','+Y(0)+' L'+ex(eTop)+','+Y(0)+' L'+ex(eBt)+','+Y(D)+' L'+ex(0)+','+Y(D)+'Z" fill="var(--instr)" opacity=".15" stroke="var(--instr)" stroke-width="1.2"/>';
  g+='<text x="'+ex(eTop)+'" y="'+(Y(0)-6)+'" font-size="9.5" text-anchor="middle" fill="var(--fg)">'+(eTop*1000).toFixed(2)+'‰</text><text x="'+ex(eBt)+'" y="'+(Y(D)+13)+'" font-size="9.5" text-anchor="middle" fill="var(--fg)">'+(eBt*1000).toFixed(2)+'‰</text>';
  o.Su.tend.forEach(function(t){ var e=-ecu*(o.dn-zOf(t.y))/o.dn; g+='<circle cx="'+ex(e)+'" cy="'+Y(t.y)+'" r="1.6" fill="var(--instr)"/>'; });
  /* panel 3: stress (concrete block, bars, strands) */
  var x3=x2+W2+30, W3=170, smax=Math.max(1,Math.max.apply(null,[P.spMax].concat(o.Su.bars.map(function(b){ return b.fsy; })))), fc=DSG.a2(top?I.fcd:I.fcg)*(top?I.fcd:I.fcg);
  var sxs=function(s){ return x3+W3*0.42+s/smax*(W3*0.55); };
  g+='<line x1="'+sxs(0)+'" x2="'+sxs(0)+'" y1="'+Y(0)+'" y2="'+Y(D)+'" stroke="var(--fg)" stroke-width=".7"/>';
  var cw=Math.max(14,fc/smax*W3*0.55*6); g+='<rect x="'+(sxs(0)-cw)+'" y="'+Y(yb1)+'" width="'+cw+'" height="'+((yb2-yb1)*sc)+'" fill="var(--flag)" opacity=".35"/><text x="'+(sxs(0)-cw-3)+'" y="'+(Y((yb1+yb2)/2)+3)+'" font-size="9.5" text-anchor="end" fill="var(--fg)">&alpha;<tspan font-size="75%" dy="2">2</tspan><tspan dy="-2">f\'c = '+dgF(fc,1)+'</tspan></text>';
  var tb={}; o.Su.tend.forEach(function(t){ var e=-ecu*(o.dn-zOf(t.y))/o.dn+t.epe, s=DSG.fp(t,e), k=Math.round(t.y); (tb[k]=tb[k]||{y:t.y,s:s,n:0}).n++; });
  Object.keys(tb).forEach(function(k){ var q=tb[k]; g+='<line x1="'+sxs(0)+'" x2="'+sxs(q.s)+'" y1="'+Y(q.y)+'" y2="'+Y(q.y)+'" stroke="var(--instr)" stroke-width="2"/>'; });
  var ks=Object.keys(tb).map(function(k){ return tb[k]; }).sort(function(a,b){ return b.y-a.y; })[0]; if(ks) g+='<text x="'+(sxs(ks.s)-2)+'" y="'+(Y(ks.y)+12)+'" font-size="9.5" text-anchor="end" fill="var(--instr)">&sigma;<tspan font-size="75%" dy="2">p</tspan><tspan dy="-2"> '+dgF(P.spMin,0)+'&ndash;'+dgF(P.spMax,0)+'</tspan></text>';
  o.Su.bars.forEach(function(b){ var e=-ecu*(o.dn-zOf(b.y))/o.dn, s=Math.max(-b.fsy,Math.min(b.fsy,b.E*e)); g+='<line x1="'+sxs(0)+'" x2="'+sxs(s)+'" y1="'+Y(b.y)+'" y2="'+Y(b.y)+'" stroke="var(--eng)" stroke-width="1.6"/>'; });
  /* panel 4: forces and lever arm */
  var x4=x3+W3+40, W4=150, yC=o.yc+P.Cm*1e3/P.C, Tt=P.Tb+P.Tp, yT=Tt?o.yc+(P.Tbm+P.Tpm)*1e3/Tt:o.yc, arr=function(y,dir,col,lab){ var xa=x4+20, xb=x4+W4-20; return '<line x1="'+(dir>0?xa:xb)+'" x2="'+(dir>0?xb:xa)+'" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="'+col+'" stroke-width="2.2" marker-end="url(#dgar)"/><text x="'+((xa+xb)/2)+'" y="'+(Y(y)-5)+'" font-size="10" text-anchor="middle" fill="'+col+'" font-weight="600">'+lab+'</text>'; };
  g+='<defs><marker id="dgar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="context-stroke"/></marker></defs>';
  g+=arr(yC,-1,'var(--flag)','C = '+dgF(-P.C,0)+' kN')+arr(yT,1,'var(--instr)','T = '+dgF(Tt,0)+' kN');
  g+='<line x1="'+(x4+W4-8)+'" x2="'+(x4+W4-8)+'" y1="'+Y(yC)+'" y2="'+Y(yT)+'" stroke="var(--fg)" stroke-width=".8"/><text transform="translate('+(x4+W4-1)+' '+((Y(yC)+Y(yT))/2)+') rotate(90)" font-size="9.5" text-anchor="middle" fill="var(--fg)">z = '+dgF(Math.abs(yT-yC),0)+' mm</text>';
  g+='<line x1="'+(x4+10)+'" x2="'+(x4+W4-30)+'" y1="'+Y(o.yc)+'" y2="'+Y(o.yc)+'" stroke="var(--muted)" stroke-dasharray="3 3" stroke-width=".7"/><text x="'+(x4+10)+'" y="'+(Y(o.yc)+11)+'" font-size="9" fill="var(--muted)">y<tspan font-size="75%" dy="2">c</tspan></text>';
  ['Section','Strain','Stress (MPa)','Forces'].forEach(function(t,i){ g+='<text x="'+[cx0,x2+W2/2,x3+W3/2,x4+W4/2][i]+'" y="12" font-size="10.5" font-weight="600" text-anchor="middle" fill="var(--fg)">'+t+'</text>'; });
  var Wt=x4+W4+6;
  return dgCap('ULS section analysis &mdash; '+lc.name+' ('+(o.face==='top'?'sagging':'hogging')+', '+(o.solid?'solid end block':'open section')+')','<svg viewBox="0 0 '+Wt+' '+H+'" class="dgdiag">'+g+'</svg>',
    'Strain compatibility at &epsilon;<sub>cu</sub> = 0.003 on the compression face; rectangular stress block &gamma;d<sub>n</sub> = '+dgF(P.blk,0)+' mm. C = '+dgF(-P.C,0)+' kN (concrete), T<sub>bars</sub> = '+dgF(P.Tb,0)+' kN, T<sub>strands</sub> = '+dgF(P.Tp,0)+' kN; M<sub>u</sub> = '+dgF(o.Mu,0)+' kN&middot;m, &phi;M<sub>u</sub> = '+dgF(o.phiMu,0)+' kN&middot;m. Strand stresses include the prestrain &epsilon;<sub>pe</sub> (dots in the strain panel show the concrete strain at each strand).');
}
/* SLS: stage 1, composite increment and total stress profiles */
function dgSLSDiag(o,lc){
  if(!o||!o.sv) return '';
  var X=o.X, I=X.info, B=o.B, tD=I.tD, Ht=tD+I.H, s2=o.sv.s, e2=function(y){ return s2.e0+s2.k*y; }, p=function(ser,xl){ return dgPlot({w:300,h:270,xl:xl,yl:'Depth (mm)',series:ser,pts:[]}); };
  var lim=[{p:[[B.fct25,-tD],[B.fct25,-Ht]],c:'var(--flag)',dash:'2 3',wd:1,lab:'0.25&radic;f\'c'}];
  var st1=[{p:[[o.g1top,-tD],[o.g1bot,-Ht]],c:'var(--instr)',lab:'Super-T'}];
  var st2=[{p:[[I.Ed*e2(0),0],[I.Ed*e2(tD),-tD]],c:'var(--calc)',lab:'deck'},{p:[[I.Eg*e2(tD),-tD],[I.Eg*e2(Ht),-Ht]],c:'var(--instr)',lab:'Super-T'}];
  var st3=[{p:[[I.Ed*e2(0),0],[I.Ed*e2(tD),-tD]],c:'var(--calc)',lab:'deck'},{p:[[o.sv.girTop,-tD],[o.sv.girBot,-Ht]],c:'var(--instr)',lab:'Super-T'}].concat(lim);
  return dgCap('SLS stresses by stage &mdash; '+lc.name,'<div class="dg3">'+[['1. Super-T alone: prestress + M<sub>nc</sub> = '+dgF(lc.Mnc,0)+' kN&middot;m',p(st1,'&sigma; stage 1 (MPa)')],['2. Composite increment: M<sub>s</sub>* = '+dgF(lc.Ms,0)+' kN&middot;m',p(st2,'&Delta;&sigma; (MPa)')],['3. Total at M<sub>s</sub>* (uncracked)',p(st3,'&sigma; total (MPa)')]].map(function(q){ return '<div><div class="dgcapt2">'+q[0]+'</div>'+q[1]+'</div>'; }).join('')+'</div>',
    'Compression negative. Stage 1 is locked into the Super-T before the deck is composite; the composite increment acts on the transformed composite section; the total adds them. Soffit total '+dgF(o.sv.girBot,2)+' MPa '+(o.uncr?'&le;':'&gt;')+' 0.25&radic;f\'c = '+dgF(B.fct25,2)+' MPa.');
}
/* crack control: steel stress increment above decompression vs composite moment */
function dgCrackDiag(o,lc){
  if(!o||!o.incr) return '';
  var M0=Math.min(o.Mdec,lc.Ms)-0.05*Math.abs(o.Mal), M1=Math.max(o.Mal*1.25,lc.Ms*1.1,o.Mdec*1.1), n=26, b=[], t=[];
  for(var i=0;i<=n;i++){ var M=M0+(M1-M0)*i/n, q=M>o.Mdec?o.incr(M):{b:0,t:0}; b.push([M,Math.max(0,q.b)]); t.push([M,Math.max(0,q.t)]); }
  var top=Math.max(lc.fscr,lc.ftcr)*1.6;
  var body=dgPlot({w:560,h:320,xl:'Composite SLS moment M<tspan baseline-shift="sub">s</tspan> (kN·m)',yl:'Stress increment above decompression (MPa)',
    series:[{p:b,c:'var(--eng)',lab:'&Delta;&sigma;<tspan baseline-shift="sub">s</tspan> deepest tension bar'},{p:t,c:'var(--instr)',lab:'&Delta;&sigma;<tspan baseline-shift="sub">p</tspan> deepest strand'},
      {p:[[M0,lc.fscr],[M1,lc.fscr]],c:'var(--eng)',dash:'5 3',wd:1,lab:'f<tspan baseline-shift="sub">scr</tspan> = '+lc.fscr},{p:[[M0,lc.ftcr],[M1,lc.ftcr]],c:'var(--instr)',dash:'2 3',wd:1,lab:'f<tspan baseline-shift="sub">tcr</tspan> = '+lc.ftcr},
      {p:[[o.Mal,0],[o.Mal,top]],c:'var(--calc)',dash:'4 3',wd:1,lab:'M<tspan baseline-shift="sub">s,allow</tspan> = '+dgF(o.Mal,0)},{p:[[o.Mdec,0],[o.Mdec,top*0.6]],c:'var(--muted)',dash:'4 3',wd:1,lab:'M<tspan baseline-shift="sub">dec</tspan> = '+dgF(o.Mdec,0)}],
    pts:[{x:lc.Ms,y:Math.max(0,o.inc.b>-1e8?o.inc.b:0),lab:'M<tspan baseline-shift="sub">s</tspan>* = '+dgF(lc.Ms,0)}]});
  return dgCap('Crack control (Cl 8.6.2) &mdash; '+lc.name,body,'Each curve is a cracked-section analysis (no concrete tension) at that composite moment; increments are measured from the decompression state. M<sub>s,allow</sub> is where the first curve reaches its target. The point is the applied M<sub>s</sub>*.');
}
/* moment–curvature over the service range (cracked elastic), with the ultimate point */
function dgMKDiag(o,lc){
  if(!o||!o.atf) return '';
  var Mmax=Math.max(o.Mal*1.3,lc.Ms*1.2), n=30, c=[], un=[];
  for(var i=0;i<=n;i++){ var M=-lc.Mnc+(Mmax+lc.Mnc)*i/n, q=o.atf(M,true), u=o.atf(M,false); c.push([(q.s.k+o.sg.k)*1e6,lc.Mnc+M]); un.push([(u.s.k+o.sg.k)*1e6,lc.Mnc+M]); }
  var ku=o.face==='top'?0.003/o.dn:-0.003/o.dn;
  var body=dgPlot({w:560,h:320,xl:'Curvature &kappa; (&times;10<tspan baseline-shift="super">-6</tspan> /mm, sagging +)',yl:'Total moment M<tspan baseline-shift="sub">nc</tspan> + M (kN·m)',
    series:[{p:un,c:'var(--muted)',dash:'5 3',wd:1.2,lab:'uncracked'},{p:c,c:'var(--instr)',lab:'cracked elastic (no concrete tension)'}],
    pts:[{x:(o.sc.s.k+o.sg.k)*1e6,y:lc.Mnc+lc.Ms,lab:'M<tspan baseline-shift="sub">s</tspan>*',c:'var(--flag)'},{x:ku*1e6,y:o.Mu,lab:'ultimate (&epsilon;<tspan baseline-shift="sub">cu</tspan>)',c:'var(--calc)'}]});
  return dgCap('Moment&ndash;curvature &mdash; '+lc.name,body,'Service range from the staged elastic section (Super-T stage locked in). The ultimate point uses &kappa;<sub>u</sub> = &epsilon;<sub>cu</sub>/d<sub>n</sub> and M<sub>u</sub>; the path between the service range and ultimate needs a non-linear concrete law and is not drawn.');
}
/* transfer: Super-T alone at release, prestress at transfer (Hog tab) + self weight on the girder length */
DG.trLim={c:null,t:null};
function dgTransfer(o,lc){
  var G=dgGirdPar(); if(!G.Lg) return {why:'girder length unknown (fill load cases first)'}; if(lc.s===null||lc.s===undefined) return {why:'station needed'};
  var t=dgTrAt(o.X,lc.s,G); t.label='jacking − relaxation, then elastic shortening'; return t;
}
function dgTransferBlock(){
  var R=DG.res; if(!R) return ''; var L=DG.lc, T=R.lc.map(function(o,i){ var t=dgTransfer(o,L[i]); o.tr=t; return t; }), lim=DG.trLim;
  var v=function(f){ return T.map(function(t,i){ return t.why?'<span class="bbflag">'+t.why+'</span>':f(t,R.lc[i],L[i]); }); };
  var limC=lim.c>0?-lim.c:null, limT=lim.t!==null&&lim.t!==''?+lim.t:null;
  var okc=function(t){ return limC===null?'<span class="bbflag">limit missing</span>':dgOK(Math.min(t.top,t.bot)>=limC); }, okt=function(t){ return limT===null?'<span class="bbflag">limit missing</span>':dgOK(Math.max(t.top,t.bot)<=limT); };
  var rows=[['h','Transfer &mdash; Super-T alone at release (strands cut), self weight on the girder length'],
    ['o','P<sub>i</sub>','Prestress force at transfer (after elastic shortening)','&Sigma; f<sub>t</sub>&middot;P<sub>0</sub> &minus; ES; P<sub>0</sub> = j&middot;MBL&middot;(1 &minus; rel), f<sub>t</sub> = transmission / debond factor (Hog tab inputs)',v(function(t){ return dgF(t.P0,0); }),'kN',''],
    ['o','&sigma;<sub>p,i</sub>','Mean strand stress at transfer','after elastic shortening (Hog tab)',v(function(t){ return dgF(t.sp0,0); }),'MPa',''],
    ['o','w','Super-T self weight at the station','A<sub>g</sub>&middot;&gamma;, &gamma; = '+((T[0]&&T[0].rho)||'—')+' kN/m&sup3; (Hog tab unit weight)',v(function(t){ return dgF(t.w,2); }),'kN/m',''],
    ['o','M<sub>sw,i</sub>','Self-weight moment at transfer','girder on supports at a<sub>t</sub> from each end (Hog tab), weight varying along the girder (solid end blocks)',v(function(t){ return dgF(t.Msw,0); }),'kN&middot;m',''],
    ['o','E<sub>c,i</sub> / f\'<sub>cp</sub>','Concrete modulus / strength at transfer','Hog tab',v(function(t){ return t.Ect+' / '+t.fci; }),'MPa',''],
    ['o','&sigma;<sub>i,top</sub>','Super-T top fibre stress at transfer (compression &minus;)','strain compatibility, Super-T alone',v(function(t){ return dgF(t.top,2); }),'MPa',''],
    ['o','&sigma;<sub>i,bot</sub>','Super-T soffit stress at transfer','',v(function(t){ return dgF(t.bot,2); }),'MPa',''],
    ['c','Compression','min &sigma; &ge; &minus;limit','limit = '+(limC===null?'<span class="bbflag">enter</span>':dgF(-limC,2)+' MPa'),v(function(t){ return okc(t); }),'',''],
    ['c','Tension','max &sigma; &le; limit','limit = '+(limT===null?'<span class="bbflag">enter</span>':dgF(limT,2)+' MPa'),v(function(t){ return okt(t); }),'','']];
  var o=R.lc[DG.sel], t=T[DG.sel], plot='';
  if(t&&!t.why){ o.tr=t; plot=dgTrPlot(o,DG.lc[DG.sel]); }
  return '<div class="dgtrlim msbar"><b>Transfer stress limits</b><label>Compression limit (MPa, magnitude) <input class="f" id="dg_trc" value="'+(lim.c===null?'':lim.c)+'" style="width:64px"></label><label>Tension limit (MPa) <input class="f" id="dg_trt" value="'+(lim.t===null?'':lim.t)+'" style="width:64px"></label><span>'+(limC===null||limT===null?DGTAG.M+' enter from AS 5100.5 for f\'<sub>cp</sub> = '+((T[0]&&T[0].fci)||'—')+' MPa':DGTAG.U)+'</span></div>'+dgTab(rows,dgHeads())+plot
    +'<div class="bbnote">Same model as step 7 (along the girder): strand force ramps over the transmission length from each debond point; elastic shortening follows from strain compatibility with the strands as bonded steel.</div>';
}
/* ======================= v21: along-the-girder analysis (debonding, transmission / development, transfer, SLS, ULS) ======================= */
function dgGirdPar(){
  var Q=DG.sec, g=Q.gird||(Q.gird={Lg:null,a:null,asup:null,Lpt:null,Ld:null,scl:null,src:{}}), s=dgSnap(), p=s.p, ch=(typeof CS!=='undefined'&&CS.chains)?CS.chains[DG.gi]:null, sb=null;
  try{ sb=ch&&typeof ANS!=='undefined'&&ANS.res?dgBearingS(ch):null; }catch(e){}
  return {Lg:g.Lg!==null?g.Lg:(ch?ch.Ltot:null), a:g.a!==null?g.a:(sb?sb[0]:null), a2:g.a!==null?g.a:(sb&&ch?ch.Ltot-sb[1]:null), asup:g.asup!==null?g.asup:(isFinite(p.asup)?p.asup/1000:(g.a!==null?g.a:(sb?sb[0]:p.a/1000))),
    Lpt:g.Lpt!==null&&g.Lpt>0?g.Lpt:p.lt*p.db, Ld:g.Ld, scl:g.scl, P0:p.ji*p.mbl*(1-p.rel), rho:p.rho, Ect:p.Ect, fci:p.fci, hogL:p.L/1000, hogA:p.a/1000, dbT:p.dbT, dbR:p.dbR, lt:p.lt, db:p.db,
    srcL:g.Lg!==null?'U':(ch?'C':'M'), srcA:g.a!==null?'U':(sb?'C':'M')};
}
/* transmission / debond factor of a strand at station x (m) */
function dgFt(t,x,G){ var L=G.Lpt, a=x*1000-(t.dL||0), b=(G.Lg-x)*1000-(t.dR||0); return Math.min(Math.max(a,0),L)/L*Math.min(Math.max(b,0),L)/L; }
function dgBondDist(t,x,G){ return Math.min(x*1000-(t.dL||0),(G.Lg-x)*1000-(t.dR||0)); }
/* self-weight moment at transfer: supports at asup from each end, weight per length varies (solid end blocks) */
function dgMswT(x,G,wOf){ var Lg=G.Lg, sa=G.asup, n=400, h=Lg/n, W=0, Mw=0, xs=[], ws=[];
  for(var i=0;i<n;i++){ var xi=(i+0.5)*h, w=wOf(xi); xs.push(xi); ws.push(w); W+=w*h; Mw+=w*h*xi; }
  var R1=(W*(Lg-sa)-Mw)/(Lg-2*sa), M=0; if(x>sa) M+=R1*(x-sa); if(x>Lg-sa) M+=(W-R1)*(x-(Lg-sa));
  for(var k=0;k<n;k++){ if(xs[k]<x) M-=ws[k]*h*(x-xs[k]); } return M; }
function dgSolidAt(x,G){ var L=DG.sec.solidLen; return L>0&&Math.min(x,G.Lg-x)*1000<=L; }
function dgWOf(G){ var Ao=dgPolyProps(dgPoly(DG.sec.R)).A, As=dgPolyProps(dgPoly(DG.sec.Rs)).A; return function(x){ return (dgSolidAt(x,G)?As:Ao)/1e6*G.rho; }; }
/* transfer at a station: Super-T alone, strands with prestrain P0·f/(A·Ep), bonded steel => elastic shortening from compatibility */
function dgTrAt(X,x,G){
  var Q=DG.sec, I=X.info, H=I.H, tD=I.tD, on=Q.strands.filter(function(t){ return t.on; }), s0=G.P0*1000/Q.Ap;
  var tend=[]; on.forEach(function(t){ var f=dgFt(t,x,G); if(f>0) tend.push({y:tD+H-t.y, A:Q.Ap, E:Q.Ep, pre:f*s0/Q.Ep, f:f}); });
  var conc=X.S.conc.filter(function(c){ return c.grp==='g'; }).map(function(c){ return Object.assign({},c,{E:G.Ect,e0:0}); }), bars=X.S.bars.filter(function(b){ return b.grp==='g'; });
  var Sg={conc:conc,bars:bars,tend:tend}, wOf=dgWOf(G), Msw=dgMswT(x,G,wOf), yr=DSG.elastic(Sg,G.Ect).yc, sg=DSG.solveSLS(Sg,0,Msw*1e6,yr,false), st=function(y){ return G.Ect*(sg.e0+sg.k*y); };
  var P=tend.reduce(function(a,t){ return a+t.A*t.E*(sg.e0+sg.k*t.y+t.pre); },0)/1e3;
  return {top:st(tD), bot:st(tD+H), sg:sg, Msw:Msw, w:wOf(x), Lg:G.Lg, x:x, P0:P, sp0:tend.length?P*1e3/(tend.length*Q.Ap):0, fci:G.fci, Ect:G.Ect, rho:G.rho, H:H, tD:tD, nb:tend.length};
}
/* station section: strands scaled by the transmission factor; ULS strand stress capped over the development length */
function dgStationX(Xb,x,G){
  var Q=DG.sec, on=Q.strands.filter(function(t){ return t.on; }), X={S:{conc:Xb.S.conc, bars:Xb.S.bars, tend:[]}, info:Xb.info, Pg:Xb.Pg, R:Xb.R, P:Xb.P, solid:Xb.solid};
  var hs=typeof dgHogSp==='function'?dgHogSp(x,G):null;   /* strand stress after losses at this station from the Hog time analysis (per strand), else midspan value × transmission factor */
  Xb.S.tend.forEach(function(t,i){ var q=on[i], f=dgFt(q,x,G); if(f<=0) return; var d=dgBondDist(q,x,G), fpb=t.fpb, sp=hs&&hs[i]!=null?hs[i]:t.sp*f;
    if(G.Ld>G.Lpt&&d<G.Ld) fpb=Math.min(t.fpb, t.sp*Math.min(1,d/G.Lpt)+(d>G.Lpt?(t.fpb-t.sp)*(d-G.Lpt)/(G.Ld-G.Lpt):0));
    else if(d<G.Lpt) fpb=Math.min(t.fpb, sp);   /* inside the transmission length the bond has transferred only the effective prestress */
    X.S.tend.push(Object.assign({},t,{sp:sp, fpb:Math.max(fpb,1), f:f})); });
  return X;
}
function dgGirdStations(G){
  var Q=DG.sec, set={}, add=function(v){ if(v>=0&&v<=G.Lg) set[v.toFixed(3)]=v; }, n=40;
  for(var i=0;i<=n;i++) add(G.Lg*i/n);
  [G.a,G.Lg-G.a2,G.asup,G.Lg-G.asup].forEach(function(v){ if(v!==null) add(v); });
  var Lp=G.Lpt/1000; Q.strands.forEach(function(t){ if(!t.on) return; add(t.dL/1000); add(t.dL/1000+Lp); add(G.Lg-t.dR/1000); add(G.Lg-t.dR/1000-Lp); });
  if(Q.solidLen>0){ add(Q.solidLen/1000); add(G.Lg-Q.solidLen/1000); }
  if(G.a!==null){ var dv=0.72*(Q.tD+Q.P.D)/1000; add(G.a+dv); add(G.Lg-G.a2-dv); }
  return Object.keys(set).map(function(k){ return set[k]; }).sort(function(a,b){ return a-b; });
}
function dgGirdRun(){
  DG.girdBusy=true; DG.girdVer=DG.ver;
  var st=$('dg_gst'); if(!(typeof CS!=='undefined'&&CS.res&&CT.out&&TR.env)){ st.textContent='Fill the load cases from the model first (toolbar).'; DG.girdBusy=false; return; }
  DG.dz=6; var G=dgGirdPar(), Xo=dgSection(false), Xs=dgSection(true); DG.dz=3; var xs=dgGirdStations(G), out=[], k=0, t0=Date.now(), lc0=DG.lc[0];
  if(Xo.S.tend.some(function(t){ return !t.sp; })){ st.textContent='Prestress after losses is missing.'; DG.girdBusy=false; return; }
  function step(){
    var end=Math.min(xs.length,k+3); DG.nb=40;
    for(;k<end;k++){ var x=xs[k], sol=dgSolidAt(x,G), Xb=sol?Xs:Xo, X=dgStationX(Xb,x,G), B=dgBase(X), r={x:x, solid:sol};
      r.tr=dgTrAt(Xb,x,G); r.P=X.S.tend.reduce(function(a,t){ return a+t.sp*t.A; },0)/1e3; r.nb=X.S.tend.length;
      var lc={name:'x = '+x.toFixed(2),s:x,fscr:lc0.fscr,ftcr:lc0.ftcr,Ns:0,Nu:0,brk:dgActAt(DG.gi,x)}; dgTotals(lc); r.lc=lc; r.B=B;
      if(X.S.tend.length){ r.cb=dgCombBuild(lc,X,B,sol); var o=r.cb.b.o; r.o=o; r.lc=r.cb.b.lc;
        var up=DSG2.muAtN(o.Su,0,'top',o.yc), dn=DSG2.muAtN(o.Su,0,'bot',o.yc); r.phMs=up?DSG2.phiB(up.kuo)*up.M/1e6:null; r.phMh=dn?DSG2.phiB(dn.kuo)*dn.M/1e6:null; }
      out.push(r); }
    DG.nb=0; st=$('dg_gst')||st; st.textContent='Along the girder: '+k+' / '+xs.length+' stations…';
    if(k<xs.length) return setTimeout(step,0);
    DG.gird={G:G, st:out, secs:(Date.now()-t0)/1000, ver:DG.girdVer}; st=$('dg_gst')||st; st.textContent='Done: '+xs.length+' stations in '+DG.gird.secs.toFixed(1)+' s.'; dgGirdView(); dgChips(); if(typeof dgAnGirdDone==='function') dgAnGirdDone(); }
  st.textContent='Starting…'; setTimeout(step,0);
}
/* strand elevation: rows of strands along the girder, debonded lengths dashed, transmission zones shaded */
function dgGirdElev(G){
  var Q=DG.sec, H=Q.P.D, W=900, Hh=260, L=40, R=20, T=26, B=34, sx=(W-L-R)/G.Lg, sy=(Hh-T-B)/H, X=function(x){ return L+x*sx; }, Y=function(yu){ return Hh-B-yu*sy; }, g='';
  g+='<rect x="'+X(0)+'" y="'+Y(H)+'" width="'+(G.Lg*sx)+'" height="'+(H*sy)+'" fill="rgba(125,135,150,.16)" stroke="var(--fg)" stroke-width=".8"/>';
  dgZones().forEach(function(z){ g+='<rect x="'+X(z.a)+'" y="'+Y(H)+'" width="'+((z.b-z.a)*sx)+'" height="'+(H*sy)+'" fill="'+DG_ZCOL.solid+'" opacity=".6"/><text x="'+(X((z.a+z.b)/2))+'" y="'+(Y(H)-4)+'" font-size="9.5" text-anchor="middle" fill="var(--calc)">solid</text>'; });
  [G.a,G.Lg-G.a2].forEach(function(xb){ if(xb===null) return; g+='<path d="M'+X(xb)+','+Y(0)+' l-6,10 h12z" fill="var(--fg)"/>'; });
  if(G.asup!==null) [G.asup,G.Lg-G.asup].forEach(function(xs){ g+='<path d="M'+X(xs)+','+(Y(0)+12)+' l-5,9 h10z" fill="none" stroke="var(--muted)"/>'; });
  var rows=dgGroup(Q.strands.filter(function(t){ return t.on; }),function(t){ return dgF(t.y,1)+'|'+t.dL+'|'+t.dR; }), Lp=G.Lpt/1000, ys={};
  rows.forEach(function(r){ var t=r.items[0], yk=Math.round(t.y), off=(ys[yk]=(ys[yk]||0)+1)-1, y=Y(t.y)-off*3.2, a=t.dL/1000, b=G.Lg-t.dR/1000;
    var dc=(a>0||t.dR>0)&&window.HOG_DBCOL?HOG_DBCOL(t.dL,t.dR):'var(--muted)';
    if(a>0) g+='<line x1="'+X(0)+'" x2="'+X(a)+'" y1="'+y+'" y2="'+y+'" stroke="'+dc+'" stroke-width="2" stroke-dasharray="3 3"/>';
    if(t.dR>0) g+='<line x1="'+X(b)+'" x2="'+X(G.Lg)+'" y1="'+y+'" y2="'+y+'" stroke="'+dc+'" stroke-width="2" stroke-dasharray="3 3"/>';
    g+='<line x1="'+X(a)+'" x2="'+X(a+Lp)+'" y1="'+y+'" y2="'+y+'" stroke="var(--instr)" stroke-width="2" opacity=".45"/><line x1="'+X(b-Lp)+'" x2="'+X(b)+'" y1="'+y+'" y2="'+y+'" stroke="var(--instr)" stroke-width="2" opacity=".45"/>';
    g+='<line x1="'+X(a+Lp)+'" x2="'+X(b-Lp)+'" y1="'+y+'" y2="'+y+'" stroke="var(--instr)" stroke-width="2"/>';
    if(a>0||t.dR>0) g+='<text x="'+(X(a)+2)+'" y="'+(y-3)+'" font-size="8.5" fill="'+dc+'">'+r.items.length+'&times; debond '+t.dL+' / '+t.dR+'</text>'; });
  for(var m=0;m<=Math.floor(G.Lg);m+=5) g+='<line x1="'+X(m)+'" x2="'+X(m)+'" y1="'+(Hh-B+14)+'" y2="'+(Hh-B+18)+'" stroke="var(--muted)"/><text x="'+X(m)+'" y="'+(Hh-B+29)+'" font-size="9.5" text-anchor="middle" fill="var(--muted)">'+m+' m</text>';
  return '<svg viewBox="0 0 '+W+' '+Hh+'" class="dgdiag" style="max-width:none">'+g+'</svg><div class="dgleg"><span><i style="border-top:2px solid var(--instr)"></i>bonded, fully effective</span><span><i style="border-top:2px solid var(--instr);opacity:.45"></i>transmission length L<sub>pt</sub> = '+dgF(G.Lpt,0)+' mm</span><span><i style="border-top:1px dashed var(--muted)"></i>debonded</span><span>&#9650; bearings &nbsp;&#9651; supports at transfer</span></div>';
}
function dgGirdView(){
  var box=$('dg_gird'); if(!box) return; var G=dgGirdPar(), D=DG.gird, Q=DG.sec;
  var on=Q.strands.filter(function(t){ return t.on; }), nd=on.filter(function(t){ return t.dL>0||t.dR>0; }).length, rw={}; on.forEach(function(t){ var o=rw[t.y]=rw[t.y]||{n:0,d:0}; o.n++; if(t.dL>0||t.dR>0) o.d++; });
  var pt=on.length?100*nd/on.length:0, pr=Math.max.apply(null,[0].concat(Object.keys(rw).map(function(k){ return 100*rw[k].d/rw[k].n; })));
  var h='<div class="msbar"><button class="b" id="dg_grun">&#9654; Run along-girder analysis</button><span class="n" id="dg_gst">'+(D?'Done: '+D.st.length+' stations in '+D.secs.toFixed(1)+' s'+(D.G.Lg!==G.Lg?' — inputs changed, run again':''):'Not run yet.')+'</span></div>';
  h+='<div class="dg2b"><div><table class="dt dgt dgkv"><tr><th class="l">Girder</th><th>Value</th><th class="l">Source</th></tr>'
    +'<tr><td class="l">Girder length L<sub>g</sub></td><td class="v">'+dgF(G.Lg,3)+' m</td><td class="l">'+({U:DGTAG.U,C:DGTAG.C+' model girder chain',M:DGTAG.M}[G.srcL])+(G.Lg&&Math.abs(G.Lg-G.hogL)>0.05?' <span class="bbflag">Hog tab L = '+dgF(G.hogL,3)+' m</span>':'')+'</td></tr>'
    +'<tr><td class="l">Bearing from girder end</td><td class="v">'+dgF(G.a,3)+' / '+dgF(G.a2,3)+' m</td><td class="l">'+({U:DGTAG.U,C:DGTAG.C+' model bearings',M:DGTAG.M}[G.srcA])+'</td></tr>'
    +'<tr><td class="l">Supports at transfer a<sub>t</sub> (from each end)</td><td class="v">'+dgF(G.asup,3)+' m</td><td class="l">Hog tab support at transfer (bearing offset if blank)</td></tr>'
    +'<tr><td class="l">Transmission length L<sub>pt</sub></td><td class="v">'+dgF(G.Lpt,0)+' mm</td><td class="l">Hog tab: '+G.lt+' &times; d<sub>b</sub> '+G.db+'</td></tr>'
    +'<tr><td class="l">Development length L<sub>d</sub> (ULS strand stress cap)</td><td class="v">'+(G.Ld?dgF(G.Ld,0)+' mm':'—')+'</td><td class="l">'+(G.Ld?DGTAG.U:DGTAG.M+' set in step 1 &rarr; Debonding &amp; girder; until then strands are taken as fully developed beyond L<sub>pt</sub> (unconservative near the ends)')+'</td></tr>'
    +'<tr><td class="l">Strand force before transfer P<sub>0</sub></td><td class="v">'+dgF(G.P0,1)+' kN</td><td class="l">j&middot;MBL&middot;(1 &minus; relaxation), Hog tab</td></tr></table></div>'
    +'<div><table class="dt dgt dgkv"><tr><th class="l">Debonding layout</th><th>Value</th><th>Limit</th><th></th></tr>'
    +'<tr><td class="l">Debonded strands, total</td><td class="v">'+nd+' / '+on.length+' = '+dgF(pt,1)+' %</td><td class="v">'+G.dbT+' %</td><td>'+dgOK(pt<=G.dbT)+'</td></tr>'
    +'<tr><td class="l">Debonded strands, worst row</td><td class="v">'+dgF(pr,1)+' %</td><td class="v">'+G.dbR+' %</td><td>'+dgOK(pr<=G.dbR)+'</td></tr></table>'
    +'<div class="bbnote">Debonding limits are the Hog tab&rsquo;s project inputs (confirm against the road-authority specification). Edit the debond lengths in step 1 &rarr; Debonding &amp; girder.</div></div></div>';
  h+=dgCap('Strand layout along the girder',dgGirdElev(G),'Vertical scale exaggerated. Strands with the same height and debond lengths are drawn as one line.');
  if(D){ var S=D.st, xs=S.map(function(r){ return r.x; }), s=function(f){ return S.map(function(r){ var v=f(r); return [r.x,v===undefined||v===null||!isFinite(v)?NaN:v]; }); }, lim=DG.trLim, fct=S.find(function(r){ return r.o; });
    var B0=fct?fct.o:null, b25=fct?dgBase(dgSection(false)).fct25:0, L0=xs[0], L1=xs[xs.length-1], hl=function(v,c,lab,d){ return {p:[[L0,v],[L1,v]],c:c,dash:d||'4 3',wd:1,lab:lab}; };
    var P=dgPlot({w:880,h:280,xl:'Station along the girder (m)',yl:'Strand force (kN)',series:[{p:s(function(r){ return r.tr.P0; }),c:'var(--calc)',lab:'at transfer (after elastic shortening)'},{p:s(function(r){ return r.P; }),c:'var(--instr)',lab:'after losses ('+Q.time+')'}],pts:[]});
    var trS=[{p:s(function(r){ return r.tr.top; }),c:'var(--instr)',lab:'top fibre'},{p:s(function(r){ return r.tr.bot; }),c:'var(--calc)',lab:'soffit'}]; if(lim.c>0) trS.push(hl(-lim.c,'var(--flag)','compression limit')); if(lim.t!==null&&lim.t!=='') trS.push(hl(+lim.t,'var(--flag)','tension limit','2 3'));
    var svS=[{p:s(function(r){ return r.o&&r.o.sv.deckTop; }),c:'var(--muted)',lab:'deck top'},{p:s(function(r){ return r.o&&r.o.sv.girTop; }),c:'var(--instr)',lab:'Super-T top'},{p:s(function(r){ return r.o&&r.o.sv.girBot; }),c:'var(--calc)',lab:'Super-T soffit'},hl(b25,'var(--flag)','0.25&radic;f\'c','2 3')]; if(G.scl>0) svS.push(hl(-G.scl,'var(--flag)','compression limit'));
    var stS=[{p:s(function(r){ return r.o&&r.o.g1top; }),c:'var(--instr)',lab:'Super-T top'},{p:s(function(r){ return r.o&&r.o.g1bot; }),c:'var(--calc)',lab:'Super-T soffit'}];
    var Mp=dgPlot({w:880,h:300,xl:'Station along the girder (m)',yl:'Moment (kN·m)',series:[{p:s(function(r){ return r.lc.Mu; }),c:'var(--fg)',lab:'M*'},{p:s(function(r){ return r.phMs; }),c:'var(--instr)',lab:'&phi;M<tspan baseline-shift="sub">u</tspan> sagging'},{p:s(function(r){ return r.phMh; }),c:'var(--calc)',lab:'&phi;M<tspan baseline-shift="sub">u</tspan> hogging'},{p:s(function(r){ return r.lc.Mnc+r.lc.Ms; }),c:'var(--muted)',dash:'4 3',wd:1.2,lab:'M<tspan baseline-shift="sub">nc</tspan> + M<tspan baseline-shift="sub">s</tspan>* (SLS)'},{p:s(function(r){ return r.o&&r.lc.Mnc+r.o.Mal; }),c:'var(--eng)',dash:'6 3',wd:1.2,lab:'M<tspan baseline-shift="sub">nc</tspan> + M<tspan baseline-shift="sub">s,allow</tspan>'}],pts:[]});
    var Vp=dgPlot({w:880,h:300,xl:'Station along the girder (m)',yl:'Shear (kN) / torsion (kN·m)',series:[{p:s(function(r){ return r.lc.Vu; }),c:'var(--fg)',lab:'V*'},{p:s(function(r){ return r.o&&r.o.sh?0.7*(r.o.sh.Vuc+r.o.sh.Vus)/1e3:NaN; }),c:'var(--instr)',lab:'&phi;(V<tspan baseline-shift="sub">uc</tspan> + V<tspan baseline-shift="sub">us</tspan>)'},{p:s(function(r){ return r.o&&r.o.sh?0.7*r.o.sh.Vumax/1e3:NaN; }),c:'var(--flag)',dash:'5 3',wd:1.2,lab:'&phi;V<tspan baseline-shift="sub">u.max</tspan>'},{p:s(function(r){ return r.lc.Tu; }),c:'var(--muted)',lab:'T*'},{p:s(function(r){ return r.o&&r.o.sh?0.7*r.o.sh.Tus/1e6:NaN; }),c:'var(--calc)',dash:'5 3',wd:1.2,lab:'&phi;T<tspan baseline-shift="sub">us</tspan>'}],pts:[]});
    var U=[['SLS crack control',function(r){ return r.o?Math.max(0,r.o.uS):null; },'var(--eng)'],['ULS bending',function(r){ return r.o?r.o.uB:null; },'var(--fg)'],['web crushing',function(r){ return r.o&&r.o.sh?r.o.sh.uCr:null; },'var(--flag)'],['shear',function(r){ return r.o&&r.o.sh?r.o.sh.uV:null; },'var(--instr)'],['torsion',function(r){ return r.o&&r.o.sh?r.o.sh.uT:null; },'var(--muted)'],['longitudinal steel',function(r){ return r.o&&r.o.sh?r.o.sh.uL:null; },'var(--calc)']];
    var trU=function(r){ var u=[]; if(lim.c>0) u.push(-Math.min(r.tr.top,r.tr.bot)/lim.c); if(lim.t!==null&&lim.t!==''&&+lim.t>0) u.push(Math.max(r.tr.top,r.tr.bot)/(+lim.t)); return u.length?Math.max.apply(null,u):null; };
    U.unshift(['transfer stress',trU,'var(--std)']);
    var Up=dgPlot({w:880,h:300,xl:'Station along the girder (m)',yl:'Utilisation',series:U.map(function(q){ return {p:s(q[1]),c:q[2],lab:q[0]}; }).concat([hl(1,'var(--flag)','1.0','2 2')]),pts:[]});
    var crit=U.map(function(q){ var b={u:-1,r:null}; S.forEach(function(r){ var v=q[1](r); if(v!==null&&isFinite(v)&&v>b.u) b={u:v,r:r}; }); return [q[0],b]; });
    h+=dgCap('Strand force along the girder',P,'Force ramps up over L<sub>pt</sub> from each girder end or debond point. Transfer force from P<sub>0</sub> with elastic shortening; service force from the stress after losses at '+Q.time+' (Hog tab, mid-span values) scaled by the same factor.')
     +'<div class="dg2b">'+dgCap('Stresses at transfer (Super-T alone, self weight on a<sub>t</sub> supports)',dgPlot({w:440,h:290,xl:'Station (m)',yl:'Stress (MPa, compression &minus;)',series:trS,pts:[]}),(lim.c>0&&lim.t!==null&&lim.t!==''?'':'Transfer limits are Missing &mdash; Flagged (enter them in step 4a).'))
     +dgCap('Super-T stage (prestress after losses + M<sub>nc</sub>)',dgPlot({w:440,h:290,xl:'Station (m)',yl:'Stress (MPa)',series:stS,pts:[]}))+'</div>'
     +dgCap('Service stresses (composite, M<sub>s</sub>* from the model, uncracked)',dgPlot({w:880,h:300,xl:'Station along the girder (m)',yl:'Stress (MPa, compression &minus;)',series:svS,pts:[]}),G.scl>0?'':'Service compression limit not entered (step 1 &rarr; Debonding &amp; girder) &mdash; Missing, Flagged.')
     +dgCap('Bending along the girder',Mp,'M* and M<sub>s</sub>* come from the construction stages and the traffic envelope at each station (traffic enveloped per station, not concurrent). &phi;M<sub>u</sub> uses the strands bonded at the station'+(G.Ld?', capped over L<sub>d</sub>':'')+'.')
     +dgCap('Shear and torsion along the girder',Vp,S.some(function(r){ return r.o&&r.o.sh; })?'Capacities use the detailing of the open or solid section at each station.':'Shear capacities need the detailing in step 6.')
     +dgCap('Utilisation along the girder',Up,'')
     +'<div class="sdh" style="margin-top:12px">Critical sections</div><div class="dgx"><table class="dt dgt"><tr><th class="l">Check</th><th>Max. utilisation</th><th>Station (m)</th><th class="l">Section</th><th></th></tr>'
     +crit.map(function(c){ var b=c[1]; return '<tr><td class="l">'+c[0]+'</td><td class="v">'+(b.r?dgU(b.u):'<span class="bbflag">—</span>')+'</td><td class="v">'+(b.r?dgF(b.r.x,2):'')+'</td><td class="l">'+(b.r?(b.r.solid?'solid end':'open')+', '+b.r.nb+' strands bonded':'')+'</td><td>'+(b.r?dgOK(b.u<=1):'')+'</td></tr>'; }).join('')+'</table></div>';
  }
  box.innerHTML=h; $('dg_grun').onclick=dgGirdRun;
}
/* step 1 editor: debonding and girder inputs */
function dgDebHTML(){
  var Q=DG.sec, G=dgGirdPar(), g=Q.gird, inp=function(k,v,w){ return '<input class="f dgdb" data-k="'+k+'" value="'+(v===null||v===undefined?'':v)+'" style="width:'+(w||70)+'px">'; };
  var h='<div class="dged"><div><div class="sdh">Girder and strand transfer</div><table class="dt dgt dgkv"><tr><th class="l">Input</th><th>Value</th><th class="l">Default / source</th></tr>'
    +'<tr class="dgi"><td class="l">Girder length L<sub>g</sub> (m)</td><td class="v">'+inp('g:Lg',g.Lg)+'</td><td class="l">blank = model girder chain ('+dgF(G.Lg,3)+' m)</td></tr>'
    +'<tr class="dgi"><td class="l">Bearing from girder end (m)</td><td class="v">'+inp('g:a',g.a)+'</td><td class="l">blank = model bearings ('+dgF(G.a,3)+' m)</td></tr>'
    +'<tr class="dgi"><td class="l">Supports at transfer from each end a<sub>t</sub> (m)</td><td class="v">'+inp('g:asup',g.asup)+'</td><td class="l">blank = Hog tab support / bearing offset ('+dgF(G.asup,3)+' m)</td></tr>'
    +'<tr class="dgi"><td class="l">Transmission length L<sub>pt</sub> (mm)</td><td class="v">'+inp('g:Lpt',g.Lpt)+'</td><td class="l">Hog tab '+G.lt+' &times; '+G.db+' = '+dgF(G.lt*G.db,0)+' mm</td></tr>'
    +'<tr class="dgi"><td class="l">Development length L<sub>d</sub> (mm)</td><td class="v">'+inp('g:Ld',g.Ld)+'</td><td class="l">'+(g.Ld?DGTAG.U:DGTAG.M+' enter from AS 5100.5 for the strand used')+'</td></tr>'
    +'<tr class="dgi"><td class="l">Service compression stress limit (MPa, magnitude)</td><td class="v">'+inp('g:scl',g.scl)+'</td><td class="l">'+(g.scl?DGTAG.U:DGTAG.M+' enter from AS 5100.5')+'</td></tr></table>'
    +'<div class="bbnote">Transfer stress limits are set on the Design Analysis page (Analyse for: Transfer). Strand stress at ULS is capped linearly from &sigma;<sub>pe</sub> at L<sub>pt</sub> to f<sub>pb</sub> at L<sub>d</sub> from the bonded end &mdash; method, verify.</div></div>'
    +'<div><div class="sdh">Debonding (read only)</div>'+(function(){ var G2={}, n=0; Q.strands.forEach(function(t){ if(!t.on) return; n++; if(t.dL||t.dR){ var k=dgF(t.y,1)+'|'+(t.dL||0)+'|'+(t.dR||0); (G2[k]=G2[k]||{y:t.y,l:t.dL||0,r:t.dR||0,n:0}).n++; } });
      var rows=Object.keys(G2).map(function(k){ return G2[k]; }).sort(function(a,b){ return a.y-b.y; });
      return '<table class="dt dgt"><tr><th>Row y (mm)</th><th>No. debonded</th><th>Left (mm)</th><th>Right (mm)</th></tr>'+(rows.length?rows.map(function(q){ return '<tr><td>'+dgF(q.y,1)+'</td><td>'+q.n+'</td><td>'+q.l+'</td><td>'+q.r+'</td></tr>'; }).join(''):'<tr><td colspan="4" class="l">no debonded strands ('+n+' strands on)</td></tr>')+'</table>'; })()
    +'<div class="bbnote">Strand pattern, debonding and reinforcement are set in <b>Properties &rarr; Girder definition</b>; the Hog analysis and these checks both use that arrangement.</div></div></div>';
  return h;
}
function dgDebBind(){
  var Q=DG.sec;
  [].forEach.call(document.querySelectorAll('#'+(DG._edT||'dg_ed')+' .dgdb'),function(el){ el.onchange=function(){ var a=el.getAttribute('data-k').split(':'), v=el.value.trim()===''?null:+el.value;
    if(a[0]==='g') Q.gird[a[1]]=(v===null||!isFinite(v))?null:v; else { Q.strands[+a[1]][a[2]]=v||0; dgMark('deb'); }
    dgEditor(); var gv=$('dg_gird'); if(gv) dgGirdView(); }; });
  var ap=$('dg_dapply'); if(ap) ap.onclick=function(){ var y=+$('dg_drow').value, xs=dgParseXs($('dg_dx').value), L=+$('dg_dl').value||0, R=+$('dg_dr').value||0;
    Q.strands.forEach(function(t){ if(Math.abs(t.y-y)<0.05&&(!xs.length||xs.indexOf(t.x)>=0)){ t.dL=L; t.dR=R; } }); dgMark('deb'); dgEditor(); if($('dg_gird')) dgGirdView(); };
}
function dgGirdChip(set){ var D=DG.gird; if(!D){ set(7,'not run',''); return; } var m=-1; D.st.forEach(function(r){ if(r.o){ m=Math.max(m,Math.max(0,r.o.uS),r.o.uB||0,r.o.sh?r.o.sh.u:0); } }); set(7,anFmt(m,2),m>1?'ng':m>0.9?'warn':'ok'); }
