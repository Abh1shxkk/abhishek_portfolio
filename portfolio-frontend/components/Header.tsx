import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { SectionId, Theme } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { resumeService } from '../services/portfolioService';

interface HeaderProps {
  activeSection: string;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeSection, theme, onToggleTheme }) => {
  const { data: profile } = useProfile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navigate = useNavigate();
  const location = useLocation();
  const isOnBlogPage = location.pathname.startsWith('/blog');
  const isOnProjectsPage = location.pathname.startsWith('/projects');

  const scrollTo = (id: string) => {
    if (isOnBlogPage || isOnProjectsPage) {
      // Navigate home first, then scroll
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const goToRoute = (route: string) => {
    navigate(route);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'projects', label: 'Projects', route: '/projects' },
    { id: 'blog', label: 'Blog', route: '/blog' },
  ];

  return (
    <>
    <header className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-geo-dark-bg/90 backdrop-blur-md border-b border-neutral-200 dark:border-geo-dark-border py-3' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <div 
          className="font-display font-bold text-xl tracking-tighter cursor-pointer select-none hover:opacity-60 transition-opacity dark:text-white"
          onClick={() => {
            if (isOnBlogPage || isOnProjectsPage) {
              navigate('/');
            } else {
              scrollTo(SectionId.Hero);
            }
          }}
        >
          {profile?.full_name?.toUpperCase() || 'LOADING...'}
        </div>

        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => goToRoute(item.route)}
                className={`text-sm font-medium uppercase tracking-wider transition-colors relative
                  ${location.pathname.startsWith(item.route) || activeSection === item.id ? 'text-black dark:text-white' : 'text-neutral-400 hover:text-black dark:hover:text-white'}
                `}
              >
                {item.label}
                {(location.pathname.startsWith(item.route) || activeSection === item.id) && (
                  <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black dark:bg-white"></span>
                )}
              </button>
            ))}
          </nav>

          {profile?.resume_url && (
            <button
              onClick={() => resumeService.download()}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-mono text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Resume
            </button>
          )}

          <button 
            onClick={onToggleTheme}
            className="w-8 h-8 flex items-center justify-center border border-neutral-200 dark:border-geo-dark-border rounded hover:bg-neutral-100 dark:hover:bg-geo-dark-card transition-colors text-black dark:text-white"
            aria-label={`Current theme: ${theme}. Click to switch.`}
          >
            {theme === 'light' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
            {theme === 'dark' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
            {theme === 'system' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            )}
          </button>

          <button 
             className="md:hidden p-2 text-black dark:text-white"
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             aria-label="Toggle mobile menu"
          >
            <div className={`w-6 h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[5px]' : 'mb-1.5'}`}></div>
            <div className={`w-6 h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`}></div>
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Menu - Rendered via Portal to avoid stacking context issues */}
    {createPortal(
        <>
          {/* Mobile Menu Overlay */}
          <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div 
            className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-geo-dark-bg border-l border-neutral-200 dark:border-geo-dark-border z-[101] md:hidden transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="pt-20 px-6">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goToRoute(item.route)}
                    className={`text-left text-lg font-medium uppercase tracking-wider transition-colors py-3
                      ${location.pathname.startsWith(item.route) || activeSection === item.id ? 'text-black dark:text-white' : 'text-neutral-400 hover:text-black dark:hover:text-white'}
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-neutral-200/50 dark:border-geo-dark-border/50 flex flex-col gap-4">
                <button 
                  onClick={onToggleTheme}
                  className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  {theme === 'light' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  )}
                  {theme === 'dark' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  )}
                  {theme === 'system' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  )}
                  <span className="text-sm uppercase tracking-wider">
                    {theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'System'}
                  </span>
                </button>

                {profile?.resume_url && (
                  <button
                    onClick={() => {
                      resumeService.download();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span className="text-sm uppercase tracking-wider">Download Resume</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};
