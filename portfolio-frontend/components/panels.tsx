import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accent, SectionId, Skill } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { resumeService } from '../services/portfolioService';
import { EXPERIENCE_DATA, JOURNEY, PROJECTS_DATA, SKILLS_DATA } from '../data/portfolio';
import { DistrictKey, FEATURED, SKILL_GROUPS, useWorld } from './World';
import { CountUp, Icon, Magnetic, SlipArrow, Spotlight, useCopy, useDarkMode, useLocalTime } from './ui';

/** Each project takes the colour of the journey stop it was built at. */
export const projectAccent = (id: number): Accent =>
  JOURNEY.find((m) => m.projectIds.includes(id))?.accent ?? 'saffron';

const projectById = new Map(PROJECTS_DATA.map((p) => [p.id, p]));

type SignColour = 'green' | 'blue' | 'brown' | 'red' | 'yellow';

// ─── Shared pieces ───

/** A district section: registers itself with the world and pins its panel while it scrolls. */
const District: React.FC<{ id: DistrictKey; sectionId: SectionId; height: string; children: React.ReactNode }> = ({ id, sectionId, height, children }) => {
  const { register } = useWorld();
  return (
    <section id={sectionId} ref={(el) => register(id, el)} className="pointer-events-none relative" style={{ height }}>
      <div className="sticky top-0 h-screen">{children}</div>
    </section>
  );
};

/** Dashed route with a little car that moves as you drive through this district. */
const Route: React.FC<{ k: DistrictKey }> = ({ k }) => {
  const { subscribe } = useWorld();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () => subscribe((l) => { if (ref.current) ref.current.style.transform = `translateX(${(l[k] * 100).toFixed(2)}cqw)`; }),
    [subscribe, k]
  );
  return (
    <div className="route" style={{ containerType: 'inline-size' } as React.CSSProperties}>
      <div ref={ref} className="route-car" />
      <div className="route-flag" />
    </div>
  );
};

/** Paper journal card with tape, a highway-sign header and the route line. */
const Card: React.FC<{
  district: DistrictKey;
  sign: SignColour;
  title: React.ReactNode;
  meta?: React.ReactNode;
  tape?: 'left' | 'right';
  k?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ district, sign, title, meta, tape = 'left', k, className = '', children }) => (
  <Spotlight accent="saffron" tilt className={`card-paper pointer-events-auto ${className}`}>
    <span className={`tape ${tape === 'right' ? 'right' : ''}`} />
    <header className={`sign sign-${sign}`}>
      <h2 className="sign-title">{title}</h2>
      {meta && <span className="sign-meta">{meta}</span>}
    </header>
    <div className="mt-3">
      <Route k={district} />
    </div>
    <div key={k} className="stagger relative z-[3] max-h-[46vh] overflow-y-auto px-5 pb-5 pt-3 md:max-h-[68vh] md:px-6 md:pb-6">{children}</div>
  </Spotlight>
);

/** Floating position for a district card: right side on desktop, bottom sheet on phones. */
const Float: React.FC<{ wide?: boolean; children: React.ReactNode }> = ({ wide, children }) => (
  <div
    className={`absolute inset-x-3 bottom-4 md:inset-x-auto md:right-6 md:top-1/2 md:bottom-auto md:-translate-y-1/2 lg:right-[max(1.5rem,calc((100vw-76rem)/2))] ${wide ? 'md:w-[470px]' : 'md:w-[410px]'}`}
    style={{ perspective: 1400 }}
  >
    {children}
  </div>
);

const Dots: React.FC<{ count: number; active: number; onPick: (i: number) => void; label: (i: number) => string }> = ({ count, active, onPick, label }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: count }, (_, i) => (
      <button
        key={i}
        onClick={() => onPick(i)}
        aria-label={label(i)}
        className={`h-2 rounded-sm transition-all duration-300 ${i === active ? 'w-6 bg-[rgb(var(--sign-green))]' : 'w-2.5 bg-ink/20 hover:bg-ink/40'}`}
      />
    ))}
  </div>
);

