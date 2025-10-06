import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Users, FileText, Download, AlertCircle, Settings } from 'lucide-react'

type EmployeePortalTabProps = {
  onPortalShortcut: (tab: string, extraState?: Record<string, unknown>) => void
  onNavigateSendNotification: () => void
  onNavigatePortalSettings: () => void
}

const EmployeePortalTab = ({
  onPortalShortcut,
  onNavigateSendNotification,
  onNavigatePortalSettings
}: EmployeePortalTabProps) => (
  <div className="space-y-6">
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
          <Button className="w-full" variant="outline" onClick={() => onPortalShortcut('payslips')}>
            <FileText className="h-4 w-4 mr-2" />
            Historical Payslips
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => onPortalShortcut('payslips', { action: 'download' })}
          >
            <Download className="h-4 w-4 mr-2" />
            Download/Print Options
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onPortalShortcut('disputes')}>
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
          <Button className="w-full" variant="outline" onClick={onNavigateSendNotification}>
            <Users className="h-4 w-4 mr-2" />
            Send Notifications
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onPortalShortcut('profile')}>
            <FileText className="h-4 w-4 mr-2" />
            Preview Portal
          </Button>
          <Button className="w-full" variant="outline" onClick={onNavigatePortalSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Portal Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
)

export default EmployeePortalTab
