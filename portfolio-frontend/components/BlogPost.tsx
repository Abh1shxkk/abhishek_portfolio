import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { useBlogPost, useBlogs } from '../hooks/usePortfolio';

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

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || '');
  const { data: allBlogs } = useBlogs({ per_page: 50 });
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [tocVisible, setTocVisible] = useState(false);

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

  // Related posts
  const relatedPosts = useMemo(() => {
    if (!post || !allBlogs?.data) return [];
    return allBlogs.data
      .filter(p => p.slug !== post.slug && (p.category === post.category || (post.tags && p.tags?.some(t => post.tags?.includes(t)))))
      .slice(0, 3);
  }, [post, allBlogs]);

  // SEO: Dynamic meta tags
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

    // JSON-LD
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      image: post.featured_image || undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: {
        '@type': 'Person',
        name: 'Abhishek Chauhan',
      },
      description: post.excerpt || post.meta_description || '',
      keywords: post.tags?.join(', '),
    });

    return () => {
      document.title = 'Abhishek Chauhan | Portfolio';
      const jsonLd = document.querySelector('script[data-blog-jsonld]');
      if (jsonLd) jsonLd.remove();
    };
  }, [post]);

  // Active heading tracker for ToC
  useEffect(() => {
    if (toc.length === 0) return;

    const handleScroll = () => {
      const headingEls = toc.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
      let current = '';
      for (const el of headingEls) {
        if (el.getBoundingClientRect().top <= 120) {
          current = el.id;
        }
      }
      setActiveHeading(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  // Entrance animation for ToC
  useEffect(() => {
    const timer = setTimeout(() => setTocVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="blog-post-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-24 animate-pulse">
          <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-900 mb-8" />
          <div className="h-8 w-3/4 bg-neutral-100 dark:bg-neutral-900 mb-4" />
          <div className="h-6 w-1/2 bg-neutral-100 dark:bg-neutral-900 mb-8" />
          <div className="aspect-[2/1] bg-neutral-100 dark:bg-neutral-900 mb-12" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-4 bg-neutral-100 dark:bg-neutral-900" style={{ width: `${90 - i * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-post-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-24">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-neutral-400 hover:text-black dark:hover:text-white transition-colors mb-12 group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-1">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Blog
          </Link>
          <div className="border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <h1 className="text-2xl font-display font-medium text-black dark:text-white mb-4">Post Not Found</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
      {/* Header area */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 pt-28 md:pt-32">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-neutral-400 hover:text-black dark:hover:text-white transition-colors duration-300 mb-10 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-1">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Blog
        </Link>

        {/* Post Meta */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {post.category && (
            <span className="text-[11px] font-mono uppercase tracking-[0.15em] px-3 py-1 border border-black dark:border-white text-black dark:text-white">
              {post.category}
            </span>
          )}
          {post.published_at && (
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              {formatDate(post.published_at)}
            </span>
          )}
          {post.reading_time && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                {post.reading_time} min read
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-black dark:text-white leading-[1.1] mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mb-8">
            {post.excerpt}
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-neutral-200 dark:bg-neutral-800 mb-10" />
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="max-w-5xl mx-auto px-6 md:px-12 mb-12">
          <div className="blog-featured-image-wrapper">
            <img
              src={post.featured_image}
              alt={post.title}
              className="blog-featured-image"
            />
          </div>
        </div>
      )}

      {/* Content + ToC Layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24 relative">
        <div className="flex gap-12">
          {/* Main Content */}
          <div className="flex-1 max-w-4xl mx-auto">
            <div className="blog-prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug, rehypeHighlight]}
                components={{
                  h1: ({ children, ...props }) => (
                    <h1 className="blog-prose-h1" {...props}>{children}</h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 className="blog-prose-h2" {...props}>{children}</h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 className="blog-prose-h3" {...props}>{children}</h3>
                  ),
                  p: ({ children, ...props }) => (
                    <p className="blog-prose-p" {...props}>{children}</p>
                  ),
                  a: ({ children, href, ...props }) => (
                    <a href={href} className="blog-prose-link" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className="blog-prose-ul" {...props}>{children}</ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="blog-prose-ol" {...props}>{children}</ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="blog-prose-li" {...props}>{children}</li>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote className="blog-prose-blockquote" {...props}>{children}</blockquote>
                  ),
                  code: ({ children, className, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="blog-prose-code-inline" {...props}>{children}</code>
                    ) : (
                      <code className={`blog-prose-code-block ${className || ''}`} {...props}>{children}</code>
                    );
                  },
                  pre: ({ children, ...props }) => (
                    <pre className="blog-prose-pre" {...props}>{children}</pre>
                  ),
                  img: ({ src, alt, ...props }) => (
                    <img src={src} alt={alt || ''} className="blog-prose-img" loading="lazy" {...props} />
                  ),
                  table: ({ children, ...props }) => (
                    <div className="blog-prose-table-wrapper">
                      <table className="blog-prose-table" {...props}>{children}</table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th className="blog-prose-th" {...props}>{children}</th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="blog-prose-td" {...props}>{children}</td>
                  ),
                  hr: () => <hr className="blog-prose-hr" />,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Tags Section Below Content */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 block mb-4">
                  Tags
                </span>
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map(tag => (
                    <Link
                      key={tag}
                      to={`/blog?tag=${tag}`}
                      className="text-xs font-mono border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-neutral-500 dark:text-neutral-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors duration-300"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Table of Contents — Desktop Sidebar */}
          {toc.length > 0 && (
            <aside className={`blog-toc-sidebar transition-all duration-700 ease-out ${tocVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
              <div className="sticky top-28">
                <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 block mb-4">
                  On This Page
                </span>
                <nav className="space-y-1">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`blog-toc-link ${activeHeading === item.id ? 'active' : ''}`}
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
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
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0d0d0d] transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
            <h2 className="font-display text-2xl font-medium tracking-tight text-black dark:text-white mb-12">
              Related Articles<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map(related => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="group block"
                >
                  {related.featured_image && (
                    <div className="aspect-[16/10] overflow-hidden border border-neutral-200 dark:border-neutral-800 mb-4">
                      <img
                        src={related.featured_image}
                        alt={related.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {related.category && (
                      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-600">{related.category}</span>
                    )}
                    {related.reading_time && (
                      <>
                        <span className="text-neutral-300 dark:text-neutral-700">·</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">{related.reading_time} min</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-300 leading-snug">
                    {related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
