import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthContext'
import { toast } from '@/hooks/use-toast'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import RouteDict from '@/routes/RouteDict'
import axios from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { 
  Settings,
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  Workflow,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  PlayCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import all the components we created
import PayrollAdminDashboard from './AdminLevel/PayrollAdminDashboard'
import SalaryTemplateEditor from './AdminLevel/SalaryTemplateEditor'
import EmployeeSelfServicePortal from './EmployeeLevel/EmployeeSelfServicePortal'
import ManagerReviewDashboard from './ManagerLevel/ManagerReviewDashboard'
import { WorkflowStatus } from './types/payroll'

interface WorkflowStatusResponse {
  success: boolean
  message?: string
  data?: WorkflowStatus
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

const PayrollWorkflowDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('workflow-overview');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenPipeline = () => {
    navigate(RouteDict.Payroll.Admin.Pipeline)
  }

  // Determine user role for appropriate interface
  const getUserRole = () => {
    // This would typically come from user permissions/roles
    // For demo purposes, we'll determine based on some logic
    if (user?.roles?.some(role => role.role?.name?.includes('admin') || role.role?.name?.includes('Admin'))) {
      return 'admin';
    } else if (user?.roles?.some(role => role.role?.name?.includes('manager') || role.role?.name?.includes('Manager'))) {
      return 'manager';
    } else {
      return 'employee';
    }
  };

  const userRole = getUserRole();

  const getRoleTabs = (role: string) => {
    const baseTabs = [
      { value: 'workflow-overview', label: 'Workflow Overview', icon: <Workflow className="h-4 w-4" /> }
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseTabs,
          { value: 'admin-dashboard', label: 'Admin Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
          { value: 'template-editor', label: 'Template Editor', icon: <Settings className="h-4 w-4" /> },
          { value: 'employee-portal', label: 'Employee Portal', icon: <Users className="h-4 w-4" /> }
        ];
      case 'manager':
        return [
          ...baseTabs,
          { value: 'manager-review', label: 'Team Review', icon: <CheckCircle className="h-4 w-4" /> },
          { value: 'employee-portal', label: 'My Portal', icon: <Users className="h-4 w-4" /> }
        ];
      case 'employee':
        return [
          ...baseTabs,
          { value: 'employee-portal', label: 'My Portal', icon: <Users className="h-4 w-4" /> }
        ];
      default:
        return baseTabs;
    }
  };

  const fetchWorkflowStatus = useCallback(async () => {
    if (!user?.id) {
      setWorkflowStatus(null)
      setErrorMessage('You need to be logged in to view workflow data.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const response = await axios.get<WorkflowStatusResponse>(
        APIV3Dictionary.payroll.workflow.status,
        { withCredentials: true }
      )

      if (response.data?.success && response.data.data) {
        const workflowData = response.data.data
        setWorkflowStatus({
          currentPhase: workflowData.currentPhase || 'setup',
          overallProgress: workflowData.overallProgress || 0,
          activeSteps: workflowData.activeSteps || [],
          completedSteps: workflowData.completedSteps || [],
          blockedSteps: workflowData.blockedSteps || []
        })
        return
      }

      const message = response.data?.message || 'Failed to load workflow status.'
      setWorkflowStatus(null)
      setErrorMessage(message)
      toast({
        title: 'Unable to load payroll workflow data',
        description: message,
        variant: 'destructive'
      })
    } catch (error) {
      console.error('Error fetching workflow status:', error)
      const message = getErrorMessage(error, 'An unexpected error occurred while fetching workflow status.')
      setWorkflowStatus(null)
      setErrorMessage(message)
      toast({
        title: 'Unable to load payroll workflow data',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Initialize workflow status
  useEffect(() => {
    fetchWorkflowStatus()
  }, [fetchWorkflowStatus])

  const tabs = useMemo(() => getRoleTabs(userRole), [userRole]);

  const tabsGridClass = useMemo(() => {
    const mapping: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    };

    return mapping[tabs.length] ?? 'grid-cols-3 md:grid-cols-5';
  }, [tabs.length]);

  const activeSteps = workflowStatus?.activeSteps ?? []
  const completedSteps = workflowStatus?.completedSteps ?? []
  const blockedSteps = workflowStatus?.blockedSteps ?? []
  const overallProgress = workflowStatus?.overallProgress ?? 0

  const getPhaseStats = (phase: string) => {
    const phaseActive = activeSteps.filter((step) => step.phase === phase).length
    const phaseCompleted = completedSteps.filter((step) => step.phase === phase).length
    const phaseBlocked = blockedSteps.filter((step) => step.phase === phase).length

    return {
      active: phaseActive,
      completed: phaseCompleted,
      blocked: phaseBlocked,
      total: phaseActive + phaseCompleted + phaseBlocked
    }
  }

  const phaseDefinitions: Array<{
    key: string
    title: string
    icon: JSX.Element
    description: string
  }> = [
    {
      key: 'setup',
      title: 'Phase 1: Setup & Configuration',
      icon: <Settings className="h-4 w-4" />,
      description: 'Configure templates, rules, and data sources.'
    },
    {
      key: 'cycle',
      title: 'Phase 2: Monthly Cycle',
      icon: <Clock className="h-4 w-4" />,
      description: 'Generate, process, and finalize monthly payroll.'
    },
    {
      key: 'review',
      title: 'Phase 3: Review & Approval',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Review payroll results and share reports with stakeholders.'
    },
  ]

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get phase icon
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'setup': return <Settings className="h-4 w-4" />;
      case 'cycle': return <Workflow className="h-4 w-4" />;
      case 'review': return <CheckCircle className="h-4 w-4" />;
      case 'reporting': return <BarChart3 className="h-4 w-4" />;
      case 'employee': return <Users className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management System</h1>
          <p className="text-muted-foreground">
            {workflowStatus
              ? `Complete payroll workflow management • Current Phase: ${workflowStatus.currentPhase ?? 'N/A'} • Progress: ${overallProgress}%`
              : 'Complete payroll workflow management • Workflow data will appear once available.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenPipeline}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Open Pipeline
          </Button>
          <Button variant="outline" size="sm" onClick={fetchWorkflowStatus} disabled={isLoading}>
            Refresh
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
          <Badge variant="secondary">
            {workflowStatus?.currentPhase ? `${workflowStatus.currentPhase} Phase` : 'No phase data'}
          </Badge>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to load workflow data</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn('grid w-full', tabsGridClass)}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Workflow Overview Tab */}
        <TabsContent value="workflow-overview" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Payroll Workflow Progress
              </CardTitle>
              <CardDescription>
                Track the complete payroll process from setup to employee access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Phase Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {phaseDefinitions.map(({ key, title, icon, description }) => {
                    const stats = getPhaseStats(key)
                    const hasData = stats.total > 0
                    return (
                      <Card key={key} className="border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
                            {icon}
                            {title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="text-2xl font-bold text-gray-700">
                              {hasData ? `${stats.completed}/${stats.total} completed` : 'No data'}
                            </div>
                            {hasData && (
                              <Badge variant="outline" className="text-xs">
                                {stats.active} active • {stats.blocked} blocked
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {hasData ? description : (errorMessage ?? 'No workflow steps recorded yet for this phase.')}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Current Active Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSteps.length > 0 ? (
                  activeSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getPhaseIcon(step.phase)}
                        <div>
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={getStatusColor(step.status)}>
                              {step.status.replace('-', ' ')}
                            </Badge>
                            <Badge variant="secondary">
                              {step.assignedTo}
                            </Badge>
                            {step.estimatedTime && (
                              <span className="text-xs text-muted-foreground">
                                Est: {step.estimatedTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.status === 'in-progress' && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active workflow steps</p>
                    <p className="text-sm">{errorMessage ?? 'Active tasks will appear here once a payroll workflow is in progress.'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recently Completed Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recently Completed Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedSteps.length > 0 ? (
                  completedSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-4">
                        {getPhaseIcon(step.phase)}
                        <div>
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                            <Badge variant="outline">
                              {step.assignedTo}
                            </Badge>
                            {step.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(step.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed workflow steps</p>
                    <p className="text-sm">{errorMessage ?? 'Completed workflow steps will show up once payroll activities are finished.'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Integration Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Integrations & External Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Attendance Integration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Automated sync with attendance system for overtime calculations
                  </p>
                  <Badge variant="default" className="mt-2">Active</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    Banking APIs
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Direct integration for salary transfers and payment processing
                  </p>
                  <Badge variant="default" className="mt-2">Active</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4" />
                    Tax Calculation Service
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Automated tax calculations based on current regulations
                  </p>
                  <Badge variant="secondary" className="mt-2">Configured</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Notification Services
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Email and push notifications for payroll updates
                  </p>
                  <Badge variant="default" className="mt-2">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role-specific tabs */}
        {userRole === 'admin' && (
          <>        <TabsContent value="admin-dashboard">
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            <PayrollAdminDashboard />
          </div>
        </TabsContent>
        <TabsContent value="template-editor">
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            <SalaryTemplateEditor />
          </div>
        </TabsContent>
          </>
        )}

        {userRole === 'manager' && (        <TabsContent value="manager-review">
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            <ManagerReviewDashboard />
          </div>
        </TabsContent>
        )}

        <TabsContent value="employee-portal">
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            <EmployeeSelfServicePortal />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayrollWorkflowDashboard;
