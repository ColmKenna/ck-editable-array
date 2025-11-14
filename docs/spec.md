# ck-editable-array specification

## P1 – Basic render: internal array ↔ UI sync
- Given an initial array such as `["A", "B", "C"]`, the component clones the provided light-DOM templates for both `slot="display"` and `slot="edit"`.
- Each row receives `data-row` and `data-mode` attributes and populates `[data-bind]` nodes so display text and edit inputs mirror the internal array.

## P2 – Initialization with empty array
- Setting `data = []` renders no editable rows and leaves `data` as an empty array.
- No `datachanged` event fires because nothing was edited yet.

## P3 – Initialization with null/undefined
- Passing `null` or `undefined` to `data` normalizes to an empty array.
- Rendering proceeds safely without throwing and without emitting `datachanged`.

## P4 – Edit existing item
- Editing an input tied to `[data-bind]` updates the corresponding entry inside `data`.
- The component re-renders the row, keeping display/edit DOM in sync, and dispatches `datachanged` with the latest array snapshot.

## P5 – Single-element edit
- Single-row arrays behave the same as multi-row arrays; editing the only input rewrites `data[0]` and raises `datachanged` with the new single-element array.

## Event contract

### datachanged Event
- Bubbles: `true`
- Composed: `true`
- Cancelable: `false`
- Detail payload: `{ data: Array<EditableRow> }`
  - Contains complete current array (deep cloned)
  - Mutating `event.detail.data` does not affect component state
- Fires when: user edits, save, add, delete, restore, toggle mode
- Does NOT fire on: initial connect, programmatic `data` setter (unless already connected)

### beforetogglemode Event
- Bubbles: `true`
- Composed: `true`
- Cancelable: `true`
- Detail payload: `{ index: number, from: 'display' | 'edit', to: 'display' | 'edit' }`
  - `index`: Row being toggled
  - `from`: Current mode before transition
  - `to`: Target mode after transition
- Fires when: toggle button clicked (before mode change)
- Calling `preventDefault()` blocks the mode transition

### aftertogglemode Event
- Bubbles: `true`
- Composed: `true`
- Cancelable: `false`
- Detail payload: `{ index: number, mode: 'display' | 'edit' }`
  - `index`: Row that toggled
  - `mode`: Final mode (after transition complete)
  - Does NOT include `from`/`to` (transition already done)
- Fires when: mode toggle completes successfully


## Step 4 – Core Rendering & Row Modes

### Row Creation & Attributes
- Each data item renders as a distinct row element in the shadow DOM
- Rows receive `data-row` attributes with zero-based indices (0, 1, 2, ...)
- Both display and edit templates are instantiated for each item

### Row Mode Marking
- Display rows have `data-mode="display"` attribute
- Edit rows have `data-mode="edit"` attribute
- Mode attributes enable CSS targeting and programmatic row selection

### Deleted Item Marking
- Items with `deleted: true` property receive `data-deleted="true"` attribute
- Marker applies to both display and edit row elements
- Non-deleted items have no data-deleted attribute
- Enables visual styling, filtering, and special handling of deleted items

### Slot & Wrapper Wiring
- Each row's content is wrapped in dedicated container divs
- Display template content is wrapped in `.display-content` div
- Edit template content is wrapped in `.edit-content` div
- Wrappers carry row metadata attributes (`data-row`, `data-mode`, `data-deleted`)
- Template content is cloned and appended inside the appropriate wrapper
- Enables consistent structure for styling and DOM manipulation

### Display vs Edit Visibility
- Visibility is controlled via the `hidden` CSS class
- By default, rows are in display mode: `.display-content` visible, `.edit-content` has `hidden` class
- When a row has `editing: true` property: `.edit-content` visible, `.display-content` has `hidden` class
- Each row independently controls its own visibility state
- Multiple rows can be in different modes simultaneously
- The `hidden` class enables CSS-based show/hide without JavaScript manipulation

