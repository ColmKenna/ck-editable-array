type EditableRow = Record<string, unknown> | string;

export class CkEditableArray extends HTMLElement {
  private _data: EditableRow[] = [];
  public schema: unknown = null;
  public newItemFactory: () => EditableRow = () => '';

  constructor() {
    super();
    if (this.shadowRoot === null) {
      this.attachShadow({ mode: 'open' });
    }
    // Debug: indicate instance constructed

    console.log('ck-editable-array: constructed', this);
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
    return this._data.map(item =>
      typeof item === 'string' ? item : { ...item }
    );
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

  connectedCallback(): void {
    // Debug: indicate connected

    console.log('ck-editable-array: connected', this);
    // Render when connected
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) return;
    const container = this.shadowRoot.querySelector(
      '[part="root"]'
    ) as HTMLElement;
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    const displayTpl = this.querySelector(
      'template[slot="display"]'
    ) as HTMLTemplateElement | null;
    const editTpl = this.querySelector(
      'template[slot="edit"]'
    ) as HTMLTemplateElement | null;

    this._data.forEach((item, idx) => {
      this.appendRowFromTemplate(displayTpl, container, item, idx, 'display');
      this.appendRowFromTemplate(editTpl, container, item, idx, 'edit');
    });
  }

  private bindDataToNode(
    root: HTMLElement,
    data: EditableRow,
    rowIndex: number,
    mode: 'display' | 'edit'
  ): void {
    // Bind text content for elements with data-bind attribute
    const bound = root.querySelectorAll<HTMLElement>('[data-bind]');
    bound.forEach(node => {
      const key = node.getAttribute('data-bind') ?? '';
      const value = this.resolveBindingValue(data, key);
      // If element is input-like, set value; otherwise set textContent
      if (node instanceof HTMLInputElement) {
        const inputNode = node as HTMLInputElement;
        inputNode.value = value;
        if (mode === 'edit') {
          inputNode.addEventListener('input', () => {
            this.commitRowValue(rowIndex, key, inputNode.value);
          });
        }
      } else if (node instanceof HTMLTextAreaElement) {
        const textAreaNode = node as HTMLTextAreaElement;
        textAreaNode.value = value;
        if (mode === 'edit') {
          textAreaNode.addEventListener('input', () => {
            this.commitRowValue(rowIndex, key, textAreaNode.value);
          });
        }
      } else {
        node.textContent = value;
      }
    });
  }

  private appendRowFromTemplate(
    template: HTMLTemplateElement | null,
    container: HTMLElement,
    rowData: EditableRow,
    rowIndex: number,
    mode: 'display' | 'edit'
  ): void {
    if (!template || !template.content) {
      return;
    }

    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const firstChild = fragment.firstElementChild as HTMLElement | null;

    if (firstChild) {
      firstChild.setAttribute('data-row', String(rowIndex));
      firstChild.setAttribute('data-mode', mode);
      this.bindDataToNode(firstChild, rowData, rowIndex, mode);
      container.appendChild(firstChild);
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-row', String(rowIndex));
    wrapper.setAttribute('data-mode', mode);
    wrapper.appendChild(fragment);
    this.bindDataToNode(wrapper, rowData, rowIndex, mode);
    container.appendChild(wrapper);
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
}

// Register custom element if not already registered.
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

export default CkEditableArray;
