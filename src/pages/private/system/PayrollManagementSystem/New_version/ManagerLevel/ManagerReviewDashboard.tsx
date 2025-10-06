import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  RefreshCw
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PayrollRecord, TeamStatistics } from '../types/payroll'

interface TeamPayrollResponse {
  success: boolean
  message?: string
  data?: PayrollRecord[]
}

interface TeamStatisticsResponse {
  success: boolean
  message?: string
  data?: TeamStatistics
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

const ManagerReviewDashboard = () => {
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTeamPayrollData = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (!user?.id) {
      setPayrollRecords([])
      setTeamStats(null)
      setErrorMessage('You need to be logged in to view team payroll data.')
      if (showLoading) {
        setIsLoading(false)
      }
      return
    }

    if (showLoading) {
      setIsLoading(true)
    }

    try {
      setErrorMessage(null)

      const [teamPayrollResponse, teamStatsResponse] = await Promise.allSettled([
        axios.get<TeamPayrollResponse>(APIV3Dictionary.payroll.manager.teamPayroll, { withCredentials: true }),
        axios.get<TeamStatisticsResponse>(APIV3Dictionary.payroll.manager.teamStatistics, { withCredentials: true })
      ])

      const messages: string[] = []

      if (teamPayrollResponse.status === 'fulfilled') {
        const responseData = teamPayrollResponse.value.data
        if (responseData?.success) {
          const records = Array.isArray(responseData.data) ? responseData.data : []
          setPayrollRecords(records)
        } else {
          setPayrollRecords([])
          messages.push(responseData?.message || 'Failed to load team payroll records.')
        }
      } else {
        setPayrollRecords([])
        messages.push(getErrorMessage(teamPayrollResponse.reason, 'Failed to load team payroll records.'))
      }

      if (teamStatsResponse.status === 'fulfilled') {
        const responseData = teamStatsResponse.value.data
        if (responseData?.success) {
          setTeamStats(responseData.data ?? null)
        } else {
          setTeamStats(null)
          messages.push(responseData?.message || 'Failed to load team payroll statistics.')
        }
      } else {
        setTeamStats(null)
        messages.push(getErrorMessage(teamStatsResponse.reason, 'Failed to load team payroll statistics.'))
      }

      if (messages.length > 0) {
        const combinedMessage = messages.join(' ')
        setErrorMessage(combinedMessage)
        if (showLoading) {
          toast({
            title: 'Unable to load manager payroll data',
            description: combinedMessage,
            variant: 'destructive',
          })
        }
      } else {
        setErrorMessage(null)
      }
    } catch (error) {
      const message = getErrorMessage(error, 'An unexpected error occurred while fetching team payroll data.')
      console.error('Error fetching team payroll data:', error)
      setPayrollRecords([])
      setTeamStats(null)
      setErrorMessage(message)
      toast({
        title: 'Unable to load manager payroll data',
        description: message,
        variant: 'destructive',
      })
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [user?.id])

  useEffect(() => {
    fetchTeamPayrollData();
  }, [fetchTeamPayrollData]);

  // Approve payroll record
  const approveRecord = useCallback(async (recordId: string) => {
    try {
      setIsProcessing(true)

      const response = await axios.post(
        APIV3Dictionary.payroll.manager.approve(recordId),
        {},
        { withCredentials: true }
      )

      if (response.data?.success) {
        setPayrollRecords(prev =>
          prev.map(record =>
            record.id === recordId
              ? { ...record, status: 'APPROVED', reviewedAt: new Date().toISOString() }
              : record
          )
        )

        toast({
          title: 'Success',
          description: 'Payroll record approved successfully.',
        })

        await fetchTeamPayrollData({ showLoading: false })
      } else {
        const message = response.data?.message || 'Failed to approve payroll record. Please try again.'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to approve payroll record. Please try again.')
      console.error('Error approving record:', error)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [fetchTeamPayrollData]);

  // Reject payroll record
  const rejectRecord = useCallback(async (recordId: string) => {
    try {
      setIsProcessing(true)

      const response = await axios.post(
        APIV3Dictionary.payroll.manager.reject(recordId),
        {},
        { withCredentials: true }
      )

      if (response.data?.success) {
        setPayrollRecords(prev =>
          prev.map(record =>
            record.id === recordId
              ? { ...record, status: 'REJECTED', reviewedAt: new Date().toISOString() }
              : record
          )
        )

        toast({
          title: 'Success',
          description: 'Payroll record rejected successfully.',
        })

        await fetchTeamPayrollData({ showLoading: false })
      } else {
        const message = response.data?.message || 'Failed to reject payroll record. Please try again.'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to reject payroll record. Please try again.')
      console.error('Error rejecting record:', error)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [fetchTeamPayrollData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'REJECTED': return 'destructive';
      case 'PENDING': return 'outline';
      case 'PROCESSED': return 'secondary';
      default: return 'outline';
    }
  };

  const pendingRecords = useMemo(
    () => payrollRecords.filter(record => record.status === 'PENDING' || record.status === 'PROCESSED'),
    [payrollRecords]
  );

  const approvedRecords = useMemo(
    () => payrollRecords.filter(record => record.status === 'APPROVED' || record.status === 'PAID'),
    [payrollRecords]
  );

  const rejectedRecords = useMemo(
    () => payrollRecords.filter(record => record.status === 'REJECTED'),
    [payrollRecords]
  );

  const canReviewRecord = (status: PayrollRecord['status']) => status === 'PROCESSED' || status === 'PENDING';

  const renderRecordRow = (record: PayrollRecord) => {
    const actionable = canReviewRecord(record.status);

    return (
      <div key={record.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <h4 className="font-medium">
            {record.employee.firstName} {record.employee.lastName}
          </h4>
          <p className="text-sm text-muted-foreground">
            {record.employee.employeeId} • {record.employee.department}
          </p>
          <p className="text-sm">
            Net Salary: {formatCurrency(record.netSalary)}
          </p>
          {record.reviewedAt && (
            <p className="text-xs text-muted-foreground">
              Reviewed on {new Date(record.reviewedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Badge variant={getStatusBadgeVariant(record.status)} className="justify-center">
            {record.status}
          </Badge>
          {actionable && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => approveRecord(record.id)}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => rejectRecord(record.id)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Please log in to access manager dashboard</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Review Dashboard</h1>
          <p className="text-muted-foreground">Review and approve team payroll records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTeamPayrollData()}
            disabled={isLoading || isProcessing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load manager payroll data</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.totalEmployees || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.pendingReviews || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.approvedCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(teamStats?.totalPayrollAmount || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Team Payroll Overview</CardTitle>
              <CardDescription>Summary of team payroll records</CardDescription>
            </CardHeader>
            <CardContent>
              {payrollRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payroll records available</p>
                  <p className="text-sm">
                    {errorMessage ?? 'No payroll submissions are available for your team right now.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollRecords.map(renderRecordRow)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Payroll records awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRecords.length > 0 ? (
                <div className="space-y-4">
                  {pendingRecords.map(renderRecordRow)}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending reviews</p>
                  <p className="text-sm">{errorMessage ?? 'All payroll records are up to date.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Approved Records</CardTitle>
              <CardDescription>Payroll records you have approved</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedRecords.length > 0 ? (
                <div className="space-y-4">
                  {approvedRecords.map(renderRecordRow)}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approved records</p>
                  <p className="text-sm">{errorMessage ?? 'Approve payroll records to see them listed here.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Records</CardTitle>
              <CardDescription>Payroll records you have rejected</CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedRecords.length > 0 ? (
                <div className="space-y-4">
                  {rejectedRecords.map(renderRecordRow)}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rejected records</p>
                  <p className="text-sm">{errorMessage ?? 'Rejected payroll entries will appear here when you decline them.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerReviewDashboard;
