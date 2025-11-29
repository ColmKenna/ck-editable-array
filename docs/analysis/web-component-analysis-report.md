# ck-editable-array Web Component Analysis Report

**Analysis Date:** November 29, 2025  
**Analyzer:** GitHub Copilot (Claude Opus 4.5)  
**Entry File:** `src/components/ck-editable-array/ck-editable-array.ts`

---

## 1. Executive Summary

- **Purpose:** A template-driven web component for managing editable arrays with CRUD operations, validation, and accessibility support. Renders user-provided display/edit templates for each array item with declarative data binding.

- **Type:** Native Custom Elements v1 + Shadow DOM (no framework dependencies)

- **Complexity:** **Complex** — 1158 lines in main component + ~650 lines in DomRenderer + ~130 lines in ValidationManager. Features include: immutable data flow, schema-based validation, modal edit mode, style mirroring, keyed rendering, i18n support, and comprehensive event system.

- **Key Dependencies:**
  - No external runtime dependencies
  - Build: Rollup, TypeScript
  - Test: Jest, jsdom

---

## 2. Quick Reference

| Aspect | Details |
|--------|---------|
| Tag Name | `<ck-editable-array>` |
| Key Attributes | `name`, `readonly`, `modal-edit` |
| Main Events | `datachanged`, `beforetogglemode`, `aftertogglemode` |
| CSS Variables | 6 (`--ck-row-padding`, `--ck-error-color`, etc.) |
| Shadow DOM | Yes, Open mode |
| Framework | Native (Custom Elements v1) |

---

## 3. Public API (Consumer-Facing)

### 3.1 Attributes / Properties

| Name | Kind | Type | Default | Required | Reflects | Observed | Description |
|------|------|------|---------|----------|----------|----------|-------------|
| `name` | Attr | `string` | `null` | No | No | Yes | Base name for input elements (`name[idx].field`) |
| `readonly` | Attr | `boolean` | `false` | No | No | Yes | Disables all editing operations |
| `modal-edit` | Attr | `boolean` | `false` | No | Yes | Yes | Renders edit template in modal overlay |
| `data` | Prop | `unknown[]` | `[]` | No | N/A | N/A | Array of row data (cloned on get/set) |
| `schema` | Prop | `ValidationSchema \| null` | `null` | No | N/A | N/A | JSON Schema-like validation rules |
| `i18n` | Prop | `I18nMessages` | `undefined` | No | N/A | N/A | Custom validation error messages |
| `newItemFactory` | Prop | `() => EditableRow` | `() => ({})` | No | N/A | N/A | Factory function for new rows |
| `modalEdit` | Prop | `boolean` | `false` | No | Yes | N/A | JavaScript API for `modal-edit` attribute |

**Evidence:** `ck-editable-array.ts:57-209`

### 3.2 Slots

| Name | Required | Purpose | Fallback Content |
|------|----------|---------|------------------|
| `display` | Yes | Template for display mode rows | None (required) |
| `edit` | Yes | Template for edit mode rows | None (required) |
| `styles` | No | Custom styles to mirror into shadow DOM | None |
| `add-button` | No | Custom add button template | Default "Add Item" button |
| `button-edit` | No | Custom edit/toggle button | None |
| `button-save` | No | Custom save button | None |
| `button-cancel` | No | Custom cancel button | None |
| `button-delete` | No | Custom delete button | None |
| `button-restore` | No | Custom restore button | None |

**Evidence:** `dom-renderer.ts:288-322`, `ck-editable-array.ts:256-286`

### 3.3 CSS Custom Properties

| Property | Expected Values | Default | Effect |
|----------|-----------------|---------|--------|
| `--ck-row-padding` | `<length>` | `12px` | Padding for row elements |
| `--ck-error-color` | `<color>` | `#dc3545` | Validation error styling |
| `--ck-border-radius` | `<length>` | `4px` | Border radius for elements |
| `--ck-border-color` | `<color>` | `#ddd` | Default border color |
| `--ck-focus-color` | `<color>` | `#0066cc` | Focus indicator color |
| `--ck-disabled-opacity` | `<number>` | `0.5` | Opacity for disabled elements |

**Evidence:** `ck-editable-array.ts:73-80`

### 3.4 CSS Shadow Parts

