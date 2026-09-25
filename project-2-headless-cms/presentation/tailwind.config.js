/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cms: {
          dark: '#0c0d12',
          surface: '#14161e',
          card: '#1b1e28',
          cardHover: '#232734',
          border: 'rgba(255, 45, 117, 0.22)',
          pink: '#ff2d75',
          pinkHover: '#ff528f',
          pinkLight: '#ff75a0',
          pinkGlow: 'rgba(255, 45, 117, 0.35)',
          pinkSubtle: 'rgba(255, 45, 117, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'pink-glow': '0 0 20px rgba(255, 45, 117, 0.35)',
        'pink-card': '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(255, 45, 117, 0.15)',
      },
    },
  },
  plugins: [],
}
