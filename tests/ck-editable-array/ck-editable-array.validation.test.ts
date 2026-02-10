/// <reference lib="dom" />
/* eslint-disable no-undef */
import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Define the custom element before running tests
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

const createDisplayTemplate = (bindPath: string): HTMLTemplateElement => {
  const template = document.createElement('template');
  template.setAttribute('slot', 'display');
  template.innerHTML = `<span data-bind="${bindPath}"></span>`;
  return template;
};

const createEditTemplate = (innerHTML: string): HTMLTemplateElement => {
  const template = document.createElement('template');
  template.setAttribute('slot', 'edit');
  template.innerHTML = innerHTML;
  return template;
};

const attachTemplates = (
  element: CkEditableArray,
  displayBindPath: string,
  editInnerHTML?: string
): void => {
  element.appendChild(createDisplayTemplate(displayBindPath));
  element.appendChild(
    createEditTemplate(
      editInnerHTML || `<input type="text" data-bind="${displayBindPath}" />`
    )
  );
};

/**
 * Helper: enter edit mode for a given row index, returns the row element.
 */
const enterEditMode = (
  element: CkEditableArray,
  rowIndex: number
): HTMLElement => {
  const toggleButton = element.shadowRoot?.querySelector(
    `[data-row="${rowIndex}"] [data-action="toggle"]`
  ) as HTMLButtonElement;
  toggleButton?.click();
  return element.shadowRoot?.querySelector(
    `[data-row="${rowIndex}"]`
  ) as HTMLElement;
};

/**
 * Helper: click save for a given row.
 */
const clickSave = (element: CkEditableArray, rowIndex: number): void => {
  const saveButton = element.shadowRoot?.querySelector(
    `[data-row="${rowIndex}"] [data-action="save"]`
  ) as HTMLButtonElement;
  saveButton?.click();
};

