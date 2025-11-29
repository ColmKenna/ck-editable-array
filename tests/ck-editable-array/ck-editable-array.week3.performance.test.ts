import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';
import { waitForRender, getShadowRoot } from '../test-utils';

describe('CkEditableArray - Week 3: Rendering Performance', () => {
  let el: CkEditableArray;

  beforeEach(async () => {
    el = new CkEditableArray();
    el.innerHTML = `
      <template slot="display">
        <div class="row-display">
          <span data-bind="name"></span>
          <button data-action="toggle">Edit</button>
        </div>
      </template>
      <template slot="edit">
        <div class="row-edit">
          <input data-bind="name" />
          <button data-action="save">Save</button>
        </div>
      </template>
    `;
    document.body.appendChild(el);
    await waitForRender();
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  test('toggle mode should preserve DOM elements (partial re-render)', async () => {
    el.data = [{ name: 'Item 1' }];
    await waitForRender();

    const root = getShadowRoot(el);
    const displayRow = root!.querySelector('.display-content');
    expect(displayRow).not.toBeNull();

    // Store reference
    const originalDisplayRow = displayRow;

    // Toggle to edit
    const toggleBtn = displayRow!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    await waitForRender();

    // Verify we are in edit mode
    const editRow = root!.querySelector('.edit-content');
    expect(editRow).not.toBeNull();
    expect(editRow!.classList.contains('hidden')).toBe(false);

    // Verify display row is hidden but IS THE SAME ELEMENT
    const newDisplayRow = root!.querySelector('.display-content');
    expect(newDisplayRow).toBe(originalDisplayRow);
  });

  test('save should preserve DOM elements and update content', async () => {
    el.data = [{ name: 'Item 1' }];
    await waitForRender();

    const root = getShadowRoot(el);
    const displayRow = root!.querySelector('.display-content');
    const originalDisplayRow = displayRow;

    // Toggle to edit
    const toggleBtn = displayRow!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    await waitForRender();

    // Edit value
    const input = root!.querySelector('input') as HTMLInputElement;
    input.value = 'Updated Item';
    input.dispatchEvent(new Event('input'));

    // Save
    const saveBtn = root!.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;
    saveBtn.click();
    await waitForRender();

    // Verify display row is visible, has new value, and IS THE SAME ELEMENT
    const finalDisplayRow = root!.querySelector('.display-content');
    expect(finalDisplayRow).toBe(originalDisplayRow);
    expect(finalDisplayRow!.textContent).toContain('Updated Item');
  });
});
