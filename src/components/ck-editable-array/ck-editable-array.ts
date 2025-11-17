// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents internal row data with editing state markers
 */
interface InternalRowData extends Record<string, unknown> {
  editing?: boolean;
  deleted?: boolean;
  __originalSnapshot?: Record<string, unknown>;
  __isNew?: boolean;
}

/**
 * A row can be either a primitive string or an object with properties
 */
type EditableRow = InternalRowData | string;

/**
 * Result of validation with detailed error information
 */
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * JSON Schema-like structure for validation
 */
interface ValidationSchema {
  required?: string[];
  properties?: Record<string, PropertySchema>;
}

/**
 * Property-level schema definition
 */
interface PropertySchema {
  minLength?: number;
  // Future: maxLength, pattern, type, etc.
}

/**
 * Mode for rendering rows
 */
type RenderMode = 'display' | 'edit';

/**
 * Action types for button handlers
 * (Reserved for future use in extracted helper methods)
 */
// type ActionType = 'add' | 'save' | 'cancel' | 'toggle' | 'delete' | 'restore';

// ============================================================================
// CLASS DEFINITION
// ============================================================================

export class CkEditableArray extends HTMLElement {
  // ============================================================================
  // CONSTANTS
  // ============================================================================

  private static readonly PART_ROWS = 'rows';
  private static readonly PART_ADD_BUTTON = 'add-button';
  private static readonly PART_ROOT = 'root';
  private static readonly SLOT_STYLES = 'styles';
  private static readonly SLOT_DISPLAY = 'display';
  private static readonly SLOT_EDIT = 'edit';
  private static readonly ATTR_DATA_BIND = 'data-bind';
  private static readonly ATTR_DATA_ACTION = 'data-action';
  private static readonly ATTR_DATA_ROW = 'data-row';
  private static readonly ATTR_DATA_MODE = 'data-mode';
  private static readonly CLASS_HIDDEN = 'hidden';
  private static readonly CLASS_DELETED = 'deleted';
  private static readonly CLASS_DISPLAY_CONTENT = 'display-content';
  private static readonly CLASS_EDIT_CONTENT = 'edit-content';

  // ============================================================================
  // PRIVATE PROPERTIES
  // ============================================================================

  private _data: EditableRow[] = [];
  private _schema: unknown = null;
  private _newItemFactory: () => EditableRow = () => ({});
  private _styleObserver: MutationObserver | null = null;

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

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
      // Add base styles for hidden class
      const style = document.createElement('style');
      style.textContent = `.${CkEditableArray.CLASS_HIDDEN} { display: none !important; }`;
      this.shadowRoot.appendChild(style);

      const container = document.createElement('div');
      container.setAttribute('part', CkEditableArray.PART_ROOT);

      // Create rows container
      const rowsContainer = document.createElement('div');
      rowsContainer.setAttribute('part', CkEditableArray.PART_ROWS);
      container.appendChild(rowsContainer);

      // Create add-button container
      const addButtonContainer = document.createElement('div');
      addButtonContainer.setAttribute('part', CkEditableArray.PART_ADD_BUTTON);
      container.appendChild(addButtonContainer);

