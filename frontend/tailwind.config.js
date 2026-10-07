/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", 
  theme: { 
    extend: { 
      colors: { 
        primary: "#3b82f6", // Blue
        "primary-dark": "#2563eb",
        "primary-light": "#eff6ff",
        secondary: "#1e40af", // Dark blue
        "secondary-dark": "#1e3a8a",
        "secondary-light": "#dbeafe",
        accent: "#f87171",
        surface: "#ffffff", 
        "surface-muted": "#faf9f8",
        "surface-card": "#ffffff",
        background: "#fbfaf8", 
        "on-background": "#1e293b", // Slate-800
        "on-surface": "#334155", // Slate-700
        "on-surface-variant": "#64748b", // Slate-500
        border: "#e2e8f0", // Slate-200
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444"
      }, 
      borderRadius: { "DEFAULT": "0.5rem", "lg": "0.75rem", "xl": "1rem", "2xl": "1.5rem", "full": "9999px" }, 
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'hover': '0 15px 35px -5px rgba(110, 60, 188, 0.1)'
      },
      fontFamily: { 
        heading: ["Plus Jakarta Sans", "sans-serif"], 
        body: ["Inter", "sans-serif"]
      },
    } 
  },
  plugins: [],
}
