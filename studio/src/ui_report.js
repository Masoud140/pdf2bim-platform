/* ===== Bridge Studio UI: reports (preview, PDF, Excel, HTML). Every table is built from the current results; stale results are refused. ===== */
(function () {
  'use strict';
  var ST = U.ST, esc = U.esc, f = U.f;
  var LIGHT = { '--ink': '#13202c', '--mut': '#5b6b7a', '--acc': '#0b7aa3', '--load': '#b86b00', '--ok': '#1d7f4e', '--bad': '#b3261e', '--warn': '#9a6400', '--axis': '#9aa7b3', '--grid': '#e3e8ed', '--panel': '#ffffff', '--plot-bg': '#ffffff', '--line2': '#e6ebf0', '--accs': '#e3f2f8', '--line': '#d5dce3' };
  function printable(svg) {   /* resolve the theme tokens to light colours and inline the chart styles */
    svg = svg.replace(/var\((--[a-z0-9-]+)\)/g, function (m, k) { return LIGHT[k] || '#5b6b7a'; });
    if (svg.indexOf('xmlns=') < 0) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    return svg.replace(/(<svg[^>]*>)/, '$1<style>text{font-family:Helvetica,Arial,sans-serif;font-size:10.5px;fill:#5b6b7a}.ttl{fill:#13202c;font-weight:600}.gl{stroke:#e3e8ed}.ax{stroke:#9aa7b3}</style><rect width="100%" height="100%" fill="#ffffff"/>');
  }
  function png(svg, w) {
    return new Promise(function (res) {
      var m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg), vw = m ? +m[1] : 640, vh = m ? +m[2] : 300, W = w || 1280, H = Math.round(W * vh / vw);
      var img = new Image(); img.onload = function () { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H); res({ url: c.toDataURL('image/png'), w: W, h: H }); };
      img.onerror = function () { res(null); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(printable(svg));
    });
  }
  function jpeg(url) { return new Promise(function (res) { var img = new Image(); img.onload = function () { var c = document.createElement('canvas'); c.width = img.width; c.height = img.height; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0); res(c.toDataURL('image/jpeg', 0.88)); }; img.onerror = function () { res(null); }; img.src = url; }); }
  function svgOnly(html) { var m = /<svg[\s\S]*?<\/svg>/.exec(html); return m ? m[0] : null; }

  /* ---------- report model: sections of paragraphs and tables, shared by every format ---------- */
  U.reportModel = function () {
    var p = ST.p, c = CORE.CASES[ST.caseId], g = CORE.geometry(p), sc = CORE.sections(p, g), A = U.A(), d = U.digest(), S = [];
    var cur = { a: U.ok('analysis') && U.ok('combos'), d: U.ok('design'), p: U.ok('piles') };
    S.push({ h: 'Summary', p: U.summaryText().concat(['Generic case study with illustrative inputs. Code coefficients are unverified transcriptions held in the platform standards inventory. This report is not a design certification or compliance statement.']) });
    S.push({ h: 'Warnings and notes', t: { head: ['Level', 'Note'], rows: U.warnings().map(function (w) { return [w[0], w[1]]; }) } });
    var IN = [['Geometry', 'Spans', p.spans.join(' + '), 'm'], ['Geometry', 'Skew', p.skew, '°'], ['Geometry', 'Girders', g.ng, ''], ['Geometry', 'Girder spacing', p.spacing, 'm'], ['Geometry', 'Deck overhang', p.overhang, 'm'], ['Geometry', 'Deck width (calculated)', f(g.W, 3), 'm'], ['Geometry', 'Traffic lanes (calculated)', g.lanes, ''],
      ['Section', 'Girder', p.girder, ''], ['Section', 'Deck slab', p.slab, 'mm'], ['Section', 'Top flange width (calculated)', f(sc.fw), 'mm'], ['Materials', "f'c girder / transfer / deck", p.fcG + ' / ' + p.fcT + ' / ' + p.fcD, 'MPa'],
      ['Loads', 'Barrier', p.barrierLoad, 'kN/m'], ['Loads', 'Surfacing', p.surf + ' mm at ' + p.gSurf, 'kN/m³'], ['Loads', 'Utilities', p.utilities, 'kN/m'], ['Loads', 'Construction live load', p.constLL, 'kPa'],
      ['Prestress', 'Strands', U.strandStats(p, sc).n + ' × ' + p.db + ' mm', ''], ['Prestress', 'Jacking stress', p.jack + ' × MBL', ''], ['Prestress', 'Transfer / deck pour / SDL / final', p.stage.tau + ' / ' + p.stage.pour + ' / ' + p.stage.sidlA + ' / ' + p.stage.final, 'days'],
      ['Shear reinforcement', 'Ligatures', 'N' + p.fitD + ', ' + p.fitLegs + ' legs per web at ' + p.fitS, 'mm'], ['Mesh', 'Elements per span', p.nEl, ''], ['Mesh', 'Bearing stiffness', p.kv, 'kN/m'],
      ['Piles', 'Piles per abutment', p.piles.n + ' × Ø' + p.piles.D + ' at ' + p.piles.s + ' m', ''], ['Piles', 'Reinforcement', p.piles.nBar + ' N' + p.piles.dBar + ', cover ' + p.piles.cover, 'mm']];
    S.push({ h: 'Inputs', t: { head: ['Group', 'Input', 'Value', 'Unit', 'Source'], rows: IN.map(function (r) { return r.concat([/calculated/.test(r[1]) ? 'Calculated' : 'Illustrative input']); }) } });
    var ids = ST.cases.filter(function (x) { return !x.proposed; }).map(function (x) { return x.id; });
    S.push({ h: 'Load cases', t: { head: ['Case', 'Description', 'Class', 'Included'], rows: ST.cases.map(function (x) { return [x.id, x.name, x.cls, x.proposed ? 'proposed, not modelled' : x.on ? 'yes' : 'no']; }) } });
    S.push({ h: 'Load combinations (factors, unverified)', t: { head: ['ID', 'Limit state', 'Name'].concat(ids), rows: ST.combos.map(function (cb) { return [cb.id, cb.ls, cb.name].concat(ids.map(function (i) { return cb.f[i] || ''; })); }) } });
    if (cur.a) {
      var rows = [], mid = Math.round(A.m.n / 2);
      A.g.spans.forEach(function (sp, k) { for (var i = 0; i < A.g.ng; i++) { var km = 'M:' + k + ':' + i + ':' + Math.min(mid, A.m.n - 1) + ':a', kv = 'V:' + k + ':' + i + ':0', a = ANALYSIS.governing(A, km, 'ULS', 'max'), b = ANALYSIS.governing(A, kv, 'ULS'), s = ANALYSIS.governing(A, km, 'SLS', 'max');
        rows.push([A.g.spans.length > 1 ? 'S' + (k + 1) + ' G' + (i + 1) : 'G' + (i + 1), f(ANALYSIS.val(A, km, 'G1') + ANALYSIS.val(A, km, 'G2')), f(ANALYSIS.val(A, km, 'SDLs') + ANALYSIS.val(A, km, 'SDLp')), A.V.M1600 ? f(ANALYSIS.val(A, km, 'M1600', 'max')) : '–', a ? f(a.v) + ' (' + a.id + ')' : '–', b ? f(Math.abs(b.v)) + ' (' + b.id + ')' : '–', s ? f(s.v) + ' (' + s.id + ')' : '–']); } });
      S.push({ h: 'Analysis results (mid-span moment, support shear)', p: ['Grillage: ' + A.m.nodes.length + ' nodes, ' + A.m.els.length + ' members, ' + f(A.nd) + ' equations; solved in ' + f(A.ms) + ' ms. Values in kNm and kN.'], t: { head: ['Girder', 'M dead (girder alone)', 'M SDL', 'M M1600 max', 'ULS M* (by)', 'ULS V* support (by)', 'SLS M (by)'], rows: rows } });
    } else S.push({ h: 'Analysis results', p: ['Not included: the analysis results are out of date or have not been run.'] });
    if (cur.d) {
      S.push({ h: 'Design checks (worst girder per check)', t: { head: ['Group', 'Check', 'Girder', 'Demand', 'Capacity / limit', 'Unit', 'Utilisation', 'Status', 'Governing'], rows: U.worstChecks(ST.R.design.data.CK).map(function (x) { return [x.grp, x.name, 'G' + (x.gi + 1) + (A.g.spans.length > 1 ? ' S' + (x.sk + 1) : ''), f(x.dem, Math.abs(x.dem) < 10 ? 2 : 0), x.cap === null ? '–' : f(x.cap, Math.abs(x.cap) < 10 ? 2 : 0), x.unit, x.u === null ? '–' : x.u.toFixed(2), x.ok === null ? 'info' : x.ok ? 'OK' : 'NG', x.gov]; }) } });
      var DD = ST.R.design.data.D;
      S.push({ h: 'Prestress and camber', t: { head: ['Girder', 'Jacking (kN)', 'After transfer (kN)', 'Long term (kN)', 'Total loss (%)', 'Hog at pour (mm)', 'Long-term hog (mm)'], rows: [].concat.apply([], DD.map(function (row, k) { return row.map(function (x, i) { if (x.err) return ['G' + (i + 1), x.err, '', '', '', '', '']; var hp = x.hog.filter(function (q) { return q.t <= p.stage.pour; }).pop(); return [(DD.length > 1 ? 'S' + (k + 1) + ' ' : '') + 'G' + (i + 1), f(x.Pi), f(x.P0), f(x.Pfinal), f(100 * (1 - x.Pfinal / x.Pi), 1), f(hp && hp.mid, 1), f(x.hog[x.hog.length - 1].mid, 1)]; }); })) } });
    } else S.push({ h: 'Design checks', p: ['Not included: the design results are out of date or have not been run.'] });
    if (cur.p) { var PR = ST.R.piles.data; S.push({ h: 'Abutment piles', t: { head: ['Abutment', 'Worst combination', 'Pile', 'N* (kN)', 'M* (kNm)', 'φMu (kNm)', 'Utilisation'], rows: ['A', 'B'].map(function (s) { var w = PR[s].worst; return w ? [s, w.id, 'P' + (w.i + 1), f(w.N), f(w.M), f(w.cap), w.u.toFixed(2)] : [s, '–', '', '', '', '', '']; }) }, p: ['Rigid cap; illustrative eccentricity and lever arm; no soil model; geotechnical capacity not assessed.'] }); }
    S.push({ h: 'Calculation method', p: CORE.METHOD.map(function (t) { return t.replace('at 0.1 m', 'at ' + p.sweep + ' m'); }) });
    S.push({ h: 'Run record', t: { head: ['Step', 'Run', 'Time', 'Duration (ms)', 'Status'], rows: U.ORDER.map(function (n) { var r = ST.R[n], s = U.status(n); return [U.DEP[n].label, r ? '#' + r.id : '–', r ? r.at.toLocaleString('en-AU') : '–', r ? f(r.ms) : '–', s.s === 'cur' ? 'current' : s.s === 'none' ? 'not run' : 'out of date: ' + s.why.join(', ')]; }) } });
    return { title: 'Bridge Studio calculation report', sub: c.name + ' – ' + c.title, date: new Date().toLocaleString('en-AU'), S: S, cur: cur };
  };
  U.reportImages = async function () {
    var out = [], p = ST.p, g = CORE.geometry(p), sc = CORE.sections(p, g);
    try { var s3 = U.V3.snapshot(1400, 760); if (s3) out.push({ cap: '3D model, isometric view (substructure schematic)', url: s3, w: 1400, h: 760 }); } catch (e) { console.warn(e); }
    var st = await png(U.strandSVG(p, sc, { print: true, w: 640, xmlns: true }), 1280); if (st) out.push({ cap: 'Super-T cross-section and strand layout', url: st.url, w: st.w, h: st.h });
    var A = U.A(); if (A && U.ok('combos')) {
      var d = U.digest(), k = d.gov ? d.gov.k : 0, i = d.gov ? d.gov.i : 0, cb = d.gov ? d.gov.id : ST.combos[0].id;
      var mx = ANALYSIS.line(A, k, i, 'M', cb, 'max'), mn = ANALYSIS.line(A, k, i, 'M', cb, 'min'), svg = svgOnly(U.chart({ title: 'Bending moment envelope, G' + (i + 1) + ', ' + cb, series: [{ name: 'max', pts: mx.map(function (q) { return [q.x, q.v]; }) }, { name: 'min', pts: mn.map(function (q) { return [q.x, q.v]; }), color: 'var(--load)' }], xl: 'distance along the span (m)', yl: 'moment (kNm)', flip: true, h: 260 }));
      var b = svg && await png(svg, 1280); if (b) out.push({ cap: 'Critical girder bending moment envelope (sagging drawn down)', url: b.url, w: b.w, h: b.h });
    }
    return out;
  };

  /* ---------- exports ---------- */
  async function save(name, data, type) {
    var dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
    if (dl) { try { await dl.save({ filename: name, data: data }); U.toast('Saved ' + name); return; } catch (e) { U.toast(e.code === 'declined' ? 'Download cancelled' : 'Could not save the file (' + (e.code || e.message) + ')'); return; } }
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); U.toast('Download started: ' + name); }
    catch (e) { U.toast('Downloads are not available in this view'); }
  }
  var fname = function (ext) { return 'bridge-studio-' + ST.caseId + '-' + new Date().toISOString().slice(0, 10) + '.' + ext; };
  U.exportPDF = async function () {
    try { await U.lib('jspdf'); await U.lib('autotable'); } catch (e) { U.toast('The PDF library could not be loaded'); return; }
    U.toast('Building the PDF…'); var M = U.reportModel(), I = await U.reportImages(), doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), W = 210, y = 18;
    var hdr = function () { doc.setFontSize(8); doc.setTextColor(110); doc.text(M.title + ' · ' + M.sub + ' · illustrative inputs, unverified coefficients, not a compliance check', 14, 289); doc.text('page ' + doc.getNumberOfPages(), W - 14, 289, { align: 'right' }); doc.setTextColor(20); };
    doc.setFontSize(18); doc.text(M.title, 14, y); y += 8; doc.setFontSize(12); doc.text(M.sub, 14, y); y += 6; doc.setFontSize(9); doc.setTextColor(90); doc.text('Generated ' + M.date + ' by Bridge Studio', 14, y); doc.setTextColor(20); y += 8;
    M.S.forEach(function (s) {
      if (y > 255) { hdr(); doc.addPage(); y = 18; }
      doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text(s.h, 14, y); doc.setFont(undefined, 'normal'); y += 6; doc.setFontSize(9);
      (s.p || []).forEach(function (t) { var ln = doc.splitTextToSize(t, W - 28); if (y + ln.length * 4.2 > 280) { hdr(); doc.addPage(); y = 18; } doc.text(ln, 14, y); y += ln.length * 4.2 + 1.5; });
      if (s.t) { doc.autoTable({ head: [s.t.head], body: s.t.rows.map(function (r) { return r.map(String); }), startY: y, margin: { left: 14, right: 14 }, styles: { fontSize: 7.5, cellPadding: 1.4 }, headStyles: { fillColor: [11, 122, 163] }, didDrawPage: hdr }); y = doc.lastAutoTable.finalY + 8; }
    });
    for (var q = 0; q < I.length; q++) I[q].jpg = await jpeg(I[q].url);
    I.forEach(function (im) { var w = W - 28, h = w * im.h / im.w; if (y + h + 10 > 280) { hdr(); doc.addPage(); y = 18; } doc.addImage(im.jpg || im.url, im.jpg ? 'JPEG' : 'PNG', 14, y, w, h); y += h + 4; doc.setFontSize(8.5); doc.text(im.cap, 14, y); y += 8; });
    hdr(); await save(fname('pdf'), doc.output('blob'), 'application/pdf');
  };
  U.exportXLSX = async function () {
    try { await U.lib('xlsx'); } catch (e) { U.toast('The spreadsheet library could not be loaded'); return; }
    var M = U.reportModel(), wb = XLSX.utils.book_new(), add = function (name, aoa) { XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name.slice(0, 31)); };
    add('Summary', [[M.title], [M.sub], ['Generated', M.date], []].concat(M.S[0].p.map(function (t) { return [t]; })));
    M.S.forEach(function (s) { if (s.t && s.h !== 'Warnings and notes') add(s.h.replace(/[\[\]\*\?\/\\:]/g, '').replace(/\s*\(.*\)/, ''), [s.t.head].concat(s.t.rows)); });
    add('Warnings', [['Level', 'Note']].concat(U.warnings()));
    var A = U.A(); if (A && M.cur.a) {   /* full girder line results */
      var rows = [['Span', 'Girder', 'x (m)', 'ULS M* max (kNm)', 'ULS M min (kNm)', 'ULS |V*| (kN)', 'SLS M max (kNm)', 'Source']];
      A.g.spans.forEach(function (sp, k) { for (var i = 0; i < A.g.ng; i++) { var n = A.m.n; for (var j = 0; j <= n; j++) {
        var key = j < n ? 'M:' + k + ':' + i + ':' + j + ':a' : 'M:' + k + ':' + i + ':' + (j - 1) + ':b', kv = 'V:' + k + ':' + i + ':' + Math.min(j, n - 1), mxs = [], mns = [], vs = [], sl = [];
        A.CB.forEach(function (c) { var q = A.RS.idx[key], r = A.RS.idx[kv]; if (c.ls === 'ULS') { mxs.push(c.max[q]); mns.push(c.min[q]); vs.push(Math.abs(c.max[r]), Math.abs(c.min[r])); } else sl.push(c.max[q]); });
        rows.push([k + 1, 'G' + (i + 1), +(j / n * sp.L).toFixed(3), Math.max.apply(null, mxs), Math.min.apply(null, mns), Math.max.apply(null, vs), Math.max.apply(null, sl), 'Calculated']); } } });
      add('Girder results', rows);
    }
    if (M.cur.d) { var ck = [['Span', 'Girder', 'Group', 'Check', 'Demand', 'Capacity / limit', 'Unit', 'Utilisation', 'Status', 'Governing', 'Basis']]; ST.R.design.data.CK.forEach(function (row, k) { row.forEach(function (list, i) { list.forEach(function (c) { ck.push([k + 1, 'G' + (i + 1), c.grp, c.name, c.dem, c.cap, c.unit, c.u, c.ok === null ? 'info' : c.ok ? 'OK' : 'NG', c.gov, c.note]); }); }); }); add('All checks', ck); }
    var st = [['x (mm)', 'y above soffit (mm)', 'Used', 'Debond start (mm)', 'Debond end (mm)']].concat(ST.p.strands.map(function (q) { return [q.x, q.y, q.on ? 'yes' : 'no', q.d || 0, q.d2 || 0]; })); add('Strands', st);
    add('Change log', [['When', 'Action']].concat(ST.history.map(function (h) { return [new Date(h.t).toLocaleString('en-AU'), h.what]; })));
    var out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    await save(fname('xlsx'), new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  };
  U.reportHTML = function (M, I) {
    var css = 'body{font-family:Helvetica,Arial,sans-serif;color:#13202c;max-width:960px;margin:24px auto;padding:0 16px;font-size:13px;line-height:1.45}h1{font-size:22px;margin:0}h2{font-size:15px;margin:22px 0 6px;color:#075a79}table{border-collapse:collapse;width:100%;font-size:12px;margin:6px 0}th,td{border-bottom:1px solid #e3e8ed;padding:4px 6px;text-align:left}th{background:#f2f5f7}img{max-width:100%;border:1px solid #e3e8ed}.note{color:#5b6b7a;font-size:12px}';
    var h = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(M.title) + '</title><style>' + css + '</style></head><body><h1>' + esc(M.title) + '</h1><p><b>' + esc(M.sub) + '</b><br><span class="note">Generated ' + esc(M.date) + '. Illustrative inputs, unverified code coefficients; not a compliance check.</span></p>';
    M.S.forEach(function (s) { h += '<h2>' + esc(s.h) + '</h2>' + (s.p || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + (s.t ? '<table><tr>' + s.t.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr>' + s.t.rows.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' : ''); });
    (I || []).forEach(function (im) { h += '<figure><img src="' + im.url + '" alt="' + esc(im.cap) + '"><figcaption class="note">' + esc(im.cap) + '</figcaption></figure>'; });
    return h + '</body></html>';
  };
  U.exportHTML = async function () { var M = U.reportModel(), I = await U.reportImages(); await save(fname('html'), new Blob([U.reportHTML(M, I)], { type: 'text/html' })); };

  /* ---------- 8. Reports page ---------- */
  var IMG = null, IMGK = '';
  var imgKey = function () { return JSON.stringify(ST.p) + U.ORDER.map(function (n) { return ST.R[n] ? ST.R[n].id : 0; }).join(','); };
  U.RENDER.reports = function () {
    var M = U.reportModel(), stale = !(M.cur.a && M.cur.d), h = '<div><h1 class="h1">Reports and documentation</h1><p class="lede">One report model feeds the preview, the PDF, the Excel workbook and the HTML file. Results that are out of date are left out and say so.</p></div>';
    h += '<section class="card"><h3>Export</h3><div class="row"><button class="btn pri" data-act="x-pdf">Download PDF report</button><button class="btn" data-act="x-xlsx">Download Excel workbook</button><button class="btn" data-act="x-html">Download HTML report</button><button class="btn ghost" data-act="x-img">Refresh images</button></div>' + (stale ? U.staleBox(['analysis', 'combos', 'design', 'piles'], 'results') : '<p class="note">All results are current. The workbook adds full girder line results, every check for every girder, the strand table and the run record.</p>') + '</section>';
    h += '<section class="card"><h3>' + esc(M.title) + ' <span class="sub">' + esc(M.sub) + ' · ' + esc(M.date) + '</span></h3>';
    M.S.forEach(function (s) { h += '<div style="display:grid;gap:6px"><h3 style="font-size:13px;color:var(--acc2)">' + esc(s.h) + '</h3>' + (s.p || []).map(function (t) { return '<p style="margin:0">' + esc(t) + '</p>'; }).join('') + (s.t ? '<div class="tbox"><table class="t"><thead><tr>' + s.t.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + s.t.rows.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '') + '</div>'; });
    h += '<div id="rep-img" class="grid2">' + (IMG && IMGK === imgKey() ? IMG.map(function (im) { return '<figure style="margin:0"><img src="' + im.url + '" alt="' + esc(im.cap) + '" style="width:100%;border:1px solid var(--line);border-radius:5px;background:#fff"><figcaption class="note">' + esc(im.cap) + '</figcaption></figure>'; }).join('') : '<p class="note">Building figures…</p>') + '</div></section>';
    return h;
  };
  var building = false;
  U.AFTER.reports = function () {
    var k = imgKey(); if ((IMG && IMGK === k) || building) return;
    building = true; U.reportImages().then(function (I) { IMG = I; IMGK = k; building = false; if (ST.tab === 'reports') U.paint(); }, function () { building = false; });
  };
  U.ACT['x-pdf'] = function (a) { a.disabled = true; U.exportPDF().catch(function (e) { console.error(e); U.toast('Export failed: ' + e.message); }).finally(function () { a.disabled = false; }); };
  U.ACT['x-xlsx'] = function (a) { a.disabled = true; U.exportXLSX().catch(function (e) { console.error(e); U.toast('Export failed: ' + e.message); }).finally(function () { a.disabled = false; }); };
  U.ACT['x-html'] = function (a) { a.disabled = true; U.exportHTML().catch(function (e) { console.error(e); U.toast('Export failed: ' + e.message); }).finally(function () { a.disabled = false; }); };
  U.ACT['x-img'] = function () { IMG = null; U.paint(); };
})();
