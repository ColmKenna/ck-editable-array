// Jest setup file for DOM testing

// jsdom provides a native customElements implementation that properly stores and retrieves element definitions.
// We rely on jsdom's native implementation rather than custom mocking to ensure correct Web Component lifecycle.
// If you need to mock or spy on customElements methods, do so in individual tests using jest.spyOn().

// Ensure global references are properly set up for Web Component tests
global.HTMLElement = window.HTMLElement;
global.customElements = window.customElements;
