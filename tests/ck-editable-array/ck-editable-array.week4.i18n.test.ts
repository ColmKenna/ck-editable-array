import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Week 4: Internationalization (i18n)', () => {
  let el: CkEditableArray;

  beforeEach(() => {
    el = new CkEditableArray();
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const setupComponent = (schema: any, data: any[]) => {
    el.schema = schema;

    const tplDisplay = document.createElement('template');
    tplDisplay.setAttribute('slot', 'display');
    tplDisplay.innerHTML = `<div><span data-bind="name"></span><button data-action="toggle">Edit</button></div>`;
    el.appendChild(tplDisplay);

    const tplEdit = document.createElement('template');
    tplEdit.setAttribute('slot', 'edit');
    tplEdit.innerHTML = `
      <div>
        <input data-bind="name" />
        <span data-field-error="name"></span>
        <button data-action="save">Save</button>
      </div>
    `;
    el.appendChild(tplEdit);

    el.data = data;
  };

  test('Default error messages are in English', async () => {
    setupComponent(
      { required: ['name'] },
      [{ name: '' }] // Invalid data
    );

    // Enter edit mode
    const toggleBtn = el.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();

    // Check error message
    const errorSpan = el.shadowRoot?.querySelector('[data-field-error="name"]');
    expect(errorSpan?.textContent).toContain('name is required');
  });

  test('Custom i18n messages override defaults', async () => {
    setupComponent({ required: ['name'] }, [{ name: '' }]);

    // Set custom messages
    (el as any).i18n = {
      required: (field: string) => `Le champ ${field} est requis`,
    };

    // Enter edit mode
    const toggleBtn = el.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();

    // Check error message
    const errorSpan = el.shadowRoot?.querySelector('[data-field-error="name"]');
    expect(errorSpan?.textContent).toBe('Le champ name est requis');
  });

  test('i18n supports dynamic values (e.g. minLength)', async () => {
    setupComponent(
      {
        properties: { name: { minLength: 5 } },
      },
      [{ name: 'Bob' }] // Too short
    );

    // Set custom messages
    (el as any).i18n = {
      minLength: (field: string, min: number) =>
        `${field} muss mindestens ${min} Zeichen lang sein`,
    };

    // Enter edit mode
    const toggleBtn = el.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();

    // Check error message
    const errorSpan = el.shadowRoot?.querySelector('[data-field-error="name"]');
    expect(errorSpan?.textContent).toBe(
      'name muss mindestens 5 Zeichen lang sein'
    );
  });
});
