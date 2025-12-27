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

  // Drag and drop state
  private _dragSourceIndex: number | null = null;

  // Animation state
  private _isAnimating = false;
  private _animationTimerId: number | null = null;
  private static readonly ANIMATION_DURATION = 250; // ms

  // Lifecycle state
  private _clickListenerAttached = false;

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
    }
    // Reattach click listener if not already attached (handles reconnection)
    if (!this._clickListenerAttached) {
      this.shadow.addEventListener('click', this._onShadowClick);
      this._clickListenerAttached = true;
    }
    this.render();
  }

  disconnectedCallback() {
    this.shadow.removeEventListener('click', this._onShadowClick);
    this._clickListenerAttached = false;
    this._clearDataChangeTimer();
    this._clearAnimationTimer();
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
      'readonly',
      'allow-reorder',
    ];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      if (!this._rootEl) return;
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
      } else if (name === 'allow-reorder') {
        this._updateMoveButtons();
        this._updateDraggableState();
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

  get allowReorder(): boolean {
    // Defaults to true if attribute is not set
    return this.getAttribute('allow-reorder') !== 'false';
  }

  set allowReorder(value: boolean) {
    if (value) {
      this.removeAttribute('allow-reorder');
    } else {
      this.setAttribute('allow-reorder', 'false');
    }
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

  get readonly(): boolean {
    return this.hasAttribute('readonly');
  }

  set readonly(value: boolean) {
    if (value) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
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

  private _clearAnimationTimer(): void {
    if (this._animationTimerId === null) return;
    window.clearTimeout(this._animationTimerId);
    this._animationTimerId = null;
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

  private _updateMoveButtons() {
    // Re-render when allowReorder changes (buttons need to be added/removed)
    // Clear existing rows and recreate them to ensure buttons are added/removed
    if (this._containerEl && this._rowsHostEl) {
      // Clear all existing rows to force recreation
      this._rowsHostEl.replaceChildren();
      this.render();
    }
  }

  private _updateDraggableState() {
    // Fast path: update draggable attribute based on allowReorder
    if (!this._rowsHostEl) return;

    const rows = Array.from(
      this._rowsHostEl.querySelectorAll('[data-row]')
    ) as HTMLElement[];

    rows.forEach(rowEl => {
      rowEl.setAttribute(
        'draggable',
        this.readonly || !this.allowReorder ? 'false' : 'true'
      );
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

      // Add drag and drop event listeners
      rowEl.addEventListener('dragstart', event =>
        this._handleDragStart(event as DragEvent)
      );
      rowEl.addEventListener('dragover', event =>
        this._handleDragOver(event as DragEvent)
      );
      rowEl.addEventListener('dragleave', event =>
        this._handleDragLeave(event as DragEvent)
      );
      rowEl.addEventListener('drop', event =>
        this._handleDrop(event as DragEvent)
      );
      rowEl.addEventListener('dragend', event =>
        this._handleDragEnd(event as DragEvent)
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

      // Only create move buttons if reordering is allowed
      if (this.allowReorder) {
        const moveUpButton = document.createElement('button');
        moveUpButton.type = 'button';
        moveUpButton.setAttribute('data-action', 'move-up');
        moveUpButton.setAttribute('part', 'button button-move-up');
        moveUpButton.textContent = '↑';
        actionsWrapper.appendChild(moveUpButton);
        const moveDownButton = document.createElement('button');
        moveDownButton.type = 'button';
        moveDownButton.setAttribute('data-action', 'move-down');
        moveDownButton.setAttribute('part', 'button button-move-down');
        moveDownButton.textContent = '↓';
        actionsWrapper.appendChild(moveDownButton);
      }

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

    // Set draggable attribute based on readonly state and allowReorder
    rowEl.setAttribute(
      'draggable',
      this.readonly || !this.allowReorder ? 'false' : 'true'
    );

    // Update contextual aria-labels for buttons (Feature 4.1)
    const editButton = rowEl.querySelector('[data-action="toggle"]');
    const saveButton = rowEl.querySelector('[data-action="save"]');
    const cancelButton = rowEl.querySelector('[data-action="cancel"]');
    const deleteButton = rowEl.querySelector('[data-action="delete"]');
    const itemNumber = index + 1;

    const isDeleted = this._isRowDeleted(rowData);

    if (editButton) {
      editButton.setAttribute('aria-label', `Edit item ${itemNumber}`);
      // Disable edit button when row is deleted or readonly
      (editButton as HTMLButtonElement).disabled = isDeleted || this.readonly;
    }
    if (saveButton) {
      saveButton.setAttribute('aria-label', `Save item ${itemNumber}`);
      (saveButton as HTMLButtonElement).disabled = this.readonly;
    }
    if (cancelButton) {
      cancelButton.setAttribute(
        'aria-label',
        `Cancel edits for item ${itemNumber}`
      );
    }
    if (deleteButton) {
      (deleteButton as HTMLButtonElement).disabled = this.readonly;
      if (isDeleted) {
        deleteButton.textContent = this._getButtonRestoreText();
        deleteButton.setAttribute('aria-label', `Restore item ${itemNumber}`);
      } else {
        deleteButton.textContent = this._getButtonDeleteText();
        deleteButton.setAttribute('aria-label', `Delete item ${itemNumber}`);
      }
    }

    // Update move up/down buttons
    const moveUpButton = rowEl.querySelector(
      '[data-action="move-up"]'
    ) as HTMLButtonElement | null;
    const moveDownButton = rowEl.querySelector(
      '[data-action="move-down"]'
    ) as HTMLButtonElement | null;

    if (moveUpButton) {
      moveUpButton.setAttribute('aria-label', `Move item ${itemNumber} up`);
      // Disable if first row, readonly, or reordering disabled
      moveUpButton.disabled =
        index === 0 || this.readonly || !this.allowReorder;
    }
    if (moveDownButton) {
      moveDownButton.setAttribute('aria-label', `Move item ${itemNumber} down`);
      // Disable if last row, readonly, or reordering disabled
      moveDownButton.disabled =
        index === this._data.length - 1 || this.readonly || !this.allowReorder;
    }

    // Re-apply bindings and semantics with cached elements
    this._applyBindingsOptimized(boundEls, rowData);
    this._applyFormSemanticsOptimized(rowEl, boundEls, rowData, index);
  }

  private _applyFormSemantics(
    rowEl: HTMLElement,
    rowData: unknown,
    rowIndex: number
  ) {
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
    if (this.readonly) return;

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

    if (this.readonly && action !== 'cancel') return;

    if (action === 'toggle') {
      this._enterEditMode(rowEl, rowIndex);
    } else if (action === 'save') {
      this._saveRow(rowEl, rowIndex);
    } else if (action === 'cancel') {
      this._cancelRow(rowEl, rowIndex);
    } else if (action === 'delete') {
      this._toggleDeleteRow(rowEl, rowIndex);
    } else if (action === 'move-up') {
      this.moveUp(rowIndex);
    } else if (action === 'move-down') {
      this.moveDown(rowIndex);
    }
  }

  private _enterEditMode(rowEl: HTMLElement, rowIndex: number) {
    if (this.readonly) return;
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
    if (this.readonly) return;
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
    if (this.readonly) return;
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
    // Hide move buttons when in edit mode (same behavior as drag and drop)
    const moveUpButton = rowEl.querySelector(
      '[data-action="move-up"]'
    ) as HTMLElement | null;
    const moveDownButton = rowEl.querySelector(
      '[data-action="move-down"]'
    ) as HTMLElement | null;
    if (moveUpButton) {
      moveUpButton.classList.toggle('ck-hidden', mode === 'edit');
    }
    if (moveDownButton) {
      moveDownButton.classList.toggle('ck-hidden', mode === 'edit');
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

  // Drag and drop handlers
  private _handleDragStart(event: DragEvent): void {
    const rowEl = event.target as HTMLElement;
    if (!rowEl?.hasAttribute('data-row')) return;

    // Block drag if readonly, editing, or reordering disabled
    if (
      this.readonly ||
      this._currentEditIndex !== null ||
      !this.allowReorder
    ) {
      event.preventDefault();
      return;
    }

    const rowIndex = Number(rowEl.getAttribute('data-row'));
    if (!Number.isFinite(rowIndex)) return;

    this._dragSourceIndex = rowIndex;
    rowEl.classList.add('ck-dragging');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(rowIndex));
    }
  }

  private _handleDragOver(event: DragEvent): void {
    event.preventDefault();

    const rowEl = (event.target as HTMLElement)?.closest(
      '[data-row]'
    ) as HTMLElement | null;
    if (!rowEl) return;

    // Block if readonly
    if (this.readonly) return;

    rowEl.classList.add('ck-drag-over');

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  private _handleDragLeave(event: DragEvent): void {
    const rowEl = (event.target as HTMLElement)?.closest(
      '[data-row]'
    ) as HTMLElement | null;
    if (!rowEl) return;

    rowEl.classList.remove('ck-drag-over');
  }

  private _handleDrop(event: DragEvent): void {
    event.preventDefault();

    const targetRowEl = (event.target as HTMLElement)?.closest(
      '[data-row]'
    ) as HTMLElement | null;
    if (!targetRowEl) return;

    // Block if readonly
    if (this.readonly) {
      this._clearDragClasses();
      return;
    }

    const fromIndex = this._dragSourceIndex;
    const toIndex = Number(targetRowEl.getAttribute('data-row'));

    // Validate indices
    if (
      fromIndex === null ||
      !Number.isFinite(toIndex) ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      fromIndex >= this._data.length ||
      toIndex < 0 ||
      toIndex >= this._data.length
    ) {
      this._clearDragClasses();
      return;
    }

    // Perform the reorder
    this._reorderData(fromIndex, toIndex);

    // Clear drag state
    this._dragSourceIndex = null;
    this._clearDragClasses();
  }

  private _handleDragEnd(event: DragEvent): void {
    const rowEl = event.target as HTMLElement;
    if (rowEl) {
      rowEl.classList.remove('ck-dragging');
    }
    this._dragSourceIndex = null;
    this._clearDragClasses();
  }

  private _clearDragClasses(): void {
    const rows = this._rowsHostEl?.querySelectorAll('[data-row]');
    rows?.forEach(row => {
      row.classList.remove('ck-dragging', 'ck-drag-over');
    });
  }

  private _reorderData(fromIndex: number, toIndex: number): void {
    // Remove the item from its original position
    const [movedItem] = this._data.splice(fromIndex, 1);

    // Insert it at the new position
    this._data.splice(toIndex, 0, movedItem);

    // Update DOM without full re-render
    this._updateRowIndicesAfterReorder(fromIndex, toIndex);

    // Dispatch reorder event
    this.dispatchEvent(
      new CustomEvent('reorder', {
        detail: {
          fromIndex,
          toIndex,
          data: this._deepClone(this._data),
        },
        bubbles: true,
        composed: true,
      })
    );

    // Dispatch datachanged event
    this._dispatchDataChanged();

    // Announce the reorder for accessibility
    const message = `Moved item from position ${fromIndex + 1} to ${toIndex + 1}`;
    this._announceAction(message);
  }

  private _updateRowIndicesAfterReorder(
    fromIndex: number,
    toIndex: number
  ): void {
    const rowsHost = this._rowsHostEl;
    if (!rowsHost) return;

    const rows = Array.from(rowsHost.querySelectorAll('[data-row]'));
    if (rows.length === 0) return;

    const fromRow = rows[fromIndex] as HTMLElement;
    const toRow = rows[toIndex] as HTMLElement;

    if (!fromRow || !toRow) return;

    // Move the DOM element to its new position
    if (fromIndex < toIndex) {
      // Moving down: insert after toRow
      toRow.parentNode?.insertBefore(fromRow, toRow.nextSibling);
    } else {
      // Moving up: insert before toRow
      toRow.parentNode?.insertBefore(fromRow, toRow);
    }

    // After moving DOM elements, re-query in new DOM order and update all indices
    const updatedRows = Array.from(rowsHost.querySelectorAll('[data-row]'));
    updatedRows.forEach((row, index) => {
      this._updateRowIndexAndButtons(row as HTMLElement, index);
    });

    // Keep form value in sync with new ordering
    this._updateFormValueFromControls();
  }

  private _updateRowIndexAndButtons(rowEl: HTMLElement, index: number): void {
    rowEl.setAttribute('data-row', String(index));
    rowEl.setAttribute('data-form-row-index', String(index));

    const itemNumber = index + 1;
    const rowData = this._data[index];
    const isDeleted = this._isRowDeleted(rowData);
    const boundEls =
      (rowEl as unknown as { _boundEls?: HTMLElement[] })._boundEls || [];

    // Refresh form control name/id to reflect new index
    this._setFormControlAttributes(boundEls, index);
    this._applyFormSemanticsOptimized(rowEl, boundEls, rowData, index);

    // Update move buttons
    const moveUpButton = rowEl.querySelector(
      '[data-action="move-up"]'
    ) as HTMLButtonElement | null;
    const moveDownButton = rowEl.querySelector(
      '[data-action="move-down"]'
    ) as HTMLButtonElement | null;

    if (moveUpButton) {
      moveUpButton.setAttribute('aria-label', `Move item ${itemNumber} up`);
      moveUpButton.disabled =
        index === 0 || this.readonly || !this.allowReorder;
    }
    if (moveDownButton) {
      moveDownButton.setAttribute('aria-label', `Move item ${itemNumber} down`);
      moveDownButton.disabled =
        index === this._data.length - 1 || this.readonly || !this.allowReorder;
    }

    // Update edit/save/cancel/delete button aria-labels
    const editButton = rowEl.querySelector('[data-action="toggle"]');
    const saveButton = rowEl.querySelector('[data-action="save"]');
    const cancelButton = rowEl.querySelector('[data-action="cancel"]');
    const deleteButton = rowEl.querySelector('[data-action="delete"]');

    if (editButton) {
      editButton.setAttribute('aria-label', `Edit item ${itemNumber}`);
      (editButton as HTMLButtonElement).disabled = isDeleted || this.readonly;
    }
    if (saveButton) {
      saveButton.setAttribute('aria-label', `Save item ${itemNumber}`);
      (saveButton as HTMLButtonElement).disabled = this.readonly;
    }
    if (cancelButton) {
      cancelButton.setAttribute(
        'aria-label',
        `Cancel editing item ${itemNumber}`
      );
    }
    if (deleteButton) {
      (deleteButton as HTMLButtonElement).disabled = this.readonly;
      if (isDeleted) {
        deleteButton.setAttribute('aria-label', `Restore item ${itemNumber}`);
      } else {
        deleteButton.setAttribute('aria-label', `Delete item ${itemNumber}`);
      }
    }
  }

  // Public move methods
  moveUp(index: number): boolean {
    // Guard: readonly, editing, animating, or reordering disabled
    if (
      this.readonly ||
      this._currentEditIndex !== null ||
      this._isAnimating ||
      !this.allowReorder
    ) {
      return false;
    }

    // Guard: invalid index or already at top
    if (!Number.isFinite(index) || index < 1 || index >= this._data.length) {
      return false;
    }

    this._animatedReorderData(index, index - 1);
    return true;
  }

  moveDown(index: number): boolean {
    // Guard: readonly, editing, animating, or reordering disabled
    if (
      this.readonly ||
      this._currentEditIndex !== null ||
      this._isAnimating ||
      !this.allowReorder
    ) {
      return false;
    }

    // Guard: invalid index or already at bottom
    if (
      !Number.isFinite(index) ||
      index < 0 ||
      index >= this._data.length - 1
    ) {
      return false;
    }

    this._animatedReorderData(index, index + 1);
    return true;
  }

  // Animated reorder using FLIP technique
  private _animatedReorderData(fromIndex: number, toIndex: number): void {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Skip animation and perform instant reorder
      this._reorderData(fromIndex, toIndex);
      return;
    }

    const rowsHost = this._rowsHostEl;
    if (!rowsHost) {
      // Fallback to non-animated if no rows host
      this._reorderData(fromIndex, toIndex);
      return;
    }

    // Get the two rows that will swap
    const rows = rowsHost.querySelectorAll('[data-row]');
    const fromRow = rows[fromIndex] as HTMLElement | undefined;
    const toRow = rows[toIndex] as HTMLElement | undefined;

    if (!fromRow || !toRow) {
      // Fallback to non-animated
      this._reorderData(fromIndex, toIndex);
      return;
    }

    // Set animation flag
    this._isAnimating = true;

    // FIRST: Record initial positions
    const fromRect = fromRow.getBoundingClientRect();
    const toRect = toRow.getBoundingClientRect();

    // Calculate the vertical distance to move
    const deltaY = toRect.top - fromRect.top;

    // Add animating class and apply initial transforms (INVERT)
    fromRow.classList.add('ck-animating');
    toRow.classList.add('ck-animating');

    // Apply inverse transforms so they appear in their original positions
    fromRow.style.transform = `translateY(0px)`;
    toRow.style.transform = `translateY(0px)`;

    // Force reflow to ensure transforms are applied
    void fromRow.offsetHeight;

    // PLAY: Apply transitions and animate to final positions
    const transition = `transform ${CkEditableArray.ANIMATION_DURATION}ms ease-in-out`;
    fromRow.style.transition = transition;
    toRow.style.transition = transition;

    // Animate to swapped positions
    fromRow.style.transform = `translateY(${deltaY}px)`;
    toRow.style.transform = `translateY(${-deltaY}px)`;

    // After animation completes, update DOM and clean up
    this._animationTimerId = window.setTimeout(() => {
      // Clear timer ID first
      this._animationTimerId = null;

      // Guard: don't execute if disconnected
      if (!this.isConnected) {
        this._isAnimating = false;
        return;
      }

      // Remove animation styles
      fromRow.style.transition = '';
      fromRow.style.transform = '';
      toRow.style.transition = '';
      toRow.style.transform = '';
      fromRow.classList.remove('ck-animating');
      toRow.classList.remove('ck-animating');

      // Perform the actual data reorder
      const [movedItem] = this._data.splice(fromIndex, 1);
      this._data.splice(toIndex, 0, movedItem);

      // Re-render to update DOM order and indices
      this.render();

      // Clear animation flag
      this._isAnimating = false;

      // Dispatch events after animation
      this.dispatchEvent(
        new CustomEvent('reorder', {
          detail: {
            fromIndex,
            toIndex,
            data: this._deepClone(this._data),
          },
          bubbles: true,
          composed: true,
        })
      );

      this._dispatchDataChanged();

      // Announce for accessibility
      const message = `Moved item from position ${fromIndex + 1} to ${toIndex + 1}`;
      this._announceAction(message);
    }, CkEditableArray.ANIMATION_DURATION);
  }
}

if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
