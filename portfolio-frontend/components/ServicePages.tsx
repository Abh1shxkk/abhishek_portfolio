import React from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/usePortfolio';
import { EDUCATION_DATA, EXPERIENCE_DATA, PROJECTS_DATA, SKILLS_GROUPED, projectEnquiryHref, publicTitle } from '../data/portfolio';
import { FAQ, MEERUT, PACKAGES, PACKAGE_TERMS, PROCESS, SERVICES, TESTIMONIALS, formatInr, whatsappHref } from '../data/services';
import { Icon, Reveal } from './ui';

/*
 * Services, Meerut and About pages, laid out like the projects notice board: everything is a real
 * object pinned or taped to cork (price tickets, postcards, polaroids, ruled index cards).
 * Tilts and pins come from a seeded random, so the board looks hand-arranged but never shifts.
 */

const projectById = new Map(PROJECTS_DATA.map((p) => [p.id, p]));
const shortTitle = (t: string) => t.split(':')[0];

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const PINS = ['#e01e5a', '#1e5aa8', '#f4a300', '#1f7a3f', '#8b5cf6'];
const STAMPS = ['#1f7a3f', '#1e5aa8', '#c0392b', '#7a4a2a'];

/** Something pinned (or taped) to the board, with a small seeded tilt. */
const Pinned: React.FC<{ i: number; seed?: number; tape?: boolean; ribbon?: string; className?: string; children: React.ReactNode }> = ({
  i,
  seed = 0,
  tape,
  ribbon,
  className = '',
  children,
}) => {
  const n = i + seed * 17;
  const taped = tape ?? rnd(n, 9) < 0.45;
  return (
    <div className={`b-card h-full ${className}`} style={{ '--tilt': `${((rnd(n, 3) - 0.5) * 4).toFixed(2)}deg`, '--dy': `${Math.round(rnd(n, 4) * 14)}px` } as React.CSSProperties}>
      {taped ? (
        <span className="b-tape" style={{ left: `${18 + rnd(n, 10) * 50}%`, transform: `rotate(${(rnd(n, 11) - 0.5) * 12}deg)` }} />
      ) : (
        <span className="b-pin" style={{ '--pin': PINS[Math.floor(rnd(n, 5) * PINS.length)], left: `${30 + rnd(n, 10) * 40}%` } as React.CSSProperties} />
      )}
      {ribbon && <span className="b-ribbon">{ribbon}</span>}
      {children}
    </div>
  );
};

/** A full-width cork board section with a painted label. */
const Board: React.FC<{ label: string; note?: string; children: React.ReactNode }> = ({ label, note, children }) => (
  <section className="board mt-16">
    <Reveal>
      <div className="mb-8 flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 className="type-3d brown text-[26px] md:text-[34px]">{label}</h2>
        {note && <p className="marker text-[16px] text-[#3d2412] md:text-[18px]">{note}</p>}
      </div>
    </Reveal>
    {children}
  </section>
);

const PageTop: React.FC<{ eyebrow: string; title: string; colour: 'green' | 'blue' | 'brown' | 'red'; children?: React.ReactNode }> = ({ eyebrow, title, colour, children }) => (
  <Reveal>
    <Link to="/" className="chip-sign paper press">
      <Icon.ArrowLeft size={12} /> Back to the road
    </Link>
    <p className="mt-8 font-display text-[11px] uppercase tracking-[0.22em] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">{eyebrow}</p>
    <h1 className={`type-3d ${colour} big mt-2 max-w-4xl text-[36px] leading-[1.02] md:text-[60px]`}>{title}</h1>
    {children}
  </Reveal>
);

const Check: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex gap-2 text-[14px] leading-snug text-[#1c1612]/85">
    <Icon.Check size={15} className="mt-0.5 shrink-0 text-[rgb(var(--sign-green))]" /> {children}
  </li>
);

const ProofLinks: React.FC<{ ids: number[] }> = ({ ids }) => {
  const items = ids.map((id) => projectById.get(id)).filter(Boolean);
  if (!items.length) return null;
  return (
    <p className="mt-3 text-[12.5px] leading-relaxed text-[#1c1612]/70">
      <span className="marker text-[14px] text-[#1c1612]/80">built before → </span>
      {items.map((p, k) => (
        <React.Fragment key={p!.id}>
          {k > 0 && ', '}
          <Link to={`/projects/${p!.id}`} className="font-medium text-[rgb(var(--sign-blue))] underline-offset-2 hover:underline">{shortTitle(p!.title)}</Link>
        </React.Fragment>
      ))}
    </p>
  );
};

