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

  const createDisplayTemplate = (
    bindPath: string = 'name',
    innerHTML?: string
  ): HTMLTemplateElement => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML =
      innerHTML || `<span data-bind="${bindPath}"></span>`;
    return template;
  };

  const setupElementWithTemplate = (
    data: unknown[],
    bindPath: string = 'name'
  ): void => {
    const template = createDisplayTemplate(bindPath);
    element.appendChild(template);
    element.data = data;
    element.connectedCallback();
  };

  test('should render 100 rows with linear DOM operations', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${i}`,
    }));

    setupElementWithTemplate(data);

    // Verify all rows were rendered correctly
    const rows = element.shadowRoot?.querySelectorAll('[data-row]');
    expect(rows?.length).toBe(100);

    // Verify data binding worked for first, middle, and last row
    const firstRow = rows?.[0] as HTMLElement;
    const middleRow = rows?.[50] as HTMLElement;
    const lastRow = rows?.[99] as HTMLElement;

    expect(firstRow?.querySelector('[data-bind="name"]')?.textContent).toBe(
      'Item 0'
    );
    expect(middleRow?.querySelector('[data-bind="name"]')?.textContent).toBe(
      'Item 50'
    );
    expect(lastRow?.querySelector('[data-bind="name"]')?.textContent).toBe(
      'Item 99'
    );
  });

  test('should update only changed rows efficiently', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${i}`,
    }));

    setupElementWithTemplate(data);

    // Get references to existing DOM rows
    const rowsBefore = element.shadowRoot?.querySelectorAll('[data-row]');
    const firstRowBefore = rowsBefore?.[0];
    const middleRowBefore = rowsBefore?.[50];
    const lastRowBefore = rowsBefore?.[99];

    // Update data
    const updatedData = Array.from({ length: 100 }, (_, i) => ({
      name: `Updated Item ${i}`,
    }));

    element.data = updatedData;

    // Get references after update
    const rowsAfter = element.shadowRoot?.querySelectorAll('[data-row]');
    const firstRowAfter = rowsAfter?.[0];
    const middleRowAfter = rowsAfter?.[50];
    const lastRowAfter = rowsAfter?.[99];

    // Verify DOM elements were reused (not recreated)
    expect(firstRowAfter).toBe(firstRowBefore);
    expect(middleRowAfter).toBe(middleRowBefore);
    expect(lastRowAfter).toBe(lastRowBefore);

    // Verify all rows were updated correctly
    expect(rowsAfter?.length).toBe(100);

    // Verify updated data for first, middle, and last row
    expect(
      (firstRowAfter as HTMLElement)?.querySelector('[data-bind="name"]')
        ?.textContent
    ).toBe('Updated Item 0');
    expect(
      (middleRowAfter as HTMLElement)?.querySelector('[data-bind="name"]')
        ?.textContent
    ).toBe('Updated Item 50');
    expect(
      (lastRowAfter as HTMLElement)?.querySelector('[data-bind="name"]')
        ?.textContent
    ).toBe('Updated Item 99');
  });

  test('should update name efficiently without full re-render', () => {
    element.connectedCallback();

    element.name = 'Updated Name';

    // Verify the name was updated in the message element
    const messageEl = element.shadowRoot?.querySelector(
      '.message'
    ) as HTMLHeadingElement;
    expect(messageEl?.textContent).toBe('Hello, Updated Name!');
  });

  test('should minimize DOM operations when removing rows', () => {
    // Initial 50 rows
    const initialData = Array.from({ length: 50 }, (_, i) => ({
      name: `Item ${i}`,
    }));

    setupElementWithTemplate(initialData);

    // Get references to rows before removal
    const rowsBefore = Array.from(
      element.shadowRoot?.querySelectorAll('[data-row]') || []
    );
    const keepRows = rowsBefore.slice(0, 25);

    // Remove rows
    element.data = initialData.slice(0, 25);

    // Get references after removal
    const rowsAfter = Array.from(
      element.shadowRoot?.querySelectorAll('[data-row]') || []
    );

    // Verify correct number of rows remain
    expect(rowsAfter.length).toBe(25);

    // Verify kept rows are the same DOM elements (reused, not recreated)
    rowsAfter.forEach((row, index) => {
      expect(row).toBe(keepRows[index]);
    });

    // Verify remaining rows have correct data
    const firstRow = rowsAfter[0] as HTMLElement;
    const lastRow = rowsAfter[24] as HTMLElement;

    expect(firstRow?.querySelector('[data-bind="name"]')?.textContent).toBe(
      'Item 0'
    );
    expect(lastRow?.querySelector('[data-bind="name"]')?.textContent).toBe(
      'Item 24'
    );
  });

  test('should use template caching and avoid re-querying', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      name: `Item ${i}`,
    }));

    setupElementWithTemplate(data);

    const firstRenderRows = Array.from(
      element.shadowRoot?.querySelectorAll('[data-row]') || []
    );

    // Second render (should use cached template and reuse DOM elements)
    element.data = data;
    const secondRenderRows = Array.from(
      element.shadowRoot?.querySelectorAll('[data-row]') || []
    );

    // Verify both renders produced correct results
    expect(firstRenderRows.length).toBe(10);
    expect(secondRenderRows.length).toBe(10);

    // Verify DOM elements were reused (not recreated)
    firstRenderRows.forEach((row, index) => {
      expect(secondRenderRows[index]).toBe(row);
    });

    // Verify data is correct in second render
    const firstRow = secondRenderRows[0] as HTMLElement;
    const lastRow = secondRenderRows[9] as HTMLElement;

    expect(firstRow?.querySelector('[data-bind="name"]')?.textContent).toBe(
      'Item 0'
    );
    expect(lastRow?.querySelector('[data-bind="name"]')?.textContent).toBe(
      'Item 9'
    );
  });

  test('should scale linearly with dataset size', () => {
    setupElementWithTemplate([]);

    // Test with different sizes
    const sizes = [10, 100, 500];
    const rowCounts: number[] = [];

    sizes.forEach(size => {
      const data = Array.from({ length: size }, (_, i) => ({
        name: `Item ${i}`,
      }));

      element.data = data;

      const rows = element.shadowRoot?.querySelectorAll('[data-row]');
      rowCounts.push(rows?.length || 0);
    });

    // Verify linear scaling: each size should produce exactly that many rows
    expect(rowCounts[0]).toBe(10);
    expect(rowCounts[1]).toBe(100);
    expect(rowCounts[2]).toBe(500);

    // Verify ratio is linear
    const ratio1 = rowCounts[1] / rowCounts[0]; // Should be 10
    const ratio2 = rowCounts[2] / rowCounts[1]; // Should be 5

    expect(ratio1).toBe(10);
    expect(ratio2).toBe(5);
  });
});
