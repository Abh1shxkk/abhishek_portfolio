import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { routeMeta } from './site';

/** Finds a head tag by selector, creating it from `create` if the page doesn't have one yet. */
const ensure = <T extends Element>(selector: string, create: () => T): T => {
  const found = document.head.querySelector<T>(selector);
  if (found) return found;
  const el = create();
  document.head.appendChild(el);
  return el;
};

const setMeta = (attr: 'name' | 'property', key: string, value: string) =>
  ensure(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(attr, key);
    return m;
  }).setAttribute('content', value);

/**
 * Keeps <head> in step with the current route after client-side navigation. The pre-rendered HTML
 * already has these tags; this updates the same tags in place (never adds duplicates), using the
 * same routeMeta() the build used.
 */
export const useSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Blog posts manage their own article tags in BlogPost.tsx
    if (/^\/blog\/[^/]+/.test(pathname)) return;
    const m = routeMeta(pathname);

    document.title = m.title;
    setMeta('name', 'description', m.description);
    setMeta('property', 'og:type', m.ogType);
    setMeta('property', 'og:title', m.title);
    setMeta('property', 'og:description', m.description);
    setMeta('property', 'og:image', m.image);
    setMeta('property', 'og:image:alt', m.imageAlt);
    setMeta('name', 'twitter:title', m.title);
    setMeta('name', 'twitter:description', m.description);
    setMeta('name', 'twitter:image', m.image);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const ogUrl = document.head.querySelector('meta[property="og:url"]');
    if (m.canonical) {
      ensure('link[rel="canonical"]', () => {
        const l = document.createElement('link');
        l.rel = 'canonical';
        return l;
      }).href = m.canonical;
      setMeta('property', 'og:url', m.canonical);
    } else {
      canonical?.remove();
      ogUrl?.remove();
    }

    const robots = document.head.querySelector('meta[name="robots"]');
    if (m.noindex) setMeta('name', 'robots', 'noindex');
    else robots?.remove();

    const ld = document.getElementById('seo-jsonld');
    if (m.jsonLd) {
      ensure('#seo-jsonld', () => {
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.id = 'seo-jsonld';
        return s;
      }).textContent = JSON.stringify(m.jsonLd);
    } else {
      ld?.remove();
    }
  }, [pathname]);
};
