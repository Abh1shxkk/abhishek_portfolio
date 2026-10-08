import React from 'react';
import { SectionId } from '../types';
import { useExperiences } from '../hooks/usePortfolio';

const formatMonthYear = (date: string | null) => {
  if (!date) {
    return 'Present';
  }

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export const Experience: React.FC = () => {
  const { data: experiences, isLoading, error } = useExperiences();

  if (isLoading) {
    return (
      <section id={SectionId.Experience} className="bg-neutral-50 dark:bg-geo-dark-card py-24 md:py-32 px-6 md:px-12 border-b border-neutral-200 dark:border-geo-dark-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-display text-4xl font-medium tracking-tight text-black dark:text-white">
              EXPERIENCE<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h2>
          </div>
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !experiences) {
    return (
      <section id={SectionId.Experience} className="bg-neutral-50 dark:bg-geo-dark-card py-24 md:py-32 px-6 md:px-12 border-b border-neutral-200 dark:border-geo-dark-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-500">Error loading experience data. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section id={SectionId.Experience} className="bg-neutral-50 dark:bg-geo-dark-card py-24 md:py-32 px-6 md:px-12 border-b border-neutral-200 dark:border-geo-dark-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="font-display text-4xl font-medium tracking-tight text-black dark:text-white">
            EXPERIENCE<span className="text-neutral-300 dark:text-neutral-700">.</span>
          </h2>
        </div>

        <div className="space-y-0">
          {experiences.map((job, index) => (
            <div key={job.id} className="group relative grid grid-cols-1 md:grid-cols-12 gap-8 py-12 border-t border-neutral-200 dark:border-neutral-800 transition-colors hover:bg-white dark:hover:bg-black/20">
              {/* Number */}
              <div className="hidden md:block md:col-span-1 text-neutral-300 dark:text-neutral-700 font-mono text-sm pt-1">
                0{index + 1}
              </div>

              {/* Role & Company */}
              <div className="md:col-span-4">
                {job.is_current && (
                  <span className="inline-flex items-center gap-1.5 mb-3 text-[10px] font-mono uppercase tracking-[0.15em] text-green-600 dark:text-green-400">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    Current role
                  </span>
                )}
                {job.company_logo && (
                  <div className="mb-4 w-14 h-14 border border-neutral-200 dark:border-neutral-700 bg-white p-1.5 overflow-hidden transition-all duration-300 group-hover:border-black dark:group-hover:border-white group-hover:-translate-y-0.5">
                    <img src={job.company_logo} alt={`${job.company} logo`} loading="lazy" className="w-full h-full object-contain" />
                  </div>
                )}
                <h3 className="text-2xl font-medium tracking-tight text-black dark:text-white">{job.position}</h3>
                <div className="text-neutral-500 dark:text-neutral-400 mt-1 font-mono text-sm uppercase">
                  {job.website_url ? (
                    <a href={job.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors">
                      {job.company} ↗
                    </a>
                  ) : job.company}
                </div>
                <div className="text-neutral-400 dark:text-neutral-600 mt-1 text-sm font-mono uppercase tracking-wide">
                  {formatMonthYear(job.start_date)} - {job.is_current ? 'Present' : formatMonthYear(job.end_date)}
                  {job.duration_label ? ` • ${job.duration_label}` : ''}
                </div>
                {job.location && (
                  <div className="text-neutral-400 dark:text-neutral-600 mt-1 text-xs font-mono">{job.location}</div>
                )}
              </div>

              {/* Description and responsibilities */}
              <div className="md:col-span-5 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p className="text-black dark:text-white">{job.description}</p>
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <ul className="mt-5 space-y-2.5">
                    {job.responsibilities.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="mt-[9px] h-px w-3 flex-shrink-0 bg-neutral-400 dark:bg-neutral-600 transition-all duration-300 group-hover:w-5 group-hover:bg-black dark:group-hover:bg-white" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tags */}
              <div className="md:col-span-2 flex flex-wrap content-start gap-2">
                {job.technologies?.map(tech => (
                  <span key={tech} className="text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-neutral-800 px-2 py-1 bg-white dark:bg-black/50 text-neutral-600 dark:text-neutral-400 group-hover:border-black dark:group-hover:border-white transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t border-neutral-200 dark:border-neutral-800"></div>
        </div>
      </div>
    </section>
  );
};