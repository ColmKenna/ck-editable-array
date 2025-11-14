import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 5.1: Add Button Surface & Defaults', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 5.1.1 — Default Add button renders when no custom template is provided', () => {
    test('Given a <ck-editable-array> element with no slot="add-button" defined in the light DOM, And the element is attached to document.body, When the component finishes initial render, Then the shadow root contains an Add button in the add-button container, And this button is identifiable (for example via data-action="add" or a similar attribute), And the button is enabled and focusable when no row is in edit mode', () => {
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

      // Set some initial data (all in display mode)
      el.data = [{ name: 'Alice' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      // 1. Shadow root contains an Add button in the add-button container
      const addButtonContainer = el.shadowRoot?.querySelector(
        '[part="add-button"]'
      );
      expect(addButtonContainer).not.toBeNull();

      const addButton = addButtonContainer?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton).not.toBeNull();

      // 2. Button is identifiable via data-action="add"
      expect(addButton?.getAttribute('data-action')).toBe('add');

      // 3. Button is a semantic button element
      expect(addButton?.tagName.toLowerCase()).toBe('button');

      // 4. Button is enabled and focusable when no row is in edit mode
      expect(addButton?.disabled).toBe(false);
      expect(addButton?.hasAttribute('disabled')).toBe(false);

      // Verify button is actually focusable (button exists and is not disabled)
      // Note: Shadow DOM elements may not become document.activeElement in JSDOM
      expect(addButton?.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Test 5.1.2 — Custom Add button template is used instead of the default', () => {
    test('Given a <ck-editable-array> element in the light DOM, And a custom <button slot="add-button">Add Person</button> provided as a child, And the element is attached to document.body, When the component renders, Then the Add button visible in the shadow root uses the text "Add Person" (from the custom template), And the default Add button is not rendered', () => {
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

      // Create custom add button template
      const customAddButton = document.createElement('template');
      customAddButton.setAttribute('slot', 'add-button');
      customAddButton.innerHTML =
        '<button data-action="add">Add Person</button>';
      el.appendChild(customAddButton);

      // Set some initial data
      el.data = [{ name: 'Alice' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      // 1. Add button container exists
      const addButtonContainer = el.shadowRoot?.querySelector(
        '[part="add-button"]'
      );
      expect(addButtonContainer).not.toBeNull();

      // 2. Custom Add button is rendered with custom text
      const addButton = addButtonContainer?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton).not.toBeNull();
      expect(addButton?.textContent?.trim()).toBe('Add Person');

      // 3. Only one Add button exists (no default button rendered)
      const allAddButtons = addButtonContainer?.querySelectorAll(
        '[data-action="add"]'
      );
      expect(allAddButtons?.length).toBe(1);
    });
  });

  describe('Test 5.1.3 — Add button has proper button semantics', () => {
    test('Given a <ck-editable-array> element attached to document.body, When the Add button is rendered, Then it is a semantic button element or equivalent, And if it is a <button>, it has type="button" so it does not accidentally submit outer forms', () => {
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

      // Set some initial data
      el.data = [{ name: 'Alice' }];

      // Act - Attach to document
      document.body.appendChild(el);

      // Assert
      const addButtonContainer = el.shadowRoot?.querySelector(
        '[part="add-button"]'
      );
      expect(addButtonContainer).not.toBeNull();

      const addButton = addButtonContainer?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton).not.toBeNull();

      // 1. It is a semantic button element
      expect(addButton?.tagName.toLowerCase()).toBe('button');

      // 2. It has type="button" to prevent form submission
      expect(addButton?.type).toBe('button');
      expect(addButton?.getAttribute('type')).toBe('button');
    });
  });
});

describe('CkEditableArray - Step 5.2: Clicking Add Creates a New Row', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 5.2.1 — Clicking Add appends a new row to the DOM', () => {
    test('Given a <ck-editable-array> element attached to document.body, And its data is initially an array of 2 items, When I click the Add button once, And the component finishes updating, Then the rows container in the shadow root now shows 3 rows, And the first 2 rows still represent the original items, And the 3rd row represents the newly added item', () => {
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

      // Set initial data with 2 items
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - 2 rows
      const initialDisplayRows = el.shadowRoot?.querySelectorAll(
        '[data-mode="display"]'
      );
      expect(initialDisplayRows?.length).toBe(2);

      // Act - Click the Add button
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton).not.toBeNull();
      addButton?.click();

      // Assert
      // 1. Rows container now shows 3 rows
      const displayRows = el.shadowRoot?.querySelectorAll(
        '[data-mode="display"]'
      );
      expect(displayRows?.length).toBe(3);

      // 2. First 2 rows still represent the original items
      const row0Name = displayRows?.[0].querySelector(
        '[data-bind="name"]'
      ) as HTMLElement;
      const row1Name = displayRows?.[1].querySelector(
        '[data-bind="name"]'
      ) as HTMLElement;
      expect(row0Name?.textContent).toBe('Alice');
      expect(row1Name?.textContent).toBe('Bob');

      // 3. 3rd row represents the newly added item (empty by default)
      const row2Name = displayRows?.[2].querySelector(
        '[data-bind="name"]'
      ) as HTMLElement;
      expect(row2Name?.textContent).toBe(''); // newItemFactory returns {}
    });
  });

  describe('Test 5.2.2 — Clicking Add updates the data exposed by the component', () => {
    test('Given a <ck-editable-array> element attached to document.body, And el.data is initially an array of 2 items, When I click the Add button, And then read el.data, Then it returns an array of 3 items, And the first 2 items are unchanged, And the 3rd item equals whatever the newItemFactory() returns (plus any allowed bookkeeping fields like deleted: false)', () => {
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

      // Set custom newItemFactory
      el.newItemFactory = () => ({ name: 'New Person', age: 0 });

      // Set initial data with 2 items
      el.data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state
      expect(el.data.length).toBe(2);

      // Act - Click the Add button
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton).not.toBeNull();
      addButton?.click();

      // Assert
      // 1. el.data returns an array of 3 items
      const updatedData = el.data as Array<Record<string, unknown>>;
      expect(updatedData.length).toBe(3);

      // 2. First 2 items are unchanged
      expect(updatedData[0]).toEqual({ name: 'Alice', age: 30 });
      expect(updatedData[1]).toEqual({ name: 'Bob', age: 25 });

      // 3. 3rd item equals what newItemFactory returns (plus editing: true)
      expect(updatedData[2].name).toBe('New Person');
      expect(updatedData[2].age).toBe(0);
      // New items should be in editing mode
      expect(updatedData[2].editing).toBe(true);
    });
  });

  describe('Test 5.2.3 — Add emits datachanged with the new array', () => {
    test('Given a <ck-editable-array> element attached to document.body, And an event listener on the element for the datachanged event, And el.data initially set to 2 items, When I click the Add button, Then exactly one datachanged event is fired, And its detail.data array has 3 items (the two originals plus the new one)', () => {
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

      // Set initial data with 2 items
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Setup event listener
      let eventCount = 0;
      let lastEventData: unknown = null;

      el.addEventListener('datachanged', (event: Event) => {
        eventCount++;
        const customEvent = event as CustomEvent;
        lastEventData = customEvent.detail.data;
      });

      // Act - Click the Add button
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton).not.toBeNull();
      addButton?.click();

      // Assert
      // 1. Exactly one datachanged event is fired
      expect(eventCount).toBe(1);

      // 2. detail.data array has 3 items
      expect(lastEventData).not.toBeNull();
      expect(Array.isArray(lastEventData)).toBe(true);

      const dataArray = lastEventData as Array<Record<string, unknown>>;
      expect(dataArray.length).toBe(3);

      // 3. First 2 items are the originals
      expect(dataArray[0].name).toBe('Alice');
      expect(dataArray[1].name).toBe('Bob');

      // 4. 3rd item is the new one
      expect(dataArray[2]).toBeDefined();
      expect(dataArray[2].editing).toBe(true);
    });
  });
});

