import React, { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProject, useProjects } from '../hooks/usePortfolio';

const formatDateRange = (startDate: string | null, endDate: string | null): string | null => {
  if (!startDate && !endDate) return null;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  if (startDate) return `${formatDate(startDate)} - Present`;
  if (endDate) return `Until ${formatDate(endDate)}`;
  return null;
};

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, error } = useProject(id || '');
  const { data: allProjects } = useProjects();

  const relatedProjects = useMemo(() => {
    if (!project || !allProjects) return [];
    return allProjects
      .filter((item) => item.id !== project.id && item.category === project.category)
      .slice(0, 3);
  }, [project, allProjects]);

  const timeline = useMemo(
    () => formatDateRange(project?.start_date ?? null, project?.end_date ?? null),
    [project?.start_date, project?.end_date]
  );

  useEffect(() => {
    if (!project) return;
    document.title = `${project.title} | Projects | Abhishek Chauhan`;
    return () => {
      document.title = 'Abhishek Chauhan | Portfolio';
    };
  }, [project]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (isLoading) {
    return (
      <div className="project-detail-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-24 animate-pulse">
          <div className="h-4 w-28 bg-neutral-100 dark:bg-neutral-900 mb-8" />
          <div className="h-10 w-2/3 bg-neutral-100 dark:bg-neutral-900 mb-6" />
          <div className="aspect-[16/9] bg-neutral-100 dark:bg-neutral-900 mb-12" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="h-4 bg-neutral-100 dark:bg-neutral-900" style={{ width: `${90 - index * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-24">
          <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-neutral-400 hover:text-black dark:hover:text-white transition-colors mb-12 group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-1">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Projects
          </Link>
          <div className="border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <h1 className="text-2xl font-display font-medium text-black dark:text-white mb-4">Project Not Found</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              The project you are looking for does not exist or is no longer published.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-page bg-white dark:bg-geo-dark-bg min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-10">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-neutral-400 hover:text-black dark:hover:text-white transition-colors duration-300 mb-10 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-1">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Projects
        </Link>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] px-3 py-1 border border-black dark:border-white text-black dark:text-white">
            {project.category || 'General'}
          </span>
          {project.status && (
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              {project.status}
            </span>
          )}
          {timeline && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                {timeline}
              </span>
            </>
          )}
        </div>

        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-black dark:text-white leading-[1.1] mb-6">
          {project.title}
        </h1>

        {project.description && (
          <p className="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-3xl mb-8">
            {project.description}
          </p>
        )}

        <div className="flex gap-3 flex-wrap mb-8">
          {project.website_url && (
            <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border border-black dark:border-white text-black dark:text-white text-xs font-mono uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
              Live Website
            </a>
          )}
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-mono uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors">
              Demo
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-mono uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors">
              Source Code
            </a>
          )}
        </div>

        <div className="h-px bg-neutral-200 dark:bg-neutral-800 mb-10" />
      </div>

      {project.image_url && (
        <div className="max-w-6xl mx-auto px-6 md:px-12 mb-12">
          <div className="aspect-[16/9] overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {project.long_description ? (
              <div className="space-y-4 text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {project.long_description.split('\n').filter(Boolean).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {project.description}
              </p>
            )}

            {project.features && project.features.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-2xl font-medium tracking-tight text-black dark:text-white mb-5">
                  Key Features<span className="text-neutral-300 dark:text-neutral-700">.</span>
                </h2>
                <ul className="space-y-3">
                  {project.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-neutral-600 dark:text-neutral-300">
                      <span className="mt-[7px] w-1.5 h-1.5 bg-black dark:bg-white rounded-full" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.gallery_images && project.gallery_images.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-2xl font-medium tracking-tight text-black dark:text-white mb-5">
                  Gallery<span className="text-neutral-300 dark:text-neutral-700">.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.gallery_images.map((image, index) => (
                    <div key={`${image}-${index}`} className="aspect-[4/3] overflow-hidden border border-neutral-200 dark:border-neutral-800">
                      <img src={image} alt={`${project.title} screenshot ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-5">
                Project Info
              </h3>
              <div className="space-y-4">
                {project.client && (
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1">Client</p>
                    <p className="text-sm text-black dark:text-white">{project.client}</p>
                  </div>
                )}
                {project.role && (
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1">Role</p>
                    <p className="text-sm text-black dark:text-white">{project.role}</p>
                  </div>
                )}
                {project.status && (
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1">Status</p>
                    <p className="text-sm text-black dark:text-white">{project.status}</p>
                  </div>
                )}
                {timeline && (
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1">Timeline</p>
                    <p className="text-sm text-black dark:text-white">{timeline}</p>
                  </div>
                )}
              </div>

              {project.technologies && project.technologies.length > 0 && (
                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-3">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((technology) => (
                      <span key={technology} className="text-[10px] font-mono uppercase tracking-widest border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-neutral-500 dark:text-neutral-400">
                        {technology}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {relatedProjects.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0d0d0d] transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
            <h2 className="font-display text-2xl font-medium tracking-tight text-black dark:text-white mb-12">
              Related Projects<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProjects.map((related) => (
                <Link key={related.id} to={`/projects/${related.id}`} className="group block">
                  {related.image_url && (
                    <div className="aspect-[16/10] overflow-hidden border border-neutral-200 dark:border-neutral-800 mb-4">
                      <img src={related.image_url} alt={related.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" loading="lazy" />
                    </div>
                  )}
                  {related.category && (
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-600">{related.category}</span>
                  )}
                  <h3 className="font-display text-lg font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-300 leading-snug mt-2">
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
