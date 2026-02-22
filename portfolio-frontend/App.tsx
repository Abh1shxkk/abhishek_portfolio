import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Profile } from './components/Profile';

import { Experience } from './components/Experience';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Education } from './components/Education';
import { Footer } from './components/Footer';
import { AIChat } from './components/AIChat';
import { BlogList } from './components/BlogList';
import { BlogPostPage } from './components/BlogPost';
import { ProjectsList } from './components/ProjectsList';
import { ProjectDetailPage } from './components/ProjectDetail';
import { SectionId, Theme } from './types';
import { useProfile } from './hooks/usePortfolio';

// Theme Provider Hook
const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
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

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return { theme, cycleTheme };
};

// Portfolio Home Page
const PortfolioHome: React.FC<{ activeSection: string; setActiveSection: (s: string) => void; theme: Theme; onToggleTheme: () => void }> = ({
  activeSection, setActiveSection, theme, onToggleTheme
}) => {
  const { data: profile } = useProfile();

  useEffect(() => {
    if (profile?.full_name) {
      document.title = `${profile.full_name} | Portfolio`;
    }
  }, [profile]);

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
    <div className="bg-white dark:bg-geo-dark-bg min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      <Header activeSection={activeSection} theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <Hero />
        <Profile />
        <Experience />
        <Skills />
        <Projects />
        <Education />
      </main>
      <Footer />
      <AIChat />
    </div>
  );
};

// Content Layout Wrapper (includes Header + Footer)
const ContentLayout: React.FC<{ children: React.ReactNode; theme: Theme; onToggleTheme: () => void; activeNav: string }> = ({
  children, theme, onToggleTheme, activeNav
}) => {
  return (
    <div className="bg-white dark:bg-geo-dark-bg min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      <Header activeSection={activeNav} theme={theme} onToggleTheme={onToggleTheme} />
      {children}
      <Footer />
    </div>
  );
};

const AppContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(SectionId.Hero);
  const { theme, cycleTheme } = useTheme();

  return (
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
            <BlogList />
          </ContentLayout>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="blog">
            <BlogPostPage />
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
        path="/projects/:id"
        element={
          <ContentLayout theme={theme} onToggleTheme={cycleTheme} activeNav="projects">
            <ProjectDetailPage />
          </ContentLayout>
        }
      />
    </Routes>
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
