"""BR13A — one-off migration of the v44 dashboard state into the bridge description format (step B2).

Input : projects/BR13A/source/dashboard_v44_state.json  (tools/dump_dashboard_state.js)
Output: projects/BR13A/BR13A.bridge.json and BR13A.decisions.jsonl

This converter is BR13A-specific on purpose: it moves the first bridge into the general format. New bridges are
written in the format directly by the extraction stage, not through this script.
Rules kept: every value keeps the tag it had in the dashboard; template / placeholder values become Assumed
(with what they are to be replaced by); takeoff rows that the catalogue does not cover go to `custom`, row for row.
"""
import json, os, re, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(HERE, 'source', 'dashboard_v44_state.json')))
NOW = '2026-10-23T13:00:00+11:00'
DOCS = {}
DEC = []

def doc_of(*texts):
    for t in texts:
        m = re.search(r'\b(20\d{4})\b', str(t or ''))
        if m:
            n = m.group(1); DOCS.setdefault('DRG-' + n, {'id': 'DRG-' + n, 'number': n, 'kind': 'drawing', 'revision': '02'}); return 'DRG-' + n
    return 'GA-Rev02'

def dec(key, to, to_tag, reason, by='Engineer', frm=None, from_tag=None, status='accepted', affects=None, evidence=None, approved_by='Masoud', date=NOW, note=None):
    i = 'D-%d' % (len(DEC) + 1)
    e = {'id': i, 'date': date, 'by': by, 'key': key, 'from': frm, 'from_tag': from_tag, 'to': to, 'to_tag': to_tag, 'reason': reason, 'status': status}
    if status == 'accepted': e.update(approved_by=approved_by, approved_at=date)
    if affects: e['affects'] = affects
    if evidence: e['evidence'] = evidence
    DEC.append(e); return i

def V(value, unit, tag, doc=None, view=None, text=None, note=None, formula=None, inputs=None, ref=None, decision=None, replace=None, status=None):
    v = {'value': value, 'tag': tag}
    if unit: v['unit'] = unit
    src = {}
    if doc: src['doc'] = doc
    if view: src['view'] = view
    if text not in (None, ''): src['text'] = str(text)[:300]
    if tag in ('Assumed', 'Model') and not note: note = 'placeholder'
    if tag in ('Assumed', 'Model'): src['note'] = note
    elif note: v['note'] = note[:600]
    if src: v['source'] = src
    if tag == 'Calculated': v['derivation'] = {'formula': formula or note or 'see note', 'inputs': inputs or []}
    if ref: v['ref'] = ref
    if decision: v['decision'] = decision
    if replace: v['replace_with'] = replace
    v['status'] = status or ('open' if tag == 'Missing-Flagged' else 'accepted')
    return v

TAGMAP = {'Direct': 'Direct', 'Calculated': 'Calculated', 'Missing - Flagged': 'Missing-Flagged', 'Missing — Flagged': 'Missing-Flagged',
          'Confirmed - Engineer': 'Confirmed-Engineer', 'Standard': 'Standard-verify'}
METATAG = {'D': 'Direct', 'C': 'Calculated', 'M': 'Model', 'E': 'Confirmed-Engineer', 'S': 'Standard-verify'}

P, META = S['P'], S['META']
def PV(k, unit=None, scale=1.0, view='parameters'):
    m = META.get(k, [k, '', 'D']); tag = METATAG[m[2]]; val = P[k] * scale if isinstance(P[k], (int, float)) else P[k]
    kw = {}
    if tag == 'Confirmed-Engineer': kw['decision'] = dec('P.' + k, P[k], 'Confirmed-Engineer', 'Dashboard parameter "' + m[0] + '" confirmed by the engineer (migrated; original date not recorded)')
    if tag == 'Model': kw['note'] = 'modelling choice: ' + m[0]
    if tag == 'Standard-verify': kw['ref'] = 'std:unspecified/' + k
    return V(round(val, 6) if isinstance(val, float) else val, unit, tag, doc='GA-Rev02' if tag == 'Direct' else None, view=m[0], text=P[k], formula=m[0] + ' (dashboard derivation)', **kw)

# ---------------- general decisions (this month) ----------------
D_PLACE = dec('*', 'placeholders allowed', 'Assumed', 'Engineer instruction 2026-10-22: where information is not available, assume a value so the model runs; bearings free longitudinally on one side, fixed on the other.', date='2026-10-22T10:00:00+11:00')
D_STATE = dec('*', 'assumed values stated at the input', 'Assumed', 'Engineer instruction 2026-10-23: assume a value when there is no information, but state it in the input area.', date='2026-10-23T11:18:00+11:00')
D_MAT = dec('materials.concrete', 'girders 50 MPa, other elements 40 MPa', 'Input-user', 'Engineer instruction recorded in the MCT header (MATERIALS [Engineer instruction])', evidence=['MCT header'])

