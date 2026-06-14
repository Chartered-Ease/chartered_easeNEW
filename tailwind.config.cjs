/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "sans-serif"],
        display: ["Space Grotesk", "Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        "ease-saffron": "#FF9933",
        "ease-green": "#138808",
        "ease-blue": "#1E3A8A",
        "ease-electric": "#2563EB",
        "ease-purple": "#7C3AED",
        "ease-ink": "#07111F",
        "ease-bg": "#F5F7FB",
        "ease-white": "#FFFFFF",
      },
    },
  },
  plugins: [],
};
