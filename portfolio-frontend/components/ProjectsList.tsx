import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/usePortfolio';
import { Project } from '../types';
import { Icon, Reveal } from './ui';

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

// ─── The wall ───
// Every card is a different thing stuck to a graffiti wall: a wheat-paste poster, a die-cut
// sticker, a spray stencil or a polaroid. Placement, tilt and decorations come from a seeded
// random so the wall looks hand-arranged but never moves between visits.

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Kind = 'poster' | 'sticker' | 'stencil' | 'polaroid';
const KINDS: Kind[] = ['poster', 'sticker', 'stencil', 'polaroid'];
const FILLS = ['#ff3d8b', '#ff8c42', '#3c6fb0', '#2a9d8f', '#8b5cf6'];
const NEONS = ['#39ff88', '#ff3d8b', '#fff35c', '#5ce0ff'];
const DOODLES = ['★ new', 'wow', 'try me →', 'click!', '👀', 'ship it', 'fav ♥', 'yesss'];

const Crown: React.FC = () => (
  <svg className="g-crown" viewBox="0 0 64 44" aria-hidden="true">
    <path d="M4 36 L4 14 L18 24 L32 4 L46 24 L60 14 L60 36 Z" fill="#ffd600" stroke="#1c1612" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="4" cy="13" r="4" fill="#ff3d8b" stroke="#1c1612" strokeWidth="2.5" />
    <circle cx="32" cy="4" r="4" fill="#5ce0ff" stroke="#1c1612" strokeWidth="2.5" />
    <circle cx="60" cy="13" r="4" fill="#39ff88" stroke="#1c1612" strokeWidth="2.5" />
    <rect x="4" y="36" width="56" height="5" fill="#1c1612" />
  </svg>
);

/** One thing stuck on the wall. */
const WallCard: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const i = index;
  const kind = KINDS[Math.floor(rnd(i, 1) * KINDS.length)];
  const fill = FILLS[Math.floor(rnd(i, 5) * FILLS.length)];
  const neon = NEONS[Math.floor(rnd(i, 6) * NEONS.length)];
  const tilt = ((rnd(i, 3) - 0.5) * 7).toFixed(2);
  const dy = Math.round(rnd(i, 4) * 32);
  const doodle = rnd(i, 7) < 0.4 ? DOODLES[Math.floor(rnd(i, 8) * DOODLES.length)] : null;
  const doodleRight = rnd(i, 9) < 0.5;
  const year = projectYear(project);
  const initials = project.title.split(':')[0].split(' ').map((w) => w[0]).join('').slice(0, 3);
  const short = project.title.split(':')[0];

  const titleClass =
    kind === 'stencil' ? 'text-[22px] leading-none'
    : kind === 'polaroid' ? 'text-[22px] leading-tight'
    : 'font-display text-[16px] leading-tight';

  const bodyText = kind === 'sticker' ? 'text-white/85' : kind === 'stencil' ? 'text-white/70' : 'text-[#1c1612]/75';

  return (
    <Link
      to={`/projects/${project.id}`}
      className="g-card"
      style={{ '--tilt': `${tilt}deg`, '--dy': `${dy}px` } as React.CSSProperties}
    >
      {/* Stuck-on bits */}
      {kind === 'poster' && <span className="g-tape" style={{ left: `${18 + rnd(i, 10) * 50}%`, transform: `rotate(${(rnd(i, 11) - 0.5) * 14}deg)` }} />}
      {kind === 'polaroid' && <span className="g-pin" />}
      {project.is_featured && rnd(i, 12) < 0.6 && <Crown />}
      {project.website_url && rnd(i, 13) < 0.45 && <span className="g-live">LIVE</span>}
      {doodle && (
        <span
          className="g-doodle text-[20px]"
          style={doodleRight ? { right: -6, bottom: 14, transform: `rotate(${6 + rnd(i, 14) * 10}deg)` } : { left: -8, top: '40%', transform: `rotate(${-14 + rnd(i, 14) * 8}deg)` }}
        >
          {doodle}
        </span>
      )}

      <article
        className={`g-${kind}`}
        style={{ '--fill': fill, '--neon': neon } as React.CSSProperties}
      >
        <div className={`g-shot ${kind === 'polaroid' ? 'aspect-square' : 'aspect-[16/10]'}`}>
          {project.image_url ? (
            <img src={project.image_url} alt={project.title} loading="lazy" />
          ) : (
            <div className="grid h-full place-items-center" style={{ background: fill }}>
              <span className="type-3d ink text-[44px]">{initials}</span>
            </div>
          )}
        </div>

        <div className={kind === 'polaroid' ? 'px-1 pt-3' : 'px-1 pt-3.5'}>
          <div className="flex items-center gap-2">
            <span className="g-chip">{project.category}</span>
            {year && <span className={`ml-auto font-mono text-[10.5px] ${bodyText}`}>{year}</span>}
          </div>
          <h2 className={`mt-2.5 ${titleClass}`}>{kind === 'polaroid' || kind === 'stencil' ? short : project.title}</h2>
          {kind !== 'polaroid' && (
            <p className={`mt-2 text-[13.5px] leading-relaxed line-clamp-2 ${bodyText}`}>{project.description}</p>
          )}
          <div className={`mt-3 flex items-center justify-between text-[11px] ${kind === 'polaroid' ? 'marker text-[14px]' : 'font-display uppercase tracking-wide'} ${bodyText}`}>
            <span>{kind === 'polaroid' ? 'open →' : 'Case study'}</span>
            {kind !== 'polaroid' && <Icon.ArrowRight size={14} />}
          </div>
        </div>
      </article>
    </Link>
  );
};

