# Test Instructions — ck-editable-array.ts

**Assumptions & Detections:**
- Runtime: Browser environment (Web Components API)
- Module system: ESM (export/import statements detected)
- Framework: Jest with jsdom (for DOM testing)
- Types: TypeScript with explicit type annotations
- Custom Element: Extends HTMLElement, uses Shadow DOM

**Public API Inventory:**
- `CkEditableArray` class (default export and named export)
  - `constructor()` - Initializes shadow root and container
  - `data` getter - Returns cloned array of row data
  - `data` setter - Sets internal data and triggers render
  - `connectedCallback()` - Lifecycle method when element connects to DOM

**External Seams & Mock Plans:**

### DOM APIs
- Mock `customElements.define()` and `customElements.get()` for registration
- Mock `HTMLElement`, `attachShadow()`, `querySelector()`, `querySelectorAll()`
- Mock `document.createElement()`, `template.content.cloneNode()`
- Mock `CustomEvent` and `dispatchEvent()`

### Console
- Mock `console.log()` to verify debug output (or suppress in tests)


## constructor()

Summary: Initializes the custom element with shadow DOM and a root container element.

**Test Cases:**

- **Test purpose:** Verify shadow root is attached when not present
  - **Inputs/preconditions:** New instance created, no existing shadow root
  - **Expected outcome:** Shadow root attached with mode 'open', container div with part="root" created
  - **Edge-path exercised:** Happy path - initial construction

- **Test purpose:** Verify shadow root is not re-attached if already present
  - **Inputs/preconditions:** Instance with existing shadow root
  - **Expected outcome:** Existing shadow root preserved, no duplicate attachment
  - **Edge-path exercised:** Guard against re-initialization

- **Test purpose:** Verify console.log debug output on construction
  - **Inputs/preconditions:** New instance created
  - **Expected outcome:** console.log called with 'ck-editable-array: constructed' and instance
  - **Edge-path exercised:** Debug logging path

- **Test purpose:** Verify container creation when shadow root is empty
  - **Inputs/preconditions:** Shadow root exists but has no children
  - **Expected outcome:** Container div with part="root" appended to shadow root
  - **Edge-path exercised:** Empty shadow root initialization

- **Test purpose:** Verify container not duplicated if already present
  - **Inputs/preconditions:** Shadow root already has children
  - **Expected outcome:** No additional container created
  - **Edge-path exercised:** Guard against duplicate containers

**Edge-case Checklist:**
- **Input Validation:** N/A (no parameters)
- **Boundaries:** N/A
- **Data Handling:** N/A
- **Temporal:** N/A
- **Concurrency:** N/A
- **State Management:** Shadow root state initialization
- **Environment:** Browser Web Components API availability
- **Browser Compatibility:** Shadow DOM support (polyfill may be needed for older browsers)
- **Accessibility:** Container structure for ARIA roles

**Security Checklist:**
- **Input Sanitization:** N/A (no user input)
- **Information Exposure:** Debug console.log may expose instance details in production

**Accessibility Checklist:**
- **ARIA Compliance:** Root container should support ARIA attributes from templates
- **Keyboard Navigation:** N/A at constructor level
- **Screen Reader Support:** Shadow DOM structure should not block screen readers


## data getter

Summary: Returns a deep clone of the internal data array to prevent external mutation.

**Test Cases:**

- **Test purpose:** Verify getter returns cloned array of objects
  - **Inputs/preconditions:** Internal _data contains object rows [{a: 1}, {b: 2}]
  - **Expected outcome:** Returns new array with cloned objects, mutations don't affect internal state
  - **Edge-path exercised:** Object cloning path

- **Test purpose:** Verify getter returns cloned array of strings
  - **Inputs/preconditions:** Internal _data contains string rows ['foo', 'bar']
  - **Expected outcome:** Returns new array with same strings
  - **Edge-path exercised:** String handling path

- **Test purpose:** Verify getter returns empty array when no data
  - **Inputs/preconditions:** Internal _data is empty []
  - **Expected outcome:** Returns empty array []
  - **Edge-path exercised:** Empty data boundary

- **Test purpose:** Verify returned objects are independent clones
  - **Inputs/preconditions:** Internal _data has object {x: 1}
  - **Expected outcome:** Modifying returned object doesn't change internal _data
  - **Edge-path exercised:** Immutability guarantee

- **Test purpose:** Verify mixed string and object data handling
  - **Inputs/preconditions:** Internal _data contains ['string', {obj: 'value'}]
  - **Expected outcome:** Returns array with string and cloned object
  - **Edge-path exercised:** Mixed type handling

**Edge-case Checklist:**
- **Input Validation:** N/A (getter has no inputs)
- **Boundaries:** Empty array, single item, large arrays
- **Data Handling:** Mixed types (strings vs objects), nested objects (shallow clone only)
- **Temporal:** N/A
- **Concurrency:** Multiple rapid getter calls should return consistent data
- **State Management:** Immutability - external mutations must not affect internal state
- **Environment:** N/A
- **Browser Compatibility:** Spread operator support

**Security Checklist:**
- **Input Sanitization:** N/A
- **Information Exposure:** Returns cloned data, safe from external mutation

**Accessibility Checklist:**
- **ARIA Compliance:** N/A (data structure only)
- **Keyboard Navigation:** N/A
- **Screen Reader Support:** N/A


## data setter

Summary: Sets the internal data array from external input, cloning each row, and triggers render if connected.

**Test Cases:**

