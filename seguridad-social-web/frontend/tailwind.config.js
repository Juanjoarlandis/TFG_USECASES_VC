// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azulOscuro: '#003366',
        azulMedio: '#0055a5',
        azulClaro: '#e0e0e0',
        primary: '#004080',       // Asegúrate de incluir esto
        secondary: '#FFD700',
        blanco: '#ffffff',
        grisOscuro: '#333333',
        neutralLight: '#f1f1f1',    // Añade esta línea
        neutralDark: '#333333',     // Añade esta línea si no existe
      },
      fontFamily: {
        headings: ['Merriweather', 'serif'],
        body: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
