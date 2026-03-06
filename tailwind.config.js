/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.tsx',
    './src/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        'neon-yellow': '#D9FF00',
        'neon-green': '#00FF88',
        'panel-dark': '#1A1A1A',
        'border-dark': '#2A2A2A',
      },
    },
  },
}
