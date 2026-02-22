// API Response Types (matching Laravel Resources)

export interface Profile {
  id: number;
  full_name: string;
  title: string;
  bio: string | null;
  summary: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  resume_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  years_of_experience: number | null;
  availability_status: 'available' | 'busy' | 'not_available';
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  location: string | null;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance';
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  responsibilities: string[] | null;
  technologies: string[] | null;
  company_logo: string | null;
  website_url: string | null;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  category: string | null;
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  gallery_images: string[] | null;
  technologies: string[] | null;
  features: string[] | null;
  github_url: string | null;
  demo_url: string | null;
  website_url: string | null;
  start_date: string | null;
  end_date: string | null;
  client: string | null;
  role: string | null;
  status: string | null;
  is_featured: boolean;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  grade: string | null;
  description: string | null;
  activities: string[] | null;
  logo: string | null;
  website_url: string | null;
}

export interface Skill {
  id: number;
  name: string;
  category: string | null;
  proficiency_level: number;
  years_of_experience: number | null;
  icon: string | null;
  description: string | null;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  category: string | null;
  tags: string[] | null;
  reading_time: number | null;
  is_featured: boolean;
  published_at: string | null;
  formatted_date: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image: string | null;
  created_at: string;
  updated_at: string;
}

// UI Types
export enum SectionId {
  Hero = 'hero',
  Profile = 'profile',
  Experience = 'experience',
  Projects = 'projects',
  Skills = 'skills',
  Education = 'education',
  Blog = 'blog',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export type Theme = 'light' | 'dark' | 'system';