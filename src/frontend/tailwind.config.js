/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pharma: {
          blue: '#1565C0',
          lightBlue: '#1976D2',
          teal: '#00695C',
          amber: '#F57C00',
          red: '#C62828',
          green: '#2E7D32',
          gray: '#546E7A',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
