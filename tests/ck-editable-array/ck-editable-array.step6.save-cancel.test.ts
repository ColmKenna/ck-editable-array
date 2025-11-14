import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 6.1: Save Button Behavior', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 6.1.1 — Clicking Save commits changes and switches row to display mode', () => {
    test('Given a <ck-editable-array> element attached to document.body, And a row is in edit mode with modified input values, When I click the Save button for that row, Then the row switches to display mode (showing .display-content, hiding .edit-content), And the modified values are committed to the data array, And the editing flag is removed from that row', () => {
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

      // Create edit template with Save button
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

      // Click Add to create a new row in edit mode
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      // Verify row is in edit mode
      const editWrapper = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(editWrapper?.classList.contains('hidden')).toBe(false);

      // Modify the input value
      const nameInput = editWrapper?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      expect(nameInput).not.toBeNull();
      nameInput.value = 'Bob';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Act - Click Save button
      const saveButton = editWrapper?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      expect(saveButton).not.toBeNull();
      saveButton?.click();

      // Assert
      // 1. Row switches to display mode
      const displayWrapperAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const editWrapperAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(displayWrapperAfter?.classList.contains('hidden')).toBe(false);
      expect(editWrapperAfter?.classList.contains('hidden')).toBe(true);

      // 2. Modified values are committed to data
      const currentData = el.data as Array<Record<string, unknown>>;
      expect(currentData[1].name).toBe('Bob');

      // 3. Editing flag is removed
      expect(currentData[1].editing).toBeUndefined();
    });
  });

  describe('Test 6.1.2 — Save unlocks other rows and re-enables Add button', () => {
    test('Given a <ck-editable-array> element with multiple rows, And one row is in edit mode (causing other rows to be locked), When I click Save on the editing row, Then all other rows are unlocked (data-locked removed, aria-disabled removed, inert removed), And the Add button is re-enabled', () => {
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

      // Set initial data with 2 rows
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Click Add to create a new row in edit mode
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      // Verify other rows are locked
      const row0DisplayLocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayLocked?.getAttribute('data-locked')).toBe('true');

      // Verify Add button is disabled
      const addButtonLocked = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButtonLocked?.disabled).toBe(true);

      // Act - Click Save button on the editing row
      const editWrapper = el.shadowRoot?.querySelector(
        '.edit-content[data-row="2"]'
      );
      const saveButton = editWrapper?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      saveButton?.click();

      // Assert
      // 1. Other rows are unlocked
      const row0DisplayUnlocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row1DisplayUnlocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );

      expect(row0DisplayUnlocked?.hasAttribute('data-locked')).toBe(false);
      expect(row0DisplayUnlocked?.hasAttribute('aria-disabled')).toBe(false);
      expect(row0DisplayUnlocked?.hasAttribute('inert')).toBe(false);

      expect(row1DisplayUnlocked?.hasAttribute('data-locked')).toBe(false);
      expect(row1DisplayUnlocked?.hasAttribute('aria-disabled')).toBe(false);
      expect(row1DisplayUnlocked?.hasAttribute('inert')).toBe(false);

      // 2. Add button is re-enabled
      const addButtonUnlocked = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButtonUnlocked?.disabled).toBe(false);

      // 3. Toggle controls are re-enabled
      const row0Toggle = row0DisplayUnlocked?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(row0Toggle?.disabled).toBe(false);
    });
  });

  describe('Test 6.1.3 — Save dispatches datachanged event', () => {
    test('Given a <ck-editable-array> element with a row in edit mode, And an event listener for datachanged, When I click Save on the editing row, Then exactly one datachanged event is fired, And the event detail contains the updated data array with the editing flag removed', () => {
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
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Click Add to create a new row in edit mode
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      // Setup event listener
      let eventCount = 0;
      let lastEventData: unknown = null;

      el.addEventListener('datachanged', (event: Event) => {
        eventCount++;
        const customEvent = event as CustomEvent;
        lastEventData = customEvent.detail.data;
      });

      // Act - Click Save button
      const editWrapper = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      const saveButton = editWrapper?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      saveButton?.click();

      // Assert
      // 1. Exactly one datachanged event is fired
      expect(eventCount).toBe(1);

      // 2. Event detail contains updated data
      expect(lastEventData).not.toBeNull();
      const dataArray = lastEventData as Array<Record<string, unknown>>;
      expect(dataArray.length).toBe(2);

      // 3. Editing flag is removed from the saved row
      expect(dataArray[1].editing).toBeUndefined();
    });
  });
});