DOCS['GA-Rev02'] = {'id': 'GA-Rev02', 'title': 'BR13A general arrangement drawing set, Rev 02 bundle (23 sheets)', 'number': 'M7I-BR-202', 'revision': '02', 'kind': 'drawing', 'file': 'BR13A_GA_Rev02.pdf'}

B = {'format': 'pdf2bim.bridge/0.1', 'library': 'library/products.json', 'standards': 'standards/AS5100-2017.json'}
hdr = 'title block / dashboard header'
B['project'] = {
    'name': V('M7–M12 southbound exit ramp', None, 'Direct', doc='GA-Rev02', view=hdr),
    'bridge_id': V('B12639 (BR13A)', None, 'Direct', doc='GA-Rev02', view=hdr, text='BRIDGE B12639'),
    'designer': V('BG&E', None, 'Direct', doc='GA-Rev02', view=hdr),
    'drawing_set': V('M7I-BR-202', None, 'Direct', doc='GA-Rev02', view=hdr),
    'revision': V('00 (bundle Rev 02)', None, 'Direct', doc='GA-Rev02', view=hdr),
    'status': V('For construction', None, 'Direct', doc='GA-Rev02', view=hdr),
    'datum_horizontal': V('MGA56 / GDA2020', None, 'Direct', doc='GA-Rev02', view=hdr),
    'datum_vertical': V('AHD', None, 'Direct', doc='GA-Rev02', view=hdr),
    'base_point': {'rows': [{'cells': {'name': 'MCT local origin = control line at Support A, CH 1895.300', 'E': 300098.513, 'N': 6249478.409, 'RL': None},
                             'tag': 'Model', 'status': 'accepted', 'source': {'note': 'MIDAS export offset only (MCT header); all project data stay in MGA'}}]},
    'importance_level': V(None, None, 'Missing-Flagged', note='Not in the drawing set; needed for the earthquake return period'),
    'design_life': V(None, 'years', 'Missing-Flagged', note='Not in the drawing set'),
}
# ---------------- alignment ----------------
def row(cells, tag, **kw):
    r = {'cells': cells, 'tag': tag, 'status': kw.pop('status', 'open' if tag == 'Missing-Flagged' else 'accepted')}
    if tag in ('Direct',): r['source'] = {'doc': kw.pop('doc', 'GA-Rev02'), 'view': kw.pop('view', '')}
    if tag in ('Assumed', 'Model'): r['source'] = {'note': kw.pop('note', 'placeholder')}
    if tag == 'Calculated': r['derivation'] = {'formula': kw.pop('formula', 'see note'), 'inputs': kw.pop('inputs', [])}
    if tag == 'Standard-verify': r['ref'] = kw.pop('ref')
    for k in ('replace_with', 'decision', 'note'):
        if k in kw: r[k] = kw.pop(k)
    return r
