# Technical Documentation: ck-editable-array

**Last Updated**: November 29, 2025  
**Version**: 1.0.0

---

## Architecture Overview

The `ck-editable-array` component follows a Shadow DOM-based architecture with template-driven rendering and reactive data binding.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Light DOM                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │  Display    │  │    Edit     │  │   Style Slot / Buttons   │ │
│  │  Template   │  │   Template  │  │      (Custom)            │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬─────────────┘ │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CkEditableArray                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Data Store │  │  Schema    │  │ Validation │  │   Style   │  │
│  │  (_data)   │  │  Store     │  │  Manager   │  │  Observer │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘  │
│        │               │               │               │        │
│        └───────────────┴───────┬───────┴───────────────┘        │
│                                │                                 │
│                         DomRenderer                              │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Shadow DOM                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Root Container [part="root"]              ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │              Rows Container [part="rows"]                │││
│  │  │  ┌─────────────────┐  ┌─────────────────┐               │││
│  │  │  │ Display Content │  │  Edit Content   │               │││
│  │  │  │  (per row)      │  │   (per row)     │               │││
│  │  │  └─────────────────┘  └─────────────────┘               │││
│  │  └─────────────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │           Add Button Container [part="add-button"]       │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │         Modal Overlay [part="modal"] (when enabled)         ││
│  │    ┌─────────────────────────────────────────────────────┐  ││
│  │    │     Modal Surface [part="modal-surface"]            │  ││
│  │    │        (edit template rendered here)                │  ││
│  │    └─────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Shadow DOM Encapsulation**: Component internals are isolated from the page, preventing style leakage
2. **Template-Driven Rendering**: User-provided templates define row structure, component handles data binding
3. **Immutable Data Flow**: All data operations create new copies, preventing external mutations
4. **Event-Driven Communication**: Component communicates state changes via custom events
5. **Progressive Enhancement**: Works with or without validation schema, custom buttons, or styling

---

## File Structure

```
src/components/ck-editable-array/
├── ck-editable-array.ts    # Main component class (entry point)
├── dom-renderer.ts         # DOM rendering and event binding
├── validation-manager.ts   # Schema validation logic
└── types.ts               # TypeScript interfaces and constants
```

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `ck-editable-array.ts` | Component lifecycle, public API, data management |
| `dom-renderer.ts` | Template cloning, data binding, event listeners |
| `validation-manager.ts` | Schema validation, error message generation |
| `types.ts` | TypeScript types, interfaces, constants |

---

## State Management

### Internal State Properties

| Property | Type | Description |
|----------|------|-------------|
| `_data` | `EditableRow[]` | Primary data store with internal markers |
| `_rowKeys` | `string[]` | Stable keys for keyed rendering |
| `_nextId` | `number` | Counter for generating unique row keys |
| `_schema` | `ValidationSchema \| null` | Validation rules |
| `_i18n` | `I18nMessages \| undefined` | Custom error messages |
| `_newItemFactory` | `() => EditableRow` | Factory for new rows |
| `_styleObserver` | `MutationObserver \| null` | Watches style slot changes |
| `_domRenderer` | `DomRenderer` | Handles DOM operations |

### Internal Row Markers

| Marker | Type | Description |
|--------|------|-------------|
| `editing` | `boolean` | Row is in edit mode |
| `deleted` | `boolean` | Row is soft-deleted |
| `__originalSnapshot` | `Record<string, unknown>` | Snapshot for cancel/rollback |
| `__isNew` | `boolean` | Row was just added (removed on cancel) |

**Note**: `__originalSnapshot` and `__isNew` are filtered from public `data` getter.

---

## Data Flow

### Setting Data

```
el.data = [...] 
    │
    ▼
┌─────────────────────────────────┐
│ Data Setter                      │
│ 1. Clone each row (deep clone)   │
│ 2. Generate row keys             │
│ 3. Store in _data                │
│ 4. Call render() if connected    │
│ 5. Dispatch datachanged          │
└─────────────────────────────────┘
```

### Edit Flow

```
Click Toggle → beforetogglemode → Create Snapshot → Set editing=true 
    │
    ▼ (render)
Edit Mode Visible → User Types → commitRowValue() → updateBoundNodes()
    │                                                       │
    ▼                                                       ▼
Click Save → validateRow() ──┬─▶ VALID: Remove markers → render() → datachanged
                             │
                             └─▶ INVALID: Update error UI, Save disabled
    │
    ▼
Click Cancel → Restore from snapshot → Remove row if __isNew → render()
```

---

## Rendering Pipeline

### DomRenderer Class

The `DomRenderer` class handles all DOM operations:

