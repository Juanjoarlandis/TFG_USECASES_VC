// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    es: {
        translation: {
            "welcome": "Bienvenido a la Seguridad Social",
            "verifyDNI": "Verificar CredencialDNI"
        }
    },
    en: {
        translation: {
            "welcome": "Welcome to Social Security",
            "verifyDNI": "Verify DNI"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "es", // idioma por defecto
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
