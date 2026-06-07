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
          50:  '#fdf3e3',
          100: '#f5e6d0',
          200: '#d4b87a',
          300: '#c8a46e',
          400: '#9a7550',
          500: '#6b4a28',
          600: '#4a2e14',
          700: '#291608',
          800: '#1e1108',
          900: '#130a03',
        },
      },
    },
  },
  plugins: [],
}
