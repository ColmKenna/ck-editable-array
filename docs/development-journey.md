# Development Journey: ck-editable-array Web Component

## Overview

This document chronicles the test-driven development (TDD) journey of building the `ck-editable-array` web component from scratch. The component provides an editable array interface with display/edit modes, validation, soft delete, and comprehensive accessibility features.

**Development Period**: November 13-14, 2025  
**Final Status**: ✅ 151 tests passing  
**Methodology**: Strict TDD (Red-Green-Refactor)

---

## Development Philosophy

### Test-Driven Development (TDD)

Every feature followed the strict TDD cycle:

1. **RED**: Write failing tests that describe desired behavior
2. **GREEN**: Implement minimal code to make tests pass
3. **REFACTOR**: Clean up implementation while keeping tests green

### Incremental Complexity

The component was built in logical steps, each building on previous work:
- Start with minimal scaffolding
- Add data rendering
- Implement lifecycle management
- Build editing features
- Add validation
- Ensure immutability and accessibility

---

## Phase 1: Foundation (November 13, 2025)

### Initial Setup

**Goal**: Create minimal web component infrastructure

**Tests Added**: 2 tests
- Component class exports correctly
- Custom element registers as `ck-editable-array`

**Implementation**:
```typescript
class CkEditableArray extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
}
customElements.define('ck-editable-array', CkEditableArray);
```

**Status**: ✅ 2/2 tests passing

---

### AC-1: Basic Rendering

**Goal**: Render rows from data using light DOM templates

**Tests Added**: 1 test
- Component clones templates per item
- Binds data to `[data-bind]` attributes
- Sets `data-row` and `data-mode` attributes
- Emits initial `datachanged` event

**Implementation**:
- Added `data` property with getter/setter
- Implemented `render()` method
- Created `appendRowFromTemplate()` for template cloning
- Added `bindDataToNode()` for data binding
- Implemented `dispatchDataChanged()` for events

**Status**: ✅ 3/3 tests passing

---

### P1-P5 Scenarios: Editable Behavior

**Goal**: Support editing with two-way data binding

**Tests Added**: 6 tests (Given/When/Then scenarios)
- P1: Basic render sync
- P2: Empty/null initialization
- P3: Editing updates data
- P4: Multiple edits work correctly
- P5: Stale input events ignored

**Implementation**:
- Normalized primitive/object rows in `cloneRow()`
- Added input event listeners in edit mode
- Implemented `commitRowValue()` for updates
- Added `updateBoundNodes()` for incremental DOM updates
- Guarded against stale events (row index validation)

**Key Insight**: Only emit `datachanged` on actual edits, not on initial render

**Status**: ✅ 9/9 tests passing

---

## Phase 2: Public API & Lifecycle (November 13, 2025)

### Step 2: Shadow DOM Scaffolding & Public API

**Goal**: Establish proper shadow DOM structure and public properties

**Tests Added**: 26 tests across multiple sub-steps

#### Step 2.1: Shadow Root Scaffolding
- Shadow root contains `[part="rows"]` container
- Shadow root contains `[part="add-button"]` container
- Scaffolding persists across renders

#### Step 2.2: Schema Property
- Schema accepts objects, null, and undefined
- Undefined normalizes to null for consistency
- Schema doesn't mutate data

#### Step 2.3: newItemFactory Property
- Default factory returns empty object `{}`
- Custom factories can be assigned
- Invalid values reset to default
- Factory validation ensures type safety

**Implementation**:
- Refactored constructor to create persistent scaffolding
- Changed `render()` to only clear rows container
- Added schema getter/setter with normalization
- Added newItemFactory getter/setter with validation

**Status**: ✅ 41/41 tests passing (including Step 1 fix)

---

### Step 3: Lifecycle & Styles

**Goal**: Proper lifecycle management and style mirroring

**Tests Added**: 12 tests across 4 sub-steps

#### Step 3.1: Rendering with Empty Data (3 tests)
- Renders scaffolding but no rows when data is empty
- Renders existing data when connected
- Reconnecting doesn't duplicate rows (idempotency)

#### Step 3.2: Style Slot Mirroring (3 tests)
- Single `<style slot="styles">` mirrored to shadow DOM
- Multiple style elements combined into one
- Empty/whitespace-only styles don't create mirrored element

