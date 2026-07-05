/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#08090E',
          surface: '#0F1018',
          card:    '#13141C',
          elevated:'#1A1B26',
        },
        border: {
          DEFAULT: '#1E2030',
          subtle:  '#13141C',
          strong:  '#2D3055',
        },
        text: {
          primary:   '#E2E8F0',
          secondary: '#94A3B8',
          muted:     '#475569',
          inverse:   '#0F1018',
        },
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#818CF8',
          glow: 'rgba(129,140,248,0.20)',
        },
        // Agent accent palette
        strategist: {
          DEFAULT: '#818CF8',
          dim:     'rgba(129,140,248,0.12)',
          glow:    'rgba(129,140,248,0.20)',
        },
        mentor: {
          DEFAULT: '#34D399',
          dim:     'rgba(52,211,153,0.12)',
          glow:    'rgba(52,211,153,0.20)',
        },
        examiner: {
          DEFAULT: '#FBBF24',
          dim:     'rgba(251,191,36,0.12)',
          glow:    'rgba(251,191,36,0.20)',
        },
        coach: {
          DEFAULT: '#F87171',
          dim:     'rgba(248,113,113,0.12)',
          glow:    'rgba(248,113,113,0.20)',
        },
        resource: {
          DEFAULT: '#22D3EE',
          dim:     'rgba(34,211,238,0.12)',
          glow:    'rgba(34,211,238,0.20)',
        },
        reflection: {
          DEFAULT: '#C084FC',
          dim:     'rgba(192,132,252,0.12)',
          glow:    'rgba(192,132,252,0.20)',
        },
        success: '#34D399',
        warning: '#FBBF24',
        error:   '#F87171',
        info:    '#60A5FA',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      boxShadow: {
        'glow-primary':    '0 0 24px rgba(129,140,248,0.25)',
        'glow-sm':         '0 0 12px rgba(129,140,248,0.15)',
        'glow-mentor':     '0 0 24px rgba(52,211,153,0.25)',
        'glow-examiner':   '0 0 24px rgba(251,191,36,0.25)',
        'glow-coach':      '0 0 24px rgba(248,113,113,0.25)',
        'glow-resource':   '0 0 24px rgba(34,211,238,0.25)',
        'glow-reflection': '0 0 24px rgba(192,132,252,0.25)',
        'card':      '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover':'0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        'modal':     '0 32px 64px rgba(0,0,0,0.8)',
        'inner-glow':'inset 0 1px 0 rgba(255,255,255,0.05)',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-subtle': `
          radial-gradient(at 20% 10%, rgba(99,102,241,0.07) 0px, transparent 50%),
          radial-gradient(at 80% 5%,  rgba(192,132,252,0.05) 0px, transparent 50%),
          radial-gradient(at 5%  60%, rgba(52,211,153,0.05)  0px, transparent 50%),
          radial-gradient(at 90% 55%, rgba(34,211,238,0.04)  0px, transparent 50%),
          radial-gradient(at 50% 95%, rgba(99,102,241,0.06)  0px, transparent 50%)
        `,
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'hero-beam':  'linear-gradient(180deg, rgba(99,102,241,0.12) 0%, transparent 60%)',
      },

      animation: {
        'fade-in':        'fadeIn 0.35s ease-out both',
        'fade-up':        'fadeUp 0.45s ease-out both',
        'fade-up-slow':   'fadeUp 0.65s ease-out both',
        'fade-down':      'fadeDown 0.3s ease-out both',
        'slide-right':    'slideRight 0.3s ease-out both',
        'slide-left':     'slideLeft 0.3s ease-out both',
        'scale-in':       'scaleIn 0.2s ease-out both',
        'glow-pulse':     'glowPulse 3s ease-in-out infinite',
        'float':          'float 5s ease-in-out infinite',
        'shimmer':        'shimmer 2.4s linear infinite',
        'spin-slow':      'spin 10s linear infinite',
        'bounce-gentle':  'bounceGentle 2.5s ease-in-out infinite',
        'ping-slow':      'ping 2.5s cubic-bezier(0,0,0.2,1) infinite',
      },

      keyframes: {
        fadeIn:       { from: { opacity: 0 },                             to: { opacity: 1 } },
        fadeUp:       { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeDown:     { from: { opacity: 0, transform: 'translateY(-10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight:   { from: { opacity: 0, transform: 'translateX(18px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        slideLeft:    { from: { opacity: 0, transform: 'translateX(-18px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:      { from: { opacity: 0, transform: 'scale(0.94)' },   to: { opacity: 1, transform: 'scale(1)' } },
        glowPulse:    { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.45 } },
        float:        { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer:      { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        bounceGentle: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.175,0.885,0.32,1.275)',
        smooth: 'cubic-bezier(0.4,0,0.2,1)',
      },

      transitionDuration: {
        250: '250ms',
        350: '350ms',
        400: '400ms',
      },

      borderRadius: {
        '4xl': '28px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
