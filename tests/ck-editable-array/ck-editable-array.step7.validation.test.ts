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
    const validateRow = (el as any).validateRow.bind(el);
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
      const emailError = row0Edit?.querySelector('[data-field-error="email"]');
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

describe('CkEditableArray - Step 7.3: Row-level Error Indicators & Accessibility', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 7.3.1 — Invalid row is clearly marked as such', () => {
    test('Given a row in edit mode with one or more invalid fields, When validation has run, Then the row as a whole has a visible invalid state, And it is distinct from a normal row with no errors', async () => {
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

      // Set initial data - one valid row, one invalid row
      el.data = [
        { name: 'Alice', email: 'alice@example.com' },
        { name: '', email: '' },
      ];

      // Attach to document
      document.body.appendChild(el);

      // Act - Toggle both rows to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton0 = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton0?.click();

      const row1Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="1"]'
      );
      const toggleButton1 = row1Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton1?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const row1Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="1"]'
      );

      // 1. Valid row (row 0) does NOT have invalid indicator
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(false);

      // 2. Invalid row (row 1) HAS invalid indicator
      expect(row1Edit?.hasAttribute('data-row-invalid')).toBe(true);

      // 3. The invalid state is visually distinct (can be styled with CSS)
      // This is verified by the presence of the data-row-invalid attribute
      // which can be targeted by CSS selectors like [data-row-invalid] { border: 2px solid red; }
    });
  });

  describe('Test 7.3.2 — ARIA attributes reflect invalid fields', () => {
    test('Given a row in edit mode with an invalid email field, When validation has run, Then the email input has aria-invalid="true", And the error message element is associated with the input using aria-describedby', async () => {
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

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );

      // 1. Email input has aria-invalid="true"
      const emailInput = row0Edit?.querySelector(
        'input[data-bind="email"]'
      ) as HTMLInputElement;
      expect(emailInput?.getAttribute('aria-invalid')).toBe('true');

      // 2. Name input (valid) does NOT have aria-invalid="true"
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      expect(nameInput?.getAttribute('aria-invalid')).not.toBe('true');

      // 3. Error message element has an ID
      const emailError = row0Edit?.querySelector(
        '[data-field-error="email"]'
      ) as HTMLElement;
      const errorId = emailError?.getAttribute('id');
      expect(errorId).toBeTruthy();

      // 4. Email input references the error message via aria-describedby
      const describedBy = emailInput?.getAttribute('aria-describedby');
      expect(describedBy).toBe(errorId);
    });
  });

  describe('Test 7.3.3 — Row-level summary is accessible', () => {
    test('Given a row in edit mode with multiple invalid fields, When validation has run, Then a row-level error summary element lists the problems, And this summary is reachable and readable by screen readers', async () => {
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

      // Create edit template with error summary
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <div class="error-summary" data-error-summary role="alert" aria-live="polite"></div>
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <input data-bind="email" />
          <span class="field-error" data-field-error="email"></span>
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

      // 1. Error summary element exists
      const errorSummary = row0Edit?.querySelector(
        '[data-error-summary]'
      ) as HTMLElement;
      expect(errorSummary).toBeTruthy();

      // 2. Error summary has role="alert" for screen reader announcement
      expect(errorSummary?.getAttribute('role')).toBe('alert');

      // 3. Error summary has aria-live="polite" for dynamic updates
      expect(errorSummary?.getAttribute('aria-live')).toBe('polite');

      // 4. Error summary lists the problems
      const summaryText = errorSummary?.textContent || '';
      expect(summaryText).toContain('name');
      expect(summaryText).toContain('email');

      // 5. Error summary is visible (not hidden)
      expect(errorSummary?.style.display).not.toBe('none');
      expect(errorSummary?.hasAttribute('hidden')).toBe(false);
    });
  });

  describe('Test 7.3.4 — Error summary clears when all fields become valid', () => {
    test('Given a row with multiple errors showing in the summary, When all fields are corrected, Then the error summary is cleared or hidden', async () => {
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

      // Create edit template with error summary
      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = `
        <div class="row-edit">
          <div class="error-summary" data-error-summary role="alert" aria-live="polite"></div>
          <input data-bind="name" />
          <span class="field-error" data-field-error="name"></span>
          <input data-bind="email" />
          <span class="field-error" data-field-error="email"></span>
          <button data-action="save">Save</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with both fields empty
      el.data = [{ name: '', email: '' }];

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

      // Verify initial error state
      const errorSummaryBefore = row0Edit?.querySelector(
        '[data-error-summary]'
      ) as HTMLElement;
      expect(errorSummaryBefore?.textContent).not.toBe('');

      // Act - Fix both fields
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = 'Alice';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const emailInput = row0Edit?.querySelector(
        'input[data-bind="email"]'
      ) as HTMLInputElement;
      emailInput.value = 'alice@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Assert
      // 1. Error summary is cleared
      const errorSummaryAfter = row0Edit?.querySelector(
        '[data-error-summary]'
      ) as HTMLElement;
      expect(errorSummaryAfter?.textContent).toBe('');

      // 2. Row-level invalid indicator is removed
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(false);
    });
  });
});


describe('CkEditableArray - Step 7.4: Save/Cancel & Validation Interplay', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 7.4.1 — Save on invalid row does not exit edit mode', () => {
    test('Given a row in edit mode with an invalid field, When I click Save, Then the row remains in edit mode, And the invalid field(s) still show their error messages, And el.data does not change, And no datachanged event is emitted', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Set schema with required field
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

      await new Promise(resolve => setTimeout(resolve, 10));

      // Capture initial data state
      const dataBefore = JSON.stringify(el.data);

      // Set up event listener to track datachanged events
      let dataChangedFired = false;
      el.addEventListener('datachanged', () => {
        dataChangedFired = true;
      });

      // Act - Click Save button (should be disabled, but test the behavior)
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;

      // Verify Save button is disabled
      expect(saveButton?.disabled).toBe(true);

      // Try to click it anyway (simulating programmatic click or user attempting)
      saveButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Row remains in edit mode (edit wrapper is visible, display is hidden)
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0EditAfter?.classList.contains('hidden')).toBe(false);
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(true);

      // 2. Error messages still visible
      const errorSpan = row0EditAfter?.querySelector(
        '[data-field-error="name"]'
      );
      expect(errorSpan?.textContent).not.toBe('');
      expect(errorSpan?.textContent).toContain('required');

      // 3. Data has not changed
      const dataAfter = JSON.stringify(el.data);
      expect(dataAfter).toBe(dataBefore);

      // 4. No datachanged event was emitted
      expect(dataChangedFired).toBe(false);
    });
  });

  describe('Test 7.4.2 — Save on valid row clears errors and exits edit mode', () => {
    test('Given a row in edit mode that initially had validation errors, And I correct all invalid fields so the row becomes valid, When I click Save, Then any field-level and row-level error indicators are cleared, And the row returns to display mode, And the displayed values reflect the corrected values, And datachanged fires once with the updated row', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Set schema with required field
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

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify initial invalid state
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(true);

      // Set up event listener to track datachanged events
      let dataChangedCount = 0;
      let lastEventData: unknown = null;
      el.addEventListener('datachanged', (event: Event) => {
        dataChangedCount++;
        lastEventData = (event as CustomEvent).detail.data;
      });

      // Act - Fix the invalid field
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = 'Alice';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify field is now valid
      expect(nameInput?.hasAttribute('data-invalid')).toBe(false);
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(false);

      // Reset event counter (input event may have fired datachanged)
      dataChangedCount = 0;

      // Click Save button
      const saveButton = row0Edit?.querySelector(
        '[data-action="save"]'
      ) as HTMLButtonElement;
      expect(saveButton?.disabled).toBe(false);
      saveButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Row returns to display mode
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0EditAfter?.classList.contains('hidden')).toBe(true);
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);

      // 2. Error indicators are cleared (no data-row-invalid on edit wrapper)
      expect(row0EditAfter?.hasAttribute('data-row-invalid')).toBe(false);

      // 3. Displayed values reflect corrected values
      const displayName = row0DisplayAfter?.querySelector('[data-bind="name"]');
      expect(displayName?.textContent).toBe('Alice');

      // 4. Data is updated
      expect(el.data).toEqual([{ name: 'Alice' }]);

      // 5. datachanged event fired once
      expect(dataChangedCount).toBe(1);
      expect(lastEventData).toEqual([{ name: 'Alice' }]);
    });
  });

  describe('Test 7.4.3 — Cancel ignores validation state and discards unsaved values', () => {
    test('Given a row in edit mode with some invalid values and visible error messages, And some of the edited values differ from the original data, When I click Cancel, Then the row returns to display mode, And any validation errors disappear, And the displayed values revert to the original data, And el.data remains unchanged, And no datachanged event is fired', async () => {
      // Arrange
      const el = new CkEditableArray();

      // Set schema with required field
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
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      el.appendChild(tplEdit);

      // Set initial data with valid name
      el.data = [{ name: 'Alice' }];

      // Attach to document
      document.body.appendChild(el);

      // Capture original data
      const originalData = JSON.stringify(el.data);

      // Toggle row to edit mode
      const row0Display = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      const toggleButton = row0Display?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Set up event listener to track datachanged events
      let dataChangedFired = false;
      el.addEventListener('datachanged', () => {
        dataChangedFired = true;
      });

      // Act - Make the field invalid by clearing it
      const row0Edit = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const nameInput = row0Edit?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      nameInput.value = '';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify field is now invalid
      expect(nameInput?.hasAttribute('data-invalid')).toBe(true);
      expect(row0Edit?.hasAttribute('data-row-invalid')).toBe(true);

      const errorSpan = row0Edit?.querySelector('[data-field-error="name"]');
      expect(errorSpan?.textContent).not.toBe('');

      // Reset event flag (input may have fired datachanged)
      dataChangedFired = false;

      // Click Cancel button
      const cancelButton = row0Edit?.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;
      cancelButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      // 1. Row returns to display mode
      const row0EditAfter = el.shadowRoot?.querySelector(
        '.edit-content[data-row="0"]'
      );
      const row0DisplayAfter = el.shadowRoot?.querySelector(
        '.display-content[data-row="0"]'
      );
      expect(row0EditAfter?.classList.contains('hidden')).toBe(true);
      expect(row0DisplayAfter?.classList.contains('hidden')).toBe(false);

      // 2. Validation errors disappear (no data-row-invalid on edit wrapper)
      expect(row0EditAfter?.hasAttribute('data-row-invalid')).toBe(false);

      // 3. Displayed values revert to original data
      const displayName = row0DisplayAfter?.querySelector('[data-bind="name"]');
      expect(displayName?.textContent).toBe('Alice');

      // 4. el.data remains unchanged
      const dataAfter = JSON.stringify(el.data);
      expect(dataAfter).toBe(originalData);
      expect(el.data).toEqual([{ name: 'Alice' }]);

      // 5. No datachanged event was fired
      expect(dataChangedFired).toBe(false);
    });
  });
});