aview = 'Horizontal/vertical alignment and skew diagram (DRG 202012)'
doc_of('202012')
B['alignment'] = {
    'control_line': V('M2W1', None, 'Direct', doc='DRG-202012', view=aview),
    'horizontal': {'rows': [
        row({'element': 'spiral', 'ch_start': P['TSch'], 'length': round(P['SCch'] - P['TSch'], 3), 'radius': P['R'], 'direction': 'left', 'E_start': P['TSe'], 'N_start': P['TSn']}, 'Direct', doc='DRG-202012', view=aview + ' — TS to SC; length = SC − TS (Calculated)'),
        row({'element': 'arc', 'ch_start': P['SCch'], 'length': round(P['CSch'] - P['SCch'], 3), 'radius': P['R'], 'direction': 'left', 'E_start': P['SCe'], 'N_start': P['SCn']}, 'Direct', doc='DRG-202012', view=aview + ' — SC to CS'),
        row({'element': 'spiral', 'ch_start': P['CSch'], 'length': round(P['STch'] - P['CSch'], 3), 'radius': P['R'], 'direction': 'left', 'E_start': P['CSe'], 'N_start': P['CSn']}, 'Direct', doc='DRG-202012', view=aview + ' — CS to ST'),
        row({'element': 'tangent', 'ch_start': P['STch'], 'length': None, 'radius': None, 'direction': None, 'E_start': P['STe'], 'N_start': P['STn']}, 'Direct', doc='DRG-202012', view=aview + ' — ST'),
    ], 'note': 'Curve direction recorded as "left" from the bearings in (TS 285.23°) and out (ST 257.45°); curve centre E %.3f N %.3f (Direct)' % (P['CENe'], P['CENn'])},
    'vertical': {'rows': [row({'ch': P['P1ch'], 'RL': P['P1rl'], 'grade_in': None, 'grade_out': None, 'curve_length': None}, 'Direct', doc='DRG-202012', view=aview + ' — P1 (TP)'),
                          row({'ch': P['P2ch'], 'RL': P['P2rl'], 'grade_in': None, 'grade_out': None, 'curve_length': P['VCL']}, 'Direct', doc='DRG-202012', view=aview + ' — VPI, vertical curve length'),
                          row({'ch': P['P3ch'], 'RL': P['P3rl'], 'grade_in': None, 'grade_out': None, 'curve_length': None}, 'Direct', doc='DRG-202012', view=aview + ' — P3 (TP)')]},
    'crossfall': {'rows': [row({'ch': None, 'left': P['xfL'], 'right': P['xfR'], 'crown_offset': P['xfc']}, 'Direct', doc='GA-Rev02', view='typical deck section; crown offset Calculated in the dashboard (' + META['xfc'][0] + ')')]},
    'support_lines': {'rows': [row({'support': 'A', 'ch': P['CHA'], 'skew': 34.5, 'skew_dms': None}, 'Confirmed-Engineer', decision=dec('alignment.support_lines[A]', 34.5, 'Confirmed-Engineer', 'Skew and plan orientation confirmed by the engineer (takeoff row 18)', evidence=['DRG-202012', 'DRG-202101'])),
                               row({'support': 'B', 'ch': P['CHB'], 'skew': 34.5, 'skew_dms': None}, 'Confirmed-Engineer', decision=DEC[-1]['id'])],
                      'note': 'Support line bearing %.6f° (Direct, DRG 202012)' % P['SUPB']},
}
# ---------------- deck ----------------
B['deck'] = {
    'edge_left': PV('edgeL', 'm'), 'edge_right': PV('edgeR', 'm'), 'carriageway_left': PV('cwL', 'm'), 'carriageway_right': PV('cwR', 'm'),
    'slab_thickness': PV('slab', 'mm', 1000), 'surfacing_thickness': PV('surf', 'mm', 1000),
    'surfacing_density': V(S['LD']['gamma'], 'kN/m3', 'Standard-verify', ref='std:AS5100.2-2017/density/asphalt'),
    'girders_follow_crossfall': V(bool(P['gtilt']), None, 'Direct', doc='GA-Rev02', view=META['gtilt'][0]),
    'end_gap': PV('gapDeck', 'mm'),
    'footway': {'rows': [], 'note': 'No footway rows: presence of a footway not confirmed (the Combos tab still has pedestrian load ticked) — open item'},
    'barriers': [{'id': 'barrier_' + side, 'side': V(side, None, 'Direct', doc='DRG-202401', view='typical section'),
                  'type': V('precast concrete barrier', None, 'Direct', doc=doc_of('202401'), view='DRG 202401 referenced; barrier sheet not in this set'),
                  'height': V(S['WD']['hBar'] * 1000, 'mm', 'Assumed', note='barrier height not in this set', decision=D_STATE, replace='barrier drawing DRG 202401 / product sheet'),
                  'weight': V(S['EQ']['wbar'], 'kN/m', 'Assumed', note='barrier mass not in this set (Loads tab: Missing - Flagged)', decision=D_STATE, replace='barrier drawing DRG 202401 / product sheet'),
                  'offset': V(round((P['edgeL'] + P['cwL']) / 2 if side == 'left' else (P['cwR'] + P['edgeR']) / 2, 4), 'm', 'Calculated', formula='(deck edge + carriageway edge) / 2', inputs=['deck.edge_' + side, 'deck.carriageway_' + side]),
                  'solid': V(True, None, 'Assumed', note='solid face assumed for wind', decision=D_STATE, replace='barrier drawing')} for side in ('left', 'right')],
    'other_sdl': V(None, 'kPa', 'Missing-Flagged', note='Nothing shown on the GA'),
}
# ---------------- superstructure ----------------
D_STRAIGHT = dec('superstructure.members[*].straight', True, 'Input-user', 'Engineer choice for the girder definition: girders straight between their bearings; shared strands/zones with per-girder width', affects=['design.supert'])
D_HOG = dec('superstructure.members[*].length', 'from the model girder line', 'Calculated', 'Hog beam length and bearing offset follow the model (was 34950 / 530 mm from the workbook template). Done in v44 on the engineer request "do from top to bottom".', by='AI', from_tag='Assumed', frm=34950, affects=['design.supert'])
mem = []
for g in S['gw']:
    k = g['k']
    mem.append({'id': 'G%d' % k,
                'line_offset_A': V(round(g['o'], 4), 'm', 'Calculated', formula='girder group centre ± n·spacing (dashboard gcen, gspac)', inputs=['custom.dashboard_parameters/gcen', 'custom.dashboard_parameters/gspac']),
                'line_offset_B': V(round(g['o'], 4), 'm', 'Calculated', formula='as at A (constant offset in the model mesh)', inputs=['custom.dashboard_parameters/gcen', 'custom.dashboard_parameters/gspac']),
                'straight': V(True, None, 'Input-user', decision=D_STRAIGHT),
                'length': V(round(g['Ltot'], 3), 'm', 'Calculated', formula='length of the model girder line, deck end to deck end', inputs=['alignment', 'deck', 'alignment.support_lines'], decision=D_HOG),
                'bearing_offset_A': V(round(g['sA'] * 1000), 'mm', 'Calculated', formula='girder end to bearing node along the model girder line', inputs=['bearings']),
                'bearing_offset_B': V(round((g['Ltot'] - g['sB']) * 1000), 'mm', 'Calculated', formula='girder end to bearing node along the model girder line', inputs=['bearings']),
                'type_ref': V('ST1', None, 'Model', note='all four girders use one type definition; per-girder deck width along the length (girder definition)')})
