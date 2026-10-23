#!/usr/bin/env python3
"""v6 -> v7: substructure rebuilt from the embedded workbook values.
Sill CL line on the bearing line, rigid offsets to sill top (bearings) and sill soffit (piles),
columns soffit->RL B, piles RL B->RL A at the real pile positions, bearings as elastic links,
pinned pile toes. In-page solver taught *ELASTICLINK. 3D shows true solids + full line model."""
import math, re, json

SRC = '/home/claude/BR13A_grillage_dashboard_v6.html'
DST = '/home/claude/BR13A_grillage_dashboard_v7.html'
h = open(SRC, encoding='utf-8').read()

E0, N0 = 300098.513, 6249478.409          # MCT local origin (stated in MCT header)
AZ = 44 + 1/60 + 45/3600                  # pile/bearing line bearing 44°01'45" [Confirmed - Engineer]
ue, un = math.sin(math.radians(AZ)), math.cos(math.radians(AZ))   # +s toward north (044°)
D_SB = 1.520                               # sill depth [Direct 202103 Sec 3]
B_SB = 1.700                               # sill width [Calculated 350+515+835]
R_P = 1.050 / 2                            # pile/column dia 1050 [Direct 202050/202070]
K_RIG = 1.0e7                              # bearing link "rigid" stiffness kN/m [Model]

AB = {
 'A': dict(sop=(300098.512, 6249478.408), piles=[-3559, -959, 1641, 4241],
           soff=[126.739, 126.892, 127.045, 127.199], ends=(-5645, 5283),
           rlB=116.270, rlA=109.770, brg=[44, 101, 157, 212], kind='fixed'),
 'B': dict(sop=(300070.008, 6249483.196), piles=[-3545, -945, 1655, 4255],
           soff=[125.723, 125.880, 126.037, 126.194], ends=(-4751, 6694),
           rlB=116.484, rlA=109.984, brg=[55, 112, 168, 223], kind='guided'),
}

# ---- grillage nodes from the MCT ----
s0 = h.index('<script type="text/plain" id="an_mct_src">')
s1 = h.index('*ENDDATA', s0)
mct = h[s0:s1]
nb = mct.index('*NODE'); ne = mct.index('*ELEMENT')
GN = {}
for l in mct[nb:ne].splitlines():
    m = re.match(r'\s*(\d+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)', l)
    if m and int(m.group(1)) < 280:
        GN[int(m.group(1))] = tuple(float(m.group(i)) for i in (2, 3, 4))

def girder_beta(n):
    """angle (deg, from global X) of the girder axis at bearing node n: nearest node roughly along the deck"""
    x, y, _ = GN[n]; best = None
    for k, (a, b, _) in GN.items():
        if k == n: continue
        dx, dy = a - x, b - y; d = math.hypot(dx, dy)
        if d < 0.3 or d > 4: continue
        ang = math.degrees(math.atan2(dy, dx))
        a0 = ((ang + 90) % 180) - 90            # fold to (-90, 90]
        if abs(a0) < 30 and (best is None or d < best[0]): best = (d, a0)
    return round(best[1], 3)

def loc(sop, s):   # s in metres along the bearing line from SOP -> MCT local x,y
    return (sop[0] + s * ue - E0, sop[1] + s * un - N0)

nodes, els, links, cons, notes = {}, [], [], [], []
nid, eid = [280], [516]
def node(x, y, z):
    i = nid[0]; nodes[i] = (round(x, 5), round(y, 5), round(z, 3)); nid[0] += 1; return i
def elem(sec, mat, a, b, kind, grp):
    i = eid[0]; els.append((i, mat, sec, a, b, kind, grp)); eid[0] += 1; return i

