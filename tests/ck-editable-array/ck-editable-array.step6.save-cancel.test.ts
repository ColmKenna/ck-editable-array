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