- **Test purpose:** Verify setter accepts valid array of objects
  - **Inputs/preconditions:** Set data to [{name: 'Alice'}, {name: 'Bob'}], element is connected
  - **Expected outcome:** Internal _data updated with cloned objects, render() called
  - **Edge-path exercised:** Happy path with object array

- **Test purpose:** Verify setter accepts array of strings
  - **Inputs/preconditions:** Set data to ['foo', 'bar', 'baz']
  - **Expected outcome:** Internal _data updated with strings, render() called if connected
  - **Edge-path exercised:** String array path

- **Test purpose:** Verify setter handles non-array input
  - **Inputs/preconditions:** Set data to null, undefined, or non-array value
  - **Expected outcome:** Internal _data set to empty array []
  - **Edge-path exercised:** Invalid input guard

- **Test purpose:** Verify setter clones input to prevent external mutation
  - **Inputs/preconditions:** Set data to array reference, then mutate original
  - **Expected outcome:** Internal _data unchanged by external mutation
  - **Edge-path exercised:** Immutability guarantee

- **Test purpose:** Verify render not called when element not connected
  - **Inputs/preconditions:** Set data before element added to DOM (isConnected = false)
  - **Expected outcome:** Internal _data updated, render() not called
  - **Edge-path exercised:** isConnected guard

- **Test purpose:** Verify render called when element is connected
  - **Inputs/preconditions:** Element in DOM (isConnected = true), set data
  - **Expected outcome:** render() method invoked
  - **Edge-path exercised:** Connected render trigger

- **Test purpose:** Verify setter handles empty array
  - **Inputs/preconditions:** Set data to []
  - **Expected outcome:** Internal _data set to [], render() called if connected
  - **Edge-path exercised:** Empty array boundary

- **Test purpose:** Verify setter handles mixed types via cloneRow
  - **Inputs/preconditions:** Set data to [123, true, 'string', {obj: 1}]
  - **Expected outcome:** Numbers/booleans converted to strings, objects cloned
  - **Edge-path exercised:** Type coercion through cloneRow

- **Test purpose:** Verify setter handles large arrays
  - **Inputs/preconditions:** Set data to array with 1000+ items
  - **Expected outcome:** All items cloned and stored, render() called
  - **Edge-path exercised:** Performance boundary

**Edge-case Checklist:**
- **Input Validation:** null, undefined, non-array types, empty array
- **Boundaries:** Empty array, single item, very large arrays (1000+ items)
- **Data Handling:** Mixed types (string, number, boolean, object), nested objects
- **Temporal:** N/A
- **Concurrency:** Rapid successive setter calls should use latest value
- **State Management:** Immutability of input, proper cloning
- **Environment:** isConnected state affects render trigger
- **Browser Compatibility:** Array.isArray() support

**Security Checklist:**
- **Input Sanitization:** Non-array inputs safely converted to empty array
- **Information Exposure:** N/A

**Accessibility Checklist:**
- **ARIA Compliance:** Render updates should maintain ARIA attributes
- **Keyboard Navigation:** Focus management during re-render
- **Screen Reader Support:** Screen reader should be notified of content changes


## connectedCallback()

Summary: Web Component lifecycle method called when element is inserted into the DOM; triggers initial render.

**Test Cases:**

- **Test purpose:** Verify render is called when element connects to DOM
  - **Inputs/preconditions:** Element with data, not yet in DOM
  - **Expected outcome:** render() method invoked once
  - **Edge-path exercised:** Happy path - initial connection

- **Test purpose:** Verify console.log debug output on connection
  - **Inputs/preconditions:** Element connects to DOM
  - **Expected outcome:** console.log called with 'ck-editable-array: connected' and instance
  - **Edge-path exercised:** Debug logging path

- **Test purpose:** Verify render works with empty data
  - **Inputs/preconditions:** Element with no data (_data = []), connects to DOM
  - **Expected outcome:** render() called, container cleared but no rows added
  - **Edge-path exercised:** Empty data boundary

- **Test purpose:** Verify render works with existing data
  - **Inputs/preconditions:** Element with pre-set data, connects to DOM
  - **Expected outcome:** render() called, rows rendered from data
  - **Edge-path exercised:** Data already present path

- **Test purpose:** Verify multiple connect/disconnect cycles
  - **Inputs/preconditions:** Element connected, disconnected, reconnected
  - **Expected outcome:** render() called each time element connects
  - **Edge-path exercised:** Lifecycle re-entry

**Edge-case Checklist:**
- **Input Validation:** N/A (lifecycle method)
- **Boundaries:** First connection vs subsequent connections
- **Data Handling:** Empty vs populated data state
- **Temporal:** Timing of data setter vs connectedCallback
- **Concurrency:** Rapid connect/disconnect cycles
- **State Management:** Shadow DOM state preservation across disconnects
- **Environment:** Browser lifecycle management
- **Browser Compatibility:** connectedCallback support in all target browsers

**Security Checklist:**
- **Input Sanitization:** N/A
- **Information Exposure:** Debug console.log in production

**Accessibility Checklist:**
- **ARIA Compliance:** Initial render should establish proper ARIA structure
- **Keyboard Navigation:** Focus should be manageable after connection
- **Screen Reader Support:** Content should be announced when rendered


## render() [private]

Summary: Clears and rebuilds the shadow DOM content from templates and data.

**Test Cases:**

- **Test purpose:** Verify render exits early if no shadow root
  - **Inputs/preconditions:** Instance with shadowRoot = null
  - **Expected outcome:** Method returns early, no errors thrown
  - **Edge-path exercised:** Shadow root null guard

