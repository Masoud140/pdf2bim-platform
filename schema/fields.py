"""Bridge description format — field catalogue (single source).

`python schema/build_schema.py` turns this catalogue into
  schema/bridge.schema.json      (JSON Schema, draft 2020-12)
  docs/BRIDGE_FIELDS.md          (field table for review)

Leaf = (kind, unit, description[, options])
  kind: num | int | str | bool | enum | ref | table
  - every leaf is stored as a tagged Value object (see VALUE in build_schema.py), never a bare number
  - enum: options = list of allowed values
  - ref: a key into the product library (lib:...) or the standards file (std:...)
  - table: options = {column: (kind, unit)}; rows carry their own tag / source / status
Group = dict of fields; List = ('list', group, description) — any number of items, each with an `id`.

Nothing here is bridge-specific: counts, lists and types are data. Super-T and plank have their own groups;
a bridge fills the one that matches superstructure.type.
"""

PROJECT = {
    'name': ('str', '', 'Project name'),
    'bridge_id': ('str', '', 'Bridge / structure number on the drawings'),
    'client': ('str', '', 'Asset owner / client'),
    'location': ('str', '', 'Road, locality'),
    'designer': ('str', '', 'Design organisation on the title block'),
    'drawing_set': ('str', '', 'Drawing set / package number'),
    'revision': ('str', '', 'Revision of the drawing set used'),
    'status': ('str', '', 'Drawing status (preliminary, for construction ...)'),
    'datum_horizontal': ('str', '', 'Horizontal datum / grid (e.g. MGA56)'),
    'datum_vertical': ('str', '', 'Vertical datum (e.g. AHD)'),
    'base_point': ('table', '', 'Documented fixed project base point, if any (no arbitrary local origin)',
                   {'name': ('str', ''), 'E': ('num', 'm'), 'N': ('num', 'm'), 'RL': ('num', 'm')}),
    'design_life': ('num', 'years', 'Design life'),
    'importance_level': ('int', '', 'Bridge importance level (AS 5100.2)'),
}

ALIGNMENT = {
    'control_line': ('str', '', 'Name of the control line the chainages refer to'),
    'horizontal': ('table', '', 'Horizontal alignment elements in order',
                   {'element': ('enum', ''), 'ch_start': ('num', 'm'), 'length': ('num', 'm'), 'radius': ('num', 'm'),
                    'direction': ('enum', ''), 'E_start': ('num', 'm'), 'N_start': ('num', 'm'), 'bearing_start': ('str', 'DMS')}),
    'vertical': ('table', '', 'Vertical alignment: intersection points and curves',
                 {'ch': ('num', 'm'), 'RL': ('num', 'm'), 'grade_in': ('num', '%'), 'grade_out': ('num', '%'), 'curve_length': ('num', 'm')}),
    'crossfall': ('table', '', 'Crossfall / superelevation along the bridge',
                  {'ch': ('num', 'm'), 'left': ('num', '%'), 'right': ('num', '%'), 'crown_offset': ('num', 'm')}),
    'support_lines': ('table', '', 'Support (bearing) lines: chainage and skew — the alignment & skew diagram sheet governs',
                      {'support': ('str', ''), 'ch': ('num', 'm'), 'skew': ('num', 'deg'), 'skew_dms': ('str', 'DMS')}),
}

DECK = {
    'edge_left': ('num', 'm', 'Deck edge offset from the control line, left (−)'),
    'edge_right': ('num', 'm', 'Deck edge offset from the control line, right (+)'),
    'carriageway_left': ('num', 'm', 'Barrier face / carriageway edge, left'),
    'carriageway_right': ('num', 'm', 'Barrier face / carriageway edge, right'),
    'slab_thickness': ('num', 'mm', 'Cast-in-situ deck slab / topping thickness'),
    'surfacing_thickness': ('num', 'mm', 'Design surfacing thickness'),
    'surfacing_density': ('num', 'kN/m3', 'Surfacing unit weight'),
    'girders_follow_crossfall': ('bool', '', 'Girders rotated to the crossfall (true) or upright'),
    'end_gap': ('num', 'mm', 'Deck end to curtain / ballast wall gap'),
    'footway': ('table', '', 'Footways / shared paths (none = empty table)',
                {'side': ('enum', ''), 'width': ('num', 'm'), 'kerb_height': ('num', 'mm')}),
    'barriers': ('list', {
        'side': ('enum', '', 'left | right | median', ['left', 'right', 'median']),
        'type': ('str', '', 'Barrier type / product (drawing reference)'),
        'height': ('num', 'mm', 'Height above the deck surface'),
        'weight': ('num', 'kN/m', 'Self weight per metre'),
        'offset': ('num', 'm', 'Line of the barrier centroid from the control line'),
        'solid': ('bool', '', 'Solid face (for wind exposed depth)'),
    }, 'Traffic / pedestrian barriers'),
    'diaphragms': ('list', {
        'location': ('enum', '', 'end | intermediate', ['end', 'intermediate']),
        'support': ('str', '', 'Support id for end diaphragms'),
        'ch': ('num', 'm', 'Chainage for intermediate diaphragms'),
        'width': ('num', 'mm', 'Width along the girder'),
        'depth': ('num', 'mm', 'Depth'),
    }, 'Cross girders / diaphragms'),
    'other_sdl': ('num', 'kPa', 'Other superimposed dead load over the deck (services, etc.)'),
}

