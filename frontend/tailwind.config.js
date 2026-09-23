/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        agri: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(160deg, #ea580c 0%, #c2410c 50%, #9a3412 100%)',
        'hero-gradient':   'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
        'card-shine':      'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,247,237,0.7) 100%)',
      },
      boxShadow: {
        'card-orange': '0 2px 12px -2px rgba(234,88,12,0.12), 0 1px 4px -1px rgba(234,88,12,0.08)',
        'sidebar':     '4px 0 24px -4px rgba(154,52,18,0.25)',
      },
    },
  },
  plugins: [],
}

