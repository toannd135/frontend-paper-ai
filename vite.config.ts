import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Mọi lời gọi /api/* được chuyển tới FastAPI (bỏ tiền tố /api) nên frontend không cần biết host backend.
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Tách các thư viện nặng ra chunk riêng: chúng chỉ tải khi người dùng mở tab Graph / trang admin.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          graph3d: ['3d-force-graph', 'three', 'three-spritetext'],
          markdown: ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'katex'],
        },
      },
    },
  },
})
