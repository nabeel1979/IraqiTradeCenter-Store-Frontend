/** @type {import('tailwindcss').Config} */

export default {

  darkMode: 'class',

  content: ['./index.html', './src/**/*.{ts,tsx}'],

  theme: {

    extend: {

      colors: {

        // مطابق لـ theme-company في تطبيق الشركات (ذهبي فاتح — بدون بني طوخ)

        brand: {

          50:  '#f9f7f4',

          100: '#f0ebe3',

          200: '#e5d9c8',

          300: '#d4bc94',

          400: '#c4a063',

          500: '#b08840',

          600: '#92742f',

          700: '#785f26',

          800: '#5e4b1e',

          900: '#4a3b18',

          950: '#2e2410',

        },

        surface: {

          DEFAULT: '#e0dad0',

          card: '#f9f7f4',

        },

      },

      fontFamily: {

        sans: ['Cairo', 'Inter', 'sans-serif'],

      },

      animation: {

        'fade-in': 'fadeIn 0.3s ease-in-out',

        'slide-up': 'slideUp 0.4s ease-out',

      },

      keyframes: {

        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },

        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },

      },

    },

  },

  plugins: [require('tailwindcss-animate')],

};

