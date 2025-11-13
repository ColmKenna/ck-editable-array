import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray (basic)', () => {
  test('exports a class constructor', () => {
    expect(typeof CkEditableArray).toBe('function');
  });

  test('registers the custom element name `ck-editable-array`', () => {
    // Expect the implementation to register the element with the browser
    const registered = customElements.get('ck-editable-array');
    expect(registered).toBe(CkEditableArray);
  });
});
