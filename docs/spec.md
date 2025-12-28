# CkEditableArray Component Specification

## Overview

`CkEditableArray` is a web component for managing and displaying editable arrays with a clean, modern UI. It provides both attribute and property-based APIs for integration into web applications.

## Public API

### Properties

#### `name: string`
- **Type**: String
- **Default**: `"items"`
- **Description**: The component name used for:
  1. Greeting message display ("Hello, {name}!")
  2. Form control `name` attributes in edit template (e.g., `"users[0].firstName"`)
  3. Form control `id` attributes in edit template (e.g., `"users__0__firstName"`)
- **Getter**: Returns the current name or default `"items"`
- **Setter**: Updates the name via attribute
- **Synced with Attribute**: Yes (`name` attribute)
- **Form Integration**: When set, automatically applied to all form controls with `data-bind` in edit templates
- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');
  element.name = 'users'; // Setter
  console.log(element.name); // Getter → "users"

  // Form controls in edit template will have:
  // <input data-bind="firstName" name="users[0].firstName" id="users__0__firstName" />
  // <input data-bind="email" name="users[1].email" id="users__1__email" />
  ```

#### `rootClass: string`
- **Type**: String
- **Default**: `""`
- **Description**: Space-separated classes added to the generated root wrapper element inside the shadow DOM
- **Getter**: Returns the current `root-class` value
- **Setter**: Updates the `root-class` attribute
- **Synced with Attribute**: Yes (`root-class` attribute)

#### `rowsClass: string`
- **Type**: String
- **Default**: `""`
- **Description**: Space-separated classes added to the generated rows wrapper element inside the shadow DOM
- **Getter**: Returns the current `rows-class` value
- **Setter**: Updates the `rows-class` attribute
- **Synced with Attribute**: Yes (`rows-class` attribute)

#### `rowClass: string`
- **Type**: String
- **Default**: `""`
- **Description**: Space-separated classes added to each generated row wrapper element inside the shadow DOM
- **Getter**: Returns the current `row-class` value
- **Setter**: Updates the `row-class` attribute
- **Synced with Attribute**: Yes (`row-class` attribute)

#### `datachangeMode: "debounced" | "change" | "save"`
- **Type**: String (union)
- **Default**: `"debounced"`
- **Description**: Controls when `datachanged` fires in response to user edits
- **Getter**: Returns the current `datachange-mode` value (validated)
- **Setter**: Updates the `datachange-mode` attribute
- **Synced with Attribute**: Yes (`datachange-mode` attribute)

#### `datachangeDebounce: number`
- **Type**: Number (milliseconds)
- **Default**: `300`
- **Description**: Debounce delay used when `datachangeMode` is `"debounced"`
- **Getter**: Returns the current `datachange-debounce` value (normalized)
- **Setter**: Updates the `datachange-debounce` attribute
- **Synced with Attribute**: Yes (`datachange-debounce` attribute)

#### `data: unknown[]`
- **Type**: Array (any elements)
- **Default**: `[]` (empty array)
- **Description**: The data array for the editable content
- **Getter**: Returns a deep clone of the internal data
- **Setter**: Accepts array; normalizes non-arrays to `[]`; stores deep clone internally
- **Normalization**:
  - If value is an array → stored as-is (after cloning)
  - If value is `null`, `undefined`, or non-array → normalized to `[]`
  - **Examples**:
    - `element.data = null` → `element.data` becomes `[]`
    - `element.data = "string"` → `element.data` becomes `[]`
    - `element.data = 123` → `element.data` becomes `[]`
    - `element.data = {}` → `element.data` becomes `[]`
    - `element.data = [1, 2, 3]` → `element.data` is `[1, 2, 3]`

- **Deep Cloning**:
  - **On Set**: Input data is deep cloned before storage
  - **On Get**: Returned data is a deep clone of internal state
  - **Cloning Strategy**:
    - Primary: `structuredClone()` (when available in modern browsers)
    - Fallback: JSON serialization (`JSON.stringify` + `JSON.parse`) for older browsers
    - Ensures immutability: mutations to returned/input data do not affect component state

- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');

  // Set data
  const originalData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
  element.data = originalData;

  // Get data (returns a deep clone)
  const clonedData = element.data;

  // Modify the cloned data
  clonedData[0].name = 'Modified';
  clonedData.push({ id: 3, name: 'Item 3' });

  // Original internal state is unchanged
  console.log(element.data[0].name);     // → "Item 1" (unchanged)
  console.log(element.data.length);      // → 2 (unchanged)

  // Modify the original input data
  originalData[0].name = 'Changed';

  // Component data is still unchanged (was cloned on set)
  console.log(element.data[0].name);     // → "Item 1" (unchanged)
  ```

