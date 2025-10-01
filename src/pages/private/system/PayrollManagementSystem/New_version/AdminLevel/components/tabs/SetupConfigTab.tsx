import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { Settings, FileText, Users, AlertCircle } from 'lucide-react'

type SetupConfigTabProps = {
  onOpenTemplates: (tab?: string) => void
  onNavigateEmployeePortal: () => void
  onNavigateBankManagement: () => void
  onNavigateNotificationSettings: () => void
}

const SetupConfigTab = ({
  onOpenTemplates,
  onNavigateEmployeePortal,
  onNavigateBankManagement,
  onNavigateNotificationSettings
}: SetupConfigTabProps) => (
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
          <Button className="w-full" variant="outline" onClick={() => onOpenTemplates()}>
            <FileText className="h-4 w-4 mr-2" />
            Manage Salary Templates
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onOpenTemplates('rules')}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Calculation Rules
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onOpenTemplates('assignments')}>
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
          <Button className="w-full" variant="outline" onClick={onNavigateEmployeePortal}>
            <Users className="h-4 w-4 mr-2" />
            Employee Self-Service Portal
          </Button>
          <Button className="w-full" variant="outline" onClick={onNavigateBankManagement}>
            <FileText className="h-4 w-4 mr-2" />
            Bank Details Management
          </Button>
          <Button className="w-full" variant="outline" onClick={onNavigateNotificationSettings}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  </TabsContent>
)

export default SetupConfigTab
