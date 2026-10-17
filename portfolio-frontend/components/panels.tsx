import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionId, Skill } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { resumeService } from '../services/portfolioService';
import { EXPERIENCE_DATA, JOURNEY, PROJECTS_DATA, SKILLS_DATA, SKILL_GROUP_NOTES } from '../data/portfolio';
import { DistrictKey, FEATURED, SKILL_GROUPS, useWorld } from './World';
import { CountUp, Icon, Magnetic, SlipArrow, Spotlight, useCopy, useDarkMode, useLocalTime } from './ui';

const projectById = new Map(PROJECTS_DATA.map((p) => [p.id, p]));

export type SignColour = 'green' | 'blue' | 'brown' | 'red' | 'yellow';
export const SKILL_SIGN: SignColour[] = ['blue', 'green', 'brown', 'red', 'yellow'];

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

/** Paper journal card with tape, a highway-sign header, the route line and a folded corner. */
export const Card: React.FC<{
  district: DistrictKey;
  sign: SignColour;
  title: React.ReactNode;
  meta?: React.ReactNode;
  tape?: 'left' | 'right';
  k?: string;
  className?: string;
  /** Let a tall body scroll inside the card (district cards are pinned, so they cannot grow) */
  scroll?: boolean;
  children: React.ReactNode;
}> = ({ district, sign, title, meta, tape = 'left', k, className = '', scroll = true, children }) => (
  <Spotlight accent="saffron" tilt className={`card-paper pointer-events-auto ${className}`}>
    <span className={`tape ${tape === 'right' ? 'right' : ''}`} />
    <header className={`sign sign-${sign}`}>
      <h2 className="sign-title">{title}</h2>
      {meta && <span className="sign-meta hidden sm:inline">{meta}</span>}
    </header>
    <div className="mt-3">
      <Route k={district} />
    </div>
    <div key={k} className={`stagger relative z-[3] px-5 pb-6 pt-3 md:px-6 ${scroll ? 'card-scroll max-h-[46vh] md:max-h-[66vh]' : ''}`}>{children}</div>
    <span className="fold" />
  </Spotlight>
);

/** Floating position for a district card: right side on desktop, bottom sheet on phones. */
const Float: React.FC<{ wide?: boolean; children: React.ReactNode }> = ({ wide, children }) => (
  <div
    className={`float-card absolute inset-x-3 bottom-4 md:inset-x-auto md:right-6 md:top-1/2 md:bottom-auto md:-translate-y-1/2 lg:right-[max(1.5rem,calc((100vw-76rem)/2))] ${wide ? 'md:w-[484px]' : 'md:w-[424px]'}`}
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
    <button onClick={onPrev} aria-label="Previous" className="btn-paper press grid h-7 w-7 place-items-center rounded-md"><Icon.ArrowLeft size={13} /></button>
    <button onClick={onNext} aria-label="Next" className="btn-paper press grid h-7 w-7 place-items-center rounded-md"><Icon.ArrowRight size={13} /></button>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="rounded-md border border-ink/15 bg-white/60 px-2 py-0.5 text-[11.5px] text-ink/80 dark:bg-white/5">{children}</li>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="mt-3 space-y-1.5 text-[13.5px] leading-snug text-ink/80">
    {items.map((b) => (
      <li key={b} className="flex gap-2">
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-sm bg-[rgb(var(--sign-green))]" />
        <span>{b}</span>
      </li>
    ))}
  </ul>
);

// ─── Home ───

