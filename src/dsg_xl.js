
/* ===== Excel export: the whole Super-T check as a live-formula workbook =====
   Inputs (yellow, blue text) -> Section (fibre strips by formula) -> SLS / ULS / Shear (formulas) -> Summary.
   Iterative steps are written out as bisection rows (SLS_iter, ULS_iter), so no macros are needed.                   */
function dgExportXL(){
  var X; try{ X=dgSection(); }catch(e){ alert('Section not ready: '+e.message); return; }
  var Q=DG.sec, L=DG.lc, d=DG.det, nL=L.length, W=XLW.book(), A1=XLW.A1, F=function(s){ return {f:s}; };
  var H=dgH(Q.R), nG=Math.ceil(H/5), nD=Math.ceil(Q.tD/5), NIT_S=50, NIT_U=60;
  /* temperature at depth y from the profile table (linear between points, zero outside) */
  var TI=function(y,Y,T){ var n='COUNT('+Y+')', rg='INDEX('+Y+',1):INDEX('+Y+','+n+')', ix='MIN(MATCH('+y+','+rg+',1),'+n+'-1)';
    return 'IFERROR(IF(OR('+n+'<2,'+y+'<INDEX('+Y+',1),'+y+'>INDEX('+Y+','+n+')),0,INDEX('+T+','+ix+')+(INDEX('+T+','+ix+'+1)-INDEX('+T+','+ix+'))*('+y+'-INDEX('+Y+','+ix+'))/(INDEX('+Y+','+ix+'+1)-INDEX('+Y+','+ix+'))),0)'; };
  /* ---------------- ReadMe ---------------- */
  var rm=W.sheet('ReadMe',{0:2,1:30,2:90}); rm.tab='FF2F3B4C'; var r=1;
  rm.set(r++,1,'BR13A Super-T design check — AS 5100.5:2017','sec');
  rm.set(r++,1,'Exported from the BR13A dashboard (Design tab). Every calculated cell is a live Excel formula: change any yellow input and the whole check recalculates.','note'); rm.merge(r-1,1,r-1,2); r++;
  rm.set(r++,1,'Cell colour key','bold');
  [['inp','12.5','Input — type here (yellow fill, blue text)'],['miss','','Input still missing — Flagged (red fill); the checks that need it show "-"'],['calc','12.5','Calculated by formula (light blue fill) — do not overwrite'],['code','0.003','Code or method constant (lilac fill) — from AS 5100.5, verify before changing'],['chk','OK','Check result (green OK / red NG by conditional format)'],['key','0.604','Key result carried to the Summary sheet']].forEach(function(k){ rm.set(r,1,k[1]===''?null:(isNaN(+k[1])?k[1]:+k[1]),k[0]); rm.set(r++,2,k[2],'txt'); });
  r++; rm.set(r++,1,'Sheets','bold');
  [['Inputs','Section outline, deck, materials, strands, bars, deck bars, shear/torsion detailing, load cases.'],['Section','Fibre strips (Super-T width from the half outline by formula), steel tables, section properties.'],
   ['SLS','Staged stresses (Super-T alone, then composite), decompression, cracking moments, allowable SLS moment, crack-control check (Cl 8.6.2).'],['SLS_iter','Cracked-section bisection on curvature that sets the bar / tendon stress increment to fscr / ftcr.'],
   ['ULS','Bending capacity by strain compatibility with the rectangular stress block (Cl 8.1), phi (Table 2.3.2), kuo, minimum strength.'],['ULS_iter','Bisection on the neutral-axis depth for force equilibrium at N* and at N = 0.'],
   ['Shear','Shear and torsion by the general method (Cl 8.2): dv, eps_x, theta_v, kv, capacities, utilisations, minimum reinforcement.'],['Summary','Utilisations and OK/NG for every load case.'],['Needs Review','Items flagged as missing or to be verified.']].forEach(function(k){ rm.set(r,1,k[0],'bold'); rm.set(r++,2,k[1],'txt'); });
  r++; rm.set(r++,1,'Conventions','bold');
  ['Units: mm, N, MPa inside the section sheets; actions in kN and kN·m.','y is measured DOWN from the deck top in the Section / SLS / ULS sheets; strand and bar inputs are given as height ABOVE the Super-T soffit (as on the drawings).',
   'Sagging moment +, axial tension +, compressive stress −.','The Super-T is defined by 16 parameters (Inputs sheet); its half outline is calculated from them. Each strip width is interpolated from that outline by formula. Each load case uses the open span section or the solid end block (Inputs, load cases: Section), so stiffness, centroid and shear / torsion geometry are worked out per load case.',
   'Super-T strips: '+nG+' rows, thickness = H / '+nG+'; deck strips: '+nD+' rows. If H or t_D changes the strip thickness follows; the row count is fixed at export.',
   'Strands at each load case are those bonded at its station, with σpe from the Hog time analysis at that station and fpb limited inside the transmission length (Inputs 4b–4d, calculated in the dashboard). Values are row averages, so expect differences of the order of 0.1%.',
   'Steel displaces concrete: stiffness sums use (Es − Ec) and (Ep − Ec); in the cracked solve the displaced concrete is deducted where that concrete is in compression.',
   'SLS free strains (Inputs 8): deck differential shrinkage and the temperature gradient (per load case: gradient 1 / −1 / 0 and factor). Stresses are E·(ε − ε_free); the restraint force and moment enter the composite solve.',
   'Top-face crack control: decompression of the Super-T top / deck top, then the stress increment of the bars (and any strands) above the composite centroid, as for the soffit.',
   'Not in this workbook (see the dashboard / Word report): along-girder envelopes, transfer stresses, ULS combination (a), Cl 8.6.1 bar stress, the M–N and V–M diagrams'+(DG.opt&&DG.opt.tend==='code'?', and the code approximate σpu (the dashboard is set to it; this workbook uses the strand curve)':'')+'.',
   'The cracked state at Ms* (neutral axis, curvature, increment at Ms*) is reported in the dashboard; this workbook checks Ms* against Ms,allow, which is the code check.',
   'Strand stress at ultimate: Mattock-type curve (A = 0.025, B = 118, C = 10, capped at fpb) — method, verify.',
   'Clause references are given for navigation only; the text of AS 5100.5 is not reproduced.'].forEach(function(t){ rm.set(r,1,'•','txt'); rm.set(r++,2,t,'txt'); });

  /* ---------------- Inputs ---------------- */
  var I=W.sheet('Inputs',{0:2,1:44,2:14,3:12,4:12,5:12,6:12,7:12,8:12,9:12,10:12,11:46}); I.tab='FFFFC000'; I.freeze=[2,0]; r=0;
  I.set(r++,1,'Inputs — yellow cells are editable; red cells are missing and flagged','sec'); r++;
  var nm=function(name,row,c){ W.name(name,'Inputs!'+A1(row,c,true)); };
  var put=function(label,name,v,unit,src,kind,fmt){ I.set(r,1,label,'lbl'); I.set(r,2,v,kind||(v===null||v===''?'miss':'inp'),fmt); I.set(r,3,unit,'note'); I.set(r,4,src||'','note'); I.merge(r,4,r,8); if(name) nm(name,r,2); r++; };
  I.set(r++,1,'1. Super-T parameters (open span section; the solid end block has the same outside with the void filled)','sub');
  DG_PAR.forEach(function(q){ var ch=Math.abs(Q.P[q[0]]-Q.orig.P[q[0]])>1e-6; put(q[0]+' — '+q[1],'P_'+q[0],Q.P[q[0]],q[2],q[3]+(ch?' — edited in the dashboard':' — Hog tab shape '+Q.orig.name),null,q[0]==='n'?'0.000':'0.0'); });
  var zz=(typeof dgZones==='function')?dgZones():[]; I.set(r,1,'Solid zones along the girder (x from left end, m)','lbl'); I.set(r,2,zz.length?zz.map(function(z){ return z.a.toFixed(3)+'–'+z.b.toFixed(3); }).join(', '):null,zz.length?'inp':'miss'); I.set(r,4,'information — each load case picks open / solid in section 9 (from these zones when set to Auto in the dashboard)','note'); I.merge(r,4,r,8); r++;
  r++; I.set(r++,1,'Derived geometry (formulas from the parameters)','sub');
  put('Web slope s = 1/n (horizontal per vertical)','w_s',F('1/P_n'),'','','calc','0.00000'); put('cos(atan s)','w_cs',F('COS(ATAN(w_s))'),'','','calc','0.00000');
  put('Bottom of the web–flange haunch above soffit','w_yh',F('P_D-P_tf-P_cD'),'mm','','calc','0.0'); put('Underside of the Bondek seat above soffit','w_yT',F('P_D-P_sd'),'mm','','calc','0.0');
  put('Top of the bottom-flange taper above soffit','w_yB',F('P_tb+P_tt'),'mm','','calc','0.0');
  put('Inner web face x at the seat underside','w_xiT',F('P_Bb/2+w_s*w_yT-P_twT/w_cs'),'mm','x outer − tw/cos','calc','0.0'); put('Inner web face x at the taper top','w_xiB',F('P_Bb/2+w_s*w_yB-P_twB/w_cs'),'mm','','calc','0.0');
  I.set(r,1,'Half outline of the open section (calculated)','hdr'); I.set(r,2,'x (mm)','hdr'); I.set(r,3,'y (mm)','hdr'); r++;
  var rx0=r, PT=[['P_Bb/2-P_scW','0'],['P_Bb/2+w_s*P_scH','P_scH'],['P_Bb/2+w_s*w_yh','w_yh'],['P_Bb/2+w_s*w_yh+P_cW','P_D-P_tf'],['P_Bt/2-P_tc','P_D-P_tf'],['P_Bt/2','P_D-P_tf+P_tc'],['P_Bt/2','P_D'],['w_xiT+P_sw','P_D'],['w_xiT+P_sw','w_yT'],['w_xiT','w_yT'],['w_xiB','w_yB'],['0','P_tb']];
  PT.forEach(function(p,i){ I.set(r,1,(i+1)+'. '+DG_PT[i].replace(/&mdash;/g,'—'),'lbl'); I.set(r,2,F(p[0]),'calc','0.0'); I.set(r,3,F(p[1]),'calc','0.0'); r++; });
  W.name('R_x','Inputs!'+A1(rx0,2,true)+':'+A1(r-1,2,true)); W.name('R_y','Inputs!'+A1(rx0,3,true)+':'+A1(r-1,3,true));
  I.set(r++,1,'The solid end block uses points 1–7 and closes across the top at the centreline.','note'); r++;
  I.set(r++,1,'2. Deck slab and materials','sub');
  put('Deck thickness t_D','t_D',Q.tD,'mm','Deck section — Direct'); put('Deck width acting with the girder W_d','W_d',+Q.Wd.toFixed(1),'mm','Model composite section — Calculated');
  put("Super-T f'c",'fc_g',Q.fcg,'MPa','Materials M1 — Direct'); put('Super-T Ec','E_g',Q.Eg,'MPa','Materials M1 — Direct');
  put("Deck f'c",'fc_d',Q.fcd,'MPa','Materials M2 — Direct'); put('Deck Ec','E_d',Q.Ed,'MPa','Materials M2 — Direct');
  put('Reinforcement fsy','f_sy',Q.fsy,'MPa','Hog tab'); put('Reinforcement Es','E_s',Q.Es,'MPa','Hog tab');
  put('Strand area Ap (one strand)','A_p',Q.Ap,'mm²','Hog tab'); put('Strand diameter','d_b',Q.db,'mm','Hog tab (drawing only)'); put('Strand minimum breaking load MBL','MBL_kN',Q.mbl,'kN','Hog tab'); put('Strand modulus Ep','E_p',Q.Ep,'MPa','Hog tab'); r++;
  I.set(r++,1,'3. Code and method constants','sub');
  put('Concrete ultimate strain εcu','e_cu',0.003,'','AS 5100.5 Cl 8.1.3 — Standard, verify','code'); put('φ shear and torsion','phi_v',0.7,'','Table 2.3.2 — Standard, verify','code');
  put('Strand curve A (Mattock)','pc_A',0.025,'','method — verify','code'); put('Strand curve B','pc_B',118,'','method — verify','code'); put('Strand curve C','pc_C',10,'','method — verify','code'); r++;
  /* strands */
  I.set(r++,1,'4. Strands (rows of equal height)','sub'); ['Row','y above soffit (mm)','No. ON','σpe after losses (MPa)','x positions (info only)'].forEach(function(t,i){ I.set(r,1+i,t,'hdr'); }); r++;
  var sr0=r, rowsS=dgGroup(Q.strands,function(t){ return dgF(t.y,1); });
  rowsS.forEach(function(g,i){ var on=g.items.filter(function(t){ return t.on; }), sp=on.length?on.reduce(function(a,t){ return a+(t.sp||0); },0)/on.length:(g.items[0].sp||0);
    I.set(r,1,'Row '+(i+1),'lbl'); I.set(r,2,+g.key,'inp','0.0'); I.set(r,3,on.length,'inp','0'); I.set(r,4,+sp.toFixed(1),'inp','0.0'); I.set(r,5,dgXs(on),'note'); I.merge(r,5,r,8); r++; });
  for(var e1=0;e1<3;e1++){ I.set(r,1,'(spare row)','note'); I.set(r,2,null,'inp'); I.set(r,3,null,'inp'); I.set(r,4,null,'inp'); r++; }
  W.name('S_y','Inputs!'+A1(sr0,2,true)+':'+A1(r-1,2,true)); W.name('S_n','Inputs!'+A1(sr0,3,true)+':'+A1(r-1,3,true)); W.name('S_sp','Inputs!'+A1(sr0,4,true)+':'+A1(r-1,4,true));
  var nSR=r-sr0; I.set(r++,1,'σpe from the Hog tab time-dependent losses at '+Q.time+(dgEdited('sp')?' (edited in the dashboard)':'')+'; averaged over the strands in a row. These midspan rows give the section properties on the Section sheet; the checks use the per-station values below.','note'); r++;
  /* strands effective at each load-case station (bonded strands only; σpe from the Hog time analysis at that station; fpb limited inside the transmission / development length) */
  var IH=X.info.tD+X.info.H, stT=function(j){ var o=DG.res&&DG.res.lc[j]; return o&&o.X&&o.X.S?o.X.S.tend:null; };
  var stRow=function(j,i){ var T=stT(j), g=rowsS[i]; if(!g) return null; if(!T) return {n:g.items.filter(function(t){ return t.on; }).length,sp:null,fpb:null};
    var q=T.filter(function(t){ return Math.abs((IH-t.y)-(+g.key))<0.6; }); if(!q.length) return {n:0,sp:0,fpb:0};
    return {n:q.length, sp:q.reduce(function(a,t){ return a+t.sp; },0)/q.length, fpb:q.reduce(function(a,t){ return a+t.fpb; },0)/q.length}; };
  var SMX={};
  [['n','4b. Bonded strands at each load-case station (No. per row)','0'],['sp','4c. σpe at each load-case station (MPa, row average)','0.0'],['fpb','4d. Strand stress limit at ultimate at each station, fpb or the developed value (MPa)','0.0']].forEach(function(M){
    I.set(r++,1,M[1],'sub'); I.set(r,1,'Row','hdr'); L.forEach(function(lc,j){ I.set(r,2+j,'LC'+(j+1),'hdr'); }); r++; var m0=r;
    for(var i=0;i<nSR;i++){ I.set(r,1,i<rowsS.length?'Row '+(i+1):'(spare row)',i<rowsS.length?'lbl':'note'); L.forEach(function(lc,j){ var q=stRow(j,i), v=q?q[M[0]]:null; I.set(r,2+j,v===null||v===undefined?null:+(+v).toFixed(M[0]==='n'?0:1),'inp',M[2]); }); r++; }
    SMX[M[0]]=m0; });
  I.set(r++,1,'Calculated in the dashboard at each station: debonded strands drop out until bonded; inside the transmission length the strand carries only its effective prestress (fpb limited to σpe); development length Ld beyond lt is used only when entered. Blank fpb = the full fpb.','note'); r++;
  var STM=function(k,j){ return 'Inputs!'+A1(SMX[k],2+j,true)+':'+A1(SMX[k]+nSR-1,2+j,true); };
  /* girder bars */
  I.set(r++,1,'5. Super-T longitudinal bars (rows of equal height and size)','sub'); ['Row','y above soffit (mm)','Bar Ø (mm)','No.','x positions (info only)'].forEach(function(t,i){ I.set(r,1+i,t,'hdr'); }); r++;
  var br0=r, rowsB=dgGroup(Q.gbars,function(b){ return dgF(b.y,1)+'|'+b.d; });
  rowsB.forEach(function(g,i){ I.set(r,1,'Row '+(i+1),'lbl'); I.set(r,2,g.items[0].y,'inp','0.0'); I.set(r,3,g.items[0].d,'inp','0'); I.set(r,4,g.items.length,'inp','0'); I.set(r,5,dgXs(g.items),'note'); I.merge(r,5,r,8); r++; });
  for(var e2=0;e2<3;e2++){ I.set(r,1,'(spare row)','note'); I.set(r,2,null,'inp'); I.set(r,3,null,'inp'); I.set(r,4,null,'inp'); r++; }
  W.name('GB_y','Inputs!'+A1(br0,2,true)+':'+A1(r-1,2,true)); W.name('GB_d','Inputs!'+A1(br0,3,true)+':'+A1(r-1,3,true)); W.name('GB_n','Inputs!'+A1(br0,4,true)+':'+A1(r-1,4,true));
  var nBR=r-br0; r++;
  /* deck bars */
  I.set(r++,1,'6. Deck longitudinal bars (n = INT(W_d / s) bars centred on the girder)','sub'); ['Layer','Face (top / bot)','Bar Ø (mm)','Spacing s (mm)','Clear cover (mm)'].forEach(function(t,i){ I.set(r,1+i,t,'hdr'); }); r++;
  var dr0=r, dbl=Q.dbars.slice(); while(dbl.length<4) dbl.push({pos:'top',d:null,s:null,c:null});
  dbl.forEach(function(b,i){ var ok=b.d>0&&b.s>0&&b.c!==null; I.set(r,1,'Layer '+(i+1),'lbl'); I.set(r,2,b.pos==='top'?'top':'bot','inp'); I.set(r,3,b.d,ok||i>=Q.dbars.length?'inp':'miss','0'); I.set(r,4,b.s,ok||i>=Q.dbars.length?'inp':'miss','0'); I.set(r,5,b.c,ok||i>=Q.dbars.length?'inp':'miss','0'); r++; });
  W.name('DB_f','Inputs!'+A1(dr0,2,true)+':'+A1(r-1,2,true)); W.name('DB_d','Inputs!'+A1(dr0,3,true)+':'+A1(r-1,3,true)); W.name('DB_s','Inputs!'+A1(dr0,4,true)+':'+A1(r-1,4,true)); W.name('DB_c','Inputs!'+A1(dr0,5,true)+':'+A1(r-1,5,true));
  var nDB=r-dr0; I.set(r++,1,'Deck reinforcement drawing is not in the BR13A set — Missing, Flagged until entered.','note'); r++;
  /* detailing */
  I.set(r++,1,'7. Shear and torsion detailing'+(d.ex?' — values are the reference spreadsheet example, NOT BR13A':''),'sub');
  I.set(r,1,'Item','hdr'); I.set(r,2,'Open (span)','hdr'); I.set(r,3,'Solid end block','hdr'); r++;
  var ds=DG.detS, put2=function(label,name,vo,vs,unit){ I.set(r,1,label,'lbl'); I.set(r,2,vo,vo===null||vo===undefined?'miss':'inp'); I.set(r,3,vs,vs===null||vs===undefined?'miss':'inp'); I.set(r,4,unit,'note'); nm(name,r,2); nm(name+'S',r,3); r++; };
  put2('Shear-only fitments: bar Ø','sv_d',d.svd,ds.svd,'mm'); put2('Shear-only fitments: number of legs','sv_n',d.svn,ds.svn,''); put2('Shear-only fitments: spacing','sv_s',d.svs,ds.svs,'mm');
  put2('Closed ties (torsion + shear): bar Ø','tv_d',d.tvd,ds.tvd,'mm'); put2('Closed ties: bars per tie','tv_n',d.tvn,ds.tvn,''); put2('Closed ties: spacing','tv_s',d.tvs,ds.tvs,'mm');
  put2('Fitment yield fsy.f','fsy_f',d.fsyf,ds.fsyf,'MPa'); put2('Clear cover — Super-T sides / soffit','cov_s',d.cs,ds.cs,'mm'); put2('Clear cover — deck top','cov_t',d.ct,ds.ct,'mm');
  put2('Maximum aggregate size dg (only if Asv < Asv,min)','d_g',d.dg,ds.dg,'mm');
  put('Vertical prestress component Pv','P_v',0,'kN','straight strands — Calculated','calc'); r++;
  /* serviceability free strains */
  I.set(r++,1,'8. Serviceability free strains (stage 2, composite)','sub');
  var shE=(DG.opt&&DG.opt.dsh&&typeof dgDshEps==='function')?dgDshEps():null;
  put('Deck free strain relative to the girder ε_free,deck (differential shrinkage)','eps_sh',shE?+shE.eps.toPrecision(4):(DG.opt&&DG.opt.dsh?null:0),'',shE?'Calculated — Hog tab time analysis (AAEM): −(εsh,deck − εsh,girder)/(1 + χ·φdeck) = −('+(shE.sd*1e6).toFixed(1)+' − '+(shE.sg*1e6).toFixed(1)+')×10⁻⁶/(1 + '+shE.chi+'×'+shE.phd.toFixed(3)+')':(DG.opt&&DG.opt.dsh?'Missing — Hog tab must use the detailed method with a deck':'switched off in the dashboard'),shE?'calc':null,'0.000E+00');
  var TPa=DG.temp||{}; put('Coefficient of thermal expansion α (×10⁻⁶ /°C)','T_al',TPa.alpha>0?TPa.alpha:null,'×10⁻⁶/°C',TPa.alpha>0?(TPa.auto?'Assumed (AS 5100.2 value to confirm)':'Input (user)'):'Missing — Flagged (AS 5100.2 / AS 5100.5 value to be entered)');
  var prof=function(lab,nmY,nmT,txt){ var pts=(typeof dgParseProf==='function'?dgParseProf(txt):null)||[]; I.set(r,1,lab,'hdr'); I.set(r,2,'depth from deck top (mm)','hdr'); I.set(r,3,'T (°C)','hdr'); r++; var p0=r;
    for(var i=0;i<8;i++){ var q=pts[i]; I.set(r,1,'point '+(i+1),'lbl'); I.set(r,2,q?q[0]:null,i===0&&!q?'miss':'inp','0'); I.set(r,3,q?q[1]:null,i===0&&!q?'miss':'inp','0.0'); r++; }
    W.name(nmY,'Inputs!'+A1(p0,2,true)+':'+A1(r-1,2,true)); W.name(nmT,'Inputs!'+A1(p0,3,true)+':'+A1(r-1,3,true)); };
  prof('Temperature gradient — positive (top hot)','TP_y','TP_t',TPa.pos); prof('Temperature gradient — negative (top cold)','TN_y','TN_t',TPa.neg);
  I.set(r++,1,'AS 5100.2 Cl 18.3 profile — enter depth (ascending) : temperature difference pairs; zero outside the entered depths. Blank = Missing — Flagged, no gradient applied.','note'); r++;
  /* load cases */
  I.set(r++,1,'9. Load cases (actions at the section)','sub'); I.set(r,1,'Quantity','hdr'); L.forEach(function(lc,j){ I.set(r,2+j,'LC'+(j+1),'hdr'); }); I.set(r,2+nL,'Unit','hdr'); r++;
  var LCR={}, lcq=[['name','Name','',''],['s','Station s along the girder chain','m','0.000'],['sec','Section: open / solid (end block)','',''],['Mnc','Mnc — SLS moment on the Super-T alone','kN·m','0.0'],['Ms','Ms* — SLS moment on the composite','kN·m','0.0'],['Ns','Ns* — SLS axial (tension +)','kN','0.0'],
    ['Mu','M* — ULS moment (sagging +)','kN·m','0.0'],['Nu','N* — ULS axial (tension +)','kN','0.0'],['Vu','V* — ULS shear','kN','0.0'],['Tu','T* — ULS torsion','kN·m','0.0'],['fscr','fscr — target bar stress for crack control (Table 8.6.2.1)','MPa','0'],['ftcr','ftcr — target tendon stress for crack control (Table 8.6.2.1)','MPa','0'],
    ['shOn','Apply deck differential shrinkage (1 = yes, 0 = no)','','0'],['Tsel','Temperature gradient (1 = positive, −1 = negative, 0 = none)','','0'],['Tf','Gradient factor (1.0 gradient lead, k1 with traffic lead)','','0.00']];
  lcq.forEach(function(q){ I.set(r,1,q[1],'lbl'); L.forEach(function(lc,j){ var v=q[0]==='name'?lc.name:(q[0]==='s'?lc.s:(q[0]==='sec'?(DG.res&&DG.res.lc[j]&&DG.res.lc[j].solid||(!DG.res&&dgLCType(lc))?'solid':'open'):(q[0]==='shOn'?(DG.opt&&DG.opt.dsh?1:0):(q[0]==='Tsel'?(lc.Tsel||0):(q[0]==='Tf'?(lc.Tf!==undefined?lc.Tf:1):lc[q[0]]))))); I.set(r,2+j,typeof v==='number'?+v.toFixed(4):v,'inp',q[3]); }); I.set(r,2+nL,q[2],'note'); LCR[q[0]]=r; r++; });
  I.set(r++,1,'Load-case actions filled from the model (construction stages CS2–CS6 + traffic envelope) unless edited. ULS relieving actions take the beneficial factor (Combos tab).','note');
  var LC=function(q,j){ return 'Inputs!'+A1(LCR[q],2+j,true); };

  /* ---------------- Section ---------------- */
  var S=W.sheet('Section',{0:2,1:34,2:13,3:11,4:11,5:7,6:11,7:7,8:11,9:11,10:11,11:9,12:9,13:7,14:11}); S.tab='FF5B9BD5'; r=0;
  S.set(r++,1,'Section — fibre strips, steel and section properties','sec'); r++;
  var sc=function(label,name,f,unit,note,fmt,kind){ S.set(r,1,label,'lbl'); S.set(r,2,F(f),kind||'calc',fmt); S.set(r,3,unit,'note'); S.set(r,4,note||'','fx'); S.merge(r,4,r,10); if(name) W.name(name,'Section!'+A1(r,2,true)); r++; };
  S.set(r++,1,'Derived scalars','sub');
  sc('Super-T depth H','H_g','MAX(R_y)','mm','= highest outline point','0.0'); sc('Overall depth D','D_tot','H_g+t_D','mm','D = H + t_D','0.0');
  sc('Strand breaking stress fpb','f_pb','MBL_kN*1000/A_p','MPa','fpb = MBL / Ap (Table 3.3.1)','0');
  S.set(r,1,'Super-T strips (rows generated)','lbl'); S.set(r,2,nG,'code','0'); S.set(r,4,'fixed at export','fx'); W.name('n_G','Section!'+A1(r,2,true)); r++;
  S.set(r,1,'Deck strips (rows generated)','lbl'); S.set(r,2,nD,'code','0'); S.set(r,4,'fixed at export','fx'); W.name('n_D','Section!'+A1(r,2,true)); r++;
  sc('Super-T strip thickness','hs_G','H_g/n_G','mm','','0.000'); sc('Deck strip thickness','hs_D','t_D/n_D','mm','','0.000');
  sc("α2 Super-T",'a2_g','MAX(0.67,MIN(0.85,0.85-0.0015*fc_g))','','0.85 − 0.0015 f\'c, 0.67…0.85 (Cl 8.1.3)','0.000'); sc("α2 deck",'a2_d','MAX(0.67,MIN(0.85,0.85-0.0015*fc_d))','','','0.000');
  sc("γ Super-T",'g_g','MAX(0.67,MIN(0.85,0.97-0.0025*fc_g))','','0.97 − 0.0025 f\'c, 0.67…0.85 (Cl 8.1.3)','0.000'); sc("γ deck",'g_d','MAX(0.67,MIN(0.85,0.97-0.0025*fc_d))','','','0.000');
  sc("f'ct.f Super-T",'fct_g','0.6*SQRT(fc_g)','MPa','0.6 √f\'c (Cl 3.1.1.3)','0.00'); sc("f'ct.f deck",'fct_d','0.6*SQRT(fc_d)','MPa','','0.00'); sc('0.25 √f\'c Super-T','f_25','0.25*SQRT(fc_g)','MPa','uncracked limit, Cl 8.6.2','0.00');
  r++; S.set(r++,1,'Outline boundaries for strip widths','sub');
  S.set(r,1,'Outer face points (R1…R7, sorted by y)','hdr'); S.set(r,2,'y','hdr'); S.set(r,3,'x','hdr'); r++; var o0=r;
  for(var k=0;k<7;k++){ S.set(r,1,'R'+(k+1),'lbl'); S.set(r,2,F('INDEX(R_y,'+(k+1)+')'),'calc','0.0'); S.set(r,3,F('INDEX(R_x,'+(k+1)+')'),'calc','0.0'); r++; }
  W.name('O_y','Section!'+A1(o0,2,true)+':'+A1(r-1,2,true)); W.name('O_x','Section!'+A1(o0,3,true)+':'+A1(r-1,3,true));
  S.set(r,1,'Inner face points (R12, R11, R10, R9, R8)','hdr'); S.set(r,2,'y','hdr'); S.set(r,3,'x','hdr'); r++; var i0=r;
  [12,11,10,9,8].forEach(function(k){ S.set(r,1,'R'+k,'lbl'); S.set(r,2,F('INDEX(R_y,'+k+')'),'calc','0.0'); S.set(r,3,F('INDEX(R_x,'+k+')'),'calc','0.0'); r++; });
  W.name('I_y','Section!'+A1(i0,2,true)+':'+A1(r-1,2,true)); W.name('I_x','Section!'+A1(i0,3,true)+':'+A1(r-1,3,true));
  /* polygon area check (shoelace on the half outline closed through (0,0)) */
  S.set(r,1,'Half-outline polygon (shoelace)','hdr'); S.set(r,2,'x','hdr'); S.set(r,3,'y','hdr'); S.set(r,4,'x next','hdr'); S.set(r,5,'y next','hdr'); r++; var p0=r;
  for(var k2=0;k2<13;k2++){ S.set(r,1,k2===0?'(0, 0)':'R'+k2,'lbl'); S.set(r,2,k2===0?0:F('INDEX(R_x,'+k2+')'),'calc','0.0'); S.set(r,3,k2===0?0:F('INDEX(R_y,'+k2+')'),'calc','0.0');
    S.set(r,4,k2===12?0:F('INDEX(R_x,'+(k2+1)+')'),'calc','0.0'); S.set(r,5,k2===12?0:F('INDEX(R_y,'+(k2+1)+')'),'calc','0.0'); r++; }
  var pr=function(c){ return 'Section!'+A1(p0,c,true)+':'+A1(r-1,c,true); };
  sc('Super-T area from the outline Ag','A_poly','ABS(SUMPRODUCT('+pr(2)+','+pr(5)+')-SUMPRODUCT('+pr(4)+','+pr(3)+'))','mm²','2 × half-polygon area (shoelace)','#,##0');
  r++;
  /* section properties (filled after the tables are placed: reserve rows) */
  var propRow=r; r+=32;
  /* concrete strips */
  S.set(r++,1,'Concrete strips (deck first, then Super-T) — y from the deck top','sub');
  ['Strip','y (mm)','h (mm)','y above soffit','seg.','x outer','seg.','x inner','b open (mm)','E (MPa)',"f'c",'α2','girder?','b solid (mm)','T+ (°C)','T− (°C)'].forEach(function(t,i){ S.set(r,1+i,t,'hdr'); }); r++;
  var c0=r;
  for(var jd=1;jd<=nD;jd++){ S.set(r,1,'D'+jd,'lbl'); S.set(r,2,F('('+jd+'-0.5)*hs_D'),'calc','0.00'); S.set(r,3,F('hs_D'),'calc','0.000'); S.set(r,9,F('W_d'),'calc','0.0'); S.set(r,10,F('E_d'),'calc','0'); S.set(r,11,F('fc_d'),'calc','0'); S.set(r,12,F('a2_d'),'calc','0.000'); S.set(r,13,0,'calc','0'); S.set(r,14,F('W_d'),'calc','0.0'); S.set(r,15,F(TI(A1(r,2),'TP_y','TP_t')),'calc','0.00'); S.set(r,16,F(TI(A1(r,2),'TN_y','TN_t')),'calc','0.00'); r++; }
  for(var ig=1;ig<=nG;ig++){ var yu=A1(r,4), io=A1(r,5), ii=A1(r,7), xo=A1(r,6), xi=A1(r,8);
    var itp=function(Y,Xn,idx){ return 'IFERROR(INDEX('+Xn+','+idx+')+(INDEX('+Xn+','+idx+'+1)-INDEX('+Xn+','+idx+'))*('+yu+'-INDEX('+Y+','+idx+'))/(INDEX('+Y+','+idx+'+1)-INDEX('+Y+','+idx+')),INDEX('+Xn+','+idx+'))'; };
    S.set(r,1,'G'+ig,'lbl'); S.set(r,2,F('t_D+('+ig+'-0.5)*hs_G'),'calc','0.00'); S.set(r,3,F('hs_G'),'calc','0.000'); S.set(r,4,F('H_g-('+ig+'-0.5)*hs_G'),'calc','0.00');
    S.set(r,5,F('MIN(MATCH('+yu+',O_y,1),6)'),'calc','0'); S.set(r,6,F(itp('O_y','O_x',io)),'calc','0.0');
    S.set(r,7,F('IF('+yu+'<INDEX(I_y,1),0,MIN(MATCH('+yu+',I_y,1),4))'),'calc','0'); S.set(r,8,F('IF('+ii+'=0,0,'+itp('I_y','I_x',ii)+')'),'calc','0.0');
    S.set(r,9,F('MAX(0,2*('+xo+'-'+xi+'))'),'calc','0.0'); S.set(r,10,F('E_g'),'calc','0'); S.set(r,11,F('fc_g'),'calc','0'); S.set(r,12,F('a2_g'),'calc','0.000'); S.set(r,13,1,'calc','0'); S.set(r,14,F('MAX(0,2*'+xo+')'),'calc','0.0'); S.set(r,15,F(TI(A1(r,2),'TP_y','TP_t')),'calc','0.00'); S.set(r,16,F(TI(A1(r,2),'TN_y','TN_t')),'calc','0.00'); r++; }
  var cr=function(c){ return 'Section!'+A1(c0,c,true)+':'+A1(r-1,c,true); };
  W.name('conY',cr(2)); W.name('conH',cr(3)); W.name('conBo',cr(9)); W.name('conBs',cr(14)); W.name('conE',cr(10)); W.name('conFc',cr(11)); W.name('conA2',cr(12)); W.name('conG',cr(13)); W.name('conTp',cr(15)); W.name('conTn',cr(16)); r++;
  /* bars */
  S.set(r++,1,'Reinforcement (Super-T rows, then deck layers) — y from the deck top','sub');
  ['Source','y (mm)','No.','A (mm²)','E (MPa)','fsy','α2·f\'c at bar','girder?','T+ (°C)','T− (°C)'].forEach(function(t,i){ S.set(r,1+i,t,'hdr'); }); r++; var b0=r;
  for(var kb=0;kb<nBR;kb++){ var gy='INDEX(GB_y,'+(kb+1)+')', gd='INDEX(GB_d,'+(kb+1)+')', gn='INDEX(GB_n,'+(kb+1)+')';
    S.set(r,1,'Super-T row '+(kb+1),'lbl'); S.set(r,2,F('IF('+gn+'>0,t_D+H_g-'+gy+',0)'),'calc','0.0'); S.set(r,3,F('N('+gn+')'),'calc','0'); S.set(r,4,F('N('+gn+')*PI()*N('+gd+')^2/4'),'calc','0.0');
    S.set(r,5,F('E_s'),'calc','0'); S.set(r,6,F('f_sy'),'calc','0'); S.set(r,7,F('a2_g*fc_g'),'calc','0.00'); S.set(r,8,1,'calc','0'); S.set(r,9,F(TI(A1(r,2),'TP_y','TP_t')),'calc','0.00'); S.set(r,10,F(TI(A1(r,2),'TN_y','TN_t')),'calc','0.00'); r++; }
  for(var kd=0;kd<nDB;kd++){ var df='INDEX(DB_f,'+(kd+1)+')', dd='INDEX(DB_d,'+(kd+1)+')', ds='INDEX(DB_s,'+(kd+1)+')', dc='INDEX(DB_c,'+(kd+1)+')', nn=A1(r,3);
    S.set(r,1,'Deck layer '+(kd+1),'lbl'); S.set(r,2,F('IF('+df+'="top",N('+dc+')+N('+dd+')/2,t_D-N('+dc+')-N('+dd+')/2)'),'calc','0.0'); S.set(r,3,F('IF(AND(N('+dd+')>0,N('+ds+')>0),INT(W_d/'+ds+'),0)'),'calc','0');
    S.set(r,4,F(nn+'*PI()*N('+dd+')^2/4'),'calc','0.0'); S.set(r,5,F('E_s'),'calc','0'); S.set(r,6,F('f_sy'),'calc','0'); S.set(r,7,F('a2_d*fc_d'),'calc','0.00'); S.set(r,8,0,'calc','0'); S.set(r,9,F(TI(A1(r,2),'TP_y','TP_t')),'calc','0.00'); S.set(r,10,F(TI(A1(r,2),'TN_y','TN_t')),'calc','0.00'); r++; }
  var bcr=function(c){ return 'Section!'+A1(b0,c,true)+':'+A1(r-1,c,true); };
  W.name('barY',bcr(2)); W.name('barA',bcr(4)); W.name('barE',bcr(5)); W.name('barFy',bcr(6)); W.name('barA2fc',bcr(7)); W.name('barG',bcr(8)); W.name('barTp',bcr(9)); W.name('barTn',bcr(10)); r++;
  /* tendons */
  S.set(r++,1,'Strands (rows) — y from the deck top; midspan set (columns 2–6) and the set effective at each load-case station (A, σpe, fpb per LC)','sub'); ['Source','y (mm)','No. on','A (mm²)','σpe (MPa)','Ep (MPa)','T+ (°C)','T− (°C)'].forEach(function(t,i){ S.set(r,1+i,t,'hdr'); });
  L.forEach(function(lc,j){ S.set(r,9+3*j,'A LC'+(j+1),'hdr'); S.set(r,10+3*j,'σpe LC'+(j+1),'hdr'); S.set(r,11+3*j,'fpb LC'+(j+1),'hdr'); }); r++; var t0=r;
  for(var ks=0;ks<nSR;ks++){ var sy='INDEX(S_y,'+(ks+1)+')', sn='INDEX(S_n,'+(ks+1)+')', ssp='INDEX(S_sp,'+(ks+1)+')';
    S.set(r,1,'Strand row '+(ks+1),'lbl'); S.set(r,2,F('IF(N('+sn+')>0,t_D+H_g-'+sy+',0)'),'calc','0.0'); S.set(r,3,F('N('+sn+')'),'calc','0'); S.set(r,4,F('N('+sn+')*A_p'),'calc','0.0'); S.set(r,5,F('N('+ssp+')'),'calc','0.0'); S.set(r,6,F('E_p'),'calc','0'); S.set(r,7,F(TI(A1(r,2),'TP_y','TP_t')),'calc','0.00'); S.set(r,8,F(TI(A1(r,2),'TN_y','TN_t')),'calc','0.00');
    L.forEach(function(lc,j){ var mn='INDEX('+STM('n',j)+','+(ks+1)+')', ms='INDEX('+STM('sp',j)+','+(ks+1)+')', mf='INDEX('+STM('fpb',j)+','+(ks+1)+')';
      S.set(r,9+3*j,F('IF(N('+sn+')>0,N('+mn+'),0)*A_p'),'calc','0.0'); S.set(r,10+3*j,F('N('+ms+')'),'calc','0.0'); S.set(r,11+3*j,F('IF(N('+mf+')>0,'+mf+',f_pb)'),'calc','0'); }); r++; }
  var tcr=function(c){ return 'Section!'+A1(t0,c,true)+':'+A1(r-1,c,true); };
  W.name('tenY',tcr(2)); W.name('tenA',tcr(4)); W.name('tenSp',tcr(5)); W.name('tenE',tcr(6)); W.name('tenTp',tcr(7)); W.name('tenTn',tcr(8));
  L.forEach(function(lc,j){ W.name('tA_'+(j+1),tcr(9+3*j)); W.name('tS_'+(j+1),tcr(10+3*j)); W.name('tF_'+(j+1),tcr(11+3*j)); });
  /* section properties (in the reserved rows) */
  var r2=r; r=propRow; S.set(r++,1,'Section properties','sub');
  sc('Open section: Super-T area from the strips','A_str','SUMPRODUCT(conBo*conH*conG)','mm²','Σ b·h (girder strips) — compare with the outline area','#,##0');
  sc('Open section: strip / outline area ratio','A_chk','A_str/A_poly','','should be ≈ 1.000','0.0000');
  sc('Solid end block: Super-T area from the strips','A_strS','SUMPRODUCT(conBs*conH*conG)','mm²','outline without the void','#,##0');
  sc('Strand force after losses Fp','F_p','SUMPRODUCT(tenA,tenSp)','N','Σ σpe·Ap','#,##0');
  sc('Strand force moment about the deck top','M_p','SUMPRODUCT(tenA,tenSp,tenY)','N·mm','','0.00E+00');
  sc('Super-T centroid below the deck top (open, alone)','y_g','(SUMPRODUCT(conE*conBo*conH*conG*conY)+SUMPRODUCT((barE-E_g)*barA*barG*barY)+SUMPRODUCT((tenE-E_g)*tenA*tenY))/(SUMPRODUCT(conE*conBo*conH*conG)+SUMPRODUCT((barE-E_g)*barA*barG)+SUMPRODUCT((tenE-E_g)*tenA))','mm','','0.0');
  sc('Strand eccentricity below the Super-T centroid (open)','ecc_p','M_p/F_p-y_g','mm','','0.0');
  sc('Deepest strand','y_pt','MAXIFS(tenY,tenA,">0")','mm','governs the tendon stress increment','0.0');
  sc('T+ at the deck top','Tz_p0',TI('0','TP_y','TP_t'),'°C','profile','0.00'); sc('T− at the deck top','Tz_n0',TI('0','TN_y','TN_t'),'°C','','0.00');
  sc('T+ at the Super-T top','Tz_pt',TI('t_D','TP_y','TP_t'),'°C','','0.00'); sc('T− at the Super-T top','Tz_nt',TI('t_D','TN_y','TN_t'),'°C','','0.00');
  sc('T+ at the soffit','Tz_pb',TI('D_tot','TP_y','TP_t'),'°C','','0.00'); sc('T− at the soffit','Tz_nb',TI('D_tot','TN_y','TN_t'),'°C','','0.00');
  S.set(r++,1,'Stiffness sums and the composite centroid depend on the section type, so they are calculated per load case on the SLS sheet.','note');
  r=r2;
  /* torsion geometry block, below the tables */
  r++; S.set(r++,1,'Shear and torsion geometry — open (Super-T trough closed by the deck) and solid end block','sub');
  var XO=function(y){ return '(P_Bb/2+w_s*('+y+'))'; }, YM='((P_tb/2+H_g+t_D/2)/2)';
  sc('Acp — area inside the outer perimeter (both)','A_cp','2*(P_Bb/2*D_tot+w_s*D_tot^2/2)','mm²','trapezoid between the outer web faces, soffit to deck top','#,##0');
  sc('uc — outer perimeter (both)','u_c','2*(P_Bb/2)+2*'+XO('D_tot')+'+2*D_tot*SQRT(1+w_s^2)','mm','','0.0');
  sc('bv — open: two webs','b_v_o','2*MIN(P_twT,P_twB)','mm','2 × minimum web thickness, Cl 8.2.1.5','0.0');
  sc('bv — solid: width at the top of the soffit chamfer','b_v_s','2*'+XO('P_scH'),'mm','Cl 8.2.1.5','0.0');
  sc('Ao — open: inside the shear-flow path','A_o_o','2*((H_g+t_D/2)-P_tb/2)*('+XO(YM)+'+(w_xiB+(w_xiT-w_xiB)*('+YM+'-w_yB)/(w_yT-w_yB)))/2','mm²','wall mid-lines: webs, bottom flange t_b/2, deck mid-depth','#,##0');
  [['o',''],['s','S']].forEach(function(T){ var k=T[0], z=T[1];
    sc('Closed-tie inset, sides ('+(k==='o'?'open':'solid')+')','a_s_'+k,'cov_s'+z+'+tv_d'+z+'/2','mm','cover + Ø/2','0.0'); sc('Closed-tie inset, deck top ('+(k==='o'?'open':'solid')+')','a_t_'+k,'cov_t'+z+'+tv_d'+z+'/2','mm','','0.0');
    var as='a_s_'+k, at='a_t_'+k;
    sc('Aoh — inside the closed-tie centreline ('+(k==='o'?'open':'solid')+')','A_oh_'+k,'2*((D_tot-'+at+')-'+as+')*('+XO('('+as+'+D_tot-'+at+')/2')+'-'+as+'/w_cs)','mm²','','#,##0');
    sc('uh — closed-tie perimeter ('+(k==='o'?'open':'solid')+')','u_h_'+k,'2*('+XO(as)+'-'+as+'/w_cs)+2*('+XO('D_tot-'+at)+'-'+as+'/w_cs)+2*((D_tot-'+at+')-'+as+')*SQRT(1+w_s^2)','mm','','0.0');
    sc('y1 — larger dimension of the closed tie ('+(k==='o'?'open':'solid')+')','y_1_'+k,'(D_tot-'+at+')-'+as,'mm','','0.0'); });
  sc('Ao — solid: 0.85 Aoh','A_o_s','0.85*A_oh_s','mm²','Standard — verify (solid section)','#,##0');
  /* ---------------- SLS ---------------- */
  var lcHead=function(Sh,row,c0,label){ Sh.set(row,1,label||'Symbol','hdr'); Sh.set(row,2,'Description','hdr'); Sh.set(row,3,'Formula','hdr'); Sh.set(row,4,'Unit','hdr'); Sh.set(row,5,'Ref.','hdr'); L.forEach(function(lc,j){ Sh.set(row,6+j,{f:'"LC'+(j+1)+' "&'+LC('name',j),str:1},'hdr'); }); };
  var SL=W.sheet('SLS',{0:2,1:16,2:42,3:46,4:8,5:12}); SL.tab='FF70AD47'; for(var jj=0;jj<nL;jj++) SL.widths[6+jj]=15; SL.freeze=[3,6]; r=0;
  SL.set(r++,1,'Serviceability — staged stresses and crack control (AS 5100.5 Cl 8.6.2)','sec'); r++; lcHead(SL,r++,6);
  var RS={};
  var SUBJ=function(j,str){ if(typeof str!=='string') return str; var sol='SLS!'+A1(RS.sol,6+j,true), pick=function(n){ return 'IF('+sol+'=1,'+n+'S,'+n+')'; };
    return str.replace(/\bconB\b/g,'(conBo+'+sol+'*(conBs-conBo))')
      .replace(/\btenA\b/g,'tA_'+(j+1)).replace(/\btenSp\b/g,'tS_'+(j+1)).replace(/\bf_pb\b/g,'tF_'+(j+1))
      .replace(/\bzCF\b/g,'(zTP*conTp+zTN*conTn+zSH*(1-conG))').replace(/\bzBF\b/g,'(zTP*barTp+zTN*barTn)').replace(/\bzCB\b/g,'(zTP*barTp+zTN*barTn+zSH*(1-barG))').replace(/\bzTF\b/g,'(zTP*tenTp+zTN*tenTn)').replace(/\bzEB\b/g,'(barG*E_g+(1-barG)*E_d)')
      .replace(/\b(g_EA|g_ES|g_EI|g_Det|c_EA|c_ES|c_EI|c_Det|y_c|y_bt|y_tb|F_p|M_p|y_pt|zTP|zTN|zSH|zNF|zMF|zFD|zFT|zFB)\b/g,function(m){ return RS[m]!==undefined?'SLS!'+A1(RS[m],6+j,true):m; })
      .replace(/\b(b_v|A_o|A_oh|u_h|y_1)\b/g,function(m){ return 'IF('+sol+'=1,'+m+'_s,'+m+'_o)'; })
      .replace(/\b(sv_d|sv_n|sv_s|tv_d|tv_n|tv_s|fsy_f|cov_s|cov_t|d_g)\b/g,function(m){ return pick(m); }); };
  var row=function(Sh,RM,key,sym,desc,fx,unit,ref,fn,kind,fmt){ Sh.set(r,1,sym,kind==='key'?'bold':'lbl'); Sh.set(r,2,desc,'lbl'); Sh.set(r,3,fx,'fx'); Sh.set(r,4,unit,'note'); Sh.set(r,5,ref,'note');
    L.forEach(function(lc,j){ var v=fn(j); if(typeof v==='object') v={f:SUBJ(j,v.f),str:v.str}; else v=F(SUBJ(j,v)); Sh.set(r,6+j,v,kind||'calc',fmt); }); if(key) RM[key]=r; r++; };
  var ref=function(RM,Sh,key,j){ return (Sh?Sh+'!':'')+A1(RM[key],6+j); };
  var sub=function(Sh,t){ Sh.set(r++,1,t,'sub'); Sh.merge(r-1,1,r-1,5+nL); };
  var s=function(key,j){ return A1(RS[key],6+j); };
  sub(SL,'Section type and stiffness of this load case');
  row(SL,RS,'sol','solid?','Section type (1 = solid end block, 0 = open span)','Inputs: section','','',function(j){ return 'IF('+LC('sec',j)+'="solid",1,0)'; },'calc','0');
  row(SL,RS,'F_p','Fp','Strand force after losses at this station','Σ σpe·Ap (bonded strands at the station)','N','',function(j){ return 'SUMPRODUCT(tenA,tenSp)'; },'calc','#,##0');
  row(SL,RS,'M_p','Mp','Strand force moment about the deck top','Σ σpe·Ap·y','N·mm','',function(j){ return 'SUMPRODUCT(tenA,tenSp,tenY)'; },'calc','0.00E+00');
  row(SL,RS,'y_pt','y strand','Deepest bonded strand at the station','governs the tendon stress increment','mm','',function(j){ return 'MAXIFS(tenY,tenA,">0")'; },'calc','0.0');
  row(SL,RS,'g_EA','ΣEA (stage 1)','Super-T concrete + bars, steel net of the concrete it displaces; strand holes deducted (strand force applied as Fp)','Σ E·b·h + Σ (Es − Ec)·As − Ec·ΣAp','N','',function(j){ return 'SUMPRODUCT(conE*conB*conH*conG)+SUMPRODUCT((barE-E_g)*barA*barG)-E_g*SUM(tenA)'; },'calc','0.00E+00');
  row(SL,RS,'g_ES','ΣEA·y (stage 1)','','','N·mm','',function(j){ return 'SUMPRODUCT(conE*conB*conH*conG*conY)+SUMPRODUCT((barE-E_g)*barA*barG*barY)-E_g*SUMPRODUCT(tenA,tenY)'; },'calc','0.00E+00');
  row(SL,RS,'g_EI','ΣEA·y² (stage 1)','','','N·mm²','',function(j){ return 'SUMPRODUCT(conE*conB*conH*conG*conY^2)+SUMPRODUCT((barE-E_g)*barA*barG*barY^2)-E_g*SUMPRODUCT(tenA,tenY,tenY)'; },'calc','0.00E+00');
  row(SL,RS,'g_Det','det (stage 1)','','ΣEA·ΣEAy² − (ΣEAy)²','','',function(j){ return 'g_EA*g_EI-g_ES^2'; },'calc','0.00E+00');
  row(SL,RS,'c_EA','ΣEA (composite)','All concrete, bars and strands; steel net of the concrete it displaces','Σ E·b·h + Σ (Es − Ec)·As + Σ (Ep − Ec)·Ap','N','',function(j){ return 'SUMPRODUCT(conE*conB*conH)+SUMPRODUCT((barE-zEB)*barA)+SUMPRODUCT((tenE-E_g)*tenA)'; },'calc','0.00E+00');
  row(SL,RS,'c_ES','ΣEA·y (composite)','','','N·mm','',function(j){ return 'SUMPRODUCT(conE*conB*conH*conY)+SUMPRODUCT((barE-zEB)*barA*barY)+SUMPRODUCT((tenE-E_g)*tenA*tenY)'; },'calc','0.00E+00');
  row(SL,RS,'c_EI','ΣEA·y² (composite)','','','N·mm²','',function(j){ return 'SUMPRODUCT(conE*conB*conH*conY^2)+SUMPRODUCT((barE-zEB)*barA*barY^2)+SUMPRODUCT((tenE-E_g)*tenA*tenY^2)'; },'calc','0.00E+00');
  row(SL,RS,'c_Det','det (composite)','','','','',function(j){ return 'c_EA*c_EI-c_ES^2'; },'calc','0.00E+00');
  row(SL,RS,'y_c','y_c','Composite centroid below the deck top (transformed, steel net of concrete)','moments are taken about this level','mm','',function(j){ return '(SUMPRODUCT(conE*conB*conH*conY)+SUMPRODUCT((barE-barG*E_g-(1-barG)*E_d)*barA*barY)+SUMPRODUCT((tenE-E_g)*tenA*tenY))/(SUMPRODUCT(conE*conB*conH)+SUMPRODUCT((barE-barG*E_g-(1-barG)*E_d)*barA)+SUMPRODUCT((tenE-E_g)*tenA))'; },'calc','0.0');
  row(SL,RS,'y_bt','y bar','Deepest bar in the tension half (y > y_c)','governs the bar stress increment','mm','',function(j){ return 'MAXIFS(barY,barA,">0",barY,">"&y_c)'; },'calc','0.0');
  row(SL,RS,'y_tb','y bar,top','Shallowest bar above the composite centroid (y < y_c)','governs the top-face increment','mm','',function(j){ return 'MINIFS(barY,barA,">0",barY,"<"&y_c)'; },'calc','0.0');
  sub(SL,'Free strains at the SLS (temperature gradient and deck differential shrinkage) — restrained by the composite section, stresses = E·(ε − ε_free)');
  row(SL,RS,'zTP','α·f (T+)','Free strain per °C of the positive profile','α·10⁻⁶ × factor if gradient = 1','1/°C','AS 5100.2 Cl 18.3',function(j){ return 'IF('+LC('Tsel',j)+'=1,N(T_al)*1E-6*N('+LC('Tf',j)+'),0)'; },'calc','0.00E+00');
  row(SL,RS,'zTN','α·f (T−)','Free strain per °C of the negative profile','α·10⁻⁶ × factor if gradient = −1','1/°C','AS 5100.2 Cl 18.3',function(j){ return 'IF('+LC('Tsel',j)+'=-1,N(T_al)*1E-6*N('+LC('Tf',j)+'),0)'; },'calc','0.00E+00');
  row(SL,RS,'zSH','ε_free,deck','Deck free strain relative to the girder','Inputs × switch','','',function(j){ return 'N('+LC('shOn',j)+')*N(eps_sh)'; },'calc','0.000E+00');
  row(SL,RS,'zNF','N_fr','Restraint force of the free strains','Σ E·A·ε_free (concrete) + Σ (Es·εs,free − Ec·εc,free)·As + Σ (Ep − Ec)·Ap·ε_free','N','',function(j){ return 'SUMPRODUCT(conE*conB*conH*zCF)+SUMPRODUCT(barA*(barE*zBF-zEB*zCB))+SUMPRODUCT(tenA*(tenE-E_g)*zTF)'; },'calc','#,##0');
  row(SL,RS,'zMF','M_fr','Restraint moment about the deck top','same × y','N·mm','',function(j){ return 'SUMPRODUCT(conE*conB*conH*zCF*conY)+SUMPRODUCT(barA*(barE*zBF-zEB*zCB)*barY)+SUMPRODUCT(tenA*(tenE-E_g)*zTF*tenY)'; },'calc','0.00E+00');
  row(SL,RS,'zFD','ε_free,dt','Free strain at the deck top','αf·T(0) + ε_free,deck','','',function(j){ return 'zTP*Tz_p0+zTN*Tz_n0+zSH'; },'calc','0.00E+00');
  row(SL,RS,'zFT','ε_free,gt','Free strain at the Super-T top','αf·T(t_D)','','',function(j){ return 'zTP*Tz_pt+zTN*Tz_nt'; },'calc','0.00E+00');
  row(SL,RS,'zFB','ε_free,gb','Free strain at the soffit','αf·T(D)','','',function(j){ return 'zTP*Tz_pb+zTN*Tz_nb'; },'calc','0.00E+00');
  sub(SL,'Inputs');
  row(SL,RS,'Mnc','Mnc','SLS moment on the Super-T alone','Inputs','kN·m','',function(j){ return LC('Mnc',j); },'calc','#,##0.0');
  row(SL,RS,'Ms','Ms*','SLS moment on the composite','Inputs','kN·m','',function(j){ return LC('Ms',j); },'calc','#,##0.0');
  row(SL,RS,'Ns','Ns*','SLS axial force (tension +)','Inputs','kN','',function(j){ return LC('Ns',j); },'calc','#,##0.0');
  row(SL,RS,'fscr','fscr','Target bar stress for crack control','Inputs','MPa','Table 8.6.2.1',function(j){ return LC('fscr',j); },'calc','0');
  row(SL,RS,'ftcr','ftcr','Target tendon stress for crack control','Inputs','MPa','Table 8.6.2.1',function(j){ return LC('ftcr',j); },'calc','0');
  sub(SL,'Stage 1 — Super-T alone: strand force after losses + Mnc (strain plane ε = ε0 + κ·y)');
  row(SL,RS,'e0g','ε0,1','Stage-1 strain at the deck-top level','[−Fp·ΣEAy² − ΣEAy·(Mnc − Mp)] / det','','',function(j){ return '(-F_p*g_EI-g_ES*('+s('Mnc',j)+'*1E6-M_p))/g_Det'; },'calc','0.00E+00');
  row(SL,RS,'kg','κ1','Stage-1 curvature (sagging +)','[ΣEA·(Mnc − Mp) + ΣEAy·Fp] / det','1/mm','',function(j){ return '(g_EA*('+s('Mnc',j)+'*1E6-M_p)+g_ES*F_p)/g_Det'; },'calc','0.00E+00');
  row(SL,RS,'s1t','σ1,top','Super-T top fibre stress (compression −)','Ec·(ε0,1 + κ1·t_D)','MPa','',function(j){ return 'E_g*('+s('e0g',j)+'+'+s('kg',j)+'*t_D)'; },'calc','0.00');
  row(SL,RS,'s1b','σ1,bot','Super-T soffit stress','Ec·(ε0,1 + κ1·D)','MPa','',function(j){ return 'E_g*('+s('e0g',j)+'+'+s('kg',j)+'*D_tot)'; },'calc','0.00');
  sub(SL,'Stage 2 — composite (uncracked): stage 1 locked in, Ms* and Ns* applied about y_c');
  row(SL,RS,'N1','N','Axial force','Ns*·1000','N','',function(j){ return s('Ns',j)+'*1000'; },'calc','#,##0');
  row(SL,RS,'Mt','Mtop','Moment about the deck top','Ms*·10⁶ + N·y_c','N·mm','',function(j){ return s('Ms',j)+'*1E6+'+s('N1',j)+'*y_c'; },'calc','0.00E+00');
  row(SL,RS,'e0s','ε0,2','Stage-2 strain at the deck top','[(N + N_fr)·ΣEAy² − ΣEAy·(Mtop + M_fr)]/det','','',function(j){ return '(('+s('N1',j)+'+zNF)*c_EI-c_ES*('+s('Mt',j)+'+zMF))/c_Det'; },'calc','0.00E+00');
  row(SL,RS,'ks','κ2','Stage-2 curvature','[ΣEA·(Mtop + M_fr) − ΣEAy·(N + N_fr)]/det','1/mm','',function(j){ return '(c_EA*('+s('Mt',j)+'+zMF)-c_ES*('+s('N1',j)+'+zNF))/c_Det'; },'calc','0.00E+00');
  row(SL,RS,'sdk','σt,deck','Deck top fibre stress','Ec,deck·(ε0,2 − ε_free,dt)','MPa','',function(j){ return 'E_d*('+s('e0s',j)+'-zFD)'; },'calc','0.00');
  row(SL,RS,'sgt','σt,ST','Super-T top fibre stress (total)','Ec·(ε1 + ε2 − ε_free) at y = t_D','MPa','',function(j){ return 'E_g*('+s('e0g',j)+'+'+s('kg',j)+'*t_D+'+s('e0s',j)+'+'+s('ks',j)+'*t_D-zFT)'; },'calc','0.00');
  row(SL,RS,'sb','σb','Super-T soffit stress (total)','Ec·(ε1 + ε2 − ε_free) at y = D','MPa','',function(j){ return 'E_g*('+s('e0g',j)+'+'+s('kg',j)+'*D_tot+'+s('e0s',j)+'+'+s('ks',j)+'*D_tot-zFB)'; },'key','0.00');
  row(SL,RS,'unc','σb ≤ 0.25√f\'c','Uncracked — crack control deemed satisfied','σb ≤ 0.25√f\'c','','Cl 8.6.2',function(j){ return {f:'IF('+s('sb',j)+'<=f_25,"yes","no")',str:1}; },'chk');
  sub(SL,'Decompression and cracking (linear in Ms*)');
  row(SL,RS,'c0','c0','Soffit stress-producing strain at Mtop = 0','ε0,1 + κ1·D + [(N + N_fr)(ΣEAy² − ΣEAy·D) + M_fr(ΣEA·D − ΣEAy)]/det − ε_free,gb','','',function(j){ return s('e0g',j)+'+'+s('kg',j)+'*D_tot+(('+s('N1',j)+'+zNF)*(c_EI-c_ES*D_tot)+zMF*(c_EA*D_tot-c_ES))/c_Det-zFB'; },'calc','0.00E+00');
  row(SL,RS,'c1','c1','Soffit strain per unit Mtop','(ΣEA·D − ΣEAy)/det','1/(N·mm)','',function(j){ return '(c_EA*D_tot-c_ES)/c_Det'; },'calc','0.00E+00');
  row(SL,RS,'Mdec','Mdec','Decompression moment (composite increment, soffit stress = 0)','(−c0/c1 − N·y_c)/10⁶','kN·m','',function(j){ return '(-'+s('c0',j)+'/'+s('c1',j)+'-'+s('N1',j)+'*y_c)/1E6'; },'calc','#,##0');
  row(SL,RS,'Mtd','Mtop,dec','Moment about the deck top at decompression','−c0/c1','N·mm','',function(j){ return '-'+s('c0',j)+'/'+s('c1',j); },'calc','0.00E+00');
  row(SL,RS,'e0d','ε0,dec','Strain at the deck top at decompression','[(N + N_fr)·ΣEAy² − ΣEAy·(Mtop,dec + M_fr)]/det','','',function(j){ return '(('+s('N1',j)+'+zNF)*c_EI-c_ES*('+s('Mtd',j)+'+zMF))/c_Det'; },'calc','0.00E+00');
  row(SL,RS,'kd','κdec','Curvature at decompression','[ΣEA·(Mtop,dec + M_fr) − ΣEAy·(N + N_fr)]/det','1/mm','',function(j){ return '(c_EA*('+s('Mtd',j)+'+zMF)-c_ES*('+s('N1',j)+'+zNF))/c_Det'; },'calc','0.00E+00');
  row(SL,RS,'Mcr','Mcr','Cracking moment, sagging (Mnc + increment to soffit = f\'ct.f)','Mnc + [(f\'ct.f/Ec − c0)/c1 − N·y_c]/10⁶','kN·m','Cl 3.1.1.3',function(j){ return s('Mnc',j)+'+((fct_g/E_g-'+s('c0',j)+')/'+s('c1',j)+'-'+s('N1',j)+'*y_c)/1E6'; },'calc','#,##0');
  row(SL,RS,'McrH','Mcr,hog','Cracking moment, hogging (deck top = f\'ct.f)','Mnc + [((N + N_fr)·ΣEAy² − (f\'ct.f/Ec,d + ε_free,dt)·det)/ΣEAy − M_fr − N·y_c]/10⁶','kN·m','Cl 3.1.1.3',function(j){ return s('Mnc',j)+'+((('+s('N1',j)+'+zNF)*c_EI-(fct_d/E_d+zFD)*c_Det)/c_ES-zMF-'+s('N1',j)+'*y_c)/1E6'; },'calc','#,##0');
  sub(SL,'Crack control by steel stress increment (cracked section, bisection in SLS_iter)');
  var RSI={};
  row(SL,RS,'MalB','Ms (bars)','Composite moment at which the bar increment reaches fscr','SLS_iter','kN·m','Table 8.6.2.1',function(j){ return 'SLS_iter!'+A1(0,0); },'calc','#,##0');
  row(SL,RS,'MalT','Ms (tendons)','Composite moment at which the tendon increment reaches ftcr','SLS_iter','kN·m','Table 8.6.2.1',function(j){ return 'SLS_iter!'+A1(0,0); },'calc','#,##0');
  row(SL,RS,'Mal','Ms,allow','Allowable SLS moment (composite increment, Super-T stage Mnc already locked in)','MIN(bars, tendons)','kN·m','Cl 8.6.2',function(j){ return 'MIN('+s('MalB',j)+','+s('MalT',j)+')'; },'key','#,##0');
  row(SL,RS,'uS','Ms*/Ms,allow','SLS utilisation (at constant axial force)','Ms* / Ms,allow','','Cl 8.6.2',function(j){ return 'MAX(0,'+s('Ms',j)+'/'+s('Mal',j)+')'; },'key','0.000');
  row(SL,RS,'okS','Crack control','Section adequate for crack control','uncracked, or Ms* ≤ Ms,allow','','Cl 8.6.2',function(j){ return {f:'IF(OR('+s('unc',j)+'="yes",'+s('Ms',j)+'<='+s('Mal',j)+'),"OK","NG")',str:1}; },'chk');
  sub(SL,'Crack control at the top face (hogging side) — decompression of the top face, then the steel increment above the composite centroid');
  row(SL,RS,'tA0','a0','Super-T top stress-producing strain at Mtop = 0','ε1(t_D) + [(N + N_fr)(ΣEAy² − ΣEAy·t_D) + M_fr(ΣEA·t_D − ΣEAy)]/det − ε_free,gt','','',function(j){ return s('e0g',j)+'+'+s('kg',j)+'*t_D+(('+s('N1',j)+'+zNF)*(c_EI-c_ES*t_D)+zMF*(c_EA*t_D-c_ES))/c_Det-zFT'; },'calc','0.00E+00');
  row(SL,RS,'tMg','Mtop,0 ST','Mtop at which the Super-T top stress = 0','−a0·det/(ΣEA·t_D − ΣEAy)','N·mm','',function(j){ return '-'+s('tA0',j)+'*c_Det/(c_EA*t_D-c_ES)'; },'calc','0.00E+00');
  row(SL,RS,'tMd','Mtop,0 deck','Mtop at which the deck top stress = 0','[(N + N_fr)·ΣEAy² − ε_free,dt·det]/ΣEAy − M_fr','N·mm','',function(j){ return '(('+s('N1',j)+'+zNF)*c_EI-zFD*c_Det)/c_ES-zMF'; },'calc','0.00E+00');
  row(SL,RS,'MtdT','Mtop,dec,top','Top face decompresses first (larger Mtop)','MAX of the two','N·mm','',function(j){ return 'MAX('+s('tMg',j)+','+s('tMd',j)+')'; },'calc','0.00E+00');
  row(SL,RS,'MdecT','Mdec,top','Decompression moment of the top face (composite increment)','(Mtop,dec,top − N·y_c)/10⁶','kN·m','Cl 8.6.2',function(j){ return '('+s('MtdT',j)+'-'+s('N1',j)+'*y_c)/1E6'; },'key','#,##0');
  row(SL,RS,'e0dT','ε0,dec,top','Strain at the deck top at top-face decompression','','','',function(j){ return '(('+s('N1',j)+'+zNF)*c_EI-c_ES*('+s('MtdT',j)+'+zMF))/c_Det'; },'calc','0.00E+00');
  row(SL,RS,'kdT','κdec,top','Curvature at top-face decompression','','1/mm','',function(j){ return '(c_EA*('+s('MtdT',j)+'+zMF)-c_ES*('+s('N1',j)+'+zNF))/c_Det'; },'calc','0.00E+00');
  row(SL,RS,'MalTb','Ms,top (bars)','Composite moment at which the top-bar increment reaches fscr','SLS_iter','kN·m','Table 8.6.2.1',function(j){ return '0'; },'calc','#,##0');
  row(SL,RS,'MalTt','Ms,top (tendons)','Composite moment at which a strand above y_c reaches ftcr (none → not governing)','SLS_iter','kN·m','Table 8.6.2.1',function(j){ return '0'; },'calc','#,##0');
  row(SL,RS,'MalTop','Ms,allow,top','Allowable hogging-side SLS moment','MAX(bars, tendons)','kN·m','Cl 8.6.2',function(j){ return 'MAX('+s('MalTb',j)+','+s('MalTt',j)+')'; },'key','#,##0');
  row(SL,RS,'okT','Top face','Top-face crack control','Ms* ≥ Mdec,top (not decompressed) or Ms* ≥ Ms,allow,top','','Cl 8.6.2',function(j){ return {f:'IF('+s('Ms',j)+'>='+s('MdecT',j)+',"OK",IF('+s('Ms',j)+'>='+s('MalTop',j)+',"OK","NG"))',str:1}; },'chk');
  SL.okng(A1(RS.okS,6)+':'+A1(RS.okS,5+nL)); SL.okng(A1(RS.okT,6)+':'+A1(RS.okT,5+nL));
  /* ---------------- SLS_iter ---------------- */
  var SI=W.sheet('SLS_iter',{0:2,1:24,2:14,3:14,4:14,5:14,6:3,7:24,8:14,9:14,10:14,11:14}); SI.tab='FFA9D08E'; r=0;
  SI.set(r++,1,'Cracked-section bisection — curvature κ such that the steel stress increment above decompression equals the target','sec');
  SI.set(r++,1,'For each target: ε0 = εtarget − κ·y_target; concrete carries no tension; N(κ) is found from all strips, bars and strands; the bisection drives N(κ) − N to 0.','note'); SI.merge(r-1,1,r-1,11); r++;
  /* concrete in tension carries nothing; steel net of the concrete it displaces where that concrete is in compression; stresses from (strain − free strain) */
  var Nfun=function(E0,K,eg,kg,withY){ var st='conE*('+E0+'+'+K+'*conY+conG*('+eg+'+'+kg+'*conY)-zCF)', y=withY?'*conY':'', yb=withY?'*barY':'', yt=withY?'*tenY':'';
    var eb='('+E0+'+'+K+'*barY+barG*('+eg+'+'+kg+'*barY))', ec='('+eb+'-zCB)', et='('+E0+'+'+K+'*tenY+'+eg+'+'+kg+'*tenY-zTF)';
    return 'SUMPRODUCT(conB*conH*('+st+'-ABS('+st+'))/2'+y+')+SUMPRODUCT(barA*(barE*('+eb+'-zBF)-zEB*('+ec+'-ABS('+ec+'))/2)'+yb+')+SUMPRODUCT(tenA*(tenSp+tenE*('+E0+'+'+K+'*tenY-zTF)-E_g*('+et+'-ABS('+et+'))/2)'+yt+')'; };
  L.forEach(function(lc,j){
    var top=r; SI.set(r++,1,{f:'"LC'+(j+1)+' "&'+LC('name',j),str:1},'bold');
    [['bars',1,'y_bt','fscr','E_s','MalB',0],['tendons',7,'y_pt','ftcr','E_p','MalT',0],['top-face bars',1,'y_tb','fscr','E_s','MalTb',1],['top-face strands',7,'MINIFS(tenY,tenA,">0",tenY,"<"&y_c)','ftcr','E_p','MalTt',1]].forEach(function(T){ var c0=T[1], rr=r, TOP=T[6]===1;
      var eg='SLS!'+A1(RS.e0g,6+j,true), kg='SLS!'+A1(RS.kg,6+j,true), e0d='SLS!'+A1(RS[TOP?'e0dT':'e0d'],6+j,true), kd='SLS!'+A1(RS[TOP?'kdT':'kd'],6+j,true), N1='SLS!'+A1(RS.N1,6+j,true);
      SI.set(rr,c0,'Target: '+T[0],'sub'); SI.set(rr,c0+1,null,'sub'); SI.set(rr,c0+2,null,'sub'); SI.set(rr,c0+3,null,'sub'); SI.set(rr,c0+4,null,'sub'); rr++;
      SI.set(rr,c0,'y target (mm)','lbl'); var yT=SI.set(rr,c0+1,F(SUBJ(j,T[2])),'calc','0.0'); rr++;
      SI.set(rr,c0,'stress increment target (MPa)','lbl'); var fT=SI.set(rr,c0+1,F('SLS!'+A1(RS[T[3]],6+j,true)),'calc','0'); rr++;
      SI.set(rr,c0,'ε target = ε0,dec + κdec·y + f/E','lbl'); var eT=SI.set(rr,c0+1,F(e0d+'+'+kd+'*'+yT+'+'+fT+'/'+T[4]),'calc','0.00E+00'); rr++;
      ['iter','κ lo','κ hi','κ mid','N(κ) − N'].forEach(function(h,i){ SI.set(rr,c0+i,h,'hdr'); }); rr++;
      var yTa=yT.replace(/([A-Z]+)(\d+)/,'$$$1$$$2'), eTa=eT.replace(/([A-Z]+)(\d+)/,'$$$1$$$2');
      for(var it=0;it<NIT_S;it++){ var lo=A1(rr,c0+1), hi=A1(rr,c0+2), mid=A1(rr,c0+3), pl=A1(rr-1,c0+1), ph=A1(rr-1,c0+2), pm=A1(rr-1,c0+3), pf=A1(rr-1,c0+4);
        SI.set(rr,c0,it+1,'txt','0');
        if(!TOP){ SI.set(rr,c0+1,F(it===0?kd:'IF('+pf+'>0,'+pm+','+pl+')'),'calc','0.00E+00'); SI.set(rr,c0+2,F(it===0?kd+'+1E-5':'IF('+pf+'>0,'+ph+','+pm+')'),'calc','0.00E+00'); }
        else { SI.set(rr,c0+1,F(it===0?kd+'-1E-5':'IF('+pf+'>0,'+pl+','+pm+')'),'calc','0.00E+00'); SI.set(rr,c0+2,F(it===0?kd:'IF('+pf+'>0,'+pm+','+ph+')'),'calc','0.00E+00'); }
        SI.set(rr,c0+3,F('('+lo+'+'+hi+')/2'),'calc','0.00E+00'); SI.set(rr,c0+4,F(SUBJ(j,Nfun('('+eTa+'-'+mid+'*'+yTa+')',mid,eg,kg,false)+'-'+N1)),'calc','0.00E+00'); rr++; }
      var km=A1(rr-1,c0+3,true);
      SI.set(rr,c0,'κ (converged)','lbl'); SI.set(rr,c0+1,F(km),'calc','0.00E+00'); rr++;
      SI.set(rr,c0,'N residual (N)','lbl'); SI.set(rr,c0+1,F(A1(rr-2,c0+4)),'calc','0.0'); rr++;
      SI.set(rr,c0,'Total moment at target (kN·m, about y_c)','lbl'); var mtot=SI.set(rr,c0+1,F(SUBJ(j,'('+Nfun('('+eTa+'-'+km+'*'+yTa+')',km,eg,kg,true)+'-'+N1+'*y_c)/1E6')),'calc','#,##0'); rr++;
      SI.set(rr,c0,'Composite increment = total − Mnc (kN·m)','bold'); var mref=SI.set(rr,c0+1,F(T[0]==='top-face strands'?SUBJ(j,'IF(COUNTIFS(tenA,">0",tenY,"<"&y_c)=0,-1E9,'+mtot+'-SLS!'+A1(RS.Mnc,6+j,true)+')'):mtot+'-SLS!'+A1(RS.Mnc,6+j,true)),'key','#,##0'); rr++;
      SL.cells[RS[T[5]]+','+(6+j)].v=F('SLS_iter!'+mref);
      if(c0===7) r=rr+2; });
  });
  /* ---------------- ULS ---------------- */
  var UL=W.sheet('ULS',{0:2,1:16,2:42,3:46,4:8,5:12}); UL.tab='FFED7D31'; for(var j2=0;j2<nL;j2++) UL.widths[6+j2]=15; UL.freeze=[3,6]; r=0;
  UL.set(r++,1,'Ultimate — bending (AS 5100.5 Cl 8.1): rectangular stress block, strain compatibility','sec'); r++; lcHead(UL,r++,6);
  var RU={}, u=function(key,j){ return A1(RU[key],6+j); };
  sub(UL,'Inputs');
  row(UL,RU,'Mu','M*','Applied ultimate moment (sagging +)','Inputs','kN·m','',function(j){ return LC('Mu',j); },'calc','#,##0.0');
  row(UL,RU,'Nu','N*','Applied ultimate axial force (tension +)','Inputs','kN','',function(j){ return LC('Nu',j); },'calc','#,##0.0');
  sub(UL,'Section response');
  row(UL,RU,'f','face','Compression face (1 = deck top / sagging, 0 = soffit / hogging)','IF(M* ≥ 0, 1, 0)','','',function(j){ return 'IF('+u('Mu',j)+'>=0,1,0)'; },'calc','0');
  row(UL,RU,'gam','γ','Stress-block depth factor of the compression-face concrete','deck γ if sagging, Super-T γ if hogging','','Cl 8.1.3',function(j){ return 'IF('+u('f',j)+'=1,g_d,g_g)'; },'calc','0.000');
  row(UL,RU,'dmax','do','Depth of the deepest steel from the compression face','MAX steel depth','mm','',function(j){ return 'IF('+u('f',j)+'=1,MAX(MAXIFS(barY,barA,">0"),MAXIFS(tenY,tenA,">0")),D_tot-MIN(MINIFS(barY,barA,">0"),MINIFS(tenY,tenA,">0")))'; },'calc','0.0');
  row(UL,RU,'dn','dn','Neutral-axis depth for ΣF = N*','ULS_iter','mm','',function(j){ return '0'; },'calc','0.0');
  row(UL,RU,'kuo','kuo','Neutral-axis parameter','dn / do','','Cl 8.1.5',function(j){ return u('dn',j)+'/'+u('dmax',j); },'calc','0.0000');
  row(UL,RU,'kok','kuo ≤ 0.36','Ductility','','','Cl 8.1.5',function(j){ return {f:'IF('+u('kuo',j)+'<=0.36,"OK","NG")',str:1}; },'chk');
  row(UL,RU,'phb','φb','Bending capacity reduction factor','MAX(0.6, MIN(0.8, 1.19 − 13·kuo/12))','','Table 2.3.2',function(j){ return 'MAX(0.6,MIN(0.8,1.19-13*'+u('kuo',j)+'/12))'; },'calc','0.000');
  row(UL,RU,'Nub','Nub','Axial force at the balanced point (εs = 0.0025 at do)','ULS_iter','kN','Table 2.3.2',function(j){ return '0'; },'calc','#,##0');
  row(UL,RU,'phi','φ','Capacity reduction factor at N*','φb if N* ≥ 0; else 0.6 + (φb − 0.6)(1 − N*/Nub), 0.6 below Nub','','Table 2.3.2',function(j){ return 'IF('+u('Nu',j)+'>=0,'+u('phb',j)+',IF('+u('Nu',j)+'<='+u('Nub',j)+',0.6,0.6+('+u('phb',j)+'-0.6)*(1-'+u('Nu',j)+'/'+u('Nub',j)+')))'; },'calc','0.000');
  row(UL,RU,'Mun','Mu','Nominal moment capacity at N*','Σ F·(y − y_c)','kN·m','Cl 8.1',function(j){ return '0'; },'calc','#,##0');
  row(UL,RU,'phMu','φMu','Design moment capacity','φ · Mu','kN·m','Cl 8.1.5',function(j){ return u('phi',j)+'*'+u('Mun',j); },'key','#,##0');
  sub(UL,'Minimum strength');
  row(UL,RU,'Mcr','Mcr','Cracking moment (SLS sheet)','sagging: soffit at f\'ct.f; hogging: deck top','kN·m','Cl 3.1.1.3',function(j){ return 'IF('+u('f',j)+'=1,SLS!'+A1(RS.Mcr,6+j)+',SLS!'+A1(RS.McrH,6+j)+')'; },'calc','#,##0');
  row(UL,RU,'Muo','Muo','Pure bending capacity (N = 0)','ULS_iter','kN·m','',function(j){ return '0'; },'calc','#,##0');
  row(UL,RU,'Mmin','Muo,min','Minimum strength requirement','1.2 · Mcr','kN·m','Cl 8.1.5 (verify)',function(j){ return '1.2*'+u('Mcr',j); },'calc','#,##0');
  row(UL,RU,'okm','Muo ≥ Muo,min','Minimum strength','','','',function(j){ return {f:'IF(IF('+u('f',j)+'=1,'+u('Muo',j)+'>='+u('Mmin',j)+','+u('Muo',j)+'<='+u('Mmin',j)+'),"OK","NG")',str:1}; },'chk');
  row(UL,RU,'uB','M*/φMu','ULS bending utilisation','|M*| / |φMu|','','',function(j){ return 'ABS('+u('Mu',j)+')/ABS('+u('phMu',j)+')'; },'key','0.000');
  row(UL,RU,'okB','M* ≤ φMu','Bending strength','','','Cl 8.1',function(j){ return {f:'IF('+u('uB',j)+'<=1,"OK","NG")',str:1}; },'chk');
  UL.okng(A1(RU.kok,6)+':'+A1(RU.okB,5+nL));
  /* ---------------- ULS_iter ---------------- */
  var UI=W.sheet('ULS_iter',{0:2,1:26,2:14,3:14,4:14,5:14,6:3,7:26,8:14,9:14,10:14,11:14}); UI.tab='FFF4B183'; r=0;
  UI.set(r++,1,'Neutral-axis bisection (geometric) — ΣF(dn) = N; concrete α2·f\'c over γ·dn, bars elastic-plastic, strands by the Mattock-type curve','sec');
  UI.set(r++,1,'z = depth from the compression face; strand strain = −εcu(dn − z)/dn + εpe, εpe = σpe/Ep − (stage-1 concrete strain at the strand).','note'); UI.merge(r-1,1,r-1,11); r++;
  var Ffun=function(DN,f,gam,eg,kg,withM){ var Z='('+f+'*conY+(1-'+f+')*(D_tot-conY))', Z1='('+Z+'-conH/2)', Z2='('+Z+'+conH/2)', BL='('+gam+'*'+DN+')';
    var TOP='(('+Z2+'+'+BL+'-ABS('+Z2+'-'+BL+'))/2)', OV='((('+TOP+'-'+Z1+')+ABS('+TOP+'-'+Z1+'))/2)', ZM='(('+Z1+'+'+TOP+')/2)', YM='('+f+'*'+ZM+'+(1-'+f+')*(D_tot-'+ZM+'))';
    var ZB='('+f+'*barY+(1-'+f+')*(D_tot-barY))', S0='(barE*(-e_cu*('+DN+'-'+ZB+')/'+DN+'))', S1='(('+S0+'+barFy-ABS('+S0+'-barFy))/2)', SB='(('+S1+'-barFy+ABS('+S1+'+barFy))/2)', FB='('+SB+'+('+ZB+'<'+BL+')*('+SB+'<0)*barA2fc)';
    var ZT='('+f+'*tenY+(1-'+f+')*(D_tot-tenY))', ET='(-e_cu*('+DN+'-'+ZT+')/'+DN+'+tenSp/tenE-('+eg+'+'+kg+'*tenY))', AE='ABS('+ET+')', FF='(tenE*'+AE+'*(pc_A+(1-pc_A)/(1+(pc_B*'+AE+')^pc_C)^(1/pc_C)))', FC='(('+FF+'+f_pb-ABS('+FF+'-f_pb))/2)', ST='(SIGN('+ET+')*'+FC+')';
    if(!withM) return '-SUMPRODUCT(conA2*conFc*conB*'+OV+')+SUMPRODUCT(barA*'+FB+')+SUMPRODUCT(tenA*'+ST+')';
    return '(-SUMPRODUCT(conA2*conFc*conB*'+OV+'*('+YM+'-y_c))+SUMPRODUCT(barA*'+FB+'*(barY-y_c))+SUMPRODUCT(tenA*'+ST+'*(tenY-y_c)))/1E6'; };
  L.forEach(function(lc,j){
    UI.set(r++,1,{f:'"LC'+(j+1)+' "&'+LC('name',j),str:1},'bold');
    var f='ULS!'+A1(RU.f,6+j,true), gam='ULS!'+A1(RU.gam,6+j,true), eg='SLS!'+A1(RS.e0g,6+j,true), kg='SLS!'+A1(RS.kg,6+j,true), rEnd=r;
    [['N = N*',1,'ULS!'+A1(RU.Nu,6+j,true)+'*1000','dn','Mun'],['N = 0 (pure bending)',7,'0','','Muo']].forEach(function(T){ var c0=T[1], rr=r;
      UI.set(rr,c0,T[0],'sub'); for(var q=1;q<5;q++) UI.set(rr,c0+q,null,'sub'); rr++;
      ['iter','dn lo','dn hi','dn mid','ΣF − N (N)'].forEach(function(h,i){ UI.set(rr,c0+i,h,'hdr'); }); rr++;
      for(var it=0;it<NIT_U;it++){ var lo=A1(rr,c0+1), hi=A1(rr,c0+2), mid=A1(rr,c0+3), pl=A1(rr-1,c0+1), ph=A1(rr-1,c0+2), pm=A1(rr-1,c0+3), pf=A1(rr-1,c0+4);
        UI.set(rr,c0,it+1,'txt','0'); UI.set(rr,c0+1,F(it===0?'1':'IF('+pf+'>0,'+pm+','+pl+')'),'calc','0.000'); UI.set(rr,c0+2,F(it===0?'50*D_tot':'IF('+pf+'>0,'+ph+','+pm+')'),'calc','0.000');
        UI.set(rr,c0+3,F('SQRT('+lo+'*'+hi+')'),'calc','0.000'); UI.set(rr,c0+4,F(SUBJ(j,Ffun(mid,f,gam,eg,kg,false)+'-'+T[2])),'calc','0.0'); rr++; }
      var dn=A1(rr-1,c0+3,true);
      UI.set(rr,c0,'dn (converged, mm)','lbl'); var dref=UI.set(rr,c0+1,F(dn),'calc','0.00'); rr++;
      UI.set(rr,c0,'Moment about y_c (kN·m)','bold'); var mref=UI.set(rr,c0+1,F(SUBJ(j,Ffun(dn,f,gam,eg,kg,true))),'key','#,##0'); rr++;
      if(T[3]) UL.cells[RU.dn+','+(6+j)].v=F('ULS_iter!'+dref);
      UL.cells[RU[T[4]]+','+(6+j)].v=F('ULS_iter!'+mref);
      if(c0===1){ UI.set(rr,c0,'Nub: ΣF at dn = εcu/(εcu + 0.0025)·do (kN)','lbl'); var nub=UI.set(rr,c0+1,F(SUBJ(j,'('+Ffun('(e_cu/(e_cu+0.0025)*ULS!'+A1(RU.dmax,6+j,true)+')',f,gam,eg,kg,false)+')/1000')),'calc','#,##0'); UL.cells[RU.Nub+','+(6+j)].v=F('ULS_iter!'+nub); rr++; }
      rEnd=Math.max(rEnd,rr); });
    r=rEnd+2; });
  /* ---------------- Shear ---------------- */
  var SH=W.sheet('Shear',{0:2,1:16,2:42,3:52,4:8,5:12}); SH.tab='FF9E7BC0'; for(var j3=0;j3<nL;j3++) SH.widths[6+j3]=15; SH.freeze=[3,6]; r=0;
  SH.set(r++,1,'Ultimate — shear and torsion (AS 5100.5 Cl 8.2, general method)','sec'); r++; lcHead(SH,r++,6);
  var RV={}, v=function(key,j){ return A1(RV[key],6+j); }, rdy=function(j,ex){ return 'IF('+v('rdy',j)+'="yes",'+ex+',"-")'; };
  sub(SH,'Inputs and readiness');
  row(SH,RV,'V','V*','Applied ultimate shear','Inputs','kN','',function(j){ return LC('Vu',j); },'calc','#,##0.0');
  row(SH,RV,'T','T*','Applied ultimate torsion','Inputs','kN·m','Cl 8.2.1.2',function(j){ return LC('Tu',j); },'calc','#,##0.0');
  row(SH,RV,'M','M*','Concurrent ultimate moment','Inputs','kN·m','',function(j){ return LC('Mu',j); },'calc','#,##0.0');
  row(SH,RV,'N','N*','Concurrent axial force (tension +)','Inputs','kN','',function(j){ return LC('Nu',j); },'calc','#,##0.0');
  row(SH,RV,'rdy','Ready?','All shear / torsion detailing entered','sv_d, sv_n, sv_s, tv_d, tv_n, tv_s, fsy.f, covers > 0','','',function(j){ return {f:'IF(AND(N(sv_d)>0,N(sv_n)>0,N(sv_s)>0,N(tv_d)>0,N(tv_n)>0,N(tv_s)>0,N(fsy_f)>0,N(cov_s)>0,N(cov_t)>0),"yes","inputs missing")',str:1}; },'chk');
  sub(SH,'Section parameters');
  row(SH,RV,'f','face','Flexural compression face (1 = top)','IF(M* ≥ 0, 1, 0)','','',function(j){ return 'IF('+v('M',j)+'>=0,1,0)'; },'calc','0');
  var TS=function(j,arr){ var f=v('f',j); return '(('+f+'=1)*('+arr+'>D_tot/2)+('+f+'=0)*('+arr+'<D_tot/2))'; };
  row(SH,RV,'Ast','Ast','Tension-side bars (in the tension half of D)','Σ A, bars in the tension half','mm²','',function(j){ return 'SUMPRODUCT(barA*'+TS(j,'barY')+')'; },'calc','#,##0');
  row(SH,RV,'Apt','Apt','Tension-side strands','Σ A, strands in the tension half','mm²','',function(j){ return 'SUMPRODUCT(tenA*'+TS(j,'tenY')+')'; },'calc','#,##0');
  row(SH,RV,'Act','Act','Concrete area on the tension side','Σ b·h in the tension half','mm²','',function(j){ return 'SUMPRODUCT(conB*conH*'+TS(j,'conY')+')'; },'calc','#,##0');
  row(SH,RV,'spo','σpo','Strand stress when the surrounding concrete is at zero strain','Ep·εpe, tension-side strands','MPa','',function(j){ return 'IF('+v('Apt',j)+'>0,SUMPRODUCT(tenA*tenE*(tenSp/tenE-(SLS!'+A1(RS.e0g,6+j)+'+SLS!'+A1(RS.kg,6+j)+'*tenY))*'+TS(j,'tenY')+')/'+v('Apt',j)+',0)'; },'calc','0.0');
  var Z=function(j,arr){ return '('+v('f',j)+'*'+arr+'+(1-'+v('f',j)+')*(D_tot-'+arr+'))'; };
  row(SH,RV,'d','d','Depth to the tension-side steel resultant (A·fy weighted)','Σ A·fy·z / Σ A·fy','mm','',function(j){ return '(SUMPRODUCT(barA*barFy*'+Z(j,'barY')+'*'+TS(j,'barY')+')+SUMPRODUCT(tenA*f_pb*'+Z(j,'tenY')+'*'+TS(j,'tenY')+'))/(SUMPRODUCT(barA*barFy*'+TS(j,'barY')+')+SUMPRODUCT(tenA*f_pb*'+TS(j,'tenY')+'))'; },'calc','0.0');
  row(SH,RV,'dv','dv','Effective shear depth','MAX(0.72·D, 0.9·d)','mm','Cl 8.2.1.9',function(j){ return 'MAX(0.72*D_tot,0.9*'+v('d',j)+')'; },'calc','0.0');
  row(SH,RV,'bv','bv','Effective web width','Section sheet (2 × min. web thickness)','mm','Cl 8.2.1.5',function(j){ return 'b_v'; },'calc','0.0');
  row(SH,RV,'AsvS','Asv/s','Vertical legs provided (shear set + both legs of the closed ties)','sv_n·π·sv_d²/4/sv_s + 2·tv_n·π·tv_d²/4/tv_s','mm²/mm','',function(j){ return 'IF(N(sv_s)*N(tv_s)>0,sv_n*PI()*sv_d^2/4/sv_s+2*tv_n*PI()*tv_d^2/4/tv_s,0)'; },'calc','0.000');
  row(SH,RV,'AswS','Asw/s','Closed-tie bar area per unit length','tv_n·π·tv_d²/4/tv_s','mm²/mm','',function(j){ return 'IF(N(tv_s)>0,tv_n*PI()*tv_d^2/4/tv_s,0)'; },'calc','0.000');
  row(SH,RV,'AsvO','Asv,sh/s','Shear-only fitments','sv_n·π·sv_d²/4/sv_s','mm²/mm','',function(j){ return 'IF(N(sv_s)>0,sv_n*PI()*sv_d^2/4/sv_s,0)'; },'calc','0.000');
  sub(SH,'General method');
  row(SH,RV,'Teq','Teq','Torsion as an equivalent wall shear','0.9·T*·uh/(2·Ao)','kN','',function(j){ return rdy(j,'0.9*'+v('T',j)+'*1E6*u_h/(2*A_o)/1000'); },'calc','#,##0');
  row(SH,RV,'Veff','Veff','Shear including torsion','√[(V* − Pv)² + Teq²]','kN','',function(j){ return rdy(j,'SQRT(MAX('+v('V',j)+'-P_v,0)^2+'+v('Teq',j)+'^2)'); },'calc','#,##0');
  row(SH,RV,'num','num','Numerator of εx','|M*|/dv + Veff + 0.5N* − Apt·σpo','N','',function(j){ return rdy(j,'ABS('+v('M',j)+')*1E6/'+v('dv',j)+'+'+v('Veff',j)+'*1000+0.5*'+v('N',j)+'*1000-'+v('Apt',j)+'*'+v('spo',j)); },'calc','#,##0');
  row(SH,RV,'ex','εx','Longitudinal strain at mid-depth','num/[2(EsAst + EpApt)], + EcAct if negative; −0.2e-3 … 3e-3','','Cl 8.2.4.4',function(j){ var n=v('num',j); return rdy(j,'MAX(-0.0002,MIN(0.003,IF('+n+'/(2*(E_s*'+v('Ast',j)+'+E_p*'+v('Apt',j)+'))<0,'+n+'/(2*(E_s*'+v('Ast',j)+'+E_p*'+v('Apt',j)+'+E_g*'+v('Act',j)+')),'+n+'/(2*(E_s*'+v('Ast',j)+'+E_p*'+v('Apt',j)+')))))'); },'calc','0.00E+00');
  row(SH,RV,'th','θv','Compression strut angle','29 + 7000·εx','deg','Cl 8.2.4.2',function(j){ return rdy(j,'29+7000*'+v('ex',j)); },'calc','0.00');
  row(SH,RV,'cot','cot θv','','1/TAN(θv)','','',function(j){ return rdy(j,'1/TAN(RADIANS('+v('th',j)+'))'); },'calc','0.0000');
  row(SH,RV,'AsvMin','Asv,min/s','Minimum shear reinforcement','0.08·√f\'c·bv/fsy.f','mm²/mm','Cl 8.2.1.7',function(j){ return rdy(j,'0.08*SQRT(fc_g)*b_v/fsy_f'); },'calc','0.000');
  row(SH,RV,'minV','Shear detailing','Asv/s ≥ Asv,min/s','','','Cl 8.2.1.7',function(j){ return {f:rdy(j,'IF('+v('AsvS',j)+'>='+v('AsvMin',j)+',"OK","NG")'),str:1}; },'chk');
  row(SH,RV,'kv','kv','Concrete shear factor','0.4/(1 + 1500εx) × [1300/(1000 + kdg·dv) if Asv < Asv,min], kdg = MAX(0.8, 32/(16 + dg))','','Cl 8.2.4.2',function(j){ return rdy(j,'0.4/(1+1500*'+v('ex',j)+')*IF('+v('AsvS',j)+'>='+v('AsvMin',j)+',1,1300/(1000+MAX(0.8,32/(16+d_g))*'+v('dv',j)+'))'); },'calc','0.0000');
  row(SH,RV,'Vuc','φVuc','Concrete contribution','φ·kv·bv·dv·MIN(√f\'c, 8)','kN','Cl 8.2.4.1',function(j){ return rdy(j,'phi_v*'+v('kv',j)+'*b_v*'+v('dv',j)+'*MIN(SQRT(fc_g),8)/1000'); },'calc','#,##0');
  row(SH,RV,'AswR','Asw,req/s','Closed-tie legs needed for torsion (not available for shear)','T*/(φ·fsy.f·2Ao·cot θv)','mm²/mm','Cl 8.2.5.6',function(j){ return rdy(j,'IF(AND('+v('T',j)+'>0,A_o>0),'+v('T',j)+'*1E6/(phi_v*fsy_f*2*A_o*'+v('cot',j)+'),0)'); },'calc','0.000');
  row(SH,RV,'AsvN','Asv,net/s','Vertical legs left for shear','Asv,sh/s + 2·MAX(0, Asw/s − Asw,req/s)','mm²/mm','',function(j){ return rdy(j,v('AsvO',j)+'+2*MAX(0,'+v('AswS',j)+'-'+v('AswR',j)+')'); },'calc','0.000');
  row(SH,RV,'Vus','φVus','Shear reinforcement contribution','φ·(Asv,net/s)·fsy.f·dv·cot θv','kN','Cl 8.2.5.2',function(j){ return rdy(j,'phi_v*'+v('AsvN',j)+'*fsy_f*'+v('dv',j)+'*'+v('cot',j)+'/1000'); },'calc','#,##0');
  row(SH,RV,'Vmax','φVu.max','Web-crushing limit','φ·0.55·f\'c·bv·dv·cot θ/(1 + cot²θ)','kN','Cl 8.2.3.3',function(j){ return rdy(j,'phi_v*0.55*fc_g*b_v*'+v('dv',j)+'*'+v('cot',j)+'/(1+'+v('cot',j)+'^2)/1000'); },'calc','#,##0');
  row(SH,RV,'Tus','φTus','Torsion reinforcement contribution','φ·(Asw/s)·fsy.f·2Ao·cot θv','kN·m','Cl 8.2.5.6',function(j){ return rdy(j,'phi_v*'+v('AswS',j)+'*fsy_f*2*A_o*'+v('cot',j)+'/1E6'); },'calc','#,##0');
  row(SH,RV,'Tcr','φTcr','Factored cracking torsion','φ·0.33·√f\'c·Acp²/uc','kN·m','',function(j){ return rdy(j,'phi_v*0.33*SQRT(fc_g)*A_cp^2/u_c/1E6'); },'calc','#,##0');
  row(SH,RV,'AswMin','Asw,min/s','Minimum torsion reinforcement','0.2·y1/fsy.f','mm²/mm','Cl 8.2.5.5',function(j){ return rdy(j,'0.2*y_1/fsy_f'); },'calc','0.000');
  row(SH,RV,'minT','Torsion detailing','Asw/s ≥ Asw,min/s','','','Cl 8.2.5.5',function(j){ return {f:rdy(j,'IF('+v('AswS',j)+'>='+v('AswMin',j)+',"OK","NG")'),str:1}; },'chk');
  row(SH,RV,'Ftd','Ftd','Longitudinal tension demand','|M*|/(φb·dv) + 0.5N*/φ + cot θ·√[(V*/φ − Pv − 0.5Vus)² + (0.45·uh·T*/(2Ao·φ))²], φb = 0.8','kN','Cl 8.2.7',function(j){ return rdy(j,'(ABS('+v('M',j)+')*1E6/(0.8*'+v('dv',j)+')+0.5*'+v('N',j)+'*1000/phi_v+'+v('cot',j)+'*SQRT(MAX('+v('V',j)+'*1000/phi_v-P_v*1000-0.5*'+v('Vus',j)+'*1000/phi_v,0)^2+(0.45*u_h*'+v('T',j)+'*1E6/(2*A_o*phi_v))^2))/1000'); },'calc','#,##0');
  row(SH,RV,'Ftp','Ft,cap','Longitudinal tension capacity (strand stress limited by the station value)','Ast·fsy + Σ Ap·fpb,station (tension side)','kN','Cl 8.2.7',function(j){ return rdy(j,'('+v('Ast',j)+'*f_sy+SUMPRODUCT(tenA*f_pb*'+TS(j,'tenY')+'))/1000'); },'calc','#,##0');
  sub(SH,'Utilisations');
  row(SH,RV,'uCr','Crushing','Web crushing','Veff / φVu.max','','Cl 8.2.3.1',function(j){ return rdy(j,v('Veff',j)+'/'+v('Vmax',j)); },'key','0.000');
  row(SH,RV,'uV','Shear','Shear','Veff / φ(Vuc + Vus)','','Cl 8.2.3.1',function(j){ return rdy(j,v('Veff',j)+'/('+v('Vuc',j)+'+'+v('Vus',j)+')'); },'key','0.000');
  row(SH,RV,'uT','Torsion','Torsion','T* / φTus','','',function(j){ return rdy(j,v('T',j)+'/'+v('Tus',j)); },'key','0.000');
  row(SH,RV,'uL','Longitudinal','Longitudinal reinforcement','Ftd / Ft,cap','','Cl 8.2.7',function(j){ return rdy(j,v('Ftd',j)+'/'+v('Ftp',j)); },'key','0.000');
  row(SH,RV,'u','Governing','Governing shear / torsion utilisation','MAX of the above','','',function(j){ return rdy(j,'MAX('+v('uCr',j)+','+v('uV',j)+','+v('uT',j)+','+v('uL',j)+')'); },'key','0.000');
  row(SH,RV,'okV','Shear / torsion','Section adequate','governing ≤ 1 and minimum steel OK','','',function(j){ return {f:rdy(j,'IF(AND('+v('u',j)+'<=1,'+v('minV',j)+'="OK",'+v('minT',j)+'="OK"),"OK","NG")'),str:1}; },'chk');
  SH.okng(A1(RV.minV,6)+':'+A1(RV.okV,5+nL));
  /* ---------------- Summary ---------------- */
  var SM=W.sheet('Summary',{0:2,1:40,2:14}); SM.tab='FF2F3B4C'; for(var j4=0;j4<nL;j4++) SM.widths[3+j4]=16; r=0;
  SM.set(r++,1,'Summary — utilisations and checks','sec'); r++;
  SM.set(r,1,'Check','hdr'); SM.set(r,2,'Clause','hdr'); L.forEach(function(lc,j){ SM.set(r,3+j,{f:'"LC'+(j+1)+' "&'+LC('name',j),str:1},'hdr'); }); r++;
  var smRows=[['SLS: Ms*/Ms,allow','Cl 8.6.2','SLS',RS.uS,'0.000'],['SLS: crack control','Cl 8.6.2','SLS',RS.okS,''],['SLS: top face crack control','Cl 8.6.2','SLS',RS.okT,''],['ULS: M*/φMu','Cl 8.1','ULS',RU.uB,'0.000'],['ULS: kuo ≤ 0.36','Cl 8.1.5','ULS',RU.kok,''],['ULS: minimum strength','Cl 8.1.5','ULS',RU.okm,''],
    ['Web crushing','Cl 8.2.3.1','Shear',RV.uCr,'0.000'],['Shear φ(Vuc+Vus)','Cl 8.2.3.1','Shear',RV.uV,'0.000'],['Torsion','Cl 8.2.5.6','Shear',RV.uT,'0.000'],['Longitudinal steel','Cl 8.2.7','Shear',RV.uL,'0.000'],['Shear / torsion overall','Cl 8.2','Shear',RV.okV,'']];
  var sm0=r; smRows.forEach(function(q){ SM.set(r,1,q[0],'lbl'); SM.set(r,2,q[1],'note'); L.forEach(function(lc,j){ SM.set(r,3+j,{f:q[2]+'!'+A1(q[3],6+j),str:!q[4]},q[4]?'key':'chk',q[4]); }); r++; });
  SM.set(r,1,'Maximum utilisation (all numeric checks)','bold'); L.forEach(function(lc,j){ SM.set(r,3+j,F('MAX('+[0,3,6,7,8,9].map(function(i){ return 'N('+A1(sm0+i,3+j)+')'; }).join(',')+')'),'key','0.000'); }); r++;
  SM.set(r,1,'Overall','bold'); var ov=r; L.forEach(function(lc,j){ SM.set(r,3+j,{f:'IF(COUNTIF('+A1(sm0,3+j)+':'+A1(r-2,3+j)+',"NG")>0,"NG",IF(COUNTIF('+A1(sm0,3+j)+':'+A1(r-2,3+j)+',"-")>0,"OK (shear not checked)","OK"))',str:1},'chk'); }); r++;
  SM.okng(A1(sm0,3)+':'+A1(ov,2+nL));
  r++; SM.set(r++,1,'Exported '+new Date().toISOString().slice(0,16).replace('T',' ')+' — girder G'+(DG.gi+1)+', prestress at '+Q.time,'note');
  /* ---------------- Needs Review ---------------- */
  var NR=W.sheet('Needs Review',{0:2,1:6,2:110}); NR.tab='FFC00000'; r=0; NR.set(r++,1,'Needs review — Missing / Flagged items','sec'); r++;
  var fl=[]; (DG.warn||[]).forEach(function(w){ fl.push(w.replace(/<[^>]+>/g,'').replace(/&ne;/g,'≠').replace(/&sup2;/g,'²').replace(/&Oslash;/g,'Ø')); });
  if(!Q.dbars.some(function(b){ return b.d>0&&b.s>0; })) fl.push('Deck longitudinal reinforcement not entered — deck reinforcement drawing is not in the BR13A set.');
  if(d.ex) fl.push('Shear / torsion detailing are the reference spreadsheet example values, not BR13A.'); else if(!(d.svd>0&&d.tvd>0)) fl.push('Shear / torsion detailing (fitments, covers, fsy.f) not entered — the Shear sheet shows "-".');
  fl.push('fscr / ftcr per load case from AS 5100.5 Table 8.6.2.1 for the bars near the tension face — Standard, verify.');
  if(!(DG.temp&&DG.temp.alpha>0&&(DG.temp.pos||DG.temp.neg))) fl.push('Temperature gradient profile and α not entered (AS 5100.2 Cl 18.3) — Missing, Flagged; no gradient applied.');
  if(!(Q.gird&&Q.gird.Ld>0)) fl.push('Development length Ld not entered — strand stress beyond the transmission length taken as fpb at the station (Inputs 4d). Missing, Flagged.');
  fl.push('Barrier weight in the SDL is Missing — Flagged (Loads tab); load cases filled from the model exclude it.');
  fl.push('Effective flange width checked in the dashboard (bef = Bt + 0.2a against the deck width carried by the girder) — full deck width effective; Standard, verify.');
  fl.push('Strand stress at ultimate uses a Mattock-type curve — method, verify. Clause references are for navigation; verify against the standard.');
  fl.forEach(function(t,i){ NR.set(r,1,i+1,'txt','0'); NR.set(r++,2,t,'txt'); });
  /* save */
  var blob=W.blob(), a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='BR13A_SuperT_G'+(DG.gi+1)+'_AS5100-5_check.xlsx'; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },500);
  DG.lastXL=blob; return blob;
}
