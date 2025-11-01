import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { EmploymentTypeBadge } from '@/components/employment/EmploymentTypeBadge'
import { employmentTypeService } from '@/services/api/employmentTypeService'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/types/general'
import { EmploymentType, EMPLOYMENT_TYPE_LABELS } from '@/types/employmentType'

interface EmploymentTypeChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export const EmploymentTypeChangeDialog: React.FC<EmploymentTypeChangeDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const currentType = user.employmentType as EmploymentType
  const [newType, setNewType] = useState<EmploymentType | ''>('')
  const [contractEndDate, setContractEndDate] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const resetForm = () => {
    setNewType('')
    setContractEndDate('')
    setEffectiveDate(new Date().toISOString().split('T')[0])
    setReason('')
    setNotes('')
  }

  const handleSubmit = async () => {
    if (!newType) return

    setIsSubmitting(true)
    try {
      await employmentTypeService.updateUserEmploymentType(user.id, {
        employmentType: newType,
        contractEndDate: newType !== EmploymentType.FULL_TIME ? contractEndDate || undefined : undefined,
        effectiveDate,
        reason: reason || undefined,
        notes: notes || undefined
      })

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profile', 'user', user.id] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'user-details', user.id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })

      toast({
        title: 'Success',
        description: `Employment type changed to ${EMPLOYMENT_TYPE_LABELS[newType]}`,
        variant: 'default'
      })

      resetForm()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update employment type',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const requiresContractDate = newType && newType !== EmploymentType.FULL_TIME

  const getPromotionDemotion = () => {
    const hierarchy = {
      [EmploymentType.INTERN]: 1,
      [EmploymentType.PART_TIME]: 2,
      [EmploymentType.CONTRACT]: 2,
      [EmploymentType.CONSULTANT]: 3,
      [EmploymentType.FULL_TIME]: 4
    }

    const currentLevel = hierarchy[currentType] || 0
    const newLevel = hierarchy[newType as EmploymentType] || 0

    if (newLevel > currentLevel) return 'promotion'
    if (newLevel < currentLevel) return 'demotion'
    return 'lateral'
  }

  const changeType = newType ? getPromotionDemotion() : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Change Employment Type - {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>
            Update the user's employment type and related contract details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current and New Type */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current</p>
              <EmploymentTypeBadge employmentType={currentType} size="lg" showLabel />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">New</p>
              {newType ? (
                <EmploymentTypeBadge employmentType={newType} size="lg" showLabel />
              ) : (
                <span className="text-sm text-muted-foreground">Select type...</span>
              )}
            </div>
          </div>

          {/* Employment Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="newType">New Employment Type *</Label>
            <Select value={newType} onValueChange={(value) => setNewType(value as EmploymentType)}>
              <SelectTrigger id="newType">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EmploymentType).map((type) => (
                  <SelectItem key={type} value={type} disabled={type === currentType}>
                    {EMPLOYMENT_TYPE_LABELS[type]}
                    {type === currentType && ' (Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {changeType && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {changeType === 'promotion' && '📈 This is a promotion'}
                {changeType === 'demotion' && '📉 This is a demotion'}
                {changeType === 'lateral' && '↔️ This is a lateral move'}
              </p>
            )}
          </div>

          {/* Contract End Date (required for non-full-time) */}
          {requiresContractDate && (
            <div className="space-y-2">
              <Label htmlFor="contractEndDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Contract End Date
              </Label>
              <Input
                id="contractEndDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if not applicable
              </p>
            </div>
          )}

          {/* Effective Date */}
          <div className="space-y-2">
            <Label htmlFor="effectiveDate">Effective Date *</Label>
            <Input
              id="effectiveDate"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g., Promotion, Performance-based change"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Policy Changes Info */}
          {newType && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Policy Changes:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Attendance rules will be updated based on new employment type</li>
                <li>Leave eligibility may change</li>
                {newType === EmploymentType.FULL_TIME && (
                  <li>User will be eligible for full benefits</li>
                )}
                <li>Payroll calculation rules will be adjusted</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!newType || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
