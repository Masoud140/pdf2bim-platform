#!/usr/bin/env python3
"""
Patch v5 → v6:
1. MCT: nodes 280-291 moved to sill beam CL (RL_B + d/2 = +0.760m)
2. MCT: sill beam elements (516-521) now connect sill-CL nodes (not bearing nodes)
3. 3D: sill beam = 3D box (1700×1520mm), col+pile = cylinders (∅1050mm), wire overlay
"""

SRC = '/home/claude/BR13A_grillage_dashboard_v5.html'
DST = '/home/claude/BR13A_grillage_dashboard_v6.html'

with open(SRC, 'r', encoding='utf-8') as f:
    html = f.read()

orig_len = len(html)
changes = []

# ─────────────────────────────────────────────────────────────────────
# MCT CHANGE 1: Nodes 280-291 → sill beam CL elevation
#   Abut A: RL_B=116.270 → CL = 116.270 + 1.520/2 = 117.030
#   Abut B: RL_B=116.484 → CL = 116.484 + 1.520/2 = 117.244
# ─────────────────────────────────────────────────────────────────────
OLD_MCT1 = """; --- New substructure nodes (280-295) added for sill beam / column / pile ---
; Pile-head nodes at RL_B (top of pile / base of column extension) [Direct DRG 202050/202070]
; Abut A RL_B=116.270 m   Abut B RL_B=116.484 m
   280, -2.59276, -2.70435, 116.270
   281, -0.70344, -0.72881, 116.270
   282, 1.20103, 1.23831, 116.270
   283, 3.11998, 3.19721, 116.270
; Pile-toe nodes at RL_A (founding level) [Direct DRG 202050/202070]
; Abut A RL_A=109.770 m   Abut B RL_A=109.984 m
   284, -2.59276, -2.70435, 109.770
   285, -0.70344, -0.72881, 109.770
   286, 1.20103, 1.23831, 109.770
   287, 3.11998, 3.19721, 109.770
; Abut B pile heads
   288, -31.22727, 1.94394, 116.484
   289, -29.24423, 4.02074, 116.484
   290, -27.24239, 6.08773, 116.484
   291, -25.22201, 8.14480, 116.484
; Abut B pile toes
   292, -31.22727, 1.94394, 109.984
   293, -29.24423, 4.02074, 109.984
   294, -27.24239, 6.08773, 109.984
   295, -25.22201, 8.14480, 109.984"""

NEW_MCT1 = """; --- New substructure nodes (280-295) added for sill beam / column / pile ---
; Sill beam CL nodes at RL_B + d/2 (d=1520mm) [Calculated from Direct DRG 202050/202070]
; Abut A: RL_B=116.270 + 0.760 = 117.030  Abut B: RL_B=116.484 + 0.760 = 117.244
   280, -2.59276, -2.70435, 117.030
   281, -0.70344, -0.72881, 117.030
   282, 1.20103, 1.23831, 117.030
   283, 3.11998, 3.19721, 117.030
; Pile-toe nodes at RL_A (founding level) [Direct DRG 202050/202070]
; Abut A RL_A=109.770 m   Abut B RL_A=109.984 m
   284, -2.59276, -2.70435, 109.770
   285, -0.70344, -0.72881, 109.770
   286, 1.20103, 1.23831, 109.770
   287, 3.11998, 3.19721, 109.770
; Abut B sill beam CL nodes at 117.244
   288, -31.22727, 1.94394, 117.244
   289, -29.24423, 4.02074, 117.244
   290, -27.24239, 6.08773, 117.244
   291, -25.22201, 8.14480, 117.244
; Abut B pile toes
   292, -31.22727, 1.94394, 109.984
   293, -29.24423, 4.02074, 109.984
   294, -27.24239, 6.08773, 109.984
   295, -25.22201, 8.14480, 109.984"""

assert OLD_MCT1 in html, "MCT CHANGE 1 anchor not found"
html = html.replace(OLD_MCT1, NEW_MCT1, 1)
changes.append("MCT 1: nodes 280-291 moved to sill beam CL elevation (117.030 / 117.244)")

