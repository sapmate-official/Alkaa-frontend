import { useState, useEffect } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Eye, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import ReviewDrawer from './ReviewDrawer'
import { useToast } from '@/hooks/use-toast'
import * as pipelineApi from '../../services/pipelineApi'
import type { PayrollCycleDetails } from '../../../types/payroll'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import axios from 'axios'

// Use the SalaryRecord type from PayrollCycleDetails
type SalaryRecord = PayrollCycleDetails['salaryRecords'][number]

const ReviewStep = ({ cycleData, onDataChange, onNext }: StepProps) => {
  const { toast } = useToast()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBulkApproving, setIsBulkApproving] = useState(false)

  const totalEmployees = cycleData.cycle?.totalEmployees || 0
  const processedCount = cycleData.processedCount || totalEmployees

  // Calculate review statistics from records
  const pendingCount = salaryRecords.filter(r => r.status === 'PENDING' || r.status === 'PROCESSED').length
  const approvedCount = salaryRecords.filter(r => r.status === 'APPROVED').length
  const rejectedCount = salaryRecords.filter(r => r.status === 'REJECTED').length
  const allReviewed = salaryRecords.length > 0 && pendingCount === 0

  // Fetch salary records when component mounts or cycle changes
  useEffect(() => {
    if (cycleData.cycle?.id && salaryRecords.length === 0 && !isLoading) {
      fetchSalaryRecords()
    }
  }, [cycleData.cycle?.id])

  // Fetch salary records when component mounts or when needed
  const fetchSalaryRecords = async () => {
    if (!cycleData.cycle?.id) return

    setIsLoading(true)
    try {
      const response = await pipelineApi.fetchCycleSalaryRecords(cycleData.cycle.id)
      
      console.log('Fetched cycle response:', response)
      
      if (response.success && response.data?.salaryRecords) {
        console.log('Salary records:', response.data.salaryRecords)
        setSalaryRecords(response.data.salaryRecords)
      } else {
        console.error('Invalid response structure:', response)
        toast({
          title: 'Error',
          description: 'Failed to load salary records - invalid response structure',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to fetch salary records:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load salary records. Please try again.',
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
      const response = await pipelineApi.approveSalaryRecord(recordId, comments)
      
      if (response.success) {
        // Update local state
        setSalaryRecords(prev => prev.map(record => 
          record.id === recordId 
            ? { 
                ...record, 
                status: 'APPROVED',
                reviewComments: comments || null,
                reviewedAt: new Date(response.data.reviewedAt).toISOString()
              }
            : record
        ))

        toast({
          title: 'Success',
          description: 'Salary record approved successfully',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('Failed to approve record:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve salary record. Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleApproveAllPending = async () => {
    const pendingStatuses = new Set<SalaryRecord['status'] | undefined>(['PENDING', 'PROCESSED', 'PROCESSING', 'IN_PROGRESS', undefined])
    const targetRecords = salaryRecords.filter(record => pendingStatuses.has(record.status))

    if (targetRecords.length === 0) {
      toast({
        title: 'Nothing to approve',
        description: 'All salary records are already approved or have been rejected.',
      })
      return
    }

    const confirmMessage = `Approve all ${targetRecords.length} pending salary record${targetRecords.length > 1 ? 's' : ''}?`
    if (typeof window !== 'undefined' && !window.confirm(confirmMessage)) {
      return
    }

    setIsBulkApproving(true)
    try {
      const response = await pipelineApi.bulkApproveSalaryRecords(targetRecords.map(record => record.id))

      if (response.success) {
        const approvedAt = new Date().toISOString()
        const approvedIds = new Set(targetRecords.map(record => record.id))

        setSalaryRecords(prev => prev.map(record => (
          approvedIds.has(record.id)
            ? {
                ...record,
                status: 'APPROVED',
                reviewComments: record.reviewComments || null,
                reviewedAt: approvedAt
              }
            : record
        )))

        toast({
          title: 'All pending salaries approved',
          description: response.message || 'Every pending salary record has been approved successfully.',
          variant: 'default'
        })
      } else {
        toast({
          title: 'Bulk approval failed',
          description: response.message || 'Unable to approve all salary records. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to approve all salary records:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve all salary records. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsBulkApproving(false)
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
      const response = await pipelineApi.rejectSalaryRecord(recordId, comments)
      
      if (response.success) {
        // Update local state
        setSalaryRecords(prev => prev.map(record => 
          record.id === recordId 
            ? { 
                ...record, 
                status: 'REJECTED',
                reviewComments: comments,
                reviewedAt: new Date(response.data.reviewedAt).toISOString()
              }
            : record
        ))

        toast({
          title: 'Success',
          description: 'Salary record rejected with comments',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('Failed to reject record:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject salary record. Please try again.',
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

              {salaryRecords.length === 0 && !isLoading && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="space-y-4">
                    <div className="text-yellow-900">
                      <strong>No Salary Records Found</strong>
                      <p className="mt-2 text-sm">
                        No salary records were found for this cycle. This could happen if:
                      </p>
                      <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                        <li>No employees were processed in the previous step</li>
                        <li>All salary records failed during processing</li>
                        <li>The cycle was created but not started</li>
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          onDataChange((prev) => ({
                            ...prev,
                            reviewStarted: false,
                            allReviewed: false,
                            pendingReviewCount: 0,
                          }))
                          toast({
                            title: 'Skipped Review',
                            description: 'Review step skipped. You can proceed to the next step.',
                          })
                          onNext()
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Skip Review & Continue
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!cycleData.cycle?.id) return
                          
                          if (confirm('Are you sure you want to delete this payroll cycle? This action cannot be undone.')) {
                            try {
                              const response = await axios.delete(
                                APIV3Dictionary.payroll.deleteCycle(cycleData.cycle.id),
                                { withCredentials: true }
                              )
                              
                              if (response.data.success) {
                                toast({
                                  title: 'Success',
                                  description: 'Payroll cycle deleted successfully',
                                })
                                // Reset to first step
                                window.location.reload()
                              } else {
                                toast({
                                  title: 'Error',
                                  description: response.data.message || 'Failed to delete cycle',
                                  variant: 'destructive'
                                })
                              }
                            } catch (error) {
                              console.error('Failed to delete cycle:', error)
                              toast({
                                title: 'Error',
                                description: error instanceof Error ? error.message : 'Failed to delete cycle. Please try again.',
                                variant: 'destructive'
                              })
                            }
                          }
                        }}
                        variant="destructive"
                        className="flex-1"
                      >
                        Delete Cycle & Start Over
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!allReviewed && salaryRecords.length > 0 && (
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
        onApproveAllPending={handleApproveAllPending}
        isBulkApproving={isBulkApproving}
      />
    </div>
  )
}

export default ReviewStep
