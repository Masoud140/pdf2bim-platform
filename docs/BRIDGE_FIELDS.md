# Bridge description — field catalogue (pdf2bim.bridge/0.1)

Generated from `schema/fields.py` by `python schema/build_schema.py` — edit the catalogue, not this file.

Every field is a tagged value (value, unit, tag, source / derivation / ref, status). Tables carry a tag per row. Lists have any number of items.


## project

| Field | Kind | Unit | Description |
|---|---|---|---|
| `project.name` | str |  | Project name |
| `project.bridge_id` | str |  | Bridge / structure number on the drawings |
| `project.client` | str |  | Asset owner / client |
| `project.location` | str |  | Road, locality |
| `project.designer` | str |  | Design organisation on the title block |
| `project.drawing_set` | str |  | Drawing set / package number |
| `project.revision` | str |  | Revision of the drawing set used |
| `project.status` | str |  | Drawing status (preliminary, for construction ...) |
| `project.datum_horizontal` | str |  | Horizontal datum / grid (e.g. MGA56) |
| `project.datum_vertical` | str |  | Vertical datum (e.g. AHD) |
| `project.base_point` | table |  | Documented fixed project base point, if any (no arbitrary local origin) — columns: name, E (m), N (m), RL (m) |
| `project.design_life` | num | years | Design life |
| `project.importance_level` | int |  | Bridge importance level (AS 5100.2) |

## alignment

| Field | Kind | Unit | Description |
|---|---|---|---|
| `alignment.control_line` | str |  | Name of the control line the chainages refer to |
| `alignment.horizontal` | table |  | Horizontal alignment elements in order — columns: element, ch_start (m), length (m), radius (m), direction, E_start (m), N_start (m), bearing_start (DMS) |
| `alignment.vertical` | table |  | Vertical alignment: intersection points and curves — columns: ch (m), RL (m), grade_in (%), grade_out (%), curve_length (m) |
| `alignment.crossfall` | table |  | Crossfall / superelevation along the bridge — columns: ch (m), left (%), right (%), crown_offset (m) |
| `alignment.support_lines` | table |  | Support (bearing) lines: chainage and skew — the alignment & skew diagram sheet governs. The support line is straight through the control line at ch. Its direction is the whole-circle bearing (preferred, as printed on the skew diagram); skew alone does not fix the direction (no sign convention on drawings) — columns: support, ch (m), skew (deg), skew_dms (DMS), bearing (deg) |

## deck

| Field | Kind | Unit | Description |
|---|---|---|---|
| `deck.edge_left` | num | m | Deck edge offset from the control line, left (−) |
| `deck.edge_right` | num | m | Deck edge offset from the control line, right (+) |
| `deck.carriageway_left` | num | m | Barrier face / carriageway edge, left |
| `deck.carriageway_right` | num | m | Barrier face / carriageway edge, right |
| `deck.slab_thickness` | num | mm | Cast-in-situ deck slab / topping thickness |
| `deck.surfacing_thickness` | num | mm | Design surfacing thickness |
| `deck.surfacing_density` | num | kN/m3 | Surfacing unit weight |
| `deck.girders_follow_crossfall` | bool |  | Girders rotated to the crossfall (true) or upright |
| `deck.end_gap` | num | mm | Deck end to curtain / ballast wall gap |
| `deck.footway` | table |  | Footways / shared paths (none = empty table) — columns: side, width (m), kerb_height (mm) |
| `deck.barriers[]` | list | | Traffic / pedestrian barriers (fields below) |
| `deck.diaphragms[]` | list | | Cross girders / diaphragms (fields below) |
| `deck.other_sdl` | num | kPa | Other superimposed dead load over the deck (services, etc.) |

#### `deck.barriers[]` — each item has an `id` plus:

| Field | Kind | Unit | Description |
|---|---|---|---|
| `deck.barriers[].side` | enum |  | left / right / median — one of: left, right, median |
| `deck.barriers[].type` | str |  | Barrier type / product (drawing reference) |
| `deck.barriers[].height` | num | mm | Height above the deck surface |
| `deck.barriers[].weight` | num | kN/m | Self weight per metre |
| `deck.barriers[].offset` | num | m | Line of the barrier centroid from the control line |
| `deck.barriers[].solid` | bool |  | Solid face (for wind exposed depth) |

#### `deck.diaphragms[]` — each item has an `id` plus:

