export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f7ff",
          100: "#e0f0ff",
          200: "#bae1ff",
          300: "#7ac5ff",
          400: "#4da8ff",
          500: "#0066cc",
          600: "#0052a3",
          700: "#003d7a",
          800: "#002851",
          900: "#001a33",
        },
        secondary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#00a86b",
          600: "#008a5a",
          700: "#006d49",
          800: "#005138",
          900: "#003d2a",
        },
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#92400e",
          900: "#78350f",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 102, 204, 0.7)" },
          "50%": { boxShadow: "0 0 0 10px rgba(0, 102, 204, 0)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      borderRadius: {
        "2.5xl": "20px",
        "3xl": "24px",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glow-primary": "0 0 20px rgba(0, 102, 204, 0.3)",
        "glow-secondary": "0 0 20px rgba(0, 168, 107, 0.3)",
        "card": "0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
}
