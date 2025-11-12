# CK Editable Array Web Component

A modern web component library built with TypeScript and Rollup, featuring the ck-editable-array component. Designed to be lightweight, reusable, and easy to integrate into any web project. Published to GitHub Packages for easy distribution and version management.

## 🚀 Features

- **Modern Web Components**: Built using native Custom Elements API
- **TypeScript Support**: Full TypeScript definitions included
- **Multiple Build Formats**: UMD, ES modules, and minified versions
- **GitHub Packages**: Published to GitHub Packages for easy distribution
- **Development Server**: Built-in development server for testing

## 📦 Installation

### Via GitHub Packages

First, configure npm to use GitHub Packages for this scope. Create or update your `.npmrc` file:

```
@colmkenna:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install the package:

```bash
npm install @colmkenna/ck-webcomponents/ck-editable-array
```

### Via CDN (if published to a CDN)

```html
<script src="https://unpkg.com/@colmkenna/ck-webcomponents/ck-editable-array@latest/dist/ck-editable-array/ck-editable-array.min.js"></script>
```

Then import in your JavaScript:

```javascript
import '@colmkenna/ck-webcomponents/ck-editable-array';
```

Or import specific components:

```javascript
import { CkEditableArray } from '@colmkenna/ck-webcomponents/ck-editable-array';
```

## 🧩 Components

### CkEditableArray Component

A simple greeting component with customizable name and color.

```html
<!-- Basic usage -->
<ck-editable-array></ck-editable-array>

<!-- With custom name -->
<ck-editable-array name="Developer"></ck-editable-array>

<!-- With custom name and color -->
<ck-editable-array name="Developer" color="#ff6b6b"></ck-editable-array>
```

#### Attributes

| Attribute | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| `name`    | string | "World" | The name to display in the greeting |
| `color`   | string | "#333"  | Text color for the message     |

#### Properties

The component also supports JavaScript property access:

```javascript
const ckEditableArray = document.querySelector('ck-editable-array');
ckEditableArray.name = 'New Name';
ckEditableArray.color = '#blue';
```

## 🛠️ Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ColmKenna/ck-editable-array-webcomponent.git
cd ck-editable-array-webcomponent
```

2. Install dependencies:
```bash
npm install
```

3. Start development mode:
```bash
npm run dev
```

4. Serve the demo page:
```bash
npm run serve
```

### Available Scripts

- `npm run build` - Build the library for production
- `npm run dev` - Build in watch mode for development
- `npm run serve` - Serve the dist folder on localhost:8080
- `npm run clean` - Clean the dist folder

### Project Structure

```
webcomponent-library/
├── src/
│   ├── components/
│   │   └── ck-editable-array/
│   │       ├── ck-editable-array.ts
│   │       └── ck-editable-array.styles.ts
│   └── index.ts
├── dist/
│   ├── index.html (demo page)
│   ├── ck-editable-array/
│   │   ├── ck-editable-array.js (UMD build)
│   │   ├── ck-editable-array.esm.js (ES module build)
│   │   └── ck-editable-array.min.js (minified UMD build)
│   └── index.d.ts (TypeScript definitions)
├── package.json
├── rollup.config.js
├── tsconfig.json
└── README.md
```

## 📖 Creating New Components

1. Create a new component file in `src/components/`:

```typescript
export class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        /* Component styles */
      </style>
      <div>
        <!-- Component template -->
      </div>
    `;
  }
}

// Register the component
if (!customElements.get('my-component')) {
  customElements.define('my-component', MyComponent);
}
```

2. Export the component in `src/index.ts`:

```typescript
export { MyComponent } from './components/my-component/my-component.component';
import './components/my-component/my-component.component';
```

## 🧪 Development & Testing

This project includes comprehensive testing, linting, and formatting setup.

### Available Scripts

- `npm run build` - Build the project for production
- `npm run dev` - Start development mode with watch
- `npm run serve` - Serve the built files for testing
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

Tests are written using Jest with jsdom environment for DOM testing. Test files are located in `__tests__` directories next to the components they test.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

### Code Quality

The project uses ESLint for code linting and Prettier for code formatting:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check if code is properly formatted
npm run format:check
```

### Adding New Components

1. Create a new directory under `src/components/`
2. Add your component TypeScript file
3. Create a corresponding test directory under `tests/` (e.g., `tests/my-component/`)
4. Add test files in the test directory
5. Export your component from `src/index.ts`
6. Run tests to ensure everything works

Example component structure:
```
src/components/my-component/
├── my-component.ts
tests/my-component/
└── my-component.test.ts
```

## 🚀 Publishing
 to GitHub Packages

### Automatic Publishing

The project is configured to automatically publish to GitHub Packages when you create a new release:

1. Update the version in `package.json`:
```bash
npm version patch  # or minor, major
```

2. Push the tag to GitHub:
```bash
git push origin --tags
```

3. The GitHub Action will automatically build and publish the package.

### Manual Publishing

You can also publish manually:

1. Build the project:
```bash
npm run build
```

2. Make sure you're authenticated with GitHub Packages:
```bash
npm login --scope=@colmkenna --registry=https://npm.pkg.github.com
```

3. Publish:
```bash
npm publish
```

## 📖 Using the Package

After installing, you can use the components in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
      import '@colmkenna/ck-webcomponents/ck-editable-array';
    </script>
</head>
<body>
    <ck-editable-array name="GitHub Packages"></ck-editable-array>
</body>
</html>
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions and support, please open an issue on GitHub.
