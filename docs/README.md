# ck-editable-array

`ck-editable-array` is a web component that renders repeatable rows based on templates you supply. Provide `template[slot="display"]` for read-only views and `template[slot="edit"]` for inputs.

## Installation

Install via npm:

```bash
npm install @colmkenna/ck-editable-array
```

Or via yarn:

```bash
yarn add @colmkenna/ck-editable-array
```

Then import in your JavaScript/TypeScript:

```javascript
import '@colmkenna/ck-editable-array';
```

Or include directly in HTML:

```html
<script type="module" src="path/to/ck-editable-array.js"></script>
```

## Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 53+ | Full support |
| Firefox | 63+ | Full support |
| Safari | 10.1+ | Full support |
| Edge | 79+ | Full support (Chromium-based) |
| Edge Legacy | Not supported | Use polyfills for Shadow DOM and Custom Elements |

**Requirements:**
- Custom Elements v1
- Shadow DOM v1
- ES6 support

For older browsers, use the [webcomponents polyfills](https://github.com/webcomponents/polyfills).

## Quick start

```html
<ck-editable-array id="letters">
  <!-- Template for displaying rows in read-only mode -->
  <template slot="display">
    <div class="row-display">
      <span data-bind="value"></span>
      <button data-action="toggle">Edit</button>
    </div>
  </template>
  
  <!-- Template for editing rows -->
  <template slot="edit">
    <div class="row-edit">
      <input data-bind="value" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>

<script>
  // Get reference to the component
  const el = document.getElementById('letters');
  
  // Set initial data (can be primitives or objects)
  el.data = ['A', 'B', 'C'];
  
  // Listen for data changes
  el.addEventListener('datachanged', event => {
    console.log('Updated array:', event.detail.data);
    // Send to server, update state, etc.
  });
</script>
```

## Key Features
- **Schema-driven Validation**: Define validation rules with JSON Schema-like syntax
- **Immediate Feedback**: Validation runs on input change for instant error display
- **Accessibility**: Full ARIA support with `aria-invalid`, `aria-describedby`, and live regions
- **Save Control**: Save button automatically disabled when validation fails
- **Clear Error Messages**: Field-level and row-level error indicators
- **Nested Properties**: Support for dot notation in data binding (e.g., `person.name`)
- **Soft Delete**: Mark rows as deleted without removing them from the array
- **Exclusive Locking**: Only one row can be edited at a time

## API Reference

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `""` | Base name for form field naming. When set, inputs get names like `name[0].fieldName` |
| `readonly` | boolean | `false` | When present, disables all editing functionality (add, edit, delete, restore) |

**Example:**
```html
<!-- With name attribute for form integration -->
<ck-editable-array name="contacts">
  <!-- inputs will have names like: contacts[0].name, contacts[0].email -->
</ck-editable-array>

<!-- Readonly mode -->
<ck-editable-array readonly>
  <!-- All edit buttons and inputs are disabled -->
</ck-editable-array>
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Array<any>` | **Getter/Setter.** The array of row data. Can be primitives (strings, numbers) or objects. Setting this property triggers a re-render. Reading returns a deep clone for immutability. |
| `schema` | `object \| null` | **Getter/Setter.** Validation schema in JSON Schema-like format. Supports `required` array and `properties` with `minLength` constraints. Set to `null` to disable validation. |
| `newItemFactory` | `() => any` | **Getter/Setter.** Factory function that creates new items when the Add button is clicked. Default returns an empty object `{}`. Customize to provide default values for new rows. |

**Example:**
```javascript
const el = document.querySelector('ck-editable-array');

// Set data (primitives)
el.data = ['Apple', 'Banana', 'Cherry'];

// Set data (objects)
el.data = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
];

// Get data (returns a clone)
const currentData = el.data;
console.log(currentData); // Safe to mutate without affecting component

// Set validation schema
el.schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', minLength: 5 }
  },
  required: ['name', 'email']
};

// Customize new item factory
el.newItemFactory = () => ({
  name: '',
  email: '',
  role: 'user', // Default value
  active: true
});
```

### Methods

The component does not expose public methods. All interactions are done through properties, attributes, and events.

### Events

All events bubble and are composed (cross shadow DOM boundaries).

| Event | Cancelable | Detail | Description |
|-------|-----------|--------|-------------|
| `datachanged` | No | `{ data: Array }` | Fired when data changes (add, save, delete, restore). Detail contains the complete current array. |
| `beforetogglemode` | **Yes** | `{ index: number, from: 'display'\|'edit', to: 'display'\|'edit' }` | Fired before a row switches modes. Call `preventDefault()` to block the mode change. |
| `aftertogglemode` | No | `{ index: number, mode: 'display'\|'edit' }` | Fired after a row successfully switches modes. |

**Example:**
```javascript
const el = document.querySelector('ck-editable-array');

// Listen for data changes
el.addEventListener('datachanged', (e) => {
  console.log('New data:', e.detail.data);
  // Sync with server, update app state, etc.
});

// Prevent specific rows from being edited
el.addEventListener('beforetogglemode', (e) => {
  if (e.detail.index === 0 && e.detail.to === 'edit') {
    e.preventDefault(); // Block editing of first row
    console.log('First row cannot be edited');
  }
});

// Track when rows enter edit mode
el.addEventListener('aftertogglemode', (e) => {
  if (e.detail.mode === 'edit') {
    console.log(`Row ${e.detail.index} is now being edited`);
  }
});
```

### Slots

| Slot | Required | Description |
|------|----------|-------------|
| `display` | Yes | Template for rendering rows in display (read-only) mode |
| `edit` | Yes | Template for rendering rows in edit mode |
| `styles` | No | Custom CSS styles to inject into shadow DOM |
| `add-button` | No | Custom template for the Add button |
| `button-edit` | No | Custom button to replace default Edit button |
| `button-save` | No | Custom button to replace default Save button |
| `button-cancel` | No | Custom button to replace default Cancel button |
| `button-delete` | No | Custom button to replace default Delete button |
| `button-restore` | No | Custom button to replace default Restore button |

**Example:**
```html
<ck-editable-array>
  <template slot="display">
    <div><span data-bind="name"></span></div>
  </template>
  
  <template slot="edit">
    <div><input data-bind="name" /></div>
  </template>
  
  <!-- Custom styles -->
  <style slot="styles">
    .row-display { padding: 10px; border: 1px solid #ccc; }
    .row-edit { background: #f0f0f0; }
  </style>
  
  <!-- Custom Add button -->
  <template slot="add-button">
    <button data-action="add">➕ Add New Item</button>
  </template>
</ck-editable-array>
```

### CSS Parts

Use CSS `::part()` selector to style shadow DOM elements from outside.

| Part | Description |
|------|-------------|
| `root` | The root container element |
| `rows` | Container for all row elements |
| `add-button` | Container for the Add button |

**Example:**
```css
/* Style the root container */
ck-editable-array::part(root) {
  border: 2px solid #333;
  padding: 20px;
  border-radius: 8px;
}

/* Style the rows container */
ck-editable-array::part(rows) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Style the add button container */
ck-editable-array::part(add-button) {
  margin-top: 15px;
  text-align: center;
}
```

### Data Binding Attributes

Use these attributes in your templates to bind data and actions.

| Attribute | Usage | Description |
|-----------|-------|-------------|
| `data-bind="fieldName"` | On any element | Binds element content/value to a data field. Supports nested paths like `person.name` |
| `data-action="add"` | On buttons | Triggers add new row action |
| `data-action="toggle"` | On buttons | Toggles between display and edit mode |
| `data-action="save"` | On buttons | Saves changes and exits edit mode |
| `data-action="cancel"` | On buttons | Discards changes and exits edit mode |
| `data-action="delete"` | On buttons | Soft-deletes a row (sets `deleted: true`) |
| `data-action="restore"` | On buttons | Restores a deleted row (sets `deleted: false`) |

### Validation Attributes

Use these attributes in your edit template to display validation errors.

| Attribute | Usage | Description |
|-----------|-------|-------------|
| `data-field-error="fieldName"` | On any element | Displays error message for a specific field |
| `data-error-count` | On any element | Displays total error count (e.g., "2 errors") |
| `data-error-summary` | On any element | Displays all error messages (for screen readers) |

**Automatic Attributes:**
- `data-invalid` - Added to input fields that fail validation
- `data-row-invalid` - Added to edit wrapper when row has errors
- `aria-invalid="true"` - Added to invalid inputs for accessibility
- `aria-describedby` - Links inputs to their error messages

## Behavior cheatsheet
- Setting `data` accepts arrays of primitives or objects (object fields map to `data-bind` names).
- Empty, null, or undefined inputs normalize to `[]`.
- User edits update the internal array, re-render the display template, and emit a `datachanged` event that bubbles and is composed.
- No change events fire until something actually changes.
- Validation runs automatically on input change and when entering edit mode.


## Validation

The component supports schema-driven validation with comprehensive accessibility features.

### Setting a Schema

```javascript
const el = document.getElementById('myArray');
el.schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', minLength: 1 },
  },
  required: ['name', 'email'],
};
```

### Validation Features

- **Required Fields**: Fields listed in `schema.required` must have non-empty values
- **Field Constraints**: Supports `minLength` validation for string fields
- **Real-time Validation**: Validates on input change and when entering edit mode
- **Save Button Control**: Save button is automatically disabled when validation fails

### Error Display

The component provides multiple ways to display validation errors:

```html
<template slot="edit">
  <div class="row-edit">
    <!-- Error summary for screen readers -->
    <div data-error-summary role="alert" aria-live="polite"></div>
    
    <!-- Field with error message -->
    <input data-bind="name" />
    <span data-field-error="name"></span>
    
    <!-- Error count badge -->
    <button data-action="save">Save</button>
    <span data-error-count></span>
  </div>
</template>
```

### Validation Indicators

- **`data-row-invalid`**: Added to edit wrapper when row has validation errors
- **`data-invalid`**: Added to individual input fields that fail validation
- **`data-field-error="fieldName"`**: Element that displays error message for a field
- **`data-error-count`**: Element that displays total error count (e.g., "2 errors")
- **`data-error-summary`**: Element that displays all error messages for screen readers

### Accessibility

The component includes comprehensive ARIA support:

- **`aria-invalid="true"`**: Added to invalid input fields
- **`aria-describedby`**: Links inputs to their error messages
- **`role="alert"`**: Error summaries use alert role for immediate announcement
- **`aria-live="polite"`**: Error summaries announce changes to screen readers

### Example with Validation

```html
<ck-editable-array id="contacts">
  <template slot="display">
    <div class="row-display">
      <span data-bind="name"></span> — <span data-bind="email"></span>
      <button data-action="toggle">Edit</button>
    </div>
  </template>

  <template slot="edit">
    <div class="row-edit">
      <!-- Accessible error summary -->
      <div class="error-summary" 
           data-error-summary 
           role="alert" 
           aria-live="polite"></div>
      
      <!-- Name field with error display -->
      <label>Name *</label>
      <input data-bind="name" />
      <span class="field-error" data-field-error="name"></span>
      
      <!-- Email field with error display -->
      <label>Email *</label>
      <input data-bind="email" />
      <span class="field-error" data-field-error="email"></span>
      
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>

<script>
  const el = document.getElementById('contacts');
  
  // Set validation schema
  el.schema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', minLength: 1 },
    },
    required: ['name', 'email'],
  };
  
  // Set initial data
  el.data = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: '', email: '' } // This row will show errors in edit mode
  ];
</script>
```

### Styling Validation States

Use CSS to style validation states:

```css
/* Invalid row styling */
.row-edit[data-row-invalid] {
  border: 2px solid red;
  background: #fff5f5;
}

/* Invalid field styling */
input[data-invalid] {
  border-color: red;
  background: #fff5f5;
}

/* Error message styling */
.field-error {
  color: red;
  font-size: 13px;
}

/* Hide empty error messages */
.field-error:empty {
  display: none;
}

/* Error summary styling */
[data-error-summary] {
  background: #dc3545;
  color: white;
  padding: 12px;
  border-radius: 4px;
}

[data-error-summary]:empty {
  display: none;
}
```



## Nested Property Support

The component supports nested property paths in `data-bind` attributes using dot notation.

### Basic Example

```html
<ck-editable-array id="contacts">
  <template slot="display">
    <div class="row-display">
      <span data-bind="person.name"></span> — 
      <span data-bind="person.email"></span>
      <button data-action="toggle">Edit</button>
    </div>
  </template>

  <template slot="edit">
    <div class="row-edit">
      <input data-bind="person.name" placeholder="Name" />
      <input data-bind="person.email" placeholder="Email" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>

<script>
  const el = document.getElementById('contacts');
  el.data = [
    { person: { name: 'Alice', email: 'alice@example.com' } },
    { person: { name: 'Bob', email: 'bob@example.com' } }
  ];
</script>
```

### Deep Cloning & Immutability

The component provides strong immutability guarantees:

- **Deep cloning**: Nested objects are fully cloned using `JSON.parse(JSON.stringify())`
- **External mutations protected**: Mutating source data after assignment doesn't affect component
- **Read-only data**: Reading `el.data` returns a fresh clone that can be safely mutated
- **Explicit updates**: Changes only apply when you reassign `el.data`

```javascript
// External mutations don't leak in
const source = [{ person: { name: 'Alice' } }];
el.data = source;
source[0].person.name = 'Mutated'; // Component still shows 'Alice'

// Reading data returns a clone
const current = el.data;
current[0].person.name = 'Changed'; // UI still shows original value

// Explicit reassignment updates the component
el.data = current; // Now UI shows 'Changed'
```

### Nested Property Paths

You can bind to properties at any depth:

```html
<!-- Simple nested path -->
<span data-bind="user.name"></span>

<!-- Deeper nesting -->
<span data-bind="address.city.name"></span>

<!-- Works in edit templates too -->
<input data-bind="contact.phone.mobile" />
```

### Limitations

The deep cloning mechanism uses JSON serialization, which has some limitations:

- Functions, symbols, and circular references are not supported
- Date objects are converted to strings
- Undefined values are converted to null
- Performance consideration for very large or deeply nested objects

For most use cases involving form data and simple objects, these limitations are not a concern.


## Soft Delete & Restore

The component supports soft-delete functionality through the `deleted` property and built-in action buttons.

### Basic Usage

```html
<ck-editable-array id="tasks">
  <template slot="display">
    <div class="row-display">
      <span data-bind="task"></span>
      <button data-action="toggle">Edit</button>
      <button data-action="delete">Delete</button>
      <button data-action="restore">Restore</button>
    </div>
  </template>

  <template slot="edit">
    <div class="row-edit">
      <input data-bind="task" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>

  <style slot="styles">
    /* Style deleted rows */
    .display-content.deleted {
      opacity: 0.5;
      text-decoration: line-through;
    }

    /* Hide restore button for active rows */
    .display-content:not(.deleted) [data-action="restore"] {
      display: none;
    }

    /* Hide delete button for deleted rows */
    .display-content.deleted [data-action="delete"] {
      display: none;
    }
  </style>
</ck-editable-array>

<script>
  const el = document.getElementById('tasks');
  el.data = [
    { task: 'Buy groceries', deleted: false },
    { task: 'Walk the dog', deleted: false }
  ];
</script>
```

### Deleted Property Behavior

The `deleted` property is part of the public API:

- `deleted: true` — row is soft-deleted
- `deleted: false` — row is active (or restored)
- `deleted: undefined` — treated as `false` (active)

**Important**: When restoring a row, the component sets `deleted: false` explicitly (not `undefined`) for consistent state representation.

### Immutability with Deleted Flag

The deleted flag respects the component's immutability guarantees:

```javascript
// Cache a snapshot before deletion
const before = el.data; // [{ task: 'Buy groceries', deleted: false }]

// Click delete button (or programmatically delete)
// ... user clicks delete ...

// Read current data
const after = el.data; // [{ task: 'Buy groceries', deleted: true }]

// Cached snapshot remains unchanged
console.log(before[0].deleted); // Still false (immutable)
```

### CSS Styling Hooks

Deleted rows receive both a CSS class and a data attribute:

- `.deleted` class for easy styling
- `[data-deleted="true"]` attribute for attribute selectors

```css
/* Using class selector */
.display-content.deleted {
  background-color: #fee;
  opacity: 0.6;
}

/* Using attribute selector */
[data-deleted="true"] {
  border-left: 3px solid #dc3545;
}
```

### Programmatic Delete/Restore

You can also manage the deleted state programmatically:

```javascript
// Soft delete a row
const current = el.data;
current[0].deleted = true;
el.data = current; // Triggers re-render

// Restore a row
const current2 = el.data;
current2[0].deleted = false;
el.data = current2; // Triggers re-render
```

### Filtering Deleted Rows

To get only active (non-deleted) rows:

```javascript
const activeRows = el.data.filter(row => !row.deleted);
```

To get only deleted rows:

```javascript
const deletedRows = el.data.filter(row => row.deleted);
```

### Events

The component dispatches three types of events, all of which bubble and cross shadow DOM boundaries:

#### datachanged Event

Dispatched whenever data changes (edit, add, delete, restore, etc.):

**Event Detail Payload:**
```typescript
{
  data: Array<EditableRow>  // Complete current array (cloned for immutability)
}
```

**Example:**
```javascript
el.addEventListener('datachanged', (e) => {
  console.log('Data changed:', e.detail.data);
  
  // The detail.data contains the full current array
  console.log('Total rows:', e.detail.data.length);
  
  // Check deleted state
  const hasDeleted = e.detail.data.some(row => row.deleted);
  console.log('Has deleted rows:', hasDeleted);
  
  // Safe to mutate - it's a clone
  const copy = e.detail.data;
  copy[0].name = 'Modified'; // Won't affect component's internal data
});
```

#### beforetogglemode Event (Cancelable)

Dispatched before a row switches between display and edit modes. You can prevent the mode change by calling `preventDefault()`:

**Event Detail Payload:**
```typescript
{
  index: number,        // Row index being toggled
  from: 'display' | 'edit',  // Current mode
  to: 'display' | 'edit'     // Target mode
}
```

**Example:**
```javascript
el.addEventListener('beforetogglemode', (e) => {
  console.log(`Row ${e.detail.index} wants to switch from ${e.detail.from} to ${e.detail.to}`);
  
  // Prevent row 0 from entering edit mode
  if (e.detail.index === 0 && e.detail.to === 'edit') {
    e.preventDefault();
    console.log('Edit mode blocked for row 0');
  }
  
  // Conditional logic based on transition direction
  if (e.detail.from === 'edit' && e.detail.to === 'display') {
    console.log('User is canceling or saving edit');
  }
});
```

#### aftertogglemode Event

Dispatched after a row successfully switches modes (not cancelable):

**Event Detail Payload:**
```typescript
{
  index: number,              // Row index that toggled
  mode: 'display' | 'edit'    // Final mode (after transition)
}
```

Note: This event only includes the final `mode`, not `from`/`to`, since the transition is already complete.

**Example:**
```javascript
el.addEventListener('aftertogglemode', (e) => {
  console.log(`Row ${e.detail.index} is now in ${e.detail.mode} mode`);
  
  // Focus the first input when entering edit mode
  if (e.detail.mode === 'edit') {
    const editRow = el.shadowRoot.querySelector(`.edit-content[data-row="${e.detail.index}"]`);
    const firstInput = editRow?.querySelector('input');
    firstInput?.focus();
  }
  
  // Track analytics
  if (e.detail.mode === 'display') {
    console.log('User finished editing row', e.detail.index);
  }
});
```

#### Event Bubbling

All events bubble through shadow DOM boundaries, so you can listen on ancestor elements:

```javascript
// Listen on parent element
document.body.addEventListener('datachanged', (e) => {
  if (e.target.tagName === 'CK-EDITABLE-ARRAY') {
    console.log('Array data changed:', e.detail.data);
  }
});
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Changes not appearing in the UI

**Cause:** Mutating the data array directly instead of reassigning it.

**Solution:** Always reassign the `data` property to trigger a re-render:

```javascript
// ❌ Wrong - mutating directly
el.data.push({ name: 'New Item' });

// ✅ Correct - reassign the property
const current = el.data;
current.push({ name: 'New Item' });
el.data = current;
```

#### Issue: Template not rendering or showing blank rows

**Cause:** Missing or incorrectly named slot attributes on templates.

**Solution:** Ensure templates have the correct `slot` attribute:

```html
<!-- ✅ Correct -->
<template slot="display">...</template>
<template slot="edit">...</template>

<!-- ❌ Wrong - missing slot attribute -->
<template>...</template>
```

#### Issue: Data binding not working

**Cause:** Typo in `data-bind` attribute or field name doesn't match data structure.

**Solution:** Verify field names match your data exactly (case-sensitive):

```javascript
// Data structure
el.data = [{ firstName: 'Alice' }];

// Template must match exactly
<span data-bind="firstName"></span>  <!-- ✅ Correct -->
<span data-bind="firstname"></span>  <!-- ❌ Wrong - case mismatch -->
```

#### Issue: Validation not working

**Cause:** Schema not set or incorrect schema format.

**Solution:** Ensure schema is set before or after data, and follows the correct format:

```javascript
// ✅ Correct schema format
el.schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 }
  },
  required: ['name']
};
```

#### Issue: Custom styles not applying

**Cause:** Styles not in a `<style slot="styles">` element.

**Solution:** Use the styles slot to inject CSS into shadow DOM:

```html
<!-- ✅ Correct -->
<style slot="styles">
  .row-display { color: blue; }
