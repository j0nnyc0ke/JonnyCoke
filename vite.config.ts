import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import fs from 'fs';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'serve-deploy-zip',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/jonnycoke-deploy-package.zip' || req.url === '/download-deploy-package') {
              const zipFile = path.resolve(__dirname, 'jonnycoke-deploy-package.zip');
              if (fs.existsSync(zipFile)) {
                res.writeHead(200, {
                  'Content-Type': 'application/zip',
                  'Content-Disposition': 'attachment; filename="jonnycoke-deploy-package.zip"',
                  'Content-Length': fs.statSync(zipFile).size,
                });
                return fs.createReadStream(zipFile).pipe(res);
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
  };
});