# ─────────────────────────────────────────────────────────────────────
# MCT CHANGE 2: Sill beam elements connect sill CL nodes (not bearing nodes)
#   Old: 516 BEAM ... 44 101   (bearing-to-bearing)
#   New: 516 BEAM ... 280 281  (sill-CL to sill-CL)
# ─────────────────────────────────────────────────────────────────────
OLD_MCT2 = """; --- Substructure elements (516-537) ---
; Sill beam elements [Direct] 1700×1520 rect, M2 fc=40MPa, transverse at each abutment
   516, BEAM, 2, 30, 44, 101, 0, 0
   517, BEAM, 2, 30, 101, 157, 0, 0
   518, BEAM, 2, 30, 157, 212, 0, 0
   519, BEAM, 2, 30, 55, 112, 0, 0
   520, BEAM, 2, 30, 112, 168, 0, 0
   521, BEAM, 2, 30, 168, 223, 0, 0
; Column elements [Calculated] D=1050mm circ, bearing node → pile head (RL_B)
; Abut A RL_B=116.270; Abut B RL_B=116.484 [Direct DRG 202050/202070]
; Phase 1 simplification: single element from girder-centroid level to RL_B
   522, BEAM, 2, 31, 44, 280, 0, 0
   523, BEAM, 2, 31, 101, 281, 0, 0
   524, BEAM, 2, 31, 157, 282, 0, 0
   525, BEAM, 2, 31, 212, 283, 0, 0
   526, BEAM, 2, 31, 55, 288, 0, 0
   527, BEAM, 2, 31, 112, 289, 0, 0
   528, BEAM, 2, 31, 168, 290, 0, 0
   529, BEAM, 2, 31, 223, 291, 0, 0
; Pile shaft elements [Direct] D=1050mm, L=6500mm [DRG 202050/202070]
; Abut A RL_A=109.770; Abut B RL_A=109.984"""

NEW_MCT2 = """; --- Substructure elements (516-537) ---
; Sill beam CL elements [Direct] 1700×1520 rect sect, M2 fc=40MPa — connect sill-beam CL nodes
   516, BEAM, 2, 30, 280, 281, 0, 0
   517, BEAM, 2, 30, 281, 282, 0, 0
   518, BEAM, 2, 30, 282, 283, 0, 0
   519, BEAM, 2, 30, 288, 289, 0, 0
   520, BEAM, 2, 30, 289, 290, 0, 0
   521, BEAM, 2, 30, 290, 291, 0, 0
; Column/cap elements [Calculated] D=1050mm circ — bearing node → sill beam CL node
; Abut A CL=117.030; Abut B CL=117.244 (RL_B + d/2)
   522, BEAM, 2, 31, 44, 280, 0, 0
   523, BEAM, 2, 31, 101, 281, 0, 0
   524, BEAM, 2, 31, 157, 282, 0, 0
   525, BEAM, 2, 31, 212, 283, 0, 0
   526, BEAM, 2, 31, 55, 288, 0, 0
   527, BEAM, 2, 31, 112, 289, 0, 0
   528, BEAM, 2, 31, 168, 290, 0, 0
   529, BEAM, 2, 31, 223, 291, 0, 0
; Pile shaft elements [Direct] D=1050mm, sill CL → pile toe [DRG 202050/202070]
; Abut A RL_A=109.770; Abut B RL_A=109.984"""

assert OLD_MCT2 in html, "MCT CHANGE 2 anchor not found"
html = html.replace(OLD_MCT2, NEW_MCT2, 1)
changes.append("MCT 2: sill beam elements 516-521 now connect sill-CL nodes 280-291")

# ─────────────────────────────────────────────────────────────────────
# MCT CHANGE 3: update pile shaft reference in stiffness note
# ─────────────────────────────────────────────────────────────────────
OLD_MCT3 = "; Abut A RL_B=116.270; Abut B RL_B=116.484 [Direct DRG 202050/202070]"
NEW_MCT3 = "; Abut A RL_B=116.270; Abut B RL_B=116.484 [Direct DRG 202050/202070] — sill CL now at +0.760"

# Don't assert here — this may not appear; skip gracefully
if OLD_MCT3 in html:
    html = html.replace(OLD_MCT3, NEW_MCT3, 1)
    changes.append("MCT 3: updated stiffness note")

