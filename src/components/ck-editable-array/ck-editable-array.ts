import {
  ckEditableArraySheet,
  ckEditableArrayCSS,
} from './ck-editable-array.styles';

interface EditState {
  editing: boolean;
  originalSnapshot: unknown;
}

type DataChangeMode = 'debounced' | 'change' | 'save';

const DEFAULT_DATA_CHANGE_MODE: DataChangeMode = 'debounced';
const DEFAULT_DATA_CHANGE_DEBOUNCE_MS = 300;

export class CkEditableArray extends HTMLElement {
  static formAssociated = true;

  private shadow: ShadowRoot;
  private _data: unknown[] = [];
  private _rootEl!: HTMLDivElement;
  private _containerEl: HTMLDivElement | null = null;
  private _messageEl: HTMLHeadingElement | null = null;
  private _rowsHostEl: HTMLDivElement | null = null;
  private _statusRegionEl: HTMLDivElement | null = null;
  private _displayTemplate: HTMLTemplateElement | null = null;
  private _editTemplate: HTMLTemplateElement | null = null;
  private _currentEditIndex: number | null = null;
  private _onShadowClick = (event: Event) =>
    this._handleShadowClick(event as MouseEvent);
  private _dataChangeTimer: number | null = null;
  private _internals: ElementInternals;

  // Internal edit state tracking (prevents polluting user data)
  private _editStateMap = new WeakMap<object, EditState>();
  private _primitiveEditState: (EditState | null)[] = [];
  private _initialData: unknown[] = [];

  constructor() {
    super();
    this._internals = this.attachInternals();
    this.shadow = this.attachShadow({ mode: 'open' });

    // Pre-load stylesheet if available (good practice to do early)
    const adopted = (
      this.shadow as unknown as ShadowRoot & {
        adoptedStyleSheets?: CSSStyleSheet[];
      }
    ).adoptedStyleSheets;
    if (ckEditableArraySheet && adopted !== undefined) {
      (
        this.shadow as unknown as ShadowRoot & {
          adoptedStyleSheets: CSSStyleSheet[];
        }
      ).adoptedStyleSheets = [...adopted, ckEditableArraySheet];
    }
  }

  connectedCallback() {
    if (!this._rootEl) {
      this._rootEl = document.createElement('div');
      this.shadow.appendChild(this._rootEl);
      this.shadow.addEventListener('click', this._onShadowClick);
    }
    this.render();
  }

  disconnectedCallback() {
    this.shadow.removeEventListener('click', this._onShadowClick);
    this._clearDataChangeTimer();
  }

