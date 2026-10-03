import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  optimizeDeps: {
    exclude: ['esbuild-wasm', 'monaco-editor', 'monaco-tailwindcss'],
  },
})
