# CkEditableArray Component - Technical Documentation

## Architecture Overview

`CkEditableArray` is a custom HTML element that extends `HTMLElement` with data management capabilities and shadow DOM rendering. It uses TypeScript, Constructable Stylesheets, and modern web component patterns.

## Class Structure

```typescript
export class CkEditableArray extends HTMLElement {
  private shadow: ShadowRoot;          // Shadow DOM root
  private _data: unknown[] = [];       // Internal data storage
  private _rootEl: HTMLDivElement;     // Shadow content root (preserves fallback styles)

  // Public API
  get data(): unknown[];
  set data(value: unknown);
  get datachangeMode(): 'debounced' | 'change' | 'save';
  set datachangeMode(value: 'debounced' | 'change' | 'save');
  get datachangeDebounce(): number;
  set datachangeDebounce(value: number);
  get name(): string;
  set name(value: string);
  get rootClass(): string;
  set rootClass(value: string);
  get rowsClass(): string;
  set rowsClass(value: string);
  get rowClass(): string;
  set rowClass(value: string);

  // Lifecycle hooks
  connectedCallback();
  disconnectedCallback();
  attributeChangedCallback();

  // Static observers
  static get observedAttributes();

  // Private methods
  private _deepClone(obj: unknown): unknown[];
  private _jsonClone(obj: unknown): unknown[];
  private _getDisplayTemplate(): HTMLTemplateElement | null;
  private _renderRows(rowsHost: HTMLElement);
  private _applyBindings(root: ParentNode, rowData: unknown);
  private _resolvePath(obj: unknown, path: string): unknown;
  private render();
}
```

## State Management

### Internal State

- **`_data: unknown[]`**: Private array field storing component data
  - Initialized to `[]` (empty array) in constructor
  - Modified only via `data` setter (after normalization and cloning)
  - Accessed only via `data` getter (returns clone)

### Public API

- **`data` property**: Reactive property with automatic deep cloning
- **`name` property`: Synced with `name` attribute via getter/setter
- **`datachangeMode`/`datachangeDebounce` properties**: Control data change cadence (`debounced` by default)
- **`datachanged` event**: Dispatched when `data` is set and when edits commit based on `datachangeMode`
- **`rowchanged` event**: Dispatched on each row update (`detail: { index, row }`, bubbles + composed)

### Edit State Management (Internal)

The component maintains edit state internally using a dual-strategy approach that prevents polluting user data with internal properties like `editing` and `__originalSnapshot`.

#### Strategy:

**For Object Rows:**
```typescript
private _editStateMap = new WeakMap<object, EditState>();
```
- Uses `WeakMap` to associate edit state with object references
- Automatic garbage collection when objects are no longer referenced
- No memory leaks

**For Primitive Rows:**
```typescript
private _primitiveEditState: (EditState | null)[] = [];
```
- Parallel array indexed by row position
- Cleared when `data` is set to prevent stale references

#### EditState Interface:

```typescript
interface EditState {
  editing: boolean;           // Whether row is currently in edit mode
  originalSnapshot: unknown;  // Deep clone of original data for cancel
}
```

#### Helper Methods:

**`_getEditState(rowData, rowIndex)`:**
- Returns `EditState | null` for the given row
- Checks `WeakMap` for objects, parallel array for primitives

**`_setEditState(rowData, rowIndex, state)`:**
- Stores edit state internally
- Passing `null` clears the state

#### Lifecycle:

1. **Enter Edit Mode** (`_enterEditMode`):
   - Creates snapshot of current row data
   - Stores `{ editing: true, originalSnapshot }` in internal state
   - User data remains untouched

2. **Save** (`_saveRow`):
   - Clears internal edit state
   - User data contains only user-provided properties

3. **Cancel** (`_cancelRow`):
   - Retrieves snapshot from internal state
   - Restores data to original values
   - Clears internal edit state
   - User data contains only user-provided properties

### Event Handler Index Resolution

All event handlers compute row indices from DOM attributes at runtime to prevent stale closure bugs.

#### Pattern:

```typescript
// ❌ OLD (stale closure):
rowEl.addEventListener('keydown', event =>
  this._handleRowKeydown(event, index)  // 'index' captured at creation time
);

