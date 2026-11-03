/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14233A',
        paper: '#F3F6F5',
        river: { 50: '#EAF5F2', 100: '#CFE8E1', 200: '#A5D3C7', 500: '#2A8A74', 600: '#1E6B5A', 700: '#17564A' },
        marigold: { 50: '#FFF8E6', 100: '#FDF0CF', 400: '#F2A71B', 600: '#A86A06' },
        brick: { 50: '#FBEDEA', 600: '#B3402A' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