- **Test purpose:** Verify render exits early if no container found
  - **Inputs/preconditions:** Shadow root exists but no [part="root"] element
  - **Expected outcome:** Method returns early, no errors thrown
  - **Edge-path exercised:** Container missing guard

- **Test purpose:** Verify render clears previous content
  - **Inputs/preconditions:** Container has existing child elements, render() called
  - **Expected outcome:** container.innerHTML set to '', all children removed
  - **Edge-path exercised:** Content clearing path

- **Test purpose:** Verify render with no templates
  - **Inputs/preconditions:** No template[slot="display"] or template[slot="edit"] in light DOM
  - **Expected outcome:** No rows appended, container remains empty
  - **Edge-path exercised:** Missing templates path

- **Test purpose:** Verify render with display template only
  - **Inputs/preconditions:** template[slot="display"] present, data has 2 rows
  - **Expected outcome:** 2 display rows appended, no edit rows
  - **Edge-path exercised:** Single template mode

- **Test purpose:** Verify render with edit template only
  - **Inputs/preconditions:** template[slot="edit"] present, data has 2 rows
  - **Expected outcome:** 2 edit rows appended, no display rows
  - **Edge-path exercised:** Edit-only template mode

- **Test purpose:** Verify render with both templates
  - **Inputs/preconditions:** Both display and edit templates present, data has 3 rows
  - **Expected outcome:** 3 display rows + 3 edit rows appended (6 total elements)
  - **Edge-path exercised:** Dual template mode

- **Test purpose:** Verify render with empty data array
  - **Inputs/preconditions:** Templates present, _data = []
  - **Expected outcome:** Container cleared, no rows appended
  - **Edge-path exercised:** Empty data boundary

- **Test purpose:** Verify render calls appendRowFromTemplate correctly
  - **Inputs/preconditions:** 2 rows, both templates present
  - **Expected outcome:** appendRowFromTemplate called 4 times (2 rows × 2 modes)
  - **Edge-path exercised:** Template iteration logic

- **Test purpose:** Verify render with large dataset
  - **Inputs/preconditions:** 100 rows, both templates
  - **Expected outcome:** 200 elements appended without errors
  - **Edge-path exercised:** Performance boundary

**Edge-case Checklist:**
- **Input Validation:** Missing shadow root, missing container, missing templates
- **Boundaries:** Empty data, single row, large datasets (100+ rows)
- **Data Handling:** String vs object rows
- **Temporal:** Render timing relative to DOM updates
- **Concurrency:** Multiple rapid render calls (should complete without race conditions)
- **State Management:** Previous content cleanup, fresh render state
- **Environment:** querySelector behavior in shadow DOM
- **Browser Compatibility:** innerHTML clearing, template element support

**Security Checklist:**
- **Input Sanitization:** innerHTML = '' is safe (no user content injected here)
- **Information Exposure:** N/A

**Accessibility Checklist:**
- **ARIA Compliance:** Rendered content should preserve ARIA from templates
- **Keyboard Navigation:** Tab order should be logical after render
- **Screen Reader Support:** Dynamic content changes should be announced


## bindDataToNode(root, data, rowIndex, mode) [private]

Summary: Binds data values to DOM elements with data-bind attributes, setting up input event listeners in edit mode.

**Test Cases:**

- **Test purpose:** Verify binding to text content for non-input elements
  - **Inputs/preconditions:** root has <span data-bind="name">, data = {name: 'Alice'}, mode = 'display'
  - **Expected outcome:** span.textContent set to 'Alice'
  - **Edge-path exercised:** Text content binding path

- **Test purpose:** Verify binding to HTMLInputElement value
  - **Inputs/preconditions:** root has <input data-bind="email">, data = {email: 'a@b.com'}, mode = 'display'
  - **Expected outcome:** input.value set to 'a@b.com'
  - **Edge-path exercised:** Input element value binding

- **Test purpose:** Verify binding to HTMLTextAreaElement value
  - **Inputs/preconditions:** root has <textarea data-bind="bio">, data = {bio: 'Hello'}, mode = 'display'
  - **Expected outcome:** textarea.value set to 'Hello'
  - **Edge-path exercised:** Textarea element value binding

- **Test purpose:** Verify input event listener added in edit mode
  - **Inputs/preconditions:** <input data-bind="name">, mode = 'edit', rowIndex = 0
  - **Expected outcome:** input event listener attached, calls commitRowValue on input
  - **Edge-path exercised:** Edit mode listener attachment

- **Test purpose:** Verify textarea event listener added in edit mode
  - **Inputs/preconditions:** <textarea data-bind="desc">, mode = 'edit', rowIndex = 1
  - **Expected outcome:** input event listener attached, calls commitRowValue on input
  - **Edge-path exercised:** Edit mode textarea listener

- **Test purpose:** Verify no event listeners in display mode
  - **Inputs/preconditions:** <input data-bind="name">, mode = 'display'
  - **Expected outcome:** No input event listeners attached
  - **Edge-path exercised:** Display mode guard

- **Test purpose:** Verify binding with empty data-bind attribute
  - **Inputs/preconditions:** Element has data-bind="", data = {a: 1}
  - **Expected outcome:** resolveBindingValue returns '', element content set to ''
  - **Edge-path exercised:** Empty key handling

- **Test purpose:** Verify binding with missing key in data
  - **Inputs/preconditions:** data-bind="missing", data = {other: 'value'}
  - **Expected outcome:** Element content set to '' (empty string)
  - **Edge-path exercised:** Missing key path in resolveBindingValue

