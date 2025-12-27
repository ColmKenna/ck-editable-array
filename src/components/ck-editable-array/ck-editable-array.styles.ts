export const ckEditableArrayCSS = `
:host {
  display: block;
}

.ck-editable-array {
  background: var(--cea-background, transparent);
  color: var(--cea-color, inherit);
  padding: var(--cea-padding, 0);
  border-radius: var(--cea-border-radius, 0);
}

.message {
  font-size: 1.5rem;
  margin: 0;
  color: var(--cea-message-color, inherit);
}

.subtitle {
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
}

.rows {
  margin-top: 1.25rem;
}

.row {
  padding: 0.75rem;
  border-radius: var(--cea-row-border-radius, 0.25rem);
  transition: background-color 0.15s ease;
}

.row:focus-visible {
  outline: 2px solid var(--cea-focus-color, #4a90e2);
  outline-offset: 2px;
  background-color: var(--cea-focus-background, rgba(74, 144, 226, 0.1));
}

.row + .row {
  margin-top: 0.75rem;
}

.empty-state {
  margin: 0;
  font-size: 0.95rem;
}

.ck-hidden {
  display: none !important;
}

.ck-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border-width: 0;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .row {
    transition: none !important;
  }

  .ck-animating {
    transition: none !important;
    transform: none !important;
  }
}
`;

// Try to create a constructable stylesheet where supported. Fall back to null.
export const ckEditableArraySheet: CSSStyleSheet | null = (() => {
  try {
    // CSSStyleSheet may not be available in older browsers
    // create and populate the sheet once at module-eval time
    // so it gets parsed only once.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: may not exist in all targets
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(ckEditableArrayCSS);
    return sheet;
  } catch {
    return null;
  }
})();