</style>

<!-- ❌ Wrong - regular style tag won't affect shadow DOM -->
<style>
  .row-display { color: blue; }
</style>
```

#### Issue: Form submission not including array data

**Cause:** Missing `name` attribute on the component.

**Solution:** Add a `name` attribute to enable form field naming:

```html
<form>
  <ck-editable-array name="contacts">
    <!-- Inputs will have names like: contacts[0].name -->
  </ck-editable-array>
</form>
```

#### Issue: Cannot edit any rows

**Cause:** Component has `readonly` attribute or another row is already in edit mode.

**Solution:** Remove `readonly` attribute and ensure only one row is edited at a time:

```javascript
// Check if readonly
console.log(el.hasAttribute('readonly')); // Should be false

// Check if any row is in edit mode
const hasEditingRow = el.data.some(row => row.editing === true);
console.log(hasEditingRow); // Should be false to allow editing
```

#### Issue: Nested property binding not working

**Cause:** Data structure doesn't match the nested path or path syntax is incorrect.

**Solution:** Ensure data structure matches the dot notation path:

```javascript
// ✅ Correct - data structure matches binding
el.data = [{ person: { name: 'Alice' } }];
// Template: <span data-bind="person.name"></span>

// ❌ Wrong - structure doesn't match
el.data = [{ name: 'Alice' }];
// Template: <span data-bind="person.name"></span> (will be empty)
```

### Debugging Tips

**Enable console logging for data changes:**
```javascript
el.addEventListener('datachanged', (e) => {
  console.log('Data changed:', JSON.stringify(e.detail.data, null, 2));
});
```

**Inspect current data state:**
```javascript
console.log('Current data:', el.data);
console.log('Current schema:', el.schema);
console.log('Is readonly:', el.hasAttribute('readonly'));
```

**Check validation state:**
```javascript
// Look for validation indicators in the DOM
const editRow = el.shadowRoot.querySelector('.edit-content');
console.log('Has validation errors:', editRow?.hasAttribute('data-row-invalid'));
```

**Verify templates are present:**
```javascript
const displayTpl = el.querySelector('template[slot="display"]');
const editTpl = el.querySelector('template[slot="edit"]');
console.log('Display template:', displayTpl ? 'Found' : 'Missing');
console.log('Edit template:', editTpl ? 'Found' : 'Missing');
```

## Performance Tips

### Best Practices for Large Datasets

#### 1. Limit Array Size

For optimal performance, keep arrays under 100 items. For larger datasets, implement pagination or virtual scrolling externally.

```javascript
// ✅ Good - reasonable size
el.data = items.slice(0, 50);

