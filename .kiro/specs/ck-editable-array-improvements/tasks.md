# Implementation Plan

- [ ] 1. Implement StyleManager module with Constructable Stylesheets
  - [ ] 1.1 Write failing tests for StyleManager
    - Create test file `tests/ck-editable-array/style-manager.test.ts`
    - Write test for `supportsConstructableStylesheets` feature detection
    - Write test for `getSharedStylesheet()` returning same instance across calls
    - Write test for `applyStyles()` using adoptedStyleSheets in modern browsers
    - Write test for fallback to `<style>` element when Constructable Stylesheets not supported
    - **Property 1: Shared Stylesheet Consistency**
    - **Property 2: Style Update Propagation**
    - **Validates: Requirements 1.3, 1.4**
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 1.2 Create StyleManager class to make tests pass
    - Create `src/components/ck-editable-array/style-manager.ts`
    - Implement `supportsConstructableStylesheets` getter with cached feature detection
    - Implement `getSharedStylesheet(cssText)` method to create/return shared CSSStyleSheet
    - Implement `applyStyles(shadowRoot, cssText)` method with fallback to `<style>` element
    - Implement `updateStyles(cssText)` method to update shared stylesheet
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 1.3 Integrate StyleManager into CkEditableArray component
    - Ensure existing tests still pass before changes
    - Update constructor to use StyleManager.applyStyles() instead of inline style element
    - Move base CSS to a constant for reuse
    - Ensure fallback works for older browsers
    - Run existing tests to verify no regressions: `npm test`
    - _Requirements: 1.1, 1.2_

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement enhanced validation constraints
  - [ ] 3.1 Write failing tests for maxLength validation
    - Create test file `tests/ck-editable-array/validation-enhanced.test.ts`
    - Write test for maxLength validation failing when string exceeds limit
    - Write test for maxLength validation passing when string is within limit
    - Write test for error message containing max length value
    - Write test for i18n maxLength message customization
    - **Property 3: MaxLength Validation**
    - **Validates: Requirements 2.1, 2.4**

  - [ ] 3.2 Extend PropertySchema and I18nMessages interfaces in types.ts
    - Add `maxLength?: number` property to PropertySchema
    - Add `pattern?: string | RegExp` property to PropertySchema
    - Add `patternMessage?: string` property to PropertySchema
    - Add `type?: 'string' | 'number' | 'boolean' | 'email' | 'url'` property to PropertySchema
    - Add `maxLength?: (field: string, max: number) => string` to I18nMessages
    - Add `pattern?: (field: string, pattern: string) => string` to I18nMessages
    - Add `type?: (field: string, expectedType: string) => string` to I18nMessages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 3.3 Implement maxLength validation in ValidationManager to make tests pass
    - Add `validateMaxLength(value, maxLength)` private method
    - Integrate into `validatePropertyConstraints()`
    - Add default error message formatting
    - _Requirements: 2.1, 2.4_

  - [ ] 3.4 Write failing tests for pattern validation
    - Write test for pattern validation failing when string doesn't match regex
    - Write test for pattern validation passing when string matches regex
    - Write test for custom patternMessage being used
    - Write test for default pattern mismatch message
    - Write test for handling invalid regex gracefully
    - **Property 4: Pattern Validation**
    - **Validates: Requirements 2.2, 2.5**

  - [ ] 3.5 Implement pattern validation in ValidationManager to make tests pass
    - Add `validatePattern(value, pattern)` private method
    - Support both string and RegExp patterns
    - Handle invalid regex gracefully with warning
    - Integrate into `validatePropertyConstraints()`
    - _Requirements: 2.2, 2.5_

  - [ ] 3.6 Write failing tests for type validation
    - Write test for type='string' validation
    - Write test for type='number' validation
    - Write test for type='boolean' validation
    - Write test for type='email' validation with valid/invalid emails
    - Write test for type='url' validation with valid/invalid URLs
    - Write test for error message containing expected type
    - **Property 5: Type Validation**
    - **Validates: Requirements 2.3, 2.6**

  - [ ] 3.7 Implement type validation in ValidationManager to make tests pass
    - Add `validateType(value, expectedType)` private method
    - Support string, number, boolean, email, url types
    - Add email regex validation
    - Add URL validation
    - Integrate into `validatePropertyConstraints()`
    - _Requirements: 2.3, 2.6_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement memory management improvements
  - [ ] 5.1 Write failing tests for AbortController cleanup
    - Create test file `tests/ck-editable-array/memory-management.test.ts`
    - Write test verifying AbortControllers are aborted on component disconnect
    - Write test verifying AbortControllers are cleaned up when rows are removed
    - Write test verifying MutationObserver is disconnected on component disconnect
    - **Property 6: AbortController Cleanup on Disconnect**
    - **Property 7: Row Removal Cleanup**
    - **Validates: Requirements 4.1, 4.2**

  - [ ] 5.2 Audit and improve AbortController cleanup in DomRenderer to make tests pass
    - Ensure all AbortControllers are tracked in `_rowControllers` map
    - Implement cleanup when rows are removed
    - Add public method to abort all controllers for disconnect
    - _Requirements: 4.1, 4.2_

  - [ ] 5.3 Implement comprehensive disconnectedCallback cleanup
    - Clear internal caches and references
    - Call DomRenderer cleanup method
    - Disconnect MutationObserver (already implemented)
    - Reset internal state for potential reconnection
    - _Requirements: 4.3, 4.4_

  - [ ] 5.4 Write failing tests for reconnection behavior
    - Write test verifying component works after disconnect/reconnect cycle
    - Write test verifying MutationObserver is reinitialized on reconnect
    - Write test verifying event listeners work after reconnect
    - **Property 8: Reconnection Reinitializes Correctly**
    - **Validates: Requirements 4.5**

  - [ ] 5.5 Implement reconnection handling in connectedCallback to make tests pass
    - Reinitialize MutationObserver
    - Re-render component
    - Restore event listeners
    - _Requirements: 4.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement accessibility enhancements
  - [ ] 7.1 Write failing tests for screen reader announcements
    - Create test file `tests/ck-editable-array/accessibility-enhanced.test.ts`
    - Write test verifying live region exists in shadow DOM
    - Write test verifying mode change is announced when entering edit mode
    - Write test verifying error count is announced when validation fails
    - **Property 9: Screen Reader Mode Announcement**
    - **Property 10: Screen Reader Error Announcement**
    - **Validates: Requirements 6.1, 6.2**

  - [ ] 7.2 Add live region for screen reader announcements to make tests pass
    - Create hidden live region element in shadow DOM constructor
    - Add `announce(message)` private method
    - Call announce when entering/exiting edit mode
    - Call announce when validation errors change
    - _Requirements: 6.1, 6.2_

  - [ ] 7.3 Write failing tests for modal focus trapping
    - Write test verifying Tab cycles through modal focusable elements
    - Write test verifying Shift+Tab cycles backwards
    - Write test verifying focus doesn't leave modal
    - **Property 11: Modal Focus Trapping**
    - **Validates: Requirements 6.3**

  - [ ] 7.4 Implement focus trapping for modal to make tests pass
    - Get all focusable elements within modal
    - Handle Tab key to cycle through focusable elements
    - Handle Shift+Tab for reverse cycling
    - _Requirements: 6.3_

  - [ ] 7.5 Write failing tests for focus restoration
    - Write test verifying focus returns to trigger element when modal closes
    - Write test verifying focus returns to toggle button after save
    - Write test verifying focus returns to toggle button after cancel
    - **Property 12: Modal Focus Restoration**
    - **Validates: Requirements 6.4**

  - [ ] 7.6 Implement focus restoration on modal close to make tests pass
    - Store reference to trigger element when modal opens
    - Restore focus to trigger element when modal closes
    - _Requirements: 6.4_

  - [ ] 7.7 Write failing tests for keyboard shortcuts
    - Write test verifying Escape key cancels edit mode
    - Write test verifying Escape key restores original data
    - Write test verifying Enter key saves when not in textarea
    - Write test verifying Enter key doesn't save when in textarea
    - **Property 13: Escape Key Cancels Edit**
    - **Property 14: Enter Key Saves Edit**
    - **Validates: Requirements 6.5, 6.6**

  - [ ] 7.8 Implement keyboard shortcuts to make tests pass
    - Add Escape key handler to cancel edit mode
    - Add Enter key handler to save (when not in textarea)
    - Attach handlers to edit wrapper elements
    - _Requirements: 6.5, 6.6_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement render debouncing
  - [ ] 9.1 Write failing tests for render debouncing
    - Create test file `tests/ck-editable-array/performance-debounce.test.ts`
    - Write test verifying multiple rapid data changes result in single render
    - Write test verifying debounce window is respected
    - **Property 15: Render Debouncing**
    - **Validates: Requirements 7.2**

  - [ ] 9.2 Add debounce mechanism for render calls to make tests pass
    - Create debounce utility or use requestAnimationFrame
    - Wrap render() calls with debounce
    - Ensure immediate render for critical updates (initial render, explicit calls)
    - _Requirements: 7.2_