  static get observedAttributes() {
    return [
      'name',
      'root-class',
      'rows-class',
      'row-class',
      'datachange-mode',
      'datachange-debounce',
      'button-edit-text',
      'button-save-text',
      'button-cancel-text',
      'button-delete-text',
      'button-restore-text',
    ];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      if (name === 'name') {
        this._updateNameOnly();
      } else if (
        name === 'root-class' ||
        name === 'rows-class' ||
        name === 'row-class'
      ) {
        this._updateWrapperClassesOnly();
      } else if (name === 'datachange-mode' || name === 'datachange-debounce') {
        this._clearDataChangeTimer();
      } else if (
        name === 'button-edit-text' ||
        name === 'button-save-text' ||
        name === 'button-cancel-text' ||
        name === 'button-delete-text' ||
        name === 'button-restore-text'
      ) {
        this._updateButtonText();
      } else {
        this.render();
      }
    }
  }

  get name() {
    return this.getAttribute('name') || 'items';
  }

  set name(value: string) {
    this.setAttribute('name', value);
  }

  get rootClass() {
    return this.getAttribute('root-class') || '';
  }

  set rootClass(value: string) {
    this.setAttribute('root-class', value);
  }

  get rowsClass() {
    return this.getAttribute('rows-class') || '';
  }

  set rowsClass(value: string) {
    this.setAttribute('rows-class', value);
  }

  get rowClass() {
    return this.getAttribute('row-class') || '';
  }

  set rowClass(value: string) {
    this.setAttribute('row-class', value);
  }

  get datachangeMode(): DataChangeMode {
    return this._getDataChangeMode();
  }

  set datachangeMode(value: DataChangeMode) {
    this.setAttribute('datachange-mode', value);
  }

  get datachangeDebounce(): number {
    return this._getDataChangeDebounce();
  }

  set datachangeDebounce(value: number) {
    this.setAttribute('datachange-debounce', String(value));
  }

  get data(): unknown[] {
    return this._deepClone(this._data);
  }

  set data(value: unknown) {
    this._clearDataChangeTimer();
    this._data = Array.isArray(value) ? this._deepClone(value) : [];

    // Store initial data for formResetCallback (only if not already set)
    if (this._initialData.length === 0) {
      this._initialData = this._deepClone(this._data);
    }

    this._currentEditIndex = null;

    // Clear internal edit state when data changes
    this._primitiveEditState = [];

    if (this.isConnected) {
      this.render();
      this._announceDataChange();
    }

    this._dispatchDataChanged();
  }

  private _deepClone(obj: unknown): unknown[] {
    const cloned = this._cloneValue(obj);
    return Array.isArray(cloned) ? cloned : [];
  }

  private _cloneValue<T>(obj: T): T {
    // structuredClone is ES2022+, target is ES2020; graceful fallback to JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).structuredClone === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (globalThis as any).structuredClone(obj) as T;
      } catch {
        return this._jsonClone(obj) as T;
      }
    }
    return this._jsonClone(obj) as T;
  }

  private _jsonClone(obj: unknown): unknown[] {
    try {
      return JSON.parse(JSON.stringify(obj)) as unknown[];
    } catch {
      return [];
    }
  }

  private _getDataChangeMode(): DataChangeMode {
    const mode = (this.getAttribute('datachange-mode') || '')
      .toLowerCase()
      .trim();
    if (mode === 'change' || mode === 'save' || mode === 'debounced') {
      return mode;
    }
    return DEFAULT_DATA_CHANGE_MODE;
  }

  private _getDataChangeDebounce(): number {
    const raw = this.getAttribute('datachange-debounce');
    const parsed = raw ? Number(raw) : Number.NaN;
    if (!Number.isFinite(parsed) || parsed < 0) {
      return DEFAULT_DATA_CHANGE_DEBOUNCE_MS;
    }
    return Math.floor(parsed);
  }

  private _getButtonEditText(): string {
    return this.getAttribute('button-edit-text') ?? 'Edit';
  }

  private _getButtonSaveText(): string {
    return this.getAttribute('button-save-text') ?? 'Save';
  }

  private _getButtonCancelText(): string {
    return this.getAttribute('button-cancel-text') ?? 'Cancel';
  }

  private _getButtonDeleteText(): string {
    return this.getAttribute('button-delete-text') ?? 'Delete';
  }

  private _getButtonRestoreText(): string {
    return this.getAttribute('button-restore-text') ?? 'Restore';
  }

  private _clearDataChangeTimer(): void {
    if (this._dataChangeTimer === null) return;
    window.clearTimeout(this._dataChangeTimer);
    this._dataChangeTimer = null;
  }

  private _scheduleDataChanged(): void {
    this._clearDataChangeTimer();
    const delay = this._getDataChangeDebounce();
    this._dataChangeTimer = window.setTimeout(() => {
      this._dataChangeTimer = null;
      this._dispatchDataChanged();
    }, delay);
  }

  private _dispatchDataChanged(): void {
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        detail: { data: this._deepClone(this._data) },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _dispatchRowChanged(rowIndex: number): void {
    this.dispatchEvent(
      new CustomEvent('rowchanged', {
        detail: {
          index: rowIndex,
          row: this._cloneValue(this._data[rowIndex]),
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private render() {
    if (!ckEditableArraySheet) {
      const disableFallback = this.hasAttribute('disable-style-fallback');
      if (
        !disableFallback &&
        !this.shadow.querySelector('style[data-ck-editable-array-fallback]')
      ) {
        const style = document.createElement('style');
        style.setAttribute('data-ck-editable-array-fallback', '');

        // Add CSP nonce support if attribute is present
        const nonce = this.getAttribute('csp-nonce');
        if (nonce) {
          style.nonce = nonce;
        }

        style.textContent = ckEditableArrayCSS;
        this.shadow.insertBefore(style, this._rootEl);
      }
    }

    // Create structure on first render only
    if (!this._containerEl) {
      this._containerEl = document.createElement('div');
      this._containerEl.className = 'ck-editable-array';
      this._containerEl.setAttribute('role', 'region');
      this._containerEl.setAttribute('aria-label', 'Editable array display');

      this._messageEl = document.createElement('h1');
      this._messageEl.className = 'message';

      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'subtitle';
      subtitleEl.textContent = 'Welcome to our Web Component Library';

      this._rowsHostEl = document.createElement('div');
      this._rowsHostEl.className = 'rows';
      this._rowsHostEl.setAttribute('role', 'list');
      this._rowsHostEl.setAttribute('aria-label', 'Array items');
      this._rowsHostEl.setAttribute('part', 'rows');
      this._rowsHostEl.setAttribute('data-ck-editable-array-rows', '');

      this._statusRegionEl = document.createElement('div');
      this._statusRegionEl.setAttribute('role', 'status');
      this._statusRegionEl.setAttribute('aria-live', 'polite');
      this._statusRegionEl.setAttribute('aria-atomic', 'true');
      this._statusRegionEl.className = 'ck-sr-only';
      this._statusRegionEl.setAttribute('id', 'aria-status');

      this._containerEl.appendChild(this._messageEl);
      this._containerEl.appendChild(subtitleEl);
      this._containerEl.appendChild(this._rowsHostEl);
      this._containerEl.appendChild(this._statusRegionEl);
      this._rootEl.appendChild(this._containerEl);
    }

    this._applyWrapperClasses();

    // Update only text content
    if (this._messageEl) {
      this._messageEl.textContent = `Hello, ${this.name}!`;
    }

    // Render rows
    if (this._rowsHostEl) {
      this._renderRows(this._rowsHostEl);
    }

    // Update form value after render completes
    this._updateFormValueFromControls();
  }

  private _updateNameOnly() {
    // Fast path: update name text without full re-render
    if (this._messageEl) {
      this._messageEl.textContent = `Hello, ${this.name}!`;
    }
  }

  private _parseClassTokens(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(/\s+/g)
      .map(t => t.trim())
      .filter(Boolean);
  }

  private _applyWrapperClasses() {
    const rootTokens = this._parseClassTokens(this.getAttribute('root-class'));
    const rowsTokens = this._parseClassTokens(this.getAttribute('rows-class'));
    const rowTokens = this._parseClassTokens(this.getAttribute('row-class'));

    if (this._containerEl) {
      this._containerEl.className = 'ck-editable-array';
      rootTokens.forEach(t => this._containerEl?.classList.add(t));
    }

    if (this._rowsHostEl) {
      this._rowsHostEl.className = 'rows';
      rowsTokens.forEach(t => this._rowsHostEl?.classList.add(t));

      const existingRows = Array.from(
        this._rowsHostEl.querySelectorAll('[data-row]')
      ) as HTMLElement[];
      existingRows.forEach(rowEl => {
        rowEl.className = 'row';
        rowTokens.forEach(t => rowEl.classList.add(t));
      });
    }
  }

  private _updateWrapperClassesOnly() {
    this._applyWrapperClasses();
  }

  private _updateButtonText() {
    // Fast path: update button text without full re-render
    if (!this._rowsHostEl) return;

    const rows = Array.from(
      this._rowsHostEl.querySelectorAll('[data-row]')
    ) as HTMLElement[];

    rows.forEach((rowEl, index) => {
      const rowData = this._data[index];
      const isDeleted = this._isRowDeleted(rowData);

      const editButton = rowEl.querySelector('[data-action="toggle"]');
      const saveButton = rowEl.querySelector('[data-action="save"]');
      const cancelButton = rowEl.querySelector('[data-action="cancel"]');
      const deleteButton = rowEl.querySelector('[data-action="delete"]');

      if (editButton) {
        editButton.textContent = this._getButtonEditText();
      }
      if (saveButton) {
        saveButton.textContent = this._getButtonSaveText();
      }
      if (cancelButton) {
        cancelButton.textContent = this._getButtonCancelText();
      }
      if (deleteButton) {
        if (isDeleted) {
          deleteButton.textContent = this._getButtonRestoreText();
        } else {
          deleteButton.textContent = this._getButtonDeleteText();
        }
      }
    });
  }

  private _getEditTemplate() {
    if (this._editTemplate) return this._editTemplate;
    const template = this.querySelector('template[slot="edit"]');
    if (template instanceof HTMLTemplateElement) {
      this._editTemplate = template;
      return template;
    }
    return null;
  }

  private _getDisplayTemplate(): HTMLTemplateElement | null {
    if (this._displayTemplate) return this._displayTemplate;
    const template = this.querySelector('template[slot="display"]');
    if (template instanceof HTMLTemplateElement) {
      this._displayTemplate = template;
      return template;
    }
    return null;
  }

  private _renderRows(rowsHost: HTMLElement) {
    const template = this._getDisplayTemplate();
    const editTemplate = this._getEditTemplate();
    if (template) {
      const rowTokens = this._parseClassTokens(this.getAttribute('row-class'));

      // Keyed rendering: reuse existing row elements or create new ones
      const existingRows = Array.from(
        rowsHost.querySelectorAll('[data-row]')
      ) as HTMLElement[];

      // Remove extra rows if data size decreased
      while (existingRows.length > this._data.length) {
        const extra = existingRows.pop();
        if (extra) extra.remove();
      }

      // Update or create rows
      this._data.forEach((rowData, index) =>
        this._renderRow(
          rowData,
          index,
          rowsHost,
          existingRows,
          template,
          editTemplate,
          rowTokens
        )
      );
      return;
    }

    // No template: show empty state
    rowsHost.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent =
      'No display template found. Add <template slot="display">...</template> to provide custom display content.';
    rowsHost.appendChild(empty);
  }

  private _renderRow(
    rowData: unknown,
    index: number,
    rowsHost: HTMLElement,
    existingRows: HTMLElement[],
    template: HTMLTemplateElement,
    editTemplate: HTMLTemplateElement | null,
    rowTokens: string[]
  ) {
    let rowEl = existingRows[index];
    let boundEls: HTMLElement[] = [];

    if (!rowEl) {
      // Create new row if it doesn't exist
      rowEl = document.createElement('div');
      rowEl.className = 'row';
      rowTokens.forEach(t => rowEl.classList.add(t));
      rowEl.setAttribute('tabindex', '0');
      rowEl.setAttribute('role', 'listitem');
      rowEl.setAttribute('data-mode', 'display');
      rowEl.addEventListener('keydown', event =>
        this._handleRowKeydown(event as KeyboardEvent)
      );
      rowsHost.appendChild(rowEl);

      // Clone template content into new row
      const displayWrapper = document.createElement('div');
      displayWrapper.className = 'display-content';
      displayWrapper.appendChild(
        this._sanitizeClone(
          template.content.cloneNode(true) as DocumentFragment
        )
      );
      rowEl.appendChild(displayWrapper);
      rowEl.toggleAttribute('data-has-edit-template', !!editTemplate);
      if (editTemplate) {
        const editWrapper = document.createElement('div');
        editWrapper.className = 'edit-content ck-hidden';
        editWrapper.appendChild(
          this._sanitizeClone(
            editTemplate.content.cloneNode(true) as DocumentFragment
          )
        );
        rowEl.appendChild(editWrapper);
      }
      const actionsWrapper = document.createElement('div');
      actionsWrapper.className = 'row-actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.setAttribute('data-action', 'toggle');
      editButton.setAttribute('part', 'button button-edit');
      editButton.textContent = this._getButtonEditText();
      editButton.setAttribute('aria-expanded', 'false');
      actionsWrapper.appendChild(editButton);
      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.setAttribute('data-action', 'save');
      saveButton.setAttribute('part', 'button button-save');
      saveButton.textContent = this._getButtonSaveText();
      actionsWrapper.appendChild(saveButton);
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.setAttribute('data-action', 'cancel');
      cancelButton.setAttribute('part', 'button button-cancel');
      cancelButton.textContent = this._getButtonCancelText();
      actionsWrapper.appendChild(cancelButton);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.setAttribute('data-action', 'delete');
      deleteButton.setAttribute('part', 'button button-delete');
      deleteButton.textContent = this._getButtonDeleteText();
      actionsWrapper.appendChild(deleteButton);
      rowEl.appendChild(actionsWrapper);

      // Add hidden checkbox for isDeleted property (soft delete)
      const hiddenCheckbox = document.createElement('input');
      hiddenCheckbox.type = 'checkbox';
      hiddenCheckbox.setAttribute('data-bind', 'isDeleted');
      hiddenCheckbox.setAttribute('hidden', '');
      hiddenCheckbox.style.display = 'none';
      rowEl.appendChild(hiddenCheckbox);

      // Cache bound elements on first creation
      boundEls = Array.from(
        rowEl.querySelectorAll('[data-bind]')
      ) as HTMLElement[];
      (rowEl as unknown as { _boundEls?: HTMLElement[] })._boundEls = boundEls;

      // Set name/id attributes on form controls during initial creation
      this._setFormControlAttributes(boundEls, index);

      // Add input event listeners for bidirectional binding
      this._attachInputListeners(boundEls);
    } else {
      // Retrieve cached bound elements
      boundEls =
        (rowEl as unknown as { _boundEls?: HTMLElement[] })._boundEls || [];
    }

    if (!rowEl) return;

    // Ensure row wrapper classes reflect current configuration (handles updates)
    rowEl.className = 'row';
    rowTokens.forEach(t => rowEl.classList.add(t));

    // Add ck-deleted class if row is deleted
    if (this._isRowDeleted(rowData)) {
      rowEl.classList.add('ck-deleted');
    }

    const isEditing = this._isRowEditing(rowData, index);
    if (isEditing) {
      this._currentEditIndex = index;
    } else if (this._currentEditIndex === index) {
      this._currentEditIndex = null;
    }
    this._setRowMode(rowEl, isEditing ? 'edit' : 'display');
    rowEl.toggleAttribute('data-has-edit-template', !!editTemplate);

    // Always update attributes and bindings for current index/data
    rowEl.setAttribute('data-row', String(index));

    // Update contextual aria-labels for buttons (Feature 4.1)
    const editButton = rowEl.querySelector('[data-action="toggle"]');
    const saveButton = rowEl.querySelector('[data-action="save"]');
    const cancelButton = rowEl.querySelector('[data-action="cancel"]');
    const deleteButton = rowEl.querySelector('[data-action="delete"]');
    const itemNumber = index + 1;

    const isDeleted = this._isRowDeleted(rowData);

    if (editButton) {
      editButton.setAttribute('aria-label', `Edit item ${itemNumber}`);
      // Disable edit button when row is deleted
      (editButton as HTMLButtonElement).disabled = isDeleted;
    }
    if (saveButton) {
      saveButton.setAttribute('aria-label', `Save item ${itemNumber}`);
    }
    if (cancelButton) {
      cancelButton.setAttribute(
        'aria-label',
        `Cancel edits for item ${itemNumber}`
      );
    }
    if (deleteButton) {
      if (isDeleted) {
        deleteButton.textContent = this._getButtonRestoreText();
        deleteButton.setAttribute('aria-label', `Restore item ${itemNumber}`);
      } else {
        deleteButton.textContent = this._getButtonDeleteText();
        deleteButton.setAttribute('aria-label', `Delete item ${itemNumber}`);
      }
    }

    // Re-apply bindings and semantics with cached elements
    this._applyBindingsOptimized(boundEls, rowData);
    this._applyFormSemanticsOptimized(rowEl, boundEls, rowData, index);
  }

  private _applyBindings(root: ParentNode, rowData: unknown) {
    const boundEls = root.querySelectorAll('[data-bind]');
    boundEls.forEach(el => {
      if (!(el instanceof HTMLElement)) return;
      const path = el.getAttribute('data-bind');
      if (!path) {
        el.textContent = '';
        return;
      }

      const value = this._resolvePath(rowData, path);
      if (Array.isArray(value)) {
        el.textContent = value.map(v => String(v)).join(', ');
        return;
      }
      if (value === null || value === undefined) {
        el.textContent = '';
        return;
      }
      el.textContent = String(value);
    });
  }

  private _applyFormSemantics(
    rowEl: HTMLElement,
    rowData: unknown,
    rowIndex: number
  ) {
    // Mark bound elements as form cells
    const boundEls = rowEl.querySelectorAll('[data-bind]');
    boundEls.forEach(el => {
      if (!(el instanceof HTMLElement)) return;
      el.setAttribute('role', 'cell');
    });

    // Store row index for form submission (accessible via data attribute)
    rowEl.setAttribute('data-form-row-index', String(rowIndex));

    // Store serialized row data for form submission
    if (typeof rowData === 'object' && rowData !== null) {
      try {
        const serialized = JSON.stringify(rowData);
        rowEl.setAttribute('data-form-row-data', serialized);
      } catch {
        // Silently skip serialization if not JSON-serializable
      }
    }
  }

  private _applyBindingsOptimized(boundEls: HTMLElement[], rowData: unknown) {
    boundEls.forEach(el => {
      const path = el.getAttribute('data-bind');
      if (!path) {
        // Handle form elements and non-form elements differently
        if (this._isFormElement(el)) {
          this._setFormElementValue(el, '');
        } else {
          el.textContent = '';
        }
        return;
      }

      const value = this._resolvePath(rowData, path);

      // Check if element is a form input (input, select, textarea)
      if (this._isFormElement(el)) {
        this._setFormElementValue(el, value);
      } else {
        // Non-form elements use textContent (existing behavior)
        if (Array.isArray(value)) {
          el.textContent = value.map(v => String(v)).join(', ');
          return;
        }
        if (value === null || value === undefined) {
          el.textContent = '';
          return;
        }
        el.textContent = String(value);
      }
    });
  }

  private _isFormElement(el: HTMLElement): boolean {
    const tagName = el.tagName.toLowerCase();
    return (
      tagName === 'input' || tagName === 'select' || tagName === 'textarea'
    );
  }

  private _setFormElementValue(el: HTMLElement, value: unknown): void {
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'input') {
      const inputEl = el as HTMLInputElement;
      const inputType = inputEl.type.toLowerCase();

      if (inputType === 'checkbox') {
        // Checkbox: set checked property
        inputEl.checked = Boolean(value);
      } else if (inputType === 'radio') {
        // Radio: set checked if value matches
        inputEl.checked = inputEl.value === String(value);
      } else {
        // Text, number, email, etc.: set value
        if (value === null || value === undefined) {
          inputEl.value = '';
        } else {
          inputEl.value = String(value);
        }
      }
    } else if (tagName === 'select') {
      const selectEl = el as HTMLSelectElement;
      if (value === null || value === undefined) {
        selectEl.value = '';
      } else {
        selectEl.value = String(value);
      }
    } else if (tagName === 'textarea') {
      const textareaEl = el as HTMLTextAreaElement;
      if (value === null || value === undefined) {
        textareaEl.value = '';
      } else {
        textareaEl.value = String(value);
      }
    }
  }

  private _setFormControlAttributes(
    boundEls: HTMLElement[],
    rowIndex: number
  ): void {
    const componentName = this.name;

    boundEls.forEach(el => {
      // Only set name/id on form controls (input, select, textarea)
      if (!this._isFormElement(el)) return;

      const bindPath = el.getAttribute('data-bind');
      if (!bindPath) return;

      // Set name attribute: componentName[index].path
      const nameAttr = `${componentName}[${rowIndex}].${bindPath}`;
      el.setAttribute('name', nameAttr);

      // Set id attribute: componentName__index__path
      // Replace dots in path with underscores for valid IDs
      const idPath = bindPath.replace(/\./g, '_');
      const idAttr = `${componentName}__${rowIndex}__${idPath}`;
      el.setAttribute('id', idAttr);
    });
  }

  private _applyFormSemanticsOptimized(
    rowEl: HTMLElement,
    boundEls: HTMLElement[],
    rowData: unknown,
    rowIndex: number
  ) {
    // Optimized version: use pre-cached bound elements
    boundEls.forEach(el => {
      el.setAttribute('role', 'cell');
    });

    rowEl.setAttribute('data-form-row-index', String(rowIndex));

    if (typeof rowData === 'object' && rowData !== null) {
      try {
        const serialized = JSON.stringify(rowData);
        rowEl.setAttribute('data-form-row-data', serialized);
      } catch {
        // Silently skip serialization if not JSON-serializable
      }
    }
  }

  private _resolvePath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, obj);
  }

  private _handleRowKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const rowEl = target.closest('[data-row]') as HTMLElement | null;
    if (!rowEl) return;

    // Compute index from DOM at runtime, not from captured closure
    const rowIndex = Number(rowEl.getAttribute('data-row'));
    if (!Number.isFinite(rowIndex)) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const rows = this.shadowRoot?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;
      if (rows && rowIndex < rows.length - 1) {
        rows[rowIndex + 1].focus();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const rows = this.shadowRoot?.querySelectorAll('[data-row]') as
        | NodeListOf<HTMLElement>
        | undefined;
      if (rows && rowIndex > 0) {
        rows[rowIndex - 1].focus();
      }
    }
  }

  private _announceDataChange() {
    const statusRegion = this.shadowRoot?.querySelector(
      '[role="status"]'
    ) as HTMLElement | null;
    if (statusRegion) {
      const rowCount = this._data.length;
      const message =
        rowCount === 0
          ? 'Array is now empty'
          : rowCount === 1
            ? '1 item in array'
            : `${rowCount} items in array`;
      statusRegion.textContent = message;
    }
  }

  private _announceAction(message: string) {
    const statusRegion = this.shadowRoot?.querySelector(
      '[role="status"]'
    ) as HTMLElement | null;
    if (statusRegion) {
      statusRegion.textContent = message;
    }
  }

  private _attachInputListeners(boundEls: HTMLElement[]): void {
    boundEls.forEach(el => {
      // Only attach listeners to form elements
      if (!this._isFormElement(el)) return;

      const bindPath = el.getAttribute('data-bind');
      if (!bindPath) return;

      const tagName = el.tagName.toLowerCase();
      const inputType =
        el instanceof HTMLInputElement ? el.type.toLowerCase() : '';

      if (
        tagName === 'select' ||
        inputType === 'checkbox' ||
        inputType === 'radio'
      ) {
        el.addEventListener('change', event =>
          this._handleInputChange(event, bindPath)
        );
        return;
      }

      el.addEventListener('input', event =>
        this._handleInputChange(event, bindPath)
      );
      el.addEventListener('change', event =>
        this._handleInputChange(event, bindPath)
      );
    });
  }

  private _handleInputChange(event: Event, bindPath: string): void {
    const target = event.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;

    // Compute row index from DOM at runtime, not from captured closure
    const rowEl = target.closest('[data-row]') as HTMLElement | null;
    if (!rowEl) return;

    const rowIndex = Number(rowEl.getAttribute('data-row'));
    if (
      !Number.isFinite(rowIndex) ||
      rowIndex < 0 ||
      rowIndex >= this._data.length
    )
      return;

    // Get the new value from the input
    let newValue: unknown;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      newValue = target.checked;
    } else {
      newValue = target.value;
    }

    // Update the internal data
    this._setNestedPath(this._data[rowIndex], bindPath, newValue);

    // Update only the display elements in this row
    const boundEls =
      (rowEl as unknown as { _boundEls?: HTMLElement[] })._boundEls || [];
    this._applyBindingsOptimized(boundEls, this._data[rowIndex]);

    this._dispatchRowChanged(rowIndex);
    this._handleDataChangeForEvent(event);

    // Update form value on change events
    if (event.type === 'change') {
      this._updateFormValueFromControls();
    }
  }

  private _handleDataChangeForEvent(event: Event): void {
    const mode = this._getDataChangeMode();
    if (mode === 'debounced') {
      this._scheduleDataChanged();
      return;
    }
    if (mode === 'change') {
      if (event.type === 'change') {
        this._dispatchDataChanged();
      }
      return;
    }
  }

  private _setNestedPath(obj: unknown, path: string, value: unknown): void {
    if (typeof obj !== 'object' || obj === null) return;

    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;

    // Reject reserved keys to prevent prototype pollution
    const reservedKeys = ['__proto__', 'constructor', 'prototype'];

    let current = obj as Record<string, unknown>;

    // Navigate to the parent object
    for (const key of keys) {
      if (reservedKeys.includes(key)) return;

      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
      if (typeof current !== 'object' || current === null) return;
    }

    // Set the value
    if (reservedKeys.includes(lastKey)) return;
    current[lastKey] = value;
  }

  private _handleShadowClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    if (!actionEl || !this.shadow.contains(actionEl)) return;

    const rowEl = actionEl.closest('[data-row]') as HTMLElement | null;
    const action = actionEl.getAttribute('data-action');
    if (!rowEl || !action) return;

    const rowIndex = Number(rowEl.getAttribute('data-row'));
    if (!Number.isFinite(rowIndex)) return;

    if (action === 'toggle') {
      this._enterEditMode(rowEl, rowIndex);
    } else if (action === 'save') {
      this._saveRow(rowEl, rowIndex);
    } else if (action === 'cancel') {
      this._cancelRow(rowEl, rowIndex);
    } else if (action === 'delete') {
      this._toggleDeleteRow(rowEl, rowIndex);
    }
  }

  private _enterEditMode(rowEl: HTMLElement, rowIndex: number) {
    if (
      this._currentEditIndex !== null &&
      this._currentEditIndex !== rowIndex
    ) {
      return;
    }

    const beforeEvent = new CustomEvent('beforetogglemode', {
      detail: { mode: 'edit', rowIndex },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(beforeEvent);
    if (beforeEvent.defaultPrevented) return;

    const rowData = this._data[rowIndex];
    const snapshot = this._cloneValue(rowData);

    // Store edit state internally, don't pollute user data
    this._setEditState(rowData, rowIndex, {
      editing: true,
      originalSnapshot: snapshot,
    });

    this._currentEditIndex = rowIndex;
    this._setRowMode(rowEl, 'edit');
    this._focusFirstInput(rowEl);

    const afterEvent = new CustomEvent('aftertogglemode', {
      detail: { mode: 'edit', rowIndex },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(afterEvent);

    // Announce edit mode for screen readers (Feature 4.2)
    this._announceAction(`Editing item ${rowIndex + 1}`);
  }

  private _saveRow(rowEl: HTMLElement, rowIndex: number) {
    if (this._currentEditIndex !== rowIndex) return;

    const rowData = this._data[rowIndex];

    // Clear internal edit state (don't pollute user data)
    this._setEditState(rowData, rowIndex, null);

    this._currentEditIndex = null;
    this._setRowMode(rowEl, 'display');

    const afterEvent = new CustomEvent('aftertogglemode', {
      detail: { mode: 'display', rowIndex },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(afterEvent);

    // Announce save for screen readers (Feature 4.2)
    this._announceAction(`Saved item ${rowIndex + 1}`);

    // Restore focus to edit button (Feature 4.3)
    const editButton = rowEl.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement | null;
    editButton?.focus();

    if (this._getDataChangeMode() === 'save') {
      this._dispatchDataChanged();
    }

    // Update form value after save
    this._updateFormValueFromControls();
  }

  private _cancelRow(rowEl: HTMLElement, rowIndex: number) {
    if (this._currentEditIndex !== rowIndex) return;

    const beforeEvent = new CustomEvent('beforetogglemode', {
      detail: { mode: 'display', rowIndex },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(beforeEvent);
    if (beforeEvent.defaultPrevented) return;

    const rowData = this._data[rowIndex];

    // Restore from internal snapshot (don't pollute user data)
    const editState = this._getEditState(rowData, rowIndex);
    if (editState?.originalSnapshot !== undefined) {
      this._data[rowIndex] = this._cloneValue(editState.originalSnapshot);
    }

    // Clear internal edit state
    this._setEditState(this._data[rowIndex], rowIndex, null);

    const boundEls =
      (rowEl as unknown as { _boundEls?: HTMLElement[] })._boundEls || [];
    this._applyBindingsOptimized(boundEls, this._data[rowIndex]);

    this._currentEditIndex = null;
    this._setRowMode(rowEl, 'display');

    const afterEvent = new CustomEvent('aftertogglemode', {
      detail: { mode: 'display', rowIndex },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(afterEvent);

    // Announce cancel for screen readers (Feature 4.2)
    this._announceAction(`Canceled edits for item ${rowIndex + 1}`);

    // Restore focus to edit button (Feature 4.3)
    const editButton = rowEl.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement | null;
    editButton?.focus();

    // Update form value after cancel
    this._updateFormValueFromControls();
  }

  private _toggleDeleteRow(rowEl: HTMLElement, rowIndex: number) {
    const rowData = this._data[rowIndex];
    if (!rowData) return;

    // Toggle isDeleted property
    const isCurrentlyDeleted = this._isRowDeleted(rowData);
    const newDeletedState = !isCurrentlyDeleted;

    // Add isDeleted property to data if it doesn't exist
    if (typeof rowData === 'object' && rowData !== null) {
      (rowData as Record<string, unknown>).isDeleted = newDeletedState;
    }

    // Update button text and aria-label
    const deleteButton = rowEl.querySelector(
      '[data-action="delete"]'
    ) as HTMLButtonElement | null;
    if (deleteButton) {
      if (newDeletedState) {
        deleteButton.textContent = this._getButtonRestoreText();
        deleteButton.setAttribute('aria-label', `Restore item ${rowIndex + 1}`);
      } else {
        deleteButton.textContent = this._getButtonDeleteText();
        deleteButton.setAttribute('aria-label', `Delete item ${rowIndex + 1}`);
      }
    }

    // Update edit button disabled state
    const editButton = rowEl.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement | null;
    if (editButton) {
      editButton.disabled = newDeletedState;
    }

    // Update checkbox state
    const checkbox = rowEl.querySelector(
      'input[type="checkbox"][data-bind="isDeleted"]'
    ) as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = newDeletedState;
    }

    // Toggle ck-deleted class on row
    rowEl.classList.toggle('ck-deleted', newDeletedState);

    // Dispatch events
    this._dispatchRowChanged(rowIndex);

    // Dispatch datachanged based on mode (not triggered by a real event, so check mode directly)
    const mode = this._getDataChangeMode();
    if (mode === 'debounced') {
      this._scheduleDataChanged();
    } else if (mode === 'change' || mode === 'save') {
      this._dispatchDataChanged();
    }

    // Update form value
    this._updateFormValueFromControls();
  }

  private _sanitizeClone(fragment: DocumentFragment): DocumentFragment {
    const scripts = fragment.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    const allElements = fragment.querySelectorAll('*');
    allElements.forEach(el => {
      const attributes = el.getAttributeNames();
      attributes.forEach(attr => {
        if (attr.startsWith('on')) {
          el.removeAttribute(attr);
        }
      });
    });

    return fragment;
  }

  private _getEditState(rowData: unknown, rowIndex: number): EditState | null {
    if (typeof rowData === 'object' && rowData !== null) {
      return this._editStateMap.get(rowData) || null;
    } else {
      // For primitives, use parallel array
      return this._primitiveEditState[rowIndex] || null;
    }
  }

  private _setEditState(
    rowData: unknown,
    rowIndex: number,
    state: EditState | null
  ): void {
    if (typeof rowData === 'object' && rowData !== null) {
      if (state === null) {
        this._editStateMap.delete(rowData);
      } else {
        this._editStateMap.set(rowData, state);
      }
    } else {
      // For primitives, use parallel array
      this._primitiveEditState[rowIndex] = state;
    }
  }

  private _isRowEditing(rowData: unknown, rowIndex: number): boolean {
    const editState = this._getEditState(rowData, rowIndex);
    if (editState?.editing) return true;
    return this._currentEditIndex === rowIndex;
  }

  private _isRowDeleted(rowData: unknown): boolean {
    if (typeof rowData === 'object' && rowData !== null) {
      return (rowData as Record<string, unknown>).isDeleted === true;
    }
    return false;
  }

  private _setRowMode(rowEl: HTMLElement, mode: 'display' | 'edit') {
    rowEl.setAttribute('data-mode', mode);
    const displayWrapper = rowEl.querySelector(
      '.display-content'
    ) as HTMLElement | null;
    const editWrapper = rowEl.querySelector(
      '.edit-content'
    ) as HTMLElement | null;
    if (displayWrapper) {
      displayWrapper.classList.toggle('ck-hidden', mode === 'edit');
    }
    if (editWrapper) {
      editWrapper.classList.toggle('ck-hidden', mode !== 'edit');
    }
    const editButton = rowEl.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement | null;
    const saveButton = rowEl.querySelector(
      '[data-action="save"]'
    ) as HTMLElement | null;
    const cancelButton = rowEl.querySelector(
      '[data-action="cancel"]'
    ) as HTMLElement | null;
    if (editButton) {
      editButton.classList.toggle('ck-hidden', mode === 'edit');
      // Update aria-expanded based on mode (Feature 4.1)
      editButton.setAttribute(
        'aria-expanded',
        mode === 'edit' ? 'true' : 'false'
      );
    }
    if (saveButton) {
      saveButton.classList.toggle('ck-hidden', mode !== 'edit');
    }
    if (cancelButton) {
      cancelButton.classList.toggle('ck-hidden', mode !== 'edit');
    }
  }

  private _focusFirstInput(rowEl: HTMLElement) {
    const firstInput = rowEl.querySelector(
      '.edit-content input, .edit-content select, .edit-content textarea'
    ) as HTMLElement | null;
    firstInput?.focus();
  }

  private _updateFormValueFromControls(): void {
    const fd = new FormData();

    // Query all form controls in shadow DOM
    const controls = this.shadow.querySelectorAll(
      'input, select, textarea'
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

    controls.forEach(control => {
      // Skip disabled controls
      if (control.disabled) return;

      // Get the name attribute (native-like behavior: skip if no name)
      const key = control.getAttribute('name');
      if (!key) return;

      // Apply native inclusion rules based on control type
      if (control instanceof HTMLInputElement) {
        if (control.type === 'checkbox') {
          // Checkbox: include only if checked
          if (control.checked) {
            const value = control.value || 'on';
            fd.append(key, value);
          }
        } else if (control.type === 'radio') {
          // Radio: include only if checked
          if (control.checked) {
            fd.append(key, control.value);
          }
        } else {
          // All other input types: include value
          fd.append(key, control.value);
        }
      } else if (control instanceof HTMLSelectElement) {
        if (control.multiple) {
          // Multiple select: append each selected option
          Array.from(control.selectedOptions).forEach(option => {
            fd.append(key, option.value);
          });
        } else {
          // Single select: append value
          fd.append(key, control.value);
        }
      } else if (control instanceof HTMLTextAreaElement) {
        // Textarea: append value
        fd.append(key, control.value);
      }
    });

    // Update the form value via ElementInternals
    // Check if setFormValue exists (may not in test environments like jsdom)
    if (typeof this._internals.setFormValue === 'function') {
      this._internals.setFormValue(fd);
    }
  }

  // FACE callback: called when the form is disabled/enabled
  formDisabledCallback(disabled: boolean): void {
    // Disable/enable all internal form controls
    const controls = this.shadow.querySelectorAll(
      'input, select, textarea'
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

    controls.forEach(control => {
      control.disabled = disabled;
    });

    // Update form value after state change
    this._updateFormValueFromControls();
  }

  // FACE callback: called when the form is reset
  formResetCallback(): void {
    // Restore data to initial state
    this._data = this._deepClone(this._initialData);
    this._currentEditIndex = null;
    this._primitiveEditState = [];

    // Re-render with restored data
    if (this.isConnected) {
      this.render();
    }

    // Update form value after reset
    this._updateFormValueFromControls();
  }
}

if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
