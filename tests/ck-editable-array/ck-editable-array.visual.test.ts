/**
 * Week 5: Visual Regression Test Harness
 * 
 * This file provides a foundation for visual regression testing.
 * For full visual regression testing, integrate with:
 * - jest-image-snapshot (for Jest-based screenshot comparisons)
 * - Playwright (for cross-browser visual testing)
 * 
 * The tests below verify structural consistency that visual tests would validate.
 */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Ensure component is registered
void CkEditableArray;

describe('ck-editable-array visual consistency harness', () => {
  let el: HTMLElement & {
    data: unknown[];
    schema?: unknown;
    modalEdit?: boolean;
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

  describe('display mode structure', () => {
    test('renders display template with expected DOM structure', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <div class="row-display">
              <span data-bind="name" class="name-field"></span>
            </div>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      const shadowRoot = el.shadowRoot;
      expect(shadowRoot).not.toBeNull();

      // Verify structure - each row has both display-content and edit-content wrappers
      const displayWrappers = shadowRoot?.querySelectorAll('.display-content');
      expect(displayWrappers?.length).toBe(2);

      // Verify display content
      const nameFields = shadowRoot?.querySelectorAll('.name-field');
      expect(nameFields?.length).toBe(2);
      expect(nameFields?.[0]?.textContent).toBe('Alice');
      expect(nameFields?.[1]?.textContent).toBe('Bob');
    });
  });

  describe('edit mode structure', () => {
    test('renders edit template with expected DOM structure', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
            <button data-action="toggle">Edit</button>
          </template>
          <template slot="edit">
            <input data-bind="name" class="name-input" />
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      // Click edit button
      const editBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
      editBtn?.click();

      // Verify edit template is shown
      const input = el.shadowRoot?.querySelector('.name-input') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input?.value).toBe('Alice');
    });
  });

  describe('validation error structure', () => {
    test('renders validation errors with expected structure', async () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name"></span>
            <button data-action="toggle">Edit</button>
          </template>
          <template slot="edit">
            <input data-bind="name" />
            <span data-field-error="name" class="error-msg"></span>
            <button data-action="save">Save</button>
          </template>
        </ck-editable-array>
      `);

      el.schema = {
        required: ['name'],
        properties: {
          name: { minLength: 5 }
        }
      };

      el.data = [{ name: 'A' }]; // Too short

      // Click edit button
      const editBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
      editBtn?.click();

      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Get edit wrapper and find input within it
      const editWrapper = el.shadowRoot?.querySelector('.edit-content[data-row="0"]');
      const input = editWrapper?.querySelector('[data-bind="name"]') as HTMLInputElement;

      // Trigger input event to run validation
      input.value = 'A';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify validation error structure
      expect(input?.getAttribute('aria-invalid')).toBe('true');

      const errorMsg = editWrapper?.querySelector('.error-msg');
      expect(errorMsg?.textContent).toContain('at least 5');
    });
  });

  describe('deleted row structure', () => {
    test('renders deleted row with expected strikethrough class', () => {
      el = createComponent(`
        <ck-editable-array>
          <template slot="display">
            <span data-bind="name" class="name-display"></span>
            <button data-action="delete">Delete</button>
          </template>
          <template slot="edit">
            <input data-bind="name" />
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Delete first row
      const deleteBtn = el.shadowRoot?.querySelector('[data-action="delete"]') as HTMLElement;
      deleteBtn?.click();

      // Verify row is marked as deleted
      const firstRow = el.shadowRoot?.querySelector('[data-row="0"]');
      expect(firstRow?.getAttribute('data-deleted')).toBe('true');
    });
  });

  describe('modal edit structure', () => {
    test('renders modal overlay with expected structure when modal-edit is enabled', () => {
      el = createComponent(`
        <ck-editable-array modal-edit>
          <template slot="display">
            <span data-bind="name"></span>
            <button data-action="toggle">Edit</button>
          </template>
          <template slot="edit">
            <input data-bind="name" />
            <button data-action="save">Save</button>
          </template>
        </ck-editable-array>
      `);

      el.data = [{ name: 'Alice' }];

      // Click edit to open modal
      const editBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
      editBtn?.click();

      // Verify modal structure
      const modal = el.shadowRoot?.querySelector('[part="modal"]');
      expect(modal).not.toBeNull();
      expect(modal?.classList.contains('hidden')).toBe(false);
    });
  });

  describe('CSS custom properties structure', () => {
    test('component has CSS custom properties defined', () => {
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

      const styles = el.shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('--ck-error-color');
      expect(styles?.textContent).toContain('--ck-disabled-opacity');
      expect(styles?.textContent).toContain('--ck-border-radius');
    });
  });
});
