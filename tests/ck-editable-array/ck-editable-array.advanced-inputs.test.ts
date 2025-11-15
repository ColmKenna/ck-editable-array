/* eslint-disable no-undef */
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
    status?: string;
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

  describe('select element binding', () => {
    function setupWithSelect(): CkEditableArray {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="status"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
            <select data-bind="status" aria-label="Status">
              <option value="">--</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);
      return el;
    }

    test('select element displays bound value in display mode', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'planned' }];

      const displaySpan = el.shadowRoot!.querySelector('[data-bind="status"]');
      expect(displaySpan?.textContent).toBe('planned');
    });
    test('select element shows correct option selected in edit mode', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'in-progress' }];

      // Toggle to edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;

      expect(selectElement.value).toBe('in-progress');
    });

    test('changing select value updates data on save', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'planned' }];

      // Toggle to edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;

      // Change the select value
      selectElement.value = 'done';
      selectElement.dispatchEvent(new Event('change'));

      // Save the changes
      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as DemoRow;
      expect(first.status).toBe('done');
    });

    test('select element reflects value when switching back to edit mode', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'planned' }];

      // Toggle to edit mode
      let toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      // Change and save
      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;
      selectElement.value = 'done';
      selectElement.dispatchEvent(new Event('change'));

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      // Toggle back to edit mode
      toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      // Check that select shows 'done'
      const selectAgain = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;
      expect(selectAgain.value).toBe('done');
    });

    test('validation works with select element (required field)', () => {
      const el = setupWithSelect();
      el.schema = {
        required: ['status'],
      };
      el.data = [{ status: '' }];

      // Toggle to edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;

      // Save should be disabled when status is empty
      expect(saveBtn.disabled).toBe(true);

      // Set a valid value
      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;
      selectElement.value = 'planned';
      selectElement.dispatchEvent(new Event('change'));

      // Save should now be enabled
      expect(saveBtn.disabled).toBe(false);
    });
  });
});
