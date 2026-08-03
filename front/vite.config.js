import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "",
  build: {
    //target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  publicDir: './public',

  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
      '~bootstrap':  fileURLToPath(new URL('./node_modules/bootstrap', import.meta.url)),
    },
  },

  server: {
    host: true
  }
})