#### `readonly: boolean`
- **Type**: Boolean
- **Default**: `false`
- **Description**: When true, disables all mutating operations (edit, save, delete, restore, reorder)
- **Getter**: Returns the current `readonly` value (as a boolean)
- **Setter**: Updates the `readonly` attribute
- **Synced with Attribute**: Yes (`readonly` attribute)
- **Behavior**:
  - Edit/save/delete/restore buttons are disabled and visually grayed out
  - Drag-and-drop reordering is disabled (rows have `draggable="false"`)
  - Move buttons are disabled
  - Input/change events do not mutate data or dispatch `rowchanged`/`datachanged`
  - Cancel button remains available to exit edit mode without saving
  - Toggling `readonly` updates all row controls dynamically
- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');
  element.data = [{ id: 1, name: 'Item 1' }];

  // Enable readonly mode
  element.readonly = true;
  // Edit buttons are now disabled, drag-and-drop blocked

  // Disable readonly mode
  element.readonly = false;
  // Edit buttons are now enabled, drag-and-drop allowed
  ```

#### `allowReorder: boolean`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Controls whether drag-and-drop and programmatic reordering (moveUp/moveDown) are available
- **Getter**: Returns the current `allow-reorder` value (as a boolean)
- **Setter**: Updates the `allow-reorder` attribute
- **Synced with Attribute**: Yes (`allow-reorder` attribute)
- **Behavior**:
  - When `false`: Drag-and-drop is disabled, move buttons are hidden, `moveUp()`/`moveDown()` return `false`
  - When `true`: Drag-and-drop and move buttons are available (unless blocked by `readonly` or other guards)
  - Toggling `allowReorder` updates row drag state and button visibility dynamically
- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');
  element.data = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];

  // Disable reordering
  element.allowReorder = false;
  console.log(element.moveUp(1)); // false (blocked)

  // Enable reordering
  element.allowReorder = true;
  console.log(element.moveUp(1)); // true (allowed, if not in edit mode)
  ```

### Attributes

| Attribute | Type   | Default | Synced with Property | Description                    |
|-----------|--------|---------|----------------------|--------------------------------|
| `name`    | string | "World" | Yes (`name` prop)    | The name displayed in greeting |
| `root-class` | string | "" | Yes (`rootClass` prop) | Classes added to the generated root wrapper |
| `rows-class` | string | "" | Yes (`rowsClass` prop) | Classes added to the generated rows wrapper |
| `row-class`  | string | "" | Yes (`rowClass` prop)  | Classes added to each generated row wrapper |
| `datachange-mode` | string | `"debounced"` | Yes (`datachangeMode` prop) | When to dispatch `datachanged` during edits |
| `datachange-debounce` | number | `300` | Yes (`datachangeDebounce` prop) | Debounce delay (ms) for `datachange-mode="debounced"` |
| `csp-nonce` | string | "" | No | Nonce applied to fallback `<style>` tag for CSP compliance |
| `disable-style-fallback` | boolean | false | No | If present, prevents injection of fallback `<style>` tag |
| `button-edit-text` | string | "Edit" | No | Custom text for Edit button (supports icons/emojis; empty string for icon-only) |
| `button-save-text` | string | "Save" | No | Custom text for Save button (supports icons/emojis; empty string for icon-only) |
| `button-cancel-text` | string | "Cancel" | No | Custom text for Cancel button (supports icons/emojis; empty string for icon-only) |
| `button-delete-text` | string | "Delete" | No | Custom text for Delete button (supports icons/emojis; empty string for icon-only) |
| `button-restore-text` | string | "Restore" | No | Custom text for Restore button shown when row is deleted (supports icons/emojis) |
| `readonly` | boolean | false | Yes (`readonly` prop) | When present, blocks all mutating operations (edit, delete, reorder) |
| `allow-reorder` | boolean | true | Yes (`allowReorder` prop) | When set to `"false"`, disables all reordering functionality (drag-and-drop and move buttons) |

**Note**: The `data` property is not exposed as an attribute (arrays cannot be directly expressed in HTML attributes).

| Attribute | Type   | Default | Synced with Property | Description                    |
|-----------|--------|---------|----------------------|--------------------------------|
| `readonly` | boolean | false | Yes (`readonly` prop) | When present, blocks all mutating operations (add, edit, delete, reorder) |
| `allow-reorder` | boolean | true | Yes (`allowReorder` prop) | When set to `"false"`, disables all reordering functionality (drag-and-drop and move buttons) |

### Readonly Behavior

When `readonly` is present:

- Edit/save/delete/restore and move buttons are disabled
- Drag and drop is disabled (`draggable="false"` on rows)
- Input/change events do not mutate data or dispatch `rowchanged`/`datachanged`
- Cancel remains available to exit edit mode
- Toggling `readonly` updates row controls and draggable state

### Methods

#### `moveUp(index: number): boolean`
- **Description**: Moves a row up by one position in the data array with a smooth 250ms animation
- **Parameters**: `index` - The 0-based index of the row to move up
- **Returns**: `true` if the move was successful, `false` if blocked by guards
- **Animation**: Uses FLIP technique with 250ms ease-in-out transition; both rows animate simultaneously
- **Guards**:
  - Blocked if `readonly` attribute is set
  - Blocked if `allow-reorder` is set to `"false"`
  - Blocked if any row is currently in edit mode
  - Blocked if an animation is currently in progress
  - Blocked if `index` is 0 (first row) or out of bounds
