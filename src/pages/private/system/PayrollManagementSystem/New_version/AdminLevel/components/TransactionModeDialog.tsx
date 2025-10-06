import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PayrollCycleDetails } from '../../types/payroll'

type BaseRecord = PayrollCycleDetails['salaryRecords'][number]

type TransactionEmployee = BaseRecord & {
  grossSalary?: number
  totalAllowances?: number
  totalDeductions?: number
  incentive?: number
  bonus?: number
  user: BaseRecord['user'] & {
    bankDetails?: {
      accountHolderName?: string
      accountHolder?: string
      bankName?: string
      accountNumber?: string
      maskedAccountNumber?: string
      ifscCode?: string
      accountType?: string
    } | null
  }
}

export type BankDetailsFormState = {
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  accountType: string
  maskedAccountNumber?: string
  accountHolder?: string
}

type TransactionModeDialogProps = {
  open: boolean
  onClose: () => void
  employees: TransactionEmployee[]
  currentEmployeeIndex: number
  onPreviousEmployee: () => void
  onNextEmployee: () => void
  onSendPayment: () => void
  onCompleteAll: () => void
  isProcessingTransaction: boolean
  transactionDetails: Record<string, string>
  setTransactionDetails: React.Dispatch<React.SetStateAction<Record<string, string>>>
  transactionCycleId: string | null
  formatCurrency: (value: number) => string
  renderPaymentStatusBadge: (status?: string) => React.ReactNode
  completedTransactions: Set<string>
  isEditingBankDetails: boolean
  bankDetailsForm: BankDetailsFormState
  setBankDetailsForm: React.Dispatch<React.SetStateAction<BankDetailsFormState>>
  onEditBankDetails: (employee: TransactionEmployee) => void
  onSaveBankDetails: () => void
  onCancelBankEdit: () => void
  isSavingBankDetails: boolean
  isValidBankDetails: (details?: Partial<BankDetailsFormState> | null) => boolean
}

