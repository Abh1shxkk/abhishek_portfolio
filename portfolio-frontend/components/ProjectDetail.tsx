import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProject, useProjects } from '../hooks/usePortfolio';
import { JOURNEY } from '../data/portfolio';
import { projectAccent } from './panels';
import { Icon, Reveal, SlipArrow, Spotlight, accentBg, accentChip, accentText } from './ui';

const formatDateRange = (startDate: string | null, endDate: string | null): string | null => {
  if (!startDate && !endDate) return null;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  if (startDate && endDate) return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  if (startDate) return `${formatDate(startDate)} – Present`;
  return `Until ${formatDate(endDate!)}`;
};

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id || '');
  const { data: allProjects } = useProjects();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const timeline = formatDateRange(project?.start_date ?? null, project?.end_date ?? null);
  const accent = project ? projectAccent(project.id) : 'saffron';
  const stop = project ? JOURNEY.find((m) => m.projectIds.includes(project.id)) : null;

  const nextProject = useMemo(() => {
    if (!project || !allProjects?.length) return null;
    const i = allProjects.findIndex((p) => p.id === project.id);
    return allProjects[(i + 1) % allProjects.length];
  }, [project, allProjects]);

  useEffect(() => {
    if (!project) return;
    document.title = `${project.title} | Projects | Abhishek Chauhan`;
    return () => {
      document.title = 'Abhishek Chauhan | Portfolio';
    };
  }, [project]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-5 md:px-8 pt-40 pb-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">This project doesn't exist</h1>
        <p className="mt-3 text-muted">It may have been renamed or removed.</p>
        <Link to="/projects" className="press mt-8 inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper">
          <Icon.ArrowLeft size={15} /> All projects
        </Link>
      </div>
    );
  }

  const links = [
    { label: 'Live website', href: project.website_url, primary: true },
    { label: 'Android app', href: project.app_url, primary: false },
    { label: 'Demo', href: project.demo_url, primary: false },
    { label: 'Source code', href: project.github_url, primary: false },
  ].filter((l) => l.href);

  const facts = [
    { label: 'Client', value: project.client },
    { label: 'Role', value: project.role },
    { label: 'Status', value: project.status },
    { label: 'Timeline', value: timeline },
  ].filter((f) => f.value);

  const gallery = [project.image_url, ...(project.gallery_images ?? [])].filter(Boolean) as string[];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[520px] dot-grid pointer-events-none" />
      <div className={`aurora w-[480px] h-[380px] -top-40 -right-24 ${accentBg[accent]}/30`} />

      <article className="relative mx-auto max-w-5xl px-5 md:px-8 pt-32 md:pt-40 pb-20">
        <Reveal>
          <Link to="/projects" className="group inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <Icon.ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
            All projects
          </Link>

          <div className="mt-10 flex flex-wrap items-center gap-2.5">
            <span className={`rounded-md px-3 py-1 text-xs font-medium ring-1 ring-inset ${accentChip[accent]}`}>{project.category}</span>
            {stop && (
              <Link to="/#journey" className="group text-xs text-muted hover:text-ink transition-colors">
                {stop.when} · <span className="link-draw">{stop.place}</span>
              </Link>
            )}
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl md:text-6xl leading-[1.04] font-semibold tracking-[-0.035em] text-ink">
            {project.title}
          </h1>
          {project.description && (
            <p className="mt-5 max-w-3xl text-lg md:text-xl leading-relaxed text-muted">{project.description}</p>
          )}

          {links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2.5">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group press inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors
                    ${l.primary ? 'shine bg-ink text-paper shadow-lift' : 'border border-line bg-surface/60 text-ink hover:border-ink/30'}`}
                >
                  {l.label}
                  <SlipArrow size={14} />
                </a>
              ))}
            </div>
          )}
        </Reveal>

        {project.image_url && (
          <Reveal delay={120}>
            <Spotlight accent={accent} tilt className="mt-14 rounded-lg border border-line bg-surface p-2 shadow-lift">
              <button
                onClick={() => setLightbox(project.image_url)}
                className="relative z-[3] block w-full overflow-hidden rounded-md border border-line cursor-zoom-in"
                aria-label="View screenshot full size"
              >
                <img src={project.image_url} alt={project.title} className="w-full h-auto" />
              </button>
            </Spotlight>
          </Reveal>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">About the project</h2>
              <div className="mt-4 space-y-4 text-[16.5px] leading-[1.75] text-ink/85">
                {(project.long_description || project.description || '')
                  .split('\n')
                  .filter(Boolean)
                  .map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
              </div>
            </Reveal>

            {project.features && project.features.length > 0 && (
              <Reveal>
                <h2 className="mt-14 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">What it does</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {project.features.map((feature, i) => (
                    <li
                      key={feature}
                      className="group flex gap-3 rounded-lg border border-line bg-surface/60 p-4 text-[14.5px] leading-relaxed text-ink/85 transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface hover:shadow-soft"
                    >
                      <span className={`font-mono text-xs mt-0.5 ${accentText[accent]}`}>{String(i + 1).padStart(2, '0')}</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>

          <aside className="lg:col-span-4">
            <Reveal delay={100} className="lg:sticky lg:top-28">
              <div className="rounded-lg border border-line bg-surface p-6 shadow-soft">
                {facts.length > 0 && (
                  <dl className="space-y-4">
                    {facts.map((f) => (
                      <div key={f.label}>
                        <dt className="text-xs text-muted">{f.label}</dt>
                        <dd className="mt-0.5 text-sm font-medium capitalize text-ink">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <div className={facts.length > 0 ? 'mt-6 border-t border-line pt-6' : ''}>
                    <p className="text-xs text-muted">Built with</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.map((t) => (
                        <li key={t} className="rounded-md border border-line px-2.5 py-1 text-[12px] text-ink/85">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          </aside>
        </div>

        {gallery.length > 1 && (
          <Reveal>
            <h2 className="mt-20 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Screens</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {gallery.slice(1).map((image, i) => (
                <button
                  key={image}
                  onClick={() => setLightbox(image)}
                  className="group overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-soft cursor-zoom-in"
                  aria-label={`View screenshot ${i + 2} full size`}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-xl">
                    <img src={image} alt={`${project.title} screenshot ${i + 2}`} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                  </div>
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {nextProject && nextProject.id !== project.id && (
          <Reveal>
            <Link
              to={`/projects/${nextProject.id}`}
              className="group mt-24 flex items-center gap-5 rounded-lg border border-line bg-surface p-3 pr-6 shadow-soft transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5"
            >
              <span className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
                {nextProject.image_url && (
                  <img src={nextProject.image_url} alt="" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">Next project</span>
                <span className="mt-1 block truncate text-lg md:text-xl font-semibold tracking-tight text-ink">{nextProject.title}</span>
              </span>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-ink text-paper transition-transform duration-300 group-hover:translate-x-1">
                <Icon.ArrowRight size={17} />
              </span>
            </Link>
          </Reveal>
        )}
      </article>

      {/* Full-size screenshot viewer */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/80 backdrop-blur-sm p-4 md:p-10 cursor-zoom-out"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Screenshot"
        >
          <img src={lightbox} alt="" className="pop-in max-h-full max-w-full rounded-xl shadow-2xl" />
          <button className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <Icon.Close size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
