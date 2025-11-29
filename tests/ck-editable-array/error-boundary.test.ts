/**
 * @file error-boundary.test.ts
 * @description Tests for Error Boundary functionality
 * TDD Tests for error handling and recovery
 */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register the custom element if not already registered
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

describe('Error Boundary', () => {
  let el: CkEditableArray;
  let consoleErrorSpy: jest.SpyInstance;

  function setup(): CkEditableArray {
    const element = document.createElement(
      'ck-editable-array'
    ) as CkEditableArray;
    element.innerHTML = `
      <template slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="delete">Delete</button>
      </template>
      <template slot="edit">
        <input data-bind="name" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
    document.body.appendChild(element);
    return element;
  }

  beforeEach(() => {
    el = setup();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(el);
    consoleErrorSpy.mockRestore();
  });

  describe('Render Error Recovery', () => {
    it('should not crash on invalid data', () => {
      expect(() => {
        (el as unknown as { data: string }).data = 'not an array';
      }).not.toThrow();
    });

    it('should recover gracefully when template is missing', () => {
      const noTemplateEl = document.createElement(
        'ck-editable-array'
      ) as CkEditableArray;
      document.body.appendChild(noTemplateEl);
      expect(() => {
        noTemplateEl.data = [{ name: 'Alice' }];
      }).not.toThrow();
      document.body.removeChild(noTemplateEl);
    });

    it('should handle undefined in data array', () => {
      expect(() => {
        el.data = [undefined as unknown, { name: 'Alice' }];
      }).not.toThrow();
    });

    it('should handle null in data array', () => {
      expect(() => {
        el.data = [null as unknown, { name: 'Alice' }];
      }).not.toThrow();
    });
  });

  describe('Event Handler Error Recovery', () => {
    it('should not crash on action with invalid row index', () => {
      el.data = [{ name: 'Alice' }];
      const shadowRoot = el.shadowRoot as ShadowRoot;
      const row = shadowRoot.querySelector('[data-row="0"]');
      const button = row?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      // Artificially set invalid row index
      if (row) {
        row.setAttribute('data-row', '999');
      }
      expect(() => {
        button?.click();
      }).not.toThrow();
    });

    it('should continue when action handler is called', () => {
      el.data = [{ name: 'Alice' }];
      const shadowRoot = el.shadowRoot as ShadowRoot;
      const button = shadowRoot.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(() => {
        button?.click();
      }).not.toThrow();
    });
  });

  describe('Validation Error Recovery', () => {
    it('should handle invalid schema gracefully', () => {
      expect(() => {
        (el as unknown as { schema: string }).schema = 'not a schema';
      }).not.toThrow();
    });

    it('should handle schema with unusual values', () => {
      const unusualSchema = { properties: { name: { minLength: -1 } } };
      expect(() => {
        el.schema = unusualSchema;
      }).not.toThrow();
    });

    it('should handle invalid regex pattern', () => {
      el.schema = {
        properties: {
          name: { pattern: '[' }, // Invalid regex
        },
      };
      expect(() => {
        el.data = [{ name: 'test' }];
      }).not.toThrow();
    });
  });

  describe('Error State Indication', () => {
    it('should have hasError property', () => {
      expect('hasError' in el).toBe(true);
    });

    it('should set hasError to false by default', () => {
      expect(el.hasError).toBe(false);
    });

    it('should expose lastError property', () => {
      expect('lastError' in el).toBe(true);
    });

    it('should have clearError() method', () => {
      expect(typeof el.clearError).toBe('function');
    });

    it('should clear error state', () => {
      el.clearError();
      expect(el.hasError).toBe(false);
      expect(el.lastError).toBeNull();
    });
  });

  describe('Debug Mode', () => {
    it('should have debug property', () => {
      expect('debug' in el).toBe(true);
    });

    it('should default debug to false', () => {
      expect(el.debug).toBe(false);
    });

    it('should allow setting debug mode', () => {
      el.debug = true;
      expect(el.debug).toBe(true);
      el.debug = false;
      expect(el.debug).toBe(false);
    });
  });
});
