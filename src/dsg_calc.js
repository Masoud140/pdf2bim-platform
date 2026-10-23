/* ===== shared calculation lines: used by the Analysis detail panel, the Word report and the HTML report ===== */
function dgCalcLines(kind,o,lc){
  var B=o.B, X=o.X, In=X.info, Dd=In.tD+In.H, tr=o.tr, sh=o.sh, Qs=o.Q, lim=DG.trLim, G=dgGirdPar(), f_=function(v,d){ return anFmt(v,d===undefined?1:d); }, e_=function(v){ return dgE(v); };
  var lc_=lim.c>0?-lim.c:null, lt_=lim.t!==null&&lim.t!==''?+lim.t:null, s2=o.sv?o.sv.s:{e0:0,k:0};
  switch(kind){
  case 'transfer': if(!tr||tr.why) return [{sub:'Not calculated: '+((tr&&tr.why)||'—')}]; return [{d:'Strand force before transfer',e:'P_{0} = j·MBL·(1 − rel)',r:f_(G.P0,1),u:'kN/strand',ref:'Hog tab'},{d:'Strands bonded at the station',e:'transmission / debond factor > 0',r:String(tr.nb)},
        {d:'Force after elastic shortening',e:'P_{i} = Σ A_{p}E_{p}(ε_{0} + κy + ε_{pi})',r:f_(tr.P0,0),u:'kN'},{d:'Self weight at the station',e:'w = A_{g}·γ_{c}, γ_{c} = '+tr.rho+' kN/m³',r:f_(tr.w,2),u:'kN/m',ref:'Cl 3.1.3 (Hog tab)'},
        {d:'Self-weight moment at transfer',e:'girder on supports '+f_(G.asup,3)+' m from each end',r:f_(tr.Msw,0),u:'kN·m'},
        {d:'Top fibre stress',e:'σ_{i,top} = E_{c,i}(ε_{0} + κy_{top})',s:tr.Ect+' × ('+e_(tr.sg.e0)+' + '+e_(tr.sg.k)+' × '+f_(tr.tD,0)+')',r:f_(tr.top,2),u:'MPa'},
        {d:'Soffit stress',e:'σ_{i,bot} = E_{c,i}(ε_{0} + κy_{bot})',s:tr.Ect+' × ('+e_(tr.sg.e0)+' + '+e_(tr.sg.k)+' × '+f_(tr.tD+tr.H,0)+')',r:f_(tr.bot,2),u:'MPa'},
        {d:'Compression check',e:'min σ ≥ −'+(typeof dgLimTxt==='function'?dgLimTxt('tc')||'limit':'limit'),r:lc_===null?'limit missing':f_(Math.min(tr.top,tr.bot),2)+(Math.min(tr.top,tr.bot)>=lc_?' ≥ ':' < ')+f_(lc_,2),ok:lc_===null?undefined:Math.min(tr.top,tr.bot)>=lc_,ref:'Cl 8.1.4.2'},
        {d:'Tension check',e:'max σ ≤ '+(typeof dgLimTxt==='function'?dgLimTxt('tt')||'limit':'limit'),r:lt_===null?'limit missing':f_(Math.max(tr.top,tr.bot),2)+(Math.max(tr.top,tr.bot)<=lt_?' ≤ ':' > ')+f_(lt_,2),ok:lt_===null?undefined:Math.max(tr.top,tr.bot)<=lt_,ref:'Cl 8.6.2(a)(i)'}];
  case 'sls': return [{sub:'Stage 1 — Super-T alone: prestress after losses + M_{nc}'},
      {d:'Stage-1 strain plane',e:'equilibrium: ΣF = 0, ΣM = M_{nc} = '+f_(lc.Mnc,0)+' kN·m (strand force P = '+f_(B.Pt,0)+' kN applied)',r:'ε_{0} = '+e_(o.sg.e0)+', κ = '+e_(o.sg.k)},
      {d:'Super-T top fibre',e:'σ_{1,top} = E_{c}(ε_{0} + κ·t_{D})',s:In.Eg+' × ('+e_(o.sg.e0)+' + '+e_(o.sg.k)+' × '+f_(In.tD,0)+')',r:f_(o.g1top,2),u:'MPa'},
      {d:'Super-T soffit',e:'σ_{1,bot} = E_{c}(ε_{0} + κ·D)',s:In.Eg+' × ('+e_(o.sg.e0)+' + '+e_(o.sg.k)+' × '+f_(Dd,0)+')',r:f_(o.g1bot,2),u:'MPa'},
      {sub:'Stage 2 — composite: M_{s}* on the composite section, stage 1 locked in'},
      {d:'Composite strain plane',e:'increment for M_{s}* = '+f_(lc.Ms,0)+' kN·m about y_{c}',r:'ε_{0} = '+e_(s2.e0)+', κ = '+e_(s2.k)},
      {d:'Deck top',e:'σ_{t,deck} = E_{c,deck}·ε_{0,2}',s:In.Ed+' × '+e_(s2.e0),r:f_(o.sv.deckTop,2),u:'MPa'},
      {d:'Super-T top (total)',e:'σ_{t,ST} = σ_{1,top} + E_{c}(ε_{0,2} + κ_{2}t_{D})',r:f_(o.sv.girTop,2),u:'MPa'},
      {d:'Super-T soffit (total)',e:'σ_{b} = σ_{1,bot} + E_{c}(ε_{0,2} + κ_{2}D)',s:f_(o.g1bot,2)+' + '+In.Eg+' × ('+e_(s2.e0)+' + '+e_(s2.k)+' × '+f_(Dd,0)+')',r:f_(o.sv.girBot,2),u:'MPa',k:true},
      {d:'Uncracked limit',e:'0.25√f\'_{c} = 0.25 × √'+In.fcg,r:f_(B.fct25,2),u:'MPa',ref:'Cl 8.6.2'},
      {d:'Crack control deemed satisfied?',e:'σ_{b} ≤ 0.25√f\'_{c}',r:o.uncr?'yes (uncracked)':'no — check increments',ok:o.uncr?true:undefined,ref:'Cl 8.6.2'}];
  case 'crack': return [{d:'Decompression moment',e:'composite M at which σ_{b} = 0',r:f_(o.Mdec,0),u:'kN·m'},
      {d:'Bar stress increment at M_{s}*',e:'Δσ_{s} = σ_{s}(M_{s}*) − σ_{s}(M_{dec}), cracked section',r:f_(o.inc.b>-1e8?o.inc.b:0,1)+' ≤ '+lc.fscr,u:'MPa',ref:'Table 8.6.2.1'},
      {d:'Tendon stress increment at M_{s}*',e:'Δσ_{p} = σ_{p}(M_{s}*) − σ_{p}(M_{dec})',r:f_(o.inc.t>-1e8?o.inc.t:0,1)+' ≤ '+lc.ftcr,u:'MPa',ref:'Table 8.6.2.1'},
      {d:'Allowable SLS moment',e:'largest M with Δσ_{s} ≤ f_{scr} = '+lc.fscr+' and Δσ_{p} ≤ f_{tcr} = '+lc.ftcr+' MPa',s:'increments at M_{s,allow}: '+f_(o.qa.b,0)+' / '+f_(o.qa.t,0)+' MPa',r:f_(o.Mal,0),u:'kN·m',ref:'Cl 8.6.2',k:true},
      {d:'Utilisation',e:'M_{s}*/M_{s,allow} = '+f_(lc.Ms,0)+' / '+f_(o.Mal,0),r:f_(Math.max(0,o.uS),3),ok:o.okS,ref:'Cl 8.6.2'}];
  case 'uls': var Pu=dgUltParts(o.Su,o.dn,o.face,o.yc); return [{d:'Compression face',e:o.face==='top'?'deck top (M* ≥ 0, sagging)':'soffit (hogging)',r:''},
      {d:'Stress-block factors',e:'α_{2} = 0.85 − 0.0015f\'_{c}; γ = 0.97 − 0.0025f\'_{c}',r:'γ = '+f_(Pu.g,3),ref:'Cl 8.1.3'},
      {d:'Neutral-axis depth',e:'ΣF = N* = '+f_(lc.Nu,0)+' kN (strain compatibility, ε_{cu} = 0.003)',r:f_(o.dn,1),u:'mm'},
      {d:'Concrete compression',e:'C = Σα_{2}f\'_{c}·b·Δz over γd_{n} = '+f_(Pu.blk,1)+' mm',r:f_(-Pu.C,0),u:'kN'},
      {d:'Bar force',e:'T_{s} = Σσ_{s}A_{s}, |σ_{s}| ≤ f_{sy}',r:f_(Pu.Tb,0),u:'kN'},
      {d:'Strand force',e:'T_{p} = Σσ_{p}A_{p}, σ_{p} = '+f_(Pu.spMin,0)+'…'+f_(Pu.spMax,0)+' MPa',r:f_(Pu.Tp,0),u:'kN'},
      {d:'Nominal capacity',e:'M_{u} = ΣF(y − y_{c})',s:f_(Pu.Cm,0)+' + '+f_(Pu.Tbm,0)+' + '+f_(Pu.Tpm,0),r:f_(o.Mu,0),u:'kN·m',ref:'Cl 8.1'},
      {d:'Neutral-axis parameter',e:'k_{uo} = d_{n}/d_{o}',s:f_(o.dn,1)+' / '+f_(o.dn/o.kuo,1),r:f_(o.kuo,4)+' ≤ 0.36',ok:o.kuo<=0.36,ref:'Cl 8.1.5'},
      {d:'Capacity reduction factor',e:'φ = 1.19 − 13k_{uo}/12, 0.6 ≤ φ ≤ 0.8',s:'1.19 − 13 × '+f_(o.kuo,4)+' / 12 = '+f_(1.19-13*o.kuo/12,3),r:f_(o.phi,3),ref:'Table 2.3.2'},
      {d:'Design capacity',e:'φM_{u}',s:f_(o.phi,3)+' × '+f_(o.Mu,0),r:f_(o.phiMu,0),u:'kN·m',ref:'Cl 8.1.5',k:true},
      {d:'Cracking moment',e:'M_{cr}: '+(o.face==='top'?'soffit':'deck top')+' at f\'_{ct.f} (staged)',r:f_(o.face==='top'?o.Mcr:o.McrH,0),u:'kN·m',ref:'Cl 3.1.1.3'},
      {d:'Minimum strength',e:'M_{uo} ≥ 1.2M_{cr}',s:f_(o.Muo,0)+' vs '+f_(o.Muomin,0),r:o.okMin?'satisfied':'not satisfied',ok:o.okMin,ref:'Cl 8.1.5 (verify)'},
      {d:'Utilisation',e:'|M*|/|φM_{u}| = '+f_(lc.Mu,0)+' / '+f_(o.phiMu,0),r:f_(o.uB,3),ok:o.uB<=1,k:true}];
  case 'shear': if(!sh) return [{sub:'Not calculated — '+String(o.shWhy||'detailing missing').replace(/<[^>]+>/g,'')+' (Missing — Flagged)'}]; var ct=sh.cot; return [{sub:'Section and detailing'},
        {d:'Effective web width',e:'b_{v} ('+(o.solid?'solid: width above the soffit chamfer':'2 × min. web thickness')+')',r:f_(Qs.bv,1),u:'mm',ref:'Cl 8.2.1.5'},
        {d:'Tension steel resultant depth',e:'d = ΣA·f_{y}·z/ΣA·f_{y} (tension half)',r:f_(o.dres,0),u:'mm'},
        {d:'Effective shear depth',e:'d_{v} = max(0.72D, 0.9d)',s:'max(0.72 × '+f_(Dd,0)+', 0.9 × '+f_(o.dres,0)+')',r:f_(o.dv,1),u:'mm',ref:'Cl 8.2.1.9'},
        {d:'Torsion geometry',e:'A_{cp}, u_{c}, A_{o}, A_{oh}, u_{h}',r:f_(Qs.Acp/1e6,3)+' m², '+f_(Qs.uc,0)+', '+f_(Qs.Ao/1e6,3)+' m², '+f_(Qs.Aoh/1e6,3)+' m², '+f_(Qs.uh,0)},
        {d:'Shear reinforcement',e:'A_{sv}/s (all vertical legs) ; A_{sw}/s (closed ties)',r:f_(sh.Asv*1000,0)+' ; '+f_(Qs.AswS*1000,0),u:'mm²/m'},
        {sub:'General method'},
        {d:'Equivalent shear',e:'V_{eff} = √[(V* − P_{v})² + (0.9T*u_{h}/2A_{o})²]',s:'√['+f_(lc.Vu,0)+'² + '+f_(sh.Teq/1e3,0)+'²]',r:f_(sh.Veff/1e3,0),u:'kN'},
        {d:'Longitudinal strain',e:'ε_{x} = [|M*|/d_{v} + V_{eff} + 0.5N* − A_{pt}σ_{po}] / '+sh.denUsed,s:'['+f_(Math.abs(lc.Mu)*1e3/o.dv,0)+' + '+f_(sh.Veff/1e3,0)+' + '+f_(0.5*lc.Nu,0)+' − '+f_(Qs.Apt*Qs.spo/1e3,0)+'] kN / '+e_((sh.ex<0?sh.den2:sh.den1)/1e3)+' kN',r:e_(sh.ex),ref:'Cl 8.2.4.4'},
        {d:'Strut angle',e:'θ_{v} = 29 + 7000ε_{x}',r:f_(sh.th,2),u:'°',ref:'Cl 8.2.4.2'},
        {d:'Concrete factor',e:'k_{v} = 0.4/(1 + 1500ε_{x})'+(sh.minV?'':' × 1300/(1000 + k_{dg}d_{v})'),r:f_(sh.kv,4),ref:'Cl 8.2.4.2'},
        {d:'Concrete contribution',e:'φV_{uc} = φk_{v}b_{v}d_{v}√f\'_{c}',s:'0.7 × '+f_(sh.kv,4)+' × '+f_(Qs.bv,1)+' × '+f_(o.dv,1)+' × '+f_(Math.min(Math.sqrt(Qs.fc),8),3)+' / 1000',r:f_(0.7*sh.Vuc/1e3,0),u:'kN',ref:'Cl 8.2.4.1'},
        {d:'Tie legs needed for torsion',e:'(A_{sw}/s)_{req} = T*/(φf_{sy.f}·2A_{o}·cot θ_{v}) per wall; shear and torsion steel are additive',r:f_((sh.AswReq||0)*1000,0)+' of '+f_(Qs.AswS*1000,0),u:'mm²/m',ok:(sh.AswReq||0)<=Qs.AswS},
        {d:'Legs available for shear',e:'A_{sv,net}/s = A_{sv,shear}/s + 2[(A_{sw}/s) − (A_{sw}/s)_{req}] ≥ A_{sv,shear}/s',r:f_((sh.AsvNet!==undefined?sh.AsvNet:sh.Asv)*1000,0),u:'mm²/m'},
        {d:'Steel contribution',e:'φV_{us} = φ(A_{sv,net}/s)f_{sy.f}d_{v}cot θ_{v}',s:'0.7 × '+f_(sh.AsvNet!==undefined?sh.AsvNet:sh.Asv,3)+' × '+Qs.fsyf+' × '+f_(o.dv,1)+' × '+f_(ct,4)+' / 1000',r:f_(0.7*sh.Vus/1e3,0),u:'kN',ref:'Cl 8.2.5.2'},
        {d:'Web crushing limit',e:'φV_{u.max} = φ0.55f\'_{c}b_{v}d_{v}cot θ/(1 + cot²θ)',r:f_(0.7*sh.Vumax/1e3,0),u:'kN',ref:'Cl 8.2.3.3'},
        {d:'Torsion capacity',e:'φT_{us} = φ(A_{sw}/s)f_{sy.f}·2A_{o}·cot θ_{v}',r:f_(0.7*sh.Tus/1e6,0),u:'kN·m',ref:'Cl 8.2.5.6'},
        {d:'Cracking torsion',e:'φT_{cr} = φ0.33√f\'_{c}A_{cp}²/u_{c}',r:f_(0.7*sh.Tcr/1e6,0),u:'kN·m'},
        {d:'Longitudinal tension',e:'F_{td} vs F_{t,cap} = A_{st}f_{sy} + A_{pt}f_{pb}',r:f_(sh.Ftd/1e3,0)+' / '+f_(sh.Ftp/1e3,0),u:'kN',ref:'Cl 8.2.7'},
        {sub:'Utilisations'},
        {d:'Web crushing',e:'V_{eff}/φV_{u.max}',r:f_(sh.uCr,3),ok:sh.uCr<=1,ref:'Cl 8.2.3.1'},{d:'Shear',e:'V_{eff}/φ(V_{uc} + V_{us})',r:f_(sh.uV,3),ok:sh.uV<=1,ref:'Cl 8.2.3.1'},
        {d:'Torsion',e:'T*/φT_{us}',r:f_(sh.uT,3),ok:sh.uT<=1},{d:'Longitudinal steel',e:'F_{td}/F_{t,cap}',r:f_(sh.uL,3),ok:sh.uL<=1,ref:'Cl 8.2.7'},
        {d:'Minimum shear reinforcement',e:'A_{sv,min}/s = 0.08√f\'_{c}b_{v}/f_{sy.f}',r:f_(sh.AsvMin*1000,1)+' ≤ '+f_(sh.Asv*1000,0),u:'mm²/m',ok:sh.minV,ref:'Cl 8.2.1.7'},
        {d:'Minimum torsion reinforcement',e:'A_{sw,min}/s = 0.2y_{1}/f_{sy.f}',r:f_(sh.AswMin*1000,1)+' ≤ '+f_(Qs.AswS*1000,0),u:'mm²/m',ok:sh.minT,ref:'Cl 8.2.5.5'}];
  case 'actions': return [{d:'SLS moment on the Super-T alone (non-composite) — self weight + wet deck, before the deck hardens',e:'M_{nc} = Σγ_{SLS}M (SW, WET)',r:f_(lc.Mnc,1),u:'kN·m',ref:'Cl 8.6.2'},{d:'SLS moment on the composite section — everything added after the deck acts',e:'M_{s}* = Σγ_{SLS}M (REL, SDL, CSH, TRF)',r:f_(lc.Ms,1),u:'kN·m',ref:'Cl 8.6.2'},
      {d:'ULS design moment (factored, all actions)',e:'M* = Σγ_{ULS}M',r:f_(lc.Mu,1),u:'kN·m',ref:'AS 5100.2 Cl 6'},{d:'ULS shear',e:'V* = |Σγ_{ULS}V|',r:f_(lc.Vu,1),u:'kN'},{d:'ULS torsion',e:'T* = |Σγ_{ULS}T|',r:f_(lc.Tu,1),u:'kN·m',ref:'Cl 8.2.1.2'}];
  }
  return [];
}
/* HTML rendering of calc lines (_{sub} / ^{sup} markup) */
function dgMk(t){ return String(t===undefined||t===null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/_\{([^}]*)\}/g,'<sub>$1</sub>').replace(/\^\{([^}]*)\}/g,'<sup>$1</sup>'); }
function dgCalcHTML(lines){ return '<table class="dgcl"><thead><tr><th>Item</th><th>Expression and substitution</th><th class="r">Result</th><th>Reference</th></tr></thead><tbody>'+lines.map(function(l){
    if(l.sub) return '<tr class="dgclsub"><td colspan="4">'+dgMk(l.sub)+'</td></tr>';
    return '<tr><td>'+dgMk(l.d)+'</td><td class="dgcle">'+dgMk(l.e)+(l.s?'<br><span class="dgcls">= '+dgMk(l.s)+'</span>':'')+'</td><td class="r'+(l.ok===false?' ng':l.ok===true?' ok':'')+(l.k?' k':'')+'">'+dgMk(l.r)+(l.u?' '+dgMk(l.u):'')+'</td><td class="dgclr">'+dgMk(l.ref||'')+'</td></tr>'; }).join('')+'</tbody></table>'; }
