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
