import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — loaded on every page
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Animation library — used across pages but expensive
          'motion': ['framer-motion'],
          // Markdown rendering — only needed in Learning page
          'markdown': ['react-markdown', 'remark-gfm', 'rehype-highlight'],
          // State + HTTP — lightweight, loaded early
          'store': ['zustand', 'axios'],
        },
      },
    },
    // Raise the warning threshold since we're now splitting intentionally
    chunkSizeWarningLimit: 600,
  },
})