hog, sec = S['hog'], S['DGsec']
D_SEC = dec('superstructure.supert_types[ST1].section', 'lib:supert/1500', 'Input-user',
            'CONFLICT: the GA says four 1515 deep PSC Super-T girders and the grillage uses 1515 mm, but the Hog / design section is the workbook template "1825 Super-T". AI proposes the 1500 Super-T product section (to be confirmed against DRG 202301–303), then re-run the design.',
            by='AI', frm='lib:supert/1825', from_tag='Assumed', status='proposed', evidence=['GA-Rev02 title / header', 'model girder sections G1–G4 (1515 mm)'], affects=['design.supert', 'reports'])
on = [t for t in hog['S'] if t.get('on')]
B['superstructure'] = {
    'type': V('super-t', None, 'Direct', doc='GA-Rev02', view=hdr, text='four 1515 deep PSC Super-T girders'),
    'spans': V(1, None, 'Direct', doc='GA-Rev02', view=hdr, text='30 m single span'),
    'members': mem,
    'supert_types': [{
        'id': 'ST1',
        'section': V('lib:supert/1825', None, 'Assumed', note='Hog Calculator workbook template section ("1825 Super-T"), not read from BR13A — conflicts with the 1515 mm girders on the GA; see ' + D_SEC, replace='Super-T type on DRG 202301–303 (decision ' + D_SEC + ' proposed)', status='open'),
        'depth': V(1515, 'mm', 'Direct', doc='GA-Rev02', view=hdr, text='1515 deep', note='The design section currently in the dashboard is 1825 deep — open conflict ' + D_SEC),
        'top_flange_width': V(round(P['flange'] * 1000, 1), 'mm', 'Calculated', formula=META['flange'][0], inputs=['custom.dashboard_parameters/flange']),
        'concrete_transfer': V(hog['p']['fci'], 'MPa', 'Assumed', note='Hog template value', decision=D_STATE, replace='girder drawings / specification'),
        'concrete_28d': V(sec['fcg'], 'MPa', 'Input-user', decision=D_MAT),
        'strand_pattern': {'rows': [row({'y': t['y'], 'x': t['x'], 'diameter': hog['p']['db'], 'debond_left': t.get('d') or 0, 'debond_right': t.get('d2') or 0, 'on': bool(t.get('on'))}, 'Assumed',
                                        note='Hog workbook template strand pattern', replace_with='girder drawings (strand pattern / debonding not in this set)') for t in hog['S']],
                           'note': '%d positions, %d strands on — template, not BR13A' % (len(hog['S']), len(on))},
        'jacking_ratio': V(hog['p']['ji'], None, 'Assumed', note='Hog template value', decision=D_STATE, replace='girder drawings / specification'),
        'bars': {'rows': [row({'y': b['y'], 'diameter': b['d'], 'number': 1, 'from': None, 'to': None}, 'Assumed', note='Hog workbook template bar at x = %s' % b['x'], replace_with='girder drawings') for b in hog['B']]},
        'fitments': {'rows': [], 'note': 'Not entered — Missing'},
        'zones': {'rows': [], 'note': 'No solid end zones defined — Missing'},
        'deck_bars': {'rows': [row({'face': d['pos'], 'diameter': d['d'], 'spacing': d['s'], 'cover': d['c']}, 'Missing-Flagged') for d in sec['dbars']]},
        'transfer_supports': V(None, 'mm', 'Missing-Flagged', note='Hog uses the bearing offset when blank'),
        'age_at_transfer': V(hog['p']['tau'], 'days', 'Assumed', note='Hog template', decision=D_STATE, replace='construction programme'),
        'age_at_erection': V(None, 'days', 'Missing-Flagged'),
        'age_deck_cast': V(hog['p']['pour'], 'days', 'Assumed', note='Hog template', decision=D_STATE, replace='construction programme'),
    }],
    'plank_types': [],
}
# ---------------- bearings ----------------
SB = S['SUBM']
D_BRG = dec('bearings.items[*].restraint', 'A fixed both ways; B free longitudinally, fixed transversely', 'Input-user', 'Engineer instruction 2026-10-22 (placeholder bearing layout until the bearing schedule)', date='2026-10-22T10:00:00+11:00', affects=['model', 'analysis.static', 'combinations', 'substructure'])
items = []
for i, l in enumerate(S['links']):
    ab = 'B' if 'AbutB' in l['group'] else 'A'; gi = (i % 4) + 1; R = SB['bA'] if ab == 'A' else SB['bB']
    items.append({'id': '%s-G%d' % (ab, gi), 'support': V(ab, None, 'Model', note='bearing link %d of the model' % l['id']), 'member': V('G%d' % gi, None, 'Model', note='paired by link order (girder IDs on 202301–303 not read yet)'),
                  'type': V('elastomeric', None, 'Direct', doc='GA-Rev02', view='laminated elastomeric bearings (GA)'),
                  'plan_a': V(SB['ea'], 'mm', 'Assumed', note='bearing schedule not in this set', decision=D_PLACE, replace='bearing schedule'),
                  'plan_b': V(SB['eb'], 'mm', 'Assumed', note='bearing schedule not in this set', decision=D_PLACE, replace='bearing schedule'),
                  'elastomer_thickness': V(SB['eT'], 'mm', 'Assumed', note='bearing schedule not in this set', decision=D_PLACE, replace='bearing schedule'),
                  'shear_modulus': V(SB['eG'], 'MPa', 'Assumed', note='typical elastomer value', decision=D_PLACE, replace='supplier / AS 5100.4'),
                  'restraint_longitudinal': V(R['lon'] if R['lon'] != 'elast' else 'elastic', None, 'Input-user', decision=D_BRG),
                  'restraint_transverse': V(R['tra'] if R['tra'] != 'elast' else 'elastic', None, 'Input-user', decision=D_BRG),
                  'height': V(S['SL']['hBrg'] * 1000, 'mm', 'Assumed', note='bearing + plinth height not dimensioned', decision=D_STATE, replace='bearing schedule / girder seat detail')})
