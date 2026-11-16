import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/providers/AuthContext';
import { useDashboardSummaryQuery } from '@/hooks/queries/useDashboardSummary';
import RouteDict from '@/routes/RouteDict';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  CalendarDays,
  CheckSquare,
  ShieldAlert,
  Coins,
  Receipt,
  UserCog,
  ShieldCheck,
  Building2,
  X,
  Sparkles,
} from 'lucide-react';

interface AppSidebarRailProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string | null;
  badgeVariant?: 'default' | 'warning' | 'destructive';
}

interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

export const AppSidebarRail: React.FC<AppSidebarRailProps> = ({
  mobileOpen = false,
  onMobileClose,
}) => {
  const { user } = useAuth();
  const { data: summary } = useDashboardSummaryQuery(user?.id);

  const isSuperAdmin = Boolean(user?.superAdmin || user?.isSuperAdmin);
  const orgName =
    (user as { organization?: { name?: string } } | null)?.organization?.name ||
    'Sapmate Training HQ';

  // Extract pending badges from dashboard summary
  const pendingLeaves = summary?.adminStats?.pendingLeaves ?? 0;
  const pendingCandidates = summary?.adminStats?.onboardingPending ?? 0;
  const activeEmployees = summary?.adminStats?.activeEmployees ?? 1;
  const totalEmployees = Math.max(summary?.adminStats?.totalEmployees ?? 1, 1);
  const seatPercentage = Math.min(100, Math.round((activeEmployees / totalEmployees) * 100));

  const navGroups: NavGroup[] = isSuperAdmin
    ? [
        {
          groupTitle: 'SUPER ADMIN',
          items: [
            {
              label: 'Command Center',
              href: RouteDict.Home,
              icon: <LayoutDashboard className="h-4 w-4" />,
            },
            {
              label: 'Organizations',
              href: RouteDict.Organization.Base,
              icon: <Building2 className="h-4 w-4" />,
            },
            {
              label: 'Permissions Matrix',
              href: RouteDict.Permission.Base,
              icon: <ShieldCheck className="h-4 w-4" />,
            },
            {
              label: 'Billing & Subscriptions',
              href: RouteDict.Billing.Base,
              icon: <Receipt className="h-4 w-4" />,
            },
          ],
        },
      ]
    : [
        {
          groupTitle: 'CORE',
          items: [
            {
              label: 'Command Center',
              href: RouteDict.Home,
              icon: <LayoutDashboard className="h-4 w-4" />,
            },
          ],
        },
        {
          groupTitle: 'PEOPLE',
          items: [
            {
              label: 'Workforce Directory',
              href: RouteDict.Employee.Base,
              icon: <Users className="h-4 w-4" />,
            },
            {
              label: 'Onboarding Pipeline',
              href: RouteDict.Onboarding.Base,
              icon: <UserCheck className="h-4 w-4" />,
              badge: pendingCandidates > 0 ? pendingCandidates : null,
              badgeVariant: 'warning',
            },
            {
              label: 'Departments',
              href: RouteDict.Department.Base,
              icon: <Building2 className="h-4 w-4" />,
            },
          ],
        },
        {
          groupTitle: 'TIME & OPS',
          items: [
            {
              label: 'Attendance & Clock',
              href: RouteDict.Attendance.Base,
              icon: <Clock className="h-4 w-4" />,
            },
            {
              label: 'Leaves & Balances',
              href: RouteDict.Leave.Requests.Base,
              icon: <CalendarDays className="h-4 w-4" />,
              badge: pendingLeaves > 0 ? pendingLeaves : null,
              badgeVariant: 'warning',
            },
            {
              label: 'Tasks & Ops',
              href: RouteDict.Task.Base,
              icon: <CheckSquare className="h-4 w-4" />,
            },
          ],
        },
        {
          groupTitle: 'GOVERNANCE',
          items: [
            {
              label: 'Activity & Audit Logs',
              href: RouteDict.System.ActivityLogs,
              icon: <ShieldAlert className="h-4 w-4" />,
            },
            {
              label: 'Roles & Access',
              href: RouteDict.Role.Base,
              icon: <UserCog className="h-4 w-4" />,
            },
          ],
        },
        {
          groupTitle: 'FINANCE',
          items: [
            {
              label: 'Payroll & Slips',
              href: RouteDict.Payroll.Base,
              icon: <Coins className="h-4 w-4" />,
            },
            {
              label: 'Billing & Plans',
              href: RouteDict.Billing.Base,
              icon: <Receipt className="h-4 w-4" />,
            },
          ],
        },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between py-3 px-2 select-none">
      <div className="flex flex-col gap-3">
        {/* Mobile Header with close button */}
        <div className="md:hidden flex items-center justify-between pb-2 border-b border-border px-2">
          <span className="font-bold text-sm tracking-tight text-foreground">ALKAA OS</span>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tenant Micro Crest */}
        <div className="px-2.5 py-2 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
          <div className="flex flex-col overflow-hidden pr-1">
            <span className="font-bold text-xs text-foreground truncate">{orgName}</span>
            <span className="font-mono text-[10px] text-muted-foreground truncate">
              {isSuperAdmin ? 'Platform Root' : 'Production Tenant'}
            </span>
          </div>
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        </div>

        {/* Navigation Groups */}
        <nav className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar pr-0.5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col gap-0.5">
              {group.groupTitle && (
                <span className="px-2.5 py-1 font-mono text-[9px] font-semibold text-muted-foreground tracking-wider uppercase">
                  {group.groupTitle}
                </span>
              )}
              {group.items.map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.href}
                  onClick={() => onMobileClose?.()}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )
                  }
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="shrink-0 transition-colors group-hover:text-foreground">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge != null && (
                    <span
                      className={cn(
                        'font-mono text-[10px] px-1.5 py-0.2 rounded-full border',
                        item.badgeVariant === 'warning'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Group: Seat Allocation Progress & Diagnostic Status */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        {!isSuperAdmin && (
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-muted-foreground uppercase font-semibold">SEAT QUOTA</span>
              <span className="text-primary font-bold">{seatPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${seatPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
              <span>
                {activeEmployees} / {totalEmployees} active
              </span>
              <span className="text-emerald-500 font-medium">● Healthy</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2 text-[10px] font-mono text-muted-foreground">
          <span>ALKAA Enterprise</span>
          <span>v2.5</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-[220px] shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 bg-card/40 backdrop-blur-md border-r border-border flex-col transition-colors z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={onMobileClose}
        >
          <div
            className="w-[260px] h-full bg-card border-r border-border shadow-xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