describe('CkEditableArray - Step 6.2: Toggle Events & Basic Mode Switching', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 6.2.1 — Toggle from display to edit fires before/after events', () => {
    test('Given a <ck-editable-array> element attached to document.body, And at least 2 rows rendered in display mode, And event listeners registered for beforetogglemode and aftertogglemode on the element, When I click the toggle control on row n, Then a beforetogglemode event is fired once with detail including: index: n, from: "display", to: "edit", And if the event is not canceled in the listener, a subsequent aftertogglemode event fires once with detail including: index: n, mode: "edit"', () => {
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
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with 2 rows in display mode
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Setup event listeners
      let beforeEventCount = 0;
      let afterEventCount = 0;
      let beforeEventDetail: unknown = null;
      let afterEventDetail: unknown = null;

      el.addEventListener('beforetogglemode', (event: Event) => {
        beforeEventCount++;
        const customEvent = event as CustomEvent;
        beforeEventDetail = customEvent.detail;
      });

      el.addEventListener('aftertogglemode', (event: Event) => {
        afterEventCount++;
        const customEvent = event as CustomEvent;
        afterEventDetail = customEvent.detail;
      });

      // Act - Click toggle control on row 1
      const row1Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const toggleButton = row1Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(toggleButton).not.toBeNull();
      toggleButton?.click();

      // Assert
      // 1. beforetogglemode event fired once
      expect(beforeEventCount).toBe(1);

      // 2. beforetogglemode detail includes correct information
      const beforeDetail = beforeEventDetail as Record<string, unknown>;
      expect(beforeDetail.index).toBe(1);
      expect(beforeDetail.from).toBe('display');
      expect(beforeDetail.to).toBe('edit');

      // 3. aftertogglemode event fired once
      expect(afterEventCount).toBe(1);

      // 4. aftertogglemode detail includes correct information
      const afterDetail = afterEventDetail as Record<string, unknown>;
      expect(afterDetail.index).toBe(1);
      expect(afterDetail.mode).toBe('edit');

      // 5. Row is now in edit mode
      const row1DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const row1EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(row1DisplayAfter?.classList.contains('hidden')).toBe(true);
      expect(row1EditAfter?.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Test 6.2.2 — Canceling beforetogglemode prevents the mode change', () => {
    test('Given the same setup as above, And the beforetogglemode listener calls event.preventDefault(), When I click the toggle control for row n, Then the row remains in display mode, And the .display-content remains visible while .edit-content stays hidden, And aftertogglemode is not fired', () => {
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
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with 2 rows in display mode
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Setup event listeners - preventDefault on beforetogglemode
      let beforeEventCount = 0;
      let afterEventCount = 0;

      el.addEventListener('beforetogglemode', (event: Event) => {
        beforeEventCount++;
        event.preventDefault(); // Cancel the toggle
      });

      el.addEventListener('aftertogglemode', () => {
        afterEventCount++;
      });

      // Verify initial state - row 1 in display mode
      const row1DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const row1EditBefore = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(row1DisplayBefore?.classList.contains('hidden')).toBe(false);
      expect(row1EditBefore?.classList.contains('hidden')).toBe(true);

      // Act - Click toggle control on row 1
      const toggleButton = row1DisplayBefore?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Assert
      // 1. beforetogglemode event fired once
      expect(beforeEventCount).toBe(1);

      // 2. aftertogglemode event NOT fired (because prevented)
      expect(afterEventCount).toBe(0);

      // 3. Row remains in display mode
      const row1DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const row1EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(row1DisplayAfter?.classList.contains('hidden')).toBe(false);
      expect(row1EditAfter?.classList.contains('hidden')).toBe(true);

      // 4. Data still shows row in display mode (no editing flag)
      const currentData = el.data as Array<Record<string, unknown>>;
      expect(currentData[1].editing).toBeUndefined();
    });
  });

  describe('Test 6.2.3 — Toggle from edit back to display fires before/after events', () => {
    test('Given a <ck-editable-array> element with row n currently in edit mode, And event listeners for beforetogglemode and aftertogglemode, When I activate the control that returns row n to display mode (e.g. a Save or Done toggle), Then a beforetogglemode event fires with: index: n, from: "edit", to: "display", And if not canceled, aftertogglemode fires with: index: n, mode: "display"', () => {
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

      // Create edit template with toggle/done button
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <button data-action="save">Save</button>
          <button data-action="toggle">Done</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with row 1 in edit mode
      el.data = [{ name: 'Alice' }, { name: 'Bob', editing: true }];

      // Attach to document
      document.body.appendChild(el);

      // Verify row 1 is in edit mode
      const row1DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const row1EditBefore = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(row1DisplayBefore?.classList.contains('hidden')).toBe(true);
      expect(row1EditBefore?.classList.contains('hidden')).toBe(false);

      // Setup event listeners
      let beforeEventCount = 0;
      let afterEventCount = 0;
      let beforeEventDetail: unknown = null;
      let afterEventDetail: unknown = null;

      el.addEventListener('beforetogglemode', (event: Event) => {
        beforeEventCount++;
        const customEvent = event as CustomEvent;
        beforeEventDetail = customEvent.detail;
      });

      el.addEventListener('aftertogglemode', (event: Event) => {
        afterEventCount++;
        const customEvent = event as CustomEvent;
        afterEventDetail = customEvent.detail;
      });

      // Act - Click toggle/done control in edit mode
      const toggleButton = row1EditBefore?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(toggleButton).not.toBeNull();
      toggleButton?.click();

      // Assert
      // 1. beforetogglemode event fired once
      expect(beforeEventCount).toBe(1);

      // 2. beforetogglemode detail includes correct information
      const beforeDetail = beforeEventDetail as Record<string, unknown>;
      expect(beforeDetail.index).toBe(1);
      expect(beforeDetail.from).toBe('edit');
      expect(beforeDetail.to).toBe('display');

      // 3. aftertogglemode event fired once
      expect(afterEventCount).toBe(1);

      // 4. aftertogglemode detail includes correct information
      const afterDetail = afterEventDetail as Record<string, unknown>;
      expect(afterDetail.index).toBe(1);
      expect(afterDetail.mode).toBe('display');

      // 5. Row is now in display mode
      const row1DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const row1EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(row1DisplayAfter?.classList.contains('hidden')).toBe(false);
      expect(row1EditAfter?.classList.contains('hidden')).toBe(true);
    });
  });
});

