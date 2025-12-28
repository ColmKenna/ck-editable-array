# CkEditableArray Component - Technical Documentation

## Architecture Overview

`CkEditableArray` is a custom HTML element that extends `HTMLElement` with data management capabilities and shadow DOM rendering. It uses TypeScript, Constructable Stylesheets, and modern web component patterns.

## Class Structure

```typescript
export class CkEditableArray extends HTMLElement {
  static formAssociated = true;

  private shadow: ShadowRoot;          // Shadow DOM root
  private _data: unknown[] = [];       // Internal data storage
  private _rootEl: HTMLDivElement;     // Shadow content root (preserves fallback styles)
  private _internals: ElementInternals; // Form integration

  // Public API - Properties
  get data(): unknown[];
  set data(value: unknown);
  get datachangeMode(): 'debounced' | 'change' | 'save';
  set datachangeMode(value: 'debounced' | 'change' | 'save');
  get datachangeDebounce(): number;
  set datachangeDebounce(value: number);
  get name(): string;
  set name(value: string);
  get readonly(): boolean;
  set readonly(value: boolean);
  get allowReorder(): boolean;
  set allowReorder(value: boolean);
  get rootClass(): string;
  set rootClass(value: string);
  get rowsClass(): string;
  set rowsClass(value: string);
  get rowClass(): string;
  set rowClass(value: string);

  // Public API - Methods
  moveUp(index: number): boolean;
  moveDown(index: number): boolean;

  // Lifecycle hooks
  connectedCallback();
  disconnectedCallback();
  attributeChangedCallback(name: string, oldValue: string, newValue: string);
  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;

  // Static observers
  static get observedAttributes();

  // Private methods
  private _deepClone(obj: unknown): unknown[];
  private _jsonClone(obj: unknown): unknown[];
  private _getDisplayTemplate(): HTMLTemplateElement | null;
  private _renderRows(rowsHost: HTMLElement);
  private _applyBindings(root: ParentNode, rowData: unknown);
  private _resolvePath(obj: unknown, path: string): unknown;
  private _animatedReorderData(fromIndex: number, toIndex: number): void;
  private _reorderData(fromIndex: number, toIndex: number): void;
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

## Readonly Enforcement

Readonly is enforced at the event and UI layers to prevent mutation while still allowing cancel to exit edit mode.

- `readonly` is observed and only triggers DOM updates once `_rootEl` is initialized.
- `_handleInputChange` returns early when `readonly` is set (no data mutation or events).
- `_handleShadowClick` ignores all actions except `cancel` when `readonly` is set.
- `_enterEditMode`, `_saveRow`, and `_toggleDeleteRow` guard against readonly.
- `_updateRowIndexAndButtons` updates disabled states for edit/save/delete based on `readonly` and `isDeleted`.

## Allow Reorder Control

The `allowReorder` property controls whether drag-and-drop and programmatic reordering are available.

- `allowReorder` defaults to `true` (reordering enabled)
- When `false`, drag-and-drop operations are blocked
- The `draggable` attribute on rows is set to `'false'` when `allowReorder` is false
- Move buttons (`moveUp`/`moveDown`) are hidden when `allowReorder` is false
- The `moveUp()` and `moveDown()` methods check `allowReorder` and return `false` if it's disabled
- Drag event handlers respect `allowReorder` setting

## Drag and Drop Implementation

The component supports drag and drop reordering of rows using native HTML5 drag and drop APIs.

### State Management

```typescript
private _dragSourceIndex: number | null = null;  // Tracks row being dragged
```

### Drag Event Handlers

The component attaches five drag event handlers to each row:

1. **`_handleDragStart(event: DragEvent)`**
   - Sets `_dragSourceIndex` to the row's current index
   - Adds `ck-dragging` class to the row
   - Sets `dataTransfer.effectAllowed = 'move'`
   - Stores row index in `dataTransfer` as `text/plain`
   - Guards: blocks if `readonly` or any row is in edit mode

2. **`_handleDragOver(event: DragEvent)`**
   - Prevents default to allow drop
   - Adds `ck-drag-over` class to target row
   - Sets `dataTransfer.dropEffect = 'move'`
   - Guards: blocks if `readonly`

3. **`_handleDragLeave(event: DragEvent)`**
   - Removes `ck-drag-over` class from target row

4. **`_handleDrop(event: DragEvent)`**
   - Validates source and target indices
   - Blocks if same-row drop or invalid indices
   - Calls `_reorderData(fromIndex, toIndex)` on success
   - Clears drag state and classes

5. **`_handleDragEnd(event: DragEvent)`**
   - Removes `ck-dragging` class from source row
   - Clears `_dragSourceIndex`
   - Clears all drag-related classes

### Reorder Implementation

The `_reorderData` method is optimized to avoid full re-renders:

```typescript
private _reorderData(fromIndex: number, toIndex: number): void {
  // Remove item from original position
  const [movedItem] = this._data.splice(fromIndex, 1);

  // Insert at new position
  this._data.splice(toIndex, 0, movedItem);

  // Update DOM without full re-render (performance optimization)
  this._updateRowIndicesAfterReorder(fromIndex, toIndex);

  // Dispatch reorder event
  this.dispatchEvent(new CustomEvent('reorder', {
    detail: { fromIndex, toIndex, data: this._deepClone(this._data) },
    bubbles: true,
    composed: true
  }));

  // Dispatch datachanged event
  this._dispatchDataChanged();

  // Announce for accessibility
  this._announceAction(`Moved item from position ${fromIndex + 1} to ${toIndex + 1}`);
}
```

### Performance Optimization

Instead of calling `render()` which recreates all DOM elements, the `_updateRowIndicesAfterReorder` method:

1. **Moves the DOM element** directly to its new position using `insertBefore()`
2. **Updates only affected attributes** (data-row, aria-labels, button states)
3. **Preserves all existing state** (event listeners, form values, edit mode)

This approach provides significant performance benefits:
- No template re-parsing or re-cloning
- Event listeners remain intact
- Form control values preserved
- No re-render flicker
- Works correctly even when a different row is in edit mode

### CSS Classes

| Class | Applied When |
|-------|--------------|
| `ck-dragging` | Row is being dragged (drag and drop) |
| `ck-drag-over` | Row is a valid drop target during dragover (drag and drop) |
| `ck-animating` | Row is animating during moveUp/moveDown (programmatic reordering) |

### Draggable Attribute

The `draggable` attribute is set on each row during render:

```typescript
rowEl.setAttribute('draggable', this.readonly ? 'false' : 'true');
```

### Guards

Drag and drop is blocked in these scenarios:
- `readonly` attribute is set on the component
- Any row is currently in edit mode (`_currentEditIndex !== null`)
- Attempting to drop on the same row
- Invalid indices (out of bounds, non-finite)

## Move Up/Down Methods with Animation

The component provides `moveUp(index)` and `moveDown(index)` public methods for programmatic reordering with smooth animations.

### State Management

```typescript
private _isAnimating = false;
private static readonly ANIMATION_DURATION = 250; // ms
```

### Animation Implementation

The `_animatedReorderData` method uses the FLIP technique (First, Last, Invert, Play):

1. **FIRST**: Record initial positions of both rows using `getBoundingClientRect()`
2. **LAST**: Calculate the vertical distance between rows (`deltaY`)
3. **INVERT**: Apply inverse transforms to keep rows in original visual position
4. **PLAY**: Transition to final positions with CSS transforms

```typescript
private _animatedReorderData(fromIndex: number, toIndex: number): void {
  // Get rows and record initial positions
  const fromRow = rows[fromIndex] as HTMLElement;
  const toRow = rows[toIndex] as HTMLElement;
  const fromRect = fromRow.getBoundingClientRect();
  const toRect = toRow.getBoundingClientRect();
  const deltaY = toRect.top - fromRect.top;

  // Set animation flag to block rapid clicks
  this._isAnimating = true;

  // Add class and apply CSS transitions
  fromRow.classList.add('ck-animating');
  toRow.classList.add('ck-animating');
  fromRow.style.transition = 'transform 250ms ease-in-out';
  toRow.style.transition = 'transform 250ms ease-in-out';
  fromRow.style.transform = `translateY(${deltaY}px)`;
  toRow.style.transform = `translateY(${-deltaY}px)`;

  // After animation, update data and re-render
  window.setTimeout(() => {
    // Cleanup styles
    fromRow.style.transition = '';
    fromRow.style.transform = '';
    fromRow.classList.remove('ck-animating');

    // Reorder data
    const [movedItem] = this._data.splice(fromIndex, 1);
    this._data.splice(toIndex, 0, movedItem);
    this.render(); // Full re-render to update DOM order

    this._isAnimating = false;

    // Dispatch events after animation
    this.dispatchEvent(new CustomEvent('reorder', { ... }));
    this._dispatchDataChanged();
  }, 250);
}
```

### Key Features

- **Duration**: 250ms with ease-in-out timing
- **Adjacent Animation**: Both the moving row and its swap target animate simultaneously
- **Animation Blocking**: The `_isAnimating` flag prevents rapid consecutive clicks
- **Events After Animation**: `reorder` and `datachanged` events fire after animation completes
- **Fallback**: If rows aren't found, falls back to instant `_reorderData()`

### Guards for Move Methods

Both `moveUp()` and `moveDown()` return `false` if:
- `readonly` attribute is set
- Any row is in edit mode (`_currentEditIndex !== null`)
- An animation is currently in progress (`_isAnimating === true`)
- Index is invalid or at array boundary

### Difference from Drag and Drop

- **Drag and Drop**: Instant reordering using `_reorderData()` with DOM element movement
- **Move Up/Down**: Animated reordering using `_animatedReorderData()` with FLIP technique and `render()`

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

## Accessibility Implementation

The component implements comprehensive accessibility support using valid ARIA semantics and WAI-ARIA best practices.

### ARIA Structure (List Pattern)

The component uses the **list pattern** rather than a grid/table pattern:

```typescript
// Container element (lines 356-357)
this._containerEl.setAttribute('role', 'region');
this._containerEl.setAttribute('aria-label', 'Editable array display');

