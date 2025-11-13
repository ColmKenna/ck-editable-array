import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';
import {
  waitForRender,
  getShadowRoot,
  simulateInput,
  captureEvent,
  captureEventOrTimeout,
} from '../test-utils';

describe('CkEditableArray rendering', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders provided data immediately when connected', async () => {
    // Create an instance directly to avoid customElements upgrade timing issues in the test runner
    const el = new (CkEditableArray as any)() as HTMLElement & { data?: any };
    el.setAttribute('name', 'person');

    // Create light DOM templates for display and edit
    const tplDisplay: HTMLTemplateElement = document.createElement('template');
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
    await waitForRender();

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
  test('keeps internal array and UI in sync for basic render', async () => {
    const el = createComponent(['A', 'B', 'C']);
    document.body.appendChild(el);

    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const editInputs = Array.from(
      root!.querySelectorAll<HTMLInputElement>(
        '[data-mode="edit"] input[data-bind="value"]'
      )
    );
    expect(editInputs).toHaveLength(3);
    expect(editInputs.map(input => input.value)).toEqual(['A', 'B', 'C']);

    const displayValues = Array.from(
      root!.querySelectorAll<HTMLElement>(
        '[data-mode="display"] [data-bind="value"]'
      )
    ).map(node => node.textContent?.trim() ?? '');

    expect(displayValues).toEqual(['A', 'B', 'C']);
    expect(el.data).toEqual(['A', 'B', 'C']);
  });

  test('initializing with empty array renders nothing and emits no change', async () => {
    const el = createComponent([]);
    const changeEventPromise = captureEventOrTimeout<CustomEvent>(
      el,
      'datachanged',
      50
    );

    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const editInputs = root!.querySelectorAll<HTMLInputElement>(
      '[data-mode="edit"] input[data-bind="value"]'
    );
    expect(editInputs.length).toBe(0);
    expect(el.data).toEqual([]);

    const changeEvent = await changeEventPromise;
    expect(changeEvent).toBeNull();
  });

  test.each([null, undefined])(
    'normalizes %s initial value to empty array without emitting change',
    async initialValue => {
      const el = createComponent(initialValue);
      const changeEventPromise = captureEventOrTimeout<CustomEvent>(
        el,
        'datachanged',
        50
      );

      document.body.appendChild(el);
      await waitForRender();

      const root = getShadowRoot(el);
      expect(root).not.toBeNull();
      const editInputs = root!.querySelectorAll<HTMLInputElement>(
        '[data-mode="edit"] input[data-bind="value"]'
      );
      expect(editInputs.length).toBe(0);
      expect(el.data).toEqual([]);

      const changeEvent = await changeEventPromise;
      expect(changeEvent).toBeNull();
    }
  );

  test('editing an existing item updates data and fires change event', async () => {
    const el = createComponent(['A', 'B', 'C']);
    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();
    const firstInput = root!.querySelector<HTMLInputElement>(
      '[data-mode="edit"][data-row="0"] input[data-bind="value"]'
    );
    expect(firstInput).not.toBeNull();

    const changeEventPromise = captureEvent<CustomEvent<{ data: unknown[] }>>(
      el,
      'datachanged'
    );

    simulateInput(firstInput!, 'A1');
    await waitForRender();

    const changeEvent = await changeEventPromise;
    expect(changeEvent.detail.data).toEqual(['A1', 'B', 'C']);
    expect(el.data).toEqual(['A1', 'B', 'C']);

    const displayFirst = root!.querySelector<HTMLElement>(
      '[data-mode="display"][data-row="0"] [data-bind="value"]'
    );
    expect(displayFirst?.textContent?.trim()).toBe('A1');
  });

  test('editing the only item updates data and display', async () => {
    const el = createComponent(['A']);
    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();
    const input = root!.querySelector<HTMLInputElement>(
      '[data-mode="edit"][data-row="0"] input[data-bind="value"]'
    );
    expect(input).not.toBeNull();

    const changeEventPromise = captureEvent<CustomEvent<{ data: unknown[] }>>(
      el,
      'datachanged'
    );

    simulateInput(input!, 'B');
    await waitForRender();

    const changeEvent = await changeEventPromise;
    expect(changeEvent.detail.data).toEqual(['B']);
    expect(el.data).toEqual(['B']);

    const displayValue = root!.querySelector<HTMLElement>(
      '[data-mode="display"][data-row="0"] [data-bind="value"]'
    );
    expect(displayValue?.textContent?.trim()).toBe('B');
  });

  test('editing an item to empty string updates data and fires change event', async () => {
    const el = createComponent(['A', 'B']);
    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const secondInput = root!.querySelector<HTMLInputElement>(
      '[data-mode="edit"][data-row="1"] input[data-bind="value"]'
    );
    expect(secondInput).not.toBeNull();

    const changeEventPromise = captureEvent<CustomEvent<{ data: unknown[] }>>(
      el,
      'datachanged'
    );

    simulateInput(secondInput!, '');
    await waitForRender();

    const changeEvent = await changeEventPromise;
    expect(changeEvent.detail.data).toEqual(['A', '']);
    expect(el.data).toEqual(['A', '']);

    const displaySecond = root!.querySelector<HTMLElement>(
      '[data-mode="display"][data-row="1"] [data-bind="value"]'
    );
    expect(displaySecond?.textContent?.trim()).toBe('');
  });

  test('re-renders when data is set after connecting and normalizes mixed rows', async () => {
    const el = new (CkEditableArray as typeof HTMLElement)() as InstanceType<
      typeof CkEditableArray
    >;
    el.setAttribute('name', 'mixed');

    const displayTpl = document.createElement('template');
    displayTpl.setAttribute('slot', 'display');
    displayTpl.innerHTML = `
      <div class="row-display">
        <input class="value-probe" data-bind="value" />
        <span class="missing-probe" data-bind="missing"></span>
        <span class="blank-probe" data-bind=""></span>
      </div>
    `;
    el.appendChild(displayTpl);

    document.body.appendChild(el);
    await waitForRender();

    el.data = [1, true, { value: 'OBJ', other: 'keep' }, null];
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const valueInputs = Array.from(
      root!.querySelectorAll<HTMLInputElement>('.value-probe')
    ).map(input => input.value);
    expect(valueInputs).toEqual(['1', 'true', 'OBJ', '']);

    const missingProbe = root!.querySelector<HTMLElement>(
      '[data-row="2"] .missing-probe'
    );
    expect(missingProbe?.textContent).toBe('');

    const blankProbe = root!.querySelector<HTMLElement>(
      '[data-row="2"] .blank-probe'
    );
    expect(blankProbe?.textContent).toBe('');

    expect(root!.querySelectorAll('[data-mode="edit"]').length).toBe(0);
  });

  test('wraps text-only templates so rows still receive attributes', async () => {
    const el = new (CkEditableArray as typeof HTMLElement)() as InstanceType<
      typeof CkEditableArray
    >;
    el.setAttribute('name', 'text-only');

    const displayTpl = document.createElement('template');
    displayTpl.setAttribute('slot', 'display');
    displayTpl.innerHTML = 'Plain display';

    const editTpl = document.createElement('template');
    editTpl.setAttribute('slot', 'edit');
    editTpl.innerHTML = 'Plain edit';

    el.appendChild(displayTpl);
    el.appendChild(editTpl);
    (el as any).data = ['x'];

    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const displayRow = root!.querySelector(
      '[data-mode="display"][data-row="0"]'
    );
    expect(displayRow?.textContent?.includes('Plain display')).toBe(true);

    const editRow = root!.querySelector('[data-mode="edit"][data-row="0"]');
    expect(editRow?.textContent?.includes('Plain edit')).toBe(true);
  });

  test('updates bound inputs and textareas when editing via textarea', async () => {
    const el = new (CkEditableArray as typeof HTMLElement)() as InstanceType<
      typeof CkEditableArray
    >;
    el.setAttribute('name', 'textarea-sync');

    const displayTpl = document.createElement('template');
    displayTpl.setAttribute('slot', 'display');
    displayTpl.innerHTML = `
      <div class="row-display">
        <input class="mirror-input" data-bind="value" />
        <textarea class="mirror-textarea" data-bind="value"></textarea>
      </div>
    `;

    const editTpl = document.createElement('template');
    editTpl.setAttribute('slot', 'edit');
    editTpl.innerHTML = `
      <div class="row-edit">
        <textarea class="editor" data-bind="value"></textarea>
      </div>
    `;

    el.appendChild(displayTpl);
    el.appendChild(editTpl);
    (el as any).data = ['Alpha'];

    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const editor = root!.querySelector<HTMLTextAreaElement>(
      '[data-mode="edit"] .editor'
    );
    expect(editor).not.toBeNull();

    const changeEventPromise = captureEvent<CustomEvent<{ data: unknown[] }>>(
      el,
      'datachanged'
    );

    editor!.value = 'Bravo';
    editor!.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForRender();

    const changeEvent = await changeEventPromise;
    expect(changeEvent.detail.data).toEqual(['Bravo']);

    const mirrorInput = root!.querySelector<HTMLInputElement>('.mirror-input');
    const mirrorTextarea =
      root!.querySelector<HTMLTextAreaElement>('.mirror-textarea');

    expect(mirrorInput?.value).toBe('Bravo');
    expect(mirrorTextarea?.value).toBe('Bravo');
  });

  test('updates only targeted keys when editing object rows', async () => {
    const el = createComponent([{ value: 'First', extra: 'keep' }]);
    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const input = root!.querySelector<HTMLInputElement>(
      '[data-mode="edit"][data-row="0"] input[data-bind="value"]'
    );
    expect(input).not.toBeNull();

    const changeEventPromise = captureEvent<CustomEvent<{ data: unknown[] }>>(
      el,
      'datachanged'
    );

    simulateInput(input!, 'Second');
    await waitForRender();

    const changeEvent = await changeEventPromise;
    expect(changeEvent.detail.data).toEqual([
      { value: 'Second', extra: 'keep' },
    ]);
    expect(el.data).toEqual([{ value: 'Second', extra: 'keep' }]);
  });

  test('ignores redundant and stale input events', async () => {
    const el = createComponent(['Persist']);
    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const input = root!.querySelector<HTMLInputElement>(
      '[data-mode="edit"][data-row="0"] input[data-bind="value"]'
    );
    expect(input).not.toBeNull();

    const noChangeEvent = captureEventOrTimeout<CustomEvent>(
      el,
      'datachanged',
      50
    );
    simulateInput(input!, 'Persist');
    await waitForRender();
    expect(await noChangeEvent).toBeNull();

    // Clear data - this will fire a datachanged event
    el.data = [];
    await waitForRender();

    // Now start listening for stale events AFTER the data clear event has fired
    const staleEvent = captureEventOrTimeout<CustomEvent>(
      el,
      'datachanged',
      50
    );

    // This input event should be ignored because the row no longer exists
    input!.value = 'New';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForRender();

    expect(await staleEvent).toBeNull();
  });

  test('render guards handle missing shadow roots and containers', async () => {
    const renderFn = (CkEditableArray.prototype as any).render;
    expect(() => renderFn.call({ shadowRoot: null })).not.toThrow();

    const el = createComponent(['Rootless']);
    document.body.appendChild(el);
    await waitForRender();

    el.shadowRoot?.querySelector('[part="root"]')?.remove();
    expect(() => renderFn.call(el)).not.toThrow();
  });

  test('commitRowValue normalizes undefined updates while disconnected', () => {
    const el = createComponent(['Alpha']);
    const commit = (el as any).commitRowValue.bind(el);

    commit(0, 'value', undefined);
    expect(el.data).toEqual(['']);
  });

  test('updateBoundNodes guards against missing shadow roots or rows', () => {
    const update = (CkEditableArray.prototype as any).updateBoundNodes;

    expect(() => update.call({ shadowRoot: null }, 0, 'value')).not.toThrow();

    const stub = {
      shadowRoot: {
        querySelectorAll: () => [],
      },
      _data: [],
    };
    expect(() => update.call(stub, 0, 'value')).not.toThrow();
  });

  test('blank data-bind inputs refresh entire rows', async () => {
    const el = new (CkEditableArray as typeof HTMLElement)() as InstanceType<
      typeof CkEditableArray
    >;
    el.setAttribute('name', 'blank-key');

    const displayTpl = document.createElement('template');
    displayTpl.setAttribute('slot', 'display');
    displayTpl.innerHTML = `
      <div class="row-display">
        <span class="blank-display" data-bind=""></span>
      </div>
    `;

    const editTpl = document.createElement('template');
    editTpl.setAttribute('slot', 'edit');
    editTpl.innerHTML = `
      <div class="row-edit">
        <input class="blank-editor" data-bind="" />
      </div>
    `;

    el.appendChild(displayTpl);
    el.appendChild(editTpl);
    (el as any).data = ['Zero'];

    document.body.appendChild(el);
    await waitForRender();

    const root = getShadowRoot(el);
    expect(root).not.toBeNull();

    const input = root!.querySelector<HTMLInputElement>('.blank-editor');
    expect(input).not.toBeNull();

    const changeEventPromise = captureEvent<CustomEvent<{ data: unknown[] }>>(
      el,
      'datachanged'
    );

    simulateInput(input!, 'All');
    await waitForRender();

    const changeEvent = await changeEventPromise;
    expect(changeEvent.detail.data).toEqual(['All']);

    const display = root!.querySelector<HTMLElement>('.blank-display');
    expect(display?.textContent).toBe('All');

    // Force a manual refresh to cover no-op text updates
    (el as any).updateBoundNodes(0, '');
  });

  test('updateBoundNodes tolerates nodes missing bindings', () => {
    const nodes: any = [
      {
        getAttribute: () => null,
        textContent: 'Stable',
      },
    ];
    const stubRow = {
      querySelectorAll: () => nodes,
    };
    const stub = {
      shadowRoot: {
        querySelectorAll: () => [stubRow],
      },
      _data: ['Stable'],
      resolveBindingValue: () => 'Stable',
    };

    const update = (CkEditableArray.prototype as any).updateBoundNodes;
    expect(() => update.call(stub, 0)).not.toThrow();
    expect(nodes[0].textContent).toBe('Stable');
  });

  test('does not redefine the custom element if already registered', async () => {
    const defineSpy = jest.spyOn(customElements, 'define');
    jest.resetModules();

    await import('../../src/components/ck-editable-array/ck-editable-array');

    expect(defineSpy).not.toHaveBeenCalled();
    defineSpy.mockRestore();
  });
});

function createComponent(
  initialValue?: unknown[] | null
):
  | (InstanceType<typeof CkEditableArray> & { data: unknown[] })
  | (HTMLElement & { data?: unknown[] }) {
  const el = new (CkEditableArray as typeof HTMLElement)() as unknown;
  el.setAttribute('name', 'letters');
  el.appendChild(createDisplayTemplate());
  el.appendChild(createEditTemplate());
  if (initialValue !== undefined) {
    (el as CkEditableArray).data = initialValue as unknown[];
  }
  return el;
}

function createDisplayTemplate(): HTMLTemplateElement {
  const tpl = document.createElement('template');
  tpl.setAttribute('slot', 'display');
  tpl.innerHTML = `
    <div class="row-display">
      <span data-bind="value"></span>
    </div>
  `;
  return tpl;
}

function createEditTemplate(): HTMLTemplateElement {
  const tpl = document.createElement('template');
  tpl.setAttribute('slot', 'edit');
  tpl.innerHTML = `
    <div class="row-edit">
      <input data-bind="value" />
    </div>
  `;
  return tpl;
}
