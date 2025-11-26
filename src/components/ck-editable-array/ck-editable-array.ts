import {
  InternalRowData,
  EditableRow,
  ValidationResult,
  ValidationSchema,
  I18nMessages,
  CONSTANTS,
} from './types';
import { ValidationManager } from './validation-manager';
import { DomRenderer } from './dom-renderer';

// ============================================================================
// CLASS DEFINITION
// ============================================================================

export class CkEditableArray extends HTMLElement {
  // ============================================================================
  // CONSTANTS
  // ============================================================================

  public static readonly PART_ROWS = CONSTANTS.PART_ROWS;
  public static readonly PART_ADD_BUTTON = CONSTANTS.PART_ADD_BUTTON;
  public static readonly PART_ROOT = CONSTANTS.PART_ROOT;
  public static readonly SLOT_STYLES = CONSTANTS.SLOT_STYLES;
  public static readonly SLOT_DISPLAY = CONSTANTS.SLOT_DISPLAY;
  public static readonly SLOT_EDIT = CONSTANTS.SLOT_EDIT;
  public static readonly ATTR_DATA_BIND = CONSTANTS.ATTR_DATA_BIND;
  public static readonly ATTR_DATA_ACTION = CONSTANTS.ATTR_DATA_ACTION;
  public static readonly ATTR_DATA_ROW = CONSTANTS.ATTR_DATA_ROW;
  public static readonly ATTR_DATA_MODE = CONSTANTS.ATTR_DATA_MODE;
  public static readonly CLASS_HIDDEN = CONSTANTS.CLASS_HIDDEN;
  public static readonly CLASS_DELETED = CONSTANTS.CLASS_DELETED;
  public static readonly CLASS_DISPLAY_CONTENT =
    CONSTANTS.CLASS_DISPLAY_CONTENT;
  public static readonly CLASS_EDIT_CONTENT = CONSTANTS.CLASS_EDIT_CONTENT;
  public static readonly CLASS_MODAL_OVERLAY = CONSTANTS.CLASS_MODAL_OVERLAY;
  public static readonly CLASS_MODAL_SURFACE = CONSTANTS.CLASS_MODAL_SURFACE;
  public static readonly PART_MODAL = CONSTANTS.PART_MODAL;
  public static readonly PART_MODAL_SURFACE = CONSTANTS.PART_MODAL_SURFACE;

  // ============================================================================
  // PRIVATE PROPERTIES
  // ============================================================================

  private _data: EditableRow[] = [];
  private _rowKeys: string[] = [];
  private _nextId = 0;
  private _schema: ValidationSchema | null = null;
  private _i18n: I18nMessages | undefined;
  private _newItemFactory: () => EditableRow = () => ({});
  private _styleObserver: MutationObserver | null = null;
  private _domRenderer: DomRenderer;

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

  static get observedAttributes(): string[] {
    return ['name', 'readonly', 'modal-edit'];
  }

