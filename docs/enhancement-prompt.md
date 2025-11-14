# Enhancement Prompt: ck-editable-array Quality Improvements

## Context

The `ck-editable-array` web component has been audited and found to be production-ready with excellent accessibility, security, and testing. However, several quality gaps have been identified that would improve internationalization, browser compatibility, and user experience.

## Current State

**Component Location**: `src/components/ck-editable-array/ck-editable-array.ts`

**Quality Audit**: See `docs/quality-audit.md` for full analysis

**Test Coverage**: 95% (8 test suites, 100+ tests)

**Documentation**: Comprehensive (README, technical docs, spec, migration guide)

---

## Identified Gaps

### 1. Internationalization (i18n) Support - HIGH PRIORITY

**Gap**: Error messages are hardcoded in English

**Current Code** (lines ~1050-1070 in `validateRowDetailed` method):
```typescript
errors[field].push(`${field} is required`);
errors[field].push(`${field} must be at least ${prop.minLength} characters`);
```

**Desired Enhancement**:
- Add `i18n` property to component for custom error message templates
- Support function-based message generation for dynamic values
- Maintain backward compatibility (default to English messages)

**Proposed API**:
```typescript
interface I18nMessages {
  required?: (field: string) => string;
  minLength?: (field: string, min: number) => string;
}

// Usage:
el.i18n = {
  required: (field) => `Le champ ${field} est requis`,
  minLength: (field, min) => `${field} doit contenir au moins ${min} caractères`
};
```

**Implementation Requirements**:
- Add `_i18n` private property with default English messages
- Add `i18n` getter/setter with validation
- Update `validateRowDetailed()` to use i18n messages
- Add tests for custom i18n messages
- Document in README.md with examples

**Test Cases to Add**:
```typescript
test('Custom i18n messages are used for validation errors', () => {
  el.i18n = {
    required: (field) => `${field} is mandatory`,
    minLength: (field, min) => `${field} needs ${min}+ chars`
  };
  // Verify custom messages appear in error display
});

test('Default English messages are used when i18n not set', () => {
  // Verify default messages
});

test('Invalid i18n property is rejected gracefully', () => {
  el.i18n = 'invalid';
  // Should fall back to defaults
});
```

---

### 2. Focus Management Enhancement - MEDIUM PRIORITY

**Gap**: No automatic focus management when toggling edit mode

**Current Behavior**: User must manually click into first input after clicking "Edit"

**Desired Enhancement**:
- Auto-focus first input when entering edit mode
- Restore focus to toggle button when exiting edit mode
- Respect user's focus preferences (don't force focus if user has already focused elsewhere)

**Implementation Location**: `handleToggleClick()` method and `aftertogglemode` event

**Proposed Implementation**:
```typescript
private handleToggleClick(rowIndex: number): void {
  // ... existing code ...

  // After successful toggle to edit mode
  if (toMode === 'edit') {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const editWrapper = this.shadowRoot?.querySelector(
        `.edit-content[data-row="${rowIndex}"]`
      );
      const firstInput = editWrapper?.querySelector('input, textarea') as HTMLElement;
      firstInput?.focus();
    });
  }
}
```

**Test Cases to Add**:
```typescript
test('First input is focused when entering edit mode', async () => {
  // Click toggle button
  // Verify first input has focus
});

test('Toggle button receives focus when exiting edit mode', async () => {
  // Click toggle to exit edit mode
  // Verify toggle button has focus
});
```

---

### 3. Browser Compatibility Documentation - HIGH PRIORITY

**Gap**: No documented browser support matrix or polyfill requirements

**Desired Enhancement**:
- Add browser support matrix to README.md
- Document required polyfills for older browsers
- Add polyfill setup instructions
- Create example HTML with polyfills

**Implementation Requirements**:
- Update README.md with "Browser Support" section
- Create `examples/demo-polyfills.html` with polyfill setup
- Document minimum browser versions
- List required polyfills with CDN links

**Content to Add to README.md**:
```markdown
## Browser Support

### Supported Browsers (No Polyfills Required)

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Edge | 90+ |
| Firefox | 90+ |
| Safari | 15+ |

### Older Browser Support (Requires Polyfills)

For IE11 and older browsers, include these polyfills:

\`\`\`html
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"></script>
<script src="https://unpkg.com/wicg-inert@3.1.2/dist/inert.min.js"></script>
\`\`\`

See [Migration Guide](./docs/migration-guide.md#polyfills) for details.
```

---

### 4. Visual Regression Testing - MEDIUM PRIORITY

**Gap**: No visual regression tests to catch styling issues

**Desired Enhancement**:
- Set up Playwright for screenshot testing
- Create baseline images for key component states
- Add visual regression tests to CI pipeline

**Test Cases to Add**:
```typescript
// tests/ck-editable-array/ck-editable-array.visual.test.ts
import { test, expect } from '@playwright/test';

test('Display mode renders correctly', async ({ page }) => {
  await page.goto('/examples/demo-ac1.html');
  await page.waitForSelector('ck-editable-array');
  await expect(page).toHaveScreenshot('display-mode.png');
});

test('Edit mode renders correctly', async ({ page }) => {
  await page.goto('/examples/demo-ac1.html');
  await page.click('[data-action="toggle"]');
  await expect(page).toHaveScreenshot('edit-mode.png');
});

test('Validation errors render correctly', async ({ page }) => {
  await page.goto('/examples/demo-validation.html');
  await page.click('[data-action="toggle"]');
  await expect(page).toHaveScreenshot('validation-errors.png');
});

test('Deleted row renders correctly', async ({ page }) => {
  await page.goto('/examples/demo-ac1.html');
  await page.click('[data-action="delete"]');
  await expect(page).toHaveScreenshot('deleted-row.png');
});
```

