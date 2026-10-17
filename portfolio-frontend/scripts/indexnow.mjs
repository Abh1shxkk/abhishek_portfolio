// IndexNow: tells Bing (and Yandex, Naver, Seznam, Yep, which share submissions) which pages
// changed, so they are re-crawled within hours. Google does not use IndexNow.
//
//   node scripts/indexnow.mjs diff     before deploying: compare dist/ with the live site and
//                                      write the changed URLs to .indexnow-changed.json
//   node scripts/indexnow.mjs submit   after deploying: submit those URLs
//
// Only changed pages are submitted, as IndexNow asks. Failures never fail the deploy.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SITE = 'https://abhishekdev.online';
const HOST = new URL(SITE).host;
const DIST = path.resolve('dist');
const OUT = path.resolve('.indexnow-changed.json');

const key = readdirSync('public').map((f) => f.match(/^([a-f0-9]{32})\.txt$/)?.[1]).find(Boolean);
if (!key) {
  console.log('indexnow: no key file in public/, skipping');
  process.exit(0);
}

// Strip parts that differ on every build but don't change the content (hashed asset names)
const normalise = (html) => html.replace(/\/assets\/[A-Za-z0-9_-]+\.(js|css)/g, '/assets/x');
const hash = (s) => createHash('sha256').update(normalise(s)).digest('hex');
const fileFor = (urlPath) => path.join(DIST, urlPath === '/' ? 'index.html' : `${urlPath.slice(1)}.html`);

const mode = process.argv[2];

if (mode === 'diff') {
  const sitemap = readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const changed = [];
  for (const url of urls) {
    const file = fileFor(new URL(url).pathname);
    if (!existsSync(file)) continue;
    try {
      const live = await fetch(url, { headers: { 'user-agent': 'abhishekdev-indexnow-diff' } });
      if (!live.ok || hash(await live.text()) !== hash(readFileSync(file, 'utf8'))) changed.push(url);
    } catch {
      changed.push(url);
    }
  }
  writeFileSync(OUT, JSON.stringify(changed, null, 2));
  console.log(`indexnow: ${changed.length} of ${urls.length} pages changed`);
} else if (mode === 'submit') {
  const changed = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
  if (!changed.length) {
    console.log('indexnow: nothing changed, nothing to submit');
    process.exit(0);
  }
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${key}.txt`, urlList: changed }),
    });
    console.log(`indexnow: submitted ${changed.length} URL(s), response ${res.status}`);
  } catch (err) {
    console.log(`indexnow: submit failed (${err.message}); deploy is unaffected`);
  }
} else {
  console.log('usage: node scripts/indexnow.mjs diff|submit');
}