// ⚠️ Caution - may impact performance
el.data = items.slice(0, 500);
```

#### 2. Minimize Template Complexity

Keep templates simple and avoid deeply nested DOM structures.

```html
<!-- ✅ Good - simple template -->
<template slot="display">
  <div>
    <span data-bind="name"></span>
    <button data-action="toggle">Edit</button>
  </div>
</template>

<!-- ⚠️ Avoid - overly complex -->
<template slot="display">
  <div>
    <div>
      <div>
        <div>
          <span data-bind="name"></span>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### 3. Batch Data Updates

When making multiple changes, batch them into a single data assignment:

```javascript
// ❌ Inefficient - multiple re-renders
el.data = [...el.data, item1];
el.data = [...el.data, item2];
el.data = [...el.data, item3];

// ✅ Efficient - single re-render
const current = el.data;
current.push(item1, item2, item3);
el.data = current;
```

#### 4. Optimize Validation Schema

Keep validation rules simple and avoid complex regex patterns:

```javascript
// ✅ Good - simple validation
el.schema = {
  properties: {
    name: { minLength: 1 },
    email: { minLength: 5 }
  },
  required: ['name']
};

// ⚠️ Slower - complex validation (not yet supported, but avoid in future)
el.schema = {
  properties: {
    email: { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' }
  }
};
```

