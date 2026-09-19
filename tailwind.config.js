/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // "The Ledger" — light magenta theme
        'ledger-red': '#C2255C', // primary accent (kept the token name so existing className usages don't need renaming)
        'ledger-magenta': '#C2255C',
        'ledger-magenta-light': '#F6D8E4',
        'ledger-dark': '#2B0B1F',
        'ledger-gray': '#8E8E93',
        'ledger-bg': '#FDF1F6',
        'status-red': '#D21F3C',
        'status-orange': '#E08A1E',
        'status-green': '#1E9E5A',
      },
    },
  },
  plugins: [],
};
