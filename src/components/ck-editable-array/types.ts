/**
 * Represents internal row data with editing state markers
 */
export interface InternalRowData extends Record<string, unknown> {
  editing?: boolean;
  deleted?: boolean;
  __originalSnapshot?: Record<string, unknown>;
  __isNew?: boolean;
}

/**
 * A row can be either a primitive string or an object with properties
 */
export type EditableRow = InternalRowData | string;

/**
 * Result of validation with detailed error information
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Property-level schema definition
 */
export interface PropertySchema {
  type?: string;
  minLength?: number;
  // Future: maxLength, pattern, etc.
}

/**
 * JSON Schema-like structure for validation
 */
export interface ValidationSchema {
  type?: string;
  required?: string[];
  properties?: Record<string, PropertySchema>;
}

/**
 * Mode for rendering rows
 */
export type RenderMode = 'display' | 'edit';

/**
 * Interface for the component context required by DomRenderer
 */
export interface EditableArrayContext {
  isModalEditEnabled(): boolean;
  isRecord(row: unknown): boolean;
  resolveBindingValue(data: EditableRow, key: string): string;
  resolveBindingRawValue(data: EditableRow, key: string): unknown;
  commitRowValue(rowIndex: number, key: string, value: unknown): void;
  updateSaveButtonState(rowIndex: number): void;
  handleSaveClick(rowIndex: number): void;
  handleCancelClick(rowIndex: number): void;
  handleToggleClick(rowIndex: number): void;
  handleDeleteClick(rowIndex: number): void;
  handleRestoreClick(rowIndex: number): void;
  handleAddClick(): void;
  configureReadonlyState(node: HTMLElement, isReadonly: boolean): void;
  isReadonlyBlocked(): boolean;
  getRowData(rowIndex: number): EditableRow;

  // Properties
  data: unknown[]; // Public API returns unknown[]
  internalData: EditableRow[]; // Internal data for renderer
  editingRowIndex: number; // Index of the currently editing row
  shadowRoot: ShadowRoot | null;
  isConnected: boolean;
  modalEdit: boolean; // Added modalEdit property
  validateRowDetailed(rowIndex: number): ValidationResult;

  // DOM methods
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  querySelector<E extends Element>(selector: string): E | null;
  appendChild(node: Node): Node;
}

export const CONSTANTS = {
  PART_ROWS: 'rows',
  PART_ADD_BUTTON: 'add-button',
  PART_ROOT: 'root',
  SLOT_STYLES: 'styles',
  SLOT_DISPLAY: 'display',
  SLOT_EDIT: 'edit',
  ATTR_DATA_BIND: 'data-bind',
  ATTR_DATA_ACTION: 'data-action',
  ATTR_DATA_ROW: 'data-row',
  ATTR_DATA_MODE: 'data-mode',
  CLASS_HIDDEN: 'hidden',
  CLASS_DELETED: 'deleted',
  CLASS_DISPLAY_CONTENT: 'display-content',
  CLASS_EDIT_CONTENT: 'edit-content',
  CLASS_MODAL_OVERLAY: 'modal-overlay',
  CLASS_MODAL_SURFACE: 'modal-surface',
  PART_MODAL: 'modal',
  PART_MODAL_SURFACE: 'modal-surface',
} as const;
