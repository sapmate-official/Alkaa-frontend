import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Filter, 
  Search, 
  User, 
  Calendar, 
  Eye, 
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/services/AuthContext';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  metadata?: any;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  actor: {
    id: string;
    name: string;
    email: string;
    employeeId?: string;
    department?: string;
  };
  target?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string;
    department?: string;
  };
}

interface ActivityStats {
  totalActivities: number;
  period: string;
  actionStats: Array<{ action: string; count: number }>;
  entityStats: Array<{ entity: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  userStats: Array<{
    userId: string;
    name: string;
    email: string;
    employeeId?: string;
    activityCount: number;
  }>;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: {
    name: string;
  };
}

const ActivityLogsManagement: React.FC = () => {
  const { user } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const actionTypes = [
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'UNASSIGN',
    'APPROVE', 'REJECT', 'ACTIVATE', 'DEACTIVATE', 'RESET_PASSWORD',
    'CHANGE_ROLE', 'CHANGE_DEPARTMENT', 'CHANGE_MANAGER', 'CHECK_IN',
    'CHECK_OUT', 'APPLY_LEAVE', 'CANCEL_LEAVE', 'GENERATE_SALARY',
    'PROCESS_PAYMENT', 'VERIFY_ATTENDANCE', 'SEND_NOTIFICATION',
    'UPLOAD_DOCUMENT', 'VIEW_SENSITIVE_DATA'
  ];

  const entityTypes = [
    'USER', 'ORGANIZATION', 'DEPARTMENT', 'ROLE', 'PERMISSION',
    'ATTENDANCE', 'LEAVE_REQUEST', 'SALARY_RECORD', 'BANK_DETAILS',
    'NOTIFICATION', 'DOCUMENT', 'SETTINGS'
  ];

  useEffect(() => {
    fetchSubordinates();
    fetchActivityLogs();
    fetchActivityStats();
  }, []);

  useEffect(() => {
    fetchActivityLogs();
  }, [page, selectedAction, selectedEntity, selectedUser, selectedTarget, dateRange, searchTerm]);

  useEffect(() => {
    fetchActivityStats();
  }, [period]);

  const fetchSubordinates = async () => {
    try {
      const response = await axios.get(`${APIDictionary.user}/subordinates/${user?.id}`, {
        withCredentials: true,
      });
      setSubordinates(response.data);
    } catch (error) {
      console.error('Error fetching subordinates:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (selectedAction && selectedAction !== 'all') params.append('action', selectedAction);
      if (selectedEntity && selectedEntity !== 'all') params.append('entity', selectedEntity);
      if (selectedUser && selectedUser !== 'all') params.append('userId', selectedUser);
      if (selectedTarget && selectedTarget !== 'all') params.append('targetUserId', selectedTarget);
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

      const response = await axios.get(`${APIDictionary.activityLogs}?${params.toString()}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setActivityLogs(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('Failed to fetch activity logs');
      }
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      setError(error.response?.data?.error || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get(`${APIDictionary.activityStats}?period=${period}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setActivityStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    const colorMap: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      APPROVE: 'bg-green-100 text-green-800',
      REJECT: 'bg-red-100 text-red-800',
      VIEW_SENSITIVE_DATA: 'bg-yellow-100 text-yellow-800',
    };
    return colorMap[action] || 'bg-gray-100 text-gray-800';
  };

  const getEntityBadgeColor = (entity: string) => {
    const colorMap: Record<string, string> = {
      USER: 'bg-blue-100 text-blue-800',
      ATTENDANCE: 'bg-green-100 text-green-800',
      LEAVE_REQUEST: 'bg-orange-100 text-orange-800',
      SALARY_RECORD: 'bg-purple-100 text-purple-800',
      DEPARTMENT: 'bg-cyan-100 text-cyan-800',
      ROLE: 'bg-pink-100 text-pink-800',
    };
    return colorMap[entity] || 'bg-gray-100 text-gray-800';
  };

  const clearFilters = () => {
    setSelectedAction('all');
    setSelectedEntity('all');
    setSelectedUser('all');
    setSelectedTarget('all');
    setDateRange(undefined);
    setSearchTerm('');
    setPage(1);
  };

  const ActivityLogSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  const StatCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">Monitor what your team members are doing</p>
        </div>
        <Button onClick={fetchActivityLogs} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Action</label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {actionTypes.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Entity</label>
                  <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All entities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All entities</SelectItem>
                      {entityTypes.map((entity) => (
                        <SelectItem key={entity} value={entity}>
                          {entity.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {subordinates.map((subordinate) => (
                        <SelectItem key={subordinate.id} value={subordinate.id}>
                          {subordinate.firstName} {subordinate.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <DatePickerWithRange
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Select date range"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <ActivityLogSkeleton />
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity logs found</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{log.actor.name}</span>
                              <Badge className={getActionBadgeColor(log.action)}>
                                {log.action.replace('_', ' ')}
                              </Badge>
                              <Badge className={getEntityBadgeColor(log.entity)}>
                                {log.entity.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.description}</p>
                            {log.target && (
                              <p className="text-xs text-muted-foreground">
                                Target: {log.target.name} ({log.target.email})
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{log.actor.email}</span>
                              {log.actor.department && <span>{log.actor.department}</span>}
                              {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.createdAt), 'HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : activityStats ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activityStats.totalActivities}</div>
                    <p className="text-xs text-muted-foreground">Last {period}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activityStats.userStats.length}</div>
                    <p className="text-xs text-muted-foreground">Users with activity</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Daily Activity</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(activityStats.totalActivities / activityStats.dailyStats.length)}
                    </div>
                    <p className="text-xs text-muted-foreground">Activities per day</p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Period Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Analytics Period
                </span>
                <Select value={period} onValueChange={(value: '7d' | '30d' | '90d') => setPeriod(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Analytics Charts */}
          {activityStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityStats.actionStats.slice(0, 10).map((stat, index) => (
                      <div key={stat.action} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <Badge className={getActionBadgeColor(stat.action)}>
                            {stat.action.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Entities */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Entities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityStats.entityStats.slice(0, 10).map((stat, index) => (
                      <div key={stat.entity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <Badge className={getEntityBadgeColor(stat.entity)}>
                            {stat.entity.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Active Users */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activityStats.userStats.slice(0, 10).map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{user.activityCount}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityLogsManagement;
