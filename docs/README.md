# CkEditableArray Component - User Guide

## Overview

`CkEditableArray` is a powerful web component for managing and displaying editable arrays with a clean, modern interface. It provides a public API for both properties and attributes, making it easy to integrate into any web application.

## Quick Start

### Basic Usage

```html
<ck-editable-array></ck-editable-array>

<script type="module">
  import '@colmkenna/ck-webcomponents';

  const element = document.querySelector('ck-editable-array');

  // Get default data (empty array)
  console.log(element.data); // []
</script>
```

### Setting Data

```javascript
const element = document.querySelector('ck-editable-array');

// Set data with an array
element.data = [
  { id: 1, name: 'Item 1', completed: false },
  { id: 2, name: 'Item 2', completed: true },
];

// Get data (returns a deep clone)
const currentData = element.data;
console.log(currentData);
// [
//   { id: 1, name: 'Item 1', completed: false },
//   { id: 2, name: 'Item 2', completed: true },
// ]
```

### Data Immutability

The component ensures that modifications to data don't leak between consumer code and internal state:

```javascript
const element = document.querySelector('ck-editable-array');

// Set initial data
const originalData = [{ id: 1, name: 'Original' }];
element.data = originalData;

// Modify the original array (consumer code)
originalData[0].name = 'Modified';

// Component data remains unchanged
console.log(element.data[0].name); // 'Original' ✓

// Get data from component
const retrievedData = element.data;
retrievedData[0].name = 'Changed';

// Modify retrieved data doesn't affect component
console.log(element.data[0].name); // 'Original' ✓
```

## Properties

### `data: unknown[]`

Manages the component's data array with automatic normalization and deep cloning.

**Features:**
- **Get**: Returns a deep clone of the internal data
- **Set**: Accepts any value; normalizes non-arrays to `[]`; stores a deep clone
- **Deep Cloning**: Uses `structuredClone()` (modern browsers) with fallback to JSON serialization
- **Immutability**: Changes to data in consumer code don't affect the component

**Examples:**

```javascript
const element = document.querySelector('ck-editable-array');

// Setting valid arrays
element.data = [1, 2, 3];
element.data = [{ id: 1 }, { id: 2 }];
element.data = [{ nested: { deep: { value: 'test' } } }];

// Non-arrays are normalized to []
element.data = null;        // → []
element.data = undefined;   // → []
element.data = 'string';    // → []
element.data = 123;         // → []
element.data = { obj: 1 };  // → []

// Get always returns a new clone
const data1 = element.data;
const data2 = element.data;
console.log(data1 === data2); // false (different references)
console.log(data1.length === data2.length); // true (same content)
```

### `datachangeMode: "debounced" | "change" | "save"`

Controls when `datachanged` events fire during user edits.

**Defaults:** `"debounced"` (fires after a short pause)

```javascript
const element = document.querySelector('ck-editable-array');
element.datachangeMode = 'change'; // fire datachanged on change/blur
```

### `datachangeDebounce: number`

Debounce delay (ms) used when `datachangeMode` is `"debounced"`.

```javascript
const element = document.querySelector('ck-editable-array');
element.datachangeDebounce = 250;
```

### `name: string`

**Type**: String
**Default**: `"items"`
**Description**: The component name used for:
- Greeting message display ("Hello, {name}!")
- Form control `name` attributes (e.g., `"users[0].firstName"`)
- Form control `id` attributes (e.g., `"users__0__firstName"`)

**Synced with Attribute**: Yes

```javascript
const element = document.querySelector('ck-editable-array');
element.name = 'users';
console.log(element.name); // 'users'

// Form controls in edit template automatically get:
// <input data-bind="firstName" name="users[0].firstName" id="users__0__firstName" />
// <input data-bind="email" name="users[1].email" id="users__1__email" />
```

## Attributes

### `name`
- **Type**: String
- **Default**: `"items"`
- **HTML**: `<ck-editable-array name="users"></ck-editable-array>`
- **Purpose**: Sets component name for form submission and element IDs

### `root-class`
- **Type**: String
- **Default**: `""`
- **HTML**: `<ck-editable-array root-class="my-root"></ck-editable-array>`
- **Description**: Space-separated classes added to the generated root wrapper inside the shadow DOM

### `rows-class`
- **Type**: String
- **Default**: `""`
- **HTML**: `<ck-editable-array rows-class="my-rows"></ck-editable-array>`
- **Description**: Space-separated classes added to the generated rows wrapper inside the shadow DOM

### `row-class`
- **Type**: String
- **Default**: `""`
- **HTML**: `<ck-editable-array row-class="my-row"></ck-editable-array>`
- **Description**: Space-separated classes added to each generated row wrapper inside the shadow DOM

