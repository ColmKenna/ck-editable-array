# Week 5: Advanced Features & Robustness

**Goal**: Implement remaining enhancement items: Visual Regression Testing, Circular Reference Handling, and CSS Custom Properties for theming.

## Planned Tasks

### 1. Visual Regression Testing
- **Objective**: Create proper Playwright-based visual regression tests.
- **Current State**: Placeholder file exists at `tests/ck-editable-array/ck-editable-array.visual.test.ts`.
- **Implementation**:
  - Add Jest-based visual tests with `jest-image-snapshot` (simpler than full Playwright for this project).
  - Create baseline screenshots for display mode, edit mode, validation errors, and deleted rows.
- **Tests**: Verify visual consistency across states.

### 2. Circular Reference Handling
- **Objective**: Prevent crashes when data contains circular references.
- **Current Code**: `cloneRow` uses `JSON.parse(JSON.stringify(row))` which throws on circular refs.
- **Implementation**:
  - Add try-catch in `cloneRow` method.
  - Fall back to shallow copy on error.
  - Log warning to console.
- **Tests**: Verify component handles circular data gracefully.

### 3. CSS Custom Properties for Theming
- **Objective**: Enable easy theming via CSS variables.
- **Implementation**:
  - Add CSS custom properties to shadow DOM styles.
  - Define variables: `--ck-row-padding`, `--ck-error-color`, `--ck-border-radius`, `--ck-border-color`, `--ck-focus-color`, `--ck-disabled-opacity`.
  - Document theming in README.md.
- **Tests**: Verify CSS variables are applied and can be overridden.

## Schedule
- **Day 1**: Circular Reference Handling (TDD)
- **Day 2**: CSS Custom Properties (TDD)
- **Day 3**: Visual Regression Tests & Documentation

## Success Criteria
- [ ] `cloneRow` handles circular references without throwing
- [ ] CSS custom properties allow theming
- [ ] Visual tests capture key component states
- [ ] All 217+ existing tests still pass
- [ ] Documentation updated
