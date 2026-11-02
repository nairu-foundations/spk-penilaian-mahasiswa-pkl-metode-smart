import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useQuery } from '../../hooks/useData';
import { contentService } from '../../services/contentService';

export const PublicLayout: React.FC = () => {
  const { data: settings } = useQuery(() => contentService.getSiteSettings());
  const { data: menus } = useQuery(() => contentService.getMenu());

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar settings={settings} menus={menus} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer settings={settings} />
    </div>
  );
};
