import { useState, useEffect } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, Users, FileText, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { toast } from '@/hooks/use-toast'

const MONTH_OPTIONS = [
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
]

const CreateCycleStep = ({ cycleData, onDataChange, onNext }: StepProps) => {
  const currentDate = new Date()
  const [month, setMonth] = useState<number>(cycleData.month || currentDate.getMonth() + 1)
  const [year, setYear] = useState<number>(cycleData.year || currentDate.getFullYear())
  const [templateId, setTemplateId] = useState<string>('')
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true)
      try {
        const response = await axios.get(APIV3Dictionary.payroll.templates.list, {
          withCredentials: true
        })
        
        if (response.data.success && Array.isArray(response.data.data)) {
          setTemplates(response.data.data)
          
          // Auto-select first template if available
          if (response.data.data.length > 0 && !templateId) {
            setTemplateId(response.data.data[0].id)
          }
        }
      } catch (error: any) {
        console.error('Failed to load templates:', error)
        toast({
          title: 'Warning',
          description: 'Could not load salary templates. You can continue without a template.',
          variant: 'default'
        })
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [])

  const handleCreateCycle = async () => {
    setError(null)
    setIsCreating(true)

    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.createCycle,
        {
          month,
          year,
          templateId: templateId || undefined
        },
        { withCredentials: true }
      )

      if (response.data.success && response.data.data) {
        const createdCycle = response.data.data
        
        // Update cycle data
        onDataChange((prev) => ({
          ...prev,
          cycle: createdCycle,
          cycleId: createdCycle.id,
          month,
          year,
          template: templates.find((t) => t.id === templateId) || null
        }))

        toast({
          title: 'Cycle Created',
          description: `Payroll cycle for ${MONTH_OPTIONS.find(m => m.value === month)?.label} ${year} has been created successfully.`
        })

        // Automatically move to next step
        setTimeout(() => {
          onNext()
        }, 500)
      } else {
        throw new Error(response.data.message || 'Failed to create cycle')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create payroll cycle'
      setError(errorMessage)
      toast({
        title: 'Creation Failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const selectedTemplate = templates.find((t) => t.id === templateId)
  const hasExistingCycle = Boolean(cycleData.cycle && cycleData.cycleId)

  return (
    <div className="space-y-6">
      {/* Existing Cycle Info */}
      {hasExistingCycle && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Cycle already created for {MONTH_OPTIONS.find(m => m.value === cycleData.month)?.label} {cycleData.year}.
            You can continue to the next step.
          </AlertDescription>
        </Alert>
      )}

      {/* Create New Cycle Form */}
      {!hasExistingCycle && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Month Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={month.toString()}
                  onValueChange={(value) => setMonth(parseInt(value))}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Year Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={year.toString()}
                  onValueChange={(value) => setYear(parseInt(value))}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((yr) => (
                      <SelectItem key={yr} value={yr.toString()}>
                        {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Salary Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={templateId || "none"}
                    onValueChange={(value) => setTemplateId(value === "none" ? "" : value)}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Template</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Template Details */}
          {selectedTemplate && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Template Details</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  {selectedTemplate.baseSalary && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Salary:</span>
                      <span className="font-medium">₹{selectedTemplate.baseSalary.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedTemplate.totalEmployees && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employees:</span>
                      <span className="font-medium">{selectedTemplate.totalEmployees}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Create Button */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ready to create payroll cycle?</h3>
                  <p className="text-sm text-muted-foreground">
                    This will create a new cycle for {MONTH_OPTIONS.find(m => m.value === month)?.label} {year}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleCreateCycle}
                  disabled={isCreating}
                  className="ml-4"
                >
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreating ? 'Creating...' : 'Create Cycle'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Existing Cycle Continue */}
      {hasExistingCycle && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Cycle Created Successfully</h3>
                <p className="text-sm text-muted-foreground">
                  Continue to setup and configure your payroll
                </p>
              </div>
              <Button size="lg" onClick={onNext}>
                Continue to Setup →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CreateCycleStep
