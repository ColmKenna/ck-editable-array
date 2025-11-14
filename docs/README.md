# ck-editable-array docs overview

`ck-editable-array` renders repeatable rows based on templates you supply. Provide `template[slot="display"]` for read-only views and `template[slot="edit"]` for inputs.

## Quick start

```html
<ck-editable-array id="letters">
  <template slot="display">
    <div class="row-display"><span data-bind="value"></span></div>
  </template>
  <template slot="edit">
    <div class="row-edit"><input data-bind="value" /></div>
  </template>
</ck-editable-array>
<script>
  const el = document.getElementById('letters');
  el.data = ['A', 'B', 'C'];
  el.addEventListener('datachanged', event => {
    console.log('updated array', event.detail.data);
  });
</script>
```

## Key Features
- **Schema-driven Validation**: Define validation rules with JSON Schema-like syntax
- **Immediate Feedback**: Validation runs on input change for instant error display
- **Accessibility**: Full ARIA support with `aria-invalid`, `aria-describedby`, and live regions
- **Save Control**: Save button automatically disabled when validation fails
- **Clear Error Messages**: Field-level and row-level error indicators

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
