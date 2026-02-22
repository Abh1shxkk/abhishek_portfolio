import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/usePortfolio';

export const ProjectsList: React.FC = () => {
  const { data: projects, isLoading, error } = useProjects();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [headerVisible, setHeaderVisible] = useState(false);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const categories = useMemo(() => {
    if (!projects) return [];
    return Array.from(new Set(projects.map((project) => project.category).filter(Boolean) as string[])).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!selectedCategory) return projects;
    return projects.filter((project) => project.category === selectedCategory);
  }, [projects, selectedCategory]);

  useEffect(() => {
    document.title = 'Projects | Abhishek Chauhan';
    return () => {
      document.title = 'Abhishek Chauhan | Portfolio';
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setHeaderVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    cardRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(index));
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [filteredProjects]);

  useEffect(() => {
    setVisibleCards(new Set());
  }, [selectedCategory]);

  return (
    <div className="projects-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
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

      <div className={`max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-16 transition-all duration-700 ease-out ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6">
            <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-black dark:text-white">
              PROJECTS<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h1>
            <div className="h-px w-12 bg-black dark:bg-white mt-4" />
            <p className="text-sm font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mt-4">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
            </p>
          </div>
          <div className="md:col-span-6 md:flex md:items-end md:justify-end">
            <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed md:text-right max-w-md">
              Deep dives into products I have designed, built, and shipped across web and mobile.
            </p>
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-colors ${!selectedCategory
                  ? 'border-black dark:border-white text-black dark:text-white'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white'
                }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-colors ${selectedCategory === category
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="h-px bg-neutral-200 dark:bg-neutral-800 mt-2" />
        </div>
      )}

      {isLoading && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[16/10] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" />
                <div className="pt-5 space-y-3">
                  <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-900" />
                  <div className="h-6 w-2/3 bg-neutral-100 dark:bg-neutral-900" />
                  <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-900" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
          <div className="border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 font-mono text-sm">
              Error loading projects. Please try again later.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
          {filteredProjects.length === 0 ? (
            <div className="border border-neutral-200 dark:border-neutral-800 p-12 text-center">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                No projects found for this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredProjects.map((project, index) => (
                <article
                  key={project.id}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  className={`group transition-all duration-700 ease-out ${visibleCards.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  style={{ transitionDelay: `${(index % 2) * 120}ms` }}
                >
                  <Link to={`/projects/${project.id}`} className="block border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors">
                    <div className="aspect-[16/10] overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                      {project.image_url ? (
                        <img
                          src={project.image_url}
                          alt={project.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 font-mono text-xs uppercase tracking-widest">
                          No Preview
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-600">
                          {project.category || 'General'}
                        </span>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl font-medium tracking-tight text-black dark:text-white mb-3 group-hover:translate-x-1 transition-transform duration-300">
                        {project.title}
                      </h2>

                      {project.description && (
                        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                          {project.description}
                        </p>
                      )}

                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-5">
                          {project.technologies.slice(0, 4).map((technology) => (
                            <span key={technology} className="text-[10px] font-mono border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                              {technology}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-black dark:text-white">
                        View Project
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
          )}
        </div>
      )}
    </div>
  );
};