- **Events Dispatched** (after animation completes):
  - `reorder` with `detail: { fromIndex, toIndex, data }`
  - `datachanged` with `detail: { data }`
- **CSS Classes**: `.ck-animating` applied to rows during animation
- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');
  element.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

  const success = element.moveUp(1); // Move 'B' to index 0 with animation
  console.log(success); // true (immediately, but data updates after 250ms)

  // Listen for completion
  element.addEventListener('reorder', (e) => {
    console.log(element.data); // [{ name: 'B' }, { name: 'A' }, { name: 'C' }]
  });
  ```

#### `moveDown(index: number): boolean`
- **Description**: Moves a row down by one position in the data array with a smooth 250ms animation
- **Parameters**: `index` - The 0-based index of the row to move down
- **Returns**: `true` if the move was successful, `false` if blocked by guards
- **Animation**: Uses FLIP technique with 250ms ease-in-out transition; both rows animate simultaneously
- **Guards**:
  - Blocked if `readonly` attribute is set
  - Blocked if `allow-reorder` is set to `"false"`
  - Blocked if any row is currently in edit mode
  - Blocked if an animation is currently in progress
  - Blocked if `index` is the last row or out of bounds
- **Events Dispatched** (after animation completes):
  - `reorder` with `detail: { fromIndex, toIndex, data }`
  - `datachanged` with `detail: { data }`
- **CSS Classes**: `.ck-animating` applied to rows during animation
- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');
  element.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

  const success = element.moveDown(0); // Move 'A' to index 1 with animation
  console.log(success); // true (immediately, but data updates after 250ms)

  // Listen for completion
  element.addEventListener('reorder', (e) => {
    console.log(element.data); // [{ name: 'B' }, { name: 'A' }, { name: 'C' }]
  });
  ```

## Events

### `datachanged`

Dispatched when the `data` property is set and when user edits are committed based on `datachangeMode`.

- **Type**: `CustomEvent`
- **Name**: `datachanged`
- **Bubbles**: Yes
- **Composed**: Yes
- **Detail**: `{ data: unknown[] }` (a deep clone of the internal data)
- **Edit cadence**:
  - `"debounced"` (default): fires after `datachangeDebounce` ms of inactivity
  - `"change"`: fires on change/blur events
  - `"save"`: fires on explicit Save action

Example:
```js
el.addEventListener('datachanged', (e) => {
  console.log(e.detail.data);
});
```

### `rowchanged`

Dispatched on each input/change event after a row is updated.

- **Type**: `CustomEvent`
- **Name**: `rowchanged`
- **Bubbles**: Yes
- **Composed**: Yes
- **Detail**: `{ index: number, row: unknown }` (a clone of the updated row)

Example:
```js
el.addEventListener('rowchanged', (e) => {
  console.log(e.detail.index, e.detail.row);
});
```

### `reorder`

Dispatched when a row is successfully moved using `moveUp()` or `moveDown()` methods.

- **Type**: `CustomEvent`
- **Name**: `reorder`
- **Bubbles**: Yes
- **Composed**: Yes
- **Detail**: `{ fromIndex: number, toIndex: number, data: unknown[] }`
  - `fromIndex`: The original index of the moved row
  - `toIndex`: The new index of the moved row
  - `data`: A deep clone of the data array after reordering

Example:
```js
el.addEventListener('reorder', (e) => {
  console.log(`Moved from ${e.detail.fromIndex} to ${e.detail.toIndex}`);
  console.log(e.detail.data);
});
```

### `beforetogglemode`

Dispatched before a row enters or exits edit mode. This event is **cancelable**, allowing listeners to prevent the mode toggle.

- **Type**: `CustomEvent`
- **Name**: `beforetogglemode`
- **Bubbles**: Yes
- **Composed**: Yes
- **Cancelable**: Yes
- **Detail**: `{ mode: 'edit' | 'view', rowIndex: number }`
  - `mode`: Either `'edit'` (entering edit mode) or `'view'` (exiting edit mode)
  - `rowIndex`: The 0-based index of the row being toggled

**Behavior**:
- Fired when a row is about to enter edit mode or exit from edit mode (on save or cancel)
- If `e.preventDefault()` is called, the mode toggle is cancelled and the row remains in its current mode
- Useful for validation or cleanup before state changes

Example:
```js
el.addEventListener('beforetogglemode', (e) => {
  if (e.detail.mode === 'edit') {
    console.log(`About to edit row ${e.detail.rowIndex}`);
    // Optionally prevent edit mode:
    // e.preventDefault();
  }
});
```

### `aftertogglemode`

Dispatched after a row successfully enters or exits edit mode.

