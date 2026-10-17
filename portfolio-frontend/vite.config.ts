import path from 'path';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { seo } from './seo/plugin';

// Secrets such as GEMINI_API_KEY are server-only. Never add them to `define` or a VITE_ variable:
// anything in the client bundle can be read by every visitor.

/** Serves the chat backend (server/chatHandler.ts) during `npm run dev`, so the chat works locally. */
const devApi = (env: Record<string, string>): Plugin => ({
  name: 'dev-api',
  apply: 'serve',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/api/chat', async (req, res) => {
      try {
        const mod = await server.ssrLoadModule(path.resolve(__dirname, 'server/chatHandler.ts'));
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request(`http://${req.headers.host}/api/chat`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const chatEnv = { GEMINI_API_KEY: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY, ALLOWED_ORIGINS: env.ALLOWED_ORIGINS };
        const response: Response = req.method === 'POST' ? await mod.handleChat(request, chatEnv) : mod.chatStatus(chatEnv);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Dev API failed' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), devApi(env), seo()],
    build: {
      rollupOptions: {
        output: {
          // Libraries that rarely change get their own long-cached files, so a site update
          // only re-downloads the small app chunk
          manualChunks: {
            three: ['three', 'three/examples/jsm/postprocessing/EffectComposer.js'],
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
