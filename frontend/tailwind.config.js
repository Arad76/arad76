export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        oil: { 50: '#fff8e1', 100: '#ffecb3', 200: '#ffe082', 300: '#ffd54f', 400: '#ffca28', 500: '#ffc107', 600: '#ffb300', 700: '#ffa000', 800: '#ff8f00', 900: '#ff6f00' },
        dark: { 900: '#0a0b0f', 800: '#111318', 700: '#1a1d26', 600: '#222633', 500: '#2d3344' },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ticker': 'ticker 20s linear infinite',
      },
      keyframes: {
        glow: { '0%': { boxShadow: '0 0 5px currentColor' }, '100%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' } },
        ticker: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(-100%)' } },
      },
    },
  },
  plugins: [],
}
