import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { toast } from '@/hooks/use-toast'
import RouteDict from '@/routes/RouteDict'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Plus,
  MessageSquare,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

type WorkflowPhase = 'setup' | 'cycle' | 'review' | 'reporting' | 'employee'
type StepStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

interface WorkflowStep {
  id: string
  title: string
  description?: string
  phase: WorkflowPhase
  order: number
  status: StepStatus
  assignedTo?: string
  estimatedHours?: number
  dependencies?: string[]
  comments?: string
  month: number
  year: number
  completedAt?: string
  createdAt: string
  updatedAt: string
  completedBy?: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
  }
}

interface WorkflowStatus {
  currentPhase: WorkflowPhase
  overallProgress: number
  activeCycle: any
  activeSteps: WorkflowStep[]
  completedSteps: WorkflowStep[]
  blockedSteps: WorkflowStep[]
  month: number
  year: number
}

interface WorkflowTabProps {
  selectedMonth: number
  selectedYear: number
}

const PHASE_LABELS: Record<WorkflowPhase, string> = {
  setup: 'Setup & Configuration',
  cycle: 'Payroll Cycle',
  review: 'Review & Approval',
  reporting: 'Reporting & Payouts',
  employee: 'Employee Services'
}

const PHASE_COLORS: Record<WorkflowPhase, string> = {
  setup: 'bg-blue-100 text-blue-700 border-blue-200',
  cycle: 'bg-purple-100 text-purple-700 border-purple-200',
  review: 'bg-amber-100 text-amber-700 border-amber-200',
  reporting: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  employee: 'bg-pink-100 text-pink-700 border-pink-200'
}

const getStatusConfig = (status: StepStatus) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: 'bg-green-100 text-green-700 border-green-200'
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        icon: <PlayCircle className="h-4 w-4" />,
        className: 'bg-blue-100 text-blue-700 border-blue-200'
      }
    case 'pending':
      return {
        label: 'Pending',
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-slate-100 text-slate-700 border-slate-200'
      }
    case 'blocked':
      return {
        label: 'Blocked',
        icon: <XCircle className="h-4 w-4" />,
        className: 'bg-red-100 text-red-700 border-red-200'
      }
  }
}

