import { Profile, Experience, Education, Project, Skill, BlogPost } from '../types';

// ─── PROFILE DATA ───
export const PROFILE_DATA: Profile = {
  id: 1,
  full_name: 'Abhishek Chauhan',
  title: 'Full Stack Developer',
  bio: 'Full Stack Developer focused on building intersectional digital experiences',
  summary: 'Computer Science Engineering graduate with hands-on experience in Laravel, PHP, JavaScript, and WordPress-based frontend development. Skilled in building responsive and dynamic web applications with a strong foundation in data structures, algorithms, and problem-solving. Currently expanding expertise in backend development, focusing on databases, APIs, and server-side programming, with the goal of transitioning into a backend engineering role.',
  email: 'abhichauhan200504@gmail.com',
  phone: null,
  location: 'Meerut, UP',
  avatar: '/142211418.png',
  resume_url: null,
  github_url: 'https://github.com/abh1shxkk',
  linkedin_url: 'https://www.linkedin.com/in/abhishek-chauhan-880496394',
  twitter_url: 'https://x.com/abh1shxkk',
  website_url: null,
  years_of_experience: 1,
  availability_status: 'available',
};

// ─── EXPERIENCE DATA ───
export const EXPERIENCE_DATA: Experience[] = [
  {
    id: 1,
    company: 'Global Matrix Solution',
    position: 'Full Stack Developer',
    location: 'Meerut, UP',
    employment_type: 'full_time',
    start_date: '2025-06-01',
    end_date: null,
    is_current: true,
    description: 'Building and maintaining dynamic full-stack applications using Laravel, PHP, JavaScript, and WordPress. Delivered key projects including a job-seeking platform (Skills360), a personalized matchmaking app (DelWell), and an immigration services website (Kairo Global). Focused on performance optimization, responsive UI, real-time features, and SEO-friendly development to enhance overall user experience.',
    responsibilities: [],
    technologies: ['Laravel', 'JavaScript', 'Tailwind CSS', 'REACT', 'Next.js'],
    company_logo: null,
    website_url: null,
  },
];

// ─── EDUCATION DATA ───
export const EDUCATION_DATA: Education[] = [
  {
    id: 1,
    institution: 'IIMT University',
    degree: 'Bachelor of Engineering/Technology',
    field_of_study: 'Computer Science',
    location: null,
    start_date: '2021-08-01',
    end_date: '2025-06-23',
    is_current: false,
    grade: null,
    description: null,
    activities: null,
    logo: '/download.png',
    website_url: null,
  },
  {
    id: 2,
    institution: 'R S M S Vidya Mandir',
    degree: 'Intermediate',
    field_of_study: 'PCM',
    location: null,
    start_date: '2020-04-01',
    end_date: '2021-07-01',
    is_current: false,
    grade: null,
    description: null,
    activities: null,
    logo: null,
    website_url: null,
  },
  {
    id: 3,
    institution: 'R S M S Vidya Mandir',
    degree: 'High School',
    field_of_study: null,
    location: null,
    start_date: '2018-04-01',
    end_date: '2019-07-01',
    is_current: false,
    grade: null,
    description: null,
    activities: null,
    logo: null,
    website_url: null,
  },
];