# ─────────────────────────────────────────────────────────────────────
# 3D CHANGE: Replace entire substructure rendering block with:
#   - Sill beam = 3D box (1700×1520 mm cross-section)
#   - Column/cap = ∅1050mm cylinder (bearing → sill CL)
#   - Pile shaft = ∅1050mm cylinder (sill CL → pile toe)
#   - Wire overlay for all elements
# ─────────────────────────────────────────────────────────────────────
OLD_3D = """
  // --- substructure: sill beams, pile/column shafts ---
  // MCT local coord: X = Easting-300098.513, Y = Northing-6249478.409, Z = AHD
  // THREE.js from MCT local [x,y,z]: X3D = x+dE,  Y3D = z-O.z,  Z3D = -(y+dN)
  (function(){
    var dE  = 300098.513 - O.e;
    var dN  = 6249478.409 - O.n;   // typically small negative number
    function p3(n){ return [n[0]+dE, n[2]-O.z, -(n[1]+dN)]; }

    // Abut A bearing nodes [x_mct, y_mct, z_ahd]
    var brgA=[[-2.59276,-2.70435,130.03087],[-0.70344,-0.72881,130.19552],
               [1.20103, 1.23831,130.35995],[ 3.11998, 3.19721,130.52415]];
    // Abut A pile heads RL_B=116.270
    var phA =[[-2.59276,-2.70435,116.270],[-0.70344,-0.72881,116.270],
               [1.20103, 1.23831,116.270],[ 3.11998, 3.19721,116.270]];
    // Abut A pile toes RL_A=109.770
    var ptA =[[-2.59276,-2.70435,109.770],[-0.70344,-0.72881,109.770],
               [1.20103, 1.23831,109.770],[ 3.11998, 3.19721,109.770]];
    // Abut B bearing nodes
    var brgB=[[-31.22727,1.94394,129.00475],[-29.24423,4.02074,129.18289],
               [-27.24239,6.08773,129.36071],[-25.22201,8.14480,129.53822]];
    // Abut B pile heads RL_B=116.484
    var phB =[[-31.22727,1.94394,116.484],[-29.24423,4.02074,116.484],
               [-27.24239,6.08773,116.484],[-25.22201,8.14480,116.484]];
    // Abut B pile toes RL_A=109.984
    var ptB =[[-31.22727,1.94394,109.984],[-29.24423,4.02074,109.984],
               [-27.24239,6.08773,109.984],[-25.22201,8.14480,109.984]];

    // helper: push a line segment between two MCT local nodes
    var vSill=[], vCol=[], vPile=[];
    function seg(arr, a, b){ var pa=p3(a),pb=p3(b); arr.push(pa[0],pa[1],pa[2],pb[0],pb[1],pb[2]); }

    // sill beams (consecutive girders at each abutment)
    for(var i=0;i<3;i++){ seg(vSill,brgA[i],brgA[i+1]); seg(vSill,brgB[i],brgB[i+1]); }
    // column extensions: bearing node → pile head
    for(var j=0;j<4;j++){ seg(vCol,brgA[j],phA[j]); seg(vCol,brgB[j],phB[j]); }
    // pile shafts: pile head → pile toe
    for(var k=0;k<4;k++){ seg(vPile,phA[k],ptA[k]); seg(vPile,phB[k],ptB[k]); }

    function addLines(verts, color, opacity){
      if(!verts.length) return;
      var g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.Float32BufferAttribute(verts,3));
      gSub.add(new THREE.LineSegments(g2,
        new THREE.LineBasicMaterial({color:color, transparent:true, opacity:opacity, linewidth:2})));
    }

    var colSill = dark ? 0x7ecfb0 : 0x1a7a5a;   // teal-green for sill beams
    var colPile = dark ? 0xd4a84b : 0x8B6914;   // amber for piles/columns
    addLines(vSill, colSill, 0.95);  // sill beams
    addLines(vCol,  colPile, 0.90);  // column cap extensions
    addLines(vPile, colPile, 0.80);  // pile shafts

    // pile toe support markers (small sphere at each toe)
    var matToe = new THREE.MeshStandardMaterial({color: dark?0xff9f43:0xc0392b, roughness:0.4, metalness:0.1});
    [ptA[0],ptA[1],ptA[2],ptA[3],ptB[0],ptB[1],ptB[2],ptB[3]].forEach(function(n){
      var sp = new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6), matToe);
      var c = p3(n); sp.position.set(c[0],c[1],c[2]); gSub.add(sp);
    });
  })();

"""