| Field | Kind | Unit | Description |
|---|---|---|---|
| `deck.diaphragms[].location` | enum |  | end / intermediate — one of: end, intermediate |
| `deck.diaphragms[].support` | str |  | Support id for end diaphragms |
| `deck.diaphragms[].ch` | num | m | Chainage for intermediate diaphragms |
| `deck.diaphragms[].width` | num | mm | Width along the girder |
| `deck.diaphragms[].depth` | num | mm | Depth |

## superstructure

| Field | Kind | Unit | Description |
|---|---|---|---|
| `superstructure.type` | enum |  | Superstructure type — one of: super-t, plank |
| `superstructure.spans` | int |  | Number of spans (the platform covers 1) |
| `superstructure.members[]` | list | | Girders or planks, ordered across the deck (fields below) |
| `superstructure.flange_gap` | num | mm | Gap between adjacent precast top flanges |
| `superstructure.edge_flange_setback` | num | mm | Outer flange edge of an edge member: setback from the deck edge (0 = lines up with the deck edge) |
| `superstructure.cross_girders` | table |  | Cast-in-place cross girders / end diaphragms on the support lines (plan width normal to the skewed face, overall depth) — columns: support, width (mm), depth (mm), concrete |
| `superstructure.supert_types[]` | list | | Super-T girder definitions (members refer to them) (fields below) |
| `superstructure.plank_types[]` | list | | Plank definitions (fields below) |

#### `superstructure.members[]` — each item has an `id` plus:

| Field | Kind | Unit | Description |
|---|---|---|---|
| `superstructure.members[].line_offset_A` | num | m | Girder / plank centreline offset at support A bearing line (from the control line, square) |
| `superstructure.members[].line_offset_B` | num | m | Offset at support B |
| `superstructure.members[].straight` | bool |  | Straight between bearings (true) or following the control line |
| `superstructure.members[].length` | num | m | Overall precast length |
| `superstructure.members[].bearing_offset_A` | num | mm | Bearing centre from the girder end at A |
| `superstructure.members[].bearing_offset_B` | num | mm | Bearing centre from the girder end at B |
| `superstructure.members[].type_ref` | str |  | Which girder type definition applies (id in supert_types / plank_types) |
| `superstructure.members[].flange_edges` | table |  | Precast top flange edges from the member centreline along its length (t = 0 at bearing A, 1 at bearing B) — columns: t, left (mm), right (mm), deck_width (mm) |
| `superstructure.members[].deck_width_override` | table |  | Width of deck acting with this member, overrides along its length — columns: t, width (mm) |

#### `superstructure.supert_types[]` — each item has an `id` plus:

| Field | Kind | Unit | Description |
|---|---|---|---|
| `superstructure.supert_types[].section` | ref |  | Product section (lib:supert/...) |
| `superstructure.supert_types[].depth` | num | mm | Girder depth |
| `superstructure.supert_types[].top_flange_width` | num | mm | Top flange width (if trimmed from the product) |
| `superstructure.supert_types[].shape` | table |  | Super-T shape parameters as dimensioned on the girder drawing (keys as in library/products/supert.json: D, bw, tw, d1, d2, ttf, S, fW, fD, r, ifW, ifD, ch); they override the product type — columns: key, name, value, unit |
| `superstructure.supert_types[].haunch` | num | mm | Gap between the girder top flange and the deck soffit |
| `superstructure.supert_types[].concrete_transfer` | num | MPa | f'cp at transfer |
| `superstructure.supert_types[].concrete_28d` | num | MPa | f'c girder |
| `superstructure.supert_types[].strand_pattern` | table |  | Strands: one row per strand position — columns: y (mm), x (mm), diameter (mm), debond_left (mm), debond_right (mm), on |
| `superstructure.supert_types[].jacking_ratio` | num |  | Jacking stress / f_pb |
| `superstructure.supert_types[].bars` | table |  | Longitudinal reinforcement in the girder — columns: y (mm), diameter (mm), number, from (m), to (m) |
| `superstructure.supert_types[].fitments` | table |  | Shear / torsion fitments along the girder — columns: from (m), to (m), diameter (mm), legs, spacing (mm) |
| `superstructure.supert_types[].zones` | table |  | Solid end blocks / open section along the girder. kind = solid_end_A / solid_end_B (from / to measured from that girder end) or solid / open (from / to measured from end A) — columns: from (m), to (m), kind |
| `superstructure.supert_types[].deck_bars` | table |  | Deck longitudinal reinforcement acting with the girder — columns: face, diameter (mm), spacing (mm), cover (mm) |
| `superstructure.supert_types[].transfer_supports` | num | mm | Support distance from the girder end at transfer / storage |
| `superstructure.supert_types[].age_at_transfer` | num | days | Age at transfer |
| `superstructure.supert_types[].age_at_erection` | num | days | Age when placed on the bearings |
| `superstructure.supert_types[].age_deck_cast` | num | days | Age when the deck is cast |

