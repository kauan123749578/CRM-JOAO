import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // Garantir que o index.html correto seja usado
  root: resolve(__dirname),
  publicDir: false,
  build: {
    // Forçar rebuild completo sem cache
    emptyOutDir: true,
    // Usar o index.html do diretório raiz
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        // Adicionar hash nos arquivos para evitar cache
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
});