| Part Name | Element | Purpose |
|-----------|---------|---------|
| `root` | `<div>` | Main container wrapper |
| `rows` | `<div>` | Container for all row elements |
| `add-button` | `<div>` | Container for add button |
| `modal` | `<div>` | Modal overlay (when `modal-edit` enabled) |
| `modal-surface` | `<div>` | Modal dialog surface |

**Evidence:** `ck-editable-array.ts:109-147`

### 3.5 Methods

| Method | Signature | Visibility | Side Effects | Returns | Throws |
|--------|-----------|------------|--------------|---------|--------|
| `validateRowDetailed` | `(rowIndex: number) => ValidationResult` | public | None | `{ isValid, errors }` | No |
| `updateSaveButtonState` | `(rowIndex: number) => void` | public (@internal) | Updates DOM | `void` | No |

**Evidence:** `ck-editable-array.ts:961-1083`

### 3.6 Events

| Event Name | `detail` Type | When Fired | Bubbles | Composed | Cancelable |
|------------|---------------|------------|---------|----------|------------|
| `datachanged` | `{ data: unknown[] }` | On data mutations (save, add, delete, restore) | Yes | Yes | No |
| `beforetogglemode` | `{ index, from, to }` | Before mode transition | Yes | Yes | **Yes** |
| `aftertogglemode` | `{ index, mode }` | After mode transition | Yes | Yes | No |

**Evidence:** `ck-editable-array.ts:586-592, 780-862`

### 3.7 Outputs Summary

- **Return Values:** `validateRowDetailed()` returns `{ isValid: boolean, errors: Record<string, string[]> }`
- **Event Data:** `datachanged.detail.data` is always a deep clone (safe to mutate)
- **State Exposure:** `el.data` returns cloned array; `el.editingRowIndex` (internal) returns current editing row index

---

## 4. Usage Examples

### 4.1 Basic Usage

```html
<ck-editable-array name="contacts">
  <template slot="display">
    <div class="row">
      <span data-bind="name"></span>
      <span data-bind="email"></span>
      <button data-action="toggle">Edit</button>
      <button data-action="delete">Delete</button>
    </div>
  </template>
  <template slot="edit">
    <div class="row">
      <input data-bind="name" placeholder="Name">
      <input data-bind="email" placeholder="Email">
      <span data-field-error="name"></span>
      <span data-field-error="email"></span>
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>
```

### 4.2 JavaScript Integration

```typescript
const el = document.querySelector('ck-editable-array');

// Set data
el.data = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
];

// Set validation schema
el.schema = {
  required: ['name', 'email'],
  properties: {
    name: { minLength: 2 },
    email: { minLength: 5 }
  }
};

// Set custom factory for new items
el.newItemFactory = () => ({ name: '', email: '', createdAt: new Date().toISOString() });

// Listen for changes
el.addEventListener('datachanged', (e: CustomEvent<{ data: unknown[] }>) => {
  console.log('Data changed:', e.detail.data);
  // Safe to mutate e.detail.data - it's a clone
});

// Intercept mode changes
el.addEventListener('beforetogglemode', (e: CustomEvent) => {
  if (!confirm('Are you sure?')) {
    e.preventDefault(); // Cancel the mode switch
  }
});
```

### 4.3 Styling Examples

```css
/* External theming via CSS custom properties */
ck-editable-array {
  --ck-error-color: #e74c3c;
  --ck-border-radius: 8px;
  --ck-focus-color: #3498db;
}

/* Shadow parts styling */
ck-editable-array::part(root) {
  padding: 16px;
  background: #f5f5f5;
}

ck-editable-array::part(rows) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

ck-editable-array::part(modal) {
  backdrop-filter: blur(4px);
}

ck-editable-array::part(modal-surface) {
  max-width: 600px;
  border-radius: 12px;
}
```

### 4.4 Modal Edit Mode

```html
<ck-editable-array modal-edit>
  <!-- Same templates as above -->
</ck-editable-array>
```

---

## 5. Internal Design & Architecture

### 5.1 File Structure & Dependencies