#### `superstructure.plank_types[]` — each item has an `id` plus:

| Field | Kind | Unit | Description |
|---|---|---|---|
| `superstructure.plank_types[].section` | ref |  | Product section (lib:plank/...) |
| `superstructure.plank_types[].width` | num | mm | Plank width |
| `superstructure.plank_types[].depth` | num | mm | Plank depth |
| `superstructure.plank_types[].voids` | table |  | Voids in the plank — columns: shape, x (mm), y (mm), size (mm), from (m), to (m) |
| `superstructure.plank_types[].shear_key` | ref |  | Shear key detail |
| `superstructure.plank_types[].topping` | bool |  | Structural topping present (deck.slab_thickness applies) |
| `superstructure.plank_types[].transverse_stressing` | table |  | Transverse stressing bars / strands — columns: type, diameter (mm), spacing (m), force (kN), y (mm) |
| `superstructure.plank_types[].concrete_transfer` | num | MPa | f'cp at transfer |
| `superstructure.plank_types[].concrete_28d` | num | MPa | f'c plank |
| `superstructure.plank_types[].strand_pattern` | table |  | Strands — columns: y (mm), x (mm), diameter (mm), debond_left (mm), debond_right (mm), on |
| `superstructure.plank_types[].bars` | table |  | Longitudinal reinforcement — columns: y (mm), diameter (mm), number |
| `superstructure.plank_types[].fitments` | table |  | Fitments — columns: from (m), to (m), diameter (mm), legs, spacing (mm) |

## bearings

| Field | Kind | Unit | Description |
|---|---|---|---|
| `bearings.items[]` | list | | Every bearing (fields below) |

#### `bearings.items[]` — each item has an `id` plus:

| Field | Kind | Unit | Description |
|---|---|---|---|
| `bearings.items[].support` | str |  | Support id |
| `bearings.items[].member` | str |  | Member id it carries |
| `bearings.items[].type` | enum |  | Bearing type — one of: elastomeric, pot, spherical, other |
| `bearings.items[].plan_a` | num | mm | Plan dimension along the girder |
| `bearings.items[].plan_b` | num | mm | Plan dimension across |
| `bearings.items[].elastomer_thickness` | num | mm | Total elastomer thickness |
| `bearings.items[].shear_modulus` | num | MPa | Elastomer G |
| `bearings.items[].restraint_longitudinal` | enum |  | fixed / free / elastic — one of: fixed, free, elastic |
| `bearings.items[].restraint_transverse` | enum |  | fixed / free / elastic — one of: fixed, free, elastic |
| `bearings.items[].height` | num | mm | Bearing + plinth height (headstock top to girder soffit) |
| `bearings.items[].seat_rl` | num | m | Bearing seat RL (top of mortar pad / plinth, underside of the bearing) |
| `bearings.items[].top_rl` | num | m | Top-of-bearing RL (e.g. a bearing schedule RL X labelled top of bearing); with the bearing height it gives the seat when seat_rl is not given |
| `bearings.items[].bearing_height` | num | mm | Bearing unit height (elastomer, shims and cover layers), top of bearing to its underside |
| `bearings.items[].layer_thickness` | num | mm | Thickness of one internal elastomer layer (sets the shape factor and the compression stiffness) |

## supports[] — Supports (abutments A and B for a single span), id = support id used on the support lines

| Field | Kind | Unit | Description |
|---|---|---|---|
| `supports[].kind` | enum |  | Support type — one of: spill-through abutment, wall abutment, integral abutment, pier |
| `supports[].headstock` | table |  | Headstock / sill beam — columns: width (mm), depth (mm), length (m), rl_top (m), rl_soffit (m) |
| `supports[].headstock_setout` | table |  | Headstock / sill beam plan setout from the support setout point (support_lines E, N): edge = front / back = face offset square to the line of bearings (+ toward the span); edge = start / end = sill end along the line of bearings (+ in the support_lines.bearing direction) — columns: edge, value (mm) |
| `supports[].curtain_wall` | table |  | Curtain / ballast wall — columns: thickness (mm), height (mm) |
| `supports[].wingwalls` | table |  | Wingwalls — columns: side, length (m), thickness (mm) |
| `supports[].piles[]` | list | | Piles / columns (fields below) |
| `supports[].soil_layers` | table |  | Soil profile at the support (top RL of each layer) — columns: name, rl_top (m), kh (MN/m3), gamma (kN/m3), phi (deg) |
| `supports[].rock_kh` | num | MN/m3 | Lateral modulus of the rock socket |
| `supports[].backfill` | table |  | Fill retained by the headstock — columns: gamma (kN/m3), phi (deg), K, retained_height (m) |

