import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        canvas: "#F6F7F9",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#EEF1F6",
          muted: "#E4E8F0",
          dark: "#0C1220",
          darkElevated: "#141C2E",
        },
        ink: {
          DEFAULT: "#0D1321",
          secondary: "#475569",
          muted: "#64748B",
        },
        cobalt: {
          50: "#EBF0FF",
          100: "#D6E2FF",
          200: "#ADC5FF",
          500: "#2458EB",
          600: "#1A4BE0",
          700: "#143BB5",
          800: "#102E8C",
        },
      },
      borderRadius: {
        card: "16px",
        panel: "12px",
        control: "10px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(13, 19, 33, 0.04)",
        elevated: "0 10px 30px -10px rgba(13, 19, 33, 0.12), 0 2px 8px -2px rgba(13, 19, 33, 0.06)",
        device: "0 24px 60px -16px rgba(12, 18, 32, 0.22), 0 4px 16px -4px rgba(12, 18, 32, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
