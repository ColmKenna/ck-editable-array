import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Very lightweight performance probe (jsdom environment) – not a real browser metric.
// Provides a baseline ensuring construction & initial render stay below rough thresholds.

describe('ck-editable-array performance baseline', () => {
  beforeAll(() => {
    if (!customElements.get('ck-editable-array')) {
      customElements.define('ck-editable-array', CkEditableArray);
    }
  });

  test('construction + initial render under ~100ms for small dataset', () => {
    const start = Date.now();
    const el = document.createElement('ck-editable-array') as CkEditableArray;
    el.innerHTML = `
      <template slot="display"><div><span data-bind="value"></span></div></template>
      <template slot="edit"><div><input data-bind="value" /></div></template>
    `;
    document.body.appendChild(el);
    el.data = Array.from({ length: 5 }, (_, i) => `Item ${i}`);
    const end = Date.now();
    const duration = end - start;
    // jsdom can vary across environments; keep a generous ceiling to avoid flakiness.
    expect(duration).toBeLessThan(100); // ms
  });
});