// ✅ NEW (runtime resolution):
rowEl.addEventListener('keydown', event =>
  this._handleRowKeydown(event)  // No captured index
);

private _handleRowKeydown(event: KeyboardEvent) {
  const rowEl = target.closest('[data-row]');
  const rowIndex = Number(rowEl.getAttribute('data-row'));  // Read from DOM
  // ... use rowIndex
}
```

#### Handlers Using Runtime Resolution:

1. **`_handleRowKeydown`** (Keyboard Navigation):
   - Reads `data-row` attribute from event target's closest row
   - Validates index is finite number
   - Safely handles arrow navigation even if DOM is modified

2. **`_handleInputChange`** (Input Sync):
   - Reads `data-row` from input's closest row ancestor
   - Validates index is within `this._data` bounds
   - Ensures edits apply to correct data index even after re-renders

3. **`_handleShadowClick`** (Edit Actions):
   - Already used runtime resolution (pre-existing pattern)
   - Reads `data-row` from button's closest row ancestor

#### Benefits:

- **No Stale Closures**: Handlers always reference current DOM state
- **Robust to Reordering**: Works correctly even if data/rows are reordered
- **Consistent Pattern**: All handlers use same index resolution approach
- **Future-Proof**: Adding new handlers follows established pattern

## Cloning Strategy

### Deep Clone Implementation (`_deepClone`)

The component implements a two-tier cloning strategy to maximize browser compatibility:

```
┌─────────────────────────────────┐
│  set data(value) / get data()   │
└────────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │  _deepClone(obj)    │
    └────────┬────────────┘
             │
      ┌──────▼──────┐
      │   Check if  │
      │   structured│
      │   Clone is  │
      │ available?  │
      └──┬───────┬──┘
         │ YES   │ NO
         │       │
    ┌────▼─┐  ┌──▼───────────────┐
    │ Try  │  │ Use JSON Clone   │
    │struct│  │ (fallback)       │
    │Clone │  └──────────────────┘
    └────┬─┘
         │
    ┌────▼──────────┐
    │   Catch Error?│
    │      │        │
    │   YES│  NO    │
    │      │        │
    │ Fallback ─────▼─── Return
    │ to JSON       Clone
    │ Clone        Result
    └────────────────┘
