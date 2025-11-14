import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 8.1: Data Cloning & Immutability Guarantees', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 8.1.1 — Mutating el.data after read does not affect rendered UI', () => {
    test('Given a ck-editable-array element with data set to [{ name: "Alice" }], When I read const current = el.data, And I mutate current[0].name = "Mutated", Then the row\'s display content still shows Alice, And the edit inputs for that row are initially populated with Alice, not Mutated', async () => {
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
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Act - Read data and mutate it
      const current = el.data as Array<{ name: string }>;
      current[0].name = 'Mutated';

      // Assert
      // 1. Display content still shows Alice
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayName = row0Display?.querySelector('[data-bind="name"]');
      expect(displayName?.textContent).toBe('Alice');

      // 2. Toggle to edit mode and check input value
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;

      // 3. Edit input is populated with Alice, not Mutated
      expect(nameInput?.value).toBe('Alice');

      // 4. Internal data is still Alice (editing flag may be present)
      const currentData = el.data as Array<{ name: string; editing?: boolean }>;
      expect(currentData[0].name).toBe('Alice');
    });
  });

  describe('Test 8.1.2 — Mutating original array passed to setter does not affect el.data', () => {
    test('Given a ck-editable-array element, And an array const source = [{ name: "Alice" }], When I assign el.data = source, And then change source[0].name = "Mutated", And then read el.data, Then el.data[0].name is still Alice, And the UI shows Alice as well', () => {
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

      // Attach to document
      document.body.appendChild(el);

      // Act - Create source array and assign to el.data
      const source = [{ name: 'Alice' }];
      el.data = source;

      // Mutate the source array
      source[0].name = 'Mutated';

      // Assert
      // 1. el.data is still Alice
      expect(el.data).toEqual([{ name: 'Alice' }]);
      expect((el.data as Array<{ name: string }>)[0].name).toBe('Alice');

      // 2. UI shows Alice
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayName = row0Display?.querySelector('[data-bind="name"]');
      expect(displayName?.textContent).toBe('Alice');
    });
  });

  describe('Test 8.1.3 — Mutating el.data in place does not auto-re-render', () => {
    test('Given a ck-editable-array element with one row displayed as Alice, When I read const d = el.data, And I directly mutate d[0].name = "Mutated" without reassigning el.data, Then the display in the shadow DOM still shows Alice, And no automatic re-render occurs', () => {
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

      // Verify initial state
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayNameBefore =
        row0DisplayBefore?.querySelector('[data-bind="name"]');
      expect(displayNameBefore?.textContent).toBe('Alice');

      // Act - Read data and mutate it in place without reassigning
      const d = el.data as Array<{ name: string }>;
      d[0].name = 'Mutated';

      // Assert
      // 1. Display still shows Alice (no auto-re-render)
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayNameAfter =
        row0DisplayAfter?.querySelector('[data-bind="name"]');
      expect(displayNameAfter?.textContent).toBe('Alice');

      // 2. The mutation did affect the returned array reference
      // (but not the internal data or UI)
      expect(d[0].name).toBe('Mutated');

      // 3. Reading el.data again returns a fresh copy (still Alice)
      const freshRead = el.data as Array<{ name: string }>;
      expect(freshRead[0].name).toBe('Alice');
    });
  });

  describe('Test 8.1.4 — Reassigning mutated data array updates both data and UI', () => {
    test('Given the scenario where I mutated the result of el.data, When I now assign el.data = d again, Then the UI re-renders and shows Mutated in the display content, And el.data[0].name is Mutated', () => {
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

      // Read data and mutate it
      const d = el.data as Array<{ name: string }>;
      d[0].name = 'Mutated';

      // Verify UI still shows Alice before reassignment
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayNameBefore =
        row0DisplayBefore?.querySelector('[data-bind="name"]');
      expect(displayNameBefore?.textContent).toBe('Alice');

      // Act - Reassign the mutated array
      el.data = d;

      // Assert
      // 1. UI re-renders and shows Mutated
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayNameAfter =
        row0DisplayAfter?.querySelector('[data-bind="name"]');
      expect(displayNameAfter?.textContent).toBe('Mutated');

      // 2. el.data[0].name is Mutated
      expect(el.data).toEqual([{ name: 'Mutated' }]);
      expect((el.data as Array<{ name: string }>)[0].name).toBe('Mutated');
    });
  });
});

