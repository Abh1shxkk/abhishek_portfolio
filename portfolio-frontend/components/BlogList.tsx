import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogs, useBlogCategories } from '../hooks/usePortfolio';
import { Icon, Reveal, SlipArrow } from './ui';

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const BlogList: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data: blogData, isLoading, error } = useBlogs({ category: selectedCategory, page, per_page: 9 });
  const { data: categories } = useBlogCategories();
  const posts = blogData?.data || [];

  useEffect(() => setPage(1), [selectedCategory]);

  return (
    <div className="relative">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <Reveal>
          <Link to="/" className="chip-sign paper press">
            <Icon.ArrowLeft size={12} /> Back to the road
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.22em] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">Travel notes</p>
              <h1 className="type-3d blue big mt-2 text-[40px] leading-[1] md:text-[64px]">Blog</h1>
            </div>
            <div className="sign sign-blue !m-0 drop-in">
              <h2 className="sign-title">{posts.length} {posts.length === 1 ? 'note' : 'notes'}</h2>
            </div>
          </div>
        </Reveal>

        {categories && categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory(undefined)} className={`chip-sign press !px-3 !py-2 !text-[10.5px] ${!selectedCategory ? 'blue' : 'paper'}`}>All</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`chip-sign press !px-3 !py-2 !text-[10.5px] ${selectedCategory === cat ? 'blue' : 'paper'}`}>{cat}</button>
            ))}
          </div>
        )}

        {isLoading && <p className="card-paper mt-10 p-10 text-center text-ink/70">Loading…</p>}
        {error && <p className="card-paper mt-10 p-10 text-center text-ink/70">Error loading blog posts. Please try again later.</p>}

        {!isLoading && !error && (
          posts.length === 0 ? (
            <div className="card-paper mt-10 p-10 text-center">
              <p className="type-3d blue text-[22px]">Nothing written yet</p>
              <p className="mt-3 text-ink/70">Notes from the road will show up here. Until then, the projects are the story.</p>
              <Link to="/projects" className="btn-sign press mt-6 inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[11.5px] uppercase tracking-wide">
                See the projects <Icon.ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                  <Reveal key={post.id} delay={(index % 3) * 90}>
                    <Link to={`/blog/${post.slug}`} className="group block h-full">
                      <article className="card-paper flex h-full flex-col p-3 transition-transform duration-500 group-hover:-translate-y-1">
                        <div className="polaroid" style={{ '--tilt': index % 2 ? '0.8deg' : '-0.8deg' } as React.CSSProperties}>
                          <div className="aspect-[16/10] overflow-hidden rounded-[2px] bg-[#e9e3d6]">
                            {post.featured_image && <img src={post.featured_image} alt={post.title} loading="lazy" className="h-full w-full object-cover" />}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col px-1.5 pb-1 pt-4">
                          <div className="flex items-center gap-2 font-mono text-[10.5px] text-ink/55">
                            {post.category && <span className="chip-sign blue">{post.category}</span>}
                            {post.published_at && <span>{formatDate(post.published_at)}</span>}
                            {post.reading_time && <span>· {post.reading_time} min</span>}
                          </div>
                          <h2 className="mt-2.5 font-display text-[16px] leading-tight text-ink">{post.title}</h2>
                          {post.excerpt && <p className="mt-2 text-[14px] leading-relaxed text-ink/75 line-clamp-3">{post.excerpt}</p>}
                          <div className="mt-auto flex items-center justify-between border-t border-dashed border-ink/20 pt-3">
                            <span className="font-display text-[10.5px] uppercase tracking-wide text-[rgb(var(--sign-blue))]">Read</span>
                            <span className="btn-sign blue grid h-8 w-8 place-items-center rounded-md"><SlipArrow size={14} /></span>
                          </div>
                        </div>
                        <span className="fold" />
                      </article>
                    </Link>
                  </Reveal>
                ))}
              </div>

              {blogData?.meta?.last_page > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-40">
                    <Icon.ArrowLeft size={14} /> Previous
                  </button>
                  <span className="font-mono text-sm text-ink/60">{page} / {blogData.meta.last_page}</span>
                  <button onClick={() => setPage((p) => Math.min(blogData.meta.last_page, p + 1))} disabled={page >= blogData.meta.last_page} className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-40">
                    Next <Icon.ArrowRight size={14} />
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};
