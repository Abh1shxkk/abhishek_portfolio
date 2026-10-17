import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { SITE, allRoutes, pageBody, pageHead } from './site';

/*
 * Pre-rendering for crawlers, link previews and no-JS visitors.
 *
 * After the build, writes one HTML file per route from the built index.html, with that route's
 * <head> tags and readable content filled in:
 *   /             -> index.html
 *   /projects     -> projects.html      (Cloudflare Pages serves it at /projects, no trailing slash)
 *   /projects/13  -> projects/13.html
 * plus 404.html (a static page; Pages returns it with status 404 for unknown URLs instead of
 * serving the home page with 200) and sitemap.xml.
 *
 * In `npm run dev` it fills the same placeholders on the fly, so dev matches production.
 */

const HEAD = '<!--seo-head-->';
const BODY = '<!--seo-body-->';

const fill = (template: string, route: string) => template.replace(HEAD, pageHead(route)).replace(BODY, pageBody(route));

const fileFor = (route: string) => (route === '/' ? 'index.html' : `${route.slice(1)}.html`);

/** Last time the site's content data changed, from git (needs full history in CI), or null. */
const contentDate = (root: string): string | null => {
  try {
    const date = execSync('git log -1 --format=%cs -- data/portfolio.ts', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    return null;
  }
};

const notFoundPage = (template: string) =>
  template
    .replace(HEAD, pageHead('/__not-found__'))
    .replace(
      BODY,
      '<div class="prerender"><nav aria-label="Main"><a href="/">Home</a> · <a href="/projects">All projects</a></nav>' +
        '<h1>This road doesn’t go anywhere</h1><p>The page you were looking for doesn’t exist, or it moved.</p>' +
        '<p><a href="/">Back to the start</a> or <a href="/projects">browse all projects</a>.</p></div>'
    )
    // A static page: don't boot the app, which has no route for unknown URLs
    .replace(/<script type="module"[^>]*><\/script>\s*/g, '')
    .replace(/<link rel="modulepreload"[^>]*>\s*/g, '');

export const seo = (): Plugin => {
  let config: ResolvedConfig;
  return {
    name: 'seo-prerender',
    configResolved(resolved) {
      config = resolved;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // During build the placeholders must survive into dist/index.html, which closeBundle fills
        if (config.command === 'build') return html;
        const route = (ctx.originalUrl ?? ctx.path ?? '/').split(/[?#]/)[0];
        return fill(html, route);
      },
    },
    closeBundle() {
      if (config.command !== 'build') return;
      const outDir = path.resolve(config.root, config.build.outDir);
      const template = readFileSync(path.join(outDir, 'index.html'), 'utf8');
      if (!template.includes(HEAD) || !template.includes(BODY)) {
        throw new Error('seo-prerender: index.html is missing the <!--seo-head--> or <!--seo-body--> placeholder');
      }

      const routes = allRoutes();
      for (const route of routes) {
        const file = path.join(outDir, fileFor(route));
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, fill(template, route));
      }
      writeFileSync(path.join(outDir, '404.html'), notFoundPage(template));

      const lastmod = contentDate(config.root);
      const urls = routes
        .map((r) => `  <url><loc>${SITE}${r === '/' ? '/' : r}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
        .join('\n');
      writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      );
      config.logger.info(`seo-prerender: wrote ${routes.length} pages, 404.html and sitemap.xml (lastmod ${lastmod ?? 'omitted'})`);
    },
  };
};
