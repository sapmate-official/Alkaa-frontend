import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { AppSidebarRail } from '@/components/layout/AppSidebarRail';
import { CommandPalette } from '@/components/layout/CommandPalette';
import RouteDict from '@/routes/RouteDict';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('alkaa_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('alkaa_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      toggleCollapse();
    }
  }, [toggleCollapse]);

  // Global hotkey '[' to toggle sidebar (when not focused inside an input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '[' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar]);

  const location = useLocation();

  const noSidebarPaths = ['/', '/auth/signin'];
  const shouldShowLayout =
    !noSidebarPaths.includes(location.pathname) &&
    !location.pathname.startsWith('/reset-password');

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Top Application Bar */}
      <AppTopBar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Main Split Layout: Sidebar + Canvas */}
      <div className="flex flex-1 w-full overflow-hidden">
        <AppSidebarRail
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar h-[calc(100vh-3.5rem)] bg-background transition-all duration-300">
          {children}
        </main>
      </div>

      {/* Keyboard-driven Command Palette (⌘K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
};

export const Logo = () => {
  return (
    <Link
      to={RouteDict.Home}
      className="flex items-center justify-start py-1 px-0 relative z-20 w-full"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center mr-2">
        <span className="font-mono text-xs font-bold text-primary">AL</span>
      </div>
      <span className="font-bold text-sm tracking-tight text-foreground">ALKAA OS</span>
    </Link>
  );
};
