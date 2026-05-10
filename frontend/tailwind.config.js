/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:      "#000033",
          bg2:     "#000044",
          bg3:     "#000066",
          cyan:    "#00FFFF",
          blue:    "#1E90FF",
          purple:  "#7B2FBE",
          pink:    "#FF00FF",
          red:     "#FF2D55",
          green:   "#00FF88",
          yellow:  "#FFD700",
          border:  "rgba(0,255,255,0.25)",
          borderB: "rgba(0,255,255,0.7)",
        },
      },
      fontFamily: {
        mono: ["'Courier New'", "Courier", "monospace"],
      },
      boxShadow: {
        "neon-cyan":  "0 0 8px #00FFFF, 0 0 20px rgba(0,255,255,0.4)",
        "neon-blue":  "0 0 8px #1E90FF, 0 0 20px rgba(30,144,255,0.4)",
        "neon-green": "0 0 8px #00FF88, 0 0 16px rgba(0,255,136,0.3)",
        "neon-red":   "0 0 8px #FF2D55, 0 0 20px rgba(255,45,85,0.4)",
        "card":       "0 0 1px rgba(0,255,255,0.3), inset 0 0 20px rgba(0,0,68,0.8)",
      },
      animation: {
        "flicker":    "flicker 4s infinite",
        "scan":       "scan 8s linear infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
      },
      keyframes: {
        flicker: {
          "0%,95%,100%": { opacity: "1" },
          "96%": { opacity: "0.8" },
          "97%": { opacity: "1" },
          "98%": { opacity: "0.85" },
        },
        scan: {
          "0%":   { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100vh" },
        },
        "pulse-neon": {
          "0%,100%": { boxShadow: "0 0 8px #00FFFF, 0 0 20px rgba(0,255,255,0.4)" },
          "50%":     { boxShadow: "0 0 16px #00FFFF, 0 0 40px rgba(0,255,255,0.7)" },
        },
      },
    },
  },
  plugins: [],
};
