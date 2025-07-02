/**
 * @file jest.config.js
 * @description Configuración de Jest para el proyecto de backend.
 *
 * @see {@link https://jestjs.io/docs/configuration|Documentación de configuración de Jest}
 *
 * @module jest.config
 */

module.exports = {
    /**
     * @memberof module:jest.config
     * @property {string} testEnvironment
     * @default 'node'
     * @description
     *   Entorno en el que se ejecutan los tests.  
     *   Usamos 'node' para simular un entorno de servidor.
     */
    testEnvironment: 'node',

    /**
     * @memberof module:jest.config
     * @property {string[]} roots
     * @description
     *   Directorios raíz donde Jest buscará los archivos de tests.
     *   En este caso, se busca en la carpeta `tests` del proyecto.
     */
    roots: ['./tests'],

    /**
     * @memberof module:jest.config
     * @property {string[]} testMatch
     * @description
     *   Patrón glob para localizar archivos de test.
     *   Se incluyen archivos con sufijos `.spec.js` o `.test.js`.
     */
    testMatch: ['**/?(*.)+(spec|test).js'],

    /**
     * @memberof module:jest.config
     * @property {string[]} setupFilesAfterEnv
     * @description
     *   Scripts que se ejecutan después de configurar el entorno de tests,
     *   por ejemplo para interceptar llamadas HTTP o cargar variables de entorno.
     */
    setupFilesAfterEnv: ['./jest.setup.js'],

    /**
     * @memberof module:jest.config
     * @property {string[]} moduleDirectories
     * @description
     *   Directorios donde Jest resolverá módulos importados.
     *   Incluye `node_modules` y la carpeta `src` para imports absolutos.
     */
    moduleDirectories: ['node_modules', '<rootDir>/src'],

    /**
     * @memberof module:jest.config
     * @property {boolean} collectCoverage
     * @default true
     * @description
     *   Habilita la recolección de información de cobertura de código.
     */
    collectCoverage: true,

    /**
     * @memberof module:jest.config
     * @property {string} coverageDirectory
     * @default './coverage'
     * @description
     *   Carpeta donde Jest depositará los informes de cobertura.
     */
    coverageDirectory: './coverage',

    /**
     * @memberof module:jest.config
     * @property {object} coverageThreshold
     * @description
     *   Umbrales mínimos de cobertura de código.
     *   Si no se alcanza el porcentaje especificado, Jest falla.
     */
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },

    /**
     * @memberof module:jest.config
     * @property {string[]} testPathIgnorePatterns
     * @description
     *   Directorios o patrones de ruta que Jest debe ignorar al buscar tests.
     *   Se excluyen `node_modules` y builds de producción (`dist`).
     */
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
