/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#10172A",
          light: "#1A2338",
          muted: "#A9B4C9",
        },
        parchment: {
          DEFAULT: "#F6F0E4",
          dark: "#EAE0CC",
        },
        seal: {
          valid: "#1B7A5B",
          revoked: "#B23A2E",
          brass: "#B08D4F",
        },
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