- **Type**: `CustomEvent`
- **Name**: `aftertogglemode`
- **Bubbles**: Yes
- **Composed**: Yes
- **Cancelable**: No
- **Detail**: `{ mode: 'edit' | 'view', rowIndex: number }`
  - `mode`: Either `'edit'` (entered edit mode) or `'view'` (exited from edit mode)
  - `rowIndex`: The 0-based index of the row being toggled

**Behavior**:
- Fired after the mode toggle is complete and the DOM has been updated
- Useful for post-action operations like focus management or custom animations
- The component automatically announces the mode change to screen readers

Example:
```js
el.addEventListener('aftertogglemode', (e) => {
  if (e.detail.mode === 'edit') {
    console.log(`Entered edit mode for row ${e.detail.rowIndex}`);
  } else {
    console.log(`Exited edit mode for row ${e.detail.rowIndex}`);
  }
});
```

## Drag and Drop Reordering

The component supports drag and drop reordering of rows. Users can drag a row to a new position, and the data array will be reordered accordingly.

### Behavior

- **Draggable Rows**: Each row has `draggable="true"` attribute (set to `"false"` when `readonly` is set)
- **Drag Source Tracking**: The component tracks which row is being dragged
- **Visual Feedback**:
  - `.ck-dragging` class is added to the row being dragged
  - `.ck-drag-over` class is added to the row being dragged over
- **Guards**:
  - Drag is blocked when `readonly` attribute is set
  - Drag is blocked when any row is in edit mode
- **Events**: On successful drop, dispatches `reorder` and `datachanged` events
- **Accessibility**: Announces "Moved item from position X to Y" in the status region

### CSS Classes for Drag States

| Class | Description |
|-------|-------------|
| `.ck-dragging` | Applied to the row currently being dragged |
| `.ck-drag-over` | Applied to the row that is a potential drop target |

### Example Styling

```css
ck-editable-array .ck-dragging {
  opacity: 0.5;
  background-color: #f0f0f0;
}

ck-editable-array .ck-drag-over {
  border: 2px dashed #3b82f6;
  background-color: #eff6ff;
}
```

### Example Usage

```html
<ck-editable-array id="myList">
  <template slot="display">
    <span data-bind="name"></span>
  </template>
</ck-editable-array>

<script>
  const list = document.getElementById('myList');
  list.data = [
    { name: 'Item 1' },
    { name: 'Item 2' },
    { name: 'Item 3' }
  ];

  // Listen for reorder events
  list.addEventListener('reorder', (e) => {
    console.log(`Moved from ${e.detail.fromIndex} to ${e.detail.toIndex}`);
  });
</script>
```

## Move Up/Down Methods and Buttons

The component provides both programmatic methods and UI buttons for moving rows up and down.

### Public Methods

#### `moveUp(index: number): boolean`

Moves the row at the specified index up one position with a smooth 250ms animation.

- **Returns**: `true` if the move was successful, `false` otherwise
- **Animation**: 250ms ease-in-out CSS transition using FLIP technique
- **Guards**:
  - Returns `false` if `readonly` is set
  - Returns `false` if any row is in edit mode
  - Returns `false` if an animation is currently in progress
  - Returns `false` if index is 0 (already at top) or invalid

```javascript
const list = document.querySelector('ck-editable-array');
list.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

list.moveUp(1); // Moves 'B' to position 0 with animation
// Data updates after 250ms animation completes
// Result: [{ name: 'B' }, { name: 'A' }, { name: 'C' }]
```

#### `moveDown(index: number): boolean`

Moves the row at the specified index down one position with a smooth 250ms animation.

- **Returns**: `true` if the move was successful, `false` otherwise
- **Animation**: 250ms ease-in-out CSS transition using FLIP technique
- **Guards**:
  - Returns `false` if `readonly` is set
  - Returns `false` if any row is in edit mode
  - Returns `false` if an animation is currently in progress
  - Returns `false` if index is at last position or invalid

```javascript
list.moveDown(0); // Moves 'A' to position 1 with animation
// Data updates after 250ms animation completes
// Result: [{ name: 'B' }, { name: 'A' }, { name: 'C' }]
```

### Move Buttons

Each row includes move up (↑) and move down (↓) buttons:

- **Move Up Button**: `[data-action="move-up"]`, part: `button button-move-up`
- **Move Down Button**: `[data-action="move-down"]`, part: `button button-move-down`

**Button States**:
- Move up button is disabled for the first row
- Move down button is disabled for the last row
- Both buttons are disabled when `readonly` is set

**Accessibility**:
- `aria-label="Move item X up"` / `aria-label="Move item X down"`

## Form Integration

### Form-Associated Custom Element (FACE)

`CkEditableArray` is a Form-Associated Custom Element, which means it integrates seamlessly with HTML forms and participates in form submission, validation, and lifecycle events.

#### Key Features

- **Native Form Participation**: Internal shadow DOM form controls are automatically included in parent form submission
- **Structured Field Names**: Uses array notation (e.g., `users[0].firstName`, `users[1].email`) instead of JSON serialization
- **Native Semantics**: Follows browser-native form control behavior for checkboxes, radio buttons, and select elements
- **Form Lifecycle**: Responds to form disabled and reset events
- **No Interference**: Coexists with other form inputs without conflicts

