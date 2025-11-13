# Technical notes: ck-editable-array

## Data normalization
- `data` setter clones incoming arrays.
- Object rows become shallow copies so edits do not mutate the original reference.
- Primitive rows (string/number/boolean) are stored as strings; falsy values default to an empty string.

## Rendering pipeline
- A shadow `div[part="root"]` is cleared and repopulated on every `render()`.
- Templates in the light DOM are cloned per row with `data-row`/`data-mode` markers.
- `[data-bind]` nodes receive either `textContent` (display) or `value` (inputs/textarea) populated via `resolveBindingValue`.

## Input wiring
- Only elements inside the `slot="edit"` clone get listeners.
- Inputs and textareas subscribe to `input` events and call `commitRowValue(rowIndex, key, value)` which snapshots `_data`, applies the change, re-renders, and emits `datachanged` once per logical edit.

## Events
- `datachanged` bubbles, is composed, and sends `{ data }` snapshots from the getter, ensuring consumers cannot mutate internal state accidentally.
- No document-level dispatch or initial change spam occurs; events only describe user edits.
