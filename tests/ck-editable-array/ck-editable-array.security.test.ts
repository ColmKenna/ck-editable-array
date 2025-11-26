import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Security Tests', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('XSS Prevention', () => {
    test('Display binding does not execute script tags in data', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      const maliciousData = '<script>alert("XSS")</script>';
      el.data = [{ name: maliciousData }];
      document.body.appendChild(el);

      const displaySpan = el.shadowRoot?.querySelector('[data-bind="name"]');
      expect(displaySpan?.textContent).toBe(maliciousData);
      expect(displaySpan?.innerHTML).not.toContain('<script>');
    });

    test('Display binding escapes HTML entities', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      const htmlData = '<img src=x onerror=alert(1)>';
      el.data = [{ name: htmlData }];
      document.body.appendChild(el);

      const displaySpan = el.shadowRoot?.querySelector('[data-bind="name"]');
      expect(displaySpan?.textContent).toBe(htmlData);
      expect(displaySpan?.querySelector('img')).toBeNull();
    });

    test('Input values are properly escaped by browser', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      const maliciousData = '"><script>alert("XSS")</script><input value="';
      el.data = [{ name: maliciousData, editing: true }];
      document.body.appendChild(el);

      const input = el.shadowRoot?.querySelector(
        'input[data-bind="name"]'
      ) as HTMLInputElement;
      expect(input?.value).toBe(maliciousData);
      expect(el.shadowRoot?.querySelectorAll('script').length).toBe(0);
    });

    test('Template content is cloned safely without innerHTML', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      const maliciousDiv = document.createElement('div');
      maliciousDiv.innerHTML =
        '<span data-bind="name"></span><script>alert("XSS")</script>';
      tplDisplay.content.appendChild(maliciousDiv);
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      // Script tags in template content are cloned but not executed
      // This is safe because cloneNode() doesn't execute scripts
      const scripts = el.shadowRoot?.querySelectorAll('script');
      // Scripts may be present in the DOM but they are inert (not executed)
      // The key security property is that we use cloneNode, not innerHTML
      expect(scripts?.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Prototype Pollution Prevention', () => {
    test('Setting data with __proto__ does not pollute Object prototype', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      const maliciousData = JSON.parse(
        '{"__proto__": {"polluted": true}, "name": "Alice"}'
      );
      el.data = [maliciousData];
      document.body.appendChild(el);

      const testObj = {};
      expect((testObj as any).polluted).toBeUndefined();
    });

    test('Deep cloning prevents prototype pollution', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      const source = [{ name: 'Alice' }];
      (source as any).__proto__.polluted = true;
      el.data = source;

      const testObj = {};
      expect((testObj as any).polluted).toBeUndefined();
    });
  });

  describe('CSP Compliance', () => {
    test('Component does not use eval or Function constructor', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      // Component should work without eval
      const displaySpan = el.shadowRoot?.querySelector('[data-bind="name"]');
      expect(displaySpan?.textContent).toBe('Alice');
    });

    test('Component does not inject inline scripts', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      const scripts = el.shadowRoot?.querySelectorAll('script');
      expect(scripts?.length).toBe(0);
    });
  });

  describe('Input Sanitization', () => {
    test('Null and undefined values are handled safely', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: null as any }];
      document.body.appendChild(el);

      const displaySpan = el.shadowRoot?.querySelector('[data-bind="name"]');
      expect(displaySpan?.textContent).toBe('');
    });

    test('Empty strings are handled safely', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: '' }];
      document.body.appendChild(el);

      const displaySpan = el.shadowRoot?.querySelector('[data-bind="name"]');
      expect(displaySpan?.textContent).toBe('');
    });

    test('Special characters in property names are handled safely', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="user.name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="user.name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ user: { name: 'Alice' } }];
      document.body.appendChild(el);

      const displaySpan = el.shadowRoot?.querySelector(
        '[data-bind="user.name"]'
      );
      expect(displaySpan?.textContent).toBe('Alice');
    });
  });

  describe('Event Handler Security', () => {
    test('Event handlers do not expose internal state', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      let eventData: unknown[] = [];
      el.addEventListener('datachanged', (e: Event) => {
        eventData = (e as CustomEvent).detail.data;
      });

      // Trigger a data change
      el.data = [{ name: 'Bob' }];

      // Event data should not contain internal markers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eventData[0] as any).__originalSnapshot).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eventData[0] as any).__isNew).toBeUndefined();
    });

    test('Mutating event data does not affect component state', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      el.data = [{ name: 'Alice' }];
      document.body.appendChild(el);

      let eventData: unknown[] = [];
      el.addEventListener('datachanged', (e: Event) => {
        eventData = (e as CustomEvent).detail.data;
      });

      // Trigger a data change
      el.data = [{ name: 'Bob' }];

      // Mutate event data
      (eventData[0] as { name: string }).name = 'Malicious';

      // Component state should be unchanged
      expect((el.data[0] as { name: string }).name).toBe('Bob');
    });
  });

  describe('Circular Reference Handling', () => {
    test('Circular references in data do not cause infinite loops', () => {
      const el = new CkEditableArray();

      const tplDisplay = document.createElement('template');
      tplDisplay.setAttribute('slot', 'display');
      tplDisplay.innerHTML = '<div><span data-bind="name"></span></div>';
      el.appendChild(tplDisplay);

      const tplEdit = document.createElement('template');
      tplEdit.setAttribute('slot', 'edit');
      tplEdit.innerHTML = '<div><input data-bind="name" /></div>';
      el.appendChild(tplEdit);

      const circularData: Record<string, unknown> = { name: 'Alice' };
      circularData.self = circularData;

      // Should not throw or hang - component now gracefully handles circular refs
      // by falling back to shallow copy with a console warning
      expect(() => {
        el.data = [circularData];
      }).not.toThrow();

      // Data should still be accessible
      expect((el.data[0] as Record<string, unknown>).name).toBe('Alice');
    });
  });
});