```typescript
class DomRenderer {
  // Main entry point
  render(): void
  
  // Row management
  private renderRows(container, errors): void
  private createRowElement(item, index, mode, errors): HTMLElement
  private updateRowElement(wrapper, item, index, mode, errors): void
  
  // Data binding
  private bindDataToNode(node, data, rowIndex, isEditing, signal): void
  private setupEventListeners(wrapper, index, isEditing, isDeleted, signal): void
  
  // Modal support
  private renderModalEdit(item, index, errors): void
  private openModal(): void
  closeModal(): void
  
  // Updates
  updateBoundNodes(rowIndex, key?): void
}
```

### Keyed Rendering Strategy

The component uses **keyed partial re-rendering** for performance:

1. **Stable Keys**: Each row gets a unique key (`row-0`, `row-1`, etc.)
2. **DOM Diffing**: Compare existing DOM nodes against data
3. **Reuse**: Update existing nodes instead of recreating
4. **Cleanup**: Remove nodes for deleted rows
5. **Reorder**: Move nodes to match data order

### Event Listener Management

Uses `AbortController` to prevent memory leaks:

```typescript
// Per-element controller storage
private _rowControllers = new Map<string, AbortController>();

// On row update:
if (this._rowControllers.has(elementKey)) {
  this._rowControllers.get(elementKey)!.abort(); // Remove old listeners
}
const controller = new AbortController();
this._rowControllers.set(elementKey, controller);

// Attach listeners with signal
elem.addEventListener('input', handler, { signal: controller.signal });
```

---

## Validation System

### ValidationManager Class

```typescript
class ValidationManager {
  static validateRow(
    row: InternalRowData,
    schema: ValidationSchema | null,
    i18n?: I18nMessages
  ): ValidationResult
  
  private static validateRequiredFields(row, schema, i18n): Record<string, string[]>
  private static validatePropertyConstraints(row, schema, requiredErrors, i18n): Record<string, string[]>
  private static formatValidationError(field, constraint, value, i18n): string
}
```

### Validation Flow

```
Input Change
    │
    ▼
commitRowValue()
    │
    ▼
updateSaveButtonState(rowIndex)
    │
    ▼
validateRowDetailed(rowIndex) → ValidationManager.validateRow()
    │
    ├─► Check required fields
    │
    ├─► Check property constraints (minLength)
    │
    └─► Return { isValid, errors }
    │
    ▼
Update UI:
├─► Save button: disabled={!isValid}
├─► Row wrapper: data-row-invalid={!isValid}
├─► Inputs: aria-invalid={hasError}
├─► Error elements: textContent={errorMessage}
└─► Error summary: aria-live announcement
```

---

## Style Management

### Style Mirroring

The component mirrors `<style slot="styles">` from light DOM to shadow DOM:

```
Light DOM                          Shadow DOM
┌────────────────────────┐        ┌────────────────────────┐
│ <style slot="styles">  │───────►│ <style data-mirrored>  │
│   .row { ... }         │        │   .row { ... }         │
│ </style>               │        │ </style>               │
└────────────────────────┘        └────────────────────────┘
```

### MutationObserver

Watches for style changes and re-mirrors:

```typescript
this._styleObserver = new MutationObserver(mutations => {
  const shouldRemirror = mutations.some(m => this.isStyleMutation(m));
  if (shouldRemirror) this.mirrorStyles();
});

this._styleObserver.observe(this, {
  childList: true,
  characterData: true,
  subtree: true
});
```

### CSS Custom Properties

Defined in `:host` selector:

```css
:host {
  --ck-row-padding: 12px;
  --ck-error-color: #dc3545;
  --ck-border-radius: 4px;
  --ck-border-color: #ddd;
  --ck-focus-color: #0066cc;
  --ck-disabled-opacity: 0.5;
}
```

---

## Event System

### Event Dispatch Pattern

All events use consistent configuration:

```typescript
new CustomEvent('eventname', {
  bubbles: true,      // Propagate up DOM tree
  composed: true,     // Cross shadow DOM boundaries
  cancelable: false,  // (or true for beforetogglemode)
  detail: { ... }     // Event payload (cloned data)
});
```

### Event Contracts

| Event | Cancelable | Payload | When Fired |
|-------|-----------|---------|------------|
| `datachanged` | No | `{ data: Array }` | Data mutations |
| `beforetogglemode` | Yes | `{ index, from, to }` | Before mode switch |
| `aftertogglemode` | No | `{ index, mode }` | After mode switch |

### Immutability in Events

Event `detail.data` is always a fresh clone:

```typescript
dispatchDataChanged(): void {
  const event = new CustomEvent('datachanged', {
    bubbles: true,
    composed: true,
    detail: { data: this.data } // Getter returns clone
  });
  this.dispatchEvent(event);
}
```

---

## Input Type Handling

### Text/Textarea Inputs

- Uses `input` event for real-time updates
- Sets `value` property
- `readOnly` when not in edit mode

### Select Dropdowns

- Uses `change` event
- Single select: `value` property
- Multi-select: Array of selected values

### Radio Buttons

