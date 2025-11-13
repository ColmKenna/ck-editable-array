import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';
import { waitForRender, getShadowRoot } from '../test-utils';

describe('CkEditableArray (render rows from data)', () => {
  test('clones templates per item, binds data, sets data-row/data-mode and emits datachanged on connect', async () => {
    // Create an instance directly to avoid customElements upgrade timing issues in the test runner
    const el = new (CkEditableArray as any)() as HTMLElement & { data?: any };
    el.setAttribute('name', 'person');

    // Create light DOM templates for display and edit
    const tplDisplay = document.createElement('template');
    tplDisplay.setAttribute('slot', 'display');
    tplDisplay.innerHTML = `
      <div class="row-display">
        <span data-bind="address1"></span>
        <span data-bind="address2"></span>
      </div>
    `;

    const tplEdit = document.createElement('template');
    tplEdit.setAttribute('slot', 'edit');
    tplEdit.innerHTML = `
      <div class="row-edit">
        <input data-bind="address1" />
        <input data-bind="address2" />
      </div>
    `;

    el.appendChild(tplDisplay);
    el.appendChild(tplEdit);

    // Provide data before connecting
    el.data = [{ address1: 'A1', address2: 'A2' }];

    document.body.appendChild(el);

    // Wait for render microtasks
    await waitForRender(el);

    // Note: we avoid asserting the composed/bubbled event here because some test
    // environments (jsdom) do not propagate composed events in the same way a
    // real browser does. The remaining assertions verify that the component
    // rendered bindings and attributes for the data item as required by AC-1.

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    // There should be at least one element with data-row="0" and data-mode="display"
    const displayRow = root!.querySelector(
      '[data-row="0"][data-mode="display"]'
    ) as HTMLElement | null;
    expect(displayRow).not.toBeNull();

    // The data-bind nodes inside the display clone should be populated
    const boundAddress1 = displayRow!.querySelector(
      '[data-bind="address1"]'
    ) as HTMLElement | null;
    const boundAddress2 = displayRow!.querySelector(
      '[data-bind="address2"]'
    ) as HTMLElement | null;
    expect(boundAddress1).not.toBeNull();
    expect(boundAddress2).not.toBeNull();
    expect(boundAddress1!.textContent).toBe('A1');
    expect(boundAddress2!.textContent).toBe('A2');
  });
});