B['bearings'] = {'items': items}
# ---------------- supports ----------------
ABT, PIL = S['ABT'], S['PIL']
def trow(rows, n):
    for r in rows:
        if r[0] == n: return r
def T(rows, n, ab, unit=None, scale=1.0):
    r = trow(rows, n); i = 5 if ab == 'A' else 8; val, tg, nt = r[i], r[i + 1], r[i + 2]; tag = TAGMAP.get(tg, 'Missing-Flagged')
    if isinstance(val, (int, float)): val = round(val * scale, 6)
    kw = {}
    if tag == 'Confirmed-Engineer': kw['decision'] = dec('takeoff row %d (%s)' % (n, ab), val, tag, (nt or 'confirmed by the engineer')[:300])
    if tag == 'Missing-Flagged': kw['note'] = (('Provisional value carried: %s. ' % val) if val is not None else '') + (nt or '')
    return V(val if tag != 'Missing-Flagged' else None, unit, tag, doc=doc_of(nt, r[11]), view='takeoff row %d — %s' % (n, r[2]), text=val, formula=nt, inputs=['custom.takeoff_abutments' if rows is ABT else 'custom.takeoff_piles'], **kw)
D_SOIL = dec('supports[*].soil_layers', 'fill springs from the column head down to RL B, kh 10 MN/m3; rock kh 200 MN/m3', 'Assumed', 'Engineer instruction 2026-10-22/23: soil springs at the soil level along the columns; values assumed until the geotechnical report', date='2026-10-23T11:18:00+11:00', affects=['model', 'analysis.static', 'analysis.modal', 'substructure'])
sups = []
for ab in ('A', 'B'):
    so = SB['soil'][ab]; piles = [q for q in SB['piles'] if q['ab'] == ab]
    sups.append({'id': ab,
        'kind': V('spill-through abutment', None, 'Direct', doc='DRG-202050', view='DRG 202050 notes: embankment completed to pile cut-off level before piling; columns through the fill'),
        'headstock': {'rows': [row({'width': trow(ABT, 25)[5 if ab == 'A' else 8], 'depth': trow(ABT, 35)[5 if ab == 'A' else 8], 'length': trow(ABT, 28)[5 if ab == 'A' else 8] / 1000, 'rl_top': None, 'rl_soffit': None}, 'Direct', doc='DRG-202103', view='takeoff rows 25 (width, Calculated 350 + 515 + 835), 35 (depth), 28 (front-face length); levels vary along the sill — see custom.takeoff_abutments rows 40–88')]},
        'curtain_wall': {'rows': [row({'thickness': trow(ABT, 24)[5], 'height': trow(ABT, 34)[5 if ab == 'A' else 8]}, 'Direct', doc='DRG-202103', view='takeoff rows 24, 34 (maximum height)')]},
        'wingwalls': {'rows': [], 'note': 'Wingwall geometry is in custom.takeoff_abutments (group 6)'},
        'piles': [{'id': q['id'], 'E': V(round(q['x'] + 300098.513, 3), 'm', 'Calculated', formula='SOP + pile position s along the bearing line (takeoff PIL rows 19–22), project grid', inputs=['custom.takeoff_piles']),
                   'N': V(round(q['y'] + 6249478.409, 3), 'm', 'Calculated', formula='as E', inputs=['custom.takeoff_piles']),
                   'diameter': T(PIL, 31, ab, 'mm'), 'rl_top': V(round(q['zTop'], 3), 'm', 'Calculated', formula='sill soffit at the pile position (model)', inputs=['supports.headstock', 'custom.takeoff_abutments']),
                   'rl_rock': T(PIL, 37, ab, 'm'), 'rl_toe': T(PIL, 36, ab, 'm'),
                   'ground_rl': V(round(q['ground'], 3), 'm', 'Assumed', note='ground taken at the column head (sill soffit): embankment level at the piles not in this set', decision=D_SOIL, replace='embankment / spill-through levels, geotechnical report'),
                   'design_actions': {'rows': [], 'note': 'DRG 202050 Table 1 lists pile loads (≈520 kN·m ULS moment noted in the dashboard — confirm on the sheet); not entered row by row yet'}} for q in piles],
        'soil_layers': {'rows': [row({'name': L['nm'], 'rl_top': (L['top'] if j else so['g']), 'kh': L['kh'], 'gamma': S['SL']['gam'], 'phi': S['SL']['phi']}, 'Assumed', note='layer %d (top = ground at each pile)' % (j + 1) if j == 0 else 'layer %d' % (j + 1), decision=D_SOIL, replace_with='geotechnical report') for j, L in enumerate(so['layers'])]},
        'rock_kh': V(SB['khRock'], 'MN/m3', 'Assumed', note='geotechnical report not in this set', decision=D_SOIL, replace='geotechnical report'),
        'backfill': {'rows': [row({'gamma': S['SL']['gam'], 'phi': S['SL']['phi'], 'K': S['SL']['kmode'], 'retained_height': None}, 'Assumed', note='fill properties assumed; retained height Calculated on the soil page from the GA depths + 0.15 m bearing zone', decision=D_STATE, replace_with='geotechnical report')]},
    })
