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
          blueDark:   "#15305a",
          blueLight:  "#eff6ff",
          green:      "#2d7a3a",
          greenLight: "#f0fdf4",
          greenBright:"#4ade80",
        },
      },
      fontFamily: {
        arabic: ["Cairo", "Tajawal", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