describe('CkEditableArray - Step 5.3: New Row Starts in Edit Mode', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 5.3.1 — New row is rendered in edit mode', () => {
    test('Given a <ck-editable-array> element attached to document.body, And data with at least one existing item, all rows currently in display mode, When I click the Add button, And the component finishes updating, Then the newly created row is marked as being in edit mode (for example data-mode="edit"), And all existing rows remain in display mode', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
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
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with 2 items in display mode
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - all rows in display mode
      const initialDisplayRows = el.shadowRoot?.querySelectorAll(
        '[data-mode="display"]:not(.hidden)'
      );
      expect(initialDisplayRows?.length).toBe(2);

      // Act - Click the Add button
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton).not.toBeNull();
      addButton?.click();

      // Assert
      // 1. All display-mode wrappers exist (3 total)
      const allDisplayWrappers = el.shadowRoot?.querySelectorAll(
        '[data-mode="display"]'
      );
      expect(allDisplayWrappers?.length).toBe(3);

      // 2. All edit-mode wrappers exist (3 total)
      const allEditWrappers =
        el.shadowRoot?.querySelectorAll('[data-mode="edit"]');
      expect(allEditWrappers?.length).toBe(3);

      // 3. First 2 rows remain in display mode (display visible, edit hidden)
      const row0Display = el.shadowRoot?.querySelector(
        '[data-mode="display"][data-row="0"]'
      );
      const row0Edit = el.shadowRoot?.querySelector(
        '[data-mode="edit"][data-row="0"]'
      );
      expect(row0Display?.classList.contains('hidden')).toBe(false);
      expect(row0Edit?.classList.contains('hidden')).toBe(true);

      const row1Display = el.shadowRoot?.querySelector(
        '[data-mode="display"][data-row="1"]'
      );
      const row1Edit = el.shadowRoot?.querySelector(
        '[data-mode="edit"][data-row="1"]'
      );
      expect(row1Display?.classList.contains('hidden')).toBe(false);
      expect(row1Edit?.classList.contains('hidden')).toBe(true);

      // 4. New row (row 2) is in edit mode (display hidden, edit visible)
      const row2Display = el.shadowRoot?.querySelector(
        '[data-mode="display"][data-row="2"]'
      );
      const row2Edit = el.shadowRoot?.querySelector(
        '[data-mode="edit"][data-row="2"]'
      );
      expect(row2Display?.classList.contains('hidden')).toBe(true);
      expect(row2Edit?.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Test 5.3.2 — New row shows edit content and hides display content (with hidden class)', () => {
    test("Given the scenario above where a new row was just added, When I inspect the new row's content, Then the .edit-content for that new row is visible and does not have the hidden class, And the .display-content for that new row has the hidden class applied", () => {
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

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Act - Click the Add button
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      // Assert - Check the new row (row 1)
      const newRowDisplay = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const newRowEdit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );

      // 1. Edit content is visible (no hidden class)
      expect(newRowEdit).not.toBeNull();
      expect(newRowEdit?.classList.contains('hidden')).toBe(false);

      // 2. Display content has hidden class
      expect(newRowDisplay).not.toBeNull();
      expect(newRowDisplay?.classList.contains('hidden')).toBe(true);

      // 3. Verify edit content is actually accessible
      const editInput = newRowEdit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      expect(editInput).not.toBeNull();
      expect(editInput?.disabled).toBe(false);
    });
  });

  describe("Test 5.3.3 — New row's toggle control is hidden while editing", () => {
    test("Given a row that has just been created via the Add button and is in edit mode, When I inspect that row's controls, Then the row's toggle control (the one that usually switches between display/edit) is hidden or not rendered, And instead the edit-mode actions (such as Save/Cancel, or equivalents) are visible", () => {
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

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Act - Click the Add button
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      // Assert - Check the new row (row 1)
      const newRowDisplay = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const newRowEdit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );

      // 1. Display wrapper (containing toggle) is hidden
      expect(newRowDisplay?.classList.contains('hidden')).toBe(true);

      // 2. Toggle control exists but is hidden via parent wrapper
      const toggleControl = newRowDisplay?.querySelector(
        '[data-action="toggle"]'
      );
      expect(toggleControl).not.toBeNull();
      // The toggle is not directly hidden, but its parent wrapper is
      expect(newRowDisplay?.classList.contains('hidden')).toBe(true);

      // 3. Edit wrapper is visible
      expect(newRowEdit?.classList.contains('hidden')).toBe(false);

      // 4. Edit-mode actions (Save/Cancel) are visible
      const saveButton = newRowEdit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      const cancelButton = newRowEdit?.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;

      expect(saveButton).not.toBeNull();
      expect(cancelButton).not.toBeNull();

      // Edit wrapper is visible, so controls are accessible
      expect(newRowEdit?.classList.contains('hidden')).toBe(false);
    });
  });
});

