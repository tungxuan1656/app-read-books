const tailwindConfig = require('./assets/tailwindcss')

const withCssVars = (colorMap) => {
  const result = {}
  Object.keys(colorMap).forEach((key) => {
    result[key] = `var(--color-${key})`
  })
  return result
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ...withCssVars(tailwindConfig.appColorsClasses),
        primary: 'var(--color-primary)',
      },
      margin: {
        'inset-bottom-if-none-safe-area':
          'var(--inset-bottom-if-none-safe-area)',
        'inset-bottom-safe-area': 'var(--inset-bottom-safe-area)',
        'inset-top-safe-area': 'var(--inset-top-safe-area)',
        'inset-left-safe-area': 'var(--inset-left-safe-area)',
        'inset-right-safe-area': 'var(--inset-right-safe-area)',
      },
      boxShadow: {
        'density-1': '0px 4px 15px rgba(0, 0, 0, 0.05)',
        'density-1-a': '0px 4px 15px rgba(0, 0, 0, 0.35)',
        'density-2': '0px 4px 20px rgba(0, 0, 0, 0.05)',
        'density-2-a': '0px 4px 15px rgba(0, 0, 0, 0.35)',
        strong: '0px 8px 24px rgba(0, 0, 0, 0.1)',
        'strong-a': '0px 0px 15px rgba(0, 0, 0, 0.55)',
        'strong-1': '0px 4px 8px rgba(0, 0, 0, 0.1)',
        'strong-1-a': '0px 0px 6px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ...tailwindConfig.typoClasses,
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    },
  ],
}
