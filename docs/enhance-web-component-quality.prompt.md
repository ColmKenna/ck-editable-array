```markdown
# Enhance Web Component Quality
Target: `src/components/ck-editable-array/ck-editable-array.ts`
Related Examples: `examples/demo-comprehensive.html`, `examples/demo-simple-strings.html`, `examples/demo-advanced-inputs.html`
Related Tests: existing step tests + new simple/performance tests.

## Current Gaps (From Quality Audit)
1. Accessibility (Partial): Missing guaranteed live region attributes; no focus management on mode change; radio groups require manual naming.
2. Internationalization (Missing): Error messages hard-coded English; no formatting hooks for dates/strings.
3. Performance (Partial): Full re-render on structural actions (add/save/delete/restore). Risk for large data sets.
4. Theming (Partial): Limited CSS parts (no part for row wrappers) & no published CSS custom properties.
5. Testing (Partial): No large dataset stress test; no keyboard navigation; no real visual regression.
6. Browser Support (Partial): `inert` usage without documented polyfill fallback.

## Goals
- Add optional built-in accessibility improvements (focus movement & live region defaults).
- Introduce i18n customization hooks: `errorMessageFactory(field, type, context)` & `formatDisplay(field, value)`.
- Optimize rendering: add `renderStrategy` ('full' | 'row-diff') + targeted row updates on add/delete/restore.
- Expand theming: expose parts `row-display` & `row-edit`; add CSS vars: `--cea-row-gap`, `--cea-border-radius`, `--cea-color-invalid`.
- Provide helper polyfill guidance for `inert` or fallback behavior.
- Strengthen tests: add keyboard navigation tests, stress test (1000 rows), visual snapshot harness placeholder replaced with real solution.

## Implementation Guidance
### Accessibility
- On entering edit mode (aftertogglemode where mode === 'edit'), focus the first editable input in that row.
- When adding a new row, automatically scroll row into view (optional, guard with attribute `auto-scroll`).
- Inject `role="alert" aria-live="polite"` if `[data-error-summary]` found lacking both attributes.

### Internationalization Hooks
Add two new optional properties:
```ts
get errorMessageFactory(): ((field: string, type: string, ctx?: unknown) => string) | null
set errorMessageFactory(fn: unknown)
get formatDisplay(): ((field: string, value: unknown) => string) | null
set formatDisplay(fn: unknown)
```
Usage in validation & resolveBindingValue:
- Replace fixed strings with factory fallback.
- When binding non-input display elements, if `formatDisplay` defined pass `(key, value)` before setting textContent.

### Performance Rendering Strategy
- New attribute `render-strategy` mapped to property `renderStrategy`.
- If strategy === 'row-diff', avoid clearing the entire rows container; instead insert/remove/update only impacted row wrappers.
- Maintain helper: `rerenderRow(index)` to refresh single row (both display & edit wrappers).

### Theming
- Add `part` attributes on wrapper creation: display wrapper `part="row-display"`, edit wrapper `part="row-edit"`.
- In constructor or style injection, publish CSS variables with default values:
```css
:host { --cea-row-gap: 8px; --cea-border-radius: 6px; --cea-color-invalid: #e53e3e; }
```
- Apply `var(--cea-color-invalid)` for invalid borders.

### Browser Support Fallback
- Detect support: `if (!('inert' in HTMLElement.prototype))` – fallback by adding `tabindex="-1" aria-disabled="true"` and pointer-events none on locked rows.

### Testing Additions
Create new test files:
- `ck-editable-array.keyboard.test.ts`: Simulate Tab / Enter flows ensuring focus moves to first input on edit.
- `ck-editable-array.stress.test.ts`: Generate 1000 rows, measure render time (< 250ms jsdom baseline) and memory stability (approximate by counting DOM nodes).
- Replace visual placeholder with jest-image-snapshot harness capturing baseline after initial render (limit to small dataset for stability).

## Acceptance Criteria
- All existing tests + new tests pass.
- No breaking changes to current public attributes/properties/events.
- Optional new features only activate when properties/functions provided or attributes set.
- README updated to document new properties & theming tokens.

## Deliverables
1. Source updates implementing hooks & strategy.
2. Updated documentation (`docs/README.md` sections for i18n, performance strategies, theming vars).
3. New tests (keyboard, stress, visual).
4. Polyfill guidance comment block in README.

Proceed with small, focused commits. Validate each new feature with tests before moving to the next.
```