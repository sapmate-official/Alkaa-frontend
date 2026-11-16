import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
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
  User,
  Sun,
  Moon,
  LogOut,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';
import RouteDict from '@/routes/RouteDict';
import { useAuth } from '@/providers/AuthContext';
import { useTheme } from '@/providers/ThemeProvider';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command, jump to module, or search..." />
      <CommandList className="max-h-[380px] custom-scrollbar">
        <CommandEmpty>No matching commands or destinations found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Home))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span>Command Center / Dashboard</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Employee.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <Users className="h-4 w-4 text-emerald-400" />
            <span>Workforce & Directory</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Onboarding.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-indigo-400" />
            <span>Onboarding Pipeline</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Attendance.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Attendance & Clock-In</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Leave.Requests.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <CalendarDays className="h-4 w-4 text-rose-400" />
            <span>Leaves & Time Off</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Task.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <CheckSquare className="h-4 w-4 text-sky-400" />
            <span>Tasks & Operations</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.System.ActivityLogs))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4 text-purple-400" />
            <span>Audit & Activity Logs</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Payroll.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <Coins className="h-4 w-4 text-amber-300" />
            <span>Payroll & Finance</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Billing.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <Receipt className="h-4 w-4 text-blue-400" />
            <span>Subscription & Billing</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Role.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <UserCog className="h-4 w-4 text-slate-400" />
            <span>Roles & Permissions</span>
          </CommandItem>

          {user?.id && (
            <CommandItem
              onSelect={() => handleSelect(() => navigate(RouteDict.Profile.Info(user.id)))}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
            >
              <User className="h-4 w-4 text-teal-400" />
              <span>My Profile & Revision History</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Attendance.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <Clock className="h-4 w-4 text-secondary" />
            <span>Quick Punch (Clock In / Out)</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Leave.Requests.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            <span>Apply for Time Off</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Onboarding.Base))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
            <span>Review Onboarding Candidates</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Preferences & Session">
          <CommandItem
            onSelect={() => handleSelect(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => navigate(RouteDict.Logout))}
            className="flex items-center gap-2 px-3 py-2 text-rose-400 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out / Terminate Session</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
