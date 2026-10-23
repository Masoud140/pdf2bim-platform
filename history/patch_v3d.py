#!/usr/bin/env python3
"""Patch BR13A_grillage_dashboard_v4.html to show piles and sill beams in 3D viewer."""

SRC = '/home/claude/BR13A_grillage_dashboard_v4.html'
DST = '/home/claude/BR13A_grillage_dashboard_v5.html'

with open(SRC, 'r', encoding='utf-8') as f:
    html = f.read()

orig_len = len(html)
changes = []

# ─────────────────────────────────────────────────────────────────────
# CHANGE 1: add gSubstruct group to declarations and scene.add()
# ─────────────────────────────────────────────────────────────────────
OLD1 = """  var gGird = new THREE.Group(), gDeck = new THREE.Group(),
      gWire = new THREE.Group(), gBrg = new THREE.Group();
  V3.gGird=gGird; V3.gDeck=gDeck; V3.gWire=gWire; V3.gBrg=gBrg;
  scene.add(gGird, gDeck, gWire, gBrg);"""

NEW1 = """  var gGird = new THREE.Group(), gDeck = new THREE.Group(),
      gWire = new THREE.Group(), gBrg = new THREE.Group(),
      gSub  = new THREE.Group();
  V3.gGird=gGird; V3.gDeck=gDeck; V3.gWire=gWire; V3.gBrg=gBrg; V3.gSub=gSub;
  scene.add(gGird, gDeck, gWire, gBrg, gSub);"""

assert OLD1 in html, "CHANGE 1 anchor not found"
html = html.replace(OLD1, NEW1, 1)
changes.append("CHANGE 1: added gSub group")

# ─────────────────────────────────────────────────────────────────────
# CHANGE 2: insert substructure rendering before the shadow catcher
# ─────────────────────────────────────────────────────────────────────
SUBSTRUCT_CODE = r"""
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

OLD2 = """  // --- shadow-catcher ground, well below the soffit ---"""

assert OLD2 in html, "CHANGE 2 anchor not found"
html = html.replace(OLD2, SUBSTRUCT_CODE + OLD2, 1)
changes.append("CHANGE 2: inserted substructure rendering (sill beams + piles)")

# ─────────────────────────────────────────────────────────────────────
# CHANGE 3: v3dApply — add gSub visibility control
# ─────────────────────────────────────────────────────────────────────
OLD3 = "  V3.gGird.visible = solid && $('v3d_gird').checked;\n  V3.gDeck.visible = solid && $('v3d_deck').checked;\n  V3.gBrg.visible  = $('v3d_brg').checked;\n  V3.gWire.visible = wire;"

NEW3 = "  V3.gGird.visible = solid && $('v3d_gird').checked;\n  V3.gDeck.visible = solid && $('v3d_deck').checked;\n  V3.gBrg.visible  = $('v3d_brg').checked;\n  if(V3.gSub) V3.gSub.visible = true;   // substructure always visible\n  V3.gWire.visible = wire;"

assert OLD3 in html, "CHANGE 3 anchor not found"
html = html.replace(OLD3, NEW3, 1)
changes.append("CHANGE 3: gSub always visible in v3dApply")

# ─────────────────────────────────────────────────────────────────────
# CHANGE 4: update the legend to add sill beam + pile entries
# ─────────────────────────────────────────────────────────────────────
OLD4 = """  $('v3d_legend').innerHTML = ['girder','dummy','slab','rigid','end'].map(function(k){
    return '<span><i style="background:var(--'+(k==='end'?'edge':k)+')"></i>'+
      ({girder:'Girder',dummy:'Dummy',slab:'Transverse slab',rigid:'Rigid link',end:'Perimeter'}[k])+'</span>';
  }).join('');"""

NEW4 = """  $('v3d_legend').innerHTML = ['girder','dummy','slab','rigid','end'].map(function(k){
    return '<span><i style="background:var(--'+(k==='end'?'edge':k)+')"></i>'+
      ({girder:'Girder',dummy:'Dummy',slab:'Transverse slab',rigid:'Rigid link',end:'Perimeter'}[k])+'</span>';
  }).join('')
  + '<span><i style="background:#1a7a5a"></i>Sill beam</span>'
  + '<span><i style="background:#8B6914"></i>Pile / column</span>';"""

assert OLD4 in html, "CHANGE 4 anchor not found"
html = html.replace(OLD4, NEW4, 1)
changes.append("CHANGE 4: legend updated with sill beam + pile")

# ─────────────────────────────────────────────────────────────────────
# CHANGE 5: update the 3D note to mention substructure
# ─────────────────────────────────────────────────────────────────────
OLD5 = """  var nEl = m.els.length;
  $('v3d_note').innerHTML = 'Swept from the live model: ' + G.length + ' girders along their own alignment offsets, '
    + 'deck clipped to both skewed ends, ' + nEl + ' grillage members coloured by type. '
    + 'The Super-T outline is the Section Designer polygon, so changing a section parameter changes this view. '
    + '<span style="color:var(--muted)">Rendered about a local origin because WebGL cannot hold MGA magnitudes at single precision; '
    + 'every coordinate reported elsewhere is still true MGA.</span>';"""

NEW5 = """  var nEl = m.els.length;
  $('v3d_note').innerHTML = 'Swept from the live model: ' + G.length + ' girders along their own alignment offsets, '
    + 'deck clipped to both skewed ends, ' + nEl + ' grillage members coloured by type. '
    + 'Substructure: sill beams (teal), \\u00d81050 pile/column elements (amber) and pile-toe markers from the embedded MCT. '
    + 'The Super-T outline is the Section Designer polygon, so changing a section parameter changes this view. '
    + '<span style="color:var(--muted)">Rendered about a local origin because WebGL cannot hold MGA magnitudes at single precision; '
    + 'every coordinate reported elsewhere is still true MGA.</span>';"""

assert OLD5 in html, "CHANGE 5 anchor not found"
html = html.replace(OLD5, NEW5, 1)
changes.append("CHANGE 5: note updated to mention substructure")

# ─────────────────────────────────────────────────────────────────────
# Write and report
# ─────────────────────────────────────────────────────────────────────
with open(DST, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Source length : {orig_len:,} chars")
print(f"Output length : {len(html):,} chars")
print(f"Delta         : {len(html)-orig_len:+,} chars")
print(f"\nChanges applied ({len(changes)}):")
for c in changes:
    print(f"  ✓ {c}")
print(f"\nOutput: {DST}")