**Setup Requirements**:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Playwright Config** (`playwright.config.ts`):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run serve',
    port: 8080,
  },
});
```

---

### 5. Error Handling for Circular References - LOW PRIORITY

**Gap**: JSON.parse/stringify throws on circular references

**Current Code** (in `cloneRow` method):
```typescript
return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
```

**Desired Enhancement**:
- Add try-catch with fallback to shallow copy
- Log warning when circular reference detected
- Maintain immutability guarantees

**Proposed Implementation**:
```typescript
private cloneRow(row: unknown): EditableRow {
  if (typeof row === 'string') {
    return row;
  }
  if (typeof row === 'number' || typeof row === 'boolean') {
    return String(row);
  }
  if (row && typeof row === 'object' && !Array.isArray(row)) {
    try {
      return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
    } catch (e) {
      console.warn('ck-editable-array: Failed to deep clone row (circular reference?), using shallow copy', e);
      return { ...row as Record<string, unknown> };
    }
  }
  return '';
}
```

**Test Cases to Add**:
```typescript
test('Circular references are handled gracefully', () => {
  const circular: any = { name: 'Alice' };
  circular.self = circular;
  
  expect(() => {
    el.data = [circular];
  }).not.toThrow();
  
  // Should use shallow copy fallback
  expect(el.data[0].name).toBe('Alice');
});
```

---

### 6. CSS Custom Properties for Theming - LOW PRIORITY

**Gap**: No CSS variables for common theme values

**Desired Enhancement**:
- Add CSS custom properties for colors, spacing, borders
- Document theming best practices
- Maintain backward compatibility

**Proposed CSS Variables**:
```css
:host {
  --ck-row-padding: 12px;
  --ck-error-color: #dc3545;
  --ck-border-radius: 4px;
  --ck-border-color: #ddd;
  --ck-focus-color: #0066cc;
  --ck-disabled-opacity: 0.5;
}
```

**Implementation Requirements**:
- Add CSS variables to component's shadow styles
- Use variables in existing styles
- Document in README.md with examples
- Provide example of custom theme

---

## Implementation Priority

### Phase 1 (High Priority - Implement First)
1. ✅ Internationalization (i18n) support
2. ✅ Browser compatibility documentation

### Phase 2 (Medium Priority - Implement Next)
3. ✅ Focus management enhancement
4. ✅ Visual regression testing setup

### Phase 3 (Low Priority - Nice to Have)
5. ✅ Error handling for circular references
6. ✅ CSS custom properties for theming

---

## Success Criteria

### For i18n Support:
- ✅ `i18n` property accepts custom message functions
- ✅ Default English messages maintained
- ✅ All validation errors use i18n messages
- ✅ Tests verify custom messages work
- ✅ Documentation includes i18n examples

### For Focus Management:
- ✅ First input auto-focused on edit mode entry
- ✅ Focus restored to toggle button on edit mode exit
- ✅ Tests verify focus behavior
- ✅ No focus issues with keyboard navigation

### For Browser Compatibility:
- ✅ README includes browser support matrix
- ✅ Polyfill requirements documented
- ✅ Example with polyfills created
- ✅ Migration guide updated

### For Visual Regression:
- ✅ Playwright configured and working
- ✅ Baseline screenshots captured
- ✅ Tests pass on CI
- ✅ Documentation explains how to update baselines

---

## Files to Modify

### For i18n Support:
- `src/components/ck-editable-array/ck-editable-array.ts` (add i18n property and update validation)
- `tests/ck-editable-array/ck-editable-array.validation.test.ts` (add i18n tests)
- `docs/README.md` (document i18n API)
- `examples/demo-validation.html` (add i18n example)

### For Focus Management:
- `src/components/ck-editable-array/ck-editable-array.ts` (update handleToggleClick)
- `tests/ck-editable-array/ck-editable-array.accessibility.test.ts` (add focus tests)

### For Browser Compatibility:
- `docs/README.md` (add browser support section)
- `docs/migration-guide.md` (already updated)
- `examples/demo-polyfills.html` (create new file)

### For Visual Regression:
- `tests/ck-editable-array/ck-editable-array.visual.test.ts` (create new file)
- `playwright.config.ts` (create new file)
- `package.json` (add Playwright dependency)

---

## Testing Checklist

After implementing enhancements:

- [ ] All existing tests still pass
- [ ] New tests added for each enhancement
- [ ] Manual testing in Chrome, Firefox, Safari
- [ ] Manual testing with screen reader (NVDA/JAWS)
- [ ] Manual testing with keyboard-only navigation
- [ ] Visual regression tests pass
- [ ] Documentation updated
- [ ] Examples updated

---

## Ready to Implement

This prompt provides all the context needed to implement the identified enhancements. Each section includes:
- Current code location
- Desired behavior
- Proposed implementation
- Test cases
- Success criteria

Start with Phase 1 (high priority) items and work through the phases sequentially.
