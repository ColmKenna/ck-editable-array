---
agent: Plan
---

# Prompt: Audit This TypeScript Web Component for Inefficiencies

You are an expert Web Components engineer and performance auditor. Analyze the following TypeScript Web Component in depth.

## Goal
Identify every potential pitfall, inefficiency, bug risk, or bad practice across rendering, attributes, lifecycle, event handling, TypeScript structure, Shadow DOM, accessibility, and memory management.

## Severity Definitions
- **Critical**: Causes crashes, memory leaks, security issues, or data loss.
- **Major**: Significant performance degradation, accessibility failures, or broken functionality under common conditions.
- **Minor**: Suboptimal patterns, code style issues, or edge-case bugs.
- **Clean**: No issues found in this category.

## Review Checklist

### 1. DOM Rendering & Update Inefficiencies
- Overuse of `innerHTML` or performing full re-renders.
- DOM updates not batched (use `requestAnimationFrame` or microtasks).
- Re-rendering the entire shadow DOM instead of updating specific nodes.
- Excessive `querySelector` calls instead of caching references.
- Forcing synchronous reflows (reading layout after writing).

### 2. Shadow DOM Pitfalls
- Cloning large `<style>` tags per instance instead of using `CSSStyleSheet` (constructable stylesheets).
- Over-nesting components inside multiple shadow roots.
- Inline, duplicated, or unscoped styles.
- Not exposing CSS custom properties (`--*`) for theming.

### 3. Lifecycle Issues
- Heavy work in the constructor (DOM access, attribute reads, rendering).
- Missing cleanup in `disconnectedCallback` (listeners, observers, timers, abort controllers).
- Expensive logic in `attributeChangedCallback` without debouncing.
- Not handling re-connection (`connectedCallback` called multiple times).

### 4. Attribute / Property Desync
- Boolean attributes handled incorrectly (`hasAttribute` vs. value check).
- Properties that do not reflect to attributes (or vice versa) when expected.
- Infinite update loops between property setters and `attributeChangedCallback`.
- JSON-encoded attributes for complex data (prefer properties or events).

### 5. Event Handling Problems
- Re-attaching event listeners on every render.
- `CustomEvent`s missing `bubbles: true` and `composed: true` when crossing shadow boundaries.
- Using anonymous functions that prevent listener removal.
- Firing events inside constructors instead of `connectedCallback`.

### 6. Accessibility (a11y) Issues
- Missing ARIA roles, states, or properties.
- Not implementing `ElementInternals` for form-associated elements.
- Focus management issues (no `tabindex`, focus trapping, or delegation).
- Missing keyboard navigation support.
- Screen reader announcements not working through shadow DOM.

### 7. API & Architecture Design Issues
- Component taking on too many responsibilities (violates SRP).
- Missing `<slot>`s where they would improve flexibility.
- Mutating DOM externally instead of exposing a clean property/method API.
- Internal state not encapsulated properly.
- Not using `static formAssociated = true` for form controls.

### 8. Memory & Performance Risks
- Creating templates inside the constructor instead of sharing (`static` templates).
- Too many `MutationObserver`s or `ResizeObserver`s without `disconnect()`.
- Large shadow DOM trees that could be virtualized or lazy-loaded.
- Not reusing DOM nodes (prefer hiding/showing over create/destroy).

### 9. TypeScript Problems
- Incorrect or missing types for attributes, properties, and events.
- Public fields that should be `private` or `#private`.
- Missing getters/setters for reactive state.
- Not declaring custom element in `HTMLElementTagNameMap`.
- Misuse of `#private` fields where decorator interoperability is required.

### 10. SSR & Declarative Shadow DOM
- Component not compatible with Declarative Shadow DOM (`<template shadowrootmode>`).
- Hydration mismatches when pre-rendered HTML differs from client render.
- Critical content not accessible before JavaScript loads.

### 11. Build & Structure Issues
- No tree-shaking compatibility (side effects in module scope).
- Unnecessary polyfills for well-supported APIs.
- Duplicated CSS or JS bundles across component instances.
- Missing custom element definition guard (`if (!customElements.get('my-el'))`).

---

## Deliverables

### 1. High-Level Summary
Provide a bullet list of top issues with severity:

| Severity | Count | Top Issue |
|----------|-------|-----------|
| Critical | X     | ...       |
| Major    | X     | ...       |
| Minor    | X     | ...       |

### 2. Detailed Issue List
For each issue, provide:

| # | Category | Line(s) | Severity | Issue | Recommended Fix |
|---|----------|---------|----------|-------|-----------------|
| 1 | ...      | ...     | ...      | ...   | ...             |

Include code snippets for non-trivial fixes.

### 3. Quick Wins
List 3-5 low-effort, high-impact improvements that can be applied immediately.

### 4. Refactoring Opportunities
Highlight larger improvements:
- Performance optimizations
- API/ergonomics enhancements  
- Architectural changes

Only suggest rewriting the entire component if absolutely necessary.

---

Focus on **correctness**, **performance**, **accessibility**, **maintainability**, and **memory safety**.
