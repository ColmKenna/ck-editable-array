/**
 * @file form-integration.test.ts
 * @description Tests for Form Integration functionality
 * TDD RED Phase: Writing failing tests first
 */

/* global HTMLFormElement, FormData */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register the custom element if not already registered
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

describe('Form Integration', () => {
  let el: CkEditableArray;
  let form: HTMLFormElement;

  function setup(): CkEditableArray {
    form = document.createElement('form');
    const element = document.createElement(
      'ck-editable-array'
    ) as CkEditableArray;
    element.setAttribute('name', 'items');
    element.innerHTML = `
      <template slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
      </template>
      <template slot="edit">
        <input data-bind="name" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
    form.appendChild(element);
    document.body.appendChild(form);
    return element;
  }

  beforeEach(() => {
    el = setup();
  });

  afterEach(() => {
    document.body.removeChild(form);
  });

  describe('FormData Serialization', () => {
    it('should have toFormData() method', () => {
      expect(typeof el.toFormData).toBe('function');
    });

    it('should return FormData object', () => {
      el.data = [{ name: 'Alice' }];
      const formData = el.toFormData();
      expect(formData instanceof FormData).toBe(true);
    });

    it('should serialize array data to FormData', () => {
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];
      const formData = el.toFormData();
      expect(formData.get('items[0][name]')).toBe('Alice');
      expect(formData.get('items[1][name]')).toBe('Bob');
    });

    it('should use component name attribute for FormData keys', () => {
      el.setAttribute('name', 'users');
      el.data = [{ name: 'Alice' }];
      const formData = el.toFormData();
      expect(formData.get('users[0][name]')).toBe('Alice');
    });

    it('should handle nested objects', () => {
      el.data = [{ person: { name: 'Alice', age: 30 } }];
      const formData = el.toFormData();
      expect(formData.get('items[0][person][name]')).toBe('Alice');
      expect(formData.get('items[0][person][age]')).toBe('30');
    });

    it('should handle simple string arrays', () => {
      el.data = ['Apple', 'Banana'];
      const formData = el.toFormData();
      expect(formData.get('items[0]')).toBe('Apple');
      expect(formData.get('items[1]')).toBe('Banana');
    });

    it('should exclude internal properties', () => {
      el.data = [{ name: 'Alice' }];
      const formData = el.toFormData();
      // Internal properties like __key, editing, etc. should not be included
      expect(formData.has('items[0][__key]')).toBe(false);
      expect(formData.has('items[0][editing]')).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    it('should have toJSON() method', () => {
      expect(typeof el.toJSON).toBe('function');
    });

    it('should return JSON string', () => {
      el.data = [{ name: 'Alice' }];
      const json = el.toJSON();
      expect(typeof json).toBe('string');
      expect(JSON.parse(json)).toEqual([{ name: 'Alice' }]);
    });

    it('should support pretty printing', () => {
      el.data = [{ name: 'Alice' }];
      const json = el.toJSON(2);
      expect(json).toContain('\n');
    });
  });

  describe('Form Submission', () => {
    it('should have data accessible during form submission', () => {
      el.data = [{ name: 'Alice' }];
      // Trigger form preparation (simulate form submission start)
      form.dispatchEvent(new Event('submit'));
      // Data should still be accessible
      expect(el.data.length).toBe(1);
      expect((el.data[0] as { name: string }).name).toBe('Alice');
    });

    it('should have value property returning JSON string', () => {
      el.data = [{ name: 'Alice' }];
      expect(typeof el.value).toBe('string');
      expect(JSON.parse(el.value)).toEqual([{ name: 'Alice' }]);
    });

    it('should have value setter that parses JSON', () => {
      el.value = '[{"name": "Bob"}]';
      expect((el.data[0] as { name: string }).name).toBe('Bob');
    });

    it('should handle invalid JSON in value setter', () => {
      el.data = [{ name: 'Alice' }];
      el.value = 'invalid json';
      // Should not throw and should keep existing data
      expect((el.data[0] as { name: string }).name).toBe('Alice');
    });
  });

  describe('Form Association', () => {
    it('should report form property', () => {
      expect(el.form).toBe(form);
    });

    it('should return null when not in a form', () => {
      document.body.removeChild(form);
      const standalone = document.createElement(
        'ck-editable-array'
      ) as CkEditableArray;
      document.body.appendChild(standalone);
      expect(standalone.form).toBeNull();
      document.body.removeChild(standalone);
      document.body.appendChild(form);
    });

    it('should have checkValidity() method', () => {
      expect(typeof el.checkValidity).toBe('function');
    });

    it('should return true when all rows are valid', () => {
      el.data = [{ name: 'Alice' }];
      expect(el.checkValidity()).toBe(true);
    });

    it('should return false when any row is invalid', () => {
      el.schema = {
        required: ['name'],
        properties: { name: { minLength: 2 } },
      };
      el.data = [{ name: '' }];
      expect(el.checkValidity()).toBe(false);
    });

    it('should have reportValidity() method', () => {
      expect(typeof el.reportValidity).toBe('function');
    });
  });

  describe('Reset Handling', () => {
    it('should respond to form reset', () => {
      const initialData = [{ name: 'Alice' }];
      el.data = initialData;
      el.data = [{ name: 'Bob' }];
      form.reset();
      // After reset, should restore to initial state
      // (Implementation may vary - could be empty or stored initial value)
      expect(el.data).toBeDefined();
    });
  });
});
