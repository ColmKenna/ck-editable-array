# Week 4: Enhancements & Polish

**Goal**: Improve the component's production readiness by adding internationalization support, better focus management, and comprehensive browser support documentation.

## Planned Tasks

### 1. Internationalization (i18n) Support
- **Objective**: Allow consumers to customize validation error messages.
- **Implementation**:
  - Add `i18n` property to `CkEditableArray`.
  - Update `validateRowDetailed` to use these messages.
  - Default to English if no custom message is provided.
- **Tests**: Verify custom messages appear in error display.

### 2. Focus Management
- **Objective**: Improve keyboard usability.
- **Implementation**:
  - Auto-focus the first input when entering edit mode.
  - Return focus to the "Edit" button when cancelling/saving.
- **Tests**: Verify `document.activeElement` after mode transitions.

### 3. Browser Support Documentation
- **Objective**: Clearly state supported browsers and required polyfills.
- **Implementation**: Update `README.md` with a compatibility matrix.

## Schedule
- **Day 1**: i18n Implementation (TDD)
- **Day 2**: Focus Management (TDD)
- **Day 3**: Documentation & Final Polish