const TransactionModeDialog: React.FC<TransactionModeDialogProps> = ({
  open,
  onClose,
  employees,
  currentEmployeeIndex,
  onPreviousEmployee,
  onNextEmployee,
  onSendPayment,
  onCompleteAll,
  isProcessingTransaction,
  transactionDetails,
  setTransactionDetails,
  transactionCycleId,
  formatCurrency,
  renderPaymentStatusBadge,
  completedTransactions,
  isEditingBankDetails,
  bankDetailsForm,
  setBankDetailsForm,
  onEditBankDetails,
  onSaveBankDetails,
  onCancelBankEdit,
  isSavingBankDetails,
  isValidBankDetails
}) => {
  const currentEmployee = employees[currentEmployeeIndex]
  const currentTransactionRef = currentEmployee && transactionCycleId ? `${transactionCycleId}-${currentEmployee.id}` : ''

  const handleTransactionDetailChange = (key: string, value: string) => {
    setTransactionDetails((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const handleBankDetailsChange = (field: keyof BankDetailsFormState, value: string) => {
    setBankDetailsForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const totalEmployees = employees.length
  const completedCount = completedTransactions.size

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle>
                Transaction Mode - Employee {totalEmployees ? currentEmployeeIndex + 1 : 0} of {totalEmployees}
              </DialogTitle>
              <DialogDescription>
                Process individual employee payments by entering transaction details and confirming each transfer.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousEmployee}
                disabled={currentEmployeeIndex === 0 || isProcessingTransaction}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextEmployee}
                disabled={currentEmployeeIndex >= totalEmployees - 1 || isProcessingTransaction}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {totalEmployees > 0 && currentEmployee ? (
          <div className="flex-1 overflow-y-auto space-y-6">
            {(() => {
              const isLogicalPayout = currentEmployee.paymentStatus === 'NO_PAYOUT_REQUIRED'
              const isCompleted =
                completedTransactions.has(currentEmployee.id) ||
                currentEmployee.paymentStatus === 'COMPLETED' ||
                isLogicalPayout
              const cardAccentClasses = isLogicalPayout
                ? 'border-slate-300 bg-slate-50'
                : isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-blue-200 bg-blue-50'
              const netSalaryValue = currentEmployee.netSalary ?? 0
              const netSalaryClass =
                netSalaryValue > 0
                  ? 'text-green-600'
                  : netSalaryValue < 0
                    ? 'text-red-600'
                    : 'text-slate-600'
              const grossSalary = currentEmployee.grossSalary ?? 0
              const totalAllowances = currentEmployee.totalAllowances ?? 0
              const totalDeductions = currentEmployee.totalDeductions ?? 0
              const estimatedPayoutAmount =
                (currentEmployee.netSalary ?? 0) +
                (currentEmployee.incentive ?? 0) +
                (currentEmployee.bonus ?? 0)
              const requiresBankDetails = estimatedPayoutAmount > 0
              const hasValidBankDetails = isValidBankDetails(currentEmployee.user?.bankDetails)
              const hasTransactionNumber = currentTransactionRef
                ? transactionDetails[currentTransactionRef]?.trim()
                : ''
              const sendDisabled =
                !hasTransactionNumber ||
                isProcessingTransaction ||
                (requiresBankDetails && !hasValidBankDetails)

              return (
                <div className="space-y-6">
                  <Card className={`border-2 ${cardAccentClasses}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">
                            {[currentEmployee.user?.firstName, currentEmployee.user?.lastName]
                              .filter(Boolean)
                              .join(' ') || 'Employee'}
                          </CardTitle>
                          <CardDescription>
                            {currentEmployee.user?.employeeId || 'N/A'} • {currentEmployee.user?.department?.name || 'Department N/A'}
                          </CardDescription>
                          {isLogicalPayout && (
                            <p className="mt-2 text-xs text-slate-600">
                              Net amount {formatCurrency(netSalaryValue)} — recorded as a logical payout with no funds transferred.
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <p className={`text-2xl font-bold ${netSalaryClass}`}>
                            {formatCurrency(currentEmployee.netSalary)}
                          </p>
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {renderPaymentStatusBadge(currentEmployee.paymentStatus)}
                            {isCompleted && !currentEmployee.paymentStatus && !isLogicalPayout && (
                              <Badge variant="default" className="bg-green-600">
                                ✓ Sent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Salary:</span>
                          <span className="font-medium">{formatCurrency(grossSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Deductions:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(totalDeductions)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Allowances:</span>
                          <span className="font-medium text-green-600">+{formatCurrency(totalAllowances)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Net Salary:</span>
                          <span className="text-green-600">{formatCurrency(currentEmployee.netSalary)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Bank Details</CardTitle>
                          {!isEditingBankDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditBankDetails(currentEmployee)}
                            >
                              {currentEmployee.user?.bankDetails?.accountNumber ? 'Edit' : 'Add'} Bank Details
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isEditingBankDetails ? (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                              <Input
                                id="accountHolderName"
                                value={bankDetailsForm.accountHolderName}
                                onChange={(event) => handleBankDetailsChange('accountHolderName', event.target.value)}
                                placeholder="Enter account holder name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bankName">Bank Name *</Label>
                              <Input
                                id="bankName"
                                value={bankDetailsForm.bankName}
                                onChange={(event) => handleBankDetailsChange('bankName', event.target.value)}
                                placeholder="Enter bank name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="accountNumber">Account Number *</Label>
                              <Input
                                id="accountNumber"
                                value={bankDetailsForm.accountNumber}
                                onChange={(event) => handleBankDetailsChange('accountNumber', event.target.value)}
                                placeholder="Enter account number"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ifscCode">IFSC Code *</Label>
                              <Input
                                id="ifscCode"
                                value={bankDetailsForm.ifscCode}
                                onChange={(event) => handleBankDetailsChange('ifscCode', event.target.value.toUpperCase())}
                                placeholder="Enter IFSC code"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={onSaveBankDetails}
                                disabled={isSavingBankDetails || !isValidBankDetails()}
                                size="sm"
                              >
                                {isSavingBankDetails ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Bank Details'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={onCancelBankEdit}
                                disabled={isSavingBankDetails}
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <Label className="text-muted-foreground">Account Holder:</Label>
                              <p className="font-medium">{currentEmployee.user?.bankDetails?.accountHolderName || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Bank Name:</Label>
                              <p className="font-medium">{currentEmployee.user?.bankDetails?.bankName || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Account Number:</Label>
                              <p className="font-medium font-mono">{currentEmployee.user?.bankDetails?.accountNumber || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">IFSC Code:</Label>
                              <p className="font-medium font-mono">{currentEmployee.user?.bankDetails?.ifscCode || 'Not provided'}</p>
                            </div>
                            {!currentEmployee.user?.bankDetails?.accountNumber && (
                              <Alert>
                                <AlertTitle>Bank details required</AlertTitle>
                                <AlertDescription>
                                  Please add bank details to process payment for this employee.
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {!isCompleted && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Transaction Details</CardTitle>
                        <CardDescription>
                          {currentEmployee && !isValidBankDetails(currentEmployee.user?.bankDetails)
                            ? 'Bank details are required before processing payment for this employee.'
                            : 'Enter the transaction reference number after processing the payment in your banking system.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {currentEmployee && !isValidBankDetails(currentEmployee.user?.bankDetails) ? (
                          <Alert>
                            <AlertTitle>Cannot Process Payment</AlertTitle>
                            <AlertDescription>
                              Complete bank details are required to process payment. Please add bank details first.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="transactionNumber">Transaction Reference Number *</Label>
                                <Input
                                  id="transactionNumber"
                                  placeholder="e.g., TXN123456789"
                                  value={currentTransactionRef ? transactionDetails[currentTransactionRef] || '' : ''}
                                  onChange={(event) =>
                                    currentTransactionRef && handleTransactionDetailChange(currentTransactionRef, event.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="transactionDate">Transaction Date</Label>
                                <Input
                                  id="transactionDate"
                                  type="date"
                                  value={currentTransactionRef
                                    ? transactionDetails[`${currentTransactionRef}-date`] || new Date().toISOString().split('T')[0]
                                    : new Date().toISOString().split('T')[0]}
                                  onChange={(event) =>
                                    currentTransactionRef &&
                                    handleTransactionDetailChange(`${currentTransactionRef}-date`, event.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="transactionNotes">Notes (Optional)</Label>
                              <Input
                                id="transactionNotes"
                                placeholder="Additional transaction notes..."
                                value={currentTransactionRef ? transactionDetails[`${currentTransactionRef}-notes`] || '' : ''}
                                onChange={(event) =>
                                  currentTransactionRef &&
                                  handleTransactionDetailChange(`${currentTransactionRef}-notes`, event.target.value)
                                }
                              />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Progress:</span>
                      <Badge variant="outline">
                        {completedCount} / {totalEmployees} completed
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={onClose}>
                        Exit Transaction Mode
                      </Button>

                      {currentEmployeeIndex > 0 && (
                        <Button
                          variant="outline"
                          onClick={onPreviousEmployee}
                          disabled={isProcessingTransaction}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                      )}

                      {isCompleted ? (
                        currentEmployeeIndex < totalEmployees - 1 ? (
                          <Button onClick={onNextEmployee}>
                            Next Employee
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <Button onClick={onCompleteAll}>
                            Complete Payout Process
                          </Button>
                        )
                      ) : (
                        <Button onClick={onSendPayment} disabled={sendDisabled}>
                          {isProcessingTransaction ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Send Payment
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            No employees are available for payout in this cycle.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default TransactionModeDialog
