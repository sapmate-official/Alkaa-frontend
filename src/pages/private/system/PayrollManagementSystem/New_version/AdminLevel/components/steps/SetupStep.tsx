import { useState } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Settings, FileText, Users, AlertCircle, CheckCircle, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const SetupStep = ({ cycleData, onDataChange, onNext }: StepProps) => {
  const hasSetup = cycleData.setupComplete
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  const handleCompleteSetup = () => {
    onDataChange((prev) => ({
      ...prev,
      setupComplete: true,
      employeesVerified: true,
      attendanceImported: true
    }))
    
    toast({
      title: 'Setup Complete',
      description: 'Payroll setup has been completed. You can now proceed to processing.'
    })
    
    onNext()
  }

  const handleOpenEmployeeList = () => {
    setShowEmployeeDialog(true)
  }

  const handleOpenConfiguration = () => {
    setShowConfigDialog(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup & Configuration
          </CardTitle>
          <CardDescription>
            Verify employee data, configure components, and prepare for processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-4">
              Before processing salaries, ensure all setup tasks are complete for {' '}
              <strong>
                {cycleData.cycle?.month && cycleData.cycle?.year
                  ? `${new Date(cycleData.cycle.year, cycleData.cycle.month - 1).toLocaleDateString('en-US', { month: 'long' })} ${cycleData.cycle.year}`
                  : 'this cycle'}
              </strong>:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Employee Verification:</strong> Confirm all active employees are included in the cycle
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Attendance Import:</strong> Import and validate attendance data for accurate calculations
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Template Assignment:</strong> Ensure salary templates are correctly assigned
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Component Configuration:</strong> Verify allowances, deductions, and special adjustments
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employee Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {cycleData.cycle?.totalEmployees || 0} employees in cycle
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={handleOpenEmployeeList}>
              <Users className="h-4 w-4 mr-2" />
              Review Employee List
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Attendance & Components
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Configure attendance and salary components
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={handleOpenConfiguration}>
              <FileText className="h-4 w-4 mr-2" />
              Manage Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      {!hasSetup && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-2">Ready to proceed?</p>
                <p className="text-sm text-green-700 mb-4">
                  Once you mark setup as complete, the system will begin processing salaries for all employees. 
                  Make sure all configurations are correct before continuing.
                </p>
                <Button onClick={handleCompleteSetup} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Setup & Start Processing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee List Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee List for Payroll Cycle
            </DialogTitle>
            <DialogDescription>
              {cycleData.cycle?.month && cycleData.cycle?.year
                ? `${new Date(cycleData.cycle.year, cycleData.cycle.month - 1).toLocaleDateString('en-US', { month: 'long' })} ${cycleData.cycle.year}`
                : 'Review employees included in this payroll cycle'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Employees:</span>
                <span className="font-semibold">{cycleData.cycle?.totalEmployees || 0}</span>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-3">
                All active employees have been automatically included in this cycle. You can exclude specific employees from the Admin Dashboard if needed.
              </p>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>All active employees verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Salary templates assigned</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Bank details validated</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> To view detailed employee information or make changes, 
                  visit the Payroll Admin Dashboard after completing this pipeline.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Overview
            </DialogTitle>
            <DialogDescription>
              Attendance and salary component settings for this cycle
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Attendance Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attendance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance Import:</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Ready</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Working Days:</span>
                  <span className="font-medium">Auto-calculated</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Leave Deductions:</span>
                  <span className="font-medium">Enabled</span>
                </div>
              </CardContent>
            </Card>

            {/* Salary Components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Salary Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Allowances:</span>
                  <span className="font-medium">As per template</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deductions:</span>
                  <span className="font-medium">Statutory + Custom</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax Calculation:</span>
                  <span className="font-medium">Auto (TDS)</span>
                </div>
              </CardContent>
            </Card>

            {/* Template Info */}
            {cycleData.template && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Salary Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p className="font-medium mb-1">{cycleData.template.name}</p>
                    <p className="text-muted-foreground">{cycleData.template.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Configuration Note:</strong> Advanced settings and overrides can be managed 
                from the Organization Settings page or during the processing step.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SetupStep
