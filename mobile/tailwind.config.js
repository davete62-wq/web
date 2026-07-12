/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.js', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        leaf: '#16745b',
        ember: '#e85d2a',
        ink: '#17231f',
        mist: '#eff7f4',
        clay: '#bf5f37',
        skywash: '#dceefa'
      }
    }
  },
  plugins: []
};