geo = {'sill': [], 'cyl': [], 'plinth': [], 'lines': []}
for key, d in AB.items():
    ps = [p / 1000 for p in d['piles']]
    # soffit RL linear along s (least squares through the 4 column RLs)
    n = len(ps); mx = sum(ps) / n; my = sum(d['soff']) / n
    slope = sum((p - mx) * (q - my) for p, q in zip(ps, d['soff'])) / sum((p - mx) ** 2 for p in ps)
    soff = lambda s, mx=mx, my=my, slope=slope: my + slope * (s - mx)
    resid = max(abs(soff(p) - q) for p, q in zip(ps, d['soff']))
    notes.append(f'; Abut {key}: sill soffit RL = {my:.4f} + {slope:.6f}*(s - {mx:.3f}), max residual {resid*1000:.1f} mm vs the 4 column RLs')
    # stations on the sill CL: ends, piles, bearings (bearing s from the grillage node, projected on the line)
    st = [(d['ends'][0] / 1000, 'end', None), (d['ends'][1] / 1000, 'end', None)]
    st += [(p, 'pile', i) for i, p in enumerate(ps)]
    for g, bn in enumerate(d['brg']):
        x, y, _ = GN[bn]; sx, sy = d['sop'][0] - E0, d['sop'][1] - N0
        st.append(((x - sx) * ue + (y - sy) * un, 'brg', g))
    st.sort(key=lambda t: t[0])
    cl = []
    for s, kind, i in st:
        if kind == 'brg':   # keep the rigid offset exactly vertical under the grillage node
            x, y, _ = GN[d['brg'][i]]
        else:
            x, y = loc(d['sop'], s)
        cl.append((s, kind, i, node(x, y, soff(s) + D_SB / 2)))
    for a, b in zip(cl, cl[1:]):
        elem(30, 2, a[3], b[3], 'sill', f'Sill_Abut{key}')
        geo['lines'].append([nodes[a[3]], nodes[b[3]], 'sill'])
    toes = []
    for s, kind, i, c in cl:
        x, y, zc = nodes[c]
        if kind == 'brg':
            bn = d['brg'][i]
            top = node(x, y, soff(s) + D_SB)
            elem(27, 3, c, top, 'rig', f'RigOff_Abut{key}')
            geo['lines'].append([nodes[c], nodes[top], 'rig'])
            beta = girder_beta(bn)
            sdx, sdy, sdz = K_RIG, K_RIG, (K_RIG if d['kind'] == 'fixed' else 0)
            links.append((top, bn, beta, sdx, sdy, sdz, f'Brg_Abut{key}_{d["kind"]}'))
            geo['lines'].append([nodes[top], GN[bn], 'brg'])
            geo['plinth'].append({'p': nodes[top], 'g': GN[bn]})
        elif kind == 'pile':
            so = node(x, y, soff(s))
            nB = node(x, y, d['rlB'])
            nA = node(x, y, d['rlA'])
            elem(27, 3, c, so, 'rig', f'RigOff_Abut{key}')
            elem(31, 2, so, nB, 'col', f'Column_Abut{key}')
            elem(31, 2, nB, nA, 'pile', f'Pile_Abut{key}')
            toes.append(nA)
            geo['lines'] += [[nodes[c], nodes[so], 'rig'], [nodes[so], nodes[nB], 'col'], [nodes[nB], nodes[nA], 'pile']]
            geo['cyl'] += [{'a': nodes[so], 'b': nodes[nB], 'k': 'col'}, {'a': nodes[nB], 'b': nodes[nA], 'k': 'pile'}]
    cons.append((toes, f'PileToe_Abut{key}_fixed'))
    # sill solid: corners at the two ends, +-B/2 normal to the line
    s_a, s_b = d['ends'][0] / 1000, d['ends'][1] / 1000
    pe, pn = un, -ue      # plan normal
    corners = []
    for s in (s_a, s_b):
        x, y = loc(d['sop'], s)
        for w in (-B_SB / 2, B_SB / 2):
            for z in (soff(s), soff(s) + D_SB):
                corners.append([round(x + w * pe, 5), round(y + w * pn, 5), round(z, 4)])
    geo['sill'].append(corners)

# ---------------- MCT text ----------------
def fmt_nodes():
    out = ['; --- Substructure nodes (280+) [values from the embedded workbook: Abutment + Piles tabs] ---',
           '; Sill CL on the bearing/pile line (offset 0, Confirmed - Engineer); s measured along 044°01\'45" from each SOP',
           '; Sill soffit RL [Direct 202100/202101 elevation RLs at columns; column-to-pile assignment Calculated: N high, S low]',
           '; Sill CL = soffit + 760 (d = 1520 Direct 202103 Sec 3). Column top = sill soffit. RL B / RL A [Direct 202050 Table 1]']
    out += notes
    for i, (x, y, z) in sorted(nodes.items()):
        out.append(f'   {i}, {x:.5f}, {y:.5f}, {z:.3f}')
    return '\n'.join(out) + '\n'

