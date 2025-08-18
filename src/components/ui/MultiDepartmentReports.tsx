import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { multiDepartmentApi } from '@/api/multiDepartmentApi';
import { useToast } from '@/hooks/use-toast';

interface MultiDepartmentReportsProps {
  className?: string;
}

interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  totalUsers: number;
  primaryUsers: number;
  secondaryUsers: number;
  utilization: number;
  avgAssignmentsPerUser: number;
}

interface CrossDepartmentData {
  userId: string;
  userName: string;
  departments: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
    role?: string;
  }>;
  collaborationScore: number;
}

interface AttendanceData {
  date: string;
  department: string;
  present: number;
  absent: number;
  late: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MultiDepartmentReports: React.FC<MultiDepartmentReportsProps> = ({
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [crossDepartmentData, setCrossDepartmentData] = useState<CrossDepartmentData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const { toast } = useToast();

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch department statistics (using placeholder organization ID)
      const orgId = '1'; // This should come from context or props
      const deptStatsResponse = await multiDepartmentApi.getDepartmentsWithStats(orgId);
      setDepartmentStats(deptStatsResponse.departments || []);

      // Fetch cross-department collaboration data (using org chart data)
      const crossDeptResponse = await multiDepartmentApi.getMultiDepartmentOrgChart(orgId);
      setCrossDepartmentData(crossDeptResponse.users || []);

      // Fetch activity logs for multi-department assignments (simulating attendance data)
      const attendanceResponse = await multiDepartmentApi.getDepartmentAssignmentLogs(undefined, undefined, 100);
      setAttendanceData(attendanceResponse.logs || []);

    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedDateRange]);

  const exportReport = async (reportType: string) => {
    try {
      // Implementation for report export
      toast({
        title: 'Export Started',
        description: `Exporting ${reportType} report...`
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export report',
        variant: 'destructive'
      });
    }
  };

  const getTotalMultiDepartmentUsers = () => {
    return crossDepartmentData.filter(user => user.departments.length > 1).length;
  };

  const getAverageDepartmentsPerUser = () => {
    if (crossDepartmentData.length === 0) return 0;
    const total = crossDepartmentData.reduce((sum, user) => sum + user.departments.length, 0);
    return (total / crossDepartmentData.length).toFixed(2);
  };

  const getDepartmentUtilizationData = () => {
    return departmentStats.map(dept => ({
      name: dept.departmentName,
      primary: dept.primaryUsers,
      secondary: dept.secondaryUsers,
      total: dept.totalUsers,
      utilization: dept.utilization
    }));
  };

  const getCollaborationDistribution = () => {
    const distribution: { [key: number]: number } = {};
    
    crossDepartmentData.forEach(user => {
      const deptCount = user.departments.length;
      distribution[deptCount] = (distribution[deptCount] || 0) + 1;
    });

    return Object.entries(distribution).map(([count, users]) => ({
      departments: `${count} Dept${count !== '1' ? 's' : ''}`,
      users: users,
      percentage: ((users / crossDepartmentData.length) * 100).toFixed(1)
    }));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Multi-Department Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Multi-Department Reports & Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReportsData()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('multi-department')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-muted-foreground">Multi-Dept Users</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {getTotalMultiDepartmentUsers()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {crossDepartmentData.length > 0 && 
                      `${((getTotalMultiDepartmentUsers() / crossDepartmentData.length) * 100).toFixed(1)}% of total`
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-muted-foreground">Avg Departments</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {getAverageDepartmentsPerUser()}
                  </div>
                  <div className="text-sm text-muted-foreground">per user</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-muted-foreground">Total Departments</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {departmentStats.length}
                  </div>
                  <div className="text-sm text-muted-foreground">active departments</div>
                </CardContent>
              </Card>
            </div>

            {/* Department Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Department User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getDepartmentUtilizationData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="primary" name="Primary Users" fill="#8884d8" />
                    <Bar dataKey="secondary" name="Secondary Users" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Utilization Tab */}
          <TabsContent value="utilization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Department Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentStats.map((dept) => (
                      <div key={dept.departmentId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{dept.departmentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {dept.totalUsers} users • {dept.primaryUsers} primary • {dept.secondaryUsers} secondary
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={dept.utilization > 80 ? 'default' : dept.utilization > 50 ? 'secondary' : 'outline'}>
                            {dept.utilization}% utilized
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Utilization Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getDepartmentUtilizationData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, utilization }) => `${name}: ${utilization}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="utilization"
                      >
                        {getDepartmentUtilizationData().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Multi-Department Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getCollaborationDistribution()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="departments" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" name="Number of Users" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Collaborative Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {crossDepartmentData
                      .filter(user => user.departments.length > 1)
                      .sort((a, b) => b.departments.length - a.departments.length)
                      .slice(0, 10)
                      .map((user) => (
                        <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{user.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.departments.map(d => d.name).join(', ')}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {user.departments.length} depts
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>
              <div className="flex gap-2">
                {[
                  { value: '7d', label: '7 Days' },
                  { value: '30d', label: '30 Days' },
                  { value: '90d', label: '90 Days' }
                ].map((range) => (
                  <Button
                    key={range.value}
                    variant={selectedDateRange === range.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDateRange(range.value)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multi-Department Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#8884d8" name="Present" />
                    <Line type="monotone" dataKey="absent" stroke="#ff7c7c" name="Absent" />
                    <Line type="monotone" dataKey="late" stroke="#ffc658" name="Late" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MultiDepartmentReports;
