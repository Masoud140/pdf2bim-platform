/* ===== v37: one integrated bridge model — superstructure grillage + bearings + headstocks + piles + soil / rock springs.
   The frozen MCT is kept unchanged as SUBM.orig; the model every analysis reads (an_mct_src) is rebuilt from it with the
   boundary settings below. Values not in the drawing set are PLACEHOLDER assumptions (engineer instruction 2026-10-22),
   tagged "Assumed — placeholder" and listed in Needs Review until replaced by the bearing schedule / geotech report. ===== */
var SUBM=(function(){
  var $=function(i){ return document.getElementById(i); };
  var src=$('an_mct_src'); if(!src) return null;
  var S={orig:src.textContent, applied:null,
    /* bearings — laminated elastomeric (GA): plan size, rubber thickness, G are placeholders */
    bA:{lon:'fixed', tra:'fixed'}, bB:{lon:'free', tra:'fixed'},
    ea:400, eb:500, eT:60, eG:0.69, eS:null, kFix:1.0e7,
    /* piles */
    khRock:200, khFill:10, fac:1.0, toe:'pinz', colSoil:true,
    /* v39: soil profile along the pile columns, per abutment: ground RL (default for every pile, blank = column head / sill soffit),
       per-pile ground RL override (a skewed spill-through embankment meets each column at a different level) and soil layers
       (layer 1 starts at the ground level of each pile; each further layer starts at its own top RL; all stop at RL B, where the rock springs start) */
    soil:{A:{g:null, gp:{}, layers:[{nm:'Embankment fill', top:null, kh:10}]}, B:{g:null, gp:{}, layers:[{nm:'Embankment fill', top:null, kh:10}]}},
    tags:{}};
  /* ---- pile data from the Piles tab (Direct) ---- */
  S.pile=function(ab){ try{ var o={}; ['dia','sock','rlA','rlB'].forEach(function(r){ var row=DATA.LIVE[r], t=ab==='A'?'A':'B', ov=PIO&&PIO[t]&&PIO[t][row]; o[r]=+(ov!==undefined&&ov!==''?ov:PIR[row][VI(t)]); }); return o; }catch(e){ return null; } };
  /* ---- derived bearing stiffness (kN/m) ---- */
  S.brg=function(){ var A=S.ea*S.eb, nl=Math.max(1,Math.round(S.eT/12)), tl=S.eT/nl, Sf=A/(2*(S.ea+S.eb)*tl), Ec=6*S.eG*Sf*Sf, Eeff=1/(1/Ec+1/2000);
    return {A:A, nl:nl, tl:tl, S:Sf, Ec:Ec, Eeff:Eeff, Ks:S.eG*A/S.eT, Kv:Eeff*A/S.eT}; };  /* N/mm = kN/m */
  /* ---- piles of the frozen model: one per toe constraint node, labelled A1.. / B1.. in the constraint order ---- */
  S.pileList=function(M){ var L=[]; M.cons.forEach(function(c){ if(!/PileToe/i.test(c.group||'')) return; var ab=/AbutB/i.test(c.group)?'B':'A';
      c.nodes.forEach(function(n,i){ var p=M.nodes[n]; L.push({ab:ab,i:i,id:ab+(i+1),toe:n,x:p[0],y:p[1]}); }); }); return L; };
  S.pileAt=function(L,x,y){ var b=null, d=1e9; L.forEach(function(p){ var q=Math.hypot(p.x-x,p.y-y); if(q<d){ d=q; b=p; } }); return d<0.5?b:null; };
  /* ground RL at one pile (null = column head) and the layer intervals [bottom, top, kh, name] between RL B and the ground */
  S.groundAt=function(id,zTop){ var ab=id.charAt(0), so=S.soil[ab], v=so.gp[id]; v=(v!==undefined&&v!==''&&v!==null&&isFinite(+v))?+v:(so.g!==null&&so.g!==''&&isFinite(+so.g)?+so.g:null); return v===null?zTop:Math.min(v,zTop); };
  S.layersAt=function(id,zTop,rock){ var ab=id.charAt(0), g=S.groundAt(id,zTop), Ls=S.soil[ab].layers, out=[];
    for(var j=0;j<Ls.length;j++){ var top=j===0?g:Math.min(+Ls[j].top,g), bot=rock;
      for(var k=j+1;k<Ls.length;k++){ if(isFinite(+Ls[k].top)&&Ls[k].top!==null&&Ls[k].top!==''){ bot=Math.max(rock,Math.min(+Ls[k].top,g)); break; } }
      if(j>0&&!(isFinite(+Ls[j].top)&&Ls[j].top!==null&&Ls[j].top!=='')) continue;
      if(top>bot+1e-6) out.push({j:j,bot:bot,top:top,kh:+Ls[j].kh||0,nm:Ls[j].nm}); }
    return out; };
  /* ---- model rebuild ---- */
  /* split the pile elements: first at every soil level (ground RL of the pile, layer tops, RL B), then into ~1 m pieces, so the springs act at the right levels */
  S.subdivide=function(txt){ var M=AN.parseMCT(txt), pid=Object.keys(M.secs).find(function(k){ return /Pile/i.test(M.secs[k].name); }); if(!pid) return txt;
    var PL=S.pileList(M), maxN=Math.max.apply(null,Object.keys(M.nodes).map(Number)), maxE=Math.max.apply(null,M.els.map(function(e){ return +e.id; })), addN=[], repl={};
    /* column head level of each pile = highest pile node on it */
    var zTop={}; M.els.forEach(function(e){ if(String(e.sec)!==String(pid)) return; [e.n1,e.n2].forEach(function(n){ var p=M.nodes[n], q=S.pileAt(PL,p[0],p[1]); if(q) zTop[q.id]=Math.max(zTop[q.id]===undefined?-1e9:zTop[q.id],p[2]); }); });
    M.els.forEach(function(e){ if(String(e.sec)!==String(pid)) return; var a=M.nodes[e.n1], b=M.nodes[e.n2], L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
      var q=S.pileAt(PL,(a[0]+b[0])/2,(a[1]+b[1])/2), cuts=[];
      if(q&&S.colSoil){ var pd=S.pile(q.ab)||{}, rock=isFinite(pd.rlB)?pd.rlB:-1e9; cuts=[rock,S.groundAt(q.id,zTop[q.id])]; S.layersAt(q.id,zTop[q.id],rock).forEach(function(l){ cuts.push(l.top,l.bot); }); }
      var zlo=Math.min(a[2],b[2]), zhi=Math.max(a[2],b[2]), ts=[0,1];
      cuts.forEach(function(z){ if(z>zlo+0.05&&z<zhi-0.05&&Math.abs(b[2]-a[2])>1e-9){ var t=(z-a[2])/(b[2]-a[2]); if(ts.every(function(u){ return Math.abs(u-t)*L>0.05; })) ts.push(t); } });
      ts.sort(function(u,v){ return u-v; }); var tt=[0];
      for(var s=0;s<ts.length-1;s++){ var len=(ts[s+1]-ts[s])*L, n=len<1.5?1:Math.ceil(len/1.0); for(var i=1;i<=n;i++) tt.push(ts[s]+(ts[s+1]-ts[s])*i/n); }
      if(tt.length<=2) return;
      var ids=[e.n1]; for(var i=1;i<tt.length-1;i++){ var t=tt[i], id=++maxN; addN.push('   '+id+', '+[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]),a[2]+t*(b[2]-a[2])].map(function(v){ return v.toFixed(5); }).join(', ')); ids.push(id); } ids.push(e.n2);
      repl[e.id]=ids; });
    var out=[], blk=null; txt.split(/\r?\n/).forEach(function(l){ var t=l.trim();
      if(t.charAt(0)==='*'){ if(blk==='*NODE') addN.forEach(function(x){ out.push(x); }); blk=t.split(/[\s;]/)[0].toUpperCase(); out.push(l); return; }
      if(blk==='*ELEMENT'&&t&&t.charAt(0)!==';'){ var p=l.split(',').map(function(x){ return x.trim(); }); if(repl[+p[0]]){ var ids=repl[+p[0]];
          for(var i=0;i<ids.length-1;i++){ var q=p.slice(); q[0]=i===0?p[0]:String(++maxE); q[4]=String(ids[i]); q[5]=String(ids[i+1]); out.push('   '+q.join(', ')); } return; } }
      out.push(l); });
    return out.join('\n'); };
  var ov=function(lo,hi,a,b){ return Math.max(0,Math.min(hi,b)-Math.max(lo,a)); };
  S.build=function(){ var base=S.colSoil?S.subdivide(S.orig):S.orig, M=AN.parseMCT(base), lines=base.split(/\r?\n/), out=[], blk=null, br=S.brg(), springs=[], info={piles:[],nSpr:0};
    var pid=Object.keys(M.secs).find(function(k){ return /Pile/i.test(M.secs[k].name); }), PL=S.pileList(M);
    var D=S.pile('A')?S.pile('A').dia/1000:1.05;
    /* pile chains from the toe constraints */
    M.cons.forEach(function(c){ var ab=/AbutB/i.test(c.group)?'B':'A', pd=S.pile(ab)||{}, rock=isFinite(pd.rlB)?pd.rlB:null;
      c.nodes.forEach(function(toe){ var p0=M.nodes[toe], chain=[toe], cur=toe, guard=0, pl=S.pileAt(PL,p0[0],p0[1])||{id:ab+'?'};
        while(guard++<200){ var e=M.els.find(function(q){ return String(q.sec)===String(pid)&&(q.n1===cur||q.n2===cur)&&chain.indexOf(q.n1===cur?q.n2:q.n1)<0; }); if(!e) break; cur=e.n1===cur?e.n2:e.n1; chain.push(cur); }
        var zs=chain.map(function(n){ return M.nodes[n][2]; }), zT=zs[zs.length-1], top=rock!==null?rock:zs[0];
        var kh=S.khRock*1000*S.fac, lay=S.colSoil?S.layersAt(pl.id,zT,top):[], gl=S.colSoil?S.groundAt(pl.id,zT):null, sp=[];
        chain.forEach(function(n,i){ var z=zs[i], up=i<chain.length-1?zs[i+1]:z, dn=i>0?zs[i-1]:z, lo=(z+dn)/2, hi=(z+up)/2;
          var tr=ov(lo,hi,-1e9,top); if(tr>1e-9){ var k=kh*D*tr; springs.push({n:n,k:k,g:'Soil_Abut'+ab}); sp.push({n:n,z:z,k:k,t:'rock'}); }
          lay.forEach(function(l){ var tl=ov(lo,hi,l.bot,l.top); if(tl>1e-9&&l.kh>0){ var k=l.kh*1000*S.fac*D*tl; springs.push({n:n,k:k,g:'Fill_Abut'+ab+'_L'+(l.j+1)}); sp.push({n:n,z:z,k:k,t:'L'+(l.j+1)}); } }); });
        info.piles.push({ab:ab,id:pl.id,x:p0[0],y:p0[1],toe:toe,top:chain[chain.length-1],chain:chain,rock:top,zTop:zT,zToe:zs[0],ground:gl,layers:lay,spr:sp}); }); });
    info.nSpr=springs.length;
    lines.forEach(function(l){ var t=l.trim();
      if(t.charAt(0)==='*'){ blk=t.split(/[\s;]/)[0].toUpperCase();
        if(blk==='*ENDDATA'&&springs.length){ out.push('*SPRING    ; Point Spring Supports  [v37 integrated model — lateral soil / rock springs on the piles; VERIFY the field order on MIDAS import]');
          out.push('; NODE_LIST, Type, SDx, SDy, SDz, SRx, SRy, SRz, bLIMIT, ... , GROUP   (kN/m, global axes)');
          springs.forEach(function(s){ out.push('   '+s.n+', LINEAR, '+s.k.toExponential(4)+', '+s.k.toExponential(4)+', 0, 0, 0, 0, NO, 0, 0, 0, 0, '+s.g); }); }
        out.push(l); return; }
      if(blk==='*CONSTRAINT'&&t&&t.charAt(0)!==';'&&/PileToe/i.test(l)){ var p=l.split(','); var f=S.toe==='fix'?'1111110':'0010000';
        out.push('   '+p[0].trim()+', '+f+', '+(p[2]||'').trim().replace(/_fixed$/,S.toe==='fix'?'_fixed':'_pinZ')); return; }
      if(blk==='*ELASTICLINK'&&t&&t.charAt(0)!==';'){ var q=l.split(',').map(function(x){ return x.trim(); }); if(q[3]!=='GEN'){ out.push(l); return; }
        var ab=/AbutB/i.test(q[20]||'')?S.bB:S.bA, kl=function(m){ return m==='fixed'?S.kFix:(m==='elast'?br.Ks:0); };
        q[11]=br.Kv.toExponential(4); q[12]=kl(ab.tra).toExponential(4); q[13]=kl(ab.lon).toExponential(4);
        q[20]=(/AbutB/i.test(q[20]||'')?'Brg_AbutB_':'Brg_AbutA_')+(ab.lon==='fixed'?'fixed':(ab.lon==='free'?'freeLong':'elastLong'));
        out.push('   '+q.join(', ')); return; }
      out.push(l); });
    S.info=info; return out.join('\n'); };
  S.apply=function(){ src.textContent=S.build(); S.applied=new Date();
    try{ if(typeof ANS!=='undefined'){ ANS.stale=true; ANS.res=null; ANS.M=null; } }catch(e){}
    try{ if(typeof CS!=='undefined'){ CS.res=null; } }catch(e){}
    try{ if(typeof DG!=='undefined'){ DG.mdl=null; } }catch(e){}
    try{ var pr=$('panePR'); if(pr) pr.dataset.built=''; }catch(e){} };
  /* ---- hand check: one pile, unit horizontal force at the head (free head) vs Hetenyi semi-infinite socket + cantilever column ---- */
  S.check=function(){ var M=AN.parseMCT(src.textContent), pi=S.info&&S.info.piles[0]; if(!pi) return null;
    var nodes={}, els=M.els.filter(function(e){ return pi.chain.indexOf(e.n1)>=0&&pi.chain.indexOf(e.n2)>=0; });
    pi.chain.forEach(function(n){ nodes[n]=M.nodes[n]; });
    var cons=M.cons.filter(function(c){ return c.nodes.indexOf(pi.toe)>=0; }).map(function(c){ return {nodes:[pi.toe],f:c.f,group:c.group}; });
    var spr=(M.springs||[]).map(function(s){ return {nodes:s.nodes.filter(function(n){ return nodes[n]; }),k:s.k,group:s.group}; }).filter(function(s){ return s.nodes.length; });
    var head=function(sp){ var mini={nodes:nodes,els:els,mats:M.mats,secs:M.secs,cons:cons.concat([{nodes:[pi.top],f:[0,0,0,0,0,1,0],group:'twist'}]),gravity:[0,0,-1],warn:[],links:[],springs:sp};
      var P=AN.prepare(mini,{shear:true,weightOn:function(){ return false; }}), K=AN.assembleK(P); AN.cholesky(K,P.nf);
      var F=new Float64Array(P.nf), r=P.freeMap[6*P.idx[pi.top]+0]; F[r]=1; return AN.cholSolve(K,P.nf,F)[r]; };
    var dTop=head(spr.filter(function(s){ return /^Soil_/.test(s.group); })), dAll=head(spr);   /* rock only (hand-checkable), and with the fill springs */
    var sec=M.secs[els[0].sec], E=M.mats[els[0].mat].E, EI=E*sec.Iy, D=(S.pile(pi.ab)||{dia:1050}).dia/1000, k=S.khRock*1000*S.fac*D, b=Math.pow(k/(4*EI),0.25), Lc=pi.zTop-pi.rock, Ls=pi.rock-pi.zToe;
    var H=1, Mo=H*Lc, d0=2*H*b/k+2*Mo*b*b/k, t0=2*H*b*b/k+4*Mo*b*b*b/k, dHand=d0+t0*Lc+H*Lc*Lc*Lc/(3*EI);
    return {model:1/dTop, all:1/dAll, fill:S.colSoil, hand:1/dHand, beta:b, bL:b*Ls, Lc:Lc, Ls:Ls, EI:EI, k:k}; };
  return S;
})();