/** "Start a project" ticket: WhatsApp and email. */
const Enquire: React.FC<{ heading?: string }> = ({ heading = 'Start a project' }) => {
  const { data: profile } = useProfile();
  const wa = whatsappHref();
  return (
    <section className="board mt-16">
      <Reveal>
        <div className="mx-auto max-w-3xl">
          <Pinned i={3} seed={9} tape>
            <article className="b-ticket" style={{ '--notch': '58%' } as React.CSSProperties}>
              <div className="flex items-center justify-between font-display text-[10px] uppercase tracking-wide text-[#1c1612]/60">
                <span>Free quote</span>
                <span>Meerut · India · Remote</span>
              </div>
              <h2 className="type-3d red mt-3 text-[26px] leading-tight md:text-[34px]">{heading}</h2>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#1c1612]/80">
                Send a few lines about what you need, who it’s for and your timeline, and you’ll get a clear quote in writing. In Meerut, we can also meet in person.
              </p>
              <div className="b-tear" />
              <div className="flex flex-wrap gap-2">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-sign press inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[12px] uppercase tracking-wide">
                    <Icon.Chat size={15} /> WhatsApp me
                  </a>
                )}
                {profile?.email && (
                  <a href={projectEnquiryHref(profile.email)} className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium">
                    <Icon.Mail size={15} /> Email a brief
                  </a>
                )}
              </div>
            </article>
          </Pinned>
        </div>
      </Reveal>
    </section>
  );
};

/** Real testimonials only; renders nothing until data/services.ts has some. */
const Testimonials: React.FC = () =>
  TESTIMONIALS.length === 0 ? null : (
    <Board label="What clients say">
      <div className="grid gap-x-7 gap-y-10 md:grid-cols-2">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 80}>
            <Pinned i={i} seed={7}>
              <figure className="b-note h-full">
                <blockquote className="marker text-[18px] leading-snug text-[#1c1612]">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-[13px] text-[#1c1612]/70">
                  <strong className="text-[#1c1612]">{t.name}</strong>, {t.role}
                </figcaption>
              </figure>
            </Pinned>
          </Reveal>
        ))}
      </div>
    </Board>
  );

// ─── /services ───

