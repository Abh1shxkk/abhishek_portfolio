import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/usePortfolio';
import { Project } from '../types';
import { Icon, Reveal, SlipArrow } from './ui';

/** Sign colour for a project category, so the chips match the yards and billboards on the road. */
export const categoryColour = (category: string | null): 'green' | 'blue' | 'brown' | 'red' | 'yellow' => {
  const c = (category ?? '').toLowerCase();
  if (c.includes('ai') || c.includes('health')) return 'red';
  if (c.includes('legal') || c.includes('edtech') || c.includes('analytics')) return 'blue';
  if (c.includes('erp') || c.includes('commerce') || c.includes('web3')) return 'brown';
  if (c.includes('tool') || c.includes('automation')) return 'yellow';
  return 'green';
};

export const projectYear = (p: Project) => (p.start_date ? new Date(p.start_date).getFullYear() : null);

/** A project as a paper card with a taped polaroid of the screenshot. */
export const ProjectCard: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const year = projectYear(project);
  const initials = project.title.split(':')[0].split(' ').map((w) => w[0]).join('').slice(0, 3);
  return (
    <Link to={`/projects/${project.id}`} className="group block h-full">
      <article className="card-paper flex h-full flex-col p-3 transition-transform duration-500 ease-out group-hover:-translate-y-1">
        <span className="tape" style={{ left: '50%', marginLeft: -46, transform: `rotate(${index % 2 ? 3 : -4}deg)` }} />
        <div className="polaroid" style={{ '--tilt': index % 2 ? '0.8deg' : '-0.8deg' } as React.CSSProperties}>
          <div className="aspect-[16/10] overflow-hidden rounded-[2px] bg-[#e9e3d6]">
            {project.image_url ? (
              <img src={project.image_url} alt={project.title} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]" />
            ) : (
              <div className="grid h-full place-items-center bg-[rgb(var(--sign-green))]">
                <span className="type-3d green text-[44px]">{initials}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col px-1.5 pb-1 pt-4">
          <div className="flex items-center gap-2">
            <span className={`chip-sign ${categoryColour(project.category)}`}>{project.category}</span>
            {project.status && <span className="text-[11.5px] capitalize text-ink/60">{project.status}</span>}
            {year && <span className="ml-auto font-mono text-[10.5px] text-ink/55">{year}</span>}
          </div>
          <h2 className="mt-2.5 font-display text-[16px] leading-tight text-ink">{project.title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/75 line-clamp-3">{project.description}</p>
          {project.technologies && project.technologies.length > 0 && (
            <p className="mt-3 truncate font-mono text-[11px] text-ink/55">{project.technologies.slice(0, 4).join(' · ')}</p>
          )}
          <div className="mt-auto flex items-center justify-between border-t border-dashed border-ink/20 pt-3">
            <span className="font-display text-[10.5px] uppercase tracking-wide text-[rgb(var(--sign-green))]">Case study</span>
            <span className="btn-sign grid h-8 w-8 place-items-center rounded-md"><SlipArrow size={14} /></span>
          </div>
        </div>
        <span className="fold" />
      </article>
    </Link>
  );
};

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
  const live = (projects ?? []).filter((p) => p.website_url).length;

  return (
    <div className="relative">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <Reveal>
          <Link to="/" className="chip-sign paper press">
            <Icon.ArrowLeft size={12} /> Back to the road
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.22em] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">Points of interest</p>
              <h1 className="type-3d brown big mt-2 text-[40px] leading-[1] md:text-[64px]">All projects</h1>
            </div>
            <div className="sign sign-green !m-0 drop-in">
              <h2 className="sign-title">{filteredProjects.length} {filteredProjects.length === 1 ? 'stop' : 'stops'}</h2>
              <span className="sign-meta">{live} live</span>
            </div>
          </div>
          <p className="card-paper mt-6 max-w-2xl px-5 py-4 text-[15.5px] leading-relaxed text-ink/85">
            Hospital tools, a legal platform, ERPs, client websites and the small utilities I built for myself. The featured ones have billboards on the home page road; everything else is here.
          </p>
        </Reveal>

        {categories.length > 0 && (
          <Reveal delay={100}>
            <div className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {filters.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category ?? 'all'}
                    onClick={() => setSelectedCategory(category)}
                    className={`chip-sign press shrink-0 !px-3 !py-2 !text-[10.5px] ${active ? 'green' : 'paper'}`}
                  >
                    {category ?? `All ${projects?.length ?? ''}`}
                  </button>
                );
              })}
            </div>
          </Reveal>
        )}

        {filteredProjects.length === 0 ? (
          <p className="card-paper mt-12 p-12 text-center text-ink/70">No projects in this category yet.</p>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <Reveal key={`${selectedCategory ?? 'all'}-${project.id}`} delay={(index % 3) * 90} className="h-full">
                <ProjectCard project={project} index={index} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
