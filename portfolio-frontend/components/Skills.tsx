import React, { useMemo } from 'react';
import { SectionId, Skill } from '../types';
import { useSkillsGrouped } from '../hooks/usePortfolio';

// Map skill names to their Simple Icons slug or Devicon class for logo URLs
const SKILL_ICON_MAP: Record<string, { slug: string; type: 'simpleicons' | 'devicon' }> = {
  // Languages
  'javascript': { slug: 'javascript', type: 'devicon' },
  'typescript': { slug: 'typescript', type: 'devicon' },
  'python': { slug: 'python', type: 'devicon' },
  'php': { slug: 'php', type: 'devicon' },
  'java': { slug: 'java', type: 'devicon' },
  'c++': { slug: 'cplusplus', type: 'devicon' },
  'c#': { slug: 'csharp', type: 'devicon' },
  'ruby': { slug: 'ruby', type: 'devicon' },
  'go': { slug: 'go', type: 'devicon' },
  'rust': { slug: 'rust', type: 'devicon' },
  'swift': { slug: 'swift', type: 'devicon' },
  'kotlin': { slug: 'kotlin', type: 'devicon' },
  'dart': { slug: 'dart', type: 'devicon' },

  // Frontend Frameworks
  'react': { slug: 'react', type: 'devicon' },
  'react.js': { slug: 'react', type: 'devicon' },
  'reactjs': { slug: 'react', type: 'devicon' },
  'next.js': { slug: 'nextjs', type: 'devicon' },
  'nextjs': { slug: 'nextjs', type: 'devicon' },
  'vue.js': { slug: 'vuejs', type: 'devicon' },
  'vuejs': { slug: 'vuejs', type: 'devicon' },
  'vue': { slug: 'vuejs', type: 'devicon' },
  'angular': { slug: 'angularjs', type: 'devicon' },
  'svelte': { slug: 'svelte', type: 'devicon' },
  'nuxt.js': { slug: 'nuxtjs', type: 'devicon' },

  // Backend & Runtime
  'node.js': { slug: 'nodejs', type: 'devicon' },
  'nodejs': { slug: 'nodejs', type: 'devicon' },
  'express': { slug: 'express', type: 'devicon' },
  'express.js': { slug: 'express', type: 'devicon' },
  'django': { slug: 'django', type: 'devicon' },
  'flask': { slug: 'flask', type: 'devicon' },
  'laravel': { slug: 'laravel', type: 'devicon' },
  'spring': { slug: 'spring', type: 'devicon' },
  'rails': { slug: 'rails', type: 'devicon' },

  // Databases
  'mysql': { slug: 'mysql', type: 'devicon' },
  'postgresql': { slug: 'postgresql', type: 'devicon' },
  'mongodb': { slug: 'mongodb', type: 'devicon' },
  'redis': { slug: 'redis', type: 'devicon' },
  'sqlite': { slug: 'sqlite', type: 'devicon' },
  'firebase': { slug: 'firebase', type: 'devicon' },

  // DevOps & Cloud
  'docker': { slug: 'docker', type: 'devicon' },
  'kubernetes': { slug: 'kubernetes', type: 'devicon' },
  'aws': { slug: 'amazonwebservices', type: 'devicon' },
  'azure': { slug: 'azure', type: 'devicon' },
  'gcp': { slug: 'googlecloud', type: 'devicon' },
  'google cloud': { slug: 'googlecloud', type: 'devicon' },
  'heroku': { slug: 'heroku', type: 'devicon' },
  'nginx': { slug: 'nginx', type: 'devicon' },
  'linux': { slug: 'linux', type: 'devicon' },
  'git': { slug: 'git', type: 'devicon' },
  'github': { slug: 'github', type: 'devicon' },

  // CSS & Styling
  'css': { slug: 'css3', type: 'devicon' },
  'css3': { slug: 'css3', type: 'devicon' },
  'html': { slug: 'html5', type: 'devicon' },
  'html5': { slug: 'html5', type: 'devicon' },
  'sass': { slug: 'sass', type: 'devicon' },
  'tailwind': { slug: 'tailwindcss', type: 'devicon' },
  'tailwindcss': { slug: 'tailwindcss', type: 'devicon' },
  'tailwind css': { slug: 'tailwindcss', type: 'devicon' },
  'bootstrap': { slug: 'bootstrap', type: 'devicon' },
  'material ui': { slug: 'materialui', type: 'devicon' },

  // Tools & Others
  'figma': { slug: 'figma', type: 'devicon' },
  'webpack': { slug: 'webpack', type: 'devicon' },
  'vite': { slug: 'vitejs', type: 'devicon' },
  'graphql': { slug: 'graphql', type: 'devicon' },
  'redux': { slug: 'redux', type: 'devicon' },
  'jest': { slug: 'jest', type: 'devicon' },
  'storybook': { slug: 'storybook', type: 'devicon' },
  'npm': { slug: 'npm-original-wordmark', type: 'devicon' },

  // Creative / Animation Libraries (use Simple Icons for these)
  'three.js': { slug: 'threedotjs', type: 'simpleicons' },
  'threejs': { slug: 'threedotjs', type: 'simpleicons' },
  'd3.js': { slug: 'd3dotjs', type: 'simpleicons' },
  'd3': { slug: 'd3dotjs', type: 'simpleicons' },
  'webgl': { slug: 'webgl', type: 'simpleicons' },
  'framer motion': { slug: 'framer', type: 'simpleicons' },
  'gsap': { slug: 'greensock', type: 'simpleicons' },
  'canvas api': { slug: 'html5', type: 'devicon' },

  // Testing
  'jest/vitest': { slug: 'jest', type: 'devicon' },
  'vitest': { slug: 'vitest', type: 'simpleicons' },
  'cypress': { slug: 'cypress', type: 'simpleicons' },

  // CI/CD & Infrastructure
  'ci/cd': { slug: 'githubactions', type: 'simpleicons' },
  'terraform': { slug: 'terraform', type: 'devicon' },

  // System Design (no specific icon, use a generic one)
  'system design': { slug: 'archlinux', type: 'simpleicons' },
};

