import {
  ckEditableArraySheet,
  ckEditableArrayCSS,
} from './ck-editable-array.styles';

export class CkEditableArray extends HTMLElement {
  private shadow: ShadowRoot;
  private _data: unknown[] = [];
  private _rootEl: HTMLDivElement;
  private _displayObserver: MutationObserver | null = null;

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
      this.render();
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
    if (this.isConnected) this.render();
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

    this._rootEl.innerHTML = `
      <div class="ck-editable-array">
        <h1 class="message">Hello, ${this.name}!</h1>
        <p class="subtitle">Welcome to our Web Component Library</p>
        <div class="rows" part="rows" data-ck-editable-array-rows></div>
      </div>
    `;

    const rowsHost = this._rootEl.querySelector(
      '[data-ck-editable-array-rows]'
    ) as HTMLElement | null;
    if (rowsHost) this._renderRows(rowsHost);

    const msg = this._rootEl.querySelector('.message') as HTMLElement | null;
    if (msg) msg.style.color = this.color;
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
      if (hasRelevantChange) this.render();
    });
    this._displayObserver.observe(this, { childList: true, subtree: false });
  }

  private _getDisplayTemplate(): HTMLTemplateElement | null {
    const template = this.querySelector('template[slot="display"]');
    return template instanceof HTMLTemplateElement ? template : null;
  }

  private _renderRows(rowsHost: HTMLElement) {
    rowsHost.replaceChildren();

    const template = this._getDisplayTemplate();
    if (template) {
      this._data.forEach((rowData, index) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'row';
        rowEl.setAttribute('data-row', String(index));

        rowEl.appendChild(template.content.cloneNode(true));
        this._applyBindings(rowEl, rowData);

        rowsHost.appendChild(rowEl);
      });
      return;
    }

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

  private _resolvePath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, obj);
  }
}

if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
