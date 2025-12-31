/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Font Families - Safiro and Open Sans
      fontFamily: {
        safiro: ["Safiro-Medium"],
        "open-sans": ["OpenSans-Regular"],
        "open-sans-semibold": ["OpenSans-SemiBold"],
      },
    },
  },
  plugins: [],
};