B['supports'] = sups
# ---------------- materials ----------------
B['materials'] = {
    'concrete': {'rows': [row({'element': 'Super-T girders', 'fc': sec['fcg'], 'E': sec['Eg'], 'density': 25.5, 'alpha': TG_A if (TG_A := (S['TM']['alpha'] * 1e6)) else None}, 'Input-user', decision=D_MAT, note='density 25.5 kN/m3 and E from the MCT materials; alpha 10e-6 is Assumed (Temperature page)'),
                          row({'element': 'deck, headstocks, piles', 'fc': sec['fcd'], 'E': sec['Ed'], 'density': 25.5, 'alpha': TG_A}, 'Input-user', decision=D_MAT, note='as above')]},
    'strand': {'rows': [row({'type': '15.2 mm strand', 'diameter': hog['p']['db'], 'area': hog['p']['Ap'], 'fpb': None, 'Ep': hog['p']['Ep'], 'relaxation': round(hog['p']['rel'] * 100, 3)}, 'Assumed', note='Hog workbook template strand data', replace_with='girder drawings / specification')]},
    'reinforcement': {'rows': [row({'grade': 'D500N', 'fsy': sec['fsy'], 'Es': sec['Es']}, 'Standard-verify', ref='std:AS4671/D500N')]},
}
# ---------------- loads ----------------
WD, TM, TGr, EQ, RX = S['WD'], S['TM'], S['TG'], S['EQ'], S['RX']
def irow(item, value, unit, tag='Assumed', **kw): return row({'item': item, 'value': value, 'unit': unit}, tag, decision=kw.pop('decision', D_STATE), replace_with=kw.pop('replace_with', 'site / project data'), **kw)
def prof(txt): return [tuple(float(x) for x in p.split(':')) for p in txt.split(',') if ':' in p]
B['loads'] = {
    'traffic_models': {'rows': [row({'model': 'M1600', 'on': True}, 'Standard-verify', ref='std:AS5100.2-2017/7.2.4'), row({'model': 'S1600', 'on': True}, 'Standard-verify', ref='std:AS5100.2-2017/7.2.5')]},
    'design_speed': V(S['SL']['V'], 'km/h', 'Assumed', note='design speed not in this set', decision=D_STATE, replace='road design criteria'),
    'braking_force': V(S['SL']['Fbr'], 'kN', 'Assumed', note='to be calculated to AS 5100.2 Cl 7.8.2', decision=D_STATE, replace='AS 5100.2 Cl 7.8.2 calculation'),
    'traffic_surcharge': V(S['SL']['q'], 'kPa', 'Assumed', note='AS 5100.2 value to set', decision=D_STATE, replace='AS 5100.2 earth pressure from traffic'),
    'pedestrian': V(None, None, 'Missing-Flagged', note='Footway not confirmed; pedestrian load still ticked in the Combos tab and taken as zero'),
    'wind': {'rows': [irow('V_uls', WD['V'], 'm/s'), irow('V_sls', RX['Vs'], 'm/s'), irow('V_with_traffic', RX['V35'], 'm/s', tag='Standard-verify', ref='std:AS5100.2-2017/23.3/wind-with-traffic'),
                      irow('air_density', WD['rho'], 'kg/m3', tag='Standard-verify', ref='std:AS1170.2/air-density'), irow('Cd', WD['Cd'], '-'), irow('CL', WD['CL'], '-'), irow('vertical_eccentricity_b', WD['eL'], '-'),
                      irow('longitudinal_fraction', WD['fLon'], '-'), irow('vehicle_line_load', WD['wVeh'], 'kN/m'), irow('vehicle_height', WD['hVeh'], 'm')]},
    'temperature': {'rows': [irow('T_max', TM['Tmax'], 'C'), irow('T_min', TM['Tmin'], 'C'), irow('T_set', TM['Tset'], 'C'), irow('alpha', TM['alpha'], '1/C', replace_with='AS 5100.5 / aggregate data')]},
    'gradient_positive': {'rows': [row({'depth': a, 'dT': b}, 'Assumed', note='T = %s·((1200 − d)/1200)^5 shape' % TGr['T0'], decision=D_STATE, replace_with='AS 5100.2 Cl 18.3 profile') for a, b in prof(S['temp']['pos'])]},
    'gradient_negative': {'rows': [row({'depth': a, 'dT': b}, 'Assumed', note='−%s × positive shape' % TGr['negF'], decision=D_STATE, replace_with='AS 5100.2 Cl 18.3 profile') for a, b in prof(S['temp']['neg'])]},
    'shrinkage_creep_shortening': V(TGr['eps'], '1e-6', 'Assumed', note='long-term shortening after the bearings are set', decision=D_STATE, replace='Hog time analysis + creep'),
    'earthquake': {'rows': [row({'item': k, 'value': str(v)}, 'Assumed' if k not in ('Z', 'zeta') else 'Standard-verify', **({'ref': 'std:AS1170.4/' + k} if k in ('Z', 'zeta') else {'note': 'placeholder', 'decision': D_STATE, 'replace_with': 'project seismic criteria / geotechnical report'}))
                            for k, v in (('kp', EQ['kp']), ('Z', EQ['Z']), ('site_class', EQ['site']), ('Rf', EQ['Rf']), ('zeta', EQ['zeta']), ('vertical', EQ['vert']))]},
    'flood': V(None, None, 'Missing-Flagged', note='Not addressed'),
    'collision': V(None, None, 'Missing-Flagged', note='Not addressed'),
}
# ---------------- combinations / analysis / design ----------------
D_CB = dec('combinations.register', 'SOo and SCR switched on', 'Input-user', 'Earth pressure (soil – other fills) and shrinkage + creep added as permanent actions for the combined actions (v42/v44), on the engineer request to proceed', by='AI', affects=['combinations'])
B['combinations'] = {
    'standard': V('std:AS5100.2-2017/combinations', None, 'Standard-verify', ref='std:AS5100.2-2017/23'),
    'register': {'rows': [row({'case': r['id'], 'on': bool(r['on']), 'uls': r['u'], 'beneficial': r['b'], 'sls': r['s']}, 'Standard-verify', ref='std:AS5100.2-2017/register/' + r['id'], **({'decision': D_CB} if r['id'] in ('SOo', 'SCR') else {})) for r in S['CB']]},
    'settings': {'rows': [row({'item': k, 'value': json.dumps(v)}, 'Model', note='Combos tab setting') for k, v in S['cbopt'].items()]},
}
B['analysis'] = {
    'grillage': {'rows': [row({'item': k, 'value': str(P[k])}, 'Model' if META[k][2] == 'M' else 'Confirmed-Engineer', **({'note': META[k][0]} if META[k][2] == 'M' else {'decision': dec('P.' + k, P[k], 'Confirmed-Engineer', 'Grillage setting "' + META[k][0] + '" confirmed by the engineer (migrated)')})) for k in ('tgt', 'merge', 'midgap', 'model')]},
    'bearing_fixed_stiffness': V(SB['kFix'], 'kN/m', 'Model', note='rigid idealisation'),
    'pile_toe': V('vertical only' if SB['toe'] == 'pinz' else 'fixed', None, 'Model', note='rock socket carries lateral load through springs'),
    'column_segment': V(1.0, 'm', 'Model', note='columns split at soil levels and to about 1 m'),
    'soil_factor': V(SB['fac'], None, 'Model', note='sensitivity factor on soil / rock stiffness'),
    'modes': V(EQ['nModes'], None, 'Model', note='response spectrum; missing mass added as a static residual'),
}
B['design'] = {
    'girder_options': {'rows': [row({'item': k, 'value': json.dumps(v)}, 'Model', note='design option') for k, v in S['DGopt'].items()]},
    'stations': {'rows': [row({'name': l['name'], 'rule': l['pos'], 's': l['s']}, 'Model', note='load-case station rule') for l in S['DGlc']]},
}
# ---------------- custom: every takeoff row, every dashboard parameter (nothing lost) ----------------
def takeoff(rows, name):
    out = []
    for r in rows:
        if r[4] is None and r[5] is None: continue
        for ab, i in (('A', 5), ('B', 8)):
            tg = r[i + 1]
            if tg is None and r[i] is None: continue
            tag = TAGMAP.get(tg, 'Missing-Flagged' if tg else 'Calculated')
            kw = {}
            if tag == 'Confirmed-Engineer': kw['decision'] = dec('custom.%s row %s %s' % (name, r[0], ab), r[i], tag, (r[i + 2] or 'confirmed by the engineer')[:300])
            if tag == 'Direct': kw.update(doc=doc_of(r[i + 2], r[11]), view=(r[11] or '')[:120])
            if tag == 'Calculated': kw.update(formula=(r[i + 2] or 'see takeoff')[:300])
            if tag == 'Missing-Flagged' and r[i + 2]: kw['note'] = r[i + 2][:600]
            out.append(row({'row': r[0], 'group': r[1], 'item': r[2], 'symbol': r[3], 'unit': r[4], 'support': ab, 'value': r[i]}, tag, **kw))
    return {'section': 'supports', 'columns': {'row': '', 'group': '', 'item': '', 'symbol': '', 'unit': '', 'support': '', 'value': ''}, 'rows': out,
            'note': 'Every row of the BR13A takeoff workbook tab, both supports, with its tag and note (migrated from the dashboard DATA).'}