- **Test purpose:** Verify binding with string data (not object)
  - **Inputs/preconditions:** data-bind="anything", data = 'plain string'
  - **Expected outcome:** Element content set to 'plain string'
  - **Edge-path exercised:** String data path

- **Test purpose:** Verify multiple bound elements in same root
  - **Inputs/preconditions:** root has 3 elements with different data-bind values
  - **Expected outcome:** All 3 elements bound correctly with respective values
  - **Edge-path exercised:** Multiple bindings iteration

- **Test purpose:** Verify binding with null/undefined values
  - **Inputs/preconditions:** data = {name: null, age: undefined}
  - **Expected outcome:** Both bound elements show '' (empty string)
  - **Edge-path exercised:** Null/undefined handling in resolveBindingValue

- **Test purpose:** Verify commitRowValue called with correct parameters
  - **Inputs/preconditions:** Edit mode input changed, rowIndex = 2, key = 'email'
  - **Expected outcome:** commitRowValue(2, 'email', newValue) called
  - **Edge-path exercised:** Event handler parameter passing

**Edge-case Checklist:**
- **Input Validation:** Empty data-bind, missing keys, null/undefined values
- **Boundaries:** No bound elements, single element, many elements
- **Data Handling:** String vs object data, special characters in values, Unicode/emoji
- **Temporal:** Event listener timing, multiple rapid inputs
- **Concurrency:** Multiple simultaneous input events
- **State Management:** Event listener cleanup (potential memory leak if not managed)
- **Environment:** Different input types (text, number, email, etc.)
- **Browser Compatibility:** instanceof checks, addEventListener support

**Security Checklist:**
- **Input Sanitization:** textContent assignment is safe (no HTML injection), but input.value could contain malicious strings
- **Information Exposure:** N/A

**Accessibility Checklist:**
- **ARIA Compliance:** Bound elements should maintain ARIA attributes
- **Keyboard Navigation:** Input elements should be keyboard accessible
- **Screen Reader Support:** Value changes should be announced


## appendRowFromTemplate(template, container, rowData, rowIndex, mode) [private]

Summary: Clones a template, binds data to it, and appends it to the container with row metadata attributes.

**Test Cases:**

- **Test purpose:** Verify early return when template is null
  - **Inputs/preconditions:** template = null
  - **Expected outcome:** Method returns early, nothing appended to container
  - **Edge-path exercised:** Null template guard

- **Test purpose:** Verify early return when template.content is null
  - **Inputs/preconditions:** template exists but template.content = null
  - **Expected outcome:** Method returns early, nothing appended
  - **Edge-path exercised:** Missing content guard

- **Test purpose:** Verify template with single root element
  - **Inputs/preconditions:** template.content has <div> as firstElementChild, rowIndex = 0, mode = 'display'
  - **Expected outcome:** div cloned, data-row="0" and data-mode="display" set, bindDataToNode called, appended to container
  - **Edge-path exercised:** Single root element path

- **Test purpose:** Verify template with no root element (text nodes only)
  - **Inputs/preconditions:** template.content has only text nodes, no firstElementChild
  - **Expected outcome:** Wrapper div created, data-row and data-mode set on wrapper, fragment appended to wrapper, wrapper appended to container
  - **Edge-path exercised:** No root element fallback path

- **Test purpose:** Verify template with multiple root elements
  - **Inputs/preconditions:** template.content has multiple sibling elements
  - **Expected outcome:** Only firstElementChild gets attributes, or wrapper created if no firstElementChild
  - **Edge-path exercised:** Multiple roots handling

- **Test purpose:** Verify bindDataToNode called with correct parameters
  - **Inputs/preconditions:** Valid template, rowData = {x: 1}, rowIndex = 5, mode = 'edit'
  - **Expected outcome:** bindDataToNode(element, {x: 1}, 5, 'edit') called
  - **Edge-path exercised:** Parameter passing to bindDataToNode

- **Test purpose:** Verify data-row attribute set correctly
  - **Inputs/preconditions:** rowIndex = 42
  - **Expected outcome:** Appended element has data-row="42"
  - **Edge-path exercised:** Row index attribute

- **Test purpose:** Verify data-mode attribute set correctly
  - **Inputs/preconditions:** mode = 'edit'
  - **Expected outcome:** Appended element has data-mode="edit"
  - **Edge-path exercised:** Mode attribute

- **Test purpose:** Verify template cloning doesn't mutate original
  - **Inputs/preconditions:** template.content with specific structure
  - **Expected outcome:** Original template.content unchanged after cloning
  - **Edge-path exercised:** Deep clone immutability

- **Test purpose:** Verify container receives appended element
  - **Inputs/preconditions:** Empty container, valid template
  - **Expected outcome:** container.children.length increases by 1
  - **Edge-path exercised:** DOM append operation

**Edge-case Checklist:**
- **Input Validation:** Null template, null content, missing firstElementChild
- **Boundaries:** Empty template, single element, multiple elements
- **Data Handling:** Complex nested template structures
- **Temporal:** N/A
- **Concurrency:** Multiple rapid append calls
- **State Management:** Template immutability, container state
- **Environment:** cloneNode(true) deep clone behavior
- **Browser Compatibility:** template.content support, DocumentFragment handling

**Security Checklist:**
- **Input Sanitization:** Template content should be trusted (from light DOM), but verify no script injection
- **Information Exposure:** N/A

**Accessibility Checklist:**
- **ARIA Compliance:** Cloned template should preserve ARIA attributes
- **Keyboard Navigation:** Cloned interactive elements should maintain tab order
- **Screen Reader Support:** Cloned content should be accessible


