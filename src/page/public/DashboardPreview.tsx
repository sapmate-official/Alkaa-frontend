
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Clock, CalendarDays, Briefcase, TrendingUp, CheckCircle2, Award, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Dummy data for the dashboard
const attendanceData = [
  { date: 'Mon', present: 42, absent: 3 },
  { date: 'Tue', present: 45, absent: 0 },
  { date: 'Wed', present: 41, absent: 4 },
  { date: 'Thu', present: 43, absent: 2 },
  { date: 'Fri', present: 40, absent: 5 },
  { date: 'Sat', present: 38, absent: 7 },
  { date: 'Today', present: 44, absent: 1 },
];

const departmentData = [
  { name: 'Engineering', value: 38 },
  { name: 'Marketing', value: 12 },
  { name: 'Sales', value: 18 },
  { name: 'HR', value: 7 },
  { name: 'Finance', value: 10 },
];

const COLORS = ['#5D5CFF', '#7C76FF', '#7B86A7', '#EEF1F9', '#08091A'];

const monthlyTrendsData = [
  { month: 'Jan', hires: 3, exits: 1, growth: 2 },
  { month: 'Feb', hires: 2, exits: 0, growth: 4 },
  { month: 'Mar', hires: 4, exits: 2, growth: 6 },
  { month: 'Apr', hires: 6, exits: 1, growth: 11 },
  { month: 'May', hires: 3, exits: 2, growth: 12 },
  { month: 'Jun', hires: 5, exits: 1, growth: 16 },
];

const performanceData = [
  { month: 'Jan', performance: 78 },
  { month: 'Feb', performance: 82 },
  { month: 'Mar', performance: 85 },
  { month: 'Apr', performance: 87 },
  { month: 'May', performance: 84 },
  { month: 'Jun', performance: 89 },
];

const activities = [
  { id: 1, title: 'New employee onboarded', description: 'Emma Watson joined the Marketing team', timestamp: '2 hours ago', icon: <Users className="h-5 w-5 text-primary" /> },
  { id: 2, title: 'Leave request approved', description: 'You approved Michael Chen\'s vacation request', timestamp: '3 hours ago', icon: <CalendarDays className="h-5 w-5 text-green-500" /> },
  { id: 3, title: 'Performance review completed', description: 'Quarterly reviews for Engineering team completed', timestamp: '5 hours ago', icon: <Award className="h-5 w-5 text-orange-500" /> },
  { id: 4, title: 'Training session scheduled', description: 'Leadership training scheduled for next Tuesday', timestamp: 'Yesterday', icon: <Briefcase className="h-5 w-5 text-blue-500" /> }
];

const upcomingEvents = [
  { id: 1, title: 'Team Meeting', date: 'Today, 2:00 PM', type: 'meeting' },
  { id: 2, title: 'Onboarding: Sarah Johnson', date: 'Tomorrow, 10:00 AM', type: 'onboarding' },
  { id: 3, title: 'Quarterly Review', date: 'Jul 28, 1:00 PM', type: 'review' }
];

const EnhancedDashboardPreview = () => {
  return (
    <div className="p-6 space-y-6 w-full overflow-y-auto bg-background rounded-lg border border-border shadow-sm ">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Admin! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Mark Attendance
          </Button>
          <Button size="sm" className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">44</div>
            <p className="text-xs text-green-500">98% attendance rate</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">3 leaves, 2 expenses</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-blue-500">↑ 4% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section - Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Attendance Chart - Taking 4 columns */}
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Weekly Attendance Overview</CardTitle>
              <Badge variant="outline">This Week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F9" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#F6F8FC', 
                      border: '1px solid #EEF1F9',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="present" fill="#5D5CFF" radius={[4, 4, 0, 0]} name="Present" />
                  <Bar dataKey="absent" fill="#7B86A7" radius={[4, 4, 0, 0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown - Taking 3 columns */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {departmentData.map((entry, index) =>{  console.log(entry);
                     
                    return  (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )})}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} employees`, name]}
                    contentStyle={{ 
                      backgroundColor: '#F6F8FC', 
                      border: '1px solid #EEF1F9',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Monthly Trends */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Team Growth</CardTitle>
            <CardDescription>Monthly hiring and exits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F9" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#F6F8FC', 
                      border: '1px solid #EEF1F9',
                      borderRadius: '8px'
                    }}
                  />
                  <Area type="monotone" dataKey="growth" stroke="#5D5CFF" fill="#5D5CFF" fillOpacity={0.2} name="Net Growth" />
                  <Area type="monotone" dataKey="hires" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="New Hires" />
                  <Area type="monotone" dataKey="exits" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Exits" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 custom-scrollbar overflow-y-auto max-h-64">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-0.5">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance & Upcoming */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F9" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[70, 90]} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#F6F8FC', 
                      border: '1px solid #EEF1F9',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="performance" 
                    stroke="#5D5CFF" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="pt-2 border-t">
              <h3 className="text-sm font-medium mb-2">Upcoming Events</h3>
              <div className="space-y-2 custom-scrollbar overflow-y-auto max-h-28">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex justify-between text-sm p-2 rounded-md bg-secondary/30">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                    <Badge variant="outline" className="h-fit">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:bg-secondary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">View Profile</p>
              <p className="text-xs text-muted-foreground">Personal details</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-secondary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Leave Balance</p>
              <p className="text-xs text-muted-foreground">14 days remaining</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-secondary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Attendance</p>
              <p className="text-xs text-muted-foreground">View history</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-secondary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">Reports</p>
              <p className="text-xs text-muted-foreground">Generate reports</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDashboardPreview;