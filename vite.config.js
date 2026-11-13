import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { rsvpApiPlugin } from './rsvpApiPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), rsvpApiPlugin()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
})
