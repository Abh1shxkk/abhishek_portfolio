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

// ─── The notice board ───
// Every project is something pinned to a roadside notice board: a postcard, a polaroid, a ticket
// stub or an index card. Placement, tilt and the bits holding it on come from a seeded random, so
// the board looks hand-arranged but never moves between visits.

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Kind = 'postcard' | 'polaroid' | 'ticket' | 'note';
const KINDS: Kind[] = ['postcard', 'polaroid', 'ticket', 'note', 'postcard', 'polaroid'];
const PINS = ['#e01e5a', '#1e5aa8', '#f4a300', '#1f7a3f', '#8b5cf6'];
const STAMPS = ['#1f7a3f', '#1e5aa8', '#c0392b', '#7a4a2a'];
const DOODLES = ['new!', 'fav ♥', 'try this', 'live now', 'look →', 'nice one'];

const signColourHex: Record<ReturnType<typeof categoryColour>, string> = {
  green: 'var(--sign-green)', blue: 'var(--sign-blue)', brown: 'var(--sign-brown)', red: 'var(--sign-red)', yellow: 'var(--sign-yellow)',
};

/** One thing pinned to the board. */
const BoardCard: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const i = index;
  const kind = KINDS[Math.floor(rnd(i, 1) * KINDS.length)];
  const pin = PINS[Math.floor(rnd(i, 5) * PINS.length)];
  const stamp = STAMPS[Math.floor(rnd(i, 6) * STAMPS.length)];
  const tilt = ((rnd(i, 3) - 0.5) * 5).toFixed(2);
  const dy = Math.round(rnd(i, 4) * 26);
  const doodle = rnd(i, 7) < 0.3 ? DOODLES[Math.floor(rnd(i, 8) * DOODLES.length)] : null;
  const taped = rnd(i, 9) < 0.45;
  const year = projectYear(project);
  const colour = categoryColour(project.category);
  const short = project.title.split(':')[0];
  const sub = project.title.includes(':') ? project.title.split(':').slice(1).join(':').trim() : null;
  const initials = short.split(' ').map((w) => w[0]).join('').slice(0, 3);

  const shot = (
    <div className={`b-shot ${kind === 'polaroid' ? 'aspect-square' : kind === 'note' ? 'aspect-[16/8]' : 'aspect-[16/10]'} ${kind === 'postcard' ? 'rounded-[2px]' : ''}`}>
      {project.image_url ? (
        <img src={project.image_url} alt={project.title} loading="lazy" />
      ) : (
        <div className="grid h-full place-items-center" style={{ background: `rgb(${signColourHex[colour]})` }}>
          <span className="type-3d ink text-[40px]">{initials}</span>
        </div>
      )}
    </div>
  );

  const meta = (
    <div className="flex items-center gap-2">
      <span className={`b-chip ${colour}`}>{project.category}</span>
      {project.status && <span className="text-[11px] capitalize text-[#1c1612]/60">{project.status}</span>}
      {year && <span className="ml-auto font-mono text-[10.5px] text-[#1c1612]/55">{year}</span>}
    </div>
  );

  return (
    <Link
      to={`/projects/${project.id}`}
      className="b-card"
      style={{ '--tilt': `${tilt}deg`, '--dy': `${dy}px` } as React.CSSProperties}
    >
      {taped
        ? <span className="b-tape" style={{ left: `${16 + rnd(i, 10) * 52}%`, transform: `rotate(${(rnd(i, 11) - 0.5) * 12}deg)` }} />
        : <span className="b-pin" style={{ '--pin': pin, left: `${30 + rnd(i, 10) * 40}%` } as React.CSSProperties} />}
      {project.is_featured && <span className="b-ribbon">Featured</span>}
      {project.website_url && rnd(i, 13) < 0.4 && <span className="b-live">LIVE</span>}
      {doodle && (
        <span className="b-doodle text-[15px]" style={{ right: -10, bottom: 18, transform: `rotate(${4 + rnd(i, 14) * 8}deg)` }}>
          {doodle}
        </span>
      )}

      {kind === 'postcard' && (
        <article className="b-postcard">
          <span className="b-stamp"><span style={{ '--stamp': stamp } as React.CSSProperties}>{year ?? 'POST'}</span></span>
          <span className="b-postmark">MEERUT</span>
          {shot}
          <div className="pt-3">
            {meta}
            <h2 className="mt-2 font-display text-[15px] leading-tight">{short}</h2>
            {sub && <p className="mt-0.5 text-[12.5px] text-[#1c1612]/70">{sub}</p>}
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#1c1612]/75 line-clamp-2">{project.description}</p>
            <p className="mt-3 flex items-center justify-between font-display text-[10.5px] uppercase tracking-wide text-[rgb(var(--sign-green))]">
              Case study <Icon.ArrowRight size={13} />
            </p>
          </div>
        </article>
      )}

      {kind === 'polaroid' && (
        <article className="b-polaroid">
          {shot}
          <div className="px-1 pt-3">
            {meta}
            <h2 className="marker mt-2 text-[21px] leading-tight">{short}</h2>
            <p className="marker mt-1 text-[13px] text-[#1c1612]/60">open →</p>
          </div>
        </article>
      )}

      {kind === 'ticket' && (
        <article className="b-ticket">
          <div className="flex items-center justify-between font-display text-[10px] uppercase tracking-wide text-[#1c1612]/60">
            <span>Admit one</span>
            <span>Nº {String(project.id).padStart(3, '0')}</span>
          </div>
          <div className="mt-2">{shot}</div>
          <div className="b-tear" />
          {meta}
          <h2 className="mt-2 font-display text-[15px] leading-tight">{short}</h2>
          {sub && <p className="mt-0.5 text-[12.5px] text-[#1c1612]/70">{sub}</p>}
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#1c1612]/75 line-clamp-2">{project.description}</p>
        </article>
      )}

      {kind === 'note' && (
        <article className="b-note">
          {meta}
          <h2 className="mt-2 font-display text-[15px] leading-tight">{short}</h2>
          {sub && <p className="mt-0.5 text-[12.5px] text-[#1c1612]/70">{sub}</p>}
          <p className="mt-2 text-[13.5px] leading-[26px] text-[#1c1612]/75 line-clamp-3">{project.description}</p>
          <div className="mt-3">{shot}</div>
          <p className="marker mt-3 text-[14px] text-[#1c1612]/60">see it →</p>
        </article>
      )}
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
    // overflow-x-clip: the full-bleed board uses 100vw, which includes the scrollbar on Windows
    <div className="relative overflow-x-clip">
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
            Everything I've shipped: web platforms, ERPs, APIs, mobile apps, AI tools and client sites. The featured ones have billboards on the home-page road; the whole lot is pinned up here.
          </p>
        </Reveal>

        {categories.length > 0 && (
          <Reveal delay={100}>
            <div className="mt-8 flex flex-wrap gap-2">
              {filters.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category ?? 'all'}
                    onClick={() => setSelectedCategory(category)}
                    className={`chip-sign press !px-3 !py-2 !text-[10.5px] ${active ? 'green' : 'paper'}`}
                  >
                    {category ?? `All ${projects?.length ?? ''}`}
                  </button>
                );
              })}
            </div>
          </Reveal>
        )}

        <div className="board mt-14">
          {filteredProjects.length === 0 ? (
            <p className="b-note marker relative mx-auto max-w-md p-8 text-center text-[20px]">Nothing pinned up for this one yet.</p>
          ) : (
            <div className="relative grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-6 lg:[grid-auto-flow:dense]">
              {filteredProjects.map((project, index) => (
                <Reveal
                  key={`${selectedCategory ?? 'all'}-${project.id}`}
                  delay={(index % 4) * 80}
                  className={rnd(index, 2) < 0.3 ? 'lg:col-span-3' : 'lg:col-span-2'}
                >
                  <BoardCard project={project} index={index} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
