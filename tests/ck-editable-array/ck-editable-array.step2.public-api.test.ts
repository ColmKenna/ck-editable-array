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
  });
});
