# ck-editable-array — Complete Technical Documentation

## 1. Executive Summary

**Purpose:** `ck-editable-array` is a native web component that renders editable arrays using template-driven patterns. It enables CRUD operations on array data with display/edit modes, validation support, immutable data handling, and comprehensive accessibility features.

**Type:** Native Custom Element (Custom Elements v1 + Shadow DOM v1)

**Complexity:** Complex — 1170+ lines in main component, multi-file architecture with dedicated modules for DOM rendering and validation. Features include:
- Immutable data flow with deep cloning
- Template-driven row rendering
- Schema-based validation system
- Modal edit mode support
- Internationalization (i18n) for error messages
- CSS custom properties for theming
- Comprehensive ARIA accessibility support

**Key Dependencies:**
- No external runtime dependencies
- Build-time: TypeScript, Rollup
- Testing: Jest, jsdom

**Entry File:** `src/components/ck-editable-array/ck-editable-array.ts`

---

## 2. Quick Reference

| Aspect           | Details                                                            |
|------------------|---------------------------------------------------------------------|
| Tag Name         | `<ck-editable-array>`                                              |
| Key Attributes   | `name`, `readonly`, `modal-edit`                                   |
| Main Events      | `datachanged`, `beforetogglemode`, `aftertogglemode`               |
| CSS Variables    | 6 (theming: `--ck-row-padding`, `--ck-error-color`, etc.)          |
| Shadow DOM       | Yes, Open mode                                                      |
| Framework        | Native Web Component                                                |

---

## 3. Public API (Consumer-Facing)

### 3.1 Attributes / Properties

| Name | Kind | Type | Default | Required | Reflects | Observed | Description | Evidence |
|------|------|------|---------|----------|----------|----------|-------------|----------|
| `name` | Attr/Prop | `string` | `""` | No | No | Yes | Base name for form field naming (`name[0].field`) | `ck-editable-array.ts:56` |
| `readonly` | Attr | `boolean` | `false` | No | Yes | Yes | Disables all editing functionality | `ck-editable-array.ts:56` |
| `modal-edit` | Attr | `boolean` | `false` | No | Yes | Yes | Renders edit template in modal overlay | `ck-editable-array.ts:56` |
| `data` | Prop | `Array<any>` | `[]` | No | No | No | Array of row data (getter returns deep clone) | `ck-editable-array.ts:143-153` |
| `schema` | Prop | `ValidationSchema \| null` | `null` | No | No | No | JSON Schema-like validation schema | `ck-editable-array.ts:155-161` |
| `i18n` | Prop | `I18nMessages \| undefined` | `undefined` | No | No | No | Internationalization messages for validation | `ck-editable-array.ts:163-169` |
| `newItemFactory` | Prop | `() => EditableRow` | `() => ({})` | No | No | No | Factory function for new row creation | `ck-editable-array.ts:171-181` |
| `modalEdit` | Prop | `boolean` | `false` | No | Yes | N/A | Mirrors `modal-edit` attribute | `ck-editable-array.ts:183-191` |

### 3.2 Slots

| Name | Required | Purpose | Fallback Content | Evidence |
|------|----------|---------|------------------|----------|
| `display` | Yes | Template for display (read-only) mode rows | None | `dom-renderer.ts:695-700` |
| `edit` | Yes | Template for edit mode rows | None | `dom-renderer.ts:702-707` |
| `styles` | No | Custom CSS to inject into Shadow DOM | None | `ck-editable-array.ts:247` |
| `add-button` | No | Custom template for Add button | Default button with "Add Item" text | `dom-renderer.ts:165-175` |
| `button-edit` | No | Custom Edit button (mapped to `data-action="toggle"`) | None | `dom-renderer.ts:367-385` |
| `button-save` | No | Custom Save button | None | `dom-renderer.ts:367-385` |
| `button-cancel` | No | Custom Cancel button | None | `dom-renderer.ts:367-385` |
| `button-delete` | No | Custom Delete button | None | `dom-renderer.ts:367-385` |
| `button-restore` | No | Custom Restore button | None | `dom-renderer.ts:367-385` |

### 3.3 CSS Custom Properties

