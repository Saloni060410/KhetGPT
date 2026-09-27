/**
 * TerraYield Agri-Tech Tailwind Color & Shadow Tokens
 * Include in your tailwind.config.js:
 * 
 * const terraYieldPreset = require('./terrayield.tailwind.preset.js');
 * module.exports = {
 *   presets: [terraYieldPreset],
 *   ...
 * }
 */
export default {
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#040709",
          900: "#070B0E",
          850: "#0B1319",
          800: "#101D27",
          700: "#182C3B",
          600: "#223E52",
        },
        emerald: {
          DEFAULT: "#10B981",
          bright: "#00F59B",
          glow: "#059669",
          dim: "#064E3B",
        },
        ochre: {
          light: "#FDE68A",
          DEFAULT: "#F59E0B",
          warm: "#D97706",
          deep: "#92400E",
        },
        nutrient: {
          nitrogen: "#10B981",
          phosphorus: "#F59E0B",
          potassium: "#06B6D4",
          calcium: "#A78BFA",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        'hud': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
        'hud-emerald': '0 0 25px -5px rgba(0, 245, 155, 0.25)',
        'hud-ochre': '0 0 25px -5px rgba(245, 158, 11, 0.25)',
        'glass-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
};
