import { defineConfig } from 'vite'

export default defineConfig({
  // base configurable: GitHub Pages sirve el repo en /pumpradio/, no en la raíz.
  // El workflow de deploy pasa VITE_BASE=/pumpradio/; en un dominio propio
  // (base '/') no hace falta setear nada.
  base: process.env.VITE_BASE || '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  }
})
