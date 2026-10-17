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
    // Styled with the site's own sign/paper classes (styles.css + compiled Tailwind are still linked)
    .replace(
      BODY,
      '<main class="grain bg-paper flex min-h-screen items-center justify-center px-4 py-16">' +
        '<div class="card-paper w-full max-w-lg">' +
        '<header class="sign sign-red"><h1 class="sign-title">Road closed</h1><span class="sign-meta">Error 404</span></header>' +
        '<div class="px-6 pb-7 pt-5">' +
        '<p class="type-3d red text-[30px] leading-tight md:text-[38px]">Wrong turn</p>' +
        '<p class="mt-3 text-[15px] leading-relaxed text-ink/80">This road doesn’t go anywhere. The page you were looking for doesn’t exist, or it moved.</p>' +
        '<div class="mt-6 flex flex-wrap gap-2">' +
        '<a href="/" class="btn-sign press inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[12px] uppercase tracking-wide">Back to the start</a>' +
        '<a href="/projects" class="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium">Browse all projects</a>' +
        '</div></div></div></main>'
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
