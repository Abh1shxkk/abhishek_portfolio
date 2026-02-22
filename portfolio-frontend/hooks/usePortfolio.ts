import { Profile, Experience, Education, Project, Skill, BlogPost } from '../types';
import {
  PROFILE_DATA,
  EXPERIENCE_DATA,
  EDUCATION_DATA,
  PROJECTS_DATA,
  SKILLS_DATA,
  SKILLS_GROUPED,
  BLOG_DATA,
  BLOG_CATEGORIES,
} from '../data/portfolio';

// Mimic the shape of UseQueryResult so components work unchanged
interface StaticQueryResult<T> {
  data: T;
  isLoading: false;
  error: null;
  isError: false;
  isSuccess: true;
}

function staticResult<T>(data: T): StaticQueryResult<T> {
  return { data, isLoading: false, error: null, isError: false, isSuccess: true };
}

// Profile Hook
export const useProfile = () => staticResult<Profile>(PROFILE_DATA);

// Experiences Hook
export const useExperiences = () => staticResult<Experience[]>(EXPERIENCE_DATA);

// Education Hook
export const useEducation = () => staticResult<Education[]>(EDUCATION_DATA);

// Projects Hook
export const useProjects = (_params?: { category?: string; featured?: boolean }) => {
  let filtered = PROJECTS_DATA;
  if (_params?.category) {
    filtered = filtered.filter(p => p.category === _params.category);
  }
  if (_params?.featured !== undefined) {
    filtered = filtered.filter(p => p.is_featured === _params.featured);
  }
  return staticResult<Project[]>(filtered);
};

export const useProject = (id: string) => {
  const project = PROJECTS_DATA.find(p => String(p.id) === id);
  return staticResult<Project | undefined>(project);
};

// Skills Hooks
export const useSkills = (_params?: { category?: string; grouped?: boolean }) => {
  if (_params?.grouped) {
    return staticResult<Record<string, Skill[]>>(SKILLS_GROUPED);
  }
  let filtered: Skill[] = SKILLS_DATA;
  if (_params?.category) {
    filtered = filtered.filter(s => s.category === _params.category);
  }
  return staticResult<Skill[] | Record<string, Skill[]>>(filtered);
};

export const useSkillsGrouped = () => staticResult<Record<string, Skill[]>>(SKILLS_GROUPED);

// Blog Hooks
export const useBlogs = (_params?: { category?: string; tag?: string; page?: number; per_page?: number }) => {
  let filtered = BLOG_DATA;
  if (_params?.category) {
    filtered = filtered.filter(b => b.category === _params.category);
  }
  if (_params?.tag) {
    filtered = filtered.filter(b => b.tags?.includes(_params.tag!));
  }
  return staticResult<{ data: BlogPost[]; meta: any }>({
    data: filtered,
    meta: { current_page: 1, last_page: 1, per_page: filtered.length, total: filtered.length },
  });
};

export const useBlogPost = (slug: string) => {
  const post = BLOG_DATA.find(b => b.slug === slug);
  return staticResult<BlogPost | undefined>(post);
};

export const useFeaturedBlogs = (_limit?: number) => {
  const featured = BLOG_DATA.filter(b => b.is_featured);
  return staticResult<BlogPost[]>(_limit ? featured.slice(0, _limit) : featured);
};

export const useBlogCategories = () => staticResult<string[]>(BLOG_CATEGORIES);
