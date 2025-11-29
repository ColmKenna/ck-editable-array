/**
 * @file style-manager.ts
 * @description Manages Constructable Stylesheets with fallback for older browsers.
 * Provides efficient style sharing across multiple component instances.
 */

/**
 * StyleManager - Handles Constructable Stylesheets with fallback
 *
 * Features:
 * - Feature detection for Constructable Stylesheets
 * - Shared stylesheet instance across all component instances
 * - Fallback to <style> element for older browsers
 * - Style update propagation to all instances
 */
export class StyleManager {
  // Shared stylesheet instance
  private static _sharedSheet: CSSStyleSheet | null = null;

  // Cached feature detection result
  private static _supportsConstructable: boolean | null = null;

  // Current CSS text for fallback updates
  private static _currentCssText: string = '';

  // Track shadow roots using fallback styles for updates
  private static _fallbackRoots: Set<ShadowRoot> = new Set();

  /**
   * Check if Constructable Stylesheets are supported
   * Result is cached after first check
   */
  static get supportsConstructableStylesheets(): boolean {
    if (this._supportsConstructable === null) {
      try {
        // Check if we can construct a CSSStyleSheet and use replaceSync
        const sheet = new CSSStyleSheet();
        sheet.replaceSync('');
        this._supportsConstructable = true;
      } catch {
        this._supportsConstructable = false;
      }
    }
    return this._supportsConstructable;
  }

  /**
   * Get or create the shared stylesheet
   * @param cssText - The CSS content for the stylesheet
   * @returns The shared CSSStyleSheet or null if not supported
   */
  static getSharedStylesheet(cssText: string): CSSStyleSheet | null {
    if (!this.supportsConstructableStylesheets) {
      return null;
    }

    if (!this._sharedSheet) {
      this._sharedSheet = new CSSStyleSheet();
      this._sharedSheet.replaceSync(cssText);
      this._currentCssText = cssText;
    }

    return this._sharedSheet;
  }

  /**
   * Apply styles to a shadow root
   * Uses Constructable Stylesheets if supported, otherwise falls back to <style> element
   * @param shadowRoot - The shadow root to apply styles to
   * @param cssText - The CSS content
   */
  static applyStyles(shadowRoot: ShadowRoot, cssText: string): void {
    if (this.supportsConstructableStylesheets) {
      const sheet = this.getSharedStylesheet(cssText);
      if (sheet) {
        // Check if already adopted
        if (!shadowRoot.adoptedStyleSheets.includes(sheet)) {
          shadowRoot.adoptedStyleSheets = [
            ...shadowRoot.adoptedStyleSheets,
            sheet,
          ];
        }
      }
    } else {
      // Fallback: create or update <style> element
      this._applyFallbackStyles(shadowRoot, cssText);
    }
  }

  /**
   * Apply styles using fallback <style> element
   * @param shadowRoot - The shadow root
   * @param cssText - The CSS content
   */
  private static _applyFallbackStyles(
    shadowRoot: ShadowRoot,
    cssText: string
  ): void {
    let styleElement = shadowRoot.querySelector(
      'style[data-style-manager]'
    ) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.setAttribute('data-style-manager', 'true');
      shadowRoot.insertBefore(styleElement, shadowRoot.firstChild);
      this._fallbackRoots.add(shadowRoot);
    }

    styleElement.textContent = cssText;
    this._currentCssText = cssText;
  }

  /**
   * Update the shared stylesheet content
   * All instances using the stylesheet will be updated immediately
   * @param cssText - The new CSS content
   */
  static updateStyles(cssText: string): void {
    this._currentCssText = cssText;

    if (this.supportsConstructableStylesheets && this._sharedSheet) {
      this._sharedSheet.replaceSync(cssText);
    } else {
      // Update all fallback style elements
      this._fallbackRoots.forEach(root => {
        const styleElement = root.querySelector(
          'style[data-style-manager]'
        ) as HTMLStyleElement | null;
        if (styleElement) {
          styleElement.textContent = cssText;
        }
      });
    }
  }

  /**
   * Reset the StyleManager state
   * Primarily for testing purposes
   */
  static reset(): void {
    this._sharedSheet = null;
    this._currentCssText = '';
    this._fallbackRoots.clear();
    // Don't reset feature detection cache
  }

  /**
   * Remove a shadow root from fallback tracking
   * Should be called when a component is disconnected
   * @param shadowRoot - The shadow root to remove
   */
  static removeFallbackRoot(shadowRoot: ShadowRoot): void {
    this._fallbackRoots.delete(shadowRoot);
  }

  /**
   * Get the current CSS text
   * @returns The current CSS content
   */
  static get currentCssText(): string {
    return this._currentCssText;
  }
}

export default StyleManager;
