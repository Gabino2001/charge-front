/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "#14161A",
        surface: "#1C1F24",
        "surface-alt": "#242830",
        border: "#2E323A",
        chalk: "#F3F1EA",
        steel: "#8A8F98",
        plate: {
          red: "#E5484D",
          blue: "#3E7CB1",
          yellow: "#E8B93B",
          green: "#4C9A6A",
        },
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