| Property | Expected Values | Default | Effect | Evidence |
|----------|-----------------|---------|--------|----------|
| `--ck-row-padding` | CSS length | `12px` | Padding for row elements | `ck-editable-array.ts:68` |
| `--ck-error-color` | CSS color | `#dc3545` | Color for validation errors | `ck-editable-array.ts:69` |
| `--ck-border-radius` | CSS length | `4px` | Border radius for elements | `ck-editable-array.ts:70` |
| `--ck-border-color` | CSS color | `#ddd` | Default border color | `ck-editable-array.ts:71` |
| `--ck-focus-color` | CSS color | `#0066cc` | Focus indicator color | `ck-editable-array.ts:72` |
| `--ck-disabled-opacity` | Number (0-1) | `0.5` | Opacity for disabled elements | `ck-editable-array.ts:73` |

### 3.4 CSS Shadow Parts

| Part Name | Element | Purpose | Evidence |
|-----------|---------|---------|----------|
| `root` | `<div>` | Root container for component | `ck-editable-array.ts:111` |
| `rows` | `<div>` | Container for all row elements | `ck-editable-array.ts:115` |
| `add-button` | `<div>` | Container for Add button | `ck-editable-array.ts:119` |
| `modal` | `<div>` | Modal overlay container | `ck-editable-array.ts:127` |
| `modal-surface` | `<div>` | Modal dialog surface | `ck-editable-array.ts:132` |

### 3.5 Methods

| Method | Signature | Visibility | Side Effects | Returns | Throws | Evidence |
|--------|-----------|------------|--------------|---------|--------|----------|
| `validateRowDetailed` | `(rowIndex: number): ValidationResult` | Public | None | `{ isValid: boolean, errors: Record<string, string[]> }` | No | `ck-editable-array.ts:960-973` |

**Internal Methods (exposed for renderer context):**

| Method | Signature | Purpose | Evidence |
|--------|-----------|---------|----------|
| `handleAddClick` | `(): void` | Adds new row via factory | `ck-editable-array.ts:700-723` |
| `handleSaveClick` | `(rowIndex: number): void` | Saves edits, exits edit mode | `ck-editable-array.ts:726-757` |
| `handleCancelClick` | `(rowIndex: number): void` | Discards edits, exits edit mode | `ck-editable-array.ts:820-879` |
| `handleToggleClick` | `(rowIndex: number): void` | Toggles between display/edit mode | `ck-editable-array.ts:760-817` |
| `handleDeleteClick` | `(rowIndex: number): void` | Soft-deletes a row | `ck-editable-array.ts:1076-1094` |
| `handleRestoreClick` | `(rowIndex: number): void` | Restores a deleted row | `ck-editable-array.ts:1097-1115` |

### 3.6 Events

| Event Name | `detail` Type | When Fired | Bubbles | Composed | Cancelable | Evidence |
|------------|---------------|------------|---------|----------|------------|----------|
| `datachanged` | `{ data: Array<EditableRow> }` | On data modification (add, save, delete, restore) | Yes | Yes | No | `ck-editable-array.ts:515-522` |
| `beforetogglemode` | `{ index: number, from: string, to: string }` | Before row mode changes | Yes | Yes | **Yes** | `ck-editable-array.ts:784-792` |
| `aftertogglemode` | `{ index: number, mode: string }` | After row mode changes | Yes | Yes | No | `ck-editable-array.ts:808-815` |

### 3.7 Outputs Summary

**Return Values:**
- `data` property returns a deep-cloned array (immutable)
- `validateRowDetailed()` returns validation result with field-level errors

**Event Data:**
```typescript
// datachanged
interface DataChangedDetail {
  data: Array<EditableRow>; // Full array snapshot (cloned)
}

// beforetogglemode
interface BeforeToggleModeDetail {
  index: number;            // Row index (0-based)
  from: 'display' | 'edit'; // Current mode
  to: 'display' | 'edit';   // Target mode
}

// aftertogglemode
interface AfterToggleModeDetail {
  index: number;           // Row index
  mode: 'display' | 'edit'; // Final mode
}
```

**State Exposure:**
- `editingRowIndex` (internal): Index of currently editing row (-1 if none)
- Public data always excludes internal markers (`__originalSnapshot`, `__isNew`)

---

## 4. Usage Examples

### 4.1 Basic Usage

