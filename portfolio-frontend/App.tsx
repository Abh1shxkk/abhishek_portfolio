import React, { Suspense, lazy, useState, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { Header } from './components/Header';
import { World } from './components/World';
import { ContactPanel, HeroPanel, JourneyPanel, ProjectsPanel, SkillsPanel } from './components/panels';
import { Footer } from './components/Footer';
import { ScrollProgress, scrollBehavior } from './components/ui';
import { AIChat } from './components/AIChat';
// The blog (with its Markdown and syntax-highlighting libraries) loads only when someone opens it
const BlogList = lazy(() => import('./components/BlogList').then((m) => ({ default: m.BlogList })));
const BlogPostPage = lazy(() => import('./components/BlogPost').then((m) => ({ default: m.BlogPostPage })));
import { ProjectsList } from './components/ProjectsList';
import { AboutPage, MeerutPage, ServicesPage } from './components/ServicePages';
import { ProjectDetailPage } from './components/ProjectDetail';
import { Backdrop } from './components/Backdrop';
import { SectionId, Theme } from './types';
import { useSeo } from './seo/useSeo';

// Theme Provider Hook
const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme | null) ?? 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // One click always flips what you see. (Cycling through "system" looked broken whenever
  // the system theme matched the current one, because that click changed nothing.)
  const cycleTheme = () => {
    const showingDark = document.documentElement.classList.contains('dark');
    setTheme(showingDark ? 'light' : 'dark');
  };

  return { theme, cycleTheme };
};

// Portfolio Home Page
const PortfolioHome: React.FC<{ activeSection: string; setActiveSection: (s: string) => void; theme: Theme; onToggleTheme: () => void }> = ({
  activeSection, setActiveSection, theme, onToggleTheme
}) => {
  const { hash } = useLocation();

  // Links such as /#story from other pages land on the right section
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: scrollBehavior() }), 80);
    return () => clearTimeout(t);
  }, [hash]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = Object.values(SectionId);
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setActiveSection]);

  return (
    <div className="grain bg-paper min-h-screen">
      <ScrollProgress />
      <Header activeSection={activeSection} theme={theme} onToggleTheme={onToggleTheme} />
      <World>
        <main>
          <HeroPanel />
          <JourneyPanel />
          <SkillsPanel />
          <ProjectsPanel />
          <ContactPanel />
        </main>
        <Footer />
      </World>
      <AIChat />
    </div>
  );
};

// Content Layout Wrapper (includes Header + Footer) over the living street-corner backdrop
const ContentLayout: React.FC<{ children: React.ReactNode; theme: Theme; onToggleTheme: () => void; activeNav: string }> = ({
  children, theme, onToggleTheme, activeNav
}) => {
  return (
    <div className="grain bg-paper min-h-screen">
      <ScrollProgress />
      <Backdrop />
      <Header activeSection={activeNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="relative z-[1]">
        {children}
        <Footer />
      </div>
      <AIChat />
    </div>
  );
};

/**
 * Every page opens at the top, even when the link was in the footer. Back and forward keep the
 * browser's own scroll position, and hash links scroll to their section instead.
 */
const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP' || hash) return;
    // "instant" rather than "auto": the page sets scroll-behavior: smooth, and a smooth scroll
    // from the bottom of the old page to the top of the new one looks like a glitch
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, navType]);
  return null;
};

const AppContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(SectionId.Hero);
  const { theme, cycleTheme } = useTheme();
  // Title, description, canonical, share tags and structured data for the current route
  useSeo();

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route
        path="/"
        element={
          <PortfolioHome
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            theme={theme}
            onToggleTheme={cycleTheme}
          />
        }
      />
      <Route
        path="/blog"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="blog">
            <Suspense fallback={null}><BlogList /></Suspense>
          </ContentLayout>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="blog">
            <Suspense fallback={null}><BlogPostPage /></Suspense>
          </ContentLayout>
        }
      />
      <Route
        path="/projects"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="projects">
            <ProjectsList />
          </ContentLayout>
        }
      />
      <Route
        path="/services"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="services">
            <ServicesPage />
          </ContentLayout>
        }
      />
      <Route
        path="/meerut"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="meerut">
            <MeerutPage />
          </ContentLayout>
        }
      />
      <Route
        path="/about"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="about">
            <AboutPage />
          </ContentLayout>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="projects">
            <ProjectDetailPage />
          </ContentLayout>
        }
      />
    </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
