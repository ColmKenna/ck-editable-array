/// <reference lib="dom" />
/* eslint-disable no-undef */
import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Define the custom element before running tests
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('CkEditableArray Security - Prototype Pollution', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    // Clean up Object prototype at the start to avoid state leakage from previous tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (Object.prototype as any).polluted;

    // Create a fresh instance for each test
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Clean up after each test
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (Object.prototype as any).polluted;
  });

  const createDisplayTemplate = (bindPath: string): HTMLTemplateElement => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'display');
    template.innerHTML = `<span data-bind="${bindPath}"></span>`;
    return template;
  };

  const createEditTemplate = (bindPath: string): HTMLTemplateElement => {
    const template = document.createElement('template');
    template.setAttribute('slot', 'edit');
    template.innerHTML = `<input type="text" data-bind="${bindPath}" />`;
    return template;
  };

  const setupTemplates = (bindPath: string) => {
    element.appendChild(createDisplayTemplate(bindPath));
    element.appendChild(createEditTemplate(bindPath));
    element.data = [{}];
    element.connectedCallback();

    // Enter edit mode to access inputs
    const toggleButton = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleButton?.click();

    return element.shadowRoot?.querySelector(
      `input[data-bind="${bindPath}"]`
    ) as HTMLInputElement;
  };

  test('should reject prototype pollution via __proto__ path', () => {
    const input = setupTemplates('__proto__.polluted');

    if (input) {
      input.value = 'polluted-value';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Verify prototype was not polluted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((Object.prototype as any).polluted).toBeUndefined();

    // Verify component data was not modified by the pollution attempt
    expect(element.data[0]).not.toHaveProperty('__proto__.polluted');
    expect((element.data[0] as Record<string, unknown>).__proto__).not.toHaveProperty('polluted');
  });

  test('should reject prototype pollution via constructor.prototype path', () => {
    const input = setupTemplates('constructor.prototype.polluted');

    if (input) {
      input.value = 'polluted-value';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Verify prototype was not polluted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((Object.prototype as any).polluted).toBeUndefined();

    // Verify component data was not modified by the pollution attempt
    expect(element.data[0]).not.toHaveProperty('constructor.prototype.polluted');
  });

  test('should reject prototype pollution via prototype path', () => {
    // Although less common in JS object paths than __proto__, still good to block
    const input = setupTemplates('prototype.polluted');

    if (input) {
      input.value = 'polluted-value';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Verify prototype was not polluted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((Object.prototype as any).polluted).toBeUndefined();

    // Verify component data was not modified by the pollution attempt
    expect(element.data[0]).not.toHaveProperty('prototype.polluted');
  });

  test('should reject prototype pollution in deep nested path', () => {
    const input = setupTemplates('a.b.__proto__.polluted');

    if (input) {
      input.value = 'polluted-value';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Verify prototype was not polluted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((Object.prototype as any).polluted).toBeUndefined();

    // Verify component data was not modified by the pollution attempt
    expect(element.data[0]).not.toHaveProperty('a.b.__proto__.polluted');
    // Also verify nested structure was not created as a pollution vector
    const dataItem = element.data[0] as Record<string, unknown>;
    if (dataItem.a && typeof dataItem.a === 'object') {
      const aObj = dataItem.a as Record<string, unknown>;
      if (aObj.b && typeof aObj.b === 'object') {
        const bObj = aObj.b as Record<string, unknown>;
        expect(bObj.__proto__).not.toHaveProperty('polluted');
      }
    }
  });
});