#### Step 3.3: Live Style Updates with MutationObserver (3 tests)
- Editing light DOM style updates shadow DOM
- Adding new style elements after connect mirrors them
- Removing style elements removes their CSS

#### Step 3.4: disconnectedCallback Cleanup (3 tests)
- Style mirroring stops after disconnect
- Reconnecting re-syncs current styles
- Disconnect doesn't throw even with no styles

**Implementation**:
- Added `mirrorStyles()` method
- Implemented `observeStyleChanges()` with MutationObserver
- Added `disconnectedCallback()` for cleanup
- Updated `connectedCallback()` to call both methods

**Key Design Decisions**:
- Single observer watches all style-related changes
- Idempotent observer setup (safe to call multiple times)
- Proper cleanup prevents memory leaks
- Efficient re-mirroring reuses existing logic

**Status**: ✅ 59/59 tests passing

---

## Phase 3: Row Modes & Rendering (November 13, 2025)

### Step 4: Core Rendering & Row Modes

**Goal**: Proper row rendering with mode attributes and deleted markers

**Tests Added**: 15 tests across 5 sub-steps

#### Step 4.1: Row Attributes (3 tests)
- Each data item renders as a row with `data-row` index
- Rows have `data-mode="display"` or `data-mode="edit"`
- Deleted items marked with `data-deleted="true"`

#### Step 4.2: Slot & Wrapper Wiring (3 tests)
- Each row has `.display-content` and `.edit-content` wrappers
- Display template cloned per row within wrappers
- Edit template cloned per row within wrappers

#### Step 4.3: Display vs Edit Visibility (3 tests)
- Default: display visible, edit hidden (via `hidden` class)
- When `editing: true`: edit visible, display hidden
- Multiple rows can have different visibility states

#### Step 4.4: Toggle Button Surface (3 tests)
- Each row contains toggle control (`data-action="toggle"`)
- Toggle visible and focusable in display mode
- Toggle hidden when row in edit mode

#### Step 4.5: Input Naming & Binding (3 tests)
- Edit inputs use `name[index].field` pattern
- Display bindings show current data values
- Empty/null/undefined fields render as empty strings

**Implementation**:
- Refactored `appendRowFromTemplate()` to create wrappers
- Moved all attributes to wrapper (not template content)
- Added `hidden` class logic based on `editing` flag
- Added `deleted` class for soft-deleted items
- Simplified to single code path (always use wrappers)

**Status**: ✅ 77/77 tests passing

---

## Phase 4: Add Button & Exclusive Locking (November 14, 2025)

### Step 5: Add Button Functionality

**Goal**: Create new rows with exclusive locking

**Tests Added**: 14 tests across 6 sub-steps

#### Step 5.1: Add Button Surface & Defaults (3 tests)
- Default Add button renders when no custom template
- Custom Add button template used when provided
- Add button has proper button semantics (`type="button"`)

#### Step 5.2: Clicking Add Creates New Row (3 tests)
- Clicking Add appends new row to DOM
- Clicking Add updates data array
- Clicking Add emits `datachanged` event

#### Step 5.3: New Row Starts in Edit Mode (3 tests)
- New row rendered in edit mode, existing rows in display
- New row shows edit content, hides display content
- New row's toggle hidden, edit actions visible

#### Step 5.4: Exclusive Locking (3 tests)
- Other rows locked when new row enters edit mode
- Existing rows' toggle controls disabled while editing
- Add button disabled while a row is editing

#### Step 5.5: Releasing the Lock (2 tests)
- Exiting edit mode unlocks other rows and re-enables Add
- After exiting edit, subsequent Add creates another new row

#### Step 5.6: Interaction with newItemFactory (2 tests)
- Add uses current newItemFactory to create items
- Changing newItemFactory affects subsequent Add operations

**Implementation**:
- Added `renderAddButton()` method
- Implemented `handleAddClick()` method
- Added exclusive locking detection in `render()`
- Updated `appendRowFromTemplate()` to accept `isLocked` parameter
- Updated `bindDataToNode()` to disable controls on locked rows
- New items marked with `editing: true` flag

**Key Insight**: Exclusive locking prevents data conflicts and user confusion

