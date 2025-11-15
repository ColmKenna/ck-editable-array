import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Basic smoke + behavior tests for primitive string array usage

describe('ck-editable-array (simple strings demo)', () => {
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
          <span data-bind="value"></span>
          <button data-action="toggle">Edit</button>
          <button data-action="delete">Delete</button>
          <button data-action="restore">Restore</button>
        </div>
      </template>
      <template slot="edit">
        <div class="row-edit">
          <input data-bind="value" />
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </template>
    `;
    document.body.appendChild(el);
    return el;
  }

  test('renders primitive string rows', () => {
    const el = setup();
    el.data = ['A', 'B'];
    const spans = el.shadowRoot!.querySelectorAll('[data-bind="value"]');
    expect(spans.length).toBeGreaterThan(0);
    // At least one display span should contain first value
    expect(Array.from(spans).some(s => s.textContent === 'A')).toBe(true);
  });

  test('toggle edit mode and save updates data (object row)', () => {
    const el = setup();
    el.data = [{ value: 'A' }];
    const editBtn = el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    editBtn.click(); // enter edit mode
    const input = el.shadowRoot!.querySelector('input[data-bind="value"]') as HTMLInputElement;
    input.value = 'Z';
    input.dispatchEvent(new Event('input'));
    const saveBtn = el.shadowRoot!.querySelector('[data-action="save"]') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
    saveBtn.click();
    const first = el.data[0] as { value: string };
    expect(first.value).toBe('Z');
  });

  test('soft delete & restore (object rows)', () => {
    const el = setup();
    el.data = [{ value: 'A' }, { value: 'B' }];
    const deleteBtn = el.shadowRoot!.querySelector('[data-action="delete"]') as HTMLButtonElement;
    deleteBtn.click();
    const first = el.data[0] as { value: string; deleted?: boolean };
    expect(first.deleted).toBe(true);
    const restoreBtn = el.shadowRoot!.querySelector('[data-action="restore"]') as HTMLButtonElement;
    restoreBtn.click();
    const firstRestored = el.data[0] as { value: string; deleted?: boolean };
    expect(firstRestored.deleted).toBe(false);
  });
});
