import React from 'react';
import { useProfile } from '../hooks/usePortfolio';

export const Footer: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black dark:bg-black text-white py-20 px-6 md:px-12 border-t border-neutral-900 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-6">
            <h2 className="font-display text-3xl md:text-5xl tracking-tighter leading-none mb-8">
              LET'S BUILD<br />SOMETHING<br />SHARP.
            </h2>
            {isLoading ? (
              <span className="inline-block h-12 w-40 bg-neutral-800 animate-pulse rounded"></span>
            ) : (
              <a 
                href={`mailto:${profile?.email}`}
                className="inline-block border border-white px-8 py-3 text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Get in Touch
              </a>
            )}
          </div>
          
          <div className="md:col-span-3 md:col-start-8 space-y-6">
            <div>
              <h4 className="text-neutral-500 text-xs uppercase tracking-widest mb-4">Social</h4>
              {isLoading ? (
                <ul className="space-y-2">
                  <li><span className="inline-block h-5 w-24 bg-neutral-800 animate-pulse rounded"></span></li>
                  <li><span className="inline-block h-5 w-20 bg-neutral-800 animate-pulse rounded"></span></li>
                  <li><span className="inline-block h-5 w-16 bg-neutral-800 animate-pulse rounded"></span></li>
                </ul>
              ) : (
                <ul className="space-y-2">
                  {profile?.twitter_url && (
                    <li><a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-neutral-400 transition-colors">Twitter / X</a></li>
                  )}
                  {profile?.linkedin_url && (
                    <li><a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-neutral-400 transition-colors">LinkedIn</a></li>
                  )}
                  {profile?.github_url && (
                    <li><a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-neutral-400 transition-colors">GitHub</a></li>
                  )}
                </ul>
              )}
            </div>
          </div>
           
           <div className="md:col-span-2 space-y-6">
            <div>
              <h4 className="text-neutral-500 text-xs uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-neutral-600">© {currentYear}</span></li>
                <li><span className="text-sm text-neutral-600">All Rights Reserved</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};