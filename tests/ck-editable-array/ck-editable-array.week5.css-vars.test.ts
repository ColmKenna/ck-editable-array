/**
 * Week 5: CSS Custom Properties for Theming Tests
 * TDD - Tests for CSS variable-based theming support
 */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Ensure component is registered
void CkEditableArray;

describe('ck-editable-array CSS custom properties', () => {
  let el: HTMLElement & {
    data: unknown[];
    schema?: unknown;
  };

  const createComponent = (html: string): typeof el => {
    document.body.innerHTML = html;
    return document.querySelector('ck-editable-array') as typeof el;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('CSS variable definitions', () => {
    test('should define --ck-row-padding CSS variable with default value', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      expect(shadowRoot).not.toBeNull();

      // Check that the component has the CSS variable defined
      const styles = shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('--ck-row-padding');
    });

    test('should define --ck-error-color CSS variable with default value', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      const styles = shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('--ck-error-color');
    });

    test('should define --ck-border-radius CSS variable with default value', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      const styles = shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('--ck-border-radius');
    });

    test('should define --ck-border-color CSS variable with default value', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      const styles = shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('--ck-border-color');
    });

    test('should define --ck-focus-color CSS variable with default value', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      const styles = shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('--ck-focus-color');
    });

    test('should define --ck-disabled-opacity CSS variable with default value', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      const styles = shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('--ck-disabled-opacity');
    });
  });

  describe('CSS variable usage in styles', () => {
    test('should use --ck-error-color in error-related styles', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      const styles = shadowRoot?.querySelector('style');
      // The error color should be used via var(--ck-error-color)
      expect(styles?.textContent).toContain('var(--ck-error-color');
    });

    test('should use --ck-disabled-opacity for disabled elements', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      const shadowRoot = el.shadowRoot;
      const styles = shadowRoot?.querySelector('style');
      // Disabled opacity should be used via var(--ck-disabled-opacity)
      expect(styles?.textContent).toContain('var(--ck-disabled-opacity');
    });
  });

  describe('CSS variable inheritance', () => {
    test('should allow external override of CSS variables via host', () => {
      // Add a style element to set the CSS variable on the host
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        ck-editable-array {
          --ck-error-color: #ff0000;
        }
      `;
      document.head.appendChild(styleEl);

      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      // The CSS variable should be overridable
      const computedStyle = globalThis.getComputedStyle(el as any);
      expect(computedStyle.getPropertyValue('--ck-error-color').trim()).toBe(
        '#ff0000'
      );

      // Cleanup
      document.head.removeChild(styleEl);
    });
  });
});