#### 5. Use Efficient Data Structures

For nested data, keep nesting shallow (2-3 levels max):

```javascript
// ✅ Good - shallow nesting
el.data = [
  { user: { name: 'Alice', email: 'alice@example.com' } }
];

// ⚠️ Avoid - deep nesting
el.data = [
  { company: { department: { team: { user: { name: 'Alice' } } } } }
];
```

#### 6. Debounce External Updates

If syncing with a server, debounce the `datachanged` event:

```javascript
let debounceTimer;
el.addEventListener('datachanged', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    // Send to server
    fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(e.detail.data)
    });
  }, 500); // Wait 500ms after last change
});
```

#### 7. Avoid Unnecessary Re-renders

Only update data when actually needed:

```javascript
// ✅ Good - check before updating
const current = el.data;
if (current[0].name !== newName) {
  current[0].name = newName;
  el.data = current;
}

// ❌ Wasteful - updates even if unchanged
const current = el.data;
current[0].name = newName; // Might be the same value
el.data = current; // Triggers re-render anyway
```

#### 8. Optimize Custom Styles

Keep CSS selectors simple and avoid expensive properties:

```html
<style slot="styles">
  /* ✅ Good - simple selectors */
  .row-display { padding: 10px; }
  
  /* ⚠️ Avoid - expensive properties */
  .row-display {
    box-shadow: 0 0 50px rgba(0,0,0,0.5);
    filter: blur(2px);
  }
</style>
```

### Performance Monitoring

Monitor render performance using browser DevTools:

```javascript
// Measure render time
const start = performance.now();
el.data = largeArray;
requestAnimationFrame(() => {
  const end = performance.now();
  console.log(`Render took ${end - start}ms`);
});
```

### When to Consider Alternatives

If you need to display more than 100-200 items with frequent updates, consider:
- Implementing virtual scrolling externally
- Using pagination
- Splitting data across multiple component instances
- Using a more specialized data grid component
