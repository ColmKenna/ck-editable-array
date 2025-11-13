export class CkEditableArray extends HTMLElement {
  private _data: Record<string, unknown>[] = [];
  // Internal test/debug flag to record that the initial datachanged event was emitted.
  private __initialDataEmitted = false;

  constructor() {
    super();
    if (this.shadowRoot === null) {
      this.attachShadow({ mode: 'open' });
    }
    // Debug: indicate instance constructed
    // eslint-disable-next-line no-console
    console.log('ck-editable-array: constructed', this);
    // Ensure a container exists for rendered rows
    if (this.shadowRoot && this.shadowRoot.children.length === 0) {
      const container = document.createElement('div');
      container.setAttribute('part', 'root');
      this.shadowRoot.appendChild(container);
    }
  }

  get data(): unknown[] {
    return this._data;
  }

  set data(v: unknown[]) {
    this._data = Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
    if (this.isConnected) {
      this.render();
    }
  }

  connectedCallback(): void {
    // Debug: indicate connected
    // eslint-disable-next-line no-console
    console.log('ck-editable-array: connected', this);
    // Render when connected
    this.render();

    // Emit initial datachanged event to notify consumers of current data
    // Dispatch on next microtask to avoid race with test listener registration.
    Promise.resolve().then(() => {
      // Helpful debug when running tests
      // eslint-disable-next-line no-console
      console.log('ck-editable-array: dispatching datachanged', this._data);
      // Mark that we've emitted the initial event (test hook)
      // Set typed internal flag (no 'any' cast)
      this.__initialDataEmitted = true;

      const ev = new CustomEvent('datachanged', {
        bubbles: true,
        composed: true,
        detail: { data: this._data },
      });
      // Dispatch on the element
      this.dispatchEvent(ev);
      // Also dispatch on document to satisfy test environments that may not propagate composed events across boundaries
      try {
        document.dispatchEvent(
          new CustomEvent('datachanged', { detail: { data: this._data } })
        );
      } catch {
        // ignore
      }
    });
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
      // Clone display template
      if (displayTpl && displayTpl.content) {
        const frag = displayTpl.content.cloneNode(true) as DocumentFragment;
        // Determine element root in fragment
        const el =
          (frag.firstElementChild as HTMLElement) ??
          document.createElement('div');
        // If frag's firstElementChild isn't the true root (e.g., multiple nodes), wrap
        if (!frag.firstElementChild) {
          // append fragment into wrapper
          const wrapper = document.createElement('div');
          wrapper.appendChild(frag);
          wrapper.setAttribute('data-row', String(idx));
          wrapper.setAttribute('data-mode', 'display');
          this.bindDataToNode(wrapper, item);
          container.appendChild(wrapper);
        } else {
          el.setAttribute('data-row', String(idx));
          el.setAttribute('data-mode', 'display');
          this.bindDataToNode(el, item);
          container.appendChild(el);
        }
      }

      // Clone edit template
      if (editTpl && editTpl.content) {
        const frag = editTpl.content.cloneNode(true) as DocumentFragment;
        const el =
          (frag.firstElementChild as HTMLElement) ??
          document.createElement('div');
        if (!frag.firstElementChild) {
          const wrapper = document.createElement('div');
          wrapper.appendChild(frag);
          wrapper.setAttribute('data-row', String(idx));
          wrapper.setAttribute('data-mode', 'edit');
          this.bindDataToNode(wrapper, item);
          container.appendChild(wrapper);
        } else {
          el.setAttribute('data-row', String(idx));
          el.setAttribute('data-mode', 'edit');
          this.bindDataToNode(el, item);
          container.appendChild(el);
        }
      }
    });
  }

  private bindDataToNode(
    root: HTMLElement,
    data: Record<string, unknown>
  ): void {
    // Bind text content for elements with data-bind attribute
    const bound = root.querySelectorAll<HTMLElement>('[data-bind]');
    bound.forEach(node => {
      const key = node.getAttribute('data-bind') ?? '';
      // If element is input-like, set value; otherwise set textContent
      if (
        node instanceof HTMLInputElement ||
        node instanceof HTMLTextAreaElement
      ) {
        (node as HTMLInputElement).value = (data[key] as string) ?? '';
      } else {
        node.textContent = String(data[key] ?? '');
      }
    });
  }
}

// Register custom element if not already registered.
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

export default CkEditableArray;