const PrevNext: React.FC<{ onPrev: () => void; onNext: () => void }> = ({ onPrev, onNext }) => (
  <div className="ml-auto flex gap-1.5">
    <button onClick={onPrev} aria-label="Previous" className="press grid h-7 w-7 place-items-center rounded-md border border-ink/20 bg-white/60 text-ink hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"><Icon.ArrowLeft size={13} /></button>
    <button onClick={onNext} aria-label="Next" className="press grid h-7 w-7 place-items-center rounded-md border border-ink/20 bg-white/60 text-ink hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"><Icon.ArrowRight size={13} /></button>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="rounded-md border border-ink/15 bg-white/60 px-2 py-0.5 text-[11.5px] text-ink/80 dark:bg-white/5">{children}</li>
);

// ─── Home ───

export const HeroPanel: React.FC = () => {
  const { data: profile } = useProfile();
  const { register, scrollToLocal } = useWorld();
  const { copied, copy } = useCopy();
  const time = useLocalTime('Asia/Kolkata');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const job = EXPERIENCE_DATA.find((e) => e.is_current) ?? EXPERIENCE_DATA[0];

  const socials = [
    { label: 'GitHub', href: profile?.github_url, icon: <Icon.Github size={16} /> },
    { label: 'LinkedIn', href: profile?.linkedin_url, icon: <Icon.LinkedIn size={15} /> },
    { label: 'X', href: profile?.twitter_url, icon: <Icon.X size={14} /> },
  ].filter((s) => s.href);

  const stats = [
    { value: `${profile?.years_of_experience ?? 1}`, label: 'yrs in production' },
    { value: `${PROJECTS_DATA.length}`, label: 'projects shipped' },
    { value: '100+', label: 'colleges on the ERP' },
    { value: `${SKILLS_DATA.length}`, label: 'tools in the stack' },
  ];

  return (
    <section id={SectionId.Hero} ref={(el) => register('hero', el)} className="pointer-events-none relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl items-end px-3 pb-6 pt-24 md:items-center md:px-8 md:pb-0">
        <div className={`reveal ${mounted ? 'is-in' : ''} w-full md:w-[600px]`} style={{ perspective: 1400 }}>
          {/* Big 3D name floating above the card */}
          <div className="pointer-events-auto relative z-10 mb-[-18px] ml-3 md:ml-6">
            <p className="font-display text-[11px] uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">Welcome to the road of</p>
            <h1 className="type-3d green mt-1 text-[34px] sm:text-[44px] md:text-[54px]">{profile?.full_name}</h1>
          </div>

          <Card district="hero" sign="blue" tape="right" title={profile?.title} meta={`${profile?.location} · ${time}`}>
            <div className="flex items-start gap-4">
              <div className="group relative shrink-0">
                <div className="sticker h-[72px] w-[72px] overflow-hidden rounded-md p-0 md:h-20 md:w-20">
                  {profile?.avatar && <img src={profile.avatar} alt={profile.full_name} className="h-full w-full rounded-md object-cover" />}
                </div>
                <span className="absolute -bottom-2 -right-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[rgb(var(--sign-green))] text-white shadow">
                  <Icon.Check size={12} />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[15px] leading-snug text-ink">
                  {job?.position} at <span className="font-semibold">{job?.company}</span>. I build ERPs, APIs and AI-assisted tools that a university, its hospital and 100+ colleges use every day.
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-ink/70">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[rgb(var(--sign-green))]" />
                  {profile?.availability_status === 'available' ? 'Open to work' : 'Busy right now'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Magnetic>
                <button onClick={() => scrollToLocal('journey', 0)} className="btn-sign press inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[12px] uppercase tracking-wide">
                  Start driving <Icon.ArrowDown size={14} />
                </button>
              </Magnetic>
              {profile?.resume_url && (
                <button onClick={() => resumeService.download()} className="press inline-flex items-center gap-2 rounded-md border border-ink/20 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink hover:bg-white dark:bg-white/5 dark:hover:bg-white/10">
                  <Icon.Download size={14} /> Résumé
                </button>
              )}
              {profile?.email && (
                <button onClick={() => copy(profile.email)} className="press inline-flex items-center gap-2 rounded-md px-2 py-2.5 text-sm text-ink/70 hover:text-ink" aria-label="Copy email">
                  <span key={String(copied)} className="pop-in inline-flex">{copied ? <Icon.Check size={14} className="text-[rgb(var(--sign-green))]" /> : <Icon.Copy size={14} />}</span>
                  <span className="hidden sm:inline">{copied ? 'Copied' : profile.email}</span>
                </button>
              )}
              <span className="ml-auto flex gap-1">
                {socials.map((s) => (
                  <a key={s.label} href={s.href!} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="group grid h-9 w-9 place-items-center">
                    <span className="sticker grid h-9 w-9 place-items-center text-ink">{s.icon}</span>
                  </a>
                ))}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-4 overflow-hidden rounded-md border border-ink/15 divide-x divide-ink/15">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/50 px-3 py-2.5 dark:bg-white/5">
                  <dd className="font-display text-xl text-ink md:text-2xl"><CountUp value={s.value} /></dd>
                  <dt className="mt-0.5 text-[10.5px] leading-tight text-ink/65">{s.label}</dt>
                </div>
              ))}
            </dl>
          </Card>
          <p className="mt-4 hidden text-xs text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)] md:block">
            Scroll to drive. Click the road to go somewhere. Hover a tree.
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── Journey ───

