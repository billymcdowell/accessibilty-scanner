import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { configApiPlugin } from './vite-plugin-config-api'

// https://vite.dev/config/
export default defineConfig({
  // Set base path for GitHub Pages deployment
  base: process.env.GITHUB_ACTIONS ? '/accessibilty-scanner/' : '/',
  plugins: [react(), tailwindcss(), configApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: {
      // Allow serving files from results folder
      allow: ['..'],
    },
  },
  publicDir: 'public',
})
