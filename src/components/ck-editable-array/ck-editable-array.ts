import {
  ckEditableArraySheet,
  ckEditableArrayCSS,
} from './ck-editable-array.styles';

export class CkEditableArray extends HTMLElement {
  private shadow: ShadowRoot;
  private _data: unknown[] = [];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });

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
    this.render();
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
        this.shadow.appendChild(style);
      }
    }

    this.style.setProperty('--cea-color', this.color);

    this.shadow.innerHTML = `
      <div class="ck-editable-array">
        <h1 class="message">Hello, ${this.name}!</h1>
        <p class="subtitle">Welcome to our Web Component Library</p>
      </div>
    `;

    const msg = this.shadow.querySelector('.message') as HTMLElement | null;
    if (msg) msg.style.color = this.color;
  }
}

if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
