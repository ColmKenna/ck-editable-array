import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 3: Lifecycle & Styles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 3.1 — Rendering with empty data', () => {
    describe('Test 3.1.1 — No data: renders scaffolding but no rows', () => {
      test('Given a <ck-editable-array> element whose data property is an empty array, And it is not yet attached to the DOM, When I append it to document.body, Then the element has a shadowRoot, And the shadow root contains the core scaffolding (e.g. a rows container and an add-button container), And there are no rendered rows in the rows container', () => {
        // Arrange
        const el = new CkEditableArray();
        el.data = [];

        // Verify element is not yet attached
        expect(el.isConnected).toBe(false);

        // Act
        document.body.appendChild(el);

        // Assert
        // 1. Element has a shadowRoot
        expect(el.shadowRoot).not.toBeNull();
        expect(el.shadowRoot?.mode).toBe('open');

        // 2. Shadow root contains core scaffolding
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();
        expect(rowsContainer?.tagName.toLowerCase()).toBe('div');

        const addButtonContainer = el.shadowRoot?.querySelector(
          '[part="add-button"]'
        );
        expect(addButtonContainer).not.toBeNull();
        expect(addButtonContainer?.tagName.toLowerCase()).toBe('div');

        // 3. There are no rendered rows in the rows container
        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRows = el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        expect(displayRows?.length).toBe(0);
        expect(editRows?.length).toBe(0);

        // Also verify rows container is empty
        expect(rowsContainer?.children.length).toBe(0);
      });
    });
  });
});