/* ---- Boundary → Bearings and supports: editable integrated-model boundary ---- */
function bdBuild(){
  var pane=document.getElementById('paneBD'); if(!pane||!SUBM) return; var $=function(i){ return document.getElementById(i); };
  var S=SUBM, br=S.brg(), pa=S.pile('A')||{}, pb=S.pile('B')||{}, f=function(v,d){ return (v===null||v===undefined||!isFinite(v))?'—':(+v).toFixed(d===undefined?0:d); };
  var AS='<span class="tg" style="color:#b45309">Assumed — placeholder</span>', DI='<span class="tg tD">Direct</span>', CA='<span class="tg tC">Calculated</span>', EN='<span class="tg tU">Engineer instruction</span>', MO='<span class="tg">Model</span>';
  var inp=function(k,v,w){ return '<input class="f sbin" data-k="'+k+'" value="'+v+'" style="width:'+(w||70)+'px">'; };
  var sel=function(k,v,opts){ return '<select class="f sbin" data-k="'+k+'">'+opts.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===v?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select>'; };
  var dirO=[['fixed','fixed (restrained)'],['free','free'],['elast','elastomer shear G·A/T']];
  var h='<div class="card"><div class="sdh">Integrated model — superstructure, bearings, headstocks, piles and ground in one analysis</div>'
   +'<div class="bbnote">Every analysis (self weight, construction stages, traffic, pile results, MIDAS export) now reads this one model. Values not in the drawing set are <b>placeholders</b> so the model runs; each is tagged and listed in Needs Review until the bearing schedule and geotechnical report are available.</div></div>';
  /* bearings */
  h+='<div class="card"><div class="sdh">1. Bearings — laminated elastomeric (GA), as elastic links sill top → girder</div><div class="stfwrap"><table class="dt"><tr><th>Abutment</th><th>Longitudinal (along girder)</th><th>Transverse</th><th>Vertical</th><th>Rotations</th><th>Source</th></tr>'
   +'<tr><td>A</td><td>'+sel('bA.lon',S.bA.lon,dirO)+'</td><td>'+sel('bA.tra',S.bA.tra,dirO)+'</td><td>K<sub>v</sub></td><td>free</td><td>'+EN+' fixed side; GA: "R" restrained bearings and lateral restraint blocks</td></tr>'
   +'<tr><td>B</td><td>'+sel('bB.lon',S.bB.lon,dirO)+'</td><td>'+sel('bB.tra',S.bB.tra,dirO)+'</td><td>K<sub>v</sub></td><td>free</td><td>'+EN+' free longitudinally; transverse held by the lateral restraint blocks</td></tr></table></div>'
   +'<table class="dt" style="max-width:900px;margin-top:8px"><tr><th class="l">Elastomer (per bearing)</th><th>Value</th><th class="l">Source</th></tr>'
   +'<tr><td class="l">Plan size a × b (mm)</td><td>'+inp('ea',S.ea,56)+' × '+inp('eb',S.eb,56)+'</td><td class="l">'+AS+' <b>'+S.ea+' × '+S.eb+' mm used.</b> Bearing schedule not in the set</td></tr>'
   +'<tr><td class="l">Total elastomer thickness T (mm), layers of ≈12 mm</td><td>'+inp('eT',S.eT,56)+'</td><td class="l">'+AS+' <b>'+S.eT+' mm used.</b> Bearing schedule not in the set</td></tr>'
   +'<tr><td class="l">Shear modulus G (MPa)</td><td>'+inp('eG',S.eG,56)+'</td><td class="l">'+AS+' <b>'+S.eG+' MPa used</b> — confirm with the supplier / AS 5100.4</td></tr>'
   +'<tr><td class="l">Shear stiffness K<sub>s</sub> = G·A/T</td><td>'+f(br.Ks,0)+' kN/m</td><td class="l">'+CA+' from the placeholders</td></tr>'
   +'<tr><td class="l">Compression stiffness K<sub>v</sub> = E<sub>eff</sub>·A/T; S = ab/(2(a+b)t<sub>l</sub>) = '+f(br.S,2)+', E<sub>c</sub> = 6GS² = '+f(br.Ec,0)+' MPa, bulk 2000 MPa</td><td>'+f(br.Kv,0)+' kN/m</td><td class="l">'+CA+' (method — verify against AS 5100.4)</td></tr>'
   +'<tr><td class="l">"Fixed / restrained" direction stiffness</td><td>'+inp('kFix',S.kFix.toExponential(1),70)+' kN/m</td><td class="l">'+MO+' rigid idealisation</td></tr></table></div>';
  /* piles */
  h+='<div class="card"><div class="sdh">2. Piles and ground — Ø'+f(pa.dia)+' bored piles, rock socketed</div><table class="dt" style="max-width:1000px"><tr><th class="l">Item</th><th>Abutment A</th><th>Abutment B</th><th class="l">Source</th></tr>'
   +'<tr><td class="l">Top of pile RL "B" = top of rock socket</td><td>'+f(pa.rlB,3)+'</td><td>'+f(pb.rlB,3)+'</td><td class="l">'+DI+' DRG 202050 Table 1; minimum socket '+f(pa.sock)+' mm = full pile length below RL B ('+CA+' RL B − RL A)</td></tr>'
   +'<tr><td class="l">Founding level RL "A"</td><td>'+f(pa.rlA,3)+'</td><td>'+f(pb.rlA,3)+'</td><td class="l">'+DI+'</td></tr>'
   +'<tr><td class="l">Lateral modulus of rock k<sub>h</sub> (MN/m³) → spring = k<sub>h</sub>·D·tributary length at each pile node</td><td colspan="2">'+inp('khRock',S.khRock,70)+'</td><td class="l">'+AS+' <b>'+S.khRock+' MN/m³ used.</b> Geotechnical report not in the set</td></tr>'
   +'<tr><td class="l">Pile column above RL B (sill soffit → RL B), embedded in the embankment</td><td colspan="2">'+sel('colSoil',S.colSoil?'1':'0',[['0','no lateral soil support'],['1','soil springs by the soil profile below']])+'</td><td class="l">'+AS+' DRG 202050: embankment completed to pile cut-off level before piling; fill around the column (spill-through) not defined. With the columns free the earth-pressure case alone gives ≈2,150 kN·m per pile, far above the ≈520 kN·m ULS pile moment listed in DRG 202050 Table 1 (confirm on the sheet)</td></tr>'
   +'<tr><td class="l">Pile toe</td><td colspan="2">'+sel('toe',S.toe,[['pinz','vertical support only (lateral by the springs)'],['fix','fully fixed (as before)']])+'</td><td class="l">'+AS+' <b>vertical support only used</b> — rock socket carries the lateral load through the springs</td></tr>'
   +'<tr><td class="l">Soil / rock stiffness factor (sensitivity)</td><td colspan="2">'+sel('fac',String(S.fac),[['0.5','0.5 × (soft)'],['1','1.0 × (base)'],['2','2.0 × (stiff)']])+'</td><td class="l">'+MO+' run 0.5 and 2.0 for the envelope (grillage reference §12)</td></tr></table>'
   +'<div class="msbar" style="margin-top:8px"><button class="b" id="sb_apply">Apply to the model</button><span class="n" id="sb_st">'+(S.applied?'Model rebuilt '+S.applied.toTimeString().slice(0,8)+' — re-run Construction stages / Analysis to update results.':'')+'</span></div></div>';
  if(S.colSoil) h+=sbSoilHTML(S,f,AS,DI,CA,EN,inp);
  /* summary + check */
  var I=S.info||{piles:[],nSpr:0}, ck=null; try{ ck=S.check(); }catch(e){ ck={err:e.message}; }
  h+='<div class="card"><div class="sdh">3. Model as built</div><table class="dt"><tr><th class="l">Item</th><th>Value</th></tr>'
   +'<tr><td class="l">Bearing links</td><td>'+((AN.parseMCT(document.getElementById('an_mct_src').textContent).links||[]).length)+'</td></tr>'
   +'<tr><td class="l">Pile soil / rock springs (nodes)</td><td>'+I.nSpr+' ('+I.piles.reduce(function(a,p){ return a+p.spr.filter(function(q){ return q.t==='rock'; }).length; },0)+' rock, '+I.piles.reduce(function(a,p){ return a+p.spr.filter(function(q){ return q.t!=='rock'; }).length; },0)+' soil)</td></tr>'
   +'<tr><td class="l">Piles</td><td>'+I.piles.length+' ('+I.piles.map(function(p){ return p.ab; }).join(' ')+')</td></tr></table>';
  if(ck&&!ck.err) h+='<div class="sdh" style="margin-top:10px">Hand check — one pile, unit horizontal force at the column head (head free to rotate)</div><table class="dt" style="max-width:900px"><tr><th class="l">Item</th><th>Value</th></tr>'
   +'<tr><td class="l">Column above rock L<sub>c</sub> / socket L<sub>s</sub></td><td>'+f(ck.Lc,2)+' m / '+f(ck.Ls,2)+' m</td></tr>'
   +'<tr><td class="l">β = (k/4EI)<sup>¼</sup>, k = k<sub>h</sub>D; βL<sub>s</sub></td><td>'+f(ck.beta,4)+' /m; '+f(ck.bL,2)+(ck.bL<Math.PI?' (socket shorter than "long" — hand value slightly stiff)':'')+'</td></tr>'
   +'<tr><td class="l">Head stiffness — model, rock springs only</td><td>'+f(ck.model,0)+' kN/m</td></tr>'
   +'<tr><td class="l">Head stiffness — hand (Hetényi semi-infinite socket + cantilever column)</td><td>'+f(ck.hand,0)+' kN/m (model / hand = '+f(ck.model/ck.hand,3)+')</td></tr>'
   +(ck.fill?'<tr><td class="l">Head stiffness as modelled, with the fill springs on the column</td><td>'+f(ck.all,0)+' kN/m</td></tr>':'')+'</table>';
  else if(ck&&ck.err) h+='<div class="bbnote bbflag">Check not run: '+ck.err+'</div>';
  h+='</div>';
  /* construction stages note (kept from v36) */
  h+='<div class="card"><div class="sdh">4. Boundary changes during construction</div><table class="dt"><tr><th>Stage</th><th>Boundary</th></tr>'
   +'<tr><td>CS1</td><td>Substructure only: pile springs and toe supports active</td></tr>'
   +'<tr><td>CS2&ndash;CS3</td><td>Bearings active, plus a temporary roll restraint about each girder axis ('+((typeof CS!=='undefined'&&CS.KROT)||1e6).toExponential(0)+' kN·m/rad) &mdash; bearing pad and erection bracing [Model]</td></tr>'
   +'<tr><td>CS4 onward</td><td>Roll restraint removed; bearings and ground as in sections 1–2</td></tr></table></div>';
  pane.innerHTML=h; pane.dataset.built=1;
  var chg=function(){ bdBuild(); var st=$('sb_st'); if(st) st.textContent='Changed — press "Apply to the model".'; var s2=$('sb_st2'); if(s2) s2.textContent='Changed — press "Apply to the model".'; };
  [].forEach.call(pane.querySelectorAll('.sbin'),function(el){ el.onchange=function(){ var k=el.getAttribute('data-k'), v=el.value;
    if(k.indexOf('.')>0){ var a=k.split('.'); S[a[0]][a[1]]=v; } else if(k==='colSoil') S.colSoil=v==='1'; else if(k==='toe') S.toe=v; else { var n=parseFloat(v); if(isFinite(n)) S[k]=n; }
    chg(); }; });
  /* soil profile inputs: data-s="A|g", "A|gp|A2", "A|L|1|top" ... blank = default */
  var num=function(v){ v=String(v).trim(); return v===''?null:(isFinite(+v)?+v:undefined); };
  [].forEach.call(pane.querySelectorAll('.sbsl'),function(el){ el.onchange=function(){ var p=el.getAttribute('data-s').split('|'), so=S.soil[p[0]], v=el.value;
    if(p[1]==='g'){ var n=num(v); if(n!==undefined) so.g=n; }
    else if(p[1]==='gp'){ var n=num(v); if(n===null) delete so.gp[p[2]]; else if(n!==undefined) so.gp[p[2]]=n; }
    else if(p[1]==='L'){ var L=so.layers[+p[2]]; if(p[3]==='nm') L.nm=v; else { var n=num(v); if(n!==undefined&&!(p[3]==='kh'&&n===null)) L[p[3]]=n; }
      var f0=so.layers[0]; so.layers=[f0].concat(so.layers.slice(1).sort(function(x,y){ return (y.top===null?-1e9:y.top)-(x.top===null?-1e9:x.top); })); }
    chg(); }; });
  [].forEach.call(pane.querySelectorAll('[data-sadd]'),function(b){ b.onclick=function(){ var ab=b.getAttribute('data-sadd'), so=S.soil[ab], I=(S.info&&S.info.piles||[]).filter(function(p){ return p.ab===ab; });
    var lo=I.length?Math.min.apply(null,I.map(function(p){ return p.ground; })):null, r=I.length?I[0].rock:null, t=(lo!==null&&r!==null)?Math.round(((lo+r)/2)*10)/10:null;
    so.layers.push({nm:'Layer '+(so.layers.length+1),top:t,kh:so.layers[so.layers.length-1].kh}); chg(); }; });
  [].forEach.call(pane.querySelectorAll('[data-sdel]'),function(b){ b.onclick=function(){ var p=b.getAttribute('data-sdel').split('|'); S.soil[p[0]].layers.splice(+p[1],1); chg(); }; });
  [].forEach.call(pane.querySelectorAll('[data-scopy]'),function(b){ b.onclick=function(){ var ab=b.getAttribute('data-scopy'), o=ab==='A'?'B':'A'; S.soil[o]=JSON.parse(JSON.stringify(S.soil[ab])); S.soil[o].gp={}; chg(); }; });
  var a2=$('sb_apply2'); if(a2) a2.onclick=function(){ S.apply(); bdBuild(); };
  $('sb_apply').onclick=function(){ S.apply(); bdBuild(); };
}
/* build the integrated model at load so every analysis uses it */
(function(){ try{ if(SUBM){ SUBM.apply(); } }catch(e){ console.error('integrated model',e); } })();

/* ---- soil levels along the pile columns: inputs, per-pile table and an elevation of each abutment's piles ---- */
var SB_LCOL=['#d4a373','#a3b18a','#8ecae6','#cdb4db','#f4a261','#90be6d'];
function sbSoilHTML(S,f,AS,DI,CA,EN,inp){ var I=S.info||{piles:[]}, h='<div class="card"><div class="sdh">2a. Soil levels along the pile columns — where the soil springs act</div>'
  +'<div class="bbnote">Soil springs act only between <b>RL B</b> (top of rock, Direct) and the <b>ground level at each pile</b>. Layer 1 starts at the ground level of each pile; any further layer starts at its own top RL and runs down to the next layer or to RL B. Spring at each node = k<sub>h</sub> · D · length of that node&rsquo;s tributary column inside the layer (a node is placed at every ground and layer level). Blank ground RL = soil up to the column head (sill soffit). All levels and moduli here are <span class="tg" style="color:#b45309">Assumed — placeholder</span> / <span class="tg tU">Input (user)</span> until the geotechnical report and the embankment / spill-through levels are confirmed.</div>'
  +'<div class="sbsoil">';
  ['A','B'].forEach(function(ab){ var so=S.soil[ab], P=I.piles.filter(function(p){ return p.ab===ab; });
    h+='<div class="sbab"><div class="sdh">Abutment '+ab+'</div>'
      +'<table class="dt"><tr><th class="l">Ground RL at the piles (default for every pile)</th><td><input class="f sbsl" data-s="'+ab+'|g" value="'+(so.g===null?'':so.g)+'" placeholder="column head" style="width:90px"></td><td class="l">'+(so.g===null?AS+' <b>ground at the column head (sill soffit) used</b> — embankment level at the piles not in the set':'<span class="tg tU">Input (user)</span> RL '+so.g)+'</td></tr></table>'
      +'<table class="dt" style="margin-top:6px"><tr><th>#</th><th class="l">Layer</th><th>Top RL</th><th>k<sub>h</sub> (MN/m³)</th><th></th></tr>';
    so.layers.forEach(function(L,j){ h+='<tr><td><span class="sbsw" style="background:'+SB_LCOL[j%SB_LCOL.length]+'"></span>'+(j+1)+'</td><td class="l"><input class="f sbsl" data-s="'+ab+'|L|'+j+'|nm" value="'+String(L.nm).replace(/"/g,'&quot;')+'" style="width:140px"></td>'
      +'<td>'+(j===0?'ground at each pile':'<input class="f sbsl" data-s="'+ab+'|L|'+j+'|top" value="'+(L.top===null?'':L.top)+'" style="width:80px">')+'</td>'
      +'<td><input class="f sbsl" data-s="'+ab+'|L|'+j+'|kh" value="'+L.kh+'" style="width:60px"></td><td>'+(j>0?'<button class="b sbx" data-sdel="'+ab+'|'+j+'" title="Remove layer">×</button>':'')+'</td></tr>'; });
    h+='<tr><td colspan="5" class="l"><button class="b" data-sadd="'+ab+'">+ layer</button> <button class="b" data-scopy="'+ab+'">Copy profile to abutment '+(ab==='A'?'B':'A')+'</button></td></tr></table>'
      +'<table class="dt" style="margin-top:6px"><tr><th>Pile</th><th>Column head RL</th><th>RL B (rock)</th><th>Ground RL at pile</th><th>Soil length (m)</th><th>Springs (soil / rock)</th></tr>';
    P.forEach(function(p){ var v=so.gp[p.id], sl=p.ground!==null?Math.max(0,p.ground-p.rock):0;
      h+='<tr><td><b>'+p.id+'</b></td><td>'+f(p.zTop,3)+' <span class="tg">Model</span></td><td>'+f(p.rock,3)+' '+DI+'</td><td><input class="f sbsl" data-s="'+ab+'|gp|'+p.id+'" value="'+(v===undefined?'':v)+'" placeholder="'+(p.ground!==null?p.ground.toFixed(3):'')+'" style="width:84px"></td><td>'+f(sl,2)+'</td><td>'+p.spr.filter(function(q){ return q.t!=='rock'; }).length+' / '+p.spr.filter(function(q){ return q.t==='rock'; }).length+'</td></tr>'; });
    h+='</table>'+sbSoilSvg(P,so)+'</div>'; });
  h+='</div><div class="msbar" style="margin-top:8px"><button class="b" id="sb_apply2">Apply to the model</button><span class="n" id="sb_st2"></span></div>'
   +'<div class="bbnote">The table and elevation show the model as last applied; per-pile ground levels let a skewed spill-through embankment meet each column at its own level (blank = the abutment default; grey = value in use).</div></div>';
  return h; }
function sbSoilSvg(P,so){ if(!P.length) return ''; var W=380, H=300, zmax=Math.max.apply(null,P.map(function(p){ return p.zTop; }))+0.5, zmin=Math.min.apply(null,P.map(function(p){ return p.zToe; }))-0.5;
  var Y=function(z){ return 16+(zmax-z)/(zmax-zmin)*(H-36); }, n=P.length, X=function(i){ return 70+(i+0.5)*(W-90)/n; };
  var kmax=Math.max.apply(null,P.map(function(p){ return Math.max.apply(null,p.spr.map(function(q){ return q.k; }).concat([1])); })), kmaxS=Math.max.apply(null,P.map(function(p){ return Math.max.apply(null,p.spr.filter(function(q){ return q.t!=='rock'; }).map(function(q){ return q.k; }).concat([1])); }));
  var s='<svg class="sbsvg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Pile elevation with soil layers and springs">';
  [Math.ceil(zmin),Math.floor(zmax)].concat(P.length?[P[0].rock]:[]).forEach(function(z,ii){ s+='<line x1="56" x2="'+(W-6)+'" y1="'+Y(z)+'" y2="'+Y(z)+'" stroke="currentColor" stroke-opacity=".15"/><text x="52" y="'+(Y(z)+3)+'" font-size="9" text-anchor="end" fill="currentColor">'+z.toFixed(ii===2?2:0)+'</text>'; });
  P.forEach(function(p,i){ var x=X(i), w=Math.min(26,(W-90)/n*0.42);
    s+='<rect x="'+(x-w)+'" y="'+Y(p.rock)+'" width="'+2*w+'" height="'+(Y(p.zToe)-Y(p.rock))+'" fill="#8d99ae" fill-opacity=".45"/>';
    p.layers.forEach(function(l){ s+='<rect x="'+(x-w)+'" y="'+Y(l.top)+'" width="'+2*w+'" height="'+Math.max(0.5,Y(l.bot)-Y(l.top))+'" fill="'+SB_LCOL[l.j%SB_LCOL.length]+'" fill-opacity=".7"><title>'+p.id+' '+l.nm+': RL '+l.top.toFixed(2)+' → '+l.bot.toFixed(2)+', kh '+l.kh+' MN/m³</title></rect>'; });
    if(p.ground!==null) s+='<line x1="'+(x-w-4)+'" x2="'+(x+w+4)+'" y1="'+Y(p.ground)+'" y2="'+Y(p.ground)+'" stroke="#6b4f1d" stroke-width="2"/>';
    s+='<line x1="'+x+'" x2="'+x+'" y1="'+Y(p.zTop)+'" y2="'+Y(p.zToe)+'" stroke="currentColor" stroke-width="3"/>';
    p.spr.forEach(function(q){ var r=q.t==='rock', L=r?4+10*q.k/kmax:3+(w-3)*q.k/kmaxS; s+='<line x1="'+x+'" x2="'+(x+(r?-1:1)*L)+'" y1="'+Y(q.z)+'" y2="'+Y(q.z)+'" stroke="'+(r?'#495057':'#b45309')+'" stroke-width="1.6"><title>'+p.id+' RL '+q.z.toFixed(2)+': '+Math.round(q.k)+' kN/m ('+(r?'rock':'soil '+q.t)+')</title></line>'; });
    s+='<text x="'+x+'" y="'+(H-6)+'" font-size="10" text-anchor="middle" fill="currentColor">'+p.id+'</text>'; });
  s+='<text x="52" y="10" font-size="9" text-anchor="end" fill="currentColor">RL (m)</text></svg><p class="ref">Grey: rock below RL B · colours: soil layers · brown line: ground at the pile · ticks: springs, length ∝ stiffness (soil right, rock left). Hover for values.</p>';
  return s; }
