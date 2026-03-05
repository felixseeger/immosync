/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '.dark'],
  content: [
    './index.html',
    './src/**/*.tsx',
    './src/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        'neon-yellow': '#D9FF00',
        'panel-dark': '#1A1A1A',
        'border-dark': '#2A2A2A',
      },
    },
  },
}
