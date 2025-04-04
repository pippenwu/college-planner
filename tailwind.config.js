/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['"Merriweather"', 'serif'],
        'body': ['"Source Sans Pro"', 'sans-serif'],
      },
      colors: {
        'academic': {
          navy: '#0A2540',
          gold: '#B69D74',
          cream: '#F8F5F0',
          burgundy: '#800020',
          slate: '#5A6875',
          light: '#E8E6E1',
        },
      },
    },
  },
  plugins: [],
}

