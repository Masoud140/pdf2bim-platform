async function de(i){if(!i.ok)throw new Error(`${i.status} ${(await i.text()).replace(/<[^>]+>/g," ").trim().slice(0,300)}`);return i.json()}var me=i=>`/api/projects/${encodeURIComponent(i)}`,ce=window.PDF2BIM_STATIC||null,Tc=i=>i.replace(/^\//,"").replace(/\?/g,"__").replace(/=/g,"-").replace(/&/g,"__")+".json",fe=(i,t)=>ce?t?.method&&t.method!=="GET"?Promise.reject(new Error("This online copy is read-only. Upload drawings and run the chain in the app on your computer.")):window.fetch("data/"+Tc(i)):window.fetch(i,t),yt={projects:()=>fe("/api/projects").then(i=>de(i)),create:i=>fe("/api/projects",{method:"POST",body:i}).then(t=>de(t)),values:(i,t)=>fe(`${me(i)}/values?allow_proposed=${t?1:0}`).then(e=>de(e)),drawings:i=>fe(`${me(i)}/drawings`).then(t=>de(t)),upload:(i,t)=>fe(`${me(i)}/drawings`,{method:"POST",body:t}).then(e=>de(e)),pageUrl:(i,t,e,n)=>`${me(i)}/drawings/${encodeURIComponent(t)}/${e}.png?dpi=${n}`,run:(i,t)=>fe(`${me(i)}/runs`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({allow_proposed:t})}).then(e=>de(e)),latest:i=>fe(`${me(i)}/runs/latest`).then(t=>de(t)),result:(i,t)=>fe(`${me(i)}/results/${t}`).then(e=>de(e)),decisions:i=>fe(`${me(i)}/decisions`).then(t=>de(t)),decide:(i,t,e)=>fe(`${me(i)}/decisions/${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then(n=>de(n)),enterValue:(i,t)=>fe(`${me(i)}/values`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).then(e=>de(e)),verification:i=>fe(`${me(i)}/verification`).then(t=>de(t)),revisions:i=>fe(`${me(i)}/revisions`).then(t=>de(t)),revDiff:(i,t,e)=>fe(`${me(i)}/revisions/${t}/${e}`).then(n=>de(n)),saveBatch:(i,t)=>fe(`${me(i)}/values/batch`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).then(e=>de(e)),loads:i=>fe(`${me(i)}/loads`).then(t=>de(t)),settings:()=>fe("/api/settings").then(i=>de(i)),saveSettings:i=>fe("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)}).then(t=>de(t)),extract:(i,t)=>fe(`${me(i)}/extract`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t?{pages:t}:{})}).then(e=>de(e)),extractLatest:i=>fe(`${me(i)}/extract/latest`).then(t=>de(t)),fileUrl:(i,t)=>ce?null:`${me(i)}/files/${encodeURIComponent(t)}`,descUrl:i=>ce?null:`${me(i)}/description.json`};function m(i,t={},...e){let n=document.createElement(i);for(let[s,r]of Object.entries(t))r==null||r===!1||(typeof r=="function"?n.addEventListener(s.replace(/^on/,""),r):s==="class"?n.className=String(r):s==="html"?n.innerHTML=String(r):n.setAttribute(s,r===!0?"":String(r)));return Lo(n,e),n}function Lo(i,t){for(let e of t)e==null||e===!1||(Array.isArray(e)?Lo(i,e):i.append(e instanceof Node?e:document.createTextNode(String(e))))}var ot=(i,t)=>i==null?"\u2014":typeof i=="number"?t===void 0?String(i):i.toLocaleString("en-AU",{maximumFractionDigits:t,minimumFractionDigits:t}):typeof i=="object"?Object.entries(i).map(([e,n])=>`${e}: ${n}`).join(" \xB7 "):String(i),ki=["Direct","Calculated","Confirmed-Engineer","Input-user","Standard-verify","Model","Assumed","Missing-Flagged"],Ue=i=>m("span",{class:`tag t-${(i||"none").replace(/[^A-Za-z]/g,"")}`},i||"\u2014");function zi(i){return i==null||Number.isNaN(i)?"u-na":i>1?"u-fail":i>.9?"u-warn":"u-ok"}function ae(i,t,e=""){return m("div",{class:"tablewrap"},m("table",{class:e},m("thead",{},m("tr",{},i.map(n=>m("th",{},n)))),m("tbody",{},t.map(n=>m("tr",{},n.map(s=>s instanceof HTMLElement&&s.tagName==="TD"?s:m("td",{},s)))))))}var be=(i,t)=>m("div",{class:"empty"},m("h3",{},i),m("p",{},t));var Vi={M:["Bending moment","kN\xB7m"],V:["Shear force","kN"],R:["Bearing reaction","kN"]},le={model:"",key:"",side:"max"};async function Do(i,t,e,n,s){let[r,{rows:a}]=await Promise.all([yt.result(i,"traffic.json"),yt.values(i,!0)]),o=m("div",{},t(r.meta)),l=a.filter(T=>T.path.startsWith("loads.lane_layouts.rows")),c=a.filter(T=>T.path==="deck.carriageway_left"||T.path==="deck.carriageway_right"||T.path.startsWith("deck.carriageways")),u=[],d=m("tbody"),p=()=>d.replaceChildren(...l.map(T=>{let P=T.value;return m("tr",{},m("td",{},P?.name??""),m("td",{class:"mono"},P?.lanes??""),m("td",{},Ue(T.tag)),m("td",{class:"small muted"},T.path))}),...u.map((T,P)=>m("tr",{class:"r-Inputuser"},m("td",{},T.name),m("td",{class:"mono"},T.lanes),m("td",{},m("span",{class:"pill warn"},"new, not saved")),m("td",{},m("button",{class:"btn ghost small",onclick:()=>{u.splice(P,1),p()}},"remove"))))),g=m("input",{placeholder:"layout name, e.g. two lanes left",size:22}),_=m("input",{placeholder:"lane left edges, m from the control line, e.g. -6.2, -3.0",size:36}),x=m("input",{placeholder:"reason (recorded with the decision)",size:32}),f=m("div",{class:"small"}),h=()=>{if(!g.value.trim()||!_.value.trim()){f.textContent="Give the layout a name and its lane left edges.";return}u.push({name:g.value.trim(),lanes:_.value.trim()}),g.value="",_.value="",f.textContent="",p()},M=async T=>{if(!u.length){f.textContent="Nothing to save.";return}f.textContent="Saving\u2026";try{let P=await yt.saveBatch(i,{by:e(),reason:x.value||"lane layouts entered on the Moving loads tab",items:[],new_rows:u.map(E=>({table:"loads.lane_layouts",cells:E}))});f.textContent=`Saved as ${P.decision} (${P.changed} values).`,u.length=0,T?(await yt.run(i,!0),f.textContent+=" Run started: the traffic envelope now uses these layouts."):setTimeout(s,900)}catch(P){f.textContent=P.message}};if(o.append(m("div",{class:"card"},m("h3",{},"Lane layouts"),m("p",{class:"small muted"},"AS 5100.2 standard design lanes of ",m("b",{},ot(r.data?.lane_width??3.2,1)," m"),' placed across the carriageway. With no layouts entered the engine sweeps the lane set across the carriageway at the sweep step and envelopes every position (MIDAS "lane sweep"); layouts entered here replace the sweep, each row being one lane set the envelope checks (MIDAS lane sets). Carriageway: ',c.map(T=>m("span",{class:"chipline"},m("span",{class:"mono"},T.path.replace("deck.",""))," ",ot(T.value)," ",Ue(T.tag))),". Accompanying lane factors ",(r.data?.lane_factors||[]).join(" / ")," (standards entry, unverified)."),m("div",{class:"tablewrap"},m("table",{class:"values"},m("thead",{},m("tr",{},["Layout","Lane left edges (m)","Data source",""].map(T=>m("th",{},T)))),d)),m("div",{class:"row wrap"},g,_,m("button",{class:"btn ghost",onclick:h},"Add layout"),x,n(),m("button",{class:"btn primary",onclick:()=>M(!1)},"Save"),m("button",{class:"btn",onclick:()=>M(!0)},"Save and re-run"),f))),setTimeout(p),!r.data)return o.append(be("No moving-load results yet","Run the chain: the actions step writes the lane layouts, governing load positions and influence lines (traffic.json).")),o;let w=r.data;(!le.model||!w.models.includes(le.model))&&(le.model=w.models[0]);let v=w.responses;(!le.key||!v.some(T=>T.key===le.key))&&(le.key=v.filter(T=>T.kind==="M").reduce((T,P)=>(w.states[le.model][P.key]?.max?.value??-1e99)>(w.states[le.model][T.key]?.max?.value??-1e99)?P:T,v[0]).key);let B=m("div"),C=()=>{let T=v.find(k=>k.key===le.key),P=w.states[le.model]?.[le.key]?.[le.side],E=(k,N,J,tt)=>m("div",{class:"row wrap small"},m("span",{class:"muted"},k),N.map(([rt,Mt])=>m("button",{class:"chip"+(rt===J?" on":""),onclick:()=>{tt(rt),C()}},Mt))),S=[...new Set(v.map(k=>k.girder))],R=v.filter(k=>k.girder===T.girder&&k.kind===T.kind).sort((k,N)=>k.ch-N.ch),X=`${Vi[T.kind][0]} ${T.kind==="R"?"at bearing "+T.key.replace(":R",""):"of "+T.girder+" at ch "+ot(T.ch,2)}`,U=m("div",{class:"card"},m("h3",{},"Governing load position"),E("Vehicle",w.models.map(k=>[k,k]),le.model,k=>le.model=k),E("Quantity",Object.keys(Vi).filter(k=>v.some(N=>N.kind===k)).map(k=>[k,Vi[k][0]]),T.kind,k=>{le.key=(v.find(N=>N.kind===k&&N.girder===T.girder)||v.find(N=>N.kind===k)).key}),E("Side",[["max","Maximum"],["min","Minimum"]],le.side,k=>le.side=k),E("Girder",S.map(k=>[k,k]),T.girder,k=>{le.key=(v.find(N=>N.girder===k&&N.kind===T.kind)||v.find(N=>N.girder===k)).key}),T.kind!=="R"?m("div",{class:"row wrap small"},m("span",{class:"muted"},"Station"),m("select",{onchange:k=>{le.key=k.target.value,C()}},R.map(k=>m("option",{value:k.key,selected:k.key===le.key},`ch ${ot(k.ch,2)} (${k.key.split(":")[1]})`)))):null);if(!P){B.replaceChildren(U,be("No state",`The run has no ${le.side} state for ${X}.`));return}let H=(k,N,J)=>m("div",{class:"card tile"},m("div",{class:"small muted"},k),m("div",{class:"big"},N),m("div",{class:"small muted"},J)),Z=P.loads.filter(k=>k[2]>1).length,L=m("div",{class:"grid tiles"},H(X,ot(P.value,1)+" "+Vi[T.kind][1],`${le.model} characteristic (DLA and lane factors, no load factor)`),H("Lane layout",`${w.layouts.findIndex(k=>k.length===P.layout.length&&k.every((N,J)=>Math.abs(N-P.layout[J])<.001))+1||"?"} of ${w.layouts.length}`,`${w.layout_mode}: lane left edges ${P.layout.map(k=>ot(k,2)).join(", ")} m`),H("Loads",`${Z} wheel points`,`${P.loads.length-Z} patterned UDL bands; factors ${P.factors.map(k=>k[1]).join(" / ")}`));B.replaceChildren(U,L,m("div",{class:"card"},Ac(w,T,P)),m("div",{class:"card"},m("h3",{},"Lane ranking"),ae(["Lane left edge (m)","Accompanying factor"],P.factors.map(k=>[ot(k[0],2),ot(k[1],2)]),"num")),m("div",{class:"card"},m("h3",{},"Influence lines"),m("p",{class:"small muted"},`${X} per 1 kN moving along each lane centre of the first layout (offsets ${w.il_offsets.map(k=>ot(k,2)).join(", ")} m); dashed lines mark the wheel positions of the governing state.`),Cc(w,T,P)))};return o.append(B),setTimeout(C),o}function Ac(i,t,e){let n=i.plan.deck.map(v=>v[0]),s=i.plan.deck.map(v=>v[1]),r=Math.min(...n)-1,a=Math.max(...n)+1,o=Math.min(...s)-.8,l=Math.max(...s)+.8,c=1e3,u=(c-60)/(a-r),d=Math.max(220,Math.min(520,(l-o)*u)),p=d/((l-o)*u),g=d+50,_=v=>30+(v-r)*u,x=v=>20+(l-v)*u*p,f="http://www.w3.org/2000/svg",h=document.createElementNS(f,"svg");h.setAttribute("viewBox",`0 0 ${c} ${g}`),h.setAttribute("class","plan"),h.setAttribute("role","img");let M=(v,B,C)=>{let T=document.createElementNS(f,v);for(let[P,E]of Object.entries(B))T.setAttribute(P,String(E));if(C){let P=document.createElementNS(f,"title");P.textContent=C,T.append(P)}return h.append(T),T};for(let[v,B]of i.carriageways)M("rect",{x:_(r+1),y:x(B),width:(a-r-2)*u,height:(B-v)*u*p,fill:"none",stroke:"#8a96a3","stroke-dasharray":"4 3"});e.layout.forEach((v,B)=>{let C=e.factors.find(P=>Math.abs(P[0]-v)<.001)?.[1]||0;M("rect",{x:_(r+1),y:x(v+i.lane_width),width:(a-r-2)*u,height:i.lane_width*u*p,fill:C?"#c98a2b":"#8a96a3",opacity:C?.1+.12*C:.06,stroke:"#c98a2b"},`lane ${B+1}: ${v} to ${(v+i.lane_width).toFixed(2)} m${C?", factor "+C:", not adverse"}`);let T=M("text",{x:_(r+1)+6,y:x(v+i.lane_width/2)+4,"font-size":11,fill:"#c98a2b"});T.textContent=`lane ${B+1}${C?" \xD7 "+C:""}`});for(let v of e.loads)v[2]<=1&&M("rect",{x:_(v[3]-.125),y:x(v[1]),width:Math.max(1,(v[4]-v[3]+.25)*u),height:Math.max(1,(v[1]-v[0])*u*p),fill:"#c98a2b",opacity:.3},`patterned UDL ch ${v[3]}\u2013${v[4]} m, offsets ${v[0]}\u2013${v[1]} m`);for(let[v,B]of Object.entries(i.plan.girders))for(let C of B){let T=v===t.girder&&t.kind!=="R"&&Math.abs(C.a[0]-t.ch)<1e-6||v===t.girder&&t.kind!=="R"&&Math.abs(C.b[0]-t.ch)<1e-6;M("line",{x1:_(C.a[0]),y1:x(C.a[1]),x2:_(C.b[0]),y2:x(C.b[1]),stroke:T?"#13202c":"#0b7aa3","stroke-width":T?5:2.5},`${v} member ${C.id}`)}for(let v of i.plan.bearings){let B=t.kind==="R"&&t.key.startsWith(v.id+":");M("path",{d:`M${_(v.ch)} ${x(v.o)+3}l-6 10h12z`,fill:B?"#13202c":"#b3261e"},`bearing ${v.id}`)}for(let v of e.loads)v[2]>1&&M("circle",{cx:_(v[3]),cy:x(v[0]),r:3+2*Math.sqrt(v[2]/60),fill:"#b3261e",opacity:.85,stroke:"#fff"},`${v[2]} kN at ch ${v[3]}, offset ${v[0]}`);for(let[v,B]of Object.entries(i.plan.girders)){let C=B[0],T=M("text",{x:4,y:x(C.a[1])+4,"font-size":11});T.textContent=v}let w=M("text",{x:c-8,y:g-6,"text-anchor":"end","font-size":11,fill:"#5b6770"});return w.textContent=`chainage along the bridge, m \xB7 offsets from the control line (right +)${p!==1?" \xB7 transverse scale \xD7 "+p.toFixed(2):""} \xB7 red dots: wheel loads (size \u221D load) \xB7 bands: patterned UDL`,m("div",{class:"tablewrap"},h)}function Cc(i,t,e){let n=i.il[t.key]||[];if(!n.length)return m("p",{class:"muted small"},"No influence line stored for this response.");let s=1e3,r=280,a=50,o=20,l=i.grid,c=l[0],u=l[l.length-1],d=n.flat(),p=Math.min(0,...d),g=Math.max(0,...d);g===p&&(g=p+1);let _=C=>a+(C-c)/(u-c)*(s-a-10),x=C=>o+(g-C)/(g-p)*(r-o-30),f="http://www.w3.org/2000/svg",h=document.createElementNS(f,"svg");h.setAttribute("viewBox",`0 0 ${s} ${r}`),h.setAttribute("class","plan");let M=(C,T)=>{let P=document.createElementNS(f,C);for(let[E,S]of Object.entries(T))P.setAttribute(E,String(S));return h.append(P),P};M("line",{x1:a,x2:s-10,y1:x(0),y2:x(0),stroke:"#8a96a3"}),M("line",{x1:a,x2:a,y1:o,y2:r-30,stroke:"#8a96a3"});let w=["#0b7aa3","#c98a2b","#2e7d32","#7b1fa2","#b3261e","#00838f","#6d4c41"];n.forEach((C,T)=>{M("path",{d:C.map((E,S)=>(S?"L":"M")+_(l[S]).toFixed(1)+" "+x(E).toFixed(1)).join(""),fill:"none",stroke:w[T%w.length],"stroke-width":1.6});let P=M("text",{x:s-12,y:o+14+14*T,"text-anchor":"end","font-size":11,fill:w[T%w.length]});P.textContent=`lane centre ${ot(i.il_offsets[T],2)} m`});let v=new Set;for(let C of e.loads)C[2]>1&&!v.has(C[3])&&(v.add(C[3]),M("line",{x1:_(C[3]),x2:_(C[3]),y1:o,y2:r-30,stroke:"#b3261e","stroke-dasharray":"3 3",opacity:.6}));[p,0,g].forEach(C=>{let T=M("text",{x:a-4,y:x(C)+4,"text-anchor":"end","font-size":11});T.textContent=ot(C,3)}),[c,(c+u)/2,u].forEach(C=>{let T=M("text",{x:_(C),y:r-12,"text-anchor":"middle","font-size":11});T.textContent="ch "+ot(C,1)});let B=M("text",{x:a+4,y:o+12,"font-size":11,fill:"#5b6770"});return B.textContent=`${Vi[t.kind][1]} per kN`,m("div",{class:"tablewrap"},h)}var ao="170",ni={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},ii={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Rc=0,Uo=1,Pc=2;var Vl=1,Ic=2,fn=3,Un=0,Ie=1,pn=2,Ln=0,Si=1,No=2,Oo=3,Fo=4,Lc=5,$n=100,Dc=101,Uc=102,Nc=103,Oc=104,Fc=200,Bc=201,kc=202,zc=203,Xr=204,$r=205,Vc=206,Hc=207,Gc=208,Wc=209,Xc=210,$c=211,qc=212,Yc=213,Zc=214,qr=0,Yr=1,Zr=2,Ai=3,Jr=4,Kr=5,jr=6,Qr=7,Hl=0,Jc=1,Kc=2,Dn=0,jc=1,Qc=2,th=3,eh=4,nh=5,ih=6,sh=7;var Gl=300,Ci=301,Ri=302,ta=303,ea=304,cr=306,na=1e3,Zn=1001,ia=1002,Ke=1003,rh=1004;var cs=1005;var sn=1006,gr=1007;var Jn=1008;var vn=1009,Wl=1010,Xl=1011,ji=1012,oo=1013,Kn=1014,mn=1015,ss=1016,lo=1017,co=1018,Pi=1020,$l=35902,ql=1021,Yl=1022,Ze=1023,Zl=1024,Jl=1025,wi=1026,Ii=1027,Kl=1028,ho=1029,jl=1030,uo=1031;var fo=1033,Ns=33776,Os=33777,Fs=33778,Bs=33779,sa=35840,ra=35841,aa=35842,oa=35843,la=36196,ca=37492,ha=37496,ua=37808,da=37809,fa=37810,pa=37811,ma=37812,ga=37813,_a=37814,va=37815,xa=37816,ya=37817,Ma=37818,ba=37819,Sa=37820,wa=37821,ks=36492,Ea=36494,Ta=36495,Ql=36283,Aa=36284,Ca=36285,Ra=36286;var zs=2300,Pa=2301,_r=2302,Bo=2400,ko=2401,zo=2402;var ah=3200,oh=3201;var lh=0,ch=1,In="",ze="srgb",Ui="srgb-linear",hr="linear",Kt="srgb";var ai=7680;var Vo=519,hh=512,uh=513,dh=514,tc=515,fh=516,ph=517,mh=518,gh=519,Ho=35044;var Go="300 es",gn=2e3,Vs=2001,xn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Se=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Wo=1234567,Zi=Math.PI/180,Qi=180/Math.PI;function Ni(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Se[i&255]+Se[i>>8&255]+Se[i>>16&255]+Se[i>>24&255]+"-"+Se[t&255]+Se[t>>8&255]+"-"+Se[t>>16&15|64]+Se[t>>24&255]+"-"+Se[e&63|128]+Se[e>>8&255]+"-"+Se[e>>16&255]+Se[e>>24&255]+Se[n&255]+Se[n>>8&255]+Se[n>>16&255]+Se[n>>24&255]).toLowerCase()}function Ee(i,t,e){return Math.max(t,Math.min(e,i))}function po(i,t){return(i%t+t)%t}function _h(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function vh(i,t,e){return i!==t?(e-i)/(t-i):0}function Ji(i,t,e){return(1-e)*i+e*t}function xh(i,t,e,n){return Ji(i,t,1-Math.exp(-e*n))}function yh(i,t=1){return t-Math.abs(po(i,t*2)-t)}function Mh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function bh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Sh(i,t){return i+Math.floor(Math.random()*(t-i+1))}function wh(i,t){return i+Math.random()*(t-i)}function Eh(i){return i*(.5-Math.random())}function Th(i){i!==void 0&&(Wo=i);let t=Wo+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ah(i){return i*Zi}function Ch(i){return i*Qi}function Rh(i){return(i&i-1)===0&&i!==0}function Ph(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Ih(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Lh(i,t,e,n,s){let r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+n)/2),u=a((t+n)/2),d=r((t-n)/2),p=a((t-n)/2),g=r((n-t)/2),_=a((n-t)/2);switch(s){case"XYX":i.set(o*u,l*d,l*p,o*c);break;case"YZY":i.set(l*p,o*u,l*d,o*c);break;case"ZXZ":i.set(l*d,l*p,o*u,o*c);break;case"XZX":i.set(o*u,l*_,l*g,o*c);break;case"YXY":i.set(l*g,o*u,l*_,o*c);break;case"ZYZ":i.set(l*_,l*g,o*u,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function yi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Te(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var ec={DEG2RAD:Zi,RAD2DEG:Qi,generateUUID:Ni,clamp:Ee,euclideanModulo:po,mapLinear:_h,inverseLerp:vh,lerp:Ji,damp:xh,pingpong:yh,smoothstep:Mh,smootherstep:bh,randInt:Sh,randFloat:wh,randFloatSpread:Eh,seededRandom:Th,degToRad:Ah,radToDeg:Ch,isPowerOfTwo:Rh,ceilPowerOfTwo:Ph,floorPowerOfTwo:Ih,setQuaternionFromProperEuler:Lh,normalize:Te,denormalize:yi},Bt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ee(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Nt=class i{constructor(t,e,n,s,r,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],d=n[7],p=n[2],g=n[5],_=n[8],x=s[0],f=s[3],h=s[6],M=s[1],w=s[4],v=s[7],B=s[2],C=s[5],T=s[8];return r[0]=a*x+o*M+l*B,r[3]=a*f+o*w+l*C,r[6]=a*h+o*v+l*T,r[1]=c*x+u*M+d*B,r[4]=c*f+u*w+d*C,r[7]=c*h+u*v+d*T,r[2]=p*x+g*M+_*B,r[5]=p*f+g*w+_*C,r[8]=p*h+g*v+_*T,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-n*r*u+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=u*a-o*c,p=o*l-u*r,g=c*r-a*l,_=e*d+n*p+s*g;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/_;return t[0]=d*x,t[1]=(s*c-u*n)*x,t[2]=(o*n-s*a)*x,t[3]=p*x,t[4]=(u*e-s*l)*x,t[5]=(s*r-o*e)*x,t[6]=g*x,t[7]=(n*l-c*e)*x,t[8]=(a*e-n*r)*x,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(vr.makeScale(t,e)),this}rotate(t){return this.premultiply(vr.makeRotation(-t)),this}translate(t,e){return this.premultiply(vr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},vr=new Nt;function nc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Hs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Dh(){let i=Hs("canvas");return i.style.display="block",i}var Xo={};function qi(i){i in Xo||(Xo[i]=!0,console.warn(i))}function Uh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Nh(i){let t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Oh(i){let t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var Xt={enabled:!0,workingColorSpace:Ui,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===Kt&&(i.r=_n(i.r),i.g=_n(i.g),i.b=_n(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===Kt&&(i.r=Ei(i.r),i.g=Ei(i.g),i.b=Ei(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===In?hr:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function _n(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ei(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var $o=[.64,.33,.3,.6,.15,.06],qo=[.2126,.7152,.0722],Yo=[.3127,.329],Zo=new Nt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Jo=new Nt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Xt.define({[Ui]:{primaries:$o,whitePoint:Yo,transfer:hr,toXYZ:Zo,fromXYZ:Jo,luminanceCoefficients:qo,workingColorSpaceConfig:{unpackColorSpace:ze},outputColorSpaceConfig:{drawingBufferColorSpace:ze}},[ze]:{primaries:$o,whitePoint:Yo,transfer:Kt,toXYZ:Zo,fromXYZ:Jo,luminanceCoefficients:qo,outputColorSpaceConfig:{drawingBufferColorSpace:ze}}});var oi,Ia=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{oi===void 0&&(oi=Hs("canvas")),oi.width=t.width,oi.height=t.height;let n=oi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=oi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Hs("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=_n(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(_n(e[n]/255)*255):e[n]=_n(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Fh=0,Gs=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Fh++}),this.uuid=Ni(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(xr(s[a].image)):r.push(xr(s[a]))}else r=xr(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function xr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ia.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Bh=0,Ve=class i extends xn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=Zn,s=Zn,r=sn,a=Jn,o=Ze,l=vn,c=i.DEFAULT_ANISOTROPY,u=In){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Bh++}),this.uuid=Ni(),this.name="",this.source=new Gs(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Bt(0,0),this.repeat=new Bt(1,1),this.center=new Bt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Nt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Gl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case na:t.x=t.x-Math.floor(t.x);break;case Zn:t.x=t.x<0?0:1;break;case ia:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case na:t.y=t.y-Math.floor(t.y);break;case Zn:t.y=t.y<0?0:1;break;case ia:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ve.DEFAULT_IMAGE=null;Ve.DEFAULT_MAPPING=Gl;Ve.DEFAULT_ANISOTROPY=1;var he=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],u=l[4],d=l[8],p=l[1],g=l[5],_=l[9],x=l[2],f=l[6],h=l[10];if(Math.abs(u-p)<.01&&Math.abs(d-x)<.01&&Math.abs(_-f)<.01){if(Math.abs(u+p)<.1&&Math.abs(d+x)<.1&&Math.abs(_+f)<.1&&Math.abs(c+g+h-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let w=(c+1)/2,v=(g+1)/2,B=(h+1)/2,C=(u+p)/4,T=(d+x)/4,P=(_+f)/4;return w>v&&w>B?w<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(w),s=C/n,r=T/n):v>B?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=C/s,r=P/s):B<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(B),n=T/r,s=P/r),this.set(n,s,r,e),this}let M=Math.sqrt((f-_)*(f-_)+(d-x)*(d-x)+(p-u)*(p-u));return Math.abs(M)<.001&&(M=1),this.x=(f-_)/M,this.y=(d-x)/M,this.z=(p-u)/M,this.w=Math.acos((c+g+h-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},La=class extends xn{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new he(0,0,t,e),this.scissorTest=!1,this.viewport=new he(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:sn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Ve(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Gs(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},yn=class extends La{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Ws=class extends Ve{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=Zn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Da=class extends Ve{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=Zn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Qe=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],u=n[s+2],d=n[s+3],p=r[a+0],g=r[a+1],_=r[a+2],x=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=d;return}if(o===1){t[e+0]=p,t[e+1]=g,t[e+2]=_,t[e+3]=x;return}if(d!==x||l!==p||c!==g||u!==_){let f=1-o,h=l*p+c*g+u*_+d*x,M=h>=0?1:-1,w=1-h*h;if(w>Number.EPSILON){let B=Math.sqrt(w),C=Math.atan2(B,h*M);f=Math.sin(f*C)/B,o=Math.sin(o*C)/B}let v=o*M;if(l=l*f+p*v,c=c*f+g*v,u=u*f+_*v,d=d*f+x*v,f===1-o){let B=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=B,c*=B,u*=B,d*=B}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],u=n[s+3],d=r[a],p=r[a+1],g=r[a+2],_=r[a+3];return t[e]=o*_+u*d+l*g-c*p,t[e+1]=l*_+u*p+c*d-o*g,t[e+2]=c*_+u*g+o*p-l*d,t[e+3]=u*_-o*d-l*p-c*g,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(s/2),d=o(r/2),p=l(n/2),g=l(s/2),_=l(r/2);switch(a){case"XYZ":this._x=p*u*d+c*g*_,this._y=c*g*d-p*u*_,this._z=c*u*_+p*g*d,this._w=c*u*d-p*g*_;break;case"YXZ":this._x=p*u*d+c*g*_,this._y=c*g*d-p*u*_,this._z=c*u*_-p*g*d,this._w=c*u*d+p*g*_;break;case"ZXY":this._x=p*u*d-c*g*_,this._y=c*g*d+p*u*_,this._z=c*u*_+p*g*d,this._w=c*u*d-p*g*_;break;case"ZYX":this._x=p*u*d-c*g*_,this._y=c*g*d+p*u*_,this._z=c*u*_-p*g*d,this._w=c*u*d+p*g*_;break;case"YZX":this._x=p*u*d+c*g*_,this._y=c*g*d+p*u*_,this._z=c*u*_-p*g*d,this._w=c*u*d-p*g*_;break;case"XZY":this._x=p*u*d-c*g*_,this._y=c*g*d-p*u*_,this._z=c*u*_+p*g*d,this._w=c*u*d+p*g*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],d=e[10],p=n+o+d;if(p>0){let g=.5/Math.sqrt(p+1);this._w=.25/g,this._x=(u-l)*g,this._y=(r-c)*g,this._z=(a-s)*g}else if(n>o&&n>d){let g=2*Math.sqrt(1+n-o-d);this._w=(u-l)/g,this._x=.25*g,this._y=(s+a)/g,this._z=(r+c)/g}else if(o>d){let g=2*Math.sqrt(1+o-n-d);this._w=(r-c)/g,this._x=(s+a)/g,this._y=.25*g,this._z=(l+u)/g}else{let g=2*Math.sqrt(1+d-n-o);this._w=(a-s)/g,this._x=(r+c)/g,this._y=(l+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ee(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+a*o+s*c-r*l,this._y=s*u+a*l+r*o-n*c,this._z=r*u+a*c+n*l-s*o,this._w=a*u-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*t._w+n*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let g=1-e;return this._w=g*a+e*this._w,this._x=g*n+e*this._x,this._y=g*s+e*this._y,this._z=g*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),u=Math.atan2(c,o),d=Math.sin((1-e)*u)/c,p=Math.sin(e*u)/c;return this._w=a*d+this._w*p,this._x=n*d+this._x*p,this._y=s*d+this._y*p,this._z=r*d+this._z*p,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},z=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Ko.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Ko.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),u=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+l*c+a*d-o*u,this.y=n+l*u+o*c-r*d,this.z=s+l*d+r*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return yr.copy(this).projectOnVector(t),this.sub(yr)}reflect(t){return this.sub(yr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ee(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},yr=new z,Ko=new Qe,Mn=class{constructor(t=new z(1/0,1/0,1/0),e=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Xe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Xe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Xe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Xe):Xe.fromBufferAttribute(r,a),Xe.applyMatrix4(t.matrixWorld),this.expandByPoint(Xe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),hs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),hs.copy(n.boundingBox)),hs.applyMatrix4(t.matrixWorld),this.union(hs)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Xe),Xe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Hi),us.subVectors(this.max,Hi),li.subVectors(t.a,Hi),ci.subVectors(t.b,Hi),hi.subVectors(t.c,Hi),En.subVectors(ci,li),Tn.subVectors(hi,ci),kn.subVectors(li,hi);let e=[0,-En.z,En.y,0,-Tn.z,Tn.y,0,-kn.z,kn.y,En.z,0,-En.x,Tn.z,0,-Tn.x,kn.z,0,-kn.x,-En.y,En.x,0,-Tn.y,Tn.x,0,-kn.y,kn.x,0];return!Mr(e,li,ci,hi,us)||(e=[1,0,0,0,1,0,0,0,1],!Mr(e,li,ci,hi,us))?!1:(ds.crossVectors(En,Tn),e=[ds.x,ds.y,ds.z],Mr(e,li,ci,hi,us))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Xe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Xe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ln[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ln[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ln[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ln[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ln[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ln[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ln[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ln[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ln),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},ln=[new z,new z,new z,new z,new z,new z,new z,new z],Xe=new z,hs=new Mn,li=new z,ci=new z,hi=new z,En=new z,Tn=new z,kn=new z,Hi=new z,us=new z,ds=new z,zn=new z;function Mr(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){zn.fromArray(i,r);let o=s.x*Math.abs(zn.x)+s.y*Math.abs(zn.y)+s.z*Math.abs(zn.z),l=t.dot(zn),c=e.dot(zn),u=n.dot(zn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var kh=new Mn,Gi=new z,br=new z,jn=class{constructor(t=new z,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):kh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Gi.subVectors(t,this.center);let e=Gi.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Gi,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(br.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Gi.copy(t.center).add(br)),this.expandByPoint(Gi.copy(t.center).sub(br))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},cn=new z,Sr=new z,fs=new z,An=new z,wr=new z,ps=new z,Er=new z,Qn=class{constructor(t=new z,e=new z(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,cn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=cn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(cn.copy(this.origin).addScaledVector(this.direction,e),cn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Sr.copy(t).add(e).multiplyScalar(.5),fs.copy(e).sub(t).normalize(),An.copy(this.origin).sub(Sr);let r=t.distanceTo(e)*.5,a=-this.direction.dot(fs),o=An.dot(this.direction),l=-An.dot(fs),c=An.lengthSq(),u=Math.abs(1-a*a),d,p,g,_;if(u>0)if(d=a*l-o,p=a*o-l,_=r*u,d>=0)if(p>=-_)if(p<=_){let x=1/u;d*=x,p*=x,g=d*(d+a*p+2*o)+p*(a*d+p+2*l)+c}else p=r,d=Math.max(0,-(a*p+o)),g=-d*d+p*(p+2*l)+c;else p=-r,d=Math.max(0,-(a*p+o)),g=-d*d+p*(p+2*l)+c;else p<=-_?(d=Math.max(0,-(-a*r+o)),p=d>0?-r:Math.min(Math.max(-r,-l),r),g=-d*d+p*(p+2*l)+c):p<=_?(d=0,p=Math.min(Math.max(-r,-l),r),g=p*(p+2*l)+c):(d=Math.max(0,-(a*r+o)),p=d>0?r:Math.min(Math.max(-r,-l),r),g=-d*d+p*(p+2*l)+c);else p=a>0?-r:r,d=Math.max(0,-(a*p+o)),g=-d*d+p*(p+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Sr).addScaledVector(fs,p),g}intersectSphere(t,e){cn.subVectors(t.center,this.origin);let n=cn.dot(this.direction),s=cn.dot(cn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,p=this.origin;return c>=0?(n=(t.min.x-p.x)*c,s=(t.max.x-p.x)*c):(n=(t.max.x-p.x)*c,s=(t.min.x-p.x)*c),u>=0?(r=(t.min.y-p.y)*u,a=(t.max.y-p.y)*u):(r=(t.max.y-p.y)*u,a=(t.min.y-p.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-p.z)*d,l=(t.max.z-p.z)*d):(o=(t.max.z-p.z)*d,l=(t.min.z-p.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,cn)!==null}intersectTriangle(t,e,n,s,r){wr.subVectors(e,t),ps.subVectors(n,t),Er.crossVectors(wr,ps);let a=this.direction.dot(Er),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;An.subVectors(this.origin,t);let l=o*this.direction.dot(ps.crossVectors(An,ps));if(l<0)return null;let c=o*this.direction.dot(wr.cross(An));if(c<0||l+c>a)return null;let u=-o*An.dot(Er);return u<0?null:this.at(u/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ue=class i{constructor(t,e,n,s,r,a,o,l,c,u,d,p,g,_,x,f){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,u,d,p,g,_,x,f)}set(t,e,n,s,r,a,o,l,c,u,d,p,g,_,x,f){let h=this.elements;return h[0]=t,h[4]=e,h[8]=n,h[12]=s,h[1]=r,h[5]=a,h[9]=o,h[13]=l,h[2]=c,h[6]=u,h[10]=d,h[14]=p,h[3]=g,h[7]=_,h[11]=x,h[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/ui.setFromMatrixColumn(t,0).length(),r=1/ui.setFromMatrixColumn(t,1).length(),a=1/ui.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){let p=a*u,g=a*d,_=o*u,x=o*d;e[0]=l*u,e[4]=-l*d,e[8]=c,e[1]=g+_*c,e[5]=p-x*c,e[9]=-o*l,e[2]=x-p*c,e[6]=_+g*c,e[10]=a*l}else if(t.order==="YXZ"){let p=l*u,g=l*d,_=c*u,x=c*d;e[0]=p+x*o,e[4]=_*o-g,e[8]=a*c,e[1]=a*d,e[5]=a*u,e[9]=-o,e[2]=g*o-_,e[6]=x+p*o,e[10]=a*l}else if(t.order==="ZXY"){let p=l*u,g=l*d,_=c*u,x=c*d;e[0]=p-x*o,e[4]=-a*d,e[8]=_+g*o,e[1]=g+_*o,e[5]=a*u,e[9]=x-p*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let p=a*u,g=a*d,_=o*u,x=o*d;e[0]=l*u,e[4]=_*c-g,e[8]=p*c+x,e[1]=l*d,e[5]=x*c+p,e[9]=g*c-_,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let p=a*l,g=a*c,_=o*l,x=o*c;e[0]=l*u,e[4]=x-p*d,e[8]=_*d+g,e[1]=d,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=g*d+_,e[10]=p-x*d}else if(t.order==="XZY"){let p=a*l,g=a*c,_=o*l,x=o*c;e[0]=l*u,e[4]=-d,e[8]=c*u,e[1]=p*d+x,e[5]=a*u,e[9]=g*d-_,e[2]=_*d-g,e[6]=o*u,e[10]=x*d+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(zh,t,Vh)}lookAt(t,e,n){let s=this.elements;return Ne.subVectors(t,e),Ne.lengthSq()===0&&(Ne.z=1),Ne.normalize(),Cn.crossVectors(n,Ne),Cn.lengthSq()===0&&(Math.abs(n.z)===1?Ne.x+=1e-4:Ne.z+=1e-4,Ne.normalize(),Cn.crossVectors(n,Ne)),Cn.normalize(),ms.crossVectors(Ne,Cn),s[0]=Cn.x,s[4]=ms.x,s[8]=Ne.x,s[1]=Cn.y,s[5]=ms.y,s[9]=Ne.y,s[2]=Cn.z,s[6]=ms.z,s[10]=Ne.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],d=n[5],p=n[9],g=n[13],_=n[2],x=n[6],f=n[10],h=n[14],M=n[3],w=n[7],v=n[11],B=n[15],C=s[0],T=s[4],P=s[8],E=s[12],S=s[1],R=s[5],X=s[9],U=s[13],H=s[2],Z=s[6],L=s[10],k=s[14],N=s[3],J=s[7],tt=s[11],rt=s[15];return r[0]=a*C+o*S+l*H+c*N,r[4]=a*T+o*R+l*Z+c*J,r[8]=a*P+o*X+l*L+c*tt,r[12]=a*E+o*U+l*k+c*rt,r[1]=u*C+d*S+p*H+g*N,r[5]=u*T+d*R+p*Z+g*J,r[9]=u*P+d*X+p*L+g*tt,r[13]=u*E+d*U+p*k+g*rt,r[2]=_*C+x*S+f*H+h*N,r[6]=_*T+x*R+f*Z+h*J,r[10]=_*P+x*X+f*L+h*tt,r[14]=_*E+x*U+f*k+h*rt,r[3]=M*C+w*S+v*H+B*N,r[7]=M*T+w*R+v*Z+B*J,r[11]=M*P+w*X+v*L+B*tt,r[15]=M*E+w*U+v*k+B*rt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],d=t[6],p=t[10],g=t[14],_=t[3],x=t[7],f=t[11],h=t[15];return _*(+r*l*d-s*c*d-r*o*p+n*c*p+s*o*g-n*l*g)+x*(+e*l*g-e*c*p+r*a*p-s*a*g+s*c*u-r*l*u)+f*(+e*c*d-e*o*g-r*a*d+n*a*g+r*o*u-n*c*u)+h*(-s*o*u-e*l*d+e*o*p+s*a*d-n*a*p+n*l*u)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=t[9],p=t[10],g=t[11],_=t[12],x=t[13],f=t[14],h=t[15],M=d*f*c-x*p*c+x*l*g-o*f*g-d*l*h+o*p*h,w=_*p*c-u*f*c-_*l*g+a*f*g+u*l*h-a*p*h,v=u*x*c-_*d*c+_*o*g-a*x*g-u*o*h+a*d*h,B=_*d*l-u*x*l-_*o*p+a*x*p+u*o*f-a*d*f,C=e*M+n*w+s*v+r*B;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/C;return t[0]=M*T,t[1]=(x*p*r-d*f*r-x*s*g+n*f*g+d*s*h-n*p*h)*T,t[2]=(o*f*r-x*l*r+x*s*c-n*f*c-o*s*h+n*l*h)*T,t[3]=(d*l*r-o*p*r-d*s*c+n*p*c+o*s*g-n*l*g)*T,t[4]=w*T,t[5]=(u*f*r-_*p*r+_*s*g-e*f*g-u*s*h+e*p*h)*T,t[6]=(_*l*r-a*f*r-_*s*c+e*f*c+a*s*h-e*l*h)*T,t[7]=(a*p*r-u*l*r+u*s*c-e*p*c-a*s*g+e*l*g)*T,t[8]=v*T,t[9]=(_*d*r-u*x*r-_*n*g+e*x*g+u*n*h-e*d*h)*T,t[10]=(a*x*r-_*o*r+_*n*c-e*x*c-a*n*h+e*o*h)*T,t[11]=(u*o*r-a*d*r-u*n*c+e*d*c+a*n*g-e*o*g)*T,t[12]=B*T,t[13]=(u*x*s-_*d*s+_*n*p-e*x*p-u*n*f+e*d*f)*T,t[14]=(_*o*s-a*x*s-_*n*l+e*x*l+a*n*f-e*o*f)*T,t[15]=(a*d*s-u*o*s+u*n*l-e*d*l-a*n*p+e*o*p)*T,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,u=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+n,u*l-s*a,0,c*l-s*o,u*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,u=a+a,d=o+o,p=r*c,g=r*u,_=r*d,x=a*u,f=a*d,h=o*d,M=l*c,w=l*u,v=l*d,B=n.x,C=n.y,T=n.z;return s[0]=(1-(x+h))*B,s[1]=(g+v)*B,s[2]=(_-w)*B,s[3]=0,s[4]=(g-v)*C,s[5]=(1-(p+h))*C,s[6]=(f+M)*C,s[7]=0,s[8]=(_+w)*T,s[9]=(f-M)*T,s[10]=(1-(p+x))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=ui.set(s[0],s[1],s[2]).length(),a=ui.set(s[4],s[5],s[6]).length(),o=ui.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],$e.copy(this);let c=1/r,u=1/a,d=1/o;return $e.elements[0]*=c,$e.elements[1]*=c,$e.elements[2]*=c,$e.elements[4]*=u,$e.elements[5]*=u,$e.elements[6]*=u,$e.elements[8]*=d,$e.elements[9]*=d,$e.elements[10]*=d,e.setFromRotationMatrix($e),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,s,r,a,o=gn){let l=this.elements,c=2*r/(e-t),u=2*r/(n-s),d=(e+t)/(e-t),p=(n+s)/(n-s),g,_;if(o===gn)g=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===Vs)g=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=gn){let l=this.elements,c=1/(e-t),u=1/(n-s),d=1/(a-r),p=(e+t)*c,g=(n+s)*u,_,x;if(o===gn)_=(a+r)*d,x=-2*d;else if(o===Vs)_=r*d,x=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-p,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-g,l[2]=0,l[6]=0,l[10]=x,l[14]=-_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},ui=new z,$e=new ue,zh=new z(0,0,0),Vh=new z(1,1,1),Cn=new z,ms=new z,Ne=new z,jo=new ue,Qo=new Qe,bn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],u=s[9],d=s[2],p=s[6],g=s[10];switch(e){case"XYZ":this._y=Math.asin(Ee(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ee(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,g),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ee(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-d,g),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ee(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(p,g),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ee(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,g));break;case"XZY":this._z=Math.asin(-Ee(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,g),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return jo.makeRotationFromQuaternion(t),this.setFromRotationMatrix(jo,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Qo.setFromEuler(this),this.setFromQuaternion(Qo,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};bn.DEFAULT_ORDER="XYZ";var Xs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Hh=0,tl=new z,di=new Qe,hn=new ue,gs=new z,Wi=new z,Gh=new z,Wh=new Qe,el=new z(1,0,0),nl=new z(0,1,0),il=new z(0,0,1),sl={type:"added"},Xh={type:"removed"},fi={type:"childadded",child:null},Tr={type:"childremoved",child:null},Fe=class i extends xn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Hh++}),this.uuid=Ni(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new z,e=new bn,n=new Qe,s=new z(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ue},normalMatrix:{value:new Nt}}),this.matrix=new ue,this.matrixWorld=new ue,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Xs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return di.setFromAxisAngle(t,e),this.quaternion.multiply(di),this}rotateOnWorldAxis(t,e){return di.setFromAxisAngle(t,e),this.quaternion.premultiply(di),this}rotateX(t){return this.rotateOnAxis(el,t)}rotateY(t){return this.rotateOnAxis(nl,t)}rotateZ(t){return this.rotateOnAxis(il,t)}translateOnAxis(t,e){return tl.copy(t).applyQuaternion(this.quaternion),this.position.add(tl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(el,t)}translateY(t){return this.translateOnAxis(nl,t)}translateZ(t){return this.translateOnAxis(il,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(hn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?gs.copy(t):gs.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Wi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?hn.lookAt(Wi,gs,this.up):hn.lookAt(gs,Wi,this.up),this.quaternion.setFromRotationMatrix(hn),s&&(hn.extractRotation(s.matrixWorld),di.setFromRotationMatrix(hn),this.quaternion.premultiply(di.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(sl),fi.child=t,this.dispatchEvent(fi),fi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Xh),Tr.child=t,this.dispatchEvent(Tr),Tr.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),hn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),hn.multiply(t.parent.matrixWorld)),t.applyMatrix4(hn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(sl),fi.child=t,this.dispatchEvent(fi),fi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wi,t,Gh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wi,Wh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),d=a(t.shapes),p=a(t.skeletons),g=a(t.animations),_=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),d.length>0&&(n.shapes=d),p.length>0&&(n.skeletons=p),g.length>0&&(n.animations=g),_.length>0&&(n.nodes=_)}return n.object=s,n;function a(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Fe.DEFAULT_UP=new z(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var qe=new z,un=new z,Ar=new z,dn=new z,pi=new z,mi=new z,rl=new z,Cr=new z,Rr=new z,Pr=new z,Ir=new he,Lr=new he,Dr=new he,qn=class i{constructor(t=new z,e=new z,n=new z){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),qe.subVectors(t,e),s.cross(qe);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){qe.subVectors(s,e),un.subVectors(n,e),Ar.subVectors(t,e);let a=qe.dot(qe),o=qe.dot(un),l=qe.dot(Ar),c=un.dot(un),u=un.dot(Ar),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;let p=1/d,g=(c*l-o*u)*p,_=(a*u-o*l)*p;return r.set(1-g-_,_,g)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,dn)===null?!1:dn.x>=0&&dn.y>=0&&dn.x+dn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,dn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,dn.x),l.addScaledVector(a,dn.y),l.addScaledVector(o,dn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return Ir.setScalar(0),Lr.setScalar(0),Dr.setScalar(0),Ir.fromBufferAttribute(t,e),Lr.fromBufferAttribute(t,n),Dr.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Ir,r.x),a.addScaledVector(Lr,r.y),a.addScaledVector(Dr,r.z),a}static isFrontFacing(t,e,n,s){return qe.subVectors(n,e),un.subVectors(t,e),qe.cross(un).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return qe.subVectors(this.c,this.b),un.subVectors(this.a,this.b),qe.cross(un).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;pi.subVectors(s,n),mi.subVectors(r,n),Cr.subVectors(t,n);let l=pi.dot(Cr),c=mi.dot(Cr);if(l<=0&&c<=0)return e.copy(n);Rr.subVectors(t,s);let u=pi.dot(Rr),d=mi.dot(Rr);if(u>=0&&d<=u)return e.copy(s);let p=l*d-u*c;if(p<=0&&l>=0&&u<=0)return a=l/(l-u),e.copy(n).addScaledVector(pi,a);Pr.subVectors(t,r);let g=pi.dot(Pr),_=mi.dot(Pr);if(_>=0&&g<=_)return e.copy(r);let x=g*c-l*_;if(x<=0&&c>=0&&_<=0)return o=c/(c-_),e.copy(n).addScaledVector(mi,o);let f=u*_-g*d;if(f<=0&&d-u>=0&&g-_>=0)return rl.subVectors(r,s),o=(d-u)/(d-u+(g-_)),e.copy(s).addScaledVector(rl,o);let h=1/(f+x+p);return a=x*h,o=p*h,e.copy(n).addScaledVector(pi,a).addScaledVector(mi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},ic={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Rn={h:0,s:0,l:0},_s={h:0,s:0,l:0};function Ur(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Gt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ze){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Xt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Xt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Xt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Xt.workingColorSpace){if(t=po(t,1),e=Ee(e,0,1),n=Ee(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Ur(a,r,t+1/3),this.g=Ur(a,r,t),this.b=Ur(a,r,t-1/3)}return Xt.toWorkingColorSpace(this,s),this}setStyle(t,e=ze){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ze){let n=ic[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=_n(t.r),this.g=_n(t.g),this.b=_n(t.b),this}copyLinearToSRGB(t){return this.r=Ei(t.r),this.g=Ei(t.g),this.b=Ei(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ze){return Xt.fromWorkingColorSpace(we.copy(this),t),Math.round(Ee(we.r*255,0,255))*65536+Math.round(Ee(we.g*255,0,255))*256+Math.round(Ee(we.b*255,0,255))}getHexString(t=ze){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Xt.workingColorSpace){Xt.fromWorkingColorSpace(we.copy(this),e);let n=we.r,s=we.g,r=we.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,u=(o+a)/2;if(o===a)l=0,c=0;else{let d=a-o;switch(c=u<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Xt.workingColorSpace){return Xt.fromWorkingColorSpace(we.copy(this),e),t.r=we.r,t.g=we.g,t.b=we.b,t}getStyle(t=ze){Xt.fromWorkingColorSpace(we.copy(this),t);let e=we.r,n=we.g,s=we.b;return t!==ze?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Rn),this.setHSL(Rn.h+t,Rn.s+e,Rn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Rn),t.getHSL(_s);let n=Ji(Rn.h,_s.h,e),s=Ji(Rn.s,_s.s,e),r=Ji(Rn.l,_s.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},we=new Gt;Gt.NAMES=ic;var $h=0,Nn=class extends xn{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:$h++}),this.uuid=Ni(),this.name="",this.blending=Si,this.side=Un,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Xr,this.blendDst=$r,this.blendEquation=$n,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Gt(0,0,0),this.blendAlpha=0,this.depthFunc=Ai,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Vo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ai,this.stencilZFail=ai,this.stencilZPass=ai,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Si&&(n.blending=this.blending),this.side!==Un&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Xr&&(n.blendSrc=this.blendSrc),this.blendDst!==$r&&(n.blendDst=this.blendDst),this.blendEquation!==$n&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ai&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Vo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ai&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ai&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ai&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},$s=class extends Nn{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Gt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=Hl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var pe=new z,vs=new Bt,Re=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Ho,this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)vs.fromBufferAttribute(this,e),vs.applyMatrix3(t),this.setXY(e,vs.x,vs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyMatrix3(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyMatrix4(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyNormalMatrix(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.transformDirection(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=yi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Te(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=yi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=yi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=yi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=yi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Te(e,this.array),n=Te(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Te(e,this.array),n=Te(n,this.array),s=Te(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Te(e,this.array),n=Te(n,this.array),s=Te(s,this.array),r=Te(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Ho&&(t.usage=this.usage),t}};var qs=class extends Re{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Ys=class extends Re{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var je=class extends Re{constructor(t,e,n){super(new Float32Array(t),e,n)}},qh=0,ke=new ue,Nr=new Fe,gi=new z,Oe=new Mn,Xi=new Mn,ye=new z,He=class i extends xn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:qh++}),this.uuid=Ni(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(nc(t)?Ys:qs)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Nt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return ke.makeRotationFromQuaternion(t),this.applyMatrix4(ke),this}rotateX(t){return ke.makeRotationX(t),this.applyMatrix4(ke),this}rotateY(t){return ke.makeRotationY(t),this.applyMatrix4(ke),this}rotateZ(t){return ke.makeRotationZ(t),this.applyMatrix4(ke),this}translate(t,e,n){return ke.makeTranslation(t,e,n),this.applyMatrix4(ke),this}scale(t,e,n){return ke.makeScale(t,e,n),this.applyMatrix4(ke),this}lookAt(t){return Nr.lookAt(t),Nr.updateMatrix(),this.applyMatrix4(Nr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(gi).negate(),this.translate(gi.x,gi.y,gi.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new je(n,3))}else{for(let n=0,s=e.count;n<s;n++){let r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Mn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];Oe.setFromBufferAttribute(r),this.morphTargetsRelative?(ye.addVectors(this.boundingBox.min,Oe.min),this.boundingBox.expandByPoint(ye),ye.addVectors(this.boundingBox.max,Oe.max),this.boundingBox.expandByPoint(ye)):(this.boundingBox.expandByPoint(Oe.min),this.boundingBox.expandByPoint(Oe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new jn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(t){let n=this.boundingSphere.center;if(Oe.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Xi.setFromBufferAttribute(o),this.morphTargetsRelative?(ye.addVectors(Oe.min,Xi.min),Oe.expandByPoint(ye),ye.addVectors(Oe.max,Xi.max),Oe.expandByPoint(ye)):(Oe.expandByPoint(Xi.min),Oe.expandByPoint(Xi.max))}Oe.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)ye.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(ye));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)ye.fromBufferAttribute(o,c),l&&(gi.fromBufferAttribute(t,c),ye.add(gi)),s=Math.max(s,n.distanceToSquared(ye))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Re(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let P=0;P<n.count;P++)o[P]=new z,l[P]=new z;let c=new z,u=new z,d=new z,p=new Bt,g=new Bt,_=new Bt,x=new z,f=new z;function h(P,E,S){c.fromBufferAttribute(n,P),u.fromBufferAttribute(n,E),d.fromBufferAttribute(n,S),p.fromBufferAttribute(r,P),g.fromBufferAttribute(r,E),_.fromBufferAttribute(r,S),u.sub(c),d.sub(c),g.sub(p),_.sub(p);let R=1/(g.x*_.y-_.x*g.y);isFinite(R)&&(x.copy(u).multiplyScalar(_.y).addScaledVector(d,-g.y).multiplyScalar(R),f.copy(d).multiplyScalar(g.x).addScaledVector(u,-_.x).multiplyScalar(R),o[P].add(x),o[E].add(x),o[S].add(x),l[P].add(f),l[E].add(f),l[S].add(f))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let P=0,E=M.length;P<E;++P){let S=M[P],R=S.start,X=S.count;for(let U=R,H=R+X;U<H;U+=3)h(t.getX(U+0),t.getX(U+1),t.getX(U+2))}let w=new z,v=new z,B=new z,C=new z;function T(P){B.fromBufferAttribute(s,P),C.copy(B);let E=o[P];w.copy(E),w.sub(B.multiplyScalar(B.dot(E))).normalize(),v.crossVectors(C,E);let R=v.dot(l[P])<0?-1:1;a.setXYZW(P,w.x,w.y,w.z,R)}for(let P=0,E=M.length;P<E;++P){let S=M[P],R=S.start,X=S.count;for(let U=R,H=R+X;U<H;U+=3)T(t.getX(U+0)),T(t.getX(U+1)),T(t.getX(U+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Re(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,g=n.count;p<g;p++)n.setXYZ(p,0,0,0);let s=new z,r=new z,a=new z,o=new z,l=new z,c=new z,u=new z,d=new z;if(t)for(let p=0,g=t.count;p<g;p+=3){let _=t.getX(p+0),x=t.getX(p+1),f=t.getX(p+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,x),a.fromBufferAttribute(e,f),u.subVectors(a,r),d.subVectors(s,r),u.cross(d),o.fromBufferAttribute(n,_),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,f),o.add(u),l.add(u),c.add(u),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let p=0,g=e.count;p<g;p+=3)s.fromBufferAttribute(e,p+0),r.fromBufferAttribute(e,p+1),a.fromBufferAttribute(e,p+2),u.subVectors(a,r),d.subVectors(s,r),u.cross(d),n.setXYZ(p+0,u.x,u.y,u.z),n.setXYZ(p+1,u.x,u.y,u.z),n.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)ye.fromBufferAttribute(t,e),ye.normalize(),t.setXYZ(e,ye.x,ye.y,ye.z)}toNonIndexed(){function t(o,l){let c=o.array,u=o.itemSize,d=o.normalized,p=new c.constructor(l.length*u),g=0,_=0;for(let x=0,f=l.length;x<f;x++){o.isInterleavedBufferAttribute?g=l[x]*o.data.stride+o.offset:g=l[x]*u;for(let h=0;h<u;h++)p[_++]=c[g++]}return new Re(p,u,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let u=0,d=c.length;u<d;u++){let p=c[u],g=t(p,n);l.push(g)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let d=0,p=c.length;d<p;d++){let g=c[d];u.push(g.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(e))}let r=t.morphAttributes;for(let c in r){let u=[],d=r[c];for(let p=0,g=d.length;p<g;p++)u.push(d[p].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,u=a.length;c<u;c++){let d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},al=new ue,Vn=new Qn,xs=new jn,ol=new z,ys=new z,Ms=new z,bs=new z,Or=new z,Ss=new z,ll=new z,ws=new z,Je=class extends Fe{constructor(t=new He,e=new $s){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Ss.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=o[l],d=r[l];u!==0&&(Or.fromBufferAttribute(d,t),a?Ss.addScaledVector(Or,u):Ss.addScaledVector(Or.sub(e),u))}e.add(Ss)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),xs.copy(n.boundingSphere),xs.applyMatrix4(r),Vn.copy(t.ray).recast(t.near),!(xs.containsPoint(Vn.origin)===!1&&(Vn.intersectSphere(xs,ol)===null||Vn.origin.distanceToSquared(ol)>(t.far-t.near)**2))&&(al.copy(r).invert(),Vn.copy(t.ray).applyMatrix4(al),!(n.boundingBox!==null&&Vn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Vn)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,d=r.attributes.normal,p=r.groups,g=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,x=p.length;_<x;_++){let f=p[_],h=a[f.materialIndex],M=Math.max(f.start,g.start),w=Math.min(o.count,Math.min(f.start+f.count,g.start+g.count));for(let v=M,B=w;v<B;v+=3){let C=o.getX(v),T=o.getX(v+1),P=o.getX(v+2);s=Es(this,h,t,n,c,u,d,C,T,P),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{let _=Math.max(0,g.start),x=Math.min(o.count,g.start+g.count);for(let f=_,h=x;f<h;f+=3){let M=o.getX(f),w=o.getX(f+1),v=o.getX(f+2);s=Es(this,a,t,n,c,u,d,M,w,v),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let _=0,x=p.length;_<x;_++){let f=p[_],h=a[f.materialIndex],M=Math.max(f.start,g.start),w=Math.min(l.count,Math.min(f.start+f.count,g.start+g.count));for(let v=M,B=w;v<B;v+=3){let C=v,T=v+1,P=v+2;s=Es(this,h,t,n,c,u,d,C,T,P),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{let _=Math.max(0,g.start),x=Math.min(l.count,g.start+g.count);for(let f=_,h=x;f<h;f+=3){let M=f,w=f+1,v=f+2;s=Es(this,a,t,n,c,u,d,M,w,v),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}}};function Yh(i,t,e,n,s,r,a,o){let l;if(t.side===Ie?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===Un,o),l===null)return null;ws.copy(o),ws.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(ws);return c<e.near||c>e.far?null:{distance:c,point:ws.clone(),object:i}}function Es(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,ys),i.getVertexPosition(l,Ms),i.getVertexPosition(c,bs);let u=Yh(i,t,e,n,ys,Ms,bs,ll);if(u){let d=new z;qn.getBarycoord(ll,ys,Ms,bs,d),s&&(u.uv=qn.getInterpolatedAttribute(s,o,l,c,d,new Bt)),r&&(u.uv1=qn.getInterpolatedAttribute(r,o,l,c,d,new Bt)),a&&(u.normal=qn.getInterpolatedAttribute(a,o,l,c,d,new z),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let p={a:o,b:l,c,normal:new z,materialIndex:0};qn.getNormal(ys,Ms,bs,p.normal),u.face=p,u.barycoord=d}return u}var ts=class i extends He{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],u=[],d=[],p=0,g=0;_("z","y","x",-1,-1,n,e,t,a,r,0),_("z","y","x",1,-1,n,e,-t,a,r,1),_("x","z","y",1,1,t,n,e,s,a,2),_("x","z","y",1,-1,t,n,-e,s,a,3),_("x","y","z",1,-1,t,e,n,s,r,4),_("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new je(c,3)),this.setAttribute("normal",new je(u,3)),this.setAttribute("uv",new je(d,2));function _(x,f,h,M,w,v,B,C,T,P,E){let S=v/T,R=B/P,X=v/2,U=B/2,H=C/2,Z=T+1,L=P+1,k=0,N=0,J=new z;for(let tt=0;tt<L;tt++){let rt=tt*R-U;for(let Mt=0;Mt<Z;Mt++){let Rt=Mt*S-X;J[x]=Rt*M,J[f]=rt*w,J[h]=H,c.push(J.x,J.y,J.z),J[x]=0,J[f]=0,J[h]=C>0?1:-1,u.push(J.x,J.y,J.z),d.push(Mt/T),d.push(1-tt/P),k+=1}}for(let tt=0;tt<P;tt++)for(let rt=0;rt<T;rt++){let Mt=p+rt+Z*tt,Rt=p+rt+Z*(tt+1),q=p+(rt+1)+Z*(tt+1),et=p+(rt+1)+Z*tt;l.push(Mt,Rt,et),l.push(Rt,q,et),N+=6}o.addGroup(g,N,E),g+=N,p+=k}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function Li(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Ae(i){let t={};for(let e=0;e<i.length;e++){let n=Li(i[e]);for(let s in n)t[s]=n[s]}return t}function Zh(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function sc(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Xt.workingColorSpace}var Jh={clone:Li,merge:Ae},Kh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,jh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,rn=class extends Nn{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kh,this.fragmentShader=jh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Li(t.uniforms),this.uniformsGroups=Zh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},Zs=class extends Fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ue,this.projectionMatrix=new ue,this.projectionMatrixInverse=new ue,this.coordinateSystem=gn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Pn=new z,cl=new Bt,hl=new Bt,Ce=class extends Zs{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Qi*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Zi*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qi*2*Math.atan(Math.tan(Zi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Pn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Pn.x,Pn.y).multiplyScalar(-t/Pn.z),Pn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Pn.x,Pn.y).multiplyScalar(-t/Pn.z)}getViewSize(t,e){return this.getViewBounds(t,cl,hl),e.subVectors(hl,cl)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Zi*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},_i=-90,vi=1,Ua=class extends Fe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ce(_i,vi,t,e);s.layers=this.layers,this.add(s);let r=new Ce(_i,vi,t,e);r.layers=this.layers,this.add(r);let a=new Ce(_i,vi,t,e);a.layers=this.layers,this.add(a);let o=new Ce(_i,vi,t,e);o.layers=this.layers,this.add(o);let l=new Ce(_i,vi,t,e);l.layers=this.layers,this.add(l);let c=new Ce(_i,vi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===gn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Vs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,u]=this.children,d=t.getRenderTarget(),p=t.getActiveCubeFace(),g=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,a),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,u),t.setRenderTarget(d,p,g),t.xr.enabled=_,n.texture.needsPMREMUpdate=!0}},Js=class extends Ve{constructor(t,e,n,s,r,a,o,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Ci,super(t,e,n,s,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Na=class extends yn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Js(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:sn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new ts(5,5,5),r=new rn({name:"CubemapFromEquirect",uniforms:Li(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ie,blending:Ln});r.uniforms.tEquirect.value=e;let a=new Je(s,r),o=e.minFilter;return e.minFilter===Jn&&(e.minFilter=sn),new Ua(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}},Fr=new z,Qh=new z,tu=new Nt,Ye=class{constructor(t=new z(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Fr.subVectors(n,e).cross(Qh.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(Fr),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||tu.getNormalMatrix(t),s=this.coplanarPoint(Fr).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Hn=new jn,Ts=new z,Ks=class{constructor(t=new Ye,e=new Ye,n=new Ye,s=new Ye,r=new Ye,a=new Ye){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=gn){let n=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],u=s[5],d=s[6],p=s[7],g=s[8],_=s[9],x=s[10],f=s[11],h=s[12],M=s[13],w=s[14],v=s[15];if(n[0].setComponents(l-r,p-c,f-g,v-h).normalize(),n[1].setComponents(l+r,p+c,f+g,v+h).normalize(),n[2].setComponents(l+a,p+u,f+_,v+M).normalize(),n[3].setComponents(l-a,p-u,f-_,v-M).normalize(),n[4].setComponents(l-o,p-d,f-x,v-w).normalize(),e===gn)n[5].setComponents(l+o,p+d,f+x,v+w).normalize();else if(e===Vs)n[5].setComponents(o,d,x,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Hn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Hn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Hn)}intersectsSprite(t){return Hn.center.set(0,0,0),Hn.radius=.7071067811865476,Hn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Hn)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Ts.x=s.normal.x>0?t.max.x:t.min.x,Ts.y=s.normal.y>0?t.max.y:t.min.y,Ts.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ts)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function rc(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function eu(i){let t=new WeakMap;function e(o,l){let c=o.array,u=o.usage,d=c.byteLength,p=i.createBuffer();i.bindBuffer(l,p),i.bufferData(l,c,u),o.onUploadCallback();let g;if(c instanceof Float32Array)g=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?g=i.HALF_FLOAT:g=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)g=i.SHORT;else if(c instanceof Uint32Array)g=i.UNSIGNED_INT;else if(c instanceof Int32Array)g=i.INT;else if(c instanceof Int8Array)g=i.BYTE;else if(c instanceof Uint8Array)g=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)g=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:p,type:g,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){let u=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,u);else{d.sort((g,_)=>g.start-_.start);let p=0;for(let g=1;g<d.length;g++){let _=d[p],x=d[g];x.start<=_.start+_.count+1?_.count=Math.max(_.count,x.start+x.count-_.start):(++p,d[p]=x)}d.length=p+1;for(let g=0,_=d.length;g<_;g++){let x=d[g];i.bufferSubData(c,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var js=class i extends He{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,u=l+1,d=t/o,p=e/l,g=[],_=[],x=[],f=[];for(let h=0;h<u;h++){let M=h*p-a;for(let w=0;w<c;w++){let v=w*d-r;_.push(v,-M,0),x.push(0,0,1),f.push(w/o),f.push(1-h/l)}}for(let h=0;h<l;h++)for(let M=0;M<o;M++){let w=M+c*h,v=M+c*(h+1),B=M+1+c*(h+1),C=M+1+c*h;g.push(w,v,C),g.push(v,B,C)}this.setIndex(g),this.setAttribute("position",new je(_,3)),this.setAttribute("normal",new je(x,3)),this.setAttribute("uv",new je(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},nu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,iu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,su=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ru=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,au=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ou=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,lu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,cu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,uu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,du=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,fu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,pu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,mu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,gu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,_u=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,vu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,xu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,yu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Mu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,bu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Su=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,wu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Eu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Tu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Au=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Cu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ru=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Pu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Iu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Lu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Du=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Uu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Nu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ou=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Fu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Bu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,ku=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,zu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Vu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Hu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Gu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Wu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Xu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,$u=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,qu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Yu=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Zu=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ju=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ku=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ju=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Qu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,td=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ed=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,nd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,id=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,sd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,rd=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ad=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,od=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ld=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,cd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,hd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ud=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,dd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,fd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,pd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,md=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,gd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,_d=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,vd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,yd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Md=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,wd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Ed=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Td=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Ad=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Cd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Rd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Pd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Id=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ld=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Dd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ud=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Nd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Od=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Fd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Bd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,kd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,zd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Vd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Hd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Gd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Wd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Xd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,$d=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,qd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Yd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Zd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Jd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Kd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,jd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Qd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,tf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,ef=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,nf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,rf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,af=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,of=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,cf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,hf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,uf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,df=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ff=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,mf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,gf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,_f=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Mf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Sf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,wf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ef=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Af=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Pf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,If=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Lf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Df=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Uf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Nf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ft={alphahash_fragment:nu,alphahash_pars_fragment:iu,alphamap_fragment:su,alphamap_pars_fragment:ru,alphatest_fragment:au,alphatest_pars_fragment:ou,aomap_fragment:lu,aomap_pars_fragment:cu,batching_pars_vertex:hu,batching_vertex:uu,begin_vertex:du,beginnormal_vertex:fu,bsdfs:pu,iridescence_fragment:mu,bumpmap_pars_fragment:gu,clipping_planes_fragment:_u,clipping_planes_pars_fragment:vu,clipping_planes_pars_vertex:xu,clipping_planes_vertex:yu,color_fragment:Mu,color_pars_fragment:bu,color_pars_vertex:Su,color_vertex:wu,common:Eu,cube_uv_reflection_fragment:Tu,defaultnormal_vertex:Au,displacementmap_pars_vertex:Cu,displacementmap_vertex:Ru,emissivemap_fragment:Pu,emissivemap_pars_fragment:Iu,colorspace_fragment:Lu,colorspace_pars_fragment:Du,envmap_fragment:Uu,envmap_common_pars_fragment:Nu,envmap_pars_fragment:Ou,envmap_pars_vertex:Fu,envmap_physical_pars_fragment:Yu,envmap_vertex:Bu,fog_vertex:ku,fog_pars_vertex:zu,fog_fragment:Vu,fog_pars_fragment:Hu,gradientmap_pars_fragment:Gu,lightmap_pars_fragment:Wu,lights_lambert_fragment:Xu,lights_lambert_pars_fragment:$u,lights_pars_begin:qu,lights_toon_fragment:Zu,lights_toon_pars_fragment:Ju,lights_phong_fragment:Ku,lights_phong_pars_fragment:ju,lights_physical_fragment:Qu,lights_physical_pars_fragment:td,lights_fragment_begin:ed,lights_fragment_maps:nd,lights_fragment_end:id,logdepthbuf_fragment:sd,logdepthbuf_pars_fragment:rd,logdepthbuf_pars_vertex:ad,logdepthbuf_vertex:od,map_fragment:ld,map_pars_fragment:cd,map_particle_fragment:hd,map_particle_pars_fragment:ud,metalnessmap_fragment:dd,metalnessmap_pars_fragment:fd,morphinstance_vertex:pd,morphcolor_vertex:md,morphnormal_vertex:gd,morphtarget_pars_vertex:_d,morphtarget_vertex:vd,normal_fragment_begin:xd,normal_fragment_maps:yd,normal_pars_fragment:Md,normal_pars_vertex:bd,normal_vertex:Sd,normalmap_pars_fragment:wd,clearcoat_normal_fragment_begin:Ed,clearcoat_normal_fragment_maps:Td,clearcoat_pars_fragment:Ad,iridescence_pars_fragment:Cd,opaque_fragment:Rd,packing:Pd,premultiplied_alpha_fragment:Id,project_vertex:Ld,dithering_fragment:Dd,dithering_pars_fragment:Ud,roughnessmap_fragment:Nd,roughnessmap_pars_fragment:Od,shadowmap_pars_fragment:Fd,shadowmap_pars_vertex:Bd,shadowmap_vertex:kd,shadowmask_pars_fragment:zd,skinbase_vertex:Vd,skinning_pars_vertex:Hd,skinning_vertex:Gd,skinnormal_vertex:Wd,specularmap_fragment:Xd,specularmap_pars_fragment:$d,tonemapping_fragment:qd,tonemapping_pars_fragment:Yd,transmission_fragment:Zd,transmission_pars_fragment:Jd,uv_pars_fragment:Kd,uv_pars_vertex:jd,uv_vertex:Qd,worldpos_vertex:tf,background_vert:ef,background_frag:nf,backgroundCube_vert:sf,backgroundCube_frag:rf,cube_vert:af,cube_frag:of,depth_vert:lf,depth_frag:cf,distanceRGBA_vert:hf,distanceRGBA_frag:uf,equirect_vert:df,equirect_frag:ff,linedashed_vert:pf,linedashed_frag:mf,meshbasic_vert:gf,meshbasic_frag:_f,meshlambert_vert:vf,meshlambert_frag:xf,meshmatcap_vert:yf,meshmatcap_frag:Mf,meshnormal_vert:bf,meshnormal_frag:Sf,meshphong_vert:wf,meshphong_frag:Ef,meshphysical_vert:Tf,meshphysical_frag:Af,meshtoon_vert:Cf,meshtoon_frag:Rf,points_vert:Pf,points_frag:If,shadow_vert:Lf,shadow_frag:Df,sprite_vert:Uf,sprite_frag:Nf},at={common:{diffuse:{value:new Gt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Nt}},envmap:{envMap:{value:null},envMapRotation:{value:new Nt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Nt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Nt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Nt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Nt},normalScale:{value:new Bt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Nt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Nt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Nt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Nt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Gt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Gt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0},uvTransform:{value:new Nt}},sprite:{diffuse:{value:new Gt(16777215)},opacity:{value:1},center:{value:new Bt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}}},nn={basic:{uniforms:Ae([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.fog]),vertexShader:Ft.meshbasic_vert,fragmentShader:Ft.meshbasic_frag},lambert:{uniforms:Ae([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new Gt(0)}}]),vertexShader:Ft.meshlambert_vert,fragmentShader:Ft.meshlambert_frag},phong:{uniforms:Ae([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new Gt(0)},specular:{value:new Gt(1118481)},shininess:{value:30}}]),vertexShader:Ft.meshphong_vert,fragmentShader:Ft.meshphong_frag},standard:{uniforms:Ae([at.common,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.roughnessmap,at.metalnessmap,at.fog,at.lights,{emissive:{value:new Gt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ft.meshphysical_vert,fragmentShader:Ft.meshphysical_frag},toon:{uniforms:Ae([at.common,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.gradientmap,at.fog,at.lights,{emissive:{value:new Gt(0)}}]),vertexShader:Ft.meshtoon_vert,fragmentShader:Ft.meshtoon_frag},matcap:{uniforms:Ae([at.common,at.bumpmap,at.normalmap,at.displacementmap,at.fog,{matcap:{value:null}}]),vertexShader:Ft.meshmatcap_vert,fragmentShader:Ft.meshmatcap_frag},points:{uniforms:Ae([at.points,at.fog]),vertexShader:Ft.points_vert,fragmentShader:Ft.points_frag},dashed:{uniforms:Ae([at.common,at.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ft.linedashed_vert,fragmentShader:Ft.linedashed_frag},depth:{uniforms:Ae([at.common,at.displacementmap]),vertexShader:Ft.depth_vert,fragmentShader:Ft.depth_frag},normal:{uniforms:Ae([at.common,at.bumpmap,at.normalmap,at.displacementmap,{opacity:{value:1}}]),vertexShader:Ft.meshnormal_vert,fragmentShader:Ft.meshnormal_frag},sprite:{uniforms:Ae([at.sprite,at.fog]),vertexShader:Ft.sprite_vert,fragmentShader:Ft.sprite_frag},background:{uniforms:{uvTransform:{value:new Nt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ft.background_vert,fragmentShader:Ft.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Nt}},vertexShader:Ft.backgroundCube_vert,fragmentShader:Ft.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ft.cube_vert,fragmentShader:Ft.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ft.equirect_vert,fragmentShader:Ft.equirect_frag},distanceRGBA:{uniforms:Ae([at.common,at.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ft.distanceRGBA_vert,fragmentShader:Ft.distanceRGBA_frag},shadow:{uniforms:Ae([at.lights,at.fog,{color:{value:new Gt(0)},opacity:{value:1}}]),vertexShader:Ft.shadow_vert,fragmentShader:Ft.shadow_frag}};nn.physical={uniforms:Ae([nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Nt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Nt},clearcoatNormalScale:{value:new Bt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Nt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Nt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Nt},sheen:{value:0},sheenColor:{value:new Gt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Nt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Nt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Nt},transmissionSamplerSize:{value:new Bt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Nt},attenuationDistance:{value:0},attenuationColor:{value:new Gt(0)},specularColor:{value:new Gt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Nt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Nt},anisotropyVector:{value:new Bt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Nt}}]),vertexShader:Ft.meshphysical_vert,fragmentShader:Ft.meshphysical_frag};var As={r:0,b:0,g:0},Gn=new bn,Of=new ue;function Ff(i,t,e,n,s,r,a){let o=new Gt(0),l=r===!0?0:1,c,u,d=null,p=0,g=null;function _(M){let w=M.isScene===!0?M.background:null;return w&&w.isTexture&&(w=(M.backgroundBlurriness>0?e:t).get(w)),w}function x(M){let w=!1,v=_(M);v===null?h(o,l):v&&v.isColor&&(h(v,1),w=!0);let B=i.xr.getEnvironmentBlendMode();B==="additive"?n.buffers.color.setClear(0,0,0,1,a):B==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||w)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function f(M,w){let v=_(w);v&&(v.isCubeTexture||v.mapping===cr)?(u===void 0&&(u=new Je(new ts(1,1,1),new rn({name:"BackgroundCubeMaterial",uniforms:Li(nn.backgroundCube.uniforms),vertexShader:nn.backgroundCube.vertexShader,fragmentShader:nn.backgroundCube.fragmentShader,side:Ie,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(B,C,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),Gn.copy(w.backgroundRotation),Gn.x*=-1,Gn.y*=-1,Gn.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Gn.y*=-1,Gn.z*=-1),u.material.uniforms.envMap.value=v,u.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Of.makeRotationFromEuler(Gn)),u.material.toneMapped=Xt.getTransfer(v.colorSpace)!==Kt,(d!==v||p!==v.version||g!==i.toneMapping)&&(u.material.needsUpdate=!0,d=v,p=v.version,g=i.toneMapping),u.layers.enableAll(),M.unshift(u,u.geometry,u.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new Je(new js(2,2),new rn({name:"BackgroundMaterial",uniforms:Li(nn.background.uniforms),vertexShader:nn.background.vertexShader,fragmentShader:nn.background.fragmentShader,side:Un,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.toneMapped=Xt.getTransfer(v.colorSpace)!==Kt,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(d!==v||p!==v.version||g!==i.toneMapping)&&(c.material.needsUpdate=!0,d=v,p=v.version,g=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function h(M,w){M.getRGB(As,sc(i)),n.buffers.color.setClear(As.r,As.g,As.b,w,a)}return{getClearColor:function(){return o},setClearColor:function(M,w=1){o.set(M),l=w,h(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,h(o,l)},render:x,addToRenderList:f}}function Bf(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=p(null),r=s,a=!1;function o(S,R,X,U,H){let Z=!1,L=d(U,X,R);r!==L&&(r=L,c(r.object)),Z=g(S,U,X,H),Z&&_(S,U,X,H),H!==null&&t.update(H,i.ELEMENT_ARRAY_BUFFER),(Z||a)&&(a=!1,v(S,R,X,U),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}function l(){return i.createVertexArray()}function c(S){return i.bindVertexArray(S)}function u(S){return i.deleteVertexArray(S)}function d(S,R,X){let U=X.wireframe===!0,H=n[S.id];H===void 0&&(H={},n[S.id]=H);let Z=H[R.id];Z===void 0&&(Z={},H[R.id]=Z);let L=Z[U];return L===void 0&&(L=p(l()),Z[U]=L),L}function p(S){let R=[],X=[],U=[];for(let H=0;H<e;H++)R[H]=0,X[H]=0,U[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:X,attributeDivisors:U,object:S,attributes:{},index:null}}function g(S,R,X,U){let H=r.attributes,Z=R.attributes,L=0,k=X.getAttributes();for(let N in k)if(k[N].location>=0){let tt=H[N],rt=Z[N];if(rt===void 0&&(N==="instanceMatrix"&&S.instanceMatrix&&(rt=S.instanceMatrix),N==="instanceColor"&&S.instanceColor&&(rt=S.instanceColor)),tt===void 0||tt.attribute!==rt||rt&&tt.data!==rt.data)return!0;L++}return r.attributesNum!==L||r.index!==U}function _(S,R,X,U){let H={},Z=R.attributes,L=0,k=X.getAttributes();for(let N in k)if(k[N].location>=0){let tt=Z[N];tt===void 0&&(N==="instanceMatrix"&&S.instanceMatrix&&(tt=S.instanceMatrix),N==="instanceColor"&&S.instanceColor&&(tt=S.instanceColor));let rt={};rt.attribute=tt,tt&&tt.data&&(rt.data=tt.data),H[N]=rt,L++}r.attributes=H,r.attributesNum=L,r.index=U}function x(){let S=r.newAttributes;for(let R=0,X=S.length;R<X;R++)S[R]=0}function f(S){h(S,0)}function h(S,R){let X=r.newAttributes,U=r.enabledAttributes,H=r.attributeDivisors;X[S]=1,U[S]===0&&(i.enableVertexAttribArray(S),U[S]=1),H[S]!==R&&(i.vertexAttribDivisor(S,R),H[S]=R)}function M(){let S=r.newAttributes,R=r.enabledAttributes;for(let X=0,U=R.length;X<U;X++)R[X]!==S[X]&&(i.disableVertexAttribArray(X),R[X]=0)}function w(S,R,X,U,H,Z,L){L===!0?i.vertexAttribIPointer(S,R,X,H,Z):i.vertexAttribPointer(S,R,X,U,H,Z)}function v(S,R,X,U){x();let H=U.attributes,Z=X.getAttributes(),L=R.defaultAttributeValues;for(let k in Z){let N=Z[k];if(N.location>=0){let J=H[k];if(J===void 0&&(k==="instanceMatrix"&&S.instanceMatrix&&(J=S.instanceMatrix),k==="instanceColor"&&S.instanceColor&&(J=S.instanceColor)),J!==void 0){let tt=J.normalized,rt=J.itemSize,Mt=t.get(J);if(Mt===void 0)continue;let Rt=Mt.buffer,q=Mt.type,et=Mt.bytesPerElement,gt=q===i.INT||q===i.UNSIGNED_INT||J.gpuType===oo;if(J.isInterleavedBufferAttribute){let st=J.data,wt=st.stride,Ct=J.offset;if(st.isInstancedInterleavedBuffer){for(let Lt=0;Lt<N.locationSize;Lt++)h(N.location+Lt,st.meshPerAttribute);S.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=st.meshPerAttribute*st.count)}else for(let Lt=0;Lt<N.locationSize;Lt++)f(N.location+Lt);i.bindBuffer(i.ARRAY_BUFFER,Rt);for(let Lt=0;Lt<N.locationSize;Lt++)w(N.location+Lt,rt/N.locationSize,q,tt,wt*et,(Ct+rt/N.locationSize*Lt)*et,gt)}else{if(J.isInstancedBufferAttribute){for(let st=0;st<N.locationSize;st++)h(N.location+st,J.meshPerAttribute);S.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let st=0;st<N.locationSize;st++)f(N.location+st);i.bindBuffer(i.ARRAY_BUFFER,Rt);for(let st=0;st<N.locationSize;st++)w(N.location+st,rt/N.locationSize,q,tt,rt*et,rt/N.locationSize*st*et,gt)}}else if(L!==void 0){let tt=L[k];if(tt!==void 0)switch(tt.length){case 2:i.vertexAttrib2fv(N.location,tt);break;case 3:i.vertexAttrib3fv(N.location,tt);break;case 4:i.vertexAttrib4fv(N.location,tt);break;default:i.vertexAttrib1fv(N.location,tt)}}}}M()}function B(){P();for(let S in n){let R=n[S];for(let X in R){let U=R[X];for(let H in U)u(U[H].object),delete U[H];delete R[X]}delete n[S]}}function C(S){if(n[S.id]===void 0)return;let R=n[S.id];for(let X in R){let U=R[X];for(let H in U)u(U[H].object),delete U[H];delete R[X]}delete n[S.id]}function T(S){for(let R in n){let X=n[R];if(X[S.id]===void 0)continue;let U=X[S.id];for(let H in U)u(U[H].object),delete U[H];delete X[S.id]}}function P(){E(),a=!0,r!==s&&(r=s,c(r.object))}function E(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:P,resetDefaultState:E,dispose:B,releaseStatesOfGeometry:C,releaseStatesOfProgram:T,initAttributes:x,enableAttribute:f,disableUnusedAttributes:M}}function kf(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function a(c,u,d){d!==0&&(i.drawArraysInstanced(n,c,u,d),e.update(u,n,d))}function o(c,u,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,d);let g=0;for(let _=0;_<d;_++)g+=u[_];e.update(g,n,1)}function l(c,u,d,p){if(d===0)return;let g=t.get("WEBGL_multi_draw");if(g===null)for(let _=0;_<c.length;_++)a(c[_],u[_],p[_]);else{g.multiDrawArraysInstancedWEBGL(n,c,0,u,0,p,0,d);let _=0;for(let x=0;x<d;x++)_+=u[x]*p[x];e.update(_,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function zf(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let T=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(T){return!(T!==Ze&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){let P=T===ss&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==vn&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==mn&&!P)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let d=e.logarithmicDepthBuffer===!0,p=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),g=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),f=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),h=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),B=_>0,C=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:p,maxTextures:g,maxVertexTextures:_,maxTextureSize:x,maxCubemapSize:f,maxAttributes:h,maxVertexUniforms:M,maxVaryings:w,maxFragmentUniforms:v,vertexTextures:B,maxSamples:C}}function Vf(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Ye,o=new Nt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,p){let g=d.length!==0||p||n!==0||s;return s=p,n=d.length,g},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,p){e=u(d,p,0)},this.setState=function(d,p,g){let _=d.clippingPlanes,x=d.clipIntersection,f=d.clipShadows,h=i.get(d);if(!s||_===null||_.length===0||r&&!f)r?u(null):c();else{let M=r?0:n,w=M*4,v=h.clippingState||null;l.value=v,v=u(_,p,w,g);for(let B=0;B!==w;++B)v[B]=e[B];h.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(d,p,g,_){let x=d!==null?d.length:0,f=null;if(x!==0){if(f=l.value,_!==!0||f===null){let h=g+x*4,M=p.matrixWorldInverse;o.getNormalMatrix(M),(f===null||f.length<h)&&(f=new Float32Array(h));for(let w=0,v=g;w!==x;++w,v+=4)a.copy(d[w]).applyMatrix4(M,o),a.normal.toArray(f,v),f[v+3]=a.constant}l.value=f,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,f}}function Hf(i){let t=new WeakMap;function e(a,o){return o===ta?a.mapping=Ci:o===ea&&(a.mapping=Ri),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===ta||o===ea)if(t.has(a)){let l=t.get(a).texture;return e(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new Na(l.height);return c.fromEquirectangularTexture(i,a),t.set(a,c),a.addEventListener("dispose",s),e(c.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var Oa=class extends Zs{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Mi=4,ul=[.125,.215,.35,.446,.526,.582],Yn=20,Br=new Oa,dl=new Gt,kr=null,zr=0,Vr=0,Hr=!1,Xn=(1+Math.sqrt(5))/2,xi=1/Xn,fl=[new z(-Xn,xi,0),new z(Xn,xi,0),new z(-xi,0,Xn),new z(xi,0,Xn),new z(0,Xn,-xi),new z(0,Xn,xi),new z(-1,1,-1),new z(1,1,-1),new z(-1,1,1),new z(1,1,1)],Qs=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){kr=this._renderer.getRenderTarget(),zr=this._renderer.getActiveCubeFace(),Vr=this._renderer.getActiveMipmapLevel(),Hr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ml(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(kr,zr,Vr),this._renderer.xr.enabled=Hr,t.scissorTest=!1,Cs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ci||t.mapping===Ri?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),kr=this._renderer.getRenderTarget(),zr=this._renderer.getActiveCubeFace(),Vr=this._renderer.getActiveMipmapLevel(),Hr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:sn,minFilter:sn,generateMipmaps:!1,type:ss,format:Ze,colorSpace:Ui,depthBuffer:!1},s=pl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=pl(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Gf(r)),this._blurMaterial=Wf(r,t,e)}return s}_compileMaterial(t){let e=new Je(this._lodPlanes[0],t);this._renderer.compile(e,Br)}_sceneToCubeUV(t,e,n,s){let o=new Ce(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,p=u.toneMapping;u.getClearColor(dl),u.toneMapping=Dn,u.autoClear=!1;let g=new $s({name:"PMREM.Background",side:Ie,depthWrite:!1,depthTest:!1}),_=new Je(new ts,g),x=!1,f=t.background;f?f.isColor&&(g.color.copy(f),t.background=null,x=!0):(g.color.copy(dl),x=!0);for(let h=0;h<6;h++){let M=h%3;M===0?(o.up.set(0,l[h],0),o.lookAt(c[h],0,0)):M===1?(o.up.set(0,0,l[h]),o.lookAt(0,c[h],0)):(o.up.set(0,l[h],0),o.lookAt(0,0,c[h]));let w=this._cubeSize;Cs(s,M*w,h>2?w:0,w,w),u.setRenderTarget(s),x&&u.render(_,o),u.render(t,o)}_.geometry.dispose(),_.material.dispose(),u.toneMapping=p,u.autoClear=d,t.background=f}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Ci||t.mapping===Ri;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=gl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ml());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new Je(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;Cs(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Br)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=fl[(s-r-1)%fl.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,d=new Je(this._lodPlanes[s],c),p=c.uniforms,g=this._sizeLods[n]-1,_=isFinite(r)?Math.PI/(2*g):2*Math.PI/(2*Yn-1),x=r/_,f=isFinite(r)?1+Math.floor(u*x):Yn;f>Yn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Yn}`);let h=[],M=0;for(let T=0;T<Yn;++T){let P=T/x,E=Math.exp(-P*P/2);h.push(E),T===0?M+=E:T<f&&(M+=2*E)}for(let T=0;T<h.length;T++)h[T]=h[T]/M;p.envMap.value=t.texture,p.samples.value=f,p.weights.value=h,p.latitudinal.value=a==="latitudinal",o&&(p.poleAxis.value=o);let{_lodMax:w}=this;p.dTheta.value=_,p.mipInt.value=w-n;let v=this._sizeLods[s],B=3*v*(s>w-Mi?s-w+Mi:0),C=4*(this._cubeSize-v);Cs(e,B,C,3*v,2*v),l.setRenderTarget(e),l.render(d,Br)}};function Gf(i){let t=[],e=[],n=[],s=i,r=i-Mi+1+ul.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);e.push(o);let l=1/o;a>i-Mi?l=ul[a-i+Mi-1]:a===0&&(l=0),n.push(l);let c=1/(o-2),u=-c,d=1+c,p=[u,u,d,u,d,d,u,u,d,d,u,d],g=6,_=6,x=3,f=2,h=1,M=new Float32Array(x*_*g),w=new Float32Array(f*_*g),v=new Float32Array(h*_*g);for(let C=0;C<g;C++){let T=C%3*2/3-1,P=C>2?0:-1,E=[T,P,0,T+2/3,P,0,T+2/3,P+1,0,T,P,0,T+2/3,P+1,0,T,P+1,0];M.set(E,x*_*C),w.set(p,f*_*C);let S=[C,C,C,C,C,C];v.set(S,h*_*C)}let B=new He;B.setAttribute("position",new Re(M,x)),B.setAttribute("uv",new Re(w,f)),B.setAttribute("faceIndex",new Re(v,h)),t.push(B),s>Mi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function pl(i,t,e){let n=new yn(i,t,e);return n.texture.mapping=cr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Cs(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Wf(i,t,e){let n=new Float32Array(Yn),s=new z(0,1,0);return new rn({name:"SphericalGaussianBlur",defines:{n:Yn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:mo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Ln,depthTest:!1,depthWrite:!1})}function ml(){return new rn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:mo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Ln,depthTest:!1,depthWrite:!1})}function gl(){return new rn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:mo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ln,depthTest:!1,depthWrite:!1})}function mo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Xf(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){let l=o.mapping,c=l===ta||l===ea,u=l===Ci||l===Ri;if(c||u){let d=t.get(o),p=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==p)return e===null&&(e=new Qs(i)),d=c?e.fromEquirectangular(o,d):e.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{let g=o.image;return c&&g&&g.height>0||u&&g&&s(g)?(e===null&&(e=new Qs(i)),d=c?e.fromEquirectangular(o):e.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",r),d.texture):null}}}return o}function s(o){let l=0,c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function $f(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&qi("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function qf(i,t,e,n){let s={},r=new WeakMap;function a(d){let p=d.target;p.index!==null&&t.remove(p.index);for(let _ in p.attributes)t.remove(p.attributes[_]);for(let _ in p.morphAttributes){let x=p.morphAttributes[_];for(let f=0,h=x.length;f<h;f++)t.remove(x[f])}p.removeEventListener("dispose",a),delete s[p.id];let g=r.get(p);g&&(t.remove(g),r.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,e.memory.geometries--}function o(d,p){return s[p.id]===!0||(p.addEventListener("dispose",a),s[p.id]=!0,e.memory.geometries++),p}function l(d){let p=d.attributes;for(let _ in p)t.update(p[_],i.ARRAY_BUFFER);let g=d.morphAttributes;for(let _ in g){let x=g[_];for(let f=0,h=x.length;f<h;f++)t.update(x[f],i.ARRAY_BUFFER)}}function c(d){let p=[],g=d.index,_=d.attributes.position,x=0;if(g!==null){let M=g.array;x=g.version;for(let w=0,v=M.length;w<v;w+=3){let B=M[w+0],C=M[w+1],T=M[w+2];p.push(B,C,C,T,T,B)}}else if(_!==void 0){let M=_.array;x=_.version;for(let w=0,v=M.length/3-1;w<v;w+=3){let B=w+0,C=w+1,T=w+2;p.push(B,C,C,T,T,B)}}else return;let f=new(nc(p)?Ys:qs)(p,1);f.version=x;let h=r.get(d);h&&t.remove(h),r.set(d,f)}function u(d){let p=r.get(d);if(p){let g=d.index;g!==null&&p.version<g.version&&c(d)}else c(d);return r.get(d)}return{get:o,update:l,getWireframeAttribute:u}}function Yf(i,t,e){let n;function s(p){n=p}let r,a;function o(p){r=p.type,a=p.bytesPerElement}function l(p,g){i.drawElements(n,g,r,p*a),e.update(g,n,1)}function c(p,g,_){_!==0&&(i.drawElementsInstanced(n,g,r,p*a,_),e.update(g,n,_))}function u(p,g,_){if(_===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,g,0,r,p,0,_);let f=0;for(let h=0;h<_;h++)f+=g[h];e.update(f,n,1)}function d(p,g,_,x){if(_===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let h=0;h<p.length;h++)c(p[h]/a,g[h],x[h]);else{f.multiDrawElementsInstancedWEBGL(n,g,0,r,p,0,x,0,_);let h=0;for(let M=0;M<_;M++)h+=g[M]*x[M];e.update(h,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=d}function Zf(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Jf(i,t,e){let n=new WeakMap,s=new he;function r(a,o,l){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u!==void 0?u.length:0,p=n.get(o);if(p===void 0||p.count!==d){let E=function(){T.dispose(),n.delete(o),o.removeEventListener("dispose",E)};p!==void 0&&p.texture.dispose();let g=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],h=o.morphAttributes.normal||[],M=o.morphAttributes.color||[],w=0;g===!0&&(w=1),_===!0&&(w=2),x===!0&&(w=3);let v=o.attributes.position.count*w,B=1;v>t.maxTextureSize&&(B=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);let C=new Float32Array(v*B*4*d),T=new Ws(C,v,B,d);T.type=mn,T.needsUpdate=!0;let P=w*4;for(let S=0;S<d;S++){let R=f[S],X=h[S],U=M[S],H=v*B*4*S;for(let Z=0;Z<R.count;Z++){let L=Z*P;g===!0&&(s.fromBufferAttribute(R,Z),C[H+L+0]=s.x,C[H+L+1]=s.y,C[H+L+2]=s.z,C[H+L+3]=0),_===!0&&(s.fromBufferAttribute(X,Z),C[H+L+4]=s.x,C[H+L+5]=s.y,C[H+L+6]=s.z,C[H+L+7]=0),x===!0&&(s.fromBufferAttribute(U,Z),C[H+L+8]=s.x,C[H+L+9]=s.y,C[H+L+10]=s.z,C[H+L+11]=U.itemSize===4?s.w:1)}}p={count:d,texture:T,size:new Bt(v,B)},n.set(o,p),o.addEventListener("dispose",E)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let g=0;for(let x=0;x<c.length;x++)g+=c[x];let _=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(i,"morphTargetBaseInfluence",_),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",p.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",p.size)}return{update:r}}function Kf(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,u=l.geometry,d=t.get(l,u);if(s.get(d)!==c&&(t.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let p=l.skeleton;s.get(p)!==c&&(p.update(),s.set(p,c))}return d}function a(){s=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}var tr=class extends Ve{constructor(t,e,n,s,r,a,o,l,c,u=wi){if(u!==wi&&u!==Ii)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===wi&&(n=Kn),n===void 0&&u===Ii&&(n=Pi),super(null,s,r,a,o,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Ke,this.minFilter=l!==void 0?l:Ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},ac=new Ve,_l=new tr(1,1),oc=new Ws,lc=new Da,cc=new Js,vl=[],xl=[],yl=new Float32Array(16),Ml=new Float32Array(9),bl=new Float32Array(4);function Oi(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=vl[s];if(r===void 0&&(r=new Float32Array(s),vl[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function ge(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function _e(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function ur(i,t){let e=xl[t];e===void 0&&(e=new Int32Array(t),xl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function jf(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Qf(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2fv(this.addr,t),_e(e,t)}}function tp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ge(e,t))return;i.uniform3fv(this.addr,t),_e(e,t)}}function ep(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4fv(this.addr,t),_e(e,t)}}function np(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),_e(e,t)}else{if(ge(e,n))return;bl.set(n),i.uniformMatrix2fv(this.addr,!1,bl),_e(e,n)}}function ip(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),_e(e,t)}else{if(ge(e,n))return;Ml.set(n),i.uniformMatrix3fv(this.addr,!1,Ml),_e(e,n)}}function sp(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),_e(e,t)}else{if(ge(e,n))return;yl.set(n),i.uniformMatrix4fv(this.addr,!1,yl),_e(e,n)}}function rp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function ap(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2iv(this.addr,t),_e(e,t)}}function op(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ge(e,t))return;i.uniform3iv(this.addr,t),_e(e,t)}}function lp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4iv(this.addr,t),_e(e,t)}}function cp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function hp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2uiv(this.addr,t),_e(e,t)}}function up(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ge(e,t))return;i.uniform3uiv(this.addr,t),_e(e,t)}}function dp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4uiv(this.addr,t),_e(e,t)}}function fp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(_l.compareFunction=tc,r=_l):r=ac,e.setTexture2D(t||r,s)}function pp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||lc,s)}function mp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||cc,s)}function gp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||oc,s)}function _p(i){switch(i){case 5126:return jf;case 35664:return Qf;case 35665:return tp;case 35666:return ep;case 35674:return np;case 35675:return ip;case 35676:return sp;case 5124:case 35670:return rp;case 35667:case 35671:return ap;case 35668:case 35672:return op;case 35669:case 35673:return lp;case 5125:return cp;case 36294:return hp;case 36295:return up;case 36296:return dp;case 35678:case 36198:case 36298:case 36306:case 35682:return fp;case 35679:case 36299:case 36307:return pp;case 35680:case 36300:case 36308:case 36293:return mp;case 36289:case 36303:case 36311:case 36292:return gp}}function vp(i,t){i.uniform1fv(this.addr,t)}function xp(i,t){let e=Oi(t,this.size,2);i.uniform2fv(this.addr,e)}function yp(i,t){let e=Oi(t,this.size,3);i.uniform3fv(this.addr,e)}function Mp(i,t){let e=Oi(t,this.size,4);i.uniform4fv(this.addr,e)}function bp(i,t){let e=Oi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Sp(i,t){let e=Oi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function wp(i,t){let e=Oi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Ep(i,t){i.uniform1iv(this.addr,t)}function Tp(i,t){i.uniform2iv(this.addr,t)}function Ap(i,t){i.uniform3iv(this.addr,t)}function Cp(i,t){i.uniform4iv(this.addr,t)}function Rp(i,t){i.uniform1uiv(this.addr,t)}function Pp(i,t){i.uniform2uiv(this.addr,t)}function Ip(i,t){i.uniform3uiv(this.addr,t)}function Lp(i,t){i.uniform4uiv(this.addr,t)}function Dp(i,t,e){let n=this.cache,s=t.length,r=ur(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),_e(n,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||ac,r[a])}function Up(i,t,e){let n=this.cache,s=t.length,r=ur(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),_e(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||lc,r[a])}function Np(i,t,e){let n=this.cache,s=t.length,r=ur(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),_e(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||cc,r[a])}function Op(i,t,e){let n=this.cache,s=t.length,r=ur(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),_e(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||oc,r[a])}function Fp(i){switch(i){case 5126:return vp;case 35664:return xp;case 35665:return yp;case 35666:return Mp;case 35674:return bp;case 35675:return Sp;case 35676:return wp;case 5124:case 35670:return Ep;case 35667:case 35671:return Tp;case 35668:case 35672:return Ap;case 35669:case 35673:return Cp;case 5125:return Rp;case 36294:return Pp;case 36295:return Ip;case 36296:return Lp;case 35678:case 36198:case 36298:case 36306:case 35682:return Dp;case 35679:case 36299:case 36307:return Up;case 35680:case 36300:case 36308:case 36293:return Np;case 36289:case 36303:case 36311:case 36292:return Op}}var Fa=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=_p(e.type)}},Ba=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Fp(e.type)}},ka=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},Gr=/(\w+)(\])?(\[|\.)?/g;function Sl(i,t){i.seq.push(t),i.map[t.id]=t}function Bp(i,t,e){let n=i.name,s=n.length;for(Gr.lastIndex=0;;){let r=Gr.exec(n),a=Gr.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Sl(e,c===void 0?new Fa(o,i,t):new Ba(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new ka(o),Sl(e,d)),e=d}}}var Ti=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);Bp(r,a,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function wl(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var kp=37297,zp=0;function Vp(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var El=new Nt;function Hp(i){Xt._getMatrix(El,Xt.workingColorSpace,i);let t=`mat3( ${El.elements.map(e=>e.toFixed(4))} )`;switch(Xt.getTransfer(i)){case hr:return[t,"LinearTransferOETF"];case Kt:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Tl(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Vp(i.getShaderSource(t),a)}else return s}function Gp(i,t){let e=Hp(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Wp(i,t){let e;switch(t){case jc:e="Linear";break;case Qc:e="Reinhard";break;case th:e="Cineon";break;case eh:e="ACESFilmic";break;case ih:e="AgX";break;case sh:e="Neutral";break;case nh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Rs=new z;function Xp(){Xt.getLuminanceCoefficients(Rs);let i=Rs.x.toFixed(4),t=Rs.y.toFixed(4),e=Rs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function $p(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Yi).join(`
`)}function qp(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Yp(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function Yi(i){return i!==""}function Al(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Cl(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Zp=/^[ \t]*#include +<([\w\d./]+)>/gm;function za(i){return i.replace(Zp,Kp)}var Jp=new Map;function Kp(i,t){let e=Ft[t];if(e===void 0){let n=Jp.get(t);if(n!==void 0)e=Ft[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return za(e)}var jp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rl(i){return i.replace(jp,Qp)}function Qp(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Pl(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function tm(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Vl?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Ic?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===fn&&(t="SHADOWMAP_TYPE_VSM"),t}function em(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ci:case Ri:t="ENVMAP_TYPE_CUBE";break;case cr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function nm(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Ri:t="ENVMAP_MODE_REFRACTION";break}return t}function im(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Hl:t="ENVMAP_BLENDING_MULTIPLY";break;case Jc:t="ENVMAP_BLENDING_MIX";break;case Kc:t="ENVMAP_BLENDING_ADD";break}return t}function sm(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function rm(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=tm(e),c=em(e),u=nm(e),d=im(e),p=sm(e),g=$p(e),_=qp(r),x=s.createProgram(),f,h,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Yi).join(`
`),f.length>0&&(f+=`
`),h=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Yi).join(`
`),h.length>0&&(h+=`
`)):(f=[Pl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Yi).join(`
`),h=[Pl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+d:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Dn?"#define TONE_MAPPING":"",e.toneMapping!==Dn?Ft.tonemapping_pars_fragment:"",e.toneMapping!==Dn?Wp("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ft.colorspace_pars_fragment,Gp("linearToOutputTexel",e.outputColorSpace),Xp(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Yi).join(`
`)),a=za(a),a=Al(a,e),a=Cl(a,e),o=za(o),o=Al(o,e),o=Cl(o,e),a=Rl(a),o=Rl(o),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,f=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,h=["#define varying in",e.glslVersion===Go?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Go?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);let w=M+f+a,v=M+h+o,B=wl(s,s.VERTEX_SHADER,w),C=wl(s,s.FRAGMENT_SHADER,v);s.attachShader(x,B),s.attachShader(x,C),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function T(R){if(i.debug.checkShaderErrors){let X=s.getProgramInfoLog(x).trim(),U=s.getShaderInfoLog(B).trim(),H=s.getShaderInfoLog(C).trim(),Z=!0,L=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,B,C);else{let k=Tl(s,B,"vertex"),N=Tl(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+X+`
`+k+`
`+N)}else X!==""?console.warn("THREE.WebGLProgram: Program Info Log:",X):(U===""||H==="")&&(L=!1);L&&(R.diagnostics={runnable:Z,programLog:X,vertexShader:{log:U,prefix:f},fragmentShader:{log:H,prefix:h}})}s.deleteShader(B),s.deleteShader(C),P=new Ti(s,x),E=Yp(s,x)}let P;this.getUniforms=function(){return P===void 0&&T(this),P};let E;this.getAttributes=function(){return E===void 0&&T(this),E};let S=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=s.getProgramParameter(x,kp)),S},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=zp++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=B,this.fragmentShader=C,this}var am=0,Va=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Ha(t),e.set(t,n)),n}},Ha=class{constructor(t){this.id=am++,this.code=t,this.usedTimes=0}};function om(i,t,e,n,s,r,a){let o=new Xs,l=new Va,c=new Set,u=[],d=s.logarithmicDepthBuffer,p=s.vertexTextures,g=s.precision,_={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(E){return c.add(E),E===0?"uv":`uv${E}`}function f(E,S,R,X,U){let H=X.fog,Z=U.geometry,L=E.isMeshStandardMaterial?X.environment:null,k=(E.isMeshStandardMaterial?e:t).get(E.envMap||L),N=k&&k.mapping===cr?k.image.height:null,J=_[E.type];E.precision!==null&&(g=s.getMaxPrecision(E.precision),g!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",g,"instead."));let tt=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,rt=tt!==void 0?tt.length:0,Mt=0;Z.morphAttributes.position!==void 0&&(Mt=1),Z.morphAttributes.normal!==void 0&&(Mt=2),Z.morphAttributes.color!==void 0&&(Mt=3);let Rt,q,et,gt;if(J){let Zt=nn[J];Rt=Zt.vertexShader,q=Zt.fragmentShader}else Rt=E.vertexShader,q=E.fragmentShader,l.update(E),et=l.getVertexShaderID(E),gt=l.getFragmentShaderID(E);let st=i.getRenderTarget(),wt=i.state.buffers.depth.getReversed(),Ct=U.isInstancedMesh===!0,Lt=U.isBatchedMesh===!0,Qt=!!E.map,zt=!!E.matcap,re=!!k,I=!!E.aoMap,xe=!!E.lightMap,kt=!!E.bumpMap,Vt=!!E.normalMap,Et=!!E.displacementMap,Jt=!!E.emissiveMap,Tt=!!E.metalnessMap,A=!!E.roughnessMap,y=E.anisotropy>0,V=E.clearcoat>0,K=E.dispersion>0,Q=E.iridescence>0,Y=E.sheen>0,bt=E.transmission>0,ct=y&&!!E.anisotropyMap,ft=V&&!!E.clearcoatMap,Wt=V&&!!E.clearcoatNormalMap,nt=V&&!!E.clearcoatRoughnessMap,pt=Q&&!!E.iridescenceMap,At=Q&&!!E.iridescenceThicknessMap,Pt=Y&&!!E.sheenColorMap,mt=Y&&!!E.sheenRoughnessMap,Ht=!!E.specularMap,Ot=!!E.specularColorMap,te=!!E.specularIntensityMap,D=bt&&!!E.transmissionMap,lt=bt&&!!E.thicknessMap,$=!!E.gradientMap,j=!!E.alphaMap,dt=E.alphaTest>0,ht=!!E.alphaHash,Dt=!!E.extensions,oe=Dn;E.toneMapped&&(st===null||st.isXRRenderTarget===!0)&&(oe=i.toneMapping);let Me={shaderID:J,shaderType:E.type,shaderName:E.name,vertexShader:Rt,fragmentShader:q,defines:E.defines,customVertexShaderID:et,customFragmentShaderID:gt,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:g,batching:Lt,batchingColor:Lt&&U._colorsTexture!==null,instancing:Ct,instancingColor:Ct&&U.instanceColor!==null,instancingMorph:Ct&&U.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:st===null?i.outputColorSpace:st.isXRRenderTarget===!0?st.texture.colorSpace:Ui,alphaToCoverage:!!E.alphaToCoverage,map:Qt,matcap:zt,envMap:re,envMapMode:re&&k.mapping,envMapCubeUVHeight:N,aoMap:I,lightMap:xe,bumpMap:kt,normalMap:Vt,displacementMap:p&&Et,emissiveMap:Jt,normalMapObjectSpace:Vt&&E.normalMapType===ch,normalMapTangentSpace:Vt&&E.normalMapType===lh,metalnessMap:Tt,roughnessMap:A,anisotropy:y,anisotropyMap:ct,clearcoat:V,clearcoatMap:ft,clearcoatNormalMap:Wt,clearcoatRoughnessMap:nt,dispersion:K,iridescence:Q,iridescenceMap:pt,iridescenceThicknessMap:At,sheen:Y,sheenColorMap:Pt,sheenRoughnessMap:mt,specularMap:Ht,specularColorMap:Ot,specularIntensityMap:te,transmission:bt,transmissionMap:D,thicknessMap:lt,gradientMap:$,opaque:E.transparent===!1&&E.blending===Si&&E.alphaToCoverage===!1,alphaMap:j,alphaTest:dt,alphaHash:ht,combine:E.combine,mapUv:Qt&&x(E.map.channel),aoMapUv:I&&x(E.aoMap.channel),lightMapUv:xe&&x(E.lightMap.channel),bumpMapUv:kt&&x(E.bumpMap.channel),normalMapUv:Vt&&x(E.normalMap.channel),displacementMapUv:Et&&x(E.displacementMap.channel),emissiveMapUv:Jt&&x(E.emissiveMap.channel),metalnessMapUv:Tt&&x(E.metalnessMap.channel),roughnessMapUv:A&&x(E.roughnessMap.channel),anisotropyMapUv:ct&&x(E.anisotropyMap.channel),clearcoatMapUv:ft&&x(E.clearcoatMap.channel),clearcoatNormalMapUv:Wt&&x(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:nt&&x(E.clearcoatRoughnessMap.channel),iridescenceMapUv:pt&&x(E.iridescenceMap.channel),iridescenceThicknessMapUv:At&&x(E.iridescenceThicknessMap.channel),sheenColorMapUv:Pt&&x(E.sheenColorMap.channel),sheenRoughnessMapUv:mt&&x(E.sheenRoughnessMap.channel),specularMapUv:Ht&&x(E.specularMap.channel),specularColorMapUv:Ot&&x(E.specularColorMap.channel),specularIntensityMapUv:te&&x(E.specularIntensityMap.channel),transmissionMapUv:D&&x(E.transmissionMap.channel),thicknessMapUv:lt&&x(E.thicknessMap.channel),alphaMapUv:j&&x(E.alphaMap.channel),vertexTangents:!!Z.attributes.tangent&&(Vt||y),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!Z.attributes.uv&&(Qt||j),fog:!!H,useFog:E.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:E.flatShading===!0,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:wt,skinning:U.isSkinnedMesh===!0,morphTargets:Z.morphAttributes.position!==void 0,morphNormals:Z.morphAttributes.normal!==void 0,morphColors:Z.morphAttributes.color!==void 0,morphTargetsCount:rt,morphTextureStride:Mt,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:E.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:oe,decodeVideoTexture:Qt&&E.map.isVideoTexture===!0&&Xt.getTransfer(E.map.colorSpace)===Kt,decodeVideoTextureEmissive:Jt&&E.emissiveMap.isVideoTexture===!0&&Xt.getTransfer(E.emissiveMap.colorSpace)===Kt,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===pn,flipSided:E.side===Ie,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:Dt&&E.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Dt&&E.extensions.multiDraw===!0||Lt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return Me.vertexUv1s=c.has(1),Me.vertexUv2s=c.has(2),Me.vertexUv3s=c.has(3),c.clear(),Me}function h(E){let S=[];if(E.shaderID?S.push(E.shaderID):(S.push(E.customVertexShaderID),S.push(E.customFragmentShaderID)),E.defines!==void 0)for(let R in E.defines)S.push(R),S.push(E.defines[R]);return E.isRawShaderMaterial===!1&&(M(S,E),w(S,E),S.push(i.outputColorSpace)),S.push(E.customProgramCacheKey),S.join()}function M(E,S){E.push(S.precision),E.push(S.outputColorSpace),E.push(S.envMapMode),E.push(S.envMapCubeUVHeight),E.push(S.mapUv),E.push(S.alphaMapUv),E.push(S.lightMapUv),E.push(S.aoMapUv),E.push(S.bumpMapUv),E.push(S.normalMapUv),E.push(S.displacementMapUv),E.push(S.emissiveMapUv),E.push(S.metalnessMapUv),E.push(S.roughnessMapUv),E.push(S.anisotropyMapUv),E.push(S.clearcoatMapUv),E.push(S.clearcoatNormalMapUv),E.push(S.clearcoatRoughnessMapUv),E.push(S.iridescenceMapUv),E.push(S.iridescenceThicknessMapUv),E.push(S.sheenColorMapUv),E.push(S.sheenRoughnessMapUv),E.push(S.specularMapUv),E.push(S.specularColorMapUv),E.push(S.specularIntensityMapUv),E.push(S.transmissionMapUv),E.push(S.thicknessMapUv),E.push(S.combine),E.push(S.fogExp2),E.push(S.sizeAttenuation),E.push(S.morphTargetsCount),E.push(S.morphAttributeCount),E.push(S.numDirLights),E.push(S.numPointLights),E.push(S.numSpotLights),E.push(S.numSpotLightMaps),E.push(S.numHemiLights),E.push(S.numRectAreaLights),E.push(S.numDirLightShadows),E.push(S.numPointLightShadows),E.push(S.numSpotLightShadows),E.push(S.numSpotLightShadowsWithMaps),E.push(S.numLightProbes),E.push(S.shadowMapType),E.push(S.toneMapping),E.push(S.numClippingPlanes),E.push(S.numClipIntersection),E.push(S.depthPacking)}function w(E,S){o.disableAll(),S.supportsVertexTextures&&o.enable(0),S.instancing&&o.enable(1),S.instancingColor&&o.enable(2),S.instancingMorph&&o.enable(3),S.matcap&&o.enable(4),S.envMap&&o.enable(5),S.normalMapObjectSpace&&o.enable(6),S.normalMapTangentSpace&&o.enable(7),S.clearcoat&&o.enable(8),S.iridescence&&o.enable(9),S.alphaTest&&o.enable(10),S.vertexColors&&o.enable(11),S.vertexAlphas&&o.enable(12),S.vertexUv1s&&o.enable(13),S.vertexUv2s&&o.enable(14),S.vertexUv3s&&o.enable(15),S.vertexTangents&&o.enable(16),S.anisotropy&&o.enable(17),S.alphaHash&&o.enable(18),S.batching&&o.enable(19),S.dispersion&&o.enable(20),S.batchingColor&&o.enable(21),E.push(o.mask),o.disableAll(),S.fog&&o.enable(0),S.useFog&&o.enable(1),S.flatShading&&o.enable(2),S.logarithmicDepthBuffer&&o.enable(3),S.reverseDepthBuffer&&o.enable(4),S.skinning&&o.enable(5),S.morphTargets&&o.enable(6),S.morphNormals&&o.enable(7),S.morphColors&&o.enable(8),S.premultipliedAlpha&&o.enable(9),S.shadowMapEnabled&&o.enable(10),S.doubleSided&&o.enable(11),S.flipSided&&o.enable(12),S.useDepthPacking&&o.enable(13),S.dithering&&o.enable(14),S.transmission&&o.enable(15),S.sheen&&o.enable(16),S.opaque&&o.enable(17),S.pointsUvs&&o.enable(18),S.decodeVideoTexture&&o.enable(19),S.decodeVideoTextureEmissive&&o.enable(20),S.alphaToCoverage&&o.enable(21),E.push(o.mask)}function v(E){let S=_[E.type],R;if(S){let X=nn[S];R=Jh.clone(X.uniforms)}else R=E.uniforms;return R}function B(E,S){let R;for(let X=0,U=u.length;X<U;X++){let H=u[X];if(H.cacheKey===S){R=H,++R.usedTimes;break}}return R===void 0&&(R=new rm(i,S,E,r),u.push(R)),R}function C(E){if(--E.usedTimes===0){let S=u.indexOf(E);u[S]=u[u.length-1],u.pop(),E.destroy()}}function T(E){l.remove(E)}function P(){l.dispose()}return{getParameters:f,getProgramCacheKey:h,getUniforms:v,acquireProgram:B,releaseProgram:C,releaseShaderCache:T,programs:u,dispose:P}}function lm(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function cm(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Il(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Ll(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(d,p,g,_,x,f){let h=i[t];return h===void 0?(h={id:d.id,object:d,geometry:p,material:g,groupOrder:_,renderOrder:d.renderOrder,z:x,group:f},i[t]=h):(h.id=d.id,h.object=d,h.geometry=p,h.material=g,h.groupOrder=_,h.renderOrder=d.renderOrder,h.z=x,h.group=f),t++,h}function o(d,p,g,_,x,f){let h=a(d,p,g,_,x,f);g.transmission>0?n.push(h):g.transparent===!0?s.push(h):e.push(h)}function l(d,p,g,_,x,f){let h=a(d,p,g,_,x,f);g.transmission>0?n.unshift(h):g.transparent===!0?s.unshift(h):e.unshift(h)}function c(d,p){e.length>1&&e.sort(d||cm),n.length>1&&n.sort(p||Il),s.length>1&&s.sort(p||Il)}function u(){for(let d=t,p=i.length;d<p;d++){let g=i[d];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:u,sort:c}}function hm(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new Ll,i.set(n,[a])):s>=r.length?(a=new Ll,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function um(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new z,color:new Gt};break;case"SpotLight":e={position:new z,direction:new z,color:new Gt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new z,color:new Gt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new z,skyColor:new Gt,groundColor:new Gt};break;case"RectAreaLight":e={color:new Gt,position:new z,halfWidth:new z,halfHeight:new z};break}return i[t.id]=e,e}}}function dm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Bt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Bt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Bt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var fm=0;function pm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function mm(i){let t=new um,e=dm(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new z);let s=new z,r=new ue,a=new ue;function o(c){let u=0,d=0,p=0;for(let E=0;E<9;E++)n.probe[E].set(0,0,0);let g=0,_=0,x=0,f=0,h=0,M=0,w=0,v=0,B=0,C=0,T=0;c.sort(pm);for(let E=0,S=c.length;E<S;E++){let R=c[E],X=R.color,U=R.intensity,H=R.distance,Z=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)u+=X.r*U,d+=X.g*U,p+=X.b*U;else if(R.isLightProbe){for(let L=0;L<9;L++)n.probe[L].addScaledVector(R.sh.coefficients[L],U);T++}else if(R.isDirectionalLight){let L=t.get(R);if(L.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let k=R.shadow,N=e.get(R);N.shadowIntensity=k.intensity,N.shadowBias=k.bias,N.shadowNormalBias=k.normalBias,N.shadowRadius=k.radius,N.shadowMapSize=k.mapSize,n.directionalShadow[g]=N,n.directionalShadowMap[g]=Z,n.directionalShadowMatrix[g]=R.shadow.matrix,M++}n.directional[g]=L,g++}else if(R.isSpotLight){let L=t.get(R);L.position.setFromMatrixPosition(R.matrixWorld),L.color.copy(X).multiplyScalar(U),L.distance=H,L.coneCos=Math.cos(R.angle),L.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),L.decay=R.decay,n.spot[x]=L;let k=R.shadow;if(R.map&&(n.spotLightMap[B]=R.map,B++,k.updateMatrices(R),R.castShadow&&C++),n.spotLightMatrix[x]=k.matrix,R.castShadow){let N=e.get(R);N.shadowIntensity=k.intensity,N.shadowBias=k.bias,N.shadowNormalBias=k.normalBias,N.shadowRadius=k.radius,N.shadowMapSize=k.mapSize,n.spotShadow[x]=N,n.spotShadowMap[x]=Z,v++}x++}else if(R.isRectAreaLight){let L=t.get(R);L.color.copy(X).multiplyScalar(U),L.halfWidth.set(R.width*.5,0,0),L.halfHeight.set(0,R.height*.5,0),n.rectArea[f]=L,f++}else if(R.isPointLight){let L=t.get(R);if(L.color.copy(R.color).multiplyScalar(R.intensity),L.distance=R.distance,L.decay=R.decay,R.castShadow){let k=R.shadow,N=e.get(R);N.shadowIntensity=k.intensity,N.shadowBias=k.bias,N.shadowNormalBias=k.normalBias,N.shadowRadius=k.radius,N.shadowMapSize=k.mapSize,N.shadowCameraNear=k.camera.near,N.shadowCameraFar=k.camera.far,n.pointShadow[_]=N,n.pointShadowMap[_]=Z,n.pointShadowMatrix[_]=R.shadow.matrix,w++}n.point[_]=L,_++}else if(R.isHemisphereLight){let L=t.get(R);L.skyColor.copy(R.color).multiplyScalar(U),L.groundColor.copy(R.groundColor).multiplyScalar(U),n.hemi[h]=L,h++}}f>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=at.LTC_FLOAT_1,n.rectAreaLTC2=at.LTC_FLOAT_2):(n.rectAreaLTC1=at.LTC_HALF_1,n.rectAreaLTC2=at.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=d,n.ambient[2]=p;let P=n.hash;(P.directionalLength!==g||P.pointLength!==_||P.spotLength!==x||P.rectAreaLength!==f||P.hemiLength!==h||P.numDirectionalShadows!==M||P.numPointShadows!==w||P.numSpotShadows!==v||P.numSpotMaps!==B||P.numLightProbes!==T)&&(n.directional.length=g,n.spot.length=x,n.rectArea.length=f,n.point.length=_,n.hemi.length=h,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=v+B-C,n.spotLightMap.length=B,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=T,P.directionalLength=g,P.pointLength=_,P.spotLength=x,P.rectAreaLength=f,P.hemiLength=h,P.numDirectionalShadows=M,P.numPointShadows=w,P.numSpotShadows=v,P.numSpotMaps=B,P.numLightProbes=T,n.version=fm++)}function l(c,u){let d=0,p=0,g=0,_=0,x=0,f=u.matrixWorldInverse;for(let h=0,M=c.length;h<M;h++){let w=c[h];if(w.isDirectionalLight){let v=n.directional[d];v.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(f),d++}else if(w.isSpotLight){let v=n.spot[g];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(f),v.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(f),g++}else if(w.isRectAreaLight){let v=n.rectArea[_];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(f),a.identity(),r.copy(w.matrixWorld),r.premultiply(f),a.extractRotation(r),v.halfWidth.set(w.width*.5,0,0),v.halfHeight.set(0,w.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),_++}else if(w.isPointLight){let v=n.point[p];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(f),p++}else if(w.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(w.matrixWorld),v.direction.transformDirection(f),x++}}}return{setup:o,setupView:l,state:n}}function Dl(i){let t=new mm(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function a(u){n.push(u)}function o(){t.setup(e)}function l(u){t.setupView(e,u)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function gm(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Dl(i),t.set(s,[o])):r>=a.length?(o=new Dl(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var Ga=class extends Nn{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=ah,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Wa=class extends Nn{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},_m=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,vm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function xm(i,t,e){let n=new Ks,s=new Bt,r=new Bt,a=new he,o=new Ga({depthPacking:oh}),l=new Wa,c={},u=e.maxTextureSize,d={[Un]:Ie,[Ie]:Un,[pn]:pn},p=new rn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Bt},radius:{value:4}},vertexShader:_m,fragmentShader:vm}),g=p.clone();g.defines.HORIZONTAL_PASS=1;let _=new He;_.setAttribute("position",new Re(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new Je(_,p),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Vl;let h=this.type;this.render=function(C,T,P){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||C.length===0)return;let E=i.getRenderTarget(),S=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),X=i.state;X.setBlending(Ln),X.buffers.color.setClear(1,1,1,1),X.buffers.depth.setTest(!0),X.setScissorTest(!1);let U=h!==fn&&this.type===fn,H=h===fn&&this.type!==fn;for(let Z=0,L=C.length;Z<L;Z++){let k=C[Z],N=k.shadow;if(N===void 0){console.warn("THREE.WebGLShadowMap:",k,"has no shadow.");continue}if(N.autoUpdate===!1&&N.needsUpdate===!1)continue;s.copy(N.mapSize);let J=N.getFrameExtents();if(s.multiply(J),r.copy(N.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/J.x),s.x=r.x*J.x,N.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/J.y),s.y=r.y*J.y,N.mapSize.y=r.y)),N.map===null||U===!0||H===!0){let rt=this.type!==fn?{minFilter:Ke,magFilter:Ke}:{};N.map!==null&&N.map.dispose(),N.map=new yn(s.x,s.y,rt),N.map.texture.name=k.name+".shadowMap",N.camera.updateProjectionMatrix()}i.setRenderTarget(N.map),i.clear();let tt=N.getViewportCount();for(let rt=0;rt<tt;rt++){let Mt=N.getViewport(rt);a.set(r.x*Mt.x,r.y*Mt.y,r.x*Mt.z,r.y*Mt.w),X.viewport(a),N.updateMatrices(k,rt),n=N.getFrustum(),v(T,P,N.camera,k,this.type)}N.isPointLightShadow!==!0&&this.type===fn&&M(N,P),N.needsUpdate=!1}h=this.type,f.needsUpdate=!1,i.setRenderTarget(E,S,R)};function M(C,T){let P=t.update(x);p.defines.VSM_SAMPLES!==C.blurSamples&&(p.defines.VSM_SAMPLES=C.blurSamples,g.defines.VSM_SAMPLES=C.blurSamples,p.needsUpdate=!0,g.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new yn(s.x,s.y)),p.uniforms.shadow_pass.value=C.map.texture,p.uniforms.resolution.value=C.mapSize,p.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(T,null,P,p,x,null),g.uniforms.shadow_pass.value=C.mapPass.texture,g.uniforms.resolution.value=C.mapSize,g.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(T,null,P,g,x,null)}function w(C,T,P,E){let S=null,R=P.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(R!==void 0)S=R;else if(S=P.isPointLight===!0?l:o,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let X=S.uuid,U=T.uuid,H=c[X];H===void 0&&(H={},c[X]=H);let Z=H[U];Z===void 0&&(Z=S.clone(),H[U]=Z,T.addEventListener("dispose",B)),S=Z}if(S.visible=T.visible,S.wireframe=T.wireframe,E===fn?S.side=T.shadowSide!==null?T.shadowSide:T.side:S.side=T.shadowSide!==null?T.shadowSide:d[T.side],S.alphaMap=T.alphaMap,S.alphaTest=T.alphaTest,S.map=T.map,S.clipShadows=T.clipShadows,S.clippingPlanes=T.clippingPlanes,S.clipIntersection=T.clipIntersection,S.displacementMap=T.displacementMap,S.displacementScale=T.displacementScale,S.displacementBias=T.displacementBias,S.wireframeLinewidth=T.wireframeLinewidth,S.linewidth=T.linewidth,P.isPointLight===!0&&S.isMeshDistanceMaterial===!0){let X=i.properties.get(S);X.light=P}return S}function v(C,T,P,E,S){if(C.visible===!1)return;if(C.layers.test(T.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&S===fn)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,C.matrixWorld);let U=t.update(C),H=C.material;if(Array.isArray(H)){let Z=U.groups;for(let L=0,k=Z.length;L<k;L++){let N=Z[L],J=H[N.materialIndex];if(J&&J.visible){let tt=w(C,J,E,S);C.onBeforeShadow(i,C,T,P,U,tt,N),i.renderBufferDirect(P,null,U,tt,C,N),C.onAfterShadow(i,C,T,P,U,tt,N)}}}else if(H.visible){let Z=w(C,H,E,S);C.onBeforeShadow(i,C,T,P,U,Z,null),i.renderBufferDirect(P,null,U,Z,C,null),C.onAfterShadow(i,C,T,P,U,Z,null)}}let X=C.children;for(let U=0,H=X.length;U<H;U++)v(X[U],T,P,E,S)}function B(C){C.target.removeEventListener("dispose",B);for(let P in c){let E=c[P],S=C.target.uuid;S in E&&(E[S].dispose(),delete E[S])}}}var ym={[qr]:Yr,[Zr]:jr,[Jr]:Qr,[Ai]:Kr,[Yr]:qr,[jr]:Zr,[Qr]:Jr,[Kr]:Ai};function Mm(i,t){function e(){let D=!1,lt=new he,$=null,j=new he(0,0,0,0);return{setMask:function(dt){$!==dt&&!D&&(i.colorMask(dt,dt,dt,dt),$=dt)},setLocked:function(dt){D=dt},setClear:function(dt,ht,Dt,oe,Me){Me===!0&&(dt*=oe,ht*=oe,Dt*=oe),lt.set(dt,ht,Dt,oe),j.equals(lt)===!1&&(i.clearColor(dt,ht,Dt,oe),j.copy(lt))},reset:function(){D=!1,$=null,j.set(-1,0,0,0)}}}function n(){let D=!1,lt=!1,$=null,j=null,dt=null;return{setReversed:function(ht){if(lt!==ht){let Dt=t.get("EXT_clip_control");lt?Dt.clipControlEXT(Dt.LOWER_LEFT_EXT,Dt.ZERO_TO_ONE_EXT):Dt.clipControlEXT(Dt.LOWER_LEFT_EXT,Dt.NEGATIVE_ONE_TO_ONE_EXT);let oe=dt;dt=null,this.setClear(oe)}lt=ht},getReversed:function(){return lt},setTest:function(ht){ht?st(i.DEPTH_TEST):wt(i.DEPTH_TEST)},setMask:function(ht){$!==ht&&!D&&(i.depthMask(ht),$=ht)},setFunc:function(ht){if(lt&&(ht=ym[ht]),j!==ht){switch(ht){case qr:i.depthFunc(i.NEVER);break;case Yr:i.depthFunc(i.ALWAYS);break;case Zr:i.depthFunc(i.LESS);break;case Ai:i.depthFunc(i.LEQUAL);break;case Jr:i.depthFunc(i.EQUAL);break;case Kr:i.depthFunc(i.GEQUAL);break;case jr:i.depthFunc(i.GREATER);break;case Qr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}j=ht}},setLocked:function(ht){D=ht},setClear:function(ht){dt!==ht&&(lt&&(ht=1-ht),i.clearDepth(ht),dt=ht)},reset:function(){D=!1,$=null,j=null,dt=null,lt=!1}}}function s(){let D=!1,lt=null,$=null,j=null,dt=null,ht=null,Dt=null,oe=null,Me=null;return{setTest:function(Zt){D||(Zt?st(i.STENCIL_TEST):wt(i.STENCIL_TEST))},setMask:function(Zt){lt!==Zt&&!D&&(i.stencilMask(Zt),lt=Zt)},setFunc:function(Zt,Ge,an){($!==Zt||j!==Ge||dt!==an)&&(i.stencilFunc(Zt,Ge,an),$=Zt,j=Ge,dt=an)},setOp:function(Zt,Ge,an){(ht!==Zt||Dt!==Ge||oe!==an)&&(i.stencilOp(Zt,Ge,an),ht=Zt,Dt=Ge,oe=an)},setLocked:function(Zt){D=Zt},setClear:function(Zt){Me!==Zt&&(i.clearStencil(Zt),Me=Zt)},reset:function(){D=!1,lt=null,$=null,j=null,dt=null,ht=null,Dt=null,oe=null,Me=null}}}let r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap,u={},d={},p=new WeakMap,g=[],_=null,x=!1,f=null,h=null,M=null,w=null,v=null,B=null,C=null,T=new Gt(0,0,0),P=0,E=!1,S=null,R=null,X=null,U=null,H=null,Z=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),L=!1,k=0,N=i.getParameter(i.VERSION);N.indexOf("WebGL")!==-1?(k=parseFloat(/^WebGL (\d)/.exec(N)[1]),L=k>=1):N.indexOf("OpenGL ES")!==-1&&(k=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),L=k>=2);let J=null,tt={},rt=i.getParameter(i.SCISSOR_BOX),Mt=i.getParameter(i.VIEWPORT),Rt=new he().fromArray(rt),q=new he().fromArray(Mt);function et(D,lt,$,j){let dt=new Uint8Array(4),ht=i.createTexture();i.bindTexture(D,ht),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Dt=0;Dt<$;Dt++)D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY?i.texImage3D(lt,0,i.RGBA,1,1,j,0,i.RGBA,i.UNSIGNED_BYTE,dt):i.texImage2D(lt+Dt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,dt);return ht}let gt={};gt[i.TEXTURE_2D]=et(i.TEXTURE_2D,i.TEXTURE_2D,1),gt[i.TEXTURE_CUBE_MAP]=et(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),gt[i.TEXTURE_2D_ARRAY]=et(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),gt[i.TEXTURE_3D]=et(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),st(i.DEPTH_TEST),a.setFunc(Ai),kt(!1),Vt(Uo),st(i.CULL_FACE),I(Ln);function st(D){u[D]!==!0&&(i.enable(D),u[D]=!0)}function wt(D){u[D]!==!1&&(i.disable(D),u[D]=!1)}function Ct(D,lt){return d[D]!==lt?(i.bindFramebuffer(D,lt),d[D]=lt,D===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=lt),D===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=lt),!0):!1}function Lt(D,lt){let $=g,j=!1;if(D){$=p.get(lt),$===void 0&&($=[],p.set(lt,$));let dt=D.textures;if($.length!==dt.length||$[0]!==i.COLOR_ATTACHMENT0){for(let ht=0,Dt=dt.length;ht<Dt;ht++)$[ht]=i.COLOR_ATTACHMENT0+ht;$.length=dt.length,j=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,j=!0);j&&i.drawBuffers($)}function Qt(D){return _!==D?(i.useProgram(D),_=D,!0):!1}let zt={[$n]:i.FUNC_ADD,[Dc]:i.FUNC_SUBTRACT,[Uc]:i.FUNC_REVERSE_SUBTRACT};zt[Nc]=i.MIN,zt[Oc]=i.MAX;let re={[Fc]:i.ZERO,[Bc]:i.ONE,[kc]:i.SRC_COLOR,[Xr]:i.SRC_ALPHA,[Xc]:i.SRC_ALPHA_SATURATE,[Gc]:i.DST_COLOR,[Vc]:i.DST_ALPHA,[zc]:i.ONE_MINUS_SRC_COLOR,[$r]:i.ONE_MINUS_SRC_ALPHA,[Wc]:i.ONE_MINUS_DST_COLOR,[Hc]:i.ONE_MINUS_DST_ALPHA,[$c]:i.CONSTANT_COLOR,[qc]:i.ONE_MINUS_CONSTANT_COLOR,[Yc]:i.CONSTANT_ALPHA,[Zc]:i.ONE_MINUS_CONSTANT_ALPHA};function I(D,lt,$,j,dt,ht,Dt,oe,Me,Zt){if(D===Ln){x===!0&&(wt(i.BLEND),x=!1);return}if(x===!1&&(st(i.BLEND),x=!0),D!==Lc){if(D!==f||Zt!==E){if((h!==$n||v!==$n)&&(i.blendEquation(i.FUNC_ADD),h=$n,v=$n),Zt)switch(D){case Si:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case No:i.blendFunc(i.ONE,i.ONE);break;case Oo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Fo:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case Si:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case No:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Oo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Fo:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}M=null,w=null,B=null,C=null,T.set(0,0,0),P=0,f=D,E=Zt}return}dt=dt||lt,ht=ht||$,Dt=Dt||j,(lt!==h||dt!==v)&&(i.blendEquationSeparate(zt[lt],zt[dt]),h=lt,v=dt),($!==M||j!==w||ht!==B||Dt!==C)&&(i.blendFuncSeparate(re[$],re[j],re[ht],re[Dt]),M=$,w=j,B=ht,C=Dt),(oe.equals(T)===!1||Me!==P)&&(i.blendColor(oe.r,oe.g,oe.b,Me),T.copy(oe),P=Me),f=D,E=!1}function xe(D,lt){D.side===pn?wt(i.CULL_FACE):st(i.CULL_FACE);let $=D.side===Ie;lt&&($=!$),kt($),D.blending===Si&&D.transparent===!1?I(Ln):I(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),a.setFunc(D.depthFunc),a.setTest(D.depthTest),a.setMask(D.depthWrite),r.setMask(D.colorWrite);let j=D.stencilWrite;o.setTest(j),j&&(o.setMask(D.stencilWriteMask),o.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),o.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),Jt(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?st(i.SAMPLE_ALPHA_TO_COVERAGE):wt(i.SAMPLE_ALPHA_TO_COVERAGE)}function kt(D){S!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),S=D)}function Vt(D){D!==Rc?(st(i.CULL_FACE),D!==R&&(D===Uo?i.cullFace(i.BACK):D===Pc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):wt(i.CULL_FACE),R=D}function Et(D){D!==X&&(L&&i.lineWidth(D),X=D)}function Jt(D,lt,$){D?(st(i.POLYGON_OFFSET_FILL),(U!==lt||H!==$)&&(i.polygonOffset(lt,$),U=lt,H=$)):wt(i.POLYGON_OFFSET_FILL)}function Tt(D){D?st(i.SCISSOR_TEST):wt(i.SCISSOR_TEST)}function A(D){D===void 0&&(D=i.TEXTURE0+Z-1),J!==D&&(i.activeTexture(D),J=D)}function y(D,lt,$){$===void 0&&(J===null?$=i.TEXTURE0+Z-1:$=J);let j=tt[$];j===void 0&&(j={type:void 0,texture:void 0},tt[$]=j),(j.type!==D||j.texture!==lt)&&(J!==$&&(i.activeTexture($),J=$),i.bindTexture(D,lt||gt[D]),j.type=D,j.texture=lt)}function V(){let D=tt[J];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function K(){try{i.compressedTexImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Q(){try{i.compressedTexImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Y(){try{i.texSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function bt(){try{i.texSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ct(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ft(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Wt(){try{i.texStorage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function nt(){try{i.texStorage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function pt(){try{i.texImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function At(){try{i.texImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Pt(D){Rt.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),Rt.copy(D))}function mt(D){q.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),q.copy(D))}function Ht(D,lt){let $=c.get(lt);$===void 0&&($=new WeakMap,c.set(lt,$));let j=$.get(D);j===void 0&&(j=i.getUniformBlockIndex(lt,D.name),$.set(D,j))}function Ot(D,lt){let j=c.get(lt).get(D);l.get(lt)!==j&&(i.uniformBlockBinding(lt,j,D.__bindingPointIndex),l.set(lt,j))}function te(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},J=null,tt={},d={},p=new WeakMap,g=[],_=null,x=!1,f=null,h=null,M=null,w=null,v=null,B=null,C=null,T=new Gt(0,0,0),P=0,E=!1,S=null,R=null,X=null,U=null,H=null,Rt.set(0,0,i.canvas.width,i.canvas.height),q.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:st,disable:wt,bindFramebuffer:Ct,drawBuffers:Lt,useProgram:Qt,setBlending:I,setMaterial:xe,setFlipSided:kt,setCullFace:Vt,setLineWidth:Et,setPolygonOffset:Jt,setScissorTest:Tt,activeTexture:A,bindTexture:y,unbindTexture:V,compressedTexImage2D:K,compressedTexImage3D:Q,texImage2D:pt,texImage3D:At,updateUBOMapping:Ht,uniformBlockBinding:Ot,texStorage2D:Wt,texStorage3D:nt,texSubImage2D:Y,texSubImage3D:bt,compressedTexSubImage2D:ct,compressedTexSubImage3D:ft,scissor:Pt,viewport:mt,reset:te}}function Ul(i,t,e,n){let s=bm(n);switch(e){case ql:return i*t;case Zl:return i*t;case Jl:return i*t*2;case Kl:return i*t/s.components*s.byteLength;case ho:return i*t/s.components*s.byteLength;case jl:return i*t*2/s.components*s.byteLength;case uo:return i*t*2/s.components*s.byteLength;case Yl:return i*t*3/s.components*s.byteLength;case Ze:return i*t*4/s.components*s.byteLength;case fo:return i*t*4/s.components*s.byteLength;case Ns:case Os:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Fs:case Bs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ra:case oa:return Math.max(i,16)*Math.max(t,8)/4;case sa:case aa:return Math.max(i,8)*Math.max(t,8)/2;case la:case ca:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ha:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ua:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case da:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case fa:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case pa:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case ma:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case ga:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case _a:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case va:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case xa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case ya:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Ma:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case ba:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Sa:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case wa:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case ks:case Ea:case Ta:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Ql:case Aa:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Ca:case Ra:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function bm(i){switch(i){case vn:case Wl:return{byteLength:1,components:1};case ji:case Xl:case ss:return{byteLength:2,components:1};case lo:case co:return{byteLength:2,components:4};case Kn:case oo:case mn:return{byteLength:4,components:1};case $l:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Sm(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Bt,u=new WeakMap,d,p=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(A,y){return g?new OffscreenCanvas(A,y):Hs("canvas")}function x(A,y,V){let K=1,Q=Tt(A);if((Q.width>V||Q.height>V)&&(K=V/Math.max(Q.width,Q.height)),K<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let Y=Math.floor(K*Q.width),bt=Math.floor(K*Q.height);d===void 0&&(d=_(Y,bt));let ct=y?_(Y,bt):d;return ct.width=Y,ct.height=bt,ct.getContext("2d").drawImage(A,0,0,Y,bt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+Y+"x"+bt+")."),ct}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),A;return A}function f(A){return A.generateMipmaps}function h(A){i.generateMipmap(A)}function M(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(A,y,V,K,Q=!1){if(A!==null){if(i[A]!==void 0)return i[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let Y=y;if(y===i.RED&&(V===i.FLOAT&&(Y=i.R32F),V===i.HALF_FLOAT&&(Y=i.R16F),V===i.UNSIGNED_BYTE&&(Y=i.R8)),y===i.RED_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.R8UI),V===i.UNSIGNED_SHORT&&(Y=i.R16UI),V===i.UNSIGNED_INT&&(Y=i.R32UI),V===i.BYTE&&(Y=i.R8I),V===i.SHORT&&(Y=i.R16I),V===i.INT&&(Y=i.R32I)),y===i.RG&&(V===i.FLOAT&&(Y=i.RG32F),V===i.HALF_FLOAT&&(Y=i.RG16F),V===i.UNSIGNED_BYTE&&(Y=i.RG8)),y===i.RG_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RG8UI),V===i.UNSIGNED_SHORT&&(Y=i.RG16UI),V===i.UNSIGNED_INT&&(Y=i.RG32UI),V===i.BYTE&&(Y=i.RG8I),V===i.SHORT&&(Y=i.RG16I),V===i.INT&&(Y=i.RG32I)),y===i.RGB_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),V===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),V===i.UNSIGNED_INT&&(Y=i.RGB32UI),V===i.BYTE&&(Y=i.RGB8I),V===i.SHORT&&(Y=i.RGB16I),V===i.INT&&(Y=i.RGB32I)),y===i.RGBA_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),V===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),V===i.UNSIGNED_INT&&(Y=i.RGBA32UI),V===i.BYTE&&(Y=i.RGBA8I),V===i.SHORT&&(Y=i.RGBA16I),V===i.INT&&(Y=i.RGBA32I)),y===i.RGB&&V===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),y===i.RGBA){let bt=Q?hr:Xt.getTransfer(K);V===i.FLOAT&&(Y=i.RGBA32F),V===i.HALF_FLOAT&&(Y=i.RGBA16F),V===i.UNSIGNED_BYTE&&(Y=bt===Kt?i.SRGB8_ALPHA8:i.RGBA8),V===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),V===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Y}function v(A,y){let V;return A?y===null||y===Kn||y===Pi?V=i.DEPTH24_STENCIL8:y===mn?V=i.DEPTH32F_STENCIL8:y===ji&&(V=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Kn||y===Pi?V=i.DEPTH_COMPONENT24:y===mn?V=i.DEPTH_COMPONENT32F:y===ji&&(V=i.DEPTH_COMPONENT16),V}function B(A,y){return f(A)===!0||A.isFramebufferTexture&&A.minFilter!==Ke&&A.minFilter!==sn?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function C(A){let y=A.target;y.removeEventListener("dispose",C),P(y),y.isVideoTexture&&u.delete(y)}function T(A){let y=A.target;y.removeEventListener("dispose",T),S(y)}function P(A){let y=n.get(A);if(y.__webglInit===void 0)return;let V=A.source,K=p.get(V);if(K){let Q=K[y.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&E(A),Object.keys(K).length===0&&p.delete(V)}n.remove(A)}function E(A){let y=n.get(A);i.deleteTexture(y.__webglTexture);let V=A.source,K=p.get(V);delete K[y.__cacheKey],a.memory.textures--}function S(A){let y=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(y.__webglFramebuffer[K]))for(let Q=0;Q<y.__webglFramebuffer[K].length;Q++)i.deleteFramebuffer(y.__webglFramebuffer[K][Q]);else i.deleteFramebuffer(y.__webglFramebuffer[K]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[K])}else{if(Array.isArray(y.__webglFramebuffer))for(let K=0;K<y.__webglFramebuffer.length;K++)i.deleteFramebuffer(y.__webglFramebuffer[K]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let K=0;K<y.__webglColorRenderbuffer.length;K++)y.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[K]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let V=A.textures;for(let K=0,Q=V.length;K<Q;K++){let Y=n.get(V[K]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),a.memory.textures--),n.remove(V[K])}n.remove(A)}let R=0;function X(){R=0}function U(){let A=R;return A>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+s.maxTextures),R+=1,A}function H(A){let y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function Z(A,y){let V=n.get(A);if(A.isVideoTexture&&Et(A),A.isRenderTargetTexture===!1&&A.version>0&&V.__version!==A.version){let K=A.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(V,A,y);return}}e.bindTexture(i.TEXTURE_2D,V.__webglTexture,i.TEXTURE0+y)}function L(A,y){let V=n.get(A);if(A.version>0&&V.__version!==A.version){q(V,A,y);return}e.bindTexture(i.TEXTURE_2D_ARRAY,V.__webglTexture,i.TEXTURE0+y)}function k(A,y){let V=n.get(A);if(A.version>0&&V.__version!==A.version){q(V,A,y);return}e.bindTexture(i.TEXTURE_3D,V.__webglTexture,i.TEXTURE0+y)}function N(A,y){let V=n.get(A);if(A.version>0&&V.__version!==A.version){et(V,A,y);return}e.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture,i.TEXTURE0+y)}let J={[na]:i.REPEAT,[Zn]:i.CLAMP_TO_EDGE,[ia]:i.MIRRORED_REPEAT},tt={[Ke]:i.NEAREST,[rh]:i.NEAREST_MIPMAP_NEAREST,[cs]:i.NEAREST_MIPMAP_LINEAR,[sn]:i.LINEAR,[gr]:i.LINEAR_MIPMAP_NEAREST,[Jn]:i.LINEAR_MIPMAP_LINEAR},rt={[hh]:i.NEVER,[gh]:i.ALWAYS,[uh]:i.LESS,[tc]:i.LEQUAL,[dh]:i.EQUAL,[mh]:i.GEQUAL,[fh]:i.GREATER,[ph]:i.NOTEQUAL};function Mt(A,y){if(y.type===mn&&t.has("OES_texture_float_linear")===!1&&(y.magFilter===sn||y.magFilter===gr||y.magFilter===cs||y.magFilter===Jn||y.minFilter===sn||y.minFilter===gr||y.minFilter===cs||y.minFilter===Jn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,J[y.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,J[y.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,J[y.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,tt[y.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,tt[y.minFilter]),y.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,rt[y.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Ke||y.minFilter!==cs&&y.minFilter!==Jn||y.type===mn&&t.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let V=t.get("EXT_texture_filter_anisotropic");i.texParameterf(A,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function Rt(A,y){let V=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",C));let K=y.source,Q=p.get(K);Q===void 0&&(Q={},p.set(K,Q));let Y=H(y);if(Y!==A.__cacheKey){Q[Y]===void 0&&(Q[Y]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,V=!0),Q[Y].usedTimes++;let bt=Q[A.__cacheKey];bt!==void 0&&(Q[A.__cacheKey].usedTimes--,bt.usedTimes===0&&E(y)),A.__cacheKey=Y,A.__webglTexture=Q[Y].texture}return V}function q(A,y,V){let K=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(K=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(K=i.TEXTURE_3D);let Q=Rt(A,y),Y=y.source;e.bindTexture(K,A.__webglTexture,i.TEXTURE0+V);let bt=n.get(Y);if(Y.version!==bt.__version||Q===!0){e.activeTexture(i.TEXTURE0+V);let ct=Xt.getPrimaries(Xt.workingColorSpace),ft=y.colorSpace===In?null:Xt.getPrimaries(y.colorSpace),Wt=y.colorSpace===In||ct===ft?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Wt);let nt=x(y.image,!1,s.maxTextureSize);nt=Jt(y,nt);let pt=r.convert(y.format,y.colorSpace),At=r.convert(y.type),Pt=w(y.internalFormat,pt,At,y.colorSpace,y.isVideoTexture);Mt(K,y);let mt,Ht=y.mipmaps,Ot=y.isVideoTexture!==!0,te=bt.__version===void 0||Q===!0,D=Y.dataReady,lt=B(y,nt);if(y.isDepthTexture)Pt=v(y.format===Ii,y.type),te&&(Ot?e.texStorage2D(i.TEXTURE_2D,1,Pt,nt.width,nt.height):e.texImage2D(i.TEXTURE_2D,0,Pt,nt.width,nt.height,0,pt,At,null));else if(y.isDataTexture)if(Ht.length>0){Ot&&te&&e.texStorage2D(i.TEXTURE_2D,lt,Pt,Ht[0].width,Ht[0].height);for(let $=0,j=Ht.length;$<j;$++)mt=Ht[$],Ot?D&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,mt.width,mt.height,pt,At,mt.data):e.texImage2D(i.TEXTURE_2D,$,Pt,mt.width,mt.height,0,pt,At,mt.data);y.generateMipmaps=!1}else Ot?(te&&e.texStorage2D(i.TEXTURE_2D,lt,Pt,nt.width,nt.height),D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,nt.width,nt.height,pt,At,nt.data)):e.texImage2D(i.TEXTURE_2D,0,Pt,nt.width,nt.height,0,pt,At,nt.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ot&&te&&e.texStorage3D(i.TEXTURE_2D_ARRAY,lt,Pt,Ht[0].width,Ht[0].height,nt.depth);for(let $=0,j=Ht.length;$<j;$++)if(mt=Ht[$],y.format!==Ze)if(pt!==null)if(Ot){if(D)if(y.layerUpdates.size>0){let dt=Ul(mt.width,mt.height,y.format,y.type);for(let ht of y.layerUpdates){let Dt=mt.data.subarray(ht*dt/mt.data.BYTES_PER_ELEMENT,(ht+1)*dt/mt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,ht,mt.width,mt.height,1,pt,Dt)}y.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,mt.width,mt.height,nt.depth,pt,mt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,$,Pt,mt.width,mt.height,nt.depth,0,mt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ot?D&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,mt.width,mt.height,nt.depth,pt,At,mt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,$,Pt,mt.width,mt.height,nt.depth,0,pt,At,mt.data)}else{Ot&&te&&e.texStorage2D(i.TEXTURE_2D,lt,Pt,Ht[0].width,Ht[0].height);for(let $=0,j=Ht.length;$<j;$++)mt=Ht[$],y.format!==Ze?pt!==null?Ot?D&&e.compressedTexSubImage2D(i.TEXTURE_2D,$,0,0,mt.width,mt.height,pt,mt.data):e.compressedTexImage2D(i.TEXTURE_2D,$,Pt,mt.width,mt.height,0,mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ot?D&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,mt.width,mt.height,pt,At,mt.data):e.texImage2D(i.TEXTURE_2D,$,Pt,mt.width,mt.height,0,pt,At,mt.data)}else if(y.isDataArrayTexture)if(Ot){if(te&&e.texStorage3D(i.TEXTURE_2D_ARRAY,lt,Pt,nt.width,nt.height,nt.depth),D)if(y.layerUpdates.size>0){let $=Ul(nt.width,nt.height,y.format,y.type);for(let j of y.layerUpdates){let dt=nt.data.subarray(j*$/nt.data.BYTES_PER_ELEMENT,(j+1)*$/nt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,j,nt.width,nt.height,1,pt,At,dt)}y.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,pt,At,nt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Pt,nt.width,nt.height,nt.depth,0,pt,At,nt.data);else if(y.isData3DTexture)Ot?(te&&e.texStorage3D(i.TEXTURE_3D,lt,Pt,nt.width,nt.height,nt.depth),D&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,pt,At,nt.data)):e.texImage3D(i.TEXTURE_3D,0,Pt,nt.width,nt.height,nt.depth,0,pt,At,nt.data);else if(y.isFramebufferTexture){if(te)if(Ot)e.texStorage2D(i.TEXTURE_2D,lt,Pt,nt.width,nt.height);else{let $=nt.width,j=nt.height;for(let dt=0;dt<lt;dt++)e.texImage2D(i.TEXTURE_2D,dt,Pt,$,j,0,pt,At,null),$>>=1,j>>=1}}else if(Ht.length>0){if(Ot&&te){let $=Tt(Ht[0]);e.texStorage2D(i.TEXTURE_2D,lt,Pt,$.width,$.height)}for(let $=0,j=Ht.length;$<j;$++)mt=Ht[$],Ot?D&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,pt,At,mt):e.texImage2D(i.TEXTURE_2D,$,Pt,pt,At,mt);y.generateMipmaps=!1}else if(Ot){if(te){let $=Tt(nt);e.texStorage2D(i.TEXTURE_2D,lt,Pt,$.width,$.height)}D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,pt,At,nt)}else e.texImage2D(i.TEXTURE_2D,0,Pt,pt,At,nt);f(y)&&h(K),bt.__version=Y.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function et(A,y,V){if(y.image.length!==6)return;let K=Rt(A,y),Q=y.source;e.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+V);let Y=n.get(Q);if(Q.version!==Y.__version||K===!0){e.activeTexture(i.TEXTURE0+V);let bt=Xt.getPrimaries(Xt.workingColorSpace),ct=y.colorSpace===In?null:Xt.getPrimaries(y.colorSpace),ft=y.colorSpace===In||bt===ct?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ft);let Wt=y.isCompressedTexture||y.image[0].isCompressedTexture,nt=y.image[0]&&y.image[0].isDataTexture,pt=[];for(let j=0;j<6;j++)!Wt&&!nt?pt[j]=x(y.image[j],!0,s.maxCubemapSize):pt[j]=nt?y.image[j].image:y.image[j],pt[j]=Jt(y,pt[j]);let At=pt[0],Pt=r.convert(y.format,y.colorSpace),mt=r.convert(y.type),Ht=w(y.internalFormat,Pt,mt,y.colorSpace),Ot=y.isVideoTexture!==!0,te=Y.__version===void 0||K===!0,D=Q.dataReady,lt=B(y,At);Mt(i.TEXTURE_CUBE_MAP,y);let $;if(Wt){Ot&&te&&e.texStorage2D(i.TEXTURE_CUBE_MAP,lt,Ht,At.width,At.height);for(let j=0;j<6;j++){$=pt[j].mipmaps;for(let dt=0;dt<$.length;dt++){let ht=$[dt];y.format!==Ze?Pt!==null?Ot?D&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt,0,0,ht.width,ht.height,Pt,ht.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt,Ht,ht.width,ht.height,0,ht.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt,0,0,ht.width,ht.height,Pt,mt,ht.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt,Ht,ht.width,ht.height,0,Pt,mt,ht.data)}}}else{if($=y.mipmaps,Ot&&te){$.length>0&&lt++;let j=Tt(pt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,lt,Ht,j.width,j.height)}for(let j=0;j<6;j++)if(nt){Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,pt[j].width,pt[j].height,Pt,mt,pt[j].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ht,pt[j].width,pt[j].height,0,Pt,mt,pt[j].data);for(let dt=0;dt<$.length;dt++){let Dt=$[dt].image[j].image;Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt+1,0,0,Dt.width,Dt.height,Pt,mt,Dt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt+1,Ht,Dt.width,Dt.height,0,Pt,mt,Dt.data)}}else{Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,Pt,mt,pt[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ht,Pt,mt,pt[j]);for(let dt=0;dt<$.length;dt++){let ht=$[dt];Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt+1,0,0,Pt,mt,ht.image[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,dt+1,Ht,Pt,mt,ht.image[j])}}}f(y)&&h(i.TEXTURE_CUBE_MAP),Y.__version=Q.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function gt(A,y,V,K,Q,Y){let bt=r.convert(V.format,V.colorSpace),ct=r.convert(V.type),ft=w(V.internalFormat,bt,ct,V.colorSpace),Wt=n.get(y),nt=n.get(V);if(nt.__renderTarget=y,!Wt.__hasExternalTextures){let pt=Math.max(1,y.width>>Y),At=Math.max(1,y.height>>Y);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?e.texImage3D(Q,Y,ft,pt,At,y.depth,0,bt,ct,null):e.texImage2D(Q,Y,ft,pt,At,0,bt,ct,null)}e.bindFramebuffer(i.FRAMEBUFFER,A),Vt(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,Q,nt.__webglTexture,0,kt(y)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,K,Q,nt.__webglTexture,Y),e.bindFramebuffer(i.FRAMEBUFFER,null)}function st(A,y,V){if(i.bindRenderbuffer(i.RENDERBUFFER,A),y.depthBuffer){let K=y.depthTexture,Q=K&&K.isDepthTexture?K.type:null,Y=v(y.stencilBuffer,Q),bt=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ct=kt(y);Vt(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ct,Y,y.width,y.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,ct,Y,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,Y,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,bt,i.RENDERBUFFER,A)}else{let K=y.textures;for(let Q=0;Q<K.length;Q++){let Y=K[Q],bt=r.convert(Y.format,Y.colorSpace),ct=r.convert(Y.type),ft=w(Y.internalFormat,bt,ct,Y.colorSpace),Wt=kt(y);V&&Vt(y)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Wt,ft,y.width,y.height):Vt(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Wt,ft,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,ft,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function wt(A,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let K=n.get(y.depthTexture);K.__renderTarget=y,(!K.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),Z(y.depthTexture,0);let Q=K.__webglTexture,Y=kt(y);if(y.depthTexture.format===wi)Vt(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0);else if(y.depthTexture.format===Ii)Vt(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Ct(A){let y=n.get(A),V=A.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==A.depthTexture){let K=A.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),K){let Q=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,K.removeEventListener("dispose",Q)};K.addEventListener("dispose",Q),y.__depthDisposeCallback=Q}y.__boundDepthTexture=K}if(A.depthTexture&&!y.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");wt(y.__webglFramebuffer,A)}else if(V){y.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[K]),y.__webglDepthbuffer[K]===void 0)y.__webglDepthbuffer[K]=i.createRenderbuffer(),st(y.__webglDepthbuffer[K],A,!1);else{let Q=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=y.__webglDepthbuffer[K];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,Y)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),st(y.__webglDepthbuffer,A,!1);else{let K=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Q=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Q),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,Q)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Lt(A,y,V){let K=n.get(A);y!==void 0&&gt(K.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),V!==void 0&&Ct(A)}function Qt(A){let y=A.texture,V=n.get(A),K=n.get(y);A.addEventListener("dispose",T);let Q=A.textures,Y=A.isWebGLCubeRenderTarget===!0,bt=Q.length>1;if(bt||(K.__webglTexture===void 0&&(K.__webglTexture=i.createTexture()),K.__version=y.version,a.memory.textures++),Y){V.__webglFramebuffer=[];for(let ct=0;ct<6;ct++)if(y.mipmaps&&y.mipmaps.length>0){V.__webglFramebuffer[ct]=[];for(let ft=0;ft<y.mipmaps.length;ft++)V.__webglFramebuffer[ct][ft]=i.createFramebuffer()}else V.__webglFramebuffer[ct]=i.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){V.__webglFramebuffer=[];for(let ct=0;ct<y.mipmaps.length;ct++)V.__webglFramebuffer[ct]=i.createFramebuffer()}else V.__webglFramebuffer=i.createFramebuffer();if(bt)for(let ct=0,ft=Q.length;ct<ft;ct++){let Wt=n.get(Q[ct]);Wt.__webglTexture===void 0&&(Wt.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&Vt(A)===!1){V.__webglMultisampledFramebuffer=i.createFramebuffer(),V.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ct=0;ct<Q.length;ct++){let ft=Q[ct];V.__webglColorRenderbuffer[ct]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,V.__webglColorRenderbuffer[ct]);let Wt=r.convert(ft.format,ft.colorSpace),nt=r.convert(ft.type),pt=w(ft.internalFormat,Wt,nt,ft.colorSpace,A.isXRRenderTarget===!0),At=kt(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,At,pt,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,V.__webglColorRenderbuffer[ct])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(V.__webglDepthRenderbuffer=i.createRenderbuffer(),st(V.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Y){e.bindTexture(i.TEXTURE_CUBE_MAP,K.__webglTexture),Mt(i.TEXTURE_CUBE_MAP,y);for(let ct=0;ct<6;ct++)if(y.mipmaps&&y.mipmaps.length>0)for(let ft=0;ft<y.mipmaps.length;ft++)gt(V.__webglFramebuffer[ct][ft],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,ft);else gt(V.__webglFramebuffer[ct],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0);f(y)&&h(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(bt){for(let ct=0,ft=Q.length;ct<ft;ct++){let Wt=Q[ct],nt=n.get(Wt);e.bindTexture(i.TEXTURE_2D,nt.__webglTexture),Mt(i.TEXTURE_2D,Wt),gt(V.__webglFramebuffer,A,Wt,i.COLOR_ATTACHMENT0+ct,i.TEXTURE_2D,0),f(Wt)&&h(i.TEXTURE_2D)}e.unbindTexture()}else{let ct=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ct=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ct,K.__webglTexture),Mt(ct,y),y.mipmaps&&y.mipmaps.length>0)for(let ft=0;ft<y.mipmaps.length;ft++)gt(V.__webglFramebuffer[ft],A,y,i.COLOR_ATTACHMENT0,ct,ft);else gt(V.__webglFramebuffer,A,y,i.COLOR_ATTACHMENT0,ct,0);f(y)&&h(ct),e.unbindTexture()}A.depthBuffer&&Ct(A)}function zt(A){let y=A.textures;for(let V=0,K=y.length;V<K;V++){let Q=y[V];if(f(Q)){let Y=M(A),bt=n.get(Q).__webglTexture;e.bindTexture(Y,bt),h(Y),e.unbindTexture()}}}let re=[],I=[];function xe(A){if(A.samples>0){if(Vt(A)===!1){let y=A.textures,V=A.width,K=A.height,Q=i.COLOR_BUFFER_BIT,Y=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,bt=n.get(A),ct=y.length>1;if(ct)for(let ft=0;ft<y.length;ft++)e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,bt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,bt.__webglFramebuffer);for(let ft=0;ft<y.length;ft++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),ct){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,bt.__webglColorRenderbuffer[ft]);let Wt=n.get(y[ft]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Wt,0)}i.blitFramebuffer(0,0,V,K,0,0,V,K,Q,i.NEAREST),l===!0&&(re.length=0,I.length=0,re.push(i.COLOR_ATTACHMENT0+ft),A.depthBuffer&&A.resolveDepthBuffer===!1&&(re.push(Y),I.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,I)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,re))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ct)for(let ft=0;ft<y.length;ft++){e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,bt.__webglColorRenderbuffer[ft]);let Wt=n.get(y[ft]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,Wt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,bt.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){let y=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function kt(A){return Math.min(s.maxSamples,A.samples)}function Vt(A){let y=n.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Et(A){let y=a.render.frame;u.get(A)!==y&&(u.set(A,y),A.update())}function Jt(A,y){let V=A.colorSpace,K=A.format,Q=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||V!==Ui&&V!==In&&(Xt.getTransfer(V)===Kt?(K!==Ze||Q!==vn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),y}function Tt(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=U,this.resetTextureUnits=X,this.setTexture2D=Z,this.setTexture2DArray=L,this.setTexture3D=k,this.setTextureCube=N,this.rebindTextures=Lt,this.setupRenderTarget=Qt,this.updateRenderTargetMipmap=zt,this.updateMultisampleRenderTarget=xe,this.setupDepthRenderbuffer=Ct,this.setupFrameBufferTexture=gt,this.useMultisampledRTT=Vt}function wm(i,t){function e(n,s=In){let r,a=Xt.getTransfer(s);if(n===vn)return i.UNSIGNED_BYTE;if(n===lo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===co)return i.UNSIGNED_SHORT_5_5_5_1;if(n===$l)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Wl)return i.BYTE;if(n===Xl)return i.SHORT;if(n===ji)return i.UNSIGNED_SHORT;if(n===oo)return i.INT;if(n===Kn)return i.UNSIGNED_INT;if(n===mn)return i.FLOAT;if(n===ss)return i.HALF_FLOAT;if(n===ql)return i.ALPHA;if(n===Yl)return i.RGB;if(n===Ze)return i.RGBA;if(n===Zl)return i.LUMINANCE;if(n===Jl)return i.LUMINANCE_ALPHA;if(n===wi)return i.DEPTH_COMPONENT;if(n===Ii)return i.DEPTH_STENCIL;if(n===Kl)return i.RED;if(n===ho)return i.RED_INTEGER;if(n===jl)return i.RG;if(n===uo)return i.RG_INTEGER;if(n===fo)return i.RGBA_INTEGER;if(n===Ns||n===Os||n===Fs||n===Bs)if(a===Kt)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ns)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Os)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Fs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Bs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ns)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Os)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Fs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Bs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===sa||n===ra||n===aa||n===oa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===sa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ra)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===aa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===oa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===la||n===ca||n===ha)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===la||n===ca)return a===Kt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ha)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ua||n===da||n===fa||n===pa||n===ma||n===ga||n===_a||n===va||n===xa||n===ya||n===Ma||n===ba||n===Sa||n===wa)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ua)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===da)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===fa)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===pa)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ma)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ga)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===_a)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===va)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===xa)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ya)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ma)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ba)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Sa)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===wa)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ks||n===Ea||n===Ta)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===ks)return a===Kt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ea)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ta)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ql||n===Aa||n===Ca||n===Ra)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===ks)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Aa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ca)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ra)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Pi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Xa=class extends Ce{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},bi=class extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}},Em={type:"move"},Ki=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new bi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new bi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new bi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let x of t.hand.values()){let f=e.getJointPose(x,n),h=this._getHandJoint(c,x);f!==null&&(h.matrix.fromArray(f.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=f.radius),h.visible=f!==null}let u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],p=u.position.distanceTo(d.position),g=.02,_=.005;c.inputState.pinching&&p>g+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&p<=g-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Em)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new bi;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Tm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Am=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,$a=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Ve,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new rn({vertexShader:Tm,fragmentShader:Am,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Je(new js(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},qa=class extends xn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,d=null,p=null,g=null,_=null,x=new $a,f=e.getContextAttributes(),h=null,M=null,w=[],v=[],B=new Bt,C=null,T=new Ce;T.viewport=new he;let P=new Ce;P.viewport=new he;let E=[T,P],S=new Xa,R=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let et=w[q];return et===void 0&&(et=new Ki,w[q]=et),et.getTargetRaySpace()},this.getControllerGrip=function(q){let et=w[q];return et===void 0&&(et=new Ki,w[q]=et),et.getGripSpace()},this.getHand=function(q){let et=w[q];return et===void 0&&(et=new Ki,w[q]=et),et.getHandSpace()};function U(q){let et=v.indexOf(q.inputSource);if(et===-1)return;let gt=w[et];gt!==void 0&&(gt.update(q.inputSource,q.frame,c||a),gt.dispatchEvent({type:q.type,data:q.inputSource}))}function H(){s.removeEventListener("select",U),s.removeEventListener("selectstart",U),s.removeEventListener("selectend",U),s.removeEventListener("squeeze",U),s.removeEventListener("squeezestart",U),s.removeEventListener("squeezeend",U),s.removeEventListener("end",H),s.removeEventListener("inputsourceschange",Z);for(let q=0;q<w.length;q++){let et=v[q];et!==null&&(v[q]=null,w[q].disconnect(et))}R=null,X=null,x.reset(),t.setRenderTarget(h),g=null,p=null,d=null,s=null,M=null,Rt.stop(),n.isPresenting=!1,t.setPixelRatio(C),t.setSize(B.width,B.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return p!==null?p:g},this.getBinding=function(){return d},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(h=t.getRenderTarget(),s.addEventListener("select",U),s.addEventListener("selectstart",U),s.addEventListener("selectend",U),s.addEventListener("squeeze",U),s.addEventListener("squeezestart",U),s.addEventListener("squeezeend",U),s.addEventListener("end",H),s.addEventListener("inputsourceschange",Z),f.xrCompatible!==!0&&await e.makeXRCompatible(),C=t.getPixelRatio(),t.getSize(B),s.renderState.layers===void 0){let et={antialias:f.antialias,alpha:!0,depth:f.depth,stencil:f.stencil,framebufferScaleFactor:r};g=new XRWebGLLayer(s,e,et),s.updateRenderState({baseLayer:g}),t.setPixelRatio(1),t.setSize(g.framebufferWidth,g.framebufferHeight,!1),M=new yn(g.framebufferWidth,g.framebufferHeight,{format:Ze,type:vn,colorSpace:t.outputColorSpace,stencilBuffer:f.stencil})}else{let et=null,gt=null,st=null;f.depth&&(st=f.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,et=f.stencil?Ii:wi,gt=f.stencil?Pi:Kn);let wt={colorFormat:e.RGBA8,depthFormat:st,scaleFactor:r};d=new XRWebGLBinding(s,e),p=d.createProjectionLayer(wt),s.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),M=new yn(p.textureWidth,p.textureHeight,{format:Ze,type:vn,depthTexture:new tr(p.textureWidth,p.textureHeight,gt,void 0,void 0,void 0,void 0,void 0,void 0,et),stencilBuffer:f.stencil,colorSpace:t.outputColorSpace,samples:f.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Rt.setContext(s),Rt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function Z(q){for(let et=0;et<q.removed.length;et++){let gt=q.removed[et],st=v.indexOf(gt);st>=0&&(v[st]=null,w[st].disconnect(gt))}for(let et=0;et<q.added.length;et++){let gt=q.added[et],st=v.indexOf(gt);if(st===-1){for(let Ct=0;Ct<w.length;Ct++)if(Ct>=v.length){v.push(gt),st=Ct;break}else if(v[Ct]===null){v[Ct]=gt,st=Ct;break}if(st===-1)break}let wt=w[st];wt&&wt.connect(gt)}}let L=new z,k=new z;function N(q,et,gt){L.setFromMatrixPosition(et.matrixWorld),k.setFromMatrixPosition(gt.matrixWorld);let st=L.distanceTo(k),wt=et.projectionMatrix.elements,Ct=gt.projectionMatrix.elements,Lt=wt[14]/(wt[10]-1),Qt=wt[14]/(wt[10]+1),zt=(wt[9]+1)/wt[5],re=(wt[9]-1)/wt[5],I=(wt[8]-1)/wt[0],xe=(Ct[8]+1)/Ct[0],kt=Lt*I,Vt=Lt*xe,Et=st/(-I+xe),Jt=Et*-I;if(et.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Jt),q.translateZ(Et),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),wt[10]===-1)q.projectionMatrix.copy(et.projectionMatrix),q.projectionMatrixInverse.copy(et.projectionMatrixInverse);else{let Tt=Lt+Et,A=Qt+Et,y=kt-Jt,V=Vt+(st-Jt),K=zt*Qt/A*Tt,Q=re*Qt/A*Tt;q.projectionMatrix.makePerspective(y,V,K,Q,Tt,A),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function J(q,et){et===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(et.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let et=q.near,gt=q.far;x.texture!==null&&(x.depthNear>0&&(et=x.depthNear),x.depthFar>0&&(gt=x.depthFar)),S.near=P.near=T.near=et,S.far=P.far=T.far=gt,(R!==S.near||X!==S.far)&&(s.updateRenderState({depthNear:S.near,depthFar:S.far}),R=S.near,X=S.far),T.layers.mask=q.layers.mask|2,P.layers.mask=q.layers.mask|4,S.layers.mask=T.layers.mask|P.layers.mask;let st=q.parent,wt=S.cameras;J(S,st);for(let Ct=0;Ct<wt.length;Ct++)J(wt[Ct],st);wt.length===2?N(S,T,P):S.projectionMatrix.copy(T.projectionMatrix),tt(q,S,st)};function tt(q,et,gt){gt===null?q.matrix.copy(et.matrixWorld):(q.matrix.copy(gt.matrixWorld),q.matrix.invert(),q.matrix.multiply(et.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(et.projectionMatrix),q.projectionMatrixInverse.copy(et.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Qi*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(p===null&&g===null))return l},this.setFoveation=function(q){l=q,p!==null&&(p.fixedFoveation=q),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=q)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(S)};let rt=null;function Mt(q,et){if(u=et.getViewerPose(c||a),_=et,u!==null){let gt=u.views;g!==null&&(t.setRenderTargetFramebuffer(M,g.framebuffer),t.setRenderTarget(M));let st=!1;gt.length!==S.cameras.length&&(S.cameras.length=0,st=!0);for(let Ct=0;Ct<gt.length;Ct++){let Lt=gt[Ct],Qt=null;if(g!==null)Qt=g.getViewport(Lt);else{let re=d.getViewSubImage(p,Lt);Qt=re.viewport,Ct===0&&(t.setRenderTargetTextures(M,re.colorTexture,p.ignoreDepthValues?void 0:re.depthStencilTexture),t.setRenderTarget(M))}let zt=E[Ct];zt===void 0&&(zt=new Ce,zt.layers.enable(Ct),zt.viewport=new he,E[Ct]=zt),zt.matrix.fromArray(Lt.transform.matrix),zt.matrix.decompose(zt.position,zt.quaternion,zt.scale),zt.projectionMatrix.fromArray(Lt.projectionMatrix),zt.projectionMatrixInverse.copy(zt.projectionMatrix).invert(),zt.viewport.set(Qt.x,Qt.y,Qt.width,Qt.height),Ct===0&&(S.matrix.copy(zt.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),st===!0&&S.cameras.push(zt)}let wt=s.enabledFeatures;if(wt&&wt.includes("depth-sensing")){let Ct=d.getDepthInformation(gt[0]);Ct&&Ct.isValid&&Ct.texture&&x.init(t,Ct,s.renderState)}}for(let gt=0;gt<w.length;gt++){let st=v[gt],wt=w[gt];st!==null&&wt!==void 0&&wt.update(st,et,c||a)}rt&&rt(q,et),et.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:et}),_=null}let Rt=new rc;Rt.setAnimationLoop(Mt),this.setAnimationLoop=function(q){rt=q},this.dispose=function(){}}},Wn=new bn,Cm=new ue;function Rm(i,t){function e(f,h){f.matrixAutoUpdate===!0&&f.updateMatrix(),h.value.copy(f.matrix)}function n(f,h){h.color.getRGB(f.fogColor.value,sc(i)),h.isFog?(f.fogNear.value=h.near,f.fogFar.value=h.far):h.isFogExp2&&(f.fogDensity.value=h.density)}function s(f,h,M,w,v){h.isMeshBasicMaterial||h.isMeshLambertMaterial?r(f,h):h.isMeshToonMaterial?(r(f,h),d(f,h)):h.isMeshPhongMaterial?(r(f,h),u(f,h)):h.isMeshStandardMaterial?(r(f,h),p(f,h),h.isMeshPhysicalMaterial&&g(f,h,v)):h.isMeshMatcapMaterial?(r(f,h),_(f,h)):h.isMeshDepthMaterial?r(f,h):h.isMeshDistanceMaterial?(r(f,h),x(f,h)):h.isMeshNormalMaterial?r(f,h):h.isLineBasicMaterial?(a(f,h),h.isLineDashedMaterial&&o(f,h)):h.isPointsMaterial?l(f,h,M,w):h.isSpriteMaterial?c(f,h):h.isShadowMaterial?(f.color.value.copy(h.color),f.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function r(f,h){f.opacity.value=h.opacity,h.color&&f.diffuse.value.copy(h.color),h.emissive&&f.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(f.map.value=h.map,e(h.map,f.mapTransform)),h.alphaMap&&(f.alphaMap.value=h.alphaMap,e(h.alphaMap,f.alphaMapTransform)),h.bumpMap&&(f.bumpMap.value=h.bumpMap,e(h.bumpMap,f.bumpMapTransform),f.bumpScale.value=h.bumpScale,h.side===Ie&&(f.bumpScale.value*=-1)),h.normalMap&&(f.normalMap.value=h.normalMap,e(h.normalMap,f.normalMapTransform),f.normalScale.value.copy(h.normalScale),h.side===Ie&&f.normalScale.value.negate()),h.displacementMap&&(f.displacementMap.value=h.displacementMap,e(h.displacementMap,f.displacementMapTransform),f.displacementScale.value=h.displacementScale,f.displacementBias.value=h.displacementBias),h.emissiveMap&&(f.emissiveMap.value=h.emissiveMap,e(h.emissiveMap,f.emissiveMapTransform)),h.specularMap&&(f.specularMap.value=h.specularMap,e(h.specularMap,f.specularMapTransform)),h.alphaTest>0&&(f.alphaTest.value=h.alphaTest);let M=t.get(h),w=M.envMap,v=M.envMapRotation;w&&(f.envMap.value=w,Wn.copy(v),Wn.x*=-1,Wn.y*=-1,Wn.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Wn.y*=-1,Wn.z*=-1),f.envMapRotation.value.setFromMatrix4(Cm.makeRotationFromEuler(Wn)),f.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=h.reflectivity,f.ior.value=h.ior,f.refractionRatio.value=h.refractionRatio),h.lightMap&&(f.lightMap.value=h.lightMap,f.lightMapIntensity.value=h.lightMapIntensity,e(h.lightMap,f.lightMapTransform)),h.aoMap&&(f.aoMap.value=h.aoMap,f.aoMapIntensity.value=h.aoMapIntensity,e(h.aoMap,f.aoMapTransform))}function a(f,h){f.diffuse.value.copy(h.color),f.opacity.value=h.opacity,h.map&&(f.map.value=h.map,e(h.map,f.mapTransform))}function o(f,h){f.dashSize.value=h.dashSize,f.totalSize.value=h.dashSize+h.gapSize,f.scale.value=h.scale}function l(f,h,M,w){f.diffuse.value.copy(h.color),f.opacity.value=h.opacity,f.size.value=h.size*M,f.scale.value=w*.5,h.map&&(f.map.value=h.map,e(h.map,f.uvTransform)),h.alphaMap&&(f.alphaMap.value=h.alphaMap,e(h.alphaMap,f.alphaMapTransform)),h.alphaTest>0&&(f.alphaTest.value=h.alphaTest)}function c(f,h){f.diffuse.value.copy(h.color),f.opacity.value=h.opacity,f.rotation.value=h.rotation,h.map&&(f.map.value=h.map,e(h.map,f.mapTransform)),h.alphaMap&&(f.alphaMap.value=h.alphaMap,e(h.alphaMap,f.alphaMapTransform)),h.alphaTest>0&&(f.alphaTest.value=h.alphaTest)}function u(f,h){f.specular.value.copy(h.specular),f.shininess.value=Math.max(h.shininess,1e-4)}function d(f,h){h.gradientMap&&(f.gradientMap.value=h.gradientMap)}function p(f,h){f.metalness.value=h.metalness,h.metalnessMap&&(f.metalnessMap.value=h.metalnessMap,e(h.metalnessMap,f.metalnessMapTransform)),f.roughness.value=h.roughness,h.roughnessMap&&(f.roughnessMap.value=h.roughnessMap,e(h.roughnessMap,f.roughnessMapTransform)),h.envMap&&(f.envMapIntensity.value=h.envMapIntensity)}function g(f,h,M){f.ior.value=h.ior,h.sheen>0&&(f.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),f.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(f.sheenColorMap.value=h.sheenColorMap,e(h.sheenColorMap,f.sheenColorMapTransform)),h.sheenRoughnessMap&&(f.sheenRoughnessMap.value=h.sheenRoughnessMap,e(h.sheenRoughnessMap,f.sheenRoughnessMapTransform))),h.clearcoat>0&&(f.clearcoat.value=h.clearcoat,f.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(f.clearcoatMap.value=h.clearcoatMap,e(h.clearcoatMap,f.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,e(h.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(f.clearcoatNormalMap.value=h.clearcoatNormalMap,e(h.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Ie&&f.clearcoatNormalScale.value.negate())),h.dispersion>0&&(f.dispersion.value=h.dispersion),h.iridescence>0&&(f.iridescence.value=h.iridescence,f.iridescenceIOR.value=h.iridescenceIOR,f.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(f.iridescenceMap.value=h.iridescenceMap,e(h.iridescenceMap,f.iridescenceMapTransform)),h.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=h.iridescenceThicknessMap,e(h.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),h.transmission>0&&(f.transmission.value=h.transmission,f.transmissionSamplerMap.value=M.texture,f.transmissionSamplerSize.value.set(M.width,M.height),h.transmissionMap&&(f.transmissionMap.value=h.transmissionMap,e(h.transmissionMap,f.transmissionMapTransform)),f.thickness.value=h.thickness,h.thicknessMap&&(f.thicknessMap.value=h.thicknessMap,e(h.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=h.attenuationDistance,f.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(f.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(f.anisotropyMap.value=h.anisotropyMap,e(h.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=h.specularIntensity,f.specularColor.value.copy(h.specularColor),h.specularColorMap&&(f.specularColorMap.value=h.specularColorMap,e(h.specularColorMap,f.specularColorMapTransform)),h.specularIntensityMap&&(f.specularIntensityMap.value=h.specularIntensityMap,e(h.specularIntensityMap,f.specularIntensityMapTransform))}function _(f,h){h.matcap&&(f.matcap.value=h.matcap)}function x(f,h){let M=t.get(h).light;f.referencePosition.value.setFromMatrixPosition(M.matrixWorld),f.nearDistance.value=M.shadow.camera.near,f.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Pm(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,w){let v=w.program;n.uniformBlockBinding(M,v)}function c(M,w){let v=s[M.id];v===void 0&&(_(M),v=u(M),s[M.id]=v,M.addEventListener("dispose",f));let B=w.program;n.updateUBOMapping(M,B);let C=t.render.frame;r[M.id]!==C&&(p(M),r[M.id]=C)}function u(M){let w=d();M.__bindingPointIndex=w;let v=i.createBuffer(),B=M.__size,C=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,B,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,v),v}function d(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(M){let w=s[M.id],v=M.uniforms,B=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let C=0,T=v.length;C<T;C++){let P=Array.isArray(v[C])?v[C]:[v[C]];for(let E=0,S=P.length;E<S;E++){let R=P[E];if(g(R,C,E,B)===!0){let X=R.__offset,U=Array.isArray(R.value)?R.value:[R.value],H=0;for(let Z=0;Z<U.length;Z++){let L=U[Z],k=x(L);typeof L=="number"||typeof L=="boolean"?(R.__data[0]=L,i.bufferSubData(i.UNIFORM_BUFFER,X+H,R.__data)):L.isMatrix3?(R.__data[0]=L.elements[0],R.__data[1]=L.elements[1],R.__data[2]=L.elements[2],R.__data[3]=0,R.__data[4]=L.elements[3],R.__data[5]=L.elements[4],R.__data[6]=L.elements[5],R.__data[7]=0,R.__data[8]=L.elements[6],R.__data[9]=L.elements[7],R.__data[10]=L.elements[8],R.__data[11]=0):(L.toArray(R.__data,H),H+=k.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,X,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function g(M,w,v,B){let C=M.value,T=w+"_"+v;if(B[T]===void 0)return typeof C=="number"||typeof C=="boolean"?B[T]=C:B[T]=C.clone(),!0;{let P=B[T];if(typeof C=="number"||typeof C=="boolean"){if(P!==C)return B[T]=C,!0}else if(P.equals(C)===!1)return P.copy(C),!0}return!1}function _(M){let w=M.uniforms,v=0,B=16;for(let T=0,P=w.length;T<P;T++){let E=Array.isArray(w[T])?w[T]:[w[T]];for(let S=0,R=E.length;S<R;S++){let X=E[S],U=Array.isArray(X.value)?X.value:[X.value];for(let H=0,Z=U.length;H<Z;H++){let L=U[H],k=x(L),N=v%B,J=N%k.boundary,tt=N+J;v+=J,tt!==0&&B-tt<k.storage&&(v+=B-tt),X.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),X.__offset=v,v+=k.storage}}}let C=v%B;return C>0&&(v+=B-C),M.__size=v,M.__cache={},this}function x(M){let w={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(w.boundary=4,w.storage=4):M.isVector2?(w.boundary=8,w.storage=8):M.isVector3||M.isColor?(w.boundary=16,w.storage=12):M.isVector4?(w.boundary=16,w.storage=16):M.isMatrix3?(w.boundary=48,w.storage=48):M.isMatrix4?(w.boundary=64,w.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),w}function f(M){let w=M.target;w.removeEventListener("dispose",f);let v=a.indexOf(w.__bindingPointIndex);a.splice(v,1),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function h(){for(let M in s)i.deleteBuffer(s[M]);a=[],s={},r={}}return{bind:l,update:c,dispose:h}}var er=class{constructor(t={}){let{canvas:e=Dh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:p=!1}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;let _=new Uint32Array(4),x=new Int32Array(4),f=null,h=null,M=[],w=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ze,this.toneMapping=Dn,this.toneMappingExposure=1;let v=this,B=!1,C=0,T=0,P=null,E=-1,S=null,R=new he,X=new he,U=null,H=new Gt(0),Z=0,L=e.width,k=e.height,N=1,J=null,tt=null,rt=new he(0,0,L,k),Mt=new he(0,0,L,k),Rt=!1,q=new Ks,et=!1,gt=!1,st=new ue,wt=new ue,Ct=new z,Lt=new he,Qt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},zt=!1;function re(){return P===null?N:1}let I=n;function xe(b,O){return e.getContext(b,O)}try{let b={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${ao}`),e.addEventListener("webglcontextlost",j,!1),e.addEventListener("webglcontextrestored",dt,!1),e.addEventListener("webglcontextcreationerror",ht,!1),I===null){let O="webgl2";if(I=xe(O,b),I===null)throw xe(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let kt,Vt,Et,Jt,Tt,A,y,V,K,Q,Y,bt,ct,ft,Wt,nt,pt,At,Pt,mt,Ht,Ot,te,D;function lt(){kt=new $f(I),kt.init(),Ot=new wm(I,kt),Vt=new zf(I,kt,t,Ot),Et=new Mm(I,kt),Vt.reverseDepthBuffer&&p&&Et.buffers.depth.setReversed(!0),Jt=new Zf(I),Tt=new lm,A=new Sm(I,kt,Et,Tt,Vt,Ot,Jt),y=new Hf(v),V=new Xf(v),K=new eu(I),te=new Bf(I,K),Q=new qf(I,K,Jt,te),Y=new Kf(I,Q,K,Jt),Pt=new Jf(I,Vt,A),nt=new Vf(Tt),bt=new om(v,y,V,kt,Vt,te,nt),ct=new Rm(v,Tt),ft=new hm,Wt=new gm(kt),At=new Ff(v,y,V,Et,Y,g,l),pt=new xm(v,Y,Vt),D=new Pm(I,Jt,Vt,Et),mt=new kf(I,kt,Jt),Ht=new Yf(I,kt,Jt),Jt.programs=bt.programs,v.capabilities=Vt,v.extensions=kt,v.properties=Tt,v.renderLists=ft,v.shadowMap=pt,v.state=Et,v.info=Jt}lt();let $=new qa(v,I);this.xr=$,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let b=kt.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=kt.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return N},this.setPixelRatio=function(b){b!==void 0&&(N=b,this.setSize(L,k,!1))},this.getSize=function(b){return b.set(L,k)},this.setSize=function(b,O,G=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}L=b,k=O,e.width=Math.floor(b*N),e.height=Math.floor(O*N),G===!0&&(e.style.width=b+"px",e.style.height=O+"px"),this.setViewport(0,0,b,O)},this.getDrawingBufferSize=function(b){return b.set(L*N,k*N).floor()},this.setDrawingBufferSize=function(b,O,G){L=b,k=O,N=G,e.width=Math.floor(b*G),e.height=Math.floor(O*G),this.setViewport(0,0,b,O)},this.getCurrentViewport=function(b){return b.copy(R)},this.getViewport=function(b){return b.copy(rt)},this.setViewport=function(b,O,G,W){b.isVector4?rt.set(b.x,b.y,b.z,b.w):rt.set(b,O,G,W),Et.viewport(R.copy(rt).multiplyScalar(N).round())},this.getScissor=function(b){return b.copy(Mt)},this.setScissor=function(b,O,G,W){b.isVector4?Mt.set(b.x,b.y,b.z,b.w):Mt.set(b,O,G,W),Et.scissor(X.copy(Mt).multiplyScalar(N).round())},this.getScissorTest=function(){return Rt},this.setScissorTest=function(b){Et.setScissorTest(Rt=b)},this.setOpaqueSort=function(b){J=b},this.setTransparentSort=function(b){tt=b},this.getClearColor=function(b){return b.copy(At.getClearColor())},this.setClearColor=function(){At.setClearColor.apply(At,arguments)},this.getClearAlpha=function(){return At.getClearAlpha()},this.setClearAlpha=function(){At.setClearAlpha.apply(At,arguments)},this.clear=function(b=!0,O=!0,G=!0){let W=0;if(b){let F=!1;if(P!==null){let it=P.texture.format;F=it===fo||it===uo||it===ho}if(F){let it=P.texture.type,ut=it===vn||it===Kn||it===ji||it===Pi||it===lo||it===co,_t=At.getClearColor(),vt=At.getClearAlpha(),It=_t.r,Ut=_t.g,xt=_t.b;ut?(_[0]=It,_[1]=Ut,_[2]=xt,_[3]=vt,I.clearBufferuiv(I.COLOR,0,_)):(x[0]=It,x[1]=Ut,x[2]=xt,x[3]=vt,I.clearBufferiv(I.COLOR,0,x))}else W|=I.COLOR_BUFFER_BIT}O&&(W|=I.DEPTH_BUFFER_BIT),G&&(W|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",j,!1),e.removeEventListener("webglcontextrestored",dt,!1),e.removeEventListener("webglcontextcreationerror",ht,!1),ft.dispose(),Wt.dispose(),Tt.dispose(),y.dispose(),V.dispose(),Y.dispose(),te.dispose(),D.dispose(),bt.dispose(),$.dispose(),$.removeEventListener("sessionstart",wo),$.removeEventListener("sessionend",Eo),Bn.stop()};function j(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),B=!0}function dt(){console.log("THREE.WebGLRenderer: Context Restored."),B=!1;let b=Jt.autoReset,O=pt.enabled,G=pt.autoUpdate,W=pt.needsUpdate,F=pt.type;lt(),Jt.autoReset=b,pt.enabled=O,pt.autoUpdate=G,pt.needsUpdate=W,pt.type=F}function ht(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Dt(b){let O=b.target;O.removeEventListener("dispose",Dt),oe(O)}function oe(b){Me(b),Tt.remove(b)}function Me(b){let O=Tt.get(b).programs;O!==void 0&&(O.forEach(function(G){bt.releaseProgram(G)}),b.isShaderMaterial&&bt.releaseShaderCache(b))}this.renderBufferDirect=function(b,O,G,W,F,it){O===null&&(O=Qt);let ut=F.isMesh&&F.matrixWorld.determinant()<0,_t=Sc(b,O,G,W,F);Et.setMaterial(W,ut);let vt=G.index,It=1;if(W.wireframe===!0){if(vt=Q.getWireframeAttribute(G),vt===void 0)return;It=2}let Ut=G.drawRange,xt=G.attributes.position,$t=Ut.start*It,ee=(Ut.start+Ut.count)*It;it!==null&&($t=Math.max($t,it.start*It),ee=Math.min(ee,(it.start+it.count)*It)),vt!==null?($t=Math.max($t,0),ee=Math.min(ee,vt.count)):xt!=null&&($t=Math.max($t,0),ee=Math.min(ee,xt.count));let ne=ee-$t;if(ne<0||ne===1/0)return;te.setup(F,W,_t,G,vt);let Pe,qt=mt;if(vt!==null&&(Pe=K.get(vt),qt=Ht,qt.setIndex(Pe)),F.isMesh)W.wireframe===!0?(Et.setLineWidth(W.wireframeLinewidth*re()),qt.setMode(I.LINES)):qt.setMode(I.TRIANGLES);else if(F.isLine){let St=W.linewidth;St===void 0&&(St=1),Et.setLineWidth(St*re()),F.isLineSegments?qt.setMode(I.LINES):F.isLineLoop?qt.setMode(I.LINE_LOOP):qt.setMode(I.LINE_STRIP)}else F.isPoints?qt.setMode(I.POINTS):F.isSprite&&qt.setMode(I.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)qt.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(kt.get("WEBGL_multi_draw"))qt.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{let St=F._multiDrawStarts,on=F._multiDrawCounts,Yt=F._multiDrawCount,We=vt?K.get(vt).bytesPerElement:1,ri=Tt.get(W).currentProgram.getUniforms();for(let De=0;De<Yt;De++)ri.setValue(I,"_gl_DrawID",De),qt.render(St[De]/We,on[De])}else if(F.isInstancedMesh)qt.renderInstances($t,ne,F.count);else if(G.isInstancedBufferGeometry){let St=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,on=Math.min(G.instanceCount,St);qt.renderInstances($t,ne,on)}else qt.render($t,ne)};function Zt(b,O,G){b.transparent===!0&&b.side===pn&&b.forceSinglePass===!1?(b.side=Ie,b.needsUpdate=!0,ls(b,O,G),b.side=Un,b.needsUpdate=!0,ls(b,O,G),b.side=pn):ls(b,O,G)}this.compile=function(b,O,G=null){G===null&&(G=b),h=Wt.get(G),h.init(O),w.push(h),G.traverseVisible(function(F){F.isLight&&F.layers.test(O.layers)&&(h.pushLight(F),F.castShadow&&h.pushShadow(F))}),b!==G&&b.traverseVisible(function(F){F.isLight&&F.layers.test(O.layers)&&(h.pushLight(F),F.castShadow&&h.pushShadow(F))}),h.setupLights();let W=new Set;return b.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let it=F.material;if(it)if(Array.isArray(it))for(let ut=0;ut<it.length;ut++){let _t=it[ut];Zt(_t,G,F),W.add(_t)}else Zt(it,G,F),W.add(it)}),w.pop(),h=null,W},this.compileAsync=function(b,O,G=null){let W=this.compile(b,O,G);return new Promise(F=>{function it(){if(W.forEach(function(ut){Tt.get(ut).currentProgram.isReady()&&W.delete(ut)}),W.size===0){F(b);return}setTimeout(it,10)}kt.get("KHR_parallel_shader_compile")!==null?it():setTimeout(it,10)})};let Ge=null;function an(b){Ge&&Ge(b)}function wo(){Bn.stop()}function Eo(){Bn.start()}let Bn=new rc;Bn.setAnimationLoop(an),typeof self<"u"&&Bn.setContext(self),this.setAnimationLoop=function(b){Ge=b,$.setAnimationLoop(b),b===null?Bn.stop():Bn.start()},$.addEventListener("sessionstart",wo),$.addEventListener("sessionend",Eo),this.render=function(b,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(B===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(O),O=$.getCamera()),b.isScene===!0&&b.onBeforeRender(v,b,O,P),h=Wt.get(b,w.length),h.init(O),w.push(h),wt.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),q.setFromProjectionMatrix(wt),gt=this.localClippingEnabled,et=nt.init(this.clippingPlanes,gt),f=ft.get(b,M.length),f.init(),M.push(f),$.enabled===!0&&$.isPresenting===!0){let it=v.xr.getDepthSensingMesh();it!==null&&mr(it,O,-1/0,v.sortObjects)}mr(b,O,0,v.sortObjects),f.finish(),v.sortObjects===!0&&f.sort(J,tt),zt=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,zt&&At.addToRenderList(f,b),this.info.render.frame++,et===!0&&nt.beginShadows();let G=h.state.shadowsArray;pt.render(G,b,O),et===!0&&nt.endShadows(),this.info.autoReset===!0&&this.info.reset();let W=f.opaque,F=f.transmissive;if(h.setupLights(),O.isArrayCamera){let it=O.cameras;if(F.length>0)for(let ut=0,_t=it.length;ut<_t;ut++){let vt=it[ut];Ao(W,F,b,vt)}zt&&At.render(b);for(let ut=0,_t=it.length;ut<_t;ut++){let vt=it[ut];To(f,b,vt,vt.viewport)}}else F.length>0&&Ao(W,F,b,O),zt&&At.render(b),To(f,b,O);P!==null&&(A.updateMultisampleRenderTarget(P),A.updateRenderTargetMipmap(P)),b.isScene===!0&&b.onAfterRender(v,b,O),te.resetDefaultState(),E=-1,S=null,w.pop(),w.length>0?(h=w[w.length-1],et===!0&&nt.setGlobalState(v.clippingPlanes,h.state.camera)):h=null,M.pop(),M.length>0?f=M[M.length-1]:f=null};function mr(b,O,G,W){if(b.visible===!1)return;if(b.layers.test(O.layers)){if(b.isGroup)G=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(O);else if(b.isLight)h.pushLight(b),b.castShadow&&h.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||q.intersectsSprite(b)){W&&Lt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(wt);let ut=Y.update(b),_t=b.material;_t.visible&&f.push(b,ut,_t,G,Lt.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||q.intersectsObject(b))){let ut=Y.update(b),_t=b.material;if(W&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Lt.copy(b.boundingSphere.center)):(ut.boundingSphere===null&&ut.computeBoundingSphere(),Lt.copy(ut.boundingSphere.center)),Lt.applyMatrix4(b.matrixWorld).applyMatrix4(wt)),Array.isArray(_t)){let vt=ut.groups;for(let It=0,Ut=vt.length;It<Ut;It++){let xt=vt[It],$t=_t[xt.materialIndex];$t&&$t.visible&&f.push(b,ut,$t,G,Lt.z,xt)}}else _t.visible&&f.push(b,ut,_t,G,Lt.z,null)}}let it=b.children;for(let ut=0,_t=it.length;ut<_t;ut++)mr(it[ut],O,G,W)}function To(b,O,G,W){let F=b.opaque,it=b.transmissive,ut=b.transparent;h.setupLightsView(G),et===!0&&nt.setGlobalState(v.clippingPlanes,G),W&&Et.viewport(R.copy(W)),F.length>0&&os(F,O,G),it.length>0&&os(it,O,G),ut.length>0&&os(ut,O,G),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function Ao(b,O,G,W){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;h.state.transmissionRenderTarget[W.id]===void 0&&(h.state.transmissionRenderTarget[W.id]=new yn(1,1,{generateMipmaps:!0,type:kt.has("EXT_color_buffer_half_float")||kt.has("EXT_color_buffer_float")?ss:vn,minFilter:Jn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Xt.workingColorSpace}));let it=h.state.transmissionRenderTarget[W.id],ut=W.viewport||R;it.setSize(ut.z,ut.w);let _t=v.getRenderTarget();v.setRenderTarget(it),v.getClearColor(H),Z=v.getClearAlpha(),Z<1&&v.setClearColor(16777215,.5),v.clear(),zt&&At.render(G);let vt=v.toneMapping;v.toneMapping=Dn;let It=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),h.setupLightsView(W),et===!0&&nt.setGlobalState(v.clippingPlanes,W),os(b,G,W),A.updateMultisampleRenderTarget(it),A.updateRenderTargetMipmap(it),kt.has("WEBGL_multisampled_render_to_texture")===!1){let Ut=!1;for(let xt=0,$t=O.length;xt<$t;xt++){let ee=O[xt],ne=ee.object,Pe=ee.geometry,qt=ee.material,St=ee.group;if(qt.side===pn&&ne.layers.test(W.layers)){let on=qt.side;qt.side=Ie,qt.needsUpdate=!0,Co(ne,G,W,Pe,qt,St),qt.side=on,qt.needsUpdate=!0,Ut=!0}}Ut===!0&&(A.updateMultisampleRenderTarget(it),A.updateRenderTargetMipmap(it))}v.setRenderTarget(_t),v.setClearColor(H,Z),It!==void 0&&(W.viewport=It),v.toneMapping=vt}function os(b,O,G){let W=O.isScene===!0?O.overrideMaterial:null;for(let F=0,it=b.length;F<it;F++){let ut=b[F],_t=ut.object,vt=ut.geometry,It=W===null?ut.material:W,Ut=ut.group;_t.layers.test(G.layers)&&Co(_t,O,G,vt,It,Ut)}}function Co(b,O,G,W,F,it){b.onBeforeRender(v,O,G,W,F,it),b.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),F.onBeforeRender(v,O,G,W,b,it),F.transparent===!0&&F.side===pn&&F.forceSinglePass===!1?(F.side=Ie,F.needsUpdate=!0,v.renderBufferDirect(G,O,W,F,b,it),F.side=Un,F.needsUpdate=!0,v.renderBufferDirect(G,O,W,F,b,it),F.side=pn):v.renderBufferDirect(G,O,W,F,b,it),b.onAfterRender(v,O,G,W,F,it)}function ls(b,O,G){O.isScene!==!0&&(O=Qt);let W=Tt.get(b),F=h.state.lights,it=h.state.shadowsArray,ut=F.state.version,_t=bt.getParameters(b,F.state,it,O,G),vt=bt.getProgramCacheKey(_t),It=W.programs;W.environment=b.isMeshStandardMaterial?O.environment:null,W.fog=O.fog,W.envMap=(b.isMeshStandardMaterial?V:y).get(b.envMap||W.environment),W.envMapRotation=W.environment!==null&&b.envMap===null?O.environmentRotation:b.envMapRotation,It===void 0&&(b.addEventListener("dispose",Dt),It=new Map,W.programs=It);let Ut=It.get(vt);if(Ut!==void 0){if(W.currentProgram===Ut&&W.lightsStateVersion===ut)return Po(b,_t),Ut}else _t.uniforms=bt.getUniforms(b),b.onBeforeCompile(_t,v),Ut=bt.acquireProgram(_t,vt),It.set(vt,Ut),W.uniforms=_t.uniforms;let xt=W.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(xt.clippingPlanes=nt.uniform),Po(b,_t),W.needsLights=Ec(b),W.lightsStateVersion=ut,W.needsLights&&(xt.ambientLightColor.value=F.state.ambient,xt.lightProbe.value=F.state.probe,xt.directionalLights.value=F.state.directional,xt.directionalLightShadows.value=F.state.directionalShadow,xt.spotLights.value=F.state.spot,xt.spotLightShadows.value=F.state.spotShadow,xt.rectAreaLights.value=F.state.rectArea,xt.ltc_1.value=F.state.rectAreaLTC1,xt.ltc_2.value=F.state.rectAreaLTC2,xt.pointLights.value=F.state.point,xt.pointLightShadows.value=F.state.pointShadow,xt.hemisphereLights.value=F.state.hemi,xt.directionalShadowMap.value=F.state.directionalShadowMap,xt.directionalShadowMatrix.value=F.state.directionalShadowMatrix,xt.spotShadowMap.value=F.state.spotShadowMap,xt.spotLightMatrix.value=F.state.spotLightMatrix,xt.spotLightMap.value=F.state.spotLightMap,xt.pointShadowMap.value=F.state.pointShadowMap,xt.pointShadowMatrix.value=F.state.pointShadowMatrix),W.currentProgram=Ut,W.uniformsList=null,Ut}function Ro(b){if(b.uniformsList===null){let O=b.currentProgram.getUniforms();b.uniformsList=Ti.seqWithValue(O.seq,b.uniforms)}return b.uniformsList}function Po(b,O){let G=Tt.get(b);G.outputColorSpace=O.outputColorSpace,G.batching=O.batching,G.batchingColor=O.batchingColor,G.instancing=O.instancing,G.instancingColor=O.instancingColor,G.instancingMorph=O.instancingMorph,G.skinning=O.skinning,G.morphTargets=O.morphTargets,G.morphNormals=O.morphNormals,G.morphColors=O.morphColors,G.morphTargetsCount=O.morphTargetsCount,G.numClippingPlanes=O.numClippingPlanes,G.numIntersection=O.numClipIntersection,G.vertexAlphas=O.vertexAlphas,G.vertexTangents=O.vertexTangents,G.toneMapping=O.toneMapping}function Sc(b,O,G,W,F){O.isScene!==!0&&(O=Qt),A.resetTextureUnits();let it=O.fog,ut=W.isMeshStandardMaterial?O.environment:null,_t=P===null?v.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:Ui,vt=(W.isMeshStandardMaterial?V:y).get(W.envMap||ut),It=W.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ut=!!G.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),xt=!!G.morphAttributes.position,$t=!!G.morphAttributes.normal,ee=!!G.morphAttributes.color,ne=Dn;W.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(ne=v.toneMapping);let Pe=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,qt=Pe!==void 0?Pe.length:0,St=Tt.get(W),on=h.state.lights;if(et===!0&&(gt===!0||b!==S)){let Be=b===S&&W.id===E;nt.setState(W,b,Be)}let Yt=!1;W.version===St.__version?(St.needsLights&&St.lightsStateVersion!==on.state.version||St.outputColorSpace!==_t||F.isBatchedMesh&&St.batching===!1||!F.isBatchedMesh&&St.batching===!0||F.isBatchedMesh&&St.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&St.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&St.instancing===!1||!F.isInstancedMesh&&St.instancing===!0||F.isSkinnedMesh&&St.skinning===!1||!F.isSkinnedMesh&&St.skinning===!0||F.isInstancedMesh&&St.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&St.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&St.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&St.instancingMorph===!1&&F.morphTexture!==null||St.envMap!==vt||W.fog===!0&&St.fog!==it||St.numClippingPlanes!==void 0&&(St.numClippingPlanes!==nt.numPlanes||St.numIntersection!==nt.numIntersection)||St.vertexAlphas!==It||St.vertexTangents!==Ut||St.morphTargets!==xt||St.morphNormals!==$t||St.morphColors!==ee||St.toneMapping!==ne||St.morphTargetsCount!==qt)&&(Yt=!0):(Yt=!0,St.__version=W.version);let We=St.currentProgram;Yt===!0&&(We=ls(W,O,F));let ri=!1,De=!1,Fi=!1,ie=We.getUniforms(),en=St.uniforms;if(Et.useProgram(We.program)&&(ri=!0,De=!0,Fi=!0),W.id!==E&&(E=W.id,De=!0),ri||S!==b){Et.buffers.depth.getReversed()?(st.copy(b.projectionMatrix),Nh(st),Oh(st),ie.setValue(I,"projectionMatrix",st)):ie.setValue(I,"projectionMatrix",b.projectionMatrix),ie.setValue(I,"viewMatrix",b.matrixWorldInverse);let Sn=ie.map.cameraPosition;Sn!==void 0&&Sn.setValue(I,Ct.setFromMatrixPosition(b.matrixWorld)),Vt.logarithmicDepthBuffer&&ie.setValue(I,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&ie.setValue(I,"isOrthographic",b.isOrthographicCamera===!0),S!==b&&(S=b,De=!0,Fi=!0)}if(F.isSkinnedMesh){ie.setOptional(I,F,"bindMatrix"),ie.setOptional(I,F,"bindMatrixInverse");let Be=F.skeleton;Be&&(Be.boneTexture===null&&Be.computeBoneTexture(),ie.setValue(I,"boneTexture",Be.boneTexture,A))}F.isBatchedMesh&&(ie.setOptional(I,F,"batchingTexture"),ie.setValue(I,"batchingTexture",F._matricesTexture,A),ie.setOptional(I,F,"batchingIdTexture"),ie.setValue(I,"batchingIdTexture",F._indirectTexture,A),ie.setOptional(I,F,"batchingColorTexture"),F._colorsTexture!==null&&ie.setValue(I,"batchingColorTexture",F._colorsTexture,A));let Bi=G.morphAttributes;if((Bi.position!==void 0||Bi.normal!==void 0||Bi.color!==void 0)&&Pt.update(F,G,We),(De||St.receiveShadow!==F.receiveShadow)&&(St.receiveShadow=F.receiveShadow,ie.setValue(I,"receiveShadow",F.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(en.envMap.value=vt,en.flipEnvMap.value=vt.isCubeTexture&&vt.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&O.environment!==null&&(en.envMapIntensity.value=O.environmentIntensity),De&&(ie.setValue(I,"toneMappingExposure",v.toneMappingExposure),St.needsLights&&wc(en,Fi),it&&W.fog===!0&&ct.refreshFogUniforms(en,it),ct.refreshMaterialUniforms(en,W,N,k,h.state.transmissionRenderTarget[b.id]),Ti.upload(I,Ro(St),en,A)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Ti.upload(I,Ro(St),en,A),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&ie.setValue(I,"center",F.center),ie.setValue(I,"modelViewMatrix",F.modelViewMatrix),ie.setValue(I,"normalMatrix",F.normalMatrix),ie.setValue(I,"modelMatrix",F.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let Be=W.uniformsGroups;for(let Sn=0,wn=Be.length;Sn<wn;Sn++){let Io=Be[Sn];D.update(Io,We),D.bind(Io,We)}}return We}function wc(b,O){b.ambientLightColor.needsUpdate=O,b.lightProbe.needsUpdate=O,b.directionalLights.needsUpdate=O,b.directionalLightShadows.needsUpdate=O,b.pointLights.needsUpdate=O,b.pointLightShadows.needsUpdate=O,b.spotLights.needsUpdate=O,b.spotLightShadows.needsUpdate=O,b.rectAreaLights.needsUpdate=O,b.hemisphereLights.needsUpdate=O}function Ec(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(b,O,G){Tt.get(b.texture).__webglTexture=O,Tt.get(b.depthTexture).__webglTexture=G;let W=Tt.get(b);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=G===void 0,W.__autoAllocateDepthBuffer||kt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(b,O){let G=Tt.get(b);G.__webglFramebuffer=O,G.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(b,O=0,G=0){P=b,C=O,T=G;let W=!0,F=null,it=!1,ut=!1;if(b){let vt=Tt.get(b);if(vt.__useDefaultFramebuffer!==void 0)Et.bindFramebuffer(I.FRAMEBUFFER,null),W=!1;else if(vt.__webglFramebuffer===void 0)A.setupRenderTarget(b);else if(vt.__hasExternalTextures)A.rebindTextures(b,Tt.get(b.texture).__webglTexture,Tt.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let xt=b.depthTexture;if(vt.__boundDepthTexture!==xt){if(xt!==null&&Tt.has(xt)&&(b.width!==xt.image.width||b.height!==xt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");A.setupDepthRenderbuffer(b)}}let It=b.texture;(It.isData3DTexture||It.isDataArrayTexture||It.isCompressedArrayTexture)&&(ut=!0);let Ut=Tt.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Ut[O])?F=Ut[O][G]:F=Ut[O],it=!0):b.samples>0&&A.useMultisampledRTT(b)===!1?F=Tt.get(b).__webglMultisampledFramebuffer:Array.isArray(Ut)?F=Ut[G]:F=Ut,R.copy(b.viewport),X.copy(b.scissor),U=b.scissorTest}else R.copy(rt).multiplyScalar(N).floor(),X.copy(Mt).multiplyScalar(N).floor(),U=Rt;if(Et.bindFramebuffer(I.FRAMEBUFFER,F)&&W&&Et.drawBuffers(b,F),Et.viewport(R),Et.scissor(X),Et.setScissorTest(U),it){let vt=Tt.get(b.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+O,vt.__webglTexture,G)}else if(ut){let vt=Tt.get(b.texture),It=O||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,vt.__webglTexture,G||0,It)}E=-1},this.readRenderTargetPixels=function(b,O,G,W,F,it,ut){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let _t=Tt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ut!==void 0&&(_t=_t[ut]),_t){Et.bindFramebuffer(I.FRAMEBUFFER,_t);try{let vt=b.texture,It=vt.format,Ut=vt.type;if(!Vt.textureFormatReadable(It)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Vt.textureTypeReadable(Ut)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=b.width-W&&G>=0&&G<=b.height-F&&I.readPixels(O,G,W,F,Ot.convert(It),Ot.convert(Ut),it)}finally{let vt=P!==null?Tt.get(P).__webglFramebuffer:null;Et.bindFramebuffer(I.FRAMEBUFFER,vt)}}},this.readRenderTargetPixelsAsync=async function(b,O,G,W,F,it,ut){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let _t=Tt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ut!==void 0&&(_t=_t[ut]),_t){let vt=b.texture,It=vt.format,Ut=vt.type;if(!Vt.textureFormatReadable(It))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Vt.textureTypeReadable(Ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(O>=0&&O<=b.width-W&&G>=0&&G<=b.height-F){Et.bindFramebuffer(I.FRAMEBUFFER,_t);let xt=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,xt),I.bufferData(I.PIXEL_PACK_BUFFER,it.byteLength,I.STREAM_READ),I.readPixels(O,G,W,F,Ot.convert(It),Ot.convert(Ut),0);let $t=P!==null?Tt.get(P).__webglFramebuffer:null;Et.bindFramebuffer(I.FRAMEBUFFER,$t);let ee=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Uh(I,ee,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,xt),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,it),I.deleteBuffer(xt),I.deleteSync(ee),it}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(b,O=null,G=0){b.isTexture!==!0&&(qi("WebGLRenderer: copyFramebufferToTexture function signature has changed."),O=arguments[0]||null,b=arguments[1]);let W=Math.pow(2,-G),F=Math.floor(b.image.width*W),it=Math.floor(b.image.height*W),ut=O!==null?O.x:0,_t=O!==null?O.y:0;A.setTexture2D(b,0),I.copyTexSubImage2D(I.TEXTURE_2D,G,0,0,ut,_t,F,it),Et.unbindTexture()},this.copyTextureToTexture=function(b,O,G=null,W=null,F=0){b.isTexture!==!0&&(qi("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,b=arguments[1],O=arguments[2],F=arguments[3]||0,G=null);let it,ut,_t,vt,It,Ut,xt,$t,ee,ne=b.isCompressedTexture?b.mipmaps[F]:b.image;G!==null?(it=G.max.x-G.min.x,ut=G.max.y-G.min.y,_t=G.isBox3?G.max.z-G.min.z:1,vt=G.min.x,It=G.min.y,Ut=G.isBox3?G.min.z:0):(it=ne.width,ut=ne.height,_t=ne.depth||1,vt=0,It=0,Ut=0),W!==null?(xt=W.x,$t=W.y,ee=W.z):(xt=0,$t=0,ee=0);let Pe=Ot.convert(O.format),qt=Ot.convert(O.type),St;O.isData3DTexture?(A.setTexture3D(O,0),St=I.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(A.setTexture2DArray(O,0),St=I.TEXTURE_2D_ARRAY):(A.setTexture2D(O,0),St=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,O.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,O.unpackAlignment);let on=I.getParameter(I.UNPACK_ROW_LENGTH),Yt=I.getParameter(I.UNPACK_IMAGE_HEIGHT),We=I.getParameter(I.UNPACK_SKIP_PIXELS),ri=I.getParameter(I.UNPACK_SKIP_ROWS),De=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,ne.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,ne.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,vt),I.pixelStorei(I.UNPACK_SKIP_ROWS,It),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ut);let Fi=b.isDataArrayTexture||b.isData3DTexture,ie=O.isDataArrayTexture||O.isData3DTexture;if(b.isRenderTargetTexture||b.isDepthTexture){let en=Tt.get(b),Bi=Tt.get(O),Be=Tt.get(en.__renderTarget),Sn=Tt.get(Bi.__renderTarget);Et.bindFramebuffer(I.READ_FRAMEBUFFER,Be.__webglFramebuffer),Et.bindFramebuffer(I.DRAW_FRAMEBUFFER,Sn.__webglFramebuffer);for(let wn=0;wn<_t;wn++)Fi&&I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Tt.get(b).__webglTexture,F,Ut+wn),b.isDepthTexture?(ie&&I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Tt.get(O).__webglTexture,F,ee+wn),I.blitFramebuffer(vt,It,it,ut,xt,$t,it,ut,I.DEPTH_BUFFER_BIT,I.NEAREST)):ie?I.copyTexSubImage3D(St,F,xt,$t,ee+wn,vt,It,it,ut):I.copyTexSubImage2D(St,F,xt,$t,ee+wn,vt,It,it,ut);Et.bindFramebuffer(I.READ_FRAMEBUFFER,null),Et.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else ie?b.isDataTexture||b.isData3DTexture?I.texSubImage3D(St,F,xt,$t,ee,it,ut,_t,Pe,qt,ne.data):O.isCompressedArrayTexture?I.compressedTexSubImage3D(St,F,xt,$t,ee,it,ut,_t,Pe,ne.data):I.texSubImage3D(St,F,xt,$t,ee,it,ut,_t,Pe,qt,ne):b.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,F,xt,$t,it,ut,Pe,qt,ne.data):b.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,F,xt,$t,ne.width,ne.height,Pe,ne.data):I.texSubImage2D(I.TEXTURE_2D,F,xt,$t,it,ut,Pe,qt,ne);I.pixelStorei(I.UNPACK_ROW_LENGTH,on),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Yt),I.pixelStorei(I.UNPACK_SKIP_PIXELS,We),I.pixelStorei(I.UNPACK_SKIP_ROWS,ri),I.pixelStorei(I.UNPACK_SKIP_IMAGES,De),F===0&&O.generateMipmaps&&I.generateMipmap(St),Et.unbindTexture()},this.copyTextureToTexture3D=function(b,O,G=null,W=null,F=0){return b.isTexture!==!0&&(qi("WebGLRenderer: copyTextureToTexture3D function signature has changed."),G=arguments[0]||null,W=arguments[1]||null,b=arguments[2],O=arguments[3],F=arguments[4]||0),qi('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(b,O,G,W,F)},this.initRenderTarget=function(b){Tt.get(b).__webglFramebuffer===void 0&&A.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?A.setTextureCube(b,0):b.isData3DTexture?A.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?A.setTexture2DArray(b,0):A.setTexture2D(b,0),Et.unbindTexture()},this.resetState=function(){C=0,T=0,P=null,Et.reset(),te.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return gn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=Xt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Xt._getUnpackColorSpace()}};var nr=class extends Fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new bn,this.environmentIntensity=1,this.environmentRotation=new bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var es=class extends Nn{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new Gt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},ir=new z,sr=new z,Nl=new ue,$i=new Qn,Ps=new jn,Wr=new z,Ol=new z,Ya=class extends Fe{constructor(t=new He,e=new es){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)ir.fromBufferAttribute(e,s-1),sr.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=ir.distanceTo(sr);t.setAttribute("lineDistance",new je(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ps.copy(n.boundingSphere),Ps.applyMatrix4(s),Ps.radius+=r,t.ray.intersectsSphere(Ps)===!1)return;Nl.copy(s).invert(),$i.copy(t.ray).applyMatrix4(Nl);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,u=n.index,p=n.attributes.position;if(u!==null){let g=Math.max(0,a.start),_=Math.min(u.count,a.start+a.count);for(let x=g,f=_-1;x<f;x+=c){let h=u.getX(x),M=u.getX(x+1),w=Is(this,t,$i,l,h,M);w&&e.push(w)}if(this.isLineLoop){let x=u.getX(_-1),f=u.getX(g),h=Is(this,t,$i,l,x,f);h&&e.push(h)}}else{let g=Math.max(0,a.start),_=Math.min(p.count,a.start+a.count);for(let x=g,f=_-1;x<f;x+=c){let h=Is(this,t,$i,l,x,x+1);h&&e.push(h)}if(this.isLineLoop){let x=Is(this,t,$i,l,_-1,g);x&&e.push(x)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Is(i,t,e,n,s,r){let a=i.geometry.attributes.position;if(ir.fromBufferAttribute(a,s),sr.fromBufferAttribute(a,r),e.distanceSqToSegment(ir,sr,Wr,Ol)>n)return;Wr.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(Wr);if(!(l<t.near||l>t.far))return{distance:l,point:Ol.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}var Fl=new z,Bl=new z,rr=class extends Ya{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Fl.fromBufferAttribute(e,s),Bl.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Fl.distanceTo(Bl);t.setAttribute("lineDistance",new je(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var ns=class extends Nn{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Gt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},kl=new ue,Za=new Qn,Ls=new jn,Ds=new z,ar=class extends Fe{constructor(t=new He,e=new ns){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ls.copy(n.boundingSphere),Ls.applyMatrix4(s),Ls.radius+=r,t.ray.intersectsSphere(Ls)===!1)return;kl.copy(s).invert(),Za.copy(t.ray).applyMatrix4(kl);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){let p=Math.max(0,a.start),g=Math.min(c.count,a.start+a.count);for(let _=p,x=g;_<x;_++){let f=c.getX(_);Ds.fromBufferAttribute(d,f),zl(Ds,f,l,s,t,e,this)}}else{let p=Math.max(0,a.start),g=Math.min(d.count,a.start+a.count);for(let _=p,x=g;_<x;_++)Ds.fromBufferAttribute(d,_),zl(Ds,_,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function zl(i,t,e,n,s,r,a){let o=Za.distanceSqToPoint(i);if(o<e){let l=new z;Za.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}function Us(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function Im(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Di=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ja=class extends Di{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Bo,endingEnd:Bo}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case ko:r=t,o=2*e-n;break;case zo:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case ko:a=t,l=2*n-e;break;case zo:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,u=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=this._offsetPrev,d=this._offsetNext,p=this._weightPrev,g=this._weightNext,_=(n-e)/(s-e),x=_*_,f=x*_,h=-p*f+2*p*x-p*_,M=(1+p)*f+(-1.5-2*p)*x+(-.5+p)*_+1,w=(-1-g)*f+(1.5+g)*x+.5*_,v=g*f-g*x;for(let B=0;B!==o;++B)r[B]=h*a[u+B]+M*a[c+B]+w*a[l+B]+v*a[d+B];return r}},Ka=class extends Di{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=(n-e)/(s-e),d=1-u;for(let p=0;p!==o;++p)r[p]=a[c+p]*d+a[l+p]*u;return r}},ja=class extends Di{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},tn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Us(e,this.TimeBufferType),this.values=Us(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Us(t.times,Array),values:Us(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new ja(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Ka(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ja(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case zs:e=this.InterpolantFactoryMethodDiscrete;break;case Pa:e=this.InterpolantFactoryMethodLinear;break;case _r:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return zs;case this.InterpolantFactoryMethodLinear:return Pa;case this.InterpolantFactoryMethodSmooth:return _r}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&Im(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===_r,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],u=t[o+1];if(c!==u&&(o!==1||c!==t[0]))if(s)l=!0;else{let d=o*n,p=d-n,g=d+n;for(let _=0;_!==n;++_){let x=e[d+_];if(x!==e[p+_]||x!==e[g+_]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let d=o*n,p=a*n;for(let g=0;g!==n;++g)e[p+g]=e[d+g]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};tn.prototype.TimeBufferType=Float32Array;tn.prototype.ValueBufferType=Float32Array;tn.prototype.DefaultInterpolation=Pa;var ti=class extends tn{constructor(t,e,n){super(t,e,n)}};ti.prototype.ValueTypeName="bool";ti.prototype.ValueBufferType=Array;ti.prototype.DefaultInterpolation=zs;ti.prototype.InterpolantFactoryMethodLinear=void 0;ti.prototype.InterpolantFactoryMethodSmooth=void 0;var Qa=class extends tn{};Qa.prototype.ValueTypeName="color";var to=class extends tn{};to.prototype.ValueTypeName="number";var eo=class extends Di{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let u=c+o;c!==u;c+=4)Qe.slerpFlat(r,0,a,c-o,a,c,l);return r}},or=class extends tn{InterpolantFactoryMethodLinear(t){return new eo(this.times,this.values,this.getValueSize(),t)}};or.prototype.ValueTypeName="quaternion";or.prototype.InterpolantFactoryMethodSmooth=void 0;var ei=class extends tn{constructor(t,e,n){super(t,e,n)}};ei.prototype.ValueTypeName="string";ei.prototype.ValueBufferType=Array;ei.prototype.DefaultInterpolation=zs;ei.prototype.InterpolantFactoryMethodLinear=void 0;ei.prototype.InterpolantFactoryMethodSmooth=void 0;var no=class extends tn{};no.prototype.ValueTypeName="vector";var io=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return c.push(u,d),this},this.removeHandler=function(u){let d=c.indexOf(u);return d!==-1&&c.splice(d,2),this},this.getHandler=function(u){for(let d=0,p=c.length;d<p;d+=2){let g=c[d],_=c[d+1];if(g.global&&(g.lastIndex=0),g.test(u))return _}return null}}},Lm=new io,so=class{constructor(t){this.manager=t!==void 0?t:Lm,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};so.DEFAULT_MATERIAL_NAME="__DEFAULT";var go="\\[\\]\\.:\\/",Dm=new RegExp("["+go+"]","g"),_o="[^"+go+"]",Um="[^"+go.replace("\\.","")+"]",Nm=/((?:WC+[\/:])*)/.source.replace("WC",_o),Om=/(WCOD+)?/.source.replace("WCOD",Um),Fm=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",_o),Bm=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",_o),km=new RegExp("^"+Nm+Om+Fm+Bm+"$"),zm=["material","materials","bones","map"],ro=class{constructor(t,e,n){let s=n||se.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},se=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Dm,"")}static parseTrackName(t){let e=km.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);zm.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===c){c=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};se.Composite=ro;se.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};se.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};se.prototype.GetterByBindingType=[se.prototype._getValue_direct,se.prototype._getValue_array,se.prototype._getValue_arrayElement,se.prototype._getValue_toArray];se.prototype.SetterByBindingTypeAndVersioning=[[se.prototype._setValue_direct,se.prototype._setValue_direct_setNeedsUpdate,se.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[se.prototype._setValue_array,se.prototype._setValue_array_setNeedsUpdate,se.prototype._setValue_array_setMatrixWorldNeedsUpdate],[se.prototype._setValue_arrayElement,se.prototype._setValue_arrayElement_setNeedsUpdate,se.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[se.prototype._setValue_fromArray,se.prototype._setValue_fromArray_setNeedsUpdate,se.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Rg=new Float32Array(1);var is=class{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Ee(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var lr=class extends xn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ao}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ao);var hc={type:"change"},xo={type:"start"},dc={type:"end"},dr=new Qn,uc=new Ye,Hm=Math.cos(70*ec.DEG2RAD),ve=new z,Le=2*Math.PI,jt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},vo=1e-6,fr=class extends lr{constructor(t,e=null){super(t,e),this.state=jt.NONE,this.enabled=!0,this.target=new z,this.cursor=new z,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ni.ROTATE,MIDDLE:ni.DOLLY,RIGHT:ni.PAN},this.touches={ONE:ii.ROTATE,TWO:ii.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new z,this._lastQuaternion=new Qe,this._lastTargetPosition=new z,this._quat=new Qe().setFromUnitVectors(t.up,new z(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new is,this._sphericalDelta=new is,this._scale=1,this._panOffset=new z,this._rotateStart=new Bt,this._rotateEnd=new Bt,this._rotateDelta=new Bt,this._panStart=new Bt,this._panEnd=new Bt,this._panDelta=new Bt,this._dollyStart=new Bt,this._dollyEnd=new Bt,this._dollyDelta=new Bt,this._dollyDirection=new z,this._mouse=new Bt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Wm.bind(this),this._onPointerDown=Gm.bind(this),this._onPointerUp=Xm.bind(this),this._onContextMenu=jm.bind(this),this._onMouseWheel=Ym.bind(this),this._onKeyDown=Zm.bind(this),this._onTouchStart=Jm.bind(this),this._onTouchMove=Km.bind(this),this._onMouseDown=$m.bind(this),this._onMouseMove=qm.bind(this),this._interceptControlDown=Qm.bind(this),this._interceptControlUp=tg.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(hc),this.update(),this.state=jt.NONE}update(t=null){let e=this.object.position;ve.copy(e).sub(this.target),ve.applyQuaternion(this._quat),this._spherical.setFromVector3(ve),this.autoRotate&&this.state===jt.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Le:n>Math.PI&&(n-=Le),s<-Math.PI?s+=Le:s>Math.PI&&(s-=Le),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(ve.setFromSpherical(this._spherical),ve.applyQuaternion(this._quatInverse),e.copy(this.target).add(ve),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=ve.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new z(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new z(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=ve.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(dr.origin.copy(this.object.position),dr.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(dr.direction))<Hm?this.object.lookAt(this.target):(uc.setFromNormalAndCoplanarPoint(this.object.up,this.target),dr.intersectPlane(uc,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>vo||8*(1-this._lastQuaternion.dot(this.object.quaternion))>vo||this._lastTargetPosition.distanceToSquared(this.target)>vo?(this.dispatchEvent(hc),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?Le/60*this.autoRotateSpeed*t:Le/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){ve.setFromMatrixColumn(e,0),ve.multiplyScalar(-t),this._panOffset.add(ve)}_panUp(t,e){this.screenSpacePanning===!0?ve.setFromMatrixColumn(e,1):(ve.setFromMatrixColumn(e,0),ve.crossVectors(this.object.up,ve)),ve.multiplyScalar(t),this._panOffset.add(ve)}_pan(t,e){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;ve.copy(s).sub(this.target);let r=ve.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Le*this._rotateDelta.x/e.clientHeight),this._rotateUp(Le*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(Le*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-Le*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(Le*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-Le*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Le*this._rotateDelta.x/e.clientHeight),this._rotateUp(Le*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new Bt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Gm(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function Wm(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function Xm(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(dc),this.state=jt.NONE;break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function $m(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ni.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=jt.DOLLY;break;case ni.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=jt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=jt.ROTATE}break;case ni.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=jt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=jt.PAN}break;default:this.state=jt.NONE}this.state!==jt.NONE&&this.dispatchEvent(xo)}function qm(i){switch(this.state){case jt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case jt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case jt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function Ym(i){this.enabled===!1||this.enableZoom===!1||this.state!==jt.NONE||(i.preventDefault(),this.dispatchEvent(xo),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(dc))}function Zm(i){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(i)}function Jm(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case ii.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=jt.TOUCH_ROTATE;break;case ii.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=jt.TOUCH_PAN;break;default:this.state=jt.NONE}break;case 2:switch(this.touches.TWO){case ii.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=jt.TOUCH_DOLLY_PAN;break;case ii.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=jt.TOUCH_DOLLY_ROTATE;break;default:this.state=jt.NONE}break;default:this.state=jt.NONE}this.state!==jt.NONE&&this.dispatchEvent(xo)}function Km(i){switch(this._trackPointer(i),this.state){case jt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case jt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case jt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case jt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=jt.NONE}}function jm(i){this.enabled!==!1&&i.preventDefault()}function Qm(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function tg(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var eg={girder:"#2f6fb3",web:"#6f9fd0",slab:"#9aa5b1",midgap:"#9aa5b1",edge:"#5d6873",deck_end:"#5d6873",support_edge:"#5d6873",cross_girder:"#7b5ea7",sill:"#b06a2c",pile:"#6b7d2f","rigid arms":"#c43c3c",bearing:"#d08b00"},fc=i=>eg[i]||"#888888",ng=i=>i.toLowerCase().includes("rigid")?"rigid arms":i||"other";function pc(i){let t=m("div",{class:"viewer3d"}),e=m("div",{class:"canvasbox"}),n=new Map,s=new nr,r=new er({antialias:!0,preserveDrawingBuffer:!0});r.setPixelRatio(Math.min(window.devicePixelRatio,2));let a=getComputedStyle(document.documentElement);s.background=new Gt(a.getPropertyValue("--canvas").trim()||"#f6f7f9");let o=new Ce(40,1,.1,5e3),l=new fr(o,r.domElement);e.append(r.domElement);let c=Object.keys(i.nodes),u=(U,H,Z)=>{let L=i.nodes[U],k=H?i.cases[H]?.u[U]:null;return[L[0]+(k?k[0]*Z:0),L[2]+(k?k[2]*Z:0),-(L[1]+(k?k[1]*Z:0))]},d=new Mn;c.forEach(U=>d.expandByPoint(new z(...u(U,null,0))));let p=d.getCenter(new z),g=d.getSize(new z).length(),_=new Map;for(let[U,H,Z]of[...i.beams,...i.links]){let L=ng(Z);_.has(L)||_.set(L,[]),_.get(L).push([U,H])}let x=null,f=0,h=U=>Math.max(...Object.values(i.cases[U].u).map(H=>Math.hypot(H[0],H[1],H[2])));function M(){for(let[L,k]of _){let N=new Float32Array(k.length*6);k.forEach(([tt,rt],Mt)=>{N.set(u(tt,x,f),Mt*6),N.set(u(rt,x,f),Mt*6+3)});let J=n.get(L);J||(J=new rr(new He,new es({color:fc(L)})),s.add(J),n.set(L,J)),J.geometry.setAttribute("position",new Re(N,3)),J.geometry.computeBoundingSphere(),J.position.set(-p.x,-p.y,-p.z)}let U=[...i.fixed,...i.springs],H=s.getObjectByName("supports");H&&s.remove(H);let Z=new ar(new He().setAttribute("position",new Re(new Float32Array(U.flatMap(L=>u(L,x,f))),3)),new ns({color:"#c43c3c",size:.35}));Z.name="supports",Z.position.set(-p.x,-p.y,-p.z),s.add(Z)}M(),o.position.set(g*.7,g*.45,g*.7),l.update();let w=m("div",{class:"legend"},m("div",{class:"legend-title"},"Members"),[..._.keys()].sort().map(U=>m("label",{},m("input",{type:"checkbox",checked:!0,onchange:H=>{n.get(U).visible=H.target.checked}}),m("span",{class:"sw",style:`background:${fc(U)}`}),`${U} (${_.get(U).length})`)),m("label",{},m("span",{class:"sw dot",style:"background:#c43c3c"}),`supports / springs (${i.fixed.length+i.springs.length})`)),v=m("div",{class:"muted small"}),B=m("input",{type:"range",min:0,max:400,value:100}),C=m("select",{},m("option",{value:""},"Undeformed"),Object.keys(i.cases).map(U=>m("option",{value:U},U==="SW"?"Deformed \u2014 self weight":U==="SDL"?"Deformed \u2014 superimposed dead load":`${U} \u2014 T = ${i.cases[U].T} s`))),T=()=>{if(x=C.value||null,x){let U=h(x);f=.04*g/Math.max(U,1e-9)*(+B.value/100),v.textContent=i.cases[x].T?`mode shape (mass-normalised) \xB7 drawn \xD7 ${ot(f,0)}`:`max displacement ${ot(U*1e3,1)} mm \xB7 drawn \xD7 ${ot(f,0)}`}else f=0,v.textContent=`${c.length} nodes \xB7 ${i.beams.length} members \xB7 ${i.links.length} bearing links`;M()};C.onchange=T,B.oninput=T,T();let P=[["3D",()=>o.position.set(g*.55,g*.35,g*.55)],["Plan",()=>o.position.set(0,g*.9,.001)],["Elevation",()=>o.position.set(0,0,g*.9)],["Section",()=>o.position.set(g*.9,0,0)]],E=m("div",{class:"toolbar"},C,m("label",{class:"small"},"scale ",B),P.map(([U,H])=>m("button",{class:"btn ghost",onclick:()=>{H(),l.target.set(0,0,0),l.update()}},U)),v);t.append(E,m("div",{class:"viewer-body"},e,w));let S=new ResizeObserver(()=>{let U=e.clientWidth,H=e.clientHeight;r.setSize(U,H),o.aspect=U/Math.max(H,1),o.updateProjectionMatrix()});S.observe(e);let R=!0,X=()=>{if(R){if(!t.isConnected&&t.dataset.mounted){R=!1,r.dispose(),S.disconnect();return}t.isConnected&&(t.dataset.mounted="1"),l.update(),r.render(s,o),requestAnimationFrame(X)}};return requestAnimationFrame(X),t}function pr(i){return Object.keys(i).filter(t=>i[t]?.rows).sort().map(t=>{let e=0,n=0,s=0,r=0;for(let o of i[t].rows){if(o.conf==="solid"){s=Math.max(s,o.shear?.u??0);continue}e=Math.max(e,o.sag?.uB??0,o.hog?.uB??0),n=Math.max(n,o.sag?.uS??0,o.hog?.uS??0),s=Math.max(s,o.shear?.u??0),o.sag&&o.sag.okMin===!1&&r++}let a=Math.max(e,n,s);return{g:t,u:a,what:a===e?"ULS bending":a===n?"SLS stress":"shear / torsion",uB:e,uS:n,uV:s,minFail:r}})}var ig=[["depth","Depth"],["top_flange_width","Top flange width"],["concrete_28d","f'c girder"],["concrete_transfer","f'cp at transfer"],["jacking_ratio","Jacking stress / fpb"],["haunch","Haunch"],["transfer_supports","Support from end at transfer"],["age_at_transfer","Age at transfer"],["age_at_erection","Age at erection"],["age_deck_cast","Age when deck cast"]],mc=[["strand_pattern","Tendons (one row per strand; untick 'on' to remove a strand)",["y","x","diameter","debond_left","debond_right","on"],"y, x from the soffit / centreline (mm); debond lengths from each end (mm)"],["bars","Longitudinal reinforcement",["y","diameter","number","from","to"],"y (mm) from the soffit; from / to (m) along the girder"],["fitments","Shear / torsion fitments",["from","to","diameter","legs","spacing"],"from / to (m) along the girder; spacing (mm)"],["zones","Solid end blocks / open zones",["from","to","kind"],"kind: solid_end_A | solid_end_B | open"],["deck_bars","Deck reinforcement acting with the girder",["face","diameter","spacing","cover"],"mm"],["shape","Section shape parameters (Super-T library keys)",["key","name","value","unit"],"only 'value' is normally edited"]],gc={get:i=>{try{return localStorage.getItem(i)||""}catch{return""}},set:(i,t)=>{try{localStorage.setItem(i,t)}catch{}}};async function _c(i,t){let[e,n,s]=await Promise.all([yt.values(i,!0),yt.result(i,"sections.json"),yt.result(i,"girder_checks.json")]),r=e.rows,a=[...new Set(r.map(d=>/^superstructure\.supert_types\[([^\]]+)\]/.exec(d.path)?.[1]).filter(Boolean))];if(!a.length)return be("No Super-T girder types in the bridge data","Read or enter the girder drawings first.");let o=r.filter(d=>/\.type_ref$/.test(d.path)).map(d=>({m:/members\[([^\]]+)\]/.exec(d.path)?.[1]||"",t:String(d.value)})),l=m("div"),c=a[0],u=()=>{let d=`superstructure.supert_types[${c}]`,p=r.filter(L=>L.path.startsWith(d+".")),g={},_={},x=m("div",{class:"card"}),f=o.filter(L=>L.t===c).map(L=>L.m),h=m("div",{class:"grid tiles"},ig.map(([L,k])=>{let N=p.find(tt=>tt.path===`${d}.${L}`);if(!N)return null;let J=m("input",{value:N.value===null||N.value===void 0?"":String(N.value),size:9,disabled:!!ce});return g[L]={row:N,input:J},m("label",{class:"card tile"},m("div",{class:"small muted"},`${k}${N.unit?" ("+N.unit+")":""}`),J,m("div",{class:"small muted"},N.tag))})),M=mc.map(([L,k,N,J])=>{let tt=p.filter(Rt=>Rt.path.startsWith(`${d}.${L}.rows[`)).sort((Rt,q)=>+/rows\[(\d+)\]/.exec(Rt.path)[1]-+/rows\[(\d+)\]/.exec(q.path)[1]);_[L]={rows:[]};let rt=m("tbody"),Mt=(Rt,q)=>{let et={},gt=m("tr",{},N.map(st=>{let wt=q[st],Ct=st==="on"?m("input",{type:"checkbox",checked:wt!==!1,disabled:!!ce,onchange:B}):m("input",{value:wt==null?"":String(wt),size:st==="kind"||st==="name"||st==="face"||st==="key"?12:7,disabled:!!ce,oninput:B});return et[st]=Ct,m("td",{},Ct)}),m("td",{class:"small muted"},Rt?Rt.tag:"new"));_[L].rows.push({row:Rt,cells:q,inputs:et}),rt.append(gt)};return tt.forEach(Rt=>Mt(Rt,{...Rt.value||{}})),m("details",{class:"card",open:L==="strand_pattern"||L==="fitments"},m("summary",{},m("b",{},k),m("span",{class:"small muted"},`  ${tt.length} row(s) \xB7 ${J}`)),m("div",{class:"tablewrap"},m("table",{class:"edit"},m("thead",{},m("tr",{},N.map(Rt=>m("th",{},Rt)),m("th",{},"tag"))),rt)),ce?null:m("button",{class:"btn ghost",onclick:()=>{let Rt=_[L].rows[_[L].rows.length-1];Mt(null,Rt?{...v(Rt.inputs,N)}:{}),B()}},"+ Add row"))}),w=L=>L.trim()===""?null:Number(L);function v(L,k){let N={};for(let J of k){let tt=L[J];if(J==="on")N[J]=tt.checked;else if(["kind","name","face","key","unit"].includes(J))tt.value.trim()&&(N[J]=tt.value.trim());else{let rt=w(tt.value);rt!==null&&(N[J]=rt)}}return N}function B(){let k=(_.strand_pattern?.rows||[]).map(I=>v(I.inputs,["y","x","diameter","debond_left","debond_right","on"])),N=f.find(I=>n.data?.girders?.[I]),J=N?n.data.girders[N]:null,tt=J?J.stations[Math.floor(J.stations.length/2)]:null,rt=document.createElementNS("http://www.w3.org/2000/svg","svg"),Mt=tt?[...tt.outline]:k.map(I=>[Number(I.x)||0,Number(I.y)||0]),Rt=Mt.map(I=>I[0]),q=Mt.map(I=>I[1]),et=Math.min(...Rt,-300)-120,gt=Math.max(...Rt,300)+120,st=Math.min(...q,0)-120,wt=Math.max(...q,300)+120;rt.setAttribute("viewBox",`${et} ${-wt} ${gt-et} ${wt-st}`),rt.setAttribute("class","secsvg");let Ct=I=>I.map(xe=>`${xe[0].toFixed(1)},${(-xe[1]).toFixed(1)}`).join(" "),Lt=0,Qt=0,zt=0,re=k.map(I=>{let xe=Number(I.x),kt=Number(I.y),Vt=(Number(I.diameter)||15.2)*1.6;if(!Number.isFinite(xe)||!Number.isFinite(kt))return"";let Et=I.on!==!1,Jt=(Number(I.debond_left)||0)>0||(Number(I.debond_right)||0)>0;return Et&&(Lt++,zt+=kt,Jt&&Qt++),`<circle cx="${xe}" cy="${-kt}" r="${Vt}" class="${Et?Jt?"st-deb":"st-on":"st-off"}"/>`}).join("");rt.innerHTML=(tt?`<polygon points="${Ct(tt.outline)}" class="sec-girder" fill-rule="evenodd"/>`:"")+re,x.replaceChildren(m("h3",{},`${c} \u2014 tendon layout preview`),rt,m("div",{class:"row wrap small"},m("span",{class:"legend-dot st-on"},"bonded"),m("span",{class:"legend-dot st-deb"},"debonded at an end"),m("span",{class:"legend-dot st-off"},"off")),m("p",{class:"small"},`${Lt} strands on (${Qt} debonded at an end) \xB7 centroid of the strands ${Lt?ot(zt/Lt,0):"\u2014"} mm above the soffit (preview of what is entered; checks come from the run).`),m("p",{class:"small muted"},J?`Outline: ${N} at midspan from the last run (${J.type}). Used by ${f.join(", ")||"\u2014"}.`:"No computed outline yet: run the chain."))}let C=pr(s.data||{}).filter(L=>f.includes(L.g)),T=L=>m("td",{class:`uc ${zi(L)}`},ot(L,2)),P=C.map(L=>[L.g,T(L.uB),T(L.uS),T(L.uV)]),E=m("input",{placeholder:"your name",value:gc.get("pdf2bim.name"),size:16,oninput:L=>gc.set("pdf2bim.name",L.target.value)}),S=m("input",{placeholder:"reason, e.g. option B: 44 strands, N12 fitments @100 at the ends",size:50}),R=m("div",{class:"small"}),X=()=>{let L=[],k=[];for(let[N,{row:J,input:tt}]of Object.entries(g)){let rt=w(tt.value);if(tt.value.trim()!==""&&Number.isNaN(rt))throw new Error(`${N}: not a number`);rt!==null&&rt!==J.value&&L.push({path:J.path,value:rt})}for(let[N,,J]of mc)for(let tt of _[N]?.rows||[]){let rt=v(tt.inputs,J);if(Object.values(rt).some(Mt=>typeof Mt=="number"&&Number.isNaN(Mt)))throw new Error(`${N}: a cell is not a number`);tt.row?JSON.stringify(rt)!==JSON.stringify(Object.fromEntries(J.filter(Mt=>(tt.row.value||{})[Mt]!==void 0).map(Mt=>[Mt,tt.row.value[Mt]])))&&L.push({path:tt.row.path,value:{...tt.row.value||{},...rt}}):Object.keys(rt).length&&k.push({table:`${d}.${N}`,cells:rt})}return{items:L,new_rows:k}},U=async L=>{R.textContent="";try{let k=X();if(!k.items.length&&!k.new_rows.length){if(!L){R.textContent="Nothing changed.";return}}else{let N=await yt.saveBatch(i,{by:E.value,reason:S.value,...k});R.textContent=`Saved as ${N.decision} (${N.changed} values, accepted by ${E.value}).`}L?(await yt.run(i,!0),R.textContent+=" Analysis and checks running \u2014 see the progress below; results open in Design checks when done.",Z()):setTimeout(t,900)}catch(k){R.textContent=k.message}},H=m("div",{class:"small"}),Z=async()=>{let L=await yt.latest(i);L&&(H.replaceChildren(m("div",{},`Run ${L.id}: ${L.state}`),m("div",{class:"row wrap"},L.steps.map(k=>m("span",{class:`chip st-${k.state}`},`${k.title.split(" (")[0]}: ${k.state}`)))),L.state==="running"?setTimeout(Z,3e3):L.state==="done"&&(location.hash=`#/p/${i}/design`))};l.replaceChildren(m("div",{class:"row between wrap"},m("div",{class:"row"},m("b",{},"Girder type "),m("select",{onchange:L=>{c=L.target.value,u()}},a.map(L=>m("option",{value:L,selected:L===c},L))),m("span",{class:"small muted"},`used by ${f.join(", ")||"\u2014"}`))),m("div",{class:"grid two"},m("div",{},m("div",{class:"card"},m("h3",{},"Section and materials"),h),P.length?m("div",{class:"card"},m("h3",{},"Last run: maximum utilisation"),ae(["Girder","ULS bending","SLS stress","Shear / torsion"],P)):null),x),...M,ce?m("p",{class:"small muted"},"Read-only copy: edit and run in the app on your computer."):m("div",{class:"card sticky-save"},m("div",{class:"row wrap"},E,S,m("button",{class:"btn",onclick:()=>U(!1)},"Save"),m("button",{class:"btn primary",onclick:()=>U(!0)},"Save and run")),m("p",{class:"small muted"},"Saving records every changed value under your name as one decision (tag Input-user) and keeps the previous revision. The drawing values stay in the record\u2019s history."),R,H)),B()};return u(),l}var bo=document.getElementById("app"),sg=[["overview","Overview"],["drawings","Drawings"],["values","Bridge data"],["decisions","Decisions"],["model","Model 3D"],["sections","Sections"],["loads","Loads"],["moving","Moving loads"],["analysis","Analysis"],["design","Design checks"],["girder","Girder editor"],["verification","Verification"],["run","Run log & files"]],yo,On=(i,t,e="")=>i?m("a",{href:i,class:e},t):m("span",{class:e+" muted",title:"Download in the app on your computer"},t);function si(){clearInterval(yo);let[i,t]=location.hash.replace(/^#/,"").split("?"),e=i.split("/").filter(Boolean),n=new URLSearchParams(t||"");e[0]==="p"&&e[1]?og(decodeURIComponent(e[1]),e[2]||"overview",n).catch(vc):rg().catch(vc)}window.addEventListener("hashchange",si);var vc=i=>{bo.replaceChildren(m("div",{class:"page"},m("div",{class:"alert bad"},"Error: "+i.message)))};function yc(i){return m("header",{class:"top"},m("a",{href:"#/",class:"brand"},m("span",{class:"logo"},"\u25B1"),"PDF2BIM"),m("span",{class:"muted"},"Bridge drawings \u2192 model \u2192 analysis \u2192 design"),i?m("span",{class:"crumb"},"/ ",i):null,ce?m("span",{class:"pill warn"},`Read-only online copy \xB7 ${ce.taken} \xB7 engine ${ce.commit}`):null)}function Mc(i){let t=Object.values(i).reduce((e,n)=>e+n,0)||1;return m("div",{class:"tagbar",title:ki.filter(e=>i[e]).map(e=>`${e}: ${i[e]}`).join(`
`)},ki.filter(e=>i[e]).map(e=>m("span",{class:`seg t-${e.replace(/[^A-Za-z]/g,"")}`,style:`width:${100*i[e]/t}%`})))}async function rg(){let i=await yt.projects(),t=m("form",{class:"card new",onsubmit:async n=>{n.preventDefault();let s=new FormData(n.target);e.textContent="Creating\u2026";try{let r=await yt.create(s);location.hash=`#/p/${r.id}/drawings`}catch(r){e.textContent=r.message}}},m("h3",{},"New bridge"),m("p",{class:"muted small"},"Upload the drawing set (PDF). The bridge description starts with every field Missing \u2014 Flagged; nothing is filled in automatically."),m("label",{},"Bridge id",m("input",{name:"id",required:!0,pattern:"[A-Za-z0-9][A-Za-z0-9_-]*",placeholder:"e.g. BR27"})),m("label",{},"Drawings (PDF)",m("input",{name:"drawings",type:"file",accept:"application/pdf",multiple:!0})),m("button",{class:"btn primary",type:"submit"},"Create")),e=m("div",{class:"small muted"});t.append(e),bo.replaceChildren(yc(),m("main",{class:"page"},m("h1",{},"Bridges"),m("div",{class:"grid cards"},i.map(ag),ce?null:t)))}function ag(i){let t=Object.values(i.tags).reduce((n,s)=>n+s,0),e=i.last_run;return m("a",{class:"card proj",href:`#/p/${i.id}/overview`},m("div",{class:"row between"},m("h3",{},i.id),m("span",{class:"pill"},i.origin)),m("p",{class:"muted small clamp"},i.name||"(name not extracted)"),Mc(i.tags),m("div",{class:"kv small"},m("span",{},`${t} values \xB7 ${i.tags["Missing-Flagged"]||0} missing`),m("span",{},`${i.drawings} drawing file(s)`),m("span",{},e?`last run ${e.id} \u2014 ${e.state}`:"not run in the app")))}async function og(i,t,e){let s=(await yt.projects()).find(l=>l.id===i);if(!s)throw new Error(`no project ${i}`);let r=m("nav",{class:"tabs"},sg.map(([l,c])=>m("a",{href:`#/p/${i}/${l}`,class:l===t?"on":""},c))),a=m("section",{class:"tabbody"},m("div",{class:"muted"},"Loading\u2026"));bo.replaceChildren(yc(i),m("main",{class:"page wide"},m("div",{class:"row between"},m("div",{},m("h1",{},i),m("p",{class:"muted"},s.name||"")),m("div",{class:"row"},ce?null:m("a",{class:"btn primary",href:`/api/projects/${encodeURIComponent(i)}/report`,target:"_blank"},"Calculation report"),On(yt.descUrl(i),"Description JSON","btn ghost"))),r,a));let o={overview:()=>cg(i),drawings:()=>hg(i,e),values:()=>dg(i),decisions:()=>pg(i),model:()=>mg(i),sections:()=>gg(i),loads:()=>vg(i),moving:()=>Do(i,Fn,as,So,si),analysis:()=>_g(i),design:()=>xg(i),girder:()=>_c(i,si),verification:()=>yg(i),run:()=>Mg(i)};a.replaceChildren(await(o[t]||o.overview)())}function Fn(i,t){if(!i)return null;let e=i.source==="run"?`App run ${i.run}${i.engine_commit?` \xB7 engine ${i.engine_commit}`:""}`:`Repository output ${i.file} (commit ${i.engine_commit||"?"})`;return m("div",{class:"alert warn small"},m("b",{},"INDICATIVE \u2014 not design-approved. "),`${e}. `,i.allow_proposed!==!1?"Uses PROPOSED inputs (decisions not yet accepted by the engineer)":"Accepted inputs only",t&&t.length?`: ${t.join(", ")}.`:"."," Standards values code-extracted, UNVERIFIED.")}var lg=[["drawings","Drawings"],["values","Bridge data"],["geometry","Geometry"],["sections","Sections"],["model","Model, SW/SDL, modes"],["mct","MIDAS .mct"],["actions","Loads & combinations"],["design","Design checks"],["report","Report"]];async function cg(i){let[t,e,n,s,r,a]=await Promise.all([yt.latest(i),yt.values(i,!0),yt.drawings(i),yt.result(i,"model_view.json"),yt.result(i,"girder_checks.json"),yt.result(i,"combined_actions.json")]),o={};e.rows.forEach(M=>o[M.tag]=(o[M.tag]||0)+1);let l=e.rows.filter(Mo).length,c=M=>M==="drawings"?n.files.length?"done":"waiting":M==="values"?o["Missing-Flagged"]===e.rows.length?"waiting":"done":t?.steps.find(w=>w.key===M)?.state||"not run",u=m("div",{class:"pipe"},lg.map(([M,w],v)=>[v?m("span",{class:"arrow"},"\u2192"):null,m("a",{class:`stage s-${c(M).replace(/ /g,"")}`,href:`#/p/${i}/${M==="geometry"||M==="mct"||M==="report"?"run":M==="actions"?"analysis":M}`},m("b",{},w),m("span",{class:"small"},c(M)))])),d=m("input",{type:"checkbox",checked:!0}),p=m("button",{class:"btn primary",onclick:async()=>{try{await yt.run(i,d.checked),location.hash=`#/p/${i}/run`}catch(M){alert(M.message)}}},"Run the chain"),g=r.data?pr(r.data):null,_=g?g.reduce((M,w)=>w.u>M.u?w:M):null,x=a.data?Object.entries(a.data.schedule.piles).map(([M,w])=>({k:M,N:w.ULS?.N?.max,Ns:w.SLS?.N?.max})):[],f=x.length?x.reduce((M,w)=>w.N>M.N?w:M):null,h=[rs("Bridge data",`${e.rows.length} values`,`${o.Direct||0} Direct \xB7 ${o.Calculated||0} Calculated \xB7 ${o["Missing-Flagged"]||0} Missing`,`#/p/${i}/values`),rs("Needs review",String(l),"Missing, Assumed or proposed values",`#/p/${i}/values?review=1`,l?"warn":""),rs("Self weight / SDL",s.data?`${ot(-s.data.cases.SW.applied_kN[2],0)} / ${ot(-(s.data.cases.SDL.total_kN||0),0)} kN`:"\u2014",s.data?`equilibrium residual ${s.data.cases.SW.equilibrium_residual_kN.toExponential(1)} kN`:"run the chain",`#/p/${i}/model`),rs("Worst girder utilisation",_?ot(_.u,2):"\u2014",_?`${_.g} \xB7 ${_.what}`:"no design results",`#/p/${i}/design`,_?zi(_.u):""),rs("Max pile axial (ULS)",f?`${ot(f.N,0)} kN`:"\u2014",f?`pile ${f.k} \xB7 SLS ${ot(f.Ns,0)} kN`:"no results",`#/p/${i}/analysis`)];return m("div",{},m("div",{class:"card"},m("div",{class:"row between"},m("h3",{},"Pipeline"),ce?m("span",{class:"small muted"},"Runs start in the app on your computer"):m("div",{class:"row"},m("label",{class:"small"},d," use proposed inputs (provisional)"),p)),u,t&&t.revision!==void 0&&t.revision!==e.revision?.number?m("div",{class:"alert warn small"},`The bridge data changed since the last run (run used revision ${t.revision}, now ${e.revision?.number}). Results below are out of date: run the chain again.`):null,m("p",{class:"small muted"},t?`Last run ${t.id}: ${t.state}${t.finished?`, finished ${t.finished}`:""}.`:"Not run in the app yet \u2014 results below (if any) are the outputs committed in the repository.")),m("div",{class:"grid tiles"},h),Fn(r.meta||s.meta,s.data?.provisional_decisions),m("div",{class:"card"},m("h3",{},"Data quality"),Mc(o),m("div",{class:"row wrap small"},ki.filter(M=>o[M]).map(M=>m("span",{},Ue(M)," ",o[M])))))}var rs=(i,t,e,n,s="")=>m("a",{class:`card tile ${s}`,href:n},m("div",{class:"small muted"},i),m("div",{class:"big"},t),m("div",{class:"small muted"},e)),Mo=i=>i.tag==="Missing-Flagged"||i.tag==="Assumed"||i.proposed||i.status==="proposed";async function hg(i,t){let e=await yt.drawings(i),n=m("form",{class:"row",onsubmit:async f=>{f.preventDefault(),await yt.upload(i,new FormData(f.target)),si()}},m("input",{type:"file",name:"drawings",accept:"application/pdf",multiple:!0}),m("button",{class:"btn"},"Upload"));if(ce&&!e.files.length)return be("Drawings are not in the online copy","Drawings stay on your computer (they are confidential). Upload them in the app on your computer.");if(!e.files.length)return m("div",{},be("No drawings uploaded","Upload the PDF drawing set. Drawings are stored in the app's data folder only (never committed to the repository)."),n);let s=ce?null:await ug(i),r=f=>e.documents.find(h=>h.id===f)?.number||f,a=e.files.flatMap(f=>f.pages.map(h=>({file:f.file,...h}))),o=t.get("doc"),l=Math.max(0,o?a.findIndex(f=>f.documents.includes(o)):0),c=1,u=m("img",{class:"sheet",alt:"drawing page"}),d=m("div",{class:"small"}),p=m("div",{class:"pagelist"}),g=()=>{let f=a[l];u.src=yt.pageUrl(i,f.file,f.page,c>1.5?220:130),u.style.width=`${c*100}%`,d.textContent=`${f.file} \u2014 page ${f.page} of ${a.filter(h=>h.file===f.file).length}${f.documents.length?" \xB7 "+f.documents.map(r).join(", "):""}`,[...p.children].forEach((h,M)=>h.classList.toggle("on",M===l)),p.children[l]?.scrollIntoView({block:"nearest"})};a.forEach((f,h)=>p.append(m("button",{class:"pg",onclick:()=>{l=h,g()}},m("b",{},`p${f.page}`)," ",f.documents.join(", ")||m("span",{class:"muted"},f.file))));let _=f=>()=>{c=Math.min(4,Math.max(.5,c*f)),g()},x=m("div",{class:"toolbar"},m("button",{class:"btn ghost",onclick:()=>{l=Math.max(0,l-1),g()}},"\u25C0"),m("button",{class:"btn ghost",onclick:()=>{l=Math.min(a.length-1,l+1),g()}},"\u25B6"),m("button",{class:"btn ghost",onclick:_(1/1.4)},"\u2212"),m("button",{class:"btn ghost",onclick:_(1.4)},"+"),m("button",{class:"btn ghost",onclick:()=>{c=1,g()}},"Fit"),d);return setTimeout(g),m("div",{},s,m("div",{class:"row between"},m("span",{class:"small muted"},`${a.length} pages in ${e.files.length} file(s)`),n),m("div",{class:"drawings"},p,m("div",{class:"sheetwrap"},x,m("div",{class:"sheetscroll"},u))))}async function ug(i){let[t,e,n]=await Promise.all([yt.settings(),yt.extractLatest(i),yt.projects()]),s=n.find(h=>h.id===i),r=m("div",{class:"card"}),a=m("span",{class:"small muted"}),o=m("input",{type:"password",placeholder:t.api_key_set?`key saved (${t.api_key_hint})`:"Anthropic API key (sk-ant-\u2026)",size:34,autocomplete:"off"}),l=m("input",{placeholder:"all pages (or e.g. 1-20)",size:18}),c=m("pre",{class:"log small"}),u=m("details",{},m("summary",{},"Reading report: accepted, conflicts, rejected"),m("pre",{class:"log small"},e?.report||"")),d=h=>{if(!h)return"Not read yet.";let M=h.summary;return h.state==="running"?`Reading\u2026 (started ${h.started})`:h.state==="failed"?`Reading failed (${h.finished}). See the log.`:`Read ${h.finished}: ${M?.values??0} values kept from ${M?.documents??0} documents, ${M?.conflicts??0} conflicts left for you, ${M?.rejected??0} proposals rejected by the checks.`},p=m("div",{class:"small"},d(e)),g=async()=>{let h=await yt.extractLatest(i);p.textContent=d(h),c.textContent=(h?.log||[]).join(`
`),c.hidden=!c.textContent,h?.state==="running"?setTimeout(g,2500):h&&(u.querySelector("pre").textContent=h.report||"",a.textContent=h.state==="done"?"Done: open Bridge data and Decisions to review, then Run.":"")},_=async()=>{try{let h=await yt.saveSettings({api_key:o.value});o.value="",o.placeholder=h.api_key_set?`key saved (${h.api_key_hint})`:"Anthropic API key",a.textContent="Key saved on this computer."}catch(h){a.textContent=h.message}},x=async()=>{a.textContent="";try{await yt.extract(i,l.value.trim()||void 0),setTimeout(g,800)}catch(h){a.textContent=h.message}},f=s?.origin==="uploaded";return r.append(m("h3",{},"Read the drawings with Claude"),m("p",{class:"small muted"},"Each page is sent to Claude, which proposes the values printed on it. The platform keeps a value only if its text is found on the page, every number is printed there, and any arithmetic re-computes; disagreements between sheets stay Missing for you to decide. Drawings are sent to Anthropic\u2019s API with your key."),t.from_env?m("div",{class:"small"},"API key: from the ANTHROPIC_API_KEY environment variable."):m("div",{class:"row wrap"},o,m("button",{class:"btn ghost",onclick:_},"Save key")),f?m("div",{class:"row wrap"},l,m("button",{class:"btn",onclick:x},"Read drawings"),a):m("div",{class:"small muted"},"This bridge\u2019s data is in the repository or already reviewed; create a new bridge to read drawings."),p,c,u),e?.state==="running"?setTimeout(g,500):c.textContent=(e?.log||[]).slice(-30).join(`
`),c.hidden=!c.textContent,u.hidden=!e?.report,r}async function dg(i){let t=new URLSearchParams(location.hash.split("?")[1]||""),[{rows:e,revision:n},s]=await Promise.all([yt.values(i,!0),yt.drawings(i)]),r=n?.number??n,a=h=>h?s.documents.find(M=>M.id===h||M.id.endsWith(h)||M.number?.endsWith(h))?.id:void 0,o=[...new Set(e.map(h=>h.path.split(/[.[]/)[0]))],l={q:"",tag:"",group:"",review:t.get("review")==="1"},c={};e.forEach(h=>c[h.tag]=(c[h.tag]||0)+1);let u=m("tbody"),d=m("span",{class:"small muted"}),p=()=>{let h=e.filter(M=>(!l.tag||M.tag===l.tag)&&(!l.group||M.path.startsWith(l.group))&&(!l.review||Mo(M))&&(!l.q||(M.path+" "+(M.note||"")+" "+ot(M.value)).toLowerCase().includes(l.q)));d.textContent=`${h.length} of ${e.length} values \xB7 description revision ${r}`,u.replaceChildren(...h.slice(0,1500).map(M=>{let w=a(M.sheet);return m("tr",{class:`r-${M.tag.replace(/[^A-Za-z]/g,"")}`},m("td",{class:"mono"},M.path),m("td",{class:"val"},ot(M.value)),m("td",{},M.unit||""),m("td",{},Ue(M.tag),M.proposed?m("span",{class:"pill warn",title:`proposed override, decision ${M.decision}; drawing record: ${M.original_tag}`},"proposed"):null),m("td",{},w?m("a",{href:`#/p/${i}/drawings?doc=${encodeURIComponent(w)}`},M.sheet):M.sheet||"",M.view?m("div",{class:"small muted"},M.view):null),m("td",{class:"small"},M.derivation?m("div",{},"= ",M.derivation):null,M.note||"",M.replace_with?m("div",{class:"muted"},"needs: ",M.replace_with):null),m("td",{class:"small"},M.decision||"",ce||!Mo(M)?null:m("button",{class:"btn ghost small",onclick:v=>f(v,M)},"Enter value")))}))},g=m("div",{class:"row wrap"},m("button",{class:"chip on",onclick:h=>_("",h)},`All ${e.length}`),ki.filter(h=>c[h]).map(h=>m("button",{class:"chip",onclick:M=>_(h,M)},Ue(h),` ${c[h]}`))),_=(h,M)=>{l.tag=h,g.querySelectorAll(".chip").forEach(w=>w.classList.remove("on")),M.currentTarget.classList.add("on"),p()},x=m("input",{type:"checkbox",checked:l.review,onchange:h=>{l.review=h.target.checked,p()}}),f=(h,M)=>{let w=h.currentTarget.closest("tr");if(w.nextElementSibling?.classList.contains("editrow")){w.nextElementSibling.remove();return}let v=M.value!==null&&typeof M.value=="object",B=m(v?"textarea":"input",{rows:3});B.value=v?JSON.stringify(M.value):M.value===null||M.value===void 0?"":String(M.value);let C=m("input",{value:M.unit||"",size:6}),T=m("select",{},["Direct","Input-user","Confirmed-Engineer"].map(U=>m("option",{value:U},U))),P=m("input",{placeholder:"drawing / sheet (Direct)",value:M.sheet||""}),E=m("input",{placeholder:"view / table / note on sheet"}),S=m("input",{placeholder:"where the value comes from / why",size:40}),R=m("div",{class:"small"}),X=async()=>{let U=B.value.trim();if(v)try{U=JSON.parse(String(U))}catch{R.textContent='Table row must be JSON, e.g. {"item": "T_max", "value": 45}';return}else U!==""&&!Number.isNaN(Number(U))&&(U=Number(U));R.textContent="Saving\u2026";try{let H=await yt.enterValue(i,{path:M.path,value:U,unit:C.value||null,tag:T.value,sheet:P.value,view:E.value,reason:S.value,by:as()});R.textContent=`Saved as ${H.decision} (accepted by ${as()}). Reloading\u2026`,setTimeout(si,900)}catch(H){R.className="small bad",R.textContent=H.message}};w.after(m("tr",{class:"editrow"},m("td",{colspan:7},m("div",{class:"row wrap"},m("b",{},M.path),B,C,T,P,E,S,So(),m("button",{class:"btn primary",onclick:X},"Save and accept")),R)))};return setTimeout(p),m("div",{},m("div",{class:"card filters"},g,m("div",{class:"row wrap"},m("input",{type:"search",placeholder:"Search path, value or note",oninput:h=>{l.q=h.target.value.toLowerCase(),p()}}),m("select",{onchange:h=>{l.group=h.target.value,p()}},m("option",{value:""},"All sections"),o.map(h=>m("option",{value:h},h))),m("label",{class:"small"},x," Needs review only"),d)),m("div",{class:"tablewrap tall"},m("table",{class:"values"},m("thead",{},m("tr",{},["Path","Value","Unit","Data source","Sheet","Note / derivation","Decision"].map(h=>m("th",{},h)))),u)))}var bc={get:i=>{try{return localStorage.getItem(i)||""}catch{return""}},set:(i,t)=>{try{localStorage.setItem(i,t)}catch{}}},as=()=>bc.get("pdf2bim.name"),So=()=>m("input",{placeholder:"your name",value:as(),size:16,oninput:i=>bc.set("pdf2bim.name",i.target.value)});async function fg(i){let t=await yt.revisions(i),e=m("div"),n=async(s,r)=>{let a=await yt.revDiff(i,s,r);e.replaceChildren(m("h3",{},`Changes from revision ${s} to ${r} (${a.rows.length})`),ae(["Path","From","To","Proposals added","Decision"],a.rows.slice(0,500).map(o=>[m("span",{class:"mono"},o.path),m("span",{},ot(o.from)," ",Ue(o.from_tag)),m("span",{},ot(o.to)," ",Ue(o.to_tag)),o.proposals_added||"",o.decision||""])),a.rows.length>500?m("p",{class:"small muted"},`first 500 of ${a.rows.length}`):"")};return m("div",{class:"card"},m("h3",{},"Revision history of the bridge data"),ae(["Revision","Date","By","Note",""],t.map((s,r)=>[String(s.number)+(s.current?" (current)":""),s.created||"\u2014",s.author||"\u2014",m("span",{class:"small"},s.note||""),r<t.length-1&&!ce?m("button",{class:"btn ghost small",onclick:()=>n(t[r+1].number,s.number)},`Changes from ${t[r+1].number}`):""]),"txt"),e)}async function pg(i){let[{items:t,revision:e},n]=await Promise.all([yt.decisions(i),fg(i)]);if(!t.length)return m("div",{},be("No decisions waiting","Every proposed value has been accepted or rejected."),n);let s=r=>{let a=m("input",{placeholder:"note (required to reject)",size:36}),o=m("div",{class:"small"}),l=u=>async()=>{o.className="small",o.textContent=u?"Accepting\u2026":"Rejecting\u2026";try{let d=await yt.decide(i,r.id,{by:as(),accept:u,note:a.value});o.textContent=d.message+" \u2014 run the chain again to update the results.",setTimeout(si,2500)}catch(d){o.className="small bad",o.textContent=d.message}},c={};return r.values.forEach(u=>c[u.tag]=(c[u.tag]||0)+1),m("div",{class:"card"},m("div",{class:"row between wrap"},m("h3",{},`${r.id} \u2014 proposed by ${r.by}`),m("span",{class:"small muted"},r.date)),m("p",{},r.reason),m("div",{class:"row wrap small"},`${r.values.length} value(s), tags now on record: `,Object.entries(c).map(([u,d])=>m("span",{},Ue(u)," ",d))),m("p",{class:"small muted"},`Affects: ${r.affects.join(", ")||"\u2014"} \xB7 evidence: ${r.evidence.join("; ")||"\u2014"} \xB7 outputs made out of date: ${r.outputs.length||"none recorded"}`),m("details",{},m("summary",{class:"small"},"Show the values"),ae(["Path","Value","Tag"],r.values.map(u=>[m("span",{class:"mono"},u.path),ot(u.value),Ue(u.tag)]))),ce?null:m("div",{class:"row wrap",style:"margin-top:10px"},So(),a,m("button",{class:"btn primary",onclick:l(!0)},"Accept"),m("button",{class:"btn",onclick:l(!1)},"Reject")),o)};return m("div",{},m("div",{class:"alert warn small"},`Description revision ${e}. Accepting makes every value of the decision part of the bridge record, under your name; a new revision is written and the previous one kept in history. Only a person can accept (the AI cannot).`),t.map(s),n)}async function mg(i){let t=await yt.result(i,"model_view.json");return t.data?m("div",{},Fn(t.meta,t.data.provisional_decisions),pc(t.data)):be("No model yet",m("span",{},"Run the chain from the ",m("a",{href:`#/p/${i}/overview`},"Overview")," tab to build the integrated model."))}function xc(i){let t=[...i.outline,...i.deck||[]],e=t.map(p=>p[0]),n=t.map(p=>p[1]),s=Math.min(...e)-150,r=Math.max(...e)+150,a=Math.min(...n)-150,o=Math.max(...n)+150,l=p=>p.map(g=>`${g[0].toFixed(1)},${(-g[1]).toFixed(1)}`).join(" "),c=i.composite?.yc,u=i.girder?.yc,d=document.createElementNS("http://www.w3.org/2000/svg","svg");return d.setAttribute("viewBox",`${s} ${-o} ${r-s} ${o-a}`),d.setAttribute("class","secsvg"),d.innerHTML=(i.deck?`<polygon points="${l(i.deck)}" class="sec-deck"/>`:"")+`<polygon points="${l(i.outline)}" class="sec-girder" fill-rule="evenodd"/>`+(c!==void 0?`<line x1="${s}" x2="${r}" y1="${-c}" y2="${-c}" class="sec-na"/><text x="${r-10}" y="${-c-20}" text-anchor="end" class="sec-t">composite centroid ${c.toFixed(0)}</text>`:"")+(u!==void 0?`<line x1="${s}" x2="${r}" y1="${-u}" y2="${-u}" class="sec-na g"/><text x="${s+10}" y="${-u-20}" class="sec-t">girder centroid ${u.toFixed(0)}</text>`:""),d}async function gg(i){let t=await yt.result(i,"sections.json");if(!t.data)return be("No section properties","Run the chain to compute them.");let e=t.data.girders,n=Object.keys(e).sort(),s=m("div"),r=m("select",{onchange:l=>o(l.target.value)},n.map(l=>m("option",{value:l},l))),a=l=>l===void 0?"\u2014":ot(l/1e9,2),o=l=>{let c=e[l],u=c.stations[Math.floor(c.stations.length/2)],d=c.solid_end?.A;s.replaceChildren(m("div",{class:"grid two"},m("div",{class:"card"},m("h3",{},`${l} \u2014 ${c.type} at midspan (open)`),xc(u)),d?m("div",{class:"card"},m("h3",{},`${l} \u2014 solid end zone`),xc(d)):null),m("div",{class:"card"},m("h3",{},"Properties along the girder (mm, mm\xB2, \xD710\u2079 mm\u2074)"),ae(["t","Deck width","Girder A","Girder yc","Girder Ix","Girder J","Composite A (transformed)","Composite yc","Composite Ix","Composite J"],c.stations.map(p=>[ot(p.t,2),ot(p.deck_left+p.deck_right,0),ot(p.girder.A,0),ot(p.girder.yc,1),a(p.girder.Ix),a(p.girder.J),ot(p.composite.A_transformed,0),ot(p.composite.yc,1),a(p.composite.Ix),a(p.composite.J_geometric)]),"num"),m("p",{class:"small muted"},`Super-T ${c.type} (${c.type_ref||""}), haunch ${c.haunch??"\u2014"} mm, length end to end ${ot(c.length_end_to_end,3)} m. y from the girder soffit. `,(t.data.notes||[]).join(" "))))};return setTimeout(()=>o(n[0])),m("div",{},Fn(t.meta),m("div",{class:"row between"},m("span",{class:"small muted"},`E girder ${t.data.E_girder_MPa} MPa \xB7 E deck ${t.data.E_deck_MPa} MPa \xB7 modular ratio ${ot(t.data.modular_ratio_deck,4)} \xB7 deck ${t.data.deck_thickness} mm`),r),s)}async function _g(i){let[t,e]=await Promise.all([yt.result(i,"model_view.json"),yt.result(i,"combined_actions.json")]),n=m("div",{},Fn(e.meta||t.meta,t.data?.provisional_decisions));if(t.data){let o=t.data,l=c=>{let u={n:"",z:0};for(let[d,p]of Object.entries(o.cases[c].u))o.nodes[d]?.[3]==="girder"&&p[2]<u.z&&(u={n:d,z:p[2]});return u};n.append(m("div",{class:"card"},m("h3",{},"Permanent load cases (unfactored)"),ae(["Case","Applied (kN)","Max girder deflection (mm)","Equilibrium residual (kN)"],["SW","SDL"].filter(c=>o.cases[c]).map(c=>[c==="SW"?"Self weight":"Superimposed dead load",ot(-o.cases[c].applied_kN[2],1),ot(-l(c).z*1e3,1),o.cases[c].equilibrium_residual_kN.toExponential(2)]))))}if(t.data?.modes?.length){let o=t.data.modes,l={X:0,Y:0,Z:0};n.append(m("div",{class:"card"},m("h3",{},`Natural modes (${o.length}) \u2014 mass: ${t.data.mass_rule}`),ae(["Mode","Period T (s)","f (Hz)","Mass X","Mass Y","Mass Z","Cumulative X / Y / Z"],o.slice(0,12).map(c=>(["X","Y","Z"].forEach(u=>l[u]+=c.eff[u]),[c.n,ot(c.T,3),ot(c.f,2),ot(100*c.eff.X,1)+" %",ot(100*c.eff.Y,1)+" %",ot(100*c.eff.Z,1)+" %",`${ot(100*l.X,0)} / ${ot(100*l.Y,0)} / ${ot(100*l.Z,0)} %`])),"num"),m("p",{class:"small muted"},`First 12 of ${o.length} shown; X = global easting, Y = northing. Mode shapes: Model 3D tab.`)))}else t.data?.modes_note&&n.append(m("div",{class:"alert warn small"},t.data.modes_note));if(!e.data)return n.append(be("No combined actions","Run the chain to compute loads and AS 5100.2 combinations.")),n;let s=e.data.schedule,r=(o,l)=>m("span",{class:"small muted"},o?.[l]||""),a=(o,l)=>m("td",{},ot(o,0),l?m("div",{},l):null);return n.append(m("div",{class:"card"},m("h3",{},"Bearings \u2014 vertical / transverse / longitudinal (kN)"),ae(["Bearing","ULS V max","ULS V min","SLS V max","SLS V min","ULS H transverse \xB1","ULS H longitudinal \xB1"],Object.entries(s.bearings).map(([o,l])=>[o,a(l.ULS.v.max,r(l.ULS.v,"gmax")),a(l.ULS.v.min,r(l.ULS.v,"gmin")),a(l.SLS.v.max),a(l.SLS.v.min),`${ot(l.ULS.tr.max,0)} / ${ot(l.ULS.tr.min,0)}`,`${ot(l.ULS.lon.max,0)} / ${ot(l.ULS.lon.min,0)}`]),"num")),m("div",{class:"card"},m("h3",{},"Piles (kN, kN\xB7m)"),ae(["Pile","ULS N max","ULS N min","SLS N max","SLS N min","ULS M long.","ULS M trans.","ULS M resultant (upper)","SLS M long.","SLS M trans."],Object.entries(s.piles).map(([o,l])=>[o,a(l.ULS.N.max,r(l.ULS.N,"gmax")),a(l.ULS.N.min,r(l.ULS.N,"gmin")),a(l.SLS.N.max),a(l.SLS.N.min),a(l.ULS.Ml.abs,r(l.ULS.Ml,"gov")),a(l.ULS.Mt.abs,r(l.ULS.Mt,"gov")),a(e.data.pile_resultants?.[o]?.resultant_upper),a(l.SLS.Ml.abs),a(l.SLS.Mt.abs)]),"num"),m("p",{class:"small muted"},"Resultant (upper) = the larger of the ellipse resultant and the non-concurrent bound of the two moments, as computed by the actions step.")),m("div",{class:"card"},m("h3",{},"Girders \u2014 design actions (kN, kN\xB7m)"),ae(["Girder","ULS M sag","ULS M hog","ULS V","ULS T","SLS M sag"],Object.entries(s.girders).sort().map(([o,l])=>[o,a(l.ULS.M_sag.value,r(l.ULS.M_sag,"gov")),a(l.ULS.M_hog.value),a(l.ULS.V.abs),a(l.ULS.T.abs),a(l.SLS.M_sag.value)]),"num")),m("div",{class:"card"},m("h3",{},"Sills / headstocks (kN\xB7m, kN)"),ae(["Support","ULS My max","ULS My min","ULS Vz","ULS T"],Object.entries(s.sills).map(([o,l])=>[o,a(l.ULS.My_max.value),a(l.ULS.My_min.value),a(l.ULS.Vz.abs),a(l.ULS.T?.abs)]),"num")),m("p",{class:"small muted"},`${e.data.governing_rows?.length||0} governing combination rows; ${e.data.not_combined?.length||0} actions not combined. Full schedule: `,On(yt.fileUrl(i,"combined_actions.md"),"combined_actions.md")," \xB7 ",On(yt.fileUrl(i,"workbook.xlsx"),"Excel workbook (bearings, piles, girders, bridge data)"))),n}async function vg(i){let[t,{rows:e}]=await Promise.all([yt.loads(i),yt.values(i,!0)]),n=m("div",{},Fn(t.meta)),s={group:"",onOnly:!1},r=d=>Object.entries(d).map(([p,g])=>m("span",{class:"chipline",title:p},Ue(p),` ${g}`)),a=d=>d.on?m("span",{class:"pill ok"},"in the latest run"):d.not_combined?m("span",{class:"pill warn",title:d.not_combined},"not combined"):t.meta?m("span",{class:"pill"},"no load case"):m("span",{class:"muted small"},"no run yet"),o=m("tbody"),l=()=>o.replaceChildren(...t.actions.filter(d=>(!s.group||d.group===s.group)&&(!s.onOnly||d.on)).map(d=>m("tr",{class:d.on?"":"muted"},m("td",{class:"mono"},d.id),m("td",{},d.name,m("div",{class:"small muted"},d.group_name)),m("td",{},a(d),d.not_combined?m("div",{class:"small muted"},d.not_combined):null),m("td",{class:"small"},d.source||""),m("td",{class:"small"},d.inputs.map(p=>m("div",{},m("a",{href:`#/p/${i}/values?q=${encodeURIComponent(p.path.split(" (")[0])}`,class:"mono"},p.path)," ",p.state?r(p.state.tags):m("span",{class:"muted"},"no record")))),m("td",{class:"num"},ot(d.factors.uls,2)),m("td",{class:"num"},ot(d.factors.uls_relieving,2)),m("td",{class:"num"},ot(d.factors.sls,2)),m("td",{class:"small"},d.clause?`Cl ${d.clause}`:"",m("div",{class:"muted"},d.status))))),c=[...new Map(t.actions.map(d=>[d.group,d.group_name])).entries()];n.append(m("div",{class:"card"},m("h3",{},"Load cases \u2014 AS 5100.2 action register"),m("p",{class:"small muted"},'Every action the combination generator knows. "In the latest run" = the chain built a load case for it and combined it; "not combined" = the description has no usable input for it (enter the value on Bridge data and re-run). Load factors are standards entries with their verification status; they are not edited per project.'),m("div",{class:"row wrap"},m("select",{onchange:d=>{s.group=d.target.value,l()}},m("option",{value:""},"All groups"),c.map(([d,p])=>m("option",{value:d},p))),m("label",{class:"small"},m("input",{type:"checkbox",onchange:d=>{s.onOnly=d.target.checked,l()}})," In the run only"),m("span",{class:"small muted"},`${t.actions.filter(d=>d.on).length} of ${t.actions.length} actions in the latest run`)),m("div",{class:"tablewrap"},m("table",{class:"values"},m("thead",{},m("tr",{},["Action","Name","State","Load case built","Inputs (description)","\u03B3 ULS","\u03B3 relieving","\u03B3 SLS","Clause / status"].map(d=>m("th",{},d)))),o))));let u=e.filter(d=>d.path.startsWith("loads."));if(n.append(m("div",{class:"card"},m("h3",{},"Load intensities (description records)"),m("p",{class:"small muted"},`${u.length} records under loads.*; `,m("a",{href:`#/p/${i}/values`},"edit on Bridge data")," (each edit is a decision with history; a change marks the run stale)."),ae(["Path","Value","Unit","Data source","Note"],u.map(d=>[m("td",{class:"mono"},d.path),ot(d.value),d.unit||"",m("td",{},Ue(d.tag)),m("td",{class:"small"},d.note||"")]),"values"))),t.rows.length){let d={ls:"ULS",col:""},p=m("tbody"),g=m("span",{class:"small muted"}),_=()=>{let f=t.rows.filter(h=>h.ls===d.ls&&(!d.col||h.col===d.col));g.textContent=`${f.length} rows`,p.replaceChildren(...f.slice(0,600).map(h=>m("tr",{},m("td",{class:"mono"},h.name),m("td",{class:"small"},`Cl ${h.clause} \u2014 ${h.type}`,m("div",{class:"muted"},h.pe)),m("td",{class:"small"},h.terms.map(([M,w])=>m("span",{class:"term"},`${ot(w,2)} \xD7 ${M}`))))))},x=[...new Set(t.rows.map(f=>f.col))];n.append(m("div",{class:"card"},m("h3",{},`Combination matrix \u2014 ${t.n_rows} generated rows (read-only)`),m("p",{class:"small muted"},"Generated by the AS 5100.2 Cl 23 rules from the actions in the latest run. The governing rows per response are on the Analysis tab. Factors: ",t.standards_status||"","."),m("div",{class:"row wrap"},["ULS","SLS"].map(f=>m("button",{class:"chip"+(d.ls===f?" on":""),onclick:h=>{d.ls=f,h.currentTarget.parentElement.querySelectorAll(".chip").forEach((M,w)=>M.classList.toggle("on",w===(f==="ULS"?0:1))),_()}},f)),m("select",{onchange:f=>{d.col=f.target.value,_()}},m("option",{value:""},"All types"),x.map(f=>m("option",{value:f},`${t.types[f]?.clause||f} ${t.types[f]?.title||""}`))),g),m("div",{class:"tablewrap tall"},m("table",{class:"values"},m("thead",{},m("tr",{},["Row","Type","Terms (factor \xD7 action)"].map(f=>m("th",{},f)))),p)))),setTimeout(_)}else n.append(be("No combinations yet","Run the chain; the combination rows are generated from the actions the run builds."));return setTimeout(l),n}async function xg(i){let t=await yt.result(i,"girder_checks.json");if(!t.data)return be("No design checks","Run the chain to check the girders.");let e=t.data,n=pr(e),s=n.map(f=>f.g),r=e[s[0]].rows.map(f=>f.t),a=f=>m("td",{class:`uc ${zi(f)}`},f===void 0?"\u2014":ot(f,2)),o=(f,h,M)=>m("div",{class:"card"},m("h3",{},h),ae(["Girder",...r.map(w=>`t=${ot(w,2)}`)],s.map(w=>[w,...e[w].rows.map(v=>a(M(v)))]),"heat")),l=m("div"),c=m("select",{onchange:f=>u(f.target.value)},s.map(f=>m("option",{value:f},f))),u=f=>l.replaceChildren(ae(["t","x (m)","zone","strands","Ms*/Mal","M*/\u03C6Mu sag","M*/\u03C6Mu hog","Muo \u2265 1.2Mcr","shear/torsion u"],e[f].rows.map(h=>[ot(h.t,2),ot(h.x_m,2),h.conf,h.n_strands??"",a(h.sag?.uS),a(h.sag?.uB),a(h.hog?.uB),h.conf==="solid"||!h.sag?m("span",{class:"muted"},"n/a"):h.sag.okMin?"ok":m("b",{class:"bad"},"FAIL"),a(h.shear?.u)]),"num"),m("p",{class:"small muted"},"Solid end zones: shear only (flexure / SLS not checked there)."));setTimeout(()=>u(s[0]));let d=e[s[0]].notes||[],p=m("div"),g=m("select",{onchange:f=>_(f.target.value)},s.map(f=>m("option",{value:f},f))),_=f=>{let h=e[f].hog;if(!h?.times?.length){p.replaceChildren(m("p",{class:"muted small"},"No hog results in this run (re-run the chain)."));return}let M=h.times.flatMap(X=>X.hog_mm),w=Math.min(0,...M),v=Math.max(1,...M),B=640,C=220,T=X=>40+(B-60)*(X-h.x_m[0])/(h.x_m[h.x_m.length-1]-h.x_m[0]||1),P=X=>10+(C-40)*(v-X)/(v-w),E=["#1f6feb","#2da44e","#bf8700","#cf222e","#8250df","#57606a"],S=document.createElementNS("http://www.w3.org/2000/svg","svg");S.setAttribute("viewBox",`0 0 ${B} ${C}`),S.setAttribute("class","hogsvg"),S.innerHTML=`<line x1="40" x2="${B-20}" y1="${P(0)}" y2="${P(0)}" stroke="currentColor" stroke-opacity=".3"/><text x="4" y="${P(v)+4}" font-size="11" fill="currentColor">${ot(v,0)}</text><text x="4" y="${P(0)+4}" font-size="11" fill="currentColor">0</text><text x="${B-20}" y="${C-6}" font-size="11" text-anchor="end" fill="currentColor">${ot(h.x_m[h.x_m.length-1],1)} m</text>`+h.times.map((X,U)=>`<polyline fill="none" stroke="${E[U%E.length]}" stroke-width="2" points="${X.hog_mm.map((H,Z)=>`${T(h.x_m[Z]).toFixed(1)},${P(H).toFixed(1)}`).join(" ")}"/>`).join("");let R=Math.floor(h.x_m.length/2);p.replaceChildren(S,m("div",{class:"row wrap small"},h.times.map((X,U)=>m("span",{style:`color:${E[U%E.length]}`},`\u25A0 ${X.label}`))),ae(["Time","t (days)","Hog at mid-length (mm)","Max hog (mm)"],h.times.map(X=>[X.label,ot(X.t,0),ot(X.hog_mm[R],1),ot(Math.max(...X.hog_mm),1)]),"num"))};setTimeout(()=>_(s[0]));let x=m("div");return yt.values(i,!0).then(f=>{let h=f.rows.filter(M=>/hog/i.test(M.path)&&M.tag==="Direct");h.length&&x.replaceChildren(m("h3",{},"Hog printed on the drawings (for comparison)"),ae(["Field","Value","Source"],h.map(M=>[M.path,typeof M.value=="object"?Object.entries(M.value||{}).map(([w,v])=>`${w}: ${v}`).join("; "):String(M.value),[M.sheet,M.view].filter(Boolean).join(", ")])))}).catch(()=>{}),m("div",{},Fn(t.meta),m("div",{class:"card"},m("h3",{},"Summary \u2014 maximum utilisation per girder"),ae(["Girder","Governing","ULS bending","SLS stress","Shear / torsion","Minimum strength fails"],n.map(f=>[f.g,m("td",{class:"left"},m("b",{},f.what)),a(f.uB),a(f.uS),a(f.uV),f.minFail?m("b",{class:"bad"},String(f.minFail)):"0"]),"num"),m("p",{class:"small muted"},"Utilisation = action / capacity; > 1.00 red, > 0.90 amber. Stations at fractions t of the span.")),o("uB","ULS bending M*/\u03C6Mu (sagging) along the girders",f=>f.sag?.uB),o("uV","Shear / torsion utilisation along the girders",f=>f.shear?.u),m("div",{class:"card"},m("div",{class:"row between"},m("h3",{},"Station detail"),c),l),m("div",{class:"card"},m("div",{class:"row between"},m("h3",{},`Girder hog (camber) \u2014 ${e[s[0]].hog_method} losses method, + up`),g),p,m("p",{class:"small muted"},"From the prestress-loss / camber analysis of this run, at each reported time (transfer, erection, deck pour, final). Check the drawing's basis (e.g. self weight only) before comparing; whether a difference is acceptable is the engineer's call."),x),d.length?m("div",{class:"card small"},m("h3",{},"Method notes"),m("ul",{},d.map(f=>m("li",{},f)))):null,m("p",{class:"small muted"},"Full report: ",On(yt.fileUrl(i,"girder_checks.md"),"girder_checks.md")," \xB7 Exports: ",On(yt.fileUrl(i,"workbook.xlsx"),"Excel workbook")," \xB7 ",On(yt.fileUrl(i,"report.docx"),"Word report")," \xB7 ",On(yt.fileUrl(i,"report.html"),"Calculation report")))}async function yg(i){let t=await yt.verification(i),e=m("div",{},Fn(t.meta)),n=s=>s===null?"u-na":Math.abs(s)<=5?"u-ok":Math.abs(s)<=15?"u-warn":"u-fail";return t.printed.length?e.append(m("div",{class:"card"},m("h3",{},"Platform results against values printed on the drawings"),ae(["Item","Drawing","Platform","Difference","Source","Note"],t.printed.map(s=>{let r=s.platform===null||s.platform===void 0?null:100*(s.platform-s.reference)/s.reference;return[m("span",{},s.item,s.governing?m("div",{class:"small muted"},`governing pile ${s.governing}; per pile: ${(s.piles||[]).map(a=>`${a.pile} ${ot(a.platform,0)}`).join(", ")}`):null),`${ot(s.reference,0)} ${s.unit}`,s.platform===null||s.platform===void 0?"\u2014":`${ot(s.platform,0)} ${s.unit}`,m("td",{class:`uc ${n(r)}`},r===null?"\u2014":`${r>0?"+":""}${ot(r,1)} %`),s.source,m("span",{class:"small"},s.note||"")]}),"num"),m("p",{class:"small muted"},"Where the drawing gives one value for several piles (an envelope), it is compared with the platform maximum over those piles. Colour shows the size of the difference only (green \u2264 5 %, amber \u2264 15 %, red above); whether a difference is acceptable is the engineer's call. Reference values are the drawing values tagged Direct in the bridge data."))):e.append(be("No printed design actions in the bridge data","When the drawings print design loads (e.g. pile loads), record them in the bridge data and they are compared here after every run.")),t.midas_runs.length&&e.append(m("div",{class:"card"},m("h3",{},`Independent MIDAS Civil runs (${t.midas_runs.length})`),t.midas_runs.map(s=>m("details",{},m("summary",{},m("b",{},s.run)," \u2014 ",s.title),m("pre",{class:"md"},s.text))))),e}async function Mg(i){let t=m("div"),e=s=>{if(!s){t.replaceChildren(be("No runs yet",m("span",{},"Start one from the ",m("a",{href:`#/p/${i}/overview`},"Overview"),".")));return}let r=m("pre",{class:"log"},s.log||"");t.replaceChildren(m("div",{class:"card"},m("div",{class:"row between"},m("h3",{},`Run ${s.id} \u2014 ${s.state}`),m("span",{class:"small muted"},`${s.allow_proposed?"proposed inputs used (provisional)":"accepted inputs only"} \xB7 engine ${s.engine_commit||"?"} \xB7 ${s.description}`)),ae(["Step","State","Time (s)"],s.steps.map(a=>[a.title,m("span",{class:`state s-${a.state}`},a.state),a.seconds??""]))),m("div",{class:"card"},m("h3",{},"Files from this run"),m("div",{class:"row wrap"},s.files.map(a=>On(yt.fileUrl(i,a),a,"btn ghost")))),m("div",{class:"card"},m("h3",{},"Log"),r)),r.scrollTop=r.scrollHeight,s.state!=="running"&&clearInterval(yo)},n=await yt.latest(i);return e(n),n?.state==="running"&&(yo=window.setInterval(async()=>e(await yt.latest(i)),2500)),t}si();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
