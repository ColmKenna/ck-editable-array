/**
 * @file array-reordering.test.ts
 * @description Tests for Array Reordering functionality (move up/down)
 * TDD RED Phase: Writing failing tests first
 */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register the custom element if not already registered
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

describe('Array Reordering', () => {
  let el: CkEditableArray;

  function setup(): CkEditableArray {
    const element = document.createElement(
      'ck-editable-array'
    ) as CkEditableArray;
    element.innerHTML = `
      <template slot="display">
        <span data-bind="name"></span>
        <button data-action="move-up">↑</button>
        <button data-action="move-down">↓</button>
        <button data-action="toggle">Edit</button>
      </template>
      <template slot="edit">
        <input data-bind="name" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
    document.body.appendChild(element);
    return element;
  }

  beforeEach(() => {
    el = setup();
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  describe('Move Up', () => {
    it('should have moveUp() method', () => {
      expect(typeof el.moveUp).toBe('function');
    });

    it('should move row up in array', () => {
      el.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      el.moveUp(1);
      expect((el.data[0] as { name: string }).name).toBe('B');
      expect((el.data[1] as { name: string }).name).toBe('A');
    });

    it('should not move first row up', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.moveUp(0);
      expect((el.data[0] as { name: string }).name).toBe('A');
    });

    it('should dispatch datachanged event', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      let eventFired = false;
      el.addEventListener('datachanged', () => {
        eventFired = true;
      });
      el.moveUp(1);
      expect(eventFired).toBe(true);
    });

    it('should not move when in readonly mode', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.setAttribute('readonly', '');
      el.moveUp(1);
      expect((el.data[0] as { name: string }).name).toBe('A');
    });

    it('should respond to move-up action button click', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      const moveUpBtn = el.shadowRoot!.querySelectorAll(
        '[data-action="move-up"]'
      )[1] as HTMLButtonElement;
      moveUpBtn?.click();
      expect((el.data[0] as { name: string }).name).toBe('B');
    });

    it('should disable move-up button for first row', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      const firstMoveUpBtn = el.shadowRoot!.querySelector(
        '[data-row="0"] [data-action="move-up"]'
      ) as HTMLButtonElement;
      expect(firstMoveUpBtn?.disabled).toBe(true);
    });
  });

  describe('Move Down', () => {
    it('should have moveDown() method', () => {
      expect(typeof el.moveDown).toBe('function');
    });

    it('should move row down in array', () => {
      el.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      el.moveDown(0);
      expect((el.data[0] as { name: string }).name).toBe('B');
      expect((el.data[1] as { name: string }).name).toBe('A');
    });

    it('should not move last row down', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.moveDown(1);
      expect((el.data[1] as { name: string }).name).toBe('B');
    });

    it('should dispatch datachanged event', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      let eventFired = false;
      el.addEventListener('datachanged', () => {
        eventFired = true;
      });
      el.moveDown(0);
      expect(eventFired).toBe(true);
    });

    it('should not move when in readonly mode', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.setAttribute('readonly', '');
      el.moveDown(0);
      expect((el.data[0] as { name: string }).name).toBe('A');
    });

    it('should respond to move-down action button click', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      const moveDownBtn = el.shadowRoot!.querySelector(
        '[data-row="0"] [data-action="move-down"]'
      ) as HTMLButtonElement;
      moveDownBtn?.click();
      expect((el.data[0] as { name: string }).name).toBe('B');
    });

    it('should disable move-down button for last row', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      const lastMoveDownBtn = el.shadowRoot!.querySelector(
        '[data-row="1"] [data-action="move-down"]'
      ) as HTMLButtonElement;
      expect(lastMoveDownBtn?.disabled).toBe(true);
    });
  });

  describe('Move To Index', () => {
    it('should have moveTo() method', () => {
      expect(typeof el.moveTo).toBe('function');
    });

    it('should move row to specific index', () => {
      el.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }];
      el.moveTo(0, 2);
      expect((el.data[0] as { name: string }).name).toBe('B');
      expect((el.data[1] as { name: string }).name).toBe('C');
      expect((el.data[2] as { name: string }).name).toBe('A');
    });

    it('should handle moving to same index', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.moveTo(0, 0);
      expect((el.data[0] as { name: string }).name).toBe('A');
    });

    it('should clamp target index to valid range', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.moveTo(0, 100);
      expect((el.data[1] as { name: string }).name).toBe('A');
    });

    it('should dispatch reorder event', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      let eventFired = false;
      let eventDetail: { fromIndex: number; toIndex: number } | null = null;
      el.addEventListener('reorder', (e: Event) => {
        eventFired = true;
        eventDetail = (e as CustomEvent).detail;
      });
      el.moveTo(0, 1);
      expect(eventFired).toBe(true);
      expect(eventDetail).toMatchObject({ fromIndex: 0, toIndex: 1 });
    });
  });

  describe('Edit Mode Interaction', () => {
    it('should not allow reordering when a row is in edit mode', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      // Enter edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn?.click();

      el.moveUp(1);
      expect((el.data[0] as { name: string }).name).toBe('A');
    });

    it('should disable move buttons when any row is in edit mode', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      // Enter edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn?.click();

      const moveDownBtn = el.shadowRoot!.querySelector(
        '.display-content [data-action="move-down"]'
      ) as HTMLButtonElement;
      // Should be disabled when in edit mode
      expect(moveDownBtn?.disabled).toBe(true);
    });
  });
});