      this.shadowRoot.appendChild(container);
    }
  }

  // ============================================================================
  // PUBLIC API (GETTERS/SETTERS)
  // ============================================================================

  get data(): unknown[] {
    return this._data.map(item => this.toPublicRowData(item));
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

  // ============================================================================
  // STYLE MANAGEMENT
  // ============================================================================

  private mirrorStyles(): void {
    if (!this.shadowRoot) return;

    // Remove any existing mirrored styles
    const existingStyles = this.shadowRoot.querySelectorAll(
      'style[data-mirrored]'
    );
    existingStyles.forEach(style => style.remove());

    // Find all <style slot="styles"> elements in light DOM
    const lightStyles = this.querySelectorAll<HTMLStyleElement>(
      `style[slot="${CkEditableArray.SLOT_STYLES}"]`
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

  /**
   * Check if a node is a style element with slot="styles"
   */
  private isStyleNode(node: Node): boolean {
    return (
      node instanceof HTMLStyleElement &&
      node.getAttribute('slot') === CkEditableArray.SLOT_STYLES
    );
  }

  /**
   * Check if a mutation involves style elements
   */
  private isStyleMutation(mutation: MutationRecord): boolean {
    // Check if mutation target is a style element
    if (mutation.type === 'childList' && this.isStyleNode(mutation.target)) {
      return true;
    }

    // Check if any added/removed nodes are style elements
    if (mutation.type === 'childList') {
      const hasStyleChanges =
        Array.from(mutation.addedNodes).some(node => this.isStyleNode(node)) ||
        Array.from(mutation.removedNodes).some(node => this.isStyleNode(node));

      if (hasStyleChanges) {
        return true;
      }
    }

    // Check if text content of a style element changed
    if (
      mutation.type === 'characterData' &&
      mutation.target.parentElement &&
      this.isStyleNode(mutation.target.parentElement)
    ) {
      return true;
    }

    return false;
  }

  private observeStyleChanges(): void {
    // Disconnect existing observer if any
    if (this._styleObserver) {
      this._styleObserver.disconnect();
    }

    // Create a new MutationObserver to watch for changes to style elements
    this._styleObserver = new MutationObserver(mutations => {
      const shouldRemirror = mutations.some(mutation =>
        this.isStyleMutation(mutation)
      );

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

  // ============================================================================
  // RENDERING
  // ============================================================================

  private render(): void {
    if (!this.shadowRoot) return;
    const rowsContainer = this.getRowsContainer();
    if (!rowsContainer) return;

    // Clear previous rows content only (preserve scaffolding)
    rowsContainer.innerHTML = '';

    const displayTpl = this.getDisplayTemplate();
    const editTpl = this.getEditTemplate();

    // Check if any row is in edit mode for exclusive locking
    const hasEditingRow = this.isEditLocked();

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

  // ============================================================================
  // DATA BINDING
  // ============================================================================

  /**
   * Configure readonly state for input elements
   */
  private configureReadonlyState(
    input: HTMLInputElement | HTMLTextAreaElement,
    isReadonly: boolean
  ): void {
    input.readOnly = isReadonly;
  }

  /**
   * Attach input event listeners for data binding
   */
  private attachInputListeners(
    wrapper: HTMLElement,
    rowIndex: number,
    mode: RenderMode
  ): void {
    if (mode !== 'edit') return;

    const nameBase = this.getAttribute('name') || '';
    const isReadonly = this.isReadonlyBlocked();
    const bound = wrapper.querySelectorAll<HTMLElement>(
      `[${CkEditableArray.ATTR_DATA_BIND}]`
    );

    bound.forEach(node => {
      const key = node.getAttribute(CkEditableArray.ATTR_DATA_BIND) ?? '';

      if (
        node instanceof HTMLInputElement ||
        node instanceof HTMLTextAreaElement ||
        node instanceof HTMLSelectElement
      ) {
        // Set name attribute based on component's name attribute
        if (nameBase && key) {
          node.name = `${nameBase}[${rowIndex}].${key}`;
        }

        // Configure readonly state (not applicable to select)
        if (!(node instanceof HTMLSelectElement)) {
          this.configureReadonlyState(node, isReadonly);
        }

        // Attach input / change listener if not readonly
        if (!isReadonly) {
          if (node instanceof HTMLInputElement && node.type === 'radio') {
            // Use change for radio; only commit when checked
            node.addEventListener('change', () => {
              if (node.checked) {
                this.commitRowValue(rowIndex, key, node.value);
                this.updateSaveButtonState(rowIndex);
              }
            });
          } else if (
            node instanceof HTMLInputElement &&
            node.type === 'checkbox'
          ) {
            // Collect all checkboxes with the same bind key within the wrapper and commit as an array
            node.addEventListener('change', () => {
              const checkboxes = Array.from(
                wrapper.querySelectorAll<HTMLInputElement>(
                  `input[type="checkbox"][${CkEditableArray.ATTR_DATA_BIND}="${key}"]`
                )
              );
              const selected = checkboxes
                .filter(cb => cb.checked)
                .map(cb => cb.value ?? 'on');
              const rawVal = this.resolveBindingRawValue(
                this._data[rowIndex],
                key
              );
              if (checkboxes.length === 1 && typeof rawVal === 'boolean') {
                this.commitRowValue(rowIndex, key, checkboxes[0].checked);
              } else {
                this.commitRowValue(rowIndex, key, selected);
              }
              this.updateSaveButtonState(rowIndex);
            });
          } else if (node instanceof HTMLSelectElement) {
            // Use change for select elements; support multiple select producing arrays
            node.addEventListener('change', () => {
              if (node.multiple) {
                const values = Array.from(node.selectedOptions).map(
                  o => o.value
                );
                this.commitRowValue(rowIndex, key, values);
              } else {
                this.commitRowValue(rowIndex, key, node.value);
              }
              this.updateSaveButtonState(rowIndex);
            });
          } else {
            node.addEventListener('input', () => {
              this.commitRowValue(
                rowIndex,
                key,
                (node as HTMLInputElement | HTMLTextAreaElement).value
              );
              this.updateSaveButtonState(rowIndex);
            });
          }
        }
      }
    });
  }

  /**
   * Attach button click event listeners
   */
  private attachButtonListeners(
    wrapper: HTMLElement,
    rowIndex: number,
    mode: RenderMode,
    isLocked: boolean
  ): void {
    // Attach Save and Cancel buttons (edit mode only)
    if (mode === 'edit') {
      const saveButtons = wrapper.querySelectorAll<HTMLButtonElement>(
        '[data-action="save"]'
      );
      saveButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleSaveClick(rowIndex));
      });

      const cancelButtons = wrapper.querySelectorAll<HTMLButtonElement>(
        '[data-action="cancel"]'
      );
      cancelButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleCancelClick(rowIndex));
      });
    }

    // Attach Toggle button handlers
    const toggleButtons = wrapper.querySelectorAll<HTMLButtonElement>(
      '[data-action="toggle"]'
    );
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => this.handleToggleClick(rowIndex));
      if (isLocked && mode === 'display') {
        btn.disabled = true;
      }
    });

    // Attach Delete and Restore buttons (display mode only)
    if (mode === 'display') {
      const deleteButtons = wrapper.querySelectorAll<HTMLButtonElement>(
        '[data-action="delete"]'
      );
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleDeleteClick(rowIndex));
        if (isLocked) {
          btn.disabled = true;
        }
      });

      const restoreButtons = wrapper.querySelectorAll<HTMLButtonElement>(
        '[data-action="restore"]'
      );
      restoreButtons.forEach(btn => {
        btn.addEventListener('click', () => this.handleRestoreClick(rowIndex));
        if (isLocked) {
          btn.disabled = true;
        }
      });
    }
  }

  /**
   * Bind data to DOM nodes and attach event listeners
   * @param root - The root element containing nodes to bind
   * @param data - The row data to bind
   * @param rowIndex - The index of the row in the data array
   * @param mode - The rendering mode ('display' or 'edit')
   * @param isLocked - Whether the row is locked due to another row being edited
   */
  private bindDataToNode(
    root: HTMLElement,
    data: EditableRow,
    rowIndex: number,
    mode: RenderMode,
    isLocked: boolean = false
  ): void {
    // Bind text content for elements with data-bind attribute
    const bound = root.querySelectorAll<HTMLElement>(
      `[${CkEditableArray.ATTR_DATA_BIND}]`
    );

    bound.forEach(node => {
      const key = node.getAttribute(CkEditableArray.ATTR_DATA_BIND) ?? '';
      const value = this.resolveBindingValue(data, key);

      if (node instanceof HTMLInputElement) {
        if (node.type === 'radio') {
          // Preserve original value attribute and set checked state based on data
          const shouldCheck = node.value === value;
          node.checked = shouldCheck;
          node.setAttribute('aria-checked', shouldCheck ? 'true' : 'false');
        } else if (node.type === 'checkbox') {
          // For checkboxes, set checked based on whether the data array includes this value,
          // or if the raw value equals the checkbox value (for single boolean-like checkbox)
          const rawVal = this.resolveBindingRawValue(data, key);
          const cbVal = node.value ?? 'on';
          if (Array.isArray(rawVal)) {
            node.checked = (rawVal as string[]).includes(cbVal);
          } else if (typeof rawVal === 'boolean') {
            node.checked = Boolean(rawVal);
          } else {
            node.checked = String(rawVal) === cbVal;
          }
          node.setAttribute('aria-checked', node.checked ? 'true' : 'false');
        } else {
          node.value = value;
        }
      } else if (node instanceof HTMLTextAreaElement) {
        node.value = value;
      } else if (node instanceof HTMLSelectElement) {
        // Set the select element's value. For multi-selects, select options that match the bound array value.
        if (node.multiple) {
          const valuesArr =
            value === '' ? [] : value.split(',').map(s => s.trim());
          Array.from(node.options).forEach(opt => {
            opt.selected = valuesArr.includes(opt.value);
          });
        } else {
          node.value = value;
        }
      } else {
        node.textContent = value;
      }
    });

    // Attach input listeners for edit mode
    this.attachInputListeners(root, rowIndex, mode);

    // Attach button listeners
    this.attachButtonListeners(root, rowIndex, mode, isLocked);
  }

  /**
   * Create a row element from a template and append it to the container
   * @param template - The template element to clone
   * @param container - The container to append the row to
   * @param rowData - The data for this row
   * @param rowIndex - The index of the row in the data array
   * @param mode - The rendering mode ('display' or 'edit')
   * @param isLocked - Whether the row is locked due to another row being edited
   */
  private appendRowFromTemplate(
    template: HTMLTemplateElement | null,
    container: HTMLElement,
    rowData: EditableRow,
    rowIndex: number,
    mode: RenderMode,
    isLocked: boolean = false
  ): void {
    if (!template || !template.content) {
      return;
    }

    const fragment = template.content.cloneNode(true) as DocumentFragment;

    // Create a wrapper div with the appropriate class
    const contentWrapper = document.createElement('div');
    contentWrapper.className =
      mode === 'display'
        ? CkEditableArray.CLASS_DISPLAY_CONTENT
        : CkEditableArray.CLASS_EDIT_CONTENT;
    contentWrapper.setAttribute(
      CkEditableArray.ATTR_DATA_ROW,
      String(rowIndex)
    );
    contentWrapper.setAttribute(CkEditableArray.ATTR_DATA_MODE, mode);

    // Mark deleted items with data-deleted="true" and add deleted class
    if (this.isRecord(rowData) && rowData.deleted === true) {
      contentWrapper.setAttribute('data-deleted', 'true');
      contentWrapper.classList.add(CkEditableArray.CLASS_DELETED);
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
      contentWrapper.classList.add(CkEditableArray.CLASS_HIDDEN);
    } else if (mode === 'edit' && !isEditing) {
      contentWrapper.classList.add(CkEditableArray.CLASS_HIDDEN);
    }

    // Append the cloned template content to the wrapper
    contentWrapper.appendChild(fragment);

    // Ensure datalist IDs are unique per row and inputs reference the correct list
    // Move datalists to light DOM so they work with inputs in shadow DOM
    // (Datalists only associate with inputs in the same DOM tree)
    try {
      const inputsWithList = Array.from(
        contentWrapper.querySelectorAll<HTMLInputElement>('input[list]')
      );
      inputsWithList.forEach(input => {
        const listId = input.getAttribute('list');
        if (!listId) return;
        const dl = contentWrapper.querySelector<HTMLDataListElement>(
          `datalist[id="${listId}"]`
        );
        if (!dl) return; // datalist might live outside this wrapper; leave as-is
        const uniqueId = `${listId}-${rowIndex}`;
        dl.id = uniqueId;
        input.setAttribute('list', uniqueId);

        // Move datalist to light DOM (component's light DOM, not shadow DOM)
        // This allows the input in shadow DOM to associate with it
        contentWrapper.removeChild(dl);
        this.appendChild(dl);
      });
    } catch {
      // No-op: best-effort enhancement; never throw during render
    }

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
  private injectActionButtons(wrapper: HTMLElement, mode: RenderMode): void {
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

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

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
      // Support nested property paths like "person.name"
      const keys = key.split('.');
      let value: unknown = data;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return '';
        }
      }
      if (value === undefined || value === null) {
        return '';
      }
      // If the value is an array, return a comma separated string
      if (Array.isArray(value)) {
        return (value as unknown as string[]).join(', ');
      }
      return String(value);
    }
    return data;
  }

  /**
   * Resolve the raw bound value (not coerced to string) for a key on a row
   * @param data - row data
   * @param key - dot notation key
   */
  private resolveBindingRawValue(data: EditableRow, key: string): unknown {
    if (this.isRecord(data)) {
      if (!key) return undefined;
      const keys = key.split('.');
      let value: unknown = data;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return undefined;
        }
      }
      return value;
    }
    return data;
  }

  /**
   * Commit a value change to a specific field in a row
   * Updates the internal data and triggers UI updates
   * @param rowIndex - The index of the row to update
   * @param key - The field key (supports nested paths like "person.name")
   * @param nextValue - The new value to set
   */
  private commitRowValue(
    rowIndex: number,
    key: string,
    nextValue: string | string[] | boolean
  ): void {
    if (!this.isValidRowIndex(rowIndex)) {
      return;
    }

    const normalizedNext: string | string[] | boolean =
      nextValue === undefined || nextValue === null ? '' : nextValue;
    const currentValue = this.resolveBindingValue(this._data[rowIndex], key);

    // Short-circuit if nothing changed. For arrays, compare joined string.
    const normalizedCurrent = currentValue ?? '';
    const normalizedNextStr = Array.isArray(normalizedNext)
      ? (normalizedNext as string[]).join(', ')
      : String(normalizedNext);
    if (normalizedCurrent === normalizedNextStr) {
      return;
    }

    const nextData: EditableRow[] = this._data.map(entry =>
      this.isRecord(entry) ? { ...entry } : entry
    );

    const target = nextData[rowIndex];
    if (this.isRecord(target) && key) {
      // Support nested property paths like "person.name"
      const keys = key.split('.');
      if (keys.length === 1) {
        // Simple property
        target[key] = normalizedNext;
      } else {
        // Nested property - navigate to parent and set the leaf property
        let current: unknown = target;
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          if (current && typeof current === 'object' && k in current) {
            const parent = current as Record<string, unknown>;
            // Deep clone the nested object to maintain immutability
            if (i < keys.length - 2) {
              parent[k] = JSON.parse(JSON.stringify(parent[k]));
            } else {
              // For the immediate parent, clone it
              parent[k] = { ...(parent[k] as Record<string, unknown>) };
            }
            current = parent[k];
          } else {
            // Path doesn't exist, create it
            (current as Record<string, unknown>)[k] = {};
            current = (current as Record<string, unknown>)[k];
          }
        }
        // Set the leaf property
        if (current && typeof current === 'object') {
          (current as Record<string, unknown>)[keys[keys.length - 1]] =
            normalizedNext;
        }
      }
    } else {
      // If the row is a primitive value, avoid setting the entire row to an array/boolean.
      if (Array.isArray(normalizedNext)) {
        nextData[rowIndex] = (normalizedNext as string[]).join(', ');
      } else if (typeof normalizedNext === 'boolean') {
        nextData[rowIndex] = String(normalizedNext);
      } else {
        nextData[rowIndex] = normalizedNext as string;
      }
    }

    this._data = nextData;

    if (this.isConnected) {
      // Update only bound nodes for the affected row/key instead of full re-render
      this.updateBoundNodes(rowIndex, key);

      // Only dispatch datachanged if the row is NOT in editing mode
      // If the row is in editing mode, changes are temporary until Save is clicked
      // If the row is NOT in editing mode, changes are committed immediately (backward compatibility)
      const row = this._data[rowIndex];
      const isEditing = this.isRecord(row) && row.editing === true;
      if (!isEditing) {
        this.dispatchDataChanged();
      }
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
          if (node.type === 'radio') {
            const shouldCheck = node.value === value;
            node.checked = shouldCheck;
            node.setAttribute('aria-checked', shouldCheck ? 'true' : 'false');
          } else if (node.type === 'checkbox') {
            const rawVal = this.resolveBindingRawValue(
              this._data[rowIndex],
              bindKey
            );
            const cbVal = node.value ?? 'on';
            if (Array.isArray(rawVal)) {
              node.checked = (rawVal as string[]).includes(cbVal);
            } else if (typeof rawVal === 'boolean') {
              node.checked = Boolean(rawVal);
            } else {
              node.checked = String(rawVal) === cbVal;
            }
            node.setAttribute('aria-checked', node.checked ? 'true' : 'false');
          } else {
            // Only update input value if it differs (avoid clobbering user typing)
            if (node.value !== value) {
              node.value = value;
            }
          }
        } else if (node instanceof HTMLTextAreaElement) {
          if (node.value !== value) {
            node.value = value;
          }
        } else if (node instanceof HTMLSelectElement) {
          // Update select element value
          if (node.multiple) {
            // If the bound value is an array, ensure matching options are selected
            const valuesArr =
              value === ''
                ? []
                : (value as string).split(',').map(s => s.trim());
            Array.from(node.options).forEach(opt => {
              opt.selected = valuesArr.includes(opt.value);
            });
          } else {
            if (node.value !== value) {
              node.value = value;
            }
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

  private isRecord(value: EditableRow): value is InternalRowData {
    return typeof value === 'object' && value !== null;
  }

  /**
   * Check if the component is in readonly mode
   */
  private isReadonlyBlocked(): boolean {
    return this.hasAttribute('readonly');
  }

  /**
   * Check if any row is currently in edit mode (exclusive locking)
   */
  private isEditLocked(): boolean {
    return this._data.some(
      item => this.isRecord(item) && item.editing === true
    );
  }

  /**
   * Validate that a row index is within valid bounds
   */
  private isValidRowIndex(rowIndex: number): boolean {
    return rowIndex >= 0 && rowIndex < this._data.length;
  }

  /**
   * Get the rows container from shadow DOM
   */
  private getRowsContainer(): HTMLElement | null {
    if (!this.shadowRoot) return null;
    return this.shadowRoot.querySelector(
      `[part="${CkEditableArray.PART_ROWS}"]`
    ) as HTMLElement | null;
  }

  /**
   * Get the add button container from shadow DOM
   */
  private getAddButtonContainer(): HTMLElement | null {
    if (!this.shadowRoot) return null;
    return this.shadowRoot.querySelector(
      `[part="${CkEditableArray.PART_ADD_BUTTON}"]`
    ) as HTMLElement | null;
  }

  /**
   * Get the display template from light DOM
   */
  private getDisplayTemplate(): HTMLTemplateElement | null {
    return this.querySelector(
      `template[slot="${CkEditableArray.SLOT_DISPLAY}"]`
    ) as HTMLTemplateElement | null;
  }

  /**
   * Get the edit template from light DOM
   */
  private getEditTemplate(): HTMLTemplateElement | null {
    return this.querySelector(
      `template[slot="${CkEditableArray.SLOT_EDIT}"]`
    ) as HTMLTemplateElement | null;
  }

  /**
   * Get row wrapper elements for a specific row index
   */
  private getRowWrappers(rowIndex: number): HTMLElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(
      this.shadowRoot.querySelectorAll<HTMLElement>(
        `[${CkEditableArray.ATTR_DATA_ROW}="${rowIndex}"]`
      )
    );
  }

  /**
   * Strip internal markers from row data for public API
   */
  private toPublicRowData(row: EditableRow): EditableRow {
    if (typeof row === 'string') {
      return row;
    }
    // Remove internal properties from public data
    // Keep 'deleted' and 'editing' as they're part of the public API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __originalSnapshot, __isNew, ...publicData } = row;
    return { ...publicData };
  }

  /**
   * Create a deep clone snapshot of row data for rollback
   */
  private createRowSnapshot(row: InternalRowData): Record<string, unknown> {
    // Create a clean copy without internal markers for the snapshot
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __originalSnapshot, __isNew, editing, ...cleanEntry } = row;
    return JSON.parse(JSON.stringify(cleanEntry)) as Record<string, unknown>;
  }

  /**
   * Restore row data from snapshot
   */
  private restoreFromSnapshot(row: InternalRowData): InternalRowData {
    const snapshot = row.__originalSnapshot;
    if (snapshot && typeof snapshot === 'object') {
      return JSON.parse(JSON.stringify(snapshot)) as InternalRowData;
    }
    // No snapshot available, just remove editing flag and markers
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { editing, __originalSnapshot, __isNew, ...rest } = row;
    return rest;
  }

  /**
   * Mark row as entering edit mode with snapshot
   */
  private enterEditMode(row: InternalRowData): InternalRowData {
    return {
      ...row,
      editing: true,
      __originalSnapshot: this.createRowSnapshot(row),
    };
  }

  /**
   * Remove editing flag and internal markers from row
   */
  private exitEditMode(row: InternalRowData): InternalRowData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { editing, __isNew, __originalSnapshot, ...rest } = row;
    return rest;
  }

  private renderAddButton(): void {
    const addButtonContainer = this.getAddButtonContainer();
    if (!addButtonContainer) return;

    // Clear previous add button content
    addButtonContainer.innerHTML = '';

    const isReadonly = this.isReadonlyBlocked();
    const hasEditingRow = this.isEditLocked();

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
    // Don't add if readonly or if any row is in edit mode
    if (this.isReadonlyBlocked() || this.isEditLocked()) {
      return;
    }

    // Create a new item using the factory
    const newItem = this._newItemFactory();

    // Mark the new item as being in editing mode, store original snapshot, and mark as new
    const newItemWithEditing: EditableRow = this.isRecord(newItem)
      ? {
          ...this.enterEditMode(newItem),
          __isNew: true,
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
    // Don't save if readonly or invalid index
    if (this.isReadonlyBlocked() || !this.isValidRowIndex(rowIndex)) {
      return;
    }

    // Don't save if row is invalid
    if (!this.validateRow(rowIndex)) {
      return;
    }

    // Remove editing flag and internal markers from the row
    const nextData: EditableRow[] = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        return this.exitEditMode(entry);
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
    // Don't toggle if readonly or invalid index
    if (this.isReadonlyBlocked() || !this.isValidRowIndex(rowIndex)) {
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
    const nextData: EditableRow[] = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        if (isCurrentlyEditing) {
          // Exiting edit mode - restore from snapshot (acts like Cancel)
          return this.restoreFromSnapshot(entry);
        } else {
          // Entering edit mode - store original snapshot
          return this.enterEditMode(entry);
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

    // Don't dispatch datachanged here - toggle is a UI state change, not a data change
    // Data changes are only dispatched when Save, Add, Delete, or Restore are clicked
  }

  private handleCancelClick(rowIndex: number): void {
    // Don't cancel if readonly or invalid index
    if (this.isReadonlyBlocked() || !this.isValidRowIndex(rowIndex)) {
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

    // Check if this is a new row that was just added (has __isNew marker)
    // If so, remove it; otherwise restore from snapshot
    const isNewRow = currentRow.__isNew === true;

    let nextData: EditableRow[];
    if (isNewRow) {
      // Remove the new row entirely
      nextData = this._data.filter((_, idx) => idx !== rowIndex);
    } else {
      // Restore original data from snapshot
      nextData = this._data.map((entry, idx) => {
        if (idx === rowIndex && this.isRecord(entry)) {
          return this.restoreFromSnapshot(entry);
        }
        return this.isRecord(entry) ? { ...entry } : entry;
      });
    }

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

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Check if a field value is empty
   */
  private isFieldEmpty(value: unknown): boolean {
    return (
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '')
    );
  }

  /**
   * Validate required fields against schema
   */
  private validateRequiredFields(
    row: InternalRowData,
    schema: ValidationSchema
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (Array.isArray(schema.required)) {
      for (const field of schema.required) {
        const value = row[field];
        if (this.isFieldEmpty(value)) {
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(
            this.formatValidationError(field, 'required', value)
          );
        }
      }
    }

    return errors;
  }

  /**
   * Validate property constraints against schema
   */
  private validatePropertyConstraints(
    row: InternalRowData,
    schema: ValidationSchema,
    requiredErrors: Record<string, string[]>
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (propSchema) {
          const value = row[key];

          // Skip property validation if field already has a required error
          if (requiredErrors[key]) {
            continue;
          }

          // Check minLength for strings
          if (
            typeof propSchema.minLength === 'number' &&
            typeof value === 'string'
          ) {
            if (value.length < propSchema.minLength) {
              if (!errors[key]) {
                errors[key] = [];
              }
              errors[key].push(
                this.formatValidationError(
                  key,
                  'minLength',
                  propSchema.minLength
                )
              );
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Format validation error message consistently
   */
  private formatValidationError(
    field: string,
    constraint: string,
    value: unknown
  ): string {
    if (constraint === 'required') {
      return `${field} is required`;
    }
    if (constraint === 'minLength') {
      return `${field} must be at least ${value} characters`;
    }
    return `${field} validation failed`;
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
  private validateRowDetailed(rowIndex: number): ValidationResult {
    const errors: Record<string, string[]> = {};

    if (!this.isValidRowIndex(rowIndex)) {
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

    const schema = this._schema as ValidationSchema;

    // Validate required fields
    const requiredErrors = this.validateRequiredFields(row, schema);
    Object.assign(errors, requiredErrors);

    // Validate property constraints (skip fields with required errors)
    const propertyErrors = this.validatePropertyConstraints(
      row,
      schema,
      requiredErrors
    );
    Object.assign(errors, propertyErrors);

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Update the disabled state of Save buttons and validation UI for a specific row
   * Validates the row and updates button states, field indicators, and error messages
   * @param rowIndex - The index of the row to update
   */
  private updateSaveButtonState(rowIndex: number): void {
    const rowWrappers = this.getRowWrappers(rowIndex);
    const editWrapper = rowWrappers.find(el =>
      el.classList.contains('edit-content')
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
        // Add ARIA invalid attribute for accessibility
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('data-invalid');
        input.removeAttribute('aria-invalid');
      }

      // Update error message display
      const errorElement = editWrapper.querySelector(
        `[data-field-error="${fieldName}"]`
      ) as HTMLElement;
      if (errorElement) {
        errorElement.textContent = fieldErrors.join(', ');

        // Set up ARIA relationship between input and error message
        if (hasErrors) {
          // Ensure error element has an ID
          let errorId = errorElement.getAttribute('id');
          if (!errorId) {
            errorId = `error-${rowIndex}-${fieldName}`;
            errorElement.setAttribute('id', errorId);
          }
          // Link input to error message via aria-describedby
          input.setAttribute('aria-describedby', errorId);
        } else {
          // Remove aria-describedby when no errors
          input.removeAttribute('aria-describedby');
        }
      }
    });

    // Update error count display
    const errorCountElement = editWrapper.querySelector('[data-error-count]');
    if (errorCountElement) {
      const totalErrors = Object.keys(validationResult.errors).length;
      if (totalErrors > 0) {
        errorCountElement.textContent = `${totalErrors} error${totalErrors !== 1 ? 's' : ''}`;
      } else {
        errorCountElement.textContent = '';
      }
    }

    // Update error summary for accessibility
    const errorSummary = editWrapper.querySelector(
      '[data-error-summary]'
    ) as HTMLElement;
    if (errorSummary) {
      if (isValid) {
        // Clear summary when valid
        errorSummary.textContent = '';
      } else {
        // Build summary of all errors
        const errorMessages: string[] = [];
        for (const [, messages] of Object.entries(validationResult.errors)) {
          errorMessages.push(...messages);
        }
        errorSummary.textContent = errorMessages.join('. ') + '.';
      }
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private handleDeleteClick(rowIndex: number): void {
    // Don't delete if readonly, invalid index, or any row is in edit mode
    if (
      this.isReadonlyBlocked() ||
      !this.isValidRowIndex(rowIndex) ||
      this.isEditLocked()
    ) {
      return;
    }

    // Mark the row as deleted
    const nextData: EditableRow[] = this._data.map((entry, idx) => {
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
    // Don't restore if readonly, invalid index, or any row is in edit mode
    if (
      this.isReadonlyBlocked() ||
      !this.isValidRowIndex(rowIndex) ||
      this.isEditLocked()
    ) {
      return;
    }

    // Set the deleted flag to false for the row
    const nextData: EditableRow[] = this._data.map((entry, idx) => {
      if (idx === rowIndex && this.isRecord(entry)) {
        return { ...entry, deleted: false };
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
