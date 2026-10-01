import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api is served by the local database server (server/index.js, port 5174).
const api = { '/api': 'http://localhost:5174' }

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true, // reachable from your phone on the same Wi-Fi
    proxy: api,
  },
  preview: { proxy: api },
})
