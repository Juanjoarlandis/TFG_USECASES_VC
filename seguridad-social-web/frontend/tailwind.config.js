// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {

  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azulOscuro: '#003366',
        azulMedio: '#0055a5',
        azulClaro: '#e0e0e0',
        primary: '#004080',   // Color principal
        secondary: '#FFD700', // Color secundario (dorado)
        blanco: '#ffffff',
        grisOscuro: '#333333',
        neutralLight: '#f1f1f1',
        neutralDark: '#333333',
      },
      fontFamily: {
        headings: ['Merriweather', 'serif'],
        body: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
