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
