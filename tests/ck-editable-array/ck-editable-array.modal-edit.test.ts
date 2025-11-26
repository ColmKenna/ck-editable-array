import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';
import {
  captureEvent,
  captureEventOrTimeout,
  clickAndWait,
  simulateInput,
  waitForRender,
} from '../test-utils';

interface ModalRow {
  name: string;
  editing?: boolean;
  deleted?: boolean;
}

describe('ck-editable-array (modal edit mode)', () => {
  beforeAll(() => {
    if (!customElements.get('ck-editable-array')) {
      customElements.define('ck-editable-array', CkEditableArray);
    }
  });

  function setup(initial: ModalRow = { name: 'Alice' }): CkEditableArray {
    const el = document.createElement('ck-editable-array') as CkEditableArray;
    el.setAttribute('modal-edit', '');
    el.innerHTML = `
      <template slot="display">
        <div class="row-display">
          <span data-bind="name"></span>
          <button data-action="toggle">Edit</button>
        </div>
      </template>
      <template slot="edit">
        <div class="row-edit">
          <input data-bind="name" aria-label="Name" />
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </template>
    `;
    el.data = [initial];
    document.body.appendChild(el);
    return el;
  }

  test('toggling to edit renders the edit template in a modal overlay', async () => {
    const el = setup();
    await waitForRender();

    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    await clickAndWait(toggleBtn);

    const modal = el.shadowRoot!.querySelector('[part="modal"]') as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.classList.contains('hidden')).toBe(false);

    // Modal should host the edit wrapper instead of the rows container.
    const modalEdit = modal.querySelector('.edit-content') as HTMLElement;
    expect(modalEdit?.getAttribute('data-row')).toBe('0');

    const nameInput = modalEdit?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(nameInput?.value).toBe('Alice');

    // Display content stays visible (no hidden class) while modal is open
    const displayWrapper = el.shadowRoot!.querySelector(
      '.display-content[data-row="0"]'
    ) as HTMLElement;
    expect(displayWrapper).not.toBeNull();
    expect(displayWrapper.classList.contains('hidden')).toBe(false);

    const rowsContainer = el.shadowRoot!.querySelector(
      '[part="rows"]'
    ) as HTMLElement;
    expect(rowsContainer.querySelector('.edit-content')).toBeNull();
  });

  test('saving from the modal updates data, fires datachanged, and closes the dialog', async () => {
    const el = setup({ name: 'Alice' });
    await waitForRender();

    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    await clickAndWait(toggleBtn);

    const dataChanged = captureEvent<CustomEvent>(el, 'datachanged');
    const modalInput = el.shadowRoot!.querySelector(
      '[part="modal"] input[data-bind="name"]'
    ) as HTMLInputElement;
    simulateInput(modalInput, 'Berta');

    const saveBtn = el.shadowRoot!.querySelector(
      '[part="modal"] [data-action="save"]'
    ) as HTMLButtonElement;
    await clickAndWait(saveBtn);

    const event = await dataChanged;
    expect(event.detail.data[0].name).toBe('Berta');
    expect(el.data[0]).toMatchObject({ name: 'Berta' });

    const modal = el.shadowRoot!.querySelector('[part="modal"]') as HTMLElement;
    expect(modal.classList.contains('hidden')).toBe(true);

    const displayName = el.shadowRoot!.querySelector(
      '.display-content [data-bind="name"]'
    ) as HTMLElement;
    expect(displayName.textContent).toBe('Berta');
  });

  test('canceling from the modal closes it without dispatching datachanged or mutating data', async () => {
    const el = setup({ name: 'Charlie' });
    await waitForRender();

    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    await clickAndWait(toggleBtn);

    const dataChanged = captureEventOrTimeout<CustomEvent>(el, 'datachanged');
    const modalInput = el.shadowRoot!.querySelector(
      '[part="modal"] input[data-bind="name"]'
    ) as HTMLInputElement;
    simulateInput(modalInput, 'Delta');

    const cancelBtn = el.shadowRoot!.querySelector(
      '[part="modal"] [data-action="cancel"]'
    ) as HTMLButtonElement;
    await clickAndWait(cancelBtn);

    const event = await dataChanged;
    expect(event).toBeNull(); // Cancel should not emit datachanged
    expect(el.data[0]).toMatchObject({ name: 'Charlie' });

    const modal = el.shadowRoot!.querySelector('[part="modal"]') as HTMLElement;
    expect(modal.classList.contains('hidden')).toBe(true);

    const displayName = el.shadowRoot!.querySelector(
      '.display-content [data-bind="name"]'
    ) as HTMLElement;
    expect(displayName.textContent).toBe('Charlie');
  });

  test('validation failure in modal shows errors in the modal and keeps it open on Save attempt', async () => {
    const el = document.createElement('ck-editable-array') as CkEditableArray;
    el.setAttribute('modal-edit', '');

    el.innerHTML = `
      <template slot="display">
        <div class="row-display">
          <span data-bind="name"></span>
          <span data-bind="email"></span>
          <button data-action="toggle">Edit</button>
        </div>
      </template>
      <template slot="edit">
        <div class="row-edit">
          <div class="error-summary" data-error-summary></div>
          <input data-bind="name" aria-label="Name" />
          <span data-field-error="name"></span>
          <input data-bind="email" aria-label="Email" />
          <span data-field-error="email"></span>
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </template>
    `;

    el.data = [{ name: 'Alice', email: 'alice@example.com' }];
    document.body.appendChild(el);
    await waitForRender();

    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    await clickAndWait(toggleBtn);

    // At this point the row is in edit mode inside the modal,
    // but no validation schema has been applied yet.
    const modal = el.shadowRoot!.querySelector('[part="modal"]') as HTMLElement;
    expect(modal.classList.contains('hidden')).toBe(false);

    const modalEdit = modal.querySelector(
      '.edit-content[data-row="0"]'
    ) as HTMLElement;
    expect(modalEdit).not.toBeNull();

    const saveBtn = modalEdit.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    // Now apply a schema that makes the current data invalid.
    el.schema = {
      required: ['name', 'email'],
      properties: {
        name: { minLength: 20 },
        email: { minLength: 20 },
      },
    };

    await waitForRender();

    // Save is still enabled at this point because validation hasn't run
    // against the new schema yet.
    expect(saveBtn.disabled).toBe(false);

    // Attempt to save; validation should run, keep the modal open,
    // and surface errors inside the modal edit content.
    await clickAndWait(saveBtn);

    const modalAfter = el.shadowRoot!.querySelector(
      '[part="modal"]'
    ) as HTMLElement;
    expect(modalAfter.classList.contains('hidden')).toBe(false);

    const modalEditAfter = modalAfter.querySelector(
      '.edit-content[data-row="0"]'
    ) as HTMLElement;

    const nameError = modalEditAfter.querySelector(
      '[data-field-error="name"]'
    ) as HTMLElement;
    const emailError = modalEditAfter.querySelector(
      '[data-field-error="email"]'
    ) as HTMLElement;
    const summary = modalEditAfter.querySelector(
      '[data-error-summary]'
    ) as HTMLElement;

    expect(nameError.textContent).not.toBe('');
    expect(emailError.textContent).not.toBe('');
    expect(summary.textContent).not.toBe('');
    expect(saveBtn.disabled).toBe(true);

    // Data should remain unchanged since save did not succeed.
    expect(el.data[0]).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
    });
  });
});