```

### Cloning Methods

#### 1. `structuredClone()` (Primary, ES2022+)

```typescript
return (globalThis as any).structuredClone(obj) as unknown[];
```

**Advantages:**
- Handles circular references
- Preserves `Date`, `Map`, `Set`, `RegExp`, etc.
- Most thorough cloning strategy

**Browser Support:**
- Chrome 98+
- Firefox 94+
- Safari 16+
- Edge 98+

#### 2. JSON Fallback (`_jsonClone`)

```typescript
return JSON.parse(JSON.stringify(obj)) as unknown[];
```

**Advantages:**
- Works in all modern browsers
- Simple and predictable

**Limitations:**
- Cannot clone `Date`, `Map`, `Set`, `RegExp` (converts to `{}`)
- Cannot handle circular references
- Strips methods and `undefined` values

**Browser Support:**
- All browsers (IE9+)

### Error Handling

If both cloning methods fail:

```typescript
catch {
  return [];
}
```

Returns an empty array to prevent component crashes. This protects against:
- Uncloneable objects (e.g., with non-serializable properties)
- Memory constraints in cloning operations
- Unknown runtime errors

## Data Normalization

The `data` setter implements normalization logic:

```typescript
set data(value: unknown) {
  if (!Array.isArray(value)) {
    this._data = [];  // Non-arrays normalize to []
  } else {
    this._data = this._deepClone(value);  // Arrays are deep cloned
  }
}
```

**Normalization Rules:**

| Input Type | Behavior | Result |
|-----------|----------|--------|
| `[]`      | Deep clone | Cloned array |
| `[1, 2]` | Deep clone | `[1, 2]` |
| `null`    | Normalize | `[]` |
| `undefined` | Normalize | `[]` |
| `"string"` | Normalize | `[]` |
| `123`     | Normalize | `[]` |
| `{}`      | Normalize | `[]` |

## Styling

### Constructable Stylesheets Pattern

The component uses the Constructable Stylesheet pattern for optimal performance:

1. **Module Load Time** (`ck-editable-array.styles.ts`):
   - CSS string defined in `ckEditableArrayCSS`
   - `CSSStyleSheet` created once: `ckEditableArraySheet`
   - Sheet is parsed only once (efficient)

   ```typescript
   const sheet = new CSSStyleSheet();
   sheet.replaceSync(ckEditableArrayCSS);
   ```

2. **Per-Instance** (constructor):
   - Adopted into each shadow root
   - Same sheet instance reused across all component instances
   - No per-instance CSS parsing overhead

   ```typescript
   const adopted = this.shadow.adoptedStyleSheets;
   this.shadow.adoptedStyleSheets = [...adopted, ckEditableArraySheet];
   ```

3. **Fallback** (older browsers):
   - If `CSSStyleSheet` not available, `ckEditableArraySheet` is `null`
   - During render, inject `<style>` tag with CSS text
   - Only one `<style>` tag per shadow root (deduplication)

   ```typescript
   if (!ckEditableArraySheet) {
     const style = document.createElement('style');
     style.setAttribute('data-ck-editable-array-fallback', '');
     style.textContent = ckEditableArrayCSS;
     this.shadow.appendChild(style);
   }
   ```

### CSS Custom Properties

Styling is handled via CSS custom properties and internal classes defined in `src/components/ck-editable-array/ck-editable-array.styles.ts`.

## Rendering Pipeline

### connectedCallback

Triggered when element inserted into DOM:

```typescript
connectedCallback() {
  this.render();
}
```

### disconnectedCallback

Triggered when element removed from DOM:

```typescript
disconnectedCallback() {}
```

### attributeChangedCallback

Triggered when observed attributes change:

```typescript
attributeChangedCallback(
  name: string,
  oldValue: string | null,
  newValue: string | null
) {
  if (oldValue !== newValue) {
    if (name === 'name') this._updateNameOnly();
    else if (name === 'root-class' || name === 'rows-class' || name === 'row-class') {
      this._updateWrapperClassesOnly();
    } else {
      this.render();
    }
  }
}
```

### render()

Updates shadow DOM:

1. Ensure `<style>` fallback (if Constructable Stylesheets unavailable)
2. Create the shadow DOM structure once (root container, heading, subtitle, rows host, status region)
3. Apply wrapper classes (`root-class`, `rows-class`, `row-class`) without modifying template markup
4. Update message text + per-instance CSS variables
5. Render rows into `part="rows"` by cloning `<template slot="display">` and `<template slot="edit">` per `data` item and applying `data-bind` bindings (keyed updates + template caching)

```typescript
private render() {
  this._applyWrapperClasses();
  if (this._messageEl) this._messageEl.textContent = `Hello, ${this.name}!`;
  if (this._rowsHostEl) this._renderRows(this._rowsHostEl);
}
```

## Data Binding Implementation

### Form Element Binding

The component automatically populates form element values from `data-bind` attributes.

**Detection**: The `_isFormElement` helper checks if an element is `<input>`, `<select>`, or `<textarea>`:

```typescript
private _isFormElement(el: HTMLElement): boolean {
  const tagName = el.tagName.toLowerCase();
  return (
    tagName === 'input' || tagName === 'select' || tagName === 'textarea'
  );
}
```

**Value Setting**: The `_setFormElementValue` helper sets the appropriate property based on element type:

```typescript
private _setFormElementValue(el: HTMLElement, value: unknown): void {
  const tagName = el.tagName.toLowerCase();

  if (tagName === 'input') {
    const inputEl = el as HTMLInputElement;
    const inputType = inputEl.type.toLowerCase();

    if (inputType === 'checkbox') {
      inputEl.checked = Boolean(value);  // Boolean conversion
    } else if (inputType === 'radio') {
      inputEl.checked = inputEl.value === String(value);  // Match check
    } else {
      // Text, number, email, etc.
      inputEl.value = value === null || value === undefined ? '' : String(value);
    }
  } else if (tagName === 'select') {
    const selectEl = el as HTMLSelectElement;
    selectEl.value = value === null || value === undefined ? '' : String(value);
  } else if (tagName === 'textarea') {
    const textareaEl = el as HTMLTextAreaElement;
    textareaEl.value = value === null || value === undefined ? '' : String(value);
  }
}
```

**Binding Pipeline**: The `_applyBindingsOptimized` method routes to the appropriate handler:

```typescript
private _applyBindingsOptimized(boundEls: HTMLElement[], rowData: unknown) {
  boundEls.forEach(el => {
    const path = el.getAttribute('data-bind');
    const value = this._resolvePath(rowData, path);

    if (this._isFormElement(el)) {
      this._setFormElementValue(el, value);  // Form elements
    } else {
      el.textContent = String(value);  // Non-form elements
    }
  });
}
```

**Key Design Decisions**:
- Form elements use `.value` or `.checked` properties (not `textContent`)
- Non-form elements continue using `textContent` (XSS-safe)
- Null/undefined values map to empty strings for text inputs
- Checkboxes use Boolean() conversion (truthy/falsy)
- Radio buttons check for value match
- Type detection uses tagName (performant, no instanceof)

## Testing Strategy

### Test Coverage

- The test suite covers component instantiation, attribute/property reflection, `data` normalization + cloning, `datachanged`/`rowchanged` event dispatch, `datachangeMode` cadence, template rendering + bindings, wrapper class configuration, accessibility (ARIA + keyboard navigation), **form element value binding**, and basic performance benchmarks.
- Current suite size: **105 tests** across **3 test suites**.

### Test Execution

```bash
# All tests (Jest with jsdom environment)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Key Test Patterns

