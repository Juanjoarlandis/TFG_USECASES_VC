// jest.setup.js
import '@testing-library/jest-dom';

// Mock global de axios para que devuelva siempre { data: {} }
jest.mock('axios', () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve({ data: {} }))
}));

// Mock de react-i18next para tests
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: { changeLanguage: () => Promise.resolve() }
    }),
    initReactI18next: {
        type: '3rdParty',
        init: () => { }
    }
}));