describe('Edit Section Validation', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  // ========================================================================
  // beforesave Event Tests
  // ========================================================================

  describe('beforesave Event', () => {
    test('should dispatch cancelable beforesave event with rowIndex and rowData before saving', () => {
      attachTemplates(element, 'name');
      element.data = [{ name: 'Alice' }];
      element.connectedCallback();

      const handler = jest.fn();
      element.addEventListener('beforesave', handler);

      enterEditMode(element, 0);
      clickSave(element, 0);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('beforesave');
      expect(event.cancelable).toBe(true);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect(event.detail.rowIndex).toBe(0);
      expect(event.detail.rowData).toEqual({ name: 'Alice' });
    });

    test('should block save when beforesave is prevented via preventDefault', () => {
      attachTemplates(element, 'name');
      element.data = [{ name: 'Alice' }];
      element.connectedCallback();

      element.addEventListener('beforesave', (event: Event) => {
        event.preventDefault();
      });

      const row = enterEditMode(element, 0);
      clickSave(element, 0);

      // Row should still be in edit mode
      expect(row.getAttribute('data-mode')).toBe('edit');
    });
  });

  // ========================================================================
  // Form Control Validation Tests
  // ========================================================================

  describe('Form Control Validation (checkValidity / reportValidity)', () => {
    test('should block save when edit template contains invalid form controls', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: '' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);

      // Clear the input to make it invalid
      const input = row.querySelector(
        '.edit-content input[data-bind="name"]'
      ) as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      clickSave(element, 0);

      // Row should remain in edit mode because input is required but empty
      expect(row.getAttribute('data-mode')).toBe('edit');
    });

    test('should call reportValidity on the first invalid control when save is blocked', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: '' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);

      const input = row.querySelector(
        '.edit-content input[data-bind="name"]'
      ) as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Spy on reportValidity
      const reportSpy = jest.spyOn(input, 'reportValidity');

      clickSave(element, 0);

      expect(reportSpy).toHaveBeenCalled();
      reportSpy.mockRestore();
    });

    test('should allow save when all form controls are valid', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: 'Alice' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);

      // Input is pre-filled with "Alice" which satisfies required
      clickSave(element, 0);

      // Row should return to display mode
      expect(row.getAttribute('data-mode')).toBe('display');
    });

    test('should handle multiple invalid controls and report on first invalid', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate(
          '<input type="email" data-bind="email" required />' +
            '<input type="text" data-bind="name" required />'
        )
      );
      element.data = [{ email: '', name: '' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);

      const emailInput = row.querySelector(
        '.edit-content input[data-bind="email"]'
      ) as HTMLInputElement;
      const nameInput = row.querySelector(
        '.edit-content input[data-bind="name"]'
      ) as HTMLInputElement;
      emailInput.value = '';
      nameInput.value = '';

      const emailReportSpy = jest.spyOn(emailInput, 'reportValidity');
      const nameReportSpy = jest.spyOn(nameInput, 'reportValidity');

      clickSave(element, 0);

      // First invalid control should get reportValidity called
      expect(emailReportSpy).toHaveBeenCalled();
      // Second invalid should NOT get reportValidity (only first)
      expect(nameReportSpy).not.toHaveBeenCalled();

      emailReportSpy.mockRestore();
      nameReportSpy.mockRestore();
    });
  });

  // ========================================================================
  // Visual Invalid State Feedback
  // ========================================================================

  describe('Visual Invalid State Feedback', () => {
    test('should add ck-invalid class and aria-invalid when validation fails', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: '' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);
      const input = row.querySelector(
        '.edit-content input[data-bind="name"]'
      ) as HTMLInputElement;
      input.value = '';

      clickSave(element, 0);

      expect(row.classList.contains('ck-invalid')).toBe(true);
      expect(row.getAttribute('aria-invalid')).toBe('true');
    });

    test('should clear ck-invalid and aria-invalid on successful save', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: '' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);
      const input = row.querySelector(
        '.edit-content input[data-bind="name"]'
      ) as HTMLInputElement;

      // First attempt: invalid
      input.value = '';
      clickSave(element, 0);
      expect(row.classList.contains('ck-invalid')).toBe(true);

      // Fix the value and save again
      input.value = 'ValidName';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      clickSave(element, 0);

      expect(row.classList.contains('ck-invalid')).toBe(false);
      expect(row.hasAttribute('aria-invalid')).toBe(false);
    });

    test('should clear ck-invalid and aria-invalid on cancel', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: '' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);
      const input = row.querySelector(
        '.edit-content input[data-bind="name"]'
      ) as HTMLInputElement;
      input.value = '';

      // Trigger failed validation
      clickSave(element, 0);
      expect(row.classList.contains('ck-invalid')).toBe(true);

      // Cancel should clear the invalid state
      const cancelButton = row.querySelector(
        '[data-action="cancel"]'
      ) as HTMLButtonElement;
      cancelButton?.click();

      expect(row.classList.contains('ck-invalid')).toBe(false);
      expect(row.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ========================================================================
  // ElementInternals Validity Integration
  // ========================================================================

  describe('ElementInternals Validity Integration', () => {
    test('should call setValidity with error when validation fails', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: '' }];
      element.connectedCallback();

      // Access internals via the component's private _internals
      const internals = (element as unknown as { _internals: ElementInternals })
        ._internals;
      // jsdom doesn't implement setValidity; add a mock so we can spy
      if (typeof internals.setValidity !== 'function') {
        (internals as unknown as Record<string, unknown>).setValidity =
          jest.fn();
      }
      const setValiditySpy = jest.spyOn(internals, 'setValidity');

      const row = enterEditMode(element, 0);
      const input = row.querySelector(
        '.edit-content input[data-bind="name"]'
      ) as HTMLInputElement;
      input.value = '';

      clickSave(element, 0);

      // setValidity should have been called with a validity flags object indicating error
      expect(setValiditySpy).toHaveBeenCalled();
      const callArgs = setValiditySpy.mock.calls;
      const lastCall = callArgs[callArgs.length - 1];
      expect(lastCall[0]).toEqual(
        expect.objectContaining({ customError: true })
      );

      setValiditySpy.mockRestore();
    });

    test('should clear validity via setValidity after successful save', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<input type="text" data-bind="name" required />')
      );
      element.data = [{ name: 'Valid' }];
      element.connectedCallback();

      const internals = (element as unknown as { _internals: ElementInternals })
        ._internals;
      // jsdom doesn't implement setValidity; add a mock so we can spy
      if (typeof internals.setValidity !== 'function') {
        (internals as unknown as Record<string, unknown>).setValidity =
          jest.fn();
      }
      const setValiditySpy = jest.spyOn(internals, 'setValidity');

      enterEditMode(element, 0);
      clickSave(element, 0);

      // setValidity should have been called with empty flags (clearing)
      expect(setValiditySpy).toHaveBeenCalled();
      const callArgs = setValiditySpy.mock.calls;
      const lastCall = callArgs[callArgs.length - 1];
      expect(lastCall[0]).toEqual({});

      setValiditySpy.mockRestore();
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    test('should allow save when edit template has no form controls', () => {
      element.appendChild(createDisplayTemplate('name'));
      element.appendChild(
        createEditTemplate('<div data-bind="name">Static edit display</div>')
      );
      element.data = [{ name: 'Alice' }];
      element.connectedCallback();

      const row = enterEditMode(element, 0);
      clickSave(element, 0);

      // No form controls → validation passes → save proceeds
      expect(row.getAttribute('data-mode')).toBe('display');
    });

    test('should not run validation in readonly mode (save is already blocked)', () => {
      attachTemplates(element, 'name');
      element.setAttribute('readonly', '');
      element.data = [{ name: 'Alice' }];
      element.connectedCallback();

      const row = element.shadowRoot?.querySelector(
        '[data-row="0"]'
      ) as HTMLElement;

      // Readonly prevents entering edit mode entirely
      const toggleButton = row.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleButton?.click();

      expect(row.getAttribute('data-mode')).toBe('display');
    });
  });
});
