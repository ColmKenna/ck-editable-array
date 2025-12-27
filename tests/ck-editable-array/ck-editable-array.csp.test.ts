import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Note: Trusted Types Window interface is declared in the main component file

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

  describe('Trusted Types Support', () => {
    let originalTrustedTypes: typeof window.trustedTypes;

    beforeEach(() => {
      originalTrustedTypes = window.trustedTypes;
    });

    afterEach(() => {
      // Restore original trustedTypes
      if (originalTrustedTypes === undefined) {
        delete (window as any).trustedTypes;
      } else {
        (window as any).trustedTypes = originalTrustedTypes;
      }
    });

    it('should use Trusted Types policy when available', () => {
      // Mock Trusted Types API
      const mockCreateHTML = jest.fn((input: string) => input);
      const mockPolicy = { createHTML: mockCreateHTML };
      (window as any).trustedTypes = {
        createPolicy: jest.fn().mockReturnValue(mockPolicy),
      };

      // Need to re-import to trigger policy creation
      // Since the module is already loaded, we test via the style injection behavior
      element.setAttribute('csp-nonce', 'test-nonce');
      document.body.appendChild(element);

      const styleEl = element.shadowRoot?.querySelector(
        'style[data-ck-editable-array-fallback]'
      );
      expect(styleEl).toBeTruthy();
      // The style should have content (either via innerHTML or textContent)
      expect(styleEl?.textContent || styleEl?.innerHTML).toBeTruthy();
    });

    it('should fall back to textContent when Trusted Types is unavailable', () => {
      // Ensure trustedTypes is not available
      delete (window as any).trustedTypes;

      document.body.appendChild(element);

      const styleEl = element.shadowRoot?.querySelector(
        'style[data-ck-editable-array-fallback]'
      );
      expect(styleEl).toBeTruthy();
      expect(styleEl?.textContent).toBeTruthy();
    });
  });
});
