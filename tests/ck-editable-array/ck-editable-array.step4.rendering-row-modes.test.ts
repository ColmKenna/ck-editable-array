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
      displayWrappers?.forEach(displayWrapper => {
        expect(displayWrapper.classList.contains('hidden')).toBe(false);
      });

      editWrappers?.forEach(editWrapper => {
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

describe('Test 4.4 — Toggle button surface (no events yet, just DOM shape)', () => {
  describe('Test 4.4.1 — Each row has a toggle control', () => {
    test('Given a <ck-editable-array> element attached to document.body, And data set to at least one item, When the component renders, Then each row contains a toggle control element (button or link), And this element is identifiable via data-action="toggle" or an equivalent marker', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with toggle control
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
            <button data-action="toggle">Edit</button>
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
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const displayWrappers =
        el.shadowRoot?.querySelectorAll('.display-content');
      expect(displayWrappers?.length).toBe(2);

      // Each row should have a toggle control
      displayWrappers?.forEach(displayWrapper => {
        const toggleControl = displayWrapper.querySelector(
          '[data-action="toggle"]'
        );
        expect(toggleControl).not.toBeNull();
        expect(toggleControl?.tagName.toLowerCase()).toBe('button');
      });
    });
  });

  describe('Test 4.4.2 — Toggle control is visible in display mode', () => {
    test("Given a <ck-editable-array> element with at least one row in display mode, When the component renders, Then the row's toggle control is visible and focusable, And the toggle control is not hidden by the hidden class or display:none", () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with toggle control
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
            <button data-action="toggle">Edit</button>
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

      // Set data - row in display mode (no editing flag)
      el.data = [{ name: 'Alice' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const displayWrapper = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(displayWrapper).not.toBeNull();

      // Display wrapper should be visible (no hidden class)
      expect(displayWrapper?.classList.contains('hidden')).toBe(false);

      // Toggle control should exist and be visible
      const toggleControl = displayWrapper?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(toggleControl).not.toBeNull();
      expect(toggleControl?.classList.contains('hidden')).toBe(false);

      // Toggle control should be focusable (not disabled)
      expect(toggleControl?.disabled).toBe(false);

      // Verify it's actually a button element
      expect(toggleControl?.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Test 4.4.3 — Toggle control is hidden when row is in edit mode (per your spec)', () => {
    test('Given a <ck-editable-array> element, And a row is in edit mode (for example, after clicking its toggle in a later phase, or a new row created by Add), When the component renders that row in edit mode, Then the toggle control for that row is hidden (e.g. has the hidden class or is removed from the DOM), And the edit controls (e.g. save/cancel) for that row are visible', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with toggle control
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="name"></span>
            <button data-action="toggle">Edit</button>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template with save/cancel controls
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="name" />
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with row in edit mode
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

      // Display wrapper should be hidden (has hidden class)
      expect(displayWrapper?.classList.contains('hidden')).toBe(true);

      // Edit wrapper should be visible (no hidden class)
      expect(editWrapper?.classList.contains('hidden')).toBe(false);

      // Toggle control should be hidden (inside hidden display wrapper)
      const toggleControl = displayWrapper?.querySelector(
        '[data-action="toggle"]'
      );
      expect(toggleControl).not.toBeNull();
      // The toggle is not directly hidden, but its parent wrapper is
      expect(displayWrapper?.classList.contains('hidden')).toBe(true);

      // Edit controls should be visible
      const saveButton = editWrapper?.querySelector('[data-action="save"]');
      const cancelButton = editWrapper?.querySelector('[data-action="cancel"]');
      expect(saveButton).not.toBeNull();
      expect(cancelButton).not.toBeNull();

      // Edit wrapper is visible, so controls are accessible
      expect(editWrapper?.classList.contains('hidden')).toBe(false);
    });
  });
});

describe('Test 4.5 — Input naming & binding sanity checks', () => {
  describe('Test 4.5.1 — Inputs in edit mode use name[index].field naming pattern', () => {
    test('Given a <ck-editable-array> element attached to document.body, And it has a name="person" attribute, And data has at least 2 items with object properties like { address1, address2 }, When the component renders rows with edit templates using inputs bound to address1 and address2, Then the edit input for address1 in row 0 has an HTML name like person[0].address1, And the edit input for address2 in row 1 has a name like person[1].address2', () => {
      // Arrange
      const el = new CkEditableArray();
      el.setAttribute('name', 'person');

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="address1"></span>
            <span data-bind="address2"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template with inputs
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="address1" />
            <input data-bind="address2" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with at least 2 items
      el.data = [
        { address1: '123 Main St', address2: 'Apt 1' },
        { address1: '456 Oak Ave', address2: 'Suite 200' },
      ];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert - Row 0 inputs
      const editWrapper0 = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const address1Input0 = editWrapper0?.querySelector(
        'input[data-bind="address1"]'
      ) as HTMLInputElement;
      const address2Input0 = editWrapper0?.querySelector(
        'input[data-bind="address2"]'
      ) as HTMLInputElement;

      expect(address1Input0).not.toBeNull();
      expect(address1Input0?.name).toBe('person[0].address1');
      expect(address2Input0).not.toBeNull();
      expect(address2Input0?.name).toBe('person[0].address2');

      // Assert - Row 1 inputs
      const editWrapper1 = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      const address1Input1 = editWrapper1?.querySelector(
        'input[data-bind="address1"]'
      ) as HTMLInputElement;
      const address2Input1 = editWrapper1?.querySelector(
        'input[data-bind="address2"]'
      ) as HTMLInputElement;

      expect(address1Input1).not.toBeNull();
      expect(address1Input1?.name).toBe('person[1].address1');
      expect(address2Input1).not.toBeNull();
      expect(address2Input1?.name).toBe('person[1].address2');
    });
  });

  describe('Test 4.5.2 — Display binding mirrors the current data values', () => {
    test('Given a <ck-editable-array> element attached to document.body, And data contains items with address1 and address2 set to distinct values, When the component renders with a display template using <span data-bind="address1"> and <span data-bind="address2">, Then the row\'s display spans show the correct text for address1 and address2 for each index', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="address1"></span>
            <span data-bind="address2"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="address1" />
            <input data-bind="address2" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with distinct values
      el.data = [
        { address1: '123 Main St', address2: 'Apt 1' },
        { address1: '456 Oak Ave', address2: 'Suite 200' },
        { address1: '789 Pine Rd', address2: 'Unit 5' },
      ];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert - Row 0 display
      const displayWrapper0 = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const address1Span0 = displayWrapper0?.querySelector(
        '[data-bind="address1"]'
      ) as HTMLElement;
      const address2Span0 = displayWrapper0?.querySelector(
        '[data-bind="address2"]'
      ) as HTMLElement;

      expect(address1Span0?.textContent).toBe('123 Main St');
      expect(address2Span0?.textContent).toBe('Apt 1');

      // Assert - Row 1 display
      const displayWrapper1 = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const address1Span1 = displayWrapper1?.querySelector(
        '[data-bind="address1"]'
      ) as HTMLElement;
      const address2Span1 = displayWrapper1?.querySelector(
        '[data-bind="address2"]'
      ) as HTMLElement;

      expect(address1Span1?.textContent).toBe('456 Oak Ave');
      expect(address2Span1?.textContent).toBe('Suite 200');

      // Assert - Row 2 display
      const displayWrapper2 = el.shadowRoot?.querySelector(
        '.display-content[data-row="2"]'
      );
      const address1Span2 = displayWrapper2?.querySelector(
        '[data-bind="address1"]'
      ) as HTMLElement;
      const address2Span2 = displayWrapper2?.querySelector(
        '[data-bind="address2"]'
      ) as HTMLElement;

      expect(address1Span2?.textContent).toBe('789 Pine Rd');
      expect(address2Span2?.textContent).toBe('Unit 5');
    });
  });

  describe('Test 4.5.3 — Empty or missing fields render as empty display text', () => {
    test('Given a <ck-editable-array> element attached to document.body, And data contains an item where some expected field (e.g. address2) is missing or null, When the component renders using display spans bound with data-bind="address2", Then the display span for address2 in that row renders as empty (no "undefined" / "null" text)', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="address1"></span>
            <span data-bind="address2"></span>
          </div>
        `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="address1" />
            <input data-bind="address2" />
          </div>
        `;
      el.appendChild(tplEdit);

      // Set data with missing/null fields
      el.data = [
        { address1: '123 Main St', address2: null },
        { address1: '456 Oak Ave' }, // address2 missing
        { address1: '789 Pine Rd', address2: undefined },
      ];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert - Row 0 (address2 is null)
      const displayWrapper0 = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const address2Span0 = displayWrapper0?.querySelector(
        '[data-bind="address2"]'
      ) as HTMLElement;
      expect(address2Span0?.textContent).toBe('');
      expect(address2Span0?.textContent).not.toBe('null');

      // Assert - Row 1 (address2 is missing)
      const displayWrapper1 = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const address2Span1 = displayWrapper1?.querySelector(
        '[data-bind="address2"]'
      ) as HTMLElement;
      expect(address2Span1?.textContent).toBe('');
      expect(address2Span1?.textContent).not.toBe('undefined');

      // Assert - Row 2 (address2 is undefined)
      const displayWrapper2 = el.shadowRoot?.querySelector(
        '.display-content[data-row="2"]'
      );
      const address2Span2 = displayWrapper2?.querySelector(
        '[data-bind="address2"]'
      ) as HTMLElement;
      expect(address2Span2?.textContent).toBe('');
      expect(address2Span2?.textContent).not.toBe('undefined');

      // Verify address1 still renders correctly
      const address1Span0 = displayWrapper0?.querySelector(
        '[data-bind="address1"]'
      ) as HTMLElement;
      expect(address1Span0?.textContent).toBe('123 Main St');
    });
  });
});
