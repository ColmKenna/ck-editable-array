# Migration Guide: ck-editable-array

**Last Updated**: November 29, 2025  
**Version**: 1.0.0

This guide helps you integrate `ck-editable-array` into existing projects and migrate from alternative implementations.

---

## Table of Contents

1. [New Project Integration](#new-project-integration)
2. [Migrating from Plain HTML Forms](#migrating-from-plain-html-forms)
3. [Migrating from React/Vue Array Components](#migrating-from-reactvue-array-components)
4. [Angular Integration](#angular-integration)
5. [Svelte Integration](#svelte-integration)
6. [Migrating from jQuery Plugins](#migrating-from-jquery-plugins)
7. [Form Submission Patterns](#form-submission-patterns)
8. [Server-Side Rendering Considerations](#server-side-rendering-considerations)
9. [Testing Strategies](#testing-strategies)
10. [Breaking Changes](#breaking-changes)
11. [Browser Compatibility](#browser-compatibility)
12. [Polyfills](#polyfills)
13. [Common Issues](#common-issues)

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

## Angular Integration

Angular applications can use `ck-editable-array` as a custom element with proper event handling and data binding.

### Step 1: Enable Custom Elements Schema

```typescript
// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Enable custom elements
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Step 2: Import the Component

```typescript
// main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Import the web component
import 'ck-editable-array';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
```

### Step 3: Create Angular Wrapper Component

```typescript
// editable-array-wrapper.component.ts
import { 
  Component, 
  ElementRef, 
  EventEmitter, 
  Input, 
  Output, 
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';

interface DataChangedEvent {
  data: any[];
  action: string;
  index?: number;
}

@Component({
  selector: 'app-editable-array',
  template: `
    <ck-editable-array #arrayElement [attr.name]="name" [attr.readonly]="readonly">
      <ng-content></ng-content>
    </ck-editable-array>
  `,
  styles: []
})
export class EditableArrayWrapperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('arrayElement', { static: false }) arrayElement!: ElementRef;
  
  @Input() name?: string;
  @Input() readonly: boolean = false;
  
  @Input() set data(value: any[]) {
    if (this.arrayElement?.nativeElement) {
      this.arrayElement.nativeElement.data = value;
    } else {
      this._pendingData = value;
    }
  }
  
  @Input() set schema(value: any) {
    if (this.arrayElement?.nativeElement) {
      this.arrayElement.nativeElement.schema = value;
    } else {
      this._pendingSchema = value;
    }
  }
  
  @Input() set newItemFactory(value: () => any) {
    if (this.arrayElement?.nativeElement) {
      this.arrayElement.nativeElement.newItemFactory = value;
    } else {
      this._pendingFactory = value;
    }
  }
  
  @Output() dataChanged = new EventEmitter<DataChangedEvent>();
  @Output() beforeToggleMode = new EventEmitter<any>();
  @Output() afterToggleMode = new EventEmitter<any>();
  
  private _pendingData?: any[];
  private _pendingSchema?: any;
  private _pendingFactory?: () => any;
  private _listeners: Array<{ event: string; handler: EventListener }> = [];
  
  ngAfterViewInit(): void {
    const element = this.arrayElement.nativeElement;
    
    // Apply pending values
    if (this._pendingData) {
      element.data = this._pendingData;
      this._pendingData = undefined;
    }
    if (this._pendingSchema) {
      element.schema = this._pendingSchema;
      this._pendingSchema = undefined;
    }
    if (this._pendingFactory) {
      element.newItemFactory = this._pendingFactory;
      this._pendingFactory = undefined;
    }
    
    // Set up event listeners
    this._addListener('datachanged', (e: Event) => {
      const customEvent = e as CustomEvent<DataChangedEvent>;
      this.dataChanged.emit(customEvent.detail);
    });
    
    this._addListener('beforetogglemode', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.beforeToggleMode.emit(customEvent.detail);
    });
    
    this._addListener('aftertogglemode', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.afterToggleMode.emit(customEvent.detail);
    });
  }
  
  ngOnDestroy(): void {
    // Clean up event listeners
    const element = this.arrayElement?.nativeElement;
    if (element) {
      this._listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    }
    this._listeners = [];
  }
  
  private _addListener(event: string, handler: EventListener): void {
    const element = this.arrayElement.nativeElement;
    element.addEventListener(event, handler);
    this._listeners.push({ event, handler });
  }
  
  // Public methods to expose component API
  public getData(): any[] {
    return this.arrayElement?.nativeElement?.data || [];
  }
  
  public setData(data: any[]): void {
    if (this.arrayElement?.nativeElement) {
      this.arrayElement.nativeElement.data = data;
    }
  }
}
```

### Step 4: Use in Angular Template

```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>People Manager</h1>
      
      <app-editable-array
        [data]="people"
        [schema]="validationSchema"
        [newItemFactory]="createNewPerson"
        name="person"
        (dataChanged)="onDataChanged($event)">
        
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
            <input data-bind="email" placeholder="Email" type="email" />
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
      </app-editable-array>
      
      <div class="debug">
        <h3>Current Data:</h3>
        <pre>{{ people | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .debug { margin-top: 20px; padding: 10px; background: #f5f5f5; }
  `]
})
export class AppComponent {
  people = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
  
  validationSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', minLength: 1 }
    },
    required: ['name', 'email']
  };
  
  createNewPerson = () => ({ name: '', email: '' });
  
  onDataChanged(event: any): void {
    console.log('Data changed:', event);
    this.people = event.data;
    
    // Optionally sync with backend
    // this.http.post('/api/people', this.people).subscribe();
  }
}
```

### Angular Best Practices

**1. Use ChangeDetectorRef for Manual Updates:**
```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {}

onDataChanged(event: any): void {
  this.people = event.data;
  this.cdr.detectChanges(); // Force change detection
}
```

**2. Use OnPush Change Detection:**
```typescript
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**3. Handle Form Integration:**
```typescript
import { FormControl, FormGroup } from '@angular/forms';

export class AppComponent {
  form = new FormGroup({
    people: new FormControl([])
  });
  
  onDataChanged(event: any): void {
    this.form.patchValue({ people: event.data });
  }
}
```

---

## Svelte Integration

Svelte provides excellent support for web components with `bind:this` and event forwarding.

### Step 1: Import the Component

```javascript
// main.js or App.svelte
import 'ck-editable-array';
```

### Step 2: Create Svelte Wrapper Component

```svelte
<!-- EditableArray.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  export let data = [];
  export let schema = null;
  export let newItemFactory = null;
  export let name = undefined;
  export let readonly = false;
  
  let element;
  const dispatch = createEventDispatcher();
  
  // Update component when props change
  $: if (element) {
    element.data = data;
  }
  
  $: if (element && schema) {
    element.schema = schema;
  }
  
  $: if (element && newItemFactory) {
    element.newItemFactory = newItemFactory;
  }
  
  onMount(() => {
    // Set initial values
    if (element) {
      element.data = data;
      if (schema) element.schema = schema;
      if (newItemFactory) element.newItemFactory = newItemFactory;
    }
    
    // Set up event listeners
    const handleDataChanged = (e) => {
      data = e.detail.data; // Update local data
      dispatch('datachanged', e.detail);
    };
    
    const handleBeforeToggleMode = (e) => {
      dispatch('beforetogglemode', e.detail);
    };
    
    const handleAfterToggleMode = (e) => {
      dispatch('aftertogglemode', e.detail);
    };
    
    element.addEventListener('datachanged', handleDataChanged);
    element.addEventListener('beforetogglemode', handleBeforeToggleMode);
    element.addEventListener('aftertogglemode', handleAfterToggleMode);
    
    // Cleanup
    return () => {
      element.removeEventListener('datachanged', handleDataChanged);
      element.removeEventListener('beforetogglemode', handleBeforeToggleMode);
      element.removeEventListener('aftertogglemode', handleAfterToggleMode);
    };
  });
  
  // Expose methods
  export function getData() {
    return element?.data || [];
  }
  
  export function setData(newData) {
    if (element) {
      element.data = newData;
    }
  }
</script>

<ck-editable-array 
  bind:this={element}
  {name}
  {readonly}>
  <slot />
</ck-editable-array>
```

### Step 3: Use in Svelte App

```svelte
<!-- App.svelte -->
<script>
  import EditableArray from './EditableArray.svelte';
  
  let people = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
  
  const validationSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', minLength: 1 }
    },
    required: ['name', 'email']
  };
  
  const createNewPerson = () => ({ name: '', email: '' });
  
  function handleDataChanged(event) {
    console.log('Data changed:', event.detail);
    people = event.detail.data;
    
    // Optionally sync with backend
    // fetch('/api/people', {
    //   method: 'POST',
    //   body: JSON.stringify(people)
    // });
  }
</script>

<main>
  <h1>People Manager</h1>
  
  <EditableArray
    bind:data={people}
    schema={validationSchema}
    newItemFactory={createNewPerson}
    name="person"
    on:datachanged={handleDataChanged}>
    
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
        <input data-bind="email" placeholder="Email" type="email" />
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
  </EditableArray>
  
  <div class="debug">
    <h3>Current Data:</h3>
    <pre>{JSON.stringify(people, null, 2)}</pre>
  </div>
</main>

<style>
  main { padding: 20px; }
  .debug { margin-top: 20px; padding: 10px; background: #f5f5f5; }
</style>
```

### Alternative: Direct Usage Without Wrapper

```svelte
<script>
  import { onMount } from 'svelte';
  import 'ck-editable-array';
  
  let arrayElement;
  let people = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
  
  onMount(() => {
    arrayElement.data = people;
    arrayElement.newItemFactory = () => ({ name: '', email: '' });
    
    arrayElement.addEventListener('datachanged', (e) => {
      people = e.detail.data;
    });
  });
</script>

<ck-editable-array bind:this={arrayElement} name="person">
  <template slot="display">
    <div>
      <span data-bind="name"></span>
      <button data-action="toggle">Edit</button>
    </div>
  </template>
  
  <template slot="edit">
    <div>
      <input data-bind="name" />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </div>
  </template>
</ck-editable-array>
```

### Svelte Best Practices

**1. Use Reactive Statements:**
```svelte
<script>
  $: if (arrayElement && people) {
    arrayElement.data = people;
  }
</script>
```

**2. Handle Two-Way Binding:**
```svelte
<script>
  let arrayElement;
  
  // Expose as store for reactivity
  import { writable } from 'svelte/store';
  const peopleStore = writable([]);
  
  $: if (arrayElement) {
    arrayElement.addEventListener('datachanged', (e) => {
      peopleStore.set(e.detail.data);
    });
  }
</script>
```

**3. TypeScript Support:**
```typescript
// EditableArray.svelte
<script lang="ts">
  import type { CkEditableArray } from 'ck-editable-array';
  
  let element: CkEditableArray;
  
  export let data: any[] = [];
  export let schema: any = null;
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

## Form Submission Patterns

The `ck-editable-array` component integrates seamlessly with HTML forms using the `name` attribute.

### Basic Form Submission

```html
<form id="myForm" action="/api/people" method="POST">
  <input type="text" name="title" placeholder="Form Title" />
  
  <ck-editable-array id="people" name="person">
    <template slot="display">
      <div>
        <span data-bind="name"></span> — <span data-bind="email"></span>
        <button data-action="toggle">Edit</button>
      </div>
    </template>
    
    <template slot="edit">
      <div>
        <input data-bind="name" placeholder="Name" required />
        <input data-bind="email" placeholder="Email" type="email" required />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </div>
    </template>
  </ck-editable-array>
  
  <button type="submit">Submit Form</button>
</form>

<script type="module">
  import './node_modules/ck-editable-array/dist/ck-editable-array.esm.js';
  
  const form = document.getElementById('myForm');
  const arrayElement = document.getElementById('people');
  
  arrayElement.data = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    // Array data is automatically included as:
    // person[0].name=Alice
    // person[0].email=alice@example.com
    // person[1].name=Bob
    // person[1].email=bob@example.com
    
    console.log('Form data:', Object.fromEntries(formData));
    
    // Submit to server
    fetch(form.action, {
      method: form.method,
      body: formData
    }).then(response => response.json())
      .then(data => console.log('Success:', data));
  });
</script>
```

### JSON Submission

For APIs that expect JSON payloads:

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const arrayElement = document.getElementById('people');
  
  const payload = {
    title: form.querySelector('[name="title"]').value,
    people: arrayElement.data.filter(item => !item._deleted) // Exclude soft-deleted items
  };
  
  try {
    const response = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Saved:', result);
      
      // Update with server response (e.g., IDs)
      arrayElement.data = result.people;
    } else {
      console.error('Save failed:', response.statusText);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
});
```

### Validation Before Submission

Ensure all rows are valid before submitting:

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const arrayElement = document.getElementById('people');
  
  // Check if any rows are in edit mode
  const editingRows = arrayElement.shadowRoot.querySelectorAll('.edit-content:not(.hidden)');
  if (editingRows.length > 0) {
    alert('Please save or cancel all editing rows before submitting.');
    return;
  }
  
  // Check for validation errors
  const errorRows = arrayElement.shadowRoot.querySelectorAll('.display-content.invalid');
  if (errorRows.length > 0) {
    alert('Please fix validation errors before submitting.');
    return;
  }
  
  // Check for empty required fields
  const hasEmptyRequired = arrayElement.data.some(item => {
    return !item.name || !item.email;
  });
  
  if (hasEmptyRequired) {
    alert('All fields are required.');
    return;
  }
  
  // Proceed with submission
  submitForm();
});
```

### Handling Soft-Deleted Items

```javascript
// Option 1: Exclude deleted items from submission
const activeData = arrayElement.data.filter(item => !item._deleted);

// Option 2: Include deleted items with a flag
const allData = arrayElement.data.map(item => ({
  ...item,
  isDeleted: !!item._deleted
}));

// Option 3: Send separate arrays
const payload = {
  active: arrayElement.data.filter(item => !item._deleted),
  deleted: arrayElement.data.filter(item => item._deleted)
};
```

### Optimistic Updates

Update UI immediately, then sync with server:

```javascript
arrayElement.addEventListener('datachanged', async (e) => {
  const { data, action, index } = e.detail;
  
  console.log(`Action: ${action} at index ${index}`);
  
  // Optimistically update UI (already done by component)
  
  // Sync with server in background
  try {
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ people: data })
    });
  } catch (error) {
    console.error('Sync failed:', error);
    // Optionally revert or show error
    alert('Failed to save changes. Please try again.');
  }
});
```

### Debounced Auto-Save

Automatically save changes after a delay:

```javascript
let saveTimeout;

arrayElement.addEventListener('datachanged', (e) => {
  clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(async () => {
    console.log('Auto-saving...');
    
    try {
      await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: e.detail.data })
      });
      
      console.log('Auto-save complete');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 1000); // Save 1 second after last change
});
```

---

## Server-Side Rendering Considerations

While `ck-editable-array` is a client-side web component, it can be used in SSR frameworks with proper hydration strategies.

### Next.js Integration

```javascript
// components/EditableArray.js
import { useEffect, useRef } from 'react';

export default function EditableArray({ initialData, name, children }) {
  const ref = useRef(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import the web component
    import('ck-editable-array').then(() => {
      if (ref.current) {
        ref.current.data = initialData;
      }
    });
  }, [initialData]);
  
  if (!isClient) {
    // Return placeholder during SSR
    return (
      <div className="editable-array-placeholder">
        <div>Loading...</div>
      </div>
    );
  }
  
  return (
    <ck-editable-array ref={ref} name={name}>
      {children}
    </ck-editable-array>
  );
}
```

### Nuxt.js Integration

```vue
<!-- components/EditableArray.vue -->
<template>
  <client-only>
    <ck-editable-array ref="arrayRef" :name="name">
      <slot />
    </ck-editable-array>
  </client-only>
</template>

<script>
export default {
  props: {
    initialData: Array,
    name: String
  },
  mounted() {
    // Import web component only on client
    import('ck-editable-array').then(() => {
      this.$refs.arrayRef.data = this.initialData;
    });
  }
};
</script>
```

### SvelteKit Integration

```svelte
<!-- routes/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let data; // From +page.server.js
  
  let arrayElement;
  let componentLoaded = false;
  
  onMount(async () => {
    if (browser) {
      await import('ck-editable-array');
      componentLoaded = true;
      
      if (arrayElement) {
        arrayElement.data = data.people;
      }
    }
  });
</script>

{#if componentLoaded}
  <ck-editable-array bind:this={arrayElement} name="person">
    <template slot="display">
      <div>
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
      </div>
    </template>
    
    <template slot="edit">
      <div>
        <input data-bind="name" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </div>
    </template>
  </ck-editable-array>
{:else}
  <div>Loading...</div>
{/if}
```

### Hydration Best Practices

**1. Avoid Hydration Mismatches:**
```javascript
// Don't render component during SSR
if (typeof window !== 'undefined') {
  import('ck-editable-array');
}
```

**2. Preserve Initial State:**
```html
<!-- Embed initial data in HTML -->
<script id="initial-data" type="application/json">
  [{"name":"Alice","email":"alice@example.com"}]
</script>

<script type="module">
  import './node_modules/ck-editable-array/dist/ck-editable-array.esm.js';
  
  const initialData = JSON.parse(
    document.getElementById('initial-data').textContent
  );
  
  document.getElementById('people').data = initialData;
</script>
```

**3. Progressive Enhancement:**
```html
<!-- Show static content during SSR -->
<noscript>
  <div class="static-list">
    <div>Alice — alice@example.com</div>
    <div>Bob — bob@example.com</div>
  </div>
</noscript>

<!-- Replace with interactive component on client -->
<ck-editable-array id="people" style="display:none">
  <!-- templates -->
</ck-editable-array>

<script type="module">
  import './node_modules/ck-editable-array/dist/ck-editable-array.esm.js';
  
  const arrayElement = document.getElementById('people');
  arrayElement.style.display = 'block';
  document.querySelector('.static-list')?.remove();
</script>
```

**4. Handle Loading States:**
```javascript
// Show loading indicator until component is ready
const arrayElement = document.getElementById('people');
const loadingIndicator = document.getElementById('loading');

customElements.whenDefined('ck-editable-array').then(() => {
  arrayElement.data = initialData;
  loadingIndicator.style.display = 'none';
  arrayElement.style.display = 'block';
});
```

### SSR Performance Tips

- **Lazy Load**: Only load the component when needed (e.g., on user interaction)
- **Code Splitting**: Bundle the component separately from main application code
- **Preload**: Use `<link rel="modulepreload">` for faster loading
- **Cache**: Cache the component bundle with appropriate headers

```html
<!-- Preload for faster loading -->
<link rel="modulepreload" href="/node_modules/ck-editable-array/dist/ck-editable-array.esm.js">
```

---

## Testing Strategies

Comprehensive testing ensures the component works correctly in your application.

### Unit Testing with Jest

```javascript
// editable-array.test.js
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// Import the component
import 'ck-editable-array';

describe('ck-editable-array', () => {
  let container;
  let element;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    container.innerHTML = `
      <ck-editable-array id="test-array" name="person">
        <template slot="display">
          <div>
            <span data-bind="name" class="name-display"></span>
            <button data-action="toggle">Edit</button>
            <button data-action="delete">Delete</button>
          </div>
        </template>
        
        <template slot="edit">
          <div>
            <input data-bind="name" class="name-input" />
            <button data-action="save">Save</button>
            <button data-action="cancel">Cancel</button>
          </div>
        </template>
      </ck-editable-array>
    `;
    
    element = container.querySelector('#test-array');
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  test('renders initial data', async () => {
    element.data = [{ name: 'Alice' }, { name: 'Bob' }];
    
    await waitFor(() => {
      const shadowRoot = element.shadowRoot;
      const names = shadowRoot.querySelectorAll('.name-display');
      expect(names).toHaveLength(2);
      expect(names[0].textContent).toBe('Alice');
      expect(names[1].textContent).toBe('Bob');
    });
  });
  
  test('adds new item', async () => {
    element.data = [];
    element.newItemFactory = () => ({ name: '' });
    
    const user = userEvent.setup();
    const shadowRoot = element.shadowRoot;
    
    const addButton = shadowRoot.querySelector('[data-action="add"]');
    await user.click(addButton);
    
    await waitFor(() => {
      const input = shadowRoot.querySelector('.name-input');
      expect(input).toBeInTheDocument();
    });
  });
  
  test('edits existing item', async () => {
    element.data = [{ name: 'Alice' }];
    
    const user = userEvent.setup();
    const shadowRoot = element.shadowRoot;
    
    const editButton = shadowRoot.querySelector('[data-action="toggle"]');
    await user.click(editButton);
    
    const input = shadowRoot.querySelector('.name-input');
    await user.clear(input);
    await user.type(input, 'Alice Updated');
    
    const saveButton = shadowRoot.querySelector('[data-action="save"]');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(element.data[0].name).toBe('Alice Updated');
    });
  });
  
  test('emits datachanged event', async () => {
    element.data = [{ name: 'Alice' }];
    
    const handler = jest.fn();
    element.addEventListener('datachanged', handler);
    
    const user = userEvent.setup();
    const shadowRoot = element.shadowRoot;
    
    const editButton = shadowRoot.querySelector('[data-action="toggle"]');
    await user.click(editButton);
    
    const input = shadowRoot.querySelector('.name-input');
    await user.clear(input);
    await user.type(input, 'Alice Updated');
    
    const saveButton = shadowRoot.querySelector('[data-action="save"]');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail.action).toBe('save');
    });
  });
  
  test('validates required fields', async () => {
    element.data = [{ name: 'Alice' }];
    element.schema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 }
      },
      required: ['name']
    };
    
    const user = userEvent.setup();
    const shadowRoot = element.shadowRoot;
    
    const editButton = shadowRoot.querySelector('[data-action="toggle"]');
    await user.click(editButton);
    
    const input = shadowRoot.querySelector('.name-input');
    await user.clear(input);
    
    const saveButton = shadowRoot.querySelector('[data-action="save"]');
    await user.click(saveButton);
    
    await waitFor(() => {
      const errorMessage = shadowRoot.querySelector('.validation-error');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
```

### Integration Testing with Playwright

```javascript
// e2e/editable-array.spec.js
import { test, expect } from '@playwright/test';

test.describe('ck-editable-array integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-comprehensive.html');
  });
  
  test('displays initial data', async ({ page }) => {
    const arrayElement = page.locator('ck-editable-array').first();
    
    // Access shadow DOM
    const shadowRoot = arrayElement.locator('xpath=.');
    const rows = shadowRoot.locator('.display-content');
    
    await expect(rows).toHaveCount(2);
  });
  
  test('adds new item through UI', async ({ page }) => {
    const arrayElement = page.locator('ck-editable-array').first();
    const shadowRoot = arrayElement.locator('xpath=.');
    
    const addButton = shadowRoot.locator('[data-action="add"]');
    await addButton.click();
    
    const nameInput = shadowRoot.locator('input[data-bind="name"]');
    await nameInput.fill('Charlie');
    
    const saveButton = shadowRoot.locator('[data-action="save"]');
    await saveButton.click();
    
    const rows = shadowRoot.locator('.display-content');
    await expect(rows).toHaveCount(3);
  });
  
  test('validates form submission', async ({ page }) => {
    const form = page.locator('form');
    const submitButton = form.locator('button[type="submit"]');
    
    await submitButton.click();
    
    // Check for validation errors
    const errorMessage = page.locator('.validation-error');
    await expect(errorMessage).toBeVisible();
  });
  
  test('keyboard navigation works', async ({ page }) => {
    const arrayElement = page.locator('ck-editable-array').first();
    const shadowRoot = arrayElement.locator('xpath=.');
    
    const firstEditButton = shadowRoot.locator('[data-action="toggle"]').first();
    await firstEditButton.focus();
    await page.keyboard.press('Enter');
    
    const nameInput = shadowRoot.locator('input[data-bind="name"]');
    await expect(nameInput).toBeFocused();
  });
});
```

### Accessibility Testing

```javascript
// a11y.test.js
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('accessibility', () => {
  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/demo-comprehensive.html');
    await injectAxe(page);
    
    await checkA11y(page, 'ck-editable-array', {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('announces changes to screen readers', async ({ page }) => {
    await page.goto('/demo-comprehensive.html');
    
    const arrayElement = page.locator('ck-editable-array').first();
    const shadowRoot = arrayElement.locator('xpath=.');
    
    const liveRegion = shadowRoot.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
    
    const addButton = shadowRoot.locator('[data-action="add"]');
    await addButton.click();
    
    await expect(liveRegion).toContainText('New item added');
  });
});
```

### Testing Best Practices

**1. Test User Interactions:**
- Focus on user workflows, not implementation details
- Test keyboard navigation and screen reader support
- Verify form submission and validation

**2. Test Shadow DOM:**
```javascript
// Access shadow DOM in tests
const shadowRoot = element.shadowRoot;
const button = shadowRoot.querySelector('[data-action="save"]');
```

**3. Test Events:**
```javascript
// Listen for custom events
const handler = jest.fn();
element.addEventListener('datachanged', handler);

// Trigger action
// ...

expect(handler).toHaveBeenCalledWith(
  expect.objectContaining({
    detail: expect.objectContaining({
      action: 'save',
      data: expect.any(Array)
    })
  })
);
```

**4. Test Validation:**
```javascript
// Set up validation schema
element.schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 }
  },
  required: ['name']
};

// Trigger validation
// ...

// Check for error messages
const errorElement = shadowRoot.querySelector('.validation-error');
expect(errorElement).toBeVisible();
```

**5. Mock External Dependencies:**
```javascript
// Mock fetch for form submission tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);
```

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

## Common Issues

This section covers common problems and their solutions when working with `ck-editable-array`.

### Issue 1: Data Not Updating in UI

**Problem:**
```javascript
const data = el.data;
data[0].name = 'Changed';
// UI doesn't update
```

**Cause:** The component uses immutable data patterns and only updates when the `data` property is reassigned.

**Solution:**
```javascript
// Option 1: Reassign the data property
const data = el.data;
data[0].name = 'Changed';
el.data = data;

// Option 2: Use spread operator for immutability
el.data = el.data.map((item, index) => 
  index === 0 ? { ...item, name: 'Changed' } : item
);

// Option 3: Create new array
el.data = [...el.data];
```

### Issue 2: Events Not Firing

**Problem:**
```javascript
el.addEventListener('datachanged', handler);
// Handler not called when data changes
```

**Cause:** Event listener was added before the element was connected to the DOM, or the component wasn't fully initialized.

**Solution:**
```javascript
// Option 1: Ensure element is in DOM first
document.body.appendChild(el);
el.addEventListener('datachanged', handler);
el.data = [{ name: 'Alice' }];

// Option 2: Wait for component to be defined
customElements.whenDefined('ck-editable-array').then(() => {
  el.addEventListener('datachanged', handler);
  el.data = [{ name: 'Alice' }];
});

// Option 3: Use connectedCallback in custom wrapper
class MyWrapper extends HTMLElement {
  connectedCallback() {
    const arrayEl = this.querySelector('ck-editable-array');
    arrayEl.addEventListener('datachanged', this.handleChange);
  }
}
```

### Issue 3: Validation Not Working

**Problem:**
```javascript
el.schema = { required: ['name'] };
// Validation doesn't run or shows no errors
```

**Cause:** The schema format doesn't match the expected JSON Schema structure.

**Solution:**
```javascript
// Correct schema format
el.schema = {
  type: 'object',
  properties: {
    name: { 
      type: 'string', 
      minLength: 1 
    },
    email: {
      type: 'string',
      minLength: 1,
      pattern: '^[^@]+@[^@]+\\.[^@]+$' // Email pattern
    }
  },
  required: ['name', 'email']
};

// For nested properties
el.schema = {
  type: 'object',
  properties: {
    'address.city': { type: 'string', minLength: 1 },
    'address.zip': { type: 'string', minLength: 5 }
  },
  required: ['address.city']
};
```

### Issue 4: Styles Not Applied to Shadow DOM

**Problem:**
```html
<style>
  .display-content { color: red; }
</style>
<ck-editable-array>
  <!-- Styles don't apply -->
</ck-editable-array>
```

**Cause:** Shadow DOM encapsulation prevents external styles from affecting internal elements.

**Solution:**
```html
<!-- Option 1: Use styles slot -->
<ck-editable-array>
  <style slot="styles">
    .display-content { color: red; }
    .edit-content { background: #f0f0f0; }
  </style>
</ck-editable-array>

<!-- Option 2: Use CSS custom properties (if supported) -->
<style>
  ck-editable-array {
    --row-background: #f0f0f0;
    --row-border: 1px solid #ccc;
  }
</style>

<!-- Option 3: Use ::part() for exposed parts -->
<style>
  ck-editable-array::part(root) {
    border: 1px solid #ccc;
  }
</style>
```

### Issue 5: Templates Not Rendering

**Problem:**
```html
<ck-editable-array>
  <template slot="display">
    <div data-bind="name"></div>
  </template>
</ck-editable-array>
<!-- Nothing renders -->
```

**Cause:** Missing data or incorrect template structure.

**Solution:**
```javascript
// Ensure data is set
const el = document.querySelector('ck-editable-array');
el.data = [{ name: 'Alice' }]; // Must have data

// Ensure template has correct structure
// - Must use slot="display" and slot="edit"
// - Must use data-bind attributes
// - Must have proper HTML structure
```

### Issue 6: Form Submission Not Including Array Data

**Problem:**
```html
<form>
  <ck-editable-array name="person">
    <!-- ... -->
  </ck-editable-array>
  <button type="submit">Submit</button>
</form>
<!-- FormData doesn't include array data -->
```

**Cause:** The `name` attribute is missing or the form is submitted before data is synced.

**Solution:**
```html
<!-- Ensure name attribute is set -->
<ck-editable-array name="person">
  <!-- ... -->
</ck-editable-array>

<script>
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    // Array data is automatically included as:
    // person[0].name=Alice
    // person[1].name=Bob
    
    // Or get data directly
    const arrayEl = form.querySelector('ck-editable-array');
    const arrayData = arrayEl.data;
  });
</script>
```

### Issue 7: Nested Property Binding Not Working

**Problem:**
```html
<template slot="display">
  <span data-bind="address.city"></span>
  <!-- Shows nothing -->
</template>
```

**Cause:** Nested properties require proper data structure.

**Solution:**
```javascript
// Ensure data has nested structure
el.data = [
  { 
    name: 'Alice',
    address: {
      city: 'New York',
      zip: '10001'
    }
  }
];

// Template will now work
<template slot="display">
  <span data-bind="address.city"></span>
  <span data-bind="address.zip"></span>
</template>
```

### Issue 8: Memory Leaks with Event Listeners

**Problem:**
```javascript
// Adding listeners without cleanup
el.addEventListener('datachanged', handler);
// Component is removed but listener remains
```

**Cause:** Event listeners not removed when component is destroyed.

**Solution:**
```javascript
// Option 1: Remove listeners explicitly
const handler = (e) => console.log(e.detail);
el.addEventListener('datachanged', handler);

// Later, when cleaning up
el.removeEventListener('datachanged', handler);

// Option 2: Use AbortController (modern approach)
const controller = new AbortController();
el.addEventListener('datachanged', handler, { 
  signal: controller.signal 
});

// Later, when cleaning up
controller.abort();

// Option 3: In framework components
// React
useEffect(() => {
  const handler = (e) => console.log(e.detail);
  ref.current.addEventListener('datachanged', handler);
  
  return () => {
    ref.current.removeEventListener('datachanged', handler);
  };
}, []);

// Vue
mounted() {
  this.$refs.array.addEventListener('datachanged', this.handler);
},
beforeUnmount() {
  this.$refs.array.removeEventListener('datachanged', this.handler);
}
```

### Issue 9: Readonly Mode Not Working

**Problem:**
```html
<ck-editable-array readonly>
  <!-- Edit buttons still appear -->
</ck-editable-array>
```

**Cause:** The `readonly` attribute is a boolean attribute that needs proper handling.

**Solution:**
```javascript
// Set readonly programmatically
el.readonly = true;

// Or use attribute
el.setAttribute('readonly', '');

// Remove readonly
el.readonly = false;
el.removeAttribute('readonly');

// Check readonly state
if (el.readonly) {
  console.log('Component is readonly');
}
```

### Issue 10: Performance Issues with Large Datasets

**Problem:**
```javascript
el.data = largeArray; // 1000+ items
// UI becomes slow or unresponsive
```

**Cause:** Rendering many rows at once can be expensive.

**Solution:**
```javascript
// Option 1: Implement pagination
const pageSize = 50;
let currentPage = 0;

function loadPage(page) {
  const start = page * pageSize;
  const end = start + pageSize;
  el.data = largeArray.slice(start, end);
}

// Option 2: Use virtual scrolling (custom implementation)
// Only render visible rows

// Option 3: Lazy load data
async function loadData() {
  const response = await fetch('/api/data?limit=50');
  const data = await response.json();
  el.data = data;
}

// Option 4: Optimize templates
// - Minimize DOM nodes in templates
// - Avoid complex CSS selectors
// - Use simple data-bind expressions
```

### Issue 11: TypeScript Type Errors

**Problem:**
```typescript
const el = document.querySelector('ck-editable-array');
el.data = [{ name: 'Alice' }]; // Type error
```

**Cause:** TypeScript doesn't know about the custom element's properties.

**Solution:**
```typescript
// Option 1: Type assertion
import { CkEditableArray } from 'ck-editable-array';

const el = document.querySelector('ck-editable-array') as CkEditableArray;
el.data = [{ name: 'Alice' }];

// Option 2: Declare custom element types
declare global {
  interface HTMLElementTagNameMap {
    'ck-editable-array': CkEditableArray;
  }
}

// Option 3: Use typed selector
function getEditableArray(selector: string): CkEditableArray | null {
  return document.querySelector(selector) as CkEditableArray | null;
}

const el = getEditableArray('#myArray');
if (el) {
  el.data = [{ name: 'Alice' }];
}
```

### Issue 12: Soft-Deleted Items Reappearing

**Problem:**
```javascript
el.data = [{ name: 'Alice', _deleted: true }];
// Item shows as deleted, but reappears after edit
```

**Cause:** The `_deleted` flag is not preserved during data operations.

**Solution:**
```javascript
// Ensure _deleted flag is preserved
el.addEventListener('datachanged', (e) => {
  const data = e.detail.data;
  
  // Filter out deleted items before saving
  const activeData = data.filter(item => !item._deleted);
  
  // Or preserve deleted items with flag
  saveToServer(data); // Server handles _deleted flag
});

// Restore deleted item
const data = el.data;
data[0]._deleted = false;
el.data = [...data]; // Trigger update
```

### Debugging Tips

**1. Inspect Shadow DOM:**
```javascript
// Access shadow DOM in console
const el = document.querySelector('ck-editable-array');
console.log(el.shadowRoot);

// Query shadow DOM
const rows = el.shadowRoot.querySelectorAll('.display-content');
console.log(rows);
```

**2. Monitor Events:**
```javascript
// Log all events
['datachanged', 'beforetogglemode', 'aftertogglemode'].forEach(eventName => {
  el.addEventListener(eventName, (e) => {
    console.log(`Event: ${eventName}`, e.detail);
  });
});
```

**3. Check Data State:**
```javascript
// Inspect current data
console.log('Current data:', el.data);
console.log('Schema:', el.schema);
console.log('Readonly:', el.readonly);
```

**4. Validate Templates:**
```javascript
// Check if templates are present
const displayTemplate = el.querySelector('template[slot="display"]');
const editTemplate = el.querySelector('template[slot="edit"]');

console.log('Display template:', displayTemplate);
console.log('Edit template:', editTemplate);
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
