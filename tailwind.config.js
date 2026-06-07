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
          50:  '#c4c8d8',
          100: '#d0d4e4', // primary text (whiter)
          200: '#5eead4', // teal light (hover)
          300: '#00d4c8', // teal green accent
          400: '#6d728a', // muted text
          500: '#5a6080',
          600: '#484d6e', // border
          700: '#2d3148', // input / elevated surface
          800: '#2f3349', // card / tab surface (mid blue-grey)
          900: '#191c2d', // page background (dark navy)
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
