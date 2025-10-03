import React from 'react'
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
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PayrollCycle, PayrollCycleDetails } from '../../types/payroll'

type ProcessingRecord = PayrollCycleDetails['salaryRecords'][number]
type CalculationDetail = NonNullable<ProcessingRecord['calculationDetails']>[number]

type ProcessingDrawerProps = {
  open: boolean
  onClose: () => void
  selectedCycleLabel: string | null
  selectedCycleYear: number | null
  selectedCycle: PayrollCycle | null
  formatCurrency: (value: number) => string
  getStatusBadgeVariant: (status: string) => 'default' | 'destructive' | 'secondary' | 'outline' | 'success'
  employeeSearchTerm: string
  onEmployeeSearchTermChange: (value: string) => void
  filteredRecords: ProcessingRecord[]
  processingRecords: ProcessingRecord[]
  selectedRecord: ProcessingRecord | null
  onSelectRecord: (id: string | null) => void
  renderPaymentStatusBadge: (status?: string) => React.ReactNode
  formatPaymentStatus: (status?: string) => string
  isLoading: boolean
  error: string | null
  onRetry: () => void
  processingDetails: PayrollCycleDetails | null
  allowanceEntries: Array<{ key: string; amount: number }>
  deductionEntries: Array<{ key: string; amount: number }>
  calculationDetails: CalculationDetail[]
  attendanceSummary: ProcessingRecord['attendanceSummary']
  cycleSummary: { total: number; pending: number; approved: number; failed: number }
  onNavigateRecord: (direction: 'previous' | 'next') => void
  canNavigatePrev: boolean
  canNavigateNext: boolean
  onSubmitCycleForReview: () => void
  canSubmitCycleForReview: boolean
  isSubmittingForReview: boolean
  onOpenTemplateDialog: () => void
  onRecalculateSalary: () => void
  isRecalculatingSalary: boolean
}

