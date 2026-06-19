import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Медовая палитра, взятая из логотипа «Умарта» (соты + янтарь/охра)
        brand: {
          50: "#fdf8ee",
          100: "#f9ecd2",
          200: "#f2d9a7",
          300: "#e9c074",
          400: "#dba23f",
          500: "#c8851a", // основной янтарь (фоны, границы, иконки)
          600: "#a66c12", // CTA-фон / hover
          700: "#824f10", // акцент-текст (контраст ≥ 4.5:1 на белом)
          800: "#653d0c", // hover для текстовых ссылок
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
