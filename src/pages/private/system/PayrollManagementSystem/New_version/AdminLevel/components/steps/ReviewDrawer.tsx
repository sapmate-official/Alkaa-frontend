import React, { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2, ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react'
import type { PayrollCycleDetails } from '../../../types/payroll'

// Use SalaryRecord type from PayrollCycleDetails
type SalaryRecord = PayrollCycleDetails['salaryRecords'][number]

type ReviewDrawerProps = {
  open: boolean
  onClose: () => void
  cycleLabel: string
  cycleYear: number
  records: SalaryRecord[]
  formatCurrency: (value: number) => string
  onApproveRecord: (recordId: string, comments?: string) => Promise<void>
  onRejectRecord: (recordId: string, comments: string) => Promise<void>
  isLoading?: boolean
}

const ReviewDrawer: React.FC<ReviewDrawerProps> = ({
  open,
  onClose,
  cycleLabel,
  cycleYear,
  records,
  formatCurrency,
  onApproveRecord,
  onRejectRecord,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedRecord = records.find(r => r.id === selectedRecordId) || null

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true
    const fullName = [record.user?.firstName, record.user?.lastName].filter(Boolean).join(' ').toLowerCase()
    const employeeId = record.user?.employeeId?.toLowerCase() || ''
    return fullName.includes(searchTerm.toLowerCase()) || employeeId.includes(searchTerm.toLowerCase())
  })

  const currentIndex = selectedRecord ? filteredRecords.findIndex(r => r.id === selectedRecord.id) : -1
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < filteredRecords.length - 1

  const handleNavigate = (direction: 'previous' | 'next') => {
    if (direction === 'previous' && canNavigatePrev) {
      setSelectedRecordId(filteredRecords[currentIndex - 1].id)
      setReviewComments('')
    } else if (direction === 'next' && canNavigateNext) {
      setSelectedRecordId(filteredRecords[currentIndex + 1].id)
      setReviewComments('')
    }
  }

  const handleApprove = async () => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await onApproveRecord(selectedRecord.id, reviewComments)
      setReviewComments('')
      // Auto-navigate to next record
      if (canNavigateNext) {
        handleNavigate('next')
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRecord || !reviewComments.trim()) {
      return
    }
    setIsSubmitting(true)
    try {
      await onRejectRecord(selectedRecord.id, reviewComments)
      setReviewComments('')
      // Auto-navigate to next record
      if (canNavigateNext) {
        handleNavigate('next')
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper functions to calculate totals
  const calculateTotalAllowances = (record: SalaryRecord) => {
    if (!record.allowances) return 0
    return Object.values(record.allowances).reduce((sum, amount) => sum + amount, 0)
  }

  const calculateTotalDeductions = (record: SalaryRecord) => {
    if (!record.deductions) return 0
    return Object.values(record.deductions).reduce((sum, amount) => sum + amount, 0)
  }

  const calculateGrossSalary = (record: SalaryRecord) => {
    return record.basicSalary + calculateTotalAllowances(record)
  }

  const getReviewStatusBadge = (status?: string) => {
    if (!status || status === 'PENDING' || status === 'PROCESSED' || status === 'PROCESSING') {
      return <Badge variant="secondary">Pending Review</Badge>
    }
    if (status === 'APPROVED') {
      return <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    }
    if (status === 'REJECTED') {
      return <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    }
    return null
  }

  const allowanceEntries = selectedRecord?.allowances 
    ? Object.entries(selectedRecord.allowances).map(([key, amount]) => ({ key, amount }))
    : []
  
  const deductionEntries = selectedRecord?.deductions
    ? Object.entries(selectedRecord.deductions).map(([key, amount]) => ({ key, amount }))
    : []

  const pendingCount = records.filter(r => !r.status || r.status === 'PENDING' || r.status === 'PROCESSED').length
  const approvedCount = records.filter(r => r.status === 'APPROVED').length
  const rejectedCount = records.filter(r => r.status === 'REJECTED').length

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DrawerContent className="flex h-[90vh] max-h-[90vh] flex-col">
        <DrawerHeader className="gap-1">
          <DrawerTitle>
            Review Salary Records - {cycleLabel} {cycleYear}
          </DrawerTitle>
          <DrawerDescription>
            Review each employee's salary calculation, approve or reject with comments. Navigate through employees one by one.
          </DrawerDescription>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary">{pendingCount} Pending</Badge>
            <Badge variant="success" className="bg-green-100 text-green-700">{approvedCount} Approved</Badge>
            <Badge variant="destructive">{rejectedCount} Rejected</Badge>
            <span>{records.length} Total Records</span>
          </div>
        </DrawerHeader>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Employee List Sidebar */}
          <div className="border-b md:w-72 md:border-b-0 md:border-r">
            <div className="px-3 pb-2 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Employees ({filteredRecords.length})
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID"
                className="h-8"
                aria-label="Search employees"
              />
            </div>
            <ScrollArea className="h-48 md:h-full">
              <div className="space-y-2 px-3 pb-6">
                {filteredRecords.length ? (
                  filteredRecords.map((record) => {
                    const fullName = [record.user?.firstName, record.user?.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Employee'
                    const employeeId = record.user?.employeeId || 'ID unavailable'
                    const isActive = selectedRecord?.id === record.id

                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecordId(record.id)
                          setReviewComments(record.reviewComments || '')
                        }}
                        className={cn(
                          'w-full rounded-md border p-3 text-left transition-colors',
                          isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/40 hover:bg-muted'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{fullName}</span>
                          {getReviewStatusBadge(record.status)}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {employeeId} • Net {formatCurrency(record.netSalary)}
                        </p>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    {records.length ? 'No employees match your search.' : 'No salary records found.'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Employee Details */}
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading salary records…
              </div>
            ) : selectedRecord ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {[selectedRecord.user?.firstName, selectedRecord.user?.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Employee overview'}
                        </CardTitle>
                        <CardDescription>
                          {selectedRecord.user?.employeeId || 'Employee ID unavailable'} •{' '}
                          {selectedRecord.user?.department?.name || 'Department N/A'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleNavigate('previous')}
                          disabled={!canNavigatePrev || isSubmitting}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {currentIndex + 1} / {filteredRecords.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleNavigate('next')}
                          disabled={!canNavigateNext || isSubmitting}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {getReviewStatusBadge(selectedRecord.status)}
                      <span>
                        Net {formatCurrency(selectedRecord.netSalary)} • Basic {formatCurrency(selectedRecord.basicSalary)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Template</p>
                        <p className="mt-1 font-semibold">
                          {selectedRecord.templateName || selectedRecord.templateId || 'Template not assigned'}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Processed</p>
                        <p className="mt-1 text-sm">
                          {selectedRecord.processedAt
                            ? new Date(selectedRecord.processedAt).toLocaleString()
                            : 'Not processed yet'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Salary Breakdown</CardTitle>
                    <CardDescription>Review the detailed salary calculation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Gross Salary</p>
                        <p className="text-xl font-bold">{formatCurrency(calculateGrossSalary(selectedRecord))}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Total Deductions</p>
                        <p className="text-xl font-bold text-red-600">
                          - {formatCurrency(calculateTotalDeductions(selectedRecord))}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4 bg-green-50">
                        <p className="text-xs text-green-700">Net Salary</p>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(selectedRecord.netSalary)}</p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold">Allowances</h4>
                        <Separator className="my-2" />
                        {allowanceEntries.length ? (
                          <div className="space-y-2">
                            {allowanceEntries.map((entry) => (
                              <div key={entry.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{entry.key}</span>
                                <span className="font-medium">{formatCurrency(entry.amount)}</span>
                              </div>
                            ))}
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>Total Allowances</span>
                              <span>{formatCurrency(calculateTotalAllowances(selectedRecord))}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No allowances applied.</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Deductions</h4>
                        <Separator className="my-2" />
                        {deductionEntries.length ? (
                          <div className="space-y-2">
                            {deductionEntries.map((entry) => (
                              <div key={entry.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{entry.key}</span>
                                <span className="font-medium">{formatCurrency(entry.amount)}</span>
                              </div>
                            ))}
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>Total Deductions</span>
                              <span>{formatCurrency(calculateTotalDeductions(selectedRecord))}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No deductions recorded.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Summary */}
                {selectedRecord.attendanceSummary && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Attendance Summary</CardTitle>
                      <CardDescription>Attendance data used for salary calculation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Working Days</p>
                          <p className="text-lg font-semibold">
                            {selectedRecord.attendanceSummary.workingDays || 0}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Present</p>
                          <p className="text-lg font-semibold text-green-600">
                            {selectedRecord.attendanceSummary.presentDays || 0}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Absent</p>
                          <p className="text-lg font-semibold text-red-600">
                            {selectedRecord.attendanceSummary.absentDays || 0}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Half Days</p>
                          <p className="text-lg font-semibold">
                            {selectedRecord.attendanceSummary.halfDays || 0}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Paid Leave</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {selectedRecord.attendanceSummary.paidLeaveDays || 0}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Unpaid Leave</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {selectedRecord.attendanceSummary.unpaidLeaveDays || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Review Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Review Decision</CardTitle>
                    <CardDescription>
                      Approve this salary record or reject it with comments for corrections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRecord.status === 'APPROVED' && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-900">Already Approved</AlertTitle>
                        <AlertDescription className="text-green-700">
                          This salary record has been approved.
                          {selectedRecord.reviewedAt && (
                            <> Reviewed on {new Date(selectedRecord.reviewedAt).toLocaleString()}</>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedRecord.status === 'REJECTED' && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Rejected</AlertTitle>
                        <AlertDescription>
                          This salary record has been rejected.
                          {selectedRecord.reviewComments && (
                            <p className="mt-2 italic">Reason: {selectedRecord.reviewComments}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="review-comments" className="text-sm font-medium">
                        Review Comments {selectedRecord.status !== 'APPROVED' && '(Required for rejection)'}
                      </label>
                      <Textarea
                        id="review-comments"
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        placeholder="Add comments about this salary record..."
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={isSubmitting || selectedRecord.status === 'APPROVED'}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={isSubmitting || !reviewComments.trim() || selectedRecord.status === 'REJECTED'}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select an employee from the list to review their salary record.
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="flex flex-col gap-2 border-t py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            {pendingCount} pending • {approvedCount} approved • {rejectedCount} rejected
          </p>
          <div className="flex flex-wrap gap-2">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default ReviewDrawer
