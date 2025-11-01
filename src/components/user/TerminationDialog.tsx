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
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Calendar } from 'lucide-react'
import { useUpdateUserStatus } from '@/hooks/queries/useUserStatus'
import { User } from '@/types/general'

interface TerminationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export const TerminationDialog: React.FC<TerminationDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const [terminationDate, setTerminationDate] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const updateStatusMutation = useUpdateUserStatus()

  const resetForm = () => {
    setTerminationDate('')
    setReason('')
    setNotes('')
    setConfirmed(false)
  }

  const handleSubmit = async () => {
    if (!terminationDate || !confirmed) return

    await updateStatusMutation.mutateAsync({
      userId: user.id,
      data: {
        status: 'terminated',
        terminationDate,
        reason: reason || undefined,
        notes: notes || undefined
      }
    })

    resetForm()
    onOpenChange(false)
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Terminate User - {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>
            This action will schedule the user's termination. Please provide the following details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="terminationDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Termination Date *
            </Label>
            <Input
              id="terminationDate"
              type="date"
              min={minDate}
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              The user will be deactivated on this date
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g., Contract ended, Resignation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4">
            <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              ⚠️ Consequences of Termination:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
              <li>User will be deactivated on the selected date</li>
              <li>All system access will be removed</li>
              <li>Pending leave requests will be cancelled</li>
              <li>Final payroll will be processed</li>
              <li>Cannot be undone without reactivation approval</li>
            </ul>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand the consequences of terminating this user
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
            disabled={updateStatusMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!terminationDate || !confirmed || updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Processing...' : 'Terminate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
