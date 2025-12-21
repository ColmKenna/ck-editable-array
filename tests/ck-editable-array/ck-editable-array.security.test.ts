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
        // Create a fresh instance for each test
        element = new CkEditableArray();
        document.body.appendChild(element);

        // Reset Object prototype after each test if needed (though we expect to fail)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (Object.prototype as any).polluted;
    });

    afterEach(() => {
        // Clean up after each test
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (Object.prototype as any).polluted;
    });

    const setupTemplates = (bindPath: string) => {
        const displayTemplate = document.createElement('template');
        displayTemplate.setAttribute('slot', 'display');
        displayTemplate.innerHTML = `<span data-bind="${bindPath}"></span>`;
        element.appendChild(displayTemplate);

        const editTemplate = document.createElement('template');
        editTemplate.setAttribute('slot', 'edit');
        editTemplate.innerHTML = `<input type="text" data-bind="${bindPath}" />`;
        element.appendChild(editTemplate);

        element.data = [{}];
        element.connectedCallback();

        // Enter edit mode to access inputs
        const toggleButton = element.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLButtonElement;
        toggleButton?.click();

        return element.shadowRoot?.querySelector(`input[data-bind="${bindPath}"]`) as HTMLInputElement;
    };

    test('should reject prototype pollution via __proto__ path', () => {
        const input = setupTemplates('__proto__.polluted');

        if (input) {
            input.value = 'polluted-value';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((Object.prototype as any).polluted).toBeUndefined();
    });

    test('should reject prototype pollution via constructor.prototype path', () => {
        const input = setupTemplates('constructor.prototype.polluted');

        if (input) {
            input.value = 'polluted-value';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((Object.prototype as any).polluted).toBeUndefined();
    });

    test('should reject prototype pollution via prototype path', () => {
        // Although less common in JS object paths than __proto__, still good to block
        const input = setupTemplates('prototype.polluted');

        if (input) {
            input.value = 'polluted-value';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((Object.prototype as any).polluted).toBeUndefined();
    });

    test('should reject prototype pollution in deep nested path', () => {
        const input = setupTemplates('a.b.__proto__.polluted');

        if (input) {
            input.value = 'polluted-value';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((Object.prototype as any).polluted).toBeUndefined();
    });
});
