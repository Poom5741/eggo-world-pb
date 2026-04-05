/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",  // Jules uses 3rem for rounded-xl
        "2xl": "4rem",
        "3xl": "5rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