#### Form Control Naming

Internal form controls receive structured `name` and `id` attributes based on:
- Component's `name` property (e.g., `"users"`)
- Row index (e.g., `0`, `1`, `2`)
- Field binding path from `data-bind` attribute (e.g., `"firstName"`, `"email"`)

**Naming Format:**
```
name="componentName[index].field"
id="componentName__index__field"
```

**Example:**
```html
<ck-editable-array name="users">
  <template slot="edit">
    <input type="text" data-bind="firstName" />
    <input type="email" data-bind="email" />
  </template>
</ck-editable-array>

<!-- Internal controls will have: -->
<!-- <input name="users[0].firstName" id="users__0__firstName" /> -->
<!-- <input name="users[0].email" id="users__0__email" /> -->
<!-- <input name="users[1].firstName" id="users__1__firstName" /> -->
<!-- <input name="users[1].email" id="users__1__email" /> -->
```

For nested paths (dots in `data-bind`), dots are preserved in `name` but converted to underscores in `id`:
```html
<input data-bind="address.city" />
<!-- Results in: -->
<!-- name="users[0].address.city" -->
<!-- id="users__0__address_city" -->
```

#### Form Submission Behavior

When a form containing `CkEditableArray` is submitted, the component's internal form controls are included using native browser mechanisms:

**Text Inputs, Textareas:**
- Always included with current value

**Checkboxes:**
- Included only if checked
- Value: `el.value` or `"on"` if no value attribute

**Radio Buttons:**
- Only the checked radio in each group is included

**Select (single):**
- Included with selected option's value

**Select (multiple):**
- Each selected option appended separately

**Disabled Controls:**
- Excluded from submission (native behavior)

**Example Form Submission:**
```html
<form id="myForm">
  <input type="email" name="contactEmail" value="admin@example.com" />
  
  <ck-editable-array name="users">
    <template slot="edit">
      <input type="text" data-bind="name" />
      <input type="checkbox" data-bind="active" value="yes" />
    </template>
  </ck-editable-array>
  
  <button type="submit">Submit</button>
</form>

<!-- When submitted with data = [{ name: "Alice", active: true }, { name: "Bob", active: false }]: -->
<!-- FormData will contain: -->
<!-- contactEmail=admin@example.com -->
<!-- users[0].name=Alice -->
<!-- users[0].active=yes -->
<!-- users[1].name=Bob -->
<!-- (Note: users[1].active is NOT included because checkbox is unchecked) -->
```

#### Form Lifecycle Callbacks

The component implements standard FACE callbacks:

**`formDisabledCallback(disabled: boolean)`**
- Called when parent form is disabled/enabled
- Automatically disables/enables all internal form controls
- Updates form value after state change

**`formResetCallback()`**
- Called when parent form is reset
- Restores component data to initial state (first value set via `data` property)
- Re-renders the component
- Updates form value after reset

**Example:**
```html
<form id="myForm">
  <ck-editable-array name="users" id="userArray">
    <template slot="edit">
      <input type="text" data-bind="name" />
    </template>
  </ck-editable-array>
  
  <button type="reset">Reset</button>
</form>

<script>
  const form = document.getElementById('myForm');
  const userArray = document.getElementById('userArray');
  
  // Set initial data
  userArray.data = [{ name: 'Alice' }];
  
  // User edits data
  userArray.data = [{ name: 'Bob' }, { name: 'Charlie' }];
  
  // Reset form - component restores to initial data
  form.reset(); // userArray.data is now [{ name: 'Alice' }]
</script>
```

#### Update Triggers

The component updates its form value (via `ElementInternals.setFormValue()`) at the following times:

1. **After render completes** (initial and subsequent renders)
2. **On user input** (`change` events from form controls)
3. **After save row operation**
4. **After cancel row operation**
5. **After data property changes**
6. **After formDisabledCallback**
7. **After formResetCallback**

This ensures the parent form always has current field values for submission.

#### Coexistence with Other Inputs

The component:
- ✅ Only queries form controls within its shadow DOM
- ✅ Never modifies external form inputs
- ✅ Uses namespaced keys (`componentName[index].field`) to avoid collisions
- ✅ Allows duplicate keys (standard FormData behavior)
- ✅ Does not use JSON serialization (submits as individual key-value pairs)

## Styling

### Shadow DOM Styles

The component uses the Constructable Stylesheet pattern for styling (with a fallback to `<style>` tags in older browsers).

#### CSS Custom Properties

The component exposes styling hooks via CSS custom properties (see `src/components/ck-editable-array/ck-editable-array.styles.ts`).

#### Classes

- `.ck-editable-array`: Main container
- `.message`: The greeting message heading
- `.subtitle`: The subtitle text
- `.rows`: Rows container (holds generated row wrappers)
- `.row`: Generated row wrapper (holds cloned template content)
- `.empty-state`: Empty state message (rendered when no display template exists)

