/// <reference lib="dom" />
/* eslint-disable no-undef */
import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Define the custom element before running tests
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('CkEditableArray Component', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    // Create a fresh instance for each test
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Clean up after each test
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  test('should create an instance', () => {
    expect(element).toBeInstanceOf(CkEditableArray);
    expect(element).toBeInstanceOf(HTMLElement);
  });

  test('should have shadow DOM', () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should have default name "items"', () => {
    expect(element.name).toBe('items');
  });

  test('should set and get name attribute', () => {
    element.name = 'Jest';
    expect(element.name).toBe('Jest');
    expect(element.getAttribute('name')).toBe('Jest');
  });

  test('should render content in shadow DOM', () => {
    element.connectedCallback();
    const shadowContent = element.shadowRoot?.innerHTML;
    expect(shadowContent).toContain('Hello');
    expect(shadowContent).toContain('items');
  });

  test('should update content when name attribute changes', () => {
    element.connectedCallback();
    element.setAttribute('name', 'Testing');

    // Trigger attribute change callback
    element.attributeChangedCallback('name', 'items', 'Testing');

    const shadowContent = element.shadowRoot?.innerHTML;
    expect(shadowContent).toContain('Testing');
  });

  test('should observe name attribute', () => {
    const observedAttributes = CkEditableArray.observedAttributes;
    expect(observedAttributes).toContain('name');
  });

  // Data property tests (TDD: RED phase)
  test('should have default empty array data', () => {
    expect(element.data).toEqual([]);
  });

  test('should set and get data array', () => {
    const testData = [{ id: 1, name: 'Item 1' }];
    element.data = testData;
    expect(element.data).toEqual(testData);
  });

  test('should normalize null to empty array', () => {
    element.data = null as unknown as unknown[];
    expect(element.data).toEqual([]);
  });

  test('should normalize undefined to empty array', () => {
    element.data = undefined as unknown as unknown[];
    expect(element.data).toEqual([]);
  });

  test('should normalize string to empty array', () => {
    element.data = 'string' as unknown as unknown[];
    expect(element.data).toEqual([]);
  });

  test('should normalize number to empty array', () => {
    element.data = 123 as unknown as unknown[];
    expect(element.data).toEqual([]);
  });

  test('should normalize object to empty array', () => {
    element.data = {} as unknown as unknown[];
    expect(element.data).toEqual([]);
  });

  test('should deep clone data on set', () => {
    const originalData = [{ id: 1, nested: { value: 'original' } }];
    element.data = originalData;

    // Modify original data
    originalData[0].nested.value = 'modified';

    // Component data should be unchanged
    const storedData = element.data as typeof originalData;
    expect(storedData[0].nested.value).toBe('original');
  });

  test('should return deep cloned data on get', () => {
    const inputData = [{ id: 1, nested: { value: 'original' } }];
    element.data = inputData;

    const retrievedData = element.data as typeof inputData;

    // Modify retrieved data
    retrievedData[0].nested.value = 'modified';

    // Component data should be unchanged
    const storedData = element.data as typeof inputData;
    expect(storedData[0].nested.value).toBe('original');
  });

  test('should handle array with various data types', () => {
    const complexData = [
      { id: 1, name: 'string', count: 42, active: true, tags: ['a', 'b'] },
      { id: 2, nested: { deep: { value: 123 } } },
    ];
    element.data = complexData;

    expect(element.data).toEqual(complexData);
    expect(element.data).not.toBe(complexData); // Should be a different reference
  });

  test('should dispatch datachanged event when data is set', () => {
    const elementHandler = jest.fn();
    const bodyHandler = jest.fn();
    const onElement = (event: unknown) => elementHandler(event);
    const onBody = (event: unknown) => bodyHandler(event);

    element.addEventListener('datachanged', onElement);
    document.body.addEventListener('datachanged', onBody);

    const testData = [{ id: 1, name: 'Item 1' }];
    element.data = testData;

    expect(elementHandler).toHaveBeenCalledTimes(1);
    expect(bodyHandler).toHaveBeenCalledTimes(1);

    const event = elementHandler.mock.calls[0][0] as unknown as {
      type: string;
      bubbles: boolean;
      composed: boolean;
      detail: { data: unknown[] };
    };

    expect(event.type).toBe('datachanged');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail.data).toEqual(testData);
    expect(event.detail.data).not.toBe(testData);

    document.body.removeEventListener('datachanged', onBody);
    element.removeEventListener('datachanged', onElement);
  });

  // Light DOM display template tests (TDD: RED phase)
  test('should render a helpful empty state when no display template is provided', () => {
    element.data = [{ id: 1 }];
    element.connectedCallback();
    expect(element.shadowRoot?.textContent).toContain(
      'No display template found'
    );
  });

  test('should render the light DOM <template slot="display"> content into shadow DOM', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<div id="fromTemplate">From template</div>`;
    element.appendChild(template);

    element.data = [{ id: 1 }];
    element.connectedCallback();

    expect(element.shadowRoot?.querySelector('#fromTemplate')).toBeTruthy();
    expect(element.shadowRoot?.textContent).toContain('From template');
  });

  test('should render display template after connection when data changes', () => {
    element.data = [{ id: 1 }];
    element.connectedCallback();
    expect(element.shadowRoot?.textContent).toContain(
      'No display template found'
    );

    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<div id="lateTemplate">Late template</div>`;
    element.appendChild(template);

    // Template changes are not observed; a subsequent render is required.
    element.data = [{ id: 1 }];

    expect(element.shadowRoot?.querySelector('#lateTemplate')).toBeTruthy();
    expect(element.shadowRoot?.textContent).toContain('Late template');
  });

  // Rows rendering + data-bind tests (TDD: RED phase)
  test('should render one row per data item into part="rows"', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="name"></span>`;
    element.appendChild(template);

    element.data = [{ name: 'A' }, { name: 'B' }];
    element.connectedCallback();

    const rowsHost = element.shadowRoot?.querySelector('[part="rows"]') ?? null;
    expect(rowsHost).toBeTruthy();
    expect(rowsHost?.querySelectorAll('[data-row]').length).toBe(2);
    expect(rowsHost?.textContent).toContain('A');
    expect(rowsHost?.textContent).toContain('B');
  });

  test('should set data-row attribute to the row index', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="name"></span>`;
    element.appendChild(template);

    element.data = [{ name: 'First' }, { name: 'Second' }];
    element.connectedCallback();

    const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
    const rows = rowsHost?.querySelectorAll('[data-row]') ?? [];
    expect((rows[0] as HTMLElement).getAttribute('data-row')).toBe('0');
    expect((rows[1] as HTMLElement).getAttribute('data-row')).toBe('1');
  });

  test('should bind dot-path values via [data-bind]', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="person.address.city"></span>`;
    element.appendChild(template);

    element.data = [{ person: { address: { city: 'Dublin' } } }];
    element.connectedCallback();

    const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
    expect(rowsHost?.textContent).toContain('Dublin');
  });

  test('should join bound arrays with comma+space', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="tags"></span>`;
    element.appendChild(template);

    element.data = [{ tags: ['a', 'b', 'c'] }];
    element.connectedCallback();

    const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
    expect(rowsHost?.textContent).toContain('a, b, c');
  });

  test('should set bound text via textContent (not interpret HTML)', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="name"></span>`;
    element.appendChild(template);

    element.data = [{ name: '<img src=x onerror=alert(1)>' }];
    element.connectedCallback();

    const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
    expect(rowsHost?.querySelector('img')).toBeFalsy();
    expect(rowsHost?.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  test('should show an empty state in rows when no template is present', () => {
    element.data = [{ any: 'value' }];
    element.connectedCallback();

    const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
    expect(rowsHost?.textContent).toContain('No display template found');
  });

  describe('Display - Wrapper Class Configuration (Phase 2)', () => {
    test('should observe root-class, rows-class, and row-class attributes', () => {
      const observedAttributes = CkEditableArray.observedAttributes;
      expect(observedAttributes).toContain('root-class');
      expect(observedAttributes).toContain('rows-class');
      expect(observedAttributes).toContain('row-class');
    });

    test('should expose rootClass/rowsClass/rowClass properties', () => {
      const proto = Object.getPrototypeOf(element) as object;
      expect(Object.getOwnPropertyDescriptor(proto, 'rootClass')).toBeTruthy();
      expect(Object.getOwnPropertyDescriptor(proto, 'rowsClass')).toBeTruthy();
      expect(Object.getOwnPropertyDescriptor(proto, 'rowClass')).toBeTruthy();
    });

    test('should apply root-class, rows-class, and row-class to generated wrappers', () => {
      element.setAttribute('root-class', 'custom-root');
      element.setAttribute('rows-class', 'custom-rows');
      element.setAttribute('row-class', 'custom-row');

      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }, { name: 'B' }];
      element.connectedCallback();

      const rootContainer = element.shadowRoot?.querySelector(
        '.ck-editable-array'
      ) as HTMLElement;
      expect(rootContainer).toBeTruthy();
      expect(rootContainer.classList.contains('ck-editable-array')).toBe(true);
      expect(rootContainer.classList.contains('custom-root')).toBe(true);

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      expect(rowsHost).toBeTruthy();
      expect((rowsHost as HTMLElement).classList.contains('rows')).toBe(true);
      expect((rowsHost as HTMLElement).classList.contains('custom-rows')).toBe(
        true
      );

      const rows = element.shadowRoot?.querySelectorAll(
        '[data-row]'
      ) as NodeListOf<HTMLElement>;
      expect(rows.length).toBe(2);
      expect(rows[0].classList.contains('row')).toBe(true);
      expect(rows[0].classList.contains('custom-row')).toBe(true);
      expect(rows[1].classList.contains('custom-row')).toBe(true);
    });

    test('should update wrapper classes when attributes change', () => {
      element.setAttribute('row-class', 'row-v1');

      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }, { name: 'B' }];
      element.connectedCallback();

      // Change row-class after initial render
      element.setAttribute('row-class', 'row-v2');
      element.attributeChangedCallback('row-class', 'row-v1', 'row-v2');

      const rows = element.shadowRoot?.querySelectorAll(
        '[data-row]'
      ) as NodeListOf<HTMLElement>;
      expect(rows[0].classList.contains('row-v1')).toBe(false);
      expect(rows[0].classList.contains('row-v2')).toBe(true);
      expect(rows[1].classList.contains('row-v2')).toBe(true);
    });

    test('should update root-class and rows-class when attributes change', () => {
      element.setAttribute('root-class', 'root-v1');
      element.setAttribute('rows-class', 'rows-v1');

      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }];
      element.connectedCallback();

      element.setAttribute('root-class', 'root-v2');
      element.attributeChangedCallback('root-class', 'root-v1', 'root-v2');

      element.setAttribute('rows-class', 'rows-v2');
      element.attributeChangedCallback('rows-class', 'rows-v1', 'rows-v2');

      const rootContainer = element.shadowRoot?.querySelector(
        '.ck-editable-array'
      ) as HTMLElement;
      expect(rootContainer.classList.contains('root-v1')).toBe(false);
      expect(rootContainer.classList.contains('root-v2')).toBe(true);

      const rowsHost = element.shadowRoot?.querySelector(
        '[part="rows"]'
      ) as HTMLElement;
      expect(rowsHost.classList.contains('rows-v1')).toBe(false);
      expect(rowsHost.classList.contains('rows-v2')).toBe(true);
    });

    test('should remove wrapper classes when attribute is cleared', () => {
      element.setAttribute('row-class', 'row-v1');

      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }];
      element.connectedCallback();

      element.removeAttribute('row-class');
      element.attributeChangedCallback(
        'row-class',
        'row-v1',
        null as unknown as string
      );

      const row = element.shadowRoot?.querySelector(
        '[data-row]'
      ) as HTMLElement;
      expect(row.classList.contains('row')).toBe(true);
      expect(row.classList.contains('row-v1')).toBe(false);
    });

    test('should not apply wrapper classes to elements inside the template', () => {
      element.setAttribute('row-class', 'row-wrapper-class');

      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<div id="inside" class="inside"></div>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }];
      element.connectedCallback();

      const inside = element.shadowRoot?.querySelector(
        '#inside'
      ) as HTMLElement;
      expect(inside).toBeTruthy();
      expect(inside.classList.contains('inside')).toBe(true);
      expect(inside.classList.contains('row-wrapper-class')).toBe(false);
    });
  });

  // Accessibility tests (Phase 1 - Task 1.1)
  describe('Accessibility - ARIA Roles and Labels', () => {
    test('should have role="region" on root container', () => {
      element.connectedCallback();
      const rootContainer =
        element.shadowRoot?.querySelector('.ck-editable-array');
      expect(rootContainer?.getAttribute('role')).toBe('region');
    });

    test('should have aria-label on root container', () => {
      element.connectedCallback();
      const rootContainer =
        element.shadowRoot?.querySelector('.ck-editable-array');
      expect(rootContainer?.getAttribute('aria-label')).toBeTruthy();
      expect(rootContainer?.getAttribute('aria-label')).toContain('array');
    });

    test('should have role="list" on rows container', () => {
      element.connectedCallback();
      const rowsContainer = element.shadowRoot?.querySelector('[part="rows"]');
      expect(rowsContainer?.getAttribute('role')).toBe('list');
    });

    test('should have aria-label on rows container', () => {
      element.connectedCallback();
      const rowsContainer = element.shadowRoot?.querySelector('[part="rows"]');
      expect(rowsContainer?.getAttribute('aria-label')).toBeTruthy();
    });

    test('should have aria-live status region', () => {
      element.connectedCallback();
      const statusRegion = element.shadowRoot?.querySelector('[role="status"]');
      expect(statusRegion).toBeTruthy();
      expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
      expect(statusRegion?.getAttribute('aria-atomic')).toBe('true');
    });
  });

  // Accessibility tests (Phase 1 - Task 1.2)
  describe('Accessibility - Keyboard Navigation', () => {
    test('should add tabindex="0" to each row', () => {
      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }, { name: 'B' }];
      element.connectedCallback();

      const rows = element.shadowRoot?.querySelectorAll('[data-row]');
      expect(rows?.length).toBe(2);
      expect((rows?.[0] as HTMLElement)?.getAttribute('tabindex')).toBe('0');
      expect((rows?.[1] as HTMLElement)?.getAttribute('tabindex')).toBe('0');
    });

    test('should allow ArrowDown to move focus to next row', () => {
      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      element.connectedCallback();

      const rows = element.shadowRoot?.querySelectorAll(
        '[data-row]'
      ) as NodeListOf<HTMLElement>;

      // Focus first row
      rows[0].focus();
      expect(element.shadowRoot?.activeElement).toBe(rows[0]);

      // Press ArrowDown
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      rows[0].dispatchEvent(event);

      // Second row should be focused
      expect(element.shadowRoot?.activeElement).toBe(rows[1]);
    });

    test('should allow ArrowUp to move focus to previous row', () => {
      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      element.connectedCallback();

      const rows = element.shadowRoot?.querySelectorAll(
        '[data-row]'
      ) as NodeListOf<HTMLElement>;

      // Focus second row
      rows[1].focus();
      expect(element.shadowRoot?.activeElement).toBe(rows[1]);

      // Press ArrowUp
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      rows[1].dispatchEvent(event);

      // First row should be focused
      expect(element.shadowRoot?.activeElement).toBe(rows[0]);
    });

    test('should not move focus beyond first row with ArrowUp', () => {
      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }, { name: 'B' }];
      element.connectedCallback();

      const rows = element.shadowRoot?.querySelectorAll(
        '[data-row]'
      ) as NodeListOf<HTMLElement>;

      // Focus first row
      rows[0].focus();

      // Press ArrowUp (should stay on first row)
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      rows[0].dispatchEvent(event);

      expect(element.shadowRoot?.activeElement).toBe(rows[0]);
    });

    test('should not move focus beyond last row with ArrowDown', () => {
      const template = document.createElement('template');
      template.setAttribute('slot', 'display');
      template.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(template);

      element.data = [{ name: 'A' }, { name: 'B' }];
      element.connectedCallback();

      const rows = element.shadowRoot?.querySelectorAll(
        '[data-row]'
      ) as NodeListOf<HTMLElement>;

      // Focus last row
      rows[1].focus();

      // Press ArrowDown (should stay on last row)
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      rows[1].dispatchEvent(event);

      expect(element.shadowRoot?.activeElement).toBe(rows[1]);
    });
  });

  // Edit Template Input Value Binding Tests (TDD: RED phase)
  describe('Edit Template - Input Value Binding', () => {
    test('should populate input value from data-bind in edit template', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="name" />`;
      element.appendChild(editTemplate);

      element.data = [{ name: 'Alice' }, { name: 'Bob' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      expect(rows?.length).toBe(2);

      const input1 = rows?.[0]?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      const input2 = rows?.[1]?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;

      expect(input1).toBeTruthy();
      expect(input2).toBeTruthy();
      expect(input1.value).toBe('Alice');
      expect(input2.value).toBe('Bob');
    });

    test('should populate textarea value from data-bind in edit template', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="notes"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<textarea data-bind="notes"></textarea>`;
      element.appendChild(editTemplate);

      element.data = [{ notes: 'First note' }, { notes: 'Second note' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const textarea1 = rows?.[0]?.querySelector(
        'textarea[data-bind="notes"]'
      ) as HTMLTextAreaElement;
      const textarea2 = rows?.[1]?.querySelector(
        'textarea[data-bind="notes"]'
      ) as HTMLTextAreaElement;

      expect(textarea1).toBeTruthy();
      expect(textarea2).toBeTruthy();
      expect(textarea1.value).toBe('First note');
      expect(textarea2.value).toBe('Second note');
    });

    test('should select correct option in select element from data-bind in edit template', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="status"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `
        <select data-bind="status">
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
        </select>
      `;
      element.appendChild(editTemplate);

      element.data = [{ status: 'active' }, { status: 'done' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const select1 = rows?.[0]?.querySelector(
        'select[data-bind="status"]'
      ) as HTMLSelectElement;
      const select2 = rows?.[1]?.querySelector(
        'select[data-bind="status"]'
      ) as HTMLSelectElement;

      expect(select1).toBeTruthy();
      expect(select2).toBeTruthy();
      expect(select1.value).toBe('active');
      expect(select2.value).toBe('done');
    });

    test('should handle nested path bindings in input elements', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="user.email"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="email" data-bind="user.email" />`;
      element.appendChild(editTemplate);

      element.data = [
        { user: { email: 'alice@example.com' } },
        { user: { email: 'bob@example.com' } },
      ];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const input1 = rows?.[0]?.querySelector(
        'input[data-bind="user.email"]'
      ) as HTMLInputElement;
      const input2 = rows?.[1]?.querySelector(
        'input[data-bind="user.email"]'
      ) as HTMLInputElement;

      expect(input1.value).toBe('alice@example.com');
      expect(input2.value).toBe('bob@example.com');
    });

    test('should handle null/undefined values in input elements gracefully', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="optional"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="optional" />`;
      element.appendChild(editTemplate);

      element.data = [
        { optional: null },
        { optional: undefined },
        { optional: 'value' },
      ];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const input1 = rows?.[0]?.querySelector(
        'input[data-bind="optional"]'
      ) as HTMLInputElement;
      const input2 = rows?.[1]?.querySelector(
        'input[data-bind="optional"]'
      ) as HTMLInputElement;
      const input3 = rows?.[2]?.querySelector(
        'input[data-bind="optional"]'
      ) as HTMLInputElement;

      expect(input1.value).toBe('');
      expect(input2.value).toBe('');
      expect(input3.value).toBe('value');
    });

    test('should preserve textContent binding for non-form elements in edit template', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="title"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `
        <div>
          <label data-bind="title"></label>
          <input type="text" data-bind="title" />
        </div>
      `;
      element.appendChild(editTemplate);

      element.data = [{ title: 'Test Title' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row]') as HTMLElement;

      const label = row?.querySelector(
        'label[data-bind="title"]'
      ) as HTMLLabelElement;
      const input = row?.querySelector(
        'input[data-bind="title"]'
      ) as HTMLInputElement;

      // Label should use textContent
      expect(label.textContent).toBe('Test Title');
      // Input should use value
      expect(input.value).toBe('Test Title');
    });

    test('should handle number inputs with numeric values', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="age"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="number" data-bind="age" />`;
      element.appendChild(editTemplate);

      element.data = [{ age: 25 }, { age: 30 }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const input1 = rows?.[0]?.querySelector(
        'input[data-bind="age"]'
      ) as HTMLInputElement;
      const input2 = rows?.[1]?.querySelector(
        'input[data-bind="age"]'
      ) as HTMLInputElement;

      expect(input1.value).toBe('25');
      expect(input2.value).toBe('30');
    });

    test('should handle checkbox inputs with boolean values', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="active"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="checkbox" data-bind="active" />`;
      element.appendChild(editTemplate);

      element.data = [{ active: true }, { active: false }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const checkbox1 = rows?.[0]?.querySelector(
        'input[data-bind="active"]'
      ) as HTMLInputElement;
      const checkbox2 = rows?.[1]?.querySelector(
        'input[data-bind="active"]'
      ) as HTMLInputElement;

      expect(checkbox1.checked).toBe(true);
      expect(checkbox2.checked).toBe(false);
    });
  });

  // Form Control Name/ID Attributes Tests (TDD: RED phase)
  describe('Form Control Name/ID Attributes', () => {
    test('should have default name attribute of "items"', () => {
      const freshElement = new CkEditableArray();
      expect(freshElement.name).toBe('items');
    });

    test('should set name and id attributes on input elements in edit template', () => {
      element.setAttribute('name', 'users');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="firstName"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="firstName" />`;
      element.appendChild(editTemplate);

      element.data = [{ firstName: 'Alice' }, { firstName: 'Bob' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const input1 = rows?.[0]?.querySelector(
        'input[data-bind="firstName"]'
      ) as HTMLInputElement;
      const input2 = rows?.[1]?.querySelector(
        'input[data-bind="firstName"]'
      ) as HTMLInputElement;

      expect(input1.getAttribute('name')).toBe('users[0].firstName');
      expect(input1.getAttribute('id')).toBe('users__0__firstName');
      expect(input2.getAttribute('name')).toBe('users[1].firstName');
      expect(input2.getAttribute('id')).toBe('users__1__firstName');
    });

    test('should set name and id attributes on select elements in edit template', () => {
      element.setAttribute('name', 'employees');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="role"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `
        <select data-bind="role">
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      `;
      element.appendChild(editTemplate);

      element.data = [{ role: 'admin' }, { role: 'user' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const select1 = rows?.[0]?.querySelector(
        'select[data-bind="role"]'
      ) as HTMLSelectElement;
      const select2 = rows?.[1]?.querySelector(
        'select[data-bind="role"]'
      ) as HTMLSelectElement;

      expect(select1.getAttribute('name')).toBe('employees[0].role');
      expect(select1.getAttribute('id')).toBe('employees__0__role');
      expect(select2.getAttribute('name')).toBe('employees[1].role');
      expect(select2.getAttribute('id')).toBe('employees__1__role');
    });

    test('should set name and id attributes on textarea elements in edit template', () => {
      element.setAttribute('name', 'posts');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="content"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<textarea data-bind="content"></textarea>`;
      element.appendChild(editTemplate);

      element.data = [{ content: 'First' }, { content: 'Second' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const textarea1 = rows?.[0]?.querySelector(
        'textarea[data-bind="content"]'
      ) as HTMLTextAreaElement;
      const textarea2 = rows?.[1]?.querySelector(
        'textarea[data-bind="content"]'
      ) as HTMLTextAreaElement;

      expect(textarea1.getAttribute('name')).toBe('posts[0].content');
      expect(textarea1.getAttribute('id')).toBe('posts__0__content');
      expect(textarea2.getAttribute('name')).toBe('posts[1].content');
      expect(textarea2.getAttribute('id')).toBe('posts__1__content');
    });

    test('should handle nested paths in data-bind for name/id attributes', () => {
      element.setAttribute('name', 'profiles');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="contact.email"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="email" data-bind="contact.email" />`;
      element.appendChild(editTemplate);

      element.data = [
        { contact: { email: 'alice@example.com' } },
        { contact: { email: 'bob@example.com' } },
      ];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const rows = rowsHost?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;

      const input1 = rows?.[0]?.querySelector(
        'input[data-bind="contact.email"]'
      ) as HTMLInputElement;
      const input2 = rows?.[1]?.querySelector(
        'input[data-bind="contact.email"]'
      ) as HTMLInputElement;

      expect(input1.getAttribute('name')).toBe('profiles[0].contact.email');
      expect(input1.getAttribute('id')).toBe('profiles__0__contact_email');
      expect(input2.getAttribute('name')).toBe('profiles[1].contact.email');
      expect(input2.getAttribute('id')).toBe('profiles__1__contact_email');
    });

    test('should not set name/id attributes on display template elements', () => {
      element.setAttribute('name', 'items');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="title"></span>`;
      element.appendChild(displayTemplate);

      element.data = [{ title: 'Test' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const span = rowsHost?.querySelector(
        'span[data-bind="title"]'
      ) as HTMLElement;

      expect(span.getAttribute('name')).toBeNull();
      expect(span.getAttribute('id')).toBeNull();
    });

    test('should use default name "items" when name attribute not set', () => {
      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="value"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="value" />`;
      element.appendChild(editTemplate);

      element.data = [{ value: 'Test' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const input = rowsHost?.querySelector(
        'input[data-bind="value"]'
      ) as HTMLInputElement;

      expect(input.getAttribute('name')).toBe('items[0].value');
      expect(input.getAttribute('id')).toBe('items__0__value');
    });

    test('should handle multiple form controls in same row', () => {
      element.setAttribute('name', 'records');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `
        <input type="text" data-bind="name" />
        <input type="email" data-bind="email" />
        <select data-bind="status">
          <option value="active">Active</option>
        </select>
      `;
      element.appendChild(editTemplate);

      element.data = [
        { name: 'Alice', email: 'alice@example.com', status: 'active' },
      ];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row]') as HTMLElement;

      const nameInput = row?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      const emailInput = row?.querySelector(
        'input[data-bind="email"]'
      ) as HTMLInputElement;
      const statusSelect = row?.querySelector(
        'select[data-bind="status"]'
      ) as HTMLSelectElement;

      expect(nameInput.getAttribute('name')).toBe('records[0].name');
      expect(nameInput.getAttribute('id')).toBe('records__0__name');
      expect(emailInput.getAttribute('name')).toBe('records[0].email');
      expect(emailInput.getAttribute('id')).toBe('records__0__email');
      expect(statusSelect.getAttribute('name')).toBe('records[0].status');
      expect(statusSelect.getAttribute('id')).toBe('records__0__status');
    });
  });

  // Input-to-Display Sync Tests (FR-010: TDD RED phase)
  describe('Input-to-Display Sync (Bidirectional Binding)', () => {
    test('should update display element when input value changes', () => {
      element.setAttribute('name', 'users');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="name" />`;
      element.appendChild(editTemplate);

      element.data = [{ name: 'Alice' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;

      const input = row?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      const displaySpan = row?.querySelector(
        'span[data-bind="name"]'
      ) as HTMLElement;

      // Initial state
      expect(input.value).toBe('Alice');
      expect(displaySpan.textContent).toBe('Alice');

      // User types new value
      input.value = 'Alice Updated';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Display should update
      expect(displaySpan.textContent).toBe('Alice Updated');
    });

    test('should update component data when input value changes', () => {
      element.setAttribute('name', 'users');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="name" />`;
      element.appendChild(editTemplate);

      element.data = [{ name: 'Bob' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;
      const input = row?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;

      // User types new value
      input.value = 'Bob Updated';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Component data should update
      const updatedData = element.data as { name: string }[];
      expect(updatedData[0].name).toBe('Bob Updated');
    });

    test('should dispatch datachanged event on input change', () => {
      element.setAttribute('name', 'users');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="name" />`;
      element.appendChild(editTemplate);

      element.data = [{ name: 'Charlie' }];
      element.connectedCallback();

      const eventHandler = jest.fn();
      element.addEventListener('datachanged', eventHandler);

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;
      const input = row?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;

      // Clear events from initial data set
      eventHandler.mockClear();

      // User types new value
      input.value = 'Charlie Updated';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Event should fire
      expect(eventHandler).toHaveBeenCalledTimes(1);
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.data[0].name).toBe('Charlie Updated');

      element.removeEventListener('datachanged', eventHandler);
    });

    test('should handle nested path bindings on input change', () => {
      element.setAttribute('name', 'profiles');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="user.email"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="email" data-bind="user.email" />`;
      element.appendChild(editTemplate);

      element.data = [{ user: { email: 'alice@example.com' } }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;
      const input = row?.querySelector(
        'input[data-bind="user.email"]'
      ) as HTMLInputElement;
      const displaySpan = row?.querySelector(
        'span[data-bind="user.email"]'
      ) as HTMLElement;

      // User types new value
      input.value = 'newemail@example.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Display and data should update
      expect(displaySpan.textContent).toBe('newemail@example.com');
      const updatedData = element.data as { user: { email: string } }[];
      expect(updatedData[0].user.email).toBe('newemail@example.com');
    });

    test('should update correct row when multiple rows exist', () => {
      element.setAttribute('name', 'users');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="name" />`;
      element.appendChild(editTemplate);

      element.data = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row1 = rowsHost?.querySelector('[data-row="1"]') as HTMLElement;
      const input1 = row1?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;

      // User updates row 1 (Bob)
      input1.value = 'Bob Modified';
      input1.dispatchEvent(new Event('input', { bubbles: true }));

      // Only row 1 data should change
      const updatedData = element.data as { name: string }[];
      expect(updatedData[0].name).toBe('Alice'); // Unchanged
      expect(updatedData[1].name).toBe('Bob Modified'); // Changed
      expect(updatedData[2].name).toBe('Charlie'); // Unchanged

      // Only row 1 display should update
      const row0Display = rowsHost
        ?.querySelector('[data-row="0"]')
        ?.querySelector('span[data-bind="name"]') as HTMLElement;
      const row1Display = row1?.querySelector(
        'span[data-bind="name"]'
      ) as HTMLElement;
      const row2Display = rowsHost
        ?.querySelector('[data-row="2"]')
        ?.querySelector('span[data-bind="name"]') as HTMLElement;

      expect(row0Display.textContent).toBe('Alice');
      expect(row1Display.textContent).toBe('Bob Modified');
      expect(row2Display.textContent).toBe('Charlie');
    });

    test('should work with textarea elements', () => {
      element.setAttribute('name', 'posts');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="content"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<textarea data-bind="content"></textarea>`;
      element.appendChild(editTemplate);

      element.data = [{ content: 'Original content' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;
      const textarea = row?.querySelector(
        'textarea[data-bind="content"]'
      ) as HTMLTextAreaElement;
      const displaySpan = row?.querySelector(
        'span[data-bind="content"]'
      ) as HTMLElement;

      // User types new content
      textarea.value = 'Updated content';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Display and data should update
      expect(displaySpan.textContent).toBe('Updated content');
      const updatedData = element.data as { content: string }[];
      expect(updatedData[0].content).toBe('Updated content');
    });

    test('should work with select elements', () => {
      element.setAttribute('name', 'employees');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="role"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `
        <select data-bind="role">
          <option value="Developer">Developer</option>
          <option value="Designer">Designer</option>
          <option value="Manager">Manager</option>
        </select>
      `;
      element.appendChild(editTemplate);

      element.data = [{ role: 'Developer' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;
      const select = row?.querySelector(
        'select[data-bind="role"]'
      ) as HTMLSelectElement;
      const displaySpan = row?.querySelector(
        'span[data-bind="role"]'
      ) as HTMLElement;

      // User selects new role
      select.value = 'Manager';
      select.dispatchEvent(new Event('change', { bubbles: true }));

      // Display and data should update
      expect(displaySpan.textContent).toBe('Manager');
      const updatedData = element.data as { role: string }[];
      expect(updatedData[0].role).toBe('Manager');
    });

    test('should update boolean data when checkbox changes', () => {
      element.setAttribute('name', 'tasks');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="completed"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="checkbox" data-bind="completed" />`;
      element.appendChild(editTemplate);

      element.data = [{ completed: false }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;
      const checkbox = row?.querySelector(
        'input[data-bind="completed"]'
      ) as HTMLInputElement;
      const displaySpan = row?.querySelector(
        'span[data-bind="completed"]'
      ) as HTMLElement;

      expect(checkbox.checked).toBe(false);
      expect(displaySpan.textContent).toBe('false');

      // User checks the checkbox
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      // Display and data should update
      expect(displaySpan.textContent).toBe('true');
      const updatedData = element.data as { completed: boolean }[];
      expect(updatedData[0].completed).toBe(true);
    });

    test('should not update display elements in other rows', () => {
      element.setAttribute('name', 'users');

      const displayTemplate = document.createElement('template');
      displayTemplate.setAttribute('slot', 'display');
      displayTemplate.innerHTML = `<span data-bind="name"></span>`;
      element.appendChild(displayTemplate);

      const editTemplate = document.createElement('template');
      editTemplate.setAttribute('slot', 'edit');
      editTemplate.innerHTML = `<input type="text" data-bind="name" />`;
      element.appendChild(editTemplate);

      element.data = [{ name: 'Alice' }, { name: 'Bob' }];
      element.connectedCallback();

      const rowsHost = element.shadowRoot?.querySelector('[part="rows"]');
      const row0 = rowsHost?.querySelector('[data-row="0"]') as HTMLElement;
      const row1 = rowsHost?.querySelector('[data-row="1"]') as HTMLElement;

      const input0 = row0?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      const display0 = row0?.querySelector(
        'span[data-bind="name"]'
      ) as HTMLElement;
      const display1 = row1?.querySelector(
        'span[data-bind="name"]'
      ) as HTMLElement;

      // Record initial display content
      const initialDisplay1 = display1.textContent;

      // User updates row 0
      input0.value = 'Alice Modified';
      input0.dispatchEvent(new Event('input', { bubbles: true }));

      // Row 0 display should update
      expect(display0.textContent).toBe('Alice Modified');

      // Row 1 display should NOT change
      expect(display1.textContent).toBe(initialDisplay1);
      expect(display1.textContent).toBe('Bob');
    });
  });
});
