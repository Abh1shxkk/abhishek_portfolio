import React, { useState, useEffect, useRef } from 'react';
import { SectionId } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { useSkillsGrouped } from '../hooks/usePortfolio';

// Animated counter hook
function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (target <= 0 || hasAnimated.current) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// Highlights keywords in summary text
function highlightKeywords(text: string): React.ReactNode[] {
  const keywords = [
    'Laravel', 'PHP', 'JavaScript', 'WordPress', 'React', 'TypeScript',
    'Next.js', 'Node.js', 'Python', 'Vue.js', 'Angular', 'Docker',
    'AWS', 'GraphQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'backend', 'frontend', 'full-stack', 'full stack', 'web applications',
    'data structures', 'algorithms', 'problem-solving',
    'responsive', 'dynamic', 'scalable', 'APIs', 'databases',
    'server-side programming', 'backend engineering', 'backend development',
    'Computer Science Engineering',
  ];

  // Sort by length (longest first) to avoid partial matches
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

  const parts = text.split(regex);
  return parts.map((part, i) => {
    const isKeyword = sorted.some(k => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <span
          key={i}
          className="profile-keyword"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const Profile: React.FC = () => {
  const { data: profile, isLoading, error } = useProfile();
  const { data: skillsGrouped } = useSkillsGrouped();
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  // Calculate total skills
  const totalSkills = skillsGrouped
    ? Object.values(skillsGrouped).flat().length
    : 0;

  // Calculate skill categories
  const totalCategories = skillsGrouped
    ? Object.keys(skillsGrouped).length
    : 0;

  const { count: yearsCount, ref: yearsRef } = useCountUp(
    profile?.years_of_experience ?? 0,
    1500
  );
  const { count: skillsCount, ref: skillsRef } = useCountUp(totalSkills, 1800);
  const { count: categoriesCount, ref: categoriesRef } = useCountUp(totalCategories, 1200);

  if (isLoading) {
    return (
      <section id={SectionId.Profile} className="profile-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="animate-pulse">
            <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded w-48 mb-6"></div>
            <div className="h-1 w-12 bg-neutral-200 dark:bg-neutral-800 mb-8"></div>
            <div className="space-y-4">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6"></div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section id={SectionId.Profile} className="profile-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-red-500">Error loading profile data. Please try again later.</p>
        </div>
      </section>
    );
  }

  const availabilityColor = profile.availability_status === 'available' ? 'bg-green-500' : 
                           profile.availability_status === 'busy' ? 'bg-yellow-500' : 'bg-red-500';
  const availabilityText = profile.availability_status === 'available' ? 'Open to Work' : 
                          profile.availability_status === 'busy' ? 'Busy' : 'Not Available';

  const stats = [
    {
      key: 'experience',
      count: yearsCount,
      ref: yearsRef,
      suffix: '+',
      label: 'Years of Experience',
      sublabel: 'Building real-world applications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
    {
      key: 'skills',
      count: skillsCount,
      ref: skillsRef,
      suffix: '+',
      label: 'Technologies',
      sublabel: 'In the current arsenal',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
    },
    {
      key: 'categories',
      count: categoriesCount,
      ref: categoriesRef,
      suffix: '',
      label: 'Skill Domains',
      sublabel: 'From frontend to DevOps',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      ),
    },
    {
      key: 'availability',
      count: null,
      ref: null,
      suffix: '',
      label: 'Current Status',
      sublabel: profile.location || 'Remote',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
    },
  ];

  return (
    <section id={SectionId.Profile} className="profile-section">
      {/* Decorative accent line */}
      <div className="profile-accent-line"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Top Row: Heading + Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16">
          <div className="md:col-span-4">
            <div className="profile-heading-wrapper">
              <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-black dark:text-white">
                PROFILE<span className="text-neutral-300 dark:text-neutral-700">.</span>
              </h2>
              <div className="w-12 h-1 bg-black dark:bg-white mt-6 mb-4"></div>
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                Who I am & what I do
              </p>
            </div>
          </div>

          {/* Summary with keyword highlights */}
          <div className="md:col-span-8">
            <div className="profile-summary-card">
              <div className="profile-quote-mark">"</div>
              <p className="profile-summary-text">
                {highlightKeywords(profile.summary || profile.bio || '')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.key}
              ref={stat.ref}
              className={`profile-stat-card ${hoveredStat === stat.key ? 'profile-stat-card-active' : ''}`}
              onMouseEnter={() => setHoveredStat(stat.key)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div className="profile-stat-icon">
                {stat.icon}
              </div>
              <div className="profile-stat-value">
                {stat.key === 'availability' ? (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${availabilityColor} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${availabilityColor}`}></span>
                    </span>
                    <span className="text-lg md:text-xl font-medium">{availabilityText}</span>
                  </div>
                ) : (
                  <span className="profile-stat-number">
                    {stat.count}{stat.suffix}
                  </span>
                )}
              </div>
              <div className="profile-stat-label">{stat.label}</div>
              <div className="profile-stat-sublabel">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};