// Rows host element (lines 368-369)
this._rowsHostEl.setAttribute('role', 'list');
this._rowsHostEl.setAttribute('aria-label', 'Array items');

// Individual row elements (line 587)
rowEl.setAttribute('role', 'listitem');

// Bound elements: NO explicit role - inherit from context
```

**Rationale for List Pattern:**
- An editable array is semantically a list of items, not a tabular data structure
- List/listitem relationship is valid per WAI-ARIA specifications
- Bound elements (`data-bind` attributes) have no explicit role - they inherit natural semantics from their HTML element type and listitem context

**Alternative Considered:**
- Grid pattern (`role="grid"` + `role="row"` + `role="gridcell"`) would be appropriate for tabular data with distinct columns
- Decision: Keep list pattern as it better represents the semantic structure of an array

### ARIA Semantics Methods

**`_applyFormSemanticsOptimized(rowEl, boundEls, rowData, rowIndex)` (lines 915-931):**
- Sets form-related data attributes ONLY (`data-form-row-index`, `data-form-row-data`)
- **Does NOT set ARIA roles** - this is intentional to maintain separation of concerns
- Form semantics are separate from ARIA semantics

**Previous Issue (H-A11y-RoleCell):**
- **Before:** This method incorrectly set `role="cell"` on bound elements
- **Problem:** `role="cell"` under `role="list"` is invalid ARIA (cells belong in grids/tables)
- **Fix:** Removed role assignment entirely from this method
- **Validation:** Test `should not assign grid cell roles when using list semantics` (line 341)

### Live Region Announcements

```typescript
// Status region setup (lines 374-378)
this._statusRegionEl.setAttribute('role', 'status');
this._statusRegionEl.setAttribute('aria-live', 'polite');
this._statusRegionEl.setAttribute('aria-atomic', 'true');

