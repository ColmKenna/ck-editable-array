import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 7.1: Schema-driven Required Fields', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 7.1.1 — Valid row passes validation and Save is enabled', () => {
    test('Given a validation schema marking name as required, And data contains a row with name set to a non-empty value, When I toggle that row into edit mode, Then the Save control is enabled, And no validation error messages are shown', () => {
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
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with valid name
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Act - Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Assert
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      // 1. Save button is enabled
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      expect(saveButton?.disabled).toBe(false);

      // 2. No field-level error indicator
      expect(row0Edit?.hasAttribute('data-field-invalid')).toBe(false);

      // 3. No row-level error indicator
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(false);

      // 4. Error message element is empty
      const errorSpan = row0Edit?.querySelector('[data-field-error="name"]');
      expect(errorSpan?.textContent).toBe('');
    });
  });

  describe('Test 7.1.2 — Missing required field shows an error and Save is disabled', () => {
    test('Given schema where name is required, And data contains a row where name is empty, When I toggle that row into edit mode, Then an error indicator for name is visible, And the row has visual indication of being invalid, And Save is disabled', async () => {
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

      // Create edit template with error display elements
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with empty name
      el.data = [{ name: '' }];

      // Attach to document
      document.body.appendChild(el);

      // Act - Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      // 1. Save button is disabled
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      expect(saveButton?.disabled).toBe(true);

      // 2. Field-level error indicator present
      const nameInput = row0Edit?.querySelector('input[data-bind="name"]');
      expect(nameInput?.hasAttribute('data-invalid')).toBe(true);

      // 3. Row-level error indicator present
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(true);

      // 4. Error message is displayed
      const errorSpan = row0Edit?.querySelector('[data-field-error="name"]');
      expect(errorSpan?.textContent).not.toBe('');
      expect(errorSpan?.textContent).toContain('required');
    });
  });

  describe('Test 7.1.3 — Fixing the required field clears errors and enables Save', () => {
    test('Given a row in edit mode that fails validation on name, When I type a valid non-empty value, Then the error message disappears, And row-level invalid indicator clears, And Save becomes enabled', async () => {
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

      // Create edit template with error display elements
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with empty name (invalid)
      el.data = [{ name: '' }];

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

      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      // Verify initial invalid state
      const saveButtonBefore = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      expect(saveButtonBefore?.disabled).toBe(true);
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(true);

      // Act - Type a valid value into the name input
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = 'Alice';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Assert
      // 1. Error message disappears
      const errorSpan = row0Edit?.querySelector('[data-field-error="name"]');
      expect(errorSpan?.textContent).toBe('');

      // 2. Field-level error indicator removed
      expect(nameInput?.hasAttribute('data-invalid')).toBe(false);

      // 3. Row-level invalid indicator clears
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(false);

      // 4. Save button becomes enabled
      const saveButtonAfter = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      expect(saveButtonAfter?.disabled).toBe(false);
    });
  });
});


describe('CkEditableArray - Step 7.1: Validation Logic Debug', () => {
  test('Validation detects empty required field', () => {
    const el = new CkEditableArray();
    
    el.schema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
      },
      required: ['name'],
    };
    
    el.data = [{ name: '' }];
    
    // Access private method for testing
    const validateRow = (el as unknown).validateRow.bind(el);
    const result = validateRow(0);
    
    expect(result).toBe(false);
  });
});


