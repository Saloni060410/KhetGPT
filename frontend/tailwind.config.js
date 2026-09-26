/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F1E8',
        ink: '#161A14',
        field: {
          50: '#EEF3EA',
          100: '#DCE7D3',
          500: '#4F7A3C',
          700: '#2F5230',
          900: '#1F3D2B',
        },
        clay: {
          100: '#F1DFCF',
          500: '#B5673A',
          700: '#8A4826',
        },
        risk: {
          low: '#4F7A3C',
          medium: '#C8902B',
          high: '#B23A2E',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