export const ServicesPage: React.FC = () => (
  <div className="relative overflow-x-clip">
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
      <PageTop eyebrow="Services and prices" title="What I can build for you" colour="green">
        <p className="card-paper mt-6 max-w-3xl px-5 py-4 text-[16px] leading-relaxed text-ink/85">
          Websites for local businesses at fixed prices, and custom web apps, ERPs, AI assistants and Android apps quoted to your scope.
          Every project ends with you owning the work, and each service links to a real system I’ve built.
        </p>
      </PageTop>

      {/* Packages as price tickets */}
      <Board label="Website packages" note="one-time price · domain + hosting for year one">
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <Pinned i={i} seed={1} ribbon={p.highlight ? 'Most picked' : undefined}>
                <article className="b-ticket h-full" style={{ '--notch': '30%' } as React.CSSProperties}>
                  <div className={`flex items-center justify-between font-display text-[10px] uppercase tracking-wide text-[#1c1612]/60 ${p.highlight ? 'pl-[92px]' : ''}`}>
                    <span>{p.name}</span>
                    <span>{p.delivery}</span>
                  </div>
                  <p className="mt-3 font-display text-[40px] leading-none text-[#1c1612] md:text-[46px]">{formatInr(p.price)}</p>
                  <p className="marker mt-2 text-[16px] text-[#1c1612]/75">{p.pitch}</p>
                  <div className="b-tear" />
                  <ul className="space-y-2">{p.includes.map((x) => <Check key={x}>{x}</Check>)}</ul>
                </article>
              </Pinned>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mx-auto mt-12 max-w-3xl">
            <Pinned i={5} seed={2} tape>
              <div className="b-note">
                <p className="marker text-[17px] text-[#1c1612]">The small print, in plain words</p>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-[26px] text-[#1c1612]/80">{PACKAGE_TERMS.map((t) => <li key={t}>• {t}</li>)}</ul>
              </div>
            </Pinned>
          </div>
        </Reveal>
      </Board>

      {/* Custom work as postcards */}
      <Board label="Custom work" note="fixed quote after a short call">
        <div className="grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 70}>
              <Pinned i={i} seed={3}>
                <article id={s.id} className="b-postcard h-full scroll-mt-28 pr-[64px]">
                  <span className="b-stamp"><span style={{ '--stamp': STAMPS[i % STAMPS.length] } as React.CSSProperties}>{s.price.startsWith('From') ? '₹' : 'QUOTE'}</span></span>
                  <span className="b-postmark">MEERUT</span>
                  <h3 className="font-display text-[15px] leading-tight text-[#1c1612]">{s.title}</h3>
                  <p className="marker mt-1 text-[14px] text-[rgb(var(--sign-green))]">{s.price}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#1c1612]/80">{s.summary}</p>
                  <ul className="mt-3 space-y-1">{s.includes.map((x) => <Check key={x}>{x}</Check>)}</ul>
                  <ProofLinks ids={s.proof} />
                </article>
              </Pinned>
            </Reveal>
          ))}
        </div>
      </Board>

      {/* Process as sticky index cards */}
      <Board label="How a project runs">
        <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((step, i) => (
            <Reveal key={step.title} delay={i * 70} as="li">
              <Pinned i={i} seed={4}>
                <div className="b-note h-full">
                  <p className="font-display text-[34px] leading-none text-[rgb(var(--sign-red))]">{i + 1}</p>
                  <h3 className="mt-2 font-display text-[14px] leading-tight text-[#1c1612]">{step.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-[26px] text-[#1c1612]/80">{step.text}</p>
                </div>
              </Pinned>
            </Reveal>
          ))}
        </ol>
      </Board>

      <Testimonials />

      {/* FAQ on one big ruled card */}
      <Board label="Questions people ask">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Pinned i={2} seed={5} tape>
              <div className="b-note">
                {FAQ.map((f) => (
                  <details key={f.q} className="group border-b border-dashed border-[#1c1612]/20 py-3 last:border-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[14px] text-[#1c1612]">
                      {f.q}
                      <Icon.ArrowDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-[14.5px] leading-[26px] text-[#1c1612]/80">{f.a}</p>
                  </details>
                ))}
              </div>
            </Pinned>
          </div>
        </Reveal>
      </Board>

      <Enquire />
    </div>
  </div>
);

// ─── /meerut ───

export const MeerutPage: React.FC = () => {
  const current = EXPERIENCE_DATA.find((e) => e.is_current) ?? EXPERIENCE_DATA[0];
  const previous = EXPERIENCE_DATA.find((e) => e !== current);
  const degree = EDUCATION_DATA[0];
  const proof = [
    current && `${publicTitle(current.position)} at ${current.company}, maintaining the ERP that the university and its 100+ affiliated colleges run on.`,
    previous && `${publicTitle(previous.position)} at ${previous.company}, Meerut, building websites, CRMs and LMS platforms for clients.`,
    degree && `B.Tech in ${degree.field_of_study ?? 'Computer Science'} from ${degree.institution}, Meerut.`,
  ].filter(Boolean) as string[];

  return (
    <div className="relative overflow-x-clip">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <PageTop eyebrow="Meerut, Uttar Pradesh" title="A web developer you can meet in Meerut" colour="red">
          <p className="card-paper mt-6 max-w-3xl px-5 py-4 text-[16px] leading-relaxed text-ink/85">
            I live and work in Meerut. {MEERUT.inPerson} Websites for local businesses start at {formatInr(PACKAGES[0].price)}; custom apps, ERPs and AI tools are quoted to scope.
          </p>
        </PageTop>

        <Board label="Local and in person" note="track record you can check">
          <div className="grid gap-x-8 gap-y-12 lg:grid-cols-2">
            <Reveal>
              <Pinned i={0} seed={6} tape>
                <article className="b-postcard h-full pr-[64px]">
                  <span className="b-stamp"><span style={{ '--stamp': STAMPS[2] } as React.CSSProperties}>UP</span></span>
                  <span className="b-postmark">MEERUT</span>
                  <h3 className="font-display text-[15px] text-[#1c1612]">Local track record</h3>
                  <ul className="mt-3 space-y-2.5">{proof.map((p) => <Check key={p}>{p}</Check>)}</ul>
                </article>
              </Pinned>
            </Reveal>
            <Reveal delay={90}>
              <Pinned i={1} seed={6}>
                <article className="b-ticket h-full" style={{ '--notch': '36%' } as React.CSSProperties}>
                  <div className="flex items-center justify-between font-display text-[10px] uppercase tracking-wide text-[#1c1612]/60">
                    <span>Where I meet clients</span>
                    <span>In person</span>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {MEERUT.areas.map((a) => <li key={a} className="b-chip green">{a}</li>)}
                  </ul>
                  <div className="b-tear" />
                  <p className="marker text-[15px] text-[#1c1612]/75">Anywhere else in India or abroad: calls and WhatsApp.</p>
                </article>
              </Pinned>
            </Reveal>
          </div>
        </Board>

        <Board label="What I build for Meerut businesses">
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <Reveal key={s.id} delay={(i % 4) * 60}>
                <Pinned i={i} seed={8}>
                  <Link to={`/services#${s.id}`} className="b-note block h-full">
                    <h3 className="font-display text-[13.5px] leading-tight text-[#1c1612]">{s.title}</h3>
                    <p className="marker mt-2 text-[14px] text-[rgb(var(--sign-green))]">{s.price}</p>
                  </Link>
                </Pinned>
              </Reveal>
            ))}
          </div>
        </Board>

        <Testimonials />
        <Enquire heading="Meet in Meerut or message me" />
      </div>
    </div>
  );
};

