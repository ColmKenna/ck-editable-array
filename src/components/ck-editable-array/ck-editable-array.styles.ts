export const ckEditableArrayCSS = `
:host {
  display: block;
  padding: 1rem;
  font-family: Arial, sans-serif;
}

.ck-editable-array {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.ck-editable-array:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.message {
  font-size: 1.5rem;
  margin: 0;
  /* per-instance color via CSS custom property */
  color: var(--cea-color, #333);
}

.subtitle {
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.8;
}

.display {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
}

.empty-state {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
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
