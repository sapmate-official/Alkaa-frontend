// import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {  IconUserBolt } from '@tabler/icons-react';
// import { motion } from 'framer-motion';
// import React from 'react';
// import { Link } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import {
  IconHome,
  IconClipboardList,
  IconCalendarStats,
  IconUserCircle,
  IconLogout,
} from '@tabler/icons-react';
import { Coins, Edit, Leaf, User2Icon } from 'lucide-react';
import {  motion } from 'framer-motion';
import { useState } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}


export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const noSidebarPaths = ['/', '/auth/signin'];
  const shouldShowSidebar = !noSidebarPaths.includes(location.pathname) && 
  !location.pathname.startsWith('/reset-password');
  
  if (!shouldShowSidebar) {
    return <>{children}</>;
  }
  const employeeLinks = [
    {
      label: "Dashboard",
      href: "/p/",
      icon: <IconHome className="h-5 w-5" />
    },
    {
      label: "Leave Request",
      href: "/p/leave-request",
      icon: <IconClipboardList className="h-5 w-5" />
    },
    {
      label: "Leave Status",
      href: "/p/leave-status",
      icon: <IconCalendarStats className="h-5 w-5" />
    },
    {
      label: "Leave Balance",
      href: "/p/leave-balance",
      icon: <Coins className="h-5 w-5" />
    },
    {
      label: "Profile",
      href: `/p/profile/${user?.id}`,
      icon: <User2Icon className="h-5 w-5" />
    },
    {
      label: "Attendance",
      href: `/p/attendance`,
      icon: <IconUserBolt className="h-5 w-5" />
    }
  ];
  
  const managerLinks = [
    {
      label: "Dashboard",
      href: "/p/",
      icon: <IconHome className="h-5 w-5" />
    },
    {
      label: "Leave Requests",
      href: "/p/leave-request",
      icon: <IconClipboardList className="h-5 w-5" />
    },
    {
      label: "Employee List",
      href: "/p/employee-list",
      icon: <IconUserCircle className="h-5 w-5" />
    },
    {
      label: "Register Employee",
      href: "/p/employee-create",
      icon: <Edit className="h-5 w-5" />
    },
    {
      label: "Create Leave Type",
      href: "/p/leave-create",
      icon: <Leaf className="h-5 w-5" />
    },
    {
      label: "Profile",
      href: `/p/profile/${user?.id}`,
      icon: <User2Icon className="h-5 w-5" />
    },
    {
      label: "Attendance",
      href: `/p/attendance`,
      icon: <IconUserBolt className="h-5 w-5" />
    }
  ];
  const links = [];
  if (user?.role === 'EMPLOYEE') {
    links.push(...employeeLinks);
  } else if (user?.role === 'MANAGER') {
    links.push(...managerLinks);
  }

  return(
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row  w-full flex-1 max-w-screen mx-auto border border- dark:border-neutral-700 overflow-hidden",
        "h-screen" 
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              <SidebarLink link={{ label: "Logout", href: "/p/logout", icon: <IconLogout className="h-5 w-5" /> }} />
            </div>

          </div>
          <div>
            <SidebarLink
              link={{
                label: user?.name || "User",
                href: `/p/profile/${user?.id}`,
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      {/* <Dashboard/> */}
      
      {children}
    </div>
  )
}
export const Logo = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Sapmate LLC
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link
      to="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};

