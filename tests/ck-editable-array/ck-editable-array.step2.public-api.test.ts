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
  });
});
