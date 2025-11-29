# ck-editable-array

A template-driven web component for editing arrays of data. Provide `template[slot="display"]` for read-only views and `template[slot="edit"]` for editable inputs.

## Installation

```bash
npm install @colmkenna/ck-editable-array
```

Then import in your JavaScript/TypeScript:

```javascript
import '@colmkenna/ck-editable-array';
```

Or include directly in HTML:

```html
<script type="module" src="path/to/ck-editable-array.esm.js"></script>
```

## Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 53+ | Full support |
| Firefox | 63+ | Full support |
| Safari | 10.1+ | Full support |
| Edge | 79+ | Full support (Chromium-based) |

**Requirements:** Custom Elements v1, Shadow DOM v1, ES6 support. For older browsers, use the [webcomponents polyfills](https://github.com/webcomponents/polyfills).

---

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

<script type="module">
  import '@colmkenna/ck-editable-array';
  
  const el = document.getElementById('letters');
  el.data = ['A', 'B', 'C'];
  
  el.addEventListener('datachanged', event => {
    console.log('Updated array:', event.detail.data);
  });
</script>
```

---

## Key Features

- **Template-Driven**: Define display and edit layouts with standard HTML templates
- **Schema-Driven Validation**: JSON Schema-like validation with real-time feedback
- **Immutable Data**: All operations clone data, preventing external mutations
- **Accessibility**: Full ARIA support, keyboard navigation, and screen reader announcements
- **Modal Edit Mode**: Optional modal overlay for edit templates
- **Internationalization**: Customizable validation messages via `i18n` property
- **Theming**: CSS custom properties and `::part()` selectors for styling
- **Soft Delete**: Mark rows as deleted without removing them

---

## API Reference

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `""` | Base name for form field naming. Inputs get names like `name[0].fieldName` |
| `readonly` | boolean | `false` | Disables all editing functionality |
| `modal-edit` | boolean | `false` | Edit templates render in a modal dialog instead of inline |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Array<any>` | The array of row data. Reading returns a deep clone. |
| `schema` | `ValidationSchema \| null` | Validation schema with `required` and `properties` constraints |
| `newItemFactory` | `() => any` | Factory function for new rows. Default returns `{}` |
| `modalEdit` | `boolean` | Mirrors the `modal-edit` attribute |
| `i18n` | `I18nMessages \| undefined` | Custom validation error messages |

### Events

| Event | Cancelable | Detail | Description |
|-------|-----------|--------|-------------|
| `datachanged` | No | `{ data: Array }` | Fired on data changes (add, save, delete, restore) |
| `beforetogglemode` | **Yes** | `{ index, from, to }` | Fired before mode switch. Call `preventDefault()` to block |
| `aftertogglemode` | No | `{ index, mode }` | Fired after mode switch completes |

### Slots

| Slot | Required | Description |
|------|----------|-------------|
| `display` | Yes | Template for read-only row rendering |
| `edit` | Yes | Template for edit mode rendering |
| `styles` | No | Custom CSS injected into shadow DOM |
| `add-button` | No | Custom add button template |
| `button-edit` | No | Custom edit button |
| `button-save` | No | Custom save button |
| `button-cancel` | No | Custom cancel button |
| `button-delete` | No | Custom delete button |
| `button-restore` | No | Custom restore button |

### CSS Parts

| Part | Description |
|------|-------------|
| `root` | Root container element |
| `rows` | Container for all row elements |
| `add-button` | Container for the add button |
| `modal` | Modal overlay (when `modal-edit` enabled) |
| `modal-surface` | Modal dialog surface |

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ck-row-padding` | `12px` | Row padding |
| `--ck-error-color` | `#dc3545` | Validation error color |
| `--ck-border-radius` | `4px` | Border radius |
| `--ck-border-color` | `#ddd` | Default border color |
| `--ck-focus-color` | `#0066cc` | Focus indicator color |
| `--ck-disabled-opacity` | `0.5` | Disabled element opacity |

---

## Data Binding Attributes

Use these attributes in your templates:

| Attribute | Usage | Description |
|-----------|-------|-------------|
| `data-bind="fieldName"` | On any element | Binds to a data field. Supports nested paths: `person.name` |
| `data-action="add"` | On buttons | Adds a new row |
| `data-action="toggle"` | On buttons | Toggles display/edit mode |
| `data-action="save"` | On buttons | Saves changes, exits edit mode |
| `data-action="cancel"` | On buttons | Discards changes, exits edit mode |
| `data-action="delete"` | On buttons | Soft-deletes a row |
| `data-action="restore"` | On buttons | Restores a deleted row |

### Supported Input Types

- **Text inputs**: `<input type="text">`, `<input type="email">`, etc.
- **Textareas**: `<textarea data-bind="field"></textarea>`
- **Select dropdowns**: `<select data-bind="field">` (including `multiple`)
- **Radio buttons**: Multiple `<input type="radio">` with same `data-bind`
- **Checkboxes**: Single (boolean) or multiple (array values)
- **Datalist/Combo**: `<input list="id">` with `<datalist>`

---

## Validation

### Setting a Schema

```javascript
el.schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', minLength: 5 }
  },
  required: ['name', 'email']
};
```

### Validation Features

- **Real-time**: Validates on input change
- **Save Button Control**: Disabled when invalid
- **ARIA Support**: `aria-invalid`, `aria-describedby` for accessibility
- **Error Display**: Use `data-field-error="fieldName"` elements

### Error Display Template

```html
<template slot="edit">
  <div class="row-edit">
    <div data-error-summary role="alert" aria-live="polite"></div>
    
    <input data-bind="name" />
    <span data-field-error="name"></span>
    
    <button data-action="save">Save</button>
    <span data-error-count></span>
  </div>
</template>
```

### Custom Error Messages (i18n)

```javascript
el.i18n = {
  required: (field) => `${field} is required`,
  minLength: (field, min) => `${field} must be at least ${min} characters`
};
```

---

## Styling

### Using CSS Parts

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

### Using the Styles Slot

```html
<ck-editable-array>
  <style slot="styles">
    .row-display { padding: 10px; border: 1px solid #ccc; }
    .display-content.deleted { opacity: 0.5; text-decoration: line-through; }
    input[data-invalid] { border-color: red; }
  </style>
  <!-- templates -->
</ck-editable-array>
```

### CSS Custom Properties

```css
ck-editable-array {
  --ck-error-color: #e74c3c;
  --ck-border-radius: 8px;
  --ck-row-padding: 16px;
}
```

---

## Modal Edit Mode

Enable modal editing with the `modal-edit` attribute:

```html
<ck-editable-array modal-edit>
  <template slot="display">
    <div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>
  </template>
  <template slot="edit">
    <div>
      <input data-bind="name" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>
```

The edit template renders in a built-in modal overlay with `role="dialog"` and `aria-modal="true"`.

### Modal Validation Behavior

When using modal edit mode with validation, the component enforces data integrity:

- **Immediate validation**: When the modal opens, validation runs immediately. If data is invalid, the Save button is disabled.
- **Real-time feedback**: As the user edits, validation updates in real-time, enabling Save only when all constraints are satisfied.
- **Cancel always available**: Cancel is never disabled by validation. Clicking Cancel closes the modal and reverts to the original data.
- **New items**: When adding a new item via Add button, the modal opens for editing. If the user cancels, the new item is discarded entirely (not kept in the data array).

```html
<ck-editable-array modal-edit>
  <template slot="edit">
    <div class="row-edit">
      <input data-bind="name" />
      <span data-field-error="name"></span>
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
  <!-- ... -->
</ck-editable-array>

<script>
  el.schema = {
    required: ['name'],
    properties: { name: { minLength: 3 } }
  };
</script>
```

---

## Nested Properties

Support dot notation for nested data:

```html
<span data-bind="person.name"></span>
<input data-bind="address.city" />
```

```javascript
el.data = [
  { person: { name: 'Alice' }, address: { city: 'NYC' } }
];
```

---

## Soft Delete & Restore

Rows can be soft-deleted (marked but not removed):

```javascript
// Data includes deleted flag
el.data = [
  { name: 'Active', deleted: false },
  { name: 'Deleted', deleted: true }
];
```

Deleted rows receive `.deleted` class and `data-deleted="true"` attribute for styling.

---

## Immutability Guarantees

```javascript
// Reading data returns a clone
const snapshot = el.data;
snapshot[0].name = 'Modified'; // Doesn't affect component

// Writing data also clones
const source = [{ name: 'Alice' }];
el.data = source;
source[0].name = 'Changed'; // Doesn't affect component
```

---

## Troubleshooting

### Changes not appearing
**Cause**: Mutating data directly instead of reassigning.
```javascript
// Wrong
el.data.push({ name: 'New' });

// Correct
const current = el.data;
current.push({ name: 'New' });
el.data = current;
```

### Templates not rendering
**Cause**: Missing `slot` attribute on templates.
```html
<!-- Correct -->
<template slot="display">...</template>
<template slot="edit">...</template>
```

### Styles not applying
**Cause**: Shadow DOM encapsulation.
```html
<!-- Use styles slot -->
<style slot="styles">...</style>
```

---

## Performance Tips

1. **Limit array size** to ~100 items for optimal performance
2. **Batch updates** into a single `data` assignment
3. **Keep templates simple** - avoid deep nesting
4. **Debounce server sync** on `datachanged` events

---

## Further Reading

- [Technical Documentation](readme.technical.md) - Architecture and implementation details
- [Specification](spec.md) - Formal specification with acceptance criteria
- [Migration Guide](migration-guide.md) - Integration patterns and framework examples
- [Examples](../examples/) - Working demos for various use cases

---

## License

MIT