## cloneRow(row) [private]

Summary: Creates a defensive copy of a row, handling strings, numbers, booleans, and objects.

**Test Cases:**

- **Test purpose:** Verify string input returns same string
  - **Inputs/preconditions:** row = 'hello'
  - **Expected outcome:** Returns 'hello'
  - **Edge-path exercised:** String type path

- **Test purpose:** Verify number input converts to string
  - **Inputs/preconditions:** row = 42
  - **Expected outcome:** Returns '42'
  - **Edge-path exercised:** Number type conversion

- **Test purpose:** Verify boolean input converts to string
  - **Inputs/preconditions:** row = true
  - **Expected outcome:** Returns 'true'
  - **Edge-path exercised:** Boolean type conversion

- **Test purpose:** Verify object input returns shallow clone
  - **Inputs/preconditions:** row = {a: 1, b: 2}
  - **Expected outcome:** Returns {a: 1, b: 2}, mutation doesn't affect original
  - **Edge-path exercised:** Object cloning path

- **Test purpose:** Verify array input returns empty string
  - **Inputs/preconditions:** row = [1, 2, 3]
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Array rejection path

- **Test purpose:** Verify null input returns empty string
  - **Inputs/preconditions:** row = null
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Null handling

- **Test purpose:** Verify undefined input returns empty string
  - **Inputs/preconditions:** row = undefined
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Undefined handling

- **Test purpose:** Verify nested object shallow clone behavior
  - **Inputs/preconditions:** row = {a: {nested: 1}}
  - **Expected outcome:** Returns {a: {nested: 1}}, but nested object is same reference
  - **Edge-path exercised:** Shallow clone limitation

- **Test purpose:** Verify object with null/undefined properties
  - **Inputs/preconditions:** row = {a: null, b: undefined}
  - **Expected outcome:** Returns {a: null, b: undefined}
  - **Edge-path exercised:** Object with falsy values

- **Test purpose:** Verify empty object
  - **Inputs/preconditions:** row = {}
  - **Expected outcome:** Returns {}
  - **Edge-path exercised:** Empty object boundary

- **Test purpose:** Verify zero and negative numbers
  - **Inputs/preconditions:** row = 0, then row = -5
  - **Expected outcome:** Returns '0', then '-5'
  - **Edge-path exercised:** Number edge cases

- **Test purpose:** Verify empty string
  - **Inputs/preconditions:** row = ''
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Empty string boundary

**Edge-case Checklist:**
- **Input Validation:** All primitive types, null, undefined, arrays, objects
- **Boundaries:** Empty string, zero, empty object
- **Data Handling:** Unicode strings, special characters, floating-point numbers
- **Temporal:** N/A
- **Concurrency:** N/A
- **State Management:** Immutability of cloned objects
- **Environment:** typeof operator behavior
- **Browser Compatibility:** Spread operator for object cloning

**Security Checklist:**
- **Input Sanitization:** Type coercion is safe, no injection risk
- **Information Exposure:** N/A

**Accessibility Checklist:**
- **ARIA Compliance:** N/A (data transformation only)
- **Keyboard Navigation:** N/A
- **Screen Reader Support:** N/A


## resolveBindingValue(data, key) [private]

Summary: Extracts a string value from data using a key, handling both object and string data types.

**Test Cases:**

- **Test purpose:** Verify value extraction from object with valid key
  - **Inputs/preconditions:** data = {name: 'Alice', age: 30}, key = 'name'
  - **Expected outcome:** Returns 'Alice'
  - **Edge-path exercised:** Object with valid key path

- **Test purpose:** Verify value extraction with missing key
  - **Inputs/preconditions:** data = {name: 'Bob'}, key = 'missing'
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Missing key returns empty string

- **Test purpose:** Verify value extraction with empty key
  - **Inputs/preconditions:** data = {name: 'Charlie'}, key = ''
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Empty key guard

- **Test purpose:** Verify value extraction with null value
  - **Inputs/preconditions:** data = {name: null}, key = 'name'
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Null value handling

- **Test purpose:** Verify value extraction with undefined value
  - **Inputs/preconditions:** data = {name: undefined}, key = 'name'
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Undefined value handling

- **Test purpose:** Verify string data returns itself (ignores key)
  - **Inputs/preconditions:** data = 'plain string', key = 'anything'
  - **Expected outcome:** Returns 'plain string'
  - **Edge-path exercised:** String data path

- **Test purpose:** Verify number value converts to string
  - **Inputs/preconditions:** data = {count: 42}, key = 'count'
  - **Expected outcome:** Returns '42'
  - **Edge-path exercised:** Number to string conversion

- **Test purpose:** Verify boolean value converts to string
  - **Inputs/preconditions:** data = {active: true}, key = 'active'
  - **Expected outcome:** Returns 'true'
  - **Edge-path exercised:** Boolean to string conversion

- **Test purpose:** Verify object value converts to string
  - **Inputs/preconditions:** data = {nested: {a: 1}}, key = 'nested'
  - **Expected outcome:** Returns '[object Object]'
  - **Edge-path exercised:** Object to string conversion

- **Test purpose:** Verify array value converts to string
  - **Inputs/preconditions:** data = {items: [1, 2, 3]}, key = 'items'
  - **Expected outcome:** Returns '1,2,3'
  - **Edge-path exercised:** Array to string conversion

- **Test purpose:** Verify empty string data
  - **Inputs/preconditions:** data = '', key = 'any'
  - **Expected outcome:** Returns ''
  - **Edge-path exercised:** Empty string data