#### Example Custom Styling

```css
ck-editable-array::part(...) {
  /* Shadow DOM parts not yet exposed; use CSS variables */
}

ck-editable-array {
  --cea-message-color: #ff6b6b;
}
```

### Button Customization

The component provides comprehensive button customization capabilities through both text customization and CSS theming.

#### Button Text Customization

All row action buttons support custom text via HTML attributes:

| Button | Attribute | Default | Use Cases |
|--------|-----------|---------|-----------|
| Edit | `button-edit-text` | "Edit" | Icons (✏️), emojis, translations ("Modifier", "編集") |
| Save | `button-save-text` | "Save" | Icons (✓, 💾), emojis, translations ("Enregistrer", "保存") |
| Cancel | `button-cancel-text` | "Cancel" | Icons (✗, ↩️), emojis, translations ("Annuler", "キャンセル") |
| Delete | `button-delete-text` | "Delete" | Icons (🗑️, ❌), emojis, translations ("Supprimer", "削除") |
| Restore | `button-restore-text` | "Restore" | Icons (↩️, 🔄), emojis, translations ("Restaurer", "復元") |

**Icon-Only Buttons:**
Set any button text attribute to an empty string to create icon-only buttons (combine with CSS for icon display):

```html
<ck-editable-array
  button-edit-text=""
  button-save-text=""
  button-cancel-text=""
  button-delete-text="">
  <!-- Buttons will be empty; use CSS ::part() to add background icons -->
</ck-editable-array>
```

**Example - Emoji Buttons:**
```html
<ck-editable-array
  button-edit-text="✏️"
  button-save-text="✓"
  button-cancel-text="✗"
  button-delete-text="🗑️"
  button-restore-text="↩️">
  <!-- Buttons display emojis instead of text -->
</ck-editable-array>
```

**Example - Translated Buttons:**
```html
<ck-editable-array
  button-edit-text="Modifier"
  button-save-text="Enregistrer"
  button-cancel-text="Annuler"
  button-delete-text="Supprimer"
  button-restore-text="Restaurer">
  <!-- French translations -->
</ck-editable-array>
```

#### Button CSS Parts for Theming

All buttons expose CSS Shadow Parts for external styling without breaking encapsulation:

| Part Name | Target | Description |
|-----------|--------|-------------|
| `button` | All buttons | Generic part for styling all buttons uniformly |
| `button-edit` | Edit button | Specific styling for edit button |
| `button-save` | Save button | Specific styling for save button |
| `button-cancel` | Cancel button | Specific styling for cancel button |
| `button-delete` | Delete button | Specific styling for delete/restore button |

**Example - Styling All Buttons:**
```css
ck-editable-array::part(button) {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
}
```

**Example - Specific Button Colors:**
```css
ck-editable-array::part(button-edit) {
  background: #3b82f6;
  color: white;
}

ck-editable-array::part(button-save) {
  background: #10b981;
  color: white;
}

ck-editable-array::part(button-cancel) {
  background: #6b7280;
  color: white;
}

ck-editable-array::part(button-delete) {
  background: #ef4444;
  color: white;
}
```

**Example - Icon-Only Buttons with CSS:**
```html
<ck-editable-array
  button-edit-text=""
  button-save-text=""
  button-cancel-text=""
  button-delete-text="">
</ck-editable-array>

<style>
  ck-editable-array::part(button) {
    width: 32px;
    height: 32px;
    padding: 0;
    background-size: 16px;
    background-position: center;
    background-repeat: no-repeat;
  }

  ck-editable-array::part(button-edit) {
    background-image: url('data:image/svg+xml,...');
  }

  ck-editable-array::part(button-save) {
    background-image: url('data:image/svg+xml,...');
  }
</style>
```

**Combining Text and Styling:**
```html
<ck-editable-array
  button-edit-text="✏️ Edit"
  button-save-text="✓ Save"
  button-cancel-text="✗ Cancel">
</ck-editable-array>

<style>
  ck-editable-array::part(button) {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  ck-editable-array::part(button-edit):hover {
    transform: scale(1.05);
  }
</style>
```

## Soft Delete

The component supports soft delete functionality via the `isDeleted` property:

- **Delete Button**: Clicking the delete button sets `isDeleted` to `true` on the row data
- **Restore Button**: When a row is deleted, the delete button changes to "Restore"; clicking it sets `isDeleted` to `false`
- **Button Labels**: Both buttons include contextual aria-labels (e.g., "Delete item 1", "Restore item 1")
- **Edit Button Disabled**: The Edit button is automatically disabled when a row is deleted, preventing edits to deleted items. It is re-enabled when the row is restored.
- **CSS Class**: Deleted rows automatically receive the `ck-deleted` class for custom styling
- **Form Integration**: A hidden checkbox input with `data-bind="isDeleted"` is included for form submission
- **Events**: Both delete and restore actions dispatch `rowchanged` and `datachanged` events