```
src/components/ck-editable-array/
├── ck-editable-array.ts      # Main component (1158 lines)
│   ├─ imports: types.ts, validation-manager.ts, dom-renderer.ts
│   └─ exports: CkEditableArray class
├── dom-renderer.ts           # DOM operations (~650 lines)
│   └─ imports: types.ts
├── validation-manager.ts     # Validation logic (~130 lines)
│   └─ imports: types.ts
└── types.ts                  # Type definitions (~100 lines)
    └─ exports: interfaces, constants

external: none (pure native implementation)
```

### 5.2 State Management

**State Model:**
```typescript
// Primary state
_data: EditableRow[]           // Array with internal markers
_rowKeys: string[]             // Stable keys for keyed rendering
_nextId: number                // Key generator counter

// Configuration state
_schema: ValidationSchema | null
_i18n: I18nMessages | undefined
_newItemFactory: () => EditableRow

// Infrastructure
_styleObserver: MutationObserver | null
_domRenderer: DomRenderer
```

**Internal Row Markers:**
- `editing: boolean` — Row is in edit mode
- `deleted: boolean` — Row is soft-deleted
- `__originalSnapshot: Record<string, unknown>` — For cancel/rollback (filtered from public API)
- `__isNew: boolean` — Row was just added (filtered from public API)

**State Flow:**
1. External data → `data` setter → deep clone → `_data`
2. User interaction → `commitRowValue()` → `_data` mutation → `updateBoundNodes()` or `render()`
3. Save/Cancel → remove markers → `render()` → `dispatchDataChanged()`

### 5.3 Lifecycle & Rendering

**Construction:**
1. Create `DomRenderer` instance
2. Attach shadow DOM (`open` mode) if not exists
3. Inject base styles (CSS custom properties, hidden class, modal styles)
4. Create structural elements: `[part="root"]`, `[part="rows"]`, `[part="add-button"]`, `[part="modal"]`

**Connection (connectedCallback):**
1. `mirrorStyles()` — Copy `<style slot="styles">` to shadow DOM
2. `observeStyleChanges()` — Set up MutationObserver for style updates
3. `render()` — Initial render

**Updates:**
- `attributeChangedCallback` triggers re-render for `name`, `readonly`, `modal-edit`
- Data mutations trigger either `updateBoundNodes()` (partial) or `render()` (full)

**Disconnection (disconnectedCallback):**
- Disconnect `_styleObserver`
- **Gap identified**: AbortControllers in DomRenderer not explicitly aborted

**Rendering Strategy:**
- Keyed partial re-rendering via `DomRenderer`
- Template cloning with `cloneNode(true)`
- DOM diffing based on `data-key` attributes
- Event listeners managed via `AbortController` per row element

### 5.4 Data Flow

```
Inputs                     Processing                Internal State          Render                   Outputs
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
el.data = [...]      →     cloneRow()            →   _data[]          →     DomRenderer.render()  →  DOM updates
                                                                             ├─ createRowElement()
input change         →     commitRowValue()      →   _data[i][key]    →     ├─ bindDataToNode()   →  datachanged event
                           └─ updateBoundNodes()                              └─ setupEventListeners()

toggle click         →     beforetogglemode      →   editing flag     →     render()              →  aftertogglemode
                           (cancelable)               snapshot                                        (not cancelable)

save click           →     validateRow()         →   remove markers   →     render()              →  datachanged
                           └─ (if valid)                                     focus restoration

cancel click         →     restoreFromSnapshot() →   _data restored   →     render()              →  aftertogglemode
                           └─ or remove if __isNew                           focus restoration
```

### 5.5 Side Effects & External Interactions

| Side Effect | Location | Cleanup |
|------------|----------|---------|
| MutationObserver on light DOM | `observeStyleChanges()` | `disconnectedCallback()` |
| Event listeners via AbortController | `DomRenderer._rowControllers` | Row removal, element update |
| `requestAnimationFrame` for focus | `handleToggleClick()`, `handleSaveClick()`, `handleCancelClick()` | Self-cleaning |

**Gap identified**: No cleanup of AbortControllers in `disconnectedCallback()`.

### 5.6 Error Handling

- **Validation errors**: Surfaced via `validateRowDetailed()` → displayed in `[data-field-error]` elements
- **Circular reference**: `cloneRow()` catches JSON parse error, falls back to shallow copy with console warning
- **Invalid input**: Non-array `data` normalized to `[]`; non-function `newItemFactory` reset to default

