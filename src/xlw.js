
/* ===== XLW: minimal .xlsx writer (inline strings, formulas, styles, defined names, conditional formats) — no external library ===== */
var XLW=(function(){
  var crcT=null;
  function crc32(u){ if(!crcT){ crcT=new Uint32Array(256); for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; crcT[n]=c>>>0; } }
    var c=0xFFFFFFFF; for(var i=0;i<u.length;i++) c=crcT[(c^u[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
  function zip(files){
    var enc=new TextEncoder(), parts=[], cen=[], off=0, T=0, Dd=((2026-1980)<<9)|(1<<5)|1;
    files.forEach(function(f){ var nm=enc.encode(f.name), d=enc.encode(f.data), crc=crc32(d);
      var h=new DataView(new ArrayBuffer(30)); h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0,true); h.setUint16(8,0,true); h.setUint16(10,T,true); h.setUint16(12,Dd,true);
      h.setUint32(14,crc,true); h.setUint32(18,d.length,true); h.setUint32(22,d.length,true); h.setUint16(26,nm.length,true); h.setUint16(28,0,true);
      parts.push(new Uint8Array(h.buffer),nm,d);
      var c=new DataView(new ArrayBuffer(46)); c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint16(8,0,true); c.setUint16(10,0,true); c.setUint16(12,T,true); c.setUint16(14,Dd,true);
      c.setUint32(16,crc,true); c.setUint32(20,d.length,true); c.setUint32(24,d.length,true); c.setUint16(28,nm.length,true); c.setUint32(42,off,true);
      cen.push(new Uint8Array(c.buffer),nm); off+=30+nm.length+d.length; });
    var cs=cen.reduce(function(a,b){ return a+b.length; },0), e=new DataView(new ArrayBuffer(22));
    e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true); e.setUint32(12,cs,true); e.setUint32(16,off,true);
    return new Blob(parts.concat(cen,[new Uint8Array(e.buffer)]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function col(c){ var s=''; c++; while(c>0){ var m=(c-1)%26; s=String.fromCharCode(65+m)+s; c=Math.floor((c-1)/26); } return s; }
  function A1(r,c,abs){ return abs?'$'+col(c)+'$'+(r+1):col(c)+(r+1); }
  /* style kinds: font, fill, border, align */
  var FONTS=['<font><sz val="10"/><name val="Calibri"/></font>','<font><b/><sz val="10"/><name val="Calibri"/></font>','<font><sz val="10"/><color rgb="FF0000CC"/><name val="Calibri"/></font>',
    '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>','<font><i/><sz val="9"/><color rgb="FF5E6B7D"/><name val="Calibri"/></font>','<font><b/><sz val="13"/><color rgb="FF1F2A37"/><name val="Calibri"/></font>',
    '<font><b/><sz val="10"/><color rgb="FF0000CC"/><name val="Calibri"/></font>','<font><sz val="9"/><name val="Consolas"/><color rgb="FF5E6B7D"/></font>'];
  var FILLS=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'];
  var fillRGB={inp:'FFFFF2CC', calc:'FFE8F1FB', code:'FFE9E2F3', hdr:'FF2F3B4C', miss:'FFFFC7CE', sub:'FFDCE3EB', link:'FFE2F0D9', key:'FFFCE4D6'};
  Object.keys(fillRGB).forEach(function(k){ FILLS.push('<fill><patternFill patternType="solid"><fgColor rgb="'+fillRGB[k]+'"/><bgColor indexed="64"/></patternFill></fill>'); });
  var FI={none:0,inp:2,calc:3,code:4,hdr:5,miss:6,sub:7,link:8,key:9};
  var KIND={txt:[0,0,0],lbl:[0,0,0],bold:[1,0,0],hdr:[3,FI.hdr,0],sec:[5,0,0],sub:[1,FI.sub,0],inp:[2,FI.inp,1],calc:[0,FI.calc,1],code:[0,FI.code,1],chk:[1,FI.calc,1],note:[4,0,0],miss:[2,FI.miss,1],link:[0,FI.link,1],key:[1,FI.key,1],fx:[7,0,0],inpb:[6,FI.inp,1]};
  var FMT={'':0,'0':1,'0.00':2,'0.0':164,'0.000':165,'0.00E+00':166,'#,##0':3,'0.0000':167,'#,##0.0':168};
  function book(){
    var B={sheets:[], names:[], xf:[], xfKey:{}};
    B.style=function(kind,fmt){ var k=kind+'|'+(fmt||''); if(B.xfKey[k]!==undefined) return B.xfKey[k]; var K=KIND[kind]||KIND.txt, nf=FMT[fmt||'']||0;
      B.xf.push('<xf numFmtId="'+nf+'" fontId="'+K[0]+'" fillId="'+K[1]+'" borderId="'+K[2]+'" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"'+(kind==='chk'||kind==='hdr'?' applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>':(kind==='lbl'||kind==='note'||kind==='txt'||kind==='fx'?' applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>':'/>')));
      return B.xfKey[k]=B.xf.length-1; };
    B.style('txt');
    B.sheet=function(name,widths){ var S={name:name, cells:{}, widths:widths||{}, merges:[], cf:[], freeze:null, hidden:false, tab:null};
      S.set=function(r,c,v,kind,fmt){ if(v===undefined||v===null||v===''&&kind!=='inp'&&kind!=='miss'){ if(kind) S.cells[r+','+c]={r:r,c:c,v:null,s:B.style(kind,fmt)}; return A1(r,c); } S.cells[r+','+c]={r:r,c:c,v:v,s:B.style(kind||(typeof v==='number'?'calc':'txt'),fmt)}; return A1(r,c); };
      S.merge=function(r1,c1,r2,c2){ S.merges.push(A1(r1,c1)+':'+A1(r2,c2)); };
      S.okng=function(range){ S.cf.push(range); };
      B.sheets.push(S); return S; };
    B.name=function(n,ref){ B.names.push([n,ref]); };
    B.blob=function(){
      var files=[], ns=B.sheets.length;
      files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        +B.sheets.map(function(s,i){ return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('')+'</Types>'});
      files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
      files.push({name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>'
        +B.sheets.map(function(s,i){ return '<sheet name="'+esc(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'; }).join('')+'</sheets><definedNames>'
        +B.names.map(function(n){ return '<definedName name="'+n[0]+'">'+esc(n[1])+'</definedName>'; }).join('')+'</definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'});
      files.push({name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        +B.sheets.map(function(s,i){ return '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'; }).join('')
        +'<Relationship Id="rId'+(ns+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'});
      files.push({name:'xl/styles.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="5"><numFmt numFmtId="164" formatCode="0.0"/><numFmt numFmtId="165" formatCode="0.000"/><numFmt numFmtId="166" formatCode="0.00E+00"/><numFmt numFmtId="167" formatCode="0.0000"/><numFmt numFmtId="168" formatCode="#,##0.0"/></numFmts>'
        +'<fonts count="'+FONTS.length+'">'+FONTS.join('')+'</fonts><fills count="'+FILLS.length+'">'+FILLS.join('')+'</fills>'
        +'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFBFC8D3"/></left><right style="thin"><color rgb="FFBFC8D3"/></right><top style="thin"><color rgb="FFBFC8D3"/></top><bottom style="thin"><color rgb="FFBFC8D3"/></bottom><diagonal/></border></borders>'
        +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="'+B.xf.length+'">'+B.xf.join('')+'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        +'<dxfs count="2"><dxf><font><b/><color rgb="FF006100"/></font><fill><patternFill><bgColor rgb="FFC6EFCE"/></patternFill></fill></dxf><dxf><font><b/><color rgb="FF9C0006"/></font><fill><patternFill><bgColor rgb="FFFFC7CE"/></patternFill></fill></dxf></dxfs></styleSheet>'});
      B.sheets.forEach(function(S,i){
        var rows={}; Object.keys(S.cells).forEach(function(k){ var c=S.cells[k]; (rows[c.r]=rows[c.r]||[]).push(c); });
        var rk=Object.keys(rows).map(Number).sort(function(a,b){ return a-b; });
        var x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
          +(S.tab?'<sheetPr><tabColor rgb="'+S.tab+'"/></sheetPr>':'')
          +'<sheetViews><sheetView workbookViewId="0"'+(i===0?' tabSelected="1"':'')+' zoomScale="100">'+(S.freeze?'<pane xSplit="'+S.freeze[1]+'" ySplit="'+S.freeze[0]+'" topLeftCell="'+A1(S.freeze[0],S.freeze[1])+'" activePane="bottomRight" state="frozen"/>':'')+'</sheetView></sheetViews><sheetFormatPr defaultRowHeight="14"/>';
        var wk=Object.keys(S.widths); if(wk.length) x+='<cols>'+wk.map(Number).sort(function(a,b){ return a-b; }).map(function(c){ return '<col min="'+(c+1)+'" max="'+(c+1)+'" width="'+S.widths[c]+'" customWidth="1"/>'; }).join('')+'</cols>';
        x+='<sheetData>'+rk.map(function(r){ return '<row r="'+(r+1)+'">'+rows[r].sort(function(a,b){ return a.c-b.c; }).map(function(c){ var ref=A1(c.r,c.c);
          if(c.v===null) return '<c r="'+ref+'" s="'+c.s+'"/>';
          if(typeof c.v==='object'&&c.v.f!==undefined) return '<c r="'+ref+'" s="'+c.s+'"'+(c.v.str?' t="str"':'')+'><f>'+esc(c.v.f.replace(/^=/,'').replace(/(^|[^._A-Za-z])(MAXIFS|MINIFS)\(/g,'$1_xlfn.$2('))+'</f></c>';
          if(typeof c.v==='number') return isFinite(c.v)?'<c r="'+ref+'" s="'+c.s+'"><v>'+c.v+'</v></c>':'<c r="'+ref+'" s="'+c.s+'"/>';
          return '<c r="'+ref+'" s="'+c.s+'" t="inlineStr"><is><t xml:space="preserve">'+esc(c.v)+'</t></is></c>'; }).join('')+'</row>'; }).join('')+'</sheetData>';
        if(S.merges.length) x+='<mergeCells count="'+S.merges.length+'">'+S.merges.map(function(m){ return '<mergeCell ref="'+m+'"/>'; }).join('')+'</mergeCells>';
        var p=1; S.cf.forEach(function(rg){ var tl=rg.split(':')[0];
          x+='<conditionalFormatting sqref="'+rg+'"><cfRule type="containsText" dxfId="1" priority="'+(p++)+'" operator="containsText" text="NG"><formula>NOT(ISERROR(SEARCH("NG",'+tl+')))</formula></cfRule><cfRule type="containsText" dxfId="0" priority="'+(p++)+'" operator="containsText" text="OK"><formula>NOT(ISERROR(SEARCH("OK",'+tl+')))</formula></cfRule></conditionalFormatting>'; });
        x+='<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
        files.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:x}); });
      return zip(files);
    };
    return B;
  }
  return {book:book, A1:A1, col:col, zip:zip};
})();
