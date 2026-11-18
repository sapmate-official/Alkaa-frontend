import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthContext';
import { ThemeToggle } from '@/components/ThemeSwitchButtonComponent';
import { useTodaySessionsQuery } from '@/hooks/queries/useAttendance';
import RouteDict from '@/routes/RouteDict';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Menu,
  Clock,
  User as UserIcon,
  LogOut,
  Building2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface AppTopBarProps {
  onOpenCommandPalette: () => void;
  onToggleSidebar?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  onOpenCommandPalette,
  onToggleSidebar,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: todaySessions = [] } = useTodaySessionsQuery(undefined, Boolean(user?.id));

  const isSuperAdmin = Boolean(user?.superAdmin || user?.isSuperAdmin);
  const isOrgAdmin = Boolean(
    (user as { roles?: (string | { role?: { name?: string }; name?: string })[] })?.roles?.some(
      (r) =>
        typeof r === 'string'
          ? ['Org_Admin', 'Admin', 'SUPER_ADMIN'].includes(r)
          : ['Org_Admin', 'Admin', 'SUPER_ADMIN'].includes(r?.role?.name || r?.name || '')
    )
  );
  const roleLabel = isSuperAdmin ? 'Super Admin' : isOrgAdmin ? 'Org Admin' : 'Staff';
  const activeSession = todaySessions.find((s) => s.checkInTime && !s.checkOutTime);
  const isClockedIn = Boolean(activeSession);

  const orgName =
    (user as { organization?: { name?: string } } | null)?.organization?.name ||
    'ALKAA Enterprise';
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.firstName || user?.email || 'AK').slice(0, 2).toUpperCase();

  const formatClockTime = (isoString?: string | Date) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <header className="h-14 w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle, Brand & Tenant Selector */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link to={RouteDict.Home} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-primary to-emerald-400 p-[1px] shadow-sm">
            <div className="w-full h-full bg-card rounded-[7px] flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-primary group-hover:scale-105 transition-transform">
                AL
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
              ALKAA <span className="text-xs font-normal text-muted-foreground font-mono">OS</span>
            </span>
          </div>
        </Link>

        <div className="h-4 w-px bg-border hidden sm:block mx-1" />

        {/* Tenant Selector Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium text-foreground max-w-[140px] truncate">{orgName}</span>
          <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-background border border-border text-muted-foreground uppercase">
            PROD
          </span>
        </div>
      </div>

      {/* Center: Command Palette Trigger Input */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full h-9 px-3 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border text-left text-xs text-muted-foreground flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="truncate">Press ⌘K to search or jump to module...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] font-medium bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Punch, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Punch Status Widget */}
        <div
          onClick={() => navigate(RouteDict.Attendance.Base)}
          className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border cursor-pointer transition-colors"
          title="Click to view Attendance"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <div className="text-xs">
            <span className="font-medium text-foreground">
              {isClockedIn ? 'In Office' : 'Not Clocked In'}
            </span>
            {isClockedIn && (
              <span className="text-muted-foreground font-mono ml-1.5 text-[11px]">
                • {formatClockTime(activeSession?.checkInTime)}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono font-medium text-primary ml-1 pl-1.5 border-l border-border hover:underline">
            Quick Punch
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="h-4 w-px bg-border" />

        {/* User Clearance & Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted/60 transition-colors outline-none">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs font-bold text-primary">
                {userInitials}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                  isClockedIn ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
                {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : 'User'}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground leading-tight flex items-center gap-1">
                {roleLabel}
                <ChevronDown className="h-2.5 w-2.5" />
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1">
            <DropdownMenuLabel className="p-2">
              <div className="text-xs font-semibold text-foreground truncate">
                {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : 'Account'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
              {orgName && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-primary font-mono truncate">
                  <Building2 className="h-3 w-3" /> {orgName}
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {!isSuperAdmin && user?.id && (
              <DropdownMenuItem
                onClick={() => navigate(RouteDict.Profile.Info(user.id))}
                className="cursor-pointer text-xs flex items-center gap-2"
              >
                <UserIcon className="h-3.5 w-3.5 text-teal-400" />
                <span>My Profile & Revision History</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => navigate(RouteDict.Attendance.Base)}
              className="cursor-pointer text-xs flex items-center gap-2"
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Timesheet & Attendance</span>
            </DropdownMenuItem>

            {isSuperAdmin && (
              <DropdownMenuItem
                onClick={() => navigate(RouteDict.Organization.Base)}
                className="cursor-pointer text-xs flex items-center gap-2"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Super Admin Panel</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => navigate(RouteDict.Logout)}
              className="cursor-pointer text-xs text-rose-500 focus:text-rose-500 flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
