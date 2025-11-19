/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0e14',
        card: '#161b22',
        border: '#30363d',
        primary: '#3b82f6',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        text: '#e6edf3',
        'text-muted': '#8b949e',
      },
    },
  },
  plugins: [],
}
