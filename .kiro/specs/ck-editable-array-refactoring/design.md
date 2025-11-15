# Design Document

## Overview

This document outlines the refactoring design for the `ck-editable-array` web component. The refactoring will improve code organization, type safety, maintainability, and readability while preserving all existing functionality and ensuring 100% test compatibility. The design follows the Single Responsibility Principle and modern TypeScript best practices.

### Goals

1. Improve code organization by grouping related methods logically
2. Enhance type safety with explicit interfaces and better type guards
3. Extract complex logic into focused, testable helper methods
4. Reduce code duplication and improve reusability
5. Maintain complete backward compatibility with existing tests and public API
6. Improve performance through optimized DOM operations
7. Enhance accessibility compliance

### Non-Goals

- Changing the public API or breaking existing functionality
- Adding new features beyond what's necessary for refactoring
- Modifying the component's external behavior or event signatures
- Changing the template system or data binding mechanism

## Architecture

### Current Structure Analysis

The current implementation has approximately 1,200 lines in a single class with methods organized roughly by functionality but lacking clear boundaries. Key areas include:

1. **Lifecycle Methods**: Constructor, connectedCallback, disconnectedCallback, attributeChangedCallback
2. **Public API**: Data, schema, and newItemFactory getters/setters
3. **Style Management**: mirrorStyles, observeStyleChanges
4. **Rendering**: render, appendRowFromTemplate, bindDataToNode, injectActionButtons
5. **Data Operations**: cloneRow, resolveBindingValue, commitRowValue, updateBoundNodes
6. **Event Handlers**: handleAddClick, handleSaveClick, handleToggleClick, handleCancelClick, handleDeleteClick, handleRestoreClick
7. **Validation**: validateRow, validateRowDetailed, updateSaveButtonState
8. **Utilities**: isRecord, dispatchDataChanged, renderAddButton

### Proposed Structure

We will reorganize the code into logical sections with clear boundaries using TypeScript regions or comment blocks:

```typescript
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// ============================================================================
// CLASS DEFINITION & STATIC MEMBERS
// ============================================================================

// ============================================================================
// LIFECYCLE METHODS
// ============================================================================

// ============================================================================
// PUBLIC API (GETTERS/SETTERS)
// ============================================================================

// ============================================================================
// STYLE MANAGEMENT
// ============================================================================

// ============================================================================
// RENDERING & DOM MANIPULATION
// ============================================================================

// ============================================================================
// DATA BINDING & UPDATES
// ============================================================================

// ============================================================================
// VALIDATION
// ============================================================================

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// ============================================================================
// DATA OPERATIONS & UTILITIES
// ============================================================================
```

## Components and Interfaces

### Type Definitions

We will introduce explicit interfaces to improve type safety:

```typescript
/**
 * Represents internal row data with editing state markers
 */
interface InternalRowData extends Record<string, unknown> {
  editing?: boolean;
  deleted?: boolean;
  __originalSnapshot?: Record<string, unknown>;
  __isNew?: boolean;
}

/**
 * A row can be either a primitive string or an object with properties
 */
type EditableRow = InternalRowData | string;

/**
 * Result of validation with detailed error information
 */
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * JSON Schema-like structure for validation
 */
interface ValidationSchema {
  required?: string[];
  properties?: Record<string, PropertySchema>;
}

/**
 * Property-level schema definition
 */
interface PropertySchema {
  minLength?: number;
  // Future: maxLength, pattern, type, etc.
}

/**
 * Mode for rendering rows
 */
type RenderMode = 'display' | 'edit';

/**
 * Action types for button handlers
 */
type ActionType = 'add' | 'save' | 'cancel' | 'toggle' | 'delete' | 'restore';
```

### Helper Method Extraction

We will extract several focused helper methods:

#### Precondition Validators