```html
<ck-editable-array id="contacts" name="contact">
  <!-- Display template -->
  <template slot="display">
    <div class="row-display">
      <span data-bind="name"></span> — <span data-bind="email"></span>
      <button data-action="toggle">Edit</button>
      <button data-action="delete">Delete</button>
      <button data-action="restore">Restore</button>
    </div>
  </template>
  
  <!-- Edit template -->
  <template slot="edit">
    <div class="row-edit">
      <input data-bind="name" placeholder="Name" />
      <input data-bind="email" type="email" placeholder="Email" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
  
  <!-- Optional: Custom styles -->
  <style slot="styles">
    .row-display { padding: 12px; border: 1px solid #eee; }
    .row-edit { background: #f5f5f5; padding: 16px; }
  </style>
</ck-editable-array>
```

### 4.2 JavaScript Integration

```typescript
const el = document.querySelector<CkEditableArray>('ck-editable-array');

// Set initial data
el.data = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
];

// Configure validation
el.schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { minLength: 2 },
    email: { minLength: 5 }
  }
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

// Listen for changes
el.addEventListener('datachanged', (e: CustomEvent<{ data: unknown[] }>) => {
  console.log('Data updated:', e.detail.data);
});

// Intercept mode changes
el.addEventListener('beforetogglemode', (e: CustomEvent) => {
  if (someCondition) {
    e.preventDefault(); // Block mode change
  }
});
```

### 4.3 Styling Examples

```css
/* Theme via CSS custom properties */
ck-editable-array {
  --ck-error-color: #e74c3c;
  --ck-border-radius: 8px;
  --ck-focus-color: #3498db;
}

/* Style via shadow parts */
ck-editable-array::part(root) {
  border: 2px solid #333;
  padding: 20px;
  border-radius: var(--ck-border-radius);
}

ck-editable-array::part(rows) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

ck-editable-array::part(add-button) {
  margin-top: 16px;
  text-align: center;
}

/* Modal styling */
ck-editable-array::part(modal) {
  background: rgba(0, 0, 0, 0.6);
}

ck-editable-array::part(modal-surface) {
  max-width: 500px;
  border-radius: 12px;
}
```

### 4.4 Framework Integration (React)

```tsx
import { useEffect, useRef } from 'react';
import '@colmkenna/ck-editable-array';

interface Contact {
  name: string;
  email: string;
}

function ContactList({ contacts, onUpdate }: {
  contacts: Contact[];
  onUpdate: (data: Contact[]) => void;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current as any;
    if (el) {
      el.data = contacts;
      el.schema = {
        required: ['name', 'email'],
        properties: {
          name: { minLength: 2 },
          email: { minLength: 5 }
        }
      };
    }
  }, [contacts]);

  useEffect(() => {
    const el = ref.current;
    const handler = (e: CustomEvent) => onUpdate(e.detail.data);
    el?.addEventListener('datachanged', handler);
    return () => el?.removeEventListener('datachanged', handler);
  }, [onUpdate]);

  return (
    <ck-editable-array ref={ref}>
      <template slot="display">
        <div><span data-bind="name"></span></div>
      </template>
      <template slot="edit">
        <div><input data-bind="name" /></div>
      </template>
    </ck-editable-array>
  );
}
```

---

## 5. Internal Design & Architecture

### 5.1 File Structure & Dependencies

```
src/components/ck-editable-array/
├─ ck-editable-array.ts    # Main component class (1171 lines)
├─ dom-renderer.ts         # DOM rendering logic (822 lines)
├─ validation-manager.ts   # Validation logic (120 lines)
└─ types.ts                # TypeScript interfaces (100 lines)

src/index.ts               # Export + auto-registration

External Dependencies: None (native Web Component)
```

### 5.2 State Management

**State Model:**
```typescript
// Internal state (private)
private _data: EditableRow[] = [];        // Row data with internal markers
private _rowKeys: string[] = [];          // Stable keys for DOM reconciliation
private _nextId = 0;                      // Key generator counter
private _schema: ValidationSchema | null; // Validation rules
private _i18n: I18nMessages | undefined;  // Error message localization
private _newItemFactory: () => EditableRow; // Factory for new rows
private _styleObserver: MutationObserver | null; // Style mirroring
private _domRenderer: DomRenderer;        // Rendering delegate

// Internal row markers (InternalRowData)
interface InternalRowData {
  __key?: string;                    // Stable identifier
  editing?: boolean;                 // Currently in edit mode
  deleted?: boolean;                 // Soft-deleted flag
  __originalSnapshot?: Record<string, unknown>; // Pre-edit backup
  __isNew?: boolean;                 // Created via Add button
}
```