---

## 6. TypeScript/JavaScript Specifics

### 6.1 Type Definitions

**Public Types (exported from types.ts):**
```typescript
interface ValidationResult { isValid: boolean; errors: Record<string, string[]> }
interface ValidationSchema { type?: string; required?: string[]; properties?: Record<string, PropertySchema> }
interface PropertySchema { type?: string; minLength?: number }
interface I18nMessages { required?: (field: string) => string; minLength?: (field: string, min: number) => string }
```

**Internal Types:**
```typescript
interface InternalRowData extends Record<string, unknown> {
  __key?: string; editing?: boolean; deleted?: boolean;
  __originalSnapshot?: Record<string, unknown>; __isNew?: boolean;
}
type EditableRow = InternalRowData | string;
type RenderMode = 'display' | 'edit';
```

### 6.2 JS/TS Patterns

- **Class composition**: Main class delegates to `DomRenderer` and `ValidationManager`
- **Private properties**: `_` prefix convention, not native `#` private fields
- **Static constants**: Exported via `CONSTANTS` object and exposed as static readonly on class
- **Guard pattern**: Custom element registration guarded with `if (!customElements.get(...))`

---

## 7. Performance & Optimization

### 7.1 Characteristics

| Aspect | Assessment |
|--------|------------|
| Render cost | Medium — keyed diffing reduces DOM churn |
| Memory patterns | Good — AbortController cleanup per row |
| Bundle impact | Small (~2KB gzipped, tree-shakeable) |
| Initialization | Fast — single shadow DOM setup |

### 7.2 Current Strategies

1. **Keyed rendering**: DOM nodes reused based on stable row keys
2. **Partial updates**: `updateBoundNodes()` for input changes
3. **AbortController**: Event listener cleanup on row removal/update
4. **Selective validation**: Only validates affected row

### 7.3 Optimization Gaps

1. **No render debouncing**: Rapid data changes trigger multiple renders
2. **No virtual scrolling**: Performance degrades with large datasets (>100 items)
3. **No memoization**: Validation re-runs on every input change
4. **Inline styles**: Base styles duplicated per instance (no Constructable Stylesheets)

---

## 8. Accessibility & Standards

### 8.1 A11y Features

**Implemented:**
- `aria-invalid` on inputs with validation errors
- `aria-describedby` linking inputs to error messages
- `aria-checked` on radio buttons and checkboxes
- `aria-disabled` on locked rows
- `aria-modal="true"` and `role="dialog"` on modal
- `aria-hidden` toggled on modal overlay
- `inert` attribute on locked rows
- `[data-error-summary]` support for error announcements

**Keyboard Navigation:**
- Tab order follows DOM structure
- Focus auto-moves to first input on edit mode entry
- Focus restores to toggle button on save/cancel

**Gaps Identified:**
1. No `aria-live` region for screen reader announcements
2. No focus trapping in modal
3. No Escape key handler for cancel
4. No Enter key handler for save

### 8.2 Web Standards Compliance

- ✅ `customElements.define` with guard
- ✅ Shadow DOM encapsulation (open mode)
- ✅ Proper `attachShadow()` usage
- ⚠️ No `ElementInternals` for form association
- ⚠️ No Declarative Shadow DOM support for SSR

---

## 9. Browser Compatibility & Limitations

### 9.1 Support Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Custom Elements v1 | 67+ | 63+ | 10.1+ | 79+ |
| Shadow DOM v1 | 53+ | 63+ | 10+ | 79+ |
| AbortController | 66+ | 57+ | 11.1+ | 79+ |
| inert attribute | 102+ | 112+ | 15.5+ | 102+ |

**Polyfills needed for older browsers:**
- `@webcomponents/webcomponentsjs` for Custom Elements/Shadow DOM
- `wicg-inert` for inert attribute

### 9.2 Known Limitations

1. **JSON serialization**: Cloning via `JSON.parse(JSON.stringify())` loses functions, symbols, Dates, circular refs
2. **Large datasets**: Performance degrades beyond ~100 items
3. **No SSR**: No Declarative Shadow DOM support
4. **No form association**: Component doesn't participate in native form submission

### 9.3 Common Pitfalls

