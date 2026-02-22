import { PROFILE_DATA } from '../data/portfolio';

// Resume Service — opens resume URL in a new tab
// Since there's no backend, this will use a direct link if resume_url is set
export const resumeService = {
  download: async (): Promise<void> => {
    const resumeUrl = PROFILE_DATA.resume_url;
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    } else {
      console.warn('No resume URL configured');
    }
  },
};
