import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Main Colors - Concrete & Iron
        concrete: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#6c757d",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
          950: "#151619",
        },
        iron: {
          50: "#f4f6f8",
          100: "#e8edf2",
          200: "#d6dfe8",
          300: "#b8c8d8",
          400: "#8fa8c2",
          500: "#6b8cad",
          600: "#567396",
          700: "#475d7a",
          800: "#3d4f66",
          900: "#364456",
          950: "#1e2632",
        },
        steel: {
          50: "#f3f6f9",
          100: "#e6ebf1",
          200: "#d2dde8",
          300: "#b3c6d8",
          400: "#8ea8c4",
          500: "#7389b0",
          600: "#5f6f9e",
          700: "#525d8d",
          800: "#474f75",
          900: "#3d435f",
          950: "#282c3d",
        },
        // Accent Colors - Safety & Warning
        safety: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        alert: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
