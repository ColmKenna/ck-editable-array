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

  test('should have default name "World"', () => {
    expect(element.name).toBe('World');
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
    expect(shadowContent).toContain('World');
  });

  test('should update content when name attribute changes', () => {
    element.connectedCallback();
    element.setAttribute('name', 'Testing');

    // Trigger attribute change callback
    element.attributeChangedCallback('name', 'World', 'Testing');

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
});
