import { useState, useEffect } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Eye, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import ReviewDrawer from './ReviewDrawer'
import { useToast } from '@/hooks/use-toast'

// Mock salary record type - should match your actual API response
type SalaryRecord = {
  id: string
  userId: string
  netSalary: number
  basicSalary: number
  grossSalary: number
  totalAllowances: number
  totalDeductions: number
  status: string
  reviewStatus?: 'approved' | 'rejected' | 'pending'
  reviewComments?: string
  reviewedAt?: string
  processedAt?: string
  allowances?: Record<string, number>
  deductions?: Record<string, number>
  user?: {
    firstName?: string
    lastName?: string
    employeeId?: string
    department?: {
      name?: string
    }
  }
  templateName?: string
  templateId?: string
  attendanceSummary?: {
    workingDays?: number
    presentDays?: number
    absentDays?: number
    halfDays?: number
    paidLeaveDays?: number
    unpaidLeaveDays?: number
  }
}

const ReviewStep = ({ cycleData, onDataChange, onNext }: StepProps) => {
  const { toast } = useToast()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const totalEmployees = cycleData.cycle?.totalEmployees || 0
  const processedCount = cycleData.processedCount || totalEmployees

  // Calculate review statistics from records
  const pendingCount = salaryRecords.filter(r => !r.reviewStatus || r.reviewStatus === 'pending').length
  const approvedCount = salaryRecords.filter(r => r.reviewStatus === 'approved').length
  const rejectedCount = salaryRecords.filter(r => r.reviewStatus === 'rejected').length
  const allReviewed = salaryRecords.length > 0 && pendingCount === 0

  // Fetch salary records when component mounts or when needed
  const fetchSalaryRecords = async () => {
    if (!cycleData.cycle?.id) return

    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/payroll/cycles/${cycleData.cycle.id}/salary-records`)
      // const data = await response.json()
      
      // Mock data for demonstration
      const mockRecords: SalaryRecord[] = Array.from({ length: processedCount }, (_, i) => ({
        id: `record-${i + 1}`,
        userId: `user-${i + 1}`,
        basicSalary: 50000 + (i * 1000),
        grossSalary: 60000 + (i * 1200),
        totalAllowances: 10000 + (i * 200),
        totalDeductions: 5000 + (i * 100),
        netSalary: 55000 + (i * 1100),
        status: 'PROCESSED',
        reviewStatus: 'pending',
        processedAt: new Date().toISOString(),
        user: {
          firstName: `Employee`,
          lastName: `${i + 1}`,
          employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
          department: { name: 'Engineering' }
        },
        templateName: 'Standard Template',
        allowances: {
          'HRA': 5000 + (i * 100),
          'Transport': 3000 + (i * 50),
          'Special': 2000 + (i * 50)
        },
        deductions: {
          'PF': 2500 + (i * 50),
          'Tax': 2500 + (i * 50)
        },
        attendanceSummary: {
          workingDays: 26,
          presentDays: 24 + (i % 3),
          absentDays: 2 - (i % 3),
          halfDays: i % 2,
          paidLeaveDays: 1,
          unpaidLeaveDays: 0
        }
      }))

      setSalaryRecords(mockRecords)
    } catch (error) {
      console.error('Failed to fetch salary records:', error)
      toast({
        title: 'Error',
        description: 'Failed to load salary records. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenReviewDrawer = () => {
    if (salaryRecords.length === 0) {
      fetchSalaryRecords()
    }
    setIsDrawerOpen(true)
  }

  const handleApproveRecord = async (recordId: string, comments?: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/payroll/salary-records/${recordId}/approve`, {
      //   method: 'POST',
      //   body: JSON.stringify({ comments })
      // })

      // Update local state
      setSalaryRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              reviewStatus: 'approved' as const, 
              reviewComments: comments,
              reviewedAt: new Date().toISOString()
            }
          : record
      ))

      toast({
        title: 'Success',
        description: 'Salary record approved successfully',
        variant: 'default'
      })
    } catch (error) {
      console.error('Failed to approve record:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve salary record. Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleRejectRecord = async (recordId: string, comments: string) => {
    if (!comments.trim()) {
      toast({
        title: 'Error',
        description: 'Comments are required when rejecting a salary record',
        variant: 'destructive'
      })
      return
    }

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/payroll/salary-records/${recordId}/reject`, {
      //   method: 'POST',
      //   body: JSON.stringify({ comments })
      // })

      // Update local state
      setSalaryRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              reviewStatus: 'rejected' as const, 
              reviewComments: comments,
              reviewedAt: new Date().toISOString()
            }
          : record
      ))

      toast({
        title: 'Success',
        description: 'Salary record rejected with comments',
        variant: 'default'
      })
    } catch (error) {
      console.error('Failed to reject record:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject salary record. Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const handleProceedToApproval = () => {
    // Update cycle data with review completion
    onDataChange((prev) => ({
      ...prev,
      reviewStarted: true,
      allReviewed: true,
      pendingReviewCount: 0,
      reviewedCount: approvedCount + rejectedCount,
      approvedCount: approvedCount,
      rejectedCount: rejectedCount
    }))
    onNext()
  }

  // Update cycle data when review status changes
  useEffect(() => {
    if (salaryRecords.length > 0) {
      onDataChange((prev) => ({
        ...prev,
        reviewStarted: true,
        allReviewed: allReviewed,
        pendingReviewCount: pendingCount,
        reviewedCount: approvedCount + rejectedCount,
        approvedCount: approvedCount,
        rejectedCount: rejectedCount
      }))
    }
  }, [salaryRecords, pendingCount, approvedCount, rejectedCount, allReviewed, onDataChange])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review & Validation
          </CardTitle>
          <CardDescription>
            Review salary calculations employee by employee and approve or request changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && salaryRecords.length === 0 ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading salary records…
            </div>
          ) : (
            <>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Review individual salary records one by one, verify calculations, and approve or flag discrepancies.
                  Use the drawer interface to navigate through each employee.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs mb-1">Total Records</p>
                      <p className="text-2xl font-bold">{processedCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-green-700 text-xs mb-1">Approved</p>
                      <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-blue-700 text-xs mb-1">Pending</p>
                      <p className="text-2xl font-bold text-blue-900">{pendingCount}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {rejectedCount > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-700 text-sm font-medium">Rejected Records</p>
                        <p className="text-xs text-red-600">These records require corrections</p>
                      </div>
                      <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!allReviewed && (
                <Button onClick={handleOpenReviewDrawer} className="w-full" size="lg">
                  <Eye className="h-4 w-4 mr-2" />
                  {approvedCount > 0 ? 'Continue Review Process' : 'Start Review Process'}
                </Button>
              )}

              {allReviewed && (
                <>
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      <strong>Review Complete!</strong> All salary records have been reviewed.
                      {approvedCount > 0 && ` ${approvedCount} approved`}
                      {rejectedCount > 0 && `, ${rejectedCount} rejected`}.
                      You can now proceed to final approval.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleProceedToApproval}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="lg"
                      disabled={approvedCount === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Proceed to Final Approval ({approvedCount} records)
                    </Button>
                    
                    <Button 
                      onClick={handleOpenReviewDrawer}
                      variant="outline"
                      size="lg"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Again
                    </Button>
                  </div>
                </>
              )}

              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Review Guidelines:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Navigate through employees one by one using Previous/Next buttons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Review salary breakdown, allowances, and deductions carefully</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Check attendance summary for accuracy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Approve if correct, or reject with detailed comments for corrections</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Drawer */}
      <ReviewDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        cycleLabel={`Month ${cycleData.cycle?.month || ''}`}
        cycleYear={cycleData.cycle?.year || new Date().getFullYear()}
        records={salaryRecords}
        formatCurrency={formatCurrency}
        onApproveRecord={handleApproveRecord}
        onRejectRecord={handleRejectRecord}
        isLoading={isLoading}
      />
    </div>
  )
}

export default ReviewStep