- [ ] 10. Implement form association support
  - [ ] 10.1 Write failing tests for form association
    - Create test file `tests/ck-editable-array/form-association.test.ts`
    - Write test verifying formAssociated static property exists
    - Write test verifying ElementInternals is initialized
    - Write test verifying form value is reported on submission
    - Write test verifying form checkValidity returns false when component invalid
    - Write test verifying form reset restores initial data
    - Write test verifying form submission blocked when component invalid
    - **Property 16: Form Value Reporting**
    - **Property 17: Form Validation Participation**
    - **Property 18: Form Reset Restores Initial Data**
    - **Property 19: Form Submission Blocked on Invalid**
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.6**

  - [ ] 10.2 Add form association static property and ElementInternals to make tests pass
    - Add `static formAssociated = true` to class
    - Initialize ElementInternals in constructor
    - Store initial data for form reset
    - _Requirements: 8.1, 8.2_

  - [ ] 10.3 Implement form value reporting
    - Update form value when data changes via `_internals.setFormValue()`
    - Serialize data appropriately for form submission
    - _Requirements: 8.3_

  - [ ] 10.4 Implement constraint validation participation
    - Set validity state based on validation result via `_internals.setValidity()`
    - Report validation message to form
    - _Requirements: 8.4_

  - [ ] 10.5 Implement formResetCallback
    - Restore data to initial state
    - Re-render component
    - _Requirements: 8.5_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement enhanced event system
  - [ ] 12.1 Write failing tests for row events
    - Create test file `tests/ck-editable-array/events-enhanced.test.ts`
    - Write test verifying `rowadded` event is dispatched with correct detail
    - Write test verifying `rowdeleted` event is dispatched with correct detail
    - Write test verifying `rowrestored` event is dispatched with correct detail
    - Write test verifying `validationchange` event is dispatched with correct detail
    - Write test verifying all events have bubbles:true and composed:true
    - **Property 20: RowAdded Event Dispatch**
    - **Property 21: RowDeleted Event Dispatch**
    - **Property 22: RowRestored Event Dispatch**
    - **Property 23: ValidationChange Event Dispatch**
    - **Property 24: Events Cross Shadow DOM**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

  - [ ] 12.2 Add rowadded event dispatch to make tests pass
    - Dispatch event in handleAddClick after data update
    - Include row data and index in detail
    - Ensure bubbles and composed are true
    - _Requirements: 9.1, 9.5_

  - [ ] 12.3 Add rowdeleted event dispatch
    - Dispatch event in handleDeleteClick after data update
    - Include deleted row data and index in detail
    - _Requirements: 9.2, 9.5_

  - [ ] 12.4 Add rowrestored event dispatch
    - Dispatch event in handleRestoreClick after data update
    - Include restored row data and index in detail
    - _Requirements: 9.3, 9.5_

  - [ ] 12.5 Add validationchange event dispatch
    - Dispatch event when validation state changes
    - Include validation result and row index in detail
    - _Requirements: 9.4, 9.5_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement Serializer module
  - [ ] 14.1 Write failing tests for Serializer
    - Create test file `tests/ck-editable-array/serializer.test.ts`
    - Write test verifying toJSON excludes internal markers
    - Write test verifying toString produces formatted output
    - Write test verifying round-trip consistency (serialize then parse equals original)
    - Write test verifying includeDeleted option excludes deleted rows
    - Write test verifying pretty option formats output
    - **Property 25: Serialization Excludes Internal Markers**
    - **Property 26: Serialization Round-Trip Consistency**
    - **Property 27: Serialization Options Support**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

  - [ ] 14.2 Create Serializer class to make tests pass
    - Create `src/components/ck-editable-array/serializer.ts`
    - Implement `cleanRow(row)` method to strip internal markers
    - Implement `toJSON(data, options)` method
    - Implement `toString(data, options)` method
    - Implement `parse(json)` method
    - Define SerializerOptions interface
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [ ] 14.3 Add toJSON() and toString() methods to CkEditableArray
    - Delegate to Serializer module
    - Expose as public API
    - _Requirements: 10.1, 10.2_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement SSR and Declarative Shadow DOM compatibility
  - [ ] 16.1 Write failing tests for SSR compatibility
    - Create test file `tests/ck-editable-array/ssr-compatibility.test.ts`
    - Write test verifying existing shadowRoot is reused
    - Write test verifying no error when shadowRoot already exists
    - Write test verifying hydration preserves server-rendered content
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ] 16.2 Update constructor to detect existing shadowRoot to make tests pass
    - Check if shadowRoot already exists before attachShadow
    - Reuse existing shadowRoot if present
    - _Requirements: 3.1, 3.3_

  - [ ] 16.3 Implement hydration logic
    - Detect server-rendered content
    - Attach behavior without re-rendering structure
    - Reconcile server state with client data
    - _Requirements: 3.2, 3.5_

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run linter: `npm run lint`
  - Run formatter: `npm run format`
  - Manually test with demo files to verify visual behavior
