import React, { useState, useEffect, useRef } from 'react';
import { SectionId } from '../types';
import { useEducation } from '../hooks/usePortfolio';

// Map institution names to logo paths
function getInstitutionLogo(institution: string, dataLogo?: string | null): string {
  // Use logo from data if available
  if (dataLogo) return dataLogo;

  const lower = institution.toLowerCase();
  if (lower.includes('iimt')) {
    return '/download.png';
  }
  if (lower.includes('meerut institute') || lower.includes('miet')) {
    return '/miet.png';
  }
  if (lower.includes('vidya') || lower.includes('rsms') || lower.includes('r s m')) {
    return '/vidhya-bharti.png';
  }
  return '';
}

// Format date range
function formatDateRange(start: string | null, end: string | null): string {
  const startYear = start ? new Date(start).getFullYear() : '?';
  const endYear = end ? new Date(end).getFullYear() : 'Present';
  return `${startYear} — ${endYear}`;
}

// Duration calculation
function getDuration(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const years = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 365));
  return years <= 1 ? '1 year' : `${years} years`;
}

export const Education: React.FC = () => {
  const { data: education, isLoading, error } = useEducation();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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
        { threshold: 0.2 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [education]);

  if (isLoading) {
    return (
      <section id={SectionId.Education} className="py-24 md:py-32 px-6 md:px-12 bg-neutral-50 dark:bg-geo-dark-card transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl font-medium tracking-tight mb-6 text-black dark:text-white">
            EDUCATION<span className="text-neutral-300 dark:text-neutral-700">.</span>
          </h2>
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-800"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !education) {
    return (
      <section id={SectionId.Education} className="py-24 md:py-32 px-6 md:px-12 bg-neutral-50 dark:bg-geo-dark-card transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-500">Error loading education data. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section id={SectionId.Education} className="py-24 md:py-32 px-6 md:px-12 bg-neutral-50 dark:bg-geo-dark-card transition-colors duration-300 border-b border-neutral-200 dark:border-geo-dark-border">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-4">
            <h2 className="font-display text-4xl font-medium tracking-tight text-black dark:text-white">
              EDUCATION<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h2>
            <div className="h-px w-12 bg-black dark:bg-white mt-4" />
            <p className="text-sm font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mt-4">
              Academic Journey
            </p>
          </div>
          <div className="md:col-span-8">
            <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed">
              From foundational concepts to advanced engineering — a structured path through
              Computer Science and Technology.
            </p>
          </div>
        </div>

        {/* Education Cards */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="hidden md:block absolute left-[29px] top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />

          <div className="space-y-6">
            {education.map((edu, index) => {
              const logo = getInstitutionLogo(edu.institution, edu.logo);
              const isVisible = visibleCards.has(index);
              const duration = getDuration(edu.start_date, edu.end_date);

              return (
                <div
                  key={edu.id}
                  ref={el => { cardRefs.current[index] = el; }}
                  className={`relative transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="hidden md:flex absolute left-0 top-8 z-10">
                    <div className="w-3 h-3 bg-black dark:bg-white ring-4 ring-neutral-50 dark:ring-[#111]"
                      style={{ marginLeft: '23px' }} />
                  </div>

                  {/* Card */}
                  <div className="md:ml-16 group">
                    <div className="relative border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0d0d0d] hover:border-black dark:hover:border-neutral-600 transition-all duration-300">
                      {/* Top accent line */}
                      <div className="h-px bg-black dark:bg-white" />

                      <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-start gap-5">
                          {/* Institution Logo */}
                          {logo && (
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 md:w-16 md:h-16 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center p-2 group-hover:border-black dark:group-hover:border-neutral-600 transition-colors duration-300">
                                <img
                                  src={logo}
                                  alt={edu.institution}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div>
                                {/* Degree label */}
                                <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 mb-3">
                                  {edu.degree}
                                </span>

                                {/* Institution name */}
                                <h3 className="text-lg md:text-xl font-display font-semibold tracking-tight text-black dark:text-white">
                                  {edu.institution}
                                </h3>

                                {/* Field of study */}
                                {edu.field_of_study && (
                                  <p className="text-neutral-500 dark:text-neutral-500 mt-1.5 flex items-center gap-2 text-sm">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                    {edu.field_of_study}
                                  </p>
                                )}
                              </div>

                              {/* Date & Duration */}
                              <div className="flex flex-col items-start md:items-end gap-1 flex-shrink-0">
                                <span className="font-mono text-sm text-black dark:text-white font-medium">
                                  {formatDateRange(edu.start_date, edu.end_date)}
                                </span>
                                {duration && (
                                  <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600 flex items-center gap-1.5">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    {duration}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Description if available */}
                            {edu.description && (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                {edu.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline end cap */}
          <div className="hidden md:block absolute left-[26px] bottom-0 w-[6px] h-[6px] bg-neutral-300 dark:bg-neutral-700" />
        </div>
      </div>
    </section>
  );
};