#### `supports[].piles[]` — each item has an `id` plus:

| Field | Kind | Unit | Description |
|---|---|---|---|
| `supports[].piles[].E` | num | m | Pile centre easting (project grid) |
| `supports[].piles[].N` | num | m | Pile centre northing |
| `supports[].piles[].diameter` | num | mm | Pile diameter |
| `supports[].piles[].rl_top` | num | m | Cut-off level / column top |
| `supports[].piles[].rl_rock` | num | m | Top of rock socket (RL B) |
| `supports[].piles[].rl_toe` | num | m | Founding level (RL A) |
| `supports[].piles[].ground_rl` | num | m | Ground / fill level at the pile |
| `supports[].piles[].design_actions` | table |  | Pile design actions listed on the drawings — columns: limit_state, N (kN), M (kNm), V (kN) |

## materials

| Field | Kind | Unit | Description |
|---|---|---|---|
| `materials.concrete` | table |  | Concrete by element — columns: element, fc (MPa), E (MPa), density (kN/m3), alpha (1e-6/C) |
| `materials.strand` | table |  | Prestressing strand — columns: type, diameter (mm), area (mm2), fpb (MPa), Ep (MPa), relaxation (%) |
| `materials.reinforcement` | table |  | Reinforcing steel — columns: grade, fsy (MPa), Es (MPa) |

## loads

| Field | Kind | Unit | Description |
|---|---|---|---|
| `loads.traffic_models` | table |  | Traffic load models applied — columns: model, on |
| `loads.design_speed` | num | km/h | Design speed (centrifugal) |
| `loads.braking_force` | num | kN | Braking force on the bridge |
| `loads.traffic_surcharge` | num | kPa | Earth pressure from traffic surcharge |
| `loads.pedestrian` | bool |  | Pedestrian load applies |
| `loads.wind` | table |  | Wind inputs — columns: item, value, unit |
| `loads.temperature` | table |  | Uniform temperature inputs — columns: item, value, unit |
| `loads.gradient_positive` | table |  | Temperature gradient, top hot — columns: depth (mm), dT (C) |
| `loads.gradient_negative` | table |  | Temperature gradient, top cold — columns: depth (mm), dT (C) |
| `loads.shrinkage_creep_shortening` | num | 1e-6 | Long-term shortening after the bearings are set |
| `loads.earthquake` | table |  | Earthquake inputs — columns: item, value |
| `loads.flood` | bool |  | Water flow loads apply |
| `loads.collision` | bool |  | Collision on supports applies |

## combinations

| Field | Kind | Unit | Description |
|---|---|---|---|
| `combinations.standard` | ref |  | Combination rules (std:AS5100.2-2017/...) |
| `combinations.register` | table |  | Load-case register overrides: on/off and factors — columns: case, on, uls, beneficial, sls |
| `combinations.settings` | table |  | Generator settings (lanes, k1, k2, wind directions ...) — columns: item, value |

## analysis

| Field | Kind | Unit | Description |
|---|---|---|---|
| `analysis.grillage` | table |  | Grillage modelling choices — columns: item, value |
| `analysis.bearing_fixed_stiffness` | num | kN/m | Stiffness used for a fixed bearing direction |
| `analysis.pile_toe` | enum |  | Pile toe support — one of: vertical only, fixed |
| `analysis.column_segment` | num | m | Maximum column / pile element length |
| `analysis.soil_factor` | num |  | Soil / rock stiffness factor (sensitivity run) |
| `analysis.modes` | int |  | Number of modes for the response spectrum |

## design

| Field | Kind | Unit | Description |
|---|---|---|---|
| `design.girder_options` | table |  | Super-T / plank design options — columns: item, value |
| `design.stations` | table |  | Design stations / load-case positions — columns: name, rule, s (m) |
| `design.prestress_losses` | table |  | Prestress-loss / camber analysis inputs not held elsewhere (environment k4, basic drying shrinkage eb, ageing chi, transmission length, relaxation Rb / k7 / k8, strand MBL, ages, loads on the girder, ...): item = the input name of pdf2bim.design.prestress — columns: item, value, unit |