SUPERT = {
    'section': ('ref', '', 'Product section (lib:supert/...)'),
    'depth': ('num', 'mm', 'Girder depth'),
    'top_flange_width': ('num', 'mm', 'Top flange width (if trimmed from the product)'),
    'concrete_transfer': ('num', 'MPa', "f'cp at transfer"),
    'concrete_28d': ('num', 'MPa', "f'c girder"),
    'strand_pattern': ('table', '', 'Strands: one row per strand position',
                       {'y': ('num', 'mm'), 'x': ('num', 'mm'), 'diameter': ('num', 'mm'), 'debond_left': ('num', 'mm'), 'debond_right': ('num', 'mm'), 'on': ('bool', '')}),
    'jacking_ratio': ('num', '', 'Jacking stress / f_pb'),
    'bars': ('table', '', 'Longitudinal reinforcement in the girder',
             {'y': ('num', 'mm'), 'diameter': ('num', 'mm'), 'number': ('int', ''), 'from': ('num', 'm'), 'to': ('num', 'm')}),
    'fitments': ('table', '', 'Shear / torsion fitments along the girder',
                 {'from': ('num', 'm'), 'to': ('num', 'm'), 'diameter': ('num', 'mm'), 'legs': ('int', ''), 'spacing': ('num', 'mm')}),
    'zones': ('table', '', 'Solid end blocks / open section along the girder',
              {'from': ('num', 'm'), 'to': ('num', 'm'), 'kind': ('enum', '')}),
    'deck_bars': ('table', '', 'Deck longitudinal reinforcement acting with the girder',
                  {'face': ('enum', ''), 'diameter': ('num', 'mm'), 'spacing': ('num', 'mm'), 'cover': ('num', 'mm')}),
    'transfer_supports': ('num', 'mm', 'Support distance from the girder end at transfer / storage'),
    'age_at_transfer': ('num', 'days', 'Age at transfer'),
    'age_at_erection': ('num', 'days', 'Age when placed on the bearings'),
    'age_deck_cast': ('num', 'days', 'Age when the deck is cast'),
}

PLANK = {
    'section': ('ref', '', 'Product section (lib:plank/...)'),
    'width': ('num', 'mm', 'Plank width'),
    'depth': ('num', 'mm', 'Plank depth'),
    'voids': ('table', '', 'Voids in the plank', {'shape': ('enum', ''), 'x': ('num', 'mm'), 'y': ('num', 'mm'), 'size': ('num', 'mm'), 'from': ('num', 'm'), 'to': ('num', 'm')}),
    'shear_key': ('ref', '', 'Shear key detail'),
    'topping': ('bool', '', 'Structural topping present (deck.slab_thickness applies)'),
    'transverse_stressing': ('table', '', 'Transverse stressing bars / strands',
                             {'type': ('str', ''), 'diameter': ('num', 'mm'), 'spacing': ('num', 'm'), 'force': ('num', 'kN'), 'y': ('num', 'mm')}),
    'concrete_transfer': ('num', 'MPa', "f'cp at transfer"),
    'concrete_28d': ('num', 'MPa', "f'c plank"),
    'strand_pattern': ('table', '', 'Strands', {'y': ('num', 'mm'), 'x': ('num', 'mm'), 'diameter': ('num', 'mm'), 'debond_left': ('num', 'mm'), 'debond_right': ('num', 'mm'), 'on': ('bool', '')}),
    'bars': ('table', '', 'Longitudinal reinforcement', {'y': ('num', 'mm'), 'diameter': ('num', 'mm'), 'number': ('int', '')}),
    'fitments': ('table', '', 'Fitments', {'from': ('num', 'm'), 'to': ('num', 'm'), 'diameter': ('num', 'mm'), 'legs': ('int', ''), 'spacing': ('num', 'mm')}),
}