def fmt_els():
    out = ['; --- Substructure elements (516+) ---',
           '; sill = 1700x1520 SB (sect 30) | rig = rigid offset, massless M3 (sect 27) | col/pile = D1050 (sect 31)']
    for i, mat, sec, a, b, kind, grp in els:
        out.append(f'   {i}, BEAM, {mat}, {sec}, {a}, {b}, 0, 0   ; {kind} {grp}')
    return '\n'.join(out) + '\n'

new_support = """; ---------------------------------------------------------------------------
; LOAD CASE + SUPPORTS
; Load path: girder bearing node -> bearing (elastic link) -> sill top -> rigid offset -> sill CL
;            -> rigid offset -> sill soffit -> column D1050 -> RL B -> pile D1050 -> RL A (toe).
; Bearings [Model - bearing type not in this drawing set, per engineer instruction]:
;   Abut A = fixed (all translations stiff), Abut B = guided (free along the girder axis, local z).
;   Link N1 = sill top, N2 = girder node (x = +Z). ANGLE = girder axis angle from global X at that node,
;   so local z = girder axis. Rotations free (pinned bearing). Stiffness 1.0e7 kN/m = rigid idealisation.
;   VERIFY ON IMPORT: display elastic-link local axes and confirm local z runs along the girders at Abut B.
; Pile toes [Model - Missing-Flagged]: FIXED (all 6 dof). Pinned toes are a mechanism here: one pile row, fixed
;   into a sill that can twist, gives zero sway stiffness normal to the row, and Abut B is guided. Founding stratum
;   is shale/sandstone (202050 Table 2), but fixity is an idealisation - replace with geotech pile-soil springs.
*STLDCASE    ; Static Load Cases
; LCNAME, LCTYPE, DESC
   SW   , D , Self weight

*CONSTRAINT    ; Supports
; NODE_LIST, CONST(Dx,Dy,Dz,Rx,Ry,Rz,Rw), GROUP
""" + ''.join(f"   {' '.join(map(str, t))}, 1111110, {g}\n" for t, g in cons) + """
*ELASTICLINK    ; Elastic Link
; iNO, iNODE1, iNODE2, LINK, ANGLE, R_SDx, R_SDy, R_SDz, R_SRx, R_SRy, R_SRz, SDx, SDy, SDz, SRx, SRy, SRz, bSHEAR, DRy, DRz, GROUP
""" + ''.join(f"   {k+1}, {a}, {b}, GEN, {beta}, NO, NO, NO, NO, NO, NO, {sx:.1e}, {sy:.1e}, {sz:.1e}, 0, 0, 0, YES, 0.5, 0.5, {g}\n"
              for k, (a, b, beta, sx, sy, sz, g) in enumerate(links)) + "\n"

m_old = mct
a = mct.index('; --- New substructure nodes (280-295)'); b = mct.index('\n*ELEMENT\n') + 1
mct = mct[:a] + fmt_nodes() + mct[b:]
a = mct.index('; --- Substructure elements (516-537) ---'); b = mct.index('\n*MATERIAL\n') + 1
mct = mct[:a] + fmt_els() + mct[b:]
m2 = '   2, USER, M2_Deck_40MPa, 0, 0, , C, NO, 0.05, 2, 32800000, 0.2, 1.000e-5, 25.50, 0\n'
assert m2 in mct
mct = mct.replace(m2, m2 + '; M3 [Model] massless copy of M2 for rigid offsets in the substructure (no self weight)\n'
                  '   3, USER, M3_Rigid_massless, 0, 0, , C, NO, 0.05, 2, 32800000, 0.2, 1.000e-5, 0, 0\n'
                  '; NOTE: sill / column / pile use M2 (40 MPa) - substructure concrete grade not confirmed [Missing - Flagged]\n', 1)
a = mct.index('; ---------------------------------------------------------------------------\n; LOAD CASE + SUPPORTS')
b = mct.index('*USE-STLD')
mct = mct[:a] + new_support + mct[b:]
h = h[:s0] + mct + h[s1:]

# ---------------- in-page solver: *ELASTICLINK ----------------
old_p = "    var sw=data('*SELFWEIGHT'); if(sw.length){ var v=nums(sw[0]); M.gravity=[v[0],v[1],v[2]]; }\n    return M;"
assert old_p in h
h = h.replace(old_p, """    M.links=[];
    data('*ELASTICLINK').forEach(function(l){ var p=l.split(',').map(function(x){return x.trim();});
      if(p[3]!=='GEN'){ M.warn.push('elastic link '+p[0]+' type '+p[3]+' ignored'); return; }
      M.links.push({id:+p[0],n1:+p[1],n2:+p[2],beta:+p[4],k:[+p[11],+p[12],+p[13],+p[14],+p[15],+p[16]],
        dry:p[17]==='YES'?+p[18]:0.5,drz:p[17]==='YES'?+p[19]:0.5,group:p[20]||''}); });
""" + old_p, 1)

