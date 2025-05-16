import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext';
import { Users, Clock, CalendarDays, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAtom } from 'jotai';
import { dashboardDataAtom, specialEventsAtom } from '@/store/atom';
import { AttendanceRecord, User } from '@/interface/general';
import { SpecialEvents } from '@/components/dashboard/SpecialEvents';

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
        
        // If we already have data, don't fetch again
        if (dashboardData) {
          setIsLoading(false);
          return;
        }
        
        const [dashboardResponse, attendanceResponse, specialEventsResponse] = await Promise.all([
          axios.get(`${APIDictionary.dashboard(user.id)}`, { withCredentials: true }),
          axios.get(`${APIDictionary.attendance}/manager/live/${user?.id}`, { withCredentials: true }),
          axios.get(`${APIDictionary.events}`, { withCredentials: true })
        ]);
        
        setAttendanceData(attendanceResponse?.data?.attendanceRecords || {});
        setEmployee(attendanceResponse?.data?.users || []);
        setDashboardData(dashboardResponse?.data);
        
        if (specialEventsResponse?.data?.success) {
          setSpecialEvents(specialEventsResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
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
    <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onClick}>
      <CardContent className="flex items-center p-6">
        {icon}
        <div className="ml-4">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
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
    <Card>
      <CardContent className="flex items-center p-6">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="ml-4 w-full">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-3 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 w-full h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={refreshDashboard} variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button onClick={() => navigate('/p/attendance')}>Mark Attendance</Button>
          <Button onClick={() => navigate('/p/leaverequest/create')} variant="outline">
            Request Leave
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
                            <td className="py-3">{employee.name}</td>
                            <td className={`py-3 ${status === "Present" ? "text-green-600" : "text-red-600"}`}>
                              {status}
                            </td>
                            <td className="py-3">{checkInTime}</td>
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

        {/* Special Events Display */}
        <SpecialEvents events={specialEvents} isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
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
                icon={<Users className="h-6 w-6 text-primary" />}
                onClick={() => navigate('/p/profile')}
              />
              <QuickActionCard
                title="Leave Balance"
                description="Check your remaining leave balance"
                icon={<CalendarDays className="h-6 w-6 text-primary" />}
                onClick={() => navigate('/p/leavebalance')}
              />
              <QuickActionCard
                title="Attendance History"
                description="View your attendance records"
                icon={<Clock className="h-6 w-6 text-primary" />}
                onClick={() => navigate('/p/attendance/history')}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;