SUPERSTRUCTURE = {
    'type': ('enum', '', 'Superstructure type', ['super-t', 'plank']),
    'spans': ('int', '', 'Number of spans (the platform covers 1)'),
    'members': ('list', {
        'line_offset_A': ('num', 'm', 'Girder / plank centreline offset at support A bearing line (from the control line, square)'),
        'line_offset_B': ('num', 'm', 'Offset at support B'),
        'straight': ('bool', '', 'Straight between bearings (true) or following the control line'),
        'length': ('num', 'm', 'Overall precast length'),
        'bearing_offset_A': ('num', 'mm', 'Bearing centre from the girder end at A'),
        'bearing_offset_B': ('num', 'mm', 'Bearing centre from the girder end at B'),
        'type_ref': ('str', '', 'Which girder type definition applies (id in supert_types / plank_types)'),
        'flange_edges': ('table', '', 'Precast top flange edges from the member centreline along its length (t = 0 at bearing A, 1 at bearing B)',
                         {'t': ('num', ''), 'left': ('num', 'mm'), 'right': ('num', 'mm'), 'deck_width': ('num', 'mm')}),
        'deck_width_override': ('table', '', 'Width of deck acting with this member, overrides along its length',
                                {'t': ('num', ''), 'width': ('num', 'mm')}),
    }, 'Girders or planks, ordered across the deck'),
    'flange_gap': ('num', 'mm', 'Gap between adjacent precast top flanges'),
    'edge_flange_setback': ('num', 'mm', 'Outer flange edge of an edge member: setback from the deck edge (0 = lines up with the deck edge)'),
    'supert_types': ('list', SUPERT, 'Super-T girder definitions (members refer to them)'),
    'plank_types': ('list', PLANK, 'Plank definitions'),
}

BEARINGS = {
    'items': ('list', {
        'support': ('str', '', 'Support id'),
        'member': ('str', '', 'Member id it carries'),
        'type': ('enum', '', 'Bearing type', ['elastomeric', 'pot', 'spherical', 'other']),
        'plan_a': ('num', 'mm', 'Plan dimension along the girder'),
        'plan_b': ('num', 'mm', 'Plan dimension across'),
        'elastomer_thickness': ('num', 'mm', 'Total elastomer thickness'),
        'shear_modulus': ('num', 'MPa', 'Elastomer G'),
        'restraint_longitudinal': ('enum', '', 'fixed | free | elastic', ['fixed', 'free', 'elastic']),
        'restraint_transverse': ('enum', '', 'fixed | free | elastic', ['fixed', 'free', 'elastic']),
        'height': ('num', 'mm', 'Bearing + plinth height (headstock top to girder soffit)'),
    }, 'Every bearing'),
}

SUPPORT = {
    'kind': ('enum', '', 'Support type', ['spill-through abutment', 'wall abutment', 'integral abutment', 'pier']),
    'headstock': ('table', '', 'Headstock / sill beam', {'width': ('num', 'mm'), 'depth': ('num', 'mm'), 'length': ('num', 'm'), 'rl_top': ('num', 'm'), 'rl_soffit': ('num', 'm')}),
    'curtain_wall': ('table', '', 'Curtain / ballast wall', {'thickness': ('num', 'mm'), 'height': ('num', 'mm')}),
    'wingwalls': ('table', '', 'Wingwalls', {'side': ('enum', ''), 'length': ('num', 'm'), 'thickness': ('num', 'mm')}),
    'piles': ('list', {
        'E': ('num', 'm', 'Pile centre easting (project grid)'),
        'N': ('num', 'm', 'Pile centre northing'),
        'diameter': ('num', 'mm', 'Pile diameter'),
        'rl_top': ('num', 'm', 'Cut-off level / column top'),
        'rl_rock': ('num', 'm', 'Top of rock socket (RL B)'),
        'rl_toe': ('num', 'm', 'Founding level (RL A)'),
        'ground_rl': ('num', 'm', 'Ground / fill level at the pile'),
        'design_actions': ('table', '', 'Pile design actions listed on the drawings', {'limit_state': ('enum', ''), 'N': ('num', 'kN'), 'M': ('num', 'kNm'), 'V': ('num', 'kN')}),
    }, 'Piles / columns'),
    'soil_layers': ('table', '', 'Soil profile at the support (top RL of each layer)',
                    {'name': ('str', ''), 'rl_top': ('num', 'm'), 'kh': ('num', 'MN/m3'), 'gamma': ('num', 'kN/m3'), 'phi': ('num', 'deg')}),
    'rock_kh': ('num', 'MN/m3', 'Lateral modulus of the rock socket'),
    'backfill': ('table', '', 'Fill retained by the headstock', {'gamma': ('num', 'kN/m3'), 'phi': ('num', 'deg'), 'K': ('enum', ''), 'retained_height': ('num', 'm')}),
}

