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

        // 2. Verify we only have the component's base style (not mirrored styles)
        const allStyles = el.shadowRoot?.querySelectorAll('style');
        const nonEmptyStyles = Array.from(allStyles || []).filter(style => {
          const content = style.textContent || '';
          return content.trim().length > 0;
        });

        // Should have exactly 1 non-empty style (the component's base .hidden style)
        expect(nonEmptyStyles.length).toBe(1);
      });
    });
  });

  describe('Test 3.3 — Live style updates — MutationObserver behaviour', () => {
    describe('Test 3.3.1 — Editing light DOM style updates shadow DOM style', () => {
      test('Given a <ck-editable-array> element with a <style slot="styles"> child, And this child initially contains .run { color: green; }, And the element is attached to document.body, When I change the text content of the <style slot="styles"> in the light DOM to .run { color: purple; }, And I allow any observers/microtasks to run, Then the corresponding <style> inside the shadow root now contains .run { color: purple; }, And it no longer contains the previous green CSS', async () => {
        // Arrange
        const el = new CkEditableArray();

        // Create style element with initial CSS
        const styleEl = document.createElement('style');
        styleEl.setAttribute('slot', 'styles');
        styleEl.textContent = '.run { color: green; }';
        el.appendChild(styleEl);

        // Attach to DOM
        document.body.appendChild(el);

        // Verify initial state
        let allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.run { color: green; }');

        // Act - Change the style content
        styleEl.textContent = '.run { color: purple; }';

        // Allow observers/microtasks to run
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        // 1. Shadow root now contains the updated CSS
        allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.run { color: purple; }');

        // 2. No longer contains the previous green CSS
        expect(allStyleText).not.toContain('.run { color: green; }');
      });
    });

    describe('Test 3.3.2 — Adding a new <style slot="styles"> after connect is mirrored', () => {
      test('Given a <ck-editable-array> element attached to document.body, And it initially has no <style slot="styles"> children, When I append a new <style slot="styles"> child with content .extra { padding: 4px; } into the light DOM, And I allow observers/microtasks to run, Then the shadow root contains a <style> element whose text includes .extra { padding: 4px; }', async () => {
        // Arrange
        const el = new CkEditableArray();

        // Attach to DOM without any styles
        document.body.appendChild(el);

        // Verify no mirrored styles initially
        let mirroredStyles = el.shadowRoot?.querySelectorAll(
          'style[data-mirrored]'
        );
        expect(mirroredStyles?.length || 0).toBe(0);

        // Act - Add a new style element
        const styleEl = document.createElement('style');
        styleEl.setAttribute('slot', 'styles');
        styleEl.textContent = '.extra { padding: 4px; }';
        el.appendChild(styleEl);

        // Allow observers/microtasks to run
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        // Shadow root now contains the new CSS
        const allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.extra { padding: 4px; }');
      });
    });

    describe('Test 3.3.3 — Removing a <style slot="styles"> child removes its CSS from shadow DOM', () => {
      test('Given a <ck-editable-array> element attached to document.body, And it has a <style slot="styles"> child containing .temp { margin: 1px; }, When I remove that <style slot="styles"> node from the light DOM, And I allow observers/microtasks to run, Then the shadow root\'s <style> text no longer includes .temp { margin: 1px; }', async () => {
        // Arrange
        const el = new CkEditableArray();

        // Create style element
        const styleEl = document.createElement('style');
        styleEl.setAttribute('slot', 'styles');
        styleEl.textContent = '.temp { margin: 1px; }';
        el.appendChild(styleEl);

        // Attach to DOM
        document.body.appendChild(el);

        // Verify initial state - style is mirrored
        let allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.temp { margin: 1px; }');

        // Act - Remove the style element
        el.removeChild(styleEl);

        // Allow observers/microtasks to run
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        // Shadow root no longer contains the removed CSS
        allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).not.toContain('.temp { margin: 1px; }');
      });
    });
  });

  describe('Test 3.4 — disconnectedCallback — cleanup / observers stop reacting', () => {
    describe('Test 3.4.1 — Style mirroring stops after disconnect', () => {
      test('Given a <ck-editable-array> element with a <style slot="styles"> child, And the element is attached to document.body, so the shadow DOM has a mirrored style element, When I remove the <ck-editable-array> element from document.body, And then change the text content of the <style slot="styles"> child in the light DOM, And I allow time for any previous observers to run, Then the <style> in the (now-detached) shadow root does not update to the new CSS text', async () => {
        // Arrange
        const el = new CkEditableArray();

        // Create style element with initial CSS
        const styleEl = document.createElement('style');
        styleEl.setAttribute('slot', 'styles');
        styleEl.textContent = '.foo { color: red; }';
        el.appendChild(styleEl);

        // Attach to DOM
        document.body.appendChild(el);

        // Verify initial state - style is mirrored
        let allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.foo { color: red; }');

        // Act - Remove from DOM
        document.body.removeChild(el);
        expect(el.isConnected).toBe(false);

        // Capture the style text after disconnect
        const styleTextAfterDisconnect = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');

        // Change the light DOM style while disconnected
        styleEl.textContent = '.foo { color: blue; }';

        // Allow time for any observers to run
        await new Promise(resolve => setTimeout(resolve, 10));

        // Assert - Shadow root style should NOT have updated
        const styleTextAfterChange = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');

        // The style text should remain unchanged (still red, not blue)
        expect(styleTextAfterChange).toBe(styleTextAfterDisconnect);
        expect(styleTextAfterChange).toContain('.foo { color: red; }');
        expect(styleTextAfterChange).not.toContain('.foo { color: blue; }');
      });
    });

    describe('Test 3.4.2 — Reconnecting re-syncs current styles', () => {
      test('Given a <ck-editable-array> element attached to document.body with a <style slot="styles"> child containing .foo { color: red; }, And the shadow DOM has the mirrored .foo { color: red; } CSS, When I remove the element from document.body, And modify the light DOM <style slot="styles"> to .foo { color: blue; } while it is disconnected, And then re-attach the <ck-editable-array> element to document.body, Then the shadow root\'s <style> now reflects .foo { color: blue; }', () => {
        // Arrange
        const el = new CkEditableArray();

        // Create style element with initial CSS
        const styleEl = document.createElement('style');
        styleEl.setAttribute('slot', 'styles');
        styleEl.textContent = '.foo { color: red; }';
        el.appendChild(styleEl);

        // Attach to DOM
        document.body.appendChild(el);

        // Verify initial state - style is mirrored
        let allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.foo { color: red; }');

        // Act - Remove from DOM
        document.body.removeChild(el);
        expect(el.isConnected).toBe(false);

        // Modify the light DOM style while disconnected
        styleEl.textContent = '.foo { color: blue; }';

        // Re-attach to DOM
        document.body.appendChild(el);
        expect(el.isConnected).toBe(true);

        // Assert - Shadow root should now reflect the updated CSS
        allStyleText = Array.from(
          el.shadowRoot?.querySelectorAll('style') || []
        )
          .map(s => s.textContent)
          .join('\n');
        expect(allStyleText).toContain('.foo { color: blue; }');
        expect(allStyleText).not.toContain('.foo { color: red; }');
      });
    });

    describe('Test 3.4.3 — Disconnect does not throw even if no styles were ever present', () => {
      test('Given a <ck-editable-array> element attached to document.body, And it has no <style slot="styles"> children, When I remove the element from document.body, Then no errors are thrown during disconnect, And the element can be safely re-attached later without errors', () => {
        // Arrange
        const el = new CkEditableArray();

        // Attach to DOM without any styles
        document.body.appendChild(el);
        expect(el.isConnected).toBe(true);

        // Verify no mirrored styles
        const mirroredStyles = el.shadowRoot?.querySelectorAll(
          'style[data-mirrored]'
        );
        expect(mirroredStyles?.length || 0).toBe(0);

        // Act & Assert - Remove from DOM (should not throw)
        expect(() => {
          document.body.removeChild(el);
        }).not.toThrow();
        expect(el.isConnected).toBe(false);

        // Act & Assert - Re-attach to DOM (should not throw)
        expect(() => {
          document.body.appendChild(el);
        }).not.toThrow();
        expect(el.isConnected).toBe(true);

        // Verify element is still functional
        expect(el.shadowRoot).not.toBeNull();
        const rowsContainer = el.shadowRoot?.querySelector('[part="rows"]');
        expect(rowsContainer).not.toBeNull();
      });
    });
  });

  describe('Test 3.5  Attribute-driven lifecycle nuances', () => {
    describe('Test 3.5.1  Changing name attribute triggers a re-render with updated input names', () => {
      test('Given a <ck-editable-array> element attached to document.body with data set to at least one item, And the rendered edit inputs use the current name attribute as a base (e.g. person[0].field), When I change el.setAttribute("name", "contact"), And allow the component to react, Then the rendered edit inputs in the shadow DOM now have names based on contact[0]... instead of the old base', async () => {
        const el = new CkEditableArray();
        const tplEdit = document.createElement('template');
        tplEdit.setAttribute('slot', 'edit');
        tplEdit.innerHTML =
          '<div class="row-edit"><input data-bind="label" /></div>';
        el.appendChild(tplEdit);
        el.setAttribute('name', 'person');
        el.data = [{ label: 'Item 1' }];
        document.body.appendChild(el);
        const initialInput = el.shadowRoot?.querySelector(
          '[data-mode="edit"] input[data-bind="label"]'
        ) as HTMLInputElement;
        expect(initialInput).not.toBeNull();
        expect(initialInput?.name).toBe('person[0].label');
        el.setAttribute('name', 'contact');
        await new Promise(resolve => setTimeout(resolve, 0));
        const updatedInput = el.shadowRoot?.querySelector(
          '[data-mode="edit"] input[data-bind="label"]'
        ) as HTMLInputElement;
        expect(updatedInput).not.toBeNull();
        expect(updatedInput?.name).toBe('contact[0].label');
        expect(updatedInput?.name).not.toContain('person');
      });
    });

    describe('Test 3.5.2  Toggling readonly attribute disables interactivity', () => {
      test('Given a <ck-editable-array> element attached to document.body with at least one rendered row, And initially, the user can focus and edit the row\'s inputs and use row toggle / add buttons, When I set el.setAttribute("readonly", ""), And allow the component to react, Then the rows appear in a non-editable state, And inputs are not editable (disabled or otherwise prevented), And interactive controls like the toggle and add button are disabled or have no effect', async () => {
        const el = new CkEditableArray();
        const tplEdit = document.createElement('template');
        tplEdit.setAttribute('slot', 'edit');
        tplEdit.innerHTML =
          '<div class="row-edit"><input data-bind="label" /></div>';
        el.appendChild(tplEdit);
        el.data = [{ label: 'Item 1' }];
        document.body.appendChild(el);
        const initialInput = el.shadowRoot?.querySelector(
          '[data-mode="edit"] input[data-bind="label"]'
        ) as HTMLInputElement;
        expect(initialInput).not.toBeNull();
        expect(initialInput?.disabled).toBe(false);
        expect(initialInput?.readOnly).toBe(false);
        el.setAttribute('readonly', '');
        await new Promise(resolve => setTimeout(resolve, 0));
        const updatedInput = el.shadowRoot?.querySelector(
          '[data-mode="edit"] input[data-bind="label"]'
        ) as HTMLInputElement;
        expect(updatedInput).not.toBeNull();
        const isNonEditable = updatedInput?.disabled || updatedInput?.readOnly;
        expect(isNonEditable).toBe(true);
        const addButton = el.shadowRoot?.querySelector(
          '[part="add-button"] button'
        ) as HTMLButtonElement | null;
        expect(addButton === null || addButton.disabled).toBe(true);
      });
    });

    describe('Test 3.5.3  Removing readonly restores interactivity', () => {
      test('Given the same <ck-editable-array> element in a readonly state from the previous test, When I remove the attribute with el.removeAttribute("readonly"), And allow the component to react, Then inputs become editable again, And row toggle and add actions become active once more', async () => {
        const el = new CkEditableArray();
        const tplEdit = document.createElement('template');
        tplEdit.setAttribute('slot', 'edit');
        tplEdit.innerHTML =
          '<div class="row-edit"><input data-bind="label" /></div>';
        el.appendChild(tplEdit);
        el.data = [{ label: 'Item 1' }];
        document.body.appendChild(el);
        el.setAttribute('readonly', '');
        await new Promise(resolve => setTimeout(resolve, 0));
        const readonlyInput = el.shadowRoot?.querySelector(
          '[data-mode="edit"] input[data-bind="label"]'
        ) as HTMLInputElement;
        expect(readonlyInput).not.toBeNull();
        const wasNonEditable =
          readonlyInput?.disabled || readonlyInput?.readOnly;
        expect(wasNonEditable).toBe(true);
        el.removeAttribute('readonly');
        await new Promise(resolve => setTimeout(resolve, 0));
        const editableInput = el.shadowRoot?.querySelector(
          '[data-mode="edit"] input[data-bind="label"]'
        ) as HTMLInputElement;
        expect(editableInput).not.toBeNull();
        expect(editableInput?.disabled).toBe(false);
        expect(editableInput?.readOnly).toBe(false);
        const addButton = el.shadowRoot?.querySelector(
          '[part="add-button"] button'
        ) as HTMLButtonElement | null;
        expect(addButton === null || !addButton.disabled).toBe(true);
      });
    });
  });
});
