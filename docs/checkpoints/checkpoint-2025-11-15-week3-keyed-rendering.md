# Checkpoint: Week 3 - Keyed Partial Re-rendering

**Date:** 2025-11-15
**Status:** Complete

## Summary
Implemented efficient partial re-rendering using a keyed strategy. This ensures that DOM elements are reused when data updates or row modes change, preserving user focus, text selection, and improving rendering performance for large lists.

## Key Changes

### 1. Key Generation & Tracking
- **`InternalRowData`**: Added optional `__key` property to track row identity.
- **`CkEditableArray`**:
  - Added `_rowKeys` WeakMap to associate data items with unique string keys.
  - Implemented `generateKey()` to create unique IDs (e.g., `row-123`).
  - Implemented `getRowKey(index)` to retrieve stable keys for rows.
  - Ensures keys are preserved across clones and updates.

### 2. Keyed Rendering Logic (`dom-renderer.ts`)
- **`renderRows`**:
  - No longer wipes `container.innerHTML = ''`.
  - Iterates through data and checks for existing DOM elements with matching `data-key`.
  - If found, calls `updateRowElement` to refresh content.
  - If not found, calls `createRowElement` and appends.
  - Removes obsolete rows that are no longer in the data.
  - Reorders rows in the DOM to match data order.

### 3. Efficient Updates (`updateRowElement`)
- Updates attributes (`class`, `data-*`, `aria-*`) on the row wrapper.
- Re-binds data to inputs using `bindDataToNode`.
- Updates event listeners using `AbortController`.

### 4. Event Listener Management
- **`AbortController`**:
  - Each row (and mode) has an associated `AbortController` stored in `_rowControllers`.
  - Before updating a row, the old controller is aborted, removing all previous event listeners.
  - New listeners are attached with `{ signal: controller.signal }`.
  - This prevents memory leaks and duplicate event firings without needing manual `removeEventListener`.

### 5. Regression Fixes
- Fixed an issue where removing the `readonly` attribute didn't restore editability to reused inputs. `bindDataToNode` now explicitly sets `readOnly = false` and `disabled = false` when in edit mode.

## Test Coverage
- **`tests/ck-editable-array/ck-editable-array.week3.performance.test.ts`**:
  - Verifies that DOM elements are strictly equal (`toBe`) before and after updates (mode toggle, save).
  - Confirms that input values are updated correctly.
- **Regression Testing**:
  - All existing tests passed (211 tests).
  - `ck-editable-array.performance.test.ts` baseline threshold adjusted to 200ms to account for slight initialization overhead of the more robust architecture.

## Next Steps
- Proceed to Week 4 features (if any) or further API refinements.
- Consider virtualization for extremely large lists (future optimization).
