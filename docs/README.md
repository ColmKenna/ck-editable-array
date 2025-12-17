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

### `name: string`

**Type**: String
**Default**: "World"
**Description**: The name displayed in the greeting message
**Synced with Attribute**: Yes

```javascript
const element = document.querySelector('ck-editable-array');
element.name = 'Developer';
console.log(element.name); // 'Developer'
```

## Attributes

### `name`
- **Type**: String
- **Default**: "World"
- **HTML**: `<ck-editable-array name="Developer"></ck-editable-array>`

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

**Note**: The `data` property is not exposed as an attribute since arrays cannot be represented in HTML attributes.

## Display Template (Light DOM)

Provide a light DOM template to render custom display content inside the component’s shadow DOM:

```html
<ck-editable-array>
  <template slot="display">
    <div>
      <strong>Custom display</strong>
      <p>This content is cloned into the shadow DOM.</p>
    </div>
  </template>
</ck-editable-array>
```

The template is treated as a **row template** and is cloned once for each item in `element.data`, into a `part="rows"` container.

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

  // Greeting display
  get name(): string;
  set name(value: string);
}
```

### Methods

Currently no custom methods beyond standard HTMLElement interface.

### Events

The component emits a `datachanged` event whenever the `data` property is set.

- **Event**: `datachanged`
- **Bubbles / Composed**: Yes / Yes
- **Payload**: `event.detail.data` (deep-cloned `unknown[]`)

```js
const el = document.querySelector('ck-editable-array');
el.addEventListener('datachanged', (e) => {
  console.log('datachanged', e.detail.data);
});
```

## Contributing

Found a bug or have a suggestion? Please open an issue on [GitHub](https://github.com/ColmKenna/ckWebComponents).

## License

MIT - See LICENSE file for details.
