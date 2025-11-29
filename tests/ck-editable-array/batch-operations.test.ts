/**
 * @file batch-operations.test.ts
 * @description Tests for Batch Operations API
 * TDD RED Phase: Writing failing tests first
 */

import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register the custom element if not already registered
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}

describe('Batch Operations API', () => {
  let el: CkEditableArray;

  function setup(): CkEditableArray {
    const element = document.createElement(
      'ck-editable-array'
    ) as CkEditableArray;
    element.innerHTML = `
      <template slot="display">
        <input type="checkbox" data-action="select" />
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

  describe('Selection', () => {
    it('should have selectedIndices property', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      expect(Array.isArray(el.selectedIndices)).toBe(true);
    });

    it('should return empty array when nothing is selected', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      expect(el.selectedIndices).toEqual([]);
    });

    it('should have select() method', () => {
      expect(typeof el.select).toBe('function');
    });

    it('should select a row by index', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.select(0);
      expect(el.selectedIndices).toContain(0);
    });

    it('should have deselect() method', () => {
      expect(typeof el.deselect).toBe('function');
    });

    it('should deselect a row by index', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.select(0);
      el.deselect(0);
      expect(el.selectedIndices).not.toContain(0);
    });

    it('should have selectAll() method', () => {
      expect(typeof el.selectAll).toBe('function');
    });

    it('should select all rows', () => {
      el.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      el.selectAll();
      expect(el.selectedIndices).toEqual([0, 1, 2]);
    });

    it('should have deselectAll() method', () => {
      expect(typeof el.deselectAll).toBe('function');
    });

    it('should deselect all rows', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.selectAll();
      el.deselectAll();
      expect(el.selectedIndices).toEqual([]);
    });

    it('should toggle selection via checkbox click', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      const checkbox = el.shadowRoot!.querySelector(
        '[data-action="select"]'
      ) as HTMLInputElement;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      expect(el.selectedIndices).toContain(0);
    });

    it('should dispatch selectionchanged event', () => {
      el.data = [{ name: 'A' }];
      let eventFired = false;
      el.addEventListener('selectionchanged', () => {
        eventFired = true;
      });
      el.select(0);
      expect(eventFired).toBe(true);
    });
  });

  describe('Delete Selected', () => {
    it('should have deleteSelected() method', () => {
      expect(typeof el.deleteSelected).toBe('function');
    });

    it('should delete all selected rows', () => {
      el.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      el.select(0);
      el.select(2);
      el.deleteSelected();
      expect(el.data.length).toBe(1);
      expect((el.data[0] as { name: string }).name).toBe('B');
    });

    it('should do nothing when no rows are selected', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.deleteSelected();
      expect(el.data.length).toBe(2);
    });

    it('should clear selection after delete', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.selectAll();
      el.deleteSelected();
      expect(el.selectedIndices).toEqual([]);
    });

    it('should dispatch datachanged event', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.select(0);
      let eventFired = false;
      el.addEventListener('datachanged', () => {
        eventFired = true;
      });
      el.deleteSelected();
      expect(eventFired).toBe(true);
    });

    it('should not delete when in readonly mode', () => {
      el.data = [{ name: 'A' }, { name: 'B' }];
      el.setAttribute('readonly', '');
      el.select(0);
      el.deleteSelected();
      expect(el.data.length).toBe(2);
    });
  });

  describe('Bulk Update', () => {
    it('should have bulkUpdate() method', () => {
      expect(typeof el.bulkUpdate).toBe('function');
    });

    it('should update selected rows with provided values', () => {
      el.data = [
        { name: 'A', status: 'pending' },
        { name: 'B', status: 'pending' },
        { name: 'C', status: 'pending' },
      ];
      el.select(0);
      el.select(2);
      el.bulkUpdate({ status: 'approved' });

      type RowType = { name: string; status: string };
      expect((el.data[0] as RowType).status).toBe('approved');
      expect((el.data[1] as RowType).status).toBe('pending');
      expect((el.data[2] as RowType).status).toBe('approved');
    });

    it('should not modify unselected rows', () => {
      el.data = [
        { name: 'A', value: 1 },
        { name: 'B', value: 2 },
      ];
      el.select(0);
      el.bulkUpdate({ value: 100 });

      type RowType = { name: string; value: number };
      expect((el.data[1] as RowType).value).toBe(2);
    });

    it('should dispatch datachanged event', () => {
      el.data = [{ name: 'A' }];
      el.select(0);
      let eventFired = false;
      el.addEventListener('datachanged', () => {
        eventFired = true;
      });
      el.bulkUpdate({ name: 'Updated' });
      expect(eventFired).toBe(true);
    });

    it('should not update when in readonly mode', () => {
      el.data = [{ name: 'A' }];
      el.setAttribute('readonly', '');
      el.select(0);
      el.bulkUpdate({ name: 'Updated' });
      expect((el.data[0] as { name: string }).name).toBe('A');
    });

    it('should do nothing when no rows are selected', () => {
      el.data = [{ name: 'A' }];
      el.bulkUpdate({ name: 'Updated' });
      expect((el.data[0] as { name: string }).name).toBe('A');
    });
  });

  describe('Get Selected Data', () => {
    it('should have getSelectedData() method', () => {
      expect(typeof el.getSelectedData).toBe('function');
    });

    it('should return array of selected row data', () => {
      el.data = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      el.select(0);
      el.select(2);
      const selected = el.getSelectedData();
      expect(selected.length).toBe(2);
      expect((selected[0] as { name: string }).name).toBe('A');
      expect((selected[1] as { name: string }).name).toBe('C');
    });

    it('should return empty array when nothing is selected', () => {
      el.data = [{ name: 'A' }];
      expect(el.getSelectedData()).toEqual([]);
    });
  });
});
