/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          300: '#f4a08a',
          400: '#e07055',
          500: '#c4573e',
        },
        leather: {
          50:  '#f0f0f0',
          100: '#f0f0f0', // primary text
          200: '#5eead4', // teal light
          300: '#00d4c8', // teal accent (highlighted scores/times)
          400: '#666666', // muted text
          500: '#3a3a3a', // medium
          600: '#2a2a2a', // border
          700: '#1a1a1a', // input / elevated surface
          800: '#111111', // card surface
          900: '#090909', // page background
        },
      },
    },
  },
  plugins: [],
}
