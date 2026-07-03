import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // AI / ONNX / face detection — only loaded by ID Photo tab
          if (id.includes('onnxruntime') || id.includes('face-api') || id.includes('@imgly/background-removal')) {
            return 'vendor-ai';
          }
          // PDF and Word document generation — only loaded on print/export
          if (id.includes('jspdf') || id.includes('docx') || id.includes('html2canvas') || id.includes('html2pdf') || id.includes('pdf-lib')) {
            return 'vendor-docs';
          }
          // PixiJS canvas rendering engine
          if (id.includes('pixi.js') || id.includes('@pixi')) {
            return 'vendor-pixi';
          }
          // QR code library
          if (id.includes('qrcode.react')) {
            return 'vendor-qr';
          }
          // React core + DOM — always needed immediately
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
  worker: {
    format: 'es',
  },
});
