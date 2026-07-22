/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:      "#FFFFFF",
          bg2:     "#FFFFFF",
          bg3:     "#F1F1F1",
          cyan:    "#161616",
          blue:    "#E4002B",
          purple:  "#161616",
          pink:    "#E4002B",
          red:     "#A8001B",
          green:   "#1C7A4D",
          yellow:  "#B5790C",
          border:  "rgba(22,22,22,0.15)",
          borderB: "rgba(22,22,22,0.85)",
        },
      },
      fontFamily: {
        mono: ["'Helvetica Neue'", "Arial", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan":  "3px 3px 0 #161616",
        "neon-blue":  "3px 3px 0 #E4002B",
        "neon-green": "3px 3px 0 #1C7A4D",
        "neon-red":   "3px 3px 0 #A8001B",
        "card":       "3px 3px 0 rgba(22,22,22,0.9)",
      },
      animation: {
        "flicker":    "flicker 4s infinite",
        "scan":       "scan 8s linear infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
      },
      keyframes: {
        flicker: {
          "0%,95%,100%": { opacity: "1" },
          "96%": { opacity: "0.9" },
          "97%": { opacity: "1" },
          "98%": { opacity: "0.92" },
        },
        scan: {
          "0%":   { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100vh" },
        },
        "pulse-neon": {
          "0%,100%": { transform: "scale(1)",    opacity: "1" },
          "50%":     { transform: "scale(1.03)", opacity: "0.9" },
        },
      },
    },
  },
  plugins: [],
};
