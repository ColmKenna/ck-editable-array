# ck-editable-array specification

## P1 – Basic render: internal array ↔ UI sync
- Given an initial array such as `["A", "B", "C"]`, the component clones the provided light-DOM templates for both `slot="display"` and `slot="edit"`.
- Each row receives `data-row` and `data-mode` attributes and populates `[data-bind]` nodes so display text and edit inputs mirror the internal array.

## P2 – Initialization with empty array
- Setting `data = []` renders no editable rows and leaves `data` as an empty array.
- No `datachanged` event fires because nothing was edited yet.

## P3 – Initialization with null/undefined
- Passing `null` or `undefined` to `data` normalizes to an empty array.
- Rendering proceeds safely without throwing and without emitting `datachanged`.

## P4 – Edit existing item
- Editing an input tied to `[data-bind]` updates the corresponding entry inside `data`.
- The component re-renders the row, keeping display/edit DOM in sync, and dispatches `datachanged` with the latest array snapshot.

## P5 – Single-element edit
- Single-row arrays behave the same as multi-row arrays; editing the only input rewrites `data[0]` and raises `datachanged` with the new single-element array.

## Event contract
- `datachanged` bubbles, is composed, and carries `{ data: unknown[] }` detail snapshots cloned from internal state.
- The event only fires when a user edit changes row data; no event dispatch occurs on connect or when programmatically setting `data`.