- **Test purpose:** Verify zero value
  - **Inputs/preconditions:** data = {count: 0}, key = 'count'
  - **Expected outcome:** Returns '0'
  - **Edge-path exercised:** Falsy number value

- **Test purpose:** Verify false value
  - **Inputs/preconditions:** data = {flag: false}, key = 'flag'
  - **Expected outcome:** Returns 'false'
  - **Edge-path exercised:** Falsy boolean value

**Edge-case Checklist:**
- **Input Validation:** Empty key, missing key, null/undefined values
- **Boundaries:** Empty string, zero, false
- **Data Handling:** All primitive types, nested objects, arrays, special characters
- **Temporal:** N/A
- **Concurrency:** N/A
- **State Management:** Pure function, no state mutation
- **Environment:** String() conversion behavior
- **Browser Compatibility:** typeof operator, String() constructor

**Security Checklist:**
- **Input Sanitization:** String conversion is safe, no injection risk
- **Information Exposure:** May expose object structure via toString

**Accessibility Checklist:**
- **ARIA Compliance:** N/A (data transformation only)
- **Keyboard Navigation:** N/A
- **Screen Reader Support:** N/A


## commitRowValue(rowIndex, key, nextValue) [private]

Summary: Updates a specific field in a row, triggers DOM updates, and dispatches a datachanged event.

**Test Cases:**

- **Test purpose:** Verify update with valid rowIndex and key
  - **Inputs/preconditions:** _data = [{name: 'Alice'}], rowIndex = 0, key = 'name', nextValue = 'Bob'
  - **Expected outcome:** _data[0].name = 'Bob', updateBoundNodes(0, 'name') called, datachanged event dispatched
  - **Edge-path exercised:** Happy path - object row update

- **Test purpose:** Verify early return for negative rowIndex
  - **Inputs/preconditions:** rowIndex = -1, key = 'name', nextValue = 'test'
  - **Expected outcome:** Method returns early, no changes made
  - **Edge-path exercised:** Negative index guard

- **Test purpose:** Verify early return for rowIndex >= length
  - **Inputs/preconditions:** _data.length = 2, rowIndex = 2, key = 'name', nextValue = 'test'
  - **Expected outcome:** Method returns early, no changes made
  - **Edge-path exercised:** Out of bounds guard

- **Test purpose:** Verify early return when value unchanged
  - **Inputs/preconditions:** _data = [{name: 'Alice'}], rowIndex = 0, key = 'name', nextValue = 'Alice'
  - **Expected outcome:** Method returns early, no updates or events
  - **Edge-path exercised:** No-op optimization

- **Test purpose:** Verify null nextValue normalized to empty string
  - **Inputs/preconditions:** rowIndex = 0, key = 'name', nextValue = null
  - **Expected outcome:** nextValue treated as '', comparison and update proceed
  - **Edge-path exercised:** Null normalization

- **Test purpose:** Verify undefined nextValue normalized to empty string
  - **Inputs/preconditions:** rowIndex = 0, key = 'name', nextValue = undefined
  - **Expected outcome:** nextValue treated as '', comparison and update proceed
  - **Edge-path exercised:** Undefined normalization

- **Test purpose:** Verify string row update
  - **Inputs/preconditions:** _data = ['old'], rowIndex = 0, key = '', nextValue = 'new'
  - **Expected outcome:** _data[0] = 'new', updates triggered
  - **Edge-path exercised:** String row replacement path

- **Test purpose:** Verify object row immutability (creates new array)
  - **Inputs/preconditions:** _data = [{a: 1}], update row 0
  - **Expected outcome:** New array created, original objects cloned
  - **Edge-path exercised:** Immutability guarantee

- **Test purpose:** Verify update only affects target row
  - **Inputs/preconditions:** _data = [{a: 1}, {a: 2}, {a: 3}], update row 1
  - **Expected outcome:** Only row 1 modified, rows 0 and 2 unchanged
  - **Edge-path exercised:** Isolated row update

- **Test purpose:** Verify updateBoundNodes called when connected
  - **Inputs/preconditions:** isConnected = true, valid update
  - **Expected outcome:** updateBoundNodes(rowIndex, key) invoked
  - **Edge-path exercised:** Connected update path

- **Test purpose:** Verify dispatchDataChanged called when connected
  - **Inputs/preconditions:** isConnected = true, valid update
  - **Expected outcome:** dispatchDataChanged() invoked
  - **Edge-path exercised:** Event dispatch path

- **Test purpose:** Verify no DOM updates when not connected
  - **Inputs/preconditions:** isConnected = false, valid update
  - **Expected outcome:** _data updated, but updateBoundNodes and dispatchDataChanged not called
  - **Edge-path exercised:** Disconnected update path

- **Test purpose:** Verify empty key with object row
  - **Inputs/preconditions:** _data = [{a: 1}], rowIndex = 0, key = '', nextValue = 'new'
  - **Expected outcome:** Row replaced with 'new' (string)
  - **Edge-path exercised:** Empty key fallback to row replacement

- **Test purpose:** Verify update with special characters
  - **Inputs/preconditions:** nextValue = '<script>alert("xss")</script>'
  - **Expected outcome:** Value stored as-is, no script execution
  - **Edge-path exercised:** Special character handling

- **Test purpose:** Verify update with Unicode/emoji
  - **Inputs/preconditions:** nextValue = '👍 Hello 世界'
  - **Expected outcome:** Unicode stored correctly
  - **Edge-path exercised:** Unicode handling

