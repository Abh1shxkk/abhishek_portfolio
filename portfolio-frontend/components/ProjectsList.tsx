import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/usePortfolio';
import { projectAccent } from './panels';
import { Eyebrow, Icon, Reveal, SlipArrow, Spotlight, accentBg } from './ui';

export const ProjectsList: React.FC = () => {
  const { data: projects } = useProjects();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const categories = useMemo(
    () => Array.from(new Set((projects ?? []).map((p) => p.category).filter(Boolean) as string[])).sort(),
    [projects]
  );

  const filteredProjects = useMemo(
    () => (projects ?? []).filter((p) => !selectedCategory || p.category === selectedCategory),
    [projects, selectedCategory]
  );

  useEffect(() => {
    document.title = 'Projects | Abhishek Chauhan';
    return () => {
      document.title = 'Abhishek Chauhan | Portfolio';
    };
  }, []);

  const filters = [undefined, ...categories];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[480px] dot-grid pointer-events-none" />
      <div className="aurora w-[460px] h-[360px] -top-40 -right-24 bg-saffron/30" />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8 pt-32 md:pt-40 pb-24">
        <Reveal>
          <Link to="/" className="group inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <Icon.ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
            Home
          </Link>
          <div className="mt-10">
            <Eyebrow accent="saffron">{filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}</Eyebrow>
            <h1 className="mt-5 max-w-3xl text-4xl md:text-6xl leading-[1.04] font-semibold tracking-[-0.035em] text-ink">
              All projects
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
              Hospital tools, a legal platform, ERPs, client websites and the small utilities I built for myself.
            </p>
          </div>
        </Reveal>

        {categories.length > 0 && (
          <Reveal delay={100}>
            <div className="mt-10 -mx-5 px-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
              {filters.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category ?? 'all'}
                    onClick={() => setSelectedCategory(category)}
                    className={`press shrink-0 rounded-md border px-4 py-2 text-[13px] font-medium transition-all duration-300
                      ${active ? 'border-ink bg-ink text-paper shadow-soft' : 'border-line bg-surface/60 text-muted hover:text-ink hover:border-ink/25'}`}
                  >
                    {category ?? 'All'}
                  </button>
                );
              })}
            </div>
          </Reveal>
        )}

        {filteredProjects.length === 0 ? (
          <p className="mt-16 rounded-lg border border-line p-12 text-center text-muted">No projects in this category yet.</p>
        ) : (
          <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {filteredProjects.map((project, index) => {
              const accent = projectAccent(project.id);
              return (
                <Reveal key={`${selectedCategory ?? 'all'}-${project.id}`} delay={(index % 2) * 110}>
                  <Link to={`/projects/${project.id}`} className="group block">
                    <Spotlight accent={accent} tilt className="rounded-lg border border-line bg-surface p-1.5 shadow-soft transition-shadow duration-500 group-hover:shadow-lift">
                      <div className="relative z-[3] aspect-[16/10] overflow-hidden rounded-md border border-line bg-paper">
                        {project.image_url ? (
                          <img
                            src={project.image_url}
                            alt={project.title}
                            loading="lazy"
                            className="h-full w-full object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-sm text-muted">No preview</div>
                        )}
                      </div>
                    </Spotlight>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span className={`h-1.5 w-1.5 rounded-full ${accentBg[accent]}`} />
                          {project.category}
                          {project.status && <span className="capitalize">· {project.status}</span>}
                        </div>
                        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">{project.title}</h2>
                        <p className="mt-2 text-[15px] leading-relaxed text-muted line-clamp-2">{project.description}</p>
                        {project.technologies && project.technologies.length > 0 && (
                          <p className="mt-3 truncate font-mono text-[11.5px] text-muted/80">
                            {project.technologies.slice(0, 4).join(' · ')}
                          </p>
                        )}
                      </div>
                      <span className="mt-6 grid h-10 w-10 shrink-0 place-items-center rounded-md border border-line text-muted transition-all duration-300 group-hover:bg-ink group-hover:text-paper group-hover:border-ink">
                        <SlipArrow size={15} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