```typescript
/**
 * Check if an operation should be blocked due to readonly state
 */
private isReadonlyBlocked(): boolean

/**
 * Check if an operation should be blocked due to exclusive edit locking
 */
private isEditLocked(): boolean

/**
 * Validate that a row index is within bounds
 */
private isValidRowIndex(rowIndex: number): boolean
```

#### DOM Query Helpers

```typescript
/**
 * Get the rows container from shadow DOM
 */
private getRowsContainer(): HTMLElement | null

/**
 * Get the add button container from shadow DOM
 */
private getAddButtonContainer(): HTMLElement | null

/**
 * Get display template from light DOM
 */
private getDisplayTemplate(): HTMLTemplateElement | null

/**
 * Get edit template from light DOM
 */
private getEditTemplate(): HTMLTemplateElement | null

/**
 * Get row wrapper elements for a specific row index
 */
private getRowWrappers(rowIndex: number): HTMLElement[]
```

#### Data Transformation Helpers

```typescript
/**
 * Create a clean public copy of row data (removes internal markers)
 */
private toPublicRowData(row: EditableRow): unknown

/**
 * Create a snapshot of row data for rollback purposes
 */
private createRowSnapshot(row: InternalRowData): Record<string, unknown>

/**
 * Restore row data from a snapshot
 */
private restoreFromSnapshot(row: InternalRowData): EditableRow

/**
 * Mark a row as entering edit mode
 */
private enterEditMode(row: InternalRowData): InternalRowData

/**
 * Mark a row as exiting edit mode (cleanup)
 */
private exitEditMode(row: InternalRowData): EditableRow
```

#### Validation Helpers

```typescript
/**
 * Check if a field value is empty
 */
private isFieldEmpty(value: unknown): boolean

/**
 * Validate required fields for a row
 */
private validateRequiredFields(
  row: InternalRowData,
  schema: ValidationSchema
): Record<string, string[]>

/**
 * Validate property constraints for a row
 */
private validatePropertyConstraints(
  row: InternalRowData,
  schema: ValidationSchema
): Record<string, string[]>

/**
 * Format validation error message
 */
private formatValidationError(field: string, constraint: string, value: unknown): string
```

#### Event Listener Helpers

```typescript
/**
 * Attach input event listeners to form elements in a row
 */
private attachInputListeners(
  wrapper: HTMLElement,
  rowIndex: number,
  mode: RenderMode
): void

/**
 * Attach button click listeners to action buttons in a row
 */
private attachButtonListeners(
  wrapper: HTMLElement,
  rowIndex: number,
  mode: RenderMode,
  isLocked: boolean
): void

/**
 * Configure readonly state for form inputs
 */
private configureReadonlyState(
  input: HTMLInputElement | HTMLTextAreaElement,
  isReadonly: boolean
): void
```

#### Style Mutation Detection

```typescript
/**
 * Check if a mutation involves style elements with slot="styles"
 */
private isStyleMutation(mutation: MutationRecord): boolean

/**
 * Check if a node is a style element with slot="styles"
 */
private isStyleNode(node: Node): boolean
```

## Data Models

### Internal Data Structure

The component maintains an internal `_data` array where each item can be:

1. **Primitive String**: Simple string value
2. **Object with Internal Markers**: Record with optional internal properties:
   - `editing`: Boolean flag indicating if row is in edit mode
   - `deleted`: Boolean flag indicating if row is soft-deleted
   - `__originalSnapshot`: Deep clone of row data before editing (for rollback)
   - `__isNew`: Boolean flag indicating if row was just added (not yet saved)

### Public Data Structure

When exposing data through the `data` getter, internal markers (`__originalSnapshot`, `__isNew`) are stripped, but public state flags (`editing`, `deleted`) are preserved for backward compatibility.

### Schema Structure

The validation schema follows a simplified JSON Schema format:

```typescript
{
  required: ['field1', 'field2'],
  properties: {
    field1: {
      minLength: 3
    },
    field2: {
      minLength: 5
    }
  }
}
```

## Error Handling

### Defensive Programming Patterns