describe('CkEditableArray - Step 5.4: Exclusive Locking When a New Row is Editing', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 5.4.1 — Other rows are locked when the new row enters edit mode', () => {
    test('Given a <ck-editable-array> element attached to document.body, And data with at least 2 existing items, When I click the Add button and a new row appears in edit mode, Then each existing row (not the new one) is marked as locked (for example data-locked="true"), And each existing row has ARIA attributes indicating it is disabled (for example aria-disabled="true"), And each existing row has the inert attribute so it cannot be interacted with', () => {
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
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with 2 items
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - no rows locked
      const initialRow0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const initialRow1Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(initialRow0Display?.hasAttribute('data-locked')).toBe(false);
      expect(initialRow1Display?.hasAttribute('data-locked')).toBe(false);

      // Act - Click the Add button
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      // Assert
      // 1. Existing rows (0 and 1) are marked as locked
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row1Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );

      expect(row0Display?.getAttribute('data-locked')).toBe('true');
      expect(row1Display?.getAttribute('data-locked')).toBe('true');

      // 2. Existing rows have ARIA disabled attributes
      expect(row0Display?.getAttribute('aria-disabled')).toBe('true');
      expect(row1Display?.getAttribute('aria-disabled')).toBe('true');

      // 3. Existing rows have inert attribute
      expect(row0Display?.hasAttribute('inert')).toBe(true);
      expect(row1Display?.hasAttribute('inert')).toBe(true);

      // 4. New row (row 2) is NOT locked
      const row2Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="2"]'
      );
      expect(row2Edit?.hasAttribute('data-locked')).toBe(false);
      expect(row2Edit?.hasAttribute('aria-disabled')).toBe(false);
      expect(row2Edit?.hasAttribute('inert')).toBe(false);
    });
  });

  describe("Test 5.4.2 — Existing rows' toggle controls are disabled while new row is editing", () => {
    test('Given the same scenario where the new row is in edit mode and older rows are locked, When I try to click the toggle control on an existing row, Then that click does not switch the existing row into edit mode, And the existing row remains in display mode, And the new row remains the only row in edit mode', () => {
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
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with 2 items
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Click Add button to create new row in edit mode
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      // Verify initial state - row 0 in display mode, row 2 in edit mode
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditBefore = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayBefore?.classList.contains('hidden')).toBe(false);
      expect(row0EditBefore?.classList.contains('hidden')).toBe(true);

      // Act - Try to click toggle on existing row 0
      const row0Toggle = row0DisplayBefore?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(row0Toggle).not.toBeNull();
      row0Toggle?.click();

      // Assert
      // 1. Row 0 remains in display mode (toggle click had no effect)
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);
      expect(row0EditAfter?.classList.contains('hidden')).toBe(true);

      // 2. New row (row 2) remains the only row in edit mode
      const row2Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="2"]'
      );
      const row2Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="2"]'
      );
      expect(row2Display?.classList.contains('hidden')).toBe(true);
      expect(row2Edit?.classList.contains('hidden')).toBe(false);

      // 3. Verify toggle button is disabled
      expect(row0Toggle?.disabled).toBe(true);
    });
  });

  describe('Test 5.4.3 — Add button becomes disabled while a row is editing', () => {
    test('Given a <ck-editable-array> element with at least one row, And the Add button is initially enabled, When I cause a row to enter edit mode via the Add button, Then the Add button becomes disabled (for example disabled attribute present), And the Add button also reflects disabled state via ARIA, such as aria-disabled="true", And clicking the Add button again while disabled has no effect on the number of rows', () => {
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

      // Set initial data with 1 item
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Verify Add button is initially enabled
      const addButtonBefore = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButtonBefore?.disabled).toBe(false);

      // Act - Click Add button to create new row in edit mode
      addButtonBefore?.click();

      // Assert
      // 1. Add button becomes disabled
      const addButtonAfter = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButtonAfter?.disabled).toBe(true);
      expect(addButtonAfter?.hasAttribute('disabled')).toBe(true);

      // 2. Add button has ARIA disabled attribute
      expect(addButtonAfter?.getAttribute('aria-disabled')).toBe('true');

      // 3. Verify we have 2 rows now
      const rowsAfterFirstAdd = el.shadowRoot?.querySelectorAll(
        '[data-mode="display"]'
      );
      expect(rowsAfterFirstAdd?.length).toBe(2);

      // 4. Try to click Add button again while disabled
      addButtonAfter?.click();

      // 5. Number of rows should remain 2 (click had no effect)
      const rowsAfterSecondClick = el.shadowRoot?.querySelectorAll(
        '[data-mode="display"]'
      );
      expect(rowsAfterSecondClick?.length).toBe(2);
    });
  });
});
