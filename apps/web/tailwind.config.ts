/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        label: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        pixel: ["var(--font-silkscreen)", "cursive"]
      }
    },
  },
  plugins: [],
}
