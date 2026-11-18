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
  PanelLeftClose,
  PanelLeftOpen,
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

  const renderSidebarContent = (collapsed: boolean) => (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col h-full justify-between py-3 px-2 select-none">
        <div className="flex flex-col gap-2 min-h-0 flex-1">
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

          {/* Tenant Crest Header */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-muted/30 border border-primary/20 flex items-center justify-center cursor-default shrink-0 group">
                  <span className="font-mono text-xs font-bold text-primary group-hover:scale-105 transition-transform">
                    {orgName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-sans">
                <p className="font-bold">{orgName}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {isSuperAdmin ? 'Platform Root' : 'Production Tenant'}
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="px-2.5 py-2 rounded-xl bg-muted/40 border border-border flex items-center justify-between shrink-0">
              <div className="flex flex-col overflow-hidden pr-1">
                <span className="font-bold text-xs text-foreground truncate">{orgName}</span>
                <span className="font-mono text-[10px] text-muted-foreground truncate">
                  {isSuperAdmin ? 'Platform Root' : 'Production Tenant'}
                </span>
              </div>
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            </div>
          )}

          {/* Navigation Groups */}
          <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pt-1 pr-0.5">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="flex flex-col gap-0.5">
                {group.groupTitle && (
                  collapsed ? (
                    <div className="my-1 mx-2 border-t border-border/40" />
                  ) : (
                    <span className="px-2.5 py-1 font-mono text-[9px] font-semibold text-muted-foreground tracking-wider uppercase">
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
                          'relative flex items-center rounded-lg transition-all group font-medium',
                          collapsed
                            ? 'w-10 h-10 mx-auto justify-center text-xs'
                            : 'justify-between px-2.5 py-1.5 text-xs',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold shadow-xs' +
                                (!collapsed ? ' border-l-2 border-primary' : ' ring-1 ring-primary/30')
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="shrink-0 transition-colors group-hover:text-foreground">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {item.badge != null && (
                        collapsed ? (
                          <span
                            className={cn(
                              'absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ring-card',
                              item.badgeVariant === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-primary'
                            )}
                          />
                        ) : (
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

        {/* Bottom Section: Quota & Collapse Controller */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border shrink-0">
          {!isSuperAdmin && (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 mx-auto rounded-xl bg-muted/30 border border-border flex flex-col items-center justify-center cursor-default">
                    <span className="text-[10px] font-mono font-bold text-primary">{seatPercentage}%</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-0.5 animate-pulse" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-sans">
                  <p className="font-bold">Seat Quota: {seatPercentage}%</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {activeEmployees} / {totalEmployees} active • Healthy
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border flex flex-col gap-1.5">
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
            )
          )}

          {/* Desktop Toggle Button */}
          {onToggleCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className={cn(
                    'hidden md:flex items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150',
                    collapsed
                      ? 'w-10 h-10 mx-auto justify-center'
                      : 'w-full justify-between px-2.5 py-1.5 text-xs'
                  )}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <div className="flex items-center gap-2 truncate">
                    {collapsed ? (
                      <PanelLeftOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                    {!collapsed && <span className="font-medium">Collapse</span>}
                  </div>
                  {!collapsed && (
                    <kbd className="font-mono text-[9px] bg-muted/80 px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                      [
                    </kbd>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-sans">
                  <span>Expand sidebar ( [ )</span>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {!collapsed && (
            <div className="flex items-center justify-between px-2 text-[10px] font-mono text-muted-foreground">
              <span>ALKAA Enterprise</span>
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
          'hidden md:flex shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 bg-card/40 backdrop-blur-md border-r border-border flex-col transition-all duration-300 ease-in-out z-30 select-none',
          isCollapsed ? 'w-[68px]' : 'w-[240px]'
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