### `datachange-mode`
- **Type**: `"debounced" | "change" | "save"`
- **Default**: `"debounced"`
- **HTML**: `<ck-editable-array datachange-mode="debounced"></ck-editable-array>`
- **Description**: Controls when `datachanged` fires during user edits

### `datachange-debounce`
- **Type**: Number (milliseconds)
- **Default**: `300`
- **HTML**: `<ck-editable-array datachange-debounce="300"></ck-editable-array>`
- **Description**: Debounce delay used when `datachange-mode="debounced"`

**Note**: The `data` property is not exposed as an attribute since arrays cannot be represented in HTML attributes.

## Row Actions

Each row in the component includes a set of action buttons:

- **Edit Button**: Toggles between display and edit modes for the row
- **Save Button** (visible in edit mode): Commits changes and returns to display mode
- **Cancel Button** (visible in edit mode): Discards changes and returns to display mode
- **Delete Button**: Performs a soft delete by setting `isDeleted` property to `true`; changes to "Restore" when deleted
- **Restore Button**: Restores a deleted row by setting `isDeleted` property to `false`

All action buttons include accessible `aria-label` attributes with row context (e.g., "Edit item 1", "Delete item 1", "Restore item 1").

### Soft Delete Feature

When you click the delete button on a row:
1. The `isDeleted` property is set to `true` in the row data
2. The delete button changes to "Restore"
3. The **Edit button is disabled** to prevent editing deleted rows
4. The row receives the `ck-deleted` CSS class for styling
5. A hidden checkbox input (with `data-bind="isDeleted"`) is checked
6. The `rowchanged` and `datachanged` events are dispatched

Clicking the restore button reverses this process:
1. The `isDeleted` property is set to `false`
2. The button changes back to "Delete"
3. The **Edit button is enabled** again
4. The `ck-deleted` class is removed from the row
5. The hidden checkbox is unchecked
6. Events are dispatched again

**Example**:
```javascript
const element = document.querySelector('ck-editable-array');
element.data = [{ name: 'Alice', completed: false }];

// User clicks delete button
element.addEventListener('datachanged', (e) => {
  console.log(e.detail.data[0]);
  // { name: 'Alice', completed: false, isDeleted: true }
});

// User clicks restore button
element.addEventListener('datachanged', (e) => {
  console.log(e.detail.data[0]);
  // { name: 'Alice', completed: false, isDeleted: false }
});
```

### Styling Deleted Rows

Deleted rows automatically receive the `ck-deleted` CSS class. You can use this class to customize the appearance of deleted rows:

```html
<ck-editable-array name="items">
  <template slot="display">
    <style>
      .row.ck-deleted {
        opacity: 0.6;
        text-decoration: line-through;
        background-color: #f5f5f5;
      }
    </style>
    <div>
      <span data-bind="name"></span>
    </div>
  </template>
</ck-editable-array>
```

The `ck-deleted` class is automatically added when a row is deleted and removed when restored, making it easy to provide visual feedback to users about the deletion status.

## Templates (Light DOM)

### Display Template

Provide a light DOM display template to render custom content inside the component's shadow DOM:

```html
<ck-editable-array>
  <template slot="display">
    <div>
      <strong data-bind="name"></strong>
      <p data-bind="description"></p>
    </div>
  </template>
</ck-editable-array>
```

The template is treated as a **row template** and is cloned once for each item in `element.data`, into a `part="rows"` container.

### Edit Template

Provide a light DOM edit template to render editable form inputs:

```html
<ck-editable-array>
  <template slot="display">
    <span data-bind="name"></span>
  </template>

  <template slot="edit">
    <form>
      <input type="text" data-bind="name" />
      <button type="submit">Save</button>
    </form>
  </template>
</ck-editable-array>
```

**Key Features**:
- Edit template is cloned alongside display template for each row
- Form inputs (`<input>`, `<select>`, `<textarea>`) with `data-bind` attributes are **automatically populated** with values from row data
- Checkboxes have their `checked` property set based on boolean values
- Select elements have the matching option automatically selected
- **Form controls automatically receive `name` and `id` attributes** for proper form submission and accessibility:
  - `name` format: `${componentName}[${rowIndex}].${bindPath}` (e.g., `"users[0].firstName"`)
  - `id` format: `${componentName}__${rowIndex}__${bindPath}` (e.g., `"users__0__firstName"`)