NEW_3D = """
  // ─── Substructure 3D: sill beam boxes + ∅1050 cylinders + wire overlay ───
  // MCT local → THREE.js:  X3D = x+dE,  Y3D = z-O.z,  Z3D = -(y+dN)
  // where dE = 300098.513 - O.e,  dN = 6249478.409 - O.n
  (function(){
    var dE = 300098.513 - O.e;
    var dN = 6249478.409 - O.n;
    function v3(n){ return new THREE.Vector3(n[0]+dE, n[2]-O.z, -(n[1]+dN)); }

    // ── MCT node coordinates [x_mct, y_mct, z_ahd] ──
    // Abut A bearing nodes (girder centroid level ≈ 130 m)
    var brgA=[[-2.59276,-2.70435,130.03087],[-0.70344,-0.72881,130.19552],
               [ 1.20103, 1.23831,130.35995],[ 3.11998, 3.19721,130.52415]];
    // Abut A sill beam CL nodes  z = RL_B + d/2 = 116.270 + 0.760 = 117.030
    var slA =[[-2.59276,-2.70435,117.030],[-0.70344,-0.72881,117.030],
               [ 1.20103, 1.23831,117.030],[ 3.11998, 3.19721,117.030]];
    // Abut A pile toes  RL_A = 109.770
    var ptA =[[-2.59276,-2.70435,109.770],[-0.70344,-0.72881,109.770],
               [ 1.20103, 1.23831,109.770],[ 3.11998, 3.19721,109.770]];
    // Abut B bearing nodes
    var brgB=[[-31.22727,1.94394,129.00475],[-29.24423,4.02074,129.18289],
               [-27.24239,6.08773,129.36071],[-25.22201,8.14480,129.53822]];
    // Abut B sill beam CL nodes  z = 116.484 + 0.760 = 117.244
    var slB =[[-31.22727,1.94394,117.244],[-29.24423,4.02074,117.244],
               [-27.24239,6.08773,117.244],[-25.22201,8.14480,117.244]];
    // Abut B pile toes  RL_A = 109.984
    var ptB =[[-31.22727,1.94394,109.984],[-29.24423,4.02074,109.984],
               [-27.24239,6.08773,109.984],[-25.22201,8.14480,109.984]];

    // ── materials ──
    var matSill = new THREE.MeshStandardMaterial({
      color: dark ? 0x3ea880 : 0x1a7a5a, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide
    });
    var matPile = new THREE.MeshStandardMaterial({
      color: dark ? 0xc8973a : 0x7a5a10, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide
    });
    var matToe = new THREE.MeshStandardMaterial({
      color: dark ? 0xff9f43 : 0xc0392b, roughness: 0.4, metalness: 0.1
    });

    // ── helper: cylinder mesh between two MCT local points ──
    function cyl(a, b, r, mat, segs){
      var A = v3(a), B = v3(b);
      var mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
      var dir = new THREE.Vector3().subVectors(B, A);
      var L   = dir.length();
      var geo = new THREE.CylinderGeometry(r, r, L, segs || 12, 1);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(mid);
      mesh.castShadow = true;
      var ax = new THREE.Vector3(0, 1, 0);
      mesh.quaternion.setFromUnitVectors(ax, dir.normalize());
      return mesh;
    }

    // ── helper: box beam along axis A→B, cross-section w × h ──
    //    w = longitudinal (bridge-span) direction, h = vertical
    function boxBeam(a, b, w, h, mat){
      var A = v3(a), B = v3(b);
      var mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
      var dir = new THREE.Vector3().subVectors(B, A);
      var L   = dir.length();
      // BoxGeometry: X = length, Y = height (vertical), Z = width (longitudinal)
      var geo = new THREE.BoxGeometry(L, h, w);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(mid);
      mesh.castShadow = true;
      var ax = new THREE.Vector3(1, 0, 0);
      mesh.quaternion.setFromUnitVectors(ax, dir.normalize());
      return mesh;
    }

    // ── SILL BEAMS: 3D box, 1700×1520 mm cross-section ──
    //    sill runs transversely G1→G4; cross-section: 1.700m long × 1.520m deep
    [slA, slB].forEach(function(sl){
      for(var i=0;i<3;i++){
        gSub.add(boxBeam(sl[i], sl[i+1], 1.700, 1.520, matSill));
        // edge wireframe on the box
        var eg = new THREE.BoxGeometry(
          v3(sl[i]).distanceTo(v3(sl[i+1])), 1.520, 1.700);
        var wf = new THREE.LineSegments(new THREE.EdgesGeometry(eg),
          new THREE.LineBasicMaterial({color:dark?0x7ecfb0:0x1a7a5a,opacity:0.7,transparent:true}));
        var mmid = new THREE.Vector3().addVectors(v3(sl[i]),v3(sl[i+1])).multiplyScalar(0.5);
        wf.position.copy(mmid);
        var ax2 = new THREE.Vector3(1,0,0);
        wf.quaternion.setFromUnitVectors(ax2, new THREE.Vector3().subVectors(v3(sl[i+1]),v3(sl[i])).normalize());
        gSub.add(wf);
      }
    });

    // ── COLUMN/CAP elements: ∅1050mm, bearing → sill CL ──
    for(var j=0;j<4;j++){
      gSub.add(cyl(brgA[j], slA[j], 0.525, matPile, 14));
      gSub.add(cyl(brgB[j], slB[j], 0.525, matPile, 14));
    }

    // ── PILE SHAFTS: ∅1050mm, sill CL → pile toe ──
    for(var k=0;k<4;k++){
      gSub.add(cyl(slA[k], ptA[k], 0.525, matPile, 14));
      gSub.add(cyl(slB[k], ptB[k], 0.525, matPile, 14));
    }

    // ── PILE TOE markers (support pin) ──
    [].concat(ptA, ptB).forEach(function(n){
      var sp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), matToe);
      sp.position.copy(v3(n)); gSub.add(sp);
    });

    // ── WIRE LINE MODEL overlay: all elements as thin lines ──
    //    shown in both solid and wire views so the line model is always readable
    var vWire = [];
    function segW(a, b){ var A=v3(a),B=v3(b); vWire.push(A.x,A.y,A.z,B.x,B.y,B.z); }
    // sill beams
    for(var i2=0;i2<3;i2++){ segW(slA[i2],slA[i2+1]); segW(slB[i2],slB[i2+1]); }
    // columns
    for(var j2=0;j2<4;j2++){ segW(brgA[j2],slA[j2]); segW(brgB[j2],slB[j2]); }
    // piles
    for(var k2=0;k2<4;k2++){ segW(slA[k2],ptA[k2]); segW(slB[k2],ptB[k2]); }
    var gw2 = new THREE.BufferGeometry();
    gw2.setAttribute('position', new THREE.Float32BufferAttribute(vWire,3));
    gSub.add(new THREE.LineSegments(gw2,
      new THREE.LineBasicMaterial({color:dark?0xffffff:0x000000,
        transparent:true, opacity:0.55, depthTest:false})));
  })();

"""

