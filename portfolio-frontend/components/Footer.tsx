import React from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/usePortfolio';
import { Icon } from './ui';

export const Footer: React.FC = () => {
  const { data: profile } = useProfile();
  const year = new Date().getFullYear();

  const links = [
    { label: 'GitHub', href: profile?.github_url },
    { label: 'LinkedIn', href: profile?.linkedin_url },
    { label: 'X', href: profile?.twitter_url },
    { label: 'Email', href: profile?.email ? `mailto:${profile.email}` : null },
  ].filter((l) => l.href);

  return (
    <footer className="mx-auto max-w-5xl px-5 md:px-8 pb-10">
      <div className="flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted">
          <Link to="/" className="font-semibold text-ink">
            {profile?.full_name}
            <span className="text-saffron">.</span>
          </Link>
          <span>© {year}</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <Link to="/projects" className="link-draw hover:text-ink transition-colors">Projects</Link>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href!}
              target={l.href!.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="link-draw hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group press ml-1 grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink hover:border-ink/30 transition-colors"
            aria-label="Back to top"
          >
            <Icon.ArrowUp size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </nav>
      </div>
    </footer>
  );
};
