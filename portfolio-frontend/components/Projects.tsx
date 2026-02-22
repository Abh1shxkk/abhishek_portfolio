import React, { useState, useEffect, useRef } from 'react';
import { SectionId } from '../types';
import { useProjects } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';

export const Projects: React.FC = () => {
  const { data: projects, isLoading, error } = useProjects();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Track mouse for floating image
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Scroll-triggered entrance
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    rowRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleRows(prev => new Set(prev).add(index));
            observer.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [projects]);

  if (isLoading) {
    return (
      <section id={SectionId.Projects} className="py-24 md:py-32 px-6 md:px-12 bg-white dark:bg-geo-dark-bg border-b border-neutral-200 dark:border-geo-dark-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl font-medium tracking-tight text-black dark:text-white mb-16">
            SELECTED WORK<span className="text-neutral-300 dark:text-neutral-700">.</span>
          </h2>
          <div className="space-y-0 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !projects) {
    return (
      <section id={SectionId.Projects} className="py-24 md:py-32 px-6 md:px-12 bg-white dark:bg-geo-dark-bg border-b border-neutral-200 dark:border-geo-dark-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-500">Error loading projects. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id={SectionId.Projects}
      className="py-24 md:py-32 px-6 md:px-12 bg-white dark:bg-geo-dark-bg border-b border-neutral-200 dark:border-geo-dark-border transition-colors duration-300 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-5">
            <h2 className="font-display text-4xl font-medium tracking-tight text-black dark:text-white">
              SELECTED WORK<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h2>
            <div className="h-px w-12 bg-black dark:bg-white mt-4" />
            <p className="text-sm font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mt-4">
              {projects.length} Projects
            </p>
          </div>
          <div className="md:col-span-7 md:flex md:items-end md:justify-end">
            <div className="md:text-right">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed md:max-w-md">
                A curation of digital products, websites, and experimental interfaces.
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

        {/* Top border */}
        <div className="h-px bg-black dark:bg-white mb-0" />

        {/* Project Rows */}
        <div className="relative">
          {projects.map((project, index) => {
            const isHovered = hoveredId === project.id;
            const isVisible = visibleRows.has(index);
            const num = String(index + 1).padStart(2, '0');

            const ProjectWrapper = project.website_url ? 'a' : 'div';
            const wrapperProps = project.website_url
              ? { href: project.website_url, target: '_blank' as const, rel: 'noopener noreferrer' }
              : {};

            return (
              <div
                key={project.id}
                ref={el => { rowRefs.current[index] = el; }}
                className={`transition-all duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <ProjectWrapper
                  className="group block border-b border-neutral-200 dark:border-neutral-800 cursor-pointer"
                  {...wrapperProps}
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className={`py-8 md:py-10 transition-all duration-300 ${isHovered ? 'md:pl-6' : 'pl-0'}`}>
                    {/* Mobile layout */}
                    <div className="md:hidden">
                      {/* Image */}
                      <div className="aspect-[16/9] overflow-hidden border border-neutral-200 dark:border-neutral-800 mb-5">
                        <img
                          src={project.image_url || 'https://picsum.photos/800/450'}
                          alt={project.title}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        />
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="font-mono text-xs text-neutral-300 dark:text-neutral-700 mt-1 flex-shrink-0">{num}</span>
                        <div>
                          <h3 className="text-lg font-display font-semibold tracking-tight text-black dark:text-white">{project.title}</h3>
                          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-600">{project.category}</span>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">{project.description}</p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {project.technologies?.map(t => (
                              <span key={t} className="text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 text-neutral-400 dark:text-neutral-600">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-6">
                      {/* Number */}
                      <div className="col-span-1">
                        <span className={`font-mono text-sm transition-colors duration-300 ${isHovered ? 'text-black dark:text-white' : 'text-neutral-300 dark:text-neutral-700'}`}>
                          {num}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="col-span-5">
                        <h3 className={`font-display text-2xl lg:text-3xl font-semibold tracking-tight transition-all duration-300 ${
                          isHovered
                            ? 'text-black dark:text-white'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {project.title}
                        </h3>
                      </div>

                      {/* Category */}
                      <div className="col-span-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                          {project.category}
                        </span>
                      </div>

                      {/* Tech stack */}
                      <div className="col-span-3 flex gap-2 flex-wrap justify-end">
                        {project.technologies?.map(t => (
                          <span
                            key={t}
                            className={`text-[10px] font-mono border px-2 py-0.5 transition-colors duration-300 ${
                              isHovered
                                ? 'border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600'
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Arrow */}
                      <div className="col-span-1 flex justify-end">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-all duration-300 ${
                            isHovered
                              ? 'text-black dark:text-white translate-x-0 -translate-y-0'
                              : 'text-neutral-300 dark:text-neutral-700 -translate-x-1 translate-y-1'
                          }`}
                        >
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expandable description - desktop */}
                  <div
                    className={`hidden md:block overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isHovered ? 'max-h-24 opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-1" />
                      <p className="col-span-7 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </ProjectWrapper>
              </div>
            );
          })}
        </div>

        {/* Bottom accent */}
        <div className="h-px bg-black dark:bg-white mt-0" />
      </div>

      {/* Floating image preview on hover — desktop only */}
      {hoveredId !== null && (
        <div
          className="hidden md:block fixed w-[320px] h-[200px] pointer-events-none z-50 transition-opacity duration-300"
          style={{
            left: `${mousePos.x + 24}px`,
            top: `${mousePos.y - 100}px`,
            position: 'absolute',
          }}
        >
          <div className="w-full h-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black overflow-hidden shadow-2xl dark:shadow-none">
            <img
              src={projects.find(p => p.id === hoveredId)?.image_url || 'https://picsum.photos/640/400'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </section>
  );
};