All methods will follow consistent error handling patterns:

1. **Early Returns**: Validate preconditions at the start of methods
2. **Null Checks**: Always check for null/undefined before accessing properties
3. **Boundary Validation**: Validate array indices before access
4. **Graceful Degradation**: Provide fallback behavior when optional features are missing

### Specific Error Scenarios

| Scenario | Handling Strategy |
|----------|------------------|
| Invalid row index | Early return, no operation performed |
| Missing shadow DOM | Early return from rendering methods |
| Missing templates | Skip rendering for that mode |
| Missing schema | Treat all rows as valid |
| Malformed schema | Gracefully ignore invalid schema properties |
| Readonly mode | Block all mutating operations |
| Edit locked state | Block operations that would conflict with editing row |

## Testing Strategy

### Test Compatibility

All existing tests must pass without modification. The refactoring will:

1. Preserve all public method signatures
2. Maintain identical event dispatching behavior
3. Keep the same DOM structure and attributes
4. Preserve all edge case handling

### Test Coverage for New Methods

While most new methods are internal refactorings of existing logic, any complex helper methods will be tested indirectly through existing test suites. If a helper method contains non-trivial logic not covered by existing tests, we will add focused unit tests.

### Validation Testing

Existing validation tests in `ck-editable-array.step7.validation.test.ts` will verify:

- Required field validation
- MinLength validation
- Save button state management
- Error message display
- ARIA attribute management

### Performance Testing

We will verify that refactoring doesn't degrade performance by:

1. Running existing test suites and ensuring no timeouts
2. Manually testing with large datasets (100+ rows)
3. Checking that DOM updates are still incremental (not full re-renders)

## Refactoring Details

### Phase 1: Type Definitions

**Objective**: Introduce explicit interfaces and type aliases

**Changes**:
- Define `InternalRowData`, `ValidationResult`, `ValidationSchema`, `PropertySchema` interfaces
- Define `RenderMode` and `ActionType` type aliases
- Update method signatures to use new types
- Replace `Record<string, unknown>` with `InternalRowData` where appropriate

**Risk**: Low - TypeScript compilation will catch any type mismatches

### Phase 2: Precondition Validators

**Objective**: Extract common validation logic into reusable methods

**Changes**:
- Create `isReadonlyBlocked()`, `isEditLocked()`, `isValidRowIndex()` methods
- Update all event handlers to use these validators
- Ensure consistent early-return patterns

**Risk**: Low - Logic is extracted, not changed

### Phase 3: DOM Query Helpers

**Objective**: Reduce repetitive DOM queries and improve readability

**Changes**:
- Create `getRowsContainer()`, `getAddButtonContainer()`, `getDisplayTemplate()`, `getEditTemplate()`, `getRowWrappers()` methods
- Update all methods that query the DOM to use these helpers
- Add null checks at helper boundaries

**Risk**: Low - Queries are centralized, behavior unchanged

### Phase 4: Data Transformation Helpers

**Objective**: Clarify data cloning and state transition logic

**Changes**:
- Create `toPublicRowData()`, `createRowSnapshot()`, `restoreFromSnapshot()`, `enterEditMode()`, `exitEditMode()` methods
- Update `data` getter to use `toPublicRowData()`
- Update toggle/cancel handlers to use snapshot helpers
- Update add handler to use `enterEditMode()`

**Risk**: Medium - Data transformations are critical; thorough testing required

### Phase 5: Validation Refactoring

**Objective**: Modularize validation logic for better testability

**Changes**:
- Create `isFieldEmpty()`, `validateRequiredFields()`, `validatePropertyConstraints()`, `formatValidationError()` methods
- Refactor `validateRowDetailed()` to use these helpers
- Ensure error message formatting is consistent

**Risk**: Medium - Validation logic is complex; must preserve exact behavior

### Phase 6: Event Listener Helpers

**Objective**: Separate event listener attachment from rendering logic

