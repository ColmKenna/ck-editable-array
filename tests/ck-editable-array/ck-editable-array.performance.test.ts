/// <reference lib="dom" />
/* eslint-disable no-undef */
import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Define the custom element before running tests
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('CkEditableArray Performance Benchmarks', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  test('should render 100 rows efficiently', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="name"></span>`;
    element.appendChild(template);

    const data = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${i}`,
    }));

    const startTime = performance.now();
    element.data = data;
    element.connectedCallback();
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    expect(element.shadowRoot?.querySelectorAll('[data-row]').length).toBe(100);
  });

  test('should update 100 rows efficiently on data change', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="name"></span>`;
    element.appendChild(template);

    const data = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${i}`,
    }));

    element.data = data;
    element.connectedCallback();

    // Update data
    const updatedData = Array.from({ length: 100 }, (_, i) => ({
      name: `Updated Item ${i}`,
    }));

    const startTime = performance.now();
    element.data = updatedData;
    const endTime = performance.now();

    const updateTime = endTime - startTime;
    expect(updateTime).toBeLessThan(100); // Should update in less than 100ms
  });

  test('should update name efficiently without full re-render', () => {
    element.connectedCallback();

    const startTime = performance.now();
    element.name = 'Updated Name';
    const endTime = performance.now();

    const updateTime = endTime - startTime;
    expect(updateTime).toBeLessThan(10); // Fast path: <10ms
  });

  test('should handle adding and removing rows efficiently', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="name"></span>`;
    element.appendChild(template);

    // Initial 50 rows
    const initialData = Array.from({ length: 50 }, (_, i) => ({
      name: `Item ${i}`,
    }));
    element.data = initialData;
    element.connectedCallback();

    // Remove rows
    const startTime = performance.now();
    element.data = initialData.slice(0, 25);
    const endTime = performance.now();

    const removeTime = endTime - startTime;
    expect(removeTime).toBeLessThan(50);
    expect(element.shadowRoot?.querySelectorAll('[data-row]').length).toBe(25);
  });

  test('should cache template reference efficiently', () => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="name"></span>`;
    element.appendChild(template);

    element.connectedCallback();

    const data = Array.from({ length: 10 }, (_, i) => ({
      name: `Item ${i}`,
    }));

    // First render (cache miss)
    element.data = data;

    // Second render (cache hit)
    const startTime = performance.now();
    element.data = data;
    const endTime = performance.now();

    const cachedRenderTime = endTime - startTime;
    expect(cachedRenderTime).toBeLessThan(50);
  });
});
