import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许局域网访问 - 手机可以通过 IP 访问
    port: 5173,
    strictPort: false, // 如果端口被占用，自动尝试下一个端口
  },
});