describe('CkEditableArray - Step 6.3: Visual Mode Switching with Hidden Class', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 6.3.1 — Toggle to edit hides display content and shows edit content', () => {
    test("Given a row initially in display mode, When I successfully toggle it to edit mode (no cancellation), Then that row's .edit-content becomes visible (no hidden class), And .display-content gains the hidden class, And the row's toggle control for entering edit mode becomes hidden or disabled as per your spec, And edit controls (e.g. Save/Cancel) become visible", () => {
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

      // Create edit template with Save/Cancel controls
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

      // Set initial data with row in display mode
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - row in display mode
      const displayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const editBefore = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(displayBefore?.classList.contains('hidden')).toBe(false);
      expect(editBefore?.classList.contains('hidden')).toBe(true);

      // Act - Click toggle to enter edit mode
      const toggleButton = displayBefore?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Assert
      // 1. Edit content becomes visible (no hidden class)
      const editAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(editAfter?.classList.contains('hidden')).toBe(false);

      // 2. Display content gains hidden class
      const displayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(displayAfter?.classList.contains('hidden')).toBe(true);

      // 3. Toggle control in display mode is hidden (via parent wrapper)
      const toggleInDisplay = displayAfter?.querySelector(
        '[data-action="toggle"]'
      );
      expect(toggleInDisplay).not.toBeNull();
      expect(displayAfter?.classList.contains('hidden')).toBe(true);

      // 4. Edit controls (Save/Cancel) are visible
      const saveButton = editAfter?.querySelector('[data-action="save"]');
      const cancelButton = editAfter?.querySelector('[data-action="cancel"]');
      expect(saveButton).not.toBeNull();
      expect(cancelButton).not.toBeNull();
      expect(editAfter?.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Test 6.3.2 — Toggle back to display hides edit and shows display', () => {
    test("Given a row currently in edit mode, When I successfully toggle back to display mode, Then that row's .display-content becomes visible (no hidden class), And .edit-content gains the hidden class, And edit-only controls are hidden, And the row's toggle control for entering edit mode becomes visible again", () => {
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

      // Create edit template with toggle/done control
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <button data-action="save">Save</button>
          <button data-action="toggle">Done</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with row in edit mode
      el.data = [{ name: 'Alice', editing: true }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - row in edit mode
      const displayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const editBefore = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(displayBefore?.classList.contains('hidden')).toBe(true);
      expect(editBefore?.classList.contains('hidden')).toBe(false);

      // Act - Click toggle to return to display mode
      const toggleButton = editBefore?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Assert
      // 1. Display content becomes visible (no hidden class)
      const displayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(displayAfter?.classList.contains('hidden')).toBe(false);

      // 2. Edit content gains hidden class
      const editAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(editAfter?.classList.contains('hidden')).toBe(true);

      // 3. Edit-only controls are hidden (via parent wrapper)
      const saveButton = editAfter?.querySelector('[data-action="save"]');
      expect(saveButton).not.toBeNull();
      expect(editAfter?.classList.contains('hidden')).toBe(true);

      // 4. Toggle control for entering edit mode is visible again
      const toggleInDisplay = displayAfter?.querySelector(
        '[data-action="toggle"]'
      );
      expect(toggleInDisplay).not.toBeNull();
      expect(displayAfter?.classList.contains('hidden')).toBe(false);
    });
  });
});

describe('CkEditableArray - Step 6.4: Save Behavior', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 6.4.1 — Saving persists edited values into data and returns to display mode', () => {
    test('Given a row in edit mode with fields bound to the underlying data, And I change one or more input values in the edit view, When I click the Save control for that row, Then the corresponding item in el.data is updated to reflect the edited values, And the row returns to display mode, And the display content shows the updated values, And any locking on other rows / Add is cleared', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
          <span data-bind="email"></span>
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
          <input data-bind="email" />
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with multiple rows
      el.data = [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ];

      // Attach to document
      document.body.appendChild(el);

      // Toggle row 0 to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Verify row 0 is in edit mode and row 1 is locked
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0Edit?.classList.contains('hidden')).toBe(false);

      const row1DisplayLocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1DisplayLocked?.getAttribute('data-locked')).toBe('true');

      // Modify input values
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      const emailInput = row0Edit?.querySelector(
        'input[data-bind="email"]'
      ) as HTMLInputElement;

      nameInput.value = 'Alice Updated';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      emailInput.value = 'alice.updated@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Act - Click Save button
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      saveButton?.click();

      // Assert
      // 1. Row returns to display mode
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);
      expect(row0EditAfter?.classList.contains('hidden')).toBe(true);

      // 2. Data is updated with edited values
      const currentData = el.data as Array<Record<string, unknown>>;
      expect(currentData[0].name).toBe('Alice Updated');
      expect(currentData[0].email).toBe('alice.updated@example.com');

      // 3. Display content shows updated values
      const displayName = row0DisplayAfter?.querySelector('[data-bind="name"]');
      const displayEmail = row0DisplayAfter?.querySelector(
        '[data-bind="email"]'
      );
      expect(displayName?.textContent).toBe('Alice Updated');
      expect(displayEmail?.textContent).toBe('alice.updated@example.com');

      // 4. Other rows are unlocked
      const row1DisplayUnlocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1DisplayUnlocked?.hasAttribute('data-locked')).toBe(false);

      // 5. Add button is re-enabled
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButton?.disabled).toBe(false);
    });
  });

  describe('Test 6.4.2 — Save emits datachanged with updated array', () => {
    test('Given a listener for datachanged events on the element, And a row in edit mode whose values are changed by the user, When I click Save and the row returns to display mode, Then a datachanged event fires once, And its detail.data reflects the updated item values', () => {
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
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Modify input value
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = 'Alice Modified';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Setup event listener
      let eventCount = 0;
      let lastEventData: unknown = null;

      el.addEventListener('datachanged', (event: Event) => {
        eventCount++;
        const customEvent = event as CustomEvent;
        lastEventData = customEvent.detail.data;
      });

      // Act - Click Save button
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      saveButton?.click();

      // Assert
      // 1. Exactly one datachanged event is fired
      expect(eventCount).toBe(1);

      // 2. Event detail contains updated data
      expect(lastEventData).not.toBeNull();
      const dataArray = lastEventData as Array<Record<string, unknown>>;
      expect(dataArray.length).toBe(1);
      expect(dataArray[0].name).toBe('Alice Modified');

      // 3. Editing flag is removed
      expect(dataArray[0].editing).toBeUndefined();
    });
  });

  describe('Test 6.4.3 — Save is disabled when row has validation errors', () => {
    test('Given a row in edit mode with a schema that requires a field (for example name must be non-empty), When I clear the required field so the row becomes invalid, Then the Save control for that row becomes disabled or otherwise non-actionable, And clicking it has no effect (no mode change, no events), When I correct the field so it is valid again, Then the Save control becomes enabled and can be used to complete the edit', () => {
      // Arrange
      const el = new CkEditableArray();

      // Set schema with required name field
      el.schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
        },
        required: ['name'],
      };

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
          <input data-bind="name" required />
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Get edit elements
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;

      // Verify Save button is initially enabled
      expect(saveButton?.disabled).toBe(false);

      // Act - Clear the required field
      nameInput.value = '';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Get fresh reference to Save button after input change
      const row0EditAfterClear = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const saveButtonAfterClear = row0EditAfterClear?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;

      // Assert - Save button should be disabled
      expect(saveButtonAfterClear?.disabled).toBe(true);

      // Setup event listener AFTER clearing input to verify Save button click has no effect
      let eventCount = 0;
      el.addEventListener('datachanged', () => {
        eventCount++;
      });

      // Try clicking Save (should have no effect)
      saveButtonAfterClear?.click();

      // Verify row is still in edit mode
      const row0EditStill = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0EditStill?.classList.contains('hidden')).toBe(false);

      // Verify no datachanged event fired from the Save button click
      expect(eventCount).toBe(0);

      // Act - Correct the field
      nameInput.value = 'Alice Corrected';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Get fresh reference to Save button after correction
      const row0EditAfterCorrect = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const saveButtonAfterCorrect = row0EditAfterCorrect?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;

      // Assert - Save button should be enabled again
      expect(saveButtonAfterCorrect?.disabled).toBe(false);

      // Reset event counter to track only Save button click
      eventCount = 0;

      // Click Save and verify it works
      saveButtonAfterCorrect?.click();

      // Verify row returned to display mode
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);

      // Verify data was updated
      const currentData = el.data as Array<Record<string, unknown>>;
      expect(currentData[0].name).toBe('Alice Corrected');

      // Verify datachanged event fired from Save button click
      expect(eventCount).toBe(1);
    });
  });
});

