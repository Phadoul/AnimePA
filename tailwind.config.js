/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        anime: {
          bg: '#1a1a2e',
          surface: '#16213e',
          card: '#0f3460',
          accent: '#e94560',
          purple: '#7c3aed',
          green: '#10b981',
          yellow: '#f59e0b',
          blue: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
