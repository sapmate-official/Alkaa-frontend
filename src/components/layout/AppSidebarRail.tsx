import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/providers/AuthContext';
import { useDashboardSummaryQuery } from '@/hooks/queries/useDashboardSummary';
import RouteDict from '@/routes/RouteDict';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutGrid,
  Users2,
  UserPlus,
  Network,
  Clock,
  CalendarCheck,
  ListTodo,
  History,
  KeyRound,
  Wallet,
  CreditCard,
  Building2,
  ShieldCheck,
  X,
  PanelLeft,
} from 'lucide-react';

interface AppSidebarRailProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const { data: summary } = useDashboardSummaryQuery(user?.id);

  const isSuperAdmin = Boolean(user?.superAdmin || user?.isSuperAdmin);
  const orgName =
    (user as { organization?: { name?: string } } | null)?.organization?.name ||
    'ShapeNXT';

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
              icon: <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              label: 'Organizations',
              href: RouteDict.Organization.Base,
              icon: <Building2 className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              label: 'Permissions Matrix',
              href: RouteDict.Permission.Base,
              icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              label: 'Billing & Subscriptions',
              href: RouteDict.Billing.Base,
              icon: <CreditCard className="h-4 w-4" strokeWidth={1.75} />,
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
              icon: <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />,
            },
          ],
        },
        {
          groupTitle: 'PEOPLE',
          items: [
            {
              label: 'Workforce Directory',
              href: RouteDict.Employee.Base,
              icon: <Users2 className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              label: 'Onboarding Pipeline',
              href: RouteDict.Onboarding.Base,
              icon: <UserPlus className="h-4 w-4" strokeWidth={1.75} />,
              badge: pendingCandidates > 0 ? pendingCandidates : null,
              badgeVariant: 'warning',
            },
            {
              label: 'Departments',
              href: RouteDict.Department.Base,
              icon: <Network className="h-4 w-4" strokeWidth={1.75} />,
            },
          ],
        },
        {
          groupTitle: 'TIME & OPS',
          items: [
            {
              label: 'Attendance & Clock',
              href: RouteDict.Attendance.Base,
              icon: <Clock className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              label: 'Leaves & Balances',
              href: RouteDict.Leave.Requests.Base,
              icon: <CalendarCheck className="h-4 w-4" strokeWidth={1.75} />,
              badge: pendingLeaves > 0 ? pendingLeaves : null,
              badgeVariant: 'warning',
            },
            {
              label: 'Tasks & Ops',
              href: RouteDict.Task.Base,
              icon: <ListTodo className="h-4 w-4" strokeWidth={1.75} />,
            },
          ],
        },
        {
          groupTitle: 'GOVERNANCE',
          items: [
            {
              label: 'Activity & Audit Logs',
              href: RouteDict.System.ActivityLogs,
              icon: <History className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              label: 'Roles & Access',
              href: RouteDict.Role.Base,
              icon: <KeyRound className="h-4 w-4" strokeWidth={1.75} />,
            },
          ],
        },
        {
          groupTitle: 'FINANCE',
          items: [
            {
              label: 'Payroll & Slips',
              href: RouteDict.Payroll.Base,
              icon: <Wallet className="h-4 w-4" strokeWidth={1.75} />,
            },
            {
              label: 'Billing & Plans',
              href: RouteDict.Billing.Base,
              icon: <CreditCard className="h-4 w-4" strokeWidth={1.75} />,
            },
          ],
        },
      ];

  const renderSidebarContent = (collapsed: boolean) => (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col h-full justify-between py-2 px-2 select-none">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Mobile Header with close button */}
          <div className="md:hidden flex items-center justify-between pb-2 mb-2 border-b border-border/80 px-2">
            <span className="font-semibold text-sm tracking-tight text-foreground">ALKAA OS</span>
            {onMobileClose && (
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Claude-style Top Header: [PanelLeft] + Org Name */}
          <div className="flex items-center justify-between px-1.5 py-1 mb-2 shrink-0">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleCollapse}
                    className="w-9 h-9 mx-auto rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                    aria-label="Expand sidebar"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium text-xs">Expand sidebar ( [ )</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 min-w-0">
                  {onToggleCollapse && (
                    <button
                      onClick={onToggleCollapse}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Collapse sidebar ([)"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>
                  )}
                  <span className="font-semibold text-sm text-foreground truncate tracking-tight">
                    {orgName}
                  </span>
                </div>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-muted/70 text-muted-foreground uppercase border border-border/50 shrink-0">
                  {isSuperAdmin ? 'Root' : 'Tenant'}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pt-0.5 pr-0.5">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="flex flex-col gap-0.5">
                {group.groupTitle && (
                  collapsed ? (
                    <div className="my-1 mx-3 border-t border-border/40" />
                  ) : (
                    <span className="px-2.5 pt-2 pb-1 font-mono text-[9px] font-semibold text-muted-foreground/80 tracking-wider uppercase">
                      {group.groupTitle}
                    </span>
                  )
                )}

                {group.items.map((item, idx) => {
                  const itemButton = (
                    <NavLink
                      key={idx}
                      to={item.href}
                      onClick={() => onMobileClose?.()}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center transition-colors font-medium',
                          collapsed
                            ? 'w-9 h-9 mx-auto justify-center rounded-lg text-xs'
                            : 'justify-between px-2.5 py-1.5 rounded-lg text-sm',
                          isActive
                            ? 'bg-muted text-foreground font-medium shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="shrink-0">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {item.badge != null && (
                        collapsed ? (
                          <span
                            className={cn(
                              'absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ring-2 ring-card',
                              item.badgeVariant === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-primary'
                            )}
                          />
                        ) : (
                          <span
                            className={cn(
                              'font-mono text-[10px] px-1.5 py-0.2 rounded-full border',
                              item.badgeVariant === 'warning'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-muted text-muted-foreground border-border/60'
                            )}
                          >
                            {item.badge}
                          </span>
                        )
                      )}
                    </NavLink>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          {itemButton}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-sans">
                          <div className="flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {item.badge != null && (
                              <span className="font-mono text-[10px] text-amber-400 font-bold">
                                ({item.badge})
                              </span>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return itemButton;
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Quota & Version */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/80 shrink-0">
          {!isSuperAdmin && (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-9 h-9 mx-auto rounded-lg bg-muted/40 hover:bg-muted/70 flex flex-col items-center justify-center cursor-default transition-colors">
                    <span className="text-[10px] font-mono font-bold text-foreground">{seatPercentage}%</span>
                    <span className="h-1 w-1 rounded-full bg-emerald-400 mt-0.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-sans">
                  <p className="font-medium text-xs">Seat Quota: {seatPercentage}%</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {activeEmployees} / {totalEmployees} active
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-muted-foreground uppercase font-semibold">SEAT QUOTA</span>
                  <span className="text-foreground font-bold">{seatPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-foreground/70 h-full rounded-full transition-all duration-300"
                    style={{ width: `${seatPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                  <span>
                    {activeEmployees} / {totalEmployees} active
                  </span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    Healthy
                  </span>
                </div>
              </div>
            )
          )}

          {!collapsed && (
            <div className="flex items-center justify-between px-2 text-[10px] font-mono text-muted-foreground">
              <span>ALKAA OS</span>
              <span>v2.5</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop Fixed Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 bg-card/95 border-r border-border/80 flex-col transition-all duration-200 ease-out z-30 select-none',
          isCollapsed ? 'w-[56px]' : 'w-[230px]'
        )}
      >
        {renderSidebarContent(isCollapsed)}
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
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
