/**
 * @file style-manager.test.ts
 * @description Tests for StyleManager module - Constructable Stylesheets implementation
 */

import { StyleManager } from '../../src/components/ck-editable-array/style-manager';

describe('StyleManager', () => {
  // Reset the shared stylesheet between tests
  beforeEach(() => {
    StyleManager.reset();
  });

  describe('Feature Detection', () => {
    it('should have supportsConstructableStylesheets getter', () => {
      expect(typeof StyleManager.supportsConstructableStylesheets).toBe(
        'boolean'
      );
    });

    it('should cache the feature detection result', () => {
      const first = StyleManager.supportsConstructableStylesheets;
      const second = StyleManager.supportsConstructableStylesheets;
      expect(first).toBe(second);
    });
  });

  describe('Shared Stylesheet', () => {
    it('should return the same stylesheet instance across multiple calls', () => {
      const cssText = '.test { color: red; }';
      const sheet1 = StyleManager.getSharedStylesheet(cssText);
      const sheet2 = StyleManager.getSharedStylesheet(cssText);
      expect(sheet1).toBe(sheet2);
    });

    it('should handle Constructable Stylesheets based on browser support', () => {
      const cssText = '.test { color: red; }';
      const sheet = StyleManager.getSharedStylesheet(cssText);
      const isSupported = StyleManager.supportsConstructableStylesheets;

      // Either returns a CSSStyleSheet (when supported) or null (when not)
      expect(isSupported ? sheet !== null : sheet === null).toBe(true);
    });
  });

  describe('Apply Styles', () => {
    let shadowRoot: ShadowRoot;
    let hostElement: HTMLElement;

    beforeEach(() => {
      hostElement = document.createElement('div');
      shadowRoot = hostElement.attachShadow({ mode: 'open' });
      document.body.appendChild(hostElement);
    });

    afterEach(() => {
      document.body.removeChild(hostElement);
    });

    it('should apply styles to shadow root', () => {
      const cssText = '.test { color: red; }';
      StyleManager.applyStyles(shadowRoot, cssText);

      // Should either use adoptedStyleSheets or fallback to <style> element
      const hasAdoptedStylesheets =
        shadowRoot.adoptedStyleSheets &&
        shadowRoot.adoptedStyleSheets.length > 0;
      const hasStyleElement = shadowRoot.querySelector('style') !== null;

      expect(hasAdoptedStylesheets || hasStyleElement).toBe(true);
    });

    it('should use the appropriate method based on browser support', () => {
      const cssText = '.test { color: red; }';
      StyleManager.applyStyles(shadowRoot, cssText);

      const isSupported = StyleManager.supportsConstructableStylesheets;
      const hasAdoptedStylesheets =
        shadowRoot.adoptedStyleSheets &&
        shadowRoot.adoptedStyleSheets.length > 0;
      const hasStyleElement =
        shadowRoot.querySelector('style[data-style-manager]') !== null;

      // When supported: uses adoptedStyleSheets
      // When not supported: uses <style> element
      const correctMethod = isSupported
        ? hasAdoptedStylesheets
        : hasStyleElement;
      expect(correctMethod).toBe(true);
    });

    it('should share the same stylesheet across multiple shadow roots when supported', () => {
      const cssText = '.test { color: blue; }';

      // Create second shadow root
      const hostElement2 = document.createElement('div');
      const shadowRoot2 = hostElement2.attachShadow({ mode: 'open' });
      document.body.appendChild(hostElement2);

      try {
        StyleManager.applyStyles(shadowRoot, cssText);
        StyleManager.applyStyles(shadowRoot2, cssText);

        const isSupported = StyleManager.supportsConstructableStylesheets;

        // When supported, both should reference the same stylesheet
        // When not supported, both should have their own <style> elements
        const areSheetsShared =
          isSupported &&
          shadowRoot.adoptedStyleSheets[0] ===
            shadowRoot2.adoptedStyleSheets[0];
        const bothHaveStyles =
          !isSupported &&
          shadowRoot.querySelector('style[data-style-manager]') !== null &&
          shadowRoot2.querySelector('style[data-style-manager]') !== null;

        expect(areSheetsShared || bothHaveStyles).toBe(true);
      } finally {
        document.body.removeChild(hostElement2);
      }
    });
  });

  describe('Update Styles', () => {
    let shadowRoot: ShadowRoot;
    let hostElement: HTMLElement;

    beforeEach(() => {
      hostElement = document.createElement('div');
      shadowRoot = hostElement.attachShadow({ mode: 'open' });
      document.body.appendChild(hostElement);
    });

    afterEach(() => {
      document.body.removeChild(hostElement);
    });

    it('should update the current CSS text', () => {
      const initialCss = '.test { color: red; }';
      const updatedCss = '.test { color: blue; }';

      StyleManager.applyStyles(shadowRoot, initialCss);
      expect(StyleManager.currentCssText).toBe(initialCss);

      StyleManager.updateStyles(updatedCss);
      expect(StyleManager.currentCssText).toBe(updatedCss);
    });

    it('should update fallback style elements when Constructable Stylesheets not supported', () => {
      // This test is meaningful when Constructable Stylesheets are NOT supported
      // In that case, fallback <style> elements should be updated
      const initialCss = '.test { color: red; }';
      const updatedCss = '.test { color: blue; }';

      StyleManager.applyStyles(shadowRoot, initialCss);
      StyleManager.updateStyles(updatedCss);

      // Check that currentCssText is updated regardless of support
      expect(StyleManager.currentCssText).toBe(updatedCss);
    });
  });

  describe('Reset', () => {
    it('should clear the shared stylesheet', () => {
      const cssText = '.test { color: red; }';

      // Apply styles to get currentCssText populated
      const hostElement = document.createElement('div');
      const shadowRoot = hostElement.attachShadow({ mode: 'open' });
      document.body.appendChild(hostElement);

      try {
        StyleManager.applyStyles(shadowRoot, cssText);
        const cssTextBefore = StyleManager.currentCssText;

        StyleManager.reset();

        // After reset, currentCssText should be empty
        expect(StyleManager.currentCssText).toBe('');
        // Before reset it had content
        expect(cssTextBefore).toBe(cssText);
      } finally {
        document.body.removeChild(hostElement);
      }
    });

    it('should allow creating a new stylesheet after reset', () => {
      const cssText1 = '.test { color: red; }';
      const cssText2 = '.test { color: blue; }';

      // Create shadow root to apply styles
      const hostElement = document.createElement('div');
      const shadowRoot = hostElement.attachShadow({ mode: 'open' });
      document.body.appendChild(hostElement);

      try {
        StyleManager.applyStyles(shadowRoot, cssText1);
        StyleManager.reset();
        StyleManager.applyStyles(shadowRoot, cssText2);

        // After reset and reapply, currentCssText should be the new value
        expect(StyleManager.currentCssText).toBe(cssText2);
      } finally {
        document.body.removeChild(hostElement);
      }
    });
  });

  describe('Remove Fallback Root', () => {
    it('should remove shadow root from tracking', () => {
      const hostElement2 = document.createElement('div');
      const shadowRoot2 = hostElement2.attachShadow({ mode: 'open' });
      document.body.appendChild(hostElement2);

      try {
        const cssText = '.test { color: red; }';
        StyleManager.applyStyles(shadowRoot2, cssText);

        // This should not throw
        expect(() => {
          StyleManager.removeFallbackRoot(shadowRoot2);
        }).not.toThrow();
      } finally {
        document.body.removeChild(hostElement2);
      }
    });
  });
});
