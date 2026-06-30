/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        'mil-black': '#050505', // Deep OLED Black
        'mil-panel': '#0a0a0a', // Slightly lighter panel bg
        'mil-green': '#33ff33', // HUD Green
        'mil-green-dim': 'rgba(51, 255, 51, 0.2)',
        'mil-tan': '#d2b48c', // Coyote Tan
        'mil-tan-dark': '#8b7355',
        'mil-alert': '#ff3333', // Critical Red
        'mil-warn': '#ffaa00', // Warning Amber
        'mil-border': '#1f1f1f', // Dark metal border
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '20px 20px'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
    },
  },
  plugins: [],
}
