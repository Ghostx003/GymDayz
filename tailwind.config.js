/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gym: {
          dark: '#090d16',
          card: '#111726',
          cardHover: '#161f33',
          border: '#1e293b',
          borderLight: '#334155',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          accent: '#10b981', // Emerald green for attendance
          accentHover: '#059669',
          danger: '#ef4444', // Red for missed
          dangerHover: '#dc2626',
          electric: '#06b6d4', // Cyan for highlights
          purple: '#8b5cf6',
          muted: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-electric': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
