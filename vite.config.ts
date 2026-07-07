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
          // PDF and Word document generation — only loaded on print/export
          if (id.includes('jspdf') || id.includes('docx') || id.includes('html2canvas')) {
            return 'vendor-docs';
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
  worker: {
    format: 'es',
  },
});
