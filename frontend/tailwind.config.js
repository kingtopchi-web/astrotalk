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
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        "primary-light": "var(--color-primary-light)",
        secondary: "var(--color-secondary)",
        "secondary-dark": "var(--color-secondary-dark)",
        "secondary-light": "var(--color-secondary-light)",
        accent: "var(--color-accent)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        "surface-card": "var(--color-surface-card)",
        background: "var(--color-background)",
        "on-background": "var(--color-on-background)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        border: "var(--color-border)",
        success: "#10B981", 
        warning: "#F59E0B", 
        error: "#EF4444"
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
