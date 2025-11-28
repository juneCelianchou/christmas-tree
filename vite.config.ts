import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  // plugins: [react()],
  plugins: [react(),basicSsl()],
    server:{
        https: true,
        host: true,
        proxy: {
          // 告诉 Vite：所有 /api 开头的请求，都转给 localhost:3000
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
          },
          // 告诉 Vite：所有 /photo 开头的请求（查看图片），也转给 localhost:3000
          '/photos': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
          },
          '/thumbnails': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
          }
        }
    }

})
