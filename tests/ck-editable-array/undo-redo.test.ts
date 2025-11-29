/**
 * @file undo-redo.test.ts
 * @description Tests for Undo/Redo functionality
 * TDD RED Phase: Writing failing tests first
 */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register the custom element if not already registered
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

describe('Undo/Redo Support', () => {
  let el: CkEditableArray;

  function setup(): CkEditableArray {
    const element = document.createElement(
      'ck-editable-array'
    ) as CkEditableArray;
    element.innerHTML = `
      <template slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="delete">Delete</button>
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

  describe('History Tracking', () => {
    it('should have canUndo property that returns false initially', () => {
      el.data = [{ name: 'Alice' }];
      expect(el.canUndo).toBe(false);
    });

    it('should have canRedo property that returns false initially', () => {
      el.data = [{ name: 'Alice' }];
      expect(el.canRedo).toBe(false);
    });

    it('should track data changes in history', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      expect(el.canUndo).toBe(true);
    });

    it('should clear redo history after new change', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();
      expect(el.canRedo).toBe(true);
      el.data = [{ name: 'Charlie' }];
      expect(el.canRedo).toBe(false);
    });
  });

  describe('Undo Operation', () => {
    it('should have undo() method', () => {
      expect(typeof el.undo).toBe('function');
    });

    it('should restore previous data state', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();
      expect((el.data[0] as { name: string }).name).toBe('Alice');
    });

    it('should enable canRedo after undo', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();
      expect(el.canRedo).toBe(true);
    });

    it('should disable canUndo when at beginning of history', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();
      expect(el.canUndo).toBe(false);
    });

    it('should do nothing when canUndo is false', () => {
      el.data = [{ name: 'Alice' }];
      el.undo(); // Should not throw
      expect((el.data[0] as { name: string }).name).toBe('Alice');
    });

    it('should dispatch datachanged event on undo', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];

      let eventFired = false;
      el.addEventListener('datachanged', () => {
        eventFired = true;
      });

      el.undo();
      expect(eventFired).toBe(true);
    });
  });

  describe('Redo Operation', () => {
    it('should have redo() method', () => {
      expect(typeof el.redo).toBe('function');
    });

    it('should restore undone data state', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();
      el.redo();
      expect((el.data[0] as { name: string }).name).toBe('Bob');
    });

    it('should disable canRedo after redo', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();
      el.redo();
      expect(el.canRedo).toBe(false);
    });

    it('should enable canUndo after redo', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();
      el.redo();
      expect(el.canUndo).toBe(true);
    });

    it('should do nothing when canRedo is false', () => {
      el.data = [{ name: 'Alice' }];
      el.redo(); // Should not throw
      expect((el.data[0] as { name: string }).name).toBe('Alice');
    });

    it('should dispatch datachanged event on redo', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.undo();

      let eventFired = false;
      el.addEventListener('datachanged', () => {
        eventFired = true;
      });

      el.redo();
      expect(eventFired).toBe(true);
    });
  });

  describe('History Limits', () => {
    it('should limit history size to prevent memory issues', () => {
      el.data = [];
      // Make many changes
      for (let i = 0; i < 100; i++) {
        el.data = [{ name: `Item ${i}` }];
      }
      // Should still work without throwing
      expect(el.canUndo).toBe(true);
    });

    it('should have clearHistory() method', () => {
      expect(typeof el.clearHistory).toBe('function');
    });

    it('should clear undo/redo history', () => {
      el.data = [{ name: 'Alice' }];
      el.data = [{ name: 'Bob' }];
      el.clearHistory();
      expect(el.canUndo).toBe(false);
      expect(el.canRedo).toBe(false);
    });
  });

  describe('Multiple Operations', () => {
    it('should support multiple undos', () => {
      el.data = [{ name: 'A' }];
      el.data = [{ name: 'B' }];
      el.data = [{ name: 'C' }];
      el.undo();
      expect((el.data[0] as { name: string }).name).toBe('B');
      el.undo();
      expect((el.data[0] as { name: string }).name).toBe('A');
    });

    it('should support multiple redos', () => {
      el.data = [{ name: 'A' }];
      el.data = [{ name: 'B' }];
      el.data = [{ name: 'C' }];
      el.undo();
      el.undo();
      el.redo();
      expect((el.data[0] as { name: string }).name).toBe('B');
      el.redo();
      expect((el.data[0] as { name: string }).name).toBe('C');
    });
  });
});