const WorkflowTab = ({ selectedMonth, selectedYear }: WorkflowTabProps) => {
  const navigate = useNavigate()
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null)
  const [allSteps, setAllSteps] = useState<WorkflowStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<StepStatus>('pending')
  const [updateComments, setUpdateComments] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenPipeline = () => {
    navigate(RouteDict.Payroll.Admin.Pipeline)
  }

  const fetchWorkflowData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      // Fetch workflow status
      const statusResponse = await axios.get(APIV3Dictionary.payroll.workflow.status, {
        params: { month: selectedMonth, year: selectedYear },
        withCredentials: true
      })

      // Fetch all workflow steps
      const stepsResponse = await axios.get(APIV3Dictionary.payroll.workflow.steps, {
        params: { month: selectedMonth, year: selectedYear },
        withCredentials: true
      })

      if (statusResponse.data.success) {
        setWorkflowStatus(statusResponse.data.data)
      }

      if (stepsResponse.data.success) {
        setAllSteps(stepsResponse.data.data || [])
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to load workflow data'
      setErrorMessage(message)
      toast({
        title: 'Error loading workflow',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  const initializeWorkflow = async () => {
    try {
      setIsInitializing(true)

      const response = await axios.post(
        APIV3Dictionary.payroll.workflow.initialize,
        {
          month: selectedMonth,
          year: selectedYear
        },
        { withCredentials: true }
      )

      if (response.data.success) {
        toast({
          title: 'Workflow initialized',
          description: `Created ${response.data.data.totalSteps} workflow steps`
        })
        await fetchWorkflowData()
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to initialize workflow'
      toast({
        title: 'Initialization failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const handleUpdateStep = async () => {
    if (!selectedStep) return

    try {
      setIsUpdating(true)

      const response = await axios.put(
        APIV3Dictionary.payroll.workflow.updateStep(selectedStep.id),
        {
          status: updateStatus,
          comments: updateComments || undefined,
          completedAt: updateStatus === 'completed' ? new Date().toISOString() : undefined
        },
        { withCredentials: true }
      )

      if (response.data.success) {
        toast({
          title: 'Step updated',
          description: `Workflow step status changed to ${updateStatus}`
        })
        setIsUpdateDialogOpen(false)
        setSelectedStep(null)
        setUpdateComments('')
        await fetchWorkflowData()
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update workflow step'
      toast({
        title: 'Update failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openUpdateDialog = (step: WorkflowStep) => {
    setSelectedStep(step)
    setUpdateStatus(step.status)
    setUpdateComments(step.comments || '')
    setIsUpdateDialogOpen(true)
  }

  useEffect(() => {
    fetchWorkflowData()
  }, [fetchWorkflowData])

  const groupStepsByPhase = (steps: WorkflowStep[]) => {
    return steps.reduce((acc, step) => {
      if (!acc[step.phase]) {
        acc[step.phase] = []
      }
      acc[step.phase].push(step)
      return acc
    }, {} as Record<WorkflowPhase, WorkflowStep[]>)
  }

  const stepsByPhase = groupStepsByPhase(allSteps)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (errorMessage && !workflowStatus && allSteps.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load workflow</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{errorMessage}</p>
          <Button variant="outline" size="sm" onClick={fetchWorkflowData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!workflowStatus && allSteps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initialize Workflow</CardTitle>
          <CardDescription>
            No workflow found for {selectedMonth}/{selectedYear}. Initialize a new workflow to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={initializeWorkflow} disabled={isInitializing}>
            {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Plus className="h-4 w-4 mr-2" />
            Initialize Workflow
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      {workflowStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workflow Overview</CardTitle>
                <CardDescription>
                  {PHASE_LABELS[workflowStatus.currentPhase]} - {selectedMonth}/{selectedYear}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleOpenPipeline}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Open Pipeline
                </Button>
                <Button variant="outline" size="sm" onClick={fetchWorkflowData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{workflowStatus.overallProgress}%</span>
              </div>
              <Progress value={workflowStatus.overallProgress} className="h-2" />
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{workflowStatus.activeSteps.length}</div>
                    <div className="text-sm text-muted-foreground">Active Steps</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{workflowStatus.completedSteps.length}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{workflowStatus.blockedSteps.length}</div>
                    <div className="text-sm text-muted-foreground">Blocked</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge variant="outline" className={PHASE_COLORS[workflowStatus.currentPhase]}>
                      {PHASE_LABELS[workflowStatus.currentPhase]}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-2">Current Phase</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline CTA */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Visual Pipeline View</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your payroll cycle with an interactive step-by-step pipeline interface
                    </p>
                  </div>
                  <Button onClick={handleOpenPipeline} size="lg" className="ml-4">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Open Pipeline
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Workflow Steps by Phase */}
      <div className="space-y-6">
        {(Object.keys(stepsByPhase) as WorkflowPhase[]).map((phase) => {
          const phaseSteps = stepsByPhase[phase]
          if (!phaseSteps || phaseSteps.length === 0) return null

          const completedCount = phaseSteps.filter((s) => s.status === 'completed').length
          const phaseProgress = Math.round((completedCount / phaseSteps.length) * 100)

          return (
            <Card key={phase}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {PHASE_LABELS[phase]}
                      <Badge variant="outline" className={PHASE_COLORS[phase]}>
                        {completedCount}/{phaseSteps.length} completed
                      </Badge>
                    </CardTitle>
                    <Progress value={phaseProgress} className="h-1 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phaseSteps
                    .sort((a, b) => a.order - b.order)
                    .map((step) => {
                      const statusConfig = getStatusConfig(step.status)
                      return (
                        <div
                          key={step.id}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-lg border',
                            step.status === 'in_progress' && 'border-blue-300 bg-blue-50',
                            step.status === 'completed' && 'border-green-200 bg-green-50',
                            step.status === 'blocked' && 'border-red-200 bg-red-50'
                          )}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">{statusConfig.icon}</div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{step.title}</h4>
                                <Badge variant="outline" className={statusConfig.className}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              {step.description && (
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {step.assignedTo && <span>Assigned: {step.assignedTo}</span>}
                                {step.estimatedHours && <span>Est: {step.estimatedHours}h</span>}
                                {step.completedBy && (
                                  <span>
                                    Completed by: {step.completedBy.firstName} {step.completedBy.lastName}
                                  </span>
                                )}
                              </div>
                              {step.comments && (
                                <div className="flex items-start gap-2 text-sm mt-2 p-2 bg-white rounded border">
                                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <p className="text-muted-foreground">{step.comments}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(step)}
                            disabled={step.status === 'blocked'}
                          >
                            Update
                          </Button>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Update Step Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Workflow Step</DialogTitle>
            <DialogDescription>{selectedStep?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={updateStatus} onValueChange={(value) => setUpdateStatus(value as StepStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea
                value={updateComments}
                onChange={(e) => setUpdateComments(e.target.value)}
                placeholder="Add any comments or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStep} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WorkflowTab
