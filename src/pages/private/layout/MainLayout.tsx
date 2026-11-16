import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Split Layout: Sidebar + Canvas */}
      <div className="flex flex-1 w-full overflow-hidden">
        <AppSidebarRail
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar h-[calc(100vh-3.5rem)] bg-background">
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-10 w-full max-w-[160px]"
      >
        <img src="/logo.svg" alt="Alkaa Logo" className="h-full w-full object-contain" />
      </motion.div>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      to={RouteDict.Home}
      className="flex items-center justify-center py-1 relative z-20 w-full"
    >
      <div className="h-8 w-8">
        <img src="/logo_icon.svg" alt="Alkaa Logo" className="h-full w-full object-contain" />
      </div>
    </Link>
  );
};

export default MainLayout;
