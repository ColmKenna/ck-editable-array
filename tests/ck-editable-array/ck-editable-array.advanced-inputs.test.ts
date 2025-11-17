/* eslint-disable no-undef */
import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('ck-editable-array (advanced inputs demo)', () => {
  beforeAll(() => {
    if (!customElements.get('ck-editable-array')) {
      customElements.define('ck-editable-array', CkEditableArray);
    }
  });

  interface DemoRow {
    date: string;
    notes: string;
    status?: string;
    editing?: boolean;
    deleted?: boolean;
  }

  function setup(): CkEditableArray {
    const el = document.createElement('ck-editable-array') as CkEditableArray;
    el.innerHTML = `
      <template slot="display">
        <div class="row-display">
          <span data-bind="date"></span>
          <span data-bind="notes"></span>
          <button data-action="toggle">Edit</button>
        </div>
      </template>
      <template slot="edit">
        <div class="row-edit">
          <input type="date" data-bind="date" />
          <input data-bind="notes" />
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </template>
    `;
    document.body.appendChild(el);
    return el;
  }

  test('schema validation disables save until fixed', () => {
    const el = setup();
    el.schema = {
      required: ['date'],
      properties: { notes: { minLength: 3 } },
    };
    el.data = [
      {
        date: '2025-11-15',
        notes: '',
      },
    ];
    // Enter edit mode
    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    const saveBtn = el.shadowRoot!.querySelector(
      '.edit-content [data-action="save"]'
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true); // notes too short
    const notesInput = el.shadowRoot!.querySelector(
      '.edit-content input[data-bind="notes"]'
    ) as HTMLInputElement;
    notesInput.value = 'okay';
    notesInput.dispatchEvent(new Event('input'));
    expect(saveBtn.disabled).toBe(false);
  });

  test('editing date field commits after save', () => {
    const el = setup();
    el.data = [
      {
        date: '2025-11-15',
        notes: 'n',
      },
    ];
    const toggleBtn = el.shadowRoot!.querySelector(
      '[data-action="toggle"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    const dateInput = el.shadowRoot!.querySelector(
      '.edit-content input[data-bind="date"]'
    ) as HTMLInputElement;
    dateInput.value = '2025-12-01';
    dateInput.dispatchEvent(new Event('input'));
    const saveBtn = el.shadowRoot!.querySelector(
      '.edit-content [data-action="save"]'
    ) as HTMLButtonElement;
    saveBtn.click();
    const first = el.data[0] as DemoRow;
    expect(first.date).toBe('2025-12-01');
  });

  describe('select element binding', () => {
    function setupWithSelect(): CkEditableArray {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="status"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
            <select data-bind="status" aria-label="Status">
              <option value="">--</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);
      return el;
    }

    test('select element displays bound value in display mode', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'planned' }];

      const displaySpan = el.shadowRoot!.querySelector('[data-bind="status"]');
      expect(displaySpan?.textContent).toBe('planned');
    });
    test('select element shows correct option selected in edit mode', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'in-progress' }];

      // Toggle to edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;

      expect(selectElement.value).toBe('in-progress');
    });

    test('changing select value updates data on save', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'planned' }];

      // Toggle to edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;

      // Change the select value
      selectElement.value = 'done';
      selectElement.dispatchEvent(new Event('change'));

      // Save the changes
      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as DemoRow;
      expect(first.status).toBe('done');
    });

    test('select element reflects value when switching back to edit mode', () => {
      const el = setupWithSelect();
      el.data = [{ status: 'planned' }];

      // Toggle to edit mode
      let toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      // Change and save
      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;
      selectElement.value = 'done';
      selectElement.dispatchEvent(new Event('change'));

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      // Toggle back to edit mode
      toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      // Check that select shows 'done'
      const selectAgain = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;
      expect(selectAgain.value).toBe('done');
    });

    test('validation works with select element (required field)', () => {
      const el = setupWithSelect();
      el.schema = {
        required: ['status'],
      };
      el.data = [{ status: '' }];

      // Toggle to edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;

      // Save should be disabled when status is empty
      expect(saveBtn.disabled).toBe(true);

      // Set a valid value
      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="status"]'
      ) as HTMLSelectElement;
      selectElement.value = 'planned';
      selectElement.dispatchEvent(new Event('change'));

      // Save should now be enabled
      expect(saveBtn.disabled).toBe(false);
    });
  });

  describe('combo (input[list] + datalist) binding', () => {
    function setupWithCombo(): CkEditableArray {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="category"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
            <input list="category-list" data-bind="category" aria-label="Category" />
            <datalist id="category-list">
              <option value="feature">Feature</option>
              <option value="bug">Bug Fix</option>
              <option value="research">Research</option>
              <option value="test">Testing</option>
            </datalist>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);
      return el;
    }

    test('combo input shows bound value in edit mode', () => {
      const el = setupWithCombo();
      el.data = [{ category: 'feature', date: '2025-11-15', notes: '' } as any];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const comboInput = el.shadowRoot!.querySelector(
        '.edit-content input[data-bind="category"]'
      ) as HTMLInputElement;
      expect(comboInput.value).toBe('feature');
    });

    test('changing combo value updates data on save', () => {
      const el = setupWithCombo();
      el.data = [{ category: 'feature', date: '2025-11-15', notes: '' } as any];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const comboInput = el.shadowRoot!.querySelector(
        '.edit-content input[data-bind="category"]'
      ) as HTMLInputElement;
      comboInput.value = 'research';
      comboInput.dispatchEvent(new Event('input'));

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as any;
      expect(first.category).toBe('research');
    });

    test('datalist ids are made unique per row and input[list] updated', () => {
      const el = setupWithCombo();
      // Debug: ensure templates are present in light DOM
      el.data = [
        { category: 'feature', date: '2025-11-15', notes: '' } as any,
        { category: 'bug', date: '2025-11-16', notes: '' } as any,
      ];

      // Expect datalist IDs to be suffixed with row index, avoiding duplicates
      const dataLists = Array.from(
        el.shadowRoot!.querySelectorAll('.edit-content datalist')
      ) as HTMLDataListElement[];
      const ids = dataLists.map(dl => dl.id);
      // Should not include the original unsuffixed id
      expect(ids.some(id => id === 'category-list')).toBe(false);
      // Should include row-index suffixes
      expect(ids).toEqual(
        expect.arrayContaining(['category-list-0', 'category-list-1'])
      );

      // Each edit-content's input[list] should match its sibling datalist id
      const editWrappers = Array.from(
        el.shadowRoot!.querySelectorAll('.edit-content')
      ) as HTMLElement[];
      editWrappers.forEach((wrap, idx) => {
        const input = wrap.querySelector(
          'input[data-bind="category"]'
        ) as HTMLInputElement;
        const dl = wrap.querySelector('datalist') as HTMLDataListElement;
        expect(input.getAttribute('list')).toBe(`category-list-${idx}`);
        expect(dl.id).toBe(`category-list-${idx}`);
      });
    });
  });

  describe('multi-select element binding', () => {
    function setupWithMultiSelect(): CkEditableArray {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="tags"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
            <select multiple data-bind="tags" aria-label="Tags">
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="ux">UX</option>
              <option value="ops">Ops</option>
            </select>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);
      return el;
    }

    test('multi-select element displays joined values in display mode', () => {
      const el = setupWithMultiSelect();
      el.data = [
        { tags: ['frontend', 'ux'] } as unknown as Record<string, unknown>,
      ];
      const first = el.data[0] as unknown as Record<string, unknown>;
      expect(Array.isArray(first.tags as string[])).toBe(true);
      expect((first.tags as string[]).join(', ')).toBe('frontend, ux');
    });

    test('multi-select shows correct options selected in edit mode', () => {
      const el = setupWithMultiSelect();
      el.data = [
        { tags: ['frontend', 'ux'] } as unknown as Record<string, unknown>,
      ];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="tags"]'
      ) as HTMLSelectElement;

      const selectedValues = Array.from(selectElement.selectedOptions).map(
        o => o.value
      );
      expect(selectedValues.sort()).toEqual(['frontend', 'ux'].sort());
    });

    test('changing multi-select values updates data on save', () => {
      const el = setupWithMultiSelect();
      el.data = [{ tags: ['frontend'] } as unknown as Record<string, unknown>];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const selectElement = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="tags"]'
      ) as HTMLSelectElement;

      // Select two options
      Array.from(selectElement.options).forEach(opt => {
        opt.selected = opt.value === 'backend' || opt.value === 'ux';
      });
      selectElement.dispatchEvent(new Event('change'));

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as unknown as Record<string, unknown>;
      expect(Array.isArray(first.tags as string[])).toBe(true);
      expect((first.tags as string[]).sort()).toEqual(['backend', 'ux'].sort());
    });
  });

  describe('checkbox group element binding', () => {
    function setupWithCheckboxGroup(): CkEditableArray {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="tagsCheckbox"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
              <label><input type="checkbox" value="design" data-bind="tagsCheckbox" /> Design</label>
              <label><input type="checkbox" value="infrastructure" data-bind="tagsCheckbox" /> Infrastructure</label>
              <label><input type="checkbox" value="security" data-bind="tagsCheckbox" /> Security</label>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);
      return el;
    }

    test('checkbox group displays joined values in display mode', () => {
      const el = setupWithCheckboxGroup();
      el.data = [
        { tagsCheckbox: ['design', 'security'] } as unknown as Record<
          string,
          unknown
        >,
      ];

      const firstCB = el.data[0] as unknown as Record<string, unknown>;
      expect(Array.isArray(firstCB.tagsCheckbox as string[])).toBe(true);
      expect((firstCB.tagsCheckbox as string[]).join(', ')).toBe(
        'design, security'
      );
    });

    test('checkbox group shows correct options selected in edit mode', () => {
      const el = setupWithCheckboxGroup();
      el.data = [
        { tagsCheckbox: ['design', 'security'] } as unknown as Record<
          string,
          unknown
        >,
      ];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const checkedValues = (
        Array.from(
          el.shadowRoot!.querySelectorAll(
            'input[type="checkbox"][data-bind="tagsCheckbox"]'
          )
        ) as HTMLInputElement[]
      )
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      expect(checkedValues.sort()).toEqual(['design', 'security'].sort());
    });

    test('changing checkbox group values updates data on save', () => {
      const el = setupWithCheckboxGroup();
      el.data = [
        { tagsCheckbox: ['design'] } as unknown as Record<string, unknown>,
      ];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const checkboxes = Array.from(
        el.shadowRoot!.querySelectorAll(
          'input[type="checkbox"][data-bind="tagsCheckbox"]'
        )
      ) as HTMLInputElement[];
      checkboxes.forEach(cb => {
        cb.checked = cb.value === 'infrastructure' || cb.value === 'security';
        cb.dispatchEvent(new Event('change'));
      });

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as unknown as Record<string, unknown>;
      expect(Array.isArray(first.tagsCheckbox as string[])).toBe(true);
      expect((first.tagsCheckbox as string[]).sort()).toEqual(
        ['infrastructure', 'security'].sort()
      );
    });

    test('single checkbox maps to boolean when only one exists', () => {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div><span data-bind="active"></span><button data-action="toggle">Edit</button></div>
        </template>
        <template slot="edit">
          <div><input type="checkbox" data-bind="active" /><button data-action="save">Save</button></div>
        </template>`;
      document.body.appendChild(el);

      el.data = [{ active: false } as unknown as Record<string, unknown>];
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const cb = el.shadowRoot!.querySelector(
        'input[type="checkbox"][data-bind="active"]'
      ) as HTMLInputElement;
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();
      const first = el.data[0] as unknown as Record<string, unknown>;
      expect(first.active).toBe(true);
    });

    test('multi-select and checkbox group are independent fields in the same component', () => {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="tags"></span>
            <span data-bind="tagsCheckbox"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
            <select multiple data-bind="tags" aria-label="Tags">
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="ux">UX</option>
              <option value="ops">Ops</option>
            </select>
            <label><input type="checkbox" value="frontend" data-bind="tagsCheckbox" /> Frontend</label>
            <label><input type="checkbox" value="backend" data-bind="tagsCheckbox" /> Backend</label>
            <label><input type="checkbox" value="ux" data-bind="tagsCheckbox" /> UX</label>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);

      // seed both fields with distinct values
      el.data = [
        {
          tags: ['frontend', 'ux'],
          tagsCheckbox: ['ops'],
        } as unknown as Record<string, unknown>,
      ];

      // Confirm display shows both fields separately
      const displayTags =
        el.shadowRoot!.querySelector('[data-bind="tags"]')!.textContent;
      const displayTagsCheckbox = el.shadowRoot!.querySelector(
        '[data-bind="tagsCheckbox"]'
      )!.textContent;
      expect(displayTags).toBe('frontend, ux');
      expect(displayTagsCheckbox).toBe('ops');

      // Toggle to edit mode
      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      // Change only the select (tags) to backend
      const select = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="tags"]'
      ) as HTMLSelectElement;
      Array.from(select.options).forEach(opt => {
        opt.selected = opt.value === 'backend';
      });
      select.dispatchEvent(new Event('change'));

      // Change checkboxes to set tagsCheckbox to only 'backend' as well
      const cbs = Array.from(
        el.shadowRoot!.querySelectorAll(
          'input[type="checkbox"][data-bind="tagsCheckbox"]'
        )
      ) as HTMLInputElement[];
      cbs.forEach(cb => {
        cb.checked = cb.value === 'backend';
        cb.dispatchEvent(new Event('change'));
      });

      // Save
      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as unknown as Record<string, unknown>;
      expect(Array.isArray(first.tags as string[])).toBe(true);
      expect((first.tags as string[]).sort()).toEqual(['backend'].sort());
      expect(Array.isArray(first.tagsCheckbox as string[])).toBe(true);
      expect((first.tagsCheckbox as string[]).sort()).toEqual(
        ['backend'].sort()
      );
    });

    test("changing only the multi-select doesn't change the checkbox field", () => {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="tags"></span>
            <span data-bind="tagsCheckbox"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
            <select multiple data-bind="tags">
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="ux">UX</option>
              <option value="ops">Ops</option>
            </select>
            <label><input type="checkbox" value="frontend" data-bind="tagsCheckbox" /> Frontend</label>
            <label><input type="checkbox" value="backend" data-bind="tagsCheckbox" /> Backend</label>
            <label><input type="checkbox" value="ux" data-bind="tagsCheckbox" /> UX</label>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);

      el.data = [
        { tags: ['frontend'], tagsCheckbox: ['ux'] } as unknown as Record<
          string,
          unknown
        >,
      ];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const select = el.shadowRoot!.querySelector(
        '.edit-content select[data-bind="tags"]'
      ) as HTMLSelectElement;
      // Select 'backend' only
      Array.from(select.options).forEach(opt => {
        opt.selected = opt.value === 'backend';
      });
      select.dispatchEvent(new Event('change'));

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as unknown as Record<string, unknown>;
      expect(Array.isArray(first.tags as string[])).toBe(true);
      expect((first.tags as string[]).sort()).toEqual(['backend'].sort());
      // tagsCheckbox unchanged
      expect(Array.isArray(first.tagsCheckbox as string[])).toBe(true);
      expect((first.tagsCheckbox as string[]).sort()).toEqual(['ux'].sort());
    });

    test("changing only the checkbox group doesn't change the multi-select field", () => {
      const el = document.createElement('ck-editable-array') as CkEditableArray;
      el.innerHTML = `
        <template slot="display">
          <div class="row-display">
            <span data-bind="tags"></span>
            <span data-bind="tagsCheckbox"></span>
            <button data-action="toggle">Edit</button>
          </div>
        </template>
        <template slot="edit">
          <div class="row-edit">
            <select multiple data-bind="tags">
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="ux">UX</option>
              <option value="ops">Ops</option>
            </select>
            <label><input type="checkbox" value="frontend" data-bind="tagsCheckbox" /> Frontend</label>
            <label><input type="checkbox" value="backend" data-bind="tagsCheckbox" /> Backend</label>
            <label><input type="checkbox" value="ux" data-bind="tagsCheckbox" /> UX</label>
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      `;
      document.body.appendChild(el);

      el.data = [
        { tags: ['frontend'], tagsCheckbox: ['ux'] } as unknown as Record<
          string,
          unknown
        >,
      ];

      const toggleBtn = el.shadowRoot!.querySelector(
        '[data-action="toggle"]'
      ) as HTMLButtonElement;
      toggleBtn.click();

      const cbs = Array.from(
        el.shadowRoot!.querySelectorAll(
          'input[type="checkbox"][data-bind="tagsCheckbox"]'
        )
      ) as HTMLInputElement[];
      cbs.forEach(cb => {
        cb.checked = cb.value === 'backend';
        cb.dispatchEvent(new Event('change'));
      });

      const saveBtn = el.shadowRoot!.querySelector(
        '.edit-content [data-action="save"]'
      ) as HTMLButtonElement;
      saveBtn.click();

      const first = el.data[0] as unknown as Record<string, unknown>;
      // tags unchanged
      expect(Array.isArray(first.tags as string[])).toBe(true);
      expect((first.tags as string[]).sort()).toEqual(['frontend'].sort());
      // tagsCheckbox changed
      expect(Array.isArray(first.tagsCheckbox as string[])).toBe(true);
      expect((first.tagsCheckbox as string[]).sort()).toEqual(
        ['backend'].sort()
      );
    });
  });
});
