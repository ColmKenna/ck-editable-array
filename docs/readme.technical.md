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

### Event Configuration

All events are dispatched with `bubbles: true` and `composed: true` to ensure proper propagation through shadow DOM boundaries.

#### datachanged Event
```typescript
new CustomEvent('datachanged', {
  bubbles: true,
  composed: true,
  detail: { data: this.data }  // Fresh clone from getter
});
```

**Dispatched when**:
- Data setter is called
- User edits a field (via `commitRowValue`)
- Save button is clicked
- Add button is clicked
- Delete button is clicked
- Restore button is clicked
- Toggle mode changes data (adds/removes `editing` flag)

**Behavior**:
- Bubbles up the DOM tree to ancestor elements
- Crosses shadow DOM boundaries (composed)
- `detail.data` contains a fresh clone from the getter
- Consumers cannot mutate internal state via event data

#### beforetogglemode Event
```typescript
new CustomEvent('beforetogglemode', {
  bubbles: true,
  composed: true,
  cancelable: true,
  detail: {
    index: number,
    from: 'display' | 'edit',
    to: 'display' | 'edit'
  }
});
```

**Dispatched when**:
- Toggle button is clicked (before mode change)
- Cancel button is clicked (before reverting to display)

**Behavior**:
- Cancelable - calling `event.preventDefault()` prevents the mode toggle
- Bubbles to ancestor elements
- Crosses shadow DOM boundaries
- Allows external control over edit mode transitions

#### aftertogglemode Event
```typescript
new CustomEvent('aftertogglemode', {
  bubbles: true,
  composed: true,
  detail: {
    index: number,
    mode: 'display' | 'edit'
  }
});
```

**Dispatched when**:
- Mode toggle completes successfully
- After Cancel button reverts to display mode

**Behavior**:
- Not cancelable (mode change already completed)
- Bubbles to ancestor elements
- Crosses shadow DOM boundaries
- Notifies of completed mode transitions

### Event Propagation

**Shadow DOM Boundaries**:
- All events use `composed: true` to cross shadow boundaries
- Events can be caught on ancestor elements (e.g., `document.body`)
- Events can be caught at document level
- `event.target` is always the `<ck-editable-array>` element

**Event Delegation**:
```javascript
// Listen on parent element
document.body.addEventListener('datachanged', (event) => {
  console.log('Data changed:', event.detail.data);
});

// Cancel mode toggle for specific rows
el.addEventListener('beforetogglemode', (event) => {
  if (event.detail.index === 0) {
    event.preventDefault(); // Prevent row 0 from toggling
  }
});

// React to completed mode changes
el.addEventListener('aftertogglemode', (event) => {
  console.log(`Row ${event.detail.index} is now in ${event.detail.mode} mode`);
});
```

### Event Payload Consistency & Immutability

**datachanged Event Payload**:
- `detail.data` always contains the **complete current array**
- The array is a fresh clone from the `data` getter (deep clone via JSON)
- Mutating `event.detail.data` does NOT affect the component's internal state
- Consumers receive the full state, not just changed items
- This simplifies state synchronization with external stores

**beforetogglemode Event Payload**:
- `detail.index`: The row index being toggled
- `detail.from`: Current mode before transition (`'display'` or `'edit'`)
- `detail.to`: Target mode after transition (`'display'` or `'edit'`)
- Provides complete transition context for conditional prevention
- Useful for validation, authorization, or state checks

**aftertogglemode Event Payload**:
- `detail.index`: The row index that toggled
- `detail.mode`: Final mode after transition (`'display'` or `'edit'`)
- Does NOT include `from`/`to` since transition is complete
- Useful for post-transition side effects (focus, analytics, etc.)

**Immutability Guarantees**:
```javascript
// Example: datachanged payload is immutable
el.addEventListener('datachanged', (event) => {
  const data = event.detail.data;
  
  // Safe to mutate - won't affect component
  data[0].name = 'Modified';
  
  // Reading el.data again returns original value
  console.log(el.data[0].name); // Still original value
  
  // To update component, must reassign
  el.data = data; // Now component updates
});
```

**No Initial Spam**:
- No events dispatched during initial render
- Events only describe user interactions and programmatic data changes
- Setting `data` property dispatches one `datachanged` event


## Validation System

### Schema Storage and Validation
- `schema` property stores validation rules (JSON Schema-like format)
- `validateRow(rowIndex)` returns boolean validity
- `validateRowDetailed(rowIndex)` returns `{ isValid: boolean, errors: Record<string, string[]> }`
- Validation runs on:
  - Row toggle to edit mode
  - Input field changes (via `input` event)
  - Save button click

### Validation Rules
Currently supports:
- **Required fields**: `schema.required` array lists mandatory fields
- **String minLength**: `schema.properties[field].minLength` enforces minimum length
- Empty string, null, undefined, and whitespace-only values fail required validation

### Validation UI Updates
`updateSaveButtonState(rowIndex)` orchestrates all validation UI:

1. **Save Button State**
   - Disabled when `isValid === false`
   - `aria-disabled="true"` added for accessibility