- Uses `change` event (only on checked radio)
- Sets `checked` property based on value match
- `aria-checked` for accessibility
- Does NOT overwrite `value` attribute

### Checkboxes

- Single checkbox: Boolean binding
- Multiple checkboxes: Array binding
- Uses `change` event
- Reads fresh data on change to avoid stale state

### Datalist/Combo

- Uses `input` event like text inputs
- Component remaps datalist IDs per row (e.g., `list-0`, `list-1`)

---

## Modal Edit Mode

### Activation

```html
<ck-editable-array modal-edit>
<!-- or -->
el.modalEdit = true;
```

### Rendering Behavior

When modal edit is enabled:
1. Rows container renders only display templates
2. Edit templates render in modal overlay
3. Modal has `role="dialog"`, `aria-modal="true"`
4. `.hidden` class and `aria-hidden` toggle visibility

### Modal Structure

```html
<div part="modal" class="modal-overlay hidden" aria-hidden="true">
  <div part="modal-surface" class="modal-surface" role="dialog" aria-modal="true">
    <!-- Edit template cloned here -->
  </div>
</div>
```

---

## Focus Management

### Auto-Focus on Edit

When entering edit mode, first focusable input receives focus:

```typescript
// In handleToggleClick() after render
if (toMode === 'edit') {
  window.requestAnimationFrame(() => {
    const firstInput = editWrapper?.querySelector('input, textarea, select');
    firstInput?.focus();
  });
}
```

### Focus Restoration

When exiting edit mode, focus returns to toggle button:

```typescript
// In handleSaveClick() / handleCancelClick()
window.requestAnimationFrame(() => {
  const toggleBtn = displayWrapper?.querySelector('[data-action="toggle"]');
  toggleBtn?.focus();
});
```

---

## Performance Considerations

### Optimizations Implemented

1. **Keyed Rendering**: Reuse DOM nodes instead of recreating
2. **Targeted Updates**: `updateBoundNodes()` for partial updates
3. **AbortController**: Clean listener management
4. **Selective Validation**: Only validate affected row
5. **Shallow DOM Updates**: Avoid innerHTML

### Recommendations

- Keep arrays under 100 items
- Use simple templates
- Batch data updates
- Debounce server sync

---

## Security Considerations

### XSS Prevention

- Display binding uses `textContent` (not `innerHTML`)
- Template cloning uses `cloneNode()` (not string interpolation)
- No `eval()` or `Function()` usage

### Prototype Pollution

- Deep cloning via `JSON.parse(JSON.stringify())`
- Circular reference fallback to shallow copy

### CSP Compliance

- No inline scripts generated
- All event handlers attached via `addEventListener()`

---

## Browser Compatibility

### Minimum Requirements

- Custom Elements v1
- Shadow DOM v1
- ES6 (classes, arrow functions, template literals)

### Feature Detection

```javascript
if (!('customElements' in window)) {
  // Load polyfills
}
```

### Polyfills

```html
<!-- Web Components -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"></script>

<!-- Inert attribute (for older Firefox/Safari) -->
<script src="https://unpkg.com/wicg-inert@3.1.2/dist/inert.min.js"></script>
```

---

## Testing Architecture

### Test Organization

```
tests/ck-editable-array/
├── ck-editable-array.init.test.ts           # Initialization tests
├── ck-editable-array.step1.render.test.ts   # Basic rendering
├── ck-editable-array.step2.public-api.test.ts
├── ck-editable-array.step3.lifecycle-styles.test.ts
├── ck-editable-array.step4.rendering-row-modes.test.ts
├── ck-editable-array.step5.add-button.test.ts
├── ck-editable-array.step6.save-cancel.test.ts
├── ck-editable-array.step7.validation.test.ts
├── ck-editable-array.step8.cloning.test.ts
├── ck-editable-array.modal-edit.test.ts
├── ck-editable-array.accessibility.test.ts
├── ck-editable-array.security.test.ts
├── ck-editable-array.performance.test.ts
├── ck-editable-array.radio-binding.test.ts
├── ck-editable-array.advanced-inputs.test.ts
├── ck-editable-array.simple-strings.test.ts
├── ck-editable-array.week3.performance.test.ts
├── ck-editable-array.week4.focus.test.ts
├── ck-editable-array.week4.i18n.test.ts
├── ck-editable-array.week5.circular.test.ts
├── ck-editable-array.week5.css-vars.test.ts
└── ck-editable-array.visual.test.ts
```

### Test Utilities

```typescript
// tests/test-utils.ts
export async function waitForRender(ms?: number): Promise<void>
export function getRow(el: CkEditableArray, index: number): HTMLElement | null
export function simulateInput(input: HTMLInputElement, value: string): void
```

---

## Related Documentation

- [README.md](README.md) - User-facing API reference
- [spec.md](spec.md) - Formal specification
- [migration-guide.md](migration-guide.md) - Integration patterns
- [quality-audit.md](quality-audit.md) - Compliance matrix
