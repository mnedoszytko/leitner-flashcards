/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'from-red-50',
    'to-red-100',
    'from-yellow-50',
    'to-yellow-100',
    'from-blue-50',
    'to-blue-100',
    'from-green-50',
    'to-green-100',
    'border-red-300',
    'border-yellow-300',
    'border-blue-300',
    'border-green-300',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}