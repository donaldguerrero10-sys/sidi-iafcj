import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:   "#123DB5",
          bright: "#2050F4",
          purple: "#7F3FE5",
          lime:   "#B8E04F",
          red:    "#CF3930",
          orange: "#DE7D37",
          green:  "#408F5E",
          ink:    "#1F1B18",
        },
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
        body:    ["Inter", "ui-sans-serif", "system-ui"],
        mono:    ["IBM Plex Mono", "ui-monospace", "SFMono-Regular"],
      },
    },
  },
  plugins: [],
}
export default config