**Changes**:
- Create `attachInputListeners()`, `attachButtonListeners()`, `configureReadonlyState()` methods
- Refactor `bindDataToNode()` to delegate to these helpers
- Reduce method length and improve readability

**Risk**: Low - Event attachment is extracted, not changed

### Phase 7: Style Management Simplification

**Objective**: Improve readability of mutation observer logic

**Changes**:
- Create `isStyleMutation()`, `isStyleNode()` helper methods
- Simplify `observeStyleChanges()` callback logic
- Add descriptive variable names

**Risk**: Low - Logic is clarified, not changed

### Phase 8: Code Organization

**Objective**: Group related methods with clear section boundaries

**Changes**:
- Add section comment blocks
- Reorder methods to follow logical flow
- Ensure consistent method naming conventions

**Risk**: Very Low - Pure organizational change

### Phase 9: Documentation

**Objective**: Add JSDoc comments for complex methods

**Changes**:
- Add JSDoc comments for all helper methods
- Document parameters, return values, and side effects
- Remove redundant inline comments

**Risk**: Very Low - Documentation only

### Phase 10: Final Cleanup

**Objective**: Polish code quality

**Changes**:
- Extract magic strings/numbers into constants
- Ensure consistent formatting
- Run linter and fix any issues
- Verify all tests pass

**Risk**: Very Low - Final polish

## Performance Considerations

### Optimization Strategies

1. **Incremental DOM Updates**: The `updateBoundNodes()` method already provides incremental updates; we'll preserve this
2. **Efficient Selectors**: Use specific selectors (e.g., `[data-row="${rowIndex}"]`) instead of broad queries
3. **Batch Operations**: Group DOM queries and updates where possible
4. **Avoid Redundant Cloning**: Only clone data when necessary (entering edit mode, committing changes)
5. **Event Delegation**: Consider event delegation for button clicks (future optimization)

### Performance Metrics

- **Rendering 100 rows**: Should complete in < 100ms
- **Updating a single field**: Should complete in < 10ms
- **Toggling edit mode**: Should complete in < 50ms

## Accessibility Compliance

### ARIA Attributes

The refactoring will preserve all existing ARIA attributes:

- `aria-disabled`: Applied to buttons when readonly or locked
- `aria-invalid`: Applied to form inputs with validation errors
- `aria-describedby`: Links form inputs to error messages
- `inert`: Applied to locked row wrappers

### Keyboard Navigation

No changes to keyboard navigation; all existing behavior preserved.

### Screen Reader Support

Error messages and validation state changes will continue to be announced through ARIA attributes and live regions (if implemented in templates).

## Migration Path

### For Developers

No migration required - this is an internal refactoring with no breaking changes.

### For Users

No changes to component usage or behavior.

## Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing tests | Low | High | Run tests after each phase; revert if failures occur |
| Performance regression | Low | Medium | Manual testing with large datasets; performance profiling |
| Type errors introduced | Low | Low | TypeScript compilation catches issues early |
| Logic errors in extraction | Medium | High | Careful code review; incremental changes; thorough testing |
| Accessibility regression | Low | High | Run accessibility tests; manual testing with screen readers |

## Success Criteria

1. All existing tests pass without modification
2. Code is organized into clear logical sections
3. Method length is reduced (target: < 50 lines per method)
4. Type safety is improved (fewer `any` or `unknown` types)
5. Code duplication is reduced
6. Linter passes with no errors
7. Performance is maintained or improved
8. Accessibility compliance is preserved

## Future Enhancements

While out of scope for this refactoring, the improved structure will enable:

1. **Event Delegation**: Centralized event handling for better performance
2. **Virtual Scrolling**: Support for very large datasets
3. **Enhanced Validation**: Additional schema constraints (maxLength, pattern, type, etc.)
4. **Undo/Redo**: Leveraging the snapshot system
5. **Batch Operations**: Multi-row edit/delete
6. **Custom Validators**: Plugin system for validation rules
