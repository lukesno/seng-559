/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        background: "url('./assets/background.png')",
      },
      colors: {
        primary: "#30024f",
        secondary: "#7b2879",
        ternary: "#a86b9e",
        action: "#58ffb6",
      },
      fontFamily: {
        nunito: ["nunito"],
      },
    },
  },
  plugins: ["prettier-plugin-tailwindcss"],
};
