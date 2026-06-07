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
          50:  '#f4faf7',
          100: '#f0ece2', // warm cream (pool-side stone walls)
          200: '#6ee7b7', // light emerald
          300: '#34d399', // glowing emerald accent (pool surface highlights)
          400: '#6db38a', // muted sage text
          500: '#2d7a52', // medium forest green
          600: '#1e4a36', // border green
          700: '#132b22', // input background
          800: '#0d201a', // card surface
          900: '#070e09', // page background (near-black green)
        },
      },
    },
  },
  plugins: [],
}
