import json,sys,math
sys.path.insert(0,'.')
import numpy as np
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.responses import ResponseSet
from pdf2bim.model.traffic import traffic_envelope, Influence, governing_state
from pdf2bim.design.prestress_inputs import hog_inputs
from pdf2bim.design.prestress import run, strand_forces_at, stage_moments_at, differential_shrinkage
from pdf2bim.design.stations import station_section
from pdf2bim.design.nm import nm_curve
from pdf2bim.design.flexure import elastic
from pdf2bim.sections.supert import supert_section
from standards.accessor import Standards
std=Standards()
doc=json.load(open('projects/BR13A/BR13A.bridge.0.2.json'))
geo=build_geometry(doc,allow_proposed=True); S=build_sections(doc,geo,allow_proposed=True)
M=build_integrated(doc,geo,S,std,allow_proposed=True); m=M['model']
ids=sorted(m.nodes); c=np.array([m.nodes[i][:3] for i in ids]).mean(0)
al=geo['_alignment']
out={}
# ---------- traffic
RS=ResponseSet(M); ix=RS.index
T=traffic_envelope(doc,geo,M,std,allow_proposed=True,inf=Influence(M,responses=RS))
deckz=float(max(m.nodes[i][2] for i in ids))-c[2]
def xy(ch,o):
    E,N,_=al.point(ch,o); return [round(E-c[0],3),round(N-c[1],3)]
targets=[]
gm=[(T['env']['M1600']['max'][i],n) for n,i in ix.items() if n[0]=='G' and n[1][0]=='G4' and n[2][0]=='M']
targets.append(('G4 maximum sagging moment',max(gm)[1]))
targets.append(('Bearing A-G4 maximum vertical force',('BL','A-G4','v')))
targets.append(('Bearing A-G1 maximum vertical force',('BL','A-G1','v')))
tr={'models':{},'lane_width':T['lane_width'],'lane_factors':T['lane_factors'],'layouts':len(T['layouts']),'settings':T['settings'],'cases':[],'deck_z':round(float(deckz),3)}
for mn,v in T['vehicles'].items():
    tr['models'][mn]={k:v[k] for k in v if isinstance(v[k],(int,float,str))}
for lab,n in targets:
    for mn in T['models']:
        st=governing_state(T,mn,ix[n],1)
        lanes=[]
        for a,fk in st['factors']:
            ch0,ch1=geo['deck']['ch_start'] if 'ch_start' in geo['deck'] else None, None
            lanes.append({'a':a,'f':fk})
        wheels={}
        for ch,o,P in st['loads']:
            k=(round(ch,2),round(o,2)); wheels[k]=wheels.get(k,0)+P
        pts=[xy(ch,o)+[round(P,2)] for (ch,o),P in wheels.items()]
        tr['cases'].append({'target':lab,'model':mn,'value':round(st['value'],1),'unit':'kN m' if n[0]=='G' else 'kN','lanes':lanes,'loads':pts})
# lane strip outlines for drawing: along bridge chainage range
chs=[s['ch'] for s in geo['supports']] if 'ch' in geo['supports'][0] else None
print('support keys', list(geo['supports'][0].keys()))
out['traffic']=tr
# ---------- hog
hog={}
for g in S['girders']:
    H=hog_inputs(doc,geo,S,g,std,allow_proposed=True); p=H['p']; r=run(p,std)
    res=[{'t':q['t'],'label':q['label'],'hog_mm':round(q['hog'][r['mi']],2),'P_mid_kN':round(sum(q['Pm']),1)} for q in r['res']]
    X=r['X']; last=r['res'][-1]['P_st']; first=r['res'][0]['P_st']
    prof=[{'x_m':round(x/1000,3),'P_transfer':round(sum(first[i]),1),'P_final':round(sum(last[i]),1)} for i,x in enumerate(X) if i%3==0 or i==len(X)-1]
    dsh=differential_shrinkage(r)
    hog[g]={'method':r['method'],'times':res,'profile':prof,'n_strands':len(p['sy']),'jacking':p['ji'],'mbl':p['mbl'],'Ap':p['Ap'],'L_m':p['L']/1000,'P0_strand':round(r['P0'],1),
            'eps_dsh':round(dsh['eps']*1e6,1) if dsh else None,
            'inputs':{k:p[k] for k in ('k4','chi','tau','pour','sidlA','fc','fci','Ect','Ec','rho','wd','sidl','RH' if 'RH' in p else 'k4') if k in p}}
