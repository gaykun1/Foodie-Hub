import nextJest from 'next/jest.js';
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
    testPathIgnorePatterns: [
        "<rootDir>/tests/e2e/"
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },

};

export default createJestConfig(customJestConfig);
