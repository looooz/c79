/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        wood: {
          50: "#EFEBE9",
          100: "#D7CCC8",
          200: "#BCAAA4",
          300: "#A1887F",
          400: "#8D6E63",
          500: "#795548",
          600: "#6D4C41",
          700: "#5D4037",
          800: "#4E342E",
          900: "#3E2723",
        },
        metal: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
          500: "#9E9E9E",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
        },
        accent: {
          orange: "#FF9800",
          green: "#4CAF50",
          red: "#F44336",
          blue: "#2196F3",
          yellow: "#FFC107",
        },
      },
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        sans: ["Noto Sans SC", "system-ui", "sans-serif"],
      },
      keyframes: {
        "spin-slow": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(255, 152, 0, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(255, 152, 0, 0.9)" },
        },
        shake: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translate(-2px, 1px)" },
          "20%, 40%, 60%, 80%": { transform: "translate(2px, -1px)" },
        },
        "float-up": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scale(1.3)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        "float-up": "float-up 0.8s ease-out forwards",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
