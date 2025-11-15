# Implementation Plan

- [x] 1. Add TypeScript type definitions and interfaces
  - Create explicit interfaces at the top of the file: `InternalRowData`, `ValidationResult`, `ValidationSchema`, `PropertySchema`
  - Define type aliases: `RenderMode`, `ActionType`
  - Update the existing `EditableRow` type to reference `InternalRowData`
  - Update method signatures throughout the class to use the new types instead of generic `Record<string, unknown>`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Extract precondition validator methods
  - Create `isReadonlyBlocked()` method to check readonly attribute
  - Create `isEditLocked()` method to check if any row is in edit mode
  - Create `isValidRowIndex(rowIndex: number)` method to validate array bounds
  - Update all event handler methods to use these validators for consistent precondition checking
  - _Requirements: 5.2, 8.1, 8.4_

- [x] 3. Extract DOM query helper methods
  - Create `getRowsContainer()` method to query `[part="rows"]` from shadow DOM
  - Create `getAddButtonContainer()` method to query `[part="add-button"]` from shadow DOM
  - Create `getDisplayTemplate()` method to query `template[slot="display"]` from light DOM
  - Create `getEditTemplate()` method to query `template[slot="edit"]` from light DOM
  - Create `getRowWrappers(rowIndex: number)` method to query row elements by index
  - Update `render()`, `renderAddButton()`, and `updateBoundNodes()` to use these helpers
  - _Requirements: 4.2, 4.3, 11.4_

- [x] 4. Extract data transformation helper methods
  - Create `toPublicRowData(row: EditableRow)` method to strip internal markers from row data
  - Create `createRowSnapshot(row: InternalRowData)` method to create deep clone for rollback
  - Create `restoreFromSnapshot(row: InternalRowData)` method to restore row from snapshot
  - Create `enterEditMode(row: InternalRowData)` method to mark row as editing with snapshot
  - Create `exitEditMode(row: InternalRowData)` method to remove editing flag and markers
  - Update `data` getter to use `toPublicRowData()`
  - Update `handleToggleClick()` and `handleCancelClick()` to use snapshot helpers
  - Update `handleAddClick()` to use `enterEditMode()`
  - Update `handleSaveClick()` to use `exitEditMode()`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Refactor validation logic into modular methods
  - Create `isFieldEmpty(value: unknown)` method to check if a field value is empty
  - Create `validateRequiredFields(row: InternalRowData, schema: ValidationSchema)` method
  - Create `validatePropertyConstraints(row: InternalRowData, schema: ValidationSchema)` method
  - Create `formatValidationError(field: string, constraint: string, value: unknown)` method
  - Refactor `validateRowDetailed()` to use these helper methods
  - Ensure error message formatting is consistent across all validation rules
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Extract event listener attachment logic


  - Create `attachInputListeners(wrapper: HTMLElement, rowIndex: number, mode: RenderMode)` method
  - Create `attachButtonListeners(wrapper: HTMLElement, rowIndex: number, mode: RenderMode, isLocked: boolean)` method
  - Create `configureReadonlyState(input: HTMLInputElement | HTMLTextAreaElement, isReadonly: boolean)` method
  - Refactor `bindDataToNode()` to delegate event listener attachment to these helpers
  - Reduce duplication in input/textarea event listener setup
  - Run tests to verify: `npm test`
  - Run linter to verify: `npm run lint`
  - _Requirements: 4.3, 5.1, 5.3, 11.5_

- [x] 7. Simplify style management logic


  - Create `isStyleMutation(mutation: MutationRecord)` method to check if mutation involves style elements
  - Create `isStyleNode(node: Node)` method to check if node is a style element with slot="styles"
  - Refactor `observeStyleChanges()` callback to use these helpers
  - Simplify the mutation detection logic for better readability
  - Run tests to verify: `npm test`
  - Run linter to verify: `npm run lint`
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Organize code into logical sections


  - Reorder methods to follow logical flow: Type Definitions → Lifecycle → Public API → Style Management → Rendering → Data Binding → Validation → Event Handlers → Utilities
  - Ensure consistent method naming conventions (e.g., all handlers start with `handle`, all validators start with `is` or `validate`)
  - Group private helper methods near the methods that use them
  - Run tests to verify: `npm test`
  - Run linter to verify: `npm run lint`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1_

- [x] 9. Add documentation and improve readability


  - Add JSDoc comments for complex existing methods (e.g., `commitRowValue`, `updateSaveButtonState`, `bindDataToNode`, `appendRowFromTemplate`)
  - Add JSDoc comments for any helper methods that don't have them yet
  - Remove redundant inline comments that restate obvious code
  - Use descriptive variable names throughout (e.g., `isCurrentlyEditing` instead of `isEditing`)
  - Extract magic strings into named constants (e.g., attribute names, selector strings)
  - Run tests to verify: `npm test`
  - Run linter to verify: `npm run lint`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10. Fix failing tests and final verification



  - Fix the failing test in `ck-editable-array.step3.lifecycle-styles.test.ts` related to whitespace-only style handling
  - Fix the TypeScript error in `ck-editable-array.security.test.ts` (type assertion issue)
  - Run the full test suite: `npm test`
  - Verify all existing tests pass without modification
  - Run linter: `npm run lint`
  - Fix any remaining linting issues
  - Run formatter: `npm run format`
  - Manually test with demo files to verify visual behavior
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 12.1, 12.2, 12.3, 12.4, 12.5_
