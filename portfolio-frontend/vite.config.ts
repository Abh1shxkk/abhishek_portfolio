import path from 'path';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

// Secrets such as GEMINI_API_KEY are server-only. Never add them to `define` or a VITE_ variable:
// anything in the client bundle can be read by every visitor.

/** Serves the Vercel function in /api/chat.ts during `npm run dev`, so the chat works locally. */
const devApi = (env: Record<string, string>): Plugin => ({
  name: 'dev-api',
  apply: 'serve',
  configureServer(server: ViteDevServer) {
    if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    server.middlewares.use('/api/chat', async (req, res) => {
      try {
        const mod = await server.ssrLoadModule(path.resolve(__dirname, '../api/chat.ts'));
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request(`http://${req.headers.host}/api/chat`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const handler = req.method === 'POST' ? mod.POST : mod.GET;
        const response: Response = await handler(request);
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
    plugins: [react(), devApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