// Official website URLs for each technology
const SKILL_URL_MAP: Record<string, string> = {
  // Languages
  'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'typescript': 'https://www.typescriptlang.org',
  'python': 'https://www.python.org',
  'php': 'https://www.php.net',
  'java': 'https://www.java.com',
  'c++': 'https://isocpp.org',
  'c#': 'https://dotnet.microsoft.com/en-us/languages/csharp',
  'ruby': 'https://www.ruby-lang.org',
  'go': 'https://go.dev',
  'rust': 'https://www.rust-lang.org',
  'swift': 'https://www.swift.org',
  'kotlin': 'https://kotlinlang.org',
  'dart': 'https://dart.dev',

  // Frontend Frameworks
  'react': 'https://react.dev',
  'react.js': 'https://react.dev',
  'reactjs': 'https://react.dev',
  'next.js': 'https://nextjs.org',
  'nextjs': 'https://nextjs.org',
  'vue.js': 'https://vuejs.org',
  'vuejs': 'https://vuejs.org',
  'vue': 'https://vuejs.org',
  'angular': 'https://angular.dev',
  'svelte': 'https://svelte.dev',
  'nuxt.js': 'https://nuxt.com',
  'alpine.js': 'https://alpinejs.dev',

  // Backend & Runtime
  'node.js': 'https://nodejs.org',
  'nodejs': 'https://nodejs.org',
  'express': 'https://expressjs.com',
  'express.js': 'https://expressjs.com',
  'django': 'https://www.djangoproject.com',
  'flask': 'https://flask.palletsprojects.com',
  'laravel': 'https://laravel.com',
  'spring': 'https://spring.io',
  'rails': 'https://rubyonrails.org',

  // Databases
  'mysql': 'https://www.mysql.com',
  'my sql': 'https://www.mysql.com',
  'postgresql': 'https://www.postgresql.org',
  'mongodb': 'https://www.mongodb.com',
  'redis': 'https://redis.io',
  'sqlite': 'https://www.sqlite.org',
  'firebase': 'https://firebase.google.com',

  // DevOps & Cloud
  'docker': 'https://www.docker.com',
  'kubernetes': 'https://kubernetes.io',
  'aws': 'https://aws.amazon.com',
  'azure': 'https://azure.microsoft.com',
  'gcp': 'https://cloud.google.com',
  'google cloud': 'https://cloud.google.com',
  'heroku': 'https://www.heroku.com',
  'nginx': 'https://nginx.org',
  'linux': 'https://www.linux.org',
  'git': 'https://git-scm.com',
  'github': 'https://github.com',

  // CSS & Styling
  'css': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
  'css3': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
  'html': 'https://developer.mozilla.org/en-US/docs/Web/HTML',
  'html5': 'https://developer.mozilla.org/en-US/docs/Web/HTML',
  'sass': 'https://sass-lang.com',
  'tailwind': 'https://tailwindcss.com',
  'tailwindcss': 'https://tailwindcss.com',
  'tailwind css': 'https://tailwindcss.com',
  'bootstrap': 'https://getbootstrap.com',
  'material ui': 'https://mui.com',

  // Tools & Others
  'figma': 'https://www.figma.com',
  'webpack': 'https://webpack.js.org',
  'vite': 'https://vitejs.dev',
  'graphql': 'https://graphql.org',
  'redux': 'https://redux.js.org',
  'jest': 'https://jestjs.io',
  'storybook': 'https://storybook.js.org',
  'npm': 'https://www.npmjs.com',

  // Creative / Animation Libraries
  'three.js': 'https://threejs.org',
  'threejs': 'https://threejs.org',
  'd3.js': 'https://d3js.org',
  'd3': 'https://d3js.org',
  'webgl': 'https://get.webgl.org',
  'framer motion': 'https://www.framer.com/motion',
  'gsap': 'https://gsap.com',
  'canvas api': 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',

  // Testing
  'jest/vitest': 'https://vitest.dev',
  'vitest': 'https://vitest.dev',
  'cypress': 'https://www.cypress.io',

  // CI/CD & Infrastructure
  'ci/cd': 'https://github.com/features/actions',
  'terraform': 'https://www.terraform.io',

  // Others
  'system design': 'https://github.com/donnemartin/system-design-primer',
  'shad cdn': 'https://ui.shadcn.com',
  'shadcn': 'https://ui.shadcn.com',
};