// ─── /about ───

export const AboutPage: React.FC = () => {
  const { data: profile } = useProfile();
  return (
    <div className="relative overflow-x-clip">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <PageTop eyebrow="About" title={profile?.full_name ?? 'About'} colour="blue">
          <p className="mt-3 max-w-3xl font-display text-[15px] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] md:text-[19px]">
            {profile?.title} · {profile?.location}
          </p>
        </PageTop>

        <Board label="The short version">
          <div className="grid gap-x-8 gap-y-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <Pinned i={0} seed={10}>
                <article className="b-polaroid">
                  <div className="b-shot aspect-square">
                    {profile?.avatar && <img src={profile.avatar} alt={profile.full_name} />}
                  </div>
                  <p className="marker mt-3 px-1 text-[20px] text-[#1c1612]">{profile?.full_name}</p>
                  <p className="px-1 text-[13px] text-[#1c1612]/60">{profile?.location} · {profile?.languages?.join(', ')}</p>
                </article>
              </Pinned>
            </Reveal>
            <Reveal className="lg:col-span-8" delay={90}>
              <Pinned i={1} seed={10} tape>
                <article className="b-note">
                  <p className="text-[15.5px] leading-[26px] text-[#1c1612]">{profile?.tagline}</p>
                  <p className="mt-[26px] text-[15px] leading-[26px] text-[#1c1612]/85">{profile?.summary}</p>
                  <p className="mt-[26px] text-[15px] leading-[26px] text-[#1c1612]/85">
                    I take on freelance and contract work: business websites, Laravel web apps, ERPs, APIs and AI assistants, and I care about the parts that keep a
                    system running after launch: backups, security, a clear handover and support.
                  </p>
                </article>
              </Pinned>
            </Reveal>
          </div>
        </Board>

        <Board label="Work and tools">
          <div className="grid gap-x-8 gap-y-12 lg:grid-cols-3">
            <Reveal>
              <Pinned i={0} seed={11}>
                <article className="b-ticket h-full" style={{ '--notch': '22%' } as React.CSSProperties}>
                  <div className="font-display text-[10px] uppercase tracking-wide text-[#1c1612]/60">Work so far</div>
                  <div className="b-tear" />
                  <ul className="space-y-3">
                    {EXPERIENCE_DATA.map((e) => (
                      <li key={e.id}>
                        <p className="font-display text-[13px] leading-tight text-[#1c1612]">{publicTitle(e.position)}</p>
                        <p className="text-[13.5px] text-[#1c1612]/70">{e.company}{e.location ? `, ${e.location}` : ''}</p>
                      </li>
                    ))}
                    {EDUCATION_DATA[0] && (
                      <li>
                        <p className="font-display text-[13px] leading-tight text-[#1c1612]">{EDUCATION_DATA[0].degree}</p>
                        <p className="text-[13.5px] text-[#1c1612]/70">{EDUCATION_DATA[0].institution}</p>
                      </li>
                    )}
                  </ul>
                </article>
              </Pinned>
            </Reveal>
            {Object.entries(SKILLS_GROUPED).slice(0, 2).map(([group, skills], gi) => (
              <Reveal key={group} delay={(gi + 1) * 80}>
                <Pinned i={gi + 1} seed={11}>
                  <article className="b-note h-full">
                    <p className="marker text-[17px] text-[#1c1612]">{group}</p>
                    <p className="mt-1 text-[14px] leading-[26px] text-[#1c1612]/85">{skills.map((s) => s.name).join(' · ')}</p>
                  </article>
                </Pinned>
              </Reveal>
            ))}
          </div>
          {Object.entries(SKILLS_GROUPED).length > 2 && (
            <Reveal>
              <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2">
                {Object.entries(SKILLS_GROUPED).slice(2).map(([group, skills], gi) => (
                  <Pinned key={group} i={gi + 4} seed={11}>
                    <article className="b-note h-full">
                      <p className="marker text-[17px] text-[#1c1612]">{group}</p>
                      <p className="mt-1 text-[14px] leading-[26px] text-[#1c1612]/85">{skills.map((s) => s.name).join(' · ')}</p>
                    </article>
                  </Pinned>
                ))}
              </div>
            </Reveal>
          )}
          <Reveal>
            <p className="mt-12 flex flex-wrap justify-center gap-2">
              <Link to="/services" className="btn-sign press inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[12px] uppercase tracking-wide">
                Services and prices <Icon.ArrowRight size={14} />
              </Link>
              <Link to="/projects" className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium">All projects</Link>
            </p>
          </Reveal>
        </Board>

        <Enquire />
      </div>
    </div>
  );
};
