import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Automatic copy to guarantee clean, URL-safe asset names for hero images and branded favicon
try {
  const publicDir = path.resolve(__dirname, "public");
  const copies = [
    ["Generated Image October 13, 2026 - 3_49PM.jpg", "hero-plastic-rv.jpg"],
    ["Generated Image October 13, 2026 - 3_47PM.jpg", "hero-pipes-line.jpg"],
    ["Generated Image October 13, 2026 - 3_42PM.jpg", "hero-aluminium-press.jpg"],
  ];
  for (const [src, dest] of copies) {
    const srcPath = path.join(publicDir, src);
    const destPath = path.join(publicDir, dest);
    if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }

} catch (e) {
  console.warn("[Vite] Asset copy error:", e);
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Hakim Group',
        short_name: 'Hakim',
        description: 'Hakim Group Products Catalog',
        theme_color: '#1b7a3d',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/products',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ik\.imagekit\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagekit-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/hakim-production-[a-z0-9]+\.up\.railway\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    {
      name: 'wood-texture-saver',
      configureServer(server) {
        server.middlewares.use('/api/save-wood-texture', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { filename, dataUrl } = JSON.parse(body);
                if (filename && dataUrl) {
                  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                  const buffer = Buffer.from(base64Data, 'base64');
                  const outDir = path.resolve(__dirname, 'public/textures/wood');
                  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
                  fs.writeFileSync(path.join(outDir, filename), buffer);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, path: `/textures/wood/${filename}` }));
                  return;
                }
              } catch (e) {
                console.error('Error saving wood texture:', e);
              }
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed' }));
            });
          } else {
            res.statusCode = 405;
            res.end();
          }
        });
      }
    }
  ],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://hakim-production-5171.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
