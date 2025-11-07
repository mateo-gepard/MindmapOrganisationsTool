/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        orange: {
          DEFAULT: '#780000',
        },
        crimson: '#c1121f',
        cream: '#fdf0d5',
        navy: '#003049',
        blue: '#669bbc',
        
        // Area colors - using custom palette
        school: {
          DEFAULT: '#003049',
          light: '#669bbc',
          dark: '#780000',
        },
        sport: {
          DEFAULT: '#669bbc',
          light: '#fdf0d5',
          dark: '#003049',
        },
        business: {
          DEFAULT: '#c1121f',
          light: '#fdf0d5',
          dark: '#780000',
        },
        projects: {
          DEFAULT: '#780000',
          light: '#fdf0d5',
          dark: '#003049',
        },
        leisure: {
          DEFAULT: '#669bbc',
          light: '#fdf0d5',
          dark: '#003049',
        },
      },
      transitionDuration: {
        '200': '200ms',
      },
    },
  },
  plugins: [],
}