**Edge-case Checklist:**
- **Input Validation:** Negative/out-of-bounds rowIndex, empty key, null/undefined nextValue
- **Boundaries:** First row, last row, single-row array
- **Data Handling:** String vs object rows, special characters, Unicode/emoji
- **Temporal:** Rapid successive updates to same row
- **Concurrency:** Multiple simultaneous updates to different rows
- **State Management:** Immutability of _data array, object cloning
- **Environment:** isConnected state affects side effects
- **Browser Compatibility:** Array.map, spread operator

**Security Checklist:**
- **Input Sanitization:** nextValue stored as-is (string), verify no script execution in DOM updates
- **Information Exposure:** datachanged event exposes full data array

**Accessibility Checklist:**
- **ARIA Compliance:** DOM updates should maintain ARIA attributes
- **Keyboard Navigation:** Focus should not be lost during update
- **Screen Reader Support:** Value changes should be announced


## updateBoundNodes(rowIndex, key?) [private]

Summary: Efficiently updates DOM nodes for a specific row without full re-render, optionally targeting a specific key.

**Test Cases:**

- **Test purpose:** Verify early return when no shadow root
  - **Inputs/preconditions:** shadowRoot = null
  - **Expected outcome:** Method returns early, no errors
  - **Edge-path exercised:** Shadow root null guard

- **Test purpose:** Verify early return when no matching row elements
  - **Inputs/preconditions:** rowIndex = 5, but no elements with data-row="5"
  - **Expected outcome:** Method returns early, no updates
  - **Edge-path exercised:** Missing row elements guard

- **Test purpose:** Verify update all bound nodes when key not specified
  - **Inputs/preconditions:** rowIndex = 0, key = undefined, row has 3 bound elements
  - **Expected outcome:** All 3 elements updated with current values
  - **Edge-path exercised:** Full row update path

- **Test purpose:** Verify update specific key only when key specified
  - **Inputs/preconditions:** rowIndex = 0, key = 'name', row has multiple bound elements
  - **Expected outcome:** Only elements with data-bind="name" updated
  - **Edge-path exercised:** Targeted key update path

- **Test purpose:** Verify input value updated when different
  - **Inputs/preconditions:** HTMLInputElement with value 'old', new value 'new'
  - **Expected outcome:** input.value set to 'new'
  - **Edge-path exercised:** Input update path

- **Test purpose:** Verify input value not updated when same
  - **Inputs/preconditions:** HTMLInputElement with value 'same', new value 'same'
  - **Expected outcome:** input.value not reassigned (avoid clobbering user typing)
  - **Edge-path exercised:** Input no-op optimization

- **Test purpose:** Verify textarea value updated when different
  - **Inputs/preconditions:** HTMLTextAreaElement with value 'old', new value 'new'
  - **Expected outcome:** textarea.value set to 'new'
  - **Edge-path exercised:** Textarea update path

- **Test purpose:** Verify textarea value not updated when same
  - **Inputs/preconditions:** HTMLTextAreaElement with value 'same', new value 'same'
  - **Expected outcome:** textarea.value not reassigned
  - **Edge-path exercised:** Textarea no-op optimization

- **Test purpose:** Verify textContent updated for non-input elements
  - **Inputs/preconditions:** <span> with textContent 'old', new value 'new'
  - **Expected outcome:** span.textContent set to 'new'
  - **Edge-path exercised:** Text content update path

- **Test purpose:** Verify textContent not updated when same
  - **Inputs/preconditions:** <span> with textContent 'same', new value 'same'
  - **Expected outcome:** textContent not reassigned
  - **Edge-path exercised:** Text content no-op optimization

- **Test purpose:** Verify multiple row elements updated (display + edit)
  - **Inputs/preconditions:** rowIndex = 0 has 2 elements (data-mode="display" and "edit")
  - **Expected outcome:** Both elements' bound nodes updated
  - **Edge-path exercised:** Multiple row elements iteration

- **Test purpose:** Verify empty string value updates correctly
  - **Inputs/preconditions:** Current value 'text', new value ''
  - **Expected outcome:** Element updated to empty string
  - **Edge-path exercised:** Empty string boundary

- **Test purpose:** Verify null/undefined resolved to empty string
  - **Inputs/preconditions:** Data value is null or undefined
  - **Expected outcome:** Element updated to '' via resolveBindingValue
  - **Edge-path exercised:** Null/undefined handling

- **Test purpose:** Verify no bound elements in row
  - **Inputs/preconditions:** Row element exists but has no [data-bind] children
  - **Expected outcome:** No errors, method completes
  - **Edge-path exercised:** No bound elements boundary

**Edge-case Checklist:**
- **Input Validation:** Missing shadow root, missing row elements, no bound nodes
- **Boundaries:** Empty string values, single vs multiple bound nodes
- **Data Handling:** Special characters, Unicode/emoji in values
- **Temporal:** Update timing relative to user input (avoid clobbering)
- **Concurrency:** Multiple rapid updates to same row
- **State Management:** Selective updates without full re-render
- **Environment:** querySelectorAll with attribute selectors
- **Browser Compatibility:** instanceof checks, attribute selectors

**Security Checklist:**
- **Input Sanitization:** textContent is safe, input.value could contain malicious strings but stored as text
- **Information Exposure:** N/A

**Accessibility Checklist:**
- **ARIA Compliance:** Updates should not remove ARIA attributes
- **Keyboard Navigation:** Focus should be preserved during updates
- **Screen Reader Support:** Value changes should be announced (may need aria-live)


