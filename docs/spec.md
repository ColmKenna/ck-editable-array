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

#### `color: string`
- **Type**: String
- **Default**: "#333"
- **Description**: The text color for the message
- **Getter**: Returns the current color
- **Setter**: Updates the color via attribute
- **Synced with Attribute**: Yes (`color` attribute)
- **Example**:
  ```javascript
  element.color = '#ff6b6b';
  console.log(element.color); // → "#ff6b6b"
  ```

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
| `color`   | string | "#333"  | Yes (`color` prop)   | Text color for the message     |

**Note**: The `data` property is not exposed as an attribute (arrays cannot be directly expressed in HTML attributes).

### Methods

Currently, the component does not expose additional methods beyond the standard HTMLElement interface.

## Events

Currently, the component does not emit custom events. Future versions may emit events on data changes.

## Styling

### Shadow DOM Styles

The component uses the Constructable Stylesheet pattern for styling (with a fallback to `<style>` tags in older browsers).

#### CSS Custom Properties

- `--cea-color`: Controls text color (set via the `color` property)

#### Classes

- `.ck-editable-array`: Main container
- `.message`: The greeting message heading
- `.subtitle`: The subtitle text

#### Example Custom Styling

```css
ck-editable-array::part(...) {
  /* Shadow DOM parts not yet exposed; use CSS variables */
}

ck-editable-array {
  --cea-color: #ff6b6b;
}
```

## Accessibility

The component renders semantic HTML (`<h1>`, `<p>`) for better screen reader support. Future versions may add ARIA attributes and keyboard navigation for interactive features.

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
   - Applies per-instance color via CSS custom property
   - Renders greeting message with current name and color

### State Management

- Internal state: `_data` (private array field)
- Public access: `get data()` / `set data(value)` with deep cloning

### Performance Considerations

- Deep cloning on every get/set may impact performance with large datasets
- Constructable Stylesheets are parsed once at module load time (efficient)
- Shadow DOM encapsulation prevents style leakage

