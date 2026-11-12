import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const distPath = path.join(__dirname, 'dist');

// Middleware to permit iframe embedding (for domain masking/frame forwarding)
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Serve static files from dist
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Dedicated download route for owner deployment package (served directly from root, not in dist)
app.get(['/download-deploy-package', '/jonnycoke-deploy-package.zip'], (req, res) => {
  const filePath = path.join(__dirname, 'jonnycoke-deploy-package.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="jonnycoke-deploy-package.zip"');
    res.setHeader('Content-Type', 'application/zip');
    return res.sendFile(filePath);
  }
  res.status(404).send('Deploy package not found. Please trigger build.');
});

// Fallback to index.html for SPA client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server listening on http://0.0.0.0:${PORT}`);
});
