# Contributing to Web Component Library

Thank you for your interest in contributing to this web component library! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Git
- GitHub account with access to GitHub Packages

### Local Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/yourusername/webcomponent-library.git
cd webcomponent-library
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

## 📦 Package Management

This project uses GitHub Packages for distribution. To work with the package:

### Installing from GitHub Packages

```bash
# Configure npm for GitHub Packages
echo "@yourusername:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# Install the package
npm install @yourusername/webcomponent-library
```

### Publishing

Publishing is automated through GitHub Actions when tags are pushed:

```bash
npm version patch  # or minor, major
git push origin --tags
```

## 🧩 Adding New Components

1. Create a new component directory:
```
src/components/my-new-component/
└── my-new-component.component.ts
```

2. Follow the component template:
```typescript
export class MyNewComponent extends HTMLElement {
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
if (!customElements.get('my-new-component')) {
  customElements.define('my-new-component', MyNewComponent);
}
```

3. Export in `src/index.ts`:
```typescript
export { MyNewComponent } from './components/my-new-component/my-new-component.component';
import './components/my-new-component/my-new-component.component';
```

4. Add demo to `dist/index.html`

## 🛠 Development Workflow

1. Create a feature branch:
```bash
git checkout -b feature/my-new-component
```

2. Make your changes

3. Run quality checks:
```bash
npm run type-check        # TypeScript type checking (source)
npm run type-check:tests  # TypeScript type checking (tests)
npm run lint              # ESLint
npm test                  # Run test suite
npm run build             # Build for production
```

4. Commit your changes:
```bash
git add .
git commit -m "feat: add my new component"
```

5. Push and create a Pull Request

## 📋 Code Standards

- Use TypeScript for all components
- Follow existing naming conventions
- Include JSDoc comments for public APIs
- Use Shadow DOM for style encapsulation
- Test components in the demo page
- **No `any` types in source code** (enforced by ESLint)
- Run `npm run type-check` before committing

## 🔖 Versioning

We use [Semantic Versioning](https://semver.org/):

- **PATCH**: Bug fixes and small improvements
- **MINOR**: New features that don't break existing functionality
- **MAJOR**: Breaking changes

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