MATERIALS = {
    'concrete': ('table', '', 'Concrete by element', {'element': ('str', ''), 'fc': ('num', 'MPa'), 'E': ('num', 'MPa'), 'density': ('num', 'kN/m3'), 'alpha': ('num', '1e-6/C')}),
    'strand': ('table', '', 'Prestressing strand', {'type': ('str', ''), 'diameter': ('num', 'mm'), 'area': ('num', 'mm2'), 'fpb': ('num', 'MPa'), 'Ep': ('num', 'MPa'), 'relaxation': ('num', '%')}),
    'reinforcement': ('table', '', 'Reinforcing steel', {'grade': ('str', ''), 'fsy': ('num', 'MPa'), 'Es': ('num', 'MPa')}),
}

LOADS = {
    'traffic_models': ('table', '', 'Traffic load models applied', {'model': ('enum', ''), 'on': ('bool', '')}),
    'design_speed': ('num', 'km/h', 'Design speed (centrifugal)'),
    'braking_force': ('num', 'kN', 'Braking force on the bridge'),
    'traffic_surcharge': ('num', 'kPa', 'Earth pressure from traffic surcharge'),
    'pedestrian': ('bool', '', 'Pedestrian load applies'),
    'wind': ('table', '', 'Wind inputs', {'item': ('str', ''), 'value': ('num', ''), 'unit': ('str', '')}),
    'temperature': ('table', '', 'Uniform temperature inputs', {'item': ('str', ''), 'value': ('num', ''), 'unit': ('str', '')}),
    'gradient_positive': ('table', '', 'Temperature gradient, top hot', {'depth': ('num', 'mm'), 'dT': ('num', 'C')}),
    'gradient_negative': ('table', '', 'Temperature gradient, top cold', {'depth': ('num', 'mm'), 'dT': ('num', 'C')}),
    'shrinkage_creep_shortening': ('num', '1e-6', 'Long-term shortening after the bearings are set'),
    'earthquake': ('table', '', 'Earthquake inputs', {'item': ('str', ''), 'value': ('str', '')}),
    'flood': ('bool', '', 'Water flow loads apply'),
    'collision': ('bool', '', 'Collision on supports applies'),
}

COMBINATIONS = {
    'standard': ('ref', '', 'Combination rules (std:AS5100.2-2017/...)'),
    'register': ('table', '', 'Load-case register overrides: on/off and factors', {'case': ('str', ''), 'on': ('bool', ''), 'uls': ('num', ''), 'beneficial': ('num', ''), 'sls': ('num', '')}),
    'settings': ('table', '', 'Generator settings (lanes, k1, k2, wind directions ...)', {'item': ('str', ''), 'value': ('str', '')}),
}

ANALYSIS = {
    'grillage': ('table', '', 'Grillage modelling choices', {'item': ('str', ''), 'value': ('str', '')}),
    'bearing_fixed_stiffness': ('num', 'kN/m', 'Stiffness used for a fixed bearing direction'),
    'pile_toe': ('enum', '', 'Pile toe support', ['vertical only', 'fixed']),
    'column_segment': ('num', 'm', 'Maximum column / pile element length'),
    'soil_factor': ('num', '', 'Soil / rock stiffness factor (sensitivity run)'),
    'modes': ('int', '', 'Number of modes for the response spectrum'),
}

DESIGN = {
    'girder_options': ('table', '', 'Super-T / plank design options', {'item': ('str', ''), 'value': ('str', '')}),
    'stations': ('table', '', 'Design stations / load-case positions', {'name': ('str', ''), 'rule': ('enum', ''), 's': ('num', 'm')}),
}

# Project-specific items: every bridge is different. Anything the catalogue does not have goes here as a named
# tagged value or table (same tag rules), so nothing is lost and the catalogue can grow from what projects actually use.
CUSTOM_NOTE = 'Project-specific items not in the catalogue: name -> tagged value or table (same tag rules)'

SECTIONS = {
    'project': PROJECT, 'alignment': ALIGNMENT, 'deck': DECK, 'superstructure': SUPERSTRUCTURE, 'bearings': BEARINGS,
    'supports': ('list', SUPPORT, 'Supports (abutments A and B for a single span), id = support id used on the support lines'),
    'materials': MATERIALS, 'loads': LOADS, 'combinations': COMBINATIONS, 'analysis': ANALYSIS, 'design': DESIGN,
}
