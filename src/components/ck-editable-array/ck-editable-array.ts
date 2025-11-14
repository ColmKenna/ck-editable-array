type EditableRow = Record<string, unknown> | string;

export class CkEditableArray extends HTMLElement {
  private _data: EditableRow[] = [];
  private _schema: unknown = null;
  private _newItemFactory: () => EditableRow = () => ({});
  private _styleObserver: MutationObserver | null = null;

  static get observedAttributes(): string[] {
    return ['name', 'readonly'];
  }

  constructor() {
    super();
    if (this.shadowRoot === null) {
      this.attachShadow({ mode: 'open' });
    }
    // Ensure a container exists for rendered rows
    if (this.shadowRoot && this.shadowRoot.children.length === 0) {
      const container = document.createElement('div');
      container.setAttribute('part', 'root');

      // Create rows container
      const rowsContainer = document.createElement('div');
      rowsContainer.setAttribute('part', 'rows');
      container.appendChild(rowsContainer);

      // Create add-button container
      const addButtonContainer = document.createElement('div');
      addButtonContainer.setAttribute('part', 'add-button');
      container.appendChild(addButtonContainer);

      this.shadowRoot.appendChild(container);
    }
  }

  get data(): unknown[] {
    return this._data.map(item => {
      if (typeof item === 'string') {
        return item;
      }
      // Remove internal properties from public data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { __originalSnapshot, ...publicData } = item as Record<
        string,
        unknown
      >;
      return { ...publicData };
    });
  }

  set data(v: unknown[]) {
    this._data = Array.isArray(v)
      ? (v as unknown[]).map(item => this.cloneRow(item))
      : [];
    if (this.isConnected) {
      this.render();
      this.dispatchDataChanged();
    }
  }

  get schema(): unknown {
    return this._schema;
  }

  set schema(v: unknown) {
    // Normalize undefined to null for consistency
    this._schema = v === undefined ? null : v;
  }

  get newItemFactory(): () => EditableRow {
    return this._newItemFactory;
  }

  set newItemFactory(v: unknown) {
    // Only accept functions, otherwise reset to default
    if (typeof v === 'function') {
      this._newItemFactory = v as () => EditableRow;
    } else {
      this._newItemFactory = () => ({});
    }
  }

  connectedCallback(): void {
    // Mirror styles from light DOM to shadow DOM
    this.mirrorStyles();
    // Set up MutationObserver to watch for style changes
    this.observeStyleChanges();
    // Render when connected
    this.render();
  }

