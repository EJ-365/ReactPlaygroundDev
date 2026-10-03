/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: v('app'),
        sidebar: v('sidebar'),
        editor: v('editor'),
        elevated: v('elevated'),
        tabs: v('tabs'),
        statusbar: v('statusbar'),
        'status-fg': v('status-fg'),
        fg: v('fg'),
        muted: v('muted'),
        accent: v('accent'),
        'accent-fg': v('accent-fg'),
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Geist', 'Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        code: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--c-accent) / 0.35), 0 10px 40px rgb(var(--c-accent) / 0.18)',
      },
    },
  },
  plugins: [],
}