**Example**:
```javascript
const element = document.querySelector('ck-editable-array');
element.data = [{ name: 'Alice', completed: false }];

// User clicks delete button
// -> element.data[0].isDeleted becomes true
// -> Delete button changes to "Restore"
// -> Edit button becomes disabled
// -> Hidden checkbox gets checked
// -> rowchanged and datachanged events fire

// User clicks restore button
// -> element.data[0].isDeleted becomes false
// -> Button changes back to "Delete"
// -> Edit button becomes enabled
// -> Hidden checkbox gets unchecked
// -> Events fire again
```

## Accessibility

The component provides comprehensive accessibility support with valid ARIA semantics:

- **Semantic HTML**: Uses `<h1>`, `<p>` for headings and content
- **ARIA Roles & Labels** (List Pattern):
  - Container element: `role="region"` with `aria-label="Editable array display"`
  - Rows container: `role="list"` with `aria-label="Array items"`
  - Row elements: `role="listitem"` (valid children of list)
  - Bound elements within rows: No explicit role (inherit semantics from listitem context)
  - Status region: `role="status"` with `aria-live="polite"` for announcements
  - All buttons have contextual `aria-label` attributes (e.g., "Edit item 1", "Delete item 1", "Restore item 1")
  - Edit button has `aria-expanded` state indicating whether row is in edit mode
- **Keyboard Navigation**:
  - Arrow Up/Down keys navigate focus between rows
  - Alt+Arrow Up/Down moves the focused row up or down (requires `allow-reorder` attribute)
- **Live Region Announcements**: Mode transitions and actions are announced to screen readers
- **Focus Management**: Focus is restored to edit button after save/cancel operations

### ARIA Pattern Selection

The component uses the **list pattern** (`role="list"` + `role="listitem"`) rather than a grid pattern:
- **Rationale**: An editable array is semantically a list of items, not a tabular data structure
- **Validity**: List/listitem relationship is correct per WAI-ARIA specifications
- **Bound Elements**: Elements with `data-bind` attributes have no explicit role, allowing them to inherit natural semantics from their HTML element type and listitem context
- **Alternative**: A grid pattern (`role="grid"` + `role="row"` + `role="gridcell"`) would be more appropriate for tabular data with distinct columns

### Motion Preferences

The component respects the `prefers-reduced-motion` media query:
- **User Preference Detection**: Checks `window.matchMedia('(prefers-reduced-motion: reduce)')` before animating
- **Behavior**:
  - If user prefers reduced motion: Instant reordering (no animation)
  - If user has no preference: Smooth 250ms FLIP animation
- **Implementation**: Dual-layer protection
  - JavaScript check in `_animatedReorderData()` skips animation code entirely
  - CSS media query disables transitions/transforms as defensive measure
- **Accessibility Impact**: Protects users with vestibular disorders or motion sensitivity from discomfort

## Light DOM Templates

Consumers can provide light DOM templates to control what the component renders for each row.

### Display Template

The display template (`<template slot="display">`) defines the read-only view of each row.

### Template Contract

- The component looks for a descendant `HTMLTemplateElement` matching: `<template slot="display">...</template>`.
- The template is treated as a **row template**: it is cloned once for each item in the `data` array.
- The component renders rows into a container with `part="rows"`, clearing it on each render.
- If the template is missing, the component renders a helpful empty state in the shadow DOM rows region (instructions for adding the template).

### Data Binding (`data-bind`)

Within the template, any element with a `data-bind` attribute will have its content populated from the current row's data.

**Binding Behavior**:
- `data-bind="person.address.city"` resolves a dot-path against the row object
- If the resolved value is an array, it is joined with `", "` (display elements only)
- If the resolved value is `null`/`undefined`/missing, an empty string is rendered
- **Form Elements**: `<input>`, `<select>`, `<textarea>` have their `value` or `checked` properties set
- **Non-Form Elements**: `<span>`, `<div>`, `<label>`, etc. have their `textContent` set (never `innerHTML`)

**Form Element Binding**:
- `<input type="text">`, `<input type="email">`, `<input type="number">`, etc.: Sets `value` property
- `<input type="checkbox">`: Sets `checked` property (boolean conversion)
- `<input type="radio">`: Sets `checked` if value matches the input's value attribute
- `<select>`: Sets `value` property (selects matching option)
- `<textarea>`: Sets `value` property

**Form Control Attributes** (FR-009a):
Form controls in edit templates automatically receive `name` and `id` attributes:
- **name**: `${componentName}[${rowIndex}].${bindPath}` (e.g., `"users[0].firstName"`)
- **id**: `${componentName}__${rowIndex}__${bindPath}` (e.g., `"users__0__firstName"`)
- Dots in `bindPath` are replaced with underscores in `id` attributes for valid HTML
- Only applies to form elements (input, select, textarea), not display elements
- Supports nested paths (e.g., `data-bind="user.email"` → `name="items[0].user.email"`, `id="items__0__user_email"`)

