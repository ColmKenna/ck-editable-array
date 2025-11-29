/**
 * Week 5: Circular Reference Handling Tests
 * TDD - Tests for graceful handling of circular references in data
 */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Ensure component is registered
void CkEditableArray;

describe('ck-editable-array circular reference handling', () => {
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

  describe('cloneRow with circular references', () => {
    test('should not throw when data contains circular references', () => {
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

      // Create circular reference
      const circularData: Record<string, unknown> = { name: 'Alice' };
      circularData.self = circularData;

      // Should not throw
      expect(() => {
        el.data = [circularData];
      }).not.toThrow();
    });

    test('should preserve data when circular reference fallback is used', () => {
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

      // Create circular reference
      const circularData: Record<string, unknown> = { name: 'Bob', age: 30 };
      circularData.self = circularData;

      el.data = [circularData];

      // Data should be accessible
      expect(el.data[0]).toBeDefined();
      expect((el.data[0] as Record<string, unknown>).name).toBe('Bob');
      expect((el.data[0] as Record<string, unknown>).age).toBe(30);
    });

    test('should render correctly with circular reference data', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name" class="name-display"></span>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      // Create circular reference
      const circularData: Record<string, unknown> = { name: 'Charlie' };
      circularData.self = circularData;

      el.data = [circularData];

      // Should render the name correctly
      const shadowRoot = el.shadowRoot;
      expect(shadowRoot).not.toBeNull();
      const nameSpan = shadowRoot?.querySelector('.name-display');
      expect(nameSpan?.textContent).toBe('Charlie');
    });

    test('should log warning when circular reference is detected', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

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

      // Create circular reference
      const circularData: Record<string, unknown> = { name: 'Dave' };
      circularData.self = circularData;

      el.data = [circularData];

      // Should have logged a warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ck-editable-array'),
        expect.anything()
      );

      warnSpy.mockRestore();
    });

    test('should handle deeply nested circular references', () => {
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

      // Create deeply nested circular reference
      const data: Record<string, unknown> = {
        name: 'Eve',
        nested: {
          level1: {
            level2: {},
          },
        },
      };
      (data.nested as Record<string, unknown>).level1 = data;

      expect(() => {
        el.data = [data];
      }).not.toThrow();

      expect((el.data[0] as Record<string, unknown>).name).toBe('Eve');
    });

    test('should clone normal objects without issues (no regression)', () => {
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

      const normalData = { name: 'Frank', age: 25, address: { city: 'NYC' } };

      el.data = [normalData];

      // Should deep clone normally
      expect(el.data[0]).not.toBe(normalData);
      expect((el.data[0] as Record<string, unknown>).name).toBe('Frank');
      expect((el.data[0] as Record<string, unknown>).age).toBe(25);
      expect(
        (
          (el.data[0] as Record<string, unknown>).address as Record<
            string,
            unknown
          >
        ).city
      ).toBe('NYC');

      // Mutating original should not affect component data (immutability)
      normalData.name = 'Changed';
      expect((el.data[0] as Record<string, unknown>).name).toBe('Frank');
    });
  });
});
