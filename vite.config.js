import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  base: './',
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 1500
  }
})
