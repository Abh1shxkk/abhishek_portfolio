import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/usePortfolio';
import { resumeService } from '../services/portfolioService';
import { BLOG_DATA, projectEnquiryHref } from '../data/portfolio';
import { whatsappHref } from '../data/services';
import { SectionId } from '../types';
import { Icon, scrollBehavior } from './ui';

type Exit = { label: string; onClick?: () => void; to?: string };

/** The little red car that drives along the strip of road under the footer card. */
const Car: React.FC = () => (
  <svg viewBox="0 0 46 22" width="46" height="22" aria-hidden="true">
    <path d="M3 16v-5a3 3 0 0 1 3-3h8l5-5h12l6 5h3a3 3 0 0 1 3 3v5z" fill="#d7263d" />
    <path d="M16 8l4-4h10l5 4z" fill="#bfe3ff" />
    <rect x="39" y="10" width="4" height="3" rx="1" fill="#ffe08a" />
    <circle cx="12" cy="16" r="4" fill="#1e1e22" />
    <circle cx="12" cy="16" r="1.5" fill="#9a9ca8" />
    <circle cx="34" cy="16" r="4" fill="#1e1e22" />
    <circle cx="34" cy="16" r="1.5" fill="#9a9ca8" />
  </svg>
);

/**
 * The end of the road: a rest stop. One paper card holds a postcard home (who I am and how to
 * reach me) and the highway exit sign (where else to go). Under it runs a strip of road where
 * the car drives in as the footer scrolls into view and parks at the flag.
 */
export const Footer: React.FC = () => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const year = new Date().getFullYear();
  const footRef = useRef<HTMLElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const foot = footRef.current;
    const road = roadRef.current;
    const car = carRef.current;
    if (!foot || !road || !car) return;
    let frame = 0;
    const update = () => {
      const f = foot.getBoundingClientRect();
      // 0 when the footer's top edge reaches the bottom of the screen, 1 once it is fully in view
      const p = Math.min(1, Math.max(0, (window.innerHeight - f.top) / f.height));
      car.style.transform = `translateX(${(p * Math.max(0, road.clientWidth - 86)).toFixed(1)}px)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const goSection = (id: SectionId) => {
    if (pathname === '/') document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() });
    else {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() }), 120);
    }
  };

  const onRoad: Exit[] = [
    { label: 'Journey', onClick: () => goSection(SectionId.Journey) },
    { label: 'Skills', onClick: () => goSection(SectionId.Skills) },
    { label: 'Work', onClick: () => goSection(SectionId.Projects) },
    { label: 'Contact', onClick: () => goSection(SectionId.Contact) },
  ];
  const pages: Exit[] = [
    { label: 'Projects', to: '/projects' },
    { label: 'Services', to: '/services' },
    { label: 'Meerut', to: '/meerut' },
    { label: 'About', to: '/about' },
    ...(BLOG_DATA.length > 0 ? [{ label: 'Blog', to: '/blog' }] : []),
  ];

  const socials = [
    { label: 'GitHub', href: profile?.github_url, icon: <Icon.Github size={13} /> },
    { label: 'LinkedIn', href: profile?.linkedin_url, icon: <Icon.LinkedIn size={12} /> },
    { label: 'X', href: profile?.twitter_url, icon: <Icon.X size={11} /> },
  ].filter((s) => s.href);
  const wa = whatsappHref();

  const row = (e: Exit, n: number) => {
    const inner = (
      <>
        <span className="exit-no">{n}</span>
        {e.label}
        <Icon.ArrowRight size={14} className="exit-arrow" />
      </>
    );
    return e.to ? (
      <Link key={e.label} to={e.to} className="exit-row">{inner}</Link>
    ) : (
      <button key={e.label} onClick={e.onClick} className="exit-row">{inner}</button>
    );
  };

  return (
    <footer ref={footRef} className="rest-stop">
      <div className="verge" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:px-8">
        <div className="card-paper">
          <span className="tape" />
          <header className="sign sign-brown">
            <h2 className="sign-title">Rest stop</h2>
            <span className="sign-meta hidden sm:inline">{pathname === '/' ? 'you are here: home' : 'back to the road'}</span>
          </header>

          <div className="grid gap-5 px-4 pb-5 pt-6 md:grid-cols-12 md:px-5">
            {/* Postcard home: message on the left, address lines on the right */}
            <article className="fpost md:col-span-7">
              <span className="b-stamp">
                <span style={{ '--stamp': '#fff' } as React.CSSProperties}>{profile?.avatar && <img src={profile.avatar} alt="" />}</span>
              </span>
              <span className="b-postmark max-md:!hidden">MEERUT</span>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="pr-[66px] md:pr-0">
                  <p className="marker text-[22px] leading-tight md:text-[24px]">Thanks for driving by!</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#1c1612]/80">
                    Taking freelance projects: websites, web apps and AI tools. Send a short brief and you get a clear quote in writing, usually the same day.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile?.email && (
                      <a href={projectEnquiryHref(profile.email)} className="btn-sign red press inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-display text-[11px] uppercase tracking-wide">
                        <Icon.Mail size={14} /> Start a project
                      </a>
                    )}
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-paper press inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium">
                        <Icon.Chat size={14} /> WhatsApp
                      </a>
                    )}
                  </div>
                  <p className="marker mt-3 text-[17px] text-[#1c1612]/70">— {profile?.full_name?.split(' ')[0]}</p>
                </div>
                <div className="fpost-addr md:pt-[72px]">
                  <strong>{profile?.full_name}</strong>
                  <span>{profile?.title}</span>
                  <span>{profile?.location}</span>
                  {profile?.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}
                  {profile?.phone && <a href={`tel:${profile.phone.replace(/\s+/g, '')}`}>{profile.phone}</a>}
                  <div className="!flex flex-wrap gap-1.5 !overflow-visible !border-0 !pt-3">
                    {socials.map((s) => (
                      <a key={s.label} href={s.href!} target="_blank" rel="noopener noreferrer" className="plate plate-blue press px-2.5 py-1.5 font-display text-[10px] uppercase tracking-wide">
                        {s.icon} {s.label}
                      </a>
                    ))}
                    {profile?.resume_url && (
                      <button onClick={() => resumeService.download()} className="chip-sign paper press !py-1.5">
                        <Icon.Download size={12} /> Résumé
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>

            {/* The exit sign */}
            <nav className="exit-board md:col-span-5" aria-label="Footer">
              <div className="exit-head">
                <span>Exits</span>
                <small>{onRoad.length + pages.length} ahead</small>
              </div>
              <div className="exit-cols">
                <div className="exit-group">
                  <small>On the road</small>
                  {onRoad.map((e, i) => row(e, i + 1))}
                </div>
                <div className="exit-group">
                  <small>Pages</small>
                  {pages.map((e, i) => row(e, onRoad.length + i + 1))}
                </div>
              </div>
            </nav>
          </div>
          <span className="fold" />
        </div>

        {/* The road home: the car parks at the flag once you reach the bottom */}
        <div className="mt-6 grid items-center gap-3 sm:grid-cols-[1fr_auto]">
          <div ref={roadRef} className="f-road" aria-hidden="true">
            <span ref={carRef} className="f-car"><Car /></span>
            <span className="f-flag" />
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
            className="btn-sign blue press inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 font-display text-[11px] uppercase tracking-wide"
            aria-label="Back to top"
          >
            <Icon.Uturn size={14} /> Back to start
          </button>
        </div>
        <p className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-white/60">
          <span>© {year} {profile?.full_name}</span>
          <span>{profile?.location}</span>
        </p>
      </div>
    </footer>
  );
};
