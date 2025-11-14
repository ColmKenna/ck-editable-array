import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Accessibility Tests', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('ARIA Attributes', () => {
    test('Invalid inputs have aria-invalid="true"', async () => {
      const el = new CkEditableArray();
      el.schema = {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
      };

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /><span data-field-error="name"></span></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: '' }];
      document.body.appendChild(el);

      const toggleBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
      toggleBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const input = el.shadowRoot?.querySelector('input[data-bind="name"]') as HTMLInputElement;
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    test('Valid inputs do not have aria-invalid', async () => {
      const el = new CkEditableArray();
      el.schema = {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
      };

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /><span data-field-error="name"></span></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      const toggleBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
      toggleBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const input = el.shadowRoot?.querySelector('input[data-bind="name"]') as HTMLInputElement;
      expect(input?.getAttribute('aria-invalid')).not.toBe('true');
    });

    test('Error messages are linked via aria-describedby', async () => {
      const el = new CkEditableArray();
      el.schema = {
        type: 'object',
        properties: { email: { type: 'string', minLength: 1 } },
        required: ['email'],
      };

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="email"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="email" /><span data-field-error="email"></span></div>';
      el.appendChild(tplEdit);

      el.data = [{ email: '' }];
      document.body.appendChild(el);

      const toggleBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
      toggleBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const input = el.shadowRoot?.querySelector('input[data-bind="email"]') as HTMLInputElement;
      const errorSpan = el.shadowRoot?.querySelector('[data-field-error="email"]') as HTMLElement;
      const errorId = errorSpan?.getAttribute('id');

      expect(errorId).toBeTruthy();
      expect(input?.getAttribute('aria-describedby')).toBe(errorId);
    });

    test('Disabled buttons have aria-disabled="true"', () => {
      const el = new CkEditableArray();
      el.setAttribute('readonly', '');

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      const addButton = el.shadowRoot?.querySelector('[data-action="add"]') as HTMLButtonElement;
      expect(addButton?.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Keyboard Navigation', () => {
    test('All interactive controls are keyboard accessible', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /><button data-action="save">Save</button></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      const toggleBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
      const addBtn = el.shadowRoot?.querySelector('[data-action="add"]') as HTMLButtonElement;

      expect(toggleBtn?.tabIndex).toBeGreaterThanOrEqual(0);
      expect(addBtn?.tabIndex).toBeGreaterThanOrEqual(0);
    });

    test('Locked rows have inert attribute', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /><button data-action="save">Save</button></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }, { name: 'Bob', editing: true }];
      document.body.appendChild(el);

      const row0Display = el.shadowRoot?.querySelector('.display-content[data-row="0"]');
      expect(row0Display?.hasAttribute('inert')).toBe(true);
    });
  });

  describe('Screen Reader Support', () => {
    test('Error summary has role="alert"', async () => {
      const el = new CkEditableArray();
      el.schema = {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
      };

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><div data-error-summary role="alert" aria-live="polite"></div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: '' }];
      document.body.appendChild(el);

      const toggleBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
      toggleBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorSummary = el.shadowRoot?.querySelector('[data-error-summary]');
      expect(errorSummary?.getAttribute('role')).toBe('alert');
      expect(errorSummary?.getAttribute('aria-live')).toBe('polite');
    });

    test('Error summary contains meaningful error text', async () => {
      const el = new CkEditableArray();
      el.schema = {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
      };

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><div data-error-summary></div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: '' }];
      document.body.appendChild(el);

      const toggleBtn = el.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
      toggleBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorSummary = el.shadowRoot?.querySelector('[data-error-summary]');
      const summaryText = errorSummary?.textContent || '';
      expect(summaryText).toContain('name');
      expect(summaryText).toContain('required');
    });
  });

  describe('Semantic HTML', () => {
    test('Buttons have type="button" to prevent form submission', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      const addButton = el.shadowRoot?.querySelector('[data-action="add"]') as HTMLButtonElement;
      expect(addButton?.type).toBe('button');
    });

    test('Inputs have proper name attributes for form submission', () => {
      const el = new CkEditableArray();
      el.setAttribute('name', 'person');

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice', editing: true }];
      document.body.appendChild(el);

      const input = el.shadowRoot?.querySelector('input[data-bind="name"]') as HTMLInputElement;
      expect(input?.name).toBe('person[0].name');
    });
  });

  describe('Color Contrast', () => {
    test('Component provides data attributes for custom styling', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice', deleted: true }];
      document.body.appendChild(el);

      const displayRow = el.shadowRoot?.querySelector('.display-content[data-row="0"]');
      expect(displayRow?.hasAttribute('data-deleted')).toBe(true);
      expect(displayRow?.classList.contains('deleted')).toBe(true);
    });
  });
});
