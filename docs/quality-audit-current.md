# Quality Audit (Current)

| Category | Status | Notes | Gaps & Impact | Recommendations |
|----------|--------|-------|---------------|-----------------|
| Accessibility | Partial | ARIA attributes (`aria-invalid`, `aria-describedby`, `aria-disabled`) present. Uses `inert` for locked rows. Error summary depends on template for `role="alert"`. | Missing built‑in live region role on error summary wrapper; keyboard focus management between rows not enforced; radio group naming relies on consumer. Impact: Medium. | Add default `role="alert" aria-live="polite"` to any `[data-error-summary]` element if attributes absent; manage focus on entering edit mode; provide example for radio inputs with grouped names; consider roving tabindex if many interactive controls. |
| Internationalization | Missing | No locale/date formatting; validation/error messages hard-coded English. | Static English strings restrict global usage. Impact: Medium. | Expose formatter callbacks (e.g. `formatValue(field, value)`); allow overriding error messages; document i18n integration strategy. |
| Security | Partial | Uses `textContent` (safe). No direct HTML injection. Accepts arbitrary object data from user. | No sanitization helpers for content inserted into custom button templates; relies on consumer discipline. Impact: Low. | Document that templates should avoid unsanitized HTML; optionally offer hook `sanitize(field, value)` before binding. |
| Performance | Partial | Incremental updates for field edits; full re-render on add/save/delete/restore. | Large datasets could cause performance drops due to full re-render. Impact: Medium for >200 rows. | Add virtual row rendering / windowing; batch DOM updates via `requestAnimationFrame`; optional `renderStrategy` property. |
| Theming | Partial | Provides parts (`root`, `rows`, `add-button`) & style slot. | No CSS custom properties published for consistent theming; limited parts (no part for individual row wrappers). Impact: Low. | Add parts for row display/edit wrappers; publish CSS vars for spacing, colors; doc theming tokens. |
| Browser Support | Partial | Relies on `inert` (not fully supported everywhere without polyfill). | Missing guidance for `inert` polyfill and fallback. Impact: Low/Medium depending on target. | Document polyfill inclusion; degrade by using `aria-disabled` + pointer events none when inert unsupported. |
| Testing | Partial | Extensive step-based functional tests + accessibility/security; new performance/visual harness placeholders added. | Missing automated visual and large dataset stress tests. Impact: Medium. | Integrate snapshot or image diff tool; add test generating 1000 rows measuring render time; add keyboard navigation tests. |

## Strengths
- Clear separation of display/edit templates.
- Support for primitive and object rows, including nested paths.
- Schema-like validation with real-time feedback and ARIA indicators.
- Soft delete + restore lifecycle with explicit events.
- Exclusive edit locking prevents conflicting changes.

## Key Gaps Summary
1. Accessibility: focus management + implicit live region support.
2. Internationalization: fixed English error strings & no formatting hooks.
3. Performance: full re-render scaling concerns.
4. Theming: limited parts & no CSS custom properties.
5. Testing: no automated visual/stress/keyboard coverage.

---

## Enhancement Prompt
See `enhance-web-component-quality.prompt.md` for a ready-to-use follow-up.
