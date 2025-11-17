# Checkpoint - 2025-11-17: Pre-modal edit baseline

Summary:
- Captured baseline before implementing modal-based edit mode for `ck-editable-array`.
- Component currently supports inline display/edit templates with exclusive locking, validation, custom buttons, select/multiselect/checkbox/radio/datalist binding, and style mirroring.
- No modal presentation exists; edit mode is inline only.

Test status:
- `npm test` — all 205 tests passing (16 suites).

Notes:
- Next step: add modal edit option via TDD, ensuring backward compatibility with inline editing and updating docs/demo.
