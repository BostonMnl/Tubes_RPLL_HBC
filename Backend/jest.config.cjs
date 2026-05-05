/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^models/(.*)$': '<rootDir>/models/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
};
