import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Coffee,
  Shield
} from 'lucide-react';
import AttendanceRulesManager from './rules/AttendanceRulesManager';
import BreakManagement from './breaks/BreakManagement';
import GeofencingManagement from './geofencing/GeofencingManagement';
import { 
  useOrganizationAnalytics, 
  useOrganizationAlerts, 
  useAlertStatistics,
  useAttendanceRules,
  useBreakAnalytics
} from '../../hooks/useAttendance';

interface AttendanceDashboardProps {
  orgId: string;
  userId: string;
  userRole: 'admin' | 'manager' | 'employee';
}

const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ 
  orgId, 
  userId, 
  userRole 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard data
  const { data: analyticsData } = useOrganizationAnalytics(orgId);
  const { data: alertsData } = useOrganizationAlerts(orgId, { status: 'UNREAD' });
  const { data: alertStatsData } = useAlertStatistics(orgId, 7);
  const { data: rulesData } = useAttendanceRules(orgId);
  const { data: breakAnalyticsData } = useBreakAnalytics(orgId, 7);

  const analytics = analyticsData?.data;
  const alerts = alertsData?.data?.alerts || [];
  const alertStats = alertStatsData?.data;
  const rules = rulesData?.data || [];
  const breakAnalytics = breakAnalyticsData?.data;

  const isAdmin = userRole === 'admin' || userRole === 'manager';

  // Calculate statistics
  const activeRules = rules.filter(rule => rule.isActive).length;
  const totalRules = rules.length;
  const unreadAlerts = alerts.length;

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
  }> = ({ title, value, icon, description, trend }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className={`h-4 w-4 mr-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`} />
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-gray-600">
            {isAdmin ? 'Administrative dashboard for attendance monitoring' : 'Your attendance overview'}
          </p>
        </div>
        {unreadAlerts > 0 && (
          <Alert className="w-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {unreadAlerts} unread alert{unreadAlerts > 1 ? 's' : ''} require attention
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          {isAdmin && <TabsTrigger value="rules">Rules</TabsTrigger>}
          {isAdmin && <TabsTrigger value="geofencing">Geofencing</TabsTrigger>}
          {isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Employees"
              value={analytics?.summary?.totalEmployees || 0}
              icon={<Users className="h-6 w-6 text-blue-600" />}
              description="Active employees"
            />
            <StatCard
              title="Attendance Rate"
              value={`${analytics?.attendance?.attendanceRate?.toFixed(1) || 0}%`}
              icon={<Calendar className="h-6 w-6 text-green-600" />}
              description="This month"
              trend={{
                value: 2.5,
                isPositive: true
              }}
            />
            <StatCard
              title="Active Rules"
              value={`${activeRules}/${totalRules}`}
              icon={<Shield className="h-6 w-6 text-purple-600" />}
              description="Enforcement rules"
            />
            <StatCard
              title="Break Compliance"
              value={`${100 - (breakAnalytics?.violationRate || 0)}%`}
              icon={<Coffee className="h-6 w-6 text-orange-600" />}
              description="Break policy adherence"
            />
          </div>

          {/* Recent Alerts */}
          {isAdmin && alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>
                  Latest attendance alerts requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 
                                     alert.severity === 'MEDIUM' ? 'default' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-gray-600">
                            {alert.user.firstName} {alert.user.lastName} • {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Present Today</span>
                    <span className="font-medium">{analytics?.attendance?.presentDays || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Late Arrivals</span>
                    <span className="font-medium text-yellow-600">{analytics?.attendance?.lateDays || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Early Departures</span>
                    <span className="font-medium text-orange-600">{analytics?.attendance?.earlyDepartures || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Absent</span>
                    <span className="font-medium text-red-600">{analytics?.attendance?.absentDays || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valid Locations</span>
                    <span className="font-medium text-green-600">{analytics?.geofencing?.validValidations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location Violations</span>
                    <span className="font-medium text-red-600">{analytics?.geofencing?.violations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Compliance Rate</span>
                    <span className="font-medium">{analytics?.geofencing?.complianceRate?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breaks Tab */}
        <TabsContent value="breaks">
          <BreakManagement userId={userId} />
        </TabsContent>

        {/* Rules Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="rules">
            <AttendanceRulesManager orgId={orgId} />
          </TabsContent>
        )}

        {/* Geofencing Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="geofencing">
            <GeofencingManagement orgId={orgId} />
          </TabsContent>
        )}

        {/* Analytics Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Violation Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Late Arrivals</span>
                      <span className="font-medium">{alertStats?.byType?.lateArrival || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Early Departures</span>
                      <span className="font-medium">{alertStats?.byType?.earlyDeparture || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Break Violations</span>
                      <span className="font-medium">{alertStats?.byType?.breakViolation || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Location Violations</span>
                      <span className="font-medium">{alertStats?.byType?.locationViolation || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Break Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Breaks</span>
                      <span className="font-medium">{breakAnalytics?.totalBreaks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Duration</span>
                      <span className="font-medium">{breakAnalytics?.averageBreakDuration || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Violation Rate</span>
                      <span className="font-medium text-red-600">{breakAnalytics?.violationRate?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Rules Active</span>
                      <span className="font-medium text-green-600">{activeRules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pending Alerts</span>
                      <span className="font-medium text-yellow-600">{unreadAlerts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">System Status</span>
                      <Badge variant="default">Operational</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AttendanceDashboard;