old_r = "    return {M:M,ids:ids,idx:idx,ndof:ndof,nf:nf,fixed:fixed,freeMap:freeMap,els:els};"
assert old_r in h
h = h.replace(old_r, """    /* elastic links (GEN): six springs in link axes, shear springs at DRy/DRz of the length (MIDAS) */
    if(M.links && M.links.length){
      M.secs.__LINK = M.secs.__LINK || {name:'LINK_elastic',A:0,Asy:0,Asz:0,J:0,Iy:0,Iz:0,wA:0,kind:'elastic link'};
      M.links.forEach(function(lk){
        var p1=M.nodes[lk.n1], p2=M.nodes[lk.n2]; if(!p1||!p2){ M.warn.push('link '+lk.id+' node missing'); return; }
        var v=[p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]], L=Math.hypot(v[0],v[1],v[2]), x=v.map(function(t){return t/L;});
        var cr=function(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];};
        var nz=function(a){var n=Math.hypot(a[0],a[1],a[2]);return a.map(function(t){return t/n;});};
        var b=lk.beta*Math.PI/180, y, z;
        if(Math.hypot(x[0],x[1])<1e-6){ var z0=[Math.cos(b),Math.sin(b),0]; y=nz(cr(z0,x)); z=cr(x,y); }
        else { var y0=nz(cr([0,0,1],x)), z1=cr(x,y0); y=y0.map(function(t,i){return Math.cos(b)*t+Math.sin(b)*z1[i];}); z=cr(x,y); }
        var R=[x,y,z], T=Tmat(R), Tt=tr(T), a1=lk.dry*L, b1=(1-lk.dry)*L, a2=lk.drz*L, b2=(1-lk.drz)*L;
        var Kl=[]; for(var i=0;i<12;i++) Kl.push(new Array(12).fill(0));
        function add(g,k){ if(!k) return; for(var i=0;i<12;i++) if(g[i]) for(var j=0;j<12;j++) if(g[j]) Kl[i][j]+=k*g[i]*g[j]; }
        var g; g=new Array(12).fill(0); g[0]=-1; g[6]=1; add(g,lk.k[0]);
        g=new Array(12).fill(0); g[1]=-1; g[5]=-a1; g[7]=1; g[11]=-b1; add(g,lk.k[1]);
        g=new Array(12).fill(0); g[2]=-1; g[4]=a2; g[8]=1; g[10]=b2; add(g,lk.k[2]);
        g=new Array(12).fill(0); g[3]=-1; g[9]=1; add(g,lk.k[3]);
        g=new Array(12).fill(0); g[4]=-1; g[10]=1; add(g,lk.k[4]);
        g=new Array(12).fill(0); g[5]=-1; g[11]=1; add(g,lk.k[5]);
        var Z=[]; for(var i2=0;i2<12;i2++) Z.push(new Array(12).fill(0));
        els.push({id:'L'+lk.id,link:true,n1:lk.n1,n2:lk.n2,sec:'__LINK',mat:null,L:L,R:R,T:T,Tt:Tt,Kl:Kl,Ml:Z,Kg:mul(Tt,mul(Kl,T)),Mg:Z,
          fl:new Array(12).fill(0),fg:new Array(12).fill(0),q:[0,0,0],w:0,mu:0,
          dof:[0,1,2,3,4,5].map(function(k){return 6*idx[lk.n1]+k;}).concat([0,1,2,3,4,5].map(function(k){return 6*idx[lk.n2]+k;}))});
      });
    }
""" + old_r, 1)

# ---------------- 3D viewer ----------------
SUB = {'sill': geo['sill'], 'cyl': geo['cyl'], 'plinth': geo['plinth'], 'lines': geo['lines'],
       'origin': [E0, N0], 'r': R_P}
h = h.replace('function v3dDraw(){', '/* substructure geometry, MCT local coords (X=E-' + str(E0) + ', Y=N-' + str(N0) +
              ', Z=AHD) - generated with the MCT substructure from the workbook values */\nvar SUBSTR = ' +
              json.dumps(SUB, separators=(',', ':')) + ';\n\nfunction v3dDraw(){', 1)

