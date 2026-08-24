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
  } as unknown as MediaQueryList);
}

// jsdom has no clipboard API; the Stripe test-card hint copies to it.
if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    writable: true,
  });
}

/**
 * Next's navigation hooks throw outside an app-router context, which every
 * component under test now touches (Header routes on log-out, RequireAuth reads
 * the pathname, the auth screens read `?next=`). Mocking it once here keeps
 * individual tests focused on behaviour; a test needing specific values can
 * still re-mock the module itself.
 */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

beforeEach(() => {
  Object.values(mockRouter).forEach((fn) => fn.mockClear());
  window.localStorage.clear();
});