2. **Row-level Indicators**
   - `data-row-invalid` attribute on edit wrapper when invalid
   - Removed when all fields pass validation

3. **Field-level Indicators**
   - `data-invalid` attribute on invalid inputs
   - `aria-invalid="true"` for screen reader support
   - Removed when field becomes valid

4. **Error Messages**
   - Elements with `data-field-error="fieldName"` receive error text
   - Cleared when field becomes valid
   - Unique IDs generated: `error-{rowIndex}-{fieldName}`
   - Linked to inputs via `aria-describedby`

5. **Error Count**
   - Elements with `data-error-count` show "N error(s)"
   - Cleared when valid

6. **Error Summary**
   - Elements with `data-error-summary` receive concatenated error messages
   - Format: "field1 is required. field2 must be at least N characters."
   - Cleared when valid
   - Should include `role="alert"` and `aria-live="polite"` in template

### Accessibility Implementation

**ARIA Attributes**:
- `aria-invalid="true"` marks invalid fields
- `aria-describedby` links inputs to error messages
- `role="alert"` on error summary for immediate announcement
- `aria-live="polite"` on error summary for dynamic updates

**ID Generation**:
- Error message IDs: `error-{rowIndex}-{fieldName}`
- Ensures uniqueness across multiple rows
- Stable IDs for ARIA relationships

**Screen Reader Flow**:
1. User focuses invalid input
2. Screen reader announces field label
3. Screen reader announces `aria-invalid` state
4. Screen reader reads error message via `aria-describedby`
5. Error summary announces changes via `aria-live`

### Validation Data Flow

```
User Input Change
  ↓
commitRowValue(rowIndex, key, value)
  ↓
updateBoundNodes(rowIndex, key)
  ↓
updateSaveButtonState(rowIndex)
  ↓
validateRowDetailed(rowIndex)
  ↓
Update UI:
  - Save button disabled state
  - data-row-invalid attribute
  - data-invalid on fields
  - aria-invalid on fields
  - Error message text
  - aria-describedby links
  - Error count
  - Error summary
```

### Performance Considerations
- Validation runs synchronously on input change
- Only validates the specific row being edited
- DOM updates are targeted (no full re-render)
- Error message IDs are generated once and reused
- ARIA attributes updated only when validation state changes


## Data Cloning & Immutability

### Cloning Strategy
- **Deep cloning**: Uses `JSON.parse(JSON.stringify())` to clone row data
- **Immutability guarantee**: External mutations to source arrays don't affect internal state
- **Public API protection**: Reading `el.data` returns a fresh clone each time

### Internal vs Public Properties

**Public properties** (exposed in `el.data`):
- `deleted`: boolean flag for soft-delete state
- `editing`: boolean flag for edit mode state
- All user-defined data properties

**Internal properties** (filtered from `el.data`):
- `__originalSnapshot`: snapshot for Cancel functionality
- `__isNew`: marker for newly added rows

### Nested Property Support
- `data-bind` attributes support nested paths (e.g., `data-bind="person.name"`)
- `resolveBindingValue()` traverses nested objects using dot notation
- `commitRowValue()` updates nested properties by navigating to parent and setting leaf property
- Deep cloning protects nested objects from external mutations

### Soft Delete Behavior

**Delete operation** (`handleDeleteClick`):
- Sets `deleted: true` on the row
- Adds `data-deleted="true"` attribute to row wrapper
- Adds `deleted` CSS class for styling hooks
- Re-renders and dispatches `datachanged` event

**Restore operation** (`handleRestoreClick`):
- Sets `deleted: false` explicitly (not `undefined`)
- Removes `data-deleted` attribute from row wrapper
- Removes `deleted` CSS class
- Re-renders and dispatches `datachanged` event

**Design rationale**:
- Explicit `deleted: false` provides consistent state representation
- Easier to reason about than `undefined` vs `false`
- Aligns with TypeScript's type system
- Maintains immutability guarantees (cached snapshots remain unchanged)

### CSS Styling Hooks

Consumers can style deleted rows using:
```css
/* Class selector */
.display-content.deleted {
  opacity: 0.5;
  text-decoration: line-through;
}

/* Attribute selector */
[data-deleted="true"] {
  background-color: #fee;
}
```

### Immutability Examples

**Example 1: External mutation doesn't affect internal state**
```javascript
const source = [{ name: 'Alice' }];
el.data = source;
source[0].name = 'Mutated'; // External mutation
console.log(el.data[0].name); // Still 'Alice'
```

**Example 2: Reading data returns fresh clone**
```javascript
const snapshot1 = el.data;
snapshot1[0].name = 'Mutated';
const snapshot2 = el.data;
console.log(snapshot2[0].name); // Still original value
```

**Example 3: Deleted flag immutability**
```javascript
const before = el.data; // [{ name: 'Alice', deleted: false }]
// Click delete button
const after = el.data; // [{ name: 'Alice', deleted: true }]
console.log(before[0].deleted); // Still false (immutable)
```
