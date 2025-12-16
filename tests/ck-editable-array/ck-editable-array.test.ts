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

  test('should observe name and color attributes', () => {
    const observedAttributes = CkEditableArray.observedAttributes;
    expect(observedAttributes).toContain('name');
    expect(observedAttributes).toContain('color');
  });

  test('should handle color attribute', () => {
    element.setAttribute('color', 'blue');
    element.connectedCallback();

    const shadowContent = element.shadowRoot?.innerHTML;
    expect(shadowContent).toContain('blue');
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

  test('should re-render when a display template is added after connection', async () => {
    element.data = [{ id: 1 }];
    element.connectedCallback();
    expect(element.shadowRoot?.textContent).toContain(
      'No display template found'
    );

    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<div id="lateTemplate">Late template</div>`;
    element.appendChild(template);

    // MutationObserver callbacks run on a microtask.
    await Promise.resolve();

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
});
