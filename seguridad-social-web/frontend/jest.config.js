/** @type {import('jest').Config} */
module.exports = {
    roots: ['<rootDir>/src'],
    testEnvironment: 'jsdom',
    transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
    // transpile every ESM package you list here:
    transformIgnorePatterns: [
        '/node_modules/(?!axios)/'
    ],
    moduleNameMapper: {
        '^axios$': 'axios/dist/node/axios.cjs'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