  disconnectedCallback(): void {
    // Clean up MutationObserver when element is removed from DOM
    if (this._styleObserver) {
      this._styleObserver.disconnect();
      this._styleObserver = null;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    // Only react if the element is connected and the value actually changed
    if (!this.isConnected || oldValue === newValue) {
      return;
    }

    if (name === 'name' || name === 'readonly') {
      // Re-render to apply the new attribute state
      this.render();
    }
  }

  private mirrorStyles(): void {
    if (!this.shadowRoot) return;

    // Remove any existing mirrored styles
    const existingStyles = this.shadowRoot.querySelectorAll(
      'style[data-mirrored]'
    );
    existingStyles.forEach(style => style.remove());

    // Find all <style slot="styles"> elements in light DOM
    const lightStyles = this.querySelectorAll<HTMLStyleElement>(
      'style[slot="styles"]'
    );

    if (lightStyles.length === 0) return;

    // Combine all style content
    const combinedStyles = Array.from(lightStyles)
      .map(style => style.textContent || '')
      .join('\n');

    // Skip creating mirrored style if content is empty or whitespace-only
    if (combinedStyles.trim().length === 0) return;

    // Create a single style element in shadow DOM with combined content
    const mirroredStyle = document.createElement('style');
    mirroredStyle.setAttribute('data-mirrored', 'true');
    mirroredStyle.textContent = combinedStyles;

    // Insert at the beginning of shadow root
    this.shadowRoot.insertBefore(mirroredStyle, this.shadowRoot.firstChild);
  }

  private observeStyleChanges(): void {
    // Disconnect existing observer if any
    if (this._styleObserver) {
      this._styleObserver.disconnect();
    }

    // Create a new MutationObserver to watch for changes to style elements
    this._styleObserver = new MutationObserver(mutations => {
      let shouldRemirror = false;

      for (const mutation of mutations) {
        // Check if any added/removed nodes are style elements with slot="styles"
        if (mutation.type === 'childList') {
          // Check if the mutation target is a style element with slot="styles"
          // (this catches textContent changes on the style element itself)
          if (
            mutation.target instanceof HTMLStyleElement &&
            mutation.target.getAttribute('slot') === 'styles'
          ) {
            shouldRemirror = true;
            break;
          }

          // Check if any added/removed nodes are style elements with slot="styles"
          const hasStyleChanges =
            Array.from(mutation.addedNodes).some(
              node =>
                node instanceof HTMLStyleElement &&
                node.getAttribute('slot') === 'styles'
            ) ||
            Array.from(mutation.removedNodes).some(
              node =>
                node instanceof HTMLStyleElement &&
                node.getAttribute('slot') === 'styles'
            );

          if (hasStyleChanges) {
            shouldRemirror = true;
            break;
          }
        }

        // Check if the text content of a style element changed
        if (
          mutation.type === 'characterData' &&
          mutation.target.parentElement instanceof HTMLStyleElement &&
          mutation.target.parentElement.getAttribute('slot') === 'styles'
        ) {
          shouldRemirror = true;
          break;
        }
      }

      if (shouldRemirror) {
        this.mirrorStyles();
      }
    });

    // Observe the light DOM for changes
    this._styleObserver.observe(this, {
      childList: true, // Watch for added/removed children
      characterData: true, // Watch for text content changes
      subtree: true, // Watch all descendants
    });
  }

  private render(): void {
    if (!this.shadowRoot) return;
    const rowsContainer = this.shadowRoot.querySelector(
      '[part="rows"]'
    ) as HTMLElement;
    if (!rowsContainer) return;

    // Clear previous rows content only (preserve scaffolding)
    rowsContainer.innerHTML = '';

    const displayTpl = this.querySelector(
      'template[slot="display"]'
    ) as HTMLTemplateElement | null;
    const editTpl = this.querySelector(
      'template[slot="edit"]'
    ) as HTMLTemplateElement | null;

    // Check if any row is in edit mode for exclusive locking
    const hasEditingRow = this._data.some(
      item => this.isRecord(item) && item.editing === true
    );

    this._data.forEach((item, idx) => {
      const isEditing = this.isRecord(item) && item.editing === true;
      const isLocked = hasEditingRow && !isEditing;

      this.appendRowFromTemplate(
        displayTpl,
        rowsContainer,
        item,
        idx,
        'display',
        isLocked
      );
      this.appendRowFromTemplate(
        editTpl,
        rowsContainer,
        item,
        idx,
        'edit',
        isLocked
      );
    });

    // Render Add button
    this.renderAddButton();
  }

  private bindDataToNode(
    root: HTMLElement,
    data: EditableRow,
    rowIndex: number,
    mode: 'display' | 'edit',
    isLocked: boolean = false
  ): void {
    // Bind text content for elements with data-bind attribute
    const bound = root.querySelectorAll<HTMLElement>('[data-bind]');
    const nameBase = this.getAttribute('name') || '';
    const isReadonly = this.hasAttribute('readonly');

    bound.forEach(node => {
      const key = node.getAttribute('data-bind') ?? '';
      const value = this.resolveBindingValue(data, key);
      // If element is input-like, set value; otherwise set textContent
      if (node instanceof HTMLInputElement) {
        const inputNode = node as HTMLInputElement;
        inputNode.value = value;

        // Set name attribute based on component's name attribute
        if (mode === 'edit' && nameBase && key) {
          inputNode.name = `${nameBase}[${rowIndex}].${key}`;
        }

        // Handle readonly state
        if (mode === 'edit') {
          if (isReadonly) {
            inputNode.readOnly = true;
          } else {
            inputNode.readOnly = false;
            inputNode.addEventListener('input', () => {
              this.commitRowValue(rowIndex, key, inputNode.value);
              // Update Save button state after input change
              this.updateSaveButtonState(rowIndex);
            });
          }
        }
      } else if (node instanceof HTMLTextAreaElement) {
        const textAreaNode = node as HTMLTextAreaElement;
        textAreaNode.value = value;

        // Set name attribute based on component's name attribute
        if (mode === 'edit' && nameBase && key) {
          textAreaNode.name = `${nameBase}[${rowIndex}].${key}`;
        }

        // Handle readonly state
        if (mode === 'edit') {
          if (isReadonly) {
            textAreaNode.readOnly = true;
          } else {
            textAreaNode.readOnly = false;
            textAreaNode.addEventListener('input', () => {
              this.commitRowValue(rowIndex, key, textAreaNode.value);
              // Update Save button state after input change
              this.updateSaveButtonState(rowIndex);
            });
          }
        }
      } else {
        node.textContent = value;
      }
    });

    // Disable toggle controls if row is locked
    if (isLocked && mode === 'display') {
      const toggleButtons = root.querySelectorAll<HTMLButtonElement>(
        '[data-action="toggle"]'
      );
      toggleButtons.forEach(btn => {
        btn.disabled = true;
      });
    }

    // Attach Save button click handler and set initial state
    if (mode === 'edit') {
      const saveButtons = root.querySelectorAll<HTMLButtonElement>(
        '[data-action="save"]'
      );
      saveButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleSaveClick(rowIndex));
      });