const WALL_TAGS = [
  { text: 'ABHI', style: { top: '2%', left: '-3%', fontSize: 'clamp(90px, 15vw, 200px)', transform: 'rotate(-7deg)' } },
  { text: 'SHIP IT', style: { top: '42%', right: '-4%', fontSize: 'clamp(70px, 11vw, 150px)', transform: 'rotate(5deg)' } },
  { text: '2026', style: { bottom: '3%', left: '22%', fontSize: 'clamp(80px, 13vw, 170px)', transform: 'rotate(-3deg)' } },
];

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
              <p className="marker text-[18px] text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.45)] -rotate-2 inline-block">points of interest ↓</p>
              <h1 className="spray-title mt-1 text-[48px] md:text-[84px]">
                <span className="drips">All projects</span>
              </h1>
            </div>
            <div className="flex gap-3 pb-2">
              <span className="slap on" style={{ '--r': '-5deg' } as React.CSSProperties}>{filteredProjects.length} {filteredProjects.length === 1 ? 'stop' : 'stops'}</span>
              <span className="slap" style={{ '--r': '4deg' } as React.CSSProperties}>{live} live</span>
            </div>
          </div>
          <p className="g-poster marker mt-8 inline-block max-w-xl -rotate-1 !px-5 !py-4 !pb-7 text-[17px] leading-snug">
            Hospital tools, a legal platform, ERPs, client websites and the small utilities I built for myself. The featured ones have billboards on the home page road; everything else is on this wall.
          </p>
        </Reveal>

        {categories.length > 0 && (
          <Reveal delay={100}>
            <div className="-mx-4 mt-8 flex gap-2.5 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
              {filters.map((category, ci) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category ?? 'all'}
                    onClick={() => setSelectedCategory(category)}
                    className={`slap press shrink-0 ${active ? 'on' : ''}`}
                    style={{ '--r': `${((rnd(ci, 20) - 0.5) * 8).toFixed(1)}deg` } as React.CSSProperties}
                  >
                    {category ?? `All ${projects?.length ?? ''}`}
                  </button>
                );
              })}
            </div>
          </Reveal>
        )}

        <div className="wall mt-6">
          {WALL_TAGS.map((t) => (
            <span key={t.text} className="wall-tag" style={t.style} aria-hidden="true">{t.text}</span>
          ))}

          {filteredProjects.length === 0 ? (
            <p className="g-poster marker relative mx-auto max-w-md p-10 text-center text-[20px]">Nothing on the wall for this one yet.</p>
          ) : (
            <div className="relative grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-6 lg:[grid-auto-flow:dense]">
              {filteredProjects.map((project, index) => (
                <Reveal
                  key={`${selectedCategory ?? 'all'}-${project.id}`}
                  delay={(index % 4) * 80}
                  className={rnd(index, 2) < 0.3 ? 'lg:col-span-3' : 'lg:col-span-2'}
                >
                  <WallCard project={project} index={index} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
