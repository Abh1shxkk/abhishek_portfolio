// Tailwind is compiled at build time (PostCSS), not in the browser. Colours read the CSS variables
// defined in public/styles.css, so light and dark themes switch by changing variables.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './seo/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bungee', 'Impact', 'sans-serif'],
        marker: ['"Permanent Marker"', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: token('paper'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        saffron: token('saffron'),
        amber: token('amber'),
        coral: token('coral'),
        rose: token('rose'),
        // Legacy names still used by the blog pages, mapped onto the new palette
        'geo-black': token('ink'),
        'geo-gray': token('paper'),
        'geo-line': token('line'),
        'geo-dark-bg': token('paper'),
        'geo-dark-card': token('surface'),
        'geo-dark-border': token('line'),
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)',
        lift: '0 2px 4px rgb(0 0 0 / 0.04), 0 24px 48px -20px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
};
