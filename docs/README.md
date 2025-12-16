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

### `color: string`

**Type**: String
**Default**: "#333"
**Description**: The text color for the message
**Synced with Attribute**: Yes

```javascript
const element = document.querySelector('ck-editable-array');
element.color = '#ff6b6b';
console.log(element.color); // '#ff6b6b'
```

## Attributes

### `name`
- **Type**: String
- **Default**: "World"
- **HTML**: `<ck-editable-array name="Developer"></ck-editable-array>`

### `color`
- **Type**: String
- **Default**: "#333"
- **HTML**: `<ck-editable-array color="#ff6b6b"></ck-editable-array>`

**Note**: The `data` property is not exposed as an attribute since arrays cannot be represented in HTML attributes.

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

  get color(): string;
  set color(value: string);
}
```

### Methods

Currently no custom methods beyond standard HTMLElement interface.

### Events

Currently no custom events. Future versions may emit:
- `datachange` - When data is updated
- `dataretrieved` - When data is accessed

## Contributing

Found a bug or have a suggestion? Please open an issue on [GitHub](https://github.com/ColmKenna/ckWebComponents).

## License

MIT - See LICENSE file for details.

