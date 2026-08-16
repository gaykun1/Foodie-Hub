import '@testing-library/jest-dom';

// jsdom doesn't implement matchMedia — needed by dark-mode/theme-aware
// components (e.g. ThemeToggle reading prefers-color-scheme).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}