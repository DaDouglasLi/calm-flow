import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Important for Electron
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 5175,
    host: 'localhost'
  }
})
