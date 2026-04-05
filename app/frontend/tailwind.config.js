/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.ts',
  ],
theme: {
  extend: {
    fontFamily: {
      mono: ["'IBM Plex Mono'", 'monospace'],
      sans: ["'IBM Plex Sans'", 'sans-serif'],
    },
  },
},
  plugins: [],
}