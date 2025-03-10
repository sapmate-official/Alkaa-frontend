import  { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext';
import { Users, Clock, CalendarDays, Activity, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAtom } from 'jotai';
import { dashboardDataAtom } from '@/store/atom';
import Loader from '@/components/Loader';




const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useAtom(dashboardDataAtom);
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

        const response = await axios.get(`${APIDictionary.dashboard(user.id)}`, { 
          withCredentials: true 
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, dashboardData, setDashboardData]);

  // Add a refresh function for manual updates
  const refreshDashboard = async () => {
    try {
      setIsLoading(true);
      if (!user?.id) return;

      const response = await axios.get(`${APIDictionary.dashboard(user.id)}`, { 
        withCredentials: true 
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickActionCard = ({ title, description, icon, onClick }:{
    title: string;
    description: string;
    icon: JSX.Element;
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

  if (isLoading) {
    return <Loader/>
  }

  return (
    <div className="p-6 space-y-6 w-full h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={refreshDashboard} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={() => navigate('/p/attendance')}>Mark Attendance</Button>
          <Button onClick={() => navigate('/p/leaverequest/create')} variant="outline">
            Request Leave
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.presentToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.pendingLeaves}</div>
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
      </div>

      {/* Charts & Activity Feed */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.attendanceStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#22c55e" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(dashboardData?.recentActivities || []).map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
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
        </div>
      </div>
    </div>
  );
};

export default Home;