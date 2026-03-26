export default {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js"],
    setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.js"],
    clearMocks: true,
};