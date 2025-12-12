import { fontFamily } from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Work Sans'", "'Sora'", ...fontFamily.sans],
        display: ["'Sora'", "'Work Sans'", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "#10b981",
          foreground: "#042f2e",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#78350f",
        },
        info: {
          DEFAULT: "#0ea5e9",
          foreground: "#0b365f",
        },
        neutral: {
          DEFAULT: "#e5e7eb",
          foreground: "#1f2937",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glass: "0 18px 60px -24px rgba(15, 23, 42, 0.35)",
        outline: "0 0 0 1px rgba(15,23,42,0.06)",
      },
      backgroundImage: {
        "radial-dots":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
        "glass-stripes":
          "linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 38%, transparent 38%, transparent 62%, rgba(255,255,255,0.08) 62%, rgba(255,255,255,0.04) 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 320ms ease-out",
        "scale-in": "scale-in 260ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