B['custom'] = {
    'takeoff_abutments': takeoff(ABT, 'takeoff_abutments'),
    'takeoff_piles': takeoff(PIL, 'takeoff_piles'),
    'dashboard_parameters': {'section': 'alignment', 'columns': {'key': '', 'label': '', 'unit': '', 'value': ''},
                             'rows': [row({'key': k, 'label': META[k][0], 'unit': META[k][1], 'value': P[k]}, METATAG[META[k][2]] if METATAG[META[k][2]] not in ('Confirmed-Engineer', 'Standard-verify') else 'Model',
                                          **({'doc': 'GA-Rev02', 'view': 'dashboard parameter'} if META[k][2] == 'D' else {'formula': META[k][0]} if META[k][2] == 'C' else {'note': META[k][0] + (' (confirmed by the engineer)' if META[k][2] == 'E' else '')})) for k in P if k in META]},
}
B['documents'] = sorted(DOCS.values(), key=lambda d: d['id'])
json.dump(B, open(os.path.join(HERE, 'BR13A.bridge.json'), 'w'), indent=1, ensure_ascii=False)
with open(os.path.join(HERE, 'BR13A.decisions.jsonl'), 'w') as f:
    for e in DEC: f.write(json.dumps(e, ensure_ascii=False) + '\n')
print('bridge file and %d decisions written' % len(DEC))