**Example**:
```html
<template slot="display">
  <span data-bind="name"></span>
</template>

<template slot="edit">
  <input type="text" data-bind="name" />
  <input type="checkbox" data-bind="active" />
  <select data-bind="status">
    <option value="pending">Pending</option>
    <option value="done">Done</option>
  </select>
</template>
```

When `data = [{ name: 'Alice', active: true, status: 'done' }]` and component `name="users"`:
- Display template: `<span>` shows "Alice"
- Edit template for row 0:
  - `<input type="text">` has `value="Alice"`, `name="users[0].name"`, `id="users__0__name"`
  - `<input type="checkbox">` has `checked=true`, `name="users[0].active"`, `id="users__0__active"`
  - `<select>` has "Done" option selected, `name="users[0].status"`, `id="users__0__status"`

### Edit Template

The edit template (`<template slot="edit">`) defines the editing interface for each row.

**Edit Template Contract**:
- The component looks for a descendant `HTMLTemplateElement` matching: `<template slot="edit">...</template>`
- The template is cloned once for each item in the `data` array (same as display template)
- Edit template content is appended to each row element alongside display content
- Form elements with `data-bind` attributes are automatically populated with values from row data
- The component sets `data-has-edit-template` attribute on row elements when an edit template exists

**Usage Pattern**:
```html
<ck-editable-array>
  <template slot="display">
    <!-- Read-only view -->
    <span data-bind="name"></span>
  </template>

  <template slot="edit">
    <!-- Editable view -->
    <input type="text" data-bind="name" />
    <button type="submit">Save</button>
  </template>
</ck-editable-array>
```

**Bidirectional Data Binding** (FR-010):
When users interact with form controls in the edit template, changes automatically sync back to the component's data and update the corresponding display elements in real-time.

**How It Works**:
1. User types in `<input data-bind="name">` in row 0
2. Component updates `_data[0].name` with the new value
3. Display element `<span data-bind="name">` in row 0 updates automatically
4. `rowchanged` event fires with `{ index, row }`
5. `datachanged` event fires based on `datachangeMode` (debounced by default)
6. Only the affected row's display updates (performance optimized)

**Supported Events**:
- `input` event: text inputs, number inputs, email inputs, textareas (real-time updates)
- `change` event: select elements, checkboxes, and text inputs for commit when `datachangeMode="change"`
 
 **Security - Prototype Pollution Protection**:
 The component protects against prototype pollution during bidirectional binding. Any attempts to use reserved keys (`__proto__`, `constructor`, `prototype`) in `data-bind` paths are rejected.
 
 **Example**:
```javascript
const element = document.querySelector('ck-editable-array');
element.data = [{ name: 'Alice', completed: false }];

// User types "Alice Smith" into the input
// -> element.data[0].name becomes "Alice Smith"
// -> Display span automatically shows "Alice Smith"
// -> rowchanged event fires
// -> datachanged event fires based on datachangeMode

// User checks the checkbox
// -> element.data[0].completed becomes true
// -> Display span automatically shows "true"
// -> rowchanged event fires
// -> datachanged event fires based on datachangeMode
```

**Note**: The component renders both templates for each row but does NOT handle show/hide logic. Consumers should use CSS or JavaScript to toggle visibility between display and edit modes based on their application's needs.

### Notes

- **Security - Template Sanitization**: Templates are sanitized before rendering to prevent XSS attacks:
  - `<script>` tags are removed
  - Inline event handlers (attributes starting with `on`) are removed
  - Dangerous URL protocols (`javascript:`, `vbscript:`, `data:`) are stripped from `href`, `src`, `xlink:href`, and `formaction` attributes
  - `srcdoc` attributes are removed from iframes (can contain executable HTML)
  - Safe URLs (http, https, relative) are preserved
- Wrapper class attributes (`root-class`, `rows-class`, `row-class`) apply to generated wrapper elements only; the template markup is not modified
- Wrapper class selectors only apply within the component's Shadow DOM; style via CSS custom properties / `::part(rows)`, or include a `<style>` inside templates when targeting wrapper classes is required
- Form element value binding happens automatically during render; no manual value setting required

## Browser Support

- Modern browsers with Shadow DOM v1 support
- Graceful fallback for Constructable Stylesheet (uses `<style>` tags)
- `structuredClone()` available in modern browsers; JSON fallback for older browsers

## Implementation Notes

### Rendering Pipeline

1. **connectedCallback**: Triggered when element is inserted into the DOM
   - Calls `render()`

2. **attributeChangedCallback**: Triggered when observed attributes change
   - Calls `render()` if value differs from old value

3. **render()**: Updates shadow DOM content
   - Renders greeting message with current name

### State Management

- Internal state: `_data` (private array field)
- Public access: `get data()` / `set data(value)` with deep cloning

### Performance Considerations

- Deep cloning on every get/set may impact performance with large datasets
- Full `datachanged` payloads are debounced by default; use `rowchanged` for per-row updates
- Constructable Stylesheets are parsed once at module load time (efficient)
- Shadow DOM encapsulation prevents style leakage