**State Flow:**
1. Consumer sets `data` property → cloned internally
2. `render()` delegates to `DomRenderer`
3. User interactions trigger handlers → state mutations → re-render
4. `datachanged` event dispatched with fresh clone

**Persistence:**
- No persistent storage; state exists only in memory
- Snapshots stored in `__originalSnapshot` for cancel/restore

### 5.3 Lifecycle & Rendering

**Construction (`constructor`):**
- Attaches open Shadow DOM
- Creates base structure: styles, root container, rows container, add-button container, modal overlay
- Instantiates `DomRenderer`

**Connection (`connectedCallback`):**
- Mirrors light DOM styles to shadow DOM
- Sets up `MutationObserver` for style changes
- Triggers initial `render()`

**Updates:**
- `attributeChangedCallback` for `name`, `readonly`, `modal-edit`
- Property setters trigger re-render when connected

**Disconnection (`disconnectedCallback`):**
- Disconnects `MutationObserver` to prevent memory leaks

**Rendering Strategy:**
- Template cloning per row
- DOM reconciliation via stable keys (`data-key` attribute)
- AbortController-based event listener cleanup per row element
- Incremental updates via `updateBoundNodes()` for single-field changes

### 5.4 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Input Phase                                                      │
├─────────────────────────────────────────────────────────────────┤
│ - data property setter → cloneRow() deep copies each item       │
│ - Templates from light DOM (slot="display", slot="edit")        │
│ - Schema and i18n settings                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Processing Phase                                                 │
├─────────────────────────────────────────────────────────────────┤
│ - DomRenderer.render() orchestrates row creation/updates        │
│ - bindDataToNode() populates [data-bind] elements               │
│ - ValidationManager.validateRow() checks against schema         │
│ - Event handlers update _data array (immutably)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Output Phase                                                     │
├─────────────────────────────────────────────────────────────────┤
│ - Shadow DOM reflects current state                              │
│ - datachanged event → detail.data is fresh clone                │
│ - beforetogglemode/aftertogglemode for mode transitions         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Side Effects & External Interactions

**Shadow DOM Boundary:**
- Styles mirrored from light DOM `<style slot="styles">`
- Templates cloned from light DOM `<template slot="...">`
- Events bubble and are composed (cross shadow boundary)

**Observers:**
- `MutationObserver` watches light DOM for style element changes
  - Observes: childList, characterData, subtree
  - Scope: Component's light DOM children

**Focus Management:**
- `window.requestAnimationFrame` used for focus timing
- Auto-focus first input on edit mode entry
- Focus restoration to toggle button on save/cancel

**No Network Requests, Timers, or Intervals**

### 5.6 Error Handling

**Validation Strategies:**
- Schema-driven validation via `ValidationManager`
- Real-time validation on input changes
- Save button disabled when invalid

**Error Reporting:**
- `aria-invalid="true"` on invalid fields
- `data-field-error="fieldName"` elements for messages
- `data-row-invalid` attribute on row wrapper
- `aria-describedby` links inputs to error messages

**Circular Reference Handling:**
```typescript
// ck-editable-array.ts:402-414
private cloneRow(row: unknown): EditableRow {
  // ...
  try {
    return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
  } catch (e) {
    console.warn(
      'ck-editable-array: Failed to deep clone row (circular reference?), using shallow copy',
      e
    );
    return { ...(row as Record<string, unknown>) };
  }
}
```

---

## 6. TypeScript/JavaScript Specifics

### 6.1 Type Definitions

**Exported Types (`types.ts`):**

```typescript
export interface InternalRowData extends Record<string, unknown> {
  __key?: string;
  editing?: boolean;
  deleted?: boolean;
  __originalSnapshot?: Record<string, unknown>;
  __isNew?: boolean;
}

export type EditableRow = InternalRowData | string;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface PropertySchema {
  type?: string;
  minLength?: number;
}

export interface ValidationSchema {
  type?: string;
  required?: string[];
  properties?: Record<string, PropertySchema>;
}

export interface I18nMessages {
  required?: (field: string) => string;
  minLength?: (field: string, min: number) => string;
}

export type RenderMode = 'display' | 'edit';
```

