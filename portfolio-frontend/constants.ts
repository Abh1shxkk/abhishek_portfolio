import { Experience, Project, Education } from './types';

export const PROFILE_SUMMARY = `I am a Senior Product Engineer focused on building intersectional digital experiences. With a background in architectural design and computer science, I approach frontend development with a spatial mindset. I specialize in high-performance React applications, design systems, and micro-interactions that elevate usability. Currently exploring the boundaries of Generative AI in UI patterns.`;

export const EXPERIENCE_DATA: Experience[] = [
  {
    id: '1',
    role: 'Senior Frontend Engineer',
    company: 'Vercel (Contract)',
    period: '2022 — Present',
    description: 'Leading the migration of legacy dashboards to a new composable architecture. Implemented a new design system using Tailwind and React Aria, improving accessibility scores by 40%.',
    technologies: ['React', 'Next.js', 'TypeScript', 'GraphQL'],
  },
  {
    id: '2',
    role: 'Product Engineer',
    company: 'Stripe',
    period: '2019 — 2022',
    description: 'Worked on the checkout experience team. Optimized render cycles for high-traffic payment forms, reducing TTI by 300ms. Collaborated closely with design to implement complex motion primitives.',
    technologies: ['React', 'Redux', 'Node.js', 'Framer Motion'],
  },
  {
    id: '3',
    role: 'UI Developer',
    company: 'Huge Inc.',
    period: '2017 — 2019',
    description: 'Developed award-winning marketing sites for Fortune 500 clients. Bridged the gap between creative direction and technical implementation.',
    technologies: ['Vue.js', 'WebGL', 'Three.js', 'GSAP'],
  },
];

export const PROJECTS_DATA: Project[] = [
  {
    id: '1',
    title: 'Lumina Interface',
    category: 'Design System',
    description: 'A strict, geometric design system built for data-heavy fintech dashboards. Focus on information density and typographic hierarchy.',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    technologies: ['React', 'Storybook', 'Tokens'],
  },
  {
    id: '2',
    title: 'Apex Finance',
    category: 'Web Application',
    description: 'Real-time trading platform featuring WebGL data visualization for market trends. Handles 50k+ updates per second via WebSocket.',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    technologies: ['d3.js', 'WebGL', 'WebSockets'],
  },
  {
    id: '3',
    title: 'Mono Portfolio',
    category: 'Website',
    description: 'An experimental portfolio concept focusing on monochromatic aesthetics and brutalist typography.',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    technologies: ['Next.js', 'Tailwind'],
  },
  {
    id: '4',
    title: 'Velvet AI',
    category: 'SaaS Product',
    description: 'AI-powered copywriting tool for e-commerce. Integrated OpenAI API with a custom rich text editor.',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    technologies: ['OpenAI', 'ProseMirror', 'Node.js'],
  },
];

export const EDUCATION_DATA: Education[] = [
  {
    id: '1',
    degree: 'B.S. Computer Science',
    institution: 'Massachusetts Institute of Technology',
    year: '2017',
  },
  {
    id: '2',
    degree: 'Minor in Architectural Design',
    institution: 'Massachusetts Institute of Technology',
    year: '2017',
  },
];

export const SKILLS_DATA = [
  {
    category: "Core Stack",
    items: ["React", "TypeScript", "Next.js", "Node.js", "GraphQL", "PostgreSQL"]
  },
  {
    category: "Creative Dev",
    items: ["Three.js", "WebGL", "Framer Motion", "GSAP", "D3.js", "Canvas API"]
  },
  {
    category: "Design & Tools",
    items: ["Figma", "System Design", "Jest/Vitest", "Docker", "AWS", "CI/CD"]
  }
];