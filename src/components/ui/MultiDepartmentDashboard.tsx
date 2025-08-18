import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Search, 
  Download,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import MultiDepartmentReports from './MultiDepartmentReports';
import MultiDepartmentSearch from './MultiDepartmentSearch';
import DepartmentAssignmentHistory from './DepartmentAssignmentHistory';
import MultiDepartmentUserDetail from './MultiDepartmentUserDetail';
import { multiDepartmentApi } from '@/api/multiDepartmentApi';
import { useToast } from '@/hooks/use-toast';
import { User, Department } from '@/interface/general';

interface MultiDepartmentDashboardProps {
  orgId: string;
  className?: string;
}

interface DashboardStats {
  totalUsers: number;
  multiDepartmentUsers: number;
  totalDepartments: number;
  avgDepartmentsPerUser: number;
  recentAssignments: number;
  pendingMigrations: number;
}

const MultiDepartmentDashboard: React.FC<MultiDepartmentDashboardProps> = ({
  orgId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    multiDepartmentUsers: 0,
    totalDepartments: 0,
    avgDepartmentsPerUser: 0,
    recentAssignments: 0,
    pendingMigrations: 0
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      // Fetch departments with statistics
      const deptResponse = await multiDepartmentApi.getDepartmentsWithStats(orgId);
      const departmentData = deptResponse.departments || [];
      setDepartments(departmentData);

      // Fetch organization chart for user data
      const orgChartResponse = await multiDepartmentApi.getMultiDepartmentOrgChart(orgId);
      const users = orgChartResponse.users || [];

      // Calculate dashboard statistics
      const multiDeptUsers = users.filter((user: User) => 
        user.userDepartments && user.userDepartments.length > 1
      );

      const totalAssignments = users.reduce((sum: number, user: User) => 
        sum + (user.userDepartments?.length || 0), 0
      );

      // Fetch recent activity
      const activityResponse = await multiDepartmentApi.getDepartmentAssignmentLogs(undefined, undefined, 10);
      const recentAssignments = activityResponse.logs?.length || 0;

      setDashboardStats({
        totalUsers: users.length,
        multiDepartmentUsers: multiDeptUsers.length,
        totalDepartments: departmentData.length,
        avgDepartmentsPerUser: users.length > 0 ? +(totalAssignments / users.length).toFixed(2) : 0,
        recentAssignments: recentAssignments,
        pendingMigrations: 0 // This would come from migration API
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchDashboardData();
    }
  }, [orgId]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setActiveTab('user-details');
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const exportDashboardData = async () => {
    try {
      await multiDepartmentApi.exportDepartmentAssignments(orgId, 'xlsx');
      toast({
        title: 'Export Started',
        description: 'Dashboard data export has been initiated'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export dashboard data',
        variant: 'destructive'
      });
    }
  };

  const getMultiDepartmentPercentage = () => {
    if (dashboardStats.totalUsers === 0) return '0';
    return ((dashboardStats.multiDepartmentUsers / dashboardStats.totalUsers) * 100).toFixed(1);
  };

  const getTopDepartmentsByUsers = () => {
    return departments
      .filter(dept => dept.primaryUsers || dept.secondaryUsers)
      .sort((a, b) => {
        const aTotal = (a.primaryUsers?.length || 0) + (a.secondaryUsers?.length || 0);
        const bTotal = (b.primaryUsers?.length || 0) + (b.secondaryUsers?.length || 0);
        return bTotal - aTotal;
      })
      .slice(0, 5);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Department Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze multi-department user assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportDashboardData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Users</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.totalUsers}
            </div>
            <div className="text-sm text-muted-foreground">
              Active employees
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Multi-Dept Users</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.multiDepartmentUsers}
            </div>
            <div className="text-sm text-muted-foreground">
              {getMultiDepartmentPercentage()}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Departments</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardStats.avgDepartmentsPerUser}
            </div>
            <div className="text-sm text-muted-foreground">
              per user
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Recent Activity</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardStats.recentAssignments}
            </div>
            <div className="text-sm text-muted-foreground">
              assignments today
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Departments by User Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTopDepartmentsByUsers().map((dept) => {
                const primaryCount = dept.primaryUsers?.length || 0;
                const secondaryCount = dept.secondaryUsers?.length || 0;
                const totalCount = primaryCount + secondaryCount;

                return (
                  <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {primaryCount} primary • {secondaryCount} secondary
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {totalCount} users
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Department Coverage</span>
                </div>
                <Badge variant="secondary">100%</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Multi-Dept Adoption</span>
                </div>
                <Badge variant="secondary">{getMultiDepartmentPercentage()}%</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Pending Migrations</span>
                </div>
                <Badge variant={dashboardStats.pendingMigrations > 0 ? 'destructive' : 'secondary'}>
                  {dashboardStats.pendingMigrations}
                </Badge>
              </div>

              {dashboardStats.pendingMigrations > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Some users need migration to multi-department structure
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Filter
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="user-details" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MultiDepartmentReports className="lg:col-span-2" />
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <MultiDepartmentSearch
            orgId={orgId}
            onUserSelect={handleUserSelect}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <MultiDepartmentReports className="w-full" />
        </TabsContent>

        <TabsContent value="user-details" className="space-y-6">
          {selectedUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MultiDepartmentUserDetail
                user={selectedUser}
                className="lg:col-span-1"
              />
              <DepartmentAssignmentHistory
                userId={selectedUser.id}
                className="lg:col-span-1"
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No User Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Search for a user to view their multi-department details and assignment history
                </p>
                <Button
                  onClick={() => setActiveTab('search')}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search Users
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiDepartmentDashboard;