**Status**: ✅ 93/93 tests passing

---

## Phase 5: Save/Cancel/Toggle (November 14, 2025)

### Step 6: Full Save/Cancel Functionality

**Goal**: Complete editing experience with validation and events

**Tests Added**: 18 tests across 7 sub-steps

#### Step 6.1: Save Button Behavior (3 tests)
- Save commits changes and switches to display mode
- Save unlocks other rows and re-enables Add button
- Save dispatches `datachanged` event

#### Step 6.2: Toggle Events & Basic Mode Switching (3 tests)
- Toggle fires `beforetogglemode` and `aftertogglemode` events
- `beforetogglemode` is cancelable (preventDefault support)
- Toggle works bidirectionally (display ↔ edit)

#### Step 6.3: Visual Mode Switching (2 tests)
- Toggle to edit hides display, shows edit
- Toggle to display hides edit, shows display

#### Step 6.4: Save Behavior with Validation (3 tests)
- Saving persists edited values and returns to display
- Save emits `datachanged` with updated array
- Save disabled when row has validation errors

#### Step 6.5: Cancel Behavior (3 tests)
- Cancel discards changes and restores original values
- Cancel does NOT emit `datachanged` event
- Cancel releases locks and re-enables Add button

#### Step 6.6: Soft Delete & Restore (4 tests)
- Delete marks row with `deleted: true` flag
- Delete updates data and emits `datachanged`
- Restore reverses soft delete
- Delete/Restore obey exclusive locking rules

#### Step 6.7: Action Button Templates (3 tests)
- Custom button templates with `slot="button-*"` used
- Buttons respect mode-specific visibility
- Button clicks trigger correct behaviors

**Implementation**:
- Added `handleSaveClick()` method
- Added `handleToggleClick()` with snapshot storage
- Added `handleCancelClick()` with snapshot restoration
- Added `validateRow()` method
- Added `updateSaveButtonState()` method
- Added `handleDeleteClick()` and `handleRestoreClick()` methods
- Added `injectActionButtons()` for custom button templates
- Updated data getter to exclude internal properties (`__originalSnapshot`, `__isNew`)

**Key Features**:
- **Snapshot Mechanism**: Original data stored in `__originalSnapshot` when entering edit mode
- **Event Lifecycle**: beforetogglemode (cancelable) → update → aftertogglemode
- **Validation Integration**: Schema-based validation with immediate feedback

**Status**: ✅ 114/114 tests passing

---

## Phase 6: Validation System (November 14, 2025)

### Step 7: Schema-driven Validation

**Goal**: Comprehensive validation with visual feedback and accessibility

**Tests Added**: 22 tests across 7 sub-steps

#### Step 7.1: Schema-driven Required Fields (4 tests)
- Valid rows pass validation with Save enabled
- Missing required fields show error indicators
- Fixing required fields clears errors and enables Save
- Row-level invalid state marked with `data-row-invalid`

#### Step 7.2: Field-level Validation Messages (3 tests)
- Per-field error messages appear near offending input
- Updating one field doesn't re-error other valid fields
- Error count matches actual failing fields

#### Step 7.3: Row-level Error Indicators & Accessibility (4 tests)
- Invalid rows clearly marked with `data-row-invalid`
- Invalid fields have `aria-invalid="true"`
- Error messages associated with inputs via `aria-describedby`
- Row-level error summary with `role="alert"` and `aria-live="polite"`

#### Step 7.4: Save/Cancel & Validation Interplay (3 tests)
- Save on invalid row doesn't exit edit mode
- Save on valid row clears errors and exits edit mode
- Cancel ignores validation state and discards values

#### Step 7.5: Validation Timing (3 tests)
- Validation runs on input change (immediate feedback)
- Validation runs when toggling to edit mode
- Correcting field removes errors immediately

#### Step 7.6: Validation & Add/New Rows (3 tests)
- New row starts in edit mode and is validated
- Cancelling new row with invalid values removes it
- Saving valid new row adds it permanently

#### Step 7.7: Validation and Soft Delete (2 tests)
- Soft-deleted rows not required to be valid
- Restoring row returns it to previous validation state

