import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 2: Public API', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 2.1 — Constructor & initial state', () => {
    describe('Test 1 — Default construction', () => {
      test('Given a newly constructed <ck-editable-array> element, When I access its public properties, Then el.data returns an empty array', () => {
        // Arrange & Act
        const el = new CkEditableArray();

        // Assert
        expect(el.data).toEqual([]);
        expect(Array.isArray(el.data)).toBe(true);
      });

      test('Given a newly constructed <ck-editable-array> element, When I access its public properties, Then el.schema returns null', () => {
        // Arrange & Act
        const el = new CkEditableArray() as CkEditableArray & {
          schema: unknown;
        };

        // Assert
        expect(el.schema).toBeNull();
      });

      test('Given a newly constructed <ck-editable-array> element, When I access its public properties, Then el.newItemFactory is a function', () => {
        // Arrange & Act
        const el = new CkEditableArray() as CkEditableArray & {
          newItemFactory: () => unknown;
        };

        // Assert
        expect(typeof el.newItemFactory).toBe('function');
      });
    });

    describe('Test 2 — Shadow root setup', () => {
      test('Given a newly constructed <ck-editable-array> element, When I access el.shadowRoot, Then it exists and is an open shadow root', () => {
        // Arrange & Act
        const el = new CkEditableArray();

        // Assert
        expect(el.shadowRoot).not.toBeNull();
        expect(el.shadowRoot?.mode).toBe('open');
      });

      test('Given a newly constructed <ck-editable-array> element, When I access el.shadowRoot, Then it contains the basic scaffolding for the component (e.g. a rows container and an add-button container)', () => {
        // Arrange & Act
        const el = new CkEditableArray();

        // Assert
        expect(el.shadowRoot).not.toBeNull();

        // Check for rows container
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();
        expect(rowsContainer?.tagName.toLowerCase()).toBe('div');

        // Check for add-button container
        const addButtonContainer = el.shadowRoot?.querySelector(
          '[part="add-button"]'
        );
        expect(addButtonContainer).not.toBeNull();
        expect(addButtonContainer?.tagName.toLowerCase()).toBe('div');
      });
    });
  });

  describe('Test 2.2 — data (getter/setter)', () => {
    describe('Test 3 — Getter reflects last set value', () => {
      test('Given a <ck-editable-array> element, When I set el.data = [{ id: 1 }, { id: 2 }], And I then read el.data, Then it returns an array of two items with id 1 and 2', () => {
        // Arrange
        const el = new CkEditableArray();
        const testData = [{ id: 1 }, { id: 2 }];

        // Act
        el.data = testData;
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1 });
        expect(result[1]).toEqual({ id: 2 });
      });
    });

    describe('Test 4 — Input array is cloned (no external mutation leak)', () => {
      test('Given a <ck-editable-array> element, And a source array const source = [{ id: 1 }], When I set el.data = source, And later mutate source[0].id = 99, And I read el.data, Then the id in el.data[0] is still 1 (not 99)', () => {
        // Arrange
        const el = new CkEditableArray();
        const source = [{ id: 1 }];

        // Act
        el.data = source;
        source[0].id = 99; // Mutate the original source

        const result = el.data;

        // Assert
        expect((result[0] as { id: number }).id).toBe(1);
        expect((result[0] as { id: number }).id).not.toBe(99);
      });
    });

    describe('Test 5 — Non-array values normalise to empty array', () => {
      test('Given a <ck-editable-array> element, When I set el.data to null, And I then read el.data, Then el.data is an empty array', () => {
        // Arrange
        const el = new CkEditableArray();

        // Act
        el.data = null as unknown as unknown[];
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      test('Given a <ck-editable-array> element, When I set el.data to undefined, And I then read el.data, Then el.data is an empty array', () => {
        // Arrange
        const el = new CkEditableArray();

        // Act
        el.data = undefined as unknown as unknown[];
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      test('Given a <ck-editable-array> element, When I set el.data to a string, And I then read el.data, Then el.data is an empty array', () => {
        // Arrange
        const el = new CkEditableArray();

        // Act
        el.data = 'not an array' as unknown as unknown[];
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      test('Given a <ck-editable-array> element, When I set el.data to a number, And I then read el.data, Then el.data is an empty array', () => {
        // Arrange
        const el = new CkEditableArray();

        // Act
        el.data = 42 as unknown as unknown[];
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      test('Given a <ck-editable-array> element, When I set el.data to a plain object, And I then read el.data, Then el.data is an empty array', () => {
        // Arrange
        const el = new CkEditableArray();

        // Act
        el.data = { key: 'value' } as unknown as unknown[];
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });
    });

    describe('Test 6 — Primitive items are preserved', () => {
      test('Given a <ck-editable-array> element, When I set el.data = ["a", "b"], And I then read el.data, Then it returns an array of two items equal to "a" and "b"', () => {
        // Arrange
        const el = new CkEditableArray();

        // Act
        el.data = ['a', 'b'];
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe('a');
        expect(result[1]).toBe('b');
      });
    });

    describe('Test 7 — "Deleted" flags survive round-trip', () => {
      test('Given a <ck-editable-array> element, When I set el.data = [{ id: 1, deleted: true }, { id: 2 }], And I then read el.data, Then the first item still has deleted: true, And the second item does not have deleted: true', () => {
        // Arrange
        const el = new CkEditableArray();

        // Act
        el.data = [{ id: 1, deleted: true }, { id: 2 }];
        const result = el.data;

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);

        // First item should have deleted: true
        const firstItem = result[0] as { id: number; deleted?: boolean };
        expect(firstItem.id).toBe(1);
        expect(firstItem.deleted).toBe(true);

        // Second item should not have deleted property (or it should be undefined/false)
        const secondItem = result[1] as { id: number; deleted?: boolean };
        expect(secondItem.id).toBe(2);
        expect(secondItem.deleted).not.toBe(true);
      });
    });

    describe('Test 8 — Setting data on a connected element re-renders UI', () => {
      test('Given a <ck-editable-array> element that is attached to document.body, And its data is initially an empty array, When I set el.data = [{ label: "A" }, { label: "B" }], Then the rendered rows in the shadow DOM reflect exactly two items, And the displayed text shows labels "A" and "B"', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create display template
        const tplDisplay = document.createElement('template');
        tplDisplay.setAttribute('slot', 'display');
        tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="label"></span>
          </div>
        `;
        el.appendChild(tplDisplay);

        // Create edit template
        const tplEdit = document.createElement('template');
        tplEdit.setAttribute('slot', 'edit');
        tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="label" />
          </div>
        `;
        el.appendChild(tplEdit);

        // Attach to document
        document.body.appendChild(el);

        // Verify initial state (empty)
        expect(el.data).toEqual([]);

        // Act
        el.data = [{ label: 'A' }, { label: 'B' }];

        // Assert
        expect(el.shadowRoot).not.toBeNull();

        // Check that exactly two rows are rendered (display + edit for each item)
        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRows = el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        expect(displayRows?.length).toBe(2);
        expect(editRows?.length).toBe(2);

        // Check that the labels are correctly displayed
        const displaySpans = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"] [data-bind="label"]'
        );
        expect(displaySpans?.length).toBe(2);
        expect(displaySpans?.[0].textContent).toBe('A');
        expect(displaySpans?.[1].textContent).toBe('B');
      });
    });

    describe('Test 9 — Setting data on a disconnected element defers UI changes until connect', () => {
      test('Given a <ck-editable-array> element that is not attached to the DOM, When I set el.data = [{ label: "A" }], And I immediately inspect the shadow DOM, Then there are either no rendered rows or only minimal scaffolding (no fully rendered row), When I then attach the element to document.body, Then a single row appears in the shadow DOM representing the item { label: "A" }', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create display template
        const tplDisplay = document.createElement('template');
        tplDisplay.setAttribute('slot', 'display');
        tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="label"></span>
          </div>
        `;
        el.appendChild(tplDisplay);

        // Create edit template
        const tplEdit = document.createElement('template');
        tplEdit.setAttribute('slot', 'edit');
        tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="label" />
          </div>
        `;
        el.appendChild(tplEdit);

        // Act - Set data while disconnected
        el.data = [{ label: 'A' }];

        // Assert - Check that no fully rendered rows exist yet
        const displayRowsBeforeConnect = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRowsBeforeConnect =
          el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        // Either no rows at all, or only scaffolding (rows container exists but empty)
        expect(
          displayRowsBeforeConnect?.length === 0 ||
            displayRowsBeforeConnect === null
        ).toBe(true);
        expect(
          editRowsBeforeConnect?.length === 0 || editRowsBeforeConnect === null
        ).toBe(true);

        // Act - Attach to document
        document.body.appendChild(el);

        // Assert - Now the row should be rendered
        const displayRowsAfterConnect = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRowsAfterConnect =
          el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        expect(displayRowsAfterConnect?.length).toBe(1);
        expect(editRowsAfterConnect?.length).toBe(1);

        // Check that the label is correctly displayed
        const displaySpan = el.shadowRoot?.querySelector(
          '[data-mode="display"] [data-bind="label"]'
        );
        expect(displaySpan?.textContent).toBe('A');
      });
    });

    describe('Test 10 — DataChanged event on setter', () => {
      test("Given a <ck-editable-array> element attached to document.body, And an event listener on the element for a datachanged event, When I set el.data = [{ id: 1 }], Then exactly one datachanged event is fired, And the event's detail.data is an array with the item { id: 1 }", () => {
        // Arrange
        const el = new CkEditableArray();
        document.body.appendChild(el);

        let eventCount = 0;
        let capturedEventDetail: unknown = null;

        const eventListener = (event: Event) => {
          eventCount++;
          capturedEventDetail = (event as CustomEvent).detail;
        };

        el.addEventListener('datachanged', eventListener);

        // Act
        el.data = [{ id: 1 }];

        // Assert
        expect(eventCount).toBe(1);
        expect(capturedEventDetail).not.toBeNull();

        const detail = capturedEventDetail as { data: unknown[] };
        expect(Array.isArray(detail.data)).toBe(true);
        expect(detail.data).toHaveLength(1);
        expect(detail.data[0]).toEqual({ id: 1 });

        // Cleanup
        el.removeEventListener('datachanged', eventListener);
      });
    });
  });
});