export const HeroPanel: React.FC = () => {
  const { data: profile } = useProfile();
  const { register, scrollToLocal, subscribe } = useWorld();
  const { copied, copy } = useCopy();
  const time = useLocalTime(profile?.time_zone ?? 'Asia/Kolkata');
  const [mounted, setMounted] = useState(false);
  const [driven, setDriven] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  // The scroll hint goes away once the car has moved
  useEffect(() => subscribe((l) => { if (l.t > 0.012) setDriven(true); }), [subscribe]);
  const job = EXPERIENCE_DATA.find((e) => e.is_current) ?? EXPERIENCE_DATA[0];

  const socials = [
    { label: 'GitHub', href: profile?.github_url, icon: <Icon.Github size={16} /> },
    { label: 'LinkedIn', href: profile?.linkedin_url, icon: <Icon.LinkedIn size={15} /> },
    { label: 'X', href: profile?.twitter_url, icon: <Icon.X size={14} /> },
  ].filter((s) => s.href);

  const stats = [
    { value: `${PROJECTS_DATA.length}`, label: 'projects shipped' },
    { value: `${PROJECTS_DATA.filter((p) => p.website_url).length}`, label: 'live in production' },
    { value: '100+', label: 'colleges on the ERP' },
    { value: `${SKILLS_DATA.length}`, label: 'tools in the stack' },
  ];

  return (
    <section id={SectionId.Hero} ref={(el) => register('hero', el)} className="pointer-events-none relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl items-end px-3 pb-6 pt-24 md:items-center md:px-8 md:pb-0 md:pt-28">
        <div className={`reveal ${mounted ? 'is-in' : ''} w-full min-w-0 md:w-[640px]`} style={{ perspective: 1400 }}>
          {/* Big 3D name, then the card: nothing overlaps */}
          <div className="pointer-events-auto relative z-10 mb-5 ml-2 md:ml-5">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">Welcome to the road of</p>
            <h1 className="type-3d green big mt-1.5 text-[36px] leading-[1] sm:text-[46px] md:text-[58px]">{profile?.full_name}</h1>
          </div>

          <Card district="hero" sign="blue" tape="right" title={profile?.title} meta={`${profile?.location} · ${time}`} scroll={false}>
            <div className="flex items-start gap-4">
              <div className="group relative shrink-0">
                <div className="sticker h-[76px] w-[76px] overflow-hidden rounded-md p-0 md:h-[88px] md:w-[88px]">
                  {profile?.avatar && <img src={profile.avatar} alt={profile.full_name} className="h-full w-full rounded-md object-cover" />}
                </div>
                <span className="absolute -bottom-2 -right-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[rgb(var(--sign-green))] text-white shadow">
                  <Icon.Check size={12} />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[15px] leading-snug text-ink">
                  {job?.position} at <span className="font-semibold">{job?.company}</span>. {profile?.tagline}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/70">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[rgb(var(--sign-green))]" />
                    {profile?.availability_status === 'available' ? 'Taking freelance projects' : 'Busy right now'}
                  </span>
                  {profile?.languages && <span className="inline-flex items-center gap-1"><Icon.Globe size={12} /> {profile.languages.join(' · ')}</span>}
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
                <button onClick={() => resumeService.download()} className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium">
                  <Icon.Download size={14} /> Resume
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

            <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-md border border-ink/15 sm:grid-cols-4 sm:divide-x sm:divide-ink/15">
              {stats.map((s) => (
                <div key={s.label} className="border-ink/15 bg-white/50 px-3 py-2.5 odd:border-r max-sm:[&:nth-child(-n+2)]:border-b sm:odd:border-r-0 dark:bg-white/5">
                  <dd className="font-display text-xl text-ink md:text-2xl"><CountUp value={s.value} /></dd>
                  <dt className="mt-0.5 text-[10.5px] leading-tight text-ink/65">{s.label}</dt>
                </div>
              ))}
            </dl>
          </Card>

          <div className={`hint-sign pointer-events-auto mt-5 ml-2 hidden md:inline-flex ${driven ? 'is-gone' : ''}`}>
            <span className="wheel" />
            Scroll to drive · click the road to jump · hover a tree
          </div>
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
      <Float wide>
        <Card district="journey" sign="green" title="The road so far" meta={`Stop ${i + 1} of ${JOURNEY.length}`} k={m.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-ink/65">{m.place}</p>
              <h3 className="type-3d green mt-1 text-[22px] md:text-[26px]">{m.title}</h3>
              {m.role && (
                <p className="mt-2 text-[13px] font-semibold text-ink/85">
                  {m.role}
                  {m.period && <span className="font-normal text-ink/60"> · {m.period}</span>}
                </p>
              )}
            </div>
            <span className="postmark shrink-0">
              {m.when}
              <small>STAMPED</small>
            </span>
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink/85">{m.detail}</p>
          {m.bullets && <Bullets items={m.bullets} />}
          {m.tags && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {m.tags.map((t) => <Chip key={t}>{t}</Chip>)}
            </ul>
          )}
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
  PHP: 'php', Laravel: 'laravel', 'Node.js': 'nodedotjs', Express: 'express', NestJS: 'nestjs', Python: 'python', FastAPI: 'fastapi',
  MySQL: 'mysql', PostgreSQL: 'postgresql', MariaDB: 'mariadb', MongoDB: 'mongodb', Redis: 'redis',
  JavaScript: 'javascript', TypeScript: 'typescript', HTML: 'html5', CSS: 'css', React: 'react', 'Next.js': 'nextdotjs', 'Vue.js': 'vuedotjs',
  Angular: 'angular', 'Alpine.js': 'alpinedotjs', jQuery: 'jquery', 'Tailwind CSS': 'tailwindcss', Bootstrap: 'bootstrap', 'shadcn/ui': 'shadcnui',
  'Three.js': 'threedotjs', 'Framer Motion': 'framer', Vite: 'vite',
  Claude: 'claude', Gemini: 'googlegemini', OpenCV: 'opencv', ElevenLabs: 'elevenlabs', Celery: 'celery', n8n: 'n8n',
  Flutter: 'flutter', Dart: 'dart', Expo: 'expo', Supabase: 'supabase', 'Telegram Bots': 'telegram', WordPress: 'wordpress', WooCommerce: 'woocommerce',
  Moodle: 'moodle', Joomla: 'joomla', Solidity: 'solidity',
  Docker: 'docker', 'Google Cloud': 'googlecloud', Nginx: 'nginx', Caddy: 'caddy', Linux: 'linux', Git: 'git', 'GitHub Actions': 'githubactions',
  'GitLab CI/CD': 'gitlab', cPanel: 'cpanel', Hostinger: 'hostinger', Vercel: 'vercel', Render: 'render', Vitest: 'vitest',
};
const MONO = new Set(['express', 'nextdotjs', 'vercel', 'shadcnui', 'threedotjs', 'github', 'githubactions', 'expo', 'claude']);

const Logo: React.FC<{ skill: Skill; dark: boolean }> = ({ skill, dark }) => {
  const [failed, setFailed] = useState(false);
  const slug = SLUGS[skill.name];
  if (!slug || failed) {
    const initials = skill.name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
    return <span className="font-display text-[10px] text-ink/70">{initials}</span>;
  }
  const color = MONO.has(slug) ? (dark ? 'f6efe6' : '1c1612') : undefined;
  return <img src={`https://cdn.simpleicons.org/${slug}${color ? `/${color}` : ''}`} alt="" width={22} height={22} loading="lazy" onError={() => setFailed(true)} className="h-[22px] w-[22px]" />;
};

export const SkillsPanel: React.FC = () => {
  const { skill, hovered, scrollToLocal } = useWorld();
  const dark = useDarkMode();
  const i = hovered?.kind === 'skill' ? hovered.index : skill;
  const [name, skills] = SKILL_GROUPS[i];
  const [focus, setFocus] = useState<Skill | null>(null);
  const sign = SKILL_SIGN[i % SKILL_SIGN.length];

  return (
    <District id="skills" sectionId={SectionId.Skills} height={`${SKILL_GROUPS.length * 55}vh`}>
      <Float wide>
        <Card district="skills" sign={sign} tape="right" title="Toolbox" meta={`${SKILLS_DATA.length} tools`} k={name}>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_GROUPS.map(([n, list], gi) => (
              <button
                key={n}
                onClick={() => scrollToLocal('skills', (gi + 0.5) / SKILL_GROUPS.length)}
                className={`chip-sign press !px-2.5 !py-1.5 ${gi === i ? SKILL_SIGN[gi % SKILL_SIGN.length] : 'paper'}`}
              >
                {n} <span className="opacity-70">{list.length}</span>
              </button>
            ))}
          </div>
          <h3 className={`type-3d ${sign} mt-4 text-[22px] md:text-[26px]`}>{name}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/80">{SKILL_GROUP_NOTES[name]}</p>
          <ul className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-6" onMouseLeave={() => setFocus(null)}>
            {skills.map((s, si) => (
              <li key={s.id} className="group relative" style={{ animation: `pop-in 0.4s var(--ease-out) ${si * 25}ms both` }}>
                <button
                  onMouseEnter={() => setFocus(s)}
                  onFocus={() => setFocus(s)}
                  onClick={() => setFocus(s)}
                  aria-label={s.name}
                  className={`sticker grid aspect-square w-full place-items-center ${focus?.id === s.id ? 'ring-2 ring-[rgb(var(--sign-yellow))]' : ''}`}
                >
                  <Logo skill={s} dark={dark} />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 min-h-[2.5rem] rounded-md border border-dashed border-ink/20 px-3 py-2 text-[12.5px] leading-snug text-ink/75">
            {focus ? (
              <>
                <span className="font-semibold text-ink">{focus.name}</span>
                {focus.description ? ` — ${focus.description}` : ''}
              </>
            ) : (
              'Hover a sticker to see where it was used. The container yards beside the road are these five groups.'
            )}
          </p>
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink/65">
            <span className="chip-sign yellow">{pr.category}</span>
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
              <a href={pr.website_url} target="_blank" rel="noopener noreferrer" className="group btn-paper press inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium">
                Live <SlipArrow size={13} />
              </a>
            )}
            {pr.app_url && (
              <a href={pr.app_url} target="_blank" rel="noopener noreferrer" className="group btn-paper press inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium" aria-label="Android app">
                <Icon.Smartphone size={14} /> App
              </a>
            )}
            {pr.github_url && (
              <a href={pr.github_url} target="_blank" rel="noopener noreferrer" aria-label="Source on GitHub" className="btn-paper press grid h-9 w-9 place-items-center rounded-md">
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
  const time = useLocalTime(profile?.time_zone ?? 'Asia/Kolkata');

  const rows = [
    { label: 'Email', value: profile?.email, href: profile?.email ? `mailto:${profile.email}` : null },
    { label: 'Phone', value: profile?.phone, href: profile?.phone ? `tel:${profile.phone.replace(/\s+/g, '')}` : null },
    { label: 'GitHub', value: profile?.github_url?.replace(/^https?:\/\//, ''), href: profile?.github_url },
    { label: 'LinkedIn', value: 'abhishek-chauhan', href: profile?.linkedin_url },
    { label: 'X', value: profile?.twitter_url?.replace(/^https?:\/\/(x|twitter)\.com\//, '@'), href: profile?.twitter_url },
  ].filter((r) => r.value && r.href);

  const licence = [
    { label: 'Based in', value: profile?.location },
    { label: 'Local time', value: `${time} IST` },
    { label: 'Languages', value: profile?.languages?.join(', ') },
    { label: 'Open to', value: profile?.open_to?.join(' · ') },
  ].filter((r) => r.value);

  return (
    <section id={SectionId.Contact} ref={(el) => register('contact', el)} className="pointer-events-none relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl items-end justify-end px-3 pb-6 md:items-center md:px-8">
        <div className="float-card w-full md:w-[560px]" style={{ perspective: 1400 }}>
          <Card district="contact" sign="red" title="End of the road" meta={`${time} IST`}>
            <h3 className="type-3d red text-[24px] md:text-[30px]">Let's build the next stop</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink/85">
              Open to full-time roles, contracts and freelance work on web platforms, ERPs and AI-assisted tools. Email is the fastest way to reach me; I usually reply the same day.
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
                <button onClick={() => copy(profile.email)} className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium">
                  <span key={String(copied)} className="pop-in inline-flex">{copied ? <Icon.Check size={15} className="text-[rgb(var(--sign-green))]" /> : <Icon.Copy size={15} />}</span>
                  {copied ? 'Copied' : 'Copy address'}
                </button>
              )}
              {profile?.resume_url && (
                <button onClick={() => resumeService.download()} className="press inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-ink/70 hover:text-ink">
                  <Icon.Download size={15} /> Resume
                </button>
              )}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <dl className="divide-y divide-ink/10 border-t border-ink/15">
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
              <div className="ticket self-start p-4" style={{ '--notch': '18px' } as React.CSSProperties}>
                <p className="font-display text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--sign-blue))]">Driver's licence</p>
                <dl className="tear mt-2 pt-2">
                  {licence.map((r) => (
                    <div key={r.label} className="flex items-baseline justify-between gap-3 py-1">
                      <dt className="font-mono text-[10px] uppercase text-ink/55">{r.label}</dt>
                      <dd className="text-right text-[12.5px] font-medium text-ink">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
