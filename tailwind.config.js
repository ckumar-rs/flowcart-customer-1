/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F4F6',
          100: '#C5E3E8',
          200: '#9FD0D9',
          300: '#79BDCA',
          400: '#5CAFBE',
          500: '#1D828E',
          600: '#1A7580',
          700: '#166570',
          800: '#125560',
          900: '#0E424A',
        },
        background: '#FCFAF8',
      },
    },
  },
  plugins: [],
};