assert OLD_3D in html, "3D CHANGE anchor not found"
html = html.replace(OLD_3D, NEW_3D, 1)
changes.append("3D: sill beam → 3D box (1700×1520), col+pile → ∅1050 cylinders, wire overlay")

# ─────────────────────────────────────────────────────────────────────
# Update legend and note
# ─────────────────────────────────────────────────────────────────────
OLD_LEG = ("; Abut A CL=117.030; Abut B CL=117.244 (RL_B + d/2)")
# (This is MCT, skip; legend update below)

OLD_NOTE = ("'Substructure: sill beams (teal), \\u00d81050 pile/column elements (amber) and pile-toe markers from the embedded MCT. '")
NEW_NOTE = ("'Substructure (from MCT): \\u00d81050 column/pile cylinders (amber), sill beam boxes 1700\\u00d71520 mm (teal), wire CL overlay. '")

if OLD_NOTE in html:
    html = html.replace(OLD_NOTE, NEW_NOTE, 1)
    changes.append("3D note updated")

# ─────────────────────────────────────────────────────────────────────
# Write
# ─────────────────────────────────────────────────────────────────────
with open(DST, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Source: {orig_len:,} chars")
print(f"Output: {len(html):,} chars  (delta {len(html)-orig_len:+,})")
print(f"\nChanges ({len(changes)}):")
for c in changes: print(f"  ✓ {c}")
print(f"\nOutput → {DST}")
