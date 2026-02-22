import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBlogs, useBlogCategories } from '../hooks/usePortfolio';

export const BlogList: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data: blogData, isLoading, error } = useBlogs({ category: selectedCategory, page, per_page: 9 });
  const { data: categories } = useBlogCategories();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  const posts = blogData?.data || [];

  // Set document title
  useEffect(() => {
    document.title = 'Blog | Abhishek Chauhan';
    return () => {
      document.title = 'Abhishek Chauhan | Portfolio';
    };
  }, []);

  // Header entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setHeaderVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll-triggered card animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    cardRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards(prev => new Set(prev).add(index));
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [posts]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
    setVisibleCards(new Set());
  }, [selectedCategory]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="blog-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
      {/* Back to Portfolio Link */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-32">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-neutral-400 hover:text-black dark:hover:text-white transition-colors duration-300 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-1">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Portfolio
        </Link>
      </div>

      {/* Section Header */}
      <div className={`max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-16 transition-all duration-700 ease-out ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} ref={headerRef}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6">
            <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-black dark:text-white">
              BLOG<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h1>
            <div className="h-px w-12 bg-black dark:bg-white mt-4" />
            <p className="text-sm font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mt-4">
              {posts.length} {posts.length === 1 ? 'Article' : 'Articles'}
            </p>
          </div>
          <div className="md:col-span-6 md:flex md:items-end md:justify-end">
            <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed md:text-right max-w-md">
              Thoughts on technology, development, and the craft of building digital products.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {categories && categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`blog-filter-tab ${!selectedCategory ? 'active' : ''}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`blog-filter-tab ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="h-px bg-neutral-200 dark:bg-neutral-800 mt-2" />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" />
                <div className="pt-5 space-y-3">
                  <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-900" />
                  <div className="h-5 w-3/4 bg-neutral-100 dark:bg-neutral-900" />
                  <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-900" />
                  <div className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-900" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
          <div className="border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 font-mono text-sm">
              Error loading blog posts. Please try again later.
            </p>
          </div>
        </div>
      )}

      {/* Blog Cards Grid */}
      {!isLoading && !error && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
          {posts.length === 0 ? (
            <div className="border border-neutral-200 dark:border-neutral-800 p-12 text-center">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                No blog posts yet. Check back soon!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                  <article
                    key={post.id}
                    ref={el => { cardRefs.current[index] = el; }}
                    className={`blog-card group transition-all duration-700 ease-out ${visibleCards.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                      }`}
                    style={{ transitionDelay: `${(index % 3) * 120}ms` }}
                  >
                    <Link to={`/blog/${post.slug}`} className="block">
                      {/* Featured Image */}
                      <div className="blog-card-image-wrapper">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="blog-card-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="blog-card-image-placeholder">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 dark:text-neutral-700">
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </div>
                        )}
                        {/* Category badge on image */}
                        {post.category && (
                          <span className="blog-card-category-badge">
                            {post.category}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-5">
                        {/* Meta info row */}
                        <div className="flex items-center gap-3 mb-3">
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
                        <h2 className="blog-card-title">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        {post.excerpt && (
                          <p className="blog-card-excerpt">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            {post.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="blog-card-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Read More indicator */}
                        <div className="blog-card-read-more">
                          <span className="text-[11px] font-mono uppercase tracking-widest">
                            Read Article
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {blogData?.meta?.last_page > 1 && (
                <div className="flex items-center justify-center gap-4 mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="blog-pagination-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Previous
                  </button>
                  <span className="text-sm font-mono text-neutral-400 dark:text-neutral-600">
                    {page} / {blogData.meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(blogData.meta.last_page, p + 1))}
                    disabled={page >= blogData.meta.last_page}
                    className="blog-pagination-btn"
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
