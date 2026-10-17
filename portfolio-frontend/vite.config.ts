import path from 'path';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { BLOG_DATA, PROJECTS_DATA } from './data/portfolio';

const SITE = 'https://abhishekdev.online';

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

/** Writes sitemap.xml at build time from the same data the site renders, so it never goes stale. */
const sitemap = (): Plugin => ({
  name: 'sitemap',
  apply: 'build',
  generateBundle() {
    const paths = ['/', '/projects', ...PROJECTS_DATA.map((p) => `/projects/${p.id}`), ...(BLOG_DATA.length ? ['/blog', ...BLOG_DATA.map((b) => `/blog/${b.slug}`)] : [])];
    const urls = paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n');
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
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
    plugins: [react(), devApi(env), sitemap()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