h = h.replace("""      gSub  = new THREE.Group();
  V3.gGird=gGird; V3.gDeck=gDeck; V3.gWire=gWire; V3.gBrg=gBrg; V3.gSub=gSub;
  scene.add(gGird, gDeck, gWire, gBrg, gSub);""", """      gSubS = new THREE.Group(), gSubW = new THREE.Group();
  V3.gGird=gGird; V3.gDeck=gDeck; V3.gWire=gWire; V3.gBrg=gBrg; V3.gSubS=gSubS; V3.gSubW=gSubW;
  scene.add(gGird, gDeck, gWire, gBrg, gSubS, gSubW);""", 1)

a = h.index('  // ─── Substructure 3D: sill beam boxes')
b = h.index('  // --- shadow-catcher ground, well below the soffit ---')
h = h[:a] + r"""  // ─── Substructure (from SUBSTR, same source as the MCT) ───
  //   MCT local [x,y,z] -> render:  X = x + (E0 - O.e),  Y = z - O.z,  Z = -(y + (N0 - O.n))
  var subMinY = 0;
  (function(){
    var dE = SUBSTR.origin[0] - O.e, dN = SUBSTR.origin[1] - O.n;
    function v3(n){ return new THREE.Vector3(n[0]+dE, n[2]-O.z, -(n[1]+dN)); }
    var mSill = new THREE.MeshStandardMaterial({color:dark?0x9fb3a6:0xb9c9bd, roughness:0.92, side:THREE.DoubleSide});
    var mCol  = new THREE.MeshStandardMaterial({color:dark?0xa59a86:0xcbbfa6, roughness:0.9});
    var mPile = new THREE.MeshStandardMaterial({color:dark?0x8a7d68:0xa8987a, roughness:0.95});
    var mPl   = new THREE.MeshStandardMaterial({color:dark?0x8f99a6:0x9aa4b0, roughness:0.8});
    V3.subMats = [mSill, mCol, mPile, mPl];
    var mEdge = new THREE.LineBasicMaterial({color:dark?0x55606e:0x6b7581, transparent:true, opacity:0.6});
    V3.subEdge = mEdge;
    // sill beam solids: 8 corners [end a: (-w,bot),(-w,top),(+w,bot),(+w,top); end b: same]
    SUBSTR.sill.forEach(function(c){
      var P = c.map(v3), F = [[0,2,3,1],[4,5,7,6],[0,1,5,4],[2,6,7,3],[1,3,7,5],[0,4,6,2]], pos=[];
      F.forEach(function(f){ [f[0],f[1],f[2], f[0],f[2],f[3]].forEach(function(i){ pos.push(P[i].x,P[i].y,P[i].z); }); });
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals();
      var m = new THREE.Mesh(g, mSill); m.castShadow = m.receiveShadow = true; gSubS.add(m);
      gSubS.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), mEdge));
    });
    // columns and piles: D1050 cylinders, top of column at the sill soffit
    SUBSTR.cyl.forEach(function(c){
      var A = v3(c.a), B = v3(c.b), d = new THREE.Vector3().subVectors(B, A), L = d.length();
      var m = new THREE.Mesh(new THREE.CylinderGeometry(SUBSTR.r, SUBSTR.r, L, 24, 1), c.k==='pile'?mPile:mCol);
      m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.normalize());
      m.castShadow = m.receiveShadow = true; gSubS.add(m);
      subMinY = Math.min(subMinY, A.y, B.y);
    });
    // bearing plinths: sill top up to the underside of the bearing pad drawn under each girder
    var Dg = secGeom().D/1000;
    SUBSTR.plinth.forEach(function(p){
      var bot = p.p[2], top = p.g[2] - Dg - 0.095, hgt = top - bot;
      if(!(hgt > 0.005)) return;
      var b = new THREE.Mesh(new THREE.BoxGeometry(0.6, hgt, 0.45), mPl), c = v3([p.p[0], p.p[1], bot + hgt/2]);
      b.position.copy(c); b.castShadow = true; gSubS.add(b);
    });
    // full line model: sill CL, rigid offsets, bearing links, columns, piles + node markers
    var KC = {sill:'#1a9e6e', rig:'#9b59b6', brg:'#e74c3c', col:'#d68910', pile:'#a0522d'}, by = {};
    SUBSTR.lines.forEach(function(l){ (by[l[2]] = by[l[2]] || []).push(l); });
    var pts = {};
    Object.keys(by).forEach(function(k){
      var v = [];
      by[k].forEach(function(l){ var A=v3(l[0]), B=v3(l[1]); v.push(A.x,A.y,A.z,B.x,B.y,B.z);
        pts[l[0].join()] = A; pts[l[1].join()] = B; });
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
      gSubW.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({color:new THREE.Color(KC[k]), depthTest:false, transparent:true})));
    });
    var pv = []; Object.keys(pts).forEach(function(k){ pv.push(pts[k].x, pts[k].y, pts[k].z); });
    var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pv,3));
    gSubW.add(new THREE.Points(pg, new THREE.PointsMaterial({color:dark?0xffffff:0x222222, size:4, sizeAttenuation:false, depthTest:false, transparent:true})));
    gSubW.renderOrder = 10;
  })();

""" + h[b:]

