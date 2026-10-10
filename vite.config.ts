import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 5175,
    open: true,
    host: true,
    // Electron release builds, not part of the web app
    watch: { ignored: ['**/offline/**'] }
  }
})
