import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        background: "#0B0B0C",
        "background-soft": "#111113",
        surface: "#151518",
        "surface-soft": "#1B1B1F",
        "surface-light": "#F5F5F4",
        "surface-light-soft": "#E7E5E4",
        border: "#26262B",
        text: "#F5F5F5",
        "text-dark": "#111111",
        muted: "#A1A1AA",
        accent: "#C6A96B",
        "accent-soft": "#D9C195",
      },
      boxShadow: {
        glow: "0 18px 40px rgba(198, 169, 107, 0.18)",
        panel: "0 24px 70px rgba(0, 0, 0, 0.20)",
      },
      maxWidth: {
        page: "1280px",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(198, 169, 107, 0.18), transparent 28%), radial-gradient(circle at 85% 18%, rgba(255, 255, 255, 0.06), transparent 22%), linear-gradient(180deg, #0B0B0C 0%, #111113 100%)",
        "light-fade":
          "linear-gradient(180deg, rgba(245,245,244,1) 0%, rgba(231,229,228,0.92) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
