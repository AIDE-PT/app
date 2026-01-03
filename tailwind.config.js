/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Font Families - Safiro and Open Sans
      fontFamily: {
        safiro: ['Safiro-Medium'],
        'open-sans': ['OpenSans-Regular'],
        'open-sans-semibold': ['OpenSans-SemiBold'],
      },
      // Color Palette
      colors: {
        // Base Colors
        'aide-text': '#000000',
        'aide-text-highlight': 'rgba(36, 58, 255, 0.7)',
        'aide-background': '#ECF5FF',
        'aide-white': '#FFFFFF',

        // Semantic Colors
        'aide-red': '#FF5151',
        'aide-green': '#4CD964',
        'aide-yellow': '#FFCC00',

        // AIDE Brand Blues
        'aide-dark-blue': '#000746',
        'aide-normal-blue': '#5061FF',
        'aide-light-blue': '#7C89FF',

        // Component-specific colors
        'aide-navbar': 'rgba(219, 237, 248, 0.9)',
      },
    },
  },
  plugins: [],
};