**Internal Context Interface:**
```typescript
export interface EditableArrayContext {
  isModalEditEnabled(): boolean;
  isRecord(row: unknown): boolean;
  resolveBindingValue(data: EditableRow, key: string): string;
  resolveBindingRawValue(data: EditableRow, key: string): unknown;
  commitRowValue(rowIndex: number, key: string, value: unknown): void;
  updateSaveButtonState(rowIndex: number): void;
  // ... handler methods
}
```

### 6.2 JS/TS Patterns

**Class-Based Architecture:**
- Main component extends `HTMLElement`
- Composition via `DomRenderer` and `ValidationManager`
- Static factory pattern not used; instance configuration via properties

**Private Property Convention:**
- Underscore prefix: `_data`, `_schema`, `_i18n`
- Public API via getters/setters

**Constants:**
```typescript
// types.ts
export const CONSTANTS = {
  PART_ROWS: 'rows',
  PART_ADD_BUTTON: 'add-button',
  // ... 15+ constants
} as const;
```

**Runtime Type Guards:**
```typescript
public isRecord(value: EditableRow): value is InternalRowData {
  return typeof value === 'object' && value !== null;
}
```

---

## 7. Performance & Optimization

### 7.1 Characteristics

**Render Cost:**
- O(n) for full render where n = row count
- Incremental updates via `updateBoundNodes()` for single-field changes
- DOM reconciliation via stable keys avoids unnecessary re-creation

**Memory Patterns:**
- AbortController per row element for event listener cleanup
- MutationObserver cleaned up in `disconnectedCallback`
- Deep cloning may be expensive for large/complex objects

**Bundle Impact:**
- ~2100 lines of TypeScript (source)
- No external dependencies
- Tree-shakeable exports

**Initialization Cost:**
- Shadow DOM creation and base structure
- No heavy computation until data is set

### 7.2 Strategies

**DOM Updates:**
- Keyed reconciliation prevents unnecessary element recreation
- `updateBoundNodes()` for targeted updates instead of full re-render
- `requestAnimationFrame` for focus management (batched with paint)

**Event Handling:**
- AbortController signals for automatic listener cleanup
- Event delegation via `data-action` attributes

**Potential Improvements (Not Implemented):**
- Virtualization for large lists (100+ rows)
- RequestIdleCallback for non-critical updates
- Web Worker for validation of large datasets

---

## 8. Accessibility & Standards

### 8.1 A11y Features

**ARIA Attributes:**
- `aria-invalid="true"` on invalid inputs
- `aria-describedby` linking inputs to error messages
- `aria-disabled="true"` on disabled buttons
- `aria-checked` on radio buttons and checkboxes
- `aria-hidden` on modal overlay when closed
- `aria-modal="true"` on modal dialog
- `role="dialog"` on modal surface

**Keyboard Navigation:**
- Standard tab order through form elements
- Focus auto-moves to first input on edit mode entry
- Focus returns to toggle button on save/cancel
- No custom keyboard shortcuts implemented

**Screen Reader Considerations:**
- Error messages in `data-field-error` elements
- Error summary in `data-error-summary` with `role="alert"` and `aria-live="polite"`
- `inert` attribute on locked rows (when another row is editing)

**Color/Contrast:**
- Error color via CSS variable (`--ck-error-color: #dc3545`)
- Consumer responsible for ensuring contrast in templates

### 8.2 Web Standards Compliance

**Custom Elements:**
```typescript
// ck-editable-array.ts:1166-1168
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
```

**Shadow DOM:**
- Open mode for developer tools access
- Encapsulated styles
- Part attributes for external styling

**Form Association:**
- `name` attribute generates form field names (`name[index].field`)
- Not using `ElementInternals` or `formAssociated` (plain form integration)

---

## 9. Browser Compatibility & Limitations

### 9.1 Support Matrix

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 53+ | Full support |
| Firefox | 63+ | Full support |
| Safari | 10.1+ | Full support |
| Edge | 79+ (Chromium) | Full support |
| Edge Legacy | Not supported | Requires polyfills |
| IE11 | Not supported | No native Web Component support |

**Requirements:**
- Custom Elements v1
- Shadow DOM v1
- ES6 (classes, template literals, arrow functions)

