import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Semantic color tokens for consistent UI
        accent: {
          DEFAULT: '#dc2626', // red-600
          hover: '#b91c1c',   // red-700
          light: '#fef2f2',   // red-50
          border: 'rgba(220,38,38,0.3)', // red-600/30
        },
        muted: {
          DEFAULT: '#6b7280', // gray-500 (WCAG AA on white)
          light: '#9ca3af',   // gray-400 (icons/decorative only)
        },
        success: {
          DEFAULT: '#16a34a', // green-600
          light: '#f0fdf4',   // green-50
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          light: '#fef2f2',   // red-50
        },
      },
      keyframes: {
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.88' },
        },
        'fade-in-out': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '15%': { opacity: '1', transform: 'translateY(0)' },
          '75%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'status-pulse': 'status-pulse 2.5s ease-in-out infinite',
        'fade-in-out': 'fade-in-out 1.2s ease-in-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;
