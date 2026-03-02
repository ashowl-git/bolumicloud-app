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
