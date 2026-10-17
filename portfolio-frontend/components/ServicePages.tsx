import React from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/usePortfolio';
import { EDUCATION_DATA, EXPERIENCE_DATA, PROJECTS_DATA, SKILLS_GROUPED, projectEnquiryHref, publicTitle } from '../data/portfolio';
import { FAQ, MEERUT, PACKAGES, PACKAGE_TERMS, PROCESS, SERVICES, TESTIMONIALS, formatInr, whatsappHref } from '../data/services';
import { Icon, Reveal } from './ui';

const projectById = new Map(PROJECTS_DATA.map((p) => [p.id, p]));
const shortTitle = (t: string) => t.split(':')[0];

// ─── Shared pieces ───

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

/** Two ways to get in touch, used at the bottom of every page here. */
const Enquire: React.FC<{ heading?: string }> = ({ heading = 'Tell me about your project' }) => {
  const { data: profile } = useProfile();
  const wa = whatsappHref();
  return (
    <Reveal>
      <div className="card-paper mt-14">
        <span className="tape" />
        <header className="sign sign-green">
          <h2 className="sign-title">{heading}</h2>
          <span className="sign-meta">Free quote</span>
        </header>
        <div className="flex flex-col gap-5 px-5 pb-6 pt-6 md:flex-row md:items-center md:justify-between md:px-7">
          <p className="max-w-xl text-[15.5px] leading-relaxed text-ink/85">
            Send a few lines about what you need, who it’s for and your timeline. You’ll get a clear quote in writing. In Meerut, we can also meet in person.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-sign press inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[12px] uppercase tracking-wide">
                <Icon.Chat size={15} /> WhatsApp
              </a>
            )}
            {profile?.email && (
              <a href={projectEnquiryHref(profile.email)} className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium">
                <Icon.Mail size={15} /> Email a brief
              </a>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
};

const Testimonials: React.FC = () =>
  TESTIMONIALS.length === 0 ? null : (
    <section className="mt-14">
      <Reveal>
        <h2 className="type-3d blue text-[26px] md:text-[34px]">What clients say</h2>
      </Reveal>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 80}>
            <figure className="card-paper h-full px-6 pb-6 pt-7">
              <blockquote className="text-[16px] leading-relaxed text-ink">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-sm text-ink/70">
                <strong className="text-ink">{t.name}</strong>, {t.role}
                {t.projectId && projectById.get(t.projectId) && (
                  <> · <Link to={`/projects/${t.projectId}`} className="link-draw">{shortTitle(projectById.get(t.projectId)!.title)}</Link></>
                )}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );

// ─── /services ───

