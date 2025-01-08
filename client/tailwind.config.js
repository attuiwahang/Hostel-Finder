/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        backgroundColor: "#1A2227",
        primaryColor: '#F19B2C'
      }
    },
  },
  plugins: [],
}

