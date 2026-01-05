/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: { light: '#93C5FD', DEFAULT: '#3B82F6', dark: '#1E40AF' },
      },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
  },
};