function getSkillUrl(skillName: string): string | null {
  const key = skillName.toLowerCase().trim();
  return SKILL_URL_MAP[key] || null;
}

function getSkillIconUrl(skillName: string, existingIcon?: string | null): string {
  if (existingIcon) return existingIcon;

  const key = skillName.toLowerCase().trim();
  const mapping = SKILL_ICON_MAP[key];

  if (mapping) {
    if (mapping.type === 'devicon') {
      return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${mapping.slug}/${mapping.slug}-original.svg`;
    } else {
      return `https://cdn.simpleicons.org/${mapping.slug}`;
    }
  }

  // Fallback: try Simple Icons with the raw name
  const fallbackSlug = skillName.toLowerCase().replace(/[\s.]+/g, '').replace(/[^a-z0-9]/g, '');
  return `https://cdn.simpleicons.org/${fallbackSlug}`;
}

interface MarqueeRowProps {
  skills: Skill[];
  direction: 'left' | 'right';
  speed?: number;
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({ skills, direction, speed = 35 }) => {
  // Repeat items enough times to guarantee no gap on wide screens
  const items = [...skills, ...skills, ...skills, ...skills];

  return (
    <div className="marquee-container group/marquee">
      <div
        className={`marquee-track ${direction === 'right' ? 'marquee-reverse' : 'marquee-forward'}`}
        style={{ '--marquee-speed': `${speed}s` } as React.CSSProperties}
      >
        {items.map((skill, index) => {
          const url = getSkillUrl(skill.name);
          const CardContent = (
            <>
              <div className="skill-icon-wrapper">
                <img
                  src={getSkillIconUrl(skill.name, skill.icon)}
                  alt={`${skill.name} logo`}
                  className="skill-icon"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.skill-icon-fallback')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'skill-icon-fallback';
                      fallback.textContent = skill.name.charAt(0).toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <span className="skill-name">{skill.name}</span>
            </>
          );

          return (
            <div
              key={`${skill.id}-${index}`}
              className="marquee-item"
            >
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="skill-card skill-card-link"
                  title={`Visit ${skill.name} official website`}
                >
                  {CardContent}
                </a>
              ) : (
                <div className="skill-card">
                  {CardContent}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
};

export const Skills: React.FC = () => {
  const { data: skillsGrouped, isLoading, error } = useSkillsGrouped();

  // Flatten all skills and split into two rows
  const { row1, row2 } = useMemo(() => {
    if (!skillsGrouped) return { row1: [], row2: [] };

    const allSkills = Object.values(skillsGrouped).flat();
    const mid = Math.ceil(allSkills.length / 2);

    return {
      row1: allSkills.slice(0, mid),
      row2: allSkills.slice(mid),
    };
  }, [skillsGrouped]);

  if (isLoading) {
    return (
      <section id={SectionId.Skills} className="skills-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="skills-header">
            <h2 className="font-display text-4xl font-medium tracking-tight mb-6 text-black dark:text-white">
              TECHNICAL<br />SKILLS<span className="text-neutral-300 dark:text-neutral-700">.</span>
            </h2>
          </div>
          <div className="space-y-6 animate-pulse">
            <div className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
            <div className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !skillsGrouped) {
    return (
      <section id={SectionId.Skills} className="skills-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-red-500">Error loading skills. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section id={SectionId.Skills} className="skills-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="skills-header">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-black dark:text-white">
                TECHNICAL<br />SKILLS<span className="text-neutral-300 dark:text-neutral-700">.</span>
              </h2>
              <div className="w-12 h-1 bg-black dark:bg-white mt-6 mb-4"></div>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md text-sm leading-relaxed">
                A toolkit refined over years of building scalable applications and immersive web experiences.
              </p>
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-600 hidden md:block">
              Hover to explore
            </p>
          </div>
        </div>
      </div>

      {/* Full-width marquee area */}
      <div className="marquee-wrapper">
        <MarqueeRow skills={row1} direction="left" speed={40} />
        <MarqueeRow skills={row2} direction="right" speed={45} />
      </div>
    </section>
  );
};