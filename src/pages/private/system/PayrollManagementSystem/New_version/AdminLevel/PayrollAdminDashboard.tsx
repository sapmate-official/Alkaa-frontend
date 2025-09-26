import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { toast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Calendar,
  Settings,
  Users,
  FileText,
  BarChart3,
  Download
} from 'lucide-react'
import { MonthAndYearSelector } from '../ui/MonthYearPicker'
import { PayrollCycle, PayrollStatistics } from '../types/payroll'

interface PayrollDashboardResponse {
  success: boolean
  message?: string
  data?: {
    cyclesNeedingReview?: PayrollCycle[]
    statistics?: PayrollStatistics | null
    recentCycles?: PayrollCycle[]
  }
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as Record<string, unknown> | undefined
    if (responseData && typeof responseData.message === 'string') {
      return responseData.message
    }
    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}

const PayrollAdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<PayrollStatistics | null>(null);
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [cyclesNeedingReview, setCyclesNeedingReview] = useState<PayrollCycle[]>([]);
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Current date for default values
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // State for month/year selection
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Generate arrays for months and years
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setStatistics(null);
      setCycles([]);
      setCyclesNeedingReview([]);
      setErrorMessage('You need to be logged in to view payroll dashboard data.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await axios.get<PayrollDashboardResponse>(APIV3Dictionary.payroll.dashboard, {
        params: { year: selectedYear },
        withCredentials: true,
      });

      if (response.data.success) {
        const { cyclesNeedingReview: reviewCycles = [], statistics: stats = null, recentCycles = [] } = response.data.data || {};

        setCycles(Array.isArray(recentCycles) ? recentCycles : []);
        setCyclesNeedingReview(Array.isArray(reviewCycles) ? reviewCycles : []);
        setStatistics(stats ?? null);
        return;
      }

      const message = response.data.message || 'Failed to load payroll dashboard data.';
      setCycles([]);
      setCyclesNeedingReview([]);
      setStatistics(null);
      setErrorMessage(message);
      toast({
        title: 'Unable to load payroll data',
        description: message,
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error fetching payroll dashboard data:', error);
      const message = getErrorMessage(error, 'An unexpected error occurred while fetching payroll dashboard data.');
      setCycles([]);
      setCyclesNeedingReview([]);
      setStatistics(null);
      setErrorMessage(message);
      toast({
        title: 'Unable to load payroll data',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Create new payroll cycle
  const createPayrollCycle = async () => {
    try {
      setIsCreatingCycle(true);

      const response = await axios.post(
        APIV3Dictionary.payroll.createCycle,
        {
          month: selectedMonth,
          year: selectedYear
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payroll cycle created successfully!',
        });

        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error creating payroll cycle:', error);
      const message = getErrorMessage(error, 'Failed to create payroll cycle');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCycle(false);
    }
  };

  // Start payroll cycle (bulk generation)
  const startPayrollCycle = async (cycleId: string) => {
    try {
      setIsProcessing(true);

      const response = await axios.post(
        APIV3Dictionary.payroll.startCycle(cycleId),
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        const result = response.data.data;
        toast({
          title: 'Payroll Cycle Started',
          description: `Generated ${result.processedCount} salaries successfully. ${result.failedCount} failed.`,
        });

        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error starting payroll cycle:', error);
      const message = getErrorMessage(error, 'Failed to start payroll cycle');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Approve payroll cycle
  const approvePayrollCycle = async (cycleId: string) => {
    try {
      setIsProcessing(true);

      const response = await axios.post(
        APIV3Dictionary.payroll.approveCycle(cycleId),
        { notes: 'Bulk approved via admin dashboard' },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payroll cycle approved successfully!',
        });

        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error approving payroll cycle:', error);
      const message = getErrorMessage(error, 'Failed to approve payroll cycle');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'IN_PROGRESS': return 'default';
      case 'REVIEW_PENDING': return 'outline';
      case 'APPROVED': return 'default';
      case 'FAILED': return 'destructive';
      case 'CANCELLED': return 'secondary';
      default: return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Play className="h-4 w-4" />;
      case 'REVIEW_PENDING': return <AlertCircle className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'FAILED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="w-screen px-8 py-6 space-y-6 h-screen overflow-y-auto">
        <Skeleton className="h-10 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="w-screen px-8 py-6 space-y-6 h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management System</h1>
          <p className="text-muted-foreground">Complete payroll workflow management and administration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchDashboardData()} disabled={isLoading || isProcessing || isCreatingCycle}>
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load payroll dashboard</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup & Config</TabsTrigger>
          <TabsTrigger value="cycle-management">Cycle Management</TabsTrigger>
          <TabsTrigger value="review-approval">Review & Approval</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="employee-portal">Employee Portal</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalCycles}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.completedCycles} completed this year
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(statistics.totalAmountPaid)}</div>
                  <p className="text-xs text-muted-foreground">
                    To {statistics.totalEmployeesProcessed} employees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.pendingCycles}</div>
                  <p className="text-xs text-muted-foreground">
                    Cycles awaiting approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalCycles > 0 
                      ? Math.round((statistics.completedCycles / statistics.totalCycles) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successful completions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cycles Needing Review */}
          {cyclesNeedingReview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Cycles Needing Review ({cyclesNeedingReview.length})
                </CardTitle>
                <CardDescription>
                  These payroll cycles have been processed and are waiting for approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cyclesNeedingReview.map((cycle) => (
                    <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">
                            {months.find(m => m.value === cycle.month)?.label} {cycle.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {cycle.processedCount} of {cycle.totalEmployees} employees processed
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(cycle.status)} className="flex items-center gap-1">
                          {getStatusIcon(cycle.status)}
                          {cycle.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{formatCurrency(cycle.totalAmount)}</span>
                        <Button 
                          onClick={() => approvePayrollCycle(cycle.id)}
                          disabled={isProcessing}
                          className="ml-4"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Cycles */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payroll Cycles</CardTitle>
              <CardDescription>
                Overview of recent payroll processing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycles.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No payroll cycles found. Create one to get started.
                  </p>
                ) : (
                  cycles.map((cycle) => (
                    <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">
                            {months.find(m => m.value === cycle.month)?.label} {cycle.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {cycle.processedCount} of {cycle.totalEmployees} employees
                            {cycle.failedCount > 0 && ` • ${cycle.failedCount} failed`}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(cycle.status)} className="flex items-center gap-1">
                          {getStatusIcon(cycle.status)}
                          {cycle.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(cycle.totalAmount)}</p>
                          {cycle.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(cycle.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {cycle.status === 'DRAFT' && (
                          <Button 
                            onClick={() => startPayrollCycle(cycle.id)}
                            disabled={isProcessing}
                            size="sm"
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup & Configuration Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Salary Templates & Structures
                </CardTitle>
                <CardDescription>
                  Define and configure salary calculation rules and templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Salary Templates
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Calculation Rules
                </Button>
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Apply to Users/Departments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Management
                </CardTitle>
                <CardDescription>
                  Manage employee information and bank details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Employee Self-Service Portal
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Bank Details Management
                </Button>
                <Button className="w-full" variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Notification Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cycle Management Tab */}
        <TabsContent value="cycle-management" className="space-y-6">
          {/* Create New Cycle */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Payroll Cycle</CardTitle>
              <CardDescription>
                Start a new monthly payroll cycle for bulk salary generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MonthAndYearSelector 
                months={months} 
                years={years} 
                selectedMonth={selectedMonth} 
                selectedYear={selectedYear} 
                setSelectedMonth={setSelectedMonth} 
                setSelectedYear={setSelectedYear} 
              />
              <Button 
                onClick={createPayrollCycle}
                disabled={isCreatingCycle}
                className="w-full"
              >
                {isCreatingCycle ? 'Creating...' : 'Create Payroll Cycle'}
              </Button>
            </CardContent>
          </Card>

          {/* Cycle Processing Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Processing Queue
              </CardTitle>
              <CardDescription>
                Background job queue for payroll calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active processing jobs</p>
                <p className="text-sm">Jobs will appear here when payroll calculations are running</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review & Approval Tab */}
        <TabsContent value="review-approval" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Bulk Review & Approval
              </CardTitle>
              <CardDescription>
                Review and approve payroll calculations with comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cyclesNeedingReview.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cycles pending review</p>
                  <p className="text-sm">Cycles will appear here when they need approval</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cyclesNeedingReview.map((cycle) => (
                    <div key={cycle.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">
                            {months.find(m => m.value === cycle.month)?.label} {cycle.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {cycle.processedCount} employees processed
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(cycle.status)}>
                          {cycle.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approvePayrollCycle(cycle.id)} disabled={isProcessing}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          Review Details
                        </Button>
                        <Button size="sm" variant="destructive" disabled={isProcessing}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporting Tab */}
        <TabsContent value="reporting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics & Reports
                </CardTitle>
                <CardDescription>
                  Generate compliance reports and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Tax Summaries
                </Button>
                <Button className="w-full" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Payroll Analytics
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit & Compliance
                </CardTitle>
                <CardDescription>
                  Audit trails and compliance reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Audit Trail Review
                </Button>
                <Button className="w-full" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Compliance Reports
                </Button>
                <Button className="w-full" variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Handle Corrections
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employee Portal Tab */}
        <TabsContent value="employee-portal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Access
                </CardTitle>
                <CardDescription>
                  Employee self-service features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Historical Payslips
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download/Print Options
                </Button>
                <Button className="w-full" variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Dispute Filing
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Employee notification management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Portal
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Portal Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayrollAdminDashboard;
