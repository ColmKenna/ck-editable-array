import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('ck-editable-array (advanced inputs demo)', () => {
  beforeAll(() => {
    if (!customElements.get('ck-editable-array')) {
      customElements.define('ck-editable-array', CkEditableArray);
    }
  });

  interface DemoRow {
    date: string;
    notes: string;
    editing?: boolean;
    deleted?: boolean;
  }

  function setup(): CkEditableArray {
    const el = document.createElement('ck-editable-array') as CkEditableArray;
    el.innerHTML = `
      <template slot="display">
        <div class="row-display">
          <span data-bind="date"></span>
          <span data-bind="notes"></span>
          <button data-action="toggle">Edit</button>
        </div>
      </template>
      <template slot="edit">
        <div class="row-edit">
          <input type="date" data-bind="date" />
          <input data-bind="notes" />
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </template>
    `;
    document.body.appendChild(el);
    return el;
  }

  test('schema validation disables save until fixed', () => {
    const el = setup();
    el.schema = {
      required: ['date'],
      properties: { notes: { minLength: 3 } },
    };
    el.data = [
      {
        date: '2025-11-15',
        notes: '',
      },
    ];
    // Enter edit mode
    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    const saveBtn = el.shadowRoot!.querySelector(
      '.edit-content [data-action="save"]'
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true); // notes too short
    const notesInput = el.shadowRoot!.querySelector(
      '.edit-content input[data-bind="notes"]'
    ) as HTMLInputElement;
    notesInput.value = 'okay';
    notesInput.dispatchEvent(new Event('input'));
    expect(saveBtn.disabled).toBe(false);
  });

  test('editing date field commits after save', () => {
    const el = setup();
    el.data = [
      {
        date: '2025-11-15',
        notes: 'n',
      },
    ];
    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    const dateInput = el.shadowRoot!.querySelector(
      '.edit-content input[data-bind="date"]'
    ) as HTMLInputElement;
    dateInput.value = '2025-12-01';
    dateInput.dispatchEvent(new Event('input'));
    const saveBtn = el.shadowRoot!.querySelector(
      '.edit-content [data-action="save"]'
    ) as HTMLButtonElement;
    saveBtn.click();
    const first = el.data[0] as DemoRow;
    expect(first.date).toBe('2025-12-01');
  });
});
