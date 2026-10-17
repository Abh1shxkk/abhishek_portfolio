import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProject, useProjects } from '../hooks/usePortfolio';
import { JOURNEY } from '../data/portfolio';
import { categoryColour } from './ProjectsList';
import { Icon, Reveal, SlipArrow } from './ui';

const formatDateRange = (startDate: string | null, endDate: string | null): string | null => {
  if (!startDate && !endDate) return null;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  if (startDate && endDate) return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  if (startDate) return `${formatDate(startDate)} – Present`;
  return `Until ${formatDate(endDate!)}`;
};

/** A case study laid out as a trip journal entry: polaroids, a ticket of facts and a "next exit" sign. */
export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id || '');
  const { data: allProjects } = useProjects();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const timeline = formatDateRange(project?.start_date ?? null, project?.end_date ?? null);
  const stop = project ? JOURNEY.find((m) => m.projectIds.includes(project.id)) : null;

  const nextProject = useMemo(() => {
    if (!project || !allProjects?.length) return null;
    const i = allProjects.findIndex((p) => p.id === project.id);
    return allProjects[(i + 1) % allProjects.length];
  }, [project, allProjects]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 text-center md:px-8">
        <div className="card-paper p-10">
          <h1 className="type-3d red text-[28px]">Wrong turn</h1>
          <p className="mt-3 text-ink/70">This project doesn't exist. It may have been renamed or removed.</p>
          <Link to="/projects" className="btn-sign press mt-8 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-display text-[12px] uppercase tracking-wide">
            <Icon.ArrowLeft size={15} /> All projects
          </Link>
        </div>
      </div>
    );
  }

  const [mainTitle, ...rest] = project.title.split(':');
  const subtitle = rest.join(':').trim();
  const colour = categoryColour(project.category);

  const links = [
    { label: 'Live website', href: project.website_url, primary: true, icon: <SlipArrow size={14} /> },
    { label: 'Android app', href: project.app_url, primary: false, icon: <Icon.Smartphone size={14} /> },
    { label: 'Demo', href: project.demo_url, primary: false, icon: <SlipArrow size={14} /> },
    { label: 'Source code', href: project.github_url, primary: false, icon: <Icon.Github size={14} /> },
  ].filter((l) => l.href);

  const facts = [
    { label: 'Client', value: project.client },
    { label: 'Role', value: project.role },
    { label: 'Status', value: project.status },
    { label: 'Timeline', value: timeline },
    { label: 'Journey stop', value: stop ? `${stop.when} · ${stop.title}` : null },
  ].filter((f) => f.value);

  const gallery = [project.image_url, ...(project.gallery_images ?? [])].filter(Boolean) as string[];
  const paragraphs = (project.long_description || project.description || '').split('\n').filter(Boolean);

  return (
    <div className="relative">
      <article className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <Reveal>
          <Link to="/projects" className="chip-sign paper press">
            <Icon.ArrowLeft size={12} /> All projects
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className={`chip-sign ${colour}`}>{project.category}</span>
            {project.status && <span className="chip-sign paper capitalize">{project.status}</span>}
            {stop && (
              <Link to="/#journey" className="ml-1 font-display text-[10.5px] uppercase tracking-wide text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)] hover:underline">
                Built at stop {JOURNEY.indexOf(stop) + 1} · {stop.place}
              </Link>
            )}
          </div>

          <h1 className="type-3d brown big mt-4 max-w-4xl text-[34px] leading-[1.02] md:text-[56px]">{mainTitle}</h1>
          {subtitle && <p className="mt-3 max-w-3xl font-display text-[15px] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] md:text-[19px]">{subtitle}</p>}
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal delay={80}>
              <div className="card-paper">
                <span className="tape right" />
                <header className={`sign sign-${colour === 'yellow' ? 'yellow' : colour}`}>
                  <h2 className="sign-title">Case file</h2>
                  <span className="sign-meta">{project.role ?? 'Full Stack Developer'}</span>
                </header>
                <div className="px-5 pb-6 pt-6 md:px-7">
                  {project.image_url && (
                    <button
                      onClick={() => setLightbox(project.image_url)}
                      className="polaroid block w-full cursor-zoom-in"
                      style={{ '--tilt': '-0.6deg' } as React.CSSProperties}
                      aria-label="View screenshot full size"
                    >
                      <img src={project.image_url} alt={project.title} className="shot" />
                    </button>
                  )}
                  {project.description && (
                    <p className="mt-7 text-[17px] leading-relaxed text-ink md:text-[18px]">{project.description}</p>
                  )}
                  <div className="dash-line mt-6" />
                  <h3 className="mt-6 font-display text-[11px] uppercase tracking-[0.18em] text-ink/55">About the project</h3>
                  <div className="mt-3 space-y-4 text-[15.5px] leading-[1.75] text-ink/85">
                    {paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                  </div>

                  {project.features && project.features.length > 0 && (
                    <>
                      <h3 className="mt-10 font-display text-[11px] uppercase tracking-[0.18em] text-ink/55">What it does</h3>
                      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                        {project.features.map((feature, i) => (
                          <li key={feature} className="flex gap-3 rounded-md border border-ink/12 bg-white/55 p-3.5 text-[14px] leading-relaxed text-ink/85 dark:bg-white/5">
                            <span className={`chip-sign ${colour} mt-0.5 h-fit !px-1.5 !text-[9px]`}>{String(i + 1).padStart(2, '0')}</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <span className="fold" />
              </div>
            </Reveal>

            {gallery.length > 1 && (
              <Reveal>
                <h3 className="mt-10 font-display text-[11px] uppercase tracking-[0.22em] text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">More photos from the trip</h3>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {gallery.slice(1).map((image, i) => (
                    <button
                      key={image}
                      onClick={() => setLightbox(image)}
                      className="polaroid group cursor-zoom-in"
                      style={{ '--tilt': i % 2 ? '1deg' : '-1.2deg' } as React.CSSProperties}
                      aria-label={`View screenshot ${i + 2} full size`}
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-[2px]">
                        <img src={image} alt={`${project.title} screenshot ${i + 2}`} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    </button>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          <aside className="lg:col-span-4">
            <Reveal delay={140} className="lg:sticky lg:top-28">
              <div className="ticket p-5" style={{ '--notch': '58px' } as React.CSSProperties}>
                <p className="font-display text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--sign-blue))]">Trip ticket</p>
                <p className="mt-1 font-display text-[15px] leading-tight text-ink">{mainTitle}</p>
                <dl className="tear mt-4 space-y-3 pt-4">
                  {facts.map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-3">
                      <dt className="font-mono text-[10px] uppercase text-ink/55">{f.label}</dt>
                      <dd className="text-right text-[13px] font-medium capitalize text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="tear mt-4 pt-4">
                    <p className="font-mono text-[10px] uppercase text-ink/55">Built with</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {project.technologies.map((t) => (
                        <li key={t} className="sticker px-2 py-1 text-[11.5px] font-medium text-ink">{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {links.length > 0 && (
                  <div className="tear mt-4 flex flex-col gap-2 pt-4">
                    {links.map((l) => (
                      <a
                        key={l.label}
                        href={l.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group press inline-flex items-center justify-between gap-2 rounded-md px-4 py-2.5 text-sm font-medium ${l.primary ? 'btn-sign font-display text-[11.5px] uppercase tracking-wide' : 'btn-paper'}`}
                      >
                        {l.label}
                        {l.icon}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </aside>
        </div>

        {nextProject && nextProject.id !== project.id && (
          <Reveal>
            <Link
              to={`/projects/${nextProject.id}`}
              className="sign sign-green group !m-0 mt-16 flex !items-center gap-5 !px-4 !py-4 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <span className="polaroid hidden h-[72px] w-28 shrink-0 !p-1.5 sm:block" style={{ '--tilt': '-2deg' } as React.CSSProperties}>
                <span className="block h-full w-full overflow-hidden rounded-[2px] bg-[#e9e3d6]">
                  {nextProject.image_url && <img src={nextProject.image_url} alt="" className="h-full w-full object-cover object-top" />}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/80">Next exit</span>
                <span className="mt-1 block truncate font-display text-[17px] leading-tight md:text-[22px]">{nextProject.title.split(':')[0]}</span>
                <span className="mt-1 block truncate text-sm text-white/80">{nextProject.category}{nextProject.status ? ` · ${nextProject.status}` : ''}</span>
              </span>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white text-[rgb(var(--sign-green))] transition-transform duration-300 group-hover:translate-x-1">
                <Icon.ArrowRight size={18} />
              </span>
            </Link>
          </Reveal>
        )}
      </article>

      {/* Full-size screenshot viewer */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] grid cursor-zoom-out place-items-center bg-black/80 p-4 md:p-10"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Screenshot"
        >
          <img src={lightbox} alt="" className="pop-in max-h-full max-w-full rounded-md shadow-2xl" />
          <button className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <Icon.Close size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
