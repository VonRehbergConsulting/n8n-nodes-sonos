module.exports = {
	bail: true,
	clearMocks: true,
	coverageProvider: 'v8',
	collectCoverageFrom: ['**/*.ts'],
	coverageDirectory: './coverage',
	coverageProvider: 'v8',
	coveragePathIgnorePatterns: ['dist', 'node_modules'],
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/*.test.ts'],
};
