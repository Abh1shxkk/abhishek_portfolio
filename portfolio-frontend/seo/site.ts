/*
 * One source of truth for what search engines, AI crawlers and link previews see on each route.
 *
 * - At build time, vite.config.ts uses `pageHead()` and `pageBody()` to write a real HTML file per
 *   route (pre-rendering), so crawlers get the title, canonical, structured data and the page's
 *   actual text without running JavaScript or WebGL.
 * - In the browser, `useSeo()` (seo/useSeo.ts) applies the same `routeMeta()` when the user
 *   navigates, so the tab title and share tags never drift from the pre-rendered files.
 *
 * Keep this file free of browser-only code: it runs in Node during the build.
 */
import { BLOG_DATA, EDUCATION_DATA, EXPERIENCE_DATA, PROFILE_DATA, PROJECTS_DATA, SKILLS_GROUPED, publicTitle } from '../data/portfolio';
import { FAQ, MEERUT, PACKAGES, PACKAGE_TERMS, PROCESS, SERVICES, formatInr } from '../data/services';
import type { Project } from '../types';

export const SITE = 'https://abhishekdev.online';
const NAME = PROFILE_DATA.full_name;
const HANDLE = 'abhishekdev';
const DEFAULT_IMAGE = `${SITE}/og-image.png`;
const DEFAULT_IMAGE_ALT = `${NAME}'s portfolio: a low-poly 3D countryside with his profile card`;

export interface RouteMeta {
  title: string;
  description: string;
  /** Absolute canonical URL, or null for pages that must not be indexed */
  canonical: string | null;
  image: string;
  imageAlt: string;
  ogType: 'website' | 'profile' | 'article';
  jsonLd: object | null;
  noindex: boolean;
}

// ─── Helpers ───

const abs = (path: string | null | undefined) => (!path ? undefined : path.startsWith('http') ? path : `${SITE}${path}`);
const short = (title: string) => title.split(':')[0].trim();
const clip = (text: string, max = 158) => {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};
const findProject = (id: string) => PROJECTS_DATA.find((p) => String(p.id) === id);
const findPost = (slug: string) => BLOG_DATA.find((b) => b.slug === slug);

export const projectPath = (p: Project) => `/projects/${p.id}`;

/** Every URL that should exist as a real page and be listed in the sitemap. */
export const allRoutes = (): string[] => [
  '/',
  '/projects',
  '/services',
  '/meerut',
  '/about',
  ...PROJECTS_DATA.map(projectPath),
  // The blog stays out of the sitemap and pre-rendering until it has posts
  ...(BLOG_DATA.length ? ['/blog', ...BLOG_DATA.map((b) => `/blog/${b.slug}`)] : []),
];

// ─── Structured data (JSON-LD) ───

const currentJob = EXPERIENCE_DATA.find((e) => e.is_current) ?? EXPERIENCE_DATA[0];
const degree = EDUCATION_DATA[0];

const person = {
  '@type': 'Person',
  '@id': `${SITE}/#person`,
  name: NAME,
  alternateName: HANDLE,
  url: `${SITE}/`,
  image: abs(PROFILE_DATA.avatar),
  jobTitle: PROFILE_DATA.title,
  description: PROFILE_DATA.tagline ?? PROFILE_DATA.bio,
  address: { '@type': 'PostalAddress', addressLocality: 'Meerut', addressRegion: 'Uttar Pradesh', addressCountry: 'IN' },
  ...(currentJob && { worksFor: { '@type': 'Organization', name: currentJob.company, ...(currentJob.website_url && { url: currentJob.website_url }) } }),
  ...(degree && { alumniOf: { '@type': 'CollegeOrUniversity', name: degree.institution } }),
  knowsAbout: Object.values(SKILLS_GROUPED).flat().map((s) => s.name),
  sameAs: [PROFILE_DATA.github_url, PROFILE_DATA.linkedin_url, PROFILE_DATA.twitter_url].filter(Boolean),
};

const website = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: `${SITE}/`,
  name: NAME,
  alternateName: HANDLE,
  publisher: { '@id': `${SITE}/#person` },
  inLanguage: 'en',
};

const breadcrumbs = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
});

const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': [website, person, ...nodes] });

// ─── Per-route meta ───

const notFound = (): RouteMeta => ({
  title: `Page not found | ${NAME}`,
  description: 'This page does not exist. Head back to the portfolio.',
  canonical: null,
  image: DEFAULT_IMAGE,
  imageAlt: DEFAULT_IMAGE_ALT,
  ogType: 'website',
  jsonLd: null,
  noindex: true,
});