### Toggle Button Surface
- Toggle controls are provided via template content (not component-generated)
- Toggle buttons use `data-action="toggle"` attribute for identification
- In display mode: toggle controls are visible and focusable
- In edit mode: toggle controls are hidden (via parent wrapper's `hidden` class)
- Edit controls (save/cancel) use `data-action="save"` and `data-action="cancel"` attributes
- Edit controls are visible when row is in edit mode
- Control visibility is managed through wrapper-level `hidden` class application

### Input Naming & Binding
- Edit inputs automatically receive `name` attributes for form submission
- Naming pattern: `{componentName}[{rowIndex}].{fieldName}` (e.g., `person[0].address1`)
- Component's `name` attribute provides the base name for all inputs
- Display bindings use `data-bind` attribute to map to data properties
- Display text correctly reflects current data values
- Empty, null, or undefined fields render as empty strings (not "null" or "undefined" text)
- Binding logic handles missing properties gracefully


## Step 5.1 – Add Button Surface & Defaults

### Default Add Button
- When no custom `<template slot="add-button">` is provided, a default Add button is rendered
- Default button has `data-action="add"` attribute for identification
- Default button has `type="button"` to prevent accidental form submission
- Default button text is "Add"
- Button is rendered in the `[part="add-button"]` container

### Custom Add Button Template
- Users can provide a custom `<template slot="add-button">` in light DOM
- Custom template content is cloned and rendered instead of the default button
- Only one Add button is rendered (custom template replaces default)
- Custom buttons should include `data-action="add"` for consistency

### Button Semantics
- Add button is a semantic `<button>` element
- Button has `type="button"` to prevent form submission in outer forms
- Button is enabled and focusable by default

### Readonly State
- When component has `readonly` attribute, Add button is disabled
- Applies to both default and custom Add buttons
- Prevents users from adding new rows when in readonly mode


## Step 5.2 – Add Button Click Behavior & New Row Creation

### Click Handler
- Add button has click event handler attached during rendering
- Click handler is attached to both default and custom Add buttons
- Handler checks for readonly state before proceeding

### New Row Creation
- Clicking Add button creates a new item using `newItemFactory()`
- New item is automatically marked with `editing: true` property
- New item is appended to the end of the data array
- Component re-renders to show the new row

### Data Updates
- Internal `_data` array is updated with the new item
- Public `data` getter returns the updated array including the new item
- First items in array remain unchanged (new item is appended)

### Event Dispatch
- Clicking Add triggers exactly one `datachanged` event
- Event detail contains the complete updated data array
- Event includes the new item with `editing: true` property

### Readonly Behavior
- Add button click handler respects readonly state
- No new row is created when component is readonly
- No datachanged event is fired when readonly


## Step 5.3 – New Row Starts in Edit Mode

### Edit Mode Rendering
- New rows created via Add button are automatically in edit mode
- New row has `editing: true` property set by `handleAddClick()`
- Component's rendering logic respects the `editing` property

### Visibility States
- **New Row Display Content**: Has `hidden` class applied (not visible)
- **New Row Edit Content**: No `hidden` class (visible and interactive)
- **Existing Rows**: Remain in their current mode (typically display mode)

### Control Visibility
- **Toggle Control**: Hidden for new rows (inside hidden display wrapper)
- **Edit Actions**: Visible for new rows (Save/Cancel buttons in edit wrapper)
- **Existing Row Controls**: Unchanged (toggle visible in display mode)

### Mode Attributes
- New row's display wrapper: `data-mode="display"` with `hidden` class
- New row's edit wrapper: `data-mode="edit"` without `hidden` class
- Existing rows maintain their current `data-mode` and visibility states

### User Experience
- User can immediately start editing the new row
- Edit inputs are accessible and not disabled
- Save/Cancel actions are available to commit or discard changes
- Existing rows remain unaffected by adding new row


## Step 5.4 – Exclusive Locking When a New Row is Editing

### Locking Detection
- Component detects if any row has `editing: true` property
- Detection happens during render phase
- Applies to both display and edit mode wrappers

### Locked Row Attributes
When a row is locked (another row is editing):
- **data-locked="true"**: Marks the row as locked
- **aria-disabled="true"**: Indicates disabled state for assistive technologies
- **inert**: Prevents all interactions with the row (clicks, focus, etc.)

### Toggle Control Disabling
- Toggle buttons in locked rows have `disabled` attribute set
- Clicking disabled toggle has no effect
- Row remains in display mode when toggle is clicked
- Only the editing row can be interacted with

### Add Button Disabling
When any row is in edit mode:
- Add button has `disabled` attribute set
- Add button has `aria-disabled="true"` for accessibility
- Clicking disabled Add button has no effect
- No new rows can be added until editing is complete

### Click Handler Protection
- `handleAddClick()` checks for editing rows before proceeding
- Returns early if any row is editing
- Prevents data array mutation when locked
- No event dispatch when locked

### User Experience
- Only one row can be edited at a time
- Other rows are visually and functionally locked
- Add button is disabled during editing
- Clear visual feedback of locked state
- Prevents data conflicts and race conditions

### Accessibility
- ARIA attributes properly indicate disabled state
- Inert attribute prevents keyboard navigation to locked rows
- Screen readers announce disabled state
- Maintains focus management during locking


## Step 5.5 – Releasing the Lock After Edit Ends

### Lock Release Mechanism
- Locking state is re-evaluated on every render
- Based on presence of `editing: true` in data array
- No explicit "unlock" method needed
- Automatic and reactive

### When Row Exits Edit Mode
When a row's `editing` property is removed or set to `false`:
- Row switches to display mode (display visible, edit hidden)
- Other rows lose locked markers (data-locked, aria-disabled, inert removed)
- Toggle controls on other rows become enabled
- Add button becomes enabled
- Component returns to normal interactive state

### Subsequent Add Operations
After a row exits edit mode:
- Add button is clickable again
- Clicking Add creates a new row in edit mode
- New row triggers locking again (same rules apply)
- Other rows (including the previously edited one) become locked
- Cycle can repeat indefinitely

### Implementation Details
- No special unlock logic required
- `render()` method checks for editing rows each time
- Calculates `isLocked` for each row dynamically
- Applies or removes attributes based on current state
- Stateless approach ensures consistency

### User Experience
- Smooth transition from locked to unlocked state
- No lingering disabled states
- Can add multiple rows sequentially
- Each edit session is independent
- Clear feedback of state changes


## Step 5.6 – Interaction with newItemFactory

### Factory Usage
- Add button uses `newItemFactory()` to create new items
- Factory is called at the moment of Add button click
- Returns value becomes the new row's data

### Current Factory
- Component uses the current value of `newItemFactory` property
- Factory can be changed at any time
- Changes take effect immediately for next Add operation

### Existing Rows Unchanged
- Changing factory does not affect existing rows
- Each row retains the data it was created with
- Factory only affects new rows created after the change

### Default Factory
- Default factory returns empty object `{}`
- Can be overridden by setting `newItemFactory` property
- Factory must be a function (validated by setter)

### Factory Return Value
- Can return any object structure
- Component adds `editing: true` flag automatically
- Original factory return value is preserved
- No mutation of factory return value

### Use Cases
- Different item types based on context
- Pre-filled default values
- Unique IDs or timestamps
- Complex initialization logic


## Step 6.1 – Save Button Behavior

### Save Button Click Handler
- Save buttons identified by `data-action="save"` attribute
- Click handler attached during row rendering
- Handler receives row index as parameter

### Save Operation
When Save button is clicked:
1. **Validation**: Checks readonly state and row index
2. **Remove Editing Flag**: Removes `editing: true` from row data
3. **Update Data**: Creates new data array with updated row
4. **Re-render**: Triggers component re-render
5. **Event Dispatch**: Fires `datachanged` event

### Mode Transition
- Row switches from edit mode to display mode
- Display content becomes visible (no `hidden` class)
- Edit content becomes hidden (`hidden` class applied)
- Changes are committed to data array

### Lock Release
- Removing `editing` flag unlocks other rows
- Other rows lose locked markers (data-locked, aria-disabled, inert)
- Toggle controls on other rows become enabled
- Add button becomes enabled
- Component returns to normal interactive state

### Data Mutation
- Immutable update pattern (creates new array)
- Only the saved row is modified (editing flag removed)
- Other rows remain unchanged
- Preserves all other row properties

### Event Dispatch
- Fires exactly one `datachanged` event
- Event detail contains complete updated data array
- Saved row no longer has `editing` flag
- Event bubbles and is composed

### Readonly Protection
- Save handler checks readonly attribute
- Returns early if readonly
- No data mutation when readonly
- No event dispatch when readonly


## Step 6.2 – Toggle Events & Basic Mode Switching

### Toggle Button Click Handler
- Toggle buttons identified by `data-action="toggle"` attribute
- Click handler attached during row rendering (both display and edit modes)
- Handler receives row index as parameter

### Mode Detection
- Determines current mode from `editing` flag in row data
- `editing: true` = edit mode
- No editing flag or `editing: false` = display mode

### Before Toggle Event
- Event name: `beforetogglemode`
- Cancelable: Yes
- Bubbles: Yes
- Composed: Yes
- Detail includes:
  - `index`: Row index being toggled
  - `from`: Current mode ("display" or "edit")
  - `to`: Target mode ("edit" or "display")

### Event Cancellation
- Listeners can call `event.preventDefault()`
- Canceling prevents mode change
- Row remains in current mode
- No data mutation occurs
- `aftertogglemode` event is NOT fired
- No `datachanged` event is fired

### Toggle Operation (if not canceled)
When toggle proceeds:
1. **Update Data**: Toggles `editing` flag in row data
   - Display → Edit: Adds `editing: true`
   - Edit → Display: Removes `editing` flag
2. **Re-render**: Triggers component re-render
3. **After Event**: Dispatches `aftertogglemode` event
4. **Data Event**: Dispatches `datachanged` event

### After Toggle Event
- Event name: `aftertogglemode`
- Cancelable: No
- Bubbles: Yes
- Composed: Yes
- Detail includes:
  - `index`: Row index that was toggled
  - `mode`: New mode ("display" or "edit")

### Mode Transition
- Display → Edit: Row enters edit mode
  - Display content hidden
  - Edit content visible
  - Other rows become locked (exclusive locking)
  - Add button disabled
- Edit → Display: Row exits edit mode
  - Edit content hidden
  - Display content visible
  - Other rows unlocked
  - Add button enabled

### Data Mutation
- Immutable update pattern (creates new array)
- Only the toggled row is modified
- Other rows remain unchanged
- Preserves all other row properties

### Readonly Protection
- Toggle handler checks readonly attribute
- Returns early if readonly
- No events fired when readonly
- No data mutation when readonly

### Use Cases
- Manual mode switching by user
- Programmatic mode control via events
- Validation before allowing edit mode
- Custom workflows with event listeners


## Step 6.3 – Visual Mode Switching with Hidden Class

### Display Mode Visual State
When row is in display mode:
- `.display-content` wrapper: No `hidden` class (visible)
- `.edit-content` wrapper: Has `hidden` class (hidden)
- Toggle control in display: Visible and accessible
- Edit controls (Save/Cancel): Hidden via parent wrapper

### Edit Mode Visual State
When row is in edit mode:
- `.display-content` wrapper: Has `hidden` class (hidden)
- `.edit-content` wrapper: No `hidden` class (visible)
- Toggle control in display: Hidden via parent wrapper
- Edit controls (Save/Cancel): Visible and accessible

### Toggle to Edit Mode
Visual changes when toggling from display to edit:
1. `.edit-content` loses `hidden` class → becomes visible
2. `.display-content` gains `hidden` class → becomes hidden
3. Display toggle control hidden (parent wrapper hidden)
4. Edit controls (Save/Cancel) become visible

### Toggle to Display Mode
Visual changes when toggling from edit to display:
1. `.display-content` loses `hidden` class → becomes visible
2. `.edit-content` gains `hidden` class → becomes hidden
3. Edit controls hidden (parent wrapper hidden)
4. Display toggle control becomes visible again

### CSS Class Management
- `hidden` class applied/removed by rendering logic
- Based on `editing` flag in row data
- Automatic via reactive rendering
- No manual DOM manipulation needed

### Control Visibility
- Controls inherit visibility from parent wrapper
- Display controls visible when display wrapper visible
- Edit controls visible when edit wrapper visible
- No individual control hiding needed

### Accessibility
- Hidden content not in tab order
- Screen readers skip hidden content
- Focus management handled by browser
- Semantic visibility via CSS class



## Step 8.1 – Data Cloning & Immutability Guarantees

### Immutability Contract
- Component provides immutability guarantees for data consumers
- Reading `el.data` returns a fresh clone of the internal data
- Mutating the returned array does not affect the component's internal state
- Mutating the returned array does not trigger re-renders
- Setting `el.data` clones the input array to prevent external mutations

### Data Getter Behavior
- Returns a new array on every read
- Filters out internal markers (`__originalSnapshot`, `__isNew`)
- Preserves public API properties (`editing`, `deleted`)
- Each array element is cloned to prevent nested mutations

### Data Setter Behavior
- Accepts arrays of primitives or objects
- Deep clones each element using `JSON.parse(JSON.stringify())`
- Protects against external mutations to source array
- Triggers re-render and datachanged event if connected

### Mutation Patterns
- **Read and mutate**: Mutating `el.data` after read doesn't affect UI
- **Mutate source**: Mutating source array after assignment doesn't affect `el.data`
- **In-place mutation**: Mutating `el.data` in place doesn't auto-re-render
- **Reassignment**: Reassigning mutated array updates both data and UI

### Public vs Internal Properties
- **Public**: `editing`, `deleted` (part of the API, exposed in data getter)
- **Internal**: `__originalSnapshot`, `__isNew` (filtered out from public data)


## Step 8.2 – Deep vs Shallow Clone Behaviour

### Deep Cloning
- Component uses `JSON.parse(JSON.stringify())` for deep cloning
- Nested objects are fully cloned, not just shallow copied
- External mutations to nested properties don't leak into component
- Protects against mutations at any depth level

### Nested Property Paths
- `data-bind` attributes support nested property paths using dot notation
- Example: `data-bind="person.name"` binds to `data[i].person.name`
- Works in both display and edit templates
- Supports arbitrary nesting depth (e.g., `address.city.name`)

### Nested Property Resolution
- `resolveBindingValue()` splits keys by `.` and traverses nested objects
- Returns empty string if any part of the path is missing
- Handles null/undefined values gracefully at any level
- Converts final value to string for display

### Nested Property Updates
- `commitRowValue()` navigates to parent object and sets leaf property
- Creates missing intermediate objects if path doesn't exist
- Maintains immutability by cloning nested objects during update
- Triggers re-render and datachanged event after update

### Use Cases
- Complex data structures (e.g., `{ person: { name, email }, address: { city, zip } }`)
- Nested form fields (e.g., `<input data-bind="address.street" />`)
- Deep object editing with immutability guarantees
- Protection against accidental external mutations

### Limitations
- Uses JSON serialization, so functions, symbols, and circular references are not supported
- Date objects are converted to strings
- Undefined values are converted to null
- Performance consideration for very large or deeply nested objects
