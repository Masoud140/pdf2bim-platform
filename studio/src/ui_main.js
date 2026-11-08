/* ===== Bridge Studio UI: start-up ===== */
(function () {
  'use strict';
  var LIBS = { jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', autotable: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' }, got = {};
  U.lib = function (k) {   /* export libraries load on first use */
    return got[k] || (got[k] = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = LIBS[k]; s.onload = res; s.onerror = function () { delete got[k]; rej(new Error('could not load ' + k)); }; document.head.appendChild(s); }));
  };
  try { var th = localStorage.getItem('bs-theme'); if (th) document.documentElement.setAttribute('data-theme', th); } catch (e) {}
  var tab = null; try { tab = localStorage.getItem('bs-tab'); } catch (e) {}
  U.loadCase('cs01'); if (tab && U.RENDER[tab]) U.ST.tab = tab;
  U.shell(); U.paint(); U.run();
})();
