/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "emergency-scan": {
          "0%": { transform: "translateY(-120%)" },
          "100%": { transform: "translateY(120%)" },
        },
      },
      animation: {
        "emergency-scan": "emergency-scan 2.8s linear infinite",
      },
    },
  },
  plugins: [],
};
