# Architecture — PDF-to-BIM bridge platform

**Status:** target architecture agreed 2026-10-23 (master instruction). The current implementation is mapped against it in section 3. Approved and open decisions are in `DECISIONS.md`; current state is in `CURRENT_STATUS.md`.

## 1. Scope

- **What:** a web application in which a bridge engineer:
  - uploads GA / preliminary drawings and engineering documents (PDF);
  - reviews the extracted information and decides on it;
  - builds a structural model;
  - analyses and designs to AS 5100;
  - gets traceable reports, design actions, model exports and a decision history.
- **First class of bridges:** simply supported, single-span, precast concrete. Super-T first, precast planks after the shared platform passes its verification gates.
- **BR13A:** the first migration and regression case. It is not a template.

## 2. Logical layers and data flow

```
 PDF / documents ──► A Document intelligence ──► B Engineering data & decisions ◄──► H Application (review, approve, edit)
                                                    │  bridge description (tagged values, revision)
                                                    ▼  + approved decision set
                                       C Parametric geometry ──► D Sections & products
                                                    │                   │
                                                    ▼                   ▼
                                       E Structural model builder (roles, stable ids) ──► MIDAS .mct export
                                                    │  model revision / hash
                                                    ▼
                                       F Analysis & design engines (loads, stages, solver, combinations, checks)
                                                    │  run record (inputs, engine & standards versions, settings)
                                                    ▼
                                       G Verification (checks on every run) ──► H Reports, plots, 3D model
```

| Layer | Responsibility | Input → output (interface) |
|---|---|---|
| **A** Document intelligence | PDF ingestion, OCR, drawing interpretation, dimensions with page/view references, conflicts, queries | PDFs → proposed tagged values + Query Register items |
| **B** Engineering data & decisions | Canonical bridge description: units, MGA coordinates, stable entity ids, provenance, revisions, approval workflow, decision history | Proposals / edits → accepted bridge description revision + decision log |
| **C** Parametric geometry | Alignment; support lines and skew; bearing positions; girder chords; deck boundaries; variable flange geometry; headstocks; piles | Bridge description → geometry object (coordinates in MGA, ids) |
| **D** Sections & products | Super-T (product + drawing overrides); composite; open / solid zones; torsion; prestressing definitions; planks later | Geometry + type definitions + product library → section properties per member segment |
| **E** Model builder | Grillage, transverse members, cross girders, rigid offsets, bearings, substructure, piles, springs, constraints, stage model | Geometry + sections + modelling rules → analysis model (members with **roles** and stable ids) |
| **F** Engines | Loads, construction stages, prestress, solver, AS 5100.2 combinations, AS 5100.5 girder design, bearing / headstock / pile actions | Model + load inputs + standards → results with signed, concurrent actions where the check needs them |
| **G** Verification | Geometry, connectivity, equilibrium, boundary diagnostics, benchmarks, model comparisons | Any layer's output → pass / fail + report |
| **H** Application & reporting | 3D model, PDF viewer, editable inputs, result plots, decision review, audit trail, reports, exports | All of the above |

**Notes:**
- These are **logical boundaries**. No services or infrastructure are added before they are needed.
- **Stable identifiers:** every entity has an id that survives regeneration: girder `G1`, bearing `A-G1`, pile `A1`, support `A`, segment `G1/open/2`. Model members carry a **role** (girder, transverse slab, cross girder, rigid offset, dummy, bearing, headstock, column, pile, spring). No code may depend on names, file order or node numbers.
- **Run record (reproducibility):** every analysis or design run stores:
  - bridge-description revision and hash;
  - approved decision set (last decision id);
  - model hash;
  - engine version (git commit);
  - standards and product-library versions;
  - solver settings;
  - load cases and combination definitions.

  A change to an input marks the results that depend on it as **stale**. The decision `affects` field gives the first cut of that dependency.

## 3. Current implementation against the target (2026-10-23)

| Layer | Current implementation | Gap |
|---|---|---|
| A | Extraction agent spec (`pdf-ga-extractor.md`, in the claude.ai project); output is an Excel takeoff; Query Register HTML | Not connected to the bridge description; no source-linked values in the application |
| B | `schema/` (format pdf2bim.bridge/0.1, tag rules), decision log, `projects/BR13A/` (928 tagged values, 33 decisions), tools | No revision id or hash in the file; no field for "engineering significance"; the original drawing value is kept only in the decision log; no run records; the dashboard does not read or write the file |
| C | JavaScript in the dashboard: alignment (`P` parameters), `gwGeom` / `gwWidth` / `gwFlange` (chords, widths) | Not an engine on the description; the mesh puts girders on constant-offset curves, not chords (up to 265 mm off at BR13A midspan) |
| D | JavaScript: `secGeom` (Super-T T1–T5 + overrides, open / solid); the Member Properties tab; FD torsion script (`claude/torsion_fd.py`, project docs); the Hog section library | Composite / torsion properties not produced per member segment from the one definition; flare not applied to the model |
| E | **Fixed BR13A MIDAS .mct** embedded in the page, patched by `SUBM.build()` (springs, bearings, column splits) | No builder; members found by BR13A section and group names and by file order |
| F | JavaScript engines (solver, stages, traffic influence surfaces, loads, combination generator, AS 5100.5 fibre engine, Hog time analysis), running in the browser | No callable interface outside the browser; approximations (section 4); no unit contract |
| G | Browser scripts that print values against hand values; engine worked-example scripts; schema tests | Not pass / fail; no independent MIDAS model of the integrated structure; no automatic model checks per run |
| H | Single offline HTML (about 3.5 MB), built by string replacement on a frozen v15 base with layered overrides | Works and is reproducible, but hard to extend; no PDF viewer link, no decision UI, no multi-user support |

## 4. Engineering approximations in the current engines (to resolve in P4)

- Traffic M, V and T are enveloped separately (not concurrent).
- Earthquake results are unsigned envelopes; the 100 / 30 combination is applied to envelopes.
- Pile moment resultant = √(M_l² + M_t²) of separate envelopes (an upper bound).
- Pedestrian load is taken as zero (footway not confirmed).
- Construction-stage stiffness and roll restraint are modelling choices (CS2–CS3 roll restraint 1e6 kN·m/rad).
- The grillage node line is at the deck soffit with a CT section offset. MEMBER_PROPERTIES_METHOD §12 notes the section top may sit 200 mm low. **Unresolved.**
- Internal diaphragms are not modelled (only a range is dimensioned).

## 5. Technology direction (approved 2026-10-23, see ADR-006)

- **Python:** engineering core (geometry, sections, model builder, solver interface, loads, combinations, design checks, verification, report data).
- **TypeScript:** web front end (model viewer, PDF review, inputs, decisions, results).
- **API layer** between them and the AI workflow.
- **PostgreSQL** (or equivalent) for users, projects, revisions, decisions and run metadata, when multi-user is needed.
- **Versioned files / object storage** for drawings, bridge-description JSON, models, reports and large results.
- **The bridge-description JSON stays the portable exchange format.**
- **MIDAS Civil** .mct import / export is kept, and independent MIDAS models are used for verification.

**Migration (strangler pattern):**
- Write the Python core one module at a time, behind defined interfaces.
- Verify each module against the JavaScript dashboard on BR13A and against independent benchmarks.
- Only then switch the dashboard to use it.
- The JavaScript dashboard stays the working reference until its replacement is independently tested.
