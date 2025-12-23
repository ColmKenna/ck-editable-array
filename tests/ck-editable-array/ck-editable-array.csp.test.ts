import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Mock the styles module to force fallback logic
jest.mock(
  '../../src/components/ck-editable-array/ck-editable-array.styles',
  () => ({
    ckEditableArraySheet: null, // Force null to trigger fallback <style> injection
    ckEditableArrayCSS: ':host { display: block; }',
  })
);

describe('CkEditableArray CSP Support', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Re-register component if needed (usually handled globally, but here we want fresh instances)
    if (!customElements.get('ck-editable-array')) {
      customElements.define('ck-editable-array', CkEditableArray);
    }

    // Create element with csp-nonce
    element = document.createElement('ck-editable-array') as CkEditableArray;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should apply csp-nonce to injected fallback style', () => {
    const nonce = 'test-nonce-123';
    element.setAttribute('csp-nonce', nonce);
    document.body.appendChild(element);

    // Give it a tick to render
    // render happens in connectedCallback now

    const styleEl = element.shadowRoot?.querySelector(
      'style[data-ck-editable-array-fallback]'
    );

    expect(styleEl).toBeTruthy();
    expect(styleEl?.getAttribute('nonce')).toBe(nonce);
  });

  it('should not inject fallback style if disable-style-fallback attribute is present', () => {
    element.setAttribute('disable-style-fallback', '');
    document.body.appendChild(element);

    const styleEl = element.shadowRoot?.querySelector(
      'style[data-ck-editable-array-fallback]'
    );
    expect(styleEl).toBeNull();
  });

});
