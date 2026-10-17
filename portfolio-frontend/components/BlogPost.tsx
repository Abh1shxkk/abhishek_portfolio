import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { useBlogPost, useBlogs } from '../hooks/usePortfolio';
import { Icon, Reveal } from './ui';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// SEO meta tag helpers
const updateMetaTag = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
  if (el) {
    el.setAttribute('content', content);
  } else {
    el = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('article:')) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    el.setAttribute('content', content);
    document.head.appendChild(el);
  }
};

const injectJsonLd = (data: object) => {
  const existing = document.querySelector('script[data-blog-jsonld]');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-blog-jsonld', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || '');
  const { data: allBlogs } = useBlogs({ per_page: 50 });
  const [activeHeading, setActiveHeading] = useState<string>('');

  // Extract Table of Contents from content
  const toc = useMemo<TocItem[]>(() => {
    if (!post?.content) return [];
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;
    while ((match = headingRegex.exec(post.content)) !== null) {
      const text = match[2].replace(/[*_`~]/g, '');
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      items.push({ id, text, level: match[1].length });
    }
    return items;
  }, [post?.content]);

  const relatedPosts = useMemo(() => {
    if (!post || !allBlogs?.data) return [];
    return allBlogs.data
      .filter((p) => p.slug !== post.slug && (p.category === post.category || (post.tags && p.tags?.some((t) => post.tags?.includes(t)))))
      .slice(0, 3);
  }, [post, allBlogs]);

  useEffect(() => {
    if (!post) return;
    document.title = post.meta_title || `${post.title} | Blog | Abhishek Chauhan`;
    updateMetaTag('description', post.meta_description || post.excerpt || '');
    updateMetaTag('keywords', post.meta_keywords || '');
    updateMetaTag('og:title', post.meta_title || post.title);
    updateMetaTag('og:description', post.meta_description || post.excerpt || '');
    updateMetaTag('og:image', post.og_image || post.featured_image || '');
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('og:type', 'article');
    updateMetaTag('article:published_time', post.published_at || '');
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', post.meta_title || post.title);
    updateMetaTag('twitter:description', post.meta_description || post.excerpt || '');
    updateMetaTag('twitter:image', post.og_image || post.featured_image || '');
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      image: post.featured_image || undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { '@type': 'Person', name: 'Abhishek Chauhan' },
      description: post.excerpt || post.meta_description || '',
      keywords: post.tags?.join(', '),
    });
    return () => {
      document.title = 'Abhishek Chauhan | Portfolio';
      document.querySelector('script[data-blog-jsonld]')?.remove();
    };
  }, [post]);

  useEffect(() => {
    if (toc.length === 0) return;
    const handleScroll = () => {
      let current = '';
      toc.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 120) current = el.id;
      });
      setActiveHeading(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 pb-24 pt-36 md:px-8"><p className="card-paper p-10 text-center text-ink/70">Loading…</p></div>;
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-40 text-center md:px-8">
        <div className="card-paper p-10">
          <h1 className="type-3d red text-[28px]">Wrong turn</h1>
          <p className="mt-3 text-ink/70">The post you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog" className="btn-sign blue press mt-8 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-display text-[12px] uppercase tracking-wide">
            <Icon.ArrowLeft size={15} /> Back to the blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <article className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <Reveal>
          <Link to="/blog" className="chip-sign paper press">
            <Icon.ArrowLeft size={12} /> Back to the blog
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-[11px] text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">
            {post.category && <span className="chip-sign blue">{post.category}</span>}
            {post.published_at && <span>{formatDate(post.published_at)}</span>}
            {post.reading_time && <span>· {post.reading_time} min read</span>}
          </div>
          <h1 className="type-3d blue big mt-4 max-w-4xl text-[32px] leading-[1.05] md:text-[52px]">{post.title}</h1>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-9">
            <Reveal delay={80}>
              <div className="card-paper">
                <span className="tape right" />
                <header className="sign sign-blue">
                  <h2 className="sign-title">Travel note</h2>
                  {post.published_at && <span className="sign-meta">{formatDate(post.published_at)}</span>}
                </header>
                <div className="px-5 pb-6 pt-6 md:px-8">
                  {post.featured_image && (
                    <div className="polaroid" style={{ '--tilt': '-0.6deg' } as React.CSSProperties}>
                      <img src={post.featured_image} alt={post.title} className="shot" />
                    </div>
                  )}
                  {post.excerpt && <p className="mt-6 text-[17px] leading-relaxed text-ink">{post.excerpt}</p>}
                  <div className="dash-line my-6" />
                  <div className="prose-paper">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]}>
                      {post.content}
                    </ReactMarkdown>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-10 flex flex-wrap gap-1.5 border-t border-dashed border-ink/20 pt-5">
                      {post.tags.map((tag) => (
                        <Link key={tag} to={`/blog?tag=${tag}`} className="sticker px-2 py-1 text-[11.5px] font-medium text-ink">#{tag}</Link>
                      ))}
                    </div>
                  )}
                </div>
                <span className="fold" />
              </div>
            </Reveal>
          </div>

          {toc.length > 0 && (
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="ticket sticky top-28 p-4" style={{ '--notch': '34px' } as React.CSSProperties}>
                <p className="font-display text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--sign-blue))]">On this page</p>
                <nav className="tear mt-3 space-y-1 pt-3">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block border-l-2 py-1 text-[12px] leading-snug transition-colors ${activeHeading === item.id ? 'border-[rgb(var(--sign-blue))] text-ink' : 'border-transparent text-ink/60 hover:text-ink'}`}
                      style={{ paddingLeft: `${8 + (item.level - 1) * 10}px` }}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>

        {relatedPosts.length > 0 && (
          <Reveal>
            <h2 className="mt-16 font-display text-[11px] uppercase tracking-[0.22em] text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">More notes</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link key={related.slug} to={`/blog/${related.slug}`} className="card-paper group block p-4 transition-transform duration-300 hover:-translate-y-1">
                  {related.category && <span className="chip-sign blue">{related.category}</span>}
                  <h3 className="mt-3 font-display text-[15px] leading-tight text-ink">{related.title}</h3>
                  {related.reading_time && <p className="mt-2 font-mono text-[10.5px] text-ink/55">{related.reading_time} min read</p>}
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </article>
    </div>
  );
};
