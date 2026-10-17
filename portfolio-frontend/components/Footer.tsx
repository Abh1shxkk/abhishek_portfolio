import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/usePortfolio';
import { resumeService } from '../services/portfolioService';
import { SectionId } from '../types';
import { Icon, scrollBehavior } from './ui';

/** The footer is a rest-stop board at the end of the road: asphalt, a mile marker and the exits. */
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

  const exits: { label: string; onClick?: () => void; to?: string }[] = [
    { label: 'Journey', onClick: () => goSection(SectionId.Journey) },
    { label: 'Skills', onClick: () => goSection(SectionId.Skills) },
    { label: 'Work', onClick: () => goSection(SectionId.Projects) },
    { label: 'All projects', to: '/projects' },
    { label: 'Contact', onClick: () => goSection(SectionId.Contact) },
    { label: 'Resume', onClick: () => resumeService.download() },
  ];

  const socials = [
    { label: 'GitHub', href: profile?.github_url, icon: <Icon.Github size={15} /> },
    { label: 'LinkedIn', href: profile?.linkedin_url, icon: <Icon.LinkedIn size={14} /> },
    { label: 'X', href: profile?.twitter_url, icon: <Icon.X size={13} /> },
    { label: 'Email', href: profile?.email ? `mailto:${profile.email}` : null, icon: <Icon.Mail size={15} /> },
  ].filter((l) => l.href);

  return (
    <footer className="rest-stop">
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-12 md:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <span className="chip-sign brown">Rest area · next services 0 km</span>
            <p className="type-3d green mt-4 text-[26px] md:text-[30px]">Thanks for driving</p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {profile?.tagline}
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href!}
                  target={s.href!.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="plate plate-blue press grid h-9 w-9 place-items-center"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-white/55">Exits</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
              {exits.map((e) => (
                <li key={e.label}>
                  {e.to ? (
                    <Link to={e.to} className="link-draw text-white/85 transition-colors hover:text-white">{e.label}</Link>
                  ) : (
                    <button onClick={e.onClick} className="link-draw text-white/85 transition-colors hover:text-white">{e.label}</button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-4 md:flex-col md:items-end">
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

        <div className="lane mt-10" />
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-white/55">
          <span>© {year} {profile?.full_name}</span>
          <span>{profile?.location}</span>
        </p>
      </div>
    </footer>
  );
};
