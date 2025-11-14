# Migration Guide: ck-editable-array

This guide helps you integrate `ck-editable-array` into existing projects and migrate from alternative implementations.

---

## Table of Contents

1. [New Project Integration](#new-project-integration)
2. [Migrating from Plain HTML Forms](#migrating-from-plain-html-forms)
3. [Migrating from React/Vue Array Components](#migrating-from-reactvue-array-components)
4. [Migrating from jQuery Plugins](#migrating-from-jquery-plugins)
5. [Breaking Changes](#breaking-changes)
6. [Browser Compatibility](#browser-compatibility)
7. [Polyfills](#polyfills)

---

## New Project Integration

### Installation

```bash
npm install ck-editable-array
```

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My App</title>
</head>
<body>
  <ck-editable-array id="myArray">
    <template slot="display">
      <div><span data-bind="name"></span></div>
    </template>
    <template slot="edit">
      <div><input data-bind="name" /></div>
    </template>
  </ck-editable-array>

  <script type="module">
    import './node_modules/ck-editable-array/dist/ck-editable-array.esm.js';
    
    const el = document.getElementById('myArray');
    el.data = [{ name: 'Alice' }, { name: 'Bob' }];
  </script>
</body>
</html>
```

### TypeScript Setup

```typescript
import { CkEditableArray } from 'ck-editable-array';

const el = document.getElementById('myArray') as CkEditableArray;
el.data = [{ name: 'Alice' }, { name: 'Bob' }];

el.addEventListener('datachanged', (e: Event) => {
  const customEvent = e as CustomEvent;
  console.log('Data changed:', customEvent.detail.data);
});
```

---

## Migrating from Plain HTML Forms

### Before: Repeating Form Fields

```html
<form id="myForm">
  <div class="row">
    <input name="person[0].name" value="Alice" />
    <input name="person[0].email" value="alice@example.com" />
  </div>
  <div class="row">
    <input name="person[1].name" value="Bob" />
    <input name="person[1].email" value="bob@example.com" />
  </div>
  <button type="button" onclick="addRow()">Add</button>
</form>

<script>
  function addRow() {
    const form = document.getElementById('myForm');
    const index = form.querySelectorAll('.row').length;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <input name="person[${index}].name" />
      <input name="person[${index}].email" />
    `;
    form.insertBefore(row, form.lastElementChild);
  }
</script>
```

### After: Using ck-editable-array

```html
<form id="myForm">
  <ck-editable-array id="people" name="person">
    <template slot="display">
      <div>
        <span data-bind="name"></span> — <span data-bind="email"></span>
        <button data-action="toggle">Edit</button>
      </div>
    </template>
    
    <template slot="edit">
      <div>
        <input data-bind="name" placeholder="Name" />
        <input data-bind="email" placeholder="Email" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </div>
    </template>
  </ck-editable-array>
</form>

<script type="module">
  import './node_modules/ck-editable-array/dist/ck-editable-array.esm.js';
  
  const el = document.getElementById('people');
  el.data = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
</script>
```

**Benefits:**
- ✅ Automatic input naming (`person[0].name`, `person[1].name`, etc.)
- ✅ Built-in add/edit/delete functionality
- ✅ No manual DOM manipulation
- ✅ Validation support
- ✅ Immutable data handling

---

## Migrating from React/Vue Array Components

### React Example

**Before:**
```jsx
function PeopleList() {
  const [people, setPeople] = useState([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ]);

  const handleAdd = () => {
    setPeople([...people, { name: '', email: '' }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...people];
    updated[index][field] = value;
    setPeople(updated);
  };

  return (
    <div>
      {people.map((person, index) => (
        <div key={index}>
          <input 
            value={person.name}
            onChange={(e) => handleChange(index, 'name', e.target.value)}
          />
          <input 
            value={person.email}
            onChange={(e) => handleChange(index, 'email', e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleAdd}>Add</button>
    </div>
  );
}
```

**After:**
```jsx
import { useRef, useEffect } from 'react';

function PeopleList() {
  const arrayRef = useRef(null);

  useEffect(() => {
    if (arrayRef.current) {
      arrayRef.current.data = [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
      ];

      arrayRef.current.addEventListener('datachanged', (e) => {
        console.log('Data changed:', e.detail.data);
        // Sync with React state if needed
      });
    }
  }, []);

  return (
    <ck-editable-array ref={arrayRef} name="person">
      <template slot="display">
        <div>
          <span data-bind="name"></span> — <span data-bind="email"></span>
          <button data-action="toggle">Edit</button>
        </div>
      </template>
      
      <template slot="edit">
        <div>
          <input data-bind="name" placeholder="Name" />
          <input data-bind="email" placeholder="Email" />
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      </template>
    </ck-editable-array>
  );
}
```

### Vue Example

**Before:**
```vue
<template>
  <div>
    <div v-for="(person, index) in people" :key="index">
      <input v-model="person.name" />
      <input v-model="person.email" />
    </div>
    <button @click="addPerson">Add</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      people: [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
      ]
    };
  },
  methods: {
    addPerson() {
      this.people.push({ name: '', email: '' });
    }
  }
};
</script>
```

**After:**
```vue
<template>
  <ck-editable-array 
    ref="arrayRef" 
    name="person"
    @datachanged="handleDataChanged">
    <template slot="display">
      <div>
        <span data-bind="name"></span> — <span data-bind="email"></span>
        <button data-action="toggle">Edit</button>
      </div>
    </template>
    
    <template slot="edit">
      <div>
        <input data-bind="name" placeholder="Name" />
        <input data-bind="email" placeholder="Email" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </div>
    </template>
  </ck-editable-array>
</template>

<script>
export default {
  mounted() {
    this.$refs.arrayRef.data = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' }
    ];
  },
  methods: {
    handleDataChanged(event) {
      console.log('Data changed:', event.detail.data);
    }
  }
};
</script>
```

---

## Migrating from jQuery Plugins

### Before: jQuery Repeater Plugin

```html
<form id="myForm">
  <div class="repeater">
    <div data-repeater-list="person">
      <div data-repeater-item>
        <input name="name" />
        <input name="email" />
        <button data-repeater-delete>Delete</button>
      </div>
    </div>
    <button data-repeater-create>Add</button>
  </div>
</form>

<script>
  $('.repeater').repeater({
    initEmpty: false,
    defaultValues: {
      name: '',
      email: ''
    },
    show: function() {
      $(this).slideDown();
    },
    hide: function(deleteElement) {
      $(this).slideUp(deleteElement);
    }
  });
</script>
```

### After: Using ck-editable-array

```html
<form id="myForm">
  <ck-editable-array id="people" name="person">
    <template slot="display">
      <div>
        <span data-bind="name"></span> — <span data-bind="email"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="delete">Delete</button>
      </div>
    </template>
    
    <template slot="edit">
      <div>
        <input data-bind="name" placeholder="Name" />
        <input data-bind="email" placeholder="Email" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </div>
    </template>

    <style slot="styles">
      .display-content.deleted {
        opacity: 0.5;
        text-decoration: line-through;
      }
    </style>
  </ck-editable-array>
</form>

<script type="module">
  import './node_modules/ck-editable-array/dist/ck-editable-array.esm.js';
  
  const el = document.getElementById('people');
  el.data = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
  
  el.newItemFactory = () => ({ name: '', email: '' });
</script>
```

**Migration Checklist:**
- ✅ Remove jQuery dependency
- ✅ Replace `data-repeater-*` attributes with `data-action` and `data-bind`
- ✅ Convert initialization options to component properties
- ✅ Update event handlers to use native events

---

## Breaking Changes

### Version 1.0.0 (Initial Release)

No breaking changes - this is the initial release.

### Future Considerations

If you're building on top of this component, be aware that future versions may introduce:

- **Schema format changes**: Validation schema may evolve to support more complex rules
- **Event payload changes**: Event detail structures may be extended (but not removed)
- **CSS part names**: New parts may be added, but existing parts will remain stable

**Recommendation**: Pin to a specific major version in production:
```json
{
  "dependencies": {
    "ck-editable-array": "^1.0.0"
  }
}
```

---

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Edge | 90+ | Full support |
| Firefox | 90+ | Full support |
| Safari | 15+ | Full support |
| Safari iOS | 15+ | Full support |

### Unsupported Browsers

- Internet Explorer 11 and below (requires polyfills)
- Safari 14 and below (missing `inert` attribute support)
- Firefox 111 and below (missing `inert` attribute support)

---

## Polyfills

### Required Polyfills for Older Browsers

If you need to support older browsers, include these polyfills:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Web Components Polyfills (for IE11, older Safari) -->
  <script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"></script>
  
  <!-- Inert Polyfill (for Firefox <112, Safari <15.5) -->
  <script src="https://unpkg.com/wicg-inert@3.1.2/dist/inert.min.js"></script>
</head>
<body>
  <ck-editable-array id="myArray">
    <!-- ... -->
  </ck-editable-array>

  <script type="module">
    // Wait for polyfills to load
    window.addEventListener('WebComponentsReady', () => {
      import './node_modules/ck-editable-array/dist/ck-editable-array.esm.js';
    });
  </script>
</body>
</html>
```

### Polyfill Details

**@webcomponents/webcomponentsjs** provides:
- Custom Elements v1
- Shadow DOM v1
- HTML Templates
- ES6 Modules (for older browsers)

**wicg-inert** provides:
- `inert` attribute support for older browsers
- Prevents focus and interaction with locked rows

### Testing with Polyfills

```bash
# Install polyfills
npm install --save @webcomponents/webcomponentsjs wicg-inert

# Test in older browsers using BrowserStack or similar
```

---

## Common Migration Issues

### Issue 1: Data Not Updating

**Problem:**
```javascript
const data = el.data;
data[0].name = 'Changed';
// UI doesn't update
```

**Solution:**
```javascript
const data = el.data;
data[0].name = 'Changed';
el.data = data; // Reassign to trigger update
```

### Issue 2: Events Not Firing

**Problem:**
```javascript
el.addEventListener('datachanged', handler);
// Handler not called
```

**Solution:**
```javascript
// Ensure element is connected to DOM first
document.body.appendChild(el);
el.addEventListener('datachanged', handler);
el.data = [{ name: 'Alice' }]; // Now handler will be called
```

### Issue 3: Validation Not Working

**Problem:**
```javascript
el.schema = { required: ['name'] };
// Validation doesn't run
```

**Solution:**
```javascript
// Schema must follow correct format
el.schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 }
  },
  required: ['name']
};
```

### Issue 4: Styles Not Applied

**Problem:**
```html
<style>
  .display-content { color: red; }
</style>
```

**Solution:**
```html
<ck-editable-array>
  <style slot="styles">
    .display-content { color: red; }
  </style>
</ck-editable-array>
```

---

## Getting Help

- **Documentation**: See [README.md](./README.md) for full API reference
- **Examples**: Check [examples/](../examples/) directory for working demos
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions on GitHub Discussions

---

## Next Steps

1. ✅ Install the component
2. ✅ Set up basic templates
3. ✅ Configure validation schema (if needed)
4. ✅ Add event listeners
5. ✅ Test in target browsers
6. ✅ Deploy to production

Happy coding! 🚀
