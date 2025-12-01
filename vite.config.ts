import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // ESTO ES CRUCIAL: Permite que la web funcione en subcarpetas (como GitHub Pages)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});