// Announce actions (lines 987-994)
private _announceAction(message: string) {
  const statusRegion = this.shadowRoot?.querySelector('[role="status"]');
  if (statusRegion) {
    statusRegion.textContent = message;
  }
}
```

**Announcement Triggers:**
- Data changes: "X items in array"
- Edit mode: "Editing item N"
- Save action: "Saved item N"
- Cancel action: "Canceled edits for item N"
- Reorder: "Moved item from position X to Y"

### Button Accessibility

All action buttons include:
- **Contextual `aria-label`** with row number (e.g., "Edit item 1", "Delete item 2")
- **`aria-expanded`** state on edit button (indicates whether row is in edit mode)
- **Disabled states** that reflect readonly, deleted, and boundary conditions

### Keyboard Navigation

**Arrow Key Navigation (lines 941-968):**
```typescript
private _handleRowKeydown(event: KeyboardEvent) {
  // Compute index from DOM at runtime (not from closures)
  const rowIndex = Number(rowEl.getAttribute('data-row'));

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    rows[rowIndex + 1]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    rows[rowIndex - 1]?.focus();
  }
}
```

### Focus Management

**Focus Restoration After Actions (lines 1209-1213, 1263-1267):**
- After save: focus returns to edit button
- After cancel: focus returns to edit button
- Prevents focus loss and maintains keyboard navigation context

### Motion Preferences (prefers-reduced-motion)

The component respects user motion preferences to protect users with vestibular disorders or motion sensitivity.

**Implementation (Dual-Layer Protection):**

**Layer 1: JavaScript Check (lines 1821-1830)**
```typescript
private _animatedReorderData(fromIndex: number, toIndex: number): void {
  // Check if user prefers reduced motion
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Skip animation and perform instant reorder
    this._reorderData(fromIndex, toIndex);
    return;
  }
  // ... continue with FLIP animation
}
```

**Layer 2: CSS Media Query (lines 66-75)**
```css
@media (prefers-reduced-motion: reduce) {
  .row {
    transition: none !important;
  }

  .ck-animating {
    transition: none !important;
    transform: none !important;
  }
}
```

**Why Dual-Layer?**
- **JavaScript**: Prevents animation code from running (primary protection)
- **CSS**: Disables transitions as defensive measure in case animation code runs
- **Result**: Defense in depth ensures no motion even if one layer fails

**Graceful Degradation:**
- Checks if `window.matchMedia` exists before using it
- Falls back to animation if API unavailable (older browsers)

**User Experience:**
- **Reduce motion enabled**: Instant reordering, no visual animation
- **Reduce motion disabled**: Smooth 250ms FLIP animation with visual feedback

**Accessibility Impact:**
- Protects users with vestibular disorders
- Prevents discomfort for motion-sensitive users
- Complies with WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions)

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
