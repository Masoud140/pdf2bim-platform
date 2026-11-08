/* Validation page: platform runs of two real Super-T bridges against their design reports, anonymised.
   Numbers are imported from the platform's comparison reports (each project's model/COMPARISON_REPORT.md, run 2026-11-09);
   nothing here is computed in the browser. No bridge, drawing, report or client identifiers. */
(function () {
  var U = window.U, esc = U.esc, f = U.f;
  var BM = [
    { id: 'A', t: 'Benchmark A: single-span Super-T, divided carriageway (two deck models A-1 and A-2)', rows: [
      ['Girder ULS sagging M* (kNm)', 15924, 14883, 14281],
      ['Girder SLS moment (kNm)', 10528, 9745, 10217],
      ['Girder ULS shear V* incl. torsion (kN)', 2157, 2195, 2006],
      ['Girder φMu at mid-span (kNm)', 17057, 14296, 14002],
      ['Bearing SLS N max (kN)', 2015, 1848, 1866],
      ['Pile ULS N max, abutment (kN), A-1 / A-2 design values differ', null, 4410, 3816, '4,210 / 3,524 kN in the design'],
      ['Pile ULS moment, abutment (kNm), A-1 / A-2 design values differ', null, 981, 967, '1,771 / 2,049 kNm in the design']],
      cols: ['Design report', 'Platform A-1', 'Platform A-2'] },
    { id: 'B', t: 'Benchmark B: two-span curved Super-T on a blade pier (each span its own model)', rows: [
      ['Critical girder ULS M* (kNm)', 15089, 16354],
      ['Critical girder ULS V* (kN)', 1716, 2404, null, 'platform: largest |V| along the girder; the report gives V* at its critical section'],
      ['Critical girder φMu at mid-span (kNm)', 15726, 13484, null, 'platform nominal Mu 16,660 kNm'],
      ['φMu, independent hand check, Cl 8.1.8 (kNm)', 15726, 13158, null, 'hand check nominal Mu 16,448 kNm'],
      ['SLS soffit stress at Ms* (MPa)', 3.15, 8.83, null, 'combination and limit (3.16) not stated in the report'],
      ['Pile ULS N max, abutment A (kN)', 6606, 4904, null, 'design value covers a wider abutment'],
      ['Pile ULS N max, abutment B (kN)', 5840, 4843],
      ['Pier pile ULS N max (kN)', 8562, 12994, null, 'upper bound: two span envelopes summed + wall weight']],
      cols: ['Design report', 'Platform'] }];
  var FIND = [
    'Flexural strength: the platform φMu agrees with an independent hand calculation (AS 5100.5 Cl 8.1.8) within 2–4 %. The design reports\' capacities are close to the nominal Mu, so it is open whether they are Mu or φMu (query to the designer).',
    'Haunch: reading the haunch from the deck levels, bearing levels, pads and camber (Benchmark B: 26–111 mm) raised φMu by about 6 %; a 0 mm placeholder is conservative.',
    'Haunch concrete as superimposed dead load at the ULS factor 2.0 (owner rule) adds about 1,000 kNm of M* compared with treating it as dead load (1.2).',
    'SLS soffit stress: the report\'s combination and tension limit are not stated; the platform\'s governing SLS row passes its own decompression check (Ms*/Mal 0.94).',
    'Pile moments: the platform gives about half the design values on Benchmark A; cause not yet identified.'];
  U.RENDER.validation = function () {
    var h = '<div><h1 class="h1">Validation against real bridges</h1><p class="lede">Platform runs of two Super-T bridges from their drawings, compared with the designer\'s report. Results are imported from the platform runs, not computed in this page. Inputs not on the drawings used generic proposals; standards entries are unverified. Whether a difference is acceptable is the engineer\'s call.</p></div>';
    BM.forEach(function (b) {
      var two = b.cols.length > 2;
      h += '<section class="card"><h3>' + esc(b.t) + ' ' + U.tag('calc') + U.tag('unv') + '</h3><div class="tbox"><table class="t"><thead><tr><th>Item</th>' + b.cols.map(function (c) { return '<th class="n">' + esc(c) + '</th>'; }).join('') + '<th class="n">Difference</th><th>Note</th></tr></thead><tbody>' +
        b.rows.map(function (r) {
          var ref = r[1], v = [r[2], r[3]].filter(function (x) { return x !== null && x !== undefined; }), fv = function (x) { return x === null || x === undefined ? '–' : Math.abs(x) < 100 ? f(x, 2) : f(x); };
          var d = ref ? v.map(function (x) { var p = 100 * (x - ref) / ref; return (p > 0 ? '+' : '') + p.toFixed(1) + ' %'; }).join(' / ') : '–';
          return '<tr><td>' + esc(r[0]) + '</td><td class="n">' + fv(ref) + '</td><td class="n">' + fv(r[2]) + '</td>' + (two ? '<td class="n">' + fv(r[3]) + '</td>' : '') + '<td class="n">' + d + '</td><td class="note">' + esc(r[4] || '') + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
    });
    h += '<section class="card"><h3>Findings</h3><ul class="note" style="display:grid;gap:6px;padding-left:18px">' + FIND.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
    return h;
  };
})();