describe('CkEditableArray - Step 7.2: Field-level Validation Messages', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 7.2.1 — Per-field error message appears near the offending input', () => {
    test('Given a schema that marks email as required, And a row with email empty, When validation runs, Then a specific error message for email is displayed, And other valid fields do not show error messages', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Set schema with required email field
      el.schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 1 },
        },
        required: ['name', 'email'],
      };

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

      // Create edit template with error display elements
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <input data-bind="email" />
          <span class="field-error" data-field-error="email"></span>
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with valid name but empty email
      el.data = [{ name: 'Alice', email: '' }];

      // Attach to document
      document.body.appendChild(el);

      // Act - Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      // 1. Email field shows error message
      const emailError = row0Edit?.querySelector(
        '[data-field-error="email"]'
      );
      expect(emailError?.textContent).not.toBe('');
      expect(emailError?.textContent).toContain('email');

      // 2. Email input has invalid indicator
      const emailInput = row0Edit?.querySelector('input[data-bind="email"]');
      expect(emailInput?.hasAttribute('data-invalid')).toBe(true);

      // 3. Name field does NOT show error (it's valid)
      const nameError = row0Edit?.querySelector('[data-field-error="name"]');
      expect(nameError?.textContent).toBe('');

      // 4. Name input does NOT have invalid indicator
      const nameInput = row0Edit?.querySelector('input[data-bind="name"]');
      expect(nameInput?.hasAttribute('data-invalid')).toBe(false);
    });
  });

  describe('Test 7.2.2 — Updating only one field does not re-error other valid fields', () => {
    test('Given a row with two required fields both valid, When I clear only email, Then error is shown for email only, And name remains clear', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Set schema with required fields
      el.schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 1 },
        },
        required: ['name', 'email'],
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
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <input data-bind="email" />
          <span class="field-error" data-field-error="email"></span>
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with both fields valid
      el.data = [{ name: 'Alice', email: 'alice@example.com' }];

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

      await new Promise(resolve => setTimeout(resolve, 10));

      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      // Verify both fields are initially valid (no errors)
      const nameErrorBefore = row0Edit?.querySelector(
        '[data-field-error="name"]'
      );
      const emailErrorBefore = row0Edit?.querySelector(
        '[data-field-error="email"]'
      );
      expect(nameErrorBefore?.textContent).toBe('');
      expect(emailErrorBefore?.textContent).toBe('');

      // Act - Clear only the email field
      const emailInput = row0Edit?.querySelector(
        'input[data-bind="email"]'
      ) as HTMLInputElement;
      emailInput.value = '';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Assert
      // 1. Email shows error
      const emailErrorAfter = row0Edit?.querySelector(
        '[data-field-error="email"]'
      );
      expect(emailErrorAfter?.textContent).not.toBe('');
      expect(emailErrorAfter?.textContent).toContain('email');

      // 2. Email input has invalid indicator
      expect(emailInput?.hasAttribute('data-invalid')).toBe(true);

      // 3. Name still shows NO error
      const nameErrorAfter = row0Edit?.querySelector(
        '[data-field-error="name"]'
      );
      expect(nameErrorAfter?.textContent).toBe('');

      // 4. Name input still has NO invalid indicator
      const nameInput = row0Edit?.querySelector('input[data-bind="name"]');
      expect(nameInput?.hasAttribute('data-invalid')).toBe(false);
    });
  });

  describe('Test 7.2.3 — Error count matches actual failing fields', () => {
    test('Given a schema where name and email are both required, And both are empty, When validation runs, Then both show error messages, And error count matches', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Set schema with required fields
      el.schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 1 },
        },
        required: ['name', 'email'],
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

      // Create edit template with error count display
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <input data-bind="email" />
          <span class="field-error" data-field-error="email"></span>
          <div class="error-summary" data-error-count></div>
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with both fields empty
      el.data = [{ name: '', email: '' }];

      // Attach to document
      document.body.appendChild(el);

      // Act - Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      // 1. Name shows error
      const nameError = row0Edit?.querySelector('[data-field-error="name"]');
      expect(nameError?.textContent).not.toBe('');
      expect(nameError?.textContent).toContain('name');

      // 2. Email shows error
      const emailError = row0Edit?.querySelector('[data-field-error="email"]');
      expect(emailError?.textContent).not.toBe('');
      expect(emailError?.textContent).toContain('email');

      // 3. Both inputs have invalid indicators
      const nameInput = row0Edit?.querySelector('input[data-bind="name"]');
      const emailInput = row0Edit?.querySelector('input[data-bind="email"]');
      expect(nameInput?.hasAttribute('data-invalid')).toBe(true);
      expect(emailInput?.hasAttribute('data-invalid')).toBe(true);

      // 4. Error count element shows correct count (2 errors)
      const errorCount = row0Edit?.querySelector('[data-error-count]');
      expect(errorCount?.textContent).toContain('2');
    });
  });
});