  constructor() {
    super();
    this._domRenderer = new DomRenderer(this);
    if (this.shadowRoot === null) {
      this.attachShadow({ mode: 'open' });
    }
    // Ensure a container exists for rendered rows
    if (this.shadowRoot && this.shadowRoot.children.length === 0) {
      // Add base styles for hidden class
      const style = document.createElement('style');
      style.textContent = `
.${CkEditableArray.CLASS_HIDDEN} { display: none !important; }
.${CkEditableArray.CLASS_MODAL_OVERLAY} {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 24px;
  box-sizing: border-box;
  z-index: 1000;
}
.${CkEditableArray.CLASS_MODAL_SURFACE} {
  background: #fff;
  color: inherit;
  border-radius: 8px;
  padding: 16px;
  max-width: 960px;
  width: min(720px, 100%);
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  box-sizing: border-box;
}
`;
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

      // Create modal overlay for modal edit mode
      const modalOverlay = document.createElement('div');
      modalOverlay.setAttribute('part', CkEditableArray.PART_MODAL);
      modalOverlay.className = `${CkEditableArray.CLASS_MODAL_OVERLAY} ${CkEditableArray.CLASS_HIDDEN}`;
      modalOverlay.setAttribute('aria-hidden', 'true');

      const modalSurface = document.createElement('div');
      modalSurface.setAttribute('part', CkEditableArray.PART_MODAL_SURFACE);
      modalSurface.setAttribute('role', 'dialog');
      modalSurface.setAttribute('aria-modal', 'true');
      modalSurface.className = CkEditableArray.CLASS_MODAL_SURFACE;
      modalOverlay.appendChild(modalSurface);

      this.shadowRoot.appendChild(modalOverlay);
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
    this._rowKeys = this._data.map(() => this.generateKey());
    if (this.isConnected) {
      this.render();
      this.dispatchDataChanged();
    }
  }

  get schema(): ValidationSchema | null {
    return this._schema;
  }

  set schema(v: ValidationSchema | null | undefined) {
    this._schema = v === undefined ? null : v;
  }

  get i18n(): I18nMessages | undefined {
    return this._i18n;
  }

  set i18n(v: I18nMessages | undefined) {
    this._i18n = v;
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

  get modalEdit(): boolean {
    return this.hasAttribute('modal-edit');
  }

  set modalEdit(v: boolean) {
    if (v) {
      this.setAttribute('modal-edit', '');
    } else {
      this.removeAttribute('modal-edit');
    }
  }

  /** @internal */
  public get editingRowIndex(): number {
    return this._data.findIndex(
      item => this.isRecord(item) && item.editing === true
    );
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

    if (name === 'name' || name === 'readonly' || name === 'modal-edit') {
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

  /**
   * Render the component
   */
  private render(): void {
    if (!this._domRenderer) return;
    this._domRenderer.render();
  }

  // ============================================================================
  // DATA BINDING
  // ============================================================================

  /**
   * Configure readonly state for input elements
   * @internal
   */
  public configureReadonlyState(
    input: HTMLInputElement | HTMLTextAreaElement | HTMLElement,
    isReadonly: boolean
  ): void {
    if ('readOnly' in input) {
      (input as HTMLInputElement).readOnly = isReadonly;
    }
  }

  /**
   * Attach input event listeners for data binding
   */

  /**
   * Create a row element from a template and append it to the container
   * @param template - The template element to clone
   * @param container - The container to append the row to
   * @param rowData - The data for this row
   * @param rowIndex - The index of the row in the data array
   * @param mode - The rendering mode ('display' or 'edit')
   * @param isLocked - Whether the row is locked due to another row being edited
   */

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

  /** @internal */
  public resolveBindingValue(data: EditableRow, key: string): string {
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
  /** @internal */
  public resolveBindingRawValue(data: EditableRow, key: string): unknown {
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
  /** @internal */
  public commitRowValue(
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
      } else {
        // If in editing mode, re-validate and update UI state
        this.updateSaveButtonState(rowIndex);
      }
    }
  }

  /**
   * Update existing bound nodes in the shadow DOM for a specific row and key.
   * If a specific key is provided, only nodes with that data-bind are updated;
   * otherwise all bound nodes in the row are refreshed.
   */
  private updateBoundNodes(rowIndex: number, key?: string): void {
    if (!this._domRenderer) return;
    this._domRenderer.updateBoundNodes(rowIndex, key);
  }

  private dispatchDataChanged(): void {
    const event = new CustomEvent('datachanged', {
      bubbles: true,
      composed: true,
      detail: { data: this.data },
    });
    this.dispatchEvent(event);
  }

  /** @internal */
  public isRecord(value: EditableRow): value is InternalRowData {
    return typeof value === 'object' && value !== null;
  }

  /**
   * Check if the component is in readonly mode
   */
  /** @internal */
  public isReadonlyBlocked(): boolean {
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
   * Whether modal-based editing is enabled
   */
  /** @internal */
  public isModalEditEnabled(): boolean {
    return this.hasAttribute('modal-edit');
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

  /** @internal */
  public handleAddClick(): void {
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
    this._rowKeys.push(this.generateKey());

    // Re-render and dispatch datachanged event
    if (this.isConnected) {
      this.render();
      // Validate the new row (last index)
      this.updateSaveButtonState(this._data.length - 1);
      this.dispatchDataChanged();
    }
  }

  /** @internal */
  public handleSaveClick(rowIndex: number): void {
    // Don't save if readonly or invalid index
    if (this.isReadonlyBlocked() || !this.isValidRowIndex(rowIndex)) {
      return;
    }

    // Don't save if row is invalid
    if (!this.validateRow(rowIndex)) {
      // Ensure validation UI is updated for this row (including modal edit)
      this.updateSaveButtonState(rowIndex);
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
      // Focus management: Restore focus to toggle button
      window.requestAnimationFrame(() => {
        const displayWrapper = this.shadowRoot?.querySelector(
          `.display-content[data-row="${rowIndex}"]`
        );
        const toggleBtn = displayWrapper?.querySelector(
          '[data-action="toggle"]'
        ) as HTMLElement;
        toggleBtn?.focus();
      });
    }
  }

  /** @internal */
  public handleToggleClick(rowIndex: number): void {
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

    // Check for exclusive locking - if another row is editing, we can't enter edit mode
    if (!isCurrentlyEditing && this.isEditLocked()) {
      return;
    }

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
      // If entering edit mode, validate
      if (toMode === 'edit') {
        this.updateSaveButtonState(rowIndex);
        // Focus management: Auto-focus first input
        window.requestAnimationFrame(() => {
          const editWrapper = this.shadowRoot?.querySelector(
            `.edit-content[data-row="${rowIndex}"]`
          );
          const firstInput = editWrapper?.querySelector(
            'input, textarea, select'
          ) as HTMLElement;
          firstInput?.focus();
        });
      }
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

  /** @internal */
  public handleCancelClick(rowIndex: number): void {
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
      // Focus management: Restore focus to toggle button
      if (!isNewRow) {
        window.requestAnimationFrame(() => {
          const displayWrapper = this.shadowRoot?.querySelector(
            `.display-content[data-row="${rowIndex}"]`
          );
          const toggleBtn = displayWrapper?.querySelector(
            '[data-action="toggle"]'
          ) as HTMLElement;
          toggleBtn?.focus();
        });
      }
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
   * Validate a row against the schema (if provided)
   */
  private validateRow(rowIndex: number): boolean {
    const result = this.validateRowDetailed(rowIndex);
    return result.isValid;
  }

  /**
   * Validate a row and return detailed error information
   */
  public validateRowDetailed(rowIndex: number): ValidationResult {
    if (!this.isValidRowIndex(rowIndex)) {
      return { isValid: false, errors: {} };
    }

    const row = this._data[rowIndex];
    if (!this.isRecord(row)) {
      return { isValid: true, errors: {} }; // Primitive values are always valid
    }

    return ValidationManager.validateRow(row, this._schema, this._i18n);
  }

  /**
   * Update the disabled state of Save buttons and validation UI for a specific row
   * Validates the row and updates button states, field indicators, and error messages
   * @param rowIndex - The index of the row to update
   */
  /** @internal */
  public updateSaveButtonState(rowIndex: number): void {
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

  /** @internal */
  public handleDeleteClick(rowIndex: number): void {
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

  /** @internal */
  public handleRestoreClick(rowIndex: number): void {
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

  /** @internal */
  public get internalData(): EditableRow[] {
    return this._data;
  }

  /** @internal */
  public getRowData(rowIndex: number): EditableRow {
    return this._data[rowIndex];
  }

  /** @internal */
  public getRowKey(rowIndex: number): string {
    return this._rowKeys[rowIndex] || `fallback-${rowIndex}`;
  }

  private generateKey(): string {
    return `row-${this._nextId++}`;
  }
}

// Register custom element if not already registered.
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

export default CkEditableArray;
