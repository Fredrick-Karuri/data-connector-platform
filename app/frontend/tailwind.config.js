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
      colors: {
        // Surfaces
        'bg-base':    'var(--color-bg-base)',
        'bg-raised':  'var(--color-bg-raised)',
        'bg-overlay': 'var(--color-bg-overlay)',
        // Borders
        'border-subtle': 'var(--color-border)',
        // Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary':'var(--color-text-secondary)',
        'text-muted':   'var(--color-text-muted)',
        'text-faint':   'var(--color-text-faint)',
        // Accent
        'accent':       'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        // State
        'success':      'var(--color-success)',
        'danger':       'var(--color-danger)',
        // Semantic surfaces
        'surface-danger': 'var(--color-surface-danger)',
        'surface-accent': 'var(--color-surface-accent)',
        'surface-success':'var(--color-surface-success)',
      },
      keyframes: {
        shimmer: { '0%,100%': { backgroundPosition: '200% 0' }, '50%': { backgroundPosition: '0% 0' } },
        slide:   { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
        slide:   'slide 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}