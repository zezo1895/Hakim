/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:       "#1a3a6b",
          blueDark:   "#132c52",
          blueLight:  "#eff6ff",
          green:      "#2d7a3a",
          greenDark:  "#23612e",
          greenLight: "#f0fdf4",
          greenBright:"#38a169",
        },
      },
      fontFamily: {
        arabic: ["Cairo", "Tajawal", "sans-serif"],
      },
      maxWidth: {
        "8xl": "88rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