export const JourneyPanel: React.FC = () => {
  const { stop, hovered, scrollToLocal } = useWorld();
  const i = hovered?.kind === 'stop' ? hovered.index : stop;
  const m = JOURNEY[i];
  const projects = m.projectIds.map((id) => projectById.get(id)).filter(Boolean) as typeof PROJECTS_DATA;
  const go = (n: number) => scrollToLocal('journey', Math.min(JOURNEY.length - 1, Math.max(0, n)) / (JOURNEY.length - 1));

  return (
    <District id="journey" sectionId={SectionId.Journey} height={`${JOURNEY.length * 70}vh`}>
      <Float>
        <Card district="journey" sign="green" title="The road so far" meta={`Stop ${i + 1} of ${JOURNEY.length}`} k={m.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-ink/65">{m.place}</p>
              <h3 className="type-3d green mt-1 text-[22px] md:text-[26px]">{m.title}</h3>
            </div>
            <span className="postmark shrink-0">
              {m.when}
              <small>STAMPED</small>
            </span>
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink/85">{m.detail}</p>
          {projects.length > 0 && (
            <div className="mt-4">
              <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink/55">Built here</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {projects.map((pr) => (
                  <Link key={pr.id} to={`/projects/${pr.id}`} className="group inline-flex items-center gap-1 rounded-md border border-ink/15 bg-white/60 px-2 py-1 text-xs font-medium text-ink transition-colors hover:border-[rgb(var(--sign-green))] hover:bg-white dark:bg-white/5">
                    {pr.title.split(':')[0]}
                    <Icon.ArrowUpRight size={11} className="text-ink/50 transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {m.id === 'next' && (
            <button onClick={() => scrollToLocal('contact', 0.5)} className="btn-sign red press mt-4 inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-display text-[12px] uppercase tracking-wide">
              Get in touch <Icon.ArrowRight size={14} />
            </button>
          )}
          <div className="mt-5 flex items-center border-t border-ink/15 pt-4">
            <Dots count={JOURNEY.length} active={i} onPick={go} label={(n) => JOURNEY[n].title} />
            <PrevNext onPrev={() => go(stop - 1)} onNext={() => go(stop + 1)} />
          </div>
        </Card>
      </Float>
    </District>
  );
};

// ─── Skills ───

const SLUGS: Record<string, string> = {
  PHP: 'php', Laravel: 'laravel', MySQL: 'mysql', PostgreSQL: 'postgresql', 'Node.js': 'nodedotjs', Express: 'express',
  MongoDB: 'mongodb', Python: 'python', FastAPI: 'fastapi', Redis: 'redis', JavaScript: 'javascript', TypeScript: 'typescript',
  React: 'react', 'Next.js': 'nextdotjs', 'Vue.js': 'vuedotjs', Angular: 'angular', 'Tailwind CSS': 'tailwindcss',
  Bootstrap: 'bootstrap', 'Alpine.js': 'alpinedotjs', jQuery: 'jquery', Docker: 'docker', AWS: 'amazonwebservices',
  Nginx: 'nginx', Linux: 'linux', Git: 'git', GitLab: 'gitlab', cPanel: 'cpanel', WordPress: 'wordpress', n8n: 'n8n', Claude: 'claude',
};
const MONO = new Set(['express', 'nextdotjs']);

const Logo: React.FC<{ skill: Skill; dark: boolean }> = ({ skill, dark }) => {
  const [failed, setFailed] = useState(false);
  const slug = SLUGS[skill.name];
  if (!slug || failed) return <span className="text-[11px] font-semibold text-ink/60">{skill.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}</span>;
  const color = MONO.has(slug) ? (dark ? 'f6efe6' : '1c1612') : undefined;
  return <img src={`https://cdn.simpleicons.org/${slug}${color ? `/${color}` : ''}`} alt="" width={22} height={22} loading="lazy" onError={() => setFailed(true)} className="h-[22px] w-[22px]" />;
};

const SKILL_BLURB: Record<string, string> = {
  Backend: 'APIs, data models, background jobs. Laravel first, FastAPI for the AI services.',
  Frontend: 'Interfaces that stay quick and clear. React and Vue for apps, Alpine for Laravel pages.',
  'DevOps & Tools': 'Docker, CI/CD with GitHub Actions and GitLab, hosting on AWS and cPanel.',
};
const SKILL_SIGN: SignColour[] = ['blue', 'green', 'brown'];

export const SkillsPanel: React.FC = () => {
  const { skill, hovered, scrollToLocal } = useWorld();
  const dark = useDarkMode();
  const i = hovered?.kind === 'skill' ? hovered.index : skill;
  const [name, skills] = SKILL_GROUPS[i];

  return (
    <District id="skills" sectionId={SectionId.Skills} height="170vh">
      <Float wide>
        <Card district="skills" sign={SKILL_SIGN[i % SKILL_SIGN.length]} tape="right" title="Toolbox" meta={`${SKILLS_DATA.length} tools`} k={name}>
          <div className="flex gap-2">
            {SKILL_GROUPS.map(([n], gi) => (
              <button
                key={n}
                onClick={() => scrollToLocal('skills', (gi + 0.5) / SKILL_GROUPS.length)}
                className={`press rounded-md border px-3 py-1.5 font-display text-[10.5px] uppercase tracking-wide transition-colors
                  ${gi === i ? 'border-ink bg-ink text-paper' : 'border-ink/20 bg-white/60 text-ink/70 hover:text-ink dark:bg-white/5'}`}
              >
                {n}
              </button>
            ))}
          </div>
          <h3 className={`type-3d ${SKILL_SIGN[i % SKILL_SIGN.length]} mt-4 text-[22px] md:text-[26px]`}>{name}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/80">{SKILL_BLURB[name]}</p>
          <ul className="mt-4 grid grid-cols-5 gap-2">
            {skills.map((s, si) => (
              <li key={s.id} className="group relative" style={{ animation: `pop-in 0.4s var(--ease-out) ${si * 30}ms both` }}>
                <div className="sticker grid aspect-square place-items-center">
                  <Logo skill={s} dark={dark} />
                </div>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-paper opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {s.name}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink/60">The container yards beside the road are these three groups. Click one to switch.</p>
        </Card>
      </Float>
    </District>
  );
};

// ─── Projects ───

export const ProjectsPanel: React.FC = () => {
  const { project, hovered, scrollToLocal } = useWorld();
  const i = hovered?.kind === 'project' ? hovered.index : project;
  const pr = FEATURED[i];
  const go = (n: number) => scrollToLocal('projects', (Math.min(FEATURED.length - 1, Math.max(0, n)) + 0.5) / FEATURED.length);

  return (
    <District id="projects" sectionId={SectionId.Projects} height={`${FEATURED.length * 60}vh`}>
      <Float wide>
        <Card district="projects" sign="brown" title="Points of interest" meta={`${i + 1} of ${FEATURED.length}`} k={String(pr.id)}>
          <div className="flex items-center gap-2 text-xs text-ink/65">
            <span className="rounded-md bg-[rgb(var(--sign-yellow))] px-1.5 py-0.5 font-display text-[9.5px] uppercase tracking-wide text-[#1c1612]">{pr.category}</span>
            {pr.status && <span className="capitalize">{pr.status}</span>}
            {pr.client && <span className="truncate">· {pr.client}</span>}
          </div>
          <h3 className="type-3d brown mt-2 text-[20px] md:text-[24px]">{pr.title.split(':')[0]}</h3>
          {pr.title.includes(':') && <p className="mt-1 text-sm font-medium text-ink/80">{pr.title.split(':').slice(1).join(':').trim()}</p>}
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink/85">{pr.description}</p>
          {pr.technologies && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {pr.technologies.slice(0, 6).map((t) => <Chip key={t}>{t}</Chip>)}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/projects/${pr.id}`} className="btn-sign press inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-display text-[11.5px] uppercase tracking-wide">
              Case study <Icon.ArrowRight size={14} />
            </Link>
            {pr.website_url && (
              <a href={pr.website_url} target="_blank" rel="noopener noreferrer" className="group press inline-flex items-center gap-1.5 rounded-md border border-ink/20 bg-white/60 px-3.5 py-2 text-sm font-medium text-ink hover:bg-white dark:bg-white/5">
                Live <SlipArrow size={13} />
              </a>
            )}
            {pr.github_url && (
              <a href={pr.github_url} target="_blank" rel="noopener noreferrer" aria-label="Source on GitHub" className="press grid h-9 w-9 place-items-center rounded-md border border-ink/20 bg-white/60 text-ink hover:bg-white dark:bg-white/5">
                <Icon.Github size={15} />
              </a>
            )}
            <Link to="/projects" className="link-draw ml-auto self-center text-xs font-medium text-ink/70 hover:text-ink">All {PROJECTS_DATA.length}</Link>
          </div>
          <div className="mt-5 flex items-center border-t border-ink/15 pt-4">
            <Dots count={FEATURED.length} active={i} onPick={go} label={(n) => FEATURED[n].title} />
            <PrevNext onPrev={() => go(project - 1)} onNext={() => go(project + 1)} />
          </div>
        </Card>
      </Float>
    </District>
  );
};

// ─── Contact ───

export const ContactPanel: React.FC = () => {
  const { data: profile } = useProfile();
  const { register } = useWorld();
  const { copied, copy } = useCopy();
  const time = useLocalTime('Asia/Kolkata');

  const rows = [
    { label: 'Email', value: profile?.email, href: profile?.email ? `mailto:${profile.email}` : null },
    { label: 'Phone', value: profile?.phone, href: profile?.phone ? `tel:${profile.phone.replace(/\s+/g, '')}` : null },
    { label: 'GitHub', value: profile?.github_url?.replace(/^https?:\/\//, ''), href: profile?.github_url },
    { label: 'LinkedIn', value: 'abhishek-chauhan', href: profile?.linkedin_url },
    { label: 'X', value: profile?.twitter_url?.replace(/^https?:\/\/(x|twitter)\.com\//, '@'), href: profile?.twitter_url },
  ].filter((r) => r.value && r.href);

  return (
    <section id={SectionId.Contact} ref={(el) => register('contact', el)} className="pointer-events-none relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl items-end justify-end px-3 pb-6 md:items-center md:px-8">
        <div className="w-full md:w-[540px]" style={{ perspective: 1400 }}>
          <Card district="contact" sign="red" title="End of the road" meta={`${time} IST`}>
            <h3 className="type-3d red text-[24px] md:text-[30px]">Let's build the next stop</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink/85">
              Open to full-time roles and freelance work on web platforms, ERPs and AI-assisted tools. Email is the fastest way to reach me.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile?.email && (
                <Magnetic>
                  <a href={`mailto:${profile.email}`} className="btn-sign red press inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[12px] uppercase tracking-wide">
                    <Icon.Mail size={15} /> Email me
                  </a>
                </Magnetic>
              )}
              {profile?.email && (
                <button onClick={() => copy(profile.email)} className="press inline-flex items-center gap-2 rounded-md border border-ink/20 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink hover:bg-white dark:bg-white/5">
                  <span key={String(copied)} className="pop-in inline-flex">{copied ? <Icon.Check size={15} className="text-[rgb(var(--sign-green))]" /> : <Icon.Copy size={15} />}</span>
                  {copied ? 'Copied' : 'Copy address'}
                </button>
              )}
              {profile?.resume_url && (
                <button onClick={() => resumeService.download()} className="press inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-ink/70 hover:text-ink">
                  <Icon.Download size={15} /> Résumé
                </button>
              )}
            </div>
            <dl className="mt-4 divide-y divide-ink/10 border-t border-ink/15">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="font-display text-[10px] uppercase tracking-wide text-ink/55">{r.label}</dt>
                  <dd className="min-w-0">
                    <a href={r.href!} target={r.href!.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="link-draw block truncate text-sm font-medium text-ink">
                      {r.value}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </section>
  );
};
