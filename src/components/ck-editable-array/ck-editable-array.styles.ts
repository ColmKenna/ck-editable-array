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
}

.row + .row {
  margin-top: 0.75rem;
}

.empty-state {
  margin: 0;
  font-size: 0.95rem;
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
