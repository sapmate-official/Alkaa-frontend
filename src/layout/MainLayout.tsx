import { cn } from '@/lib/utils';
import { 
  IconBuildingSkyscraper, 
  IconUserBolt,
  IconCalendarStats,
  IconLogout,
  IconBuildingBank,
  IconId,
  IconUsers,
  IconFileDescription,
  IconBellRinging,
  IconCalendarEvent,
  IconCoin
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Leaf, User2Icon, ShieldCheck, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { ThemeToggle } from '@/components/ThemeSwitchButtonComponent';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';

// Constant ranking for sidebar links to maintain consistent order
const SIDEBAR_LINK_RANKING: Record<string, number> = {
  "Organization": 1,
  "Permission": 2,
  "Employees": 3,
  "Department": 4,
  "Roles & Permission": 5,
  "Profile": 6,
  "Attendance": 7,
  "Leave Type": 8,
  "Leave Request": 9,
  "Leave Balance": 10,
  "Holiday": 11,
  "New Payroll": 12,
  "Notification": 13,
  "Logout": 14
};

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
  const [permissionList] = useAtom(permissionListAtom);

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
        icon: <IconBuildingBank className="h-5 w-5" />
      },
      {
        label: "Permission",
        href: "/p/permission",
        icon: <ShieldCheck className="h-5 w-5" />
      }
    ] : [];

    for (let i = 0; i < permissionList?.length; i++) {
      const permission = permissionList[i];

      if (permission.key === "mark_attendance") {
        const attendanceExists = baseLinks.some(link => link.label === "Attendance");
        if (!attendanceExists) {
          baseLinks.push({
            label: "Attendance",
            href: "/p/attendance",
            icon: <IconUserBolt className="h-5 w-5" />
          });
        }
      } else if (permission.key === "view_personal_info_to_myself") {
        if (baseLinks.some(link => link.label === "Profile")) continue;
        baseLinks.push({
          label: "Profile",
          href: "/p/profile",
          icon: <IconId className="h-5 w-5" />
        });
      } else if (permission?.key === "read_leave_type") {
        if (baseLinks.some(link => link.label === "Leave Type")) continue;
        baseLinks.push({
          label: "Leave Type",
          href: "/p/leavetype",
          icon: <Leaf className="h-5 w-5" />
        });
      } else if (permission.key === "leave_request") {
        baseLinks.push({
          label: "Leave Request",
          href: "/p/leaverequest",
          icon: <IconFileDescription className="h-5 w-5" />
        });
      } else if (permission.key === "view_leave_balance") {
        if (baseLinks.some(link => link.label === "Leave Balance")) continue;
        baseLinks.push({
          label: "Leave Balance",
          href: "/p/leavebalance",
          icon: <IconCalendarStats className="h-5 w-5" />
        });
      } else if (permission.module === "Notification") {
        if (baseLinks.some(link => link.label === "Notification")) continue;
        baseLinks.push({
          label: "Notification",
          href: "/p/notification",
          icon: <IconBellRinging className="h-5 w-5" />
        });
      } else if (permission.module === "Organization") {
        if (baseLinks.some(link => link.label === "Organization")) continue;
        baseLinks.push({
          label: "Organization",
          href: "/p/organization",
          icon: <IconBuildingBank className="h-5 w-5" />
        });
      } else if (permission?.key === "view_own_department_info" || permission?.key === "view_list_of_department" || permission?.key === "view_all_department_info") {
        if (baseLinks.some(link => link.label === "Department")) continue;
        baseLinks.push({
          label: "Department",
          href: "/p/department",
          icon: <IconBuildingSkyscraper className="h-5 w-5" />
        });
      } else if (permission.name === "Manage User Roles") {
        baseLinks.push({
          label: "Roles & Permission",
          href: "/p/role",
          icon: <UserCog className="h-5 w-5" />
        });
      } else if (permission.name === "holiday.read") {
        baseLinks.push({
          label: "Holiday",
          href: "/p/holiday",
          icon: <IconCalendarEvent className="h-5 w-5" />
        });
      } else if (permission?.key === "view_salary_slip_to_myself") {
        baseLinks.push({
          label: "New Payroll",
          href: "/p/new-payroll",
          icon: <IconCoin className="h-5 w-5" />
        });
      } else if (permission?.key === "view_employee_management") {
        baseLinks.push({
          label: "Employees",
          href: "/p/employee/manage",
          icon: <IconUsers className="h-5 w-5" />
        });
      }
    }

    // Sort links based on their ranking
    baseLinks.sort((a, b) => {
      const rankA = SIDEBAR_LINK_RANKING[a.label] || 999;
      const rankB = SIDEBAR_LINK_RANKING[b.label] || 999;
      return rankA - rankB;
    });

    setLinks(baseLinks);
  }, [userDetails, permissionList]);

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row  w-full flex-1 max-w-screen mx-auto border border- dark:border-neutral-700 overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4">
          {open ? <Logo /> : <LogoIcon />}
          <div className={`flex flex-col flex-1 ${open ? `overflow-y-auto` : `overflow-y-hidden`} overflow-x-hidden custom-scrollbar`}>
            <div className="flex flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              <SidebarLink link={{ label: "Logout", href: "/p/logout", icon: <IconLogout className="h-5 w-5" /> }} />
            </div>
          </div>
          <div className={`flex ${open ? 'flex-row items-center' : 'flex-col items-center'} gap-2 mt-1 pt-2 border-t border-neutral-200 dark:border-neutral-700`}>
            <div className={`${open ? 'flex-1' : 'w-full'}`}>
              <SidebarLink
                link={{
                  label: ` ${user?.firstName} ${user?.lastName}` || "User",
                  href: `/p/profile/${user?.id}`,
                  icon: userDetails?.avatar ? (
                    <img
                      src={userDetails?.avatar}
                      alt="avatar"
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <User2Icon className="h-5 w-5" />
                  )
                }}
              />
            </div>
            {open && <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700"></div>}
            <div className={`${open ? '' : 'w-full flex justify-center'}`}>
              <ThemeToggle />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      {children}
    </div>
  );
};

export const Logo = () => {
  return (
    <Link
      to="/p/"
      className="flex items-center justify-start py-1 px-0 relative z-20 w-full"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-12 w-full max-w-[180px]"
      >
        <img src="/logo.svg" alt="Alkaa Logo" className="h-full w-full object-contain" />
      </motion.div>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      to="/p/"
      className="flex items-center justify-center py-1 relative z-20 w-full"
    >
      <div className="h-9 w-9">
        <img src="/logo_icon.svg" alt="Alkaa Logo" className="h-full w-full object-contain" />
      </div>
    </Link>
  );
};