# Design Document

## Overview

This document outlines the design for improving the `ck-editable-array` web component with modern web standards, enhanced validation, better performance, and improved developer experience. The improvements build upon the existing production-ready component while maintaining full backward compatibility.

### Goals

1. Implement Constructable Stylesheets for efficient style sharing across instances
2. Add advanced validation constraints (maxLength, pattern, type)
3. Enable SSR compatibility with Declarative Shadow DOM support
4. Improve memory management with comprehensive cleanup
5. Optimize for tree-shaking and modern build tools
6. Enhance accessibility with focus trapping and keyboard shortcuts
7. Add form association support via ElementInternals
8. Expand the event system for better integration
9. Provide data serialization with round-trip consistency

### Non-Goals

- Breaking changes to the existing public API
- Removing support for older browsers (fallbacks will be provided)
- Changing the template-based rendering approach
- Modifying the existing data binding mechanism

## Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CkEditableArray                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  DomRenderer    │  │ValidationManager│  │   Types     │ │
│  │  - render()     │  │  - validateRow()│  │  - Interfaces│ │
│  │  - bindData()   │  │  - formatError()│  │  - Constants │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Enhanced Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CkEditableArray                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────┐│
│  │  DomRenderer    │  │ValidationManager│  │   StyleManager        ││
│  │  - render()     │  │  - validateRow()│  │  - getStylesheet()    ││
│  │  - bindData()   │  │  - maxLength()  │  │  - adoptStyles()      ││
│  │  - hydrate()    │  │  - pattern()    │  │  - fallbackStyles()   ││
│  └─────────────────┘  │  - type()       │  └───────────────────────┘│
│                       └─────────────────┘                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────┐│
│  │ FormIntegration │  │  EventManager   │  │   Serializer          ││
│  │  - internals    │  │  - dispatch()   │  │  - toJSON()           ││
│  │  - formValue    │  │  - rowadded     │  │  - toString()         ││
│  │  - validity     │  │  - rowdeleted   │  │  - parse()            ││
│  └─────────────────┘  └─────────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### StyleManager Module

```typescript
/**
 * Manages Constructable Stylesheets with fallback for older browsers
 */
export class StyleManager {
  private static _sharedSheet: CSSStyleSheet | null = null;
  private static _supportsConstructable: boolean | null = null;

  /**
   * Check if browser supports Constructable Stylesheets
   */
  static get supportsConstructableStylesheets(): boolean;

  /**
   * Get or create the shared stylesheet
   */
  static getSharedStylesheet(cssText: string): CSSStyleSheet | null;

  /**
   * Apply styles to a shadow root (uses adoptedStyleSheets or fallback)
   */
  static applyStyles(shadowRoot: ShadowRoot, cssText: string): void;

  /**
   * Update the shared stylesheet content
   */
  static updateStyles(cssText: string): void;
}
```

### Enhanced ValidationManager

```typescript
/**
 * Extended property schema with new constraints
 */
export interface PropertySchema {
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  patternMessage?: string;
}

/**
 * Extended i18n messages
 */
export interface I18nMessages {
  required?: (field: string) => string;
  minLength?: (field: string, min: number) => string;
  maxLength?: (field: string, max: number) => string;
  pattern?: (field: string, pattern: string) => string;
  type?: (field: string, expectedType: string) => string;
}
```

### FormIntegration Module

```typescript
/**
 * Handles form association via ElementInternals
 */
export class FormIntegration {
  private _internals: ElementInternals | null = null;
  private _initialData: unknown[] = [];

  /**
   * Initialize form internals
   */
  initialize(element: HTMLElement): void;

  /**
   * Update form value
   */
  setFormValue(data: unknown[]): void;

  /**
   * Set validity state
   */
  setValidity(flags: ValidityStateFlags, message?: string): void;

  /**
   * Handle form reset
   */
  formResetCallback(): void;

  /**
   * Handle form state restore
   */
  formStateRestoreCallback(state: unknown): void;
}
```

### Serializer Module

```typescript
/**
 * Options for data serialization
 */
export interface SerializerOptions {
  includeDeleted?: boolean;
  pretty?: boolean;
  indent?: number;
}

/**
 * Handles data serialization and deserialization
 */
export class Serializer {
  /**
   * Convert data to clean JSON representation
   */
  static toJSON(data: EditableRow[], options?: SerializerOptions): string;

  /**
   * Convert data to formatted string
   */
  static toString(data: EditableRow[], options?: SerializerOptions): string;

  /**
   * Parse serialized data back to array
   */
  static parse(json: string): EditableRow[];

  /**
   * Strip internal markers from row data
   */
  static cleanRow(row: EditableRow): unknown;
}
```

### Enhanced Event Types