describe('CkEditableArray - Step 6.5: Cancel Behavior', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 6.5.1 — Cancel discards changes and restores original values', () => {
    test('Given a row in edit mode, And I change one or more input values, When I click the Cancel control, Then the row returns to display mode, And the display values match the original data before entering edit mode, And el.data has not changed compared to its state prior to editing', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
          <span data-bind="email"></span>
          <button data-action="toggle">Edit</button>
        </div>
      `;
      el.appendChild(tplDisplay);

      // Create edit template with Cancel button
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <input data-bind="email" />
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice', email: 'alice@example.com' }];

      // Attach to document
      document.body.appendChild(el);

      // Store original data for comparison
      const originalData = JSON.parse(JSON.stringify(el.data));

      // Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Get edit elements and modify values
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      const emailInput = row0Edit?.querySelector(
        'input[data-bind="email"]'
      ) as HTMLInputElement;

      nameInput.value = 'Modified Name';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      emailInput.value = 'modified@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Verify changes are reflected in data (before cancel)
      const dataBeforeCancel = el.data as Array<Record<string, unknown>>;
      expect(dataBeforeCancel[0].name).toBe('Modified Name');
      expect(dataBeforeCancel[0].email).toBe('modified@example.com');

      // Act - Click Cancel button
      const cancelButton = row0Edit?.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;
      expect(cancelButton).not.toBeNull();
      cancelButton?.click();

      // Assert
      // 1. Row returns to display mode
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);
      expect(row0EditAfter?.classList.contains('hidden')).toBe(true);

      // 2. Data is restored to original values
      const dataAfterCancel = el.data as Array<Record<string, unknown>>;
      expect(dataAfterCancel[0].name).toBe(originalData[0].name);
      expect(dataAfterCancel[0].email).toBe(originalData[0].email);

      // 3. Display content shows original values
      const displayName = row0DisplayAfter?.querySelector('[data-bind="name"]');
      const displayEmail = row0DisplayAfter?.querySelector(
        '[data-bind="email"]'
      );
      expect(displayName?.textContent).toBe('Alice');
      expect(displayEmail?.textContent).toBe('alice@example.com');
    });
  });

  describe('Test 6.5.2 — Cancel does not emit a datachanged event', () => {
    test('Given a listener for datachanged events on the element, And a row in edit mode with unsaved changes, When I click Cancel to exit edit mode, Then no datachanged event is fired, And only the beforetogglemode/aftertogglemode pair (for edit → display) is observed', () => {
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

      // Create edit template with Cancel button
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Modify input value
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = 'Modified';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Setup event listeners AFTER modifications
      let dataChangedCount = 0;
      let beforeToggleCount = 0;
      let afterToggleCount = 0;

      el.addEventListener('datachanged', () => {
        dataChangedCount++;
      });

      el.addEventListener('beforetogglemode', () => {
        beforeToggleCount++;
      });

      el.addEventListener('aftertogglemode', () => {
        afterToggleCount++;
      });

      // Act - Click Cancel button
      const cancelButton = row0Edit?.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;
      cancelButton?.click();

      // Assert
      // 1. No datachanged event fired
      expect(dataChangedCount).toBe(0);

      // 2. beforetogglemode and aftertogglemode events fired
      expect(beforeToggleCount).toBe(1);
      expect(afterToggleCount).toBe(1);

      // 3. Row is in display mode
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Test 6.5.3 — Cancel also releases locks and re-enables Add', () => {
    test('Given a row in edit mode with the rest of the list locked and Add disabled, When I click Cancel, Then the row returns to display mode, And all other rows become interactive again, And the Add button becomes enabled', () => {
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

      // Create edit template with Cancel button
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with multiple rows
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Toggle row 0 to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Verify row 1 is locked and Add is disabled
      const row1DisplayLocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1DisplayLocked?.getAttribute('data-locked')).toBe('true');

      const addButtonLocked = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButtonLocked?.disabled).toBe(true);

      // Act - Click Cancel button
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const cancelButton = row0Edit?.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;
      cancelButton?.click();

      // Assert
      // 1. Row 0 returns to display mode
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);
      expect(row0EditAfter?.classList.contains('hidden')).toBe(true);

      // 2. Row 1 is unlocked
      const row1DisplayUnlocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1DisplayUnlocked?.hasAttribute('data-locked')).toBe(false);
      expect(row1DisplayUnlocked?.hasAttribute('aria-disabled')).toBe(false);
      expect(row1DisplayUnlocked?.hasAttribute('inert')).toBe(false);

      // 3. Add button is re-enabled
      const addButtonUnlocked = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      expect(addButtonUnlocked?.disabled).toBe(false);

      // 4. Toggle controls are re-enabled
      const row1Toggle = row1DisplayUnlocked?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(row1Toggle?.disabled).toBe(false);
    });
  });
});

describe('CkEditableArray - Step 6.6: Soft Delete & Restore', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 6.6.1 — Delete marks row as soft-deleted without removing it from the DOM', () => {
    test('Given a row in display mode with a visible Delete control, When I click Delete, Then the row is marked as deleted in the DOM (data-deleted="true"), And the row remains present in the rows container (not physically removed)', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with Delete button
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
          <button data-action="delete">Delete</button>
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
      el.data = [{ name: 'Alice' }, { name: 'Bob' }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - row 0 is not deleted
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayBefore?.hasAttribute('data-deleted')).toBe(false);

      // Act - Click Delete button on row 0
      const deleteButton = row0DisplayBefore?.querySelector(
        '[data-action="delete"]'
      ) as HTMLButtonElement;
      expect(deleteButton).not.toBeNull();
      deleteButton?.click();

      // Assert
      // 1. Row is marked as deleted in DOM
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.getAttribute('data-deleted')).toBe('true');

      // 2. Row remains in DOM (not physically removed)
      expect(row0DisplayAfter).not.toBeNull();
      const allRows = el.shadowRoot?.querySelectorAll('[data-row]');
      expect(allRows?.length).toBe(4); // 2 rows × 2 modes (display + edit)

      // 3. Other rows are unaffected
      const row1Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1Display?.hasAttribute('data-deleted')).toBe(false);
    });
  });

  describe('Test 6.6.2 — Delete updates the data and emits datachanged', () => {
    test("Given a listener for datachanged, And a row in display mode with a Delete control, When I click Delete, Then el.data's corresponding item is updated to reflect logical deletion (deleted: true), And a datachanged event is emitted", () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with Delete button
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
          <button data-action="delete">Delete</button>
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

      // Setup event listener
      let eventCount = 0;
      let lastEventData: unknown = null;

      el.addEventListener('datachanged', (event: Event) => {
        eventCount++;
        const customEvent = event as CustomEvent;
        lastEventData = customEvent.detail.data;
      });

      // Act - Click Delete button
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const deleteButton = row0Display?.querySelector(
        '[data-action="delete"]'
      ) as HTMLButtonElement;
      deleteButton?.click();

      // Assert
      // 1. Data is updated with deleted flag
      const currentData = el.data as Array<Record<string, unknown>>;
      expect(currentData[0].deleted).toBe(true);
      expect(currentData[0].name).toBe('Alice'); // Other data preserved

      // 2. datachanged event was fired
      expect(eventCount).toBe(1);

      // 3. Event detail contains deleted item
      const eventData = lastEventData as Array<Record<string, unknown>>;
      expect(eventData[0].deleted).toBe(true);
      expect(eventData[0].name).toBe('Alice');
    });
  });

  describe('Test 6.6.3 — Restore reverses soft delete', () => {
    test("Given a row already marked as deleted (with data-deleted and a Restore control visible), When I click Restore, Then the row's deleted marker is removed (no data-deleted), And the corresponding item in el.data no longer has deleted: true, And a datachanged event is emitted with the restored data", () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with Delete and Restore buttons
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
          <button data-action="delete">Delete</button>
          <button data-action="restore">Restore</button>
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

      // Set initial data with deleted row
      el.data = [{ name: 'Alice', deleted: true }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - row is deleted
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayBefore?.getAttribute('data-deleted')).toBe('true');

      // Setup event listener
      let eventCount = 0;
      let lastEventData: unknown = null;

      el.addEventListener('datachanged', (event: Event) => {
        eventCount++;
        const customEvent = event as CustomEvent;
        lastEventData = customEvent.detail.data;
      });

      // Act - Click Restore button
      const restoreButton = row0DisplayBefore?.querySelector(
        '[data-action="restore"]'
      ) as HTMLButtonElement;
      expect(restoreButton).not.toBeNull();
      restoreButton?.click();

      // Assert
      // 1. Row's deleted marker is removed from DOM
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.hasAttribute('data-deleted')).toBe(false);

      // 2. Data no longer has deleted flag
      const currentData = el.data as Array<Record<string, unknown>>;
      expect(currentData[0].deleted).toBeUndefined();
      expect(currentData[0].name).toBe('Alice'); // Other data preserved

      // 3. datachanged event was fired
      expect(eventCount).toBe(1);

      // 4. Event detail contains restored item
      const eventData = lastEventData as Array<Record<string, unknown>>;
      expect(eventData[0].deleted).toBeUndefined();
      expect(eventData[0].name).toBe('Alice');
    });
  });

  describe('Test 6.6.4 — Delete and Restore obey exclusive locking rules when a different row is editing', () => {
    test('Given one row currently in edit mode and all other rows locked, When I attempt to click Delete or Restore on a locked row, Then nothing happens: no visual change, no events fire, And the editing row remains in edit mode', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with Delete and Restore buttons
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
          <button data-action="toggle">Edit</button>
          <button data-action="delete">Delete</button>
          <button data-action="restore">Restore</button>
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
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with one deleted row
      el.data = [
        { name: 'Alice' },
        { name: 'Bob', deleted: true },
        { name: 'Charlie' },
      ];

      // Attach to document
      document.body.appendChild(el);

      // Toggle row 0 to edit mode (locks other rows)
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Verify row 0 is in edit mode and row 1 is locked
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0Edit?.classList.contains('hidden')).toBe(false);

      const row1DisplayLocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1DisplayLocked?.getAttribute('data-locked')).toBe('true');

      // Setup event listeners to verify no events fire
      let dataChangedCount = 0;
      let beforeToggleCount = 0;
      let afterToggleCount = 0;

      el.addEventListener('datachanged', () => {
        dataChangedCount++;
      });

      el.addEventListener('beforetogglemode', () => {
        beforeToggleCount++;
      });

      el.addEventListener('aftertogglemode', () => {
        afterToggleCount++;
      });

      // Store initial data state
      const dataBefore = JSON.parse(JSON.stringify(el.data));

      // Act - Try to click Restore on locked deleted row (row 1)
      const restoreButton = row1DisplayLocked?.querySelector(
        '[data-action="restore"]'
      ) as HTMLButtonElement;
      restoreButton?.click();

      // Try to click Delete on locked non-deleted row (row 2)
      const row2DisplayLocked = el.shadowRoot?.querySelector(
        '.display-content[data-row="2"]'
      );
      const deleteButton = row2DisplayLocked?.querySelector(
        '[data-action="delete"]'
      ) as HTMLButtonElement;
      deleteButton?.click();

      // Assert
      // 1. No events fired
      expect(dataChangedCount).toBe(0);
      expect(beforeToggleCount).toBe(0);
      expect(afterToggleCount).toBe(0);

      // 2. Data unchanged
      const dataAfter = el.data;
      expect(JSON.stringify(dataAfter)).toBe(JSON.stringify(dataBefore));

      // 3. Row 1 still marked as deleted
      const row1DisplayStill = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1DisplayStill?.getAttribute('data-deleted')).toBe('true');

      // 4. Row 2 still not deleted
      const row2DisplayStill = el.shadowRoot?.querySelector(
        '.display-content[data-row="2"]'
      );
      expect(row2DisplayStill?.hasAttribute('data-deleted')).toBe(false);

      // 5. Row 0 still in edit mode
      const row0EditStill = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0EditStill?.classList.contains('hidden')).toBe(false);
    });
  });
});

describe('CkEditableArray - Step 6.7: Action Button Templates', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 6.7.1 — Custom edit/save/delete/restore/cancel button templates are used', () => {
    test('Given a <ck-editable-array> element with slotted button templates, When the component renders rows, Then the visible buttons use the text from the corresponding custom templates', () => {
      // Arrange
      const el = new CkEditableArray();

      // Add custom button templates
      const editButton = document.createElement('button');
      editButton.setAttribute('slot', 'button-edit');
      editButton.textContent = 'Custom Edit';
      el.appendChild(editButton);

      const saveButton = document.createElement('button');
      saveButton.setAttribute('slot', 'button-save');
      saveButton.textContent = 'Custom Save';
      el.appendChild(saveButton);

      const deleteButton = document.createElement('button');
      deleteButton.setAttribute('slot', 'button-delete');
      deleteButton.textContent = 'Custom Delete';
      el.appendChild(deleteButton);

      const restoreButton = document.createElement('button');
      restoreButton.setAttribute('slot', 'button-restore');
      restoreButton.textContent = 'Custom Restore';
      el.appendChild(restoreButton);

      const cancelButton = document.createElement('button');
      cancelButton.setAttribute('slot', 'button-cancel');
      cancelButton.textContent = 'Custom Cancel';
      el.appendChild(cancelButton);

      // Create display template (without buttons - they'll be injected)
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
        </div>
      `;
      el.appendChild(tplDisplay);

      // Create edit template (without buttons - they'll be injected)
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

      // Assert - Display mode buttons use custom templates
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );

      const editBtn = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      expect(editBtn).not.toBeNull();
      expect(editBtn?.textContent).toBe('Custom Edit');

      const deleteBtn = row0Display?.querySelector(
        '[data-action="delete"]'
      ) as HTMLButtonElement;
      expect(deleteBtn).not.toBeNull();
      expect(deleteBtn?.textContent).toBe('Custom Delete');

      const restoreBtn = row0Display?.querySelector(
        '[data-action="restore"]'
      ) as HTMLButtonElement;
      expect(restoreBtn).not.toBeNull();
      expect(restoreBtn?.textContent).toBe('Custom Restore');

      // Toggle to edit mode
      editBtn?.click();

      // Assert - Edit mode buttons use custom templates
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      const saveBtn = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      expect(saveBtn).not.toBeNull();
      expect(saveBtn?.textContent).toBe('Custom Save');

      const cancelBtn = row0Edit?.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;
      expect(cancelBtn).not.toBeNull();
      expect(cancelBtn?.textContent).toBe('Custom Cancel');
    });
  });

  describe('Test 6.7.2 — Row buttons respect mode-specific visibility rules', () => {
    test('Given at least one row in display mode and one row in edit mode, Then display mode shows Edit/Delete/Restore, and edit mode shows Save/Cancel', () => {
      // Arrange
      const el = new CkEditableArray();

      // Add custom button templates
      const editButton = document.createElement('button');
      editButton.setAttribute('slot', 'button-edit');
      editButton.textContent = 'Edit';
      el.appendChild(editButton);

      const saveButton = document.createElement('button');
      saveButton.setAttribute('slot', 'button-save');
      saveButton.textContent = 'Save';
      el.appendChild(saveButton);

      const cancelButton = document.createElement('button');
      cancelButton.setAttribute('slot', 'button-cancel');
      cancelButton.textContent = 'Cancel';
      el.appendChild(cancelButton);

      const deleteButton = document.createElement('button');
      deleteButton.setAttribute('slot', 'button-delete');
      deleteButton.textContent = 'Delete';
      el.appendChild(deleteButton);

      const restoreButton = document.createElement('button');
      restoreButton.setAttribute('slot', 'button-restore');
      restoreButton.textContent = 'Restore';
      el.appendChild(restoreButton);

      // Create templates
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
        </div>
      `;
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with one row in edit mode
      el.data = [{ name: 'Alice' }, { name: 'Bob', editing: true }];

      // Attach to document
      document.body.appendChild(el);

      // Assert - Row 0 (display mode) has Edit/Delete/Restore, not Save/Cancel
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(
        row0Display?.querySelector('[data-action="toggle"]')
      ).not.toBeNull();
      expect(
        row0Display?.querySelector('[data-action="delete"]')
      ).not.toBeNull();
      expect(
        row0Display?.querySelector('[data-action="restore"]')
      ).not.toBeNull();
      expect(row0Display?.querySelector('[data-action="save"]')).toBeNull();
      expect(row0Display?.querySelector('[data-action="cancel"]')).toBeNull();

      // Assert - Row 1 (edit mode) has Save/Cancel, not Edit
      const row1Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );
      expect(row1Edit?.querySelector('[data-action="save"]')).not.toBeNull();
      expect(row1Edit?.querySelector('[data-action="cancel"]')).not.toBeNull();

      // Edit mode can still have Delete/Restore if needed
      // But the Edit (toggle to edit) button should not be in edit mode content
      const row1Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1Display?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Test 6.7.3 — Button clicks map to the correct behaviours', () => {
    test('Given custom buttons, When I click each button type, Then each triggers the correct behaviour', () => {
      // Arrange
      const el = new CkEditableArray();

      // Add custom button templates
      const editButton = document.createElement('button');
      editButton.setAttribute('slot', 'button-edit');
      editButton.textContent = 'Edit';
      el.appendChild(editButton);

      const saveButton = document.createElement('button');
      saveButton.setAttribute('slot', 'button-save');
      saveButton.textContent = 'Save';
      el.appendChild(saveButton);

      const cancelButton = document.createElement('button');
      cancelButton.setAttribute('slot', 'button-cancel');
      cancelButton.textContent = 'Cancel';
      el.appendChild(cancelButton);

      const deleteButton = document.createElement('button');
      deleteButton.setAttribute('slot', 'button-delete');
      deleteButton.textContent = 'Delete';
      el.appendChild(deleteButton);

      const restoreButton = document.createElement('button');
      restoreButton.setAttribute('slot', 'button-restore');
      restoreButton.textContent = 'Restore';
      el.appendChild(restoreButton);

      // Create templates
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
        </div>
      `;
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }, { name: 'Bob', deleted: true }];

      // Attach to document
      document.body.appendChild(el);

      // Test 1: Edit button toggles to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const editBtn = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      editBtn?.click();

      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0Edit?.classList.contains('hidden')).toBe(false);

      // Test 2: Cancel button returns to display mode
      const cancelBtn = row0Edit?.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;
      cancelBtn?.click();

      const row0DisplayAfterCancel = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayAfterCancel?.classList.contains('hidden')).toBe(false);

      // Test 3: Edit again, modify, and Save
      const editBtn2 = row0DisplayAfterCancel?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      editBtn2?.click();

      const row0Edit2 = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit2?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = 'Alice Modified';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const saveBtn = row0Edit2?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn?.click();

      const currentData = el.data as Array<Record<string, unknown>>;
      expect(currentData[0].name).toBe('Alice Modified');

      // Test 4: Delete button marks row as deleted
      const row0DisplayFinal = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const deleteBtn = row0DisplayFinal?.querySelector(
        '[data-action="delete"]'
      ) as HTMLButtonElement;
      deleteBtn?.click();

      const row0DisplayDeleted = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayDeleted?.getAttribute('data-deleted')).toBe('true');

      // Test 5: Restore button removes deleted flag
      const row1Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1Display?.getAttribute('data-deleted')).toBe('true');

      const restoreBtn = row1Display?.querySelector(
        '[data-action="restore"]'
      ) as HTMLButtonElement;
      restoreBtn?.click();

      const row1DisplayRestored = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      expect(row1DisplayRestored?.hasAttribute('data-deleted')).toBe(false);
    });
  });
});
