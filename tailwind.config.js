/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Font Families - Safiro and Open Sans
      fontFamily: {
        safiro: ["Safiro-Medium", "OpenSans-SemiBold", "sans-serif"],
        "open-sans": ["OpenSans-Regular", "sans-serif"],
        "open-sans-semibold": ["OpenSans-SemiBold", "sans-serif"],
      },
      // Color Palette
      colors: {
        // Base Colors
        "aide-text": "#000000",
        "aide-text-highlight": "rgba(36, 58, 255, 0.7)",
        "aide-background": "#ECF5FF",
        "aide-white": "#FFFFFF",

        // Semantic Colors
        "aide-red": "#FF5151",
        "aide-green": "#4CD964",
        "aide-yellow": "#FFCC00",

        // Colorblind-friendly semantic alternatives (for opt-in usage)
        "aide-cb-success": "#2D9CDB",
        "aide-cb-warning": "#F2994A",
        "aide-cb-danger": "#C445C2",
        "aide-cb-success-contrast": "#0077FF",
        "aide-cb-warning-contrast": "#FF8A00",
        "aide-cb-danger-contrast": "#D40000",

        // AIDE Brand Blues
        "aide-dark-blue": "#000746",
        "aide-normal-blue": "#5061FF",
        "aide-light-blue": "#7C89FF",

        // Component-specific colors
        "aide-navbar": "rgba(219, 237, 248, 0.9)",

        // Dark Theme Colors
        "aide-dark-bg-start": "#000720",
        "aide-dark-bg-end": "#000746",
        "aide-dark-card": "rgba(0, 4, 18, 0.9)", // #000412 at 90% opacity
        "aide-dark-text": "#FFFFFF",
        "aide-dark-text-secondary": "rgba(255, 255, 255, 0.6)",
        "aide-dark-text-tertiary": "rgba(255, 255, 255, 0.8)",
        "aide-dark-navbar": "rgba(0, 4, 18, 0.5)",
      },
    },
  },
  plugins: [],
};
