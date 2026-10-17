import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SectionId, Theme } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { BLOG_DATA, projectEnquiryHref } from '../data/portfolio';
import { Icon, scrollBehavior, useDarkMode } from './ui';

interface HeaderProps {
  activeSection: string;
  theme: Theme;
  onToggleTheme: () => void;
}

type NavItem = { id: string; label: string; section?: SectionId; route?: string };

const NAV_ITEMS: NavItem[] = [
  { id: SectionId.Journey, label: 'Journey', section: SectionId.Journey },
  { id: SectionId.Skills, label: 'Skills', section: SectionId.Skills },
  { id: SectionId.Projects, label: 'Work', section: SectionId.Projects },
  { id: 'projects', label: 'All projects', route: '/projects' },
  { id: 'services', label: 'Services', route: '/services' },
  // The blog link only appears once there is something to read
  ...(BLOG_DATA.length > 0 ? [{ id: 'blog', label: 'Blog', route: '/blog' }] : []),
];

const themeLabel: Record<Theme, string> = { light: 'Day', dark: 'Night', system: 'Auto' };

/** The header is an overhead sign gantry: a licence plate for the brand, a green sign for the nav. */
export const Header: React.FC<HeaderProps> = ({ activeSection, theme, onToggleTheme }) => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const dark = useDarkMode();
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

  // The yellow plate sits under the hovered link, or the active one when nothing is hovered
  const target = hovered ?? NAV_ITEMS.find(isActive)?.id ?? null;
  // Nav items change width when the Bungee web font finishes loading (it is wider than the
  // fallback), so re-measure the highlight whenever an item resizes and once fonts are ready.
  const [layoutTick, setLayoutTick] = useState(0);
  useEffect(() => {
    const bump = () => setLayoutTick((t) => t + 1);
    const ro = new ResizeObserver(bump);
    Object.values(itemRefs.current).forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(bump);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = target ? itemRefs.current[target] : null;
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
    else setPill((p) => ({ ...p, visible: false }));
  }, [target, isScrolled, layoutTick]);

  const scrollToSection = (id: string) => {
    if (!isHome) {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior() });
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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-4 md:pt-4">
      <div className={`gantry pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-2 px-2 py-2 ${isScrolled || isMenuOpen ? 'is-scrolled' : ''}`}>
        {/* Brand: a licence plate */}
        <button
          onClick={() => (isHome ? window.scrollTo({ top: 0, behavior: scrollBehavior() }) : navigate('/'))}
          className="plate plate-licence press py-1 pl-1 pr-3"
          aria-label="Back to top"
        >
          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-[4px] bg-ink text-[10px] font-semibold text-paper">
            {profile?.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : initials}
          </span>
          <span className="font-display text-[12px] uppercase tracking-[0.12em]">{firstName}</span>
        </button>

        {/* Desktop nav: one green sign */}
        <nav className="plate plate-green relative hidden items-center px-1.5 py-1 md:flex" onMouseLeave={() => setHovered(null)}>
          <span aria-hidden="true" className="nav-pill" style={{ left: pill.left, width: pill.width, opacity: pill.visible ? 1 : 0 }} />
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              ref={(el) => { itemRefs.current[item.id] = el; }}
              onMouseEnter={() => setHovered(item.id)}
              onFocus={() => setHovered(item.id)}
              onBlur={() => setHovered(null)}
              onClick={() => go(item)}
              className={`nav-sign px-3.5 py-2 ${isActive(item) && !hovered ? 'is-active' : ''} ${hovered === item.id ? 'is-hot' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="day-night press"
            aria-label={`Theme: ${themeLabel[theme]}. Click to switch.`}
            title={`Theme: ${themeLabel[theme]}`}
          >
            <span className="stars" />
            <span className="knob">{dark ? <Icon.Moon size={11} /> : <Icon.Sun size={11} />}</span>
          </button>

          <button
            onClick={() => scrollToSection(SectionId.Contact)}
            className="btn-sign red press hidden items-center gap-2 rounded-md px-3.5 py-2 font-display text-[11px] uppercase tracking-wide md:inline-flex"
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-white" />
            Let's talk
          </button>

          <button
            className="plate plate-green grid h-9 w-9 place-items-center md:hidden press"
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

      {/* Mobile menu: a paper card hanging under the gantry */}
      <div
        className={`card-paper pointer-events-auto mx-auto mt-3 max-w-6xl origin-top p-3 transition-all duration-300 ease-out md:hidden
          ${isMenuOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-2 scale-95 opacity-0'}`}
      >
        <nav className="flex flex-col">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              onClick={() => go(item)}
              className={`flex items-center justify-between rounded-md px-3 py-3 text-left font-display text-[12px] uppercase tracking-wide transition-colors
                ${isActive(item) ? 'bg-[rgb(var(--sign-green))] text-white' : 'text-ink/80 hover:bg-ink/[0.05] hover:text-ink'}`}
              style={{ transitionDelay: isMenuOpen ? `${i * 30}ms` : '0ms' }}
            >
              {item.label}
              <Icon.ArrowRight size={16} className="opacity-50" />
            </button>
          ))}
        </nav>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink/15 pt-3">
          {profile?.email && (
            <a
              href={projectEnquiryHref(profile.email)}
              onClick={() => setIsMenuOpen(false)}
              className="btn-paper press flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium"
            >
              <Icon.Mail size={16} /> Start a project
            </a>
          )}
          <button
            onClick={() => go({ id: 'contact', label: 'Contact', section: SectionId.Contact })}
            className="btn-sign red press flex items-center justify-center gap-2 rounded-md px-4 py-3 font-display text-[12px] uppercase tracking-wide"
          >
            Let's talk
          </button>
        </div>
      </div>
    </header>
  );
};