```typescript
// Immutability verification
const originalData = [{ nested: { value: 'original' } }];
element.data = originalData;
originalData[0].nested.value = 'modified';
expect(element.data[0].nested.value).toBe('original'); // ✓

// Normalization verification
element.data = null;
expect(element.data).toEqual([]); // ✓

// Reference comparison
const data1 = element.data;
const data2 = element.data;
expect(data1).not.toBe(data2); // ✓ (different references)
```

## Performance Considerations

### Cloning Overhead

- **Time Complexity**: O(n) where n = total number of elements/properties
- **Space Complexity**: O(n) for cloned data
- **Practical Impact**:
  - Small arrays (< 1000 items): < 1ms per clone
  - Medium arrays (1000-10000 items): 1-10ms per clone
  - Large arrays (> 10000 items): > 10ms per clone

### Optimization Strategies

1. **Batch Updates**:
   - Avoid repeated `element.data = ...` calls in loops
   - Accumulate changes, then set once

   ```typescript
   // ✗ Bad: Clones 1000 times
   for (let i = 0; i < 1000; i++) {
     element.data = [...element.data, newItem];
   }

   // ✓ Good: Clones once
   const data = element.data;
   for (let i = 0; i < 1000; i++) {
     data.push(newItem);
   }
   element.data = data;
   ```