**Implementation**:
- Added `validateRow()` method (boolean result)
- Added `validateRowDetailed()` method (returns errors per field)
- Enhanced `updateSaveButtonState()` to:
  - Set `data-invalid` on invalid fields
  - Set `data-row-invalid` on invalid rows
  - Populate error message elements (`data-field-error`)
  - Add `aria-invalid` attributes
  - Generate unique IDs for error messages
  - Link inputs to errors via `aria-describedby`
  - Populate error summary elements (`data-error-summary`)
  - Display error count (`data-error-count`)
- Enhanced `handleCancelClick()` to remove new rows (marked with `__isNew`)
- Enhanced `handleSaveClick()` to remove `__isNew` marker

**Validation Rules Supported**:
- Required fields (empty, null, undefined, whitespace-only)
- minLength for strings

**Accessibility Features**:
- ARIA invalid attributes
- Error message association
- Live region updates
- Alert role for summaries

**Status**: ✅ 136/136 tests passing

---

## Phase 7: Immutability & Events (November 14, 2025)

### Step 8: Data Cloning & Event Behavior

**Goal**: Strong immutability guarantees and proper event dispatch

**Tests Added**: 15 tests across 5 sub-steps

#### Step 8.1: Data Cloning & Immutability Guarantees (4 tests)
- Mutating `el.data` after read doesn't affect rendered UI
- Mutating original array passed to setter doesn't affect `el.data`
- Mutating `el.data` in place doesn't auto-re-render
- Reassigning mutated data array updates both data and UI

