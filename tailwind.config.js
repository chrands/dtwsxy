/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1499A8',
          light: '#E0F2F4',
          dark: '#0E737E',
        },
        dark: '#334155',
        sub: '#94A3B8',
        bg: '#F0EEE6',
      },
      boxShadow: {
        'float': '0 8px 20px -8px rgba(20, 153, 168, 0.15)',
        'card': '0 2px 4px -1px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
