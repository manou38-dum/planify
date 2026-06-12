/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        planify: {
          blue: '#3B82F6',
          green: '#10B981',
          orange: '#F59E0B',
          red: '#EF4444',
          dark: '#0F172A',
          light: '#F8FAFC',
        }
      }
    }
  },
  plugins: [],
}
