import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

/**
 * RED test: Radio inputs sharing same data-bind should reflect row field value by having matching value checked
 * and allow changing selection to update underlying data when saved.
 */

describe('ck-editable-array radio group binding', () => {
  beforeAll(() => {
    if (!customElements.get('ck-editable-array')) {
      customElements.define('ck-editable-array', CkEditableArray);
    }
  });

  function setup(): CkEditableArray {
    const el = document.createElement('ck-editable-array') as CkEditableArray;
    el.innerHTML = `
      <template slot="display">
        <div class="row-display">
          <span data-bind="priority"></span>
          <button data-action="toggle">Edit</button>
        </div>
      </template>
      <template slot="edit">
        <div class="row-edit">
          <fieldset>
            <legend>Priority</legend>
            <label><input type="radio" value="low" data-bind="priority" /> Low</label>
            <label><input type="radio" value="medium" data-bind="priority" /> Medium</label>
            <label><input type="radio" value="high" data-bind="priority" /> High</label>
          </fieldset>
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </template>
    `;
    document.body.appendChild(el);
    return el;
  }

  test('radio with matching value is checked in edit mode', () => {
    const el = setup();
    el.data = [{ priority: 'medium' }];
    const editBtn = el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    editBtn.click();
    const radios = Array.from(el.shadowRoot!.querySelectorAll('input[type="radio"][data-bind="priority"]')) as HTMLInputElement[];
    const medium = radios.find(r => r.value === 'medium');
    const low = radios.find(r => r.value === 'low');
    expect(medium).toBeDefined();
    expect(medium!.checked).toBe(true); // EXPECTED TO FAIL BEFORE IMPLEMENTATION
    expect(low!.checked).toBe(false);
  });

  test('changing selection updates data after save', () => {
    const el = setup();
    el.data = [{ priority: 'low' }];
    const editBtn = el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    editBtn.click();
    const highRadio = el.shadowRoot!.querySelector('input[type="radio"][value="high"][data-bind="priority"]') as HTMLInputElement;
    highRadio.checked = true;
    highRadio.dispatchEvent(new Event('change')); // prefer change for radio
    const saveBtn = el.shadowRoot!.querySelector('[data-action="save"]') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
    saveBtn.click();
    const row = el.data[0] as { priority: string };
    expect(row.priority).toBe('high'); // EXPECTED TO FAIL BEFORE IMPLEMENTATION IF binding not wired
  });
});
