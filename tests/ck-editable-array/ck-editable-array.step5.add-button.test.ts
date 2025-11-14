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
