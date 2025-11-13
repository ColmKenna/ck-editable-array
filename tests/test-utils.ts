/**
 * Test utilities for ck-editable-array component testing.
 */

export async function waitForRender(element: HTMLElement): Promise<void> {
  await Promise.resolve();
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  // Ensure pending microtasks flush.
  await Promise.resolve();
}

export function getShadowRoot(element: HTMLElement): ShadowRoot | null {
  return element.shadowRoot;
}

export function getSlottedContent(element: HTMLElement, slotName: string): HTMLElement | null {
  return element.querySelector<HTMLElement>(`[slot="${slotName}"]`);
}

export function simulateInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export function captureEvent<T = Event>(element: HTMLElement, eventName: string): Promise<T> {
  return new Promise(resolve => {
    element.addEventListener(
      eventName,
      event => {
        resolve(event as T);
      },
      { once: true }
    );
  });
}

export function captureEventOrTimeout<T = Event>(
  element: HTMLElement,
  eventName: string,
  timeout = 100
): Promise<T | null> {
  return Promise.race([
    captureEvent<T>(element, eventName),
    new Promise<null>(resolve => setTimeout(() => resolve(null), timeout))
  ]);
}

export function getRows(element: HTMLElement): NodeListOf<HTMLElement> {
  const root = getShadowRoot(element);
  return (root?.querySelectorAll<HTMLElement>('[data-row]') ??
    ([] as unknown as NodeListOf<HTMLElement>));
}

export function getRow(element: HTMLElement, index: number): HTMLElement | null {
  const rows = getRows(element);
  return rows[index] ?? null;
}

export async function clickAndWait(target: HTMLElement, component: HTMLElement): Promise<void> {
  target.click();
  await waitForRender(component);
}
