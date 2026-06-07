/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        leather: {
          50:  '#f0f0f0',
          100: '#f0f0f0', // primary text
          200: '#5eead4', // teal light (hover)
          300: '#00d4c8', // teal green accent
          400: '#666666', // muted text
          500: '#3a3a3a',
          600: '#2a2a2a', // border
          700: '#1a1a1a', // input / elevated surface
          800: '#111111', // card surface
          900: '#090909', // page background
        },
        gym: {
          yellow: '#fbbf24',
          red:    '#f87171',
        },
      },
    },
  },
  plugins: [],
}