#### Step 8.2: Deep vs Shallow Clone Behaviour (2 tests)
- Nested objects deeply cloned (external mutations don't leak in)
- Editing via UI updates nested values in `el.data`

#### Step 8.3: Cloning & "deleted" Flag Consistency (2 tests)
- Soft delete sets `deleted: true` without affecting snapshots
- Restoring row sets `deleted: false` and removes visual styling

#### Step 8.4: Generic Event Dispatch Behaviour (4 tests)
- `datachanged` events bubble out of shadow root
- `beforetogglemode` events bubble and are cancelable
- `aftertogglemode` events bubble but not cancelable
- All events composed (cross shadow DOM boundaries)

#### Step 8.5: Event Payload Consistency (3 tests)
- `datachanged` detail includes full current array
- `beforetogglemode` carries index, from, and to
- `aftertogglemode` carries only index and final mode

**Implementation**:
- Enhanced `cloneRow()` to use `JSON.parse(JSON.stringify())` for deep cloning
- Enhanced data getter to filter internal properties
- Added nested property path support in `resolveBindingValue()`
- Added nested property path support in `commitRowValue()`
- Changed `handleRestoreClick()` to set `deleted: false` (not undefined)
- Added `deleted` CSS class in `appendRowFromTemplate()`
- All events already had `bubbles: true` and `composed: true`

**Key Design Decisions**:
- **Deep Cloning**: JSON serialization provides protection against nested mutations
- **Public vs Internal Properties**: 
  - Public: `deleted`, `editing`, user-defined properties
  - Internal: `__originalSnapshot`, `__isNew`
- **Nested Property Support**: `data-bind="person.name"` works for both display and edit
- **Event Payloads**: Complete state in events simplifies integration

**Status**: ✅ 151/151 tests passing

---

## Final Architecture

### Component Structure

```
CkEditableArray (HTMLElement)
├── Shadow DOM
│   ├── <style data-mirrored> (from light DOM)
│   └── <div part="root">
│       ├── <div part="rows">
│       │   ├── <div class="display-content" data-row="0" data-mode="display">
│       │   ├── <div class="edit-content hidden" data-row="0" data-mode="edit">
│       │   ├── <div class="display-content" data-row="1" data-mode="display">
│       │   └── <div class="edit-content hidden" data-row="1" data-mode="edit">
│       └── <div part="add-button">
│           └── <button data-action="add">Add</button>
└── Light DOM (user-provided)
    ├── <style slot="styles">
    ├── <template slot="display">
    ├── <template slot="edit">
    └── <template slot="add-button"> (optional)
```

### Data Flow

```
External → data setter → cloneRow() → _data (internal)
                                        ↓
                                     render()
                                        ↓
                              appendRowFromTemplate()
                                        ↓
                                 bindDataToNode()
                                        ↓
                              Shadow DOM (rendered)
                                        ↓
                              User Input (edit mode)
                                        ↓
                               commitRowValue()
                                        ↓
                              updateBoundNodes()
                                        ↓
                            dispatchDataChanged()
                                        ↓
                              data getter → External
```

### Event Lifecycle

```
User Action → Handler Method → Validation (if applicable)
                                     ↓
                          beforetogglemode (cancelable)
                                     ↓
                          Update _data / render()
                                     ↓
                           aftertogglemode
                                     ↓
                          datachanged (if data changed)
```

---

## Key Patterns & Techniques

### 1. Test-Driven Development
- Every feature started with failing tests
- Implementation driven by test requirements
- Refactoring only after tests pass

### 2. Incremental Complexity
- Started with minimal scaffolding
- Added features one at a time
- Each step built on previous work

### 3. Immutability by Default
- Deep cloning on data setter
- Fresh clones on data getter
- Internal snapshots for Cancel functionality

### 4. Exclusive Locking
- Only one row editable at a time
- Prevents data conflicts
- Clear visual feedback

### 5. Snapshot Mechanism
- Store original data when entering edit mode
- Restore on Cancel
- Clean up on Save
- Transparent to consumers

### 6. Validation Integration
- Schema-based validation
- Immediate feedback on input change
- Visual indicators and error messages
- Accessibility support

### 7. Event-Driven Architecture
- Custom events for all state changes
- Cancelable events for prevention
- Complete payloads for integration
- Proper bubbling and composition

### 8. Accessibility First
- ARIA attributes for screen readers
- Keyboard navigation support
- Error message association
- Live region updates

---

## Lessons Learned

### What Worked Well

1. **Strict TDD**: Writing tests first ensured clear requirements and prevented scope creep
2. **Incremental Steps**: Small, focused steps made debugging easier and progress visible
3. **Checkpoints**: Regular documentation captured decisions and rationale
4. **Immutability**: Deep cloning prevented subtle bugs and made behavior predictable
5. **Shadow DOM**: Encapsulation prevented style conflicts and simplified testing

### Challenges Overcome

1. **MutationObserver Complexity**: Required careful handling of different mutation types
2. **Nested Property Paths**: Added complexity but provided valuable flexibility
3. **Validation Timing**: Balancing immediate feedback with performance
4. **Event Payload Design**: Deciding what information to include in each event
5. **Internal vs Public Properties**: Filtering internal markers from public API

### Future Improvements

1. **Performance**: Virtual scrolling for large datasets
2. **Validation**: Async validators, cross-field validation
3. **Accessibility**: Enhanced keyboard shortcuts, better screen reader support
4. **Internationalization**: i18n for error messages, locale-aware formatting
5. **Advanced Features**: Drag-and-drop reordering, batch operations, undo/redo

---

## Statistics

### Development Timeline
- **Day 1 (Nov 13)**: Steps 1-4 (Foundation, API, Lifecycle, Rendering)
- **Day 2 (Nov 14)**: Steps 5-8 (Add Button, Save/Cancel, Validation, Immutability)

### Test Coverage
- **Total Tests**: 151 passing
- **Test Suites**: 9 suites
- **Lines of Code**: ~1,200 (implementation) + ~3,000 (tests)

### Feature Breakdown
- **Step 1**: Initial setup (3 tests)
- **Step 2**: Public API (26 tests)
- **Step 3**: Lifecycle & Styles (12 tests)
- **Step 4**: Row Modes (15 tests)
- **Step 5**: Add Button (14 tests)
- **Step 6**: Save/Cancel (18 tests)
- **Step 7**: Validation (22 tests)
- **Step 8**: Immutability (15 tests)

---

## Conclusion

The `ck-editable-array` component was successfully built using strict TDD methodology over two days. The incremental approach allowed for steady progress while maintaining high code quality and comprehensive test coverage.

The component provides a complete editable array interface with:
- ✅ Display and edit modes
- ✅ Add, save, cancel, delete, and restore operations
- ✅ Schema-based validation with visual feedback
- ✅ Strong immutability guarantees
- ✅ Comprehensive accessibility support
- ✅ Proper event lifecycle
- ✅ Customizable templates and styling

The development journey demonstrates the power of TDD for building complex, reliable web components with clear requirements and predictable behavior.
