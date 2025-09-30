import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { 
  CalendarDays, 
  Users, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Play,
  Check
} from 'lucide-react'

interface PayrollCycle {
  id: string
  month: number
  year: number
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
  totalEmployees: number
  processedCount: number
  failedCount: number
  totalAmount: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  processor?: {
    firstName: string
    lastName: string
  }
  approver?: {
    firstName: string
    lastName: string
  }
}

interface PayrollStatistics {
  year: number
  totalCycles: number
  completedCycles: number
  pendingCycles: number
  failedCycles: number
  totalAmountPaid: number
  totalEmployeesProcessed: number
  monthlyBreakdown: {
    month: number
    status: string
    amount: number
    employees: number
  }[]
}

interface DashboardData {
  cyclesNeedingReview: PayrollCycle[]
  statistics: PayrollStatistics
  recentCycles: PayrollCycle[]
}

const PayrollDashboard = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Create cycle form state
  const [isCreatingCycle, setIsCreatingCycle] = useState(false)
  const [createCycleForm, setCreateCycleForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(
          `${APIV3Dictionary.payroll.dashboard}?year=${selectedYear}`,
          { withCredentials: true }
        )

        if (response.data.success) {
          setDashboardData(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch dashboard data',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id, selectedYear])

  // Create new payroll cycle
  const handleCreateCycle = async () => {
    try {
      setIsCreatingCycle(true)
      const response = await axios.post(
        APIV3Dictionary.payroll.createCycle,
        createCycleForm,
        { withCredentials: true }
      )

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payroll cycle created successfully',
        })
        // Refresh dashboard data
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error creating cycle:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create payroll cycle',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingCycle(false)
    }
  }

  // Start payroll cycle
  const handleStartCycle = async (cycleId: string) => {
    try {
      const response = await axios.post(
        `${APIV3Dictionary.payroll.startCycle}/${cycleId}`,
        {},
        { withCredentials: true }
      )

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payroll cycle started successfully',
        })
        // Refresh dashboard data
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error starting cycle:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start payroll cycle',
        variant: 'destructive',
      })
    }
  }

  // Approve payroll cycle
  const handleApproveCycle = async (cycleId: string) => {
    try {
      const response = await axios.post(
        `${APIV3Dictionary.payroll.approveCycle}/${cycleId}`,
        {},
        { withCredentials: true }
      )

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payroll cycle approved successfully',
        })
        // Refresh dashboard data
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error approving cycle:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve payroll cycle',
        variant: 'destructive',
      })
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { color: 'secondary', icon: <FileText className="h-4 w-4" />, label: 'Draft' }
      case 'IN_PROGRESS':
        return { color: 'warning', icon: <Clock className="h-4 w-4" />, label: 'In Progress' }
      case 'REVIEW':
        return { color: 'warning', icon: <AlertCircle className="h-4 w-4" />, label: 'Review' }
      case 'APPROVED':
        return { color: 'success', icon: <CheckCircle className="h-4 w-4" />, label: 'Approved' }
      case 'COMPLETED':
        return { color: 'success', icon: <Check className="h-4 w-4" />, label: 'Completed' }
      case 'CANCELLED':
      case 'FAILED':
        return { color: 'destructive', icon: <XCircle className="h-4 w-4" />, label: 'Cancelled' }
      default:
        return { color: 'secondary', icon: <FileText className="h-4 w-4" />, label: status }
    }
  }

  if (isLoading) {
    return (
      <div className="w-screen px-8 py-6 space-y-6 h-screen overflow-y-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="w-screen px-8 py-6 space-y-6 h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">Streamlined payroll processing and management</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded-md px-3 py-2"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.totalCycles}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.statistics.completedCycles} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees Processed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.totalEmployeesProcessed}</div>
              <p className="text-xs text-muted-foreground">
                This year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.statistics.totalAmountPaid)}</div>
              <p className="text-xs text-muted-foreground">
                Year to date
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.cyclesNeedingReview.length}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cycles">Payroll Cycles</TabsTrigger>
          <TabsTrigger value="create">Create New Cycle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cycles Needing Review */}
          {dashboardData?.cyclesNeedingReview && dashboardData.cyclesNeedingReview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Cycles Needing Review
                </CardTitle>
                <CardDescription>
                  These payroll cycles require your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.cyclesNeedingReview.map((cycle) => {
                    const statusInfo = getStatusInfo(cycle.status)
                    return (
                      <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-medium">
                              {months[cycle.month - 1]} {cycle.year}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {cycle.processedCount}/{cycle.totalEmployees} employees processed
                            </p>
                          </div>
                          <Badge variant={statusInfo.color as any} className="flex items-center gap-1">
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(cycle.totalAmount)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleApproveCycle(cycle.id)}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Cycles */}
          {dashboardData?.recentCycles && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Payroll Cycles</CardTitle>
                <CardDescription>Latest payroll processing activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentCycles.map((cycle) => {
                    const statusInfo = getStatusInfo(cycle.status)
                    const completionRate = cycle.totalEmployees > 0 
                      ? (cycle.processedCount / cycle.totalEmployees) * 100 
                      : 0

                    return (
                      <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">
                              {months[cycle.month - 1]} {cycle.year}
                            </h4>
                            <Badge variant={statusInfo.color as any} className="flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{cycle.processedCount}/{cycle.totalEmployees}</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {formatCurrency(cycle.totalAmount)} • {cycle.failedCount} failed
                          </p>
                        </div>
                        <div className="ml-4">
                          {cycle.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartCycle(cycle.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cycles">
          <Card>
            <CardHeader>
              <CardTitle>All Payroll Cycles</CardTitle>
              <CardDescription>View and manage all payroll cycles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Detailed cycles view would be implemented here with filtering, searching, and pagination.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Payroll Cycle</CardTitle>
              <CardDescription>
                Start a new payroll processing cycle for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Month</label>
                  <select
                    value={createCycleForm.month}
                    onChange={(e) => setCreateCycleForm({
                      ...createCycleForm,
                      month: parseInt(e.target.value)
                    })}
                    className="w-full border rounded-md px-3 py-2 mt-1"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Year</label>
                  <select
                    value={createCycleForm.year}
                    onChange={(e) => setCreateCycleForm({
                      ...createCycleForm,
                      year: parseInt(e.target.value)
                    })}
                    className="w-full border rounded-md px-3 py-2 mt-1"
                  >
                    {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                onClick={handleCreateCycle}
                disabled={isCreatingCycle}
                className="w-full"
              >
                {isCreatingCycle ? 'Creating...' : 'Create Payroll Cycle'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PayrollDashboard
