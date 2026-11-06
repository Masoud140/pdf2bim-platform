"""Drawing reader (P9, owner decision 2026-11-06: drawings may be sent to the Claude API with the owner's key).

Claude reads each page and proposes values; deterministic code (verify.py) keeps only what it can find printed on the
page or re-compute from printed numbers. Everything else stays Missing-Flagged. Nothing here invents a value."""
