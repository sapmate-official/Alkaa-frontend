import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthContext'
import { toast } from '@/hooks/use-toast'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import axios from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  DollarSign
} from 'lucide-react'

// Import all the components we created
import PayrollAdminDashboard from './AdminLevel/PayrollAdminDashboard'
import SalaryTemplateEditor from './AdminLevel/SalaryTemplateEditor'
import EmployeeSelfServicePortal from './EmployeeLevel/EmployeeSelfServicePortal'
import ManagerReviewDashboard from './ManagerLevel/ManagerReviewDashboard'

interface WorkflowStep {
  id: string;
  phase: 'setup' | 'cycle' | 'review' | 'reporting' | 'employee';
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignedTo: 'admin' | 'manager' | 'employee' | 'system';
  dependencies?: string[];
  estimatedTime?: string;
  completedAt?: string;
}

interface WorkflowStatus {
  currentPhase: string;
  overallProgress: number;
  activeSteps: WorkflowStep[];
  completedSteps: WorkflowStep[];
  blockedSteps: WorkflowStep[];
}

const PayrollWorkflowDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('workflow-overview');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Initialize workflow status
  useEffect(() => {
    const initializeWorkflow = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workflow status from backend
        const response = await axios.get(
          APIV3Dictionary.payroll.workflow.status,
          { withCredentials: true }
        );

        if (response.data && response.data.success) {
          const workflowData = response.data.data;
          setWorkflowStatus({
            currentPhase: workflowData.currentPhase || 'setup',
            overallProgress: workflowData.overallProgress || 0,
            activeSteps: workflowData.activeSteps || [],
            completedSteps: workflowData.completedSteps || [],
            blockedSteps: workflowData.blockedSteps || []
          });
        } else {
          // Set default empty workflow if no data
          setWorkflowStatus({
            currentPhase: 'setup',
            overallProgress: 0,
            activeSteps: [],
            completedSteps: [],
            blockedSteps: []
          });
        }
        
      } catch (error) {
        console.error('Error fetching workflow status:', error);
        
        // Set default empty workflow on error
        setWorkflowStatus({
          currentPhase: 'setup',
          overallProgress: 0,
          activeSteps: [],
          completedSteps: [],
          blockedSteps: []
        });
        
        toast({
          title: 'Warning',
          description: 'Could not load workflow status. Using default view.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorkflow();
  }, [user?.id]);

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

  // Get role-specific tabs
  const getRoleTabs = () => {
    const baseTabs = [
      { value: 'workflow-overview', label: 'Workflow Overview', icon: <Workflow className="h-4 w-4" /> }
    ];

    switch (userRole) {
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

  const tabs = getRoleTabs();

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
            Complete payroll workflow management • Current Phase: {workflowStatus?.currentPhase} • Progress: {workflowStatus?.overallProgress}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
          <Badge variant="secondary">
            {workflowStatus?.currentPhase} Phase
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
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
                    <span>{workflowStatus?.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${workflowStatus?.overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Phase Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
                        <Settings className="h-4 w-4" />
                        Phase 1: Setup & Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">Pending</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Backend workflow APIs not yet implemented
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4" />
                        Phase 2: Monthly Cycle
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">Pending</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Workflow management backend needed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
                        <BarChart3 className="h-4 w-4" />
                        Phase 3: Post-Payroll
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">Pending</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Workflow management backend needed
                      </p>
                    </CardContent>
                  </Card>
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
                {workflowStatus?.activeSteps && workflowStatus.activeSteps.length > 0 ? (
                  workflowStatus.activeSteps.map((step) => (
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
                    <p className="text-sm">Workflow management APIs not yet implemented</p>
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
                {workflowStatus?.completedSteps && workflowStatus.completedSteps.length > 0 ? (
                  workflowStatus.completedSteps.map((step) => (
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
                    <p className="text-sm">Workflow management APIs not yet implemented</p>
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
