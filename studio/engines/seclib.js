/* Super-T section outlines and the standard strand grid, extracted from the platform's original grillage dashboard (base v15).
   Change from the source: the top-flange width is an argument (fw, mm) instead of a page field. */
var SECLIB=(function(){
var SEC={
'750 Super-T':{t:'T',H:750,R:[[431.5,0],[450,12],[506.395,600],[613.5,675],[882,675],[895,688],[895,750],[425,750],[425,725],[400,725],[359,307.25],[0,240]]},
'1000 Super-T':{t:'T',H:1000,R:[[413.55,0],[426.69,12],[506.395,850],[613.5,925],[882,925],[895,938],[895,1000],[425,1000],[425,975],[400,975],[333.5,303.21],[0,240]]},
'1200 Super-T':{t:'T',H:1200,R:[[394.55,0],[407.69,12],[506.395,1050],[613.5,1125],[882,1125],[895,1138],[895,1200],[425,1200],[425,1175],[400,1175],[316.5,320.2],[0,260]]},
'1500 Super-T':{t:'T',H:1500,R:[[366.55,0],[379.69,12],[506.395,1350],[613.5,1425],[882,1425],[895,1438],[895,1500],[425,1500],[425,1475],[400,1475],[287.5,314.23],[0,260]]},
'1825 Super-T':{t:'T',H:1825,R:[[337,0],[351.23,12],[506.395,1650],[613.5,1725],[882,1725],[895,1738],[895,1825],[427.3,1825],[427.3,1800],[402.3,1800],[267.3,400],[0,350]]},
};
const len=a=>a.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-a[i][0],p[1]-a[i][1]),0);
const FWMIN=1260;
function sR(s,fw){if(s.t!=='T')return null;const h=(fw||1790)/2,dx=h-895;return s.R.map((p,i)=>i===4?[p[0]+dx,p[1]]:i===5||i===6?[h,p[1]]:p.slice())}
function secProps(k,fw){const s=SEC[k];const R=s.t==="T"?sR(s,fw):s.O.concat([[0,s.H],[0,s.vt]],s.V);
 const P=[[0,0]].concat(R,R.slice(0,-1).reverse().map(p=>[-p[0],p[1]]));let A=0,Sy=0,Ix=0;
 for(let i=0;i<P.length;i++){const[a,b]=[P[i],P[(i+1)%P.length]],c=a[0]*b[1]-b[0]*a[1];A+=c;Sy+=(a[1]+b[1])*c;Ix+=c*(a[1]**2+a[1]*b[1]+b[1]**2)}
 A/=2;const yc=Sy/(6*A);Ix=Ix/12-A*yc*yc;
 const ue=s.t==='T'?len([[0,0]].concat(R,R.slice(0,-1).reverse().map(p=>[-p[0],p[1]]),[[0,0]])):2*len([[0,0]].concat(s.O,[[0,s.H]]))+len([[0,s.vt]].concat(s.V));
 return{P,A,yb:yc,I:Ix,H:s.H,ue}}
let S=[],cur='',LAST=null;
const kk=(a,b)=>{const r=[];for(let x=a;x<=b;x+=50)r.push(x);return r};
const T12=[[60,[25,75,125,225,275]],[110,kk(25,325)],[160,kk(25,325)],[210,[175,225,275,325]]],T34=[[60,[25,75,125,225]],[110,kk(25,275)],[160,kk(25,275)],[210,kk(25,275)],[260,[275]]],T5=[[60,[25,75,125,225]],[110,kk(25,225)],[160,kk(25,225)],[210,kk(25,275)],[260,kk(25,275)],[310,[225]]];
// TfNSW B0203 Sheet B: levels above soffit, x = +/- offsets from centreline. Top strands at +/-495, 80 below top (scaled from drawing)
const TFR={'750 Super-T':T12,'1000 Super-T':T12,'1200 Super-T':T34,'1500 Super-T':T34,'1825 Super-T':T5};
function grid(k){const o=[];TFR[k].concat([[SEC[k].H-80,[495]]]).forEach(([y,xs])=>xs.forEach(x=>[-x,x].forEach(X=>o.push({x:X,y,on:true,d:0,d2:0}))));return o}
return {SEC:SEC, sR:sR, secProps:secProps, grid:grid, TFR:TFR, FWMIN:FWMIN};
})();
if(typeof module!=='undefined') module.exports=SECLIB;
