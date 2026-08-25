/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Claves shadcn/ui mapeadas a los tokens de diseño (hex CSS vars) */
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--brand)",
        background: "var(--bg)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--brand)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--ink)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--ink-muted)",
        },
        accent: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--ink)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)",
        },
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)",
        },
        sidebar: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)",
          primary: "var(--brand)",
          "primary-foreground": "#FFFFFF",
          accent: "var(--surface-2)",
          "accent-foreground": "var(--ink)",
          border: "var(--border)",
          ring: "var(--brand)",
        },
        /* Tokens de diseño (design.md §2) */
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          soft: "var(--brand-soft)",
        },
        volcan: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        info: "var(--info)",
        /* Colores de categoría */
        cat: {
          aventura: "var(--cat-aventura)",
          "aventura-bg": "var(--cat-aventura-bg)",
          naturaleza: "var(--cat-naturaleza)",
          "naturaleza-bg": "var(--cat-naturaleza-bg)",
          acuatico: "var(--cat-acuatico)",
          "acuatico-bg": "var(--cat-acuatico-bg)",
          cultural: "var(--cat-cultural)",
          "cultural-bg": "var(--cat-cultural-bg)",
          termas: "var(--cat-termas)",
          "termas-bg": "var(--cat-termas-bg)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        "r-sm": "var(--r-sm)",
        "r-md": "var(--r-md)",
        "r-lg": "var(--r-lg)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "var(--shadow-card)",
        hover: "var(--shadow-hover)",
        overlay: "var(--shadow-overlay)",
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out)",
      },
      transitionDuration: {
        fast: "var(--t-fast)",
        med: "var(--t-med)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "spin-soft": "spin-soft 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
