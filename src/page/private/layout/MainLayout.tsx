import { cn } from '@/lib/utils';
import {
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';
import { FaUserCheck, FaRegIdCard, FaCoins, FaReceipt } from 'react-icons/fa';
import { BsCalendarWeek, BsBank, BsFileText, BsCalendarEvent } from 'react-icons/bs';
import { IoLogOutOutline } from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../services/AuthContext';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Leaf, User2Icon, ShieldCheck, UserCog, Activity, UserPlus, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { ThemeToggle } from '@/components/ThemeSwitchButtonComponent';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import RouteDict from '@/routes/RouteDict';

// Constant ranking for sidebar links to maintain consistent order
const SIDEBAR_LINK_RANKING: Record<string, number> = {
  "Dashboard": 1,
  "Organization": 2,
  "Permission": 3,
  "Onboarding": 4,
  "Department": 5,
  "Roles & Permission": 6,
  "Profile": 7,
  "Attendance": 8,
  "Leave Type": 9,
  "Leave Request": 10,
  "Leave Balance": 11,
  "Holiday": 12,
  "Tasks": 13,
  "Activity Logs": 14,
  "Payroll": 15,
  "Billing": 16,
  "Notification": 17,
  "Logout": 18
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
  const [leaveRequestsNumber, setLeaveRequestsNumber] = useState(0);

  const noSidebarPaths = ['/', '/auth/signin'];
  const shouldShowSidebar = !noSidebarPaths.includes(location.pathname) &&
    !location.pathname.startsWith('/reset-password');


  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(`${APIDictionary.leave_request}/manager/${user?.id}`, { withCredentials: true })
      if (response.status === 200) {
        setLeaveRequestsNumber(response.data.some((request: any) => request.status === "Pending") ? response.data.length : 0);
      }
    } catch (error) {
      console.log("Error fetching leave requests", error);

    }
  }
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
      fetchLeaveRequests()
    }
  }, [user, isLoading]);

  useEffect(() => {
    const baseLinks = userDetails?.superAdmin ? [
      {
        label: "Organization",
        href: RouteDict.Organization.Base,
        icon: <BsBank className="h-5 w-5" />
      },
      {
        label: "Permission",
        href: RouteDict.Permission.Base,
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
            href: RouteDict.Attendance.Base,
            icon: <FaUserCheck className="h-5 w-5" />
          });
        }
      } 
      else if (permission.key === "view_personal_info_to_myself") {
        if (baseLinks.some(link => link.label === "Profile")) continue;
        baseLinks.push({
          label: "Profile",
          href: RouteDict.Profile.Info(user?.id || ""),
          icon: <FaRegIdCard className="h-5 w-5" />
        });
      } else if (permission.key === "create_user") {
        if (baseLinks.some(link => link.label === "Onboarding")) continue;
        baseLinks.push({
          label: "Onboarding",
          href: RouteDict.Onboarding.Base,
          icon: <UserPlus className="h-5 w-5" />
        });
      } else if (permission?.key === "read_leave_type") {
        if (baseLinks.some(link => link.label === "Leave Type")) continue;
        baseLinks.push({
          label: "Leave Type",
          href: RouteDict.Leave.Types.List,
          icon: <Leaf className="h-5 w-5" />
        });
      } else if (permission.key === "leave_request" ) {
        baseLinks.push({
          label: `Leave Request  ${leaveRequestsNumber > 0 ? `(${leaveRequestsNumber})` : ""}`,
          href: RouteDict.Leave.Requests.Base,
          icon: <BsFileText className="h-5 w-5" />
        });
      } else if (permission.key === "view_leave_balance") {
        if (baseLinks.some(link => link.label === "Leave Balance")) continue;
        baseLinks.push({
          label: "Leave Balance",
          href: RouteDict.Leave.Balance.Base,
          icon: <BsCalendarWeek className="h-5 w-5" />
        });
      } 
      // else if (permission.module === "Notification") {
      //   if (baseLinks.some(link => link.label === "Notification")) continue;
      //   baseLinks.push({
      //     label: "Notification",
      //     href: RouteDict.Notification.Base,
      //     icon: <FaRegBell className="h-5 w-5" />
      //   });
      // }
       else if (permission.module === "Organization") {
        if (baseLinks.some(link => link.label === "Organization")) continue;
        baseLinks.push({
          label: "Organization",
          href: RouteDict.Organization.Base,
          icon: <BsBank className="h-5 w-5" />
        });
      } else if (permission?.key === "view_own_department_info" || permission?.key === "view_list_of_department" || permission?.key === "view_all_department_info") {
        if (baseLinks.some(link => link.label === "Department")) continue;
        baseLinks.push({
          label: "Department",
          href: RouteDict.Department.Base,
          icon: <HiOutlineBuildingOffice2 className="h-5 w-5" />
        });
      } else if (permission.name === "Manage User Roles") {
        baseLinks.push({
          label: "Roles & Permission",
          href: RouteDict.Role.Base,
          icon: <UserCog className="h-5 w-5" />
        });
      } else if (permission?.key === "view_holiday") {
        baseLinks.push({
          label: "Holiday",
          href: RouteDict.Holiday.Base,
          icon: <BsCalendarEvent className="h-5 w-5" />
        });
      } else if (permission?.key === "view_all_activities" || permission?.key === "view_subordinate_activities") {
        if (baseLinks.some(link => link.label === "Activity Logs")) continue;
        baseLinks.push({
          label: "Activity Logs",
          href: RouteDict.System.ActivityLogs,
          icon: <Activity className="h-5 w-5" />
        });
      } else if (permission?.key === "view_salary_slip_to_myself") {
        baseLinks.push({
          label: "Payroll",
          href: RouteDict.Payroll.Base,
          icon: <FaCoins className="h-5 w-5" />
        });
      } 
      // else if (permission?.key === "view_employee_management") {
      //   baseLinks.push({
      //     label: "Employees",
      //     href: "/p/employee/manage",
      //     icon: <IconUsers className="h-5 w-5" />
      //   });
      // }
       else if (permission?.key === "view_billing") {
        baseLinks.push({
          label: "Billing",
          href: RouteDict.Billing.Base,
          icon: <FaReceipt className="h-5 w-5" />
        });
      } else if (permission?.key === "task_create" || permission?.key === "task_view_all" || permission?.key === "task_manage_all") {
        if (baseLinks.some(link => link.label === "Tasks")) continue;
        baseLinks.push({
          label: "Tasks",
          href: RouteDict.Task.Base,
          icon: <ClipboardList className="h-5 w-5" />
        });
      }
    }
    baseLinks.push({
      label: "Dashboard",
      href: RouteDict.Dashboard,
      icon: <Activity className="h-5 w-5" />
    })
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
              <SidebarLink link={{ label: "Logout", href: RouteDict.Logout, icon: <IoLogOutOutline className="h-5 w-5" /> }} />
            </div>
          </div>
          <div className={`flex ${open ? 'flex-row items-center' : 'flex-col items-center'} gap-2 mt-1 pt-2 border-t border-neutral-200 dark:border-neutral-700`}>
            <div className={`${open ? 'flex-1' : 'w-full'}`}>
              <SidebarLink
                link={{
                  label: ` ${user?.firstName} ${user?.lastName}` || "User",
                  href: RouteDict.Profile.Info(user?.id || ""),
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
      to={RouteDict.Home}
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
      to={RouteDict.Home}
      className="flex items-center justify-center py-1 relative z-20 w-full"
    >
      <div className="h-9 w-9">
        <img src="/logo_icon.svg" alt="Alkaa Logo" className="h-full w-full object-contain" />
      </div>
    </Link>
  );
};