**Polyfills:**
For older browsers, use [webcomponents polyfills](https://github.com/webcomponents/polyfills).

### 9.2 Known Limitations

1. **No Virtualization:** Large arrays (100+ rows) may impact performance
2. **Circular References:** Falls back to shallow copy (may lose nested data)
3. **No Form Submission:** Component doesn't participate in native form submission
4. **Single Edit Mode:** Only one row can be edited at a time (by design)

### 9.3 Common Pitfalls

1. **Template Requirements:**
   ```html
   <!-- WRONG: Missing required slots -->
   <ck-editable-array></ck-editable-array>
   
   <!-- CORRECT: Both templates required -->
   <ck-editable-array>
     <template slot="display">...</template>
     <template slot="edit">...</template>
   </ck-editable-array>
   ```

2. **Data Mutation:**
   ```javascript
   // WRONG: Mutating returned data
   const data = el.data;
   data[0].name = 'Changed'; // Won't update component!
   
   // CORRECT: Set property
   const newData = [...el.data];
   newData[0] = { ...newData[0], name: 'Changed' };
   el.data = newData;
   ```

3. **Event Timing:**
   ```javascript
   // WRONG: Setting data then immediately reading
   el.data = [{ name: 'Test' }];
   console.log(el.data); // May not reflect internal state timing
   
   // CORRECT: Listen for datachanged
   el.addEventListener('datachanged', (e) => {
     console.log(e.detail.data);
   });
   el.data = [{ name: 'Test' }];
   ```

---

## 10. Development & Testing Guidance

### 10.1 Key Test Scenarios

**Unit Tests (22 test suites, 237+ tests):**

| Test File | Coverage |
|-----------|----------|
| `step1.render.test.ts` | Basic rendering, data binding |
| `step2.public-api.test.ts` | Schema, factory, shadow DOM |
| `step3.lifecycle-styles.test.ts` | connectedCallback, style mirroring |
| `step4.rendering-row-modes.test.ts` | Display/edit mode switching |
| `step5.add-button.test.ts` | Add button, exclusive locking |
| `step6.save-cancel.test.ts` | Save/cancel, toggle events |
| `step7.validation.test.ts` | Schema validation (2000+ lines) |
| `step8.cloning.test.ts` | Deep cloning, immutability |
| `modal-edit.test.ts` | Modal overlay editing |
| `accessibility.test.ts` | ARIA attributes, keyboard nav |
| `security.test.ts` | XSS protection |
| `week4.i18n.test.ts` | Internationalization |
| `week4.focus.test.ts` | Focus management |
| `week5.circular.test.ts` | Circular reference handling |
| `week5.css-vars.test.ts` | CSS custom properties |

**Test Utilities (`test-utils.ts`):**
- `waitForRender()` — Wait for component to render
- `getRow()` — Get row element by index
- `simulateInput()` — Trigger input event

### 10.2 Dev Workflow

**Build Commands:**
```powershell
npm run build        # Rollup build (UMD, ESM, minified)
npm run dev          # Watch mode
npm run serve        # http-server on :8080
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run lint         # ESLint check
npm run format       # Prettier format
```

**Build Artifacts:**
```
dist/ck-editable-array/
├─ ck-editable-array.js      # UMD format
├─ ck-editable-array.esm.js  # ES module
└─ ck-editable-array.min.js  # Minified UMD
```

**Debugging Tips:**
1. Shadow DOM inspection: DevTools → Elements → expand shadow-root
2. Event logging: Add listener for `datachanged`, `beforetogglemode`, `aftertogglemode`
3. Validation debugging: Call `el.validateRowDetailed(rowIndex)` in console
4. State inspection: Check `el.data`, `el.schema`, `el.editingRowIndex`

---

## Reviewer Checklist

- [x] All sections 1–10 present
- [x] Distinguish attributes vs properties; reflection documented
- [x] Events include `detail` typing and bubble/composed/cancelable flags
- [x] Slots, CSS custom properties, and shadow parts enumerated
- [x] Lifecycle methods mapped and cited with file:lines
- [x] A11y: roles, keyboard map, focus handling described
- [x] Perf and cleanup (timers/observers/listeners) accounted for
- [x] Known limitations/pitfalls populated
- [x] Missing Information Protocol followed where applicable

---

*Generated: 2025-11-26*
*Component Version: Based on current `fix/code-review-improvements` branch*
