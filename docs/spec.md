# CkEditableArray Component Specification

## Overview

`CkEditableArray` is a web component for managing and displaying editable arrays with a clean, modern UI. It provides both attribute and property-based APIs for integration into web applications.

## Public API

### Properties

#### `name: string`
- **Type**: String
- **Default**: "World"
- **Description**: The name displayed in the greeting message
- **Getter**: Returns the current name
- **Setter**: Updates the name via attribute
- **Synced with Attribute**: Yes (`name` attribute)
- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');
  element.name = 'Developer'; // Setter
  console.log(element.name);   // Getter → "Developer"
  ```

#### `rootClass: string`
- **Type**: String
- **Default**: `""`
- **Description**: Space-separated classes added to the generated root wrapper element inside the shadow DOM
- **Getter**: Returns the current `root-class` value
- **Setter**: Updates the `root-class` attribute
- **Synced with Attribute**: Yes (`root-class` attribute)

#### `rowsClass: string`
- **Type**: String
- **Default**: `""`
- **Description**: Space-separated classes added to the generated rows wrapper element inside the shadow DOM
- **Getter**: Returns the current `rows-class` value
- **Setter**: Updates the `rows-class` attribute
- **Synced with Attribute**: Yes (`rows-class` attribute)

#### `rowClass: string`
- **Type**: String
- **Default**: `""`
- **Description**: Space-separated classes added to each generated row wrapper element inside the shadow DOM
- **Getter**: Returns the current `row-class` value
- **Setter**: Updates the `row-class` attribute
- **Synced with Attribute**: Yes (`row-class` attribute)

#### `data: unknown[]`
- **Type**: Array (any elements)
- **Default**: `[]` (empty array)
- **Description**: The data array for the editable content
- **Getter**: Returns a deep clone of the internal data
- **Setter**: Accepts array; normalizes non-arrays to `[]`; stores deep clone internally
- **Normalization**:
  - If value is an array → stored as-is (after cloning)
  - If value is `null`, `undefined`, or non-array → normalized to `[]`
  - **Examples**:
    - `element.data = null` → `element.data` becomes `[]`
    - `element.data = "string"` → `element.data` becomes `[]`
    - `element.data = 123` → `element.data` becomes `[]`
    - `element.data = {}` → `element.data` becomes `[]`
    - `element.data = [1, 2, 3]` → `element.data` is `[1, 2, 3]`

- **Deep Cloning**:
  - **On Set**: Input data is deep cloned before storage
  - **On Get**: Returned data is a deep clone of internal state
  - **Cloning Strategy**:
    - Primary: `structuredClone()` (when available in modern browsers)
    - Fallback: JSON serialization (`JSON.stringify` + `JSON.parse`) for older browsers
    - Ensures immutability: mutations to returned/input data do not affect component state

- **Example**:
  ```javascript
  const element = document.querySelector('ck-editable-array');

  // Set data
  const originalData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
  element.data = originalData;

  // Get data (returns a deep clone)
  const clonedData = element.data;

  // Modify the cloned data
  clonedData[0].name = 'Modified';
  clonedData.push({ id: 3, name: 'Item 3' });

  // Original internal state is unchanged
  console.log(element.data[0].name);     // → "Item 1" (unchanged)
  console.log(element.data.length);      // → 2 (unchanged)

  // Modify the original input data
  originalData[0].name = 'Changed';

  // Component data is still unchanged (was cloned on set)
  console.log(element.data[0].name);     // → "Item 1" (unchanged)
  ```

### Attributes

| Attribute | Type   | Default | Synced with Property | Description                    |
|-----------|--------|---------|----------------------|--------------------------------|
| `name`    | string | "World" | Yes (`name` prop)    | The name displayed in greeting |
| `root-class` | string | "" | Yes (`rootClass` prop) | Classes added to the generated root wrapper |
| `rows-class` | string | "" | Yes (`rowsClass` prop) | Classes added to the generated rows wrapper |
| `row-class`  | string | "" | Yes (`rowClass` prop)  | Classes added to each generated row wrapper |

**Note**: The `data` property is not exposed as an attribute (arrays cannot be directly expressed in HTML attributes).

### Methods

Currently, the component does not expose additional methods beyond the standard HTMLElement interface.

## Events

### `datachanged`

Dispatched whenever the `data` property is set.

- **Type**: `CustomEvent`
- **Name**: `datachanged`
- **Bubbles**: Yes
- **Composed**: Yes
- **Detail**: `{ data: unknown[] }` (a deep clone of the internal data)

Example:
```js
el.addEventListener('datachanged', (e) => {
  console.log(e.detail.data);
});
```

## Styling

### Shadow DOM Styles

The component uses the Constructable Stylesheet pattern for styling (with a fallback to `<style>` tags in older browsers).

#### CSS Custom Properties

The component exposes styling hooks via CSS custom properties (see `src/components/ck-editable-array/ck-editable-array.styles.ts`).

#### Classes

- `.ck-editable-array`: Main container
- `.message`: The greeting message heading
- `.subtitle`: The subtitle text
- `.rows`: Rows container (holds generated row wrappers)
- `.row`: Generated row wrapper (holds cloned template content)
- `.empty-state`: Empty state message (rendered when no display template exists)

#### Example Custom Styling

```css
ck-editable-array::part(...) {
  /* Shadow DOM parts not yet exposed; use CSS variables */
}

