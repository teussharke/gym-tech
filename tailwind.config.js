/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
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
        // i9 Fitness brand colors
        i9: {
          orange: '#FF6B00',
          black:  '#09090E',
          white:  '#ffffff',
        },
        // Dark theme surfaces
        dark: {
          base:      '#09090E',
          surface:   '#111118',
          card:      '#14141C',
          'card-h':  '#1A1A24',
          input:     '#1C1C26',
          chip:      '#1E1E2A',
          border:    'rgba(255,255,255,0.06)',
          'border-c':'rgba(255,255,255,0.08)',
        },
        // Neon orange
        neon: {
          DEFAULT:   '#FF6B00',
          dim:       'rgba(255,107,0,0.15)',
          glow:      'rgba(255,107,0,0.35)',
          soft:      'rgba(255,107,0,0.12)',
          ring:      'rgba(255,107,0,0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'neon':     '0 0 20px rgba(255,107,0,0.35), 0 0 60px rgba(255,107,0,0.08)',
        'neon-sm':  '0 0 10px rgba(255,107,0,0.3)',
        'neon-lg':  '0 0 30px rgba(255,107,0,0.4), 0 0 80px rgba(255,107,0,0.1)',
        'card-dark':'0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':      'fade-in 0.3s ease-out',
        'fade-in-up':   'fade-in-up 0.4s ease-out',
        'slide-in':     'slide-in 0.4s ease-out',
        'slide-right':  'slide-in-right 0.3s ease-out',
        'slide-left':   'slide-in-left 0.3s ease-out',
        'scale-in':     'scale-in 0.3s ease-out',
        'bounce-in':    'bounce-in 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'float':        'float 3s ease-in-out infinite',
        'spin-slow':    'spin-slow 3s linear infinite',
        'pulse-ring':   'pulse-ring 1.5s ease-out infinite',
      },
      keyframes: {
        'fade-in':       { from: { opacity: '0', transform: 'translateY(8px)'  }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-up':    { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in':      { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right':{ from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'slide-in-left': { from: { opacity: '0', transform: 'translateX(-20px)'}, to: { opacity: '1', transform: 'translateX(0)' } },
        'scale-in':      { from: { opacity: '0', transform: 'scale(0.95)'      }, to: { opacity: '1', transform: 'scale(1)'     } },
        'bounce-in':     { '0%': { opacity: '0', transform: 'scale(0.3)' }, '50%': { opacity: '1', transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.9)' }, '100%': { transform: 'scale(1)' } },
        'float':         { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        'spin-slow':     { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'pulse-ring':    { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(1.5)', opacity: '0' } },
      },
    },
  },
  plugins: [],
}