// ─── PROJECTS DATA ───
export const PROJECTS_DATA: Project[] = [
  {
    id: 1,
    title: 'Skills360.ai – Job-Seeking and Job-Posting Platform',
    slug: 'skills360',
    category: 'Web Application',
    description: 'A Laravel-based platform featuring user authentication, an intuitive admin panel, AI-powered job matching, and a built-in resume builder to streamline the hiring and job search experience.',
    long_description: null,
    image_url: '/projects/skills360.png',
    gallery_images: [],
    technologies: ['Laravel', 'Tailwind CSS'],
    features: [],
    github_url: null,
    demo_url: null,
    website_url: 'https://www.skills360.ai/',
    start_date: null,
    end_date: null,
    client: null,
    role: null,
    status: 'completed',
    is_featured: true,
  },
  {
    id: 2,
    title: 'DelWell',
    slug: 'delwell',
    category: 'Web Application',
    description: 'A Laravel-powered dating platform offering personalized matchmaking, interactive user profiles, and real-time communication for an engaging and seamless user experience.',
    long_description: null,
    image_url: '/projects/delwell.png',
    gallery_images: [],
    technologies: ['Laravel', 'Tailwind CSS'],
    features: [],
    github_url: null,
    demo_url: null,
    website_url: 'https://hellodelwell.com/',
    start_date: null,
    end_date: null,
    client: null,
    role: null,
    status: 'completed',
    is_featured: true,
  },
  {
    id: 3,
    title: 'Kairo Global - Immigration Service Website',
    slug: 'kairo-global',
    category: 'Website',
    description: 'Developed a fully responsive custom WordPress site with easy content management, optimized performance, and SEO-focused design for enhanced user engagement.',
    long_description: null,
    image_url: '/projects/kairo-global.png',
    gallery_images: [],
    technologies: ['HTML', 'CSS', 'JavaScript'],
    features: [],
    github_url: null,
    demo_url: null,
    website_url: 'https://kairoglobal.co.in/',
    start_date: null,
    end_date: null,
    client: null,
    role: null,
    status: 'completed',
    is_featured: false,
  },
  {
    id: 4,
    title: 'DolceVitale – Premium e-commerce Site',
    slug: 'dolcevitale',
    category: 'e-commerce Site',
    description: 'Built a modern, responsive WooCommerce store showcasing premium wellness products with polished product pages, smooth checkout, and SEO-optimized design for higher conversions.',
    long_description: null,
    image_url: '/projects/dolcevitale.png',
    gallery_images: [],
    technologies: ['Woocommerce', 'Wordpress', 'PHP'],
    features: [],
    github_url: null,
    demo_url: null,
    website_url: 'https://dolcevitale.com/',
    start_date: null,
    end_date: null,
    client: null,
    role: null,
    status: 'completed',
    is_featured: true,
  },
];

// ─── SKILLS DATA (Grouped) ───
export const SKILLS_DATA: Skill[] = [
  { id: 1, name: 'Laravel', category: 'Core Stack', proficiency_level: 90, years_of_experience: 5, icon: null, description: null },
  { id: 2, name: 'JavaScript', category: 'Core Stack', proficiency_level: 90, years_of_experience: 5, icon: null, description: null },
  { id: 3, name: 'REACT', category: 'Core Stack', proficiency_level: 90, years_of_experience: 5, icon: null, description: null },
  { id: 4, name: 'Node.js', category: 'Core Stack', proficiency_level: 90, years_of_experience: 5, icon: null, description: null },
  { id: 5, name: 'My SQL', category: 'Core Stack', proficiency_level: 90, years_of_experience: 5, icon: null, description: null },
  { id: 6, name: 'PostgreSQL', category: 'Core Stack', proficiency_level: 90, years_of_experience: 5, icon: null, description: null },
  { id: 7, name: 'Tailwind CSS', category: 'Creative Dev', proficiency_level: 85, years_of_experience: 4, icon: null, description: null },
  { id: 8, name: 'Bootstrap', category: 'Creative Dev', proficiency_level: 85, years_of_experience: 4, icon: null, description: null },
  { id: 9, name: 'Framer Motion', category: 'Creative Dev', proficiency_level: 85, years_of_experience: 4, icon: null, description: null },
  { id: 10, name: 'Shad CDN', category: 'Creative Dev', proficiency_level: 85, years_of_experience: 4, icon: null, description: null },
  { id: 11, name: 'Alpine.js', category: 'Creative Dev', proficiency_level: 85, years_of_experience: 4, icon: null, description: null },
  { id: 12, name: 'Canvas API', category: 'Creative Dev', proficiency_level: 85, years_of_experience: 4, icon: null, description: null },
  { id: 14, name: 'System Design', category: 'Design & Tools', proficiency_level: 80, years_of_experience: 3, icon: null, description: null },
  { id: 16, name: 'Docker', category: 'Design & Tools', proficiency_level: 80, years_of_experience: 3, icon: null, description: null },
  { id: 17, name: 'AWS', category: 'Design & Tools', proficiency_level: 80, years_of_experience: 3, icon: null, description: null },
  { id: 19, name: 'Git', category: 'Design & Tools', proficiency_level: 90, years_of_experience: 5, icon: null, description: null },
];

// Helper: Group skills by category (matches the API's grouped format)
export const SKILLS_GROUPED: Record<string, Skill[]> = SKILLS_DATA.reduce((acc, skill) => {
  const cat = skill.category || 'Other';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(skill);
  return acc;
}, {} as Record<string, Skill[]>);

// ─── BLOG DATA ───
// Add blog posts here when ready
export const BLOG_DATA: BlogPost[] = [];
export const BLOG_CATEGORIES: string[] = [];