ck-editable-array {
  --cea-message-color: #ff6b6b;
}
```

## Accessibility

The component renders semantic HTML (`<h1>`, `<p>`) for better screen reader support. Future versions may add ARIA attributes and keyboard navigation for interactive features.

## Light DOM Display Template

Consumers can provide a light DOM template to control what the component renders in its “display” region.

### Template Contract

- The component looks for a descendant `HTMLTemplateElement` matching: `<template slot="display">...</template>`.
- The template is treated as a **row template**: it is cloned once for each item in the `data` array.
- The component renders rows into a container with `part="rows"`, clearing it on each render.
- If the template is missing, the component renders a helpful empty state in the shadow DOM rows region (instructions for adding the template).

### Data Binding (`data-bind`)

Within the template, any element with a `data-bind` attribute will have its `textContent` set from the current row’s data.

- `data-bind="person.address.city"` resolves a dot-path against the row object.
- If the resolved value is an array, it is joined with `", "`.
- If the resolved value is `null`/`undefined`/missing, an empty string is rendered.
- Binding sets `textContent` (never `innerHTML`).

### Notes

- The template is treated as trusted markup supplied by the page author; avoid including `<script>` in the template.
- Wrapper class attributes (`root-class`, `rows-class`, `row-class`) apply to generated wrapper elements only; the template markup is not modified.
- Wrapper class selectors only apply within the component’s Shadow DOM; style via CSS custom properties / `::part(rows)`, or include a `<style>` inside the `display` template when targeting wrapper classes is required.

## Browser Support

- Modern browsers with Shadow DOM v1 support
- Graceful fallback for Constructable Stylesheet (uses `<style>` tags)
- `structuredClone()` available in modern browsers; JSON fallback for older browsers

## Implementation Notes

### Rendering Pipeline

1. **connectedCallback**: Triggered when element is inserted into the DOM
   - Calls `render()`

2. **attributeChangedCallback**: Triggered when observed attributes change
   - Calls `render()` if value differs from old value

3. **render()**: Updates shadow DOM content
   - Renders greeting message with current name

### State Management

- Internal state: `_data` (private array field)
- Public access: `get data()` / `set data(value)` with deep cloning

### Performance Considerations

- Deep cloning on every get/set may impact performance with large datasets
- Constructable Stylesheets are parsed once at module load time (efficient)
- Shadow DOM encapsulation prevents style leakage
