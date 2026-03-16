/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Brand gold ── */
        primary: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',   // main
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        /* ── Cyan accent ── */
        accent: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        /* ── Dark surfaces ── */
        dark: {
          700: '#181830',
          800: '#111120',
          850: '#0d0d1a',
          900: '#07070e',
        },
      },

      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'Arial Black', 'Impact', 'sans-serif'],
      },

      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold':    'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
        'gradient-aurora':  'linear-gradient(135deg, #fbbf24 0%, #06b6d4 100%)',
        'gradient-surface': 'linear-gradient(180deg, #111120 0%, #07070e 100%)',
      },

      boxShadow: {
        gold:    '0 0 40px rgba(245,158,11,0.30)',
        'gold-sm':'0 0 16px rgba(245,158,11,0.22)',
        cyan:    '0 0 30px rgba(6,182,212,0.35)',
        card:    '0 4px 28px rgba(0,0,0,0.45)',
        float:   '0 20px 60px rgba(0,0,0,0.55)',
        inner:   'inset 0 1px 0 rgba(245,158,11,0.1)',
      },

      borderColor: {
        DEFAULT: 'rgba(245,158,11,0.10)',
        gold:    'rgba(245,158,11,0.20)',
        'gold-lg':'rgba(245,158,11,0.35)',
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      animation: {
        'fade-up':    'fadeUp    0.5s  cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':   'slideUp   0.55s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn    0.35s ease both',
        'scale-in':   'scaleIn   0.4s  cubic-bezier(0.16,1,0.3,1) both',
        'float':      'floatY    3s    ease-in-out infinite',
        'float-slow': 'floatYSlow 5s  ease-in-out infinite',
        'ping-md':    'pingMd    1.8s  cubic-bezier(0,0,0.2,1) infinite',
        'star-twinkle':'starTwinkle 2.8s ease-in-out infinite',
        'star-spin':  'starSpin  7s    linear infinite',
        'star-pulse': 'starPulse 2s    ease-in-out infinite',
        'arc-rotate': 'arcRotate 1.1s  linear infinite',
        'orbit':      'orbit     3s    linear infinite',
        'shimmer':    'shimmerLoad 1.8s infinite',
      },

      keyframes: {
        fadeUp:      { from:{opacity:0,transform:'translateY(22px)'}, to:{opacity:1,transform:'translateY(0)'} },
        slideUp:     { from:{opacity:0,transform:'translateY(44px)'}, to:{opacity:1,transform:'translateY(0)'} },
        fadeIn:      { from:{opacity:0}, to:{opacity:1} },
        scaleIn:     { from:{opacity:0,transform:'scale(0.88)'}, to:{opacity:1,transform:'scale(1)'} },
        floatY:      { '0%,100%':{transform:'translateY(0px)'}, '50%':{transform:'translateY(-14px)'} },
        floatYSlow:  { '0%,100%':{transform:'translateY(0px) rotate(-4deg)'}, '50%':{transform:'translateY(-18px) rotate(4deg)'} },
        pingMd:      { '0%':{transform:'scale(1)',opacity:'0.6'}, '75%,100%':{transform:'scale(2)',opacity:'0'} },
        orbit:       { from:{transform:'rotate(0deg)'}, to:{transform:'rotate(360deg)'} },
        arcRotate:   { from:{transform:'rotate(0deg)'}, to:{transform:'rotate(360deg)'} },
        starTwinkle: {
          '0%,100%':{ transform:'scale(1) rotate(0deg)',    opacity:'1'   },
          '20%':    { transform:'scale(1.3) rotate(15deg)', opacity:'0.8' },
          '40%':    { transform:'scale(0.8) rotate(-8deg)', opacity:'0.6' },
          '60%':    { transform:'scale(1.2) rotate(6deg)',  opacity:'0.9' },
          '80%':    { transform:'scale(0.9) rotate(-3deg)', opacity:'0.75'},
        },
        starSpin:    { from:{transform:'rotate(0deg)'}, to:{transform:'rotate(360deg)'} },
        starPulse:   {
          '0%,100%': { filter:'drop-shadow(0 0 4px rgba(245,158,11,0.8))' },
          '50%':     { filter:'drop-shadow(0 0 18px rgba(245,158,11,1)) drop-shadow(0 0 36px rgba(245,158,11,0.4))' },
        },
        shimmerLoad: { '0%':{backgroundPosition:'200% 0'}, '100%':{backgroundPosition:'-200% 0'} },
      },
    },
  },
  plugins: [],
};