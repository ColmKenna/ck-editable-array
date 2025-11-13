# ck-editable-array docs overview

`ck-editable-array` renders repeatable rows based on templates you supply. Provide `template[slot="display"]` for read-only views and `template[slot="edit"]` for inputs.

## Quick start
```html
<ck-editable-array id="letters">
  <template slot="display">
    <div class="row-display"><span data-bind="value"></span></div>
  </template>
  <template slot="edit">
    <div class="row-edit"><input data-bind="value" /></div>
  </template>
</ck-editable-array>
<script>
  const el = document.getElementById('letters');
  el.data = ['A', 'B', 'C'];
  el.addEventListener('datachanged', event => {
    console.log('updated array', event.detail.data);
  });
</script>
```

## Behavior cheatsheet
- Setting `data` accepts arrays of primitives or objects (object fields map to `data-bind` names).
- Empty, null, or undefined inputs normalize to `[]`.
- User edits update the internal array, re-render the display template, and emit a `datachanged` event that bubbles and is composed.
- No change events fire until something actually changes.
