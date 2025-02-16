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
import { useEffect, useState } from 'react';
import { APIDictionary } from '@/api/APIdict';
import axios from 'axios';
import { ThemeToggle } from '@/components/ThemeSwitchButtonComponent';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';

interface MainLayoutProps {
  children: React.ReactNode;
}
interface linkType {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [, setIsUserLoading] = useState(true);
  const [links, setLinks] = useState<linkType[]>([]);
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [permissionList] = useAtom(permissionListAtom)

  const noSidebarPaths = ['/', '/auth/signin'];
  const shouldShowSidebar = !noSidebarPaths.includes(location.pathname) && 
    !location.pathname.startsWith('/reset-password');

  const fetchUserDetails = async () => {
    try {
      if (!user?.id) return;
      setIsUserLoading(true);
      const response = await axios.get(APIDictionary.userProfile(user?.id), { withCredentials: true });
      const data = response.data;
      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching user details", error);
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isLoading) {
      fetchUserDetails();
    }
  }, [user, isLoading]);

  useEffect(() => {
    const baseLinks = userDetails?.superAdmin ? [
      {
        label: "Organization",
        href: "/p/organization",
        icon: <IconHome className="h-5 w-5"/>
      },
      {
        label: "Permission",
        href: "/p/permission",
        icon: <IconUserCircle className="h-5 w-5"/>
      }
    ] : [
      // {
      //   label: "Attendance",
      //   href: "/p/attendance",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Profile",
      //   href: "/p/profile",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Leave Type",
      //   href: "/p/leavetype",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Leave Request",
      //   href: "/p/leaverequest",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Payroll",
      //   href: "/p/payroll",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Leave Balance",
      //   href: "/p/leavebalance",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Notification",
      //   href: "/p/notification",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Organization",
      //   href: "/p/organization",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Department",
      //   href: "/p/department",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
      // {
      //   label: "Roles & Permission",
      //   href: "/p/role",
      //   icon: <IconHome className="h-5 w-5"/>
      // },
    ];
    for (let i = 0; i < permissionList.length; i++) {
      const permission = permissionList[i];
      
      if (permission.module === "Attendance") {
      const attendanceExists = baseLinks.some(link => link.label === "Attendance");
      if (!attendanceExists) {
        baseLinks.push({
        label: "Attendance",
        href: "/p/attendance",
        icon: <IconUserBolt className="h-5 w-5"/>
        });
      }
      } else if (permission.module === "Profile") {
      if(baseLinks.some(link => link.label === "Profile")) continue;
      baseLinks.push({
        label: "Profile",
        href: "/p/profile",
        icon: <User2Icon className="h-5 w-5"/>
      });
      } else if (permission.name === "leave.read_types") {
      if(baseLinks.some(link => link.label === "Leave Type")) continue;
      baseLinks.push({
        label: "Leave Type",
        href: "/p/leavetype",
        icon: <Leaf className="h-5 w-5"/>
      });
      } else if (permission.name === "leave.request") {
      baseLinks.push({
        label: "Leave Request",
        href: "/p/leaverequest",
        icon: <IconClipboardList className="h-5 w-5"/>
      });
      } else if (permission.name === "payroll.view_own") {
      baseLinks.push({
        label: "Payroll",
        href: "/p/payroll",
        icon: <Coins className="h-5 w-5"/>
      });
      } else if (permission.name === "leave.view_all_leaves") {
      baseLinks.push({
        label: "Leave Balance",
        href: "/p/leavebalance",
        icon: <IconCalendarStats className="h-5 w-5"/>
      });
      } else if (permission.module === "Notification") {
      if(baseLinks.some(link => link.label === "Notification")) continue;
      baseLinks.push({
        label: "Notification",
        href: "/p/notification",
        icon: <IconClipboardList className="h-5 w-5"/>
      });
      } else if (permission.module === "Organization") {
      if(baseLinks.some(link => link.label === "Organization")) continue;
      baseLinks.push({
        label: "Organization",
        href: "/p/organization",
        icon: <IconHome className="h-5 w-5"/>
      });
      } else if (permission.name === "department.read") {
      baseLinks.push({
        label: "Department",
        href: "/p/department",
        icon: <IconUserCircle className="h-5 w-5"/>
      });
      } else if (permission.name === "Manage User Roles") {
      baseLinks.push({
        label: "Roles & Permission",
        href: "/p/role",
        icon: <Edit className="h-5 w-5"/>
      });
      }
    }
    setLinks(baseLinks);
  }, [userDetails,permissionList]);

  if (!shouldShowSidebar) {
    return <>{children}</>;
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
        {open ? <Logo /> : <LogoIcon />}
          <div className={`flex flex-col flex-1 ${open?`overflow-y-auto`:`overflow-y-hidden`} overflow-x-hidden custom-scrollbar`}>
        <div className=" flex flex-col gap-2">
          
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
          <ThemeToggle/>
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
        Alkaa
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



// const employeeLinks = [
//   {
//     label: "Dashboard",
//     href: "/p/",
//     icon: <IconHome className="h-5 w-5" />
//   },
//   {
//     label: "Leave Request",
//     href: "/p/leave-request",
//     icon: <IconClipboardList className="h-5 w-5" />
//   },
//   {
//     label: "Leave Status",
//     href: "/p/leave-status",
//     icon: <IconCalendarStats className="h-5 w-5" />
//   },
//   {
//     label: "Leave Balance",
//     href: "/p/leave-balance",
//     icon: <Coins className="h-5 w-5" />
//   },
//   {
//     label: "Profile",
//     href: `/p/profile/${user?.id}`,
//     icon: <User2Icon className="h-5 w-5" />
//   },
//   {
//     label: "Attendance",
//     href: `/p/attendance`,
//     icon: <IconUserBolt className="h-5 w-5" />
//   }
// ];

// const managerLinks = [
//   {
//     label: "Dashboard",
//     href: "/p/",
//     icon: <IconHome className="h-5 w-5" />
//   },
//   {
//     label: "Leave Requests",
//     href: "/p/leave-request",
//     icon: <IconClipboardList className="h-5 w-5" />
//   },
//   {
//     label: "Employee List",
//     href: "/p/employee-list",
//     icon: <IconUserCircle className="h-5 w-5" />
//   },
//   {
//     label: "Register Employee",
//     href: "/p/employee-create",
//     icon: <Edit className="h-5 w-5" />
//   },
//   {
//     label: "Create Leave Type",
//     href: "/p/leave-create",
//     icon: <Leaf className="h-5 w-5" />
//   },
//   {
//     label: "Profile",
//     href: `/p/profile/${user?.id}`,
//     icon: <User2Icon className="h-5 w-5" />
//   },
//   {
//     label: "Attendance",
//     href: `/p/attendance`,
//     icon: <IconUserBolt className="h-5 w-5" />
//   }
// ];