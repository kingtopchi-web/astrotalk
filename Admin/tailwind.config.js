/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF9E00', // Vibrant orange, like Astrotalk
        secondary: '#002E4E', // Deep professional blue
        background: '#F9FAFB',
        surface: '#FFFFFF',
        error: '#EF4444',
      }
    },
  },
  plugins: [],
}
