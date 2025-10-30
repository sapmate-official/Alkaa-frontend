import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { useAuth } from '@/providers/AuthContext';
import { Users, Clock, CalendarDays, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import axios from 'axios';
import { useAtom } from 'jotai';
import { dashboardDataAtom, specialEventsAtom } from '@/store/atom';
import { AttendanceRecord, User } from '@/types/general';
import { SpecialEvents } from '@/components/dashboard/SpecialEvents';
import { EmploymentTypeBadge } from '@/components/employment/EmploymentTypeBadge';
import { EmploymentType } from '@/types/employmentType';

interface ModifiedUser extends User {
  name: string;
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useAtom(dashboardDataAtom);
  const [specialEvents, setSpecialEvents] = useAtom(specialEventsAtom);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord[]>>({});
  const [employeeList, setEmployee] = useState<ModifiedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!user?.id) return;
        
        if (dashboardData) {
          setIsLoading(false);
          
          Promise.all([
            axios.get(`${APIDictionary.attendance}/manager/live/${user?.id}`, { withCredentials: true }),
            axios.get(`${APIDictionary.events}`, { withCredentials: true })
          ]).then(([attendanceResponse, specialEventsResponse]) => {
            setAttendanceData(attendanceResponse?.data?.attendanceRecords || {});
            setEmployee(attendanceResponse?.data?.users || []);
            if (specialEventsResponse?.data?.success) {
              setSpecialEvents(specialEventsResponse.data.data);
            }
          }).catch(error => {
            console.error('Error fetching background data:', error);
          });
          return;
        }
        
        // Initial load - fetch essential data first for faster UI rendering
        const dashboardResponse = await axios.get(`${APIDictionary.dashboard(user.id)}`, { withCredentials: true });
        setDashboardData(dashboardResponse?.data);
        setIsLoading(false); // Show UI immediately after essential data loads
        
        // Fetch non-critical data in parallel after UI is rendered
        Promise.all([
          axios.get(`${APIDictionary.attendance}/manager/live/${user?.id}`, { withCredentials: true }),
          axios.get(`${APIDictionary.events}`, { withCredentials: true })
        ]).then(([attendanceResponse, specialEventsResponse]) => {
          setAttendanceData(attendanceResponse?.data?.attendanceRecords || {});
          setEmployee(attendanceResponse?.data?.users || []);
          if (specialEventsResponse?.data?.success) {
            setSpecialEvents(specialEventsResponse.data.data);
          }
        }).catch(error => {
          console.error('Error fetching additional data:', error);
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, dashboardData, setDashboardData, setSpecialEvents]);

  // Add a refresh function for manual updates
  const refreshDashboard = async () => {
    try {
      setIsLoading(true);
      if (!user?.id) return;

      const [dashboardResponse, attendanceResponse, specialEventsResponse] = await Promise.all([
        axios.get(`${APIDictionary.dashboard(user.id)}`, { withCredentials: true }),
        axios.get(`${APIDictionary.attendance}/manager/live/${user?.id}`, { withCredentials: true }),
        axios.get(`${APIDictionary.events}`, { withCredentials: true })
      ]);
      
      setAttendanceData(attendanceResponse?.data?.attendanceRecords || {});
      console.log('attendanceResponse', attendanceResponse?.data?.attendanceRecords || {});
      
      setEmployee(attendanceResponse?.data?.users || []);
      setDashboardData(dashboardResponse.data);
      
      if (specialEventsResponse?.data?.success) {
        setSpecialEvents(specialEventsResponse.data.data);
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickActionCard = ({ title, description, icon, onClick }:{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
  }) => (
    <Card className="cursor-pointer hover:bg-accent transition-colors h-fit" onClick={onClick}>
      <CardContent className="flex items-center p-4 md:p-6 gap-3 md:gap-4 min-w-0">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm md:text-base truncate">{title}</h3>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  // Skeleton components for loading states
  const MetricCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12" />
      </CardContent>
    </Card>
  );

  const TableRowSkeleton = () => (
    <tr className="border-t border-gray-100">
      <td className="py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="py-3"><Skeleton className="h-4 w-16" /></td>
      <td className="py-3"><Skeleton className="h-4 w-20" /></td>
    </tr>
  );

  // const ActivitySkeleton = () => (
  //   <div className="flex items-start space-x-4">
  //     <Skeleton className="h-5 w-5 rounded-full" />
  //     <div className="space-y-2 w-full">
  //       <Skeleton className="h-4 w-full" />
  //       <Skeleton className="h-3 w-24" />
  //     </div>
  //   </div>
  // );

  const QuickActionSkeleton = () => (
    <Card className="h-fit">
      <CardContent className="flex items-center p-4 md:p-6 gap-3 md:gap-4">
        <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full max-w-32" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 w-full h-full overflow-y-auto max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          {user?.employmentType && (
            <EmploymentTypeBadge
              employmentType={user.employmentType as EmploymentType}
              size="sm"
              showLabel={false}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={refreshDashboard} variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button onClick={() => navigate(RouteDict.Attendance.Base)} size="sm">Mark Attendance</Button>
          <Button onClick={() => navigate(RouteDict.Leave.Requests.Base)} variant="outline" size="sm">
            Request Leave
          </Button>
        </div>
      </div>

      {/* Contract Warning Banner */}
      {user?.contractEndDate && (() => {
        const now = new Date();
        const endDate = new Date(user.contractEndDate);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
        
        if (isExpiringSoon) {
          return (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Contract Expiring Soon</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Your contract ends in {daysRemaining} days ({endDate.toLocaleDateString()}).
                      Please contact your manager or HR for renewal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Key Metrics */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalEmployees || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.presentToday || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.pendingLeaves || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.recentActivities?.length || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts & Activity Feed */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] overflow-hidden">
              {isLoading ? (
                <div className="space-y-4 max-h-[300px]">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-semibold text-muted-foreground">
                        <th className="text-left py-2">Employee</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Check In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(5)].map((_, index) => (
                        <TableRowSkeleton key={index} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-semibold text-muted-foreground">
                        <th className="text-left py-2">Employee</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Check In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeList.map((employee) => {
                        const employeeAttendance = attendanceData[employee.id] || [];
                        const todayAttendance = employeeAttendance.length > 0 ? employeeAttendance[0] : null;
                        const status = todayAttendance ? "Present" : "Absent";
                        const checkInTime = todayAttendance?.checkInTime ? new Date(todayAttendance?.checkInTime)?.toLocaleTimeString() : "-";
                        
                        return (
                          <tr key={employee.id} className="border-t border-gray-100">
                            <td className="py-3 truncate max-w-[120px]">{employee.name}</td>
                            <td className={`py-3 ${status === "Present" ? "text-green-600" : "text-red-600"}`}>
                              {status}
                            </td>
                            <td className="py-3 text-sm">{checkInTime}</td>
                          </tr>
                        );
                      })}
                      {employeeList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-muted-foreground">
                            No employee data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Special Events Display - constrained height */}
        <div className="col-span-1 max-h-[400px] overflow-hidden">
          <SpecialEvents events={specialEvents} isLoading={isLoading} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <QuickActionSkeleton />
              <QuickActionSkeleton />
              <QuickActionSkeleton />
            </>
          ) : (
            <>
              <QuickActionCard
                title="View Profile"
                description="Check and update your profile information"
                icon={<Users className="h-6 w-6 text-primary flex-shrink-0" />}
                onClick={() => navigate(RouteDict.Profile.Base)}
              />
              <QuickActionCard
                title="Leave Balance"
                description="Check your remaining leave balance"
                icon={<CalendarDays className="h-6 w-6 text-primary flex-shrink-0" />}
                onClick={() => navigate(RouteDict.Leave.Base)}
              />
              <QuickActionCard
                title="Attendance History"
                description="View your attendance records"
                icon={<Clock className="h-6 w-6 text-primary flex-shrink-0" />}
                onClick={() => navigate(RouteDict.Attendance.Base)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;