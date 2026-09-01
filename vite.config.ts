import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  // Fix 1: Explicitly set base path for GitHub Pages repository subdirectory
  base: "/sam/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon-180x180.png",
        "maskable-icon-512x512.png",
        "icon.svg",
      ],
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
      manifest: {
        name: "SAM - Staff Allocation Manager",
        short_name: "SAM",
        description: "Staff Allocation and Resource Management Application",
        theme_color: "#16171d",
        background_color: "#16171d",
        display: "standalone",
        orientation: "portrait",
        // Fix 2: Update PWA scope and start_url to match '/sam/'
        scope: "/sam/",
        start_url: "/sam/",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