export const routeMeta = (pathname: string): RouteMeta => {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') {
    const description = clip(
      `Web developer and designer in Meerut building fast websites, Laravel and React web apps and AI tools that run in production. ` +
        `Business websites from ${formatInr(PACKAGES[0].price)}; freelance and contract work across India.`
    );
    return {
      title: `${NAME} | Web Developer & Designer in Meerut`,
      description,
      canonical: `${SITE}/`,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
      ogType: 'profile',
      jsonLd: graph({
        '@type': 'ProfilePage',
        '@id': `${SITE}/#profilepage`,
        url: `${SITE}/`,
        name: `${NAME} | ${PROFILE_DATA.title}`,
        description,
        mainEntity: { '@id': `${SITE}/#person` },
        isPartOf: { '@id': `${SITE}/#website` },
      }),
      noindex: false,
    };
  }

  if (path === '/projects') {
    const description = clip(
      `All ${PROJECTS_DATA.length} projects by ${NAME}: client websites and stores, Laravel and React web apps, ` +
        'AI and RAG tools, healthcare and legal systems, each with the stack and what it does.'
    );
    return {
      title: `Projects | Websites, Web Apps & AI Tools by ${NAME}`,
      description,
      canonical: `${SITE}/projects`,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
      ogType: 'website',
      jsonLd: graph(
        { '@type': 'CollectionPage', '@id': `${SITE}/projects#page`, url: `${SITE}/projects`, name: `Projects by ${NAME}`, description, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#person` } },
        breadcrumbs([['Home', '/'], ['Projects', '/projects']])
      ),
      noindex: false,
    };
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const p = findProject(projectMatch[1]);
    if (!p) return notFound();
    const url = `${SITE}${projectPath(p)}`;
    const description = clip(p.description ?? p.long_description ?? `${short(p.title)} by ${NAME}.`);
    return {
      title: `${short(p.title)}${p.category ? ` (${p.category})` : ''} | ${NAME}`,
      description,
      canonical: url,
      image: abs(p.image_url) ?? DEFAULT_IMAGE,
      imageAlt: `${short(p.title)} screenshot`,
      ogType: 'article',
      jsonLd: graph(
        {
          '@type': 'WebPage',
          '@id': `${url}#page`,
          url,
          name: p.title,
          description,
          isPartOf: { '@id': `${SITE}/#website` },
          mainEntity: { '@id': `${url}#work` },
        },
        {
          '@type': 'CreativeWork',
          '@id': `${url}#work`,
          name: p.title,
          description: clip(p.long_description ?? p.description ?? '', 500),
          ...(p.image_url && { image: abs(p.image_url) }),
          ...((p.website_url || p.github_url) && { url: p.website_url ?? p.github_url }),
          ...(p.technologies?.length && { keywords: p.technologies.join(', ') }),
          ...(p.start_date && { dateCreated: p.start_date }),
          creator: { '@id': `${SITE}/#person` },
        },
        breadcrumbs([['Home', '/'], ['Projects', '/projects'], [short(p.title), projectPath(p)]])
      ),
      noindex: false,
    };
  }

  if (path === '/services') {
    const description = clip(
      `Websites from ${formatInr(PACKAGES[0].price)} with domain and hosting, plus landing pages, Laravel web apps, admin panels, AI chatbots, APIs and Android apps by ${NAME}, Meerut. Fixed quotes, you own the work.`
    );
    const url = `${SITE}/services`;
    return {
      title: `Services & Prices | Websites, Laravel Apps & AI | ${NAME}`,
      description,
      canonical: url,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
      ogType: 'website',
      jsonLd: graph(
        { '@type': 'WebPage', '@id': `${url}#page`, url, name: 'Services and prices', description, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#person` } },
        ...PACKAGES.map((pk) => ({
          '@type': 'Service',
          '@id': `${url}#${pk.id}`,
          name: pk.name,
          description: pk.pitch,
          serviceType: 'Website design and development',
          provider: { '@id': `${SITE}/#person` },
          areaServed: [{ '@type': 'City', name: 'Meerut' }, { '@type': 'Country', name: 'India' }],
          offers: { '@type': 'Offer', price: pk.price, priceCurrency: 'INR' },
        })),
        ...SERVICES.filter((sv) => sv.id !== 'websites').map((sv) => ({
          '@type': 'Service',
          '@id': `${url}#${sv.id}`,
          name: sv.title,
          description: sv.summary,
          provider: { '@id': `${SITE}/#person` },
          areaServed: [{ '@type': 'City', name: 'Meerut' }, { '@type': 'Country', name: 'India' }],
        })),
        breadcrumbs([['Home', '/'], ['Services', '/services']])
      ),
      noindex: false,
    };
  }

  if (path === '/meerut') {
    const description = clip(
      `${NAME} is a web developer based in Meerut who meets clients in person. Business websites from ${formatInr(PACKAGES[0].price)}, plus web apps, admin panels and AI tools for local businesses.`
    );
    const url = `${SITE}/meerut`;
    return {
      title: `Web Developer in Meerut | Websites & Laravel Apps | ${NAME}`,
      description,
      canonical: url,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
      ogType: 'website',
      jsonLd: graph(
        { '@type': 'WebPage', '@id': `${url}#page`, url, name: 'Web developer in Meerut', description, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#person` } },
        breadcrumbs([['Home', '/'], ['Meerut', '/meerut']])
      ),
      noindex: false,
    };
  }

  if (path === '/about') {
    const description = clip(`About ${NAME}: ${PROFILE_DATA.tagline ?? PROFILE_DATA.bio} Based in Meerut, working with clients across India and abroad.`);
    const url = `${SITE}/about`;
    return {
      title: `About ${NAME} | ${PROFILE_DATA.title}, Meerut`,
      description,
      canonical: url,
      image: abs(PROFILE_DATA.avatar) ?? DEFAULT_IMAGE,
      imageAlt: NAME,
      ogType: 'profile',
      jsonLd: graph(
        { '@type': 'AboutPage', '@id': `${url}#page`, url, name: `About ${NAME}`, description, mainEntity: { '@id': `${SITE}/#person` }, isPartOf: { '@id': `${SITE}/#website` } },
        breadcrumbs([['Home', '/'], ['About', '/about']])
      ),
      noindex: false,
    };
  }

  if (path === '/blog' && BLOG_DATA.length) {
    return {
      title: `Blog | ${NAME}`,
      description: clip(`Notes from real projects by ${NAME}: websites, Laravel, AI tools and shipping to production.`),
      canonical: `${SITE}/blog`,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
      ogType: 'website',
      jsonLd: graph(breadcrumbs([['Home', '/'], ['Blog', '/blog']])),
      noindex: false,
    };
  }

  const postMatch = path.match(/^\/blog\/([^/]+)$/);
  if (postMatch) {
    const post = findPost(postMatch[1]);
    if (!post) return notFound();
    const url = `${SITE}/blog/${post.slug}`;
    const description = clip(post.meta_description ?? post.excerpt ?? post.title);
    return {
      title: post.meta_title ?? `${post.title} | ${NAME}`,
      description,
      canonical: url,
      image: abs(post.og_image ?? post.featured_image) ?? DEFAULT_IMAGE,
      imageAlt: post.title,
      ogType: 'article',
      jsonLd: graph(
        {
          '@type': 'BlogPosting',
          '@id': `${url}#post`,
          headline: post.title,
          description,
          url,
          ...(post.published_at && { datePublished: post.published_at }),
          dateModified: post.updated_at ?? post.published_at,
          author: { '@id': `${SITE}/#person` },
          ...((post.og_image || post.featured_image) && { image: abs(post.og_image ?? post.featured_image) }),
        },
        breadcrumbs([['Home', '/'], ['Blog', '/blog'], [post.title, `/blog/${post.slug}`]])
      ),
      noindex: false,
    };
  }

  return notFound();
};

// ─── Pre-rendered markup (build time only) ───

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The <head> tags for one route. */
export const pageHead = (pathname: string): string => {
  const m = routeMeta(pathname);
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="author" content="${esc(NAME)}" />`,
    m.noindex ? '<meta name="robots" content="noindex" />' : '',
    m.canonical ? `<link rel="canonical" href="${esc(m.canonical)}" />` : '',
    `<meta property="og:type" content="${m.ogType}" />`,
    `<meta property="og:site_name" content="${esc(NAME)}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    m.canonical ? `<meta property="og:url" content="${esc(m.canonical)}" />` : '',
    `<meta property="og:image" content="${esc(m.image)}" />`,
    `<meta property="og:image:alt" content="${esc(m.imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:site" content="@abh1shxkk" />',
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(m.image)}" />`,
    // `<` is escaped so text inside the data can never close the script tag
    m.jsonLd ? `<script type="application/ld+json" id="seo-jsonld">${JSON.stringify(m.jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ];
  return tags.filter(Boolean).join('\n    ');
};

const nav = () => `<nav aria-label="Main"><a href="/">Home</a> · <a href="/projects">All projects</a> · <a href="/services">Services</a> · <a href="/about">About</a> · <a href="/meerut">Meerut</a> · <a href="mailto:${esc(PROFILE_DATA.email)}">Email</a></nav>`;

const projectList = (projects: Project[]) =>
  `<ul>${projects
    .map(
      (p) =>
        `<li><a href="${projectPath(p)}"><strong>${esc(p.title)}</strong></a>${p.category ? ` · ${esc(p.category)}` : ''}<br />${esc(p.description)}</li>`
    )
    .join('')}</ul>`;

const contact = () => {
  const links = [
    [`mailto:${PROFILE_DATA.email}`, PROFILE_DATA.email],
    [PROFILE_DATA.github_url, 'GitHub'],
    [PROFILE_DATA.linkedin_url, 'LinkedIn'],
    [PROFILE_DATA.twitter_url, 'X'],
  ].filter(([href]) => href);
  return `<section><h2>Contact</h2><p>${links.map(([href, label]) => `<a href="${esc(href)}">${esc(label)}</a>`).join(' · ')}</p></section>`;
};

/**
 * Readable HTML for a route, placed inside #root. React replaces it on load with the full
 * interactive site, which shows the same content; crawlers and no-JS visitors read this.
 */
export const pageBody = (pathname: string): string => {
  const path = pathname.replace(/\/+$/, '') || '/';
  const parts: string[] = [nav()];

  if (path === '/') {
    parts.push(
      `<header><h1>${esc(NAME)}: ${esc(PROFILE_DATA.title)} in Meerut, Uttar Pradesh</h1><p>${esc(PROFILE_DATA.tagline ?? PROFILE_DATA.bio)}</p></header>`,
      `<section><h2>About</h2><p>${esc(PROFILE_DATA.summary)}</p></section>`,
      `<section><h2>Experience</h2><ul>${EXPERIENCE_DATA.map(
        (e) => `<li><strong>${esc(publicTitle(e.position))}</strong>, ${esc(e.company)}${e.location ? ` (${esc(e.location)})` : ''}. ${esc(e.description)}</li>`
      ).join('')}</ul></section>`,
      `<section><h2>Skills</h2><ul>${Object.entries(SKILLS_GROUPED)
        .map(([group, skills]) => `<li><strong>${esc(group)}:</strong> ${skills.map((s) => esc(s.name)).join(', ')}</li>`)
        .join('')}</ul></section>`,
      `<section><h2>Selected projects</h2>${projectList(PROJECTS_DATA.filter((p) => p.is_featured))}<p><a href="/projects">See all ${PROJECTS_DATA.length} projects</a></p></section>`,
      contact()
    );
  } else if (path === '/projects') {
    parts.push(`<header><h1>Projects by ${esc(NAME)}</h1><p>${PROJECTS_DATA.length} projects: client websites and stores, web apps, APIs, AI tools and side projects.</p></header>`, projectList(PROJECTS_DATA), contact());
  } else if (path.startsWith('/projects/')) {
    const p = findProject(path.split('/')[2]);
    if (p) {
      const i = PROJECTS_DATA.indexOf(p);
      const next = PROJECTS_DATA[(i + 1) % PROJECTS_DATA.length];
      const facts = [
        p.category && `<li>Category: ${esc(p.category)}</li>`,
        p.client && `<li>Client: ${esc(p.client)}</li>`,
        p.role && `<li>Role: ${esc(p.role)}</li>`,
        p.status && `<li>Status: ${esc(p.status)}</li>`,
        p.technologies?.length && `<li>Built with: ${p.technologies.map(esc).join(', ')}</li>`,
      ].filter(Boolean);
      const links = [
        p.website_url && `<a href="${esc(p.website_url)}">Live site</a>`,
        p.app_url && `<a href="${esc(p.app_url)}">Android app</a>`,
        p.github_url && `<a href="${esc(p.github_url)}">Source code</a>`,
      ].filter(Boolean);
      parts.push(
        `<p><a href="/">Home</a> › <a href="/projects">Projects</a> › ${esc(short(p.title))}</p>`,
        `<article><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>`,
        facts.length ? `<ul>${facts.join('')}</ul>` : '',
        (p.long_description ?? '').split('\n').filter(Boolean).map((para) => `<p>${esc(para)}</p>`).join(''),
        p.features?.length ? `<h2>What it does</h2><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '',
        links.length ? `<p>${links.join(' · ')}</p>` : '',
        `</article><p>Next project: <a href="${projectPath(next)}">${esc(short(next.title))}</a></p>`
      );
    }
  } else if (path === '/services') {
    parts.push(
      `<header><h1>Services and prices</h1><p>Websites and landing pages at fixed prices, and custom web apps, admin panels, AI assistants and Android apps quoted to your scope.</p></header>`,
      `<section><h2>Website packages</h2>${PACKAGES.map(
        (pk) => `<h3>${esc(pk.name)}: ${esc(formatInr(pk.price))}</h3><p>${esc(pk.pitch)} ${esc(pk.delivery)}.</p><ul>${pk.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
      ).join('')}<ul>${PACKAGE_TERMS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>`,
      `<section><h2>Custom work</h2>${SERVICES.map((sv) => {
        const proof = sv.proof.map((id) => PROJECTS_DATA.find((p) => p.id === id)).filter(Boolean) as Project[];
        return `<h3 id="${sv.id}">${esc(sv.title)} (${esc(sv.price)})</h3><p>${esc(sv.summary)}</p><ul>${sv.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>${
          proof.length ? `<p>Built before: ${proof.map((p) => `<a href="${projectPath(p)}">${esc(short(p.title))}</a>`).join(', ')}</p>` : ''
        }`;
      }).join('')}</section>`,
      `<section><h2>How a project runs</h2><ol>${PROCESS.map((st) => `<li><strong>${esc(st.title)}.</strong> ${esc(st.text)}</li>`).join('')}</ol></section>`,
      `<section><h2>Questions people ask</h2>${FAQ.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>`,
      contact()
    );
  } else if (path === '/meerut') {
    parts.push(
      `<header><h1>A web developer you can meet in Meerut</h1><p>I live and work in Meerut. ${esc(MEERUT.inPerson)} Websites for local businesses start at ${esc(formatInr(PACKAGES[0].price))}; custom web apps, admin panels and AI tools are quoted to scope.</p></header>`,
      `<section><h2>Local track record</h2><ul>${EXPERIENCE_DATA.map((e) => `<li>${esc(publicTitle(e.position))} at ${esc(e.company)}${e.location ? `, ${esc(e.location)}` : ''}. ${esc(e.description)}</li>`).join('')}${
        EDUCATION_DATA[0] ? `<li>${esc(EDUCATION_DATA[0].degree)}, ${esc(EDUCATION_DATA[0].institution)}</li>` : ''
      }</ul></section>`,
      `<section><h2>Where I meet clients</h2><p>${MEERUT.areas.map(esc).join(', ')}. Anywhere else, we work over calls and WhatsApp.</p></section>`,
      `<section><h2>What I build</h2><ul>${SERVICES.map((sv) => `<li><a href="/services#${sv.id}">${esc(sv.title)}</a> (${esc(sv.price)})</li>`).join('')}</ul></section>`,
      contact()
    );
  } else if (path === '/about') {
    parts.push(
      `<header><h1>About ${esc(NAME)}</h1><p>${esc(PROFILE_DATA.title)}, ${esc(PROFILE_DATA.location)}.</p></header>`,
      `<section><p>${esc(PROFILE_DATA.tagline)}</p><p>${esc(PROFILE_DATA.summary)}</p><p>I take on freelance and contract work: websites and landing pages, Laravel web apps, APIs and AI assistants.</p></section>`,
      `<section><h2>Work so far</h2><ul>${EXPERIENCE_DATA.map((e) => `<li>${esc(publicTitle(e.position))}, ${esc(e.company)}</li>`).join('')}</ul></section>`,
      `<section><h2>Tools I use</h2><ul>${Object.entries(SKILLS_GROUPED).map(([g, sk]) => `<li><strong>${esc(g)}:</strong> ${sk.map((x) => esc(x.name)).join(', ')}</li>`).join('')}</ul><p><a href="/services">Services and prices</a> · <a href="/projects">All projects</a></p></section>`,
      contact()
    );
  } else if (path === '/blog') {
    parts.push(`<h1>Blog</h1><ul>${BLOG_DATA.map((b) => `<li><a href="/blog/${esc(b.slug)}">${esc(b.title)}</a> ${esc(b.excerpt)}</li>`).join('')}</ul>`);
  } else if (path.startsWith('/blog/')) {
    const post = findPost(path.split('/')[2]);
    if (post) parts.push(`<article><h1>${esc(post.title)}</h1><p>${esc(post.excerpt)}</p></article>`);
  }

  return `<div class="prerender">${parts.join('\n')}</div>`;
};
