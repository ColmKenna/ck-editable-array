# ck-editable-array

A native web component that renders editable arrays using template-driven patterns. Provide `template[slot="display"]` for read-only views and `template[slot="edit"]` for inputs.

## Installation

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
|---------|-----------------|-------|
| Chrome | 53+ | Full support |
| Firefox | 63+ | Full support |
| Safari | 10.1+ | Full support |
| Edge | 79+ | Full support (Chromium-based) |
| Edge Legacy | Not supported | Use polyfills |

**Requirements:**
- Custom Elements v1
- Shadow DOM v1
- ES6 support

For older browsers, use the [webcomponents polyfills](https://github.com/webcomponents/polyfills).

## Quick Start

```html
<ck-editable-array id="letters">
  <template slot="display">
    <div class="row-display">
      <span data-bind="value"></span>
      <button data-action="toggle">Edit</button>
    </div>
  </template>
  
  <template slot="edit">
    <div class="row-edit">
      <input data-bind="value" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>

<script>
  const el = document.getElementById('letters');
  el.data = ['A', 'B', 'C'];
  
  el.addEventListener('datachanged', event => {
    console.log('Updated array:', event.detail.data);
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
- **Modal Edit Mode**: Opt-in to render edit template in a built-in modal overlay
- **Internationalization (i18n)**: Customizable validation error messages
- **CSS Theming**: CSS custom properties for easy styling

---

## API Reference

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `""` | Base name for form field naming. Inputs get names like `name[0].fieldName` |
| `readonly` | boolean | `false` | When present, disables all editing functionality |
| `modal-edit` | boolean | `false` | When present, edit templates render inside a modal dialog |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Array<any>` | **Getter/Setter.** The array of row data. Returns a deep clone for immutability. |
| `schema` | `object \| null` | **Getter/Setter.** Validation schema (JSON Schema-like). Supports `required` and `minLength`. |
| `newItemFactory` | `() => any` | **Getter/Setter.** Factory function for new items. Default returns `{}`. |
| `modalEdit` | `boolean` | Mirrors the `modal-edit` attribute. |
| `i18n` | `I18nMessages` | **Getter/Setter.** Internationalization messages for validation errors. |

**Example:**
```javascript
const el = document.querySelector('ck-editable-array');

// Set data
el.data = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
];

// Set validation schema
el.schema = {
  type: 'object',
  properties: {
    name: { minLength: 2 },
    email: { minLength: 5 }
  },
  required: ['name', 'email']
};

// Custom new item factory
el.newItemFactory = () => ({
  name: '',
  email: '',
  role: 'user'
});

// Internationalization
el.i18n = {
  required: (field) => `${field} is required`,
  minLength: (field, min) => `${field} must be at least ${min} characters`
};
```

### Events

All events bubble and are composed (cross shadow DOM boundaries).

| Event | Cancelable | Detail | Description |
|-------|-----------|--------|-------------|
| `datachanged` | No | `{ data: Array }` | Fired when data changes (add, save, delete, restore). |
| `beforetogglemode` | **Yes** | `{ index, from, to }` | Fired before mode switch. Call `preventDefault()` to block. |
| `aftertogglemode` | No | `{ index, mode }` | Fired after mode switch completes. |

**Example:**
```javascript
el.addEventListener('datachanged', (e) => {
  console.log('New data:', e.detail.data);
});

el.addEventListener('beforetogglemode', (e) => {
  if (e.detail.index === 0 && e.detail.to === 'edit') {
    e.preventDefault(); // Block editing of first row
  }
});
```

### Slots

| Slot | Required | Description |
|------|----------|-------------|
| `display` | Yes | Template for display (read-only) mode |
| `edit` | Yes | Template for edit mode |
| `styles` | No | Custom CSS styles to inject into shadow DOM |
| `add-button` | No | Custom template for the Add button |
| `button-edit` | No | Custom Edit button (uses `data-action="toggle"`) |
| `button-save` | No | Custom Save button |
| `button-cancel` | No | Custom Cancel button |
| `button-delete` | No | Custom Delete button |
| `button-restore` | No | Custom Restore button |

### CSS Parts

Use `::part()` to style shadow DOM elements:

| Part | Description |
|------|-------------|
| `root` | Root container |
| `rows` | Container for all rows |
| `add-button` | Container for Add button |
| `modal` | Modal overlay (when `modal-edit` enabled) |
| `modal-surface` | Modal dialog surface |

**Example:**
```css
ck-editable-array::part(root) {
  border: 2px solid #333;
  padding: 20px;
}

ck-editable-array::part(rows) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ck-row-padding` | `12px` | Padding for rows |
| `--ck-error-color` | `#dc3545` | Error message color |
| `--ck-border-radius` | `4px` | Border radius |
| `--ck-border-color` | `#ddd` | Default border color |
| `--ck-focus-color` | `#0066cc` | Focus indicator color |
| `--ck-disabled-opacity` | `0.5` | Opacity for disabled elements |

**Example:**
```css
ck-editable-array {
  --ck-error-color: #e74c3c;
  --ck-border-radius: 8px;
}
```

---

## Data Binding Attributes

Use these attributes in your templates:

| Attribute | Usage | Description |
|-----------|-------|-------------|
| `data-bind="fieldName"` | Any element | Binds content/value to data field. Supports `person.name` |
| `data-action="add"` | Buttons | Adds new row |
| `data-action="toggle"` | Buttons | Toggles display/edit mode |
| `data-action="save"` | Buttons | Saves changes |
| `data-action="cancel"` | Buttons | Discards changes |
| `data-action="delete"` | Buttons | Soft-deletes row |
| `data-action="restore"` | Buttons | Restores deleted row |

### Supported Input Types

- **Text inputs**: `<input type="text">`, `<input type="email">`, etc.
- **Textareas**: `<textarea data-bind="field"></textarea>`
- **Select**: `<select data-bind="field"><option>...</option></select>`
- **Multi-select**: `<select multiple data-bind="field">` — maps to arrays
- **Radio buttons**: Multiple `<input type="radio">` with same `data-bind`
- **Checkbox groups**: Multiple `<input type="checkbox">` with same `data-bind` — maps to arrays
- **Single checkbox**: One `<input type="checkbox">` — maps to boolean
- **Datalist**: `<input list="id" data-bind="field">` with `<datalist id="id">`

**Radio Example:**
```html
<template slot="edit">
  <fieldset>
    <legend>Priority</legend>
    <label><input type="radio" value="low" data-bind="priority" /> Low</label>
    <label><input type="radio" value="medium" data-bind="priority" /> Medium</label>
    <label><input type="radio" value="high" data-bind="priority" /> High</label>
  </fieldset>
</template>
```

**Checkbox Group Example:**
```html
<template slot="edit">
  <label><input type="checkbox" value="frontend" data-bind="tags" /> Frontend</label>
  <label><input type="checkbox" value="backend" data-bind="tags" /> Backend</label>
  <label><input type="checkbox" value="ux" data-bind="tags" /> UX</label>
</template>
<!-- Maps to: { tags: ['frontend', 'ux'] } -->
```

---

## Validation

### Setting a Schema

```javascript
el.schema = {
  type: 'object',
  properties: {
    name: { minLength: 1 },
    email: { minLength: 5 }
  },
  required: ['name', 'email']
};
```

### Validation Attributes

| Attribute | Description |
|-----------|-------------|
| `data-field-error="fieldName"` | Displays error message for a field |
| `data-error-count` | Displays total error count |
| `data-error-summary` | Displays all errors (for screen readers) |

**Automatic Attributes:**
- `data-invalid` — Added to invalid inputs
- `data-row-invalid` — Added to row wrapper when errors exist
- `aria-invalid="true"` — Accessibility indicator
- `aria-describedby` — Links inputs to error messages

### Validation Example

```html
<template slot="edit">
  <div class="row-edit">
    <div data-error-summary role="alert" aria-live="polite"></div>
    
    <label>Name *</label>
    <input data-bind="name" />
    <span data-field-error="name"></span>
    
    <label>Email *</label>
    <input data-bind="email" />
    <span data-field-error="email"></span>
    
    <button data-action="save">Save</button>
    <button data-action="cancel">Cancel</button>
  </div>
</template>

<style slot="styles">
  .row-edit[data-row-invalid] { border: 2px solid red; }
  input[data-invalid] { border-color: red; }
  [data-field-error] { color: red; font-size: 13px; }
  [data-field-error]:empty { display: none; }
</style>
```

---

## Modal Edit Mode

Enable modal editing with the `modal-edit` attribute:

```html
<ck-editable-array modal-edit>
  <template slot="display">
    <div class="row-display">
      <span data-bind="name"></span>
      <button data-action="toggle">Edit</button>
    </div>
  </template>
  <template slot="edit">
    <div class="row-edit">
      <input data-bind="name" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>
```

The edit template renders inside a built-in modal with:
- `role="dialog"` and `aria-modal="true"`
- `part="modal"` overlay and `part="modal-surface"` dialog

See `examples/demo-modal-edit.html` for a styled demo.

---

## Soft Delete & Restore

```html
<template slot="display">
  <div class="row-display">
    <span data-bind="task"></span>
    <button data-action="toggle">Edit</button>
    <button data-action="delete">Delete</button>
    <button data-action="restore">Restore</button>
  </div>
</template>

<style slot="styles">
  .display-content.deleted { opacity: 0.5; text-decoration: line-through; }
  .display-content:not(.deleted) [data-action="restore"] { display: none; }
  .display-content.deleted [data-action="delete"] { display: none; }
</style>
```

Rows have `.deleted` class and `[data-deleted="true"]` attribute when soft-deleted.

---

## Nested Property Support

Bind to nested paths with dot notation:

```html
<span data-bind="person.name"></span>
<input data-bind="address.city.name" />
```

```javascript
el.data = [
  { person: { name: 'Alice' }, address: { city: { name: 'NYC' } } }
];
```

---

## Immutability

The component guarantees immutable data handling:

```javascript
// External mutations don't affect component
const source = [{ name: 'Alice' }];
el.data = source;
source[0].name = 'Mutated'; // Component still shows 'Alice'

// Reading data returns a clone
const current = el.data;
current[0].name = 'Changed'; // UI unchanged

// Explicit reassignment updates component
el.data = current; // Now UI shows 'Changed'
```

---

## Troubleshooting

### Changes not appearing in UI

```javascript
// ❌ Wrong - mutating directly
el.data.push({ name: 'New' });

// ✅ Correct - reassign property
const current = el.data;
current.push({ name: 'New' });
el.data = current;
```

### Template not rendering

```html
<!-- ❌ Wrong - missing slot -->
<template>...</template>

<!-- ✅ Correct -->
<template slot="display">...</template>
<template slot="edit">...</template>
```

### Styles not applying

```html
<!-- ❌ Wrong - outside shadow DOM -->
<style>.row { color: blue; }</style>

<!-- ✅ Correct - use styles slot -->
<style slot="styles">.row { color: blue; }</style>
```

### Debugging

```javascript
el.addEventListener('datachanged', (e) => {
  console.log('Data:', JSON.stringify(e.detail.data, null, 2));
});

console.log('Data:', el.data);
console.log('Schema:', el.schema);
console.log('Readonly:', el.hasAttribute('readonly'));
```

---

## Performance Tips

1. **Limit array size** — Keep under 100 items; use pagination for larger datasets
2. **Simple templates** — Avoid deeply nested DOM structures
3. **Batch updates** — Make multiple changes before reassigning `el.data`
4. **Debounce server sync** — Don't save on every `datachanged` event

```javascript
// Batch updates
const current = el.data;
current.push(item1, item2, item3);
el.data = current; // Single re-render

// Debounce server sync
let timer;
el.addEventListener('datachanged', (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => saveToServer(e.detail.data), 500);
});
```

---

## License

MIT

---

See [docs/analysis/ck-editable-array-analysis.md](./analysis/ck-editable-array-analysis.md) for complete technical documentation.
