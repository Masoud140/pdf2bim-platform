# BR13A (B12639) — M7–M12 southbound exit ramp, single-span Super-T

- **`BR13A.bridge.json`:** the bridge description (format pdf2bim.bridge/0.1). It was migrated from the v44 dashboard by `import_dashboard.py`, from `source/dashboard_v44_state.json` (dumped by `tools/dump_dashboard_state.js`).
- **`BR13A.decisions.jsonl`:** the decision log. It is seeded with the engineer instructions and confirmations recorded so far. Entries whose original date was not recorded are marked "migrated".
- **`SUMMARY.md`:** tag counts, missing and assumed items, and decisions waiting for the engineer. Regenerate it with `python3 tools/summarise_bridge.py projects/BR13A/BR13A.bridge.json --md projects/BR13A/SUMMARY.md`.

The migration converter is specific to BR13A. New bridges are written in the format directly.
