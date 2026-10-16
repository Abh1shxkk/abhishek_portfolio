import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SectionId, Theme } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { resumeService } from '../services/portfolioService';
import { BLOG_DATA } from '../data/portfolio';
import { Icon } from './ui';

interface HeaderProps {
  activeSection: string;
  theme: Theme;
  onToggleTheme: () => void;
}

type NavItem = { id: string; label: string; section?: SectionId; route?: string };

const NAV_ITEMS: NavItem[] = [
  { id: SectionId.Journey, label: 'Journey', section: SectionId.Journey },
  { id: SectionId.Projects, label: 'Work', section: SectionId.Projects },
  { id: SectionId.Skills, label: 'Skills', section: SectionId.Skills },
  { id: 'projects', label: 'All projects', route: '/projects' },
  // The blog link only appears once there is something to read
  ...(BLOG_DATA.length > 0 ? [{ id: 'blog', label: 'Blog', route: '/blog' }] : []),
];

const themeLabel: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

const ThemeIcon: React.FC<{ theme: Theme; size?: number }> = ({ theme, size = 16 }) => (
  <span key={theme} className="spin-in inline-flex">
    {theme === 'light' && <Icon.Sun size={size} />}
    {theme === 'dark' && <Icon.Moon size={size} />}
    {theme === 'system' && <Icon.Monitor size={size} />}
  </span>
);

export const Header: React.FC<HeaderProps> = ({ activeSection, theme, onToggleTheme }) => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false });
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (item: NavItem) =>
    item.route ? location.pathname.startsWith(item.route) : isHome && activeSection === item.section;

  // The highlight pill sits under the hovered link, or the active one when nothing is hovered
  const target = hovered ?? NAV_ITEMS.find(isActive)?.id ?? null;
  useLayoutEffect(() => {
    const el = target ? itemRefs.current[target] : null;
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
    else setPill((p) => ({ ...p, visible: false }));
  }, [target, isScrolled]);

  const scrollToSection = (id: string) => {
    if (!isHome) {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const go = (item: NavItem) => {
    setIsMenuOpen(false);
    if (item.route) navigate(item.route);
    else if (item.section) scrollToSection(item.section);
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const initials = profile?.full_name?.split(' ').map((n) => n[0]).join('') ?? '';

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4 md:pt-5 pointer-events-none">
      <div
        className={`pointer-events-auto mx-auto max-w-6xl flex items-center justify-between gap-3 rounded-xl border transition-all duration-500 ease-out
          ${isScrolled || isMenuOpen
            ? 'bg-surface/75 dark:bg-surface/70 backdrop-blur-xl border-line shadow-soft py-2 pl-2 pr-2'
            : 'bg-transparent border-transparent py-3 pl-1 pr-1'}`}
      >
        {/* Brand */}
        <button
          onClick={() => (isHome ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/'))}
          className="group flex items-center gap-2.5 rounded-full pr-3 press"
          aria-label="Back to top"
        >
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-ink text-paper text-xs font-semibold tracking-tight">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              initials
            )}
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            {firstName}
            <span className="text-saffron">.</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="relative hidden md:flex items-center" onMouseLeave={() => setHovered(null)}>
          <span
            aria-hidden="true"
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full bg-ink/[0.06] dark:bg-ink/[0.09] transition-all duration-300 ease-out"
            style={{ left: pill.left, width: pill.width, opacity: pill.visible ? 1 : 0 }}
          />
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              ref={(el) => { itemRefs.current[item.id] = el; }}
              onMouseEnter={() => setHovered(item.id)}
              onFocus={() => setHovered(item.id)}
              onBlur={() => setHovered(null)}
              onClick={() => go(item)}
              className={`relative z-10 px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200
                ${isActive(item) ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full text-muted hover:text-ink hover:bg-ink/[0.06] transition-colors press"
            aria-label={`Theme: ${themeLabel[theme]}. Click to switch.`}
            title={`Theme: ${themeLabel[theme]}`}
          >
            <ThemeIcon theme={theme} />
          </button>

          <button
            onClick={() => scrollToSection(SectionId.Contact)}
            className="hidden md:inline-flex shine press items-center gap-2 rounded-md bg-ink px-4 py-2 text-[13px] font-medium text-paper"
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-saffron" />
            Let's talk
          </button>

          <button
            className="md:hidden grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-ink/[0.06] press"
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <span key={String(isMenuOpen)} className="spin-in inline-flex">
              {isMenuOpen ? <Icon.Close size={18} /> : <Icon.Menu size={18} />}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`pointer-events-auto md:hidden mx-auto max-w-6xl mt-2 origin-top rounded-xl border border-line bg-surface/90 backdrop-blur-xl shadow-lift p-2 transition-all duration-300 ease-out
          ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
      >
        <nav className="flex flex-col">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              onClick={() => go(item)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-base font-medium transition-colors
                ${isActive(item) ? 'bg-ink/[0.06] text-ink' : 'text-muted hover:text-ink hover:bg-ink/[0.04]'}`}
              style={{ transitionDelay: isMenuOpen ? `${i * 30}ms` : '0ms' }}
            >
              {item.label}
              <Icon.ArrowRight size={16} className="opacity-40" />
            </button>
          ))}
        </nav>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-2">
          {profile?.resume_url && (
            <button
              onClick={() => { resumeService.download(); setIsMenuOpen(false); }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line px-4 py-3 text-sm font-medium text-ink press"
            >
              <Icon.Download size={16} /> Résumé
            </button>
          )}
          <button
            onClick={() => go({ id: 'contact', label: 'Contact', section: SectionId.Contact })}
            className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-paper press"
          >
            Let's talk
          </button>
        </div>
      </div>
    </header>
  );
};
