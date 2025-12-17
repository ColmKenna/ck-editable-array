import {
  ckEditableArraySheet,
  ckEditableArrayCSS,
} from './ck-editable-array.styles';

export class CkEditableArray extends HTMLElement {
  private shadow: ShadowRoot;
  private _data: unknown[] = [];
  private _rootEl: HTMLDivElement;
  private _displayObserver: MutationObserver | null = null;
  private _containerEl: HTMLDivElement | null = null;
  private _messageEl: HTMLHeadingElement | null = null;
  private _rowsHostEl: HTMLDivElement | null = null;
  private _statusRegionEl: HTMLDivElement | null = null;
  private _displayTemplate: HTMLTemplateElement | null = null;
  private _templateCached = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this._rootEl = document.createElement('div');
    this.shadow.appendChild(this._rootEl);

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
    this._ensureDisplayObserver();
    this.render();
  }

  disconnectedCallback() {
    if (this._displayObserver) {
      this._displayObserver.disconnect();
      this._displayObserver = null;
    }
  }

  static get observedAttributes() {
    return ['name', 'color'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      if (name === 'color') {
        this._updateColorOnly();
      } else if (name === 'name') {
        this._updateNameOnly();
      } else {
        this.render();
      }
    }
  }

  get name() {
    return this.getAttribute('name') || 'World';
  }

  set name(value: string) {
    this.setAttribute('name', value);
  }

  get color() {
    return this.getAttribute('color') || '#333';
  }

  set color(value: string) {
    this.setAttribute('color', value);
  }

  get data(): unknown[] {
    return this._deepClone(this._data);
  }

  set data(value: unknown) {
    this._data = Array.isArray(value) ? this._deepClone(value) : [];
    if (this.isConnected) {
      this.render();
      this._announceDataChange();
    }

    this.dispatchEvent(
      new CustomEvent('datachanged', {
        detail: { data: this._deepClone(this._data) },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _deepClone(obj: unknown): unknown[] {
    // structuredClone is ES2022+, target is ES2020; graceful fallback to JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).structuredClone === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (globalThis as any).structuredClone(obj) as unknown[];
      } catch {
        return this._jsonClone(obj);
      }
    }
    return this._jsonClone(obj);
  }

  private _jsonClone(obj: unknown): unknown[] {
    try {
      return JSON.parse(JSON.stringify(obj)) as unknown[];
    } catch {
      return [];
    }
  }

  private render() {
    // Invalidate template cache on each full render
    this._templateCached = false;

    if (!ckEditableArraySheet) {
      if (
        !this.shadow.querySelector('style[data-ck-editable-array-fallback]')
      ) {
        const style = document.createElement('style');
        style.setAttribute('data-ck-editable-array-fallback', '');
        style.textContent = ckEditableArrayCSS;
        this.shadow.insertBefore(style, this._rootEl);
      }
    }

    this.style.setProperty('--cea-color', this.color);

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

    // Update only text content
    if (this._messageEl) {
      this._messageEl.textContent = `Hello, ${this.name}!`;
      this._messageEl.style.color = this.color;
    }

    // Render rows
    if (this._rowsHostEl) {
      this._renderRows(this._rowsHostEl);
    }
  }

  private _updateColorOnly() {
    // Fast path: update color without full re-render
    this.style.setProperty('--cea-color', this.color);
    if (this._messageEl) {
      this._messageEl.style.color = this.color;
    }
  }

  private _updateNameOnly() {
    // Fast path: update name text without full re-render
    if (this._messageEl) {
      this._messageEl.textContent = `Hello, ${this.name}!`;
      this._messageEl.style.color = this.color;
    }
  }

  private _ensureDisplayObserver() {
    if (this._displayObserver) return;
    this._displayObserver = new MutationObserver(mutations => {
      const hasRelevantChange = mutations.some(mutation => {
        const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
        return nodes.some(node => {
          if (!(node instanceof Element)) return false;
          if (node instanceof HTMLTemplateElement) {
            return node.getAttribute('slot') === 'display';
          }
          return !!node.querySelector?.('template[slot="display"]');
        });
      });
      if (hasRelevantChange) {
        // Invalidate template cache
        this._templateCached = false;
        this.render();
      }
    });
    this._displayObserver.observe(this, { childList: true, subtree: false });
  }

  private _getDisplayTemplate(): HTMLTemplateElement | null {
    // Return cached template or query if not yet cached
    if (this._templateCached) {
      return this._displayTemplate;
    }
    const template = this.querySelector('template[slot="display"]');
    this._displayTemplate =
      template instanceof HTMLTemplateElement ? template : null;
    this._templateCached = true;
    return this._displayTemplate;
  }

  private _renderRows(rowsHost: HTMLElement) {
    const template = this._getDisplayTemplate();
    if (template) {
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
      this._data.forEach((rowData, index) => {
        let rowEl = existingRows[index];
        let boundEls: HTMLElement[] = [];

        if (!rowEl) {
          // Create new row if it doesn't exist
          rowEl = document.createElement('div');
          rowEl.className = 'row';
          rowEl.setAttribute('tabindex', '0');
          rowEl.setAttribute('role', 'listitem');
          rowEl.addEventListener('keydown', event =>
            this._handleRowKeydown(event as KeyboardEvent, index)
          );
          rowsHost.appendChild(rowEl);

          // Clone template content into new row
          rowEl.appendChild(template.content.cloneNode(true));

          // Cache bound elements on first creation
          boundEls = Array.from(
            rowEl.querySelectorAll('[data-bind]')
          ) as HTMLElement[];
          (rowEl as unknown as { _boundEls?: HTMLElement[] })._boundEls =
            boundEls;
        } else {
          // Retrieve cached bound elements
          boundEls =
            (rowEl as unknown as { _boundEls?: HTMLElement[] })._boundEls || [];
        }

        // Always update attributes and bindings for current index/data
        rowEl.setAttribute('data-row', String(index));
        rowEl.setAttribute('aria-rowindex', String(index + 1));

        // Re-apply bindings and semantics with cached elements
        this._applyBindingsOptimized(boundEls, rowData);
        this._applyFormSemanticsOptimized(rowEl, boundEls, rowData, index);
      });
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

  private _handleRowKeydown(event: KeyboardEvent, rowIndex: number) {
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
}

if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