describe('CkEditableArray - Step 8.2: Deep vs Shallow Clone Behaviour', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 8.2.1 — Nested objects are cloned so external mutations do not leak in', () => {
    test('Given a <ck-editable-array> element attached to document.body, And a nested structure const source = [{ person: { name: "Alice" } }], When I set el.data = source, And then mutate source[0].person.name = "Mutated", And then read el.data, Then el.data[0].person.name is still Alice, And the UI shows Alice', () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with nested binding
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="person.name"></span>
        </div>
      `;
      el.appendChild(tplDisplay);

      // Create edit template
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="person.name" />
        </div>
      `;
      el.appendChild(tplEdit);

      // Attach to document
      document.body.appendChild(el);

      // Act - Create nested source array and assign to el.data
      const source = [{ person: { name: 'Alice' } }];
      el.data = source;

      // Mutate the nested property in source
      source[0].person.name = 'Mutated';

      // Assert
      // 1. el.data still has Alice (deep clone protects against mutation)
      const currentData = el.data as Array<{
        person: { name: string };
      }>;
      expect(currentData[0].person.name).toBe('Alice');

      // 2. UI shows Alice
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayName = row0Display?.querySelector(
        '[data-bind="person.name"]'
      );
      expect(displayName?.textContent).toBe('Alice');
    });
  });

  describe('Test 8.2.2 — Editing via UI updates nested values in el.data', () => {
    test('Given a row bound to a nested structure like { person: { name: "Alice" } }, And an edit template bound to person.name, When I toggle the row into edit mode and change the name field to Bob via the UI, And click Save, Then the display shows Bob, And el.data[0].person.name is Bob when read', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with nested binding
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="person.name"></span>
          <button data-action="toggle">Edit</button>
        </div>
      `;
      el.appendChild(tplDisplay);

      // Create edit template with nested binding
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="person.name" />
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial nested data
      el.data = [{ person: { name: 'Alice' } }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial display
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayNameBefore = row0DisplayBefore?.querySelector(
        '[data-bind="person.name"]'
      );
      expect(displayNameBefore?.textContent).toBe('Alice');

      // Act - Toggle to edit mode
      const toggleButton = row0DisplayBefore?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Find the edit input and change its value
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="person.name"]'
      ) as HTMLInputElement;

      expect(nameInput?.value).toBe('Alice');

      // Change the input value
      nameInput.value = 'Bob';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Click Save
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      saveButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Display shows Bob
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const displayNameAfter = row0DisplayAfter?.querySelector(
        '[data-bind="person.name"]'
      );
      expect(displayNameAfter?.textContent).toBe('Bob');

      // 2. el.data[0].person.name is Bob
      const currentData = el.data as Array<{
        person: { name: string };
      }>;
      expect(currentData[0].person.name).toBe('Bob');
    });
  });
});

describe('CkEditableArray - Step 8.3: Cloning & "deleted" flag consistency', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 8.3.1 — Soft delete sets deleted flag without affecting previous data snapshots', () => {
    test('Given el.data initially set to [{ name: "Alice", deleted: false }], And a row is rendered from that data, When I click Delete to soft-delete the row, Then reading el.data now returns an item whose deleted property is true, And if I cached an earlier copy of el.data before clicking Delete, that cached copy still has deleted: false', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with delete button
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

      // Set initial data with explicit deleted: false
      el.data = [{ name: 'Alice', deleted: false }];

      // Attach to document
      document.body.appendChild(el);

      // Cache a copy of el.data before deletion
      const cachedBeforeDelete = el.data as Array<{
        name: string;
        deleted: boolean;
      }>;

      // Verify initial state
      expect(cachedBeforeDelete[0].deleted).toBe(false);

      // Act - Click Delete button
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const deleteButton = row0Display?.querySelector(
        '[data-action="delete"]'
      ) as HTMLButtonElement;
      deleteButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Reading el.data now shows deleted: true
      const currentData = el.data as Array<{
        name: string;
        deleted: boolean;
      }>;
      expect(currentData[0].deleted).toBe(true);

      // 2. The cached copy still has deleted: false (immutability)
      expect(cachedBeforeDelete[0].deleted).toBe(false);
    });
  });

  describe('Test 8.3.2 — Restoring a row flips deleted flag back cleanly', () => {
    test('Given a row with an item whose deleted is currently true in el.data, When I click Restore, Then reading el.data returns the same item with deleted: false, And the visual deleted styling on that row disappears', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Create display template with restore button
      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = `
        <div class="row-display">
          <span data-bind="name"></span>
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

      // Set initial data with deleted: true
      el.data = [{ name: 'Alice', deleted: true }];

      // Attach to document
      document.body.appendChild(el);

      // Verify initial state - row should have deleted styling
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayBefore?.classList.contains('deleted')).toBe(true);

      // Verify initial data state
      const dataBefore = el.data as Array<{
        name: string;
        deleted: boolean;
      }>;
      expect(dataBefore[0].deleted).toBe(true);

      // Act - Click Restore button
      const restoreButton = row0DisplayBefore?.querySelector(
        '[data-action="restore"]'
      ) as HTMLButtonElement;
      restoreButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Reading el.data now shows deleted: false
      const currentData = el.data as Array<{
        name: string;
        deleted: boolean;
      }>;
      expect(currentData[0].deleted).toBe(false);

      // 2. The visual deleted styling disappears
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('deleted')).toBe(false);
    });
  });
});

