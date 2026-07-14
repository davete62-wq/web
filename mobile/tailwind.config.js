/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './services/**/*.{js,jsx,ts,tsx}', './store/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        skyPulse: '#38bdf8',
        skyDeep: '#0284c7',
        freshGreen: '#6bd425',
        freshDeep: '#2f8f18',
        softBeige: '#f5ead8',
        sand: '#dfc6a7',
        ink: '#111827',
        smoke: '#64748b',
        danger: '#ef4444'
      },
      fontFamily: {
        poppins: ['Poppins_400Regular'],
        poppinsSemi: ['Poppins_600SemiBold'],
        poppinsBold: ['Poppins_700Bold'],
        exo: ['Exo2_700Bold']
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      }
    }
  },
  plugins: []
};
