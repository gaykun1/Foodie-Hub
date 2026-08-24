import nextJest from 'next/jest.js';
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
    testPathIgnorePatterns: [
        "<rootDir>/tests/e2e/"
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        // Mirrors the `@/*` -> `./src/*` mapping in tsconfig.json. This used to
        // point at <rootDir>, which only went unnoticed because the suites
        // imported types (erased at runtime) rather than real modules.
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/test-utils/**",
    ],
};

export default createJestConfig(customJestConfig);
