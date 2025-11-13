# Checkpoint - 2025-11-13 (post P1-P5 scenarios)

## Highlights
- Added Given/When/Then tests capturing P1-P5 behavior.
- Component now normalizes primitive/object rows, wires edit inputs back to state, and emits `datachanged` on actual edits only.
- README + docs now describe the editable-array workflow and demo logs emitted payloads.

## State snapshot
- Tests: `npm test` → PASS (3 suites, 9 tests).
- Docs: `docs/spec.md`, `docs/README.md`, `docs/readme.technical.md`, and `docs/steps.md` updated; new demo output shows event payload JSON.
- Risks: multi-node templates still wrap to the first element (pre-existing behavior); editing currently re-renders the whole list which is fine for this milestone.