export const ServicesPage: React.FC = () => (
  <div className="relative">
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
      <PageTop eyebrow="Services and prices" title="What I can build for you" colour="green">
        <p className="card-paper mt-6 max-w-3xl px-5 py-4 text-[16px] leading-relaxed text-ink/85">
          Websites for local businesses at fixed prices, and custom web apps, ERPs, AI assistants and Android apps quoted to your scope.
          Every project ends with you owning the work, and there’s a real system behind each claim below: click the project links to see it.
        </p>
      </PageTop>

      {/* Packages */}
      <section className="mt-14">
        <Reveal>
          <h2 className="type-3d green text-[26px] md:text-[34px]">Website packages</h2>
          <p className="mt-2 font-display text-[12px] uppercase tracking-wide text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">One-time price · domain, hosting and SSL included for year one</p>
        </Reveal>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <div className="card-paper h-full">
                {p.highlight && <span className="tape right" />}
                <header className={`sign ${p.highlight ? 'sign-blue' : 'sign-brown'}`}>
                  <h3 className="sign-title">{p.name}</h3>
                  <span className="sign-meta">{p.delivery}</span>
                </header>
                <div className="px-5 pb-6 pt-5 md:px-6">
                  <p className="font-display text-[34px] leading-none text-ink md:text-[40px]">{formatInr(p.price)}</p>
                  <p className="mt-2 text-[14.5px] text-ink/75">{p.pitch}</p>
                  <ul className="mt-5 space-y-2">
                    {p.includes.map((item) => (
                      <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug text-ink/90">
                        <Icon.Check size={16} className="mt-0.5 shrink-0 text-[rgb(var(--sign-green))]" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <ul className="card-paper mt-6 grid gap-x-8 gap-y-2 px-5 py-4 text-[13.5px] text-ink/75 md:grid-cols-2">
            {PACKAGE_TERMS.map((t) => <li key={t}>• {t}</li>)}
          </ul>
        </Reveal>
      </section>

      {/* Custom services */}
      <section className="mt-16">
        <Reveal>
          <h2 className="type-3d brown text-[26px] md:text-[34px]">Custom work</h2>
          <p className="mt-2 font-display text-[12px] uppercase tracking-wide text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">Fixed quote after a short call · proof from real projects</p>
        </Reveal>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={(i % 2) * 80}>
              <article id={s.id} className="card-paper h-full scroll-mt-28">
                <header className="sign sign-green">
                  <h3 className="sign-title">{s.title}</h3>
                  <span className="sign-meta">{s.price}</span>
                </header>
                <div className="px-5 pb-6 pt-5 md:px-6">
                  <p className="text-[15px] leading-relaxed text-ink/90">{s.summary}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {s.includes.map((x) => <li key={x} className="chip-sign paper">{x}</li>)}
                  </ul>
                  {s.proof.length > 0 && (
                    <p className="mt-5 border-t border-dashed border-ink/20 pt-3 text-[13px] text-ink/70">
                      Built before:{' '}
                      {s.proof
                        .map((id) => projectById.get(id))
                        .filter(Boolean)
                        .map((p, k) => (
                          <React.Fragment key={p!.id}>
                            {k > 0 && ', '}
                            <Link to={`/projects/${p!.id}`} className="font-medium text-[rgb(var(--sign-blue))] underline-offset-2 hover:underline">{shortTitle(p!.title)}</Link>
                          </React.Fragment>
                        ))}
                    </p>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="mt-16">
        <Reveal>
          <h2 className="type-3d blue text-[26px] md:text-[34px]">How a project runs</h2>
        </Reveal>
        <ol className="mt-6 grid gap-6 md:grid-cols-4">
          {PROCESS.map((step, i) => (
            <Reveal key={step.title} delay={i * 70} as="li">
              <div className="card-paper h-full px-5 pb-5 pt-6">
                <span className="chip-sign blue">Step {i + 1}</span>
                <h3 className="mt-3 font-display text-[15px] leading-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/80">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <Testimonials />

      {/* FAQ */}
      <section className="mt-16">
        <Reveal>
          <h2 className="type-3d brown text-[26px] md:text-[34px]">Questions people ask</h2>
        </Reveal>
        <div className="card-paper mt-6 divide-y divide-dashed divide-ink/20 px-5 md:px-7">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[14px] text-ink">
                {f.q}
                <Icon.ArrowDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

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
    <div className="relative">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <PageTop eyebrow="Meerut, Uttar Pradesh" title="A web developer you can meet in Meerut" colour="red">
          <p className="card-paper mt-6 max-w-3xl px-5 py-4 text-[16px] leading-relaxed text-ink/85">
            I live and work in Meerut. {MEERUT.inPerson} Websites for local businesses start at {formatInr(PACKAGES[0].price)}; custom apps, ERPs and AI tools are quoted to scope.
          </p>
        </PageTop>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card-paper h-full">
              <span className="tape" />
              <header className="sign sign-red">
                <h2 className="sign-title">Local track record</h2>
                <span className="sign-meta">Meerut</span>
              </header>
              <ul className="space-y-3 px-5 pb-6 pt-5 md:px-6">
                {proof.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/90">
                    <Icon.Check size={16} className="mt-1 shrink-0 text-[rgb(var(--sign-green))]" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="card-paper h-full">
              <header className="sign sign-green">
                <h2 className="sign-title">Where I meet clients</h2>
                <span className="sign-meta">In person</span>
              </header>
              <div className="px-5 pb-6 pt-5 md:px-6">
                <ul className="flex flex-wrap gap-1.5">
                  {MEERUT.areas.map((a) => <li key={a} className="chip-sign paper">{a}</li>)}
                </ul>
                <p className="mt-4 text-[14.5px] leading-relaxed text-ink/80">Anywhere else in India or abroad, we work over calls and WhatsApp.</p>
              </div>
            </div>
          </Reveal>
        </div>

        <section className="mt-14">
          <Reveal>
            <h2 className="type-3d green text-[26px] md:text-[34px]">What I build for Meerut businesses</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.slice(0, 8).map((s, i) => (
              <Reveal key={s.id} delay={(i % 4) * 60}>
                <Link to={`/services#${s.id}`} className="card-paper block h-full px-5 pb-5 pt-5 transition-transform hover:-translate-y-0.5">
                  <h3 className="font-display text-[14px] leading-tight text-ink">{s.title}</h3>
                  <p className="mt-2 text-[13px] text-ink/70">{s.price}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

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
    <div className="relative">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <PageTop eyebrow="About" title={profile?.full_name ?? 'About'} colour="blue">
          <p className="mt-3 max-w-3xl font-display text-[15px] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] md:text-[19px]">
            {profile?.title} · {profile?.location}
          </p>
        </PageTop>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <div className="card-paper">
              <span className="tape right" />
              <header className="sign sign-blue">
                <h2 className="sign-title">The short version</h2>
                <span className="sign-meta">{profile?.languages?.join(' · ')}</span>
              </header>
              <div className="space-y-4 px-5 pb-6 pt-6 text-[16px] leading-relaxed text-ink/90 md:px-7">
                <p>{profile?.tagline}</p>
                <p>{profile?.summary}</p>
                <p>
                  I take on freelance and contract work: business websites, Laravel web apps, ERPs, APIs and AI assistants. I care about the boring parts that keep a
                  system running after launch: backups, security, clear handover and support.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={90}>
            <div className="card-paper h-full">
              <header className="sign sign-brown">
                <h2 className="sign-title">Work so far</h2>
              </header>
              <ul className="space-y-4 px-5 pb-6 pt-5">
                {EXPERIENCE_DATA.map((e) => (
                  <li key={e.id}>
                    <p className="font-display text-[13px] leading-tight text-ink">{publicTitle(e.position)}</p>
                    <p className="text-[14px] text-ink/75">{e.company}{e.location ? `, ${e.location}` : ''}</p>
                  </li>
                ))}
                {EDUCATION_DATA[0] && (
                  <li>
                    <p className="font-display text-[13px] leading-tight text-ink">{EDUCATION_DATA[0].degree}</p>
                    <p className="text-[14px] text-ink/75">{EDUCATION_DATA[0].institution}</p>
                  </li>
                )}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="card-paper mt-6 px-5 pb-6 pt-5 md:px-7">
            <h2 className="font-display text-[15px] text-ink">Tools I use</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {Object.entries(SKILLS_GROUPED).map(([group, skills]) => (
                <div key={group}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink/60">{group}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink/85">{skills.map((s) => s.name).join(', ')}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 flex flex-wrap gap-2">
              <Link to="/services" className="btn-sign press inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-display text-[12px] uppercase tracking-wide">
                Services and prices <Icon.ArrowRight size={14} />
              </Link>
              <Link to="/projects" className="btn-paper press inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium">All projects</Link>
            </p>
          </div>
        </Reveal>

        <Enquire />
      </div>
    </div>
  );
};
