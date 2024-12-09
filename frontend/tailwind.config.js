/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokyo Night color palette
        background: {
          DEFAULT: '#1a1b26',
          secondary: '#16161e',
        },
        foreground: {
          DEFAULT: '#c0caf5',
          muted: '#6272a4',
        },
        primary: {
          DEFAULT: '#7aa2f7',
          hover: '#89b4fa',
        },
        secondary: {
          DEFAULT: '#9ece6a',
          hover: '#a9dc76',
        },
        accent: {
          DEFAULT: '#bb9af7',
          hover: '#c678dd',
        },
        destructive: {
          DEFAULT: '#f7768e',
          hover: '#ff7a93',
        },
        border: {
          DEFAULT: '#2a2b3d',
        },
        text: {
          DEFAULT: '#c0caf5',
          muted: '#6272a4',
          inverse: '#1a1b26',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'tokyo-dark': '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'tokyo': '0.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