- **Bidirectional data binding**: User input changes automatically update both the component's data AND the corresponding display elements in real-time
- `rowchanged` fires on each input/change with `{ index, row }`
- `datachanged` fires on a configurable cadence (`datachange-mode`)
- The component does NOT handle show/hide logic - use CSS or JavaScript to toggle between display and edit modes

**Live Updates Example**:
```javascript
const element = document.querySelector('ck-editable-array');
element.data = [{ name: 'Alice' }];

// When user types "Alice Smith" in the input:
// 1. element.data[0].name automatically becomes "Alice Smith"
// 2. Display <span data-bind="name"> automatically shows "Alice Smith"
// 3. rowchanged fires with { index, row }
// 4. datachanged fires based on datachange-mode (debounced by default)

element.addEventListener('datachanged', (e) => {
  console.log('Data updated:', e.detail.data);
  // Can save to server, update other UI, etc.
});
```

**Example with Data Binding**:
```javascript
const element = document.querySelector('ck-editable-array');
element.data = [
  { name: 'Alice', active: true, role: 'Admin' },
  { name: 'Bob', active: false, role: 'User' }
];
```

Given the edit template:
```html
<template slot="edit">
  <input type="text" data-bind="name" />
  <input type="checkbox" data-bind="active" />
  <select data-bind="role">
    <option value="Admin">Admin</option>
    <option value="User">User</option>
  </select>
</template>
```

The component will automatically (assuming `name="users"`):
- **Row 0**: text input has `value="Alice"`, `name="users[0].name"`, `id="users__0__name"`;
  checkbox has `checked=true`, `name="users[0].active"`, `id="users__0__active"`;
  select has "Admin" selected, `name="users[0].role"`, `id="users__0__role"`
- **Row 1**: text input has `value="Bob"`, `name="users[1].name"`, `id="users__1__name"`;
  checkbox has `checked=false`, `name="users[1].active"`, `id="users__1__active"`;
  select has "User" selected, `name="users[1].role"`, `id="users__1__role"`

### Wrapper Class Customization

To add consumer-controlled class hooks to the generated wrappers, set the wrapper class attributes:

```html
<ck-editable-array root-class="my-root" rows-class="my-rows" row-class="my-row">
  <template slot="display">
    <span data-bind="name"></span>
  </template>
</ck-editable-array>
```

- These classes are added in addition to the built-in `.ck-editable-array`, `.rows`, and `.row` classes.
- The template markup is not modified (NFR-U-001).
- Because these wrappers are inside Shadow DOM, page-level CSS can’t directly target them; use CSS custom properties / `::part(rows)` for general styling, or include a `<style>` inside your `display` template when you need selectors targeting the wrapper classes.

Example (styling wrapper classes from inside the template):

```html
<ck-editable-array row-class="my-row">
  <template slot="display">
    <style>
      .row.my-row { border: 1px solid #ddd; border-radius: 8px; }
    </style>
    <span data-bind="name"></span>
  </template>
</ck-editable-array>
```

### Data Binding with `data-bind`

Use `data-bind` to bind text from each row object into the cloned template:

```html
<ck-editable-array id="users">
  <template slot="display">
    <div>
      <strong data-bind="name"></strong>
      <span data-bind="address.city"></span>
      <small data-bind="tags"></small>
    </div>
  </template>
</ck-editable-array>
<script type="module">
  const el = document.querySelector('#users');
  el.data = [{ name: 'Ada', address: { city: 'Dublin' }, tags: ['a', 'b'] }];
</script>
```

- Dot-paths like `address.city` are supported.
- Arrays are joined with `", "`.
- Values are assigned via `textContent` (not `innerHTML`).

If no `<template slot="display">` is present, the component renders a small empty-state message in its shadow DOM explaining how to add one.

## Practical Examples

### Example 1: Task Manager

```html
<ck-editable-array id="taskManager"></ck-editable-array>

<script type="module">
  import '@colmkenna/ck-webcomponents';

  const manager = document.querySelector('#taskManager');

  // Initialize tasks
  manager.data = [
    { id: 1, title: 'Learn Web Components', done: true },
    { id: 2, title: 'Build a demo app', done: false },
    { id: 3, title: 'Deploy to production', done: false },
  ];

  // Safe to modify data from consumer code
  const tasks = manager.data;
  tasks.forEach(task => {
    if (task.id === 2) task.done = true; // Doesn't affect component
  });

  console.log(manager.data[1].done); // false (unchanged)
</script>
```

### Example 2: Dynamic Data Update

```javascript
const element = document.querySelector('ck-editable-array');

// Fetch data from API
fetch('/api/items')
  .then(res => res.json())
  .then(items => {
    element.data = items; // Automatically deep cloned
  });

// Later: add a new item
const currentData = element.data;
currentData.push({ id: 100, name: 'New Item' });

// Doesn't modify component (since currentData is a clone)
console.log(element.data.length); // Original count
```

