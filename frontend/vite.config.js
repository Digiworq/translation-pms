import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Automatically copy root logo.png into frontend assets & public folders on server start/build
try {
  const rootLogo = path.resolve(__dirname, '../logo.png');
  const destPublic = path.resolve(__dirname, 'public/logo.png');
  const destAssets = path.resolve(__dirname, 'src/assets/logo.png');

  if (fs.existsSync(rootLogo)) {
    const assetsDir = path.dirname(destAssets);
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    fs.copyFileSync(rootLogo, destPublic);
    fs.copyFileSync(rootLogo, destAssets);
    console.log('✅ AUTO-COPIED logo.png to frontend/public and frontend/src/assets');
  }
} catch (err) {
  console.log('Logo auto-copy note:', err.message);
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : (process.env.VITE_BASE_PATH || '/'),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
}));