## dispatchDataChanged() [private]

Summary: Dispatches a custom 'datachanged' event with the current data as detail.

**Test Cases:**

- **Test purpose:** Verify event is dispatched with correct type
  - **Inputs/preconditions:** Method called
  - **Expected outcome:** CustomEvent with type 'datachanged' dispatched
  - **Edge-path exercised:** Event creation and dispatch

- **Test purpose:** Verify event bubbles
  - **Inputs/preconditions:** Method called
  - **Expected outcome:** Event has bubbles: true
  - **Edge-path exercised:** Bubbling configuration

- **Test purpose:** Verify event is composed
  - **Inputs/preconditions:** Method called
  - **Expected outcome:** Event has composed: true (crosses shadow DOM boundary)
  - **Edge-path exercised:** Composed configuration

- **Test purpose:** Verify event detail contains cloned data
  - **Inputs/preconditions:** _data = [{a: 1}, {b: 2}]
  - **Expected outcome:** event.detail.data is cloned array from data getter
  - **Edge-path exercised:** Data cloning via getter

- **Test purpose:** Verify event detail data is immutable
  - **Inputs/preconditions:** Event dispatched, listener mutates event.detail.data
  - **Expected outcome:** Internal _data unchanged (data getter returns clones)
  - **Edge-path exercised:** Immutability guarantee

- **Test purpose:** Verify event dispatched on element instance
  - **Inputs/preconditions:** Method called on specific element instance
  - **Expected outcome:** dispatchEvent called on this element
  - **Edge-path exercised:** Event target

- **Test purpose:** Verify event with empty data
  - **Inputs/preconditions:** _data = []
  - **Expected outcome:** event.detail.data = []
  - **Edge-path exercised:** Empty data boundary

- **Test purpose:** Verify event with large dataset
  - **Inputs/preconditions:** _data has 1000 items
  - **Expected outcome:** Event dispatched with all 1000 items cloned
  - **Edge-path exercised:** Performance boundary

**Edge-case Checklist:**
- **Input Validation:** N/A (no parameters)
- **Boundaries:** Empty data, large datasets
- **Data Handling:** Data cloning via getter
- **Temporal:** Event timing relative to DOM updates
- **Concurrency:** Multiple rapid event dispatches
- **State Management:** Event detail immutability
- **Environment:** CustomEvent API, shadow DOM event propagation
- **Browser Compatibility:** CustomEvent constructor, composed events

**Security Checklist:**
- **Input Sanitization:** N/A
- **Information Exposure:** Event exposes full data array to listeners (by design)

**Accessibility Checklist:**
- **ARIA Compliance:** N/A (event only)
- **Keyboard Navigation:** N/A
- **Screen Reader Support:** Consider aria-live region updates for data changes


## isRecord(value) [private]

Summary: Type guard to determine if a value is a non-null object (Record type).

**Test Cases:**

- **Test purpose:** Verify returns true for plain object
  - **Inputs/preconditions:** value = {a: 1, b: 2}
  - **Expected outcome:** Returns true
  - **Edge-path exercised:** Object type path

- **Test purpose:** Verify returns false for null
  - **Inputs/preconditions:** value = null
  - **Expected outcome:** Returns false
  - **Edge-path exercised:** Null guard

- **Test purpose:** Verify returns false for string
  - **Inputs/preconditions:** value = 'string'
  - **Expected outcome:** Returns false
  - **Edge-path exercised:** String type rejection

- **Test purpose:** Verify returns false for number
  - **Inputs/preconditions:** value = 42
  - **Expected outcome:** Returns false
  - **Edge-path exercised:** Number type rejection

- **Test purpose:** Verify returns false for boolean
  - **Inputs/preconditions:** value = true
  - **Expected outcome:** Returns false
  - **Edge-path exercised:** Boolean type rejection

- **Test purpose:** Verify returns false for undefined
  - **Inputs/preconditions:** value = undefined
  - **Expected outcome:** Returns false
  - **Edge-path exercised:** Undefined type rejection

- **Test purpose:** Verify returns true for empty object
  - **Inputs/preconditions:** value = {}
  - **Expected outcome:** Returns true
  - **Edge-path exercised:** Empty object boundary

- **Test purpose:** Verify behavior with array (edge case)
  - **Inputs/preconditions:** value = [1, 2, 3]
  - **Expected outcome:** Returns true (arrays are objects in JavaScript)
  - **Edge-path exercised:** Array type (typeof array === 'object')

- **Test purpose:** Verify behavior with Date object
  - **Inputs/preconditions:** value = new Date()
  - **Expected outcome:** Returns true
  - **Edge-path exercised:** Built-in object type

- **Test purpose:** Verify behavior with function
  - **Inputs/preconditions:** value = () => {}
  - **Expected outcome:** Returns false (typeof function !== 'object')
  - **Edge-path exercised:** Function type rejection

**Edge-case Checklist:**
- **Input Validation:** All JavaScript types tested
- **Boundaries:** Empty object, null
- **Data Handling:** Arrays (typeof returns 'object'), built-in objects
- **Temporal:** N/A
- **Concurrency:** N/A
- **State Management:** Pure function, no state
- **Environment:** typeof operator behavior
- **Browser Compatibility:** typeof operator (universal support)

**Security Checklist:**
- **Input Sanitization:** N/A (type check only)
- **Information Exposure:** N/A

**Accessibility Checklist:**
- **ARIA Compliance:** N/A (utility function)
- **Keyboard Navigation:** N/A
- **Screen Reader Support:** N/A

