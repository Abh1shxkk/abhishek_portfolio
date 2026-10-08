import React, { useState, useEffect, useRef } from 'react';
import { SectionId, Project } from '../types';
import { useProjects } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';

const ArrowUpRight: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const StatusPill: React.FC<{ status: string | null }> = ({ status }) => {
  if (!status) return null;
  const live = ['live', 'in production', 'pilot'].includes(status.toLowerCase());
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
      <span className="relative flex h-1.5 w-1.5">
        {live && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${live ? 'bg-green-500' : 'bg-neutral-400'}`} />
      </span>
      {status}
    </span>
  );
};

// Fades a block in once it scrolls into view.
const useReveal = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, shown };
};

const FeaturedCard: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const { ref, shown } = useReveal<HTMLElement>();
  const num = String(index + 1).padStart(2, '0');

  return (
    <article
      ref={ref}
      className={`group flex flex-col transition-all duration-700 ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${(index % 2) * 120}ms` }}
    >
      {/* Screenshot in a minimal browser frame */}
      <Link to={`/projects/${project.id}`} className="block border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 overflow-hidden transition-colors duration-300 group-hover:border-black dark:group-hover:border-white">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300 group-hover:border-black dark:group-hover:border-white">
          <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          {project.website_url && (
            <span className="ml-3 truncate text-[10px] font-mono text-neutral-400 dark:text-neutral-600">
              {project.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </span>
          )}
        </div>
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={project.image_url || ''}
            alt={`${project.title} screenshot`}
            loading="lazy"
            className="w-full h-full object-cover object-top grayscale-[60%] transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      {/* Meta */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-300 dark:text-neutral-700">{num}</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">{project.category}</span>
        </div>
        <StatusPill status={project.status} />
      </div>

      <h3 className="font-display text-2xl lg:text-[1.7rem] font-semibold tracking-tight text-black dark:text-white mt-3 leading-tight">
        <Link to={`/projects/${project.id}`} className="bg-[length:0%_1px] bg-left-bottom bg-no-repeat bg-gradient-to-r from-current to-current transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
          {project.title}
        </Link>
      </h3>
      <p className="text-sm md:text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed mt-3">{project.description}</p>

      <div className="flex gap-2 flex-wrap mt-4">
        {project.technologies?.map(t => (
          <span key={t} className="text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 text-neutral-500 dark:text-neutral-500">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-6 mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800">
        {project.website_url && (
          <a
            href={project.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-black dark:text-white hover:opacity-60 transition-opacity"
          >
            Live site <ArrowUpRight />
          </a>
        )}
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Code <ArrowUpRight />
          </a>
        )}
        <Link
          to={`/projects/${project.id}`}
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
        >
          Case study
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  );
};

export const Projects: React.FC = () => {
  const { data: projects } = useProjects();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const listRef = useRef<HTMLDivElement>(null);

  if (!projects) return null;

  const featured = projects.filter(p => p.is_featured);
  const more = projects.filter(p => !p.is_featured);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!listRef.current) return;
    const rect = listRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <section
      id={SectionId.Projects}
      className="py-24 md:py-32 px-6 md:px-12 bg-white dark:bg-geo-dark-bg border-b border-neutral-200 dark:border-geo-dark-border transition-colors duration-300 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 md:mb-20">
          <div className="md:col-span-5">
            <h2 className="font-display text-4xl font-medium tracking-tight text-black dark:text-white">
              SELECTED WORK<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h2>
            <div className="h-px w-12 bg-black dark:bg-white mt-4" />
            <p className="text-sm font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mt-4">
              {projects.length} Projects · {projects.filter(p => p.website_url).length} live
            </p>
          </div>
          <div className="md:col-span-7 md:flex md:items-end md:justify-end">
            <div className="md:text-right">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed md:max-w-md">
                Production systems for a university, its hospital and legal office, plus client platforms and stores.
              </p>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 mt-6 text-xs font-mono uppercase tracking-widest text-black dark:text-white hover:opacity-70 transition-opacity"
              >
                Explore all projects
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Featured grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 lg:gap-x-14 gap-y-16 md:gap-y-20">
          {featured.map((project, index) => (
            <FeaturedCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {/* More work */}
        {more.length > 0 && (
          <div className="mt-24 md:mt-32">
            <div className="flex items-end justify-between mb-6">
              <h3 className="font-display text-xl font-medium tracking-tight text-black dark:text-white">
                More work<span className="text-neutral-300 dark:text-neutral-700">.</span>
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                Client platforms, stores and tools
              </span>
            </div>
            <div className="h-px bg-black dark:bg-white" />

            <div ref={listRef} className="relative" onMouseMove={handleMouseMove}>
              {more.map((project, index) => {
                const isHovered = hoveredId === project.id;
                const num = String(featured.length + index + 1).padStart(2, '0');
                const Wrapper = project.website_url ? 'a' : 'div';
                const wrapperProps = project.website_url
                  ? { href: project.website_url, target: '_blank' as const, rel: 'noopener noreferrer' }
                  : {};

                return (
                  <Wrapper
                    key={project.id}
                    {...wrapperProps}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group grid grid-cols-12 items-center gap-4 md:gap-6 py-6 md:py-7 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer"
                  >
                    <span className={`col-span-2 md:col-span-1 font-mono text-sm transition-colors duration-300 ${isHovered ? 'text-black dark:text-white' : 'text-neutral-300 dark:text-neutral-700'}`}>
                      {num}
                    </span>
                    <div className={`col-span-9 md:col-span-5 transition-transform duration-300 ${isHovered ? 'md:translate-x-2' : ''}`}>
                      <h4 className="font-display text-lg md:text-xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {project.title}
                      </h4>
                      <p className="md:hidden text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{project.description}</p>
                    </div>
                    <span className="hidden md:block md:col-span-2 text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                      {project.category}
                    </span>
                    <div className="hidden md:flex md:col-span-3 gap-2 flex-wrap justify-end">
                      {project.technologies?.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 text-neutral-400 dark:text-neutral-600 group-hover:border-neutral-400 dark:group-hover:border-neutral-500 transition-colors">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ArrowUpRight
                        size={18}
                        className={`transition-all duration-300 ${isHovered ? 'text-black dark:text-white translate-x-0 translate-y-0' : 'text-neutral-300 dark:text-neutral-700 -translate-x-1 translate-y-1'}`}
                      />
                    </div>
                  </Wrapper>
                );
              })}

              {/* Floating screenshot preview, desktop only */}
              {hoveredId !== null && (
                <div
                  className="hidden lg:block absolute w-[300px] pointer-events-none z-20"
                  style={{ left: `${mousePos.x + 28}px`, top: `${mousePos.y - 90}px` }}
                >
                  <div className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black overflow-hidden shadow-2xl dark:shadow-none aspect-[16/10]">
                    <img
                      src={more.find(p => p.id === hoveredId)?.image_url || ''}
                      alt=""
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
