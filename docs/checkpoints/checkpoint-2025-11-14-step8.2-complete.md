# Checkpoint: Step 8.2 Complete — Deep vs Shallow Clone Behaviour

**Date**: 2025-11-14  
**Status**: ✅ All tests passing (142 tests total)

## Summary

Step 8.2 extends the component's data cloning capabilities to support nested object structures with deep cloning and nested property path binding. The component now provides strong immutability guarantees for nested data while allowing users to bind to and edit nested properties using dot notation.

## Features Implemented

### 1. Deep Cloning for Nested Objects
- Nested objects are fully cloned using `JSON.parse(JSON.stringify())`
- External mutations to nested properties don't leak into component
- Protects against mutations at any depth level
- Example: Mutating `source[0].person.name` after assignment doesn't affect `el.data`

### 2. Nested Property Path Support
- `data-bind` attributes support dot notation for nested properties
- Example: `data-bind="person.name"` binds to `data[i].person.name`
- Works in both display and edit templates
- Supports arbitrary nesting depth (e.g., `address.city.name`)

### 3. Nested Property Resolution
- Enhanced `resolveBindingValue()` to traverse nested objects
- Splits keys by `.` and navigates through object hierarchy
- Returns empty string if any part of the path is missing
- Handles null/undefined values gracefully at any level

### 4. Nested Property Updates
- Enhanced `commitRowValue()` to update nested properties
- Navigates to parent object and sets leaf property
- Creates missing intermediate objects if path doesn't exist
- Maintains immutability by cloning nested objects during update

## Test Coverage

### Test 8.2.1 — Nested objects are cloned so external mutations do not leak in
✅ **PASS**: Given a nested structure `[{ person: { name: "Alice" } }]`, when assigned to `el.data` and then mutated externally, the component's internal data and UI remain unchanged.

### Test 8.2.2 — Editing via UI updates nested values in el.data
✅ **PASS**: Given a row bound to nested structure, when toggling to edit mode and changing a nested field via UI, the changes are properly committed to the nested property in `el.data`.

### Test 8.3.1 — Soft delete sets deleted flag without affecting previous data snapshots
✅ **PASS**: Given initial data with `deleted: false`, when clicking Delete, the current data shows `deleted: true` while cached copies remain unchanged (immutability).

### Test 8.3.2 — Restoring a row flips deleted flag back cleanly
✅ **PASS**: Given a row with `deleted: true`, when clicking Restore, the data shows `deleted: false` and the visual deleted styling disappears.

## Implementation Details

### Enhanced Methods

#### `resolveBindingValue(data, key)`
```typescript
// Before: Only supported flat properties
const raw = data[key];

// After: Supports nested paths
const keys = key.split('.');
let value: unknown = data;
for (const k of keys) {
  if (value && typeof value === 'object' && k in value) {
    value = (value as Record<string, unknown>)[k];
  } else {
    return '';
  }
}
```

#### `commitRowValue(rowIndex, key, nextValue)`
```typescript
// Before: Only supported flat properties
target[key] = normalizedNext;

// After: Supports nested paths
const keys = key.split('.');
if (keys.length === 1) {
  // Simple property
  target[key] = normalizedNext;
} else {
  // Nested property - navigate to parent and set leaf
  let current: unknown = target;
  for (let i = 0; i < keys.length - 1; i++) {
    // Navigate and clone nested objects
  }
  // Set the leaf property
}
```

## Use Cases

### Complex Data Structures
```javascript
el.data = [
  {
    person: { name: 'Alice', email: 'alice@example.com' },
    address: { city: 'New York', zip: '10001' }
  }
];
```

### Nested Form Fields
```html
<template slot="edit">
  <input data-bind="person.name" />
  <input data-bind="person.email" />
  <input data-bind="address.city" />
  <input data-bind="address.zip" />
</template>
```

### Deep Object Editing
```html
<template slot="display">
  <span data-bind="contact.phone.mobile"></span>
  <span data-bind="contact.phone.home"></span>
</template>
```

## Immutability Guarantees

### External Mutation Protection
```javascript
const source = [{ person: { name: 'Alice' } }];
el.data = source;
source[0].person.name = 'Mutated'; // Component still shows 'Alice'
```

### Read-Only Data
```javascript
const current = el.data;
current[0].person.name = 'Changed'; // UI still shows original value
```

### Explicit Updates
```javascript
el.data = current; // Now UI shows 'Changed'
```

## Limitations

The deep cloning mechanism uses JSON serialization, which has some limitations:

- **Functions**: Not supported (will be omitted)
- **Symbols**: Not supported (will be omitted)
- **Circular references**: Will cause errors
- **Date objects**: Converted to strings
- **Undefined values**: Converted to null
- **Performance**: Consideration for very large or deeply nested objects

For most use cases involving form data and simple objects, these limitations are not a concern.

## Files Modified

### Source Code
- `src/components/ck-editable-array/ck-editable-array.ts`
  - Enhanced `resolveBindingValue()` for nested property resolution
  - Enhanced `commitRowValue()` for nested property updates

### Tests
- `tests/ck-editable-array/ck-editable-array.step8.cloning.test.ts`
  - Added Test 8.2.1: Nested objects are cloned
  - Added Test 8.2.2: Editing via UI updates nested values

### Documentation
- `docs/steps.md` — Added Step 8.2 entry
- `docs/spec.md` — Added Step 8.2 specification
- `docs/README.md` — Added nested property support section
- `docs/checkpoint-2025-11-14-step8.2-complete.md` — This checkpoint

## Test Results

```
Test Suites: 9 passed, 9 total
Tests:       144 passed, 144 total
Snapshots:   0 total
Time:        ~7s
```

All tests passing, including:
- 4 tests from Step 8.1 (immutability guarantees)
- 2 tests from Step 8.2 (nested object cloning)
- 2 tests from Step 8.3 (deleted flag consistency)
- All 136 previous tests (Steps 1-7)

## Next Steps

Step 8 is now complete with comprehensive data cloning and immutability guarantees. Potential future enhancements:

1. **Custom Clone Function**: Allow users to provide custom cloning logic for special data types
2. **Array Property Paths**: Support array indices in paths (e.g., `items[0].name`)
3. **Performance Optimization**: Consider structured cloning API for better performance
4. **Validation for Nested Properties**: Extend schema validation to support nested property constraints

## Design Decisions

### Why JSON.parse(JSON.stringify())?
- Simple and reliable deep cloning
- Works for common data structures (objects, arrays, primitives)
- No external dependencies
- Predictable behavior
- Good enough for form data use cases

### Why Dot Notation?
- Familiar syntax from JavaScript property access
- Easy to understand and use
- Consistent with common templating libraries
- Simple to parse and implement

### Why Immutable Updates?
- Prevents accidental data corruption
- Makes data flow predictable
- Enables time-travel debugging
- Follows React/Redux patterns
- Safer for concurrent operations

## Conclusion

Step 8.2 successfully extends the component's data handling capabilities to support nested object structures with strong immutability guarantees. The implementation is clean, well-tested, and maintains backward compatibility with existing flat data structures.
