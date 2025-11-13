import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 4: Core Rendering & Row Modes', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 4.1 — Row creation & per-row attributes', () => {
    describe('Test 4.1.1 — Renders one row per data item', () => {
      test("Given a <ck-editable-array> element attached to document.body, And data set to an array of 3 items, When the component finishes rendering, Then the shadow root's rows container contains exactly 3 row elements, And each row has an attribute like data-row identifying its index", () => {
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

        // Set data to 3 items
        el.data = [
          { label: 'Item 1' },
          { label: 'Item 2' },
          { label: 'Item 3' },
        ];

        // Act - Attach to document
        document.body.appendChild(el);

        // Assert
        // 1. Shadow root's rows container contains exactly 3 row elements (display mode)
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();

        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        expect(displayRows?.length).toBe(3);

        // 2. Each row has a data-row attribute identifying its index
        expect(displayRows?.[0].getAttribute('data-row')).toBe('0');
        expect(displayRows?.[1].getAttribute('data-row')).toBe('1');
        expect(displayRows?.[2].getAttribute('data-row')).toBe('2');

        // Verify content is correct
        const displaySpans = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"] [data-bind="label"]'
        );
        expect(displaySpans?.length).toBe(3);
        expect(displaySpans?.[0].textContent).toBe('Item 1');
        expect(displaySpans?.[1].textContent).toBe('Item 2');
        expect(displaySpans?.[2].textContent).toBe('Item 3');
      });
    });

    describe('Test 4.1.2 — Default row mode is "display"', () => {
      test('Given a <ck-editable-array> element attached to document.body, And data set to at least 1 item, When the component finishes its initial render, Then each rendered row has a data-mode="display" attribute (or equivalent)', () => {
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

        // Set data to at least 1 item
        el.data = [{ label: 'Item 1' }];

        // Act - Attach to document
        document.body.appendChild(el);

        // Assert
        // Each rendered row has a data-mode="display" attribute
        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        expect(displayRows?.length).toBeGreaterThan(0);

        // Verify all display rows have the correct mode attribute
        displayRows?.forEach(row => {
          expect(row.getAttribute('data-mode')).toBe('display');
        });

        // Also verify edit rows exist with correct mode
        const editRows = el.shadowRoot?.querySelectorAll('[data-mode="edit"]');
        expect(editRows?.length).toBeGreaterThan(0);

        editRows?.forEach(row => {
          expect(row.getAttribute('data-mode')).toBe('edit');
        });
      });
    });

    describe('Test 4.1.3 — Deleted items are marked in the DOM', () => {
      test('Given a <ck-editable-array> element attached to document.body, And data set to an array where some items have deleted: true and others do not, When the component renders, Then rows corresponding to deleted items have a data-deleted="true" attribute (or equivalent marker), And rows for non-deleted items do not have that marker', () => {
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

        // Set data with some deleted items
        el.data = [
          { label: 'Item 1', deleted: false },
          { label: 'Item 2', deleted: true },
          { label: 'Item 3', deleted: false },
          { label: 'Item 4', deleted: true },
        ];

        // Act - Attach to document
        document.body.appendChild(el);

        // Assert
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();

        // Get all display rows
        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        expect(displayRows?.length).toBe(4);

        // Verify deleted items have data-deleted="true"
        expect(displayRows?.[0].getAttribute('data-deleted')).toBeNull(); // Item 1: not deleted
        expect(displayRows?.[1].getAttribute('data-deleted')).toBe('true'); // Item 2: deleted
        expect(displayRows?.[2].getAttribute('data-deleted')).toBeNull(); // Item 3: not deleted
        expect(displayRows?.[3].getAttribute('data-deleted')).toBe('true'); // Item 4: deleted

        // Also verify edit rows have the same markers
        const editRows = el.shadowRoot?.querySelectorAll('[data-mode="edit"]');
        expect(editRows?.length).toBe(4);

        expect(editRows?.[0].getAttribute('data-deleted')).toBeNull(); // Item 1: not deleted
        expect(editRows?.[1].getAttribute('data-deleted')).toBe('true'); // Item 2: deleted
        expect(editRows?.[2].getAttribute('data-deleted')).toBeNull(); // Item 3: not deleted
        expect(editRows?.[3].getAttribute('data-deleted')).toBe('true'); // Item 4: deleted
      });
    });
  });
});