      // Attach Cancel button click handlers
      const cancelButtons = root.querySelectorAll<HTMLButtonElement>(
        '[data-action="cancel"]'
      );
      cancelButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleCancelClick(rowIndex));
      });
    }

    // Attach Toggle button click handlers
    const toggleButtons = root.querySelectorAll<HTMLButtonElement>(
      '[data-action="toggle"]'
    );
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => this.handleToggleClick(rowIndex));
    });

    // Attach Delete button click handlers (display mode only)
    if (mode === 'display') {
      const deleteButtons = root.querySelectorAll<HTMLButtonElement>(
        '[data-action="delete"]'
      );
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleDeleteClick(rowIndex));
        // Disable if row is locked
        if (isLocked) {
          btn.disabled = true;
        }
      });

      // Attach Restore button click handlers (display mode only)
      const restoreButtons = root.querySelectorAll<HTMLButtonElement>(
        '[data-action="restore"]'
      );
      restoreButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleRestoreClick(rowIndex));
        // Disable if row is locked
        if (isLocked) {
          btn.disabled = true;
        }
      });
    }
  }

  private appendRowFromTemplate(
    template: HTMLTemplateElement | null,
    container: HTMLElement,
    rowData: EditableRow,
    rowIndex: number,
    mode: 'display' | 'edit',
    isLocked: boolean = false
  ): void {
    if (!template || !template.content) {
      return;
    }

    const fragment = template.content.cloneNode(true) as DocumentFragment;

    // Create a wrapper div with the appropriate class
    const contentWrapper = document.createElement('div');
    contentWrapper.className =
      mode === 'display' ? 'display-content' : 'edit-content';
    contentWrapper.setAttribute('data-row', String(rowIndex));
    contentWrapper.setAttribute('data-mode', mode);

    // Mark deleted items with data-deleted="true"
    if (this.isRecord(rowData) && rowData.deleted === true) {
      contentWrapper.setAttribute('data-deleted', 'true');
    }

    // Apply locked state if this row is locked
    if (isLocked) {
      contentWrapper.setAttribute('data-locked', 'true');
      contentWrapper.setAttribute('aria-disabled', 'true');
      contentWrapper.setAttribute('inert', '');
    }

    // Apply hidden class based on editing state
    // If row is in editing mode, hide display and show edit
    // If row is not in editing mode (default), show display and hide edit
    const isEditing = this.isRecord(rowData) && rowData.editing === true;
    if (mode === 'display' && isEditing) {
      contentWrapper.classList.add('hidden');
    } else if (mode === 'edit' && !isEditing) {
      contentWrapper.classList.add('hidden');
    }

    // Append the cloned template content to the wrapper
    contentWrapper.appendChild(fragment);

    // Inject custom action buttons if available
    this.injectActionButtons(contentWrapper, mode);

    // Bind data to the wrapper's content
    this.bindDataToNode(contentWrapper, rowData, rowIndex, mode, isLocked);

    // Append the wrapper to the container
    container.appendChild(contentWrapper);

    // Update validation state after wrapper is in DOM (edit mode only)
    if (mode === 'edit') {
      this.updateSaveButtonState(rowIndex);
    }
  }

  /**
   * Inject custom action buttons into a row wrapper
   */
  private injectActionButtons(
    wrapper: HTMLElement,
    mode: 'display' | 'edit'
  ): void {
    // Define which buttons belong to which mode
    const displayButtons = ['button-edit', 'button-delete', 'button-restore'];
    const editButtons = ['button-save', 'button-cancel'];

    // Determine which buttons to inject based on mode
    const buttonsToInject = mode === 'display' ? displayButtons : editButtons;

    // Find the first child element to append buttons to
    const targetContainer = wrapper.querySelector('div, span') || wrapper;

    // Inject each button type if it exists
    buttonsToInject.forEach(slotName => {
      const customButton = this.querySelector(
        `button[slot="${slotName}"]`
      ) as HTMLButtonElement;

      if (customButton) {
        // Clone the custom button
        const buttonClone = customButton.cloneNode(true) as HTMLButtonElement;

        // Map slot name to data-action
        const actionMap: Record<string, string> = {
          'button-edit': 'toggle',
          'button-save': 'save',
          'button-cancel': 'cancel',
          'button-delete': 'delete',
          'button-restore': 'restore',
        };

        const action = actionMap[slotName];
        if (action) {
          buttonClone.setAttribute('data-action', action);
          buttonClone.removeAttribute('slot'); // Remove slot attribute from clone
          targetContainer.appendChild(buttonClone);
        }
      }
    });
  }

  private cloneRow(row: unknown): EditableRow {
    if (typeof row === 'string') {
      return row;
    }
    if (typeof row === 'number' || typeof row === 'boolean') {
      return String(row);
    }
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      // Deep clone using JSON parse/stringify for immutability
      return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
    }
    return '';
  }

  private resolveBindingValue(data: EditableRow, key: string): string {
    if (this.isRecord(data)) {
      if (!key) {
        return '';
      }
      const raw = data[key];
      if (raw === undefined || raw === null) {
        return '';
      }
      return String(raw);
    }
    return data;
  }

  private commitRowValue(
    rowIndex: number,
    key: string,
    nextValue: string
  ): void {
    if (rowIndex < 0 || rowIndex >= this._data.length) {
      return;
    }

    const normalizedNext = nextValue ?? '';
    const currentValue = this.resolveBindingValue(this._data[rowIndex], key);

    if (currentValue === normalizedNext) {
      return;
    }

    const nextData = this._data.map(entry =>
      this.isRecord(entry) ? { ...entry } : entry
    );

    const target = nextData[rowIndex];
    if (this.isRecord(target) && key) {
      target[key] = normalizedNext;
    } else {
      nextData[rowIndex] = normalizedNext;
    }

    this._data = nextData;

    if (this.isConnected) {
      // Update only bound nodes for the affected row/key instead of full re-render
      this.updateBoundNodes(rowIndex, key);
      this.dispatchDataChanged();
    }
  }

  /**
   * Update existing bound nodes in the shadow DOM for a specific row and key.
   * If a specific key is provided, only nodes with that data-bind are updated;
   * otherwise all bound nodes in the row are refreshed.
   */
  private updateBoundNodes(rowIndex: number, key?: string): void {
    if (!this.shadowRoot) return;

    const rowElems = Array.from(
      this.shadowRoot.querySelectorAll<HTMLElement>(`[data-row="${rowIndex}"]`)
    );
    if (rowElems.length === 0) return;

    rowElems.forEach(rowElem => {
      const bound = key
        ? Array.from(
            rowElem.querySelectorAll<HTMLElement>(`[data-bind="${key}"]`)
          )
        : Array.from(rowElem.querySelectorAll<HTMLElement>('[data-bind]'));

      bound.forEach(node => {
        const bindKey = node.getAttribute('data-bind') ?? '';
        const value = this.resolveBindingValue(this._data[rowIndex], bindKey);

        if (node instanceof HTMLInputElement) {
          // Only update input value if it differs (avoid clobbering user typing)
          if (node.value !== value) {
            node.value = value;
          }
        } else if (node instanceof HTMLTextAreaElement) {
          if (node.value !== value) {
            node.value = value;
          }
        } else {
          if (node.textContent !== value) {
            node.textContent = value;
          }
        }
      });
    });
  }

  private dispatchDataChanged(): void {
    const event = new CustomEvent('datachanged', {
      bubbles: true,
      composed: true,
      detail: { data: this.data },
    });
    this.dispatchEvent(event);
  }

  private isRecord(value: EditableRow): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private renderAddButton(): void {
    if (!this.shadowRoot) return;

    const addButtonContainer = this.shadowRoot.querySelector(
      '[part="add-button"]'
    ) as HTMLElement;
    if (!addButtonContainer) return;

    // Clear previous add button content
    addButtonContainer.innerHTML = '';

    const isReadonly = this.hasAttribute('readonly');

    // Check if any row is in edit mode (exclusive locking)
    const hasEditingRow = this._data.some(
      item => this.isRecord(item) && item.editing === true
    );

    // Check if user provided a custom add button template
    const customAddButtonTpl = this.querySelector(
      'template[slot="add-button"]'
    ) as HTMLTemplateElement | null;

    if (customAddButtonTpl && customAddButtonTpl.content) {
      // Use custom template
      const fragment = customAddButtonTpl.content.cloneNode(
        true
      ) as DocumentFragment;
      addButtonContainer.appendChild(fragment);

      // Attach click handlers and disable buttons if readonly or editing
      const buttons = addButtonContainer.querySelectorAll('button');
      buttons.forEach(btn => {
        if (isReadonly || hasEditingRow) {
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
        }
        // Attach click handler to buttons with data-action="add"
        if (btn.getAttribute('data-action') === 'add') {
          btn.addEventListener('click', () => this.handleAddClick());
        }
      });
    } else {
      // Render default Add button
      const defaultButton = document.createElement('button');
      defaultButton.setAttribute('data-action', 'add');
      defaultButton.setAttribute('type', 'button');
      defaultButton.textContent = 'Add';

      // Disable button if readonly or if a row is editing
      if (isReadonly || hasEditingRow) {
        defaultButton.disabled = true;
        defaultButton.setAttribute('aria-disabled', 'true');
      }

      // Attach click handler
      defaultButton.addEventListener('click', () => this.handleAddClick());

      addButtonContainer.appendChild(defaultButton);
    }
  }

  private handleAddClick(): void {
    // Don't add if readonly
    if (this.hasAttribute('readonly')) {
      return;
    }

    // Don't add if any row is already in edit mode (exclusive locking)
    const hasEditingRow = this._data.some(
      item => this.isRecord(item) && item.editing === true
    );
    if (hasEditingRow) {
      return;
    }

    // Create a new item using the factory
    const newItem = this._newItemFactory();

    // Mark the new item as being in editing mode and store original snapshot
    const newItemWithEditing = this.isRecord(newItem)
      ? {
          ...newItem,
          editing: true,
          __originalSnapshot: JSON.parse(JSON.stringify(newItem)),
        }
      : newItem;

    // Add the new item to the data array
    this._data = [...this._data, newItemWithEditing];

    // Re-render and dispatch datachanged event
    if (this.isConnected) {
      this.render();
      this.dispatchDataChanged();
    }
  }

  private handleSaveClick(rowIndex: number): void {
    // Don't save if readonly
    if (this.hasAttribute('readonly')) {
      return;
    }

    // Validate row index
    if (rowIndex < 0 || rowIndex >= this._data.length) {
      return;
    }

    // Don't save if row is invalid
    if (!this.validateRow(rowIndex)) {
      return;
    }

    // Remove editing flag from the row
    const nextData = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        // Remove editing flag
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { editing, ...rest } = entry;
        return rest;
      }
      return this.isRecord(entry) ? { ...entry } : entry;
    });

    this._data = nextData;

    // Re-render and dispatch datachanged event
    if (this.isConnected) {
      this.render();
      this.dispatchDataChanged();
    }
  }

  private handleToggleClick(rowIndex: number): void {
    // Don't toggle if readonly
    if (this.hasAttribute('readonly')) {
      return;
    }

    // Validate row index
    if (rowIndex < 0 || rowIndex >= this._data.length) {
      return;
    }

    const currentRow = this._data[rowIndex];
    if (!this.isRecord(currentRow)) {
      return;
    }

    // Determine current and target modes
    const isCurrentlyEditing = currentRow.editing === true;
    const fromMode = isCurrentlyEditing ? 'edit' : 'display';
    const toMode = isCurrentlyEditing ? 'display' : 'edit';

    // Dispatch beforetogglemode event
    const beforeEvent = new CustomEvent('beforetogglemode', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        index: rowIndex,
        from: fromMode,
        to: toMode,
      },
    });

    const allowed = this.dispatchEvent(beforeEvent);

    // If event was canceled, don't proceed
    if (!allowed) {
      return;
    }

    // Toggle the editing flag
    const nextData = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        if (isCurrentlyEditing) {
          // Remove editing flag and original snapshot
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { editing, __originalSnapshot, ...rest } = entry;
          return rest;
        } else {
          // Add editing flag and store original snapshot for cancel
          return {
            ...entry,
            editing: true,
            __originalSnapshot: JSON.parse(JSON.stringify(entry)),
          };
        }
      }
      return this.isRecord(entry) ? { ...entry } : entry;
    });

    this._data = nextData;

    // Re-render
    if (this.isConnected) {
      this.render();
    }

    // Dispatch aftertogglemode event
    const afterEvent = new CustomEvent('aftertogglemode', {
      bubbles: true,
      composed: true,
      detail: {
        index: rowIndex,
        mode: toMode,
      },
    });
    this.dispatchEvent(afterEvent);

    // Dispatch datachanged event
    if (this.isConnected) {
      this.dispatchDataChanged();
    }
  }

  private handleCancelClick(rowIndex: number): void {
    // Don't cancel if readonly
    if (this.hasAttribute('readonly')) {
      return;
    }

    // Validate row index
    if (rowIndex < 0 || rowIndex >= this._data.length) {
      return;
    }

    const currentRow = this._data[rowIndex];
    if (!this.isRecord(currentRow)) {
      return;
    }

    // Dispatch beforetogglemode event (edit → display)
    const beforeEvent = new CustomEvent('beforetogglemode', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        index: rowIndex,
        from: 'edit',
        to: 'display',
      },
    });

    const allowed = this.dispatchEvent(beforeEvent);

    // If event was canceled, don't proceed
    if (!allowed) {
      return;
    }

    // Restore original data from snapshot
    const nextData = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        // Restore from snapshot if available, otherwise just remove editing flag
        const snapshot = entry.__originalSnapshot;
        if (snapshot && typeof snapshot === 'object') {
          return JSON.parse(JSON.stringify(snapshot)) as Record<
            string,
            unknown
          >;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { editing, __originalSnapshot, ...rest } = entry;
          return rest;
        }
      }
      return this.isRecord(entry) ? { ...entry } : entry;
    });

    this._data = nextData;

    // Re-render (but don't dispatch datachanged - cancel doesn't change data)
    if (this.isConnected) {
      this.render();
    }

    // Dispatch aftertogglemode event
    const afterEvent = new CustomEvent('aftertogglemode', {
      bubbles: true,
      composed: true,
      detail: {
        index: rowIndex,
        mode: 'display',
      },
    });
    this.dispatchEvent(afterEvent);
  }

  /**
   * Validate a row against the schema (if provided)
   */
  private validateRow(rowIndex: number): boolean {
    const result = this.validateRowDetailed(rowIndex);
    return result.isValid;
  }

  /**
   * Validate a row and return detailed error information
   */
  private validateRowDetailed(rowIndex: number): {
    isValid: boolean;
    errors: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    if (rowIndex < 0 || rowIndex >= this._data.length) {
      return { isValid: false, errors };
    }

    const row = this._data[rowIndex];
    if (!this.isRecord(row)) {
      return { isValid: true, errors }; // Primitive values are always valid
    }

    // If no schema is set, consider the row valid
    if (!this._schema || typeof this._schema !== 'object') {
      return { isValid: true, errors };
    }

    const schema = this._schema as Record<string, unknown>;

    // Check required fields
    if (Array.isArray(schema.required)) {
      const required = schema.required as string[];
      for (const field of required) {
        const value = row[field];
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '');
        if (isEmpty) {
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(`${field} is required`);
        }
      }
    }

    // Check properties constraints
    if (schema.properties && typeof schema.properties === 'object') {
      const properties = schema.properties as Record<string, unknown>;
      for (const [key, propSchema] of Object.entries(properties)) {
        if (propSchema && typeof propSchema === 'object') {
          const prop = propSchema as Record<string, unknown>;
          const value = row[key];

          // Check minLength for strings
          if (typeof prop.minLength === 'number' && typeof value === 'string') {
            if (value.length < prop.minLength) {
              if (!errors[key]) {
                errors[key] = [];
              }
              errors[key].push(
                `${key} must be at least ${prop.minLength} characters`
              );
            }
          }
        }
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Update the disabled state of Save buttons and validation UI for a specific row
   */
  private updateSaveButtonState(rowIndex: number): void {
    if (!this.shadowRoot) return;

    const editWrapper = this.shadowRoot.querySelector(
      `.edit-content[data-row="${rowIndex}"]`
    );
    if (!editWrapper) return;

    const saveButtons = editWrapper.querySelectorAll<HTMLButtonElement>(
      '[data-action="save"]'
    );

    const validationResult = this.validateRowDetailed(rowIndex);
    const isValid = validationResult.isValid;

    // Update Save button state
    saveButtons.forEach(btn => {
      btn.disabled = !isValid;
      if (!isValid) {
        btn.setAttribute('aria-disabled', 'true');
      } else {
        btn.removeAttribute('aria-disabled');
      }
    });

    // Update row-level validation indicator
    if (isValid) {
      editWrapper.removeAttribute('data-row-invalid');
    } else {
      editWrapper.setAttribute('data-row-invalid', 'true');
    }

    // Update field-level validation indicators and error messages
    const inputs = editWrapper.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >('[data-bind]');
    inputs.forEach(input => {
      const fieldName = input.getAttribute('data-bind');
      if (!fieldName) return;

      const fieldErrors = validationResult.errors[fieldName] || [];
      const hasErrors = fieldErrors.length > 0;

      // Update field invalid indicator
      if (hasErrors) {
        input.setAttribute('data-invalid', 'true');
      } else {
        input.removeAttribute('data-invalid');
      }

      // Update error message display
      const errorElement = editWrapper.querySelector(
        `[data-field-error="${fieldName}"]`
      );
      if (errorElement) {
        errorElement.textContent = fieldErrors.join(', ');
      }
    });
  }

  private handleDeleteClick(rowIndex: number): void {
    // Don't delete if readonly
    if (this.hasAttribute('readonly')) {
      return;
    }

    // Validate row index
    if (rowIndex < 0 || rowIndex >= this._data.length) {
      return;
    }

    // Don't delete if any row is in edit mode (exclusive locking)
    const hasEditingRow = this._data.some(
      item => this.isRecord(item) && item.editing === true
    );
    if (hasEditingRow) {
      return;
    }

    // Mark the row as deleted
    const nextData = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        return { ...entry, deleted: true };
      }
      return this.isRecord(entry) ? { ...entry } : entry;
    });

    this._data = nextData;

    // Re-render and dispatch datachanged event
    if (this.isConnected) {
      this.render();
      this.dispatchDataChanged();
    }
  }

  private handleRestoreClick(rowIndex: number): void {
    // Don't restore if readonly
    if (this.hasAttribute('readonly')) {
      return;
    }

    // Validate row index
    if (rowIndex < 0 || rowIndex >= this._data.length) {
      return;
    }

    // Don't restore if any row is in edit mode (exclusive locking)
    const hasEditingRow = this._data.some(
      item => this.isRecord(item) && item.editing === true
    );
    if (hasEditingRow) {
      return;
    }

    // Remove the deleted flag from the row
    const nextData = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deleted, ...rest } = entry;
        return rest;
      }
      return this.isRecord(entry) ? { ...entry } : entry;
    });

    this._data = nextData;

    // Re-render and dispatch datachanged event
    if (this.isConnected) {
      this.render();
      this.dispatchDataChanged();
    }
  }
}

// Register custom element if not already registered.
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

export default CkEditableArray;
