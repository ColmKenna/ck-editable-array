import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Week 4: Focus Management', () => {
  let el: CkEditableArray;

  beforeEach(() => {
    el = new CkEditableArray();
    document.body.appendChild(el);

    // Setup templates
    const tplDisplay = document.createElement('template');
    tplDisplay.setAttribute('slot', 'display');
    tplDisplay.innerHTML = `
      <div class="row-display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
      </div>
    `;
    el.appendChild(tplDisplay);

    const tplEdit = document.createElement('template');
    tplEdit.setAttribute('slot', 'edit');
    tplEdit.innerHTML = `
      <div class="row-edit">
        <input data-bind="name" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </div>
    `;
    el.appendChild(tplEdit);

    el.data = [{ name: 'Alice' }];
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('Focus moves to first input when entering edit mode', async () => {
    const rowDisplay = el.shadowRoot?.querySelector(
      '.display-content[data-row="0"]'
    );
    const toggleBtn = rowDisplay?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;

    toggleBtn.click();

    // Wait for microtasks/rendering
    await new Promise(resolve => setTimeout(resolve, 100)); // Increased timeout

    const rowEdit = el.shadowRoot?.querySelector('.edit-content[data-row="0"]');
    const input = rowEdit?.querySelector('input');

    // console.log('Row Edit:', rowEdit?.outerHTML);
    // console.log('Input:', input?.outerHTML);
    // console.log('Active Element:', el.shadowRoot?.activeElement?.outerHTML);

    expect(el.shadowRoot?.activeElement).toBe(input);
  });

  test('Focus returns to toggle button when cancelling edit', async () => {
    // Enter edit mode first
    const rowDisplay = el.shadowRoot?.querySelector(
      '.display-content[data-row="0"]'
    );
    const toggleBtn = rowDisplay?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Click cancel
    const rowEdit = el.shadowRoot?.querySelector('.edit-content[data-row="0"]');
    const cancelBtn = rowEdit?.querySelector(
      '[data-action="cancel"]'
    ) as HTMLButtonElement;
    cancelBtn.click();

    // Wait for microtasks/rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Re-query because DOM might have been updated (though keyed rendering should preserve it)
    const rowDisplayAfter = el.shadowRoot?.querySelector(
      '.display-content[data-row="0"]'
    );
    const toggleBtnAfter = rowDisplayAfter?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;

    expect(el.shadowRoot?.activeElement).toBe(toggleBtnAfter);
  });

  test('Focus returns to toggle button when saving edit', async () => {
    // Enter edit mode first
    const rowDisplay = el.shadowRoot?.querySelector(
      '.display-content[data-row="0"]'
    );
    const toggleBtn = rowDisplay?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Click save
    const rowEdit = el.shadowRoot?.querySelector('.edit-content[data-row="0"]');
    const saveBtn = rowEdit?.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;
    saveBtn.click();

    // Wait for microtasks/rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    const rowDisplayAfter = el.shadowRoot?.querySelector(
      '.display-content[data-row="0"]'
    );
    const toggleBtnAfter = rowDisplayAfter?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;

    expect(el.shadowRoot?.activeElement).toBe(toggleBtnAfter);
  });
});