2. **Edit Cadence**:
   - Listen to `rowchanged` for per-row updates
   - Use `datachangeMode="debounced"` (or `"change"`/`"save"`) to reduce full-array cloning during edits

3. **Lazy Loading**:
   - Load/process data incrementally
   - Only clone when necessary

3. **Data Structure**:
   - Consider using immutable data structures (e.g., Immer)
   - Store metadata separately

### Bundle Size

- Minimal footprint: ~2-3 KB gzipped
- No external dependencies
- Constructable Stylesheet CSS inlined in component
- Only modern web APIs (no polyfills needed)

## Browser Compatibility

### Target Support Matrix

| Feature | ES2020 | ES2022 | Notes |
|---------|--------|--------|-------|
| Web Components | ✓ | ✓ | Custom Elements v1 |
| Shadow DOM | ✓ | ✓ | Open mode |
| CSS Constructable | ✓ | ✓ | With fallback |
| `structuredClone()` | ✗ | ✓ | Graceful fallback |
| JSON Clone | ✓ | ✓ | Fallback method |

**Compiled Target**: ES2020 (TypeScript `target`)
**Runtime Target**: ES2020+ (with ES2022 features gracefully handled)

## Type Safety

### TypeScript Configuration

- **Strict Mode**: Enabled
- **Target**: ES2020
- **Module**: ESNext
- **Lib**: ES2020, DOM

### Type Definitions

Data property uses `unknown[]` to accept any array content:

```typescript
get data(): unknown[];
set data(value: unknown);
```

This allows:
- Consumers to store any serializable/cloneable data
- Component to remain agnostic about data structure
- Type safety at consumer level via generics or type guards

Example typed consumer:

```typescript
interface Task {
  id: number;
  title: string;
  done: boolean;
}

const element = document.querySelector('ck-editable-array') as CkEditableArray;
const tasks = element.data as Task[]; // Consumer asserts type
```

## Security Considerations

### XSS Protection

- Shadow DOM encapsulation prevents CSS injection
- Data stored as-is (no automatic sanitization)
- Consumer responsible for sanitizing data before display

### Data Privacy

- No external data transmission
- All cloning happens locally
- No telemetry or analytics

### Safe Error Handling

- Cloning errors caught and handled gracefully
- Component remains functional even if cloning fails
- Empty array fallback prevents data loss

## Future Enhancements

Potential improvements for future versions:

1. **Events**:
   - `data-accessed` event on data retrieval
   - Additional events for edit/selection workflows (see `docs/prompts/req.md`)

2. **Methods**:
   - `addItem(item)` - Helper for adding single items
   - `removeItem(id)` - Helper for removing items
   - `updateItem(id, changes)` - Helper for updating items
   - `clear()` - Clear all data

3. **Performance**:
   - Optional shallow cloning mode
   - Optional lazy cloning (on-demand)
   - Batch update API

4. **Accessibility**:
   - ARIA attributes for data display
   - Keyboard navigation if extended to edit mode

5. **Styling**:
   - CSS shadow parts for better customization
   - Theme variants support

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (watches and rebuilds)
npm run dev

# Serve demo page
npm run serve

# Watch tests
npm run test:watch
```

### Building

```bash
# Build for production
npm run build

# Output:
# dist/
# ├── ck-editable-array/
# │   ├── ck-editable-array.js (UMD)
# │   ├── ck-editable-array.esm.js (ES Module)
# │   ├── ck-editable-array.min.js (Minified UMD)
# │   └── ck-editable-array.d.ts (Type Definitions)
# └── index.d.ts
```

### Code Quality

```bash
# Lint TypeScript
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## References

- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [MDN: Custom Elements API](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [MDN: Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [MDN: Constructable StyleSheet](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet)
- [structuredClone() Specification](https://html.spec.whatwg.org/multipage/structured-data.html#structured-clone)
- [Web Components Best Practices](https://www.webcomponents.org/articles/web-components-best-practices/)
