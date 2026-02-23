import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shrink: {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
        "slide-in-from-bottom-4": {
          "0%": { transform: "translateY(1rem)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shrink: "shrink linear forwards",
        "in": "fade-in 0.3s ease-out, slide-in-from-bottom-4 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