```typescript
/**
 * Event detail for row operations
 */
export interface RowEventDetail {
  index: number;
  data: unknown;
  previousData?: unknown;
}

/**
 * Event detail for validation changes
 */
export interface ValidationEventDetail {
  isValid: boolean;
  errors: Record<string, string[]>;
  rowIndex: number;
}

/**
 * Custom event types
 */
export type ComponentEventMap = {
  'datachanged': CustomEvent<{ data: unknown[] }>;
  'rowadded': CustomEvent<RowEventDetail>;
  'rowdeleted': CustomEvent<RowEventDetail>;
  'rowrestored': CustomEvent<RowEventDetail>;
  'validationchange': CustomEvent<ValidationEventDetail>;
  'beforetogglemode': CustomEvent<{ index: number; from: string; to: string }>;
  'aftertogglemode': CustomEvent<{ index: number; mode: string }>;
};
```

## Data Models

### Extended Schema Structure

```typescript
interface ValidationSchema {
  type?: string;
  required?: string[];
  properties?: Record<string, PropertySchema>;
}

interface PropertySchema {
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  patternMessage?: string;
}
```

### Form Value Structure

When participating in forms, the component will serialize its data as:

```typescript
// FormData representation
formData.set('fieldName', JSON.stringify(cleanedData));

// Or as individual entries
data.forEach((row, index) => {
  Object.entries(row).forEach(([key, value]) => {
    formData.set(`fieldName[${index}].${key}`, String(value));
  });
});
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Shared Stylesheet Consistency

*For any* number of Component instances created in a browser that supports Constructable Stylesheets, all instances SHALL reference the same shared CSSStyleSheet object.

**Validates: Requirements 1.3**

### Property 2: Style Update Propagation

*For any* style update applied to the shared stylesheet, all existing Component instances SHALL reflect the updated styles immediately without requiring re-instantiation.

**Validates: Requirements 1.4**

### Property 3: MaxLength Validation

*For any* string value and maxLength constraint, if the string length exceeds maxLength, validation SHALL fail and return an error message containing the maximum allowed length.

**Validates: Requirements 2.1, 2.4**

### Property 4: Pattern Validation

*For any* string value and regex pattern constraint, if the string does not match the pattern, validation SHALL fail and return either the custom patternMessage or a default pattern mismatch message.

**Validates: Requirements 2.2, 2.5**

### Property 5: Type Validation

*For any* value and type constraint, if the value does not conform to the expected type (string, number, boolean, email, url), validation SHALL fail and return an error message indicating the expected type.

**Validates: Requirements 2.3, 2.6**

### Property 6: AbortController Cleanup on Disconnect

*For any* Component instance with active event listeners, when the Component is disconnected from the DOM, all associated AbortControllers SHALL be aborted.

**Validates: Requirements 4.1**

### Property 7: Row Removal Cleanup

*For any* row removed from the data array, the associated AbortController for that row's event listeners SHALL be aborted and removed from the internal controller map.

**Validates: Requirements 4.2**

### Property 8: Reconnection Reinitializes Correctly

*For any* Component that is disconnected and then reconnected to the DOM, the Component SHALL reinitialize MutationObservers and event listeners, and render correctly.

**Validates: Requirements 4.5**

### Property 9: Screen Reader Mode Announcement

*For any* row that enters edit mode, a live region SHALL be updated to announce the mode change to screen readers.

**Validates: Requirements 6.1**

### Property 10: Screen Reader Error Announcement

*For any* validation that produces errors, a live region SHALL be updated to announce the error count to screen readers.

**Validates: Requirements 6.2**

### Property 11: Modal Focus Trapping

*For any* modal that is open, Tab and Shift+Tab navigation SHALL cycle focus only within the modal's focusable elements.

**Validates: Requirements 6.3**

### Property 12: Modal Focus Restoration

*For any* modal that closes, focus SHALL be restored to the element that triggered the modal opening.

**Validates: Requirements 6.4**

### Property 13: Escape Key Cancels Edit

*For any* row in edit mode, pressing the Escape key SHALL cancel edit mode and restore the row to its previous state.

**Validates: Requirements 6.5**

### Property 14: Enter Key Saves Edit

*For any* row in edit mode where focus is not on a textarea, pressing the Enter key SHALL trigger save if validation passes.

**Validates: Requirements 6.6**

### Property 15: Render Debouncing

*For any* sequence of N rapid data changes within a debounce window, the Component SHALL perform at most 1 render operation after the debounce period.

**Validates: Requirements 7.2**

### Property 16: Form Value Reporting

*For any* Component inside a form element, the form's FormData SHALL include the Component's serialized data when the form is submitted.

**Validates: Requirements 8.3**

### Property 17: Form Validation Participation

*For any* Component with validation errors inside a form, the form's checkValidity() SHALL return false.

**Validates: Requirements 8.4**

### Property 18: Form Reset Restores Initial Data

*For any* Component inside a form, when the form is reset, the Component's data SHALL be restored to its initial state at the time of form association.

**Validates: Requirements 8.5**

### Property 19: Form Submission Blocked on Invalid

*For any* Component with validation errors inside a form, form submission SHALL be prevented and errors SHALL be displayed.

**Validates: Requirements 8.6**

### Property 20: RowAdded Event Dispatch

*For any* row added to the Component, a `rowadded` event SHALL be dispatched with detail containing the new row data and its index.

**Validates: Requirements 9.1**

### Property 21: RowDeleted Event Dispatch

*For any* row deleted from the Component, a `rowdeleted` event SHALL be dispatched with detail containing the deleted row data and its index.

**Validates: Requirements 9.2**

### Property 22: RowRestored Event Dispatch

*For any* row restored in the Component, a `rowrestored` event SHALL be dispatched with detail containing the restored row data and its index.

**Validates: Requirements 9.3**

### Property 23: ValidationChange Event Dispatch

*For any* change in validation state, a `validationchange` event SHALL be dispatched with detail containing the validation result and affected row index.

**Validates: Requirements 9.4**

### Property 24: Events Cross Shadow DOM

*For any* custom event dispatched by the Component, the event SHALL have `bubbles: true` and `composed: true` properties.

**Validates: Requirements 9.5**

### Property 25: Serialization Excludes Internal Markers

*For any* data serialized via toJSON() or toString(), the output SHALL NOT contain internal markers (`__originalSnapshot`, `__isNew`, `editing`).

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 26: Serialization Round-Trip Consistency

*For any* valid data array, serializing via toJSON() and then parsing the result SHALL produce an equivalent data array (excluding internal state).

**Validates: Requirements 10.4**

### Property 27: Serialization Options Support

*For any* serialization with `includeDeleted: false` option, deleted rows SHALL be excluded from the output.

**Validates: Requirements 10.5**

## Error Handling

### Validation Error Scenarios

| Scenario | Handling Strategy |
|----------|------------------|
| maxLength exceeded | Return error with field name and max value |
| Pattern mismatch | Return custom message or default pattern error |
| Type mismatch | Return error with expected type name |
| Invalid regex pattern | Log warning, skip pattern validation |
| Missing schema | Treat all data as valid |

### Form Integration Error Scenarios

| Scenario | Handling Strategy |
|----------|------------------|
| ElementInternals not supported | Fall back to hidden input approach |
| Form not found | Skip form association |
| Invalid form value | Serialize as empty array |

### SSR/Hydration Error Scenarios

| Scenario | Handling Strategy |
|----------|------------------|
| Mismatched server/client state | Client state takes precedence |
| Missing shadowRoot | Create new shadowRoot |
| Corrupted server HTML | Re-render from scratch |

## Testing Strategy

### Dual Testing Approach

The implementation will use both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Library

We will use **fast-check** for property-based testing in TypeScript/JavaScript:

```typescript
import * as fc from 'fast-check';
```

Each property-based test will be configured to run a minimum of 100 iterations.

### Test Categories

1. **Constructable Stylesheets Tests**
   - Feature detection accuracy
   - Fallback behavior
   - Shared stylesheet verification
   - Style update propagation

2. **Validation Tests**
   - maxLength constraint
   - Pattern matching
   - Type validation
   - Error message formatting
   - i18n message customization

3. **Memory Management Tests**
   - AbortController cleanup
   - MutationObserver cleanup
   - Reconnection behavior

4. **Accessibility Tests**
   - Live region announcements
   - Focus trapping
   - Focus restoration
   - Keyboard shortcuts

5. **Form Integration Tests**
   - Form value reporting
   - Constraint validation
   - Form reset behavior
   - Submission blocking

6. **Event System Tests**
   - Event dispatch verification
   - Event detail accuracy
   - Event bubbling/composition

7. **Serialization Tests**
   - Round-trip consistency
   - Internal marker exclusion
   - Options support

### Test Annotation Format

Each property-based test will be annotated with:
```typescript
/**
 * **Feature: ck-editable-array-improvements, Property 3: MaxLength Validation**
 * **Validates: Requirements 2.1, 2.4**
 */
```

## Implementation Phases

### Phase 1: StyleManager Module
- Implement Constructable Stylesheets support
- Add feature detection with caching
- Implement fallback for older browsers
- Update component to use StyleManager

### Phase 2: Enhanced Validation
- Add maxLength validation
- Add pattern validation
- Add type validation
- Update i18n interface
- Update error message formatting

### Phase 3: Memory Management
- Audit AbortController usage
- Implement comprehensive cleanup
- Add reconnection handling
- Add internal cache clearing

### Phase 4: Accessibility Enhancements
- Add live region for announcements
- Implement focus trapping for modal
- Add keyboard shortcuts (Escape, Enter)
- Ensure focus restoration

### Phase 5: Form Integration
- Add formAssociated static property
- Implement ElementInternals
- Add form value reporting
- Implement form reset callback
- Add constraint validation

### Phase 6: Event System
- Add rowadded event
- Add rowdeleted event
- Add rowrestored event
- Add validationchange event
- Verify event configuration

### Phase 7: Serialization
- Implement toJSON() method
- Implement toString() method
- Add serialization options
- Ensure round-trip consistency

### Phase 8: SSR Compatibility
- Add Declarative Shadow DOM detection
- Implement hydration logic
- Add state reconciliation
- Test with SSR frameworks