# ground below the pile toes
og = "  var gy = -(secGeom().D/1000) - 2.2;"
assert og in h
h = h.replace(og, "  var gy = Math.min(-(secGeom().D/1000) - 2.2, subMinY - 0.6);", 1)

# visibility / ghosting
o3 = "  if(V3.gSub) V3.gSub.visible = true;   // substructure always visible\n"
assert o3 in h
h = h.replace(o3, """  var subOn = !$('v3d_sub') || $('v3d_sub').checked;
  (V3.subMats||[]).forEach(function(mt){ mt.transparent = ghost; mt.opacity = ghost?0.22:1; mt.depthWrite = !ghost; mt.needsUpdate = true; });
  if(V3.subEdge) V3.subEdge.opacity = ghost?0.30:0.6;
  if(V3.gSubS){ V3.gSubS.visible = solid && subOn; V3.gSubS.children.forEach(function(o){ if(o.isMesh) o.castShadow = !ghost; }); }
  if(V3.gSubW) V3.gSubW.visible = wire && subOn;
""", 1)

# checkbox
oc = "   + '<label class=\"v3dchk\"><input type=\"checkbox\" id=\"v3d_brg\" checked> Bearings</label>'"
assert oc in h
h = h.replace(oc, oc + "\n   + '<label class=\"v3dchk\"><input type=\"checkbox\" id=\"v3d_sub\" checked> Substructure</label>'", 1)
h = h.replace("['v3d_deck','v3d_gird','v3d_brg','v3d_end'].forEach", "['v3d_deck','v3d_gird','v3d_brg','v3d_sub','v3d_end'].forEach", 1)

# frame includes the substructure
of = "  [V3.gGird, V3.gDeck, V3.gWire].forEach(function(g){"
assert of in h
h = h.replace(of, "  [V3.gGird, V3.gDeck, V3.gWire, V3.gSubS].forEach(function(g){", 1)

# legend
ol = """  + '<span><i style="background:#1a7a5a"></i>Sill beam</span>'
  + '<span><i style="background:#8B6914"></i>Pile / column</span>';"""
assert ol in h
h = h.replace(ol, """  + [['#1a9e6e','Sill CL'],['#9b59b6','Rigid offset'],['#e74c3c','Bearing link'],['#d68910','Column'],['#a0522d','Pile']]
      .map(function(c){ return '<span><i style="background:'+c[0]+'"></i>'+c[1]+'</span>'; }).join('');""", 1)

# note
on_ = "'Substructure (from MCT): \\u00d81050 column/pile cylinders (amber), sill beam boxes 1700\\u00d71520 mm (teal), wire CL overlay. '"
assert on_ in h, 'note'
h = h.replace(on_, "'Substructure (same source as the MCT): sill beam 1700\\u00d71520 under the bearings with its falling soffit, bearing plinths, "
              "\\u00d81050 columns from the sill soffit to RL B and piles to RL A at the pile setout positions. Grillage view shows the full line model. '", 1)

open(DST, 'w', encoding='utf-8').write(h)
json.dump({'nodes': nodes, 'els': els, 'links': links, 'cons': cons, 'notes': notes}, open('/tmp/claude-0/-home-claude/26ed6757-087c-514d-944a-fb75ed869c40/scratchpad/sub_v7.json', 'w'), indent=1)
print('nodes', len(nodes), 'els', len(els), 'links', len(links))
print('\n'.join(notes))
for l in links: print('link', l)
print('written', DST, len(h))
