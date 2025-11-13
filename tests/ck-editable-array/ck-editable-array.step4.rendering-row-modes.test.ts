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

describe('Test 4.2 — Slot & wrapper wiring (display/edit content)', () => {
  describe('Test 4.2.1 — Each row has display and edit wrappers', () => {
    test('Given a <ck-editable-array> element with both a slot="display" and a slot="edit" template defined in the light DOM, And data set to at least one item, When the component renders, Then each row in the shadow DOM contains a .display-content wrapper for the display template, And a .edit-content wrapper for the edit template', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="name" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data to at least one item
      el.data = [{ name: 'Item 1' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
      expect(rowsContainer).not.toBeNull();

      // Each row should have a .display-content wrapper
      const displayWrappers =
        el.shadowRoot?.querySelectorAll('.display-content');
      expect(displayWrappers?.length).toBe(1);

      // Each row should have a .edit-content wrapper
      const editWrappers = el.shadowRoot?.querySelectorAll('.edit-content');
      expect(editWrappers?.length).toBe(1);

      // Verify the wrappers contain the cloned template content
      const displayContent = displayWrappers?.[0];
      expect(displayContent?.querySelector('.row-display')).not.toBeNull();

      const editContent = editWrappers?.[0];
      expect(editContent?.querySelector('.row-edit')).not.toBeNull();
    });
  });

  describe('Test 4.2.2 — Display template is cloned per row', () => {
    test("Given a display template that contains some distinctive structure or text (e.g. \"Display {{name}}\"), And data contains 2 items with different name values, When the component renders, Then each row's .display-content contains its own cloned version of the display template, And the content for row 0 includes the first item's name, And the content for row 1 includes the second item's name", () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with distinctive structure
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span class="prefix">Display: </span>
            <span data-bind="name"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="name" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with 2 items with different names
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const displayWrappers =
        el.shadowRoot?.querySelectorAll('.display-content');
      expect(displayWrappers?.length).toBe(2);

      // Row 0 should contain first item's name
      const row0Display = displayWrappers?.[0];
      const row0NameSpan = row0Display?.querySelector(
        '[data-bind="name"]'
      ) as HTMLElement;
      expect(row0NameSpan?.textContent).toBe('Alice');

      // Verify distinctive structure is present
      const row0Prefix = row0Display?.querySelector('.prefix') as HTMLElement;
      expect(row0Prefix?.textContent).toBe('Display: ');

      // Row 1 should contain second item's name
      const row1Display = displayWrappers?.[1];
      const row1NameSpan = row1Display?.querySelector(
        '[data-bind="name"]'
      ) as HTMLElement;
      expect(row1NameSpan?.textContent).toBe('Bob');

      // Verify distinctive structure is present
      const row1Prefix = row1Display?.querySelector('.prefix') as HTMLElement;
      expect(row1Prefix?.textContent).toBe('Display: ');
    });
  });

  describe('Test 4.2.3 — Edit template is cloned per row', () => {
    test("Given an edit template with inputs (for example, <input data-bind=\"name\">), And data has at least 2 items with different name values, When the component renders, Then each row's .edit-content contains its own cloned version of the edit template, And the input in row 0 is bound to the first item's name, And the input in row 1 is bound to the second item's name", () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template with input
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <label>Name:</label>
            <input data-bind="name" type="text" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with 2 items with different names
      el.data = [{ name: 'Charlie' }, { name: 'Diana' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const editWrappers = el.shadowRoot?.querySelectorAll('.edit-content');
      expect(editWrappers?.length).toBe(2);

      // Row 0 input should be bound to first item's name
      const row0Edit = editWrappers?.[0];
      const row0Input = row0Edit?.querySelector(
        '[data-bind="name"]'
      ) as HTMLInputElement;
      expect(row0Input).not.toBeNull();
      expect(row0Input?.value).toBe('Charlie');

      // Verify distinctive structure is present
      const row0Label = row0Edit?.querySelector('label') as HTMLElement;
      expect(row0Label?.textContent).toBe('Name:');

      // Row 1 input should be bound to second item's name
      const row1Edit = editWrappers?.[1];
      const row1Input = row1Edit?.querySelector(
        '[data-bind="name"]'
      ) as HTMLInputElement;
      expect(row1Input).not.toBeNull();
      expect(row1Input?.value).toBe('Diana');

      // Verify distinctive structure is present
      const row1Label = row1Edit?.querySelector('label') as HTMLElement;
      expect(row1Label?.textContent).toBe('Name:');
    });
  });
});

describe('Test 4.3 — Display vs edit visibility (hidden class)', () => {
  describe('Test 4.3.1 — Display mode: show display, hide edit (using hidden class)', () => {
    test('Given a <ck-editable-array> element attached to document.body, And data set so that the initial mode for all rows is display, When the component renders, Then for each row: The .display-content element is visible and does not have the hidden class, The .edit-content element has the hidden class applied', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="name" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data - initial mode should be display for all rows
      el.data = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const displayWrappers =
        el.shadowRoot?.querySelectorAll('.display-content');
      const editWrappers = el.shadowRoot?.querySelectorAll('.edit-content');

      expect(displayWrappers?.length).toBe(3);
      expect(editWrappers?.length).toBe(3);

      // For each row, display should be visible (no hidden class)
      // and edit should be hidden (has hidden class)
      displayWrappers?.forEach((displayWrapper, index) => {
        expect(displayWrapper.classList.contains('hidden')).toBe(false);
      });

      editWrappers?.forEach((editWrapper, index) => {
        expect(editWrapper.classList.contains('hidden')).toBe(true);
      });
    });
  });

  describe('Test 4.3.2 — Edit mode row: show edit, hide display (using hidden class)', () => {
    test('Given a <ck-editable-array> element attached to document.body, And at least one row is put into edit mode via whatever action or configuration is appropriate (e.g. a new row, or a toggle from another phase), When the component renders that row in edit mode, Then for that row: .edit-content is visible and does not have the hidden class, .display-content has the hidden class applied', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="name" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with one row marked as editing
      el.data = [{ name: 'Alice', editing: true }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const displayWrapper = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const editWrapper = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      expect(displayWrapper).not.toBeNull();
      expect(editWrapper).not.toBeNull();

      // Display should be hidden
      expect(displayWrapper?.classList.contains('hidden')).toBe(true);

      // Edit should be visible (no hidden class)
      expect(editWrapper?.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Test 4.3.3 — Non-active rows remain in display mode when another row is editing', () => {
    test('Given a <ck-editable-array> element with 3 data items, And the element is attached to document.body, And row 1 is in edit mode (e.g. after a toggle, or "Add" creating an editable row), When the component renders, Then row 1 shows .edit-content (no hidden) and hides .display-content (with hidden), And rows 0 and 2 remain in display mode: their .display-content is visible with no hidden class, and their .edit-content has hidden', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="name" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with row 1 in edit mode, others in display mode
      el.data = [
        { name: 'Alice', editing: false },
        { name: 'Bob', editing: true },
        { name: 'Charlie', editing: false },
      ];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert - Row 0 (display mode)
      const display0 = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const edit0 = el.shadowRoot?.querySelector('.edit-content[data-row="0"]');
      expect(display0?.classList.contains('hidden')).toBe(false);
      expect(edit0?.classList.contains('hidden')).toBe(true);

      // Assert - Row 1 (edit mode)
      const display1 = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const edit1 = el.shadowRoot?.querySelector('.edit-content[data-row="1"]');
      expect(display1?.classList.contains('hidden')).toBe(true);
      expect(edit1?.classList.contains('hidden')).toBe(false);

      // Assert - Row 2 (display mode)
      const display2 = el.shadowRoot?.querySelector(
        '.display-content[data-row="2"]'
      );
      const edit2 = el.shadowRoot?.querySelector('.edit-content[data-row="2"]');
      expect(display2?.classList.contains('hidden')).toBe(false);
      expect(edit2?.classList.contains('hidden')).toBe(true);
    });
  });
});
