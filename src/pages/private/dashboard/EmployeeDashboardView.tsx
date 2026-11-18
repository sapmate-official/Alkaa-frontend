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
  CreditCard,
  ShieldCheck,
  CheckCircle,
  LogIn,
  LogOut,
  ChevronRight
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
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
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
      {/* 1. Welcome Banner & Active Shift Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="text-left">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1.5">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Employee Self-Service (ESS)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {userProfile?.firstName || 'Colleague'}
            </h1>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 rounded-lg border-border">
              {userProfile?.employeeId ? `ID: ${userProfile.employeeId}` : 'Active Staff'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {userProfile?.jobTitle || 'Team Member'}{' '}
            {userProfile?.department ? `• ${userProfile.department.name}` : ''}
          </p>
        </div>

        {/* Live Punch Status & Quick Apply Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/60 border border-border text-xs font-medium">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-foreground font-semibold">
              {isCheckedIn
                ? `Clocked In • ${formatTime(stats.todayAttendance?.checkInTime)}`
                : 'Not Checked In'}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(RouteDict.Leave.Requests.Base)}
            className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-xl shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Apply for Time Off</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Cards: Active Shift Punch & Compensation Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left (7 Columns): Shift Attendance & Punch Card */}
        <Card className="xl:col-span-7 bg-card border border-border shadow-sm rounded-2xl flex flex-col justify-between text-left">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Today's Shift Attendance
                </CardTitle>
                <CardDescription className="text-xs">
                  GPS Geofenced punch-in &amp; work hours
                </CardDescription>
              </div>
            </div>
            <div className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10">
              {currentClock}
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {/* Shift Progress Indicator */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5 text-xs">
                <span className="text-foreground font-semibold">Standard Shift: 8 Hours</span>
                <span className="text-primary font-bold">
                  {isCheckedIn ? 'Session In Progress' : 'Shift Not Started'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCheckedIn ? 'bg-emerald-500 w-[65%]' : 'bg-muted-foreground/30 w-0'
                  }`}
                />
              </div>
            </div>

            {/* Shift Punch Times Breakdown */}
            <div className="grid grid-cols-3 gap-3 py-3 px-4 rounded-xl bg-muted/40 border border-border text-center">
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-semibold block mb-0.5">
                  Clock In
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatTime(stats.todayAttendance?.checkInTime)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-semibold block mb-0.5">
                  Shift End Target
                </span>
                <span className="text-sm font-bold text-foreground">06:00 PM</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-semibold block mb-0.5">
                  Clock Out
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatTime(stats.todayAttendance?.checkOutTime)}
                </span>
              </div>
            </div>

            {/* Geofence Validation & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-medium">
                <ShieldCheck className="h-4 w-4" />
                <span>Geofence GPS Verified</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isCheckedIn ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => checkOutMutation.mutate({ notes: 'Shift completed' })}
                    disabled={checkOutMutation.isPending}
                    className="h-9 px-4 text-xs font-semibold gap-1.5 rounded-xl"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Clock Out</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => checkInMutation.mutate({ notes: 'Punching from ESS Portal' })}
                    disabled={checkInMutation.isPending}
                    className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl shadow-xs"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Clock In Now</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(RouteDict.Attendance.Base)}
                  className="h-9 px-3.5 text-xs font-medium rounded-xl border-border"
                >
                  View Timesheet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right (5 Columns): Compensation & Payroll Card */}
        <Card className="xl:col-span-5 bg-card border border-border shadow-sm rounded-2xl flex flex-col justify-between text-left">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Compensation &amp; Payroll
                </CardTitle>
                <CardDescription className="text-xs">
                  Monthly disbursement &amp; tax slips
                </CardDescription>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
              Direct Deposit
            </span>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Estimated Net Monthly</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight mt-1.5">
                {userProfile?.monthlySalary
                  ? `₹${Number(userProfile.monthlySalary).toLocaleString('en-IN')}`
                  : 'Confidential'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Statutory deductions (PF, TDS) applied automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground text-[11px] block font-medium">Payroll Cycle</span>
                <span className="font-bold text-foreground">Monthly (End of Month)</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block font-medium">Disbursement Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Regular On-Time</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 font-semibold text-primary hover:text-primary/90 p-0 h-auto hover:bg-transparent"
                onClick={() => navigate(RouteDict.Payroll.Base)}
              >
                View Latest Payslip <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(RouteDict.Payroll.Base)}
                className="text-xs h-8 px-3 rounded-xl border-border"
              >
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Leave Balances & Quota Grid */}
      <div className="text-left">
        <div className="flex justify-between items-center mb-3.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Leave Quota &amp; Balances</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-primary hover:text-primary/90 gap-1"
            onClick={() => navigate(RouteDict.Leave.Requests.Base)}
          >
            Leave History <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.leaveBalances.length === 0 ? (
            <Card className="col-span-full py-8 text-center text-xs text-muted-foreground rounded-2xl border border-border">
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
                  className="shadow-sm border border-border bg-card hover:border-primary/50 transition-all p-5 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground uppercase font-bold tracking-wider truncate max-w-[140px]">
                      {balance.name}
                    </span>
                    <span className="text-xs text-primary font-bold">{pct}% Left</span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-foreground">
                      {balance.remaining}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      / {balance.total} days
                    </span>
                  </div>

                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="text-xs text-muted-foreground block font-medium">
                    {balance.used} days used this cycle
                  </span>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Recent Leaves & Upcoming Holidays (2 Column Split) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 text-left">
        {/* Recent Leave Submissions */}
        <Card className="shadow-sm bg-card border border-border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-border">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                My Recent Requests
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                History of leave submissions &amp; approvals
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary/90 font-medium"
              onClick={() => navigate(RouteDict.Leave.Requests.Base)}
            >
              All Requests
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.recentLeaves.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No recent leave requests recorded.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentLeaves.map((leave) => {
                  const isApproved = leave.status === 'APPROVED';
                  const isPending = leave.status === 'PENDING';
                  return (
                    <div key={leave.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-sm text-foreground">
                          {leave.leaveType?.name || 'Leave'}
                        </span>
                        <div className="text-muted-foreground text-xs mt-0.5 font-medium">
                          {new Date(leave.startDate).toLocaleDateString()} —{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant={
                          isApproved
                            ? 'success'
                            : isPending
                            ? 'warning'
                            : 'destructive'
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
        <Card className="shadow-sm bg-card border border-border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-border">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Upcoming Company Holidays
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Statutory and organization calendar holidays
              </CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            {stats.upcomingHolidays.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No upcoming holidays scheduled this month.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.upcomingHolidays.map((holiday) => (
                  <div key={holiday.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{holiday.name}</span>
                    </div>
                    <span className="text-muted-foreground font-medium text-xs">
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

      {/* 5. Navigation Utilities Strip */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-3 text-left">
        <Card
          className="p-4 flex items-center justify-between hover:border-primary/50 cursor-pointer transition-all border border-border shadow-sm rounded-2xl group"
          onClick={() => {
            if (userProfile?.id) {
              navigate(RouteDict.Profile.Info(userProfile.id));
            } else {
              navigate(RouteDict.Home);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">My Profile</div>
              <div className="text-[11px] text-muted-foreground">Personal &amp; bank records</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Card>

        <Card
          className="p-4 flex items-center justify-between hover:border-primary/50 cursor-pointer transition-all border border-border shadow-sm rounded-2xl group"
          onClick={() => navigate(RouteDict.Attendance.Base)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Attendance Logs</div>
              <div className="text-[11px] text-muted-foreground">Timesheet &amp; punch records</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Card>

        <Card
          className="p-4 flex items-center justify-between hover:border-primary/50 cursor-pointer transition-all border border-border shadow-sm rounded-2xl group"
          onClick={() => navigate(RouteDict.Payroll.Base)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Payslips &amp; Tax Slips</div>
              <div className="text-[11px] text-muted-foreground">Monthly compensation breakdown</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboardView;