const ProcessingDrawer: React.FC<ProcessingDrawerProps> = ({
  open,
  onClose,
  selectedCycleLabel,
  selectedCycleYear,
  selectedCycle,
  formatCurrency,
  getStatusBadgeVariant,
  employeeSearchTerm,
  onEmployeeSearchTermChange,
  filteredRecords,
  processingRecords,
  selectedRecord,
  onSelectRecord,
  renderPaymentStatusBadge,
  formatPaymentStatus,
  isLoading,
  error,
  onRetry,
  processingDetails,
  allowanceEntries,
  deductionEntries,
  calculationDetails,
  attendanceSummary,
  cycleSummary,
  onNavigateRecord,
  canNavigatePrev,
  canNavigateNext,
  onSubmitCycleForReview,
  canSubmitCycleForReview,
  isSubmittingForReview,
  onOpenTemplateDialog,
  onRecalculateSalary,
  isRecalculatingSalary
}) => {
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
            {selectedCycleLabel && selectedCycleYear
              ? `Processing ${selectedCycleLabel} ${selectedCycleYear}`
              : 'Cycle processing workspace'}
          </DrawerTitle>
          <DrawerDescription>
            Navigate through each employee to validate salary breakdowns, attendance inputs, and template assignments before approval.
          </DrawerDescription>
          {selectedCycle && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant={getStatusBadgeVariant(selectedCycle.status)}>
                {selectedCycle.status.replace('_', ' ')}
              </Badge>
              <span>
                {selectedCycle.processedCount} / {selectedCycle.totalEmployees} processed
              </span>
              {typeof selectedCycle.totalAmount === 'number' && (
                <span>Total {formatCurrency(selectedCycle.totalAmount)}</span>
              )}
            </div>
          )}
        </DrawerHeader>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <div className="border-b md:w-72 md:border-b-0 md:border-r">
            <div className="px-3 pb-2 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Employees
              </div>
              <Input
                value={employeeSearchTerm}
                onChange={(event) => onEmployeeSearchTermChange(event.target.value)}
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
                        onClick={() => onSelectRecord(record.id)}
                        className={cn(
                          'w-full rounded-md border p-3 text-left transition-colors',
                          isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/40 hover:bg-muted'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{fullName}</span>
                          <Badge variant={getStatusBadgeVariant(record.status)}>{record.status}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {employeeId} • Net {formatCurrency(record.netSalary)}
                        </p>
                        {record.paymentStatus && (
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Payment: {formatPaymentStatus(record.paymentStatus)}
                          </p>
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    {processingRecords.length
                      ? 'No employees match your search.'
                      : 'No salary records generated yet for this cycle.'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading cycle details…
              </div>
            ) : error ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTitle>Unable to load processing data</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div>
                  <Button size="sm" onClick={onRetry}>
                    Retry fetch
                  </Button>
                </div>
              </div>
            ) : selectedRecord ? (
              <div className="space-y-4">
                {isRecalculatingSalary && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Recalculating salary…</AlertTitle>
                    <AlertDescription>
                      We’re regenerating this employee’s payroll data using the latest template and attendance inputs.
                    </AlertDescription>
                  </Alert>
                )}
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
                          {(selectedRecord.user?.department?.name && selectedRecord.user.department.name) || 'Department N/A'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onNavigateRecord('previous')}
                          disabled={!canNavigatePrev}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onNavigateRecord('next')}
                          disabled={!canNavigateNext}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={getStatusBadgeVariant(selectedRecord.status)}>
                        {selectedRecord.status}
                      </Badge>
                      {selectedRecord.paymentStatus && renderPaymentStatusBadge(selectedRecord.paymentStatus)}
                      <span>
                        Net salary {formatCurrency(selectedRecord.netSalary)} • Basic {formatCurrency(selectedRecord.basicSalary)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Template</p>
                        <p className="mt-1 font-semibold">
                          {selectedRecord.templateName || selectedRecord.templateId ||
                            processingDetails?.template?.name ||
                            'Template not assigned'}
                        </p>
                        {processingDetails?.template?.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {processingDetails.template.description}
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Processing timeline</p>
                        <p className="mt-1 text-sm">
                          Calculated on{' '}
                          {selectedRecord.processedAt
                            ? new Date(selectedRecord.processedAt).toLocaleString()
                            : 'Not processed yet'}
                        </p>
                        {selectedRecord.reviewedAt && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed on {new Date(selectedRecord.reviewedAt).toLocaleString()}
                          </p>
                        )}
                        {selectedRecord.reviewComments && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            “{selectedRecord.reviewComments}”
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Salary breakdown</CardTitle>
                    <CardDescription>
                      Detailed earnings and deductions for the selected employee in this cycle.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No deductions recorded.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Calculation details</h4>
                      <Separator className="my-2" />
                      {calculationDetails.length ? (
                        <div className="space-y-3 text-sm">
                          {calculationDetails.map((item, index) => (
                            <div key={`${item.label}-${index}`} className="rounded-md border p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.label}</span>
                                <span className={cn('font-semibold', item.amount < 0 && 'text-destructive')}>
                                  {formatCurrency(item.amount)}
                                </span>
                              </div>
                              {item.description && (
                                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                              )}
                              {item.formula && (
                                <p className="mt-1 text-[10px] font-mono text-muted-foreground">{item.formula}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Detailed calculation traces will appear here once available from the engine.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Attendance review</CardTitle>
                    <CardDescription>
                      Verify check-in/out data and leave contributions impacting this salary.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {attendanceSummary ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Working days</p>
                          <p className="text-lg font-semibold">
                            {attendanceSummary.workingDays ?? attendanceSummary.totalDays ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Presence mix</p>
                          <p className="text-sm font-medium">
                            Present {attendanceSummary.presentDays ?? 0} • Absent {attendanceSummary.absentDays ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Paid leave {attendanceSummary.paidLeaveDays ?? 0} • Unpaid leave {attendanceSummary.unpaidLeaveDays ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Overtime & Exceptions</p>
                          <p className="text-sm font-medium">
                            Overtime {attendanceSummary.overtimeHours ?? 0}h • Late marks {attendanceSummary.lateMarks ?? 0}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTitle>Attendance integration coming soon</AlertTitle>
                        <AlertDescription>
                          Raw attendance records are not yet linked. This section will surface check-ins, leaves, and manual adjustments once the integration lands.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Next actions</CardTitle>
                    <CardDescription>
                      Use these quick actions to finalise salaries before sending the cycle for review. Additional adjustment tooling is on the way.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      • Use <span className="font-medium">Change template</span> to reassign the employee to a different salary structure instantly.
                    </p>
                    <p>
                      • Kick off a clean recalculation with <span className="font-medium">Recalculate salary</span> to pull in the latest template and attendance data.
                    </p>
                    <p>
                      • Manual attendance corrections will arrive soon and auto-trigger regeneration with full audit logging.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a salary record from the list to view its breakdown.
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="flex flex-col gap-2 border-t py-3 md:flex-row md:items-center md:justify-between">
          <p
            className={cn(
              'text-xs text-muted-foreground',
              (cycleSummary.pending > 0 || cycleSummary.failed > 0) && 'text-destructive'
            )}
          >
            {cycleSummary.total
              ? `${cycleSummary.pending} pending • ${cycleSummary.approved} ready • ${cycleSummary.failed} require attention`
              : 'No salary records generated yet for this cycle.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DrawerClose>
            <Button
              size="sm"
              onClick={onSubmitCycleForReview}
              disabled={!canSubmitCycleForReview || isLoading || isRecalculatingSalary || isSubmittingForReview}
            >
              {isSubmittingForReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTemplateDialog}
              disabled={!selectedRecord || isLoading || isRecalculatingSalary || isSubmittingForReview}
            >
              Change template
            </Button>
            <Button
              size="sm"
              onClick={onRecalculateSalary}
              disabled={!selectedRecord || isLoading || isRecalculatingSalary || isSubmittingForReview}
            >
              {isRecalculatingSalary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Recalculate salary
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default ProcessingDrawer
