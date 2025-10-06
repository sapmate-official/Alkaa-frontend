import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { BarChart3, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'

type ReportingTarget = 'tax' | 'analytics' | 'export' | 'audit' | 'compliance' | 'corrections'

type ReportingTabProps = {
  onNavigate: (target: ReportingTarget) => void
}

const ReportingTab = ({ onNavigate }: ReportingTabProps) => (
  <div className="space-y-6">
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
          <Button className="w-full" variant="outline" onClick={() => onNavigate('tax')}>
            <FileText className="h-4 w-4 mr-2" />
            Tax Summaries
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onNavigate('analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Payroll Analytics
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onNavigate('export')}>
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
          <Button className="w-full" variant="outline" onClick={() => onNavigate('audit')}>
            <FileText className="h-4 w-4 mr-2" />
            Audit Trail Review
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onNavigate('compliance')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Compliance Reports
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onNavigate('corrections')}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Handle Corrections
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
)

export default ReportingTab
