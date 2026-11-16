async function fe(n){if(!n.ok)throw new Error(`${n.status} ${(await n.text()).replace(/<[^>]+>/g," ").trim().slice(0,300)}`);return n.json()}var ge=n=>`/api/projects/${encodeURIComponent(n)}`,ce=window.PDF2BIM_STATIC||null,Ac=n=>n.replace(/^\//,"").replace(/\?/g,"__").replace(/=/g,"-").replace(/&/g,"__")+".json",pe=(n,t)=>ce?t?.method&&t.method!=="GET"?Promise.reject(new Error("This online copy is read-only. Upload drawings and run the chain in the app on your computer.")):window.fetch("data/"+Ac(n)):window.fetch(n,t),vt={projects:()=>pe("/api/projects").then(n=>fe(n)),create:n=>pe("/api/projects",{method:"POST",body:n}).then(t=>fe(t)),values:(n,t)=>pe(`${ge(n)}/values?allow_proposed=${t?1:0}`).then(e=>fe(e)),drawings:n=>pe(`${ge(n)}/drawings`).then(t=>fe(t)),upload:(n,t)=>pe(`${ge(n)}/drawings`,{method:"POST",body:t}).then(e=>fe(e)),pageUrl:(n,t,e,i)=>`${ge(n)}/drawings/${encodeURIComponent(t)}/${e}.png?dpi=${i}`,run:(n,t)=>pe(`${ge(n)}/runs`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({allow_proposed:t})}).then(e=>fe(e)),latest:n=>pe(`${ge(n)}/runs/latest`).then(t=>fe(t)),result:(n,t)=>pe(`${ge(n)}/results/${t}`).then(e=>fe(e)),decisions:n=>pe(`${ge(n)}/decisions`).then(t=>fe(t)),decide:(n,t,e)=>pe(`${ge(n)}/decisions/${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then(i=>fe(i)),enterValue:(n,t)=>pe(`${ge(n)}/values`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).then(e=>fe(e)),verification:n=>pe(`${ge(n)}/verification`).then(t=>fe(t)),revisions:n=>pe(`${ge(n)}/revisions`).then(t=>fe(t)),revDiff:(n,t,e)=>pe(`${ge(n)}/revisions/${t}/${e}`).then(i=>fe(i)),saveBatch:(n,t)=>pe(`${ge(n)}/values/batch`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).then(e=>fe(e)),loads:n=>pe(`${ge(n)}/loads`).then(t=>fe(t)),settings:()=>pe("/api/settings").then(n=>fe(n)),saveSettings:n=>pe("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}).then(t=>fe(t)),extract:(n,t)=>pe(`${ge(n)}/extract`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t?{pages:t}:{})}).then(e=>fe(e)),extractLatest:n=>pe(`${ge(n)}/extract/latest`).then(t=>fe(t)),fileUrl:(n,t)=>ce?null:`${ge(n)}/files/${encodeURIComponent(t)}`,descUrl:n=>ce?null:`${ge(n)}/description.json`};function p(n,t={},...e){let i=document.createElement(n);for(let[s,r]of Object.entries(t))r==null||r===!1||(typeof r=="function"?i.addEventListener(s.replace(/^on/,""),r):s==="class"?i.className=String(r):s==="html"?i.innerHTML=String(r):i.setAttribute(s,r===!0?"":String(r)));return Lo(i,e),i}function Lo(n,t){for(let e of t)e==null||e===!1||(Array.isArray(e)?Lo(n,e):n.append(e instanceof Node?e:document.createTextNode(String(e))))}var rt=(n,t)=>n==null?"\u2014":typeof n=="number"?t===void 0?String(n):n.toLocaleString("en-AU",{maximumFractionDigits:t,minimumFractionDigits:t}):typeof n=="object"?Object.entries(n).map(([e,i])=>`${e}: ${i}`).join(" \xB7 "):String(n),ki=["Direct","Calculated","Confirmed-Engineer","Input-user","Standard-verify","Model","Assumed","Missing-Flagged"],Ie=n=>p("span",{class:`tag t-${(n||"none").replace(/[^A-Za-z]/g,"")}`},n||"\u2014");function zi(n){return n==null||Number.isNaN(n)?"u-na":n>1?"u-fail":n>.9?"u-warn":"u-ok"}function re(n,t,e=""){return p("div",{class:"tablewrap"},p("table",{class:e},p("thead",{},p("tr",{},n.map(i=>p("th",{},i)))),p("tbody",{},t.map(i=>p("tr",{},i.map(s=>s instanceof HTMLElement&&s.tagName==="TD"?s:p("td",{},s)))))))}var be=(n,t)=>p("div",{class:"empty"},p("h3",{},n),p("p",{},t));var Vi={M:["Bending moment","kN\xB7m"],V:["Shear force","kN"],R:["Bearing reaction","kN"]},he={model:"",key:"",side:"max"};async function Do(n,t,e,i,s){let[r,{rows:a}]=await Promise.all([vt.result(n,"traffic.json"),vt.values(n,!0)]),o=p("div",{},t(r.meta)),l=a.filter(T=>T.path.startsWith("loads.lane_layouts.rows")),c=a.filter(T=>T.path==="deck.carriageway_left"||T.path==="deck.carriageway_right"||T.path.startsWith("deck.carriageways")),u=[],f=p("tbody"),m=()=>f.replaceChildren(...l.map(T=>{let P=T.value;return p("tr",{},p("td",{},P?.name??""),p("td",{class:"mono"},P?.lanes??""),p("td",{},Ie(T.tag)),p("td",{class:"small muted"},T.path))}),...u.map((T,P)=>p("tr",{class:"r-Inputuser"},p("td",{},T.name),p("td",{class:"mono"},T.lanes),p("td",{},p("span",{class:"pill warn"},"new, not saved")),p("td",{},p("button",{class:"btn ghost small",onclick:()=>{u.splice(P,1),m()}},"remove"))))),g=p("input",{placeholder:"layout name, e.g. two lanes left",size:22}),_=p("input",{placeholder:"lane left edges, m from the control line, e.g. -6.2, -3.0",size:36}),v=p("input",{placeholder:"reason (recorded with the decision)",size:32}),d=p("div",{class:"small"}),h=()=>{if(!g.value.trim()||!_.value.trim()){d.textContent="Give the layout a name and its lane left edges.";return}u.push({name:g.value.trim(),lanes:_.value.trim()}),g.value="",_.value="",d.textContent="",m()},M=async T=>{if(!u.length){d.textContent="Nothing to save.";return}d.textContent="Saving\u2026";try{let P=await vt.saveBatch(n,{by:e(),reason:v.value||"lane layouts entered on the Moving loads tab",items:[],new_rows:u.map(E=>({table:"loads.lane_layouts",cells:E}))});d.textContent=`Saved as ${P.decision} (${P.changed} values).`,u.length=0,T?(await vt.run(n,!0),d.textContent+=" Run started: the traffic envelope now uses these layouts."):setTimeout(s,900)}catch(P){d.textContent=P.message}};if(o.append(p("div",{class:"card"},p("h3",{},"Lane layouts"),p("p",{class:"small muted"},"AS 5100.2 standard design lanes of ",p("b",{},rt(r.data?.lane_width??3.2,1)," m"),' placed across the carriageway. With no layouts entered the engine sweeps the lane set across the carriageway at the sweep step and envelopes every position (MIDAS "lane sweep"); layouts entered here replace the sweep, each row being one lane set the envelope checks (MIDAS lane sets). Carriageway: ',c.map(T=>p("span",{class:"chipline"},p("span",{class:"mono"},T.path.replace("deck.",""))," ",rt(T.value)," ",Ie(T.tag))),". Accompanying lane factors ",(r.data?.lane_factors||[]).join(" / ")," (standards entry, unverified)."),p("div",{class:"tablewrap"},p("table",{class:"values"},p("thead",{},p("tr",{},["Layout","Lane left edges (m)","Data source",""].map(T=>p("th",{},T)))),f)),p("div",{class:"row wrap"},g,_,p("button",{class:"btn ghost",onclick:h},"Add layout"),v,i(),p("button",{class:"btn primary",onclick:()=>M(!1)},"Save"),p("button",{class:"btn",onclick:()=>M(!0)},"Save and re-run"),d))),setTimeout(m),!r.data)return o.append(be("No moving-load results yet","Run the chain: the actions step writes the lane layouts, governing load positions and influence lines (traffic.json).")),o;let b=r.data;(!he.model||!b.models.includes(he.model))&&(he.model=b.models[0]);let x=b.responses;(!he.key||!x.some(T=>T.key===he.key))&&(he.key=x.filter(T=>T.kind==="M").reduce((T,P)=>(b.states[he.model][P.key]?.max?.value??-1e99)>(b.states[he.model][T.key]?.max?.value??-1e99)?P:T,x[0]).key);let D=p("div"),C=()=>{let T=x.find(R=>R.key===he.key),P=b.states[he.model]?.[he.key]?.[he.side],E=(R,N,q,tt)=>p("div",{class:"row wrap small"},p("span",{class:"muted"},R),N.map(([et,lt])=>p("button",{class:"chip"+(et===q?" on":""),onclick:()=>{tt(et),C()}},lt))),w=[...new Set(x.map(R=>R.girder))],I=x.filter(R=>R.girder===T.girder&&R.kind===T.kind).sort((R,N)=>R.ch-N.ch),G=`${Vi[T.kind][0]} ${T.kind==="R"?"at bearing "+T.key.replace(":R",""):"of "+T.girder+" at ch "+rt(T.ch,2)}`,B=p("div",{class:"card"},p("h3",{},"Governing load position"),E("Vehicle",b.models.map(R=>[R,R]),he.model,R=>he.model=R),E("Quantity",Object.keys(Vi).filter(R=>x.some(N=>N.kind===R)).map(R=>[R,Vi[R][0]]),T.kind,R=>{he.key=(x.find(N=>N.kind===R&&N.girder===T.girder)||x.find(N=>N.kind===R)).key}),E("Side",[["max","Maximum"],["min","Minimum"]],he.side,R=>he.side=R),E("Girder",w.map(R=>[R,R]),T.girder,R=>{he.key=(x.find(N=>N.girder===R&&N.kind===T.kind)||x.find(N=>N.girder===R)).key}),T.kind!=="R"?p("div",{class:"row wrap small"},p("span",{class:"muted"},"Station"),p("select",{onchange:R=>{he.key=R.target.value,C()}},I.map(R=>p("option",{value:R.key,selected:R.key===he.key},`ch ${rt(R.ch,2)} (${R.key.split(":")[1]})`)))):null);if(!P){D.replaceChildren(B,be("No state",`The run has no ${he.side} state for ${G}.`));return}let z=(R,N,q)=>p("div",{class:"card tile"},p("div",{class:"small muted"},R),p("div",{class:"big"},N),p("div",{class:"small muted"},q)),Z=P.loads.filter(R=>R[2]>1).length,X=p("div",{class:"grid tiles"},z(G,rt(P.value,1)+" "+Vi[T.kind][1],`${he.model} characteristic (DLA and lane factors, no load factor)`),z("Lane layout",`${b.layouts.findIndex(R=>R.length===P.layout.length&&R.every((N,q)=>Math.abs(N-P.layout[q])<.001))+1||"?"} of ${b.layouts.length}`,`${b.layout_mode}: lane left edges ${P.layout.map(R=>rt(R,2)).join(", ")} m`),z("Loads",`${Z} wheel points`,`${P.loads.length-Z} patterned UDL bands; factors ${P.factors.map(R=>R[1]).join(" / ")}`));D.replaceChildren(B,X,p("div",{class:"card"},Cc(b,T,P)),p("div",{class:"card"},p("h3",{},"Lane ranking"),re(["Lane left edge (m)","Accompanying factor"],P.factors.map(R=>[rt(R[0],2),rt(R[1],2)]),"num")),p("div",{class:"card"},p("h3",{},"Influence lines"),p("p",{class:"small muted"},`${G} per 1 kN moving along each lane centre of the first layout (offsets ${b.il_offsets.map(R=>rt(R,2)).join(", ")} m); dashed lines mark the wheel positions of the governing state.`),Rc(b,T,P)))};return o.append(D),setTimeout(C),o}function Cc(n,t,e){let i=n.plan.deck.map(x=>x[0]),s=n.plan.deck.map(x=>x[1]),r=Math.min(...i)-1,a=Math.max(...i)+1,o=Math.min(...s)-.8,l=Math.max(...s)+.8,c=1e3,u=(c-60)/(a-r),f=Math.max(220,Math.min(520,(l-o)*u)),m=f/((l-o)*u),g=f+50,_=x=>30+(x-r)*u,v=x=>20+(l-x)*u*m,d="http://www.w3.org/2000/svg",h=document.createElementNS(d,"svg");h.setAttribute("viewBox",`0 0 ${c} ${g}`),h.setAttribute("class","plan"),h.setAttribute("role","img");let M=(x,D,C)=>{let T=document.createElementNS(d,x);for(let[P,E]of Object.entries(D))T.setAttribute(P,String(E));if(C){let P=document.createElementNS(d,"title");P.textContent=C,T.append(P)}return h.append(T),T};for(let[x,D]of n.carriageways)M("rect",{x:_(r+1),y:v(D),width:(a-r-2)*u,height:(D-x)*u*m,fill:"none",stroke:"#8a96a3","stroke-dasharray":"4 3"});e.layout.forEach((x,D)=>{let C=e.factors.find(P=>Math.abs(P[0]-x)<.001)?.[1]||0;M("rect",{x:_(r+1),y:v(x+n.lane_width),width:(a-r-2)*u,height:n.lane_width*u*m,fill:C?"#c98a2b":"#8a96a3",opacity:C?.1+.12*C:.06,stroke:"#c98a2b"},`lane ${D+1}: ${x} to ${(x+n.lane_width).toFixed(2)} m${C?", factor "+C:", not adverse"}`);let T=M("text",{x:_(r+1)+6,y:v(x+n.lane_width/2)+4,"font-size":11,fill:"#c98a2b"});T.textContent=`lane ${D+1}${C?" \xD7 "+C:""}`});for(let x of e.loads)x[2]<=1&&M("rect",{x:_(x[3]-.125),y:v(x[1]),width:Math.max(1,(x[4]-x[3]+.25)*u),height:Math.max(1,(x[1]-x[0])*u*m),fill:"#c98a2b",opacity:.3},`patterned UDL ch ${x[3]}\u2013${x[4]} m, offsets ${x[0]}\u2013${x[1]} m`);for(let[x,D]of Object.entries(n.plan.girders))for(let C of D){let T=x===t.girder&&t.kind!=="R"&&Math.abs(C.a[0]-t.ch)<1e-6||x===t.girder&&t.kind!=="R"&&Math.abs(C.b[0]-t.ch)<1e-6;M("line",{x1:_(C.a[0]),y1:v(C.a[1]),x2:_(C.b[0]),y2:v(C.b[1]),stroke:T?"#13202c":"#0b7aa3","stroke-width":T?5:2.5},`${x} member ${C.id}`)}for(let x of n.plan.bearings){let D=t.kind==="R"&&t.key.startsWith(x.id+":");M("path",{d:`M${_(x.ch)} ${v(x.o)+3}l-6 10h12z`,fill:D?"#13202c":"#b3261e"},`bearing ${x.id}`)}for(let x of e.loads)x[2]>1&&M("circle",{cx:_(x[3]),cy:v(x[0]),r:3+2*Math.sqrt(x[2]/60),fill:"#b3261e",opacity:.85,stroke:"#fff"},`${x[2]} kN at ch ${x[3]}, offset ${x[0]}`);for(let[x,D]of Object.entries(n.plan.girders)){let C=D[0],T=M("text",{x:4,y:v(C.a[1])+4,"font-size":11});T.textContent=x}let b=M("text",{x:c-8,y:g-6,"text-anchor":"end","font-size":11,fill:"#5b6770"});return b.textContent=`chainage along the bridge, m \xB7 offsets from the control line (right +)${m!==1?" \xB7 transverse scale \xD7 "+m.toFixed(2):""} \xB7 red dots: wheel loads (size \u221D load) \xB7 bands: patterned UDL`,p("div",{class:"tablewrap"},h)}function Rc(n,t,e){let i=n.il[t.key]||[];if(!i.length)return p("p",{class:"muted small"},"No influence line stored for this response.");let s=1e3,r=280,a=50,o=20,l=n.grid,c=l[0],u=l[l.length-1],f=i.flat(),m=Math.min(0,...f),g=Math.max(0,...f);g===m&&(g=m+1);let _=C=>a+(C-c)/(u-c)*(s-a-10),v=C=>o+(g-C)/(g-m)*(r-o-30),d="http://www.w3.org/2000/svg",h=document.createElementNS(d,"svg");h.setAttribute("viewBox",`0 0 ${s} ${r}`),h.setAttribute("class","plan");let M=(C,T)=>{let P=document.createElementNS(d,C);for(let[E,w]of Object.entries(T))P.setAttribute(E,String(w));return h.append(P),P};M("line",{x1:a,x2:s-10,y1:v(0),y2:v(0),stroke:"#8a96a3"}),M("line",{x1:a,x2:a,y1:o,y2:r-30,stroke:"#8a96a3"});let b=["#0b7aa3","#c98a2b","#2e7d32","#7b1fa2","#b3261e","#00838f","#6d4c41"];i.forEach((C,T)=>{M("path",{d:C.map((E,w)=>(w?"L":"M")+_(l[w]).toFixed(1)+" "+v(E).toFixed(1)).join(""),fill:"none",stroke:b[T%b.length],"stroke-width":1.6});let P=M("text",{x:s-12,y:o+14+14*T,"text-anchor":"end","font-size":11,fill:b[T%b.length]});P.textContent=`lane centre ${rt(n.il_offsets[T],2)} m`});let x=new Set;for(let C of e.loads)C[2]>1&&!x.has(C[3])&&(x.add(C[3]),M("line",{x1:_(C[3]),x2:_(C[3]),y1:o,y2:r-30,stroke:"#b3261e","stroke-dasharray":"3 3",opacity:.6}));[m,0,g].forEach(C=>{let T=M("text",{x:a-4,y:v(C)+4,"text-anchor":"end","font-size":11});T.textContent=rt(C,3)}),[c,(c+u)/2,u].forEach(C=>{let T=M("text",{x:_(C),y:r-12,"text-anchor":"middle","font-size":11});T.textContent="ch "+rt(C,1)});let D=M("text",{x:a+4,y:o+12,"font-size":11,fill:"#5b6770"});return D.textContent=`${Vi[t.kind][1]} per kN`,p("div",{class:"tablewrap"},h)}var ao="170",ni={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},ii={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Pc=0,Uo=1,Ic=2;var Vl=1,Lc=2,fn=3,Un=0,Le=1,pn=2,Ln=0,Si=1,No=2,Oo=3,Fo=4,Dc=5,$n=100,Uc=101,Nc=102,Oc=103,Fc=104,Bc=200,kc=201,zc=202,Vc=203,Xr=204,$r=205,Hc=206,Gc=207,Wc=208,Xc=209,$c=210,Yc=211,qc=212,Zc=213,Jc=214,Yr=0,qr=1,Zr=2,Ai=3,Jr=4,jr=5,Kr=6,Qr=7,Hl=0,jc=1,Kc=2,Dn=0,Qc=1,th=2,eh=3,nh=4,ih=5,sh=6,rh=7;var Gl=300,Ci=301,Ri=302,ta=303,ea=304,cr=306,na=1e3,Zn=1001,ia=1002,je=1003,ah=1004;var cs=1005;var sn=1006,gr=1007;var Jn=1008;var vn=1009,Wl=1010,Xl=1011,Ki=1012,oo=1013,jn=1014,mn=1015,ss=1016,lo=1017,co=1018,Pi=1020,$l=35902,Yl=1021,ql=1022,Ze=1023,Zl=1024,Jl=1025,wi=1026,Ii=1027,jl=1028,ho=1029,Kl=1030,uo=1031;var fo=1033,Ns=33776,Os=33777,Fs=33778,Bs=33779,sa=35840,ra=35841,aa=35842,oa=35843,la=36196,ca=37492,ha=37496,ua=37808,da=37809,fa=37810,pa=37811,ma=37812,ga=37813,_a=37814,va=37815,xa=37816,ya=37817,Ma=37818,ba=37819,Sa=37820,wa=37821,ks=36492,Ea=36494,Ta=36495,Ql=36283,Aa=36284,Ca=36285,Ra=36286;var zs=2300,Pa=2301,_r=2302,Bo=2400,ko=2401,zo=2402;var oh=3200,lh=3201;var ch=0,hh=1,In="",ze="srgb",Ui="srgb-linear",hr="linear",Qt="srgb";var ai=7680;var Vo=519,uh=512,dh=513,fh=514,tc=515,ph=516,mh=517,gh=518,_h=519,Ho=35044;var Go="300 es",gn=2e3,Vs=2001,xn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let i=this._listeners[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Se=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Wo=1234567,Zi=Math.PI/180,Qi=180/Math.PI;function Ni(){let n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Se[n&255]+Se[n>>8&255]+Se[n>>16&255]+Se[n>>24&255]+"-"+Se[t&255]+Se[t>>8&255]+"-"+Se[t>>16&15|64]+Se[t>>24&255]+"-"+Se[e&63|128]+Se[e>>8&255]+"-"+Se[e>>16&255]+Se[e>>24&255]+Se[i&255]+Se[i>>8&255]+Se[i>>16&255]+Se[i>>24&255]).toLowerCase()}function Ee(n,t,e){return Math.max(t,Math.min(e,n))}function po(n,t){return(n%t+t)%t}function vh(n,t,e,i,s){return i+(n-t)*(s-i)/(e-t)}function xh(n,t,e){return n!==t?(e-n)/(t-n):0}function Ji(n,t,e){return(1-e)*n+e*t}function yh(n,t,e,i){return Ji(n,t,1-Math.exp(-e*i))}function Mh(n,t=1){return t-Math.abs(po(n,t*2)-t)}function bh(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*(3-2*n))}function Sh(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*n*(n*(n*6-15)+10))}function wh(n,t){return n+Math.floor(Math.random()*(t-n+1))}function Eh(n,t){return n+Math.random()*(t-n)}function Th(n){return n*(.5-Math.random())}function Ah(n){n!==void 0&&(Wo=n);let t=Wo+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ch(n){return n*Zi}function Rh(n){return n*Qi}function Ph(n){return(n&n-1)===0&&n!==0}function Ih(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Lh(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Dh(n,t,e,i,s){let r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+i)/2),u=a((t+i)/2),f=r((t-i)/2),m=a((t-i)/2),g=r((i-t)/2),_=a((i-t)/2);switch(s){case"XYX":n.set(o*u,l*f,l*m,o*c);break;case"YZY":n.set(l*m,o*u,l*f,o*c);break;case"ZXZ":n.set(l*f,l*m,o*u,o*c);break;case"XZX":n.set(o*u,l*_,l*g,o*c);break;case"YXY":n.set(l*g,o*u,l*_,o*c);break;case"ZYZ":n.set(l*_,l*g,o*u,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function yi(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Te(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var ec={DEG2RAD:Zi,RAD2DEG:Qi,generateUUID:Ni,clamp:Ee,euclideanModulo:po,mapLinear:vh,inverseLerp:xh,lerp:Ji,damp:yh,pingpong:Mh,smoothstep:bh,smootherstep:Sh,randInt:wh,randFloat:Eh,randFloatSpread:Th,seededRandom:Ah,degToRad:Ch,radToDeg:Rh,isPowerOfTwo:Ph,ceilPowerOfTwo:Ih,floorPowerOfTwo:Lh,setQuaternionFromProperEuler:Dh,normalize:Te,denormalize:yi},kt=class n{constructor(t=0,e=0){n.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,i=this.y,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6],this.y=s[1]*e+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Ee(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let i=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*i-a*s+t.x,this.y=r*s+a*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Nt=class n{constructor(t,e,i,s,r,a,o,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,a,o,l,c)}set(t,e,i,s,r,a,o,l,c){let u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=i,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],u=i[4],f=i[7],m=i[2],g=i[5],_=i[8],v=s[0],d=s[3],h=s[6],M=s[1],b=s[4],x=s[7],D=s[2],C=s[5],T=s[8];return r[0]=a*v+o*M+l*D,r[3]=a*d+o*b+l*C,r[6]=a*h+o*x+l*T,r[1]=c*v+u*M+f*D,r[4]=c*d+u*b+f*C,r[7]=c*h+u*x+f*T,r[2]=m*v+g*M+_*D,r[5]=m*d+g*b+_*C,r[8]=m*h+g*x+_*T,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-i*r*u+i*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=u*a-o*c,m=o*l-u*r,g=c*r-a*l,_=e*f+i*m+s*g;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/_;return t[0]=f*v,t[1]=(s*c-u*i)*v,t[2]=(o*i-s*a)*v,t[3]=m*v,t[4]=(u*e-s*l)*v,t[5]=(s*r-o*e)*v,t[6]=g*v,t[7]=(i*l-c*e)*v,t[8]=(a*e-i*r)*v,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(vr.makeScale(t,e)),this}rotate(t){return this.premultiply(vr.makeRotation(-t)),this}translate(t,e){return this.premultiply(vr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<9;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},vr=new Nt;function nc(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Hs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Uh(){let n=Hs("canvas");return n.style.display="block",n}var Xo={};function Yi(n){n in Xo||(Xo[n]=!0,console.warn(n))}function Nh(n,t,e){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(t,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:i()}}setTimeout(r,e)})}function Oh(n){let t=n.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Fh(n){let t=n.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var Xt={enabled:!0,workingColorSpace:Ui,spaces:{},convert:function(n,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===Qt&&(n.r=_n(n.r),n.g=_n(n.g),n.b=_n(n.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(n.applyMatrix3(this.spaces[t].toXYZ),n.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===Qt&&(n.r=Ei(n.r),n.g=Ei(n.g),n.b=Ei(n.b))),n},fromWorkingColorSpace:function(n,t){return this.convert(n,this.workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===In?hr:this.spaces[n].transfer},getLuminanceCoefficients:function(n,t=this.workingColorSpace){return n.fromArray(this.spaces[t].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,t,e){return n.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace}};function _n(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ei(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var $o=[.64,.33,.3,.6,.15,.06],Yo=[.2126,.7152,.0722],qo=[.3127,.329],Zo=new Nt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Jo=new Nt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Xt.define({[Ui]:{primaries:$o,whitePoint:qo,transfer:hr,toXYZ:Zo,fromXYZ:Jo,luminanceCoefficients:Yo,workingColorSpaceConfig:{unpackColorSpace:ze},outputColorSpaceConfig:{drawingBufferColorSpace:ze}},[ze]:{primaries:$o,whitePoint:qo,transfer:Qt,toXYZ:Zo,fromXYZ:Jo,luminanceCoefficients:Yo,outputColorSpaceConfig:{drawingBufferColorSpace:ze}}});var oi,Ia=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{oi===void 0&&(oi=Hs("canvas")),oi.width=t.width,oi.height=t.height;let i=oi.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=oi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Hs("canvas");e.width=t.width,e.height=t.height;let i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=_n(r[a]/255)*255;return i.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(_n(e[i]/255)*255):e[i]=_n(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Bh=0,Gs=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Bh++}),this.uuid=Ni(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(xr(s[a].image)):r.push(xr(s[a]))}else r=xr(s);i.url=r}return e||(t.images[this.uuid]=i),i}};function xr(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ia.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var kh=0,Ve=class n extends xn{constructor(t=n.DEFAULT_IMAGE,e=n.DEFAULT_MAPPING,i=Zn,s=Zn,r=sn,a=Jn,o=Ze,l=vn,c=n.DEFAULT_ANISOTROPY,u=In){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:kh++}),this.uuid=Ni(),this.name="",this.source=new Gs(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new kt(0,0),this.repeat=new kt(1,1),this.center=new kt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Nt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Gl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case na:t.x=t.x-Math.floor(t.x);break;case Zn:t.x=t.x<0?0:1;break;case ia:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case na:t.y=t.y-Math.floor(t.y);break;case Zn:t.y=t.y<0?0:1;break;case ia:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ve.DEFAULT_IMAGE=null;Ve.DEFAULT_MAPPING=Gl;Ve.DEFAULT_ANISOTROPY=1;var ue=class n{constructor(t=0,e=0,i=0,s=1){n.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,s){return this.x=t,this.y=e,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*i+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*i+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*i+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*i+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,s,r,l=t.elements,c=l[0],u=l[4],f=l[8],m=l[1],g=l[5],_=l[9],v=l[2],d=l[6],h=l[10];if(Math.abs(u-m)<.01&&Math.abs(f-v)<.01&&Math.abs(_-d)<.01){if(Math.abs(u+m)<.1&&Math.abs(f+v)<.1&&Math.abs(_+d)<.1&&Math.abs(c+g+h-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let b=(c+1)/2,x=(g+1)/2,D=(h+1)/2,C=(u+m)/4,T=(f+v)/4,P=(_+d)/4;return b>x&&b>D?b<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(b),s=C/i,r=T/i):x>D?x<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),i=C/s,r=P/s):D<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(D),i=T/r,s=P/r),this.set(i,s,r,e),this}let M=Math.sqrt((d-_)*(d-_)+(f-v)*(f-v)+(m-u)*(m-u));return Math.abs(M)<.001&&(M=1),this.x=(d-_)/M,this.y=(f-v)/M,this.z=(m-u)/M,this.w=Math.acos((c+g+h-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},La=class extends xn{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ue(0,0,t,e),this.scissorTest=!1,this.viewport=new ue(0,0,t,e);let s={width:t,height:e,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:sn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new Ve(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let a=i.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let i=0,s=t.textures.length;i<s;i++)this.textures[i]=t.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Gs(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},yn=class extends La{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}},Ws=class extends Ve{constructor(t=null,e=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=je,this.minFilter=je,this.wrapR=Zn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Da=class extends Ve{constructor(t=null,e=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=je,this.minFilter=je,this.wrapR=Zn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Qe=class{constructor(t=0,e=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=s}static slerpFlat(t,e,i,s,r,a,o){let l=i[s+0],c=i[s+1],u=i[s+2],f=i[s+3],m=r[a+0],g=r[a+1],_=r[a+2],v=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f;return}if(o===1){t[e+0]=m,t[e+1]=g,t[e+2]=_,t[e+3]=v;return}if(f!==v||l!==m||c!==g||u!==_){let d=1-o,h=l*m+c*g+u*_+f*v,M=h>=0?1:-1,b=1-h*h;if(b>Number.EPSILON){let D=Math.sqrt(b),C=Math.atan2(D,h*M);d=Math.sin(d*C)/D,o=Math.sin(o*C)/D}let x=o*M;if(l=l*d+m*x,c=c*d+g*x,u=u*d+_*x,f=f*d+v*x,d===1-o){let D=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=D,c*=D,u*=D,f*=D}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,i,s,r,a){let o=i[s],l=i[s+1],c=i[s+2],u=i[s+3],f=r[a],m=r[a+1],g=r[a+2],_=r[a+3];return t[e]=o*_+u*f+l*g-c*m,t[e+1]=l*_+u*m+c*f-o*g,t[e+2]=c*_+u*g+o*m-l*f,t[e+3]=u*_-o*f-l*m-c*g,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,s){return this._x=t,this._y=e,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let i=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(i/2),u=o(s/2),f=o(r/2),m=l(i/2),g=l(s/2),_=l(r/2);switch(a){case"XYZ":this._x=m*u*f+c*g*_,this._y=c*g*f-m*u*_,this._z=c*u*_+m*g*f,this._w=c*u*f-m*g*_;break;case"YXZ":this._x=m*u*f+c*g*_,this._y=c*g*f-m*u*_,this._z=c*u*_-m*g*f,this._w=c*u*f+m*g*_;break;case"ZXY":this._x=m*u*f-c*g*_,this._y=c*g*f+m*u*_,this._z=c*u*_+m*g*f,this._w=c*u*f-m*g*_;break;case"ZYX":this._x=m*u*f-c*g*_,this._y=c*g*f+m*u*_,this._z=c*u*_-m*g*f,this._w=c*u*f+m*g*_;break;case"YZX":this._x=m*u*f+c*g*_,this._y=c*g*f+m*u*_,this._z=c*u*_-m*g*f,this._w=c*u*f-m*g*_;break;case"XZY":this._x=m*u*f-c*g*_,this._y=c*g*f-m*u*_,this._z=c*u*_+m*g*f,this._w=c*u*f+m*g*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let i=e/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,i=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],f=e[10],m=i+o+f;if(m>0){let g=.5/Math.sqrt(m+1);this._w=.25/g,this._x=(u-l)*g,this._y=(r-c)*g,this._z=(a-s)*g}else if(i>o&&i>f){let g=2*Math.sqrt(1+i-o-f);this._w=(u-l)/g,this._x=.25*g,this._y=(s+a)/g,this._z=(r+c)/g}else if(o>f){let g=2*Math.sqrt(1+o-i-f);this._w=(r-c)/g,this._x=(s+a)/g,this._y=.25*g,this._z=(l+u)/g}else{let g=2*Math.sqrt(1+f-i-o);this._w=(a-s)/g,this._x=(r+c)/g,this._y=(l+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ee(this.dot(t),-1,1)))}rotateTowards(t,e){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,e/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let i=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+a*o+s*c-r*l,this._y=s*u+a*l+r*o-i*c,this._z=r*u+a*c+i*l-s*o,this._w=a*u-i*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let i=this._x,s=this._y,r=this._z,a=this._w,o=a*t._w+i*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=i,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let g=1-e;return this._w=g*a+e*this._w,this._x=g*i+e*this._x,this._y=g*s+e*this._y,this._z=g*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),u=Math.atan2(c,o),f=Math.sin((1-e)*u)/c,m=Math.sin(e*u)/c;return this._w=a*f+this._w*m,this._x=i*f+this._x*m,this._y=s*f+this._y*m,this._z=r*f+this._z*m,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},k=class n{constructor(t=0,e=0,i=0){n.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(jo.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(jo.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6]*s,this.y=r[1]*e+r[4]*i+r[7]*s,this.z=r[2]*e+r[5]*i+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*i+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*i+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*i+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,i=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*i),u=2*(o*e-r*s),f=2*(r*i-a*e);return this.x=e+l*c+a*f-o*u,this.y=i+l*u+o*c-r*f,this.z=s+l*f+r*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*s,this.y=r[1]*e+r[5]*i+r[9]*s,this.z=r[2]*e+r[6]*i+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let i=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-i*l,this.z=i*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return yr.copy(this).projectOnVector(t),this.sub(yr)}reflect(t){return this.sub(yr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Ee(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return e*e+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){let s=Math.sin(e)*t;return this.x=s*Math.sin(i),this.y=Math.cos(e)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},yr=new k,jo=new Qe,Mn=class{constructor(t=new k(1/0,1/0,1/0),e=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Xe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Xe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let i=Xe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let r=i.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Xe):Xe.fromBufferAttribute(r,a),Xe.applyMatrix4(t.matrixWorld),this.expandByPoint(Xe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),hs.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),hs.copy(i.boundingBox)),hs.applyMatrix4(t.matrixWorld),this.union(hs)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Xe),Xe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Hi),us.subVectors(this.max,Hi),li.subVectors(t.a,Hi),ci.subVectors(t.b,Hi),hi.subVectors(t.c,Hi),En.subVectors(ci,li),Tn.subVectors(hi,ci),kn.subVectors(li,hi);let e=[0,-En.z,En.y,0,-Tn.z,Tn.y,0,-kn.z,kn.y,En.z,0,-En.x,Tn.z,0,-Tn.x,kn.z,0,-kn.x,-En.y,En.x,0,-Tn.y,Tn.x,0,-kn.y,kn.x,0];return!Mr(e,li,ci,hi,us)||(e=[1,0,0,0,1,0,0,0,1],!Mr(e,li,ci,hi,us))?!1:(ds.crossVectors(En,Tn),e=[ds.x,ds.y,ds.z],Mr(e,li,ci,hi,us))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Xe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Xe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ln[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ln[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ln[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ln[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ln[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ln[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ln[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ln[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ln),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},ln=[new k,new k,new k,new k,new k,new k,new k,new k],Xe=new k,hs=new Mn,li=new k,ci=new k,hi=new k,En=new k,Tn=new k,kn=new k,Hi=new k,us=new k,ds=new k,zn=new k;function Mr(n,t,e,i,s){for(let r=0,a=n.length-3;r<=a;r+=3){zn.fromArray(n,r);let o=s.x*Math.abs(zn.x)+s.y*Math.abs(zn.y)+s.z*Math.abs(zn.z),l=t.dot(zn),c=e.dot(zn),u=i.dot(zn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var zh=new Mn,Gi=new k,br=new k,Kn=class{constructor(t=new k,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let i=this.center;e!==void 0?i.copy(e):zh.setFromPoints(t).getCenter(i);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,i.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Gi.subVectors(t,this.center);let e=Gi.lengthSq();if(e>this.radius*this.radius){let i=Math.sqrt(e),s=(i-this.radius)*.5;this.center.addScaledVector(Gi,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(br.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Gi.copy(t.center).add(br)),this.expandByPoint(Gi.copy(t.center).sub(br))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},cn=new k,Sr=new k,fs=new k,An=new k,wr=new k,ps=new k,Er=new k,Qn=class{constructor(t=new k,e=new k(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,cn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=cn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(cn.copy(this.origin).addScaledVector(this.direction,e),cn.distanceToSquared(t))}distanceSqToSegment(t,e,i,s){Sr.copy(t).add(e).multiplyScalar(.5),fs.copy(e).sub(t).normalize(),An.copy(this.origin).sub(Sr);let r=t.distanceTo(e)*.5,a=-this.direction.dot(fs),o=An.dot(this.direction),l=-An.dot(fs),c=An.lengthSq(),u=Math.abs(1-a*a),f,m,g,_;if(u>0)if(f=a*l-o,m=a*o-l,_=r*u,f>=0)if(m>=-_)if(m<=_){let v=1/u;f*=v,m*=v,g=f*(f+a*m+2*o)+m*(a*f+m+2*l)+c}else m=r,f=Math.max(0,-(a*m+o)),g=-f*f+m*(m+2*l)+c;else m=-r,f=Math.max(0,-(a*m+o)),g=-f*f+m*(m+2*l)+c;else m<=-_?(f=Math.max(0,-(-a*r+o)),m=f>0?-r:Math.min(Math.max(-r,-l),r),g=-f*f+m*(m+2*l)+c):m<=_?(f=0,m=Math.min(Math.max(-r,-l),r),g=m*(m+2*l)+c):(f=Math.max(0,-(a*r+o)),m=f>0?r:Math.min(Math.max(-r,-l),r),g=-f*f+m*(m+2*l)+c);else m=a>0?-r:r,f=Math.max(0,-(a*m+o)),g=-f*f+m*(m+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(Sr).addScaledVector(fs,m),g}intersectSphere(t,e){cn.subVectors(t.center,this.origin);let i=cn.dot(this.direction),s=cn.dot(cn)-i*i,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){let i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,s,r,a,o,l,c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,m=this.origin;return c>=0?(i=(t.min.x-m.x)*c,s=(t.max.x-m.x)*c):(i=(t.max.x-m.x)*c,s=(t.min.x-m.x)*c),u>=0?(r=(t.min.y-m.y)*u,a=(t.max.y-m.y)*u):(r=(t.max.y-m.y)*u,a=(t.min.y-m.y)*u),i>a||r>s||((r>i||isNaN(i))&&(i=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-m.z)*f,l=(t.max.z-m.z)*f):(o=(t.max.z-m.z)*f,l=(t.min.z-m.z)*f),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,e)}intersectsBox(t){return this.intersectBox(t,cn)!==null}intersectTriangle(t,e,i,s,r){wr.subVectors(e,t),ps.subVectors(i,t),Er.crossVectors(wr,ps);let a=this.direction.dot(Er),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;An.subVectors(this.origin,t);let l=o*this.direction.dot(ps.crossVectors(An,ps));if(l<0)return null;let c=o*this.direction.dot(wr.cross(An));if(c<0||l+c>a)return null;let u=-o*An.dot(Er);return u<0?null:this.at(u/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},de=class n{constructor(t,e,i,s,r,a,o,l,c,u,f,m,g,_,v,d){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,a,o,l,c,u,f,m,g,_,v,d)}set(t,e,i,s,r,a,o,l,c,u,f,m,g,_,v,d){let h=this.elements;return h[0]=t,h[4]=e,h[8]=i,h[12]=s,h[1]=r,h[5]=a,h[9]=o,h[13]=l,h[2]=c,h[6]=u,h[10]=f,h[14]=m,h[3]=g,h[7]=_,h[11]=v,h[15]=d,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){let e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,i=t.elements,s=1/ui.setFromMatrixColumn(t,0).length(),r=1/ui.setFromMatrixColumn(t,1).length(),a=1/ui.setFromMatrixColumn(t,2).length();return e[0]=i[0]*s,e[1]=i[1]*s,e[2]=i[2]*s,e[3]=0,e[4]=i[4]*r,e[5]=i[5]*r,e[6]=i[6]*r,e[7]=0,e[8]=i[8]*a,e[9]=i[9]*a,e[10]=i[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,i=t.x,s=t.y,r=t.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){let m=a*u,g=a*f,_=o*u,v=o*f;e[0]=l*u,e[4]=-l*f,e[8]=c,e[1]=g+_*c,e[5]=m-v*c,e[9]=-o*l,e[2]=v-m*c,e[6]=_+g*c,e[10]=a*l}else if(t.order==="YXZ"){let m=l*u,g=l*f,_=c*u,v=c*f;e[0]=m+v*o,e[4]=_*o-g,e[8]=a*c,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=g*o-_,e[6]=v+m*o,e[10]=a*l}else if(t.order==="ZXY"){let m=l*u,g=l*f,_=c*u,v=c*f;e[0]=m-v*o,e[4]=-a*f,e[8]=_+g*o,e[1]=g+_*o,e[5]=a*u,e[9]=v-m*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let m=a*u,g=a*f,_=o*u,v=o*f;e[0]=l*u,e[4]=_*c-g,e[8]=m*c+v,e[1]=l*f,e[5]=v*c+m,e[9]=g*c-_,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let m=a*l,g=a*c,_=o*l,v=o*c;e[0]=l*u,e[4]=v-m*f,e[8]=_*f+g,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=g*f+_,e[10]=m-v*f}else if(t.order==="XZY"){let m=a*l,g=a*c,_=o*l,v=o*c;e[0]=l*u,e[4]=-f,e[8]=c*u,e[1]=m*f+v,e[5]=a*u,e[9]=g*f-_,e[2]=_*f-g,e[6]=o*u,e[10]=v*f+m}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Vh,t,Hh)}lookAt(t,e,i){let s=this.elements;return Ne.subVectors(t,e),Ne.lengthSq()===0&&(Ne.z=1),Ne.normalize(),Cn.crossVectors(i,Ne),Cn.lengthSq()===0&&(Math.abs(i.z)===1?Ne.x+=1e-4:Ne.z+=1e-4,Ne.normalize(),Cn.crossVectors(i,Ne)),Cn.normalize(),ms.crossVectors(Ne,Cn),s[0]=Cn.x,s[4]=ms.x,s[8]=Ne.x,s[1]=Cn.y,s[5]=ms.y,s[9]=Ne.y,s[2]=Cn.z,s[6]=ms.z,s[10]=Ne.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],u=i[1],f=i[5],m=i[9],g=i[13],_=i[2],v=i[6],d=i[10],h=i[14],M=i[3],b=i[7],x=i[11],D=i[15],C=s[0],T=s[4],P=s[8],E=s[12],w=s[1],I=s[5],G=s[9],B=s[13],z=s[2],Z=s[6],X=s[10],R=s[14],N=s[3],q=s[7],tt=s[11],et=s[15];return r[0]=a*C+o*w+l*z+c*N,r[4]=a*T+o*I+l*Z+c*q,r[8]=a*P+o*G+l*X+c*tt,r[12]=a*E+o*B+l*R+c*et,r[1]=u*C+f*w+m*z+g*N,r[5]=u*T+f*I+m*Z+g*q,r[9]=u*P+f*G+m*X+g*tt,r[13]=u*E+f*B+m*R+g*et,r[2]=_*C+v*w+d*z+h*N,r[6]=_*T+v*I+d*Z+h*q,r[10]=_*P+v*G+d*X+h*tt,r[14]=_*E+v*B+d*R+h*et,r[3]=M*C+b*w+x*z+D*N,r[7]=M*T+b*I+x*Z+D*q,r[11]=M*P+b*G+x*X+D*tt,r[15]=M*E+b*B+x*R+D*et,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],f=t[6],m=t[10],g=t[14],_=t[3],v=t[7],d=t[11],h=t[15];return _*(+r*l*f-s*c*f-r*o*m+i*c*m+s*o*g-i*l*g)+v*(+e*l*g-e*c*m+r*a*m-s*a*g+s*c*u-r*l*u)+d*(+e*c*f-e*o*g-r*a*f+i*a*g+r*o*u-i*c*u)+h*(-s*o*u-e*l*f+e*o*m+s*a*f-i*a*m+i*l*u)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=i),this}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=t[9],m=t[10],g=t[11],_=t[12],v=t[13],d=t[14],h=t[15],M=f*d*c-v*m*c+v*l*g-o*d*g-f*l*h+o*m*h,b=_*m*c-u*d*c-_*l*g+a*d*g+u*l*h-a*m*h,x=u*v*c-_*f*c+_*o*g-a*v*g-u*o*h+a*f*h,D=_*f*l-u*v*l-_*o*m+a*v*m+u*o*d-a*f*d,C=e*M+i*b+s*x+r*D;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/C;return t[0]=M*T,t[1]=(v*m*r-f*d*r-v*s*g+i*d*g+f*s*h-i*m*h)*T,t[2]=(o*d*r-v*l*r+v*s*c-i*d*c-o*s*h+i*l*h)*T,t[3]=(f*l*r-o*m*r-f*s*c+i*m*c+o*s*g-i*l*g)*T,t[4]=b*T,t[5]=(u*d*r-_*m*r+_*s*g-e*d*g-u*s*h+e*m*h)*T,t[6]=(_*l*r-a*d*r-_*s*c+e*d*c+a*s*h-e*l*h)*T,t[7]=(a*m*r-u*l*r+u*s*c-e*m*c-a*s*g+e*l*g)*T,t[8]=x*T,t[9]=(_*f*r-u*v*r-_*i*g+e*v*g+u*i*h-e*f*h)*T,t[10]=(a*v*r-_*o*r+_*i*c-e*v*c-a*i*h+e*o*h)*T,t[11]=(u*o*r-a*f*r-u*i*c+e*f*c+a*i*g-e*o*g)*T,t[12]=D*T,t[13]=(u*v*s-_*f*s+_*i*m-e*v*m-u*i*d+e*f*d)*T,t[14]=(_*o*s-a*v*s-_*i*l+e*v*l+a*i*d-e*o*d)*T,t[15]=(a*f*s-u*o*s+u*i*l-e*f*l-a*i*m+e*o*m)*T,this}scale(t){let e=this.elements,i=t.x,s=t.y,r=t.z;return e[0]*=i,e[4]*=s,e[8]*=r,e[1]*=i,e[5]*=s,e[9]*=r,e[2]*=i,e[6]*=s,e[10]*=r,e[3]*=i,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,s))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let i=Math.cos(e),s=Math.sin(e),r=1-i,a=t.x,o=t.y,l=t.z,c=r*a,u=r*o;return this.set(c*a+i,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+i,u*l-s*a,0,c*l-s*o,u*l+s*a,r*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,s,r,a){return this.set(1,i,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,i){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,u=a+a,f=o+o,m=r*c,g=r*u,_=r*f,v=a*u,d=a*f,h=o*f,M=l*c,b=l*u,x=l*f,D=i.x,C=i.y,T=i.z;return s[0]=(1-(v+h))*D,s[1]=(g+x)*D,s[2]=(_-b)*D,s[3]=0,s[4]=(g-x)*C,s[5]=(1-(m+h))*C,s[6]=(d+M)*C,s[7]=0,s[8]=(_+b)*T,s[9]=(d-M)*T,s[10]=(1-(m+v))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,i){let s=this.elements,r=ui.set(s[0],s[1],s[2]).length(),a=ui.set(s[4],s[5],s[6]).length(),o=ui.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],$e.copy(this);let c=1/r,u=1/a,f=1/o;return $e.elements[0]*=c,$e.elements[1]*=c,$e.elements[2]*=c,$e.elements[4]*=u,$e.elements[5]*=u,$e.elements[6]*=u,$e.elements[8]*=f,$e.elements[9]*=f,$e.elements[10]*=f,e.setFromRotationMatrix($e),i.x=r,i.y=a,i.z=o,this}makePerspective(t,e,i,s,r,a,o=gn){let l=this.elements,c=2*r/(e-t),u=2*r/(i-s),f=(e+t)/(e-t),m=(i+s)/(i-s),g,_;if(o===gn)g=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===Vs)g=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=u,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,s,r,a,o=gn){let l=this.elements,c=1/(e-t),u=1/(i-s),f=1/(a-r),m=(e+t)*c,g=(i+s)*u,_,v;if(o===gn)_=(a+r)*f,v=-2*f;else if(o===Vs)_=r*f,v=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-m,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-g,l[2]=0,l[6]=0,l[10]=v,l[14]=-_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<16;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}},ui=new k,$e=new de,Vh=new k(0,0,0),Hh=new k(1,1,1),Cn=new k,ms=new k,Ne=new k,Ko=new de,Qo=new Qe,bn=class n{constructor(t=0,e=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,s=this._order){return this._x=t,this._y=e,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],u=s[9],f=s[2],m=s[6],g=s[10];switch(e){case"XYZ":this._y=Math.asin(Ee(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(m,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ee(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,g),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ee(m,-1,1)),Math.abs(m)<.9999999?(this._y=Math.atan2(-f,g),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ee(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(m,g),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ee(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,g));break;case"XZY":this._z=Math.asin(-Ee(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(m,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,g),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return Ko.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Ko,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Qo.setFromEuler(this),this.setFromQuaternion(Qo,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};bn.DEFAULT_ORDER="XYZ";var Xs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Gh=0,tl=new k,di=new Qe,hn=new de,gs=new k,Wi=new k,Wh=new k,Xh=new Qe,el=new k(1,0,0),nl=new k(0,1,0),il=new k(0,0,1),sl={type:"added"},$h={type:"removed"},fi={type:"childadded",child:null},Tr={type:"childremoved",child:null},Fe=class n extends xn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Gh++}),this.uuid=Ni(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let t=new k,e=new bn,i=new Qe,s=new k(1,1,1);function r(){i.setFromEuler(e,!1)}function a(){e.setFromQuaternion(i,void 0,!1)}e._onChange(r),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new de},normalMatrix:{value:new Nt}}),this.matrix=new de,this.matrixWorld=new de,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Xs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return di.setFromAxisAngle(t,e),this.quaternion.multiply(di),this}rotateOnWorldAxis(t,e){return di.setFromAxisAngle(t,e),this.quaternion.premultiply(di),this}rotateX(t){return this.rotateOnAxis(el,t)}rotateY(t){return this.rotateOnAxis(nl,t)}rotateZ(t){return this.rotateOnAxis(il,t)}translateOnAxis(t,e){return tl.copy(t).applyQuaternion(this.quaternion),this.position.add(tl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(el,t)}translateY(t){return this.translateOnAxis(nl,t)}translateZ(t){return this.translateOnAxis(il,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(hn.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?gs.copy(t):gs.set(t,e,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Wi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?hn.lookAt(Wi,gs,this.up):hn.lookAt(gs,Wi,this.up),this.quaternion.setFromRotationMatrix(hn),s&&(hn.extractRotation(s.matrixWorld),di.setFromRotationMatrix(hn),this.quaternion.premultiply(di.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(sl),fi.child=t,this.dispatchEvent(fi),fi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent($h),Tr.child=t,this.dispatchEvent(Tr),Tr.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),hn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),hn.multiply(t.parent.matrixWorld)),t.applyMatrix4(hn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(sl),fi.child=t,this.dispatchEvent(fi),fi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,s=this.children.length;i<s;i++){let a=this.children[i].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wi,t,Wh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wi,Xh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let f=l[c];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),f=a(t.shapes),m=a(t.skeletons),g=a(t.animations),_=a(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),f.length>0&&(i.shapes=f),m.length>0&&(i.skeletons=m),g.length>0&&(i.animations=g),_.length>0&&(i.nodes=_)}return i.object=s,i;function a(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}};Fe.DEFAULT_UP=new k(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ye=new k,un=new k,Ar=new k,dn=new k,pi=new k,mi=new k,rl=new k,Cr=new k,Rr=new k,Pr=new k,Ir=new ue,Lr=new ue,Dr=new ue,Yn=class n{constructor(t=new k,e=new k,i=new k){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,s){s.subVectors(i,e),Ye.subVectors(t,e),s.cross(Ye);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,i,s,r){Ye.subVectors(s,e),un.subVectors(i,e),Ar.subVectors(t,e);let a=Ye.dot(Ye),o=Ye.dot(un),l=Ye.dot(Ar),c=un.dot(un),u=un.dot(Ar),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;let m=1/f,g=(c*l-o*u)*m,_=(a*u-o*l)*m;return r.set(1-g-_,_,g)}static containsPoint(t,e,i,s){return this.getBarycoord(t,e,i,s,dn)===null?!1:dn.x>=0&&dn.y>=0&&dn.x+dn.y<=1}static getInterpolation(t,e,i,s,r,a,o,l){return this.getBarycoord(t,e,i,s,dn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,dn.x),l.addScaledVector(a,dn.y),l.addScaledVector(o,dn.z),l)}static getInterpolatedAttribute(t,e,i,s,r,a){return Ir.setScalar(0),Lr.setScalar(0),Dr.setScalar(0),Ir.fromBufferAttribute(t,e),Lr.fromBufferAttribute(t,i),Dr.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Ir,r.x),a.addScaledVector(Lr,r.y),a.addScaledVector(Dr,r.z),a}static isFrontFacing(t,e,i,s){return Ye.subVectors(i,e),un.subVectors(t,e),Ye.cross(un).dot(s)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,s){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,i,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ye.subVectors(this.c,this.b),un.subVectors(this.a,this.b),Ye.cross(un).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return n.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return n.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,s,r){return n.getInterpolation(t,this.a,this.b,this.c,e,i,s,r)}containsPoint(t){return n.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return n.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let i=this.a,s=this.b,r=this.c,a,o;pi.subVectors(s,i),mi.subVectors(r,i),Cr.subVectors(t,i);let l=pi.dot(Cr),c=mi.dot(Cr);if(l<=0&&c<=0)return e.copy(i);Rr.subVectors(t,s);let u=pi.dot(Rr),f=mi.dot(Rr);if(u>=0&&f<=u)return e.copy(s);let m=l*f-u*c;if(m<=0&&l>=0&&u<=0)return a=l/(l-u),e.copy(i).addScaledVector(pi,a);Pr.subVectors(t,r);let g=pi.dot(Pr),_=mi.dot(Pr);if(_>=0&&g<=_)return e.copy(r);let v=g*c-l*_;if(v<=0&&c>=0&&_<=0)return o=c/(c-_),e.copy(i).addScaledVector(mi,o);let d=u*_-g*f;if(d<=0&&f-u>=0&&g-_>=0)return rl.subVectors(r,s),o=(f-u)/(f-u+(g-_)),e.copy(s).addScaledVector(rl,o);let h=1/(d+v+m);return a=v*h,o=m*h,e.copy(i).addScaledVector(pi,a).addScaledVector(mi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},ic={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Rn={h:0,s:0,l:0},_s={h:0,s:0,l:0};function Ur(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}var Gt=class{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ze){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Xt.toWorkingColorSpace(this,e),this}setRGB(t,e,i,s=Xt.workingColorSpace){return this.r=t,this.g=e,this.b=i,Xt.toWorkingColorSpace(this,s),this}setHSL(t,e,i,s=Xt.workingColorSpace){if(t=po(t,1),e=Ee(e,0,1),i=Ee(i,0,1),e===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+e):i+e-i*e,a=2*i-r;this.r=Ur(a,r,t+1/3),this.g=Ur(a,r,t),this.b=Ur(a,r,t-1/3)}return Xt.toWorkingColorSpace(this,s),this}setStyle(t,e=ze){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ze){let i=ic[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=_n(t.r),this.g=_n(t.g),this.b=_n(t.b),this}copyLinearToSRGB(t){return this.r=Ei(t.r),this.g=Ei(t.g),this.b=Ei(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ze){return Xt.fromWorkingColorSpace(we.copy(this),t),Math.round(Ee(we.r*255,0,255))*65536+Math.round(Ee(we.g*255,0,255))*256+Math.round(Ee(we.b*255,0,255))}getHexString(t=ze){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Xt.workingColorSpace){Xt.fromWorkingColorSpace(we.copy(this),e);let i=we.r,s=we.g,r=we.b,a=Math.max(i,s,r),o=Math.min(i,s,r),l,c,u=(o+a)/2;if(o===a)l=0,c=0;else{let f=a-o;switch(c=u<=.5?f/(a+o):f/(2-a-o),a){case i:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-i)/f+2;break;case r:l=(i-s)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Xt.workingColorSpace){return Xt.fromWorkingColorSpace(we.copy(this),e),t.r=we.r,t.g=we.g,t.b=we.b,t}getStyle(t=ze){Xt.fromWorkingColorSpace(we.copy(this),t);let e=we.r,i=we.g,s=we.b;return t!==ze?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,e,i){return this.getHSL(Rn),this.setHSL(Rn.h+t,Rn.s+e,Rn.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(Rn),t.getHSL(_s);let i=Ji(Rn.h,_s.h,e),s=Ji(Rn.s,_s.s,e),r=Ji(Rn.l,_s.l,e);return this.setHSL(i,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,i=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*i+r[6]*s,this.g=r[1]*e+r[4]*i+r[7]*s,this.b=r[2]*e+r[5]*i+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},we=new Gt;Gt.NAMES=ic;var Yh=0,Nn=class extends xn{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Yh++}),this.uuid=Ni(),this.name="",this.blending=Si,this.side=Un,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Xr,this.blendDst=$r,this.blendEquation=$n,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Gt(0,0,0),this.blendAlpha=0,this.depthFunc=Ai,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Vo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ai,this.stencilZFail=ai,this.stencilZPass=ai,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[e]=i}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Si&&(i.blending=this.blending),this.side!==Un&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Xr&&(i.blendSrc=this.blendSrc),this.blendDst!==$r&&(i.blendDst=this.blendDst),this.blendEquation!==$n&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ai&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Vo&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ai&&(i.stencilFail=this.stencilFail),this.stencilZFail!==ai&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==ai&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(i.textures=r),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,i=null;if(e!==null){let s=e.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=e[r].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},$s=class extends Nn{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Gt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=Hl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var me=new k,vs=new kt,Re=class{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Ho,this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)vs.fromBufferAttribute(this,e),vs.applyMatrix3(t),this.setXY(e,vs.x,vs.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)me.fromBufferAttribute(this,e),me.applyMatrix3(t),this.setXYZ(e,me.x,me.y,me.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)me.fromBufferAttribute(this,e),me.applyMatrix4(t),this.setXYZ(e,me.x,me.y,me.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)me.fromBufferAttribute(this,e),me.applyNormalMatrix(t),this.setXYZ(e,me.x,me.y,me.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)me.fromBufferAttribute(this,e),me.transformDirection(t),this.setXYZ(e,me.x,me.y,me.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=yi(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=Te(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=yi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=yi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=yi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=yi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Te(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=Te(e,this.array),i=Te(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,s){return t*=this.itemSize,this.normalized&&(e=Te(e,this.array),i=Te(i,this.array),s=Te(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,e,i,s,r){return t*=this.itemSize,this.normalized&&(e=Te(e,this.array),i=Te(i,this.array),s=Te(s,this.array),r=Te(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Ho&&(t.usage=this.usage),t}};var Ys=class extends Re{constructor(t,e,i){super(new Uint16Array(t),e,i)}};var qs=class extends Re{constructor(t,e,i){super(new Uint32Array(t),e,i)}};var Ke=class extends Re{constructor(t,e,i){super(new Float32Array(t),e,i)}},qh=0,ke=new de,Nr=new Fe,gi=new k,Oe=new Mn,Xi=new Mn,ye=new k,He=class n extends xn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:qh++}),this.uuid=Ni(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(nc(t)?qs:Ys)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new Nt().getNormalMatrix(t);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return ke.makeRotationFromQuaternion(t),this.applyMatrix4(ke),this}rotateX(t){return ke.makeRotationX(t),this.applyMatrix4(ke),this}rotateY(t){return ke.makeRotationY(t),this.applyMatrix4(ke),this}rotateZ(t){return ke.makeRotationZ(t),this.applyMatrix4(ke),this}translate(t,e,i){return ke.makeTranslation(t,e,i),this.applyMatrix4(ke),this}scale(t,e,i){return ke.makeScale(t,e,i),this.applyMatrix4(ke),this}lookAt(t){return Nr.lookAt(t),Nr.updateMatrix(),this.applyMatrix4(Nr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(gi).negate(),this.translate(gi.x,gi.y,gi.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let i=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Ke(i,3))}else{for(let i=0,s=e.count;i<s;i++){let r=t[i];e.setXYZ(i,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Mn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,s=e.length;i<s;i++){let r=e[i];Oe.setFromBufferAttribute(r),this.morphTargetsRelative?(ye.addVectors(this.boundingBox.min,Oe.min),this.boundingBox.expandByPoint(ye),ye.addVectors(this.boundingBox.max,Oe.max),this.boundingBox.expandByPoint(ye)):(this.boundingBox.expandByPoint(Oe.min),this.boundingBox.expandByPoint(Oe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Kn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(t){let i=this.boundingSphere.center;if(Oe.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Xi.setFromBufferAttribute(o),this.morphTargetsRelative?(ye.addVectors(Oe.min,Xi.min),Oe.expandByPoint(ye),ye.addVectors(Oe.max,Xi.max),Oe.expandByPoint(ye)):(Oe.expandByPoint(Xi.min),Oe.expandByPoint(Xi.max))}Oe.getCenter(i);let s=0;for(let r=0,a=t.count;r<a;r++)ye.fromBufferAttribute(t,r),s=Math.max(s,i.distanceToSquared(ye));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)ye.fromBufferAttribute(o,c),l&&(gi.fromBufferAttribute(t,c),ye.add(gi)),s=Math.max(s,i.distanceToSquared(ye))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Re(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let P=0;P<i.count;P++)o[P]=new k,l[P]=new k;let c=new k,u=new k,f=new k,m=new kt,g=new kt,_=new kt,v=new k,d=new k;function h(P,E,w){c.fromBufferAttribute(i,P),u.fromBufferAttribute(i,E),f.fromBufferAttribute(i,w),m.fromBufferAttribute(r,P),g.fromBufferAttribute(r,E),_.fromBufferAttribute(r,w),u.sub(c),f.sub(c),g.sub(m),_.sub(m);let I=1/(g.x*_.y-_.x*g.y);isFinite(I)&&(v.copy(u).multiplyScalar(_.y).addScaledVector(f,-g.y).multiplyScalar(I),d.copy(f).multiplyScalar(g.x).addScaledVector(u,-_.x).multiplyScalar(I),o[P].add(v),o[E].add(v),o[w].add(v),l[P].add(d),l[E].add(d),l[w].add(d))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let P=0,E=M.length;P<E;++P){let w=M[P],I=w.start,G=w.count;for(let B=I,z=I+G;B<z;B+=3)h(t.getX(B+0),t.getX(B+1),t.getX(B+2))}let b=new k,x=new k,D=new k,C=new k;function T(P){D.fromBufferAttribute(s,P),C.copy(D);let E=o[P];b.copy(E),b.sub(D.multiplyScalar(D.dot(E))).normalize(),x.crossVectors(C,E);let I=x.dot(l[P])<0?-1:1;a.setXYZW(P,b.x,b.y,b.z,I)}for(let P=0,E=M.length;P<E;++P){let w=M[P],I=w.start,G=w.count;for(let B=I,z=I+G;B<z;B+=3)T(t.getX(B+0)),T(t.getX(B+1)),T(t.getX(B+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Re(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let m=0,g=i.count;m<g;m++)i.setXYZ(m,0,0,0);let s=new k,r=new k,a=new k,o=new k,l=new k,c=new k,u=new k,f=new k;if(t)for(let m=0,g=t.count;m<g;m+=3){let _=t.getX(m+0),v=t.getX(m+1),d=t.getX(m+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,v),a.fromBufferAttribute(e,d),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),o.fromBufferAttribute(i,_),l.fromBufferAttribute(i,v),c.fromBufferAttribute(i,d),o.add(u),l.add(u),c.add(u),i.setXYZ(_,o.x,o.y,o.z),i.setXYZ(v,l.x,l.y,l.z),i.setXYZ(d,c.x,c.y,c.z)}else for(let m=0,g=e.count;m<g;m+=3)s.fromBufferAttribute(e,m+0),r.fromBufferAttribute(e,m+1),a.fromBufferAttribute(e,m+2),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),i.setXYZ(m+0,u.x,u.y,u.z),i.setXYZ(m+1,u.x,u.y,u.z),i.setXYZ(m+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)ye.fromBufferAttribute(t,e),ye.normalize(),t.setXYZ(e,ye.x,ye.y,ye.z)}toNonIndexed(){function t(o,l){let c=o.array,u=o.itemSize,f=o.normalized,m=new c.constructor(l.length*u),g=0,_=0;for(let v=0,d=l.length;v<d;v++){o.isInterleavedBufferAttribute?g=l[v]*o.data.stride+o.offset:g=l[v]*u;for(let h=0;h<u;h++)m[_++]=c[g++]}return new Re(m,u,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new n,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,i);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let u=0,f=c.length;u<f;u++){let m=c[u],g=t(m,i);l.push(g)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let f=0,m=c.length;f<m;f++){let g=c[f];u.push(g.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone(e));let s=t.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(e))}let r=t.morphAttributes;for(let c in r){let u=[],f=r[c];for(let m=0,g=f.length;m<g;m++)u.push(f[m].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,u=a.length;c<u;c++){let f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},al=new de,Vn=new Qn,xs=new Kn,ol=new k,ys=new k,Ms=new k,bs=new k,Or=new k,Ss=new k,ll=new k,ws=new k,Je=class extends Fe{constructor(t=new He,e=new $s){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,a=i.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Ss.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=o[l],f=r[l];u!==0&&(Or.fromBufferAttribute(f,t),a?Ss.addScaledVector(Or,u):Ss.addScaledVector(Or.sub(e),u))}e.add(Ss)}return e}raycast(t,e){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),xs.copy(i.boundingSphere),xs.applyMatrix4(r),Vn.copy(t.ray).recast(t.near),!(xs.containsPoint(Vn.origin)===!1&&(Vn.intersectSphere(xs,ol)===null||Vn.origin.distanceToSquared(ol)>(t.far-t.near)**2))&&(al.copy(r).invert(),Vn.copy(t.ray).applyMatrix4(al),!(i.boundingBox!==null&&Vn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Vn)))}_computeIntersections(t,e,i){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,m=r.groups,g=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,v=m.length;_<v;_++){let d=m[_],h=a[d.materialIndex],M=Math.max(d.start,g.start),b=Math.min(o.count,Math.min(d.start+d.count,g.start+g.count));for(let x=M,D=b;x<D;x+=3){let C=o.getX(x),T=o.getX(x+1),P=o.getX(x+2);s=Es(this,h,t,i,c,u,f,C,T,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=d.materialIndex,e.push(s))}}else{let _=Math.max(0,g.start),v=Math.min(o.count,g.start+g.count);for(let d=_,h=v;d<h;d+=3){let M=o.getX(d),b=o.getX(d+1),x=o.getX(d+2);s=Es(this,a,t,i,c,u,f,M,b,x),s&&(s.faceIndex=Math.floor(d/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let _=0,v=m.length;_<v;_++){let d=m[_],h=a[d.materialIndex],M=Math.max(d.start,g.start),b=Math.min(l.count,Math.min(d.start+d.count,g.start+g.count));for(let x=M,D=b;x<D;x+=3){let C=x,T=x+1,P=x+2;s=Es(this,h,t,i,c,u,f,C,T,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=d.materialIndex,e.push(s))}}else{let _=Math.max(0,g.start),v=Math.min(l.count,g.start+g.count);for(let d=_,h=v;d<h;d+=3){let M=d,b=d+1,x=d+2;s=Es(this,a,t,i,c,u,f,M,b,x),s&&(s.faceIndex=Math.floor(d/3),e.push(s))}}}};function Zh(n,t,e,i,s,r,a,o){let l;if(t.side===Le?l=i.intersectTriangle(a,r,s,!0,o):l=i.intersectTriangle(s,r,a,t.side===Un,o),l===null)return null;ws.copy(o),ws.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(ws);return c<e.near||c>e.far?null:{distance:c,point:ws.clone(),object:n}}function Es(n,t,e,i,s,r,a,o,l,c){n.getVertexPosition(o,ys),n.getVertexPosition(l,Ms),n.getVertexPosition(c,bs);let u=Zh(n,t,e,i,ys,Ms,bs,ll);if(u){let f=new k;Yn.getBarycoord(ll,ys,Ms,bs,f),s&&(u.uv=Yn.getInterpolatedAttribute(s,o,l,c,f,new kt)),r&&(u.uv1=Yn.getInterpolatedAttribute(r,o,l,c,f,new kt)),a&&(u.normal=Yn.getInterpolatedAttribute(a,o,l,c,f,new k),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let m={a:o,b:l,c,normal:new k,materialIndex:0};Yn.getNormal(ys,Ms,bs,m.normal),u.face=m,u.barycoord=f}return u}var ts=class n extends He{constructor(t=1,e=1,i=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],u=[],f=[],m=0,g=0;_("z","y","x",-1,-1,i,e,t,a,r,0),_("z","y","x",1,-1,i,e,-t,a,r,1),_("x","z","y",1,1,t,i,e,s,a,2),_("x","z","y",1,-1,t,i,-e,s,a,3),_("x","y","z",1,-1,t,e,i,s,r,4),_("x","y","z",-1,-1,t,e,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new Ke(c,3)),this.setAttribute("normal",new Ke(u,3)),this.setAttribute("uv",new Ke(f,2));function _(v,d,h,M,b,x,D,C,T,P,E){let w=x/T,I=D/P,G=x/2,B=D/2,z=C/2,Z=T+1,X=P+1,R=0,N=0,q=new k;for(let tt=0;tt<X;tt++){let et=tt*I-B;for(let lt=0;lt<Z;lt++){let It=lt*w-G;q[v]=It*M,q[d]=et*b,q[h]=z,c.push(q.x,q.y,q.z),q[v]=0,q[d]=0,q[h]=C>0?1:-1,u.push(q.x,q.y,q.z),f.push(lt/T),f.push(1-tt/P),R+=1}}for(let tt=0;tt<P;tt++)for(let et=0;et<T;et++){let lt=m+et+Z*tt,It=m+et+Z*(tt+1),$=m+(et+1)+Z*(tt+1),nt=m+(et+1)+Z*tt;l.push(lt,It,nt),l.push(It,$,nt),N+=6}o.addGroup(g,N,E),g+=N,m+=R}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function Li(n){let t={};for(let e in n){t[e]={};for(let i in n[e]){let s=n[e][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=s.clone():Array.isArray(s)?t[e][i]=s.slice():t[e][i]=s}}return t}function Ae(n){let t={};for(let e=0;e<n.length;e++){let i=Li(n[e]);for(let s in i)t[s]=i[s]}return t}function Jh(n){let t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function sc(n){let t=n.getRenderTarget();return t===null?n.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Xt.workingColorSpace}var jh={clone:Li,merge:Ae},Kh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Qh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,rn=class extends Nn{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kh,this.fragmentShader=Qh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Li(t.uniforms),this.uniformsGroups=Jh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}},Zs=class extends Fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new de,this.projectionMatrix=new de,this.projectionMatrixInverse=new de,this.coordinateSystem=gn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Pn=new k,cl=new kt,hl=new kt,Ce=class extends Zs{constructor(t=50,e=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Qi*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Zi*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qi*2*Math.atan(Math.tan(Zi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){Pn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Pn.x,Pn.y).multiplyScalar(-t/Pn.z),Pn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Pn.x,Pn.y).multiplyScalar(-t/Pn.z)}getViewSize(t,e){return this.getViewBounds(t,cl,hl),e.subVectors(hl,cl)}setViewOffset(t,e,i,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Zi*.5*this.fov)/this.zoom,i=2*e,s=this.aspect*i,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*i/c,s*=a.width/l,i*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},_i=-90,vi=1,Ua=class extends Fe{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ce(_i,vi,t,e);s.layers=this.layers,this.add(s);let r=new Ce(_i,vi,t,e);r.layers=this.layers,this.add(r);let a=new Ce(_i,vi,t,e);a.layers=this.layers,this.add(a);let o=new Ce(_i,vi,t,e);o.layers=this.layers,this.add(o);let l=new Ce(_i,vi,t,e);l.layers=this.layers,this.add(l);let c=new Ce(_i,vi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[i,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===gn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Vs)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,u]=this.children,f=t.getRenderTarget(),m=t.getActiveCubeFace(),g=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;let v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,s),t.render(e,r),t.setRenderTarget(i,1,s),t.render(e,a),t.setRenderTarget(i,2,s),t.render(e,o),t.setRenderTarget(i,3,s),t.render(e,l),t.setRenderTarget(i,4,s),t.render(e,c),i.texture.generateMipmaps=v,t.setRenderTarget(i,5,s),t.render(e,u),t.setRenderTarget(f,m,g),t.xr.enabled=_,i.texture.needsPMREMUpdate=!0}},Js=class extends Ve{constructor(t,e,i,s,r,a,o,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Ci,super(t,e,i,s,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Na=class extends yn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new Js(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:sn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new ts(5,5,5),r=new rn({name:"CubemapFromEquirect",uniforms:Li(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Le,blending:Ln});r.uniforms.tEquirect.value=e;let a=new Je(s,r),o=e.minFilter;return e.minFilter===Jn&&(e.minFilter=sn),new Ua(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,i,s){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,i,s);t.setRenderTarget(r)}},Fr=new k,tu=new k,eu=new Nt,qe=class{constructor(t=new k(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,s){return this.normal.set(t,e,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){let s=Fr.subVectors(i,e).cross(tu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let i=t.delta(Fr),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let i=e||eu.getNormalMatrix(t),s=this.coplanarPoint(Fr).applyMatrix4(t),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Hn=new Kn,Ts=new k,js=class{constructor(t=new qe,e=new qe,i=new qe,s=new qe,r=new qe,a=new qe){this.planes=[t,e,i,s,r,a]}set(t,e,i,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=gn){let i=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],u=s[5],f=s[6],m=s[7],g=s[8],_=s[9],v=s[10],d=s[11],h=s[12],M=s[13],b=s[14],x=s[15];if(i[0].setComponents(l-r,m-c,d-g,x-h).normalize(),i[1].setComponents(l+r,m+c,d+g,x+h).normalize(),i[2].setComponents(l+a,m+u,d+_,x+M).normalize(),i[3].setComponents(l-a,m-u,d-_,x-M).normalize(),i[4].setComponents(l-o,m-f,d-v,x-b).normalize(),e===gn)i[5].setComponents(l+o,m+f,d+v,x+b).normalize();else if(e===Vs)i[5].setComponents(o,f,v,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Hn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Hn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Hn)}intersectsSprite(t){return Hn.center.set(0,0,0),Hn.radius=.7071067811865476,Hn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Hn)}intersectsSphere(t){let e=this.planes,i=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let i=0;i<6;i++){let s=e[i];if(Ts.x=s.normal.x>0?t.max.x:t.min.x,Ts.y=s.normal.y>0?t.max.y:t.min.y,Ts.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ts)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function rc(){let n=null,t=!1,e=null,i=null;function s(r,a){e(r,a),i=n.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(s),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){n=r}}}function nu(n){let t=new WeakMap;function e(o,l){let c=o.array,u=o.usage,f=c.byteLength,m=n.createBuffer();n.bindBuffer(l,m),n.bufferData(l,c,u),o.onUploadCallback();let g;if(c instanceof Float32Array)g=n.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?g=n.HALF_FLOAT:g=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)g=n.SHORT;else if(c instanceof Uint32Array)g=n.UNSIGNED_INT;else if(c instanceof Int32Array)g=n.INT;else if(c instanceof Int8Array)g=n.BYTE;else if(c instanceof Uint8Array)g=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)g=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:m,type:g,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function i(o,l,c){let u=l.array,f=l.updateRanges;if(n.bindBuffer(c,o),f.length===0)n.bufferSubData(c,0,u);else{f.sort((g,_)=>g.start-_.start);let m=0;for(let g=1;g<f.length;g++){let _=f[m],v=f[g];v.start<=_.start+_.count+1?_.count=Math.max(_.count,v.start+v.count-_.start):(++m,f[m]=v)}f.length=m+1;for(let g=0,_=f.length;g<_;g++){let v=f[g];n.bufferSubData(c,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(n.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Ks=class n extends He{constructor(t=1,e=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(i),l=Math.floor(s),c=o+1,u=l+1,f=t/o,m=e/l,g=[],_=[],v=[],d=[];for(let h=0;h<u;h++){let M=h*m-a;for(let b=0;b<c;b++){let x=b*f-r;_.push(x,-M,0),v.push(0,0,1),d.push(b/o),d.push(1-h/l)}}for(let h=0;h<l;h++)for(let M=0;M<o;M++){let b=M+c*h,x=M+c*(h+1),D=M+1+c*(h+1),C=M+1+c*h;g.push(b,x,C),g.push(x,D,C)}this.setIndex(g),this.setAttribute("position",new Ke(_,3)),this.setAttribute("normal",new Ke(v,3)),this.setAttribute("uv",new Ke(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.widthSegments,t.heightSegments)}},iu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,su=`#ifdef USE_ALPHAHASH
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
#endif`,ru=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,au=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ou=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,lu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,cu=`#ifdef USE_AOMAP
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
#endif`,hu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,uu=`#ifdef USE_BATCHING
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
#endif`,du=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,fu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,pu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,mu=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,gu=`#ifdef USE_IRIDESCENCE
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
#endif`,_u=`#ifdef USE_BUMPMAP
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
#endif`,vu=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,xu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,yu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Mu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,bu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Su=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,wu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Eu=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Tu=`#define PI 3.141592653589793
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
} // validated`,Au=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Cu=`vec3 transformedNormal = objectNormal;
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
#endif`,Ru=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Pu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Iu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Lu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Du="gl_FragColor = linearToOutputTexel( gl_FragColor );",Uu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Nu=`#ifdef USE_ENVMAP
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
#endif`,Ou=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Fu=`#ifdef USE_ENVMAP
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
#endif`,Bu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ku=`#ifdef USE_ENVMAP
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
#endif`,zu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Vu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Hu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Wu=`#ifdef USE_GRADIENTMAP
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
}`,Xu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,$u=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Yu=`varying vec3 vViewPosition;
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
#endif`,Zu=`#ifdef USE_ENVMAP
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
#endif`,Ju=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ju=`varying vec3 vViewPosition;
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
material.specularStrength = specularStrength;`,Qu=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,td=`PhysicalMaterial material;
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
#endif`,ed=`struct PhysicalMaterial {
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
}`,nd=`
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
#endif`,id=`#if defined( RE_IndirectDiffuse )
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
#endif`,sd=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,rd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ad=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,od=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ld=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,cd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,hd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ud=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,dd=`#if defined( USE_POINTS_UV )
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
#endif`,fd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,pd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,md=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,gd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,_d=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vd=`#ifdef USE_MORPHTARGETS
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
#endif`,xd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,yd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Md=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,bd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Ed=`#ifdef USE_NORMALMAP
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
#endif`,Td=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ad=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Cd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Rd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Pd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Id=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Ld=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Dd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Ud=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Nd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Od=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Fd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Bd=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,kd=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,zd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Vd=`float getShadowMask() {
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
}`,Hd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Gd=`#ifdef USE_SKINNING
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
#endif`,Wd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Xd=`#ifdef USE_SKINNING
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
#endif`,$d=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Yd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,qd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Zd=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Jd=`#ifdef USE_TRANSMISSION
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
#endif`,jd=`#ifdef USE_TRANSMISSION
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
#endif`,Qd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,tf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ef=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,nf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,sf=`uniform sampler2D t2D;
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
}`,rf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,af=`#ifdef ENVMAP_TYPE_CUBE
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
}`,of=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cf=`#include <common>
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
}`,hf=`#if DEPTH_PACKING == 3200
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
}`,uf=`#define DISTANCE
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
}`,df=`#define DISTANCE
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
}`,ff=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,pf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,mf=`uniform float scale;
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
}`,gf=`uniform vec3 diffuse;
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
}`,_f=`#include <common>
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
}`,vf=`uniform vec3 diffuse;
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
}`,xf=`#define LAMBERT
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
}`,yf=`#define LAMBERT
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
}`,Mf=`#define MATCAP
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
}`,bf=`#define MATCAP
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
}`,Sf=`#define NORMAL
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
}`,wf=`#define NORMAL
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
}`,Ef=`#define PHONG
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
}`,Tf=`#define PHONG
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
}`,Af=`#define STANDARD
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
}`,Cf=`#define STANDARD
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
}`,Rf=`#define TOON
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
}`,Pf=`#define TOON
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
}`,If=`uniform float size;
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
}`,Lf=`uniform vec3 diffuse;
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
}`,Df=`#include <common>
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
}`,Uf=`uniform vec3 color;
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
}`,Nf=`uniform float rotation;
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
}`,Of=`uniform vec3 diffuse;
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
}`,Bt={alphahash_fragment:iu,alphahash_pars_fragment:su,alphamap_fragment:ru,alphamap_pars_fragment:au,alphatest_fragment:ou,alphatest_pars_fragment:lu,aomap_fragment:cu,aomap_pars_fragment:hu,batching_pars_vertex:uu,batching_vertex:du,begin_vertex:fu,beginnormal_vertex:pu,bsdfs:mu,iridescence_fragment:gu,bumpmap_pars_fragment:_u,clipping_planes_fragment:vu,clipping_planes_pars_fragment:xu,clipping_planes_pars_vertex:yu,clipping_planes_vertex:Mu,color_fragment:bu,color_pars_fragment:Su,color_pars_vertex:wu,color_vertex:Eu,common:Tu,cube_uv_reflection_fragment:Au,defaultnormal_vertex:Cu,displacementmap_pars_vertex:Ru,displacementmap_vertex:Pu,emissivemap_fragment:Iu,emissivemap_pars_fragment:Lu,colorspace_fragment:Du,colorspace_pars_fragment:Uu,envmap_fragment:Nu,envmap_common_pars_fragment:Ou,envmap_pars_fragment:Fu,envmap_pars_vertex:Bu,envmap_physical_pars_fragment:Zu,envmap_vertex:ku,fog_vertex:zu,fog_pars_vertex:Vu,fog_fragment:Hu,fog_pars_fragment:Gu,gradientmap_pars_fragment:Wu,lightmap_pars_fragment:Xu,lights_lambert_fragment:$u,lights_lambert_pars_fragment:Yu,lights_pars_begin:qu,lights_toon_fragment:Ju,lights_toon_pars_fragment:ju,lights_phong_fragment:Ku,lights_phong_pars_fragment:Qu,lights_physical_fragment:td,lights_physical_pars_fragment:ed,lights_fragment_begin:nd,lights_fragment_maps:id,lights_fragment_end:sd,logdepthbuf_fragment:rd,logdepthbuf_pars_fragment:ad,logdepthbuf_pars_vertex:od,logdepthbuf_vertex:ld,map_fragment:cd,map_pars_fragment:hd,map_particle_fragment:ud,map_particle_pars_fragment:dd,metalnessmap_fragment:fd,metalnessmap_pars_fragment:pd,morphinstance_vertex:md,morphcolor_vertex:gd,morphnormal_vertex:_d,morphtarget_pars_vertex:vd,morphtarget_vertex:xd,normal_fragment_begin:yd,normal_fragment_maps:Md,normal_pars_fragment:bd,normal_pars_vertex:Sd,normal_vertex:wd,normalmap_pars_fragment:Ed,clearcoat_normal_fragment_begin:Td,clearcoat_normal_fragment_maps:Ad,clearcoat_pars_fragment:Cd,iridescence_pars_fragment:Rd,opaque_fragment:Pd,packing:Id,premultiplied_alpha_fragment:Ld,project_vertex:Dd,dithering_fragment:Ud,dithering_pars_fragment:Nd,roughnessmap_fragment:Od,roughnessmap_pars_fragment:Fd,shadowmap_pars_fragment:Bd,shadowmap_pars_vertex:kd,shadowmap_vertex:zd,shadowmask_pars_fragment:Vd,skinbase_vertex:Hd,skinning_pars_vertex:Gd,skinning_vertex:Wd,skinnormal_vertex:Xd,specularmap_fragment:$d,specularmap_pars_fragment:Yd,tonemapping_fragment:qd,tonemapping_pars_fragment:Zd,transmission_fragment:Jd,transmission_pars_fragment:jd,uv_pars_fragment:Kd,uv_pars_vertex:Qd,uv_vertex:tf,worldpos_vertex:ef,background_vert:nf,background_frag:sf,backgroundCube_vert:rf,backgroundCube_frag:af,cube_vert:of,cube_frag:lf,depth_vert:cf,depth_frag:hf,distanceRGBA_vert:uf,distanceRGBA_frag:df,equirect_vert:ff,equirect_frag:pf,linedashed_vert:mf,linedashed_frag:gf,meshbasic_vert:_f,meshbasic_frag:vf,meshlambert_vert:xf,meshlambert_frag:yf,meshmatcap_vert:Mf,meshmatcap_frag:bf,meshnormal_vert:Sf,meshnormal_frag:wf,meshphong_vert:Ef,meshphong_frag:Tf,meshphysical_vert:Af,meshphysical_frag:Cf,meshtoon_vert:Rf,meshtoon_frag:Pf,points_vert:If,points_frag:Lf,shadow_vert:Df,shadow_frag:Uf,sprite_vert:Nf,sprite_frag:Of},ot={common:{diffuse:{value:new Gt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Nt}},envmap:{envMap:{value:null},envMapRotation:{value:new Nt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Nt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Nt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Nt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Nt},normalScale:{value:new kt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Nt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Nt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Nt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Nt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Gt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Gt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0},uvTransform:{value:new Nt}},sprite:{diffuse:{value:new Gt(16777215)},opacity:{value:1},center:{value:new kt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}}},nn={basic:{uniforms:Ae([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.fog]),vertexShader:Bt.meshbasic_vert,fragmentShader:Bt.meshbasic_frag},lambert:{uniforms:Ae([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,ot.lights,{emissive:{value:new Gt(0)}}]),vertexShader:Bt.meshlambert_vert,fragmentShader:Bt.meshlambert_frag},phong:{uniforms:Ae([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,ot.lights,{emissive:{value:new Gt(0)},specular:{value:new Gt(1118481)},shininess:{value:30}}]),vertexShader:Bt.meshphong_vert,fragmentShader:Bt.meshphong_frag},standard:{uniforms:Ae([ot.common,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.roughnessmap,ot.metalnessmap,ot.fog,ot.lights,{emissive:{value:new Gt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag},toon:{uniforms:Ae([ot.common,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.gradientmap,ot.fog,ot.lights,{emissive:{value:new Gt(0)}}]),vertexShader:Bt.meshtoon_vert,fragmentShader:Bt.meshtoon_frag},matcap:{uniforms:Ae([ot.common,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,{matcap:{value:null}}]),vertexShader:Bt.meshmatcap_vert,fragmentShader:Bt.meshmatcap_frag},points:{uniforms:Ae([ot.points,ot.fog]),vertexShader:Bt.points_vert,fragmentShader:Bt.points_frag},dashed:{uniforms:Ae([ot.common,ot.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Bt.linedashed_vert,fragmentShader:Bt.linedashed_frag},depth:{uniforms:Ae([ot.common,ot.displacementmap]),vertexShader:Bt.depth_vert,fragmentShader:Bt.depth_frag},normal:{uniforms:Ae([ot.common,ot.bumpmap,ot.normalmap,ot.displacementmap,{opacity:{value:1}}]),vertexShader:Bt.meshnormal_vert,fragmentShader:Bt.meshnormal_frag},sprite:{uniforms:Ae([ot.sprite,ot.fog]),vertexShader:Bt.sprite_vert,fragmentShader:Bt.sprite_frag},background:{uniforms:{uvTransform:{value:new Nt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Bt.background_vert,fragmentShader:Bt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Nt}},vertexShader:Bt.backgroundCube_vert,fragmentShader:Bt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Bt.cube_vert,fragmentShader:Bt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Bt.equirect_vert,fragmentShader:Bt.equirect_frag},distanceRGBA:{uniforms:Ae([ot.common,ot.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Bt.distanceRGBA_vert,fragmentShader:Bt.distanceRGBA_frag},shadow:{uniforms:Ae([ot.lights,ot.fog,{color:{value:new Gt(0)},opacity:{value:1}}]),vertexShader:Bt.shadow_vert,fragmentShader:Bt.shadow_frag}};nn.physical={uniforms:Ae([nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Nt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Nt},clearcoatNormalScale:{value:new kt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Nt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Nt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Nt},sheen:{value:0},sheenColor:{value:new Gt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Nt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Nt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Nt},transmissionSamplerSize:{value:new kt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Nt},attenuationDistance:{value:0},attenuationColor:{value:new Gt(0)},specularColor:{value:new Gt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Nt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Nt},anisotropyVector:{value:new kt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Nt}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag};var As={r:0,b:0,g:0},Gn=new bn,Ff=new de;function Bf(n,t,e,i,s,r,a){let o=new Gt(0),l=r===!0?0:1,c,u,f=null,m=0,g=null;function _(M){let b=M.isScene===!0?M.background:null;return b&&b.isTexture&&(b=(M.backgroundBlurriness>0?e:t).get(b)),b}function v(M){let b=!1,x=_(M);x===null?h(o,l):x&&x.isColor&&(h(x,1),b=!0);let D=n.xr.getEnvironmentBlendMode();D==="additive"?i.buffers.color.setClear(0,0,0,1,a):D==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||b)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function d(M,b){let x=_(b);x&&(x.isCubeTexture||x.mapping===cr)?(u===void 0&&(u=new Je(new ts(1,1,1),new rn({name:"BackgroundCubeMaterial",uniforms:Li(nn.backgroundCube.uniforms),vertexShader:nn.backgroundCube.vertexShader,fragmentShader:nn.backgroundCube.fragmentShader,side:Le,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(D,C,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),Gn.copy(b.backgroundRotation),Gn.x*=-1,Gn.y*=-1,Gn.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(Gn.y*=-1,Gn.z*=-1),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Ff.makeRotationFromEuler(Gn)),u.material.toneMapped=Xt.getTransfer(x.colorSpace)!==Qt,(f!==x||m!==x.version||g!==n.toneMapping)&&(u.material.needsUpdate=!0,f=x,m=x.version,g=n.toneMapping),u.layers.enableAll(),M.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Je(new Ks(2,2),new rn({name:"BackgroundMaterial",uniforms:Li(nn.background.uniforms),vertexShader:nn.background.vertexShader,fragmentShader:nn.background.fragmentShader,side:Un,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.toneMapped=Xt.getTransfer(x.colorSpace)!==Qt,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(f!==x||m!==x.version||g!==n.toneMapping)&&(c.material.needsUpdate=!0,f=x,m=x.version,g=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function h(M,b){M.getRGB(As,sc(n)),i.buffers.color.setClear(As.r,As.g,As.b,b,a)}return{getClearColor:function(){return o},setClearColor:function(M,b=1){o.set(M),l=b,h(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,h(o,l)},render:v,addToRenderList:d}}function kf(n,t){let e=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=m(null),r=s,a=!1;function o(w,I,G,B,z){let Z=!1,X=f(B,G,I);r!==X&&(r=X,c(r.object)),Z=g(w,B,G,z),Z&&_(w,B,G,z),z!==null&&t.update(z,n.ELEMENT_ARRAY_BUFFER),(Z||a)&&(a=!1,x(w,I,G,B),z!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(z).buffer))}function l(){return n.createVertexArray()}function c(w){return n.bindVertexArray(w)}function u(w){return n.deleteVertexArray(w)}function f(w,I,G){let B=G.wireframe===!0,z=i[w.id];z===void 0&&(z={},i[w.id]=z);let Z=z[I.id];Z===void 0&&(Z={},z[I.id]=Z);let X=Z[B];return X===void 0&&(X=m(l()),Z[B]=X),X}function m(w){let I=[],G=[],B=[];for(let z=0;z<e;z++)I[z]=0,G[z]=0,B[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:G,attributeDivisors:B,object:w,attributes:{},index:null}}function g(w,I,G,B){let z=r.attributes,Z=I.attributes,X=0,R=G.getAttributes();for(let N in R)if(R[N].location>=0){let tt=z[N],et=Z[N];if(et===void 0&&(N==="instanceMatrix"&&w.instanceMatrix&&(et=w.instanceMatrix),N==="instanceColor"&&w.instanceColor&&(et=w.instanceColor)),tt===void 0||tt.attribute!==et||et&&tt.data!==et.data)return!0;X++}return r.attributesNum!==X||r.index!==B}function _(w,I,G,B){let z={},Z=I.attributes,X=0,R=G.getAttributes();for(let N in R)if(R[N].location>=0){let tt=Z[N];tt===void 0&&(N==="instanceMatrix"&&w.instanceMatrix&&(tt=w.instanceMatrix),N==="instanceColor"&&w.instanceColor&&(tt=w.instanceColor));let et={};et.attribute=tt,tt&&tt.data&&(et.data=tt.data),z[N]=et,X++}r.attributes=z,r.attributesNum=X,r.index=B}function v(){let w=r.newAttributes;for(let I=0,G=w.length;I<G;I++)w[I]=0}function d(w){h(w,0)}function h(w,I){let G=r.newAttributes,B=r.enabledAttributes,z=r.attributeDivisors;G[w]=1,B[w]===0&&(n.enableVertexAttribArray(w),B[w]=1),z[w]!==I&&(n.vertexAttribDivisor(w,I),z[w]=I)}function M(){let w=r.newAttributes,I=r.enabledAttributes;for(let G=0,B=I.length;G<B;G++)I[G]!==w[G]&&(n.disableVertexAttribArray(G),I[G]=0)}function b(w,I,G,B,z,Z,X){X===!0?n.vertexAttribIPointer(w,I,G,z,Z):n.vertexAttribPointer(w,I,G,B,z,Z)}function x(w,I,G,B){v();let z=B.attributes,Z=G.getAttributes(),X=I.defaultAttributeValues;for(let R in Z){let N=Z[R];if(N.location>=0){let q=z[R];if(q===void 0&&(R==="instanceMatrix"&&w.instanceMatrix&&(q=w.instanceMatrix),R==="instanceColor"&&w.instanceColor&&(q=w.instanceColor)),q!==void 0){let tt=q.normalized,et=q.itemSize,lt=t.get(q);if(lt===void 0)continue;let It=lt.buffer,$=lt.type,nt=lt.bytesPerElement,mt=$===n.INT||$===n.UNSIGNED_INT||q.gpuType===oo;if(q.isInterleavedBufferAttribute){let at=q.data,bt=at.stride,At=q.offset;if(at.isInstancedInterleavedBuffer){for(let Lt=0;Lt<N.locationSize;Lt++)h(N.location+Lt,at.meshPerAttribute);w.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=at.meshPerAttribute*at.count)}else for(let Lt=0;Lt<N.locationSize;Lt++)d(N.location+Lt);n.bindBuffer(n.ARRAY_BUFFER,It);for(let Lt=0;Lt<N.locationSize;Lt++)b(N.location+Lt,et/N.locationSize,$,tt,bt*nt,(At+et/N.locationSize*Lt)*nt,mt)}else{if(q.isInstancedBufferAttribute){for(let at=0;at<N.locationSize;at++)h(N.location+at,q.meshPerAttribute);w.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let at=0;at<N.locationSize;at++)d(N.location+at);n.bindBuffer(n.ARRAY_BUFFER,It);for(let at=0;at<N.locationSize;at++)b(N.location+at,et/N.locationSize,$,tt,et*nt,et/N.locationSize*at*nt,mt)}}else if(X!==void 0){let tt=X[R];if(tt!==void 0)switch(tt.length){case 2:n.vertexAttrib2fv(N.location,tt);break;case 3:n.vertexAttrib3fv(N.location,tt);break;case 4:n.vertexAttrib4fv(N.location,tt);break;default:n.vertexAttrib1fv(N.location,tt)}}}}M()}function D(){P();for(let w in i){let I=i[w];for(let G in I){let B=I[G];for(let z in B)u(B[z].object),delete B[z];delete I[G]}delete i[w]}}function C(w){if(i[w.id]===void 0)return;let I=i[w.id];for(let G in I){let B=I[G];for(let z in B)u(B[z].object),delete B[z];delete I[G]}delete i[w.id]}function T(w){for(let I in i){let G=i[I];if(G[w.id]===void 0)continue;let B=G[w.id];for(let z in B)u(B[z].object),delete B[z];delete G[w.id]}}function P(){E(),a=!0,r!==s&&(r=s,c(r.object))}function E(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:P,resetDefaultState:E,dispose:D,releaseStatesOfGeometry:C,releaseStatesOfProgram:T,initAttributes:v,enableAttribute:d,disableUnusedAttributes:M}}function zf(n,t,e){let i;function s(c){i=c}function r(c,u){n.drawArrays(i,c,u),e.update(u,i,1)}function a(c,u,f){f!==0&&(n.drawArraysInstanced(i,c,u,f),e.update(u,i,f))}function o(c,u,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,u,0,f);let g=0;for(let _=0;_<f;_++)g+=u[_];e.update(g,i,1)}function l(c,u,f,m){if(f===0)return;let g=t.get("WEBGL_multi_draw");if(g===null)for(let _=0;_<c.length;_++)a(c[_],u[_],m[_]);else{g.multiDrawArraysInstancedWEBGL(i,c,0,u,0,m,0,f);let _=0;for(let v=0;v<f;v++)_+=u[v]*m[v];e.update(_,i,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Vf(n,t,e,i){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let T=t.get("EXT_texture_filter_anisotropic");s=n.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(T){return!(T!==Ze&&i.convert(T)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){let P=T===ss&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==vn&&i.convert(T)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==mn&&!P)}function l(T){if(T==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let f=e.logarithmicDepthBuffer===!0,m=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),g=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_TEXTURE_SIZE),d=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),h=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),b=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),D=_>0,C=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reverseDepthBuffer:m,maxTextures:g,maxVertexTextures:_,maxTextureSize:v,maxCubemapSize:d,maxAttributes:h,maxVertexUniforms:M,maxVaryings:b,maxFragmentUniforms:x,vertexTextures:D,maxSamples:C}}function Hf(n){let t=this,e=null,i=0,s=!1,r=!1,a=new qe,o=new Nt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,m){let g=f.length!==0||m||i!==0||s;return s=m,i=f.length,g},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,m){e=u(f,m,0)},this.setState=function(f,m,g){let _=f.clippingPlanes,v=f.clipIntersection,d=f.clipShadows,h=n.get(f);if(!s||_===null||_.length===0||r&&!d)r?u(null):c();else{let M=r?0:i,b=M*4,x=h.clippingState||null;l.value=x,x=u(_,m,b,g);for(let D=0;D!==b;++D)x[D]=e[D];h.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(f,m,g,_){let v=f!==null?f.length:0,d=null;if(v!==0){if(d=l.value,_!==!0||d===null){let h=g+v*4,M=m.matrixWorldInverse;o.getNormalMatrix(M),(d===null||d.length<h)&&(d=new Float32Array(h));for(let b=0,x=g;b!==v;++b,x+=4)a.copy(f[b]).applyMatrix4(M,o),a.normal.toArray(d,x),d[x+3]=a.constant}l.value=d,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,d}}function Gf(n){let t=new WeakMap;function e(a,o){return o===ta?a.mapping=Ci:o===ea&&(a.mapping=Ri),a}function i(a){if(a&&a.isTexture){let o=a.mapping;if(o===ta||o===ea)if(t.has(a)){let l=t.get(a).texture;return e(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new Na(l.height);return c.fromEquirectangularTexture(n,a),t.set(a,c),a.addEventListener("dispose",s),e(c.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:i,dispose:r}}var Oa=class extends Zs{constructor(t=-1,e=1,i=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-t,a=i+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Mi=4,ul=[.125,.215,.35,.446,.526,.582],qn=20,Br=new Oa,dl=new Gt,kr=null,zr=0,Vr=0,Hr=!1,Xn=(1+Math.sqrt(5))/2,xi=1/Xn,fl=[new k(-Xn,xi,0),new k(Xn,xi,0),new k(-xi,0,Xn),new k(xi,0,Xn),new k(0,Xn,-xi),new k(0,Xn,xi),new k(-1,1,-1),new k(1,1,-1),new k(-1,1,1),new k(1,1,1)],Qs=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,s=100){kr=this._renderer.getRenderTarget(),zr=this._renderer.getActiveCubeFace(),Vr=this._renderer.getActiveMipmapLevel(),Hr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,i,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ml(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(kr,zr,Vr),this._renderer.xr.enabled=Hr,t.scissorTest=!1,Cs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ci||t.mapping===Ri?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),kr=this._renderer.getRenderTarget(),zr=this._renderer.getActiveCubeFace(),Vr=this._renderer.getActiveMipmapLevel(),Hr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:sn,minFilter:sn,generateMipmaps:!1,type:ss,format:Ze,colorSpace:Ui,depthBuffer:!1},s=pl(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=pl(t,e,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Wf(r)),this._blurMaterial=Xf(r,t,e)}return s}_compileMaterial(t){let e=new Je(this._lodPlanes[0],t);this._renderer.compile(e,Br)}_sceneToCubeUV(t,e,i,s){let o=new Ce(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,m=u.toneMapping;u.getClearColor(dl),u.toneMapping=Dn,u.autoClear=!1;let g=new $s({name:"PMREM.Background",side:Le,depthWrite:!1,depthTest:!1}),_=new Je(new ts,g),v=!1,d=t.background;d?d.isColor&&(g.color.copy(d),t.background=null,v=!0):(g.color.copy(dl),v=!0);for(let h=0;h<6;h++){let M=h%3;M===0?(o.up.set(0,l[h],0),o.lookAt(c[h],0,0)):M===1?(o.up.set(0,0,l[h]),o.lookAt(0,c[h],0)):(o.up.set(0,l[h],0),o.lookAt(0,0,c[h]));let b=this._cubeSize;Cs(s,M*b,h>2?b:0,b,b),u.setRenderTarget(s),v&&u.render(_,o),u.render(t,o)}_.geometry.dispose(),_.material.dispose(),u.toneMapping=m,u.autoClear=f,t.background=d}_textureToCubeUV(t,e){let i=this._renderer,s=t.mapping===Ci||t.mapping===Ri;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=gl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ml());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new Je(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;Cs(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(a,Br)}_applyPMREM(t){let e=this._renderer,i=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=fl[(s-r-1)%fl.length];this._blur(t,r-1,r,a,o)}e.autoClear=i}_blur(t,e,i,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,i,s,"latitudinal",r),this._halfBlur(a,t,i,i,s,"longitudinal",r)}_halfBlur(t,e,i,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,f=new Je(this._lodPlanes[s],c),m=c.uniforms,g=this._sizeLods[i]-1,_=isFinite(r)?Math.PI/(2*g):2*Math.PI/(2*qn-1),v=r/_,d=isFinite(r)?1+Math.floor(u*v):qn;d>qn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${d} samples when the maximum is set to ${qn}`);let h=[],M=0;for(let T=0;T<qn;++T){let P=T/v,E=Math.exp(-P*P/2);h.push(E),T===0?M+=E:T<d&&(M+=2*E)}for(let T=0;T<h.length;T++)h[T]=h[T]/M;m.envMap.value=t.texture,m.samples.value=d,m.weights.value=h,m.latitudinal.value=a==="latitudinal",o&&(m.poleAxis.value=o);let{_lodMax:b}=this;m.dTheta.value=_,m.mipInt.value=b-i;let x=this._sizeLods[s],D=3*x*(s>b-Mi?s-b+Mi:0),C=4*(this._cubeSize-x);Cs(e,D,C,3*x,2*x),l.setRenderTarget(e),l.render(f,Br)}};function Wf(n){let t=[],e=[],i=[],s=n,r=n-Mi+1+ul.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);e.push(o);let l=1/o;a>n-Mi?l=ul[a-n+Mi-1]:a===0&&(l=0),i.push(l);let c=1/(o-2),u=-c,f=1+c,m=[u,u,f,u,f,f,u,u,f,f,u,f],g=6,_=6,v=3,d=2,h=1,M=new Float32Array(v*_*g),b=new Float32Array(d*_*g),x=new Float32Array(h*_*g);for(let C=0;C<g;C++){let T=C%3*2/3-1,P=C>2?0:-1,E=[T,P,0,T+2/3,P,0,T+2/3,P+1,0,T,P,0,T+2/3,P+1,0,T,P+1,0];M.set(E,v*_*C),b.set(m,d*_*C);let w=[C,C,C,C,C,C];x.set(w,h*_*C)}let D=new He;D.setAttribute("position",new Re(M,v)),D.setAttribute("uv",new Re(b,d)),D.setAttribute("faceIndex",new Re(x,h)),t.push(D),s>Mi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function pl(n,t,e){let i=new yn(n,t,e);return i.texture.mapping=cr,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Cs(n,t,e,i,s){n.viewport.set(t,e,i,s),n.scissor.set(t,e,i,s)}function Xf(n,t,e){let i=new Float32Array(qn),s=new k(0,1,0);return new rn({name:"SphericalGaussianBlur",defines:{n:qn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:mo(),fragmentShader:`

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
	`}function $f(n){let t=new WeakMap,e=null;function i(o){if(o&&o.isTexture){let l=o.mapping,c=l===ta||l===ea,u=l===Ci||l===Ri;if(c||u){let f=t.get(o),m=f!==void 0?f.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==m)return e===null&&(e=new Qs(n)),f=c?e.fromEquirectangular(o,f):e.fromCubemap(o,f),f.texture.pmremVersion=o.pmremVersion,t.set(o,f),f.texture;if(f!==void 0)return f.texture;{let g=o.image;return c&&g&&g.height>0||u&&g&&s(g)?(e===null&&(e=new Qs(n)),f=c?e.fromEquirectangular(o):e.fromCubemap(o),f.texture.pmremVersion=o.pmremVersion,t.set(o,f),o.addEventListener("dispose",r),f.texture):null}}}return o}function s(o){let l=0,c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:a}}function Yf(n){let t={};function e(i){if(t[i]!==void 0)return t[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return t[i]=s,s}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){let s=e(i);return s===null&&Yi("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function qf(n,t,e,i){let s={},r=new WeakMap;function a(f){let m=f.target;m.index!==null&&t.remove(m.index);for(let _ in m.attributes)t.remove(m.attributes[_]);for(let _ in m.morphAttributes){let v=m.morphAttributes[_];for(let d=0,h=v.length;d<h;d++)t.remove(v[d])}m.removeEventListener("dispose",a),delete s[m.id];let g=r.get(m);g&&(t.remove(g),r.delete(m)),i.releaseStatesOfGeometry(m),m.isInstancedBufferGeometry===!0&&delete m._maxInstanceCount,e.memory.geometries--}function o(f,m){return s[m.id]===!0||(m.addEventListener("dispose",a),s[m.id]=!0,e.memory.geometries++),m}function l(f){let m=f.attributes;for(let _ in m)t.update(m[_],n.ARRAY_BUFFER);let g=f.morphAttributes;for(let _ in g){let v=g[_];for(let d=0,h=v.length;d<h;d++)t.update(v[d],n.ARRAY_BUFFER)}}function c(f){let m=[],g=f.index,_=f.attributes.position,v=0;if(g!==null){let M=g.array;v=g.version;for(let b=0,x=M.length;b<x;b+=3){let D=M[b+0],C=M[b+1],T=M[b+2];m.push(D,C,C,T,T,D)}}else if(_!==void 0){let M=_.array;v=_.version;for(let b=0,x=M.length/3-1;b<x;b+=3){let D=b+0,C=b+1,T=b+2;m.push(D,C,C,T,T,D)}}else return;let d=new(nc(m)?qs:Ys)(m,1);d.version=v;let h=r.get(f);h&&t.remove(h),r.set(f,d)}function u(f){let m=r.get(f);if(m){let g=f.index;g!==null&&m.version<g.version&&c(f)}else c(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:u}}function Zf(n,t,e){let i;function s(m){i=m}let r,a;function o(m){r=m.type,a=m.bytesPerElement}function l(m,g){n.drawElements(i,g,r,m*a),e.update(g,i,1)}function c(m,g,_){_!==0&&(n.drawElementsInstanced(i,g,r,m*a,_),e.update(g,i,_))}function u(m,g,_){if(_===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,g,0,r,m,0,_);let d=0;for(let h=0;h<_;h++)d+=g[h];e.update(d,i,1)}function f(m,g,_,v){if(_===0)return;let d=t.get("WEBGL_multi_draw");if(d===null)for(let h=0;h<m.length;h++)c(m[h]/a,g[h],v[h]);else{d.multiDrawElementsInstancedWEBGL(i,g,0,r,m,0,v,0,_);let h=0;for(let M=0;M<_;M++)h+=g[M]*v[M];e.update(h,i,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=f}function Jf(n){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,a,o){switch(e.calls++,a){case n.TRIANGLES:e.triangles+=o*(r/3);break;case n.LINES:e.lines+=o*(r/2);break;case n.LINE_STRIP:e.lines+=o*(r-1);break;case n.LINE_LOOP:e.lines+=o*r;break;case n.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:i}}function jf(n,t,e){let i=new WeakMap,s=new ue;function r(a,o,l){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0,m=i.get(o);if(m===void 0||m.count!==f){let E=function(){T.dispose(),i.delete(o),o.removeEventListener("dispose",E)};m!==void 0&&m.texture.dispose();let g=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,d=o.morphAttributes.position||[],h=o.morphAttributes.normal||[],M=o.morphAttributes.color||[],b=0;g===!0&&(b=1),_===!0&&(b=2),v===!0&&(b=3);let x=o.attributes.position.count*b,D=1;x>t.maxTextureSize&&(D=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);let C=new Float32Array(x*D*4*f),T=new Ws(C,x,D,f);T.type=mn,T.needsUpdate=!0;let P=b*4;for(let w=0;w<f;w++){let I=d[w],G=h[w],B=M[w],z=x*D*4*w;for(let Z=0;Z<I.count;Z++){let X=Z*P;g===!0&&(s.fromBufferAttribute(I,Z),C[z+X+0]=s.x,C[z+X+1]=s.y,C[z+X+2]=s.z,C[z+X+3]=0),_===!0&&(s.fromBufferAttribute(G,Z),C[z+X+4]=s.x,C[z+X+5]=s.y,C[z+X+6]=s.z,C[z+X+7]=0),v===!0&&(s.fromBufferAttribute(B,Z),C[z+X+8]=s.x,C[z+X+9]=s.y,C[z+X+10]=s.z,C[z+X+11]=B.itemSize===4?s.w:1)}}m={count:f,texture:T,size:new kt(x,D)},i.set(o,m),o.addEventListener("dispose",E)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,e);else{let g=0;for(let v=0;v<c.length;v++)g+=c[v];let _=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(n,"morphTargetBaseInfluence",_),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",m.texture,e),l.getUniforms().setValue(n,"morphTargetsTextureSize",m.size)}return{update:r}}function Kf(n,t,e,i){let s=new WeakMap;function r(l){let c=i.render.frame,u=l.geometry,f=t.get(l,u);if(s.get(f)!==c&&(t.update(f),s.set(f,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let m=l.skeleton;s.get(m)!==c&&(m.update(),s.set(m,c))}return f}function a(){s=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}var tr=class extends Ve{constructor(t,e,i,s,r,a,o,l,c,u=wi){if(u!==wi&&u!==Ii)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===wi&&(i=jn),i===void 0&&u===Ii&&(i=Pi),super(null,s,r,a,o,l,u,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:je,this.minFilter=l!==void 0?l:je,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},ac=new Ve,_l=new tr(1,1),oc=new Ws,lc=new Da,cc=new Js,vl=[],xl=[],yl=new Float32Array(16),Ml=new Float32Array(9),bl=new Float32Array(4);function Oi(n,t,e){let i=n[0];if(i<=0||i>0)return n;let s=t*e,r=vl[s];if(r===void 0&&(r=new Float32Array(s),vl[s]=r),t!==0){i.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,n[a].toArray(r,o)}return r}function _e(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function ve(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function ur(n,t){let e=xl[t];e===void 0&&(e=new Int32Array(t),xl[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function Qf(n,t){let e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function tp(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;n.uniform2fv(this.addr,t),ve(e,t)}}function ep(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(_e(e,t))return;n.uniform3fv(this.addr,t),ve(e,t)}}function np(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;n.uniform4fv(this.addr,t),ve(e,t)}}function ip(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(_e(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),ve(e,t)}else{if(_e(e,i))return;bl.set(i),n.uniformMatrix2fv(this.addr,!1,bl),ve(e,i)}}function sp(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(_e(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),ve(e,t)}else{if(_e(e,i))return;Ml.set(i),n.uniformMatrix3fv(this.addr,!1,Ml),ve(e,i)}}function rp(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(_e(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),ve(e,t)}else{if(_e(e,i))return;yl.set(i),n.uniformMatrix4fv(this.addr,!1,yl),ve(e,i)}}function ap(n,t){let e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function op(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;n.uniform2iv(this.addr,t),ve(e,t)}}function lp(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(_e(e,t))return;n.uniform3iv(this.addr,t),ve(e,t)}}function cp(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;n.uniform4iv(this.addr,t),ve(e,t)}}function hp(n,t){let e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function up(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;n.uniform2uiv(this.addr,t),ve(e,t)}}function dp(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(_e(e,t))return;n.uniform3uiv(this.addr,t),ve(e,t)}}function fp(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;n.uniform4uiv(this.addr,t),ve(e,t)}}function pp(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(_l.compareFunction=tc,r=_l):r=ac,e.setTexture2D(t||r,s)}function mp(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture3D(t||lc,s)}function gp(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTextureCube(t||cc,s)}function _p(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture2DArray(t||oc,s)}function vp(n){switch(n){case 5126:return Qf;case 35664:return tp;case 35665:return ep;case 35666:return np;case 35674:return ip;case 35675:return sp;case 35676:return rp;case 5124:case 35670:return ap;case 35667:case 35671:return op;case 35668:case 35672:return lp;case 35669:case 35673:return cp;case 5125:return hp;case 36294:return up;case 36295:return dp;case 36296:return fp;case 35678:case 36198:case 36298:case 36306:case 35682:return pp;case 35679:case 36299:case 36307:return mp;case 35680:case 36300:case 36308:case 36293:return gp;case 36289:case 36303:case 36311:case 36292:return _p}}function xp(n,t){n.uniform1fv(this.addr,t)}function yp(n,t){let e=Oi(t,this.size,2);n.uniform2fv(this.addr,e)}function Mp(n,t){let e=Oi(t,this.size,3);n.uniform3fv(this.addr,e)}function bp(n,t){let e=Oi(t,this.size,4);n.uniform4fv(this.addr,e)}function Sp(n,t){let e=Oi(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function wp(n,t){let e=Oi(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function Ep(n,t){let e=Oi(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function Tp(n,t){n.uniform1iv(this.addr,t)}function Ap(n,t){n.uniform2iv(this.addr,t)}function Cp(n,t){n.uniform3iv(this.addr,t)}function Rp(n,t){n.uniform4iv(this.addr,t)}function Pp(n,t){n.uniform1uiv(this.addr,t)}function Ip(n,t){n.uniform2uiv(this.addr,t)}function Lp(n,t){n.uniform3uiv(this.addr,t)}function Dp(n,t){n.uniform4uiv(this.addr,t)}function Up(n,t,e){let i=this.cache,s=t.length,r=ur(e,s);_e(i,r)||(n.uniform1iv(this.addr,r),ve(i,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||ac,r[a])}function Np(n,t,e){let i=this.cache,s=t.length,r=ur(e,s);_e(i,r)||(n.uniform1iv(this.addr,r),ve(i,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||lc,r[a])}function Op(n,t,e){let i=this.cache,s=t.length,r=ur(e,s);_e(i,r)||(n.uniform1iv(this.addr,r),ve(i,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||cc,r[a])}function Fp(n,t,e){let i=this.cache,s=t.length,r=ur(e,s);_e(i,r)||(n.uniform1iv(this.addr,r),ve(i,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||oc,r[a])}function Bp(n){switch(n){case 5126:return xp;case 35664:return yp;case 35665:return Mp;case 35666:return bp;case 35674:return Sp;case 35675:return wp;case 35676:return Ep;case 5124:case 35670:return Tp;case 35667:case 35671:return Ap;case 35668:case 35672:return Cp;case 35669:case 35673:return Rp;case 5125:return Pp;case 36294:return Ip;case 36295:return Lp;case 36296:return Dp;case 35678:case 36198:case 36298:case 36306:case 35682:return Up;case 35679:case 36299:case 36307:return Np;case 35680:case 36300:case 36308:case 36293:return Op;case 36289:case 36303:case 36311:case 36292:return Fp}}var Fa=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=vp(e.type)}},Ba=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Bp(e.type)}},ka=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],i)}}},Gr=/(\w+)(\])?(\[|\.)?/g;function Sl(n,t){n.seq.push(t),n.map[t.id]=t}function kp(n,t,e){let i=n.name,s=i.length;for(Gr.lastIndex=0;;){let r=Gr.exec(i),a=Gr.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Sl(e,c===void 0?new Fa(o,n,t):new Ba(o,n,t));break}else{let f=e.map[o];f===void 0&&(f=new ka(o),Sl(e,f)),e=f}}}var Ti=class{constructor(t,e){this.seq=[],this.map={};let i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);kp(r,a,this)}}setValue(t,e,i,s){let r=this.map[e];r!==void 0&&r.setValue(t,i,s)}setOptional(t,e,i){let s=e[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,e,i,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let i=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&i.push(a)}return i}};function wl(n,t,e){let i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}var zp=37297,Vp=0;function Hp(n,t){let e=n.split(`
`),i=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;i.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return i.join(`
`)}var El=new Nt;function Gp(n){Xt._getMatrix(El,Xt.workingColorSpace,n);let t=`mat3( ${El.elements.map(e=>e.toFixed(4))} )`;switch(Xt.getTransfer(n)){case hr:return[t,"LinearTransferOETF"];case Qt:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[t,"LinearTransferOETF"]}}function Tl(n,t,e){let i=n.getShaderParameter(t,n.COMPILE_STATUS),s=n.getShaderInfoLog(t).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Hp(n.getShaderSource(t),a)}else return s}function Wp(n,t){let e=Gp(t);return[`vec4 ${n}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Xp(n,t){let e;switch(t){case Qc:e="Linear";break;case th:e="Reinhard";break;case eh:e="Cineon";break;case nh:e="ACESFilmic";break;case sh:e="AgX";break;case rh:e="Neutral";break;case ih:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Rs=new k;function $p(){Xt.getLuminanceCoefficients(Rs);let n=Rs.x.toFixed(4),t=Rs.y.toFixed(4),e=Rs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Yp(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(qi).join(`
`)}function qp(n){let t=[];for(let e in n){let i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Zp(n,t){let e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(t,s),a=r.name,o=1;r.type===n.FLOAT_MAT2&&(o=2),r.type===n.FLOAT_MAT3&&(o=3),r.type===n.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:n.getAttribLocation(t,a),locationSize:o}}return e}function qi(n){return n!==""}function Al(n,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Cl(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Jp=/^[ \t]*#include +<([\w\d./]+)>/gm;function za(n){return n.replace(Jp,Kp)}var jp=new Map;function Kp(n,t){let e=Bt[t];if(e===void 0){let i=jp.get(t);if(i!==void 0)e=Bt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return za(e)}var Qp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rl(n){return n.replace(Qp,tm)}function tm(n,t,e,i){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Pl(n){let t=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function em(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Vl?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===Lc?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===fn&&(t="SHADOWMAP_TYPE_VSM"),t}function nm(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Ci:case Ri:t="ENVMAP_TYPE_CUBE";break;case cr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function im(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Ri:t="ENVMAP_MODE_REFRACTION";break}return t}function sm(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Hl:t="ENVMAP_BLENDING_MULTIPLY";break;case jc:t="ENVMAP_BLENDING_MIX";break;case Kc:t="ENVMAP_BLENDING_ADD";break}return t}function rm(n){let t=n.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function am(n,t,e,i){let s=n.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=em(e),c=nm(e),u=im(e),f=sm(e),m=rm(e),g=Yp(e),_=qp(r),v=s.createProgram(),d,h,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(qi).join(`
`),d.length>0&&(d+=`
`),h=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(qi).join(`
`),h.length>0&&(h+=`
`)):(d=[Pl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(qi).join(`
`),h=[Pl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",m?"#define CUBEUV_TEXEL_WIDTH "+m.texelWidth:"",m?"#define CUBEUV_TEXEL_HEIGHT "+m.texelHeight:"",m?"#define CUBEUV_MAX_MIP "+m.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Dn?"#define TONE_MAPPING":"",e.toneMapping!==Dn?Bt.tonemapping_pars_fragment:"",e.toneMapping!==Dn?Xp("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Bt.colorspace_pars_fragment,Wp("linearToOutputTexel",e.outputColorSpace),$p(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(qi).join(`
`)),a=za(a),a=Al(a,e),a=Cl(a,e),o=za(o),o=Al(o,e),o=Cl(o,e),a=Rl(a),o=Rl(o),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,d=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,h=["#define varying in",e.glslVersion===Go?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Go?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);let b=M+d+a,x=M+h+o,D=wl(s,s.VERTEX_SHADER,b),C=wl(s,s.FRAGMENT_SHADER,x);s.attachShader(v,D),s.attachShader(v,C),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function T(I){if(n.debug.checkShaderErrors){let G=s.getProgramInfoLog(v).trim(),B=s.getShaderInfoLog(D).trim(),z=s.getShaderInfoLog(C).trim(),Z=!0,X=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(Z=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,v,D,C);else{let R=Tl(s,D,"vertex"),N=Tl(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+G+`
`+R+`
`+N)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(B===""||z==="")&&(X=!1);X&&(I.diagnostics={runnable:Z,programLog:G,vertexShader:{log:B,prefix:d},fragmentShader:{log:z,prefix:h}})}s.deleteShader(D),s.deleteShader(C),P=new Ti(s,v),E=Zp(s,v)}let P;this.getUniforms=function(){return P===void 0&&T(this),P};let E;this.getAttributes=function(){return E===void 0&&T(this),E};let w=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return w===!1&&(w=s.getProgramParameter(v,zp)),w},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Vp++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=D,this.fragmentShader=C,this}var om=0,Va=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,i=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(i),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){let e=this.shaderCache,i=e.get(t);return i===void 0&&(i=new Ha(t),e.set(t,i)),i}},Ha=class{constructor(t){this.id=om++,this.code=t,this.usedTimes=0}};function lm(n,t,e,i,s,r,a){let o=new Xs,l=new Va,c=new Set,u=[],f=s.logarithmicDepthBuffer,m=s.vertexTextures,g=s.precision,_={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(E){return c.add(E),E===0?"uv":`uv${E}`}function d(E,w,I,G,B){let z=G.fog,Z=B.geometry,X=E.isMeshStandardMaterial?G.environment:null,R=(E.isMeshStandardMaterial?e:t).get(E.envMap||X),N=R&&R.mapping===cr?R.image.height:null,q=_[E.type];E.precision!==null&&(g=s.getMaxPrecision(E.precision),g!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",g,"instead."));let tt=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,et=tt!==void 0?tt.length:0,lt=0;Z.morphAttributes.position!==void 0&&(lt=1),Z.morphAttributes.normal!==void 0&&(lt=2),Z.morphAttributes.color!==void 0&&(lt=3);let It,$,nt,mt;if(q){let Jt=nn[q];It=Jt.vertexShader,$=Jt.fragmentShader}else It=E.vertexShader,$=E.fragmentShader,l.update(E),nt=l.getVertexShaderID(E),mt=l.getFragmentShaderID(E);let at=n.getRenderTarget(),bt=n.state.buffers.depth.getReversed(),At=B.isInstancedMesh===!0,Lt=B.isBatchedMesh===!0,jt=!!E.map,Vt=!!E.matcap,ae=!!R,F=!!E.aoMap,$t=!!E.lightMap,Ot=!!E.bumpMap,zt=!!E.normalMap,Tt=!!E.displacementMap,Kt=!!E.emissiveMap,Et=!!E.metalnessMap,A=!!E.roughnessMap,y=E.anisotropy>0,V=E.clearcoat>0,j=E.dispersion>0,Q=E.iridescence>0,J=E.sheen>0,St=E.transmission>0,ht=y&&!!E.anisotropyMap,pt=V&&!!E.clearcoatMap,Wt=V&&!!E.clearcoatNormalMap,it=V&&!!E.clearcoatRoughnessMap,gt=Q&&!!E.iridescenceMap,Ct=Q&&!!E.iridescenceThicknessMap,Rt=J&&!!E.sheenColorMap,_t=J&&!!E.sheenRoughnessMap,Ht=!!E.specularMap,Ft=!!E.specularColorMap,ee=!!E.specularIntensityMap,L=St&&!!E.transmissionMap,ct=St&&!!E.thicknessMap,Y=!!E.gradientMap,K=!!E.alphaMap,ft=E.alphaTest>0,ut=!!E.alphaHash,Dt=!!E.extensions,le=Dn;E.toneMapped&&(at===null||at.isXRRenderTarget===!0)&&(le=n.toneMapping);let Me={shaderID:q,shaderType:E.type,shaderName:E.name,vertexShader:It,fragmentShader:$,defines:E.defines,customVertexShaderID:nt,customFragmentShaderID:mt,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:g,batching:Lt,batchingColor:Lt&&B._colorsTexture!==null,instancing:At,instancingColor:At&&B.instanceColor!==null,instancingMorph:At&&B.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:at===null?n.outputColorSpace:at.isXRRenderTarget===!0?at.texture.colorSpace:Ui,alphaToCoverage:!!E.alphaToCoverage,map:jt,matcap:Vt,envMap:ae,envMapMode:ae&&R.mapping,envMapCubeUVHeight:N,aoMap:F,lightMap:$t,bumpMap:Ot,normalMap:zt,displacementMap:m&&Tt,emissiveMap:Kt,normalMapObjectSpace:zt&&E.normalMapType===hh,normalMapTangentSpace:zt&&E.normalMapType===ch,metalnessMap:Et,roughnessMap:A,anisotropy:y,anisotropyMap:ht,clearcoat:V,clearcoatMap:pt,clearcoatNormalMap:Wt,clearcoatRoughnessMap:it,dispersion:j,iridescence:Q,iridescenceMap:gt,iridescenceThicknessMap:Ct,sheen:J,sheenColorMap:Rt,sheenRoughnessMap:_t,specularMap:Ht,specularColorMap:Ft,specularIntensityMap:ee,transmission:St,transmissionMap:L,thicknessMap:ct,gradientMap:Y,opaque:E.transparent===!1&&E.blending===Si&&E.alphaToCoverage===!1,alphaMap:K,alphaTest:ft,alphaHash:ut,combine:E.combine,mapUv:jt&&v(E.map.channel),aoMapUv:F&&v(E.aoMap.channel),lightMapUv:$t&&v(E.lightMap.channel),bumpMapUv:Ot&&v(E.bumpMap.channel),normalMapUv:zt&&v(E.normalMap.channel),displacementMapUv:Tt&&v(E.displacementMap.channel),emissiveMapUv:Kt&&v(E.emissiveMap.channel),metalnessMapUv:Et&&v(E.metalnessMap.channel),roughnessMapUv:A&&v(E.roughnessMap.channel),anisotropyMapUv:ht&&v(E.anisotropyMap.channel),clearcoatMapUv:pt&&v(E.clearcoatMap.channel),clearcoatNormalMapUv:Wt&&v(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:it&&v(E.clearcoatRoughnessMap.channel),iridescenceMapUv:gt&&v(E.iridescenceMap.channel),iridescenceThicknessMapUv:Ct&&v(E.iridescenceThicknessMap.channel),sheenColorMapUv:Rt&&v(E.sheenColorMap.channel),sheenRoughnessMapUv:_t&&v(E.sheenRoughnessMap.channel),specularMapUv:Ht&&v(E.specularMap.channel),specularColorMapUv:Ft&&v(E.specularColorMap.channel),specularIntensityMapUv:ee&&v(E.specularIntensityMap.channel),transmissionMapUv:L&&v(E.transmissionMap.channel),thicknessMapUv:ct&&v(E.thicknessMap.channel),alphaMapUv:K&&v(E.alphaMap.channel),vertexTangents:!!Z.attributes.tangent&&(zt||y),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!Z.attributes.uv&&(jt||K),fog:!!z,useFog:E.fog===!0,fogExp2:!!z&&z.isFogExp2,flatShading:E.flatShading===!0,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:f,reverseDepthBuffer:bt,skinning:B.isSkinnedMesh===!0,morphTargets:Z.morphAttributes.position!==void 0,morphNormals:Z.morphAttributes.normal!==void 0,morphColors:Z.morphAttributes.color!==void 0,morphTargetsCount:et,morphTextureStride:lt,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:E.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:le,decodeVideoTexture:jt&&E.map.isVideoTexture===!0&&Xt.getTransfer(E.map.colorSpace)===Qt,decodeVideoTextureEmissive:Kt&&E.emissiveMap.isVideoTexture===!0&&Xt.getTransfer(E.emissiveMap.colorSpace)===Qt,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===pn,flipSided:E.side===Le,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:Dt&&E.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Dt&&E.extensions.multiDraw===!0||Lt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return Me.vertexUv1s=c.has(1),Me.vertexUv2s=c.has(2),Me.vertexUv3s=c.has(3),c.clear(),Me}function h(E){let w=[];if(E.shaderID?w.push(E.shaderID):(w.push(E.customVertexShaderID),w.push(E.customFragmentShaderID)),E.defines!==void 0)for(let I in E.defines)w.push(I),w.push(E.defines[I]);return E.isRawShaderMaterial===!1&&(M(w,E),b(w,E),w.push(n.outputColorSpace)),w.push(E.customProgramCacheKey),w.join()}function M(E,w){E.push(w.precision),E.push(w.outputColorSpace),E.push(w.envMapMode),E.push(w.envMapCubeUVHeight),E.push(w.mapUv),E.push(w.alphaMapUv),E.push(w.lightMapUv),E.push(w.aoMapUv),E.push(w.bumpMapUv),E.push(w.normalMapUv),E.push(w.displacementMapUv),E.push(w.emissiveMapUv),E.push(w.metalnessMapUv),E.push(w.roughnessMapUv),E.push(w.anisotropyMapUv),E.push(w.clearcoatMapUv),E.push(w.clearcoatNormalMapUv),E.push(w.clearcoatRoughnessMapUv),E.push(w.iridescenceMapUv),E.push(w.iridescenceThicknessMapUv),E.push(w.sheenColorMapUv),E.push(w.sheenRoughnessMapUv),E.push(w.specularMapUv),E.push(w.specularColorMapUv),E.push(w.specularIntensityMapUv),E.push(w.transmissionMapUv),E.push(w.thicknessMapUv),E.push(w.combine),E.push(w.fogExp2),E.push(w.sizeAttenuation),E.push(w.morphTargetsCount),E.push(w.morphAttributeCount),E.push(w.numDirLights),E.push(w.numPointLights),E.push(w.numSpotLights),E.push(w.numSpotLightMaps),E.push(w.numHemiLights),E.push(w.numRectAreaLights),E.push(w.numDirLightShadows),E.push(w.numPointLightShadows),E.push(w.numSpotLightShadows),E.push(w.numSpotLightShadowsWithMaps),E.push(w.numLightProbes),E.push(w.shadowMapType),E.push(w.toneMapping),E.push(w.numClippingPlanes),E.push(w.numClipIntersection),E.push(w.depthPacking)}function b(E,w){o.disableAll(),w.supportsVertexTextures&&o.enable(0),w.instancing&&o.enable(1),w.instancingColor&&o.enable(2),w.instancingMorph&&o.enable(3),w.matcap&&o.enable(4),w.envMap&&o.enable(5),w.normalMapObjectSpace&&o.enable(6),w.normalMapTangentSpace&&o.enable(7),w.clearcoat&&o.enable(8),w.iridescence&&o.enable(9),w.alphaTest&&o.enable(10),w.vertexColors&&o.enable(11),w.vertexAlphas&&o.enable(12),w.vertexUv1s&&o.enable(13),w.vertexUv2s&&o.enable(14),w.vertexUv3s&&o.enable(15),w.vertexTangents&&o.enable(16),w.anisotropy&&o.enable(17),w.alphaHash&&o.enable(18),w.batching&&o.enable(19),w.dispersion&&o.enable(20),w.batchingColor&&o.enable(21),E.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.reverseDepthBuffer&&o.enable(4),w.skinning&&o.enable(5),w.morphTargets&&o.enable(6),w.morphNormals&&o.enable(7),w.morphColors&&o.enable(8),w.premultipliedAlpha&&o.enable(9),w.shadowMapEnabled&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),w.decodeVideoTextureEmissive&&o.enable(20),w.alphaToCoverage&&o.enable(21),E.push(o.mask)}function x(E){let w=_[E.type],I;if(w){let G=nn[w];I=jh.clone(G.uniforms)}else I=E.uniforms;return I}function D(E,w){let I;for(let G=0,B=u.length;G<B;G++){let z=u[G];if(z.cacheKey===w){I=z,++I.usedTimes;break}}return I===void 0&&(I=new am(n,w,E,r),u.push(I)),I}function C(E){if(--E.usedTimes===0){let w=u.indexOf(E);u[w]=u[u.length-1],u.pop(),E.destroy()}}function T(E){l.remove(E)}function P(){l.dispose()}return{getParameters:d,getProgramCacheKey:h,getUniforms:x,acquireProgram:D,releaseProgram:C,releaseShaderCache:T,programs:u,dispose:P}}function cm(){let n=new WeakMap;function t(a){return n.has(a)}function e(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function s(a,o,l){n.get(a)[o]=l}function r(){n=new WeakMap}return{has:t,get:e,remove:i,update:s,dispose:r}}function hm(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function Il(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function Ll(){let n=[],t=0,e=[],i=[],s=[];function r(){t=0,e.length=0,i.length=0,s.length=0}function a(f,m,g,_,v,d){let h=n[t];return h===void 0?(h={id:f.id,object:f,geometry:m,material:g,groupOrder:_,renderOrder:f.renderOrder,z:v,group:d},n[t]=h):(h.id=f.id,h.object=f,h.geometry=m,h.material=g,h.groupOrder=_,h.renderOrder=f.renderOrder,h.z=v,h.group=d),t++,h}function o(f,m,g,_,v,d){let h=a(f,m,g,_,v,d);g.transmission>0?i.push(h):g.transparent===!0?s.push(h):e.push(h)}function l(f,m,g,_,v,d){let h=a(f,m,g,_,v,d);g.transmission>0?i.unshift(h):g.transparent===!0?s.unshift(h):e.unshift(h)}function c(f,m){e.length>1&&e.sort(f||hm),i.length>1&&i.sort(m||Il),s.length>1&&s.sort(m||Il)}function u(){for(let f=t,m=n.length;f<m;f++){let g=n[f];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:i,transparent:s,init:r,push:o,unshift:l,finish:u,sort:c}}function um(){let n=new WeakMap;function t(i,s){let r=n.get(i),a;return r===void 0?(a=new Ll,n.set(i,[a])):s>=r.length?(a=new Ll,r.push(a)):a=r[s],a}function e(){n=new WeakMap}return{get:t,dispose:e}}function dm(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new k,color:new Gt};break;case"SpotLight":e={position:new k,direction:new k,color:new Gt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new k,color:new Gt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new k,skyColor:new Gt,groundColor:new Gt};break;case"RectAreaLight":e={color:new Gt,position:new k,halfWidth:new k,halfHeight:new k};break}return n[t.id]=e,e}}}function fm(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}var pm=0;function mm(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function gm(n){let t=new dm,e=fm(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new k);let s=new k,r=new de,a=new de;function o(c){let u=0,f=0,m=0;for(let E=0;E<9;E++)i.probe[E].set(0,0,0);let g=0,_=0,v=0,d=0,h=0,M=0,b=0,x=0,D=0,C=0,T=0;c.sort(mm);for(let E=0,w=c.length;E<w;E++){let I=c[E],G=I.color,B=I.intensity,z=I.distance,Z=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)u+=G.r*B,f+=G.g*B,m+=G.b*B;else if(I.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(I.sh.coefficients[X],B);T++}else if(I.isDirectionalLight){let X=t.get(I);if(X.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let R=I.shadow,N=e.get(I);N.shadowIntensity=R.intensity,N.shadowBias=R.bias,N.shadowNormalBias=R.normalBias,N.shadowRadius=R.radius,N.shadowMapSize=R.mapSize,i.directionalShadow[g]=N,i.directionalShadowMap[g]=Z,i.directionalShadowMatrix[g]=I.shadow.matrix,M++}i.directional[g]=X,g++}else if(I.isSpotLight){let X=t.get(I);X.position.setFromMatrixPosition(I.matrixWorld),X.color.copy(G).multiplyScalar(B),X.distance=z,X.coneCos=Math.cos(I.angle),X.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),X.decay=I.decay,i.spot[v]=X;let R=I.shadow;if(I.map&&(i.spotLightMap[D]=I.map,D++,R.updateMatrices(I),I.castShadow&&C++),i.spotLightMatrix[v]=R.matrix,I.castShadow){let N=e.get(I);N.shadowIntensity=R.intensity,N.shadowBias=R.bias,N.shadowNormalBias=R.normalBias,N.shadowRadius=R.radius,N.shadowMapSize=R.mapSize,i.spotShadow[v]=N,i.spotShadowMap[v]=Z,x++}v++}else if(I.isRectAreaLight){let X=t.get(I);X.color.copy(G).multiplyScalar(B),X.halfWidth.set(I.width*.5,0,0),X.halfHeight.set(0,I.height*.5,0),i.rectArea[d]=X,d++}else if(I.isPointLight){let X=t.get(I);if(X.color.copy(I.color).multiplyScalar(I.intensity),X.distance=I.distance,X.decay=I.decay,I.castShadow){let R=I.shadow,N=e.get(I);N.shadowIntensity=R.intensity,N.shadowBias=R.bias,N.shadowNormalBias=R.normalBias,N.shadowRadius=R.radius,N.shadowMapSize=R.mapSize,N.shadowCameraNear=R.camera.near,N.shadowCameraFar=R.camera.far,i.pointShadow[_]=N,i.pointShadowMap[_]=Z,i.pointShadowMatrix[_]=I.shadow.matrix,b++}i.point[_]=X,_++}else if(I.isHemisphereLight){let X=t.get(I);X.skyColor.copy(I.color).multiplyScalar(B),X.groundColor.copy(I.groundColor).multiplyScalar(B),i.hemi[h]=X,h++}}d>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ot.LTC_FLOAT_1,i.rectAreaLTC2=ot.LTC_FLOAT_2):(i.rectAreaLTC1=ot.LTC_HALF_1,i.rectAreaLTC2=ot.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=m;let P=i.hash;(P.directionalLength!==g||P.pointLength!==_||P.spotLength!==v||P.rectAreaLength!==d||P.hemiLength!==h||P.numDirectionalShadows!==M||P.numPointShadows!==b||P.numSpotShadows!==x||P.numSpotMaps!==D||P.numLightProbes!==T)&&(i.directional.length=g,i.spot.length=v,i.rectArea.length=d,i.point.length=_,i.hemi.length=h,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=b,i.pointShadowMap.length=b,i.spotShadow.length=x,i.spotShadowMap.length=x,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=b,i.spotLightMatrix.length=x+D-C,i.spotLightMap.length=D,i.numSpotLightShadowsWithMaps=C,i.numLightProbes=T,P.directionalLength=g,P.pointLength=_,P.spotLength=v,P.rectAreaLength=d,P.hemiLength=h,P.numDirectionalShadows=M,P.numPointShadows=b,P.numSpotShadows=x,P.numSpotMaps=D,P.numLightProbes=T,i.version=pm++)}function l(c,u){let f=0,m=0,g=0,_=0,v=0,d=u.matrixWorldInverse;for(let h=0,M=c.length;h<M;h++){let b=c[h];if(b.isDirectionalLight){let x=i.directional[f];x.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(d),f++}else if(b.isSpotLight){let x=i.spot[g];x.position.setFromMatrixPosition(b.matrixWorld),x.position.applyMatrix4(d),x.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(d),g++}else if(b.isRectAreaLight){let x=i.rectArea[_];x.position.setFromMatrixPosition(b.matrixWorld),x.position.applyMatrix4(d),a.identity(),r.copy(b.matrixWorld),r.premultiply(d),a.extractRotation(r),x.halfWidth.set(b.width*.5,0,0),x.halfHeight.set(0,b.height*.5,0),x.halfWidth.applyMatrix4(a),x.halfHeight.applyMatrix4(a),_++}else if(b.isPointLight){let x=i.point[m];x.position.setFromMatrixPosition(b.matrixWorld),x.position.applyMatrix4(d),m++}else if(b.isHemisphereLight){let x=i.hemi[v];x.direction.setFromMatrixPosition(b.matrixWorld),x.direction.transformDirection(d),v++}}}return{setup:o,setupView:l,state:i}}function Dl(n){let t=new gm(n),e=[],i=[];function s(u){c.camera=u,e.length=0,i.length=0}function r(u){e.push(u)}function a(u){i.push(u)}function o(){t.setup(e)}function l(u){t.setupView(e,u)}let c={lightsArray:e,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function _m(n){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Dl(n),t.set(s,[o])):r>=a.length?(o=new Dl(n),a.push(o)):o=a[r],o}function i(){t=new WeakMap}return{get:e,dispose:i}}var Ga=class extends Nn{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=oh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Wa=class extends Nn{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},vm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,xm=`uniform sampler2D shadow_pass;
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
}`;function ym(n,t,e){let i=new js,s=new kt,r=new kt,a=new ue,o=new Ga({depthPacking:lh}),l=new Wa,c={},u=e.maxTextureSize,f={[Un]:Le,[Le]:Un,[pn]:pn},m=new rn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new kt},radius:{value:4}},vertexShader:vm,fragmentShader:xm}),g=m.clone();g.defines.HORIZONTAL_PASS=1;let _=new He;_.setAttribute("position",new Re(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new Je(_,m),d=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Vl;let h=this.type;this.render=function(C,T,P){if(d.enabled===!1||d.autoUpdate===!1&&d.needsUpdate===!1||C.length===0)return;let E=n.getRenderTarget(),w=n.getActiveCubeFace(),I=n.getActiveMipmapLevel(),G=n.state;G.setBlending(Ln),G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);let B=h!==fn&&this.type===fn,z=h===fn&&this.type!==fn;for(let Z=0,X=C.length;Z<X;Z++){let R=C[Z],N=R.shadow;if(N===void 0){console.warn("THREE.WebGLShadowMap:",R,"has no shadow.");continue}if(N.autoUpdate===!1&&N.needsUpdate===!1)continue;s.copy(N.mapSize);let q=N.getFrameExtents();if(s.multiply(q),r.copy(N.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/q.x),s.x=r.x*q.x,N.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/q.y),s.y=r.y*q.y,N.mapSize.y=r.y)),N.map===null||B===!0||z===!0){let et=this.type!==fn?{minFilter:je,magFilter:je}:{};N.map!==null&&N.map.dispose(),N.map=new yn(s.x,s.y,et),N.map.texture.name=R.name+".shadowMap",N.camera.updateProjectionMatrix()}n.setRenderTarget(N.map),n.clear();let tt=N.getViewportCount();for(let et=0;et<tt;et++){let lt=N.getViewport(et);a.set(r.x*lt.x,r.y*lt.y,r.x*lt.z,r.y*lt.w),G.viewport(a),N.updateMatrices(R,et),i=N.getFrustum(),x(T,P,N.camera,R,this.type)}N.isPointLightShadow!==!0&&this.type===fn&&M(N,P),N.needsUpdate=!1}h=this.type,d.needsUpdate=!1,n.setRenderTarget(E,w,I)};function M(C,T){let P=t.update(v);m.defines.VSM_SAMPLES!==C.blurSamples&&(m.defines.VSM_SAMPLES=C.blurSamples,g.defines.VSM_SAMPLES=C.blurSamples,m.needsUpdate=!0,g.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new yn(s.x,s.y)),m.uniforms.shadow_pass.value=C.map.texture,m.uniforms.resolution.value=C.mapSize,m.uniforms.radius.value=C.radius,n.setRenderTarget(C.mapPass),n.clear(),n.renderBufferDirect(T,null,P,m,v,null),g.uniforms.shadow_pass.value=C.mapPass.texture,g.uniforms.resolution.value=C.mapSize,g.uniforms.radius.value=C.radius,n.setRenderTarget(C.map),n.clear(),n.renderBufferDirect(T,null,P,g,v,null)}function b(C,T,P,E){let w=null,I=P.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(I!==void 0)w=I;else if(w=P.isPointLight===!0?l:o,n.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let G=w.uuid,B=T.uuid,z=c[G];z===void 0&&(z={},c[G]=z);let Z=z[B];Z===void 0&&(Z=w.clone(),z[B]=Z,T.addEventListener("dispose",D)),w=Z}if(w.visible=T.visible,w.wireframe=T.wireframe,E===fn?w.side=T.shadowSide!==null?T.shadowSide:T.side:w.side=T.shadowSide!==null?T.shadowSide:f[T.side],w.alphaMap=T.alphaMap,w.alphaTest=T.alphaTest,w.map=T.map,w.clipShadows=T.clipShadows,w.clippingPlanes=T.clippingPlanes,w.clipIntersection=T.clipIntersection,w.displacementMap=T.displacementMap,w.displacementScale=T.displacementScale,w.displacementBias=T.displacementBias,w.wireframeLinewidth=T.wireframeLinewidth,w.linewidth=T.linewidth,P.isPointLight===!0&&w.isMeshDistanceMaterial===!0){let G=n.properties.get(w);G.light=P}return w}function x(C,T,P,E,w){if(C.visible===!1)return;if(C.layers.test(T.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&w===fn)&&(!C.frustumCulled||i.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,C.matrixWorld);let B=t.update(C),z=C.material;if(Array.isArray(z)){let Z=B.groups;for(let X=0,R=Z.length;X<R;X++){let N=Z[X],q=z[N.materialIndex];if(q&&q.visible){let tt=b(C,q,E,w);C.onBeforeShadow(n,C,T,P,B,tt,N),n.renderBufferDirect(P,null,B,tt,C,N),C.onAfterShadow(n,C,T,P,B,tt,N)}}}else if(z.visible){let Z=b(C,z,E,w);C.onBeforeShadow(n,C,T,P,B,Z,null),n.renderBufferDirect(P,null,B,Z,C,null),C.onAfterShadow(n,C,T,P,B,Z,null)}}let G=C.children;for(let B=0,z=G.length;B<z;B++)x(G[B],T,P,E,w)}function D(C){C.target.removeEventListener("dispose",D);for(let P in c){let E=c[P],w=C.target.uuid;w in E&&(E[w].dispose(),delete E[w])}}}var Mm={[Yr]:qr,[Zr]:Kr,[Jr]:Qr,[Ai]:jr,[qr]:Yr,[Kr]:Zr,[Qr]:Jr,[jr]:Ai};function bm(n,t){function e(){let L=!1,ct=new ue,Y=null,K=new ue(0,0,0,0);return{setMask:function(ft){Y!==ft&&!L&&(n.colorMask(ft,ft,ft,ft),Y=ft)},setLocked:function(ft){L=ft},setClear:function(ft,ut,Dt,le,Me){Me===!0&&(ft*=le,ut*=le,Dt*=le),ct.set(ft,ut,Dt,le),K.equals(ct)===!1&&(n.clearColor(ft,ut,Dt,le),K.copy(ct))},reset:function(){L=!1,Y=null,K.set(-1,0,0,0)}}}function i(){let L=!1,ct=!1,Y=null,K=null,ft=null;return{setReversed:function(ut){if(ct!==ut){let Dt=t.get("EXT_clip_control");ct?Dt.clipControlEXT(Dt.LOWER_LEFT_EXT,Dt.ZERO_TO_ONE_EXT):Dt.clipControlEXT(Dt.LOWER_LEFT_EXT,Dt.NEGATIVE_ONE_TO_ONE_EXT);let le=ft;ft=null,this.setClear(le)}ct=ut},getReversed:function(){return ct},setTest:function(ut){ut?at(n.DEPTH_TEST):bt(n.DEPTH_TEST)},setMask:function(ut){Y!==ut&&!L&&(n.depthMask(ut),Y=ut)},setFunc:function(ut){if(ct&&(ut=Mm[ut]),K!==ut){switch(ut){case Yr:n.depthFunc(n.NEVER);break;case qr:n.depthFunc(n.ALWAYS);break;case Zr:n.depthFunc(n.LESS);break;case Ai:n.depthFunc(n.LEQUAL);break;case Jr:n.depthFunc(n.EQUAL);break;case jr:n.depthFunc(n.GEQUAL);break;case Kr:n.depthFunc(n.GREATER);break;case Qr:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}K=ut}},setLocked:function(ut){L=ut},setClear:function(ut){ft!==ut&&(ct&&(ut=1-ut),n.clearDepth(ut),ft=ut)},reset:function(){L=!1,Y=null,K=null,ft=null,ct=!1}}}function s(){let L=!1,ct=null,Y=null,K=null,ft=null,ut=null,Dt=null,le=null,Me=null;return{setTest:function(Jt){L||(Jt?at(n.STENCIL_TEST):bt(n.STENCIL_TEST))},setMask:function(Jt){ct!==Jt&&!L&&(n.stencilMask(Jt),ct=Jt)},setFunc:function(Jt,Ge,an){(Y!==Jt||K!==Ge||ft!==an)&&(n.stencilFunc(Jt,Ge,an),Y=Jt,K=Ge,ft=an)},setOp:function(Jt,Ge,an){(ut!==Jt||Dt!==Ge||le!==an)&&(n.stencilOp(Jt,Ge,an),ut=Jt,Dt=Ge,le=an)},setLocked:function(Jt){L=Jt},setClear:function(Jt){Me!==Jt&&(n.clearStencil(Jt),Me=Jt)},reset:function(){L=!1,ct=null,Y=null,K=null,ft=null,ut=null,Dt=null,le=null,Me=null}}}let r=new e,a=new i,o=new s,l=new WeakMap,c=new WeakMap,u={},f={},m=new WeakMap,g=[],_=null,v=!1,d=null,h=null,M=null,b=null,x=null,D=null,C=null,T=new Gt(0,0,0),P=0,E=!1,w=null,I=null,G=null,B=null,z=null,Z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),X=!1,R=0,N=n.getParameter(n.VERSION);N.indexOf("WebGL")!==-1?(R=parseFloat(/^WebGL (\d)/.exec(N)[1]),X=R>=1):N.indexOf("OpenGL ES")!==-1&&(R=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),X=R>=2);let q=null,tt={},et=n.getParameter(n.SCISSOR_BOX),lt=n.getParameter(n.VIEWPORT),It=new ue().fromArray(et),$=new ue().fromArray(lt);function nt(L,ct,Y,K){let ft=new Uint8Array(4),ut=n.createTexture();n.bindTexture(L,ut),n.texParameteri(L,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(L,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Dt=0;Dt<Y;Dt++)L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY?n.texImage3D(ct,0,n.RGBA,1,1,K,0,n.RGBA,n.UNSIGNED_BYTE,ft):n.texImage2D(ct+Dt,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,ft);return ut}let mt={};mt[n.TEXTURE_2D]=nt(n.TEXTURE_2D,n.TEXTURE_2D,1),mt[n.TEXTURE_CUBE_MAP]=nt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),mt[n.TEXTURE_2D_ARRAY]=nt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),mt[n.TEXTURE_3D]=nt(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),at(n.DEPTH_TEST),a.setFunc(Ai),Ot(!1),zt(Uo),at(n.CULL_FACE),F(Ln);function at(L){u[L]!==!0&&(n.enable(L),u[L]=!0)}function bt(L){u[L]!==!1&&(n.disable(L),u[L]=!1)}function At(L,ct){return f[L]!==ct?(n.bindFramebuffer(L,ct),f[L]=ct,L===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=ct),L===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=ct),!0):!1}function Lt(L,ct){let Y=g,K=!1;if(L){Y=m.get(ct),Y===void 0&&(Y=[],m.set(ct,Y));let ft=L.textures;if(Y.length!==ft.length||Y[0]!==n.COLOR_ATTACHMENT0){for(let ut=0,Dt=ft.length;ut<Dt;ut++)Y[ut]=n.COLOR_ATTACHMENT0+ut;Y.length=ft.length,K=!0}}else Y[0]!==n.BACK&&(Y[0]=n.BACK,K=!0);K&&n.drawBuffers(Y)}function jt(L){return _!==L?(n.useProgram(L),_=L,!0):!1}let Vt={[$n]:n.FUNC_ADD,[Uc]:n.FUNC_SUBTRACT,[Nc]:n.FUNC_REVERSE_SUBTRACT};Vt[Oc]=n.MIN,Vt[Fc]=n.MAX;let ae={[Bc]:n.ZERO,[kc]:n.ONE,[zc]:n.SRC_COLOR,[Xr]:n.SRC_ALPHA,[$c]:n.SRC_ALPHA_SATURATE,[Wc]:n.DST_COLOR,[Hc]:n.DST_ALPHA,[Vc]:n.ONE_MINUS_SRC_COLOR,[$r]:n.ONE_MINUS_SRC_ALPHA,[Xc]:n.ONE_MINUS_DST_COLOR,[Gc]:n.ONE_MINUS_DST_ALPHA,[Yc]:n.CONSTANT_COLOR,[qc]:n.ONE_MINUS_CONSTANT_COLOR,[Zc]:n.CONSTANT_ALPHA,[Jc]:n.ONE_MINUS_CONSTANT_ALPHA};function F(L,ct,Y,K,ft,ut,Dt,le,Me,Jt){if(L===Ln){v===!0&&(bt(n.BLEND),v=!1);return}if(v===!1&&(at(n.BLEND),v=!0),L!==Dc){if(L!==d||Jt!==E){if((h!==$n||x!==$n)&&(n.blendEquation(n.FUNC_ADD),h=$n,x=$n),Jt)switch(L){case Si:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case No:n.blendFunc(n.ONE,n.ONE);break;case Oo:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Fo:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case Si:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case No:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Oo:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Fo:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}M=null,b=null,D=null,C=null,T.set(0,0,0),P=0,d=L,E=Jt}return}ft=ft||ct,ut=ut||Y,Dt=Dt||K,(ct!==h||ft!==x)&&(n.blendEquationSeparate(Vt[ct],Vt[ft]),h=ct,x=ft),(Y!==M||K!==b||ut!==D||Dt!==C)&&(n.blendFuncSeparate(ae[Y],ae[K],ae[ut],ae[Dt]),M=Y,b=K,D=ut,C=Dt),(le.equals(T)===!1||Me!==P)&&(n.blendColor(le.r,le.g,le.b,Me),T.copy(le),P=Me),d=L,E=!1}function $t(L,ct){L.side===pn?bt(n.CULL_FACE):at(n.CULL_FACE);let Y=L.side===Le;ct&&(Y=!Y),Ot(Y),L.blending===Si&&L.transparent===!1?F(Ln):F(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),a.setFunc(L.depthFunc),a.setTest(L.depthTest),a.setMask(L.depthWrite),r.setMask(L.colorWrite);let K=L.stencilWrite;o.setTest(K),K&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),Kt(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?at(n.SAMPLE_ALPHA_TO_COVERAGE):bt(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ot(L){w!==L&&(L?n.frontFace(n.CW):n.frontFace(n.CCW),w=L)}function zt(L){L!==Pc?(at(n.CULL_FACE),L!==I&&(L===Uo?n.cullFace(n.BACK):L===Ic?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):bt(n.CULL_FACE),I=L}function Tt(L){L!==G&&(X&&n.lineWidth(L),G=L)}function Kt(L,ct,Y){L?(at(n.POLYGON_OFFSET_FILL),(B!==ct||z!==Y)&&(n.polygonOffset(ct,Y),B=ct,z=Y)):bt(n.POLYGON_OFFSET_FILL)}function Et(L){L?at(n.SCISSOR_TEST):bt(n.SCISSOR_TEST)}function A(L){L===void 0&&(L=n.TEXTURE0+Z-1),q!==L&&(n.activeTexture(L),q=L)}function y(L,ct,Y){Y===void 0&&(q===null?Y=n.TEXTURE0+Z-1:Y=q);let K=tt[Y];K===void 0&&(K={type:void 0,texture:void 0},tt[Y]=K),(K.type!==L||K.texture!==ct)&&(q!==Y&&(n.activeTexture(Y),q=Y),n.bindTexture(L,ct||mt[L]),K.type=L,K.texture=ct)}function V(){let L=tt[q];L!==void 0&&L.type!==void 0&&(n.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function j(){try{n.compressedTexImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Q(){try{n.compressedTexImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function J(){try{n.texSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function St(){try{n.texSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ht(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function pt(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Wt(){try{n.texStorage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function it(){try{n.texStorage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function gt(){try{n.texImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ct(){try{n.texImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Rt(L){It.equals(L)===!1&&(n.scissor(L.x,L.y,L.z,L.w),It.copy(L))}function _t(L){$.equals(L)===!1&&(n.viewport(L.x,L.y,L.z,L.w),$.copy(L))}function Ht(L,ct){let Y=c.get(ct);Y===void 0&&(Y=new WeakMap,c.set(ct,Y));let K=Y.get(L);K===void 0&&(K=n.getUniformBlockIndex(ct,L.name),Y.set(L,K))}function Ft(L,ct){let K=c.get(ct).get(L);l.get(ct)!==K&&(n.uniformBlockBinding(ct,K,L.__bindingPointIndex),l.set(ct,K))}function ee(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),u={},q=null,tt={},f={},m=new WeakMap,g=[],_=null,v=!1,d=null,h=null,M=null,b=null,x=null,D=null,C=null,T=new Gt(0,0,0),P=0,E=!1,w=null,I=null,G=null,B=null,z=null,It.set(0,0,n.canvas.width,n.canvas.height),$.set(0,0,n.canvas.width,n.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:at,disable:bt,bindFramebuffer:At,drawBuffers:Lt,useProgram:jt,setBlending:F,setMaterial:$t,setFlipSided:Ot,setCullFace:zt,setLineWidth:Tt,setPolygonOffset:Kt,setScissorTest:Et,activeTexture:A,bindTexture:y,unbindTexture:V,compressedTexImage2D:j,compressedTexImage3D:Q,texImage2D:gt,texImage3D:Ct,updateUBOMapping:Ht,uniformBlockBinding:Ft,texStorage2D:Wt,texStorage3D:it,texSubImage2D:J,texSubImage3D:St,compressedTexSubImage2D:ht,compressedTexSubImage3D:pt,scissor:Rt,viewport:_t,reset:ee}}function Ul(n,t,e,i){let s=Sm(i);switch(e){case Yl:return n*t;case Zl:return n*t;case Jl:return n*t*2;case jl:return n*t/s.components*s.byteLength;case ho:return n*t/s.components*s.byteLength;case Kl:return n*t*2/s.components*s.byteLength;case uo:return n*t*2/s.components*s.byteLength;case ql:return n*t*3/s.components*s.byteLength;case Ze:return n*t*4/s.components*s.byteLength;case fo:return n*t*4/s.components*s.byteLength;case Ns:case Os:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case Fs:case Bs:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case ra:case oa:return Math.max(n,16)*Math.max(t,8)/4;case sa:case aa:return Math.max(n,8)*Math.max(t,8)/2;case la:case ca:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case ha:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case ua:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case da:return Math.floor((n+4)/5)*Math.floor((t+3)/4)*16;case fa:return Math.floor((n+4)/5)*Math.floor((t+4)/5)*16;case pa:return Math.floor((n+5)/6)*Math.floor((t+4)/5)*16;case ma:return Math.floor((n+5)/6)*Math.floor((t+5)/6)*16;case ga:return Math.floor((n+7)/8)*Math.floor((t+4)/5)*16;case _a:return Math.floor((n+7)/8)*Math.floor((t+5)/6)*16;case va:return Math.floor((n+7)/8)*Math.floor((t+7)/8)*16;case xa:return Math.floor((n+9)/10)*Math.floor((t+4)/5)*16;case ya:return Math.floor((n+9)/10)*Math.floor((t+5)/6)*16;case Ma:return Math.floor((n+9)/10)*Math.floor((t+7)/8)*16;case ba:return Math.floor((n+9)/10)*Math.floor((t+9)/10)*16;case Sa:return Math.floor((n+11)/12)*Math.floor((t+9)/10)*16;case wa:return Math.floor((n+11)/12)*Math.floor((t+11)/12)*16;case ks:case Ea:case Ta:return Math.ceil(n/4)*Math.ceil(t/4)*16;case Ql:case Aa:return Math.ceil(n/4)*Math.ceil(t/4)*8;case Ca:case Ra:return Math.ceil(n/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Sm(n){switch(n){case vn:case Wl:return{byteLength:1,components:1};case Ki:case Xl:case ss:return{byteLength:2,components:1};case lo:case co:return{byteLength:2,components:4};case jn:case oo:case mn:return{byteLength:4,components:1};case $l:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function wm(n,t,e,i,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new kt,u=new WeakMap,f,m=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(A,y){return g?new OffscreenCanvas(A,y):Hs("canvas")}function v(A,y,V){let j=1,Q=Et(A);if((Q.width>V||Q.height>V)&&(j=V/Math.max(Q.width,Q.height)),j<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let J=Math.floor(j*Q.width),St=Math.floor(j*Q.height);f===void 0&&(f=_(J,St));let ht=y?_(J,St):f;return ht.width=J,ht.height=St,ht.getContext("2d").drawImage(A,0,0,J,St),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+J+"x"+St+")."),ht}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),A;return A}function d(A){return A.generateMipmaps}function h(A){n.generateMipmap(A)}function M(A){return A.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?n.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function b(A,y,V,j,Q=!1){if(A!==null){if(n[A]!==void 0)return n[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let J=y;if(y===n.RED&&(V===n.FLOAT&&(J=n.R32F),V===n.HALF_FLOAT&&(J=n.R16F),V===n.UNSIGNED_BYTE&&(J=n.R8)),y===n.RED_INTEGER&&(V===n.UNSIGNED_BYTE&&(J=n.R8UI),V===n.UNSIGNED_SHORT&&(J=n.R16UI),V===n.UNSIGNED_INT&&(J=n.R32UI),V===n.BYTE&&(J=n.R8I),V===n.SHORT&&(J=n.R16I),V===n.INT&&(J=n.R32I)),y===n.RG&&(V===n.FLOAT&&(J=n.RG32F),V===n.HALF_FLOAT&&(J=n.RG16F),V===n.UNSIGNED_BYTE&&(J=n.RG8)),y===n.RG_INTEGER&&(V===n.UNSIGNED_BYTE&&(J=n.RG8UI),V===n.UNSIGNED_SHORT&&(J=n.RG16UI),V===n.UNSIGNED_INT&&(J=n.RG32UI),V===n.BYTE&&(J=n.RG8I),V===n.SHORT&&(J=n.RG16I),V===n.INT&&(J=n.RG32I)),y===n.RGB_INTEGER&&(V===n.UNSIGNED_BYTE&&(J=n.RGB8UI),V===n.UNSIGNED_SHORT&&(J=n.RGB16UI),V===n.UNSIGNED_INT&&(J=n.RGB32UI),V===n.BYTE&&(J=n.RGB8I),V===n.SHORT&&(J=n.RGB16I),V===n.INT&&(J=n.RGB32I)),y===n.RGBA_INTEGER&&(V===n.UNSIGNED_BYTE&&(J=n.RGBA8UI),V===n.UNSIGNED_SHORT&&(J=n.RGBA16UI),V===n.UNSIGNED_INT&&(J=n.RGBA32UI),V===n.BYTE&&(J=n.RGBA8I),V===n.SHORT&&(J=n.RGBA16I),V===n.INT&&(J=n.RGBA32I)),y===n.RGB&&V===n.UNSIGNED_INT_5_9_9_9_REV&&(J=n.RGB9_E5),y===n.RGBA){let St=Q?hr:Xt.getTransfer(j);V===n.FLOAT&&(J=n.RGBA32F),V===n.HALF_FLOAT&&(J=n.RGBA16F),V===n.UNSIGNED_BYTE&&(J=St===Qt?n.SRGB8_ALPHA8:n.RGBA8),V===n.UNSIGNED_SHORT_4_4_4_4&&(J=n.RGBA4),V===n.UNSIGNED_SHORT_5_5_5_1&&(J=n.RGB5_A1)}return(J===n.R16F||J===n.R32F||J===n.RG16F||J===n.RG32F||J===n.RGBA16F||J===n.RGBA32F)&&t.get("EXT_color_buffer_float"),J}function x(A,y){let V;return A?y===null||y===jn||y===Pi?V=n.DEPTH24_STENCIL8:y===mn?V=n.DEPTH32F_STENCIL8:y===Ki&&(V=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===jn||y===Pi?V=n.DEPTH_COMPONENT24:y===mn?V=n.DEPTH_COMPONENT32F:y===Ki&&(V=n.DEPTH_COMPONENT16),V}function D(A,y){return d(A)===!0||A.isFramebufferTexture&&A.minFilter!==je&&A.minFilter!==sn?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function C(A){let y=A.target;y.removeEventListener("dispose",C),P(y),y.isVideoTexture&&u.delete(y)}function T(A){let y=A.target;y.removeEventListener("dispose",T),w(y)}function P(A){let y=i.get(A);if(y.__webglInit===void 0)return;let V=A.source,j=m.get(V);if(j){let Q=j[y.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&E(A),Object.keys(j).length===0&&m.delete(V)}i.remove(A)}function E(A){let y=i.get(A);n.deleteTexture(y.__webglTexture);let V=A.source,j=m.get(V);delete j[y.__cacheKey],a.memory.textures--}function w(A){let y=i.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),i.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(y.__webglFramebuffer[j]))for(let Q=0;Q<y.__webglFramebuffer[j].length;Q++)n.deleteFramebuffer(y.__webglFramebuffer[j][Q]);else n.deleteFramebuffer(y.__webglFramebuffer[j]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[j])}else{if(Array.isArray(y.__webglFramebuffer))for(let j=0;j<y.__webglFramebuffer.length;j++)n.deleteFramebuffer(y.__webglFramebuffer[j]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let j=0;j<y.__webglColorRenderbuffer.length;j++)y.__webglColorRenderbuffer[j]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[j]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let V=A.textures;for(let j=0,Q=V.length;j<Q;j++){let J=i.get(V[j]);J.__webglTexture&&(n.deleteTexture(J.__webglTexture),a.memory.textures--),i.remove(V[j])}i.remove(A)}let I=0;function G(){I=0}function B(){let A=I;return A>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+s.maxTextures),I+=1,A}function z(A){let y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function Z(A,y){let V=i.get(A);if(A.isVideoTexture&&Tt(A),A.isRenderTargetTexture===!1&&A.version>0&&V.__version!==A.version){let j=A.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(V,A,y);return}}e.bindTexture(n.TEXTURE_2D,V.__webglTexture,n.TEXTURE0+y)}function X(A,y){let V=i.get(A);if(A.version>0&&V.__version!==A.version){$(V,A,y);return}e.bindTexture(n.TEXTURE_2D_ARRAY,V.__webglTexture,n.TEXTURE0+y)}function R(A,y){let V=i.get(A);if(A.version>0&&V.__version!==A.version){$(V,A,y);return}e.bindTexture(n.TEXTURE_3D,V.__webglTexture,n.TEXTURE0+y)}function N(A,y){let V=i.get(A);if(A.version>0&&V.__version!==A.version){nt(V,A,y);return}e.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture,n.TEXTURE0+y)}let q={[na]:n.REPEAT,[Zn]:n.CLAMP_TO_EDGE,[ia]:n.MIRRORED_REPEAT},tt={[je]:n.NEAREST,[ah]:n.NEAREST_MIPMAP_NEAREST,[cs]:n.NEAREST_MIPMAP_LINEAR,[sn]:n.LINEAR,[gr]:n.LINEAR_MIPMAP_NEAREST,[Jn]:n.LINEAR_MIPMAP_LINEAR},et={[uh]:n.NEVER,[_h]:n.ALWAYS,[dh]:n.LESS,[tc]:n.LEQUAL,[fh]:n.EQUAL,[gh]:n.GEQUAL,[ph]:n.GREATER,[mh]:n.NOTEQUAL};function lt(A,y){if(y.type===mn&&t.has("OES_texture_float_linear")===!1&&(y.magFilter===sn||y.magFilter===gr||y.magFilter===cs||y.magFilter===Jn||y.minFilter===sn||y.minFilter===gr||y.minFilter===cs||y.minFilter===Jn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(A,n.TEXTURE_WRAP_S,q[y.wrapS]),n.texParameteri(A,n.TEXTURE_WRAP_T,q[y.wrapT]),(A===n.TEXTURE_3D||A===n.TEXTURE_2D_ARRAY)&&n.texParameteri(A,n.TEXTURE_WRAP_R,q[y.wrapR]),n.texParameteri(A,n.TEXTURE_MAG_FILTER,tt[y.magFilter]),n.texParameteri(A,n.TEXTURE_MIN_FILTER,tt[y.minFilter]),y.compareFunction&&(n.texParameteri(A,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(A,n.TEXTURE_COMPARE_FUNC,et[y.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===je||y.minFilter!==cs&&y.minFilter!==Jn||y.type===mn&&t.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let V=t.get("EXT_texture_filter_anisotropic");n.texParameterf(A,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function It(A,y){let V=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",C));let j=y.source,Q=m.get(j);Q===void 0&&(Q={},m.set(j,Q));let J=z(y);if(J!==A.__cacheKey){Q[J]===void 0&&(Q[J]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,V=!0),Q[J].usedTimes++;let St=Q[A.__cacheKey];St!==void 0&&(Q[A.__cacheKey].usedTimes--,St.usedTimes===0&&E(y)),A.__cacheKey=J,A.__webglTexture=Q[J].texture}return V}function $(A,y,V){let j=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(j=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(j=n.TEXTURE_3D);let Q=It(A,y),J=y.source;e.bindTexture(j,A.__webglTexture,n.TEXTURE0+V);let St=i.get(J);if(J.version!==St.__version||Q===!0){e.activeTexture(n.TEXTURE0+V);let ht=Xt.getPrimaries(Xt.workingColorSpace),pt=y.colorSpace===In?null:Xt.getPrimaries(y.colorSpace),Wt=y.colorSpace===In||ht===pt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Wt);let it=v(y.image,!1,s.maxTextureSize);it=Kt(y,it);let gt=r.convert(y.format,y.colorSpace),Ct=r.convert(y.type),Rt=b(y.internalFormat,gt,Ct,y.colorSpace,y.isVideoTexture);lt(j,y);let _t,Ht=y.mipmaps,Ft=y.isVideoTexture!==!0,ee=St.__version===void 0||Q===!0,L=J.dataReady,ct=D(y,it);if(y.isDepthTexture)Rt=x(y.format===Ii,y.type),ee&&(Ft?e.texStorage2D(n.TEXTURE_2D,1,Rt,it.width,it.height):e.texImage2D(n.TEXTURE_2D,0,Rt,it.width,it.height,0,gt,Ct,null));else if(y.isDataTexture)if(Ht.length>0){Ft&&ee&&e.texStorage2D(n.TEXTURE_2D,ct,Rt,Ht[0].width,Ht[0].height);for(let Y=0,K=Ht.length;Y<K;Y++)_t=Ht[Y],Ft?L&&e.texSubImage2D(n.TEXTURE_2D,Y,0,0,_t.width,_t.height,gt,Ct,_t.data):e.texImage2D(n.TEXTURE_2D,Y,Rt,_t.width,_t.height,0,gt,Ct,_t.data);y.generateMipmaps=!1}else Ft?(ee&&e.texStorage2D(n.TEXTURE_2D,ct,Rt,it.width,it.height),L&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,it.width,it.height,gt,Ct,it.data)):e.texImage2D(n.TEXTURE_2D,0,Rt,it.width,it.height,0,gt,Ct,it.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ft&&ee&&e.texStorage3D(n.TEXTURE_2D_ARRAY,ct,Rt,Ht[0].width,Ht[0].height,it.depth);for(let Y=0,K=Ht.length;Y<K;Y++)if(_t=Ht[Y],y.format!==Ze)if(gt!==null)if(Ft){if(L)if(y.layerUpdates.size>0){let ft=Ul(_t.width,_t.height,y.format,y.type);for(let ut of y.layerUpdates){let Dt=_t.data.subarray(ut*ft/_t.data.BYTES_PER_ELEMENT,(ut+1)*ft/_t.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,ut,_t.width,_t.height,1,gt,Dt)}y.clearLayerUpdates()}else e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,0,_t.width,_t.height,it.depth,gt,_t.data)}else e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Y,Rt,_t.width,_t.height,it.depth,0,_t.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ft?L&&e.texSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,0,_t.width,_t.height,it.depth,gt,Ct,_t.data):e.texImage3D(n.TEXTURE_2D_ARRAY,Y,Rt,_t.width,_t.height,it.depth,0,gt,Ct,_t.data)}else{Ft&&ee&&e.texStorage2D(n.TEXTURE_2D,ct,Rt,Ht[0].width,Ht[0].height);for(let Y=0,K=Ht.length;Y<K;Y++)_t=Ht[Y],y.format!==Ze?gt!==null?Ft?L&&e.compressedTexSubImage2D(n.TEXTURE_2D,Y,0,0,_t.width,_t.height,gt,_t.data):e.compressedTexImage2D(n.TEXTURE_2D,Y,Rt,_t.width,_t.height,0,_t.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ft?L&&e.texSubImage2D(n.TEXTURE_2D,Y,0,0,_t.width,_t.height,gt,Ct,_t.data):e.texImage2D(n.TEXTURE_2D,Y,Rt,_t.width,_t.height,0,gt,Ct,_t.data)}else if(y.isDataArrayTexture)if(Ft){if(ee&&e.texStorage3D(n.TEXTURE_2D_ARRAY,ct,Rt,it.width,it.height,it.depth),L)if(y.layerUpdates.size>0){let Y=Ul(it.width,it.height,y.format,y.type);for(let K of y.layerUpdates){let ft=it.data.subarray(K*Y/it.data.BYTES_PER_ELEMENT,(K+1)*Y/it.data.BYTES_PER_ELEMENT);e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,K,it.width,it.height,1,gt,Ct,ft)}y.clearLayerUpdates()}else e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,gt,Ct,it.data)}else e.texImage3D(n.TEXTURE_2D_ARRAY,0,Rt,it.width,it.height,it.depth,0,gt,Ct,it.data);else if(y.isData3DTexture)Ft?(ee&&e.texStorage3D(n.TEXTURE_3D,ct,Rt,it.width,it.height,it.depth),L&&e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,gt,Ct,it.data)):e.texImage3D(n.TEXTURE_3D,0,Rt,it.width,it.height,it.depth,0,gt,Ct,it.data);else if(y.isFramebufferTexture){if(ee)if(Ft)e.texStorage2D(n.TEXTURE_2D,ct,Rt,it.width,it.height);else{let Y=it.width,K=it.height;for(let ft=0;ft<ct;ft++)e.texImage2D(n.TEXTURE_2D,ft,Rt,Y,K,0,gt,Ct,null),Y>>=1,K>>=1}}else if(Ht.length>0){if(Ft&&ee){let Y=Et(Ht[0]);e.texStorage2D(n.TEXTURE_2D,ct,Rt,Y.width,Y.height)}for(let Y=0,K=Ht.length;Y<K;Y++)_t=Ht[Y],Ft?L&&e.texSubImage2D(n.TEXTURE_2D,Y,0,0,gt,Ct,_t):e.texImage2D(n.TEXTURE_2D,Y,Rt,gt,Ct,_t);y.generateMipmaps=!1}else if(Ft){if(ee){let Y=Et(it);e.texStorage2D(n.TEXTURE_2D,ct,Rt,Y.width,Y.height)}L&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,gt,Ct,it)}else e.texImage2D(n.TEXTURE_2D,0,Rt,gt,Ct,it);d(y)&&h(j),St.__version=J.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function nt(A,y,V){if(y.image.length!==6)return;let j=It(A,y),Q=y.source;e.bindTexture(n.TEXTURE_CUBE_MAP,A.__webglTexture,n.TEXTURE0+V);let J=i.get(Q);if(Q.version!==J.__version||j===!0){e.activeTexture(n.TEXTURE0+V);let St=Xt.getPrimaries(Xt.workingColorSpace),ht=y.colorSpace===In?null:Xt.getPrimaries(y.colorSpace),pt=y.colorSpace===In||St===ht?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,pt);let Wt=y.isCompressedTexture||y.image[0].isCompressedTexture,it=y.image[0]&&y.image[0].isDataTexture,gt=[];for(let K=0;K<6;K++)!Wt&&!it?gt[K]=v(y.image[K],!0,s.maxCubemapSize):gt[K]=it?y.image[K].image:y.image[K],gt[K]=Kt(y,gt[K]);let Ct=gt[0],Rt=r.convert(y.format,y.colorSpace),_t=r.convert(y.type),Ht=b(y.internalFormat,Rt,_t,y.colorSpace),Ft=y.isVideoTexture!==!0,ee=J.__version===void 0||j===!0,L=Q.dataReady,ct=D(y,Ct);lt(n.TEXTURE_CUBE_MAP,y);let Y;if(Wt){Ft&&ee&&e.texStorage2D(n.TEXTURE_CUBE_MAP,ct,Ht,Ct.width,Ct.height);for(let K=0;K<6;K++){Y=gt[K].mipmaps;for(let ft=0;ft<Y.length;ft++){let ut=Y[ft];y.format!==Ze?Rt!==null?Ft?L&&e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft,0,0,ut.width,ut.height,Rt,ut.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft,Ht,ut.width,ut.height,0,ut.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ft?L&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft,0,0,ut.width,ut.height,Rt,_t,ut.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft,Ht,ut.width,ut.height,0,Rt,_t,ut.data)}}}else{if(Y=y.mipmaps,Ft&&ee){Y.length>0&&ct++;let K=Et(gt[0]);e.texStorage2D(n.TEXTURE_CUBE_MAP,ct,Ht,K.width,K.height)}for(let K=0;K<6;K++)if(it){Ft?L&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,gt[K].width,gt[K].height,Rt,_t,gt[K].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ht,gt[K].width,gt[K].height,0,Rt,_t,gt[K].data);for(let ft=0;ft<Y.length;ft++){let Dt=Y[ft].image[K].image;Ft?L&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft+1,0,0,Dt.width,Dt.height,Rt,_t,Dt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft+1,Ht,Dt.width,Dt.height,0,Rt,_t,Dt.data)}}else{Ft?L&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Rt,_t,gt[K]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ht,Rt,_t,gt[K]);for(let ft=0;ft<Y.length;ft++){let ut=Y[ft];Ft?L&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft+1,0,0,Rt,_t,ut.image[K]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ft+1,Ht,Rt,_t,ut.image[K])}}}d(y)&&h(n.TEXTURE_CUBE_MAP),J.__version=Q.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function mt(A,y,V,j,Q,J){let St=r.convert(V.format,V.colorSpace),ht=r.convert(V.type),pt=b(V.internalFormat,St,ht,V.colorSpace),Wt=i.get(y),it=i.get(V);if(it.__renderTarget=y,!Wt.__hasExternalTextures){let gt=Math.max(1,y.width>>J),Ct=Math.max(1,y.height>>J);Q===n.TEXTURE_3D||Q===n.TEXTURE_2D_ARRAY?e.texImage3D(Q,J,pt,gt,Ct,y.depth,0,St,ht,null):e.texImage2D(Q,J,pt,gt,Ct,0,St,ht,null)}e.bindFramebuffer(n.FRAMEBUFFER,A),zt(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,j,Q,it.__webglTexture,0,Ot(y)):(Q===n.TEXTURE_2D||Q>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,j,Q,it.__webglTexture,J),e.bindFramebuffer(n.FRAMEBUFFER,null)}function at(A,y,V){if(n.bindRenderbuffer(n.RENDERBUFFER,A),y.depthBuffer){let j=y.depthTexture,Q=j&&j.isDepthTexture?j.type:null,J=x(y.stencilBuffer,Q),St=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ht=Ot(y);zt(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ht,J,y.width,y.height):V?n.renderbufferStorageMultisample(n.RENDERBUFFER,ht,J,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,J,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,St,n.RENDERBUFFER,A)}else{let j=y.textures;for(let Q=0;Q<j.length;Q++){let J=j[Q],St=r.convert(J.format,J.colorSpace),ht=r.convert(J.type),pt=b(J.internalFormat,St,ht,J.colorSpace),Wt=Ot(y);V&&zt(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Wt,pt,y.width,y.height):zt(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Wt,pt,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,pt,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function bt(A,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let j=i.get(y.depthTexture);j.__renderTarget=y,(!j.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),Z(y.depthTexture,0);let Q=j.__webglTexture,J=Ot(y);if(y.depthTexture.format===wi)zt(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Q,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Q,0);else if(y.depthTexture.format===Ii)zt(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Q,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function At(A){let y=i.get(A),V=A.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==A.depthTexture){let j=A.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),j){let Q=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,j.removeEventListener("dispose",Q)};j.addEventListener("dispose",Q),y.__depthDisposeCallback=Q}y.__boundDepthTexture=j}if(A.depthTexture&&!y.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");bt(y.__webglFramebuffer,A)}else if(V){y.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(e.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[j]),y.__webglDepthbuffer[j]===void 0)y.__webglDepthbuffer[j]=n.createRenderbuffer(),at(y.__webglDepthbuffer[j],A,!1);else{let Q=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,J=y.__webglDepthbuffer[j];n.bindRenderbuffer(n.RENDERBUFFER,J),n.framebufferRenderbuffer(n.FRAMEBUFFER,Q,n.RENDERBUFFER,J)}}else if(e.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),at(y.__webglDepthbuffer,A,!1);else{let j=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Q=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,Q),n.framebufferRenderbuffer(n.FRAMEBUFFER,j,n.RENDERBUFFER,Q)}e.bindFramebuffer(n.FRAMEBUFFER,null)}function Lt(A,y,V){let j=i.get(A);y!==void 0&&mt(j.__webglFramebuffer,A,A.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),V!==void 0&&At(A)}function jt(A){let y=A.texture,V=i.get(A),j=i.get(y);A.addEventListener("dispose",T);let Q=A.textures,J=A.isWebGLCubeRenderTarget===!0,St=Q.length>1;if(St||(j.__webglTexture===void 0&&(j.__webglTexture=n.createTexture()),j.__version=y.version,a.memory.textures++),J){V.__webglFramebuffer=[];for(let ht=0;ht<6;ht++)if(y.mipmaps&&y.mipmaps.length>0){V.__webglFramebuffer[ht]=[];for(let pt=0;pt<y.mipmaps.length;pt++)V.__webglFramebuffer[ht][pt]=n.createFramebuffer()}else V.__webglFramebuffer[ht]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){V.__webglFramebuffer=[];for(let ht=0;ht<y.mipmaps.length;ht++)V.__webglFramebuffer[ht]=n.createFramebuffer()}else V.__webglFramebuffer=n.createFramebuffer();if(St)for(let ht=0,pt=Q.length;ht<pt;ht++){let Wt=i.get(Q[ht]);Wt.__webglTexture===void 0&&(Wt.__webglTexture=n.createTexture(),a.memory.textures++)}if(A.samples>0&&zt(A)===!1){V.__webglMultisampledFramebuffer=n.createFramebuffer(),V.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ht=0;ht<Q.length;ht++){let pt=Q[ht];V.__webglColorRenderbuffer[ht]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,V.__webglColorRenderbuffer[ht]);let Wt=r.convert(pt.format,pt.colorSpace),it=r.convert(pt.type),gt=b(pt.internalFormat,Wt,it,pt.colorSpace,A.isXRRenderTarget===!0),Ct=Ot(A);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct,gt,A.width,A.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ht,n.RENDERBUFFER,V.__webglColorRenderbuffer[ht])}n.bindRenderbuffer(n.RENDERBUFFER,null),A.depthBuffer&&(V.__webglDepthRenderbuffer=n.createRenderbuffer(),at(V.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(J){e.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),lt(n.TEXTURE_CUBE_MAP,y);for(let ht=0;ht<6;ht++)if(y.mipmaps&&y.mipmaps.length>0)for(let pt=0;pt<y.mipmaps.length;pt++)mt(V.__webglFramebuffer[ht][pt],A,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ht,pt);else mt(V.__webglFramebuffer[ht],A,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0);d(y)&&h(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(St){for(let ht=0,pt=Q.length;ht<pt;ht++){let Wt=Q[ht],it=i.get(Wt);e.bindTexture(n.TEXTURE_2D,it.__webglTexture),lt(n.TEXTURE_2D,Wt),mt(V.__webglFramebuffer,A,Wt,n.COLOR_ATTACHMENT0+ht,n.TEXTURE_2D,0),d(Wt)&&h(n.TEXTURE_2D)}e.unbindTexture()}else{let ht=n.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ht=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(ht,j.__webglTexture),lt(ht,y),y.mipmaps&&y.mipmaps.length>0)for(let pt=0;pt<y.mipmaps.length;pt++)mt(V.__webglFramebuffer[pt],A,y,n.COLOR_ATTACHMENT0,ht,pt);else mt(V.__webglFramebuffer,A,y,n.COLOR_ATTACHMENT0,ht,0);d(y)&&h(ht),e.unbindTexture()}A.depthBuffer&&At(A)}function Vt(A){let y=A.textures;for(let V=0,j=y.length;V<j;V++){let Q=y[V];if(d(Q)){let J=M(A),St=i.get(Q).__webglTexture;e.bindTexture(J,St),h(J),e.unbindTexture()}}}let ae=[],F=[];function $t(A){if(A.samples>0){if(zt(A)===!1){let y=A.textures,V=A.width,j=A.height,Q=n.COLOR_BUFFER_BIT,J=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,St=i.get(A),ht=y.length>1;if(ht)for(let pt=0;pt<y.length;pt++)e.bindFramebuffer(n.FRAMEBUFFER,St.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pt,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,St.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pt,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,St.__webglFramebuffer);for(let pt=0;pt<y.length;pt++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(Q|=n.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(Q|=n.STENCIL_BUFFER_BIT)),ht){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,St.__webglColorRenderbuffer[pt]);let Wt=i.get(y[pt]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Wt,0)}n.blitFramebuffer(0,0,V,j,0,0,V,j,Q,n.NEAREST),l===!0&&(ae.length=0,F.length=0,ae.push(n.COLOR_ATTACHMENT0+pt),A.depthBuffer&&A.resolveDepthBuffer===!1&&(ae.push(J),F.push(J),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,F)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ae))}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ht)for(let pt=0;pt<y.length;pt++){e.bindFramebuffer(n.FRAMEBUFFER,St.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pt,n.RENDERBUFFER,St.__webglColorRenderbuffer[pt]);let Wt=i.get(y[pt]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,St.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pt,n.TEXTURE_2D,Wt,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,St.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){let y=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function Ot(A){return Math.min(s.maxSamples,A.samples)}function zt(A){let y=i.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Tt(A){let y=a.render.frame;u.get(A)!==y&&(u.set(A,y),A.update())}function Kt(A,y){let V=A.colorSpace,j=A.format,Q=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||V!==Ui&&V!==In&&(Xt.getTransfer(V)===Qt?(j!==Ze||Q!==vn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),y}function Et(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=B,this.resetTextureUnits=G,this.setTexture2D=Z,this.setTexture2DArray=X,this.setTexture3D=R,this.setTextureCube=N,this.rebindTextures=Lt,this.setupRenderTarget=jt,this.updateRenderTargetMipmap=Vt,this.updateMultisampleRenderTarget=$t,this.setupDepthRenderbuffer=At,this.setupFrameBufferTexture=mt,this.useMultisampledRTT=zt}function Em(n,t){function e(i,s=In){let r,a=Xt.getTransfer(s);if(i===vn)return n.UNSIGNED_BYTE;if(i===lo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===co)return n.UNSIGNED_SHORT_5_5_5_1;if(i===$l)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Wl)return n.BYTE;if(i===Xl)return n.SHORT;if(i===Ki)return n.UNSIGNED_SHORT;if(i===oo)return n.INT;if(i===jn)return n.UNSIGNED_INT;if(i===mn)return n.FLOAT;if(i===ss)return n.HALF_FLOAT;if(i===Yl)return n.ALPHA;if(i===ql)return n.RGB;if(i===Ze)return n.RGBA;if(i===Zl)return n.LUMINANCE;if(i===Jl)return n.LUMINANCE_ALPHA;if(i===wi)return n.DEPTH_COMPONENT;if(i===Ii)return n.DEPTH_STENCIL;if(i===jl)return n.RED;if(i===ho)return n.RED_INTEGER;if(i===Kl)return n.RG;if(i===uo)return n.RG_INTEGER;if(i===fo)return n.RGBA_INTEGER;if(i===Ns||i===Os||i===Fs||i===Bs)if(a===Qt)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===Ns)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Os)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Fs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Bs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===Ns)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Os)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Fs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Bs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===sa||i===ra||i===aa||i===oa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===sa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ra)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===aa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===oa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===la||i===ca||i===ha)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(i===la||i===ca)return a===Qt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===ha)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===ua||i===da||i===fa||i===pa||i===ma||i===ga||i===_a||i===va||i===xa||i===ya||i===Ma||i===ba||i===Sa||i===wa)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(i===ua)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===da)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===fa)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===pa)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===ma)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ga)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===_a)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===va)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===xa)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ya)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Ma)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===ba)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Sa)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===wa)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ks||i===Ea||i===Ta)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(i===ks)return a===Qt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ea)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ta)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Ql||i===Aa||i===Ca||i===Ra)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(i===ks)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Aa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ca)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ra)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Pi?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:e}}var Xa=class extends Ce{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},bi=class extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}},Tm={type:"move"},ji=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new bi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new bi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new bi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let v of t.hand.values()){let d=e.getJointPose(v,i),h=this._getHandJoint(c,v);d!==null&&(h.matrix.fromArray(d.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=d.radius),h.visible=d!==null}let u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],m=u.position.distanceTo(f.position),g=.02,_=.005;c.inputState.pinching&&m>g+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&m<=g-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Tm)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let i=new bi;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}},Am=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Cm=`
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

}`,$a=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,i){if(this.texture===null){let s=new Ve,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=i.depthNear||e.depthFar!=i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,i=new rn({vertexShader:Am,fragmentShader:Cm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Je(new Ks(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ya=class extends xn{constructor(t,e){super();let i=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,f=null,m=null,g=null,_=null,v=new $a,d=e.getContextAttributes(),h=null,M=null,b=[],x=[],D=new kt,C=null,T=new Ce;T.viewport=new ue;let P=new Ce;P.viewport=new ue;let E=[T,P],w=new Xa,I=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let nt=b[$];return nt===void 0&&(nt=new ji,b[$]=nt),nt.getTargetRaySpace()},this.getControllerGrip=function($){let nt=b[$];return nt===void 0&&(nt=new ji,b[$]=nt),nt.getGripSpace()},this.getHand=function($){let nt=b[$];return nt===void 0&&(nt=new ji,b[$]=nt),nt.getHandSpace()};function B($){let nt=x.indexOf($.inputSource);if(nt===-1)return;let mt=b[nt];mt!==void 0&&(mt.update($.inputSource,$.frame,c||a),mt.dispatchEvent({type:$.type,data:$.inputSource}))}function z(){s.removeEventListener("select",B),s.removeEventListener("selectstart",B),s.removeEventListener("selectend",B),s.removeEventListener("squeeze",B),s.removeEventListener("squeezestart",B),s.removeEventListener("squeezeend",B),s.removeEventListener("end",z),s.removeEventListener("inputsourceschange",Z);for(let $=0;$<b.length;$++){let nt=x[$];nt!==null&&(x[$]=null,b[$].disconnect(nt))}I=null,G=null,v.reset(),t.setRenderTarget(h),g=null,m=null,f=null,s=null,M=null,It.stop(),i.isPresenting=!1,t.setPixelRatio(C),t.setSize(D.width,D.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return m!==null?m:g},this.getBinding=function(){return f},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(h=t.getRenderTarget(),s.addEventListener("select",B),s.addEventListener("selectstart",B),s.addEventListener("selectend",B),s.addEventListener("squeeze",B),s.addEventListener("squeezestart",B),s.addEventListener("squeezeend",B),s.addEventListener("end",z),s.addEventListener("inputsourceschange",Z),d.xrCompatible!==!0&&await e.makeXRCompatible(),C=t.getPixelRatio(),t.getSize(D),s.renderState.layers===void 0){let nt={antialias:d.antialias,alpha:!0,depth:d.depth,stencil:d.stencil,framebufferScaleFactor:r};g=new XRWebGLLayer(s,e,nt),s.updateRenderState({baseLayer:g}),t.setPixelRatio(1),t.setSize(g.framebufferWidth,g.framebufferHeight,!1),M=new yn(g.framebufferWidth,g.framebufferHeight,{format:Ze,type:vn,colorSpace:t.outputColorSpace,stencilBuffer:d.stencil})}else{let nt=null,mt=null,at=null;d.depth&&(at=d.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,nt=d.stencil?Ii:wi,mt=d.stencil?Pi:jn);let bt={colorFormat:e.RGBA8,depthFormat:at,scaleFactor:r};f=new XRWebGLBinding(s,e),m=f.createProjectionLayer(bt),s.updateRenderState({layers:[m]}),t.setPixelRatio(1),t.setSize(m.textureWidth,m.textureHeight,!1),M=new yn(m.textureWidth,m.textureHeight,{format:Ze,type:vn,depthTexture:new tr(m.textureWidth,m.textureHeight,mt,void 0,void 0,void 0,void 0,void 0,void 0,nt),stencilBuffer:d.stencil,colorSpace:t.outputColorSpace,samples:d.antialias?4:0,resolveDepthBuffer:m.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),It.setContext(s),It.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function Z($){for(let nt=0;nt<$.removed.length;nt++){let mt=$.removed[nt],at=x.indexOf(mt);at>=0&&(x[at]=null,b[at].disconnect(mt))}for(let nt=0;nt<$.added.length;nt++){let mt=$.added[nt],at=x.indexOf(mt);if(at===-1){for(let At=0;At<b.length;At++)if(At>=x.length){x.push(mt),at=At;break}else if(x[At]===null){x[At]=mt,at=At;break}if(at===-1)break}let bt=b[at];bt&&bt.connect(mt)}}let X=new k,R=new k;function N($,nt,mt){X.setFromMatrixPosition(nt.matrixWorld),R.setFromMatrixPosition(mt.matrixWorld);let at=X.distanceTo(R),bt=nt.projectionMatrix.elements,At=mt.projectionMatrix.elements,Lt=bt[14]/(bt[10]-1),jt=bt[14]/(bt[10]+1),Vt=(bt[9]+1)/bt[5],ae=(bt[9]-1)/bt[5],F=(bt[8]-1)/bt[0],$t=(At[8]+1)/At[0],Ot=Lt*F,zt=Lt*$t,Tt=at/(-F+$t),Kt=Tt*-F;if(nt.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(Kt),$.translateZ(Tt),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),bt[10]===-1)$.projectionMatrix.copy(nt.projectionMatrix),$.projectionMatrixInverse.copy(nt.projectionMatrixInverse);else{let Et=Lt+Tt,A=jt+Tt,y=Ot-Kt,V=zt+(at-Kt),j=Vt*jt/A*Et,Q=ae*jt/A*Et;$.projectionMatrix.makePerspective(y,V,j,Q,Et,A),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function q($,nt){nt===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(nt.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let nt=$.near,mt=$.far;v.texture!==null&&(v.depthNear>0&&(nt=v.depthNear),v.depthFar>0&&(mt=v.depthFar)),w.near=P.near=T.near=nt,w.far=P.far=T.far=mt,(I!==w.near||G!==w.far)&&(s.updateRenderState({depthNear:w.near,depthFar:w.far}),I=w.near,G=w.far),T.layers.mask=$.layers.mask|2,P.layers.mask=$.layers.mask|4,w.layers.mask=T.layers.mask|P.layers.mask;let at=$.parent,bt=w.cameras;q(w,at);for(let At=0;At<bt.length;At++)q(bt[At],at);bt.length===2?N(w,T,P):w.projectionMatrix.copy(T.projectionMatrix),tt($,w,at)};function tt($,nt,mt){mt===null?$.matrix.copy(nt.matrixWorld):($.matrix.copy(mt.matrixWorld),$.matrix.invert(),$.matrix.multiply(nt.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(nt.projectionMatrix),$.projectionMatrixInverse.copy(nt.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Qi*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return w},this.getFoveation=function(){if(!(m===null&&g===null))return l},this.setFoveation=function($){l=$,m!==null&&(m.fixedFoveation=$),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=$)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(w)};let et=null;function lt($,nt){if(u=nt.getViewerPose(c||a),_=nt,u!==null){let mt=u.views;g!==null&&(t.setRenderTargetFramebuffer(M,g.framebuffer),t.setRenderTarget(M));let at=!1;mt.length!==w.cameras.length&&(w.cameras.length=0,at=!0);for(let At=0;At<mt.length;At++){let Lt=mt[At],jt=null;if(g!==null)jt=g.getViewport(Lt);else{let ae=f.getViewSubImage(m,Lt);jt=ae.viewport,At===0&&(t.setRenderTargetTextures(M,ae.colorTexture,m.ignoreDepthValues?void 0:ae.depthStencilTexture),t.setRenderTarget(M))}let Vt=E[At];Vt===void 0&&(Vt=new Ce,Vt.layers.enable(At),Vt.viewport=new ue,E[At]=Vt),Vt.matrix.fromArray(Lt.transform.matrix),Vt.matrix.decompose(Vt.position,Vt.quaternion,Vt.scale),Vt.projectionMatrix.fromArray(Lt.projectionMatrix),Vt.projectionMatrixInverse.copy(Vt.projectionMatrix).invert(),Vt.viewport.set(jt.x,jt.y,jt.width,jt.height),At===0&&(w.matrix.copy(Vt.matrix),w.matrix.decompose(w.position,w.quaternion,w.scale)),at===!0&&w.cameras.push(Vt)}let bt=s.enabledFeatures;if(bt&&bt.includes("depth-sensing")){let At=f.getDepthInformation(mt[0]);At&&At.isValid&&At.texture&&v.init(t,At,s.renderState)}}for(let mt=0;mt<b.length;mt++){let at=x[mt],bt=b[mt];at!==null&&bt!==void 0&&bt.update(at,nt,c||a)}et&&et($,nt),nt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:nt}),_=null}let It=new rc;It.setAnimationLoop(lt),this.setAnimationLoop=function($){et=$},this.dispose=function(){}}},Wn=new bn,Rm=new de;function Pm(n,t){function e(d,h){d.matrixAutoUpdate===!0&&d.updateMatrix(),h.value.copy(d.matrix)}function i(d,h){h.color.getRGB(d.fogColor.value,sc(n)),h.isFog?(d.fogNear.value=h.near,d.fogFar.value=h.far):h.isFogExp2&&(d.fogDensity.value=h.density)}function s(d,h,M,b,x){h.isMeshBasicMaterial||h.isMeshLambertMaterial?r(d,h):h.isMeshToonMaterial?(r(d,h),f(d,h)):h.isMeshPhongMaterial?(r(d,h),u(d,h)):h.isMeshStandardMaterial?(r(d,h),m(d,h),h.isMeshPhysicalMaterial&&g(d,h,x)):h.isMeshMatcapMaterial?(r(d,h),_(d,h)):h.isMeshDepthMaterial?r(d,h):h.isMeshDistanceMaterial?(r(d,h),v(d,h)):h.isMeshNormalMaterial?r(d,h):h.isLineBasicMaterial?(a(d,h),h.isLineDashedMaterial&&o(d,h)):h.isPointsMaterial?l(d,h,M,b):h.isSpriteMaterial?c(d,h):h.isShadowMaterial?(d.color.value.copy(h.color),d.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function r(d,h){d.opacity.value=h.opacity,h.color&&d.diffuse.value.copy(h.color),h.emissive&&d.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(d.map.value=h.map,e(h.map,d.mapTransform)),h.alphaMap&&(d.alphaMap.value=h.alphaMap,e(h.alphaMap,d.alphaMapTransform)),h.bumpMap&&(d.bumpMap.value=h.bumpMap,e(h.bumpMap,d.bumpMapTransform),d.bumpScale.value=h.bumpScale,h.side===Le&&(d.bumpScale.value*=-1)),h.normalMap&&(d.normalMap.value=h.normalMap,e(h.normalMap,d.normalMapTransform),d.normalScale.value.copy(h.normalScale),h.side===Le&&d.normalScale.value.negate()),h.displacementMap&&(d.displacementMap.value=h.displacementMap,e(h.displacementMap,d.displacementMapTransform),d.displacementScale.value=h.displacementScale,d.displacementBias.value=h.displacementBias),h.emissiveMap&&(d.emissiveMap.value=h.emissiveMap,e(h.emissiveMap,d.emissiveMapTransform)),h.specularMap&&(d.specularMap.value=h.specularMap,e(h.specularMap,d.specularMapTransform)),h.alphaTest>0&&(d.alphaTest.value=h.alphaTest);let M=t.get(h),b=M.envMap,x=M.envMapRotation;b&&(d.envMap.value=b,Wn.copy(x),Wn.x*=-1,Wn.y*=-1,Wn.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(Wn.y*=-1,Wn.z*=-1),d.envMapRotation.value.setFromMatrix4(Rm.makeRotationFromEuler(Wn)),d.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,d.reflectivity.value=h.reflectivity,d.ior.value=h.ior,d.refractionRatio.value=h.refractionRatio),h.lightMap&&(d.lightMap.value=h.lightMap,d.lightMapIntensity.value=h.lightMapIntensity,e(h.lightMap,d.lightMapTransform)),h.aoMap&&(d.aoMap.value=h.aoMap,d.aoMapIntensity.value=h.aoMapIntensity,e(h.aoMap,d.aoMapTransform))}function a(d,h){d.diffuse.value.copy(h.color),d.opacity.value=h.opacity,h.map&&(d.map.value=h.map,e(h.map,d.mapTransform))}function o(d,h){d.dashSize.value=h.dashSize,d.totalSize.value=h.dashSize+h.gapSize,d.scale.value=h.scale}function l(d,h,M,b){d.diffuse.value.copy(h.color),d.opacity.value=h.opacity,d.size.value=h.size*M,d.scale.value=b*.5,h.map&&(d.map.value=h.map,e(h.map,d.uvTransform)),h.alphaMap&&(d.alphaMap.value=h.alphaMap,e(h.alphaMap,d.alphaMapTransform)),h.alphaTest>0&&(d.alphaTest.value=h.alphaTest)}function c(d,h){d.diffuse.value.copy(h.color),d.opacity.value=h.opacity,d.rotation.value=h.rotation,h.map&&(d.map.value=h.map,e(h.map,d.mapTransform)),h.alphaMap&&(d.alphaMap.value=h.alphaMap,e(h.alphaMap,d.alphaMapTransform)),h.alphaTest>0&&(d.alphaTest.value=h.alphaTest)}function u(d,h){d.specular.value.copy(h.specular),d.shininess.value=Math.max(h.shininess,1e-4)}function f(d,h){h.gradientMap&&(d.gradientMap.value=h.gradientMap)}function m(d,h){d.metalness.value=h.metalness,h.metalnessMap&&(d.metalnessMap.value=h.metalnessMap,e(h.metalnessMap,d.metalnessMapTransform)),d.roughness.value=h.roughness,h.roughnessMap&&(d.roughnessMap.value=h.roughnessMap,e(h.roughnessMap,d.roughnessMapTransform)),h.envMap&&(d.envMapIntensity.value=h.envMapIntensity)}function g(d,h,M){d.ior.value=h.ior,h.sheen>0&&(d.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),d.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(d.sheenColorMap.value=h.sheenColorMap,e(h.sheenColorMap,d.sheenColorMapTransform)),h.sheenRoughnessMap&&(d.sheenRoughnessMap.value=h.sheenRoughnessMap,e(h.sheenRoughnessMap,d.sheenRoughnessMapTransform))),h.clearcoat>0&&(d.clearcoat.value=h.clearcoat,d.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(d.clearcoatMap.value=h.clearcoatMap,e(h.clearcoatMap,d.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(d.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,e(h.clearcoatRoughnessMap,d.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(d.clearcoatNormalMap.value=h.clearcoatNormalMap,e(h.clearcoatNormalMap,d.clearcoatNormalMapTransform),d.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Le&&d.clearcoatNormalScale.value.negate())),h.dispersion>0&&(d.dispersion.value=h.dispersion),h.iridescence>0&&(d.iridescence.value=h.iridescence,d.iridescenceIOR.value=h.iridescenceIOR,d.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],d.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(d.iridescenceMap.value=h.iridescenceMap,e(h.iridescenceMap,d.iridescenceMapTransform)),h.iridescenceThicknessMap&&(d.iridescenceThicknessMap.value=h.iridescenceThicknessMap,e(h.iridescenceThicknessMap,d.iridescenceThicknessMapTransform))),h.transmission>0&&(d.transmission.value=h.transmission,d.transmissionSamplerMap.value=M.texture,d.transmissionSamplerSize.value.set(M.width,M.height),h.transmissionMap&&(d.transmissionMap.value=h.transmissionMap,e(h.transmissionMap,d.transmissionMapTransform)),d.thickness.value=h.thickness,h.thicknessMap&&(d.thicknessMap.value=h.thicknessMap,e(h.thicknessMap,d.thicknessMapTransform)),d.attenuationDistance.value=h.attenuationDistance,d.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(d.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(d.anisotropyMap.value=h.anisotropyMap,e(h.anisotropyMap,d.anisotropyMapTransform))),d.specularIntensity.value=h.specularIntensity,d.specularColor.value.copy(h.specularColor),h.specularColorMap&&(d.specularColorMap.value=h.specularColorMap,e(h.specularColorMap,d.specularColorMapTransform)),h.specularIntensityMap&&(d.specularIntensityMap.value=h.specularIntensityMap,e(h.specularIntensityMap,d.specularIntensityMapTransform))}function _(d,h){h.matcap&&(d.matcap.value=h.matcap)}function v(d,h){let M=t.get(h).light;d.referencePosition.value.setFromMatrixPosition(M.matrixWorld),d.nearDistance.value=M.shadow.camera.near,d.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function Im(n,t,e,i){let s={},r={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,b){let x=b.program;i.uniformBlockBinding(M,x)}function c(M,b){let x=s[M.id];x===void 0&&(_(M),x=u(M),s[M.id]=x,M.addEventListener("dispose",d));let D=b.program;i.updateUBOMapping(M,D);let C=t.render.frame;r[M.id]!==C&&(m(M),r[M.id]=C)}function u(M){let b=f();M.__bindingPointIndex=b;let x=n.createBuffer(),D=M.__size,C=M.usage;return n.bindBuffer(n.UNIFORM_BUFFER,x),n.bufferData(n.UNIFORM_BUFFER,D,C),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,b,x),x}function f(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function m(M){let b=s[M.id],x=M.uniforms,D=M.__cache;n.bindBuffer(n.UNIFORM_BUFFER,b);for(let C=0,T=x.length;C<T;C++){let P=Array.isArray(x[C])?x[C]:[x[C]];for(let E=0,w=P.length;E<w;E++){let I=P[E];if(g(I,C,E,D)===!0){let G=I.__offset,B=Array.isArray(I.value)?I.value:[I.value],z=0;for(let Z=0;Z<B.length;Z++){let X=B[Z],R=v(X);typeof X=="number"||typeof X=="boolean"?(I.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,G+z,I.__data)):X.isMatrix3?(I.__data[0]=X.elements[0],I.__data[1]=X.elements[1],I.__data[2]=X.elements[2],I.__data[3]=0,I.__data[4]=X.elements[3],I.__data[5]=X.elements[4],I.__data[6]=X.elements[5],I.__data[7]=0,I.__data[8]=X.elements[6],I.__data[9]=X.elements[7],I.__data[10]=X.elements[8],I.__data[11]=0):(X.toArray(I.__data,z),z+=R.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,G,I.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function g(M,b,x,D){let C=M.value,T=b+"_"+x;if(D[T]===void 0)return typeof C=="number"||typeof C=="boolean"?D[T]=C:D[T]=C.clone(),!0;{let P=D[T];if(typeof C=="number"||typeof C=="boolean"){if(P!==C)return D[T]=C,!0}else if(P.equals(C)===!1)return P.copy(C),!0}return!1}function _(M){let b=M.uniforms,x=0,D=16;for(let T=0,P=b.length;T<P;T++){let E=Array.isArray(b[T])?b[T]:[b[T]];for(let w=0,I=E.length;w<I;w++){let G=E[w],B=Array.isArray(G.value)?G.value:[G.value];for(let z=0,Z=B.length;z<Z;z++){let X=B[z],R=v(X),N=x%D,q=N%R.boundary,tt=N+q;x+=q,tt!==0&&D-tt<R.storage&&(x+=D-tt),G.__data=new Float32Array(R.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=x,x+=R.storage}}}let C=x%D;return C>0&&(x+=D-C),M.__size=x,M.__cache={},this}function v(M){let b={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(b.boundary=4,b.storage=4):M.isVector2?(b.boundary=8,b.storage=8):M.isVector3||M.isColor?(b.boundary=16,b.storage=12):M.isVector4?(b.boundary=16,b.storage=16):M.isMatrix3?(b.boundary=48,b.storage=48):M.isMatrix4?(b.boundary=64,b.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),b}function d(M){let b=M.target;b.removeEventListener("dispose",d);let x=a.indexOf(b.__bindingPointIndex);a.splice(x,1),n.deleteBuffer(s[b.id]),delete s[b.id],delete r[b.id]}function h(){for(let M in s)n.deleteBuffer(s[M]);a=[],s={},r={}}return{bind:l,update:c,dispose:h}}var er=class{constructor(t={}){let{canvas:e=Uh(),context:i=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reverseDepthBuffer:m=!1}=t;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;let _=new Uint32Array(4),v=new Int32Array(4),d=null,h=null,M=[],b=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ze,this.toneMapping=Dn,this.toneMappingExposure=1;let x=this,D=!1,C=0,T=0,P=null,E=-1,w=null,I=new ue,G=new ue,B=null,z=new Gt(0),Z=0,X=e.width,R=e.height,N=1,q=null,tt=null,et=new ue(0,0,X,R),lt=new ue(0,0,X,R),It=!1,$=new js,nt=!1,mt=!1,at=new de,bt=new de,At=new k,Lt=new ue,jt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Vt=!1;function ae(){return P===null?N:1}let F=i;function $t(S,U){return e.getContext(S,U)}try{let S={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${ao}`),e.addEventListener("webglcontextlost",K,!1),e.addEventListener("webglcontextrestored",ft,!1),e.addEventListener("webglcontextcreationerror",ut,!1),F===null){let U="webgl2";if(F=$t(U,S),F===null)throw $t(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let Ot,zt,Tt,Kt,Et,A,y,V,j,Q,J,St,ht,pt,Wt,it,gt,Ct,Rt,_t,Ht,Ft,ee,L;function ct(){Ot=new Yf(F),Ot.init(),Ft=new Em(F,Ot),zt=new Vf(F,Ot,t,Ft),Tt=new bm(F,Ot),zt.reverseDepthBuffer&&m&&Tt.buffers.depth.setReversed(!0),Kt=new Jf(F),Et=new cm,A=new wm(F,Ot,Tt,Et,zt,Ft,Kt),y=new Gf(x),V=new $f(x),j=new nu(F),ee=new kf(F,j),Q=new qf(F,j,Kt,ee),J=new Kf(F,Q,j,Kt),Rt=new jf(F,zt,A),it=new Hf(Et),St=new lm(x,y,V,Ot,zt,ee,it),ht=new Pm(x,Et),pt=new um,Wt=new _m(Ot),Ct=new Bf(x,y,V,Tt,J,g,l),gt=new ym(x,J,zt),L=new Im(F,Kt,zt,Tt),_t=new zf(F,Ot,Kt),Ht=new Zf(F,Ot,Kt),Kt.programs=St.programs,x.capabilities=zt,x.extensions=Ot,x.properties=Et,x.renderLists=pt,x.shadowMap=gt,x.state=Tt,x.info=Kt}ct();let Y=new Ya(x,F);this.xr=Y,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let S=Ot.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Ot.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return N},this.setPixelRatio=function(S){S!==void 0&&(N=S,this.setSize(X,R,!1))},this.getSize=function(S){return S.set(X,R)},this.setSize=function(S,U,H=!0){if(Y.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}X=S,R=U,e.width=Math.floor(S*N),e.height=Math.floor(U*N),H===!0&&(e.style.width=S+"px",e.style.height=U+"px"),this.setViewport(0,0,S,U)},this.getDrawingBufferSize=function(S){return S.set(X*N,R*N).floor()},this.setDrawingBufferSize=function(S,U,H){X=S,R=U,N=H,e.width=Math.floor(S*H),e.height=Math.floor(U*H),this.setViewport(0,0,S,U)},this.getCurrentViewport=function(S){return S.copy(I)},this.getViewport=function(S){return S.copy(et)},this.setViewport=function(S,U,H,W){S.isVector4?et.set(S.x,S.y,S.z,S.w):et.set(S,U,H,W),Tt.viewport(I.copy(et).multiplyScalar(N).round())},this.getScissor=function(S){return S.copy(lt)},this.setScissor=function(S,U,H,W){S.isVector4?lt.set(S.x,S.y,S.z,S.w):lt.set(S,U,H,W),Tt.scissor(G.copy(lt).multiplyScalar(N).round())},this.getScissorTest=function(){return It},this.setScissorTest=function(S){Tt.setScissorTest(It=S)},this.setOpaqueSort=function(S){q=S},this.setTransparentSort=function(S){tt=S},this.getClearColor=function(S){return S.copy(Ct.getClearColor())},this.setClearColor=function(){Ct.setClearColor.apply(Ct,arguments)},this.getClearAlpha=function(){return Ct.getClearAlpha()},this.setClearAlpha=function(){Ct.setClearAlpha.apply(Ct,arguments)},this.clear=function(S=!0,U=!0,H=!0){let W=0;if(S){let O=!1;if(P!==null){let st=P.texture.format;O=st===fo||st===uo||st===ho}if(O){let st=P.texture.type,dt=st===vn||st===jn||st===Ki||st===Pi||st===lo||st===co,xt=Ct.getClearColor(),yt=Ct.getClearAlpha(),Pt=xt.r,Ut=xt.g,Mt=xt.b;dt?(_[0]=Pt,_[1]=Ut,_[2]=Mt,_[3]=yt,F.clearBufferuiv(F.COLOR,0,_)):(v[0]=Pt,v[1]=Ut,v[2]=Mt,v[3]=yt,F.clearBufferiv(F.COLOR,0,v))}else W|=F.COLOR_BUFFER_BIT}U&&(W|=F.DEPTH_BUFFER_BIT),H&&(W|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",K,!1),e.removeEventListener("webglcontextrestored",ft,!1),e.removeEventListener("webglcontextcreationerror",ut,!1),pt.dispose(),Wt.dispose(),Et.dispose(),y.dispose(),V.dispose(),J.dispose(),ee.dispose(),L.dispose(),St.dispose(),Y.dispose(),Y.removeEventListener("sessionstart",wo),Y.removeEventListener("sessionend",Eo),Bn.stop()};function K(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),D=!0}function ft(){console.log("THREE.WebGLRenderer: Context Restored."),D=!1;let S=Kt.autoReset,U=gt.enabled,H=gt.autoUpdate,W=gt.needsUpdate,O=gt.type;ct(),Kt.autoReset=S,gt.enabled=U,gt.autoUpdate=H,gt.needsUpdate=W,gt.type=O}function ut(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Dt(S){let U=S.target;U.removeEventListener("dispose",Dt),le(U)}function le(S){Me(S),Et.remove(S)}function Me(S){let U=Et.get(S).programs;U!==void 0&&(U.forEach(function(H){St.releaseProgram(H)}),S.isShaderMaterial&&St.releaseShaderCache(S))}this.renderBufferDirect=function(S,U,H,W,O,st){U===null&&(U=jt);let dt=O.isMesh&&O.matrixWorld.determinant()<0,xt=wc(S,U,H,W,O);Tt.setMaterial(W,dt);let yt=H.index,Pt=1;if(W.wireframe===!0){if(yt=Q.getWireframeAttribute(H),yt===void 0)return;Pt=2}let Ut=H.drawRange,Mt=H.attributes.position,Yt=Ut.start*Pt,ne=(Ut.start+Ut.count)*Pt;st!==null&&(Yt=Math.max(Yt,st.start*Pt),ne=Math.min(ne,(st.start+st.count)*Pt)),yt!==null?(Yt=Math.max(Yt,0),ne=Math.min(ne,yt.count)):Mt!=null&&(Yt=Math.max(Yt,0),ne=Math.min(ne,Mt.count));let ie=ne-Yt;if(ie<0||ie===1/0)return;ee.setup(O,W,xt,H,yt);let Pe,qt=_t;if(yt!==null&&(Pe=j.get(yt),qt=Ht,qt.setIndex(Pe)),O.isMesh)W.wireframe===!0?(Tt.setLineWidth(W.wireframeLinewidth*ae()),qt.setMode(F.LINES)):qt.setMode(F.TRIANGLES);else if(O.isLine){let wt=W.linewidth;wt===void 0&&(wt=1),Tt.setLineWidth(wt*ae()),O.isLineSegments?qt.setMode(F.LINES):O.isLineLoop?qt.setMode(F.LINE_LOOP):qt.setMode(F.LINE_STRIP)}else O.isPoints?qt.setMode(F.POINTS):O.isSprite&&qt.setMode(F.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)qt.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(Ot.get("WEBGL_multi_draw"))qt.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let wt=O._multiDrawStarts,on=O._multiDrawCounts,Zt=O._multiDrawCount,We=yt?j.get(yt).bytesPerElement:1,ri=Et.get(W).currentProgram.getUniforms();for(let Ue=0;Ue<Zt;Ue++)ri.setValue(F,"_gl_DrawID",Ue),qt.render(wt[Ue]/We,on[Ue])}else if(O.isInstancedMesh)qt.renderInstances(Yt,ie,O.count);else if(H.isInstancedBufferGeometry){let wt=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,on=Math.min(H.instanceCount,wt);qt.renderInstances(Yt,ie,on)}else qt.render(Yt,ie)};function Jt(S,U,H){S.transparent===!0&&S.side===pn&&S.forceSinglePass===!1?(S.side=Le,S.needsUpdate=!0,ls(S,U,H),S.side=Un,S.needsUpdate=!0,ls(S,U,H),S.side=pn):ls(S,U,H)}this.compile=function(S,U,H=null){H===null&&(H=S),h=Wt.get(H),h.init(U),b.push(h),H.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(h.pushLight(O),O.castShadow&&h.pushShadow(O))}),S!==H&&S.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(h.pushLight(O),O.castShadow&&h.pushShadow(O))}),h.setupLights();let W=new Set;return S.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let st=O.material;if(st)if(Array.isArray(st))for(let dt=0;dt<st.length;dt++){let xt=st[dt];Jt(xt,H,O),W.add(xt)}else Jt(st,H,O),W.add(st)}),b.pop(),h=null,W},this.compileAsync=function(S,U,H=null){let W=this.compile(S,U,H);return new Promise(O=>{function st(){if(W.forEach(function(dt){Et.get(dt).currentProgram.isReady()&&W.delete(dt)}),W.size===0){O(S);return}setTimeout(st,10)}Ot.get("KHR_parallel_shader_compile")!==null?st():setTimeout(st,10)})};let Ge=null;function an(S){Ge&&Ge(S)}function wo(){Bn.stop()}function Eo(){Bn.start()}let Bn=new rc;Bn.setAnimationLoop(an),typeof self<"u"&&Bn.setContext(self),this.setAnimationLoop=function(S){Ge=S,Y.setAnimationLoop(S),S===null?Bn.stop():Bn.start()},Y.addEventListener("sessionstart",wo),Y.addEventListener("sessionend",Eo),this.render=function(S,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Y.enabled===!0&&Y.isPresenting===!0&&(Y.cameraAutoUpdate===!0&&Y.updateCamera(U),U=Y.getCamera()),S.isScene===!0&&S.onBeforeRender(x,S,U,P),h=Wt.get(S,b.length),h.init(U),b.push(h),bt.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),$.setFromProjectionMatrix(bt),mt=this.localClippingEnabled,nt=it.init(this.clippingPlanes,mt),d=pt.get(S,M.length),d.init(),M.push(d),Y.enabled===!0&&Y.isPresenting===!0){let st=x.xr.getDepthSensingMesh();st!==null&&mr(st,U,-1/0,x.sortObjects)}mr(S,U,0,x.sortObjects),d.finish(),x.sortObjects===!0&&d.sort(q,tt),Vt=Y.enabled===!1||Y.isPresenting===!1||Y.hasDepthSensing()===!1,Vt&&Ct.addToRenderList(d,S),this.info.render.frame++,nt===!0&&it.beginShadows();let H=h.state.shadowsArray;gt.render(H,S,U),nt===!0&&it.endShadows(),this.info.autoReset===!0&&this.info.reset();let W=d.opaque,O=d.transmissive;if(h.setupLights(),U.isArrayCamera){let st=U.cameras;if(O.length>0)for(let dt=0,xt=st.length;dt<xt;dt++){let yt=st[dt];Ao(W,O,S,yt)}Vt&&Ct.render(S);for(let dt=0,xt=st.length;dt<xt;dt++){let yt=st[dt];To(d,S,yt,yt.viewport)}}else O.length>0&&Ao(W,O,S,U),Vt&&Ct.render(S),To(d,S,U);P!==null&&(A.updateMultisampleRenderTarget(P),A.updateRenderTargetMipmap(P)),S.isScene===!0&&S.onAfterRender(x,S,U),ee.resetDefaultState(),E=-1,w=null,b.pop(),b.length>0?(h=b[b.length-1],nt===!0&&it.setGlobalState(x.clippingPlanes,h.state.camera)):h=null,M.pop(),M.length>0?d=M[M.length-1]:d=null};function mr(S,U,H,W){if(S.visible===!1)return;if(S.layers.test(U.layers)){if(S.isGroup)H=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(U);else if(S.isLight)h.pushLight(S),S.castShadow&&h.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||$.intersectsSprite(S)){W&&Lt.setFromMatrixPosition(S.matrixWorld).applyMatrix4(bt);let dt=J.update(S),xt=S.material;xt.visible&&d.push(S,dt,xt,H,Lt.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||$.intersectsObject(S))){let dt=J.update(S),xt=S.material;if(W&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),Lt.copy(S.boundingSphere.center)):(dt.boundingSphere===null&&dt.computeBoundingSphere(),Lt.copy(dt.boundingSphere.center)),Lt.applyMatrix4(S.matrixWorld).applyMatrix4(bt)),Array.isArray(xt)){let yt=dt.groups;for(let Pt=0,Ut=yt.length;Pt<Ut;Pt++){let Mt=yt[Pt],Yt=xt[Mt.materialIndex];Yt&&Yt.visible&&d.push(S,dt,Yt,H,Lt.z,Mt)}}else xt.visible&&d.push(S,dt,xt,H,Lt.z,null)}}let st=S.children;for(let dt=0,xt=st.length;dt<xt;dt++)mr(st[dt],U,H,W)}function To(S,U,H,W){let O=S.opaque,st=S.transmissive,dt=S.transparent;h.setupLightsView(H),nt===!0&&it.setGlobalState(x.clippingPlanes,H),W&&Tt.viewport(I.copy(W)),O.length>0&&os(O,U,H),st.length>0&&os(st,U,H),dt.length>0&&os(dt,U,H),Tt.buffers.depth.setTest(!0),Tt.buffers.depth.setMask(!0),Tt.buffers.color.setMask(!0),Tt.setPolygonOffset(!1)}function Ao(S,U,H,W){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;h.state.transmissionRenderTarget[W.id]===void 0&&(h.state.transmissionRenderTarget[W.id]=new yn(1,1,{generateMipmaps:!0,type:Ot.has("EXT_color_buffer_half_float")||Ot.has("EXT_color_buffer_float")?ss:vn,minFilter:Jn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Xt.workingColorSpace}));let st=h.state.transmissionRenderTarget[W.id],dt=W.viewport||I;st.setSize(dt.z,dt.w);let xt=x.getRenderTarget();x.setRenderTarget(st),x.getClearColor(z),Z=x.getClearAlpha(),Z<1&&x.setClearColor(16777215,.5),x.clear(),Vt&&Ct.render(H);let yt=x.toneMapping;x.toneMapping=Dn;let Pt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),h.setupLightsView(W),nt===!0&&it.setGlobalState(x.clippingPlanes,W),os(S,H,W),A.updateMultisampleRenderTarget(st),A.updateRenderTargetMipmap(st),Ot.has("WEBGL_multisampled_render_to_texture")===!1){let Ut=!1;for(let Mt=0,Yt=U.length;Mt<Yt;Mt++){let ne=U[Mt],ie=ne.object,Pe=ne.geometry,qt=ne.material,wt=ne.group;if(qt.side===pn&&ie.layers.test(W.layers)){let on=qt.side;qt.side=Le,qt.needsUpdate=!0,Co(ie,H,W,Pe,qt,wt),qt.side=on,qt.needsUpdate=!0,Ut=!0}}Ut===!0&&(A.updateMultisampleRenderTarget(st),A.updateRenderTargetMipmap(st))}x.setRenderTarget(xt),x.setClearColor(z,Z),Pt!==void 0&&(W.viewport=Pt),x.toneMapping=yt}function os(S,U,H){let W=U.isScene===!0?U.overrideMaterial:null;for(let O=0,st=S.length;O<st;O++){let dt=S[O],xt=dt.object,yt=dt.geometry,Pt=W===null?dt.material:W,Ut=dt.group;xt.layers.test(H.layers)&&Co(xt,U,H,yt,Pt,Ut)}}function Co(S,U,H,W,O,st){S.onBeforeRender(x,U,H,W,O,st),S.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),O.onBeforeRender(x,U,H,W,S,st),O.transparent===!0&&O.side===pn&&O.forceSinglePass===!1?(O.side=Le,O.needsUpdate=!0,x.renderBufferDirect(H,U,W,O,S,st),O.side=Un,O.needsUpdate=!0,x.renderBufferDirect(H,U,W,O,S,st),O.side=pn):x.renderBufferDirect(H,U,W,O,S,st),S.onAfterRender(x,U,H,W,O,st)}function ls(S,U,H){U.isScene!==!0&&(U=jt);let W=Et.get(S),O=h.state.lights,st=h.state.shadowsArray,dt=O.state.version,xt=St.getParameters(S,O.state,st,U,H),yt=St.getProgramCacheKey(xt),Pt=W.programs;W.environment=S.isMeshStandardMaterial?U.environment:null,W.fog=U.fog,W.envMap=(S.isMeshStandardMaterial?V:y).get(S.envMap||W.environment),W.envMapRotation=W.environment!==null&&S.envMap===null?U.environmentRotation:S.envMapRotation,Pt===void 0&&(S.addEventListener("dispose",Dt),Pt=new Map,W.programs=Pt);let Ut=Pt.get(yt);if(Ut!==void 0){if(W.currentProgram===Ut&&W.lightsStateVersion===dt)return Po(S,xt),Ut}else xt.uniforms=St.getUniforms(S),S.onBeforeCompile(xt,x),Ut=St.acquireProgram(xt,yt),Pt.set(yt,Ut),W.uniforms=xt.uniforms;let Mt=W.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Mt.clippingPlanes=it.uniform),Po(S,xt),W.needsLights=Tc(S),W.lightsStateVersion=dt,W.needsLights&&(Mt.ambientLightColor.value=O.state.ambient,Mt.lightProbe.value=O.state.probe,Mt.directionalLights.value=O.state.directional,Mt.directionalLightShadows.value=O.state.directionalShadow,Mt.spotLights.value=O.state.spot,Mt.spotLightShadows.value=O.state.spotShadow,Mt.rectAreaLights.value=O.state.rectArea,Mt.ltc_1.value=O.state.rectAreaLTC1,Mt.ltc_2.value=O.state.rectAreaLTC2,Mt.pointLights.value=O.state.point,Mt.pointLightShadows.value=O.state.pointShadow,Mt.hemisphereLights.value=O.state.hemi,Mt.directionalShadowMap.value=O.state.directionalShadowMap,Mt.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Mt.spotShadowMap.value=O.state.spotShadowMap,Mt.spotLightMatrix.value=O.state.spotLightMatrix,Mt.spotLightMap.value=O.state.spotLightMap,Mt.pointShadowMap.value=O.state.pointShadowMap,Mt.pointShadowMatrix.value=O.state.pointShadowMatrix),W.currentProgram=Ut,W.uniformsList=null,Ut}function Ro(S){if(S.uniformsList===null){let U=S.currentProgram.getUniforms();S.uniformsList=Ti.seqWithValue(U.seq,S.uniforms)}return S.uniformsList}function Po(S,U){let H=Et.get(S);H.outputColorSpace=U.outputColorSpace,H.batching=U.batching,H.batchingColor=U.batchingColor,H.instancing=U.instancing,H.instancingColor=U.instancingColor,H.instancingMorph=U.instancingMorph,H.skinning=U.skinning,H.morphTargets=U.morphTargets,H.morphNormals=U.morphNormals,H.morphColors=U.morphColors,H.morphTargetsCount=U.morphTargetsCount,H.numClippingPlanes=U.numClippingPlanes,H.numIntersection=U.numClipIntersection,H.vertexAlphas=U.vertexAlphas,H.vertexTangents=U.vertexTangents,H.toneMapping=U.toneMapping}function wc(S,U,H,W,O){U.isScene!==!0&&(U=jt),A.resetTextureUnits();let st=U.fog,dt=W.isMeshStandardMaterial?U.environment:null,xt=P===null?x.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:Ui,yt=(W.isMeshStandardMaterial?V:y).get(W.envMap||dt),Pt=W.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Ut=!!H.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Mt=!!H.morphAttributes.position,Yt=!!H.morphAttributes.normal,ne=!!H.morphAttributes.color,ie=Dn;W.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(ie=x.toneMapping);let Pe=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,qt=Pe!==void 0?Pe.length:0,wt=Et.get(W),on=h.state.lights;if(nt===!0&&(mt===!0||S!==w)){let Be=S===w&&W.id===E;it.setState(W,S,Be)}let Zt=!1;W.version===wt.__version?(wt.needsLights&&wt.lightsStateVersion!==on.state.version||wt.outputColorSpace!==xt||O.isBatchedMesh&&wt.batching===!1||!O.isBatchedMesh&&wt.batching===!0||O.isBatchedMesh&&wt.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&wt.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&wt.instancing===!1||!O.isInstancedMesh&&wt.instancing===!0||O.isSkinnedMesh&&wt.skinning===!1||!O.isSkinnedMesh&&wt.skinning===!0||O.isInstancedMesh&&wt.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&wt.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&wt.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&wt.instancingMorph===!1&&O.morphTexture!==null||wt.envMap!==yt||W.fog===!0&&wt.fog!==st||wt.numClippingPlanes!==void 0&&(wt.numClippingPlanes!==it.numPlanes||wt.numIntersection!==it.numIntersection)||wt.vertexAlphas!==Pt||wt.vertexTangents!==Ut||wt.morphTargets!==Mt||wt.morphNormals!==Yt||wt.morphColors!==ne||wt.toneMapping!==ie||wt.morphTargetsCount!==qt)&&(Zt=!0):(Zt=!0,wt.__version=W.version);let We=wt.currentProgram;Zt===!0&&(We=ls(W,U,O));let ri=!1,Ue=!1,Fi=!1,se=We.getUniforms(),en=wt.uniforms;if(Tt.useProgram(We.program)&&(ri=!0,Ue=!0,Fi=!0),W.id!==E&&(E=W.id,Ue=!0),ri||w!==S){Tt.buffers.depth.getReversed()?(at.copy(S.projectionMatrix),Oh(at),Fh(at),se.setValue(F,"projectionMatrix",at)):se.setValue(F,"projectionMatrix",S.projectionMatrix),se.setValue(F,"viewMatrix",S.matrixWorldInverse);let Sn=se.map.cameraPosition;Sn!==void 0&&Sn.setValue(F,At.setFromMatrixPosition(S.matrixWorld)),zt.logarithmicDepthBuffer&&se.setValue(F,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&se.setValue(F,"isOrthographic",S.isOrthographicCamera===!0),w!==S&&(w=S,Ue=!0,Fi=!0)}if(O.isSkinnedMesh){se.setOptional(F,O,"bindMatrix"),se.setOptional(F,O,"bindMatrixInverse");let Be=O.skeleton;Be&&(Be.boneTexture===null&&Be.computeBoneTexture(),se.setValue(F,"boneTexture",Be.boneTexture,A))}O.isBatchedMesh&&(se.setOptional(F,O,"batchingTexture"),se.setValue(F,"batchingTexture",O._matricesTexture,A),se.setOptional(F,O,"batchingIdTexture"),se.setValue(F,"batchingIdTexture",O._indirectTexture,A),se.setOptional(F,O,"batchingColorTexture"),O._colorsTexture!==null&&se.setValue(F,"batchingColorTexture",O._colorsTexture,A));let Bi=H.morphAttributes;if((Bi.position!==void 0||Bi.normal!==void 0||Bi.color!==void 0)&&Rt.update(O,H,We),(Ue||wt.receiveShadow!==O.receiveShadow)&&(wt.receiveShadow=O.receiveShadow,se.setValue(F,"receiveShadow",O.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(en.envMap.value=yt,en.flipEnvMap.value=yt.isCubeTexture&&yt.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&U.environment!==null&&(en.envMapIntensity.value=U.environmentIntensity),Ue&&(se.setValue(F,"toneMappingExposure",x.toneMappingExposure),wt.needsLights&&Ec(en,Fi),st&&W.fog===!0&&ht.refreshFogUniforms(en,st),ht.refreshMaterialUniforms(en,W,N,R,h.state.transmissionRenderTarget[S.id]),Ti.upload(F,Ro(wt),en,A)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Ti.upload(F,Ro(wt),en,A),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&se.setValue(F,"center",O.center),se.setValue(F,"modelViewMatrix",O.modelViewMatrix),se.setValue(F,"normalMatrix",O.normalMatrix),se.setValue(F,"modelMatrix",O.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let Be=W.uniformsGroups;for(let Sn=0,wn=Be.length;Sn<wn;Sn++){let Io=Be[Sn];L.update(Io,We),L.bind(Io,We)}}return We}function Ec(S,U){S.ambientLightColor.needsUpdate=U,S.lightProbe.needsUpdate=U,S.directionalLights.needsUpdate=U,S.directionalLightShadows.needsUpdate=U,S.pointLights.needsUpdate=U,S.pointLightShadows.needsUpdate=U,S.spotLights.needsUpdate=U,S.spotLightShadows.needsUpdate=U,S.rectAreaLights.needsUpdate=U,S.hemisphereLights.needsUpdate=U}function Tc(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(S,U,H){Et.get(S.texture).__webglTexture=U,Et.get(S.depthTexture).__webglTexture=H;let W=Et.get(S);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=H===void 0,W.__autoAllocateDepthBuffer||Ot.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(S,U){let H=Et.get(S);H.__webglFramebuffer=U,H.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(S,U=0,H=0){P=S,C=U,T=H;let W=!0,O=null,st=!1,dt=!1;if(S){let yt=Et.get(S);if(yt.__useDefaultFramebuffer!==void 0)Tt.bindFramebuffer(F.FRAMEBUFFER,null),W=!1;else if(yt.__webglFramebuffer===void 0)A.setupRenderTarget(S);else if(yt.__hasExternalTextures)A.rebindTextures(S,Et.get(S.texture).__webglTexture,Et.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Mt=S.depthTexture;if(yt.__boundDepthTexture!==Mt){if(Mt!==null&&Et.has(Mt)&&(S.width!==Mt.image.width||S.height!==Mt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");A.setupDepthRenderbuffer(S)}}let Pt=S.texture;(Pt.isData3DTexture||Pt.isDataArrayTexture||Pt.isCompressedArrayTexture)&&(dt=!0);let Ut=Et.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Ut[U])?O=Ut[U][H]:O=Ut[U],st=!0):S.samples>0&&A.useMultisampledRTT(S)===!1?O=Et.get(S).__webglMultisampledFramebuffer:Array.isArray(Ut)?O=Ut[H]:O=Ut,I.copy(S.viewport),G.copy(S.scissor),B=S.scissorTest}else I.copy(et).multiplyScalar(N).floor(),G.copy(lt).multiplyScalar(N).floor(),B=It;if(Tt.bindFramebuffer(F.FRAMEBUFFER,O)&&W&&Tt.drawBuffers(S,O),Tt.viewport(I),Tt.scissor(G),Tt.setScissorTest(B),st){let yt=Et.get(S.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+U,yt.__webglTexture,H)}else if(dt){let yt=Et.get(S.texture),Pt=U||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,yt.__webglTexture,H||0,Pt)}E=-1},this.readRenderTargetPixels=function(S,U,H,W,O,st,dt){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let xt=Et.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&dt!==void 0&&(xt=xt[dt]),xt){Tt.bindFramebuffer(F.FRAMEBUFFER,xt);try{let yt=S.texture,Pt=yt.format,Ut=yt.type;if(!zt.textureFormatReadable(Pt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!zt.textureTypeReadable(Ut)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=S.width-W&&H>=0&&H<=S.height-O&&F.readPixels(U,H,W,O,Ft.convert(Pt),Ft.convert(Ut),st)}finally{let yt=P!==null?Et.get(P).__webglFramebuffer:null;Tt.bindFramebuffer(F.FRAMEBUFFER,yt)}}},this.readRenderTargetPixelsAsync=async function(S,U,H,W,O,st,dt){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let xt=Et.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&dt!==void 0&&(xt=xt[dt]),xt){let yt=S.texture,Pt=yt.format,Ut=yt.type;if(!zt.textureFormatReadable(Pt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!zt.textureTypeReadable(Ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(U>=0&&U<=S.width-W&&H>=0&&H<=S.height-O){Tt.bindFramebuffer(F.FRAMEBUFFER,xt);let Mt=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,Mt),F.bufferData(F.PIXEL_PACK_BUFFER,st.byteLength,F.STREAM_READ),F.readPixels(U,H,W,O,Ft.convert(Pt),Ft.convert(Ut),0);let Yt=P!==null?Et.get(P).__webglFramebuffer:null;Tt.bindFramebuffer(F.FRAMEBUFFER,Yt);let ne=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await Nh(F,ne,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,Mt),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,st),F.deleteBuffer(Mt),F.deleteSync(ne),st}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(S,U=null,H=0){S.isTexture!==!0&&(Yi("WebGLRenderer: copyFramebufferToTexture function signature has changed."),U=arguments[0]||null,S=arguments[1]);let W=Math.pow(2,-H),O=Math.floor(S.image.width*W),st=Math.floor(S.image.height*W),dt=U!==null?U.x:0,xt=U!==null?U.y:0;A.setTexture2D(S,0),F.copyTexSubImage2D(F.TEXTURE_2D,H,0,0,dt,xt,O,st),Tt.unbindTexture()},this.copyTextureToTexture=function(S,U,H=null,W=null,O=0){S.isTexture!==!0&&(Yi("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,S=arguments[1],U=arguments[2],O=arguments[3]||0,H=null);let st,dt,xt,yt,Pt,Ut,Mt,Yt,ne,ie=S.isCompressedTexture?S.mipmaps[O]:S.image;H!==null?(st=H.max.x-H.min.x,dt=H.max.y-H.min.y,xt=H.isBox3?H.max.z-H.min.z:1,yt=H.min.x,Pt=H.min.y,Ut=H.isBox3?H.min.z:0):(st=ie.width,dt=ie.height,xt=ie.depth||1,yt=0,Pt=0,Ut=0),W!==null?(Mt=W.x,Yt=W.y,ne=W.z):(Mt=0,Yt=0,ne=0);let Pe=Ft.convert(U.format),qt=Ft.convert(U.type),wt;U.isData3DTexture?(A.setTexture3D(U,0),wt=F.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(A.setTexture2DArray(U,0),wt=F.TEXTURE_2D_ARRAY):(A.setTexture2D(U,0),wt=F.TEXTURE_2D),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,U.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,U.unpackAlignment);let on=F.getParameter(F.UNPACK_ROW_LENGTH),Zt=F.getParameter(F.UNPACK_IMAGE_HEIGHT),We=F.getParameter(F.UNPACK_SKIP_PIXELS),ri=F.getParameter(F.UNPACK_SKIP_ROWS),Ue=F.getParameter(F.UNPACK_SKIP_IMAGES);F.pixelStorei(F.UNPACK_ROW_LENGTH,ie.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,ie.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,yt),F.pixelStorei(F.UNPACK_SKIP_ROWS,Pt),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Ut);let Fi=S.isDataArrayTexture||S.isData3DTexture,se=U.isDataArrayTexture||U.isData3DTexture;if(S.isRenderTargetTexture||S.isDepthTexture){let en=Et.get(S),Bi=Et.get(U),Be=Et.get(en.__renderTarget),Sn=Et.get(Bi.__renderTarget);Tt.bindFramebuffer(F.READ_FRAMEBUFFER,Be.__webglFramebuffer),Tt.bindFramebuffer(F.DRAW_FRAMEBUFFER,Sn.__webglFramebuffer);for(let wn=0;wn<xt;wn++)Fi&&F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Et.get(S).__webglTexture,O,Ut+wn),S.isDepthTexture?(se&&F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Et.get(U).__webglTexture,O,ne+wn),F.blitFramebuffer(yt,Pt,st,dt,Mt,Yt,st,dt,F.DEPTH_BUFFER_BIT,F.NEAREST)):se?F.copyTexSubImage3D(wt,O,Mt,Yt,ne+wn,yt,Pt,st,dt):F.copyTexSubImage2D(wt,O,Mt,Yt,ne+wn,yt,Pt,st,dt);Tt.bindFramebuffer(F.READ_FRAMEBUFFER,null),Tt.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else se?S.isDataTexture||S.isData3DTexture?F.texSubImage3D(wt,O,Mt,Yt,ne,st,dt,xt,Pe,qt,ie.data):U.isCompressedArrayTexture?F.compressedTexSubImage3D(wt,O,Mt,Yt,ne,st,dt,xt,Pe,ie.data):F.texSubImage3D(wt,O,Mt,Yt,ne,st,dt,xt,Pe,qt,ie):S.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,O,Mt,Yt,st,dt,Pe,qt,ie.data):S.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,O,Mt,Yt,ie.width,ie.height,Pe,ie.data):F.texSubImage2D(F.TEXTURE_2D,O,Mt,Yt,st,dt,Pe,qt,ie);F.pixelStorei(F.UNPACK_ROW_LENGTH,on),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,Zt),F.pixelStorei(F.UNPACK_SKIP_PIXELS,We),F.pixelStorei(F.UNPACK_SKIP_ROWS,ri),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Ue),O===0&&U.generateMipmaps&&F.generateMipmap(wt),Tt.unbindTexture()},this.copyTextureToTexture3D=function(S,U,H=null,W=null,O=0){return S.isTexture!==!0&&(Yi("WebGLRenderer: copyTextureToTexture3D function signature has changed."),H=arguments[0]||null,W=arguments[1]||null,S=arguments[2],U=arguments[3],O=arguments[4]||0),Yi('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(S,U,H,W,O)},this.initRenderTarget=function(S){Et.get(S).__webglFramebuffer===void 0&&A.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?A.setTextureCube(S,0):S.isData3DTexture?A.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?A.setTexture2DArray(S,0):A.setTexture2D(S,0),Tt.unbindTexture()},this.resetState=function(){C=0,T=0,P=null,Tt.reset(),ee.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return gn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=Xt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Xt._getUnpackColorSpace()}};var nr=class extends Fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new bn,this.environmentIntensity=1,this.environmentRotation=new bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var es=class extends Nn{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new Gt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},ir=new k,sr=new k,Nl=new de,$i=new Qn,Ps=new Kn,Wr=new k,Ol=new k,qa=class extends Fe{constructor(t=new He,e=new es){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,i=[0];for(let s=1,r=e.count;s<r;s++)ir.fromBufferAttribute(e,s-1),sr.fromBufferAttribute(e,s),i[s]=i[s-1],i[s]+=ir.distanceTo(sr);t.setAttribute("lineDistance",new Ke(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){let i=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ps.copy(i.boundingSphere),Ps.applyMatrix4(s),Ps.radius+=r,t.ray.intersectsSphere(Ps)===!1)return;Nl.copy(s).invert(),$i.copy(t.ray).applyMatrix4(Nl);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,u=i.index,m=i.attributes.position;if(u!==null){let g=Math.max(0,a.start),_=Math.min(u.count,a.start+a.count);for(let v=g,d=_-1;v<d;v+=c){let h=u.getX(v),M=u.getX(v+1),b=Is(this,t,$i,l,h,M);b&&e.push(b)}if(this.isLineLoop){let v=u.getX(_-1),d=u.getX(g),h=Is(this,t,$i,l,v,d);h&&e.push(h)}}else{let g=Math.max(0,a.start),_=Math.min(m.count,a.start+a.count);for(let v=g,d=_-1;v<d;v+=c){let h=Is(this,t,$i,l,v,v+1);h&&e.push(h)}if(this.isLineLoop){let v=Is(this,t,$i,l,_-1,g);v&&e.push(v)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Is(n,t,e,i,s,r){let a=n.geometry.attributes.position;if(ir.fromBufferAttribute(a,s),sr.fromBufferAttribute(a,r),e.distanceSqToSegment(ir,sr,Wr,Ol)>i)return;Wr.applyMatrix4(n.matrixWorld);let l=t.ray.origin.distanceTo(Wr);if(!(l<t.near||l>t.far))return{distance:l,point:Ol.clone().applyMatrix4(n.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:n}}var Fl=new k,Bl=new k,rr=class extends qa{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,i=[];for(let s=0,r=e.count;s<r;s+=2)Fl.fromBufferAttribute(e,s),Bl.fromBufferAttribute(e,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+Fl.distanceTo(Bl);t.setAttribute("lineDistance",new Ke(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var ns=class extends Nn{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Gt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},kl=new de,Za=new Qn,Ls=new Kn,Ds=new k,ar=class extends Fe{constructor(t=new He,e=new ns){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let i=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ls.copy(i.boundingSphere),Ls.applyMatrix4(s),Ls.radius+=r,t.ray.intersectsSphere(Ls)===!1)return;kl.copy(s).invert(),Za.copy(t.ray).applyMatrix4(kl);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,f=i.attributes.position;if(c!==null){let m=Math.max(0,a.start),g=Math.min(c.count,a.start+a.count);for(let _=m,v=g;_<v;_++){let d=c.getX(_);Ds.fromBufferAttribute(f,d),zl(Ds,d,l,s,t,e,this)}}else{let m=Math.max(0,a.start),g=Math.min(f.count,a.start+a.count);for(let _=m,v=g;_<v;_++)Ds.fromBufferAttribute(f,_),zl(Ds,_,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function zl(n,t,e,i,s,r,a){let o=Za.distanceSqToPoint(n);if(o<e){let l=new k;Za.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}function Us(n,t,e){return!n||!e&&n.constructor===t?n:typeof t.BYTES_PER_ELEMENT=="number"?new t(n):Array.prototype.slice.call(n)}function Lm(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Di=class{constructor(t,e,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(i),this.sampleValues=e,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,i=this._cachedIndex,s=e[i],r=e[i-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=i+2;;){if(s===void 0){if(t<r)break i;return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(r=s,s=e[++i],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(i=2,r=o);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=e[--i-1],t>=r)break t}a=i,i=0;break e}break n}for(;i<a;){let o=i+a>>>1;t<e[o]?a=o:i=o+1}if(s=e[i],r=e[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=i[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ja=class extends Di{constructor(t,e,i,s){super(t,e,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Bo,endingEnd:Bo}}intervalChanged_(t,e,i){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case ko:r=t,o=2*e-i;break;case zo:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case ko:a=t,l=2*i-e;break;case zo:a=1,l=i+s[1]-s[0];break;default:a=t-1,l=e}let c=(i-e)*.5,u=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-i),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(t,e,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=this._offsetPrev,f=this._offsetNext,m=this._weightPrev,g=this._weightNext,_=(i-e)/(s-e),v=_*_,d=v*_,h=-m*d+2*m*v-m*_,M=(1+m)*d+(-1.5-2*m)*v+(-.5+m)*_+1,b=(-1-g)*d+(1.5+g)*v+.5*_,x=g*d-g*v;for(let D=0;D!==o;++D)r[D]=h*a[u+D]+M*a[c+D]+b*a[l+D]+x*a[f+D];return r}},ja=class extends Di{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=(i-e)/(s-e),f=1-u;for(let m=0;m!==o;++m)r[m]=a[c+m]*f+a[l+m]*u;return r}},Ka=class extends Di{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},tn=class{constructor(t,e,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Us(e,this.TimeBufferType),this.values=Us(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,i;if(e.toJSON!==this.toJSON)i=e.toJSON(t);else{i={name:t.name,times:Us(t.times,Array),values:Us(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s)}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new Ka(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new ja(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ja(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case zs:e=this.InterpolantFactoryMethodDiscrete;break;case Pa:e=this.InterpolantFactoryMethodLinear;break;case _r:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return zs;case this.InterpolantFactoryMethodLinear:return Pa;case this.InterpolantFactoryMethodSmooth:return _r}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]*=t}return this}trim(t,e){let i=this.times,s=i.length,r=0,a=s-1;for(;r!==s&&i[r]<t;)++r;for(;a!==-1&&i[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=i.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&Lm(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===_r,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],u=t[o+1];if(c!==u&&(o!==1||c!==t[0]))if(s)l=!0;else{let f=o*i,m=f-i,g=f+i;for(let _=0;_!==i;++_){let v=e[f+_];if(v!==e[m+_]||v!==e[g+_]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let f=o*i,m=a*i;for(let g=0;g!==i;++g)e[m+g]=e[f+g]}++a}}if(r>0){t[a]=t[r];for(let o=r*i,l=a*i,c=0;c!==i;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*i)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),i=this.constructor,s=new i(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};tn.prototype.TimeBufferType=Float32Array;tn.prototype.ValueBufferType=Float32Array;tn.prototype.DefaultInterpolation=Pa;var ti=class extends tn{constructor(t,e,i){super(t,e,i)}};ti.prototype.ValueTypeName="bool";ti.prototype.ValueBufferType=Array;ti.prototype.DefaultInterpolation=zs;ti.prototype.InterpolantFactoryMethodLinear=void 0;ti.prototype.InterpolantFactoryMethodSmooth=void 0;var Qa=class extends tn{};Qa.prototype.ValueTypeName="color";var to=class extends tn{};to.prototype.ValueTypeName="number";var eo=class extends Di{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-e)/(s-e),c=t*o;for(let u=c+o;c!==u;c+=4)Qe.slerpFlat(r,0,a,c-o,a,c,l);return r}},or=class extends tn{InterpolantFactoryMethodLinear(t){return new eo(this.times,this.values,this.getValueSize(),t)}};or.prototype.ValueTypeName="quaternion";or.prototype.InterpolantFactoryMethodSmooth=void 0;var ei=class extends tn{constructor(t,e,i){super(t,e,i)}};ei.prototype.ValueTypeName="string";ei.prototype.ValueBufferType=Array;ei.prototype.DefaultInterpolation=zs;ei.prototype.InterpolantFactoryMethodLinear=void 0;ei.prototype.InterpolantFactoryMethodSmooth=void 0;var no=class extends tn{};no.prototype.ValueTypeName="vector";var io=class{constructor(t,e,i){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=i,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,f){return c.push(u,f),this},this.removeHandler=function(u){let f=c.indexOf(u);return f!==-1&&c.splice(f,2),this},this.getHandler=function(u){for(let f=0,m=c.length;f<m;f+=2){let g=c[f],_=c[f+1];if(g.global&&(g.lastIndex=0),g.test(u))return _}return null}}},Dm=new io,so=class{constructor(t){this.manager=t!==void 0?t:Dm,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let i=this;return new Promise(function(s,r){i.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};so.DEFAULT_MATERIAL_NAME="__DEFAULT";var go="\\[\\]\\.:\\/",Um=new RegExp("["+go+"]","g"),_o="[^"+go+"]",Nm="[^"+go.replace("\\.","")+"]",Om=/((?:WC+[\/:])*)/.source.replace("WC",_o),Fm=/(WCOD+)?/.source.replace("WCOD",Nm),Bm=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",_o),km=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",_o),zm=new RegExp("^"+Om+Fm+Bm+km+"$"),Vm=["material","materials","bones","map"],ro=class{constructor(t,e,i){let s=i||oe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,e)}setValue(t,e){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].unbind()}},oe=class n{constructor(t,e,i){this.path=e,this.parsedPath=i||n.parseTrackName(e),this.node=n.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,i){return t&&t.isAnimationObjectGroup?new n.Composite(t,e,i):new n(t,e,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Um,"")}static parseTrackName(t){let e=zm.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);Vm.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(e);if(i!==void 0)return i}if(t.children){let i=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=i(o.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)t[e++]=i[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,i=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=n.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=e.objectIndex;switch(i){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===c){c=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};oe.Composite=ro;oe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};oe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};oe.prototype.GetterByBindingType=[oe.prototype._getValue_direct,oe.prototype._getValue_array,oe.prototype._getValue_arrayElement,oe.prototype._getValue_toArray];oe.prototype.SetterByBindingTypeAndVersioning=[[oe.prototype._setValue_direct,oe.prototype._setValue_direct_setNeedsUpdate,oe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_array,oe.prototype._setValue_array_setNeedsUpdate,oe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_arrayElement,oe.prototype._setValue_arrayElement_setNeedsUpdate,oe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_fromArray,oe.prototype._setValue_fromArray_setNeedsUpdate,oe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Rg=new Float32Array(1);var is=class{constructor(t=1,e=0,i=0){return this.radius=t,this.phi=e,this.theta=i,this}set(t,e,i){return this.radius=t,this.phi=e,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,i){return this.radius=Math.sqrt(t*t+e*e+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(Ee(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var lr=class extends xn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ao}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ao);var hc={type:"change"},xo={type:"start"},dc={type:"end"},dr=new Qn,uc=new qe,Gm=Math.cos(70*ec.DEG2RAD),xe=new k,De=2*Math.PI,te={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},vo=1e-6,fr=class extends lr{constructor(t,e=null){super(t,e),this.state=te.NONE,this.enabled=!0,this.target=new k,this.cursor=new k,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ni.ROTATE,MIDDLE:ni.DOLLY,RIGHT:ni.PAN},this.touches={ONE:ii.ROTATE,TWO:ii.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new k,this._lastQuaternion=new Qe,this._lastTargetPosition=new k,this._quat=new Qe().setFromUnitVectors(t.up,new k(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new is,this._sphericalDelta=new is,this._scale=1,this._panOffset=new k,this._rotateStart=new kt,this._rotateEnd=new kt,this._rotateDelta=new kt,this._panStart=new kt,this._panEnd=new kt,this._panDelta=new kt,this._dollyStart=new kt,this._dollyEnd=new kt,this._dollyDelta=new kt,this._dollyDirection=new k,this._mouse=new kt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Xm.bind(this),this._onPointerDown=Wm.bind(this),this._onPointerUp=$m.bind(this),this._onContextMenu=Qm.bind(this),this._onMouseWheel=Zm.bind(this),this._onKeyDown=Jm.bind(this),this._onTouchStart=jm.bind(this),this._onTouchMove=Km.bind(this),this._onMouseDown=Ym.bind(this),this._onMouseMove=qm.bind(this),this._interceptControlDown=tg.bind(this),this._interceptControlUp=eg.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(hc),this.update(),this.state=te.NONE}update(t=null){let e=this.object.position;xe.copy(e).sub(this.target),xe.applyQuaternion(this._quat),this._spherical.setFromVector3(xe),this.autoRotate&&this.state===te.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=De:i>Math.PI&&(i-=De),s<-Math.PI?s+=De:s>Math.PI&&(s-=De),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(xe.setFromSpherical(this._spherical),xe.applyQuaternion(this._quatInverse),e.copy(this.target).add(xe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=xe.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new k(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new k(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=xe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(dr.origin.copy(this.object.position),dr.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(dr.direction))<Gm?this.object.lookAt(this.target):(uc.setFromNormalAndCoplanarPoint(this.object.up,this.target),dr.intersectPlane(uc,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>vo||8*(1-this._lastQuaternion.dot(this.object.quaternion))>vo||this._lastTargetPosition.distanceToSquared(this.target)>vo?(this.dispatchEvent(hc),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?De/60*this.autoRotateSpeed*t:De/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){xe.setFromMatrixColumn(e,0),xe.multiplyScalar(-t),this._panOffset.add(xe)}_panUp(t,e){this.screenSpacePanning===!0?xe.setFromMatrixColumn(e,1):(xe.setFromMatrixColumn(e,0),xe.crossVectors(this.object.up,xe)),xe.multiplyScalar(t),this._panOffset.add(xe)}_pan(t,e){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;xe.copy(s).sub(this.target);let r=xe.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/i.clientHeight,this.object.matrix),this._panUp(2*e*r/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=t-i.left,r=e-i.top,a=i.width,o=i.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(De*this._rotateDelta.x/e.clientHeight),this._rotateUp(De*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(De*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-De*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(De*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-De*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(i,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),i=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(i*i+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let i=this._getSecondPointerPosition(t),s=.5*(t.pageX+i.x),r=.5*(t.pageY+i.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(De*this._rotateDelta.x/e.clientHeight),this._rotateUp(De*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),i=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new kt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function Wm(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function Xm(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function $m(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(dc),this.state=te.NONE;break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function Ym(n){let t;switch(n.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ni.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=te.DOLLY;break;case ni.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=te.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=te.ROTATE}break;case ni.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=te.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=te.PAN}break;default:this.state=te.NONE}this.state!==te.NONE&&this.dispatchEvent(xo)}function qm(n){switch(this.state){case te.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case te.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case te.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function Zm(n){this.enabled===!1||this.enableZoom===!1||this.state!==te.NONE||(n.preventDefault(),this.dispatchEvent(xo),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(dc))}function Jm(n){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(n)}function jm(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case ii.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=te.TOUCH_ROTATE;break;case ii.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=te.TOUCH_PAN;break;default:this.state=te.NONE}break;case 2:switch(this.touches.TWO){case ii.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=te.TOUCH_DOLLY_PAN;break;case ii.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=te.TOUCH_DOLLY_ROTATE;break;default:this.state=te.NONE}break;default:this.state=te.NONE}this.state!==te.NONE&&this.dispatchEvent(xo)}function Km(n){switch(this._trackPointer(n),this.state){case te.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case te.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case te.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case te.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=te.NONE}}function Qm(n){this.enabled!==!1&&n.preventDefault()}function tg(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function eg(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var ng={girder:"#2f6fb3",web:"#6f9fd0",slab:"#9aa5b1",midgap:"#9aa5b1",edge:"#5d6873",deck_end:"#5d6873",support_edge:"#5d6873",cross_girder:"#7b5ea7",sill:"#b06a2c",pile:"#6b7d2f","rigid arms":"#c43c3c",bearing:"#d08b00"},fc=n=>ng[n]||"#888888",ig=n=>n.toLowerCase().includes("rigid")?"rigid arms":n||"other";function pc(n){let t=p("div",{class:"viewer3d"}),e=p("div",{class:"canvasbox"}),i=new Map,s=new nr,r=new er({antialias:!0,preserveDrawingBuffer:!0});r.setPixelRatio(Math.min(window.devicePixelRatio,2));let a=getComputedStyle(document.documentElement);s.background=new Gt(a.getPropertyValue("--canvas").trim()||"#f6f7f9");let o=new Ce(40,1,.1,5e3),l=new fr(o,r.domElement);e.append(r.domElement);let c=Object.keys(n.nodes),u=(B,z,Z)=>{let X=n.nodes[B],R=z?n.cases[z]?.u[B]:null;return[X[0]+(R?R[0]*Z:0),X[2]+(R?R[2]*Z:0),-(X[1]+(R?R[1]*Z:0))]},f=new Mn;c.forEach(B=>f.expandByPoint(new k(...u(B,null,0))));let m=f.getCenter(new k),g=f.getSize(new k).length(),_=new Map;for(let[B,z,Z]of[...n.beams,...n.links]){let X=ig(Z);_.has(X)||_.set(X,[]),_.get(X).push([B,z])}let v=null,d=0,h=B=>Math.max(...Object.values(n.cases[B].u).map(z=>Math.hypot(z[0],z[1],z[2])));function M(){for(let[X,R]of _){let N=new Float32Array(R.length*6);R.forEach(([tt,et],lt)=>{N.set(u(tt,v,d),lt*6),N.set(u(et,v,d),lt*6+3)});let q=i.get(X);q||(q=new rr(new He,new es({color:fc(X)})),s.add(q),i.set(X,q)),q.geometry.setAttribute("position",new Re(N,3)),q.geometry.computeBoundingSphere(),q.position.set(-m.x,-m.y,-m.z)}let B=[...n.fixed,...n.springs],z=s.getObjectByName("supports");z&&s.remove(z);let Z=new ar(new He().setAttribute("position",new Re(new Float32Array(B.flatMap(X=>u(X,v,d))),3)),new ns({color:"#c43c3c",size:.35}));Z.name="supports",Z.position.set(-m.x,-m.y,-m.z),s.add(Z)}M(),o.position.set(g*.7,g*.45,g*.7),l.update();let b=p("div",{class:"legend"},p("div",{class:"legend-title"},"Members"),[..._.keys()].sort().map(B=>p("label",{},p("input",{type:"checkbox",checked:!0,onchange:z=>{i.get(B).visible=z.target.checked}}),p("span",{class:"sw",style:`background:${fc(B)}`}),`${B} (${_.get(B).length})`)),p("label",{},p("span",{class:"sw dot",style:"background:#c43c3c"}),`supports / springs (${n.fixed.length+n.springs.length})`)),x=p("div",{class:"muted small"}),D=p("input",{type:"range",min:0,max:400,value:100}),C=p("select",{},p("option",{value:""},"Undeformed"),Object.keys(n.cases).map(B=>p("option",{value:B},B==="SW"?"Deformed \u2014 self weight":B==="SDL"?"Deformed \u2014 superimposed dead load":`${B} \u2014 T = ${n.cases[B].T} s`))),T=()=>{if(v=C.value||null,v){let B=h(v);d=.04*g/Math.max(B,1e-9)*(+D.value/100),x.textContent=n.cases[v].T?`mode shape (mass-normalised) \xB7 drawn \xD7 ${rt(d,0)}`:`max displacement ${rt(B*1e3,1)} mm \xB7 drawn \xD7 ${rt(d,0)}`}else d=0,x.textContent=`${c.length} nodes \xB7 ${n.beams.length} members \xB7 ${n.links.length} bearing links`;M()};C.onchange=T,D.oninput=T,T();let P=[["3D",()=>o.position.set(g*.55,g*.35,g*.55)],["Plan",()=>o.position.set(0,g*.9,.001)],["Elevation",()=>o.position.set(0,0,g*.9)],["Section",()=>o.position.set(g*.9,0,0)]],E=p("div",{class:"toolbar"},C,p("label",{class:"small"},"scale ",D),P.map(([B,z])=>p("button",{class:"btn ghost",onclick:()=>{z(),l.target.set(0,0,0),l.update()}},B)),x);t.append(E,p("div",{class:"viewer-body"},e,b));let w=new ResizeObserver(()=>{let B=e.clientWidth,z=e.clientHeight;r.setSize(B,z),o.aspect=B/Math.max(z,1),o.updateProjectionMatrix()});w.observe(e);let I=!0,G=()=>{if(I){if(!t.isConnected&&t.dataset.mounted){I=!1,r.dispose(),w.disconnect();return}t.isConnected&&(t.dataset.mounted="1"),l.update(),r.render(s,o),requestAnimationFrame(G)}};return requestAnimationFrame(G),t}function pr(n){return Object.keys(n).filter(t=>n[t]?.rows).sort().map(t=>{let e=0,i=0,s=0,r=0;for(let o of n[t].rows){if(o.conf==="solid"){s=Math.max(s,o.shear?.u??0);continue}e=Math.max(e,o.sag?.uB??0,o.hog?.uB??0),i=Math.max(i,o.sag?.uS??0,o.hog?.uS??0),s=Math.max(s,o.shear?.u??0),o.sag&&o.sag.okMin===!1&&r++}let a=Math.max(e,i,s);return{g:t,u:a,what:a===e?"ULS bending":a===i?"SLS stress":"shear / torsion",uB:e,uS:i,uV:s,minFail:r}})}var sg=[["depth","Depth"],["top_flange_width","Top flange width"],["concrete_28d","f'c girder"],["concrete_transfer","f'cp at transfer"],["jacking_ratio","Jacking stress / fpb"],["haunch","Haunch"],["transfer_supports","Support from end at transfer"],["age_at_transfer","Age at transfer"],["age_at_erection","Age at erection"],["age_deck_cast","Age when deck cast"]],mc=[["strand_pattern","Tendons (one row per strand; untick 'on' to remove a strand)",["y","x","diameter","debond_left","debond_right","on"],"y, x from the soffit / centreline (mm); debond lengths from each end (mm)"],["bars","Longitudinal reinforcement",["y","diameter","number","from","to"],"y (mm) from the soffit; from / to (m) along the girder"],["fitments","Shear / torsion fitments",["from","to","diameter","legs","spacing"],"from / to (m) along the girder; spacing (mm)"],["zones","Solid end blocks / open zones",["from","to","kind"],"kind: solid_end_A | solid_end_B | open"],["deck_bars","Deck reinforcement acting with the girder",["face","diameter","spacing","cover"],"mm"],["shape","Section shape parameters (Super-T library keys)",["key","name","value","unit"],"only 'value' is normally edited"]],gc={get:n=>{try{return localStorage.getItem(n)||""}catch{return""}},set:(n,t)=>{try{localStorage.setItem(n,t)}catch{}}};async function _c(n,t){let[e,i,s]=await Promise.all([vt.values(n,!0),vt.result(n,"sections.json"),vt.result(n,"girder_checks.json")]),r=e.rows,a=[...new Set(r.map(f=>/^superstructure\.supert_types\[([^\]]+)\]/.exec(f.path)?.[1]).filter(Boolean))];if(!a.length)return be("No Super-T girder types in the bridge data","Read or enter the girder drawings first.");let o=r.filter(f=>/\.type_ref$/.test(f.path)).map(f=>({m:/members\[([^\]]+)\]/.exec(f.path)?.[1]||"",t:String(f.value)})),l=p("div"),c=a[0],u=()=>{let f=`superstructure.supert_types[${c}]`,m=r.filter(R=>R.path.startsWith(f+".")),g={},_={},v=p("div",{class:"card"}),d=o.filter(R=>R.t===c).map(R=>R.m),h=p("div",{class:"grid tiles"},sg.map(([R,N])=>{let q=m.find(et=>et.path===`${f}.${R}`);if(!q)return null;let tt=p("input",{value:q.value===null||q.value===void 0?"":String(q.value),size:9,disabled:!!ce});return g[R]={row:q,input:tt},p("label",{class:"card tile"},p("div",{class:"small muted"},`${N}${q.unit?" ("+q.unit+")":""}`),tt,p("div",{class:"small muted"},q.tag))})),M=mc.map(([R,N,q,tt])=>{let et=m.filter($=>$.path.startsWith(`${f}.${R}.rows[`)).sort(($,nt)=>+/rows\[(\d+)\]/.exec($.path)[1]-+/rows\[(\d+)\]/.exec(nt.path)[1]);_[R]={rows:[]};let lt=p("tbody"),It=($,nt)=>{let mt={},at=p("tr",{},q.map(bt=>{let At=nt[bt],Lt=bt==="on"?p("input",{type:"checkbox",checked:At!==!1,disabled:!!ce,onchange:D}):p("input",{value:At==null?"":String(At),size:bt==="kind"||bt==="name"||bt==="face"||bt==="key"?12:7,disabled:!!ce,oninput:D});return mt[bt]=Lt,p("td",{},Lt)}),p("td",{class:"small muted"},$?$.tag:"new"));_[R].rows.push({row:$,cells:nt,inputs:mt}),lt.append(at)};return et.forEach($=>It($,{...$.value||{}})),p("details",{class:"card",open:R==="strand_pattern"||R==="fitments"},p("summary",{},p("b",{},N),p("span",{class:"small muted"},`  ${et.length} row(s) \xB7 ${tt}`)),p("div",{class:"tablewrap"},p("table",{class:"edit"},p("thead",{},p("tr",{},q.map($=>p("th",{},$)),p("th",{},"tag"))),lt)),ce?null:p("button",{class:"btn ghost",onclick:()=>{let $=_[R].rows[_[R].rows.length-1];It(null,$?{...x($.inputs,q)}:{}),D()}},"+ Add row"))}),b=R=>R.trim()===""?null:Number(R);function x(R,N){let q={};for(let tt of N){let et=R[tt];if(tt==="on")q[tt]=et.checked;else if(["kind","name","face","key","unit"].includes(tt))et.value.trim()&&(q[tt]=et.value.trim());else{let lt=b(et.value);lt!==null&&(q[tt]=lt)}}return q}function D(){let N=(_.strand_pattern?.rows||[]).map($t=>x($t.inputs,["y","x","diameter","debond_left","debond_right","on"])),q=d.find($t=>i.data?.girders?.[$t]),tt=q?i.data.girders[q]:null,et=tt?tt.stations[Math.floor(tt.stations.length/2)]:null,lt=document.createElementNS("http://www.w3.org/2000/svg","svg"),It=et?[...et.outline]:N.map($t=>[Number($t.x)||0,Number($t.y)||0]),$=It.map($t=>$t[0]),nt=It.map($t=>$t[1]),mt=Math.min(...$,-300)-120,at=Math.max(...$,300)+120,bt=Math.min(...nt,0)-120,At=Math.max(...nt,300)+120;lt.setAttribute("viewBox",`${mt} ${-At} ${at-mt} ${At-bt}`),lt.setAttribute("class","secsvg");let Lt=$t=>$t.map(Ot=>`${Ot[0].toFixed(1)},${(-Ot[1]).toFixed(1)}`).join(" "),jt=0,Vt=0,ae=0,F=N.map($t=>{let Ot=Number($t.x),zt=Number($t.y),Tt=(Number($t.diameter)||15.2)*1.6;if(!Number.isFinite(Ot)||!Number.isFinite(zt))return"";let Kt=$t.on!==!1,Et=(Number($t.debond_left)||0)>0||(Number($t.debond_right)||0)>0;return Kt&&(jt++,ae+=zt,Et&&Vt++),`<circle cx="${Ot}" cy="${-zt}" r="${Tt}" class="${Kt?Et?"st-deb":"st-on":"st-off"}"/>`}).join("");lt.innerHTML=(et?`<polygon points="${Lt(et.outline)}" class="sec-girder" fill-rule="evenodd"/>`:"")+F,v.replaceChildren(p("h3",{},`${c} \u2014 tendon layout preview`),lt,p("div",{class:"row wrap small"},p("span",{class:"legend-dot st-on"},"bonded"),p("span",{class:"legend-dot st-deb"},"debonded at an end"),p("span",{class:"legend-dot st-off"},"off")),p("p",{class:"small"},`${jt} strands on (${Vt} debonded at an end) \xB7 centroid of the strands ${jt?rt(ae/jt,0):"\u2014"} mm above the soffit (preview of what is entered; checks come from the run).`),p("p",{class:"small muted"},tt?`Outline: ${q} at midspan from the last run (${tt.type}). Used by ${d.join(", ")||"\u2014"}.`:"No computed outline yet: run the chain."))}let C=pr(s.data||{}).filter(R=>d.includes(R.g)),T=R=>p("td",{class:`uc ${zi(R)}`},rt(R,2)),P=C.map(R=>[R.g,T(R.uB),T(R.uS),T(R.uV)]),E=p("input",{placeholder:"your name",value:gc.get("pdf2bim.name"),size:16,oninput:R=>gc.set("pdf2bim.name",R.target.value)}),w=p("input",{placeholder:"reason, e.g. option B: 44 strands, N12 fitments @100 at the ends",size:50}),I=p("div",{class:"small"}),G=()=>{let R=[],N=[];for(let[q,{row:tt,input:et}]of Object.entries(g)){let lt=b(et.value);if(et.value.trim()!==""&&Number.isNaN(lt))throw new Error(`${q}: not a number`);lt!==null&&lt!==tt.value&&R.push({path:tt.path,value:lt})}for(let[q,,tt]of mc)for(let et of _[q]?.rows||[]){let lt=x(et.inputs,tt);if(Object.values(lt).some(It=>typeof It=="number"&&Number.isNaN(It)))throw new Error(`${q}: a cell is not a number`);et.row?JSON.stringify(lt)!==JSON.stringify(Object.fromEntries(tt.filter(It=>(et.row.value||{})[It]!==void 0).map(It=>[It,et.row.value[It]])))&&R.push({path:et.row.path,value:{...et.row.value||{},...lt}}):Object.keys(lt).length&&N.push({table:`${f}.${q}`,cells:lt})}return{items:R,new_rows:N}},B=async R=>{I.textContent="";try{let N=G();if(!N.items.length&&!N.new_rows.length){if(!R){I.textContent="Nothing changed.";return}}else{let q=await vt.saveBatch(n,{by:E.value,reason:w.value,...N});I.textContent=`Saved as ${q.decision} (${q.changed} values, accepted by ${E.value}).`}R?(await vt.run(n,!0),I.textContent+=" Analysis and checks running \u2014 see the progress below; results open in Design checks when done.",X()):setTimeout(t,900)}catch(N){I.textContent=N.message}},z=()=>{let R=d.map(et=>({m:et,box:p("input",{type:"checkbox"})})),N=p("input",{placeholder:"new type id, e.g. "+c+"-outer",size:22}),q=p("div",{class:"small"}),tt=async()=>{let et=R.filter(lt=>lt.box.checked).map(lt=>lt.m);if(!et.length||et.length===d.length){q.textContent="Tick some, not all, of the girders (to change every girder, edit this type).";return}try{let lt=await vt.saveBatch(n,{by:E.value,reason:w.value||`separate design for ${et.join(", ")}`,items:et.map(It=>({path:`superstructure.members[${It}].type_ref`,value:N.value.trim()})),new_rows:[],copy_types:[{from:c,id:N.value.trim()}]});q.textContent=`Saved as ${lt.decision}: ${et.join(", ")} now use ${N.value.trim()}. Opening it\u2026`,setTimeout(t,900)}catch(lt){q.textContent=lt.message}};return p("div",{class:"card"},p("h3",{},"Different design for some girders"),p("p",{class:"small muted"},`All of ${d.join(", ")} share type ${c}. To give some girders their own strands, debonding, bars or fitments, tick them: the type is copied under a new id and those girders point at it (one decision under your name). Then pick the new type above and edit it.`),p("div",{class:"row wrap"},R.map(et=>p("label",{class:"small"},et.box," ",et.m)),N,p("button",{class:"btn",onclick:tt},"Create type for the ticked girders")),q)},Z=p("div",{class:"small"}),X=async()=>{let R=await vt.latest(n);R&&(Z.replaceChildren(p("div",{},`Run ${R.id}: ${R.state}`),p("div",{class:"row wrap"},R.steps.map(N=>p("span",{class:`chip st-${N.state}`},`${N.title.split(" (")[0]}: ${N.state}`)))),R.state==="running"?setTimeout(X,3e3):R.state==="done"&&(location.hash=`#/p/${n}/design`))};l.replaceChildren(p("div",{class:"row between wrap"},p("div",{class:"row"},p("b",{},"Girder type "),p("select",{onchange:R=>{c=R.target.value,u()}},a.map(R=>p("option",{value:R,selected:R===c},R))),p("span",{class:"small muted"},`used by ${d.join(", ")||"\u2014"}`))),p("div",{class:"grid two"},p("div",{},p("div",{class:"card"},p("h3",{},"Section and materials"),h),P.length?p("div",{class:"card"},p("h3",{},"Last run: maximum utilisation"),re(["Girder","ULS bending","SLS stress","Shear / torsion"],P)):null),v),...M,...ce||d.length<2?[]:[z()],ce?p("p",{class:"small muted"},"Read-only copy: edit and run in the app on your computer."):p("div",{class:"card sticky-save"},p("div",{class:"row wrap"},E,w,p("button",{class:"btn",onclick:()=>B(!1)},"Save"),p("button",{class:"btn primary",onclick:()=>B(!0)},"Save and run")),p("p",{class:"small muted"},"Saving records every changed value under your name as one decision (tag Input-user) and keeps the previous revision. The drawing values stay in the record\u2019s history."),I,Z)),D()};return u(),l}var bo=document.getElementById("app"),rg=[["overview","Overview"],["drawings","Drawings"],["values","Bridge data"],["review","Needs review"],["decisions","Decisions"],["model","Model 3D"],["sections","Sections & materials"],["loads","Loads"],["moving","Moving loads"],["analysis","Analysis"],["design","Design checks"],["girder","Girder editor"],["verification","Verification"],["run","Run log & files"]],yo,On=(n,t,e="")=>n?p("a",{href:n,class:e},t):p("span",{class:e+" muted",title:"Download in the app on your computer"},t);function si(){clearInterval(yo);let[n,t]=location.hash.replace(/^#/,"").split("?"),e=n.split("/").filter(Boolean),i=new URLSearchParams(t||"");e[0]==="p"&&e[1]?lg(decodeURIComponent(e[1]),e[2]||"overview",i).catch(vc):ag().catch(vc)}window.addEventListener("hashchange",si);var vc=n=>{bo.replaceChildren(p("div",{class:"page"},p("div",{class:"alert bad"},"Error: "+n.message)))};function Mc(n){return p("header",{class:"top"},p("a",{href:"#/",class:"brand"},p("span",{class:"logo"},"\u25B1"),"PDF2BIM"),p("span",{class:"muted"},"Bridge drawings \u2192 model \u2192 analysis \u2192 design"),n?p("span",{class:"crumb"},"/ ",n):null,ce?p("span",{class:"pill warn"},`Read-only online copy \xB7 ${ce.taken} \xB7 engine ${ce.commit}`):null)}function bc(n){let t=Object.values(n).reduce((e,i)=>e+i,0)||1;return p("div",{class:"tagbar",title:ki.filter(e=>n[e]).map(e=>`${e}: ${n[e]}`).join(`
`)},ki.filter(e=>n[e]).map(e=>p("span",{class:`seg t-${e.replace(/[^A-Za-z]/g,"")}`,style:`width:${100*n[e]/t}%`})))}async function ag(){let n=await vt.projects(),t=p("form",{class:"card new",onsubmit:async i=>{i.preventDefault();let s=new FormData(i.target);e.textContent="Creating\u2026";try{let r=await vt.create(s);location.hash=`#/p/${r.id}/drawings`}catch(r){e.textContent=r.message}}},p("h3",{},"New bridge"),p("p",{class:"muted small"},"Upload the drawing set (PDF). The bridge description starts with every field Missing \u2014 Flagged; nothing is filled in automatically."),p("label",{},"Bridge id",p("input",{name:"id",required:!0,pattern:"[A-Za-z0-9][A-Za-z0-9_-]*",placeholder:"e.g. BR27"})),p("label",{},"Drawings (PDF)",p("input",{name:"drawings",type:"file",accept:"application/pdf",multiple:!0})),p("button",{class:"btn primary",type:"submit"},"Create")),e=p("div",{class:"small muted"});t.append(e),bo.replaceChildren(Mc(),p("main",{class:"page"},p("h1",{},"Bridges"),p("div",{class:"grid cards"},n.map(og),ce?null:t)))}function og(n){let t=Object.values(n.tags).reduce((i,s)=>i+s,0),e=n.last_run;return p("a",{class:"card proj",href:`#/p/${n.id}/overview`},p("div",{class:"row between"},p("h3",{},n.id),p("span",{class:"pill"},n.origin)),p("p",{class:"muted small clamp"},n.name||"(name not extracted)"),bc(n.tags),p("div",{class:"kv small"},p("span",{},`${t} values \xB7 ${n.tags["Missing-Flagged"]||0} missing`),p("span",{},`${n.drawings} drawing file(s)`),p("span",{},e?`last run ${e.id} \u2014 ${e.state}`:"not run in the app")))}async function lg(n,t,e){let s=(await vt.projects()).find(l=>l.id===n);if(!s)throw new Error(`no project ${n}`);let r=p("nav",{class:"tabs"},rg.map(([l,c])=>p("a",{href:`#/p/${n}/${l}`,class:l===t?"on":""},c))),a=p("section",{class:"tabbody"},p("div",{class:"muted"},"Loading\u2026"));bo.replaceChildren(Mc(n),p("main",{class:"page wide"},p("div",{class:"row between"},p("div",{},p("h1",{},n),p("p",{class:"muted"},s.name||"")),p("div",{class:"row"},ce?null:p("a",{class:"btn primary",href:`/api/projects/${encodeURIComponent(n)}/report`,target:"_blank"},"Calculation report"),On(vt.descUrl(n),"Description JSON","btn ghost"))),r,a));let o={overview:()=>hg(n),drawings:()=>ug(n,e),values:()=>xc(n),review:()=>xc(n,!0),decisions:()=>pg(n),model:()=>mg(n),sections:()=>gg(n),loads:()=>vg(n),moving:()=>Do(n,Fn,as,So,si),analysis:()=>_g(n),design:()=>xg(n),girder:()=>_c(n,si),verification:()=>yg(n),run:()=>Mg(n)};a.replaceChildren(await(o[t]||o.overview)())}function Fn(n,t){if(!n)return null;let e=n.source==="run"?`App run ${n.run}${n.engine_commit?` \xB7 engine ${n.engine_commit}`:""}`:`Repository output ${n.file} (commit ${n.engine_commit||"?"})`;return p("div",{class:"alert warn small"},p("b",{},"INDICATIVE \u2014 not design-approved. "),`${e}. `,n.allow_proposed!==!1?"Uses PROPOSED inputs (decisions not yet accepted by the engineer)":"Accepted inputs only",t&&t.length?`: ${t.join(", ")}.`:"."," Standards values code-extracted, UNVERIFIED.")}var cg=[["drawings","Drawings"],["values","Bridge data"],["geometry","Geometry"],["sections","Sections"],["model","Model, SW/SDL, modes"],["mct","MIDAS .mct"],["actions","Loads & combinations"],["design","Design checks"],["report","Report"]];async function hg(n){let[t,e,i,s,r,a]=await Promise.all([vt.latest(n),vt.values(n,!0),vt.drawings(n),vt.result(n,"model_view.json"),vt.result(n,"girder_checks.json"),vt.result(n,"combined_actions.json")]),o={};e.rows.forEach(M=>o[M.tag]=(o[M.tag]||0)+1);let l=e.rows.filter(Mo).length,c=M=>M==="drawings"?i.files.length?"done":"waiting":M==="values"?o["Missing-Flagged"]===e.rows.length?"waiting":"done":t?.steps.find(b=>b.key===M)?.state||"not run",u=p("div",{class:"pipe"},cg.map(([M,b],x)=>[x?p("span",{class:"arrow"},"\u2192"):null,p("a",{class:`stage s-${c(M).replace(/ /g,"")}`,href:`#/p/${n}/${M==="geometry"||M==="mct"||M==="report"?"run":M==="actions"?"analysis":M}`},p("b",{},b),p("span",{class:"small"},c(M)))])),f=p("input",{type:"checkbox",checked:!0}),m=p("button",{class:"btn primary",onclick:async()=>{try{await vt.run(n,f.checked),location.hash=`#/p/${n}/run`}catch(M){alert(M.message)}}},"Run the chain"),g=r.data?pr(r.data):null,_=g?g.reduce((M,b)=>b.u>M.u?b:M):null,v=a.data?Object.entries(a.data.schedule.piles).map(([M,b])=>({k:M,N:b.ULS?.N?.max,Ns:b.SLS?.N?.max})):[],d=v.length?v.reduce((M,b)=>b.N>M.N?b:M):null,h=[rs("Bridge data",`${e.rows.length} values`,`${o.Direct||0} Direct \xB7 ${o.Calculated||0} Calculated \xB7 ${o["Missing-Flagged"]||0} Missing`,`#/p/${n}/values`),rs("Needs review",String(l),"Missing, Assumed or proposed values",`#/p/${n}/values?review=1`,l?"warn":""),rs("Self weight / SDL",s.data?`${rt(-s.data.cases.SW.applied_kN[2],0)} / ${rt(-(s.data.cases.SDL.total_kN||0),0)} kN`:"\u2014",s.data?`equilibrium residual ${s.data.cases.SW.equilibrium_residual_kN.toExponential(1)} kN`:"run the chain",`#/p/${n}/model`),rs("Worst girder utilisation",_?rt(_.u,2):"\u2014",_?`${_.g} \xB7 ${_.what}`:"no design results",`#/p/${n}/design`,_?zi(_.u):""),rs("Max pile axial (ULS)",d?`${rt(d.N,0)} kN`:"\u2014",d?`pile ${d.k} \xB7 SLS ${rt(d.Ns,0)} kN`:"no results",`#/p/${n}/analysis`)];return p("div",{},p("div",{class:"card"},p("div",{class:"row between"},p("h3",{},"Pipeline"),ce?p("span",{class:"small muted"},"Runs start in the app on your computer"):p("div",{class:"row"},p("label",{class:"small"},f," use proposed inputs (provisional)"),m)),u,t&&t.revision!==void 0&&t.revision!==e.revision?.number?p("div",{class:"alert warn small"},`The bridge data changed since the last run (run used revision ${t.revision}, now ${e.revision?.number}). Results below are out of date: run the chain again.`):null,p("p",{class:"small muted"},t?`Last run ${t.id}: ${t.state}${t.finished?`, finished ${t.finished}`:""}.`:"Not run in the app yet \u2014 results below (if any) are the outputs committed in the repository.")),p("div",{class:"grid tiles"},h),Fn(r.meta||s.meta,s.data?.provisional_decisions),p("div",{class:"card"},p("h3",{},"Data quality"),bc(o),p("div",{class:"row wrap small"},ki.filter(M=>o[M]).map(M=>p("span",{},Ie(M)," ",o[M])))))}var rs=(n,t,e,i,s="")=>p("a",{class:`card tile ${s}`,href:i},p("div",{class:"small muted"},n),p("div",{class:"big"},t),p("div",{class:"small muted"},e)),Mo=n=>n.tag==="Missing-Flagged"||n.tag==="Assumed"||n.proposed||n.status==="proposed";async function ug(n,t){let e=await vt.drawings(n),i=p("form",{class:"row",onsubmit:async d=>{d.preventDefault(),await vt.upload(n,new FormData(d.target)),si()}},p("input",{type:"file",name:"drawings",accept:"application/pdf",multiple:!0}),p("button",{class:"btn"},"Upload"));if(ce&&!e.files.length)return be("Drawings are not in the online copy","Drawings stay on your computer (they are confidential). Upload them in the app on your computer.");if(!e.files.length)return p("div",{},be("No drawings uploaded","Upload the PDF drawing set. Drawings are stored in the app's data folder only (never committed to the repository)."),i);let s=ce?null:await dg(n),r=d=>e.documents.find(h=>h.id===d)?.number||d,a=e.files.flatMap(d=>d.pages.map(h=>({file:d.file,...h}))),o=t.get("doc"),l=Math.max(0,o?a.findIndex(d=>d.documents.includes(o)):0),c=1,u=p("img",{class:"sheet",alt:"drawing page"}),f=p("div",{class:"small"}),m=p("div",{class:"pagelist"}),g=()=>{let d=a[l];u.src=vt.pageUrl(n,d.file,d.page,c>1.5?220:130),u.style.width=`${c*100}%`,f.textContent=`${d.file} \u2014 page ${d.page} of ${a.filter(h=>h.file===d.file).length}${d.documents.length?" \xB7 "+d.documents.map(r).join(", "):""}`,[...m.children].forEach((h,M)=>h.classList.toggle("on",M===l)),m.children[l]?.scrollIntoView({block:"nearest"})};a.forEach((d,h)=>m.append(p("button",{class:"pg",onclick:()=>{l=h,g()}},p("b",{},`p${d.page}`)," ",d.documents.join(", ")||p("span",{class:"muted"},d.file))));let _=d=>()=>{c=Math.min(4,Math.max(.5,c*d)),g()},v=p("div",{class:"toolbar"},p("button",{class:"btn ghost",onclick:()=>{l=Math.max(0,l-1),g()}},"\u25C0"),p("button",{class:"btn ghost",onclick:()=>{l=Math.min(a.length-1,l+1),g()}},"\u25B6"),p("button",{class:"btn ghost",onclick:_(1/1.4)},"\u2212"),p("button",{class:"btn ghost",onclick:_(1.4)},"+"),p("button",{class:"btn ghost",onclick:()=>{c=1,g()}},"Fit"),f);return setTimeout(g),p("div",{},s,p("div",{class:"row between"},p("span",{class:"small muted"},`${a.length} pages in ${e.files.length} file(s)`),i),p("div",{class:"drawings"},m,p("div",{class:"sheetwrap"},v,p("div",{class:"sheetscroll"},u))))}async function dg(n){let[t,e,i]=await Promise.all([vt.settings(),vt.extractLatest(n),vt.projects()]),s=i.find(h=>h.id===n),r=p("div",{class:"card"}),a=p("span",{class:"small muted"}),o=p("input",{type:"password",placeholder:t.api_key_set?`key saved (${t.api_key_hint})`:"Anthropic API key (sk-ant-\u2026)",size:34,autocomplete:"off"}),l=p("input",{placeholder:"all pages (or e.g. 1-20)",size:18}),c=p("pre",{class:"log small"}),u=p("details",{},p("summary",{},"Reading report: accepted, conflicts, rejected"),p("pre",{class:"log small"},e?.report||"")),f=h=>{if(!h)return"Not read yet.";let M=h.summary;return h.state==="running"?`Reading\u2026 (started ${h.started})`:h.state==="failed"?`Reading failed (${h.finished}). See the log.`:`Read ${h.finished}: ${M?.values??0} values kept from ${M?.documents??0} documents, ${M?.conflicts??0} conflicts left for you, ${M?.rejected??0} proposals rejected by the checks.`},m=p("div",{class:"small"},f(e)),g=async()=>{let h=await vt.extractLatest(n);m.textContent=f(h),c.textContent=(h?.log||[]).join(`
`),c.hidden=!c.textContent,h?.state==="running"?setTimeout(g,2500):h&&(u.querySelector("pre").textContent=h.report||"",a.textContent=h.state==="done"?"Done: open Bridge data and Decisions to review, then Run.":"")},_=async()=>{try{let h=await vt.saveSettings({api_key:o.value});o.value="",o.placeholder=h.api_key_set?`key saved (${h.api_key_hint})`:"Anthropic API key",a.textContent="Key saved on this computer."}catch(h){a.textContent=h.message}},v=async()=>{a.textContent="";try{await vt.extract(n,l.value.trim()||void 0),setTimeout(g,800)}catch(h){a.textContent=h.message}},d=s?.origin==="uploaded";return r.append(p("h3",{},"Read the drawings with Claude"),p("p",{class:"small muted"},"Each page is sent to Claude, which proposes the values printed on it. The platform keeps a value only if its text is found on the page, every number is printed there, and any arithmetic re-computes; disagreements between sheets stay Missing for you to decide. Drawings are sent to Anthropic\u2019s API with your key."),t.from_env?p("div",{class:"small"},"API key: from the ANTHROPIC_API_KEY environment variable."):p("div",{class:"row wrap"},o,p("button",{class:"btn ghost",onclick:_},"Save key")),d?p("div",{class:"row wrap"},l,p("button",{class:"btn",onclick:v},"Read drawings"),a):p("div",{class:"small muted"},"This bridge\u2019s data is in the repository or already reviewed; create a new bridge to read drawings."),m,c,u),e?.state==="running"?setTimeout(g,500):c.textContent=(e?.log||[]).slice(-30).join(`
`),c.hidden=!c.textContent,u.hidden=!e?.report,r}async function xc(n,t=!1){let e=new URLSearchParams(location.hash.split("?")[1]||""),[{rows:i,revision:s},r]=await Promise.all([vt.values(n,!0),vt.drawings(n)]),a=s?.number??s,o=M=>M?r.documents.find(b=>b.id===M||b.id.endsWith(M)||b.number?.endsWith(M))?.id:void 0,l=[...new Set(i.map(M=>M.path.split(/[.[]/)[0]))],c={q:(e.get("q")||"").toLowerCase(),tag:"",group:"",review:t||e.get("review")==="1"},u={};i.forEach(M=>u[M.tag]=(u[M.tag]||0)+1);let f=p("tbody"),m=p("span",{class:"small muted"}),g=()=>{let M=i.filter(b=>(!c.tag||b.tag===c.tag)&&(!c.group||b.path.startsWith(c.group))&&(!c.review||Mo(b))&&(!c.q||(b.path+" "+(b.note||"")+" "+rt(b.value)).toLowerCase().includes(c.q)));m.textContent=`${M.length} of ${i.length} values \xB7 description revision ${a}`,f.replaceChildren(...M.slice(0,1500).map(b=>{let x=o(b.sheet);return p("tr",{class:`r-${b.tag.replace(/[^A-Za-z]/g,"")}`},p("td",{class:"mono"},b.path),p("td",{class:"val"},rt(b.value)),p("td",{},b.unit||""),p("td",{},Ie(b.tag),b.proposed?p("span",{class:"pill warn",title:`proposed override, decision ${b.decision}; drawing record: ${b.original_tag}`},"proposed"):null),p("td",{},x?p("a",{href:`#/p/${n}/drawings?doc=${encodeURIComponent(x)}`},b.sheet):b.sheet||"",b.view?p("div",{class:"small muted"},b.view):null),p("td",{class:"small"},b.derivation?p("div",{},"= ",b.derivation):null,b.note||"",b.replace_with?p("div",{class:"muted"},"needs: ",b.replace_with):null),p("td",{class:"small"},b.decision||"",ce||!Mo(b)?null:p("button",{class:"btn ghost small",onclick:D=>h(D,b)},"Enter value")))}))},_=p("div",{class:"row wrap"},p("button",{class:"chip on",onclick:M=>v("",M)},`All ${i.length}`),ki.filter(M=>u[M]).map(M=>p("button",{class:"chip",onclick:b=>v(M,b)},Ie(M),` ${u[M]}`))),v=(M,b)=>{c.tag=M,_.querySelectorAll(".chip").forEach(x=>x.classList.remove("on")),b.currentTarget.classList.add("on"),g()},d=p("input",{type:"checkbox",checked:c.review,onchange:M=>{c.review=M.target.checked,g()}}),h=(M,b)=>{let x=M.currentTarget.closest("tr");if(x.nextElementSibling?.classList.contains("editrow")){x.nextElementSibling.remove();return}let D=b.value!==null&&typeof b.value=="object",C=p(D?"textarea":"input",{rows:3});C.value=D?JSON.stringify(b.value):b.value===null||b.value===void 0?"":String(b.value);let T=p("input",{value:b.unit||"",size:6}),P=p("select",{},["Direct","Input-user","Confirmed-Engineer"].map(z=>p("option",{value:z},z))),E=p("input",{placeholder:"drawing / sheet (Direct)",value:b.sheet||""}),w=p("input",{placeholder:"view / table / note on sheet"}),I=p("input",{placeholder:"where the value comes from / why",size:40}),G=p("div",{class:"small"}),B=async()=>{let z=C.value.trim();if(D)try{z=JSON.parse(String(z))}catch{G.textContent='Table row must be JSON, e.g. {"item": "T_max", "value": 45}';return}else z!==""&&!Number.isNaN(Number(z))&&(z=Number(z));G.textContent="Saving\u2026";try{let Z=await vt.enterValue(n,{path:b.path,value:z,unit:T.value||null,tag:P.value,sheet:E.value,view:w.value,reason:I.value,by:as()});G.textContent=`Saved as ${Z.decision} (accepted by ${as()}). Reloading\u2026`,setTimeout(si,900)}catch(Z){G.className="small bad",G.textContent=Z.message}};x.after(p("tr",{class:"editrow"},p("td",{colspan:7},p("div",{class:"row wrap"},p("b",{},b.path),C,T,P,E,w,I,So(),p("button",{class:"btn primary",onclick:B},"Save and accept")),G)))};return setTimeout(g),p("div",{},p("div",{class:"card filters"},_,p("div",{class:"row wrap"},p("input",{type:"search",placeholder:"Search path, value or note",value:c.q,oninput:M=>{c.q=M.target.value.toLowerCase(),g()}}),p("select",{onchange:M=>{c.group=M.target.value,g()}},p("option",{value:""},"All sections"),l.map(M=>p("option",{value:M},M))),p("label",{class:"small"},d," Needs review only"),m)),p("div",{class:"tablewrap tall"},p("table",{class:"values"},p("thead",{},p("tr",{},["Path","Value","Unit","Data source","Sheet","Note / derivation","Decision"].map(M=>p("th",{},M)))),f)))}var Sc={get:n=>{try{return localStorage.getItem(n)||""}catch{return""}},set:(n,t)=>{try{localStorage.setItem(n,t)}catch{}}},as=()=>Sc.get("pdf2bim.name"),So=()=>p("input",{placeholder:"your name",value:as(),size:16,oninput:n=>Sc.set("pdf2bim.name",n.target.value)});async function fg(n){let t=await vt.revisions(n),e=p("div"),i=async(s,r)=>{let a=await vt.revDiff(n,s,r);e.replaceChildren(p("h3",{},`Changes from revision ${s} to ${r} (${a.rows.length})`),re(["Path","From","To","Proposals added","Decision"],a.rows.slice(0,500).map(o=>[p("span",{class:"mono"},o.path),p("span",{},rt(o.from)," ",Ie(o.from_tag)),p("span",{},rt(o.to)," ",Ie(o.to_tag)),o.proposals_added||"",o.decision||""])),a.rows.length>500?p("p",{class:"small muted"},`first 500 of ${a.rows.length}`):"")};return p("div",{class:"card"},p("h3",{},"Revision history of the bridge data"),re(["Revision","Date","By","Note",""],t.map((s,r)=>[String(s.number)+(s.current?" (current)":""),s.created||"\u2014",s.author||"\u2014",p("span",{class:"small"},s.note||""),r<t.length-1&&!ce?p("button",{class:"btn ghost small",onclick:()=>i(t[r+1].number,s.number)},`Changes from ${t[r+1].number}`):""]),"txt"),e)}async function pg(n){let[{items:t,revision:e},i]=await Promise.all([vt.decisions(n),fg(n)]);if(!t.length)return p("div",{},be("No decisions waiting","Every proposed value has been accepted or rejected."),i);let s=r=>{let a=p("input",{placeholder:"note (required to reject)",size:36}),o=p("div",{class:"small"}),l=u=>async()=>{o.className="small",o.textContent=u?"Accepting\u2026":"Rejecting\u2026";try{let f=await vt.decide(n,r.id,{by:as(),accept:u,note:a.value});o.textContent=f.message+" \u2014 run the chain again to update the results.",setTimeout(si,2500)}catch(f){o.className="small bad",o.textContent=f.message}},c={};return r.values.forEach(u=>c[u.tag]=(c[u.tag]||0)+1),p("div",{class:"card"},p("div",{class:"row between wrap"},p("h3",{},`${r.id} \u2014 proposed by ${r.by}`),p("span",{class:"small muted"},r.date)),p("p",{},r.reason),p("div",{class:"row wrap small"},`${r.values.length} value(s), tags now on record: `,Object.entries(c).map(([u,f])=>p("span",{},Ie(u)," ",f))),p("p",{class:"small muted"},`Affects: ${r.affects.join(", ")||"\u2014"} \xB7 evidence: ${r.evidence.join("; ")||"\u2014"} \xB7 outputs made out of date: ${r.outputs.length||"none recorded"}`),p("details",{},p("summary",{class:"small"},"Show the values"),re(["Path","Value","Tag"],r.values.map(u=>[p("span",{class:"mono"},u.path),rt(u.value),Ie(u.tag)]))),ce?null:p("div",{class:"row wrap",style:"margin-top:10px"},So(),a,p("button",{class:"btn primary",onclick:l(!0)},"Accept"),p("button",{class:"btn",onclick:l(!1)},"Reject")),o)};return p("div",{},p("div",{class:"alert warn small"},`Description revision ${e}. Accepting makes every value of the decision part of the bridge record, under your name; a new revision is written and the previous one kept in history. Only a person can accept (the AI cannot).`),t.map(s),i)}async function mg(n){let t=await vt.result(n,"model_view.json");return t.data?p("div",{},Fn(t.meta,t.data.provisional_decisions),pc(t.data)):be("No model yet",p("span",{},"Run the chain from the ",p("a",{href:`#/p/${n}/overview`},"Overview")," tab to build the integrated model."))}function yc(n){let t=[...n.outline,...n.deck||[]],e=t.map(m=>m[0]),i=t.map(m=>m[1]),s=Math.min(...e)-150,r=Math.max(...e)+150,a=Math.min(...i)-150,o=Math.max(...i)+150,l=m=>m.map(g=>`${g[0].toFixed(1)},${(-g[1]).toFixed(1)}`).join(" "),c=n.composite?.yc,u=n.girder?.yc,f=document.createElementNS("http://www.w3.org/2000/svg","svg");return f.setAttribute("viewBox",`${s} ${-o} ${r-s} ${o-a}`),f.setAttribute("class","secsvg"),f.innerHTML=(n.deck?`<polygon points="${l(n.deck)}" class="sec-deck"/>`:"")+`<polygon points="${l(n.outline)}" class="sec-girder" fill-rule="evenodd"/>`+(c!==void 0?`<line x1="${s}" x2="${r}" y1="${-c}" y2="${-c}" class="sec-na"/><text x="${r-10}" y="${-c-20}" text-anchor="end" class="sec-t">composite centroid ${c.toFixed(0)}</text>`:"")+(u!==void 0?`<line x1="${s}" x2="${r}" y1="${-u}" y2="${-u}" class="sec-na g"/><text x="${s+10}" y="${-u-20}" class="sec-t">girder centroid ${u.toFixed(0)}</text>`:""),f}async function gg(n){let t=await vt.result(n,"sections.json");if(!t.data)return be("No section properties","Run the chain to compute them.");let e=t.data.girders,i=Object.keys(e).sort(),s=p("div"),r=p("select",{onchange:c=>o(c.target.value)},i.map(c=>p("option",{value:c},c))),a=c=>c===void 0?"\u2014":rt(c/1e9,2),o=c=>{let u=e[c],f=u.stations[Math.floor(u.stations.length/2)],m=u.solid_end?.A;s.replaceChildren(p("div",{class:"grid two"},p("div",{class:"card"},p("h3",{},`${c} \u2014 ${u.type} at midspan (open)`),yc(f)),m?p("div",{class:"card"},p("h3",{},`${c} \u2014 solid end zone`),yc(m)):null),p("div",{class:"card"},p("h3",{},"Properties along the girder (mm, mm\xB2, \xD710\u2079 mm\u2074)"),re(["t","Deck width","Girder A","Girder yc","Girder Ix","Girder J","Composite A (transformed)","Composite yc","Composite Ix","Composite J"],u.stations.map(g=>[rt(g.t,2),rt(g.deck_left+g.deck_right,0),rt(g.girder.A,0),rt(g.girder.yc,1),a(g.girder.Ix),a(g.girder.J),rt(g.composite.A_transformed,0),rt(g.composite.yc,1),a(g.composite.Ix),a(g.composite.J_geometric)]),"num"),p("p",{class:"small muted"},`Super-T ${u.type} (${u.type_ref||""}), haunch ${u.haunch??"\u2014"} mm, length end to end ${rt(u.length_end_to_end,3)} m. y from the girder soffit. `,(t.data.notes||[]).join(" "))))};setTimeout(()=>o(i[0]));let l=p("div");return Promise.all([vt.values(n,!0),vt.result(n,"model_view.json")]).then(([c,u])=>{let f=c.rows.filter(v=>v.path.startsWith("materials.")),m=(v,d)=>v!==0&&Math.abs(v)<.01?v.toExponential(2):rt(v,d),g=(v,d=1,h=3)=>!v||v[0]===null?"\u2014":Math.abs(v[0]-v[1])<1e-9*Math.abs(v[1])?m(v[0]*d,h):`${m(v[0]*d,h)} \u2013 ${m(v[1]*d,h)}`,_=u.data?.member_props||{};l.append(p("div",{class:"card"},p("h3",{},"Materials (description records)"),p("p",{class:"small muted"},`${f.length} records under materials.*; `,p("a",{href:`#/p/${n}/values?q=materials`},"edit on Bridge data"),". The engines read these; nothing is defaulted silently."),re(["Path","Value","Unit","Data source","Note"],f.map(v=>[p("td",{class:"mono"},v.path),typeof v.value=="object"&&v.value?Object.entries(v.value).map(([d,h])=>`${d} ${rt(h)}`).join(" \xB7 "):rt(v.value),v.unit||"",p("td",{},Ie(v.tag)),p("td",{class:"small"},v.note||"")]),"values")),Object.keys(_).length?p("div",{class:"card"},p("h3",{},"Member properties in the analysis model, by member type"),p("p",{class:"small muted"},"Stiffness and self weight each member type carries. Weight 0 means the member is stiffness-only: the deck slab's weight is carried on the girder lines (wet concrete on the bare girders), so the transverse slab strips, dummies and rigid arms add no weight."),re(["Member type","Count","Total length (m)","E (GPa)","A (m\xB2)","Iy (m\u2074)","Iz (m\u2074)","J (m\u2074)","Weight (kN/m)","Total weight (kN)"],Object.entries(_).map(([v,d])=>[v,d.n,rt(d.length_m,1),g(d.E,1e-6,1),g(d.A),g(d.Iy,1,4),g(d.Iz,1,4),g(d.J,1,4),g(d.w,1,2),d.weight_kN?rt(d.weight_kN,0):p("span",{class:"muted"},"0 (stiffness only)")]),"num")):p("p",{class:"small muted"},"Member properties appear after the next run (the model step now records them)."))}).catch(()=>{}),p("div",{},Fn(t.meta),p("div",{class:"row between"},p("span",{class:"small muted"},`E girder ${t.data.E_girder_MPa} MPa \xB7 E deck ${t.data.E_deck_MPa} MPa \xB7 modular ratio ${rt(t.data.modular_ratio_deck,4)} \xB7 deck ${t.data.deck_thickness} mm`),r),s,l)}async function _g(n){let[t,e]=await Promise.all([vt.result(n,"model_view.json"),vt.result(n,"combined_actions.json")]),i=p("div",{},Fn(e.meta||t.meta,t.data?.provisional_decisions));if(t.data){let o=t.data,l=c=>{let u={n:"",z:0};for(let[f,m]of Object.entries(o.cases[c].u))o.nodes[f]?.[3]==="girder"&&m[2]<u.z&&(u={n:f,z:m[2]});return u};i.append(p("div",{class:"card"},p("h3",{},"Permanent load cases (unfactored)"),re(["Case","Applied (kN)","Max girder deflection (mm)","Equilibrium residual (kN)"],["SW","SDL"].filter(c=>o.cases[c]).map(c=>[c==="SW"?"Self weight":"Superimposed dead load",rt(-o.cases[c].applied_kN[2],1),rt(-l(c).z*1e3,1),o.cases[c].equilibrium_residual_kN.toExponential(2)]))))}if(t.data?.modes?.length){let o=t.data.modes,l={X:0,Y:0,Z:0};i.append(p("div",{class:"card"},p("h3",{},`Natural modes (${o.length}) \u2014 mass: ${t.data.mass_rule}`),re(["Mode","Period T (s)","f (Hz)","Mass X","Mass Y","Mass Z","Cumulative X / Y / Z"],o.slice(0,12).map(c=>(["X","Y","Z"].forEach(u=>l[u]+=c.eff[u]),[c.n,rt(c.T,3),rt(c.f,2),rt(100*c.eff.X,1)+" %",rt(100*c.eff.Y,1)+" %",rt(100*c.eff.Z,1)+" %",`${rt(100*l.X,0)} / ${rt(100*l.Y,0)} / ${rt(100*l.Z,0)} %`])),"num"),p("p",{class:"small muted"},`First 12 of ${o.length} shown; X = global easting, Y = northing. Mode shapes: Model 3D tab.`)))}else t.data?.modes_note&&i.append(p("div",{class:"alert warn small"},t.data.modes_note));if(!e.data)return i.append(be("No combined actions","Run the chain to compute loads and AS 5100.2 combinations.")),i;let s=e.data.schedule,r=(o,l)=>p("span",{class:"small muted"},o?.[l]||""),a=(o,l)=>p("td",{},rt(o,0),l?p("div",{},l):null);return i.append(p("div",{class:"card"},p("h3",{},"Bearings \u2014 vertical / transverse / longitudinal (kN)"),re(["Bearing","ULS V max","ULS V min","SLS V max","SLS V min","ULS H transverse \xB1","ULS H longitudinal \xB1"],Object.entries(s.bearings).map(([o,l])=>[o,a(l.ULS.v.max,r(l.ULS.v,"gmax")),a(l.ULS.v.min,r(l.ULS.v,"gmin")),a(l.SLS.v.max),a(l.SLS.v.min),`${rt(l.ULS.tr.max,0)} / ${rt(l.ULS.tr.min,0)}`,`${rt(l.ULS.lon.max,0)} / ${rt(l.ULS.lon.min,0)}`]),"num")),p("div",{class:"card"},p("h3",{},"Piles (kN, kN\xB7m)"),re(["Pile","ULS N max","ULS N min","SLS N max","SLS N min","ULS M long.","ULS M trans.","ULS M resultant (upper)","SLS M long.","SLS M trans."],Object.entries(s.piles).map(([o,l])=>[o,a(l.ULS.N.max,r(l.ULS.N,"gmax")),a(l.ULS.N.min,r(l.ULS.N,"gmin")),a(l.SLS.N.max),a(l.SLS.N.min),a(l.ULS.Ml.abs,r(l.ULS.Ml,"gov")),a(l.ULS.Mt.abs,r(l.ULS.Mt,"gov")),a(e.data.pile_resultants?.[o]?.resultant_upper),a(l.SLS.Ml.abs),a(l.SLS.Mt.abs)]),"num"),p("p",{class:"small muted"},"Resultant (upper) = the larger of the ellipse resultant and the non-concurrent bound of the two moments, as computed by the actions step.")),p("div",{class:"card"},p("h3",{},"Girders \u2014 design actions (kN, kN\xB7m)"),re(["Girder","ULS M sag","ULS M hog","ULS V","ULS T","SLS M sag"],Object.entries(s.girders).sort().map(([o,l])=>[o,a(l.ULS.M_sag.value,r(l.ULS.M_sag,"gov")),a(l.ULS.M_hog.value),a(l.ULS.V.abs),a(l.ULS.T.abs),a(l.SLS.M_sag.value)]),"num")),p("div",{class:"card"},p("h3",{},"Sills / headstocks (kN\xB7m, kN)"),re(["Support","ULS My max","ULS My min","ULS Vz","ULS T"],Object.entries(s.sills).map(([o,l])=>[o,a(l.ULS.My_max.value),a(l.ULS.My_min.value),a(l.ULS.Vz.abs),a(l.ULS.T?.abs)]),"num")),p("p",{class:"small muted"},`${e.data.governing_rows?.length||0} governing combination rows; ${e.data.not_combined?.length||0} actions not combined. Full schedule: `,On(vt.fileUrl(n,"combined_actions.md"),"combined_actions.md")," \xB7 ",On(vt.fileUrl(n,"workbook.xlsx"),"Excel workbook (bearings, piles, girders, bridge data)"))),i}async function vg(n){let[t,{rows:e}]=await Promise.all([vt.loads(n),vt.values(n,!0)]),i=p("div",{},Fn(t.meta)),s={group:"",onOnly:!1},r=f=>Object.entries(f).map(([m,g])=>p("span",{class:"chipline",title:m},Ie(m),` ${g}`)),a=f=>f.on?p("span",{class:"pill ok"},"in the latest run"):f.not_combined?p("span",{class:"pill warn",title:f.not_combined},"not combined"):t.meta?p("span",{class:"pill"},"no load case"):p("span",{class:"muted small"},"no run yet"),o=p("tbody"),l=()=>o.replaceChildren(...t.actions.filter(f=>(!s.group||f.group===s.group)&&(!s.onOnly||f.on)).map(f=>p("tr",{class:f.on?"":"muted"},p("td",{class:"mono"},f.id),p("td",{},f.name,p("div",{class:"small muted"},f.group_name)),p("td",{},a(f),f.not_combined?p("div",{class:"small muted"},f.not_combined):null),p("td",{class:"small"},f.source||""),p("td",{class:"small"},f.inputs.map(m=>p("div",{},p("a",{href:`#/p/${n}/values?q=${encodeURIComponent(m.path.split(" (")[0])}`,class:"mono"},m.path)," ",m.state?r(m.state.tags):p("span",{class:"muted"},"no record")))),p("td",{class:"num"},rt(f.factors.uls,2)),p("td",{class:"num"},rt(f.factors.uls_relieving,2)),p("td",{class:"num"},rt(f.factors.sls,2)),p("td",{class:"small"},f.clause?`Cl ${f.clause}`:"",p("div",{class:"muted"},f.status))))),c=[...new Map(t.actions.map(f=>[f.group,f.group_name])).entries()];i.append(p("div",{class:"card"},p("h3",{},"Load cases \u2014 AS 5100.2 action register"),p("p",{class:"small muted"},'Every action the combination generator knows. "In the latest run" = the chain built a load case for it and combined it; "not combined" = the description has no usable input for it (enter the value on Bridge data and re-run). Load factors are standards entries with their verification status; they are not edited per project.'),p("div",{class:"row wrap"},p("select",{onchange:f=>{s.group=f.target.value,l()}},p("option",{value:""},"All groups"),c.map(([f,m])=>p("option",{value:f},m))),p("label",{class:"small"},p("input",{type:"checkbox",onchange:f=>{s.onOnly=f.target.checked,l()}})," In the run only"),p("span",{class:"small muted"},`${t.actions.filter(f=>f.on).length} of ${t.actions.length} actions in the latest run`)),p("div",{class:"tablewrap"},p("table",{class:"values"},p("thead",{},p("tr",{},["Action","Name","State","Load case built","Inputs (description)","\u03B3 ULS","\u03B3 relieving","\u03B3 SLS","Clause / status"].map(f=>p("th",{},f)))),o))));let u=e.filter(f=>f.path.startsWith("loads."));if(i.append(p("div",{class:"card"},p("h3",{},"Load intensities (description records)"),p("p",{class:"small muted"},`${u.length} records under loads.*; `,p("a",{href:`#/p/${n}/values`},"edit on Bridge data")," (each edit is a decision with history; a change marks the run stale)."),re(["Path","Value","Unit","Data source","Note"],u.map(f=>[p("td",{class:"mono"},f.path),rt(f.value),f.unit||"",p("td",{},Ie(f.tag)),p("td",{class:"small"},f.note||"")]),"values"))),t.rows.length){let f={ls:"ULS",col:""},m=p("tbody"),g=p("span",{class:"small muted"}),_=()=>{let d=t.rows.filter(h=>h.ls===f.ls&&(!f.col||h.col===f.col));g.textContent=`${d.length} rows`,m.replaceChildren(...d.slice(0,600).map(h=>p("tr",{},p("td",{class:"mono"},h.name),p("td",{class:"small"},`Cl ${h.clause} \u2014 ${h.type}`,p("div",{class:"muted"},h.pe)),p("td",{class:"small"},h.terms.map(([M,b])=>p("span",{class:"term"},`${rt(b,2)} \xD7 ${M}`))))))},v=[...new Set(t.rows.map(d=>d.col))];i.append(p("div",{class:"card"},p("h3",{},`Combination matrix \u2014 ${t.n_rows} generated rows (read-only)`),p("p",{class:"small muted"},"Generated by the AS 5100.2 Cl 23 rules from the actions in the latest run. The governing rows per response are on the Analysis tab. Factors: ",t.standards_status||"","."),p("div",{class:"row wrap"},["ULS","SLS"].map(d=>p("button",{class:"chip"+(f.ls===d?" on":""),onclick:h=>{f.ls=d,h.currentTarget.parentElement.querySelectorAll(".chip").forEach((M,b)=>M.classList.toggle("on",b===(d==="ULS"?0:1))),_()}},d)),p("select",{onchange:d=>{f.col=d.target.value,_()}},p("option",{value:""},"All types"),v.map(d=>p("option",{value:d},`${t.types[d]?.clause||d} ${t.types[d]?.title||""}`))),g),p("div",{class:"tablewrap tall"},p("table",{class:"values"},p("thead",{},p("tr",{},["Row","Type","Terms (factor \xD7 action)"].map(d=>p("th",{},d)))),m)))),setTimeout(_)}else i.append(be("No combinations yet","Run the chain; the combination rows are generated from the actions the run builds."));return setTimeout(l),i}async function xg(n){let t=await vt.result(n,"girder_checks.json");if(!t.data)return be("No design checks","Run the chain to check the girders.");let e=t.data,i=pr(e),s=i.map(d=>d.g),r=e[s[0]].rows.map(d=>d.t),a=d=>p("td",{class:`uc ${zi(d)}`},d===void 0?"\u2014":rt(d,2)),o=(d,h,M)=>p("div",{class:"card"},p("h3",{},h),re(["Girder",...r.map(b=>`t=${rt(b,2)}`)],s.map(b=>[b,...e[b].rows.map(x=>a(M(x)))]),"heat")),l=p("div"),c=p("select",{onchange:d=>u(d.target.value)},s.map(d=>p("option",{value:d},d))),u=d=>l.replaceChildren(re(["t","x (m)","zone","strands","Ms*/Mal","M*/\u03C6Mu sag","M*/\u03C6Mu hog","Muo \u2265 1.2Mcr","shear/torsion u"],e[d].rows.map(h=>[rt(h.t,2),rt(h.x_m,2),h.conf,h.n_strands??"",a(h.sag?.uS),a(h.sag?.uB),a(h.hog?.uB),h.conf==="solid"||!h.sag?p("span",{class:"muted"},"n/a"):h.sag.okMin?"ok":p("b",{class:"bad"},"FAIL"),a(h.shear?.u)]),"num"),p("p",{class:"small muted"},"Solid end zones: shear only (flexure / SLS not checked there)."));setTimeout(()=>u(s[0]));let f=e[s[0]].notes||[],m=p("div"),g=p("select",{onchange:d=>_(d.target.value)},s.map(d=>p("option",{value:d},d))),_=d=>{let h=e[d].hog;if(!h?.times?.length){m.replaceChildren(p("p",{class:"muted small"},"No hog results in this run (re-run the chain)."));return}let M=h.times.flatMap(G=>G.hog_mm),b=Math.min(0,...M),x=Math.max(1,...M),D=640,C=220,T=G=>40+(D-60)*(G-h.x_m[0])/(h.x_m[h.x_m.length-1]-h.x_m[0]||1),P=G=>10+(C-40)*(x-G)/(x-b),E=["#1f6feb","#2da44e","#bf8700","#cf222e","#8250df","#57606a"],w=document.createElementNS("http://www.w3.org/2000/svg","svg");w.setAttribute("viewBox",`0 0 ${D} ${C}`),w.setAttribute("class","hogsvg"),w.innerHTML=`<line x1="40" x2="${D-20}" y1="${P(0)}" y2="${P(0)}" stroke="currentColor" stroke-opacity=".3"/><text x="4" y="${P(x)+4}" font-size="11" fill="currentColor">${rt(x,0)}</text><text x="4" y="${P(0)+4}" font-size="11" fill="currentColor">0</text><text x="${D-20}" y="${C-6}" font-size="11" text-anchor="end" fill="currentColor">${rt(h.x_m[h.x_m.length-1],1)} m</text>`+h.times.map((G,B)=>`<polyline fill="none" stroke="${E[B%E.length]}" stroke-width="2" points="${G.hog_mm.map((z,Z)=>`${T(h.x_m[Z]).toFixed(1)},${P(z).toFixed(1)}`).join(" ")}"/>`).join("");let I=Math.floor(h.x_m.length/2);m.replaceChildren(w,p("div",{class:"row wrap small"},h.times.map((G,B)=>p("span",{style:`color:${E[B%E.length]}`},`\u25A0 ${G.label}`))),re(["Time","t (days)","Hog at mid-length (mm)","Max hog (mm)"],h.times.map(G=>[G.label,rt(G.t,0),rt(G.hog_mm[I],1),rt(Math.max(...G.hog_mm),1)]),"num"))};setTimeout(()=>_(s[0]));let v=p("div");return vt.values(n,!0).then(d=>{let h=d.rows.filter(M=>/hog/i.test(M.path)&&M.tag==="Direct");h.length&&v.replaceChildren(p("h3",{},"Hog printed on the drawings (for comparison)"),re(["Field","Value","Source"],h.map(M=>[M.path,typeof M.value=="object"?Object.entries(M.value||{}).map(([b,x])=>`${b}: ${x}`).join("; "):String(M.value),[M.sheet,M.view].filter(Boolean).join(", ")])))}).catch(()=>{}),p("div",{},Fn(t.meta),p("div",{class:"card"},p("h3",{},"Summary \u2014 maximum utilisation per girder"),re(["Girder","Governing","ULS bending","SLS stress","Shear / torsion","Minimum strength fails"],i.map(d=>[d.g,p("td",{class:"left"},p("b",{},d.what)),a(d.uB),a(d.uS),a(d.uV),d.minFail?p("b",{class:"bad"},String(d.minFail)):"0"]),"num"),p("p",{class:"small muted"},"Utilisation = action / capacity; > 1.00 red, > 0.90 amber. Stations at fractions t of the span.")),o("uB","ULS bending M*/\u03C6Mu (sagging) along the girders",d=>d.sag?.uB),o("uV","Shear / torsion utilisation along the girders",d=>d.shear?.u),p("div",{class:"card"},p("div",{class:"row between"},p("h3",{},"Station detail"),c),l),p("div",{class:"card"},p("div",{class:"row between"},p("h3",{},`Girder hog (camber) \u2014 ${e[s[0]].hog_method} losses method, + up`),g),m,p("p",{class:"small muted"},"From the prestress-loss / camber analysis of this run, at each reported time (transfer, erection, deck pour, final). Check the drawing's basis (e.g. self weight only) before comparing; whether a difference is acceptable is the engineer's call."),v),f.length?p("div",{class:"card small"},p("h3",{},"Method notes"),p("ul",{},f.map(d=>p("li",{},d)))):null,p("p",{class:"small muted"},"Full report: ",On(vt.fileUrl(n,"girder_checks.md"),"girder_checks.md")," \xB7 Exports: ",On(vt.fileUrl(n,"workbook.xlsx"),"Excel workbook")," \xB7 ",On(vt.fileUrl(n,"report.docx"),"Word report")," \xB7 ",On(vt.fileUrl(n,"report.html"),"Calculation report")))}async function yg(n){let t=await vt.verification(n),e=p("div",{},Fn(t.meta)),i=s=>s===null?"u-na":Math.abs(s)<=5?"u-ok":Math.abs(s)<=15?"u-warn":"u-fail";return t.printed.length?e.append(p("div",{class:"card"},p("h3",{},"Platform results against values printed on the drawings"),re(["Item","Drawing","Platform","Difference","Source","Note"],t.printed.map(s=>{let r=s.platform===null||s.platform===void 0?null:100*(s.platform-s.reference)/s.reference;return[p("span",{},s.item,s.governing?p("div",{class:"small muted"},`governing pile ${s.governing}; per pile: ${(s.piles||[]).map(a=>`${a.pile} ${rt(a.platform,0)}`).join(", ")}`):null),`${rt(s.reference,0)} ${s.unit}`,s.platform===null||s.platform===void 0?"\u2014":`${rt(s.platform,0)} ${s.unit}`,p("td",{class:`uc ${i(r)}`},r===null?"\u2014":`${r>0?"+":""}${rt(r,1)} %`),s.source,p("span",{class:"small"},s.note||"")]}),"num"),p("p",{class:"small muted"},"Where the drawing gives one value for several piles (an envelope), it is compared with the platform maximum over those piles. Colour shows the size of the difference only (green \u2264 5 %, amber \u2264 15 %, red above); whether a difference is acceptable is the engineer's call. Reference values are the drawing values tagged Direct in the bridge data."))):e.append(be("No printed design actions in the bridge data","When the drawings print design loads (e.g. pile loads), record them in the bridge data and they are compared here after every run.")),t.midas_runs.length&&e.append(p("div",{class:"card"},p("h3",{},`Independent MIDAS Civil runs (${t.midas_runs.length})`),t.midas_runs.map(s=>p("details",{},p("summary",{},p("b",{},s.run)," \u2014 ",s.title),p("pre",{class:"md"},s.text))))),e}async function Mg(n){let t=p("div"),e=s=>{if(!s){t.replaceChildren(be("No runs yet",p("span",{},"Start one from the ",p("a",{href:`#/p/${n}/overview`},"Overview"),".")));return}let r=p("pre",{class:"log"},s.log||"");t.replaceChildren(p("div",{class:"card"},p("div",{class:"row between"},p("h3",{},`Run ${s.id} \u2014 ${s.state}`),p("span",{class:"small muted"},`${s.allow_proposed?"proposed inputs used (provisional)":"accepted inputs only"} \xB7 engine ${s.engine_commit||"?"} \xB7 ${s.description}`)),re(["Step","State","Time (s)"],s.steps.map(a=>[a.title,p("span",{class:`state s-${a.state}`},a.state),a.seconds??""]))),p("div",{class:"card"},p("h3",{},"Files from this run"),p("div",{class:"row wrap"},s.files.map(a=>On(vt.fileUrl(n,a),a,"btn ghost")))),p("div",{class:"card"},p("h3",{},"Log"),r)),r.scrollTop=r.scrollHeight,s.state!=="running"&&clearInterval(yo)},i=await vt.latest(n);return e(i),i?.state==="running"&&(yo=window.setInterval(async()=>e(await vt.latest(n)),2500)),t}si();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
