import React from 'react';
import { SectionId } from '../types';
import { useExperiences } from '../hooks/usePortfolio';

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
                <h3 className="text-2xl font-medium tracking-tight text-black dark:text-white">{job.position}</h3>
                <div className="text-neutral-500 dark:text-neutral-400 mt-1 font-mono text-sm uppercase">{job.company}</div>
                <div className="text-neutral-400 dark:text-neutral-600 mt-1 text-sm">
                  {new Date(job.start_date).getFullYear()} — {job.is_current ? 'Present' : new Date(job.end_date!).getFullYear()}
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-5 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>{job.description}</p>
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