import {
  EditableArrayContext,
  CONSTANTS,
  EditableRow,
  InternalRowData,
} from './types';

export class DomRenderer {
  private context: EditableArrayContext;

  constructor(context: EditableArrayContext) {
    this.context = context;
  }

  public render(): void {
    if (!this.context.isConnected) return;

    const rowsContainer = this.getRowsContainer();
    const addButtonContainer = this.getAddButtonContainer();

    // Calculate errors for the currently editing row
    const errors = new Map<number, Record<string, string>>();
    if (this.context.editingRowIndex !== null) {
      const result = this.context.validateRowDetailed(
        this.context.editingRowIndex
      );
      if (!result.isValid) {
        const flatErrors: Record<string, string> = {};
        Object.entries(result.errors).forEach(([key, msgs]) => {
          if (msgs.length > 0) flatErrors[key] = msgs[0];
        });
        errors.set(this.context.editingRowIndex, flatErrors);
      }
    }

    if (rowsContainer) {
      // Pass validation errors to renderRows
      this.renderRows(rowsContainer, errors);
    }

    if (addButtonContainer) {
      this.renderAddButton(addButtonContainer);
    }

    // Handle modal visibility and rendering
    const modal = this.context.shadowRoot?.querySelector('[part="modal"]');
    if (modal) {
      if (
        this.isModalEditEnabled() &&
        this.isEditLocked() &&
        this.context.editingRowIndex !== null
      ) {
        modal.classList.remove('hidden');
        const item = this.context.internalData[this.context.editingRowIndex];
        this.renderModalEdit(item, this.context.editingRowIndex, errors);
      } else {
        modal.classList.add('hidden');
      }
    }
  }

  private _rowControllers = new Map<string, AbortController>();

  private renderRows(
    container: HTMLElement,
    errors: Map<number, Record<string, string>>
  ): void {
    const activeKeys = new Set<string>();

    this.context.internalData.forEach((item, index) => {
      const key = this.context.getRowKey(index);
      const displayKey = `${key}-display`;
      const editKey = `${key}-edit`;

      activeKeys.add(displayKey);
      if (!this.isModalEditEnabled()) {
        activeKeys.add(editKey);
      }

      // --- Display Row ---
      let displayRow = container.querySelector(
        `[data-key="${displayKey}"]`
      ) as HTMLElement;
      if (!displayRow) {
        displayRow = this.createRowElement(item, index, 'display', errors)!;
        if (displayRow) {
          displayRow.setAttribute('data-key', displayKey);
          container.appendChild(displayRow);
        }
      } else {
        this.updateRowElement(displayRow, item, index, 'display', errors);
      }

      // --- Edit Row ---
      if (!this.isModalEditEnabled()) {
        let editRow = container.querySelector(
          `[data-key="${editKey}"]`
        ) as HTMLElement;
        if (!editRow) {
          editRow = this.createRowElement(item, index, 'edit', errors)!;
          if (editRow) {
            editRow.setAttribute('data-key', editKey);
            container.appendChild(editRow);
          }
        } else {
          this.updateRowElement(editRow, item, index, 'edit', errors);
        }
      }
    });

    // Remove obsolete rows
    Array.from(container.children).forEach(child => {
      const key = child.getAttribute('data-key');
      if (key && !activeKeys.has(key)) {
        // Clean up controller if exists
        // We need to map element key back to row key?
        // Or just rely on the fact that we abort when re-creating?
        // If we remove the row, we should abort its controller to be safe/clean.
        // The key is "row-X-display". The row key is "row-X".
        // We share controller per row? Or per element?
        // Let's use per-element key for controller to be safe.
        if (this._rowControllers.has(key)) {
          this._rowControllers.get(key)!.abort();
          this._rowControllers.delete(key);
        }
        container.removeChild(child);
      }
    });

    // Reorder to match data index
    this.context.internalData.forEach((item, index) => {
      const key = this.context.getRowKey(index);
      const displayKey = `${key}-display`;
      const editKey = `${key}-edit`;

      const displayRow = container.querySelector(`[data-key="${displayKey}"]`);
      if (displayRow) container.appendChild(displayRow);

      if (!this.isModalEditEnabled()) {
        const editRow = container.querySelector(`[data-key="${editKey}"]`);
        if (editRow) container.appendChild(editRow);
      }
    });
  }

  private renderAddButton(container: HTMLElement): void {
    container.innerHTML = '';

    const isReadonly = this.context.hasAttribute('readonly');
    const hasEditingRow = this.isEditLocked();

    // Check if user provided a custom add button template
    const customAddButtonTpl = this.context.querySelector(
      'template[slot="add-button"]'
    ) as HTMLTemplateElement | null;

    if (customAddButtonTpl && customAddButtonTpl.content) {
      // Use custom template
      const fragment = customAddButtonTpl.content.cloneNode(
        true
      ) as DocumentFragment;
      container.appendChild(fragment);

      // Attach click handlers and disable buttons if readonly or editing
      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        if (isReadonly || hasEditingRow) {
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
        }
        // Attach click handler to buttons with data-action="add"
        if (btn.getAttribute(CONSTANTS.ATTR_DATA_ACTION) === 'add') {
          btn.addEventListener('click', () => this.context.handleAddClick());
        }
      });
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Add Item';
      btn.setAttribute('type', 'button');
      btn.setAttribute(CONSTANTS.ATTR_DATA_ACTION, 'add');

      if (isReadonly || hasEditingRow) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      } else {
        btn.addEventListener('click', () => this.context.handleAddClick());
      }

      container.appendChild(btn);
    }
  }

  private createRowElement(
    item: EditableRow,
    index: number,
    mode: 'display' | 'edit',
    errors?: Map<number, Record<string, string>>
  ): HTMLElement | null {
    const template =
      mode === 'edit' ? this.getEditTemplate() : this.getDisplayTemplate();

    if (!template) return null;

    const clone = template.content.cloneNode(true) as DocumentFragment;
    const wrapper = document.createElement('div');
    wrapper.appendChild(clone);

    if (mode === 'display') {
      wrapper.classList.add(CONSTANTS.CLASS_DISPLAY_CONTENT);
    } else {
      wrapper.classList.add(CONSTANTS.CLASS_EDIT_CONTENT);
    }

    // Handle datalists
    this.processDatalists(wrapper, index);

    // Inject custom action buttons if available
    this.injectActionButtons(wrapper, mode);

    this.updateRowElement(wrapper, item, index, mode, errors);

    return wrapper;
  }

  private updateRowElement(
    wrapper: HTMLElement,
    item: EditableRow,
    index: number,
    mode: 'display' | 'edit',
    errors?: Map<number, Record<string, string>>
  ): void {
    const isRecord = this.isRecord(item);
    const isDeleted = isRecord && item.deleted === true;

    wrapper.setAttribute(CONSTANTS.ATTR_DATA_ROW, String(index));
    wrapper.setAttribute(CONSTANTS.ATTR_DATA_MODE, mode);

    // Update visibility
    if (mode === 'display') {
      if (
        !this.isModalEditEnabled() &&
        this.context.editingRowIndex === index
      ) {
        wrapper.classList.add(CONSTANTS.CLASS_HIDDEN);
      } else {
        wrapper.classList.remove(CONSTANTS.CLASS_HIDDEN);
      }
    } else {
      if (this.context.editingRowIndex !== index) {
        wrapper.classList.add(CONSTANTS.CLASS_HIDDEN);
      } else {
        wrapper.classList.remove(CONSTANTS.CLASS_HIDDEN);
      }
    }

    if (isDeleted) {
      wrapper.classList.add(CONSTANTS.CLASS_DELETED);
      wrapper.setAttribute('data-deleted', 'true');
    } else {
      wrapper.classList.remove(CONSTANTS.CLASS_DELETED);
      wrapper.removeAttribute('data-deleted');
    }

    // Apply validation error state to row
    if (errors && errors.has(index)) {
      const rowErrors = errors.get(index);
      if (rowErrors && Object.keys(rowErrors).length > 0) {
        wrapper.setAttribute('data-row-invalid', 'true');
      } else {
        wrapper.removeAttribute('data-row-invalid');
      }
    } else {
      wrapper.removeAttribute('data-row-invalid');
    }

    const isLocked =
      this.isEditLocked() && this.context.editingRowIndex !== index;
    if (isLocked && mode === 'display') {
      wrapper.setAttribute('data-locked', 'true');
      wrapper.setAttribute('aria-disabled', 'true');
      wrapper.setAttribute('inert', '');
      const buttons = wrapper.querySelectorAll('button');
      buttons.forEach(btn => (btn.disabled = true));
    } else {
      wrapper.removeAttribute('data-locked');
      wrapper.removeAttribute('aria-disabled');
      wrapper.removeAttribute('inert');
      const buttons = wrapper.querySelectorAll('button');
      buttons.forEach(btn => (btn.disabled = false));
    }

    // Controller management
    const key = this.context.getRowKey(index);
    const elementKey = `${key}-${mode}`;

    if (this._rowControllers.has(elementKey)) {
      this._rowControllers.get(elementKey)!.abort();
    }
    const controller = new AbortController();
    this._rowControllers.set(elementKey, controller);

    this.bindDataToNode(
      wrapper,
      item,
      index,
      mode === 'edit',
      controller.signal
    );
    this.setupEventListeners(
      wrapper,
      index,
      mode === 'edit',
      isDeleted,
      controller.signal
    );
  }

  private processDatalists(wrapper: HTMLElement, rowIndex: number): void {
    try {
      const inputsWithList = Array.from(
        wrapper.querySelectorAll<HTMLInputElement>('input[list]')
      );
      inputsWithList.forEach(input => {
        const listId = input.getAttribute('list');
        if (!listId) return;
        const dl = wrapper.querySelector<HTMLDataListElement>(
          `datalist[id="${listId}"]`
        );
        if (!dl) return;

        // Use simple ID for edit mode to match test expectation if possible
        // Test expects: category-list-${rowIndex}
        const uniqueId = `${listId}-${rowIndex}`;
        dl.id = uniqueId;
        input.setAttribute('list', uniqueId);

        // Do NOT move to light DOM.
      });
    } catch (e) {
      console.warn('Error processing datalists:', e);
    }
  }

  private injectActionButtons(wrapper: HTMLElement, mode: string): void {
    // Define which buttons belong to which mode
    const displayButtons = ['button-edit', 'button-delete', 'button-restore'];
    const editButtons = ['button-save', 'button-cancel'];

    // Determine which buttons to inject based on mode
    const buttonsToInject = mode === 'display' ? displayButtons : editButtons;

    // Find the first child element to append buttons to
    const targetContainer = wrapper.querySelector('div, span') || wrapper;

    // Inject each button type if it exists
    buttonsToInject.forEach(slotName => {
      const customButton = this.context.querySelector(
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
          buttonClone.setAttribute(CONSTANTS.ATTR_DATA_ACTION, action);
          buttonClone.removeAttribute('slot'); // Remove slot attribute from clone
          targetContainer.appendChild(buttonClone);
        }
      }
    });
  }

  private renderModalEdit(
    item: EditableRow,
    index: number,
    errors: Map<number, Record<string, string>>
  ): void {
    const overlay = this.getModalOverlay();
    const surface = this.getModalSurface();

    if (!overlay || !surface) return;

    // Clear previous content
    surface.innerHTML = '';

    const editRow = this.createRowElement(item, index, 'edit', errors);
    if (editRow) {
      surface.appendChild(editRow);
    }

    this.openModal();
  }

  private bindDataToNode(
    node: HTMLElement,
    data: EditableRow,
    rowIndex: number,
    isEditing: boolean,
    signal?: AbortSignal
  ): void {
    const isComponentReadonly = this.context.hasAttribute('readonly');
    const effectiveIsEditing = isEditing && !isComponentReadonly;

    const boundElements = node.querySelectorAll(
      `[${CONSTANTS.ATTR_DATA_BIND}]`
    );
    boundElements.forEach(elem => {
      const key = elem.getAttribute(CONSTANTS.ATTR_DATA_BIND);
      if (key === null) return;

      const value = this.context.resolveBindingValue(data, key);
      const rawValue = this.context.resolveBindingRawValue(data, key);

      // Set name attribute if applicable
      if (
        elem instanceof HTMLInputElement ||
        elem instanceof HTMLTextAreaElement ||
        elem instanceof HTMLSelectElement
      ) {
        const nameBase = this.context.getAttribute('name');
        if (nameBase) {
          elem.name = `${nameBase}[${rowIndex}].${key}`;
        }
      }

      if (elem instanceof HTMLInputElement) {
        if (elem.type === 'radio') {
          const shouldCheck = elem.value === value;
          elem.checked = shouldCheck;
          elem.setAttribute('aria-checked', shouldCheck ? 'true' : 'false');
          if (effectiveIsEditing) {
            elem.disabled = false;
            elem.addEventListener(
              'change',
              e => {
                const target = e.target as HTMLInputElement;
                if (target.checked) {
                  this.context.commitRowValue(rowIndex, key, target.value);
                }
              },
              { signal }
            );
          } else {
            elem.disabled = true;
          }
        } else if (elem.type === 'checkbox') {
          const cbVal = elem.value ?? 'on';
          let isChecked = false;
          if (Array.isArray(rawValue)) {
            isChecked = (rawValue as string[]).includes(cbVal);
          } else if (typeof rawValue === 'boolean') {
            isChecked = Boolean(rawValue);
          } else {
            isChecked = String(rawValue) === cbVal;
          }
          elem.checked = isChecked;
          elem.setAttribute('aria-checked', isChecked ? 'true' : 'false');

          if (effectiveIsEditing) {
            elem.disabled = false;
            elem.addEventListener(
              'change',
              e => {
                const target = e.target as HTMLInputElement;
                // Fetch fresh raw value to avoid stale closure state
                const freshData = this.context.getRowData(rowIndex);
                const freshRawValue = this.context.resolveBindingRawValue(
                  freshData,
                  key
                );

                let nextVal: string | string[] | boolean;
                if (typeof freshRawValue === 'boolean') {
                  nextVal = target.checked;
                } else if (Array.isArray(freshRawValue)) {
                  const currentArr = (freshRawValue as string[]) || [];
                  if (target.checked) {
                    nextVal = [...currentArr, cbVal];
                  } else {
                    nextVal = currentArr.filter(v => v !== cbVal);
                  }
                } else {
                  // Single value checkbox (true/false or value/empty)
                  nextVal = target.checked ? cbVal : '';
                }
                this.context.commitRowValue(rowIndex, key, nextVal);
              },
              { signal }
            );
          } else {
            elem.disabled = true;
          }
        } else {
          // Text, number, etc.
          elem.value = value;
          if (effectiveIsEditing) {
            elem.readOnly = false;
            elem.addEventListener(
              'input',
              e => {
                const target = e.target as HTMLInputElement;
                this.context.commitRowValue(rowIndex, key, target.value);
              },
              { signal }
            );
          } else {
            elem.readOnly = true;
          }
        }
      } else if (elem instanceof HTMLTextAreaElement) {
        elem.value = value;
        if (effectiveIsEditing) {
          elem.readOnly = false;
          elem.addEventListener(
            'input',
            e => {
              const target = e.target as HTMLTextAreaElement;
              this.context.commitRowValue(rowIndex, key, target.value);
            },
            { signal }
          );
        } else {
          elem.readOnly = true;
        }
      } else if (elem instanceof HTMLSelectElement) {
        if (elem.multiple) {
          const valuesArr =
            value === '' ? [] : (value as string).split(',').map(s => s.trim());
          Array.from(elem.options).forEach(opt => {
            opt.selected = valuesArr.includes(opt.value);
          });
          if (effectiveIsEditing) {
            elem.disabled = false;
            elem.addEventListener(
              'change',
              () => {
                const selected = Array.from(elem.selectedOptions).map(
                  opt => opt.value
                );
                this.context.commitRowValue(rowIndex, key, selected);
              },
              { signal }
            );
          } else {
            elem.disabled = true;
          }
        } else {
          elem.value = value;
          if (effectiveIsEditing) {
            elem.disabled = false;
            elem.addEventListener(
              'change',
              e => {
                const target = e.target as HTMLSelectElement;
                this.context.commitRowValue(rowIndex, key, target.value);
              },
              { signal }
            );
          } else {
            elem.disabled = true;
          }
        }
      } else {
        elem.textContent = value;
      }

      // Validation error display
      if (effectiveIsEditing) {
        const errorElement = node.querySelector(`[data-field-error="${key}"]`);
        if (errorElement) {
          // Logic to show error is handled in validateRowDetailed in main class
          // But we need to ensure the element exists and has an ID for aria-describedby
          let errorId = errorElement.getAttribute('id');
          if (!errorId) {
            errorId = `error-${rowIndex}-${key}`;
            errorElement.setAttribute('id', errorId);
          }
          if (
            elem instanceof HTMLInputElement ||
            elem instanceof HTMLTextAreaElement ||
            elem instanceof HTMLSelectElement
          ) {
            elem.setAttribute('aria-describedby', errorId);
          }
        }
      }
    });
  }

  private setupEventListeners(
    wrapper: HTMLElement,
    index: number,
    isEditing: boolean,
    isDeleted: boolean,
    signal?: AbortSignal
  ): void {
    const actions = wrapper.querySelectorAll(`[${CONSTANTS.ATTR_DATA_ACTION}]`);
    actions.forEach(actionElem => {
      const action = actionElem.getAttribute(CONSTANTS.ATTR_DATA_ACTION);
      actionElem.addEventListener(
        'click',
        e => {
          e.stopPropagation();
          switch (action) {
            case 'edit':
            case 'toggle':
              this.context.handleToggleClick(index);
              break;
            case 'delete':
              this.context.handleDeleteClick(index);
              break;
            case 'save':
              this.context.handleSaveClick(index);
              break;
            case 'cancel':
              this.context.handleCancelClick(index);
              break;
            case 'restore':
              this.context.handleRestoreClick(index);
              break;
          }
        },
        { signal }
      );

      // Visibility logic based on state
      if (action === 'edit' || action === 'toggle') {
        if (isEditing || isDeleted || this.context.hasAttribute('readonly')) {
          actionElem.classList.add(CONSTANTS.CLASS_HIDDEN);
        } else {
          actionElem.classList.remove(CONSTANTS.CLASS_HIDDEN);
        }
      } else if (action === 'delete') {
        if (isEditing || isDeleted || this.context.hasAttribute('readonly')) {
          actionElem.classList.add(CONSTANTS.CLASS_HIDDEN);
        } else {
          actionElem.classList.remove(CONSTANTS.CLASS_HIDDEN);
        }
      } else if (action === 'save' || action === 'cancel') {
        if (!isEditing) {
          actionElem.classList.add(CONSTANTS.CLASS_HIDDEN);
        } else {
          actionElem.classList.remove(CONSTANTS.CLASS_HIDDEN);
        }
      } else if (action === 'restore') {
        if (!isDeleted || this.context.hasAttribute('readonly')) {
          actionElem.classList.add(CONSTANTS.CLASS_HIDDEN);
        } else {
          actionElem.classList.remove(CONSTANTS.CLASS_HIDDEN);
        }
      }
    });
  }

  // Helpers
  private getRowsContainer(): HTMLElement | null {
    if (!this.context.shadowRoot) return null;
    return this.context.shadowRoot.querySelector(
      `[part="${CONSTANTS.PART_ROWS}"]`
    ) as HTMLElement | null;
  }

  private getAddButtonContainer(): HTMLElement | null {
    if (!this.context.shadowRoot) return null;
    return this.context.shadowRoot.querySelector(
      `[part="${CONSTANTS.PART_ADD_BUTTON}"]`
    ) as HTMLElement | null;
  }

  private getModalOverlay(): HTMLElement | null {
    if (!this.context.shadowRoot) return null;
    return this.context.shadowRoot.querySelector(
      `[part="${CONSTANTS.PART_MODAL}"]`
    ) as HTMLElement | null;
  }

  private getModalSurface(): HTMLElement | null {
    if (!this.context.shadowRoot) return null;
    return this.context.shadowRoot.querySelector(
      `[part="${CONSTANTS.PART_MODAL_SURFACE}"]`
    ) as HTMLElement | null;
  }

  private getDisplayTemplate(): HTMLTemplateElement | null {
    return this.context.querySelector(
      `template[slot="${CONSTANTS.SLOT_DISPLAY}"]`
    ) as HTMLTemplateElement | null;
  }

  private getEditTemplate(): HTMLTemplateElement | null {
    return this.context.querySelector(
      `template[slot="${CONSTANTS.SLOT_EDIT}"]`
    ) as HTMLTemplateElement | null;
  }

  private isRecord(value: EditableRow): value is InternalRowData {
    return typeof value === 'object' && value !== null;
  }

  private isEditLocked(): boolean {
    return this.context.internalData.some(
      item => this.isRecord(item) && item.editing === true
    );
  }

  private isModalEditEnabled(): boolean {
    return this.context.hasAttribute('modal-edit');
  }

  private openModal(): void {
    const overlay = this.getModalOverlay();
    if (overlay) {
      overlay.classList.remove(CONSTANTS.CLASS_HIDDEN);
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  public closeModal(): void {
    const overlay = this.getModalOverlay();
    const surface = this.getModalSurface();
    if (surface) {
      surface.innerHTML = '';
    }
    if (overlay) {
      overlay.classList.add(CONSTANTS.CLASS_HIDDEN);
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  public updateBoundNodes(rowIndex: number, key?: string): void {
    if (!this.context.shadowRoot) return;

    const rowElems = Array.from(
      this.context.shadowRoot.querySelectorAll<HTMLElement>(
        `[${CONSTANTS.ATTR_DATA_ROW}="${rowIndex}"]`
      )
    );
    if (rowElems.length === 0) return;

    rowElems.forEach(rowElem => {
      const bound = key
        ? Array.from(
            rowElem.querySelectorAll<HTMLElement>(
              `[${CONSTANTS.ATTR_DATA_BIND}="${key}"]`
            )
          )
        : Array.from(
            rowElem.querySelectorAll<HTMLElement>(
              `[${CONSTANTS.ATTR_DATA_BIND}]`
            )
          );

      bound.forEach(node => {
        const bindKey = node.getAttribute(CONSTANTS.ATTR_DATA_BIND) ?? '';
        const value = this.context.resolveBindingValue(
          this.context.internalData[rowIndex],
          bindKey
        );

        if (node instanceof HTMLInputElement) {
          if (node.type === 'radio') {
            const shouldCheck = node.value === value;
            node.checked = shouldCheck;
            node.setAttribute('aria-checked', shouldCheck ? 'true' : 'false');
          } else if (node.type === 'checkbox') {
            const rawVal = this.context.resolveBindingRawValue(
              this.context.internalData[rowIndex],
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
            if (node.value !== value) {
              node.value = value;
            }
          }
        } else if (node instanceof HTMLTextAreaElement) {
          if (node.value !== value) {
            node.value = value;
          }
        } else if (node instanceof HTMLSelectElement) {
          if (node.multiple) {
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
}
