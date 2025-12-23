/// <reference lib="dom" />
/* eslint-disable no-undef */
import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Define the custom element before running tests
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

const createDisplayTemplate = (innerHTML: string): HTMLTemplateElement => {
  const template = document.createElement('template');
  template.setAttribute('slot', 'display');
  template.innerHTML = innerHTML;
  return template;
};

const createEditTemplate = (innerHTML: string): HTMLTemplateElement => {
  const template = document.createElement('template');
  template.setAttribute('slot', 'edit');
  template.innerHTML = innerHTML;
  return template;
};

describe('CkEditableArray Security', () => {
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

  test('should remove script tags from display template', () => {
    const maliciousCode = `
      <span data-bind="name"></span>
      <script>window.pwned = true;</script>
    `;
    element.appendChild(createDisplayTemplate(maliciousCode));
    element.data = [{ name: 'Test' }];
    element.connectedCallback();

    const shadowContent = element.shadowRoot?.innerHTML || '';
    expect(shadowContent).not.toContain('<script>');
    expect((window as any).pwned).toBeUndefined();
  });

  test('should remove on* attributes from display template', () => {
    const maliciousCode = `
      <button onclick="window.pwned = true" data-bind="name"></button>
    `;
    element.appendChild(createDisplayTemplate(maliciousCode));
    element.data = [{ name: 'Test' }];
    element.connectedCallback();

    const button = element.shadowRoot?.querySelector('button');
    expect(button?.hasAttribute('onclick')).toBe(false);

    // Trigger click just in case
    button?.click();
    expect((window as any).pwned).toBeUndefined();
  });

  test('should remove script tags from edit template', () => {
    const maliciousCode = `
      <input type="text" data-bind="name" />
      <script>window.pwnedEdit = true;</script>
    `;
    element.appendChild(createDisplayTemplate('<span data-bind="name"></span>'));
    element.appendChild(createEditTemplate(maliciousCode));

    element.data = [{ name: 'Test' }];
    element.connectedCallback();

    // Enter edit mode
    const row = element.shadowRoot?.querySelector('[data-row="0"]');
    const toggleBtn = row?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    toggleBtn.click();

    const shadowContent = element.shadowRoot?.innerHTML || '';
    expect(shadowContent).not.toContain('<script>');
    expect((window as any).pwnedEdit).toBeUndefined();
  });

  test('should remove on* attributes from edit template', () => {
    const maliciousCode = `
      <input type="text" data-bind="name" oninput="window.pwnedEdit = true" />
    `;
    element.appendChild(createDisplayTemplate('<span data-bind="name"></span>'));
    element.appendChild(createEditTemplate(maliciousCode));

    element.data = [{ name: 'Test' }];
    element.connectedCallback();

    // Enter edit mode
    const row = element.shadowRoot?.querySelector('[data-row="0"]');
    const toggleBtn = row?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    toggleBtn.click();

    const input = row?.querySelector('input');
    expect(input?.hasAttribute('oninput')).toBe(false);

    // Trigger input just in case
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    expect((window as any).pwnedEdit).toBeUndefined();
  });
});