out['hog']=hog
# ---------- section G2 midspan
st=station_section(doc,geo,S,'G2',0.5,allow_proposed=True); sec=st['section']
Gp=S['girders']['G2']['params']; row=[r for r in S['girders']['G2']['stations'] if abs(r['t']-0.5)<1e-9][0]
gs=supert_section(Gp,row['w_left'],row['w_right'],'open')
tD=S['deck_thickness']; Dtot=st['Dtot']; ygt=st['y_girder_top']
outline=[[round(x,1),round(y,1)] for x,y in gs['outline']]   # y up from girder soffit
deck=[[-row['deck_left'],0],[row['deck_right'],0]]
strands=[{'x':t.get('x'),'y_from_soffit':round(Dtot-t['y'],1),'A':t['A']} for t in sec.tend]
bars=[{'y_from_soffit':round(Dtot-b['y'],1),'d':b.get('d'),'n':b.get('n')} for b in sec.bars]
el=elastic(sec,st['materials']['E_girder'])
H=hog_inputs(doc,geo,S,'G2',std,allow_proposed=True); p=H['p']; r=run(p,std)
F=strand_forces_at(r,st['x_m']*1000)
for t in sec.tend: t['epe']=F[t['k_on']]*1e3/(t['A']*t['E']); t['fpb']=p['mbl']*1e3/p['Ap']
nm=nm_curve(sec,std,'top',el['yc'])
Z=json.load(open('projects/BR13A/model/BR13A.girder_checks.json'))
rr=[x for x in Z['G2']['rows'] if x['t']==0.5][0]['sag']
out['section']={'girder':'G2','station':'midspan','D':Gp['D'],'tD':tD,'haunch':S['girders']['G2']['haunch'],'outline':outline,'deck_left':row['deck_left'],'deck_right':row['deck_right'],
  'w_left':row['w_left'],'w_right':row['w_right'],'params':Gp,'strands':strands,'bars':bars,'materials':st['materials'],
  'composite':{'A_mm2':round(el['A']),'yc_from_top':round(el['yc'],1),'I_mm4':el['I']},'missing':st['missing'],
  'nm':[{'N':round(q['N']),'M':round(q['M']),'phi':round(q['phi'],3)} for q in nm['pts']],
  'stress':{'girder_alone_top':round(rr['girder_alone']['top'],2),'girder_alone_bot':round(rr['girder_alone']['bot'],2),'soffit_Ms':round(rr['soffit_sls'],2),'deck_top_Ms':round(rr['deck_top_sls'],2),'Mu':round(rr['Mu']),'Nu':round(rr['Nu']),'phiMu':round(rr['phiMu'])},
  'sp_mean':round(float(np.mean([F[t['k_on']]*1e3/t['A'] for t in sec.tend])),1)}
# ---------- loads / combinations
CA=json.load(open('projects/BR13A/model/BR13A.combined_actions.json'))
out['combos']={'rows':CA['run']['rows'],'on':CA['run']['on'],'sources':CA['sources'],'not_combined':CA['not_combined']}
print(json.dumps(out['traffic']['cases'][0])[:300]); print(len(json.dumps(out)))
json.dump(out,open('/tmp/claude-0/-home-claude/26ed6757-087c-514d-944a-fb75ed869c40/scratchpad/viewer_data2.json','w'),separators=(',',':'),default=float)
ch0=min(s['ch'] for s in geo['supports'])-0.6; ch1=max(s['ch'] for s in geo['supports'])+0.6
chs=list(np.linspace(ch0,ch1,31))
W=T['lane_width']
for cs in out['traffic']['cases']:
    for ln in cs['lanes']:
        ln['poly']=[xy(ch,ln['a']) for ch in chs]+[xy(ch,ln['a']+W) for ch in reversed(chs)]
json.dump(out,open('/tmp/claude-0/-home-claude/26ed6757-087c-514d-944a-fb75ed869c40/scratchpad/viewer_data2.json','w'),separators=(',',':'),default=float)
print('lanes ok', W, out['traffic']['models'])
print({g:(h['times'][-1]['hog_mm'],h['times'][0]['hog_mm']) for g,h in out['hog'].items()})
print(out['section']['stress'], out['section']['sp_mean'], out['section']['missing'])
