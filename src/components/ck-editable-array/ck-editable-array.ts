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

    this._data.forEach((item, idx) => {
      this.appendRowFromTemplate(
        displayTpl,
        rowsContainer,
        item,
        idx,
        'display'
      );
      this.appendRowFromTemplate(editTpl, rowsContainer, item, idx, 'edit');
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
            });
          }
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
