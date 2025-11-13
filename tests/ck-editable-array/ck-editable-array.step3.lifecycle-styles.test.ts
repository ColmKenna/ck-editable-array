import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('CkEditableArray - Step 3: Lifecycle & Styles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Test 3.1 — Rendering with empty data', () => {
    describe('Test 3.1.1 — No data: renders scaffolding but no rows', () => {
      test('Given a <ck-editable-array> element whose data property is an empty array, And it is not yet attached to the DOM, When I append it to document.body, Then the element has a shadowRoot, And the shadow root contains the core scaffolding (e.g. a rows container and an add-button container), And there are no rendered rows in the rows container', () => {
        // Arrange
        const el = new CkEditableArray();
        el.data = [];

        // Verify element is not yet attached
        expect(el.isConnected).toBe(false);

        // Act
        document.body.appendChild(el);

        // Assert
        // 1. Element has a shadowRoot
        expect(el.shadowRoot).not.toBeNull();
        expect(el.shadowRoot?.mode).toBe('open');

        // 2. Shadow root contains core scaffolding
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();
        expect(rowsContainer?.tagName.toLowerCase()).toBe('div');

        const addButtonContainer = el.shadowRoot?.querySelector(
          '[part="add-button"]'
        );
        expect(addButtonContainer).not.toBeNull();
        expect(addButtonContainer?.tagName.toLowerCase()).toBe('div');

        // 3. There are no rendered rows in the rows container
        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRows = el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        expect(displayRows?.length).toBe(0);
        expect(editRows?.length).toBe(0);

        // Also verify rows container is empty
        expect(rowsContainer?.children.length).toBe(0);
      });
    });

    describe('Test 3.1.2 — Existing data: renders rows on connect', () => {
      test('Given a <ck-editable-array> element whose data has already been set to an array of items (for example 2 items), And it is not yet attached to the DOM, When I append it to document.body, Then the shadow root contains a rows container, And the rows container has exactly 2 rendered rows corresponding to the 2 data items', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create display template
        const tplDisplay = document.createElement('template');
        tplDisplay.setAttribute('slot', 'display');
        tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="label"></span>
          </div>
        `;
        el.appendChild(tplDisplay);

        // Create edit template
        const tplEdit = document.createElement('template');
        tplEdit.setAttribute('slot', 'edit');
        tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="label" />
          </div>
        `;
        el.appendChild(tplEdit);

        // Set data before connecting
        el.data = [{ label: 'Item 1' }, { label: 'Item 2' }];

        // Verify element is not yet attached
        expect(el.isConnected).toBe(false);

        // Act
        document.body.appendChild(el);

        // Assert
        // 1. Shadow root contains rows container
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();
        expect(rowsContainer?.tagName.toLowerCase()).toBe('div');

        // 2. Rows container has exactly 2 rendered rows (display + edit for each item)
        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRows = el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        expect(displayRows?.length).toBe(2);
        expect(editRows?.length).toBe(2);

        // 3. Verify the rows correspond to the data items
        const displaySpans = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"] [data-bind="label"]'
        );
        expect(displaySpans?.length).toBe(2);
        expect(displaySpans?.[0].textContent).toBe('Item 1');
        expect(displaySpans?.[1].textContent).toBe('Item 2');

        // 4. Verify rows are in the rows container
        const rowsInContainer = rowsContainer?.querySelectorAll('[data-row]');
        expect(rowsInContainer?.length).toBe(4); // 2 display + 2 edit = 4 total
      });
    });

    describe('Test 3.1.3 — Idempotency: connecting again does not duplicate rows', () => {
      test('Given a <ck-editable-array> element, And it is appended to document.body with data set to two items, When I remove it from document.body, And then append the same element back to document.body, Then the rows container still has exactly 2 rows (no duplicate rows appear)', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create display template
        const tplDisplay = document.createElement('template');
        tplDisplay.setAttribute('slot', 'display');
        tplDisplay.innerHTML = `
          <div class="row-display">
            <span data-bind="label"></span>
          </div>
        `;
        el.appendChild(tplDisplay);

        // Create edit template
        const tplEdit = document.createElement('template');
        tplEdit.setAttribute('slot', 'edit');
        tplEdit.innerHTML = `
          <div class="row-edit">
            <input data-bind="label" />
          </div>
        `;
        el.appendChild(tplEdit);

        // Set data and append to document
        el.data = [{ label: 'Item 1' }, { label: 'Item 2' }];
        document.body.appendChild(el);

        // Verify initial state - 2 rows rendered
        const displayRowsInitial = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRowsInitial =
          el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        expect(displayRowsInitial?.length).toBe(2);
        expect(editRowsInitial?.length).toBe(2);

        // Act - Remove from DOM
        document.body.removeChild(el);
        expect(el.isConnected).toBe(false);

        // Act - Append back to DOM
        document.body.appendChild(el);
        expect(el.isConnected).toBe(true);

        // Assert - Still exactly 2 rows (no duplicates)
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();

        const displayRows = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"]'
        );
        const editRows = el.shadowRoot?.querySelectorAll('[data-mode="edit"]');

        expect(displayRows?.length).toBe(2);
        expect(editRows?.length).toBe(2);

        // Verify the content is still correct
        const displaySpans = el.shadowRoot?.querySelectorAll(
          '[data-mode="display"] [data-bind="label"]'
        );
        expect(displaySpans?.length).toBe(2);
        expect(displaySpans?.[0].textContent).toBe('Item 1');
        expect(displaySpans?.[1].textContent).toBe('Item 2');

        // Verify total row count in container
        const rowsInContainer = rowsContainer?.querySelectorAll('[data-row]');
        expect(rowsInContainer?.length).toBe(4); // Still 2 display + 2 edit = 4 total
      });
    });
  });

  describe('Test 3.2 — Style slot mirroring — initial sync', () => {
    describe('Test 3.2.1 — Single <style slot="styles"> is mirrored into shadow DOM', () => {
      test('Given a <ck-editable-array> element in the light DOM, And a <style slot="styles"> child inside it with distinctive CSS text (e.g. .foo { border: 3px solid; }), And the element is not yet attached to the DOM, When I append the <ck-editable-array> element to document.body, Then its shadowRoot contains a <style> element, And that <style> element\'s text includes the distinctive CSS .foo { border: 3px solid; }', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create style element with distinctive CSS
        const styleEl = document.createElement('style');
        styleEl.setAttribute('slot', 'styles');
        styleEl.textContent = '.foo { border: 3px solid; }';
        el.appendChild(styleEl);

        // Verify element is not yet attached
        expect(el.isConnected).toBe(false);

        // Act
        document.body.appendChild(el);

        // Assert
        // 1. Shadow root contains a <style> element
        const shadowStyles = el.shadowRoot?.querySelectorAll('style');
        expect(shadowStyles).not.toBeNull();
        expect(shadowStyles!.length).toBeGreaterThan(0);

        // 2. The style element's text includes the distinctive CSS
        const allStyleText = Array.from(shadowStyles!)
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.foo { border: 3px solid; }');
      });
    });

    describe('Test 3.2.2 — Multiple <style slot="styles"> entries are combined', () => {
      test('Given a <ck-editable-array> element in the light DOM, And two <style slot="styles"> children, one containing .a { color: red; } and the other containing .b { color: blue; }, When I append the element to document.body, Then its shadowRoot contains at least one <style> element, And the text inside that style element includes both .a { color: red; } and .b { color: blue; }', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create first style element
        const styleEl1 = document.createElement('style');
        styleEl1.setAttribute('slot', 'styles');
        styleEl1.textContent = '.a { color: red; }';
        el.appendChild(styleEl1);

        // Create second style element
        const styleEl2 = document.createElement('style');
        styleEl2.setAttribute('slot', 'styles');
        styleEl2.textContent = '.b { color: blue; }';
        el.appendChild(styleEl2);

        // Act
        document.body.appendChild(el);

        // Assert
        // 1. Shadow root contains at least one <style> element
        const shadowStyles = el.shadowRoot?.querySelectorAll('style');
        expect(shadowStyles).not.toBeNull();
        expect(shadowStyles!.length).toBeGreaterThan(0);

        // 2. The combined style text includes both CSS rules
        const allStyleText = Array.from(shadowStyles!)
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.a { color: red; }');
        expect(allStyleText).toContain('.b { color: blue; }');
      });
    });

    describe('Test 3.2.3 — Style slot with whitespace-only content is effectively ignored', () => {
      test('Given a <ck-editable-array> element with a <style slot="styles"> that only contains whitespace or an empty string, When I append the element to document.body, Then no extra empty or meaningless styles are added beyond what the component itself defines, And the shadow DOM does not contain duplicate empty <style> tags for each empty slot', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create empty style element
        const styleEl1 = document.createElement('style');
        styleEl1.setAttribute('slot', 'styles');
        styleEl1.textContent = '';
        el.appendChild(styleEl1);

        // Create whitespace-only style element
        const styleEl2 = document.createElement('style');
        styleEl2.setAttribute('slot', 'styles');
        styleEl2.textContent = '   \n\t  ';
        el.appendChild(styleEl2);

        // Act
        document.body.appendChild(el);

        // Assert
        // 1. Shadow root should not contain mirrored style elements for empty content
        const mirroredStyles = el.shadowRoot?.querySelectorAll(
          'style[data-mirrored]'
        );

        // With the optimization, no mirrored styles should be created for empty/whitespace content
        expect(mirroredStyles?.length || 0).toBe(0);

        // 2. Verify we don't have any non-empty style tags
        const allStyles = el.shadowRoot?.querySelectorAll('style');
        const nonEmptyStyles = Array.from(allStyles || []).filter(style => {
          const content = style.textContent || '';
          return content.trim().length > 0;
        });

        // Should have no non-empty styles (since we only added empty/whitespace styles)
        expect(nonEmptyStyles.length).toBe(0);
      });
    });
  });
});