describe('CkEditableArray - Step 8.4: Generic Event Dispatch Behaviour', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 8.4.1 — datachanged bubbles out of the shadow root', () => {
    test('Given a <ck-editable-array> element attached to document.body, And an event listener on the parent of the element (e.g. document.body) for datachanged, When I perform an action that changes data (e.g. Save after editing, or Add, or Delete), Then the parent listener receives a datachanged event, And the event\'s target or composedPath() includes the <ck-editable-array> element', async () => {
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
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Set up event listener on parent (document.body)
      const parentListener = jest.fn();
      document.body.addEventListener('datachanged', parentListener);

      // Act - Toggle to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Change input value
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = 'Bob';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Click Save
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      saveButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Parent listener was called
      expect(parentListener).toHaveBeenCalled();

      // 2. Event target is the ck-editable-array element
      const lastCall = parentListener.mock.calls[parentListener.mock.calls.length - 1];
      const event = lastCall[0] as CustomEvent;
      expect(event.target).toBe(el);

      // 3. Event bubbles and composed properties are true
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);

      // Clean up
      document.body.removeEventListener('datachanged', parentListener);
    });
  });

  describe('Test 8.4.2 — beforetogglemode bubbles and is cancelable', () => {
    test('Given an ancestor container with a listener for beforetogglemode, And the listener calls event.preventDefault() when index === 0, When I click the toggle for row 0, Then the ancestor listener is invoked (showing that the event bubbles), And because the listener calls preventDefault(), the row does not switch mode', async () => {
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
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Set up event listener on ancestor that prevents default for row 0
      const ancestorListener = jest.fn((event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.index === 0) {
          event.preventDefault();
        }
      });
      document.body.addEventListener('beforetogglemode', ancestorListener);

      // Verify initial state (display mode)
      const row0DisplayBefore = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0DisplayBefore?.classList.contains('hidden')).toBe(false);

      // Act - Click toggle button for row 0
      const toggleButton = row0DisplayBefore?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Ancestor listener was invoked (event bubbled)
      expect(ancestorListener).toHaveBeenCalled();

      // 2. Row did NOT switch to edit mode (preventDefault worked)
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);
      expect(row0EditAfter?.classList.contains('hidden')).toBe(true);

      // Clean up
      document.body.removeEventListener('beforetogglemode', ancestorListener);
    });
  });

  describe('Test 8.4.3 — aftertogglemode bubbles but is not cancelable', () => {
    test('Given an ancestor listener that inspects aftertogglemode events and attempts to call preventDefault(), When I toggle a row from display to edit successfully, Then the ancestor listener is invoked with an aftertogglemode event, And trying to call preventDefault() has no effect on the already-completed mode change, And further toggles still function normally', async () => {
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
          <button data-action="toggle">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Set up event listener on ancestor that attempts to prevent default
      const ancestorListener = jest.fn((event: Event) => {
        // Attempt to call preventDefault (should have no effect)
        event.preventDefault();
      });
      document.body.addEventListener('aftertogglemode', ancestorListener);

      // Act - Click toggle button to enter edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Ancestor listener was invoked (event bubbled)
      expect(ancestorListener).toHaveBeenCalled();

      // 2. Row DID switch to edit mode (preventDefault had no effect)
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(true);
      expect(row0EditAfter?.classList.contains('hidden')).toBe(false);

      // 3. Further toggles still work normally
      ancestorListener.mockClear();
      const toggleButtonEdit = row0EditAfter?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButtonEdit?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(ancestorListener).toHaveBeenCalled();
      const row0DisplayFinal = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const row0EditFinal = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0DisplayFinal?.classList.contains('hidden')).toBe(false);
      expect(row0EditFinal?.classList.contains('hidden')).toBe(true);

      // Clean up
      document.body.removeEventListener('aftertogglemode', ancestorListener);
    });
  });

  describe('Test 8.4.4 — Events are composed so they are visible outside the shadow DOM', () => {
    test('Given a listener for datachanged on document (not just on the element itself), When I trigger a data change (e.g. Add or Save), Then the document listener receives the event, And event.composed is effectively true (inferred because it crosses shadow boundary and reaches document)', async () => {
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

      // Set up event listener on document (not just the element)
      const documentListener = jest.fn();
      document.addEventListener('datachanged', documentListener);

      // Act - Trigger Add button to change data
      const addButton = el.shadowRoot?.querySelector(
        '[data-action="add"]'
      ) as HTMLButtonElement;
      addButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Document listener was called (event crossed shadow boundary)
      expect(documentListener).toHaveBeenCalled();

      // 2. Event target is the ck-editable-array element
      const lastCall = documentListener.mock.calls[documentListener.mock.calls.length - 1];
      const event = lastCall[0] as CustomEvent;
      expect(event.target).toBe(el);

      // 3. Event composed property is true (allows crossing shadow boundary)
      expect(event.composed).toBe(true);

      // Clean up
      document.removeEventListener('datachanged', documentListener);
    });
  });
});
