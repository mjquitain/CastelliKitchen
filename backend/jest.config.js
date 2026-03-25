export default {
    testEnvironment: "node",
    testMatch: ["**/tests/integration/**/*.test.js"],
    setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.js"],
    clearMocks: true,
};
