/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        accent: '#f97316'
      }
    }
  },
  plugins: []
};
