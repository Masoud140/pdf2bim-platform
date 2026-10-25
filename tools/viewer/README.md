# BR13A model viewer (interactive page)

`projects/BR13A/model/BR13A.viewer.html` — standalone page (three.js from cdnjs / jsDelivr): 3D integrated grillage
(deflections, modes), governing traffic positions, prestress losses and camber, composite section with N–M, girder design
checks, bearings / piles, load combinations. Data snapshot from the platform at the commit it was built.

Sources: `head.html`, `body.html`, `script.js` (page); `extract2.py` (traffic, losses, section, combinations data). The model /
design data block was extracted with the same platform modules (nodes, members, links, springs, self-weight / SDL
deflections, 4 modes, girder checks, pile resultants, bearing envelopes). A one-command builder is still to do.
Indicative only: uses proposed decisions (allow_proposed).