1. **Mutating `el.data`**: Returns clone, mutations don't affect component
2. **Forgetting templates**: Component requires `slot="display"` and `slot="edit"` templates
3. **Stale event handlers**: Use `{ signal }` option with AbortController
4. **Validation timing**: Validation runs on every input, not just on save

---

## 10. Development & Testing Guidance

### 10.1 Key Test Scenarios

| Category | Test Focus |
|----------|------------|
| Unit | Data cloning, validation logic, event dispatch |
| Integration | Template rendering, data binding, mode switching |
| A11y | ARIA attributes, keyboard navigation, focus management |
| Performance | Keyed rendering, partial updates |
| Security | XSS prevention (textContent usage) |

### 10.2 Dev Workflow

```powershell
npm run dev       # Watch mode
npm test          # Run all tests
npm run lint      # ESLint check
npm run build     # Production build
```

**Debugging tips:**
- Inspect shadow DOM in DevTools (Elements > #shadow-root)
- Log events: `el.addEventListener('datachanged', console.log)`
- Check validation: `el.validateRowDetailed(0)`

---

# Improvement Plan Based on Analysis

## Priority 1: Critical Gaps (Blocking Enterprise Adoption)

### 1.1 Memory Management — AbortController Cleanup in disconnectedCallback

**Current State:** `DomRenderer._rowControllers` stores AbortControllers per row element but they are not aborted when the component is removed from DOM.

**Improvement:**
```typescript
// In CkEditableArray
disconnectedCallback(): void {
  if (this._styleObserver) {
    this._styleObserver.disconnect();
    this._styleObserver = null;
  }
  // NEW: Clean up DomRenderer controllers
  this._domRenderer.cleanup();
}

// In DomRenderer
public cleanup(): void {
  this._rowControllers.forEach(controller => controller.abort());
  this._rowControllers.clear();
}
```

**Task Reference:** Task 5.1-5.5 in `tasks.md`

### 1.2 Form Association via ElementInternals

**Current State:** Component doesn't participate in native form submission or validation.

**Improvement:**
```typescript
export class CkEditableArray extends HTMLElement {
  static formAssociated = true;
  private _internals: ElementInternals;
  
  constructor() {
    super();
    this._internals = this.attachInternals();
  }
  
  // Implement formResetCallback, formStateRestoreCallback
  // Report value via this._internals.setFormValue()
  // Participate in validation via this._internals.setValidity()
}
```

**Task Reference:** Task 10.1-10.5 in `tasks.md`

---

## Priority 2: Performance Optimizations

### 2.1 Constructable Stylesheets

**Current State:** Base styles are injected as a `<style>` element in each instance's shadow DOM.

**Improvement:**
```typescript
// New StyleManager module
export class StyleManager {
  private static _sharedSheet: CSSStyleSheet | null = null;
  
  static get supportsConstructableStylesheets(): boolean {
    return 'adoptedStyleSheets' in Document.prototype;
  }
  
  static applyStyles(shadowRoot: ShadowRoot, cssText: string): void {
    if (this.supportsConstructableStylesheets) {
      if (!this._sharedSheet) {
        this._sharedSheet = new CSSStyleSheet();
        this._sharedSheet.replaceSync(cssText);
      }
      shadowRoot.adoptedStyleSheets = [this._sharedSheet];
    } else {
      // Fallback to <style> element
    }
  }
}
```

**Benefits:** Shared stylesheet across all instances, instant style updates, reduced memory.

**Task Reference:** Task 1.1-1.3 in `tasks.md`

### 2.2 Render Debouncing

**Current State:** Each data change triggers immediate render.

**Improvement:**
```typescript
private _pendingRender = false;

private scheduleRender(): void {
  if (this._pendingRender) return;
  this._pendingRender = true;
  requestAnimationFrame(() => {
    this._pendingRender = false;
    this.render();
  });
}
```

**Task Reference:** Task 9.1-9.2 in `tasks.md`

---

## Priority 3: Enhanced Validation

### 3.1 Additional Validation Constraints

**Current State:** Only `required` and `minLength` supported.

**Improvement:**
```typescript
interface PropertySchema {
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;        // NEW
  pattern?: string;          // NEW (regex)
  patternMessage?: string;   // NEW (custom error)
}
```

**Implementation:** Extend `ValidationManager.validatePropertyConstraints()` with new validators.

**Task Reference:** Task 3.1-3.7 in `tasks.md`

---

## Priority 4: Accessibility Enhancements

### 4.1 Live Region for Screen Reader Announcements

**Improvement:**
```typescript
// In constructor
const liveRegion = document.createElement('div');
liveRegion.setAttribute('aria-live', 'polite');
liveRegion.setAttribute('aria-atomic', 'true');
liveRegion.className = 'visually-hidden';
this.shadowRoot.appendChild(liveRegion);

// On mode change
this.announceModeChange(rowIndex, mode);
// On validation error
this.announceErrors(errorCount);
```

**Task Reference:** Task 7.1-7.2 in `tasks.md`

### 4.2 Modal Focus Trapping

**Improvement:**
```typescript
private trapFocus(container: HTMLElement): void {
  const focusables = container.querySelectorAll(
    'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        (last as HTMLElement).focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        (first as HTMLElement).focus();
      }
    }
  });
}
```

**Task Reference:** Task 7.3-7.4 in `tasks.md`

### 4.3 Keyboard Shortcuts (Escape/Enter)

**Improvement:**
```typescript
// In edit mode
wrapper.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    this.context.handleCancelClick(rowIndex);
  }
  if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
    this.context.handleSaveClick(rowIndex);
  }
});
```

**Task Reference:** Task 7.7-7.8 in `tasks.md`

---

## Priority 5: Event System Expansion

### 5.1 Row-Level Events

**Current State:** Only `datachanged` event for all mutations.

**Improvement:**
```typescript
// New events with consistent configuration
'rowadded': CustomEvent<{ index: number; data: unknown }>
'rowdeleted': CustomEvent<{ index: number; data: unknown }>
'rowrestored': CustomEvent<{ index: number; data: unknown }>
'validationchange': CustomEvent<{ isValid: boolean; errors: Record<string, string[]>; rowIndex: number }>
```

**Task Reference:** Task 12.1-12.5 in `tasks.md`

---

## Priority 6: Data Serialization

### 6.1 Serializer Module

**Improvement:**
```typescript
export class Serializer {
  static toJSON(data: EditableRow[], options?: SerializerOptions): string {
    const cleaned = data.map(row => this.cleanRow(row));
    return JSON.stringify(cleaned, null, options?.indent);
  }
  
  static cleanRow(row: EditableRow): unknown {
    if (typeof row === 'string') return row;
    const { __originalSnapshot, __isNew, editing, deleted, ...clean } = row;
    return options?.includeDeleted ? { ...clean, deleted } : clean;
  }
}
```

**Task Reference:** Task 14.1-14.3 in `tasks.md`

---

## Priority 7: SSR Compatibility (Future)

### 7.1 Declarative Shadow DOM Support

**Improvement:**
```typescript
constructor() {
  super();
  // Check for existing shadow root (Declarative Shadow DOM)
  if (!this.shadowRoot) {
    this.attachShadow({ mode: 'open' });
  }
  // Hydration: don't re-render if content exists
}
```

**Task Reference:** Task 16.1-16.3 in `tasks.md`

---

## Implementation Roadmap

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| **Phase 1** | Memory cleanup (1.1), Form association (1.2) | 3-4 days |
| **Phase 2** | Constructable Stylesheets (2.1), Render debouncing (2.2) | 2-3 days |
| **Phase 3** | Enhanced validation (3.1) | 2 days |
| **Phase 4** | Accessibility (4.1-4.3) | 3-4 days |
| **Phase 5** | Event system (5.1), Serializer (6.1) | 2 days |
| **Phase 6** | SSR compatibility (7.1) | 2-3 days |

**Total estimated effort:** 14-18 days

---

## Reviewer Checklist

- [x] All sections 1–10 present
- [x] Attributes vs properties distinguished; reflection documented
- [x] Events include `detail` typing and bubble/composed/cancelable flags
- [x] Slots, CSS custom properties, and shadow parts enumerated
- [x] Lifecycle methods mapped and cited with file:lines
- [x] A11y: roles, keyboard handling, focus management described
- [x] Performance and cleanup (timers/observers/listeners) accounted for
- [x] Known limitations/pitfalls populated
- [x] Missing Information Protocol followed where applicable

---

*End of Analysis Report*
