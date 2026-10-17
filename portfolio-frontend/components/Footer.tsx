import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/usePortfolio';
import { resumeService } from '../services/portfolioService';
import { SectionId } from '../types';
import { Icon, scrollBehavior } from './ui';

/** The end of the road: a grass verge, asphalt, and a highway exit sign listing where else to go. */
export const Footer: React.FC = () => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const year = new Date().getFullYear();

  const goSection = (id: SectionId) => {
    if (pathname === '/') document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() });
    else {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() }), 120);
    }
  };

  const exits: { label: string; hint: string; onClick?: () => void; to?: string }[] = [
    { label: 'Journey', hint: 'the road so far', onClick: () => goSection(SectionId.Journey) },
    { label: 'Skills', hint: 'toolbox', onClick: () => goSection(SectionId.Skills) },
    { label: 'Work', hint: 'points of interest', onClick: () => goSection(SectionId.Projects) },
    { label: 'All projects', hint: 'the notice board', to: '/projects' },
    { label: 'Services & prices', hint: 'what I build', to: '/services' },
    { label: 'Meerut', hint: 'meet in person', to: '/meerut' },
    { label: 'About', hint: 'the short version', to: '/about' },
    { label: 'Contact', hint: 'end of the road', onClick: () => goSection(SectionId.Contact) },
    { label: 'Resume', hint: 'PDF', onClick: () => resumeService.download() },
  ];

  const socials = [
    { label: 'GitHub', href: profile?.github_url, icon: <Icon.Github size={15} /> },
    { label: 'LinkedIn', href: profile?.linkedin_url, icon: <Icon.LinkedIn size={14} /> },
    { label: 'X', href: profile?.twitter_url, icon: <Icon.X size={13} /> },
    { label: 'Email', href: profile?.email ? `mailto:${profile.email}` : null, icon: <Icon.Mail size={15} /> },
  ].filter((l) => l.href);

  return (
    <footer className="rest-stop">
      <div className="verge" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          {/* The exit sign */}
          <div className="md:col-span-7">
            <div className="exit-board">
              <div className="exit-head">
                <span>Exits</span>
                <small>{pathname === '/' ? 'you are here: home' : 'back to the road'}</small>
              </div>
              <nav className="mt-1">
                {exits.map((e, i) => {
                  const inner = (
                    <>
                      <span className="exit-no">{i + 1}</span>
                      {e.label}
                      <span className="hidden font-mono text-[10.5px] font-normal tracking-normal text-white/70 sm:inline">{e.hint}</span>
                      <Icon.ArrowRight size={15} className="exit-arrow" />
                    </>
                  );
                  return e.to ? (
                    <Link key={e.label} to={e.to} className="exit-row">{inner}</Link>
                  ) : (
                    <button key={e.label} onClick={e.onClick} className="exit-row">{inner}</button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Services sign: socials, mile marker, back to top */}
          <div className="md:col-span-5 md:pl-6">
            <div className="exit-board brown">
              <div className="exit-head">
                <span>Services</span>
                <small>{profile?.location}</small>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target={s.href!.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="plate plate-blue press px-3 py-2 font-display text-[10.5px] uppercase tracking-wide"
                  >
                    {s.icon} {s.label}
                  </a>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/25 pt-4">
                <span className="mile-marker">
                  <small>MILE</small>
                  {year}
                </span>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
                  className="btn-sign blue press inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-display text-[11px] uppercase tracking-wide"
                  aria-label="Back to top"
                >
                  <Icon.ArrowUp size={14} /> Back to start
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lane mt-14" />
        <p className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-white/60">
          <span>© {year} {profile?.full_name}</span>
          <span>{profile?.location}</span>
        </p>
      </div>
    </footer>
  );
};
