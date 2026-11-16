import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CalendarDays,
  FileText,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Coins,
  ShieldCheck,
  CheckCircle,
  LogIn,
  LogOut,
} from 'lucide-react';
import RouteDict from '@/routes/RouteDict';
import { useCheckInMutation, useCheckOutMutation } from '@/hooks/queries/useAttendance';

export interface EmployeeDashboardViewProps {
  userProfile?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    jobTitle?: string | null;
    department?: { name: string } | null;
    organization?: { name: string } | null;
    monthlySalary?: number | string | null;
  } | null;
  stats: {
    leaveBalances: { id: string; name: string; used: number; remaining: number; total: number }[];
    todayAttendance?: { status: string; checkInTime: string; checkOutTime?: string | null } | null;
    recentLeaves: { id: string; status: string; startDate: string; endDate: string; leaveType: { name: string } }[];
    upcomingHolidays: { id: string; name: string; date: string }[];
  };
  onRefresh: () => void;
  isLoading: boolean;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({
  userProfile,
  stats,
  onRefresh: _onRefresh,
  isLoading: _isLoading,
}) => {
  const navigate = useNavigate();
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();
  const [currentClock, setCurrentClock] = useState<string>('');

  const isCheckedIn = Boolean(stats.todayAttendance?.checkInTime && !stats.todayAttendance?.checkOutTime);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentClock(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner & Action Cluster */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur border border-border rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-foreground font-medium">My Cockpit</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {userProfile?.firstName || 'Colleague'}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              ID: {userProfile?.employeeId || 'STAFF'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {userProfile?.jobTitle || 'Team Member'}{' '}
            {userProfile?.department ? `• ${userProfile.department.name}` : ''}
          </p>
        </div>

        {/* Quick Actions Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-foreground">
              {isCheckedIn
                ? `Active Session • ${formatTime(stats.todayAttendance?.checkInTime)}`
                : 'Not Checked In'}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(RouteDict.Leave.Requests.Base)}
            className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Apply for Time Off</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Cards Grid: Active Shift Tracker + Compensation (7:5 ratio) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left (7 Columns): Active Shift Tracker Card */}
        <Card className="xl:col-span-7 bg-card/60 backdrop-blur border border-border shadow-xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground">
                Active Shift Tracker
              </CardTitle>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] ${
                  isCheckedIn
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCheckedIn ? 'IN_SESSION' : 'OFFLINE'}
              </Badge>
            </div>
            <div className="font-mono text-xs font-bold text-primary">{currentClock}</div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Shift Session Stats */}
            <div>
              <div className="flex justify-between items-baseline mb-1 text-xs">
                <span className="font-mono text-foreground font-semibold">Standard Shift: 8h 00m</span>
                <span className="font-mono text-primary font-medium">
                  {isCheckedIn ? 'Clocked In' : 'Ready'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCheckedIn ? 'bg-emerald-500 w-[65%]' : 'bg-muted-foreground/30 w-0'
                  }`}
                />
              </div>
            </div>

            {/* Key Meta Grid */}
            <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-muted/40 border border-border text-center">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-0.5">
                  FIRST PUNCH
                </span>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {formatTime(stats.todayAttendance?.checkInTime)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-0.5">
                  SIGN-OFF TARGET
                </span>
                <span className="text-sm font-mono font-semibold text-foreground">06:00 PM</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-0.5">
                  LAST CHECKOUT
                </span>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {formatTime(stats.todayAttendance?.checkOutTime)}
                </span>
              </div>
            </div>

            {/* Verification & Punch Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Geofence GPS Verified</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isCheckedIn ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => checkOutMutation.mutate({ notes: 'Shift completed' })}
                    disabled={checkOutMutation.isPending}
                    className="h-8 px-3 text-xs gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Clock Out</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => checkInMutation.mutate({ notes: 'Punching from Cockpit' })}
                    disabled={checkInMutation.isPending}
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Clock In Now</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(RouteDict.Attendance.Base)}
                  className="h-8 px-3 text-xs"
                >
                  Timesheet History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right (5 Columns): Financial & Compensation Summary Card */}
        <Card className="xl:col-span-5 bg-card/60 backdrop-blur border border-border shadow-xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground">
                Compensation & Payroll
              </CardTitle>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
              Direct Deposit
            </span>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>ESTIMATED NET MONTHLY</span>
                <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-3 w-3" /> Disbursed Active
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-foreground tracking-tight mt-1">
                {userProfile?.monthlySalary
                  ? `₹${Number(userProfile.monthlySalary).toLocaleString()}`
                  : 'Confidential'}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Tax declarations and payslip artifacts stored in Vault
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs font-mono">
              <div>
                <span className="text-muted-foreground text-[10px] block">PAYROLL CYCLE</span>
                <span className="font-semibold text-foreground">Monthly (Last Day)</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] block">STATUS</span>
                <span className="font-semibold text-emerald-500">Regular</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 font-mono p-0 h-auto text-primary hover:bg-transparent hover:underline"
                onClick={() => navigate(RouteDict.Payroll.Base)}
              >
                View Payslip PDF & Taxes <ArrowRight className="h-3 w-3" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(RouteDict.Payroll.Base)}
                className="text-xs h-7 px-2.5"
              >
                Payslips
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Leave Quota & Allocation Bento Grid (4 Columns) */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Leave Quota & Balances</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 font-mono"
            onClick={() => navigate(RouteDict.Leave.Requests.Base)}
          >
            Leave Policy Details <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.leaveBalances.length === 0 ? (
            <Card className="col-span-full py-6 text-center text-xs text-muted-foreground">
              No leave policies allocated yet.
            </Card>
          ) : (
            stats.leaveBalances.map((balance, bIdx) => {
              const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500'];
              const color = colors[bIdx % colors.length];
              const pct = balance.total > 0 ? Math.round((balance.remaining / balance.total) * 100) : 0;

              return (
                <Card
                  key={balance.id}
                  className="shadow-xs border border-border bg-card/60 backdrop-blur hover:border-primary/40 transition-colors p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground uppercase font-medium truncate max-w-[140px]">
                      {balance.name}
                    </span>
                    <span className="font-mono text-xs text-primary font-bold">{pct}%</span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold font-mono text-foreground">
                      {balance.remaining}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      / {balance.total} days
                    </span>
                  </div>

                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground block">
                    {balance.used} days utilized this cycle
                  </span>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Operational Grid: My Recent Leaves & Upcoming Holidays (2 Columns) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Recent Leave Requests */}
        <Card className="shadow-xs bg-card/60 backdrop-blur border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                My Recent Requests
              </CardTitle>
              <CardDescription className="text-xs">
                History of leave submissions and manager sign-off
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-mono"
              onClick={() => navigate(RouteDict.Leave.Requests.Base)}
            >
              All Requests
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.recentLeaves.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No recent leave requests recorded.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentLeaves.map((leave) => {
                  const isApproved = leave.status === 'APPROVED';
                  const isPending = leave.status === 'PENDING';
                  return (
                    <div key={leave.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-sm text-foreground">
                          {leave.leaveType?.name || 'Leave'}
                        </span>
                        <div className="text-muted-foreground font-mono text-[11px] mt-0.5">
                          {new Date(leave.startDate).toLocaleDateString()} —{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px]'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-[10px]'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-mono text-[10px]'
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays Calendar */}
        <Card className="shadow-xs bg-card/60 backdrop-blur border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Upcoming Holidays
              </CardTitle>
              <CardDescription className="text-xs">
                Statutory and organization calendar holidays
              </CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            {stats.upcomingHolidays.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No upcoming holidays scheduled this month.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.upcomingHolidays.map((holiday) => (
                  <div key={holiday.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-sm text-foreground">{holiday.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-xs">
                      {new Date(holiday.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Navigation Utilities (Profile & Edits, Timesheet, Payslips) */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card
          className="p-4 flex items-center gap-3 hover:bg-muted/40 cursor-pointer transition-colors border border-border shadow-xs"
          onClick={() => {
            if (userProfile?.id) {
              navigate(RouteDict.Profile.Info(userProfile.id));
            } else {
              navigate(RouteDict.Home);
            }
          }}
        >
          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">My Profile & Revision History</div>
            <div className="text-xs text-muted-foreground">View details, self-edits & audit diffs</div>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-3 hover:bg-muted/40 cursor-pointer transition-colors border border-border shadow-xs"
          onClick={() => navigate(RouteDict.Attendance.Base)}
        >
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Attendance & Timesheet</div>
            <div className="text-xs text-muted-foreground">Clock-in records, GPS & session logs</div>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-3 hover:bg-muted/40 cursor-pointer transition-colors border border-border shadow-xs"
          onClick={() => navigate(RouteDict.Payroll.Base)}
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Payslips & Taxes</div>
            <div className="text-xs text-muted-foreground">Monthly breakdown & tax slips</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboardView;
