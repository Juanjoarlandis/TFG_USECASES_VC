// jest.config.js (colócalo en la raíz de tu carpeta `backend/`)
module.exports = {
    // 1. Usar el entorno de Node para ejecutar los tests
    testEnvironment: 'node',

    // 2. Directorios donde Jest buscará tus test files
    roots: ['./tests'],

    // 3. Patrón para encontrar archivos de test (tanto .spec.js como .test.js)
    testMatch: ['**/?(*.)+(spec|test).js'],

    // 4. Cargar variables de entorno antes de ejecutar los tests
    setupFilesAfterEnv: ['./jest.setup.js'],

    // 5. Permitir resolver imports desde 'src' además de 'node_modules'
    moduleDirectories: ['node_modules', '<rootDir>/src'],

    // 6. Generación de cobertura y carpeta de salida
    collectCoverage: true,
    coverageDirectory: './coverage',

    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },

    // 7. Ignorar la carpeta de dependencias y builds
    testPathIgnorePatterns: ['/node_modules/', '/dist/']
};