### Example 3: Complex Nested Data

```javascript
const element = document.querySelector('ck-editable-array');

const complexData = [
  {
    id: 1,
    user: {
      name: 'Alice',
      email: 'alice@example.com',
      profile: {
        avatar: 'https://...',
        verified: true,
      },
    },
    tags: ['developer', 'designer'],
  },
  {
    id: 2,
    user: {
      name: 'Bob',
      email: 'bob@example.com',
      profile: {
        avatar: 'https://...',
        verified: false,
      },
    },
    tags: ['manager'],
  },
];

element.data = complexData;

// Get data and modify deeply nested content
const retrieved = element.data;
retrieved[0].user.profile.verified = false;
retrieved[0].tags.push('newTag');

// Component data is unchanged
console.log(element.data[0].user.profile.verified); // true (unchanged)
console.log(element.data[0].tags.includes('newTag')); // false (unchanged)
```

## Browser Support

| Feature               | Browser Support                  |
|-----------------------|----------------------------------|
| Web Components        | Modern browsers (Chrome, Firefox, Safari, Edge) |
| `structuredClone()`   | ES2022+ (Chrome 98+, Firefox 94+, Safari 16+) |
| JSON Fallback Clone   | All browsers                     |
| Constructable CSS     | Modern browsers                  |
| `<style>` Fallback    | All browsers                     |

## Performance Considerations

1. **Deep Cloning**: Every `get` and `set` operation clones the data. For very large datasets, consider:
   - Batching updates
   - Using references to immutable data structures
   - Storing metadata separately from large data arrays

   For edit-heavy UIs, prefer listening to `rowchanged` and keep `datachange-mode="debounced"` (or `"change"`/`"save"`) to avoid cloning the full dataset on every keystroke.

2. **Rendering**: The component renders a greeting message. For data-heavy UIs, consider:
   - Using this component as a data manager
   - Creating separate components for data display/editing

## Troubleshooting

### Data Not Updating?

Ensure you're using the `data` property, not an attribute:

```javascript
// ✓ Correct
element.data = newArray;

// ✗ Incorrect (no effect)
element.setAttribute('data', JSON.stringify(newArray));
```

### Mutations Not Persisting?

Remember, mutations to retrieved data don't affect the component (by design):

```javascript
// Get data
const data = element.data;
data[0].changed = true;

// This change is not reflected in the component
console.log(element.data[0].changed); // undefined

// To update the component, set data again
element.data = data; // This sets a clone
```

### Performance Issues with Large Data?

The deep cloning strategy prioritizes immutability over performance. If you're working with very large datasets:

```javascript
// Consider lazy loading or virtual scrolling
// Store metadata separately from data

// Profile your usage:
console.time('cloning');
element.data = largeArray;
console.timeEnd('cloning');
```

## API Reference

### Properties

```typescript
class CkEditableArray extends HTMLElement {
  // Data management (auto-deep-clone)
  get data(): unknown[];
  set data(value: unknown);

  // Data change cadence
  get datachangeMode(): 'debounced' | 'change' | 'save';
  set datachangeMode(value: 'debounced' | 'change' | 'save');
  get datachangeDebounce(): number;
  set datachangeDebounce(value: number);

  // Greeting display
  get name(): string;
  set name(value: string);
}
```

### Methods

Currently no custom methods beyond standard HTMLElement interface.

### Events

The component emits `datachanged` when the `data` property is set and based on `datachange-mode` for user edits. It also emits `rowchanged` on each row update.

- **Event**: `datachanged`
- **Bubbles / Composed**: Yes / Yes
- **Payload**: `event.detail.data` (deep-cloned `unknown[]`)
- **Cadence**: Debounced by default (300 ms), or on `change` / `save` depending on `datachange-mode`

```js
const el = document.querySelector('ck-editable-array');
el.addEventListener('datachanged', (e) => {
  console.log('datachanged', e.detail.data);
});
```

- **Event**: `rowchanged`
- **Bubbles / Composed**: Yes / Yes
- **Payload**: `event.detail.index` and `event.detail.row` (cloned row)

```js
const el = document.querySelector('ck-editable-array');
el.addEventListener('rowchanged', (e) => {
  console.log('rowchanged', e.detail.index, e.detail.row);
});
```

## Contributing

Found a bug or have a suggestion? Please open an issue on [GitHub](https://github.com/ColmKenna/ckWebComponents).

## License

MIT - See LICENSE file for details.
