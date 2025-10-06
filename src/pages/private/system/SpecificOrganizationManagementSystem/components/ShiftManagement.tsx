import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Clock, Clock3, ClipboardCheck, Coffee, Edit3, Layers, Plus, Timer, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCreateShiftTemplate, useDeleteShiftTemplate, useShiftRules, useShiftTemplates, useUpdateShiftTemplate } from '@/hooks/queries/useShiftManagement'
import type { ShiftRulesResponse } from '@/hooks/queries/useShiftManagement'
import type {
  AttendanceRule,
  AttendanceRulePenalty,
  AttendanceRuleThreshold,
  BreakRule,
  OvertimeRule,
  ShiftTemplate
} from '@/types/shift'
import { cn } from '@/lib/utils'

interface ShiftManagementProps {
  orgId?: string
  canManage: boolean
  showHeader?: boolean
}

type ShiftFormState = {
  name: string
  startTime: string
  endTime: string
  totalHours: string
  lateThreshold: string
  isActive: boolean
  breakRuleIds: string[]
  attendanceRuleIds: string[]
  overtimeRuleId: string | null
}

const defaultFormState: ShiftFormState = {
  name: '',
  startTime: '09:00',
  endTime: '18:00',
  totalHours: '9',
  lateThreshold: '15',
  isActive: true,
  breakRuleIds: [],
  attendanceRuleIds: [],
  overtimeRuleId: null
}

const describeAttendanceThreshold = (threshold?: AttendanceRuleThreshold) => {
  if (!threshold || typeof threshold !== 'object') {
    return 'No threshold configured'
  }

  const parts: string[] = []
  if (threshold.minutes !== null && threshold.minutes !== undefined) {
    parts.push(`${threshold.minutes}m lateness`)
  }
  if (threshold.occurrences !== null && threshold.occurrences !== undefined) {
    parts.push(`${threshold.occurrences} occurrence${threshold.occurrences === 1 ? '' : 's'}`)
  }
  if (threshold.graceMinutes !== null && threshold.graceMinutes !== undefined) {
    parts.push(`${threshold.graceMinutes}m grace`)
  }

  return parts.length ? parts.join(' · ') : 'No threshold configured'
}

const describeAttendancePenalty = (penalty?: AttendanceRulePenalty) => {
  if (!penalty || typeof penalty !== 'object') {
    return 'None'
  }

  const parts: string[] = []
  if (penalty.type) {
    parts.push(penalty.type)
  }
  if (penalty.value !== null && penalty.value !== undefined) {
    const unit = penalty.unit ? ` ${penalty.unit}` : ''
    parts.push(`${penalty.value}${unit}`)
  }
  if (penalty.notes) {
    parts.push(penalty.notes)
  }

  return parts.length ? parts.join(' · ') : 'None'
}

const extractApiError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: unknown }).response
    if (typeof response === 'object' && response !== null) {
      const data = (response as { data?: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        const message = (data as { error?: unknown }).error
        if (typeof message === 'string' && message.trim().length > 0) {
          return message
        }
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

const ShiftManagement = ({ orgId, canManage, showHeader = true }: ShiftManagementProps) => {
  const { toast } = useToast()
  const { data: shiftTemplates = [], isLoading } = useShiftTemplates(orgId, !!orgId)
  const { data: ruleData, isLoading: rulesLoading, error: rulesError } = useShiftRules(orgId, !!orgId)
  const createMutation = useCreateShiftTemplate()
  const updateMutation = useUpdateShiftTemplate()
  const deleteMutation = useDeleteShiftTemplate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formState, setFormState] = useState<ShiftFormState>(defaultFormState)
  const [editingShift, setEditingShift] = useState<ShiftTemplate | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShiftTemplate | null>(null)

  const shiftRules: ShiftRulesResponse = ruleData ?? {
    breakRules: [],
    attendanceRules: [],
    overtimeRules: []
  }

  useEffect(() => {
    if (!dialogOpen) {
      setEditingShift(null)
      setFormState(defaultFormState)
      setFormError(null)
    }
  }, [dialogOpen])

  const handleOpenCreate = () => {
    setEditingShift(null)
    setFormState(defaultFormState)
    setDialogOpen(true)
  }

  const handleOpenEdit = (shift: ShiftTemplate) => {
    setEditingShift(shift)
    const breakIdsSource =
      shift.selectedBreakRuleIds ??
      (shift.breakRules ?? shift.breakConfiguration ?? [])?.map(rule => rule.id) ?? []
    const attendanceIdsSource =
      shift.selectedAttendanceRuleIds ??
      (shift.attendanceRuleDetails ?? shift.attendanceRules ?? [])?.map(rule => rule.id) ?? []
    const overtimeId =
      shift.selectedOvertimeRuleId ??
      shift.overtimeRuleDetails?.id ??
      shift.overtimeRules?.id ??
      null

    setFormState({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      totalHours: (typeof shift.totalHours === 'number' ? shift.totalHours : parseFloat(shift.totalHours || '0')).toString(),
      lateThreshold: (shift.lateThreshold ?? 15).toString(),
      isActive: !!shift.isActive,
      breakRuleIds: Array.from(new Set(breakIdsSource)),
      attendanceRuleIds: Array.from(new Set(attendanceIdsSource)),
      overtimeRuleId: overtimeId
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!orgId) return
    setFormError(null)

    try {
      const totalHoursNumber = parseFloat(formState.totalHours)
      if (Number.isNaN(totalHoursNumber) || totalHoursNumber <= 0) {
        throw new Error('Total hours must be a positive number')
      }

      const lateThresholdNumber = parseInt(formState.lateThreshold || '0', 10)
      const payloadBase = {
        orgId,
        name: formState.name.trim(),
        startTime: formState.startTime,
        endTime: formState.endTime,
        totalHours: totalHoursNumber,
        lateThreshold: lateThresholdNumber,
        isActive: formState.isActive,
        breakRuleIds: formState.breakRuleIds,
        attendanceRuleIds: formState.attendanceRuleIds,
        overtimeRuleId: formState.overtimeRuleId ?? null
      }

      if (!payloadBase.name) {
        throw new Error('Shift name is required')
      }

      if (editingShift) {
        await updateMutation.mutateAsync({ id: editingShift.id, ...payloadBase })
        toast({ title: 'Shift template updated successfully' })
      } else {
        await createMutation.mutateAsync(payloadBase)
        toast({ title: 'Shift template created successfully' })
      }

      setDialogOpen(false)
    } catch (error: unknown) {
      const message = extractApiError(error, 'Unable to save shift template')
      setFormError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  const toggleBreakRule = (ruleId: string, checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      breakRuleIds: checked
        ? Array.from(new Set([...prev.breakRuleIds, ruleId]))
        : prev.breakRuleIds.filter(id => id !== ruleId)
    }))
  }

  const toggleAttendanceRule = (ruleId: string, checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      attendanceRuleIds: checked
        ? Array.from(new Set([...prev.attendanceRuleIds, ruleId]))
        : prev.attendanceRuleIds.filter(id => id !== ruleId)
    }))
  }

  const handleToggleActive = async (shift: ShiftTemplate, checked: boolean) => {
    if (!orgId || !canManage) return
    try {
      await updateMutation.mutateAsync({ id: shift.id, orgId, isActive: checked })
      toast({ title: checked ? 'Shift activated' : 'Shift deactivated' })
    } catch (error: unknown) {
      toast({
        title: 'Error updating shift status',
        description: extractApiError(error, 'Please try again'),
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !orgId) return
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id, orgId })
      toast({ title: 'Shift template deleted' })
      setDeleteTarget(null)
    } catch (error: unknown) {
      toast({
        title: 'Failed to delete shift template',
        description: extractApiError(error, 'Please try again'),
        variant: 'destructive'
      })
    }
  }

  const activeShiftsCount = useMemo(() => shiftTemplates.filter(shift => shift.isActive).length, [shiftTemplates])

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Shift Templates</h2>
            <p className="text-sm text-muted-foreground">
              Configure default shifts for your organization and assign them to employees during hiring or onboarding.
            </p>
          </div>
          {canManage && (
            <Button onClick={handleOpenCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Shift Template
            </Button>
          )}
        </div>
      )}

      {!showHeader && canManage && (
        <div className="flex justify-end">
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Shift Template
          </Button>
        </div>
      )}

      {!canManage && (
        <Alert>
          <AlertTitle>View only</AlertTitle>
          <AlertDescription>
            You can view the existing shift templates but need additional permissions to create or modify them.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shiftTemplates.map((shift) => {
            const breakRules: BreakRule[] = Array.isArray(shift.breakRules)
              ? shift.breakRules
              : Array.isArray(shift.breakConfiguration)
                ? (shift.breakConfiguration as BreakRule[])
                : []
            const attendanceRules: AttendanceRule[] = Array.isArray(shift.attendanceRuleDetails)
              ? shift.attendanceRuleDetails
              : Array.isArray(shift.attendanceRules)
                ? (shift.attendanceRules as AttendanceRule[])
                : []
            const overtimeRule: OvertimeRule | null =
              (shift.overtimeRuleDetails as OvertimeRule | null | undefined) ??
              (shift.overtimeRules as OvertimeRule | null | undefined) ??
              null

            return (
              <Card key={shift.id} className="border">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="h-4 w-4 text-primary" />
                      {shift.name}
                    </CardTitle>
                    <CardDescription>
                      Created on {new Date(shift.createdAt ?? '').toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={shift.isActive ? 'default' : 'secondary'}>
                    {shift.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>Total hours: {typeof shift.totalHours === 'number' ? shift.totalHours : shift.totalHours || '--'} hrs</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Late threshold: {shift.lateThreshold ?? 15} minutes</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Coffee className="h-4 w-4" /> Break Rules
                    </div>
                    {breakRules.length ? (
                      <div className="flex flex-wrap gap-2">
                        {breakRules.map((rule) => (
                          <Badge key={rule.id} variant={rule.isActive ? 'secondary' : 'outline'}>
                            {rule.breakType} · {rule.maxDuration}m{!rule.isActive ? ' · inactive' : ''}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No break rules linked</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ClipboardCheck className="h-4 w-4" /> Attendance Rules
                    </div>
                    {attendanceRules.length ? (
                      <div className="flex flex-wrap gap-2">
                        {attendanceRules.map((rule) => (
                          <Badge key={rule.id} variant={rule.isActive ? 'secondary' : 'outline'}>
                            {rule.ruleType}{!rule.isActive ? ' · inactive' : ''}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No attendance rules linked</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Timer className="h-4 w-4" /> Overtime Rule
                    </div>
                    {overtimeRule ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{overtimeRule.name}</p>
                        <p>
                          Rate: {overtimeRule.rate ? `${overtimeRule.rate}x` : 'default'} · After {overtimeRule.applyAfterMinutes ?? 0}m
                          {overtimeRule.maxDailyMinutes ? ` · Max ${overtimeRule.maxDailyMinutes}m/day` : ''}
                          {!overtimeRule.isActive ? ' · inactive' : ''}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No overtime rule linked</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch
                      id={`shift-active-${shift.id}`}
                      checked={shift.isActive}
                      disabled={!canManage || updateMutation.isPending}
                      onCheckedChange={(checked) => handleToggleActive(shift, checked)}
                    />
                    <Label htmlFor={`shift-active-${shift.id}`} className={cn('cursor-pointer', !canManage && 'opacity-50')}>
                      Active
                    </Label>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(shift)}>
                        <Edit3 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <AlertDialog open={deleteTarget?.id === shift.id} onOpenChange={(open) => setDeleteTarget(open ? shift : null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {shift.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Employees assigned to this template will retain their last assignment history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && shiftTemplates.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No shift templates created yet. {canManage ? 'Use the button above to create one.' : 'Contact an administrator to configure shifts.'}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Shift Summary</CardTitle>
          <CardDescription>
            {activeShiftsCount} active template{activeShiftsCount === 1 ? '' : 's'} out of {shiftTemplates.length}
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 sm:max-w-3xl">
          <div className="flex max-h-[85vh] flex-col">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>{editingShift ? 'Edit Shift Template' : 'Create Shift Template'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-6">
                <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shift-name">Name</Label>
                <Input
                  id="shift-name"
                  value={formState.name}
                  onChange={(event) => setFormState(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Morning Shift"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-late-threshold">Late Threshold (minutes)</Label>
                <Input
                  id="shift-late-threshold"
                  type="number"
                  min={0}
                  value={formState.lateThreshold}
                  onChange={(event) => setFormState(prev => ({ ...prev, lateThreshold: event.target.value }))}
                />
              </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shift-start">Start Time</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={formState.startTime}
                  onChange={(event) => setFormState(prev => ({ ...prev, startTime: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-end">End Time</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={formState.endTime}
                  onChange={(event) => setFormState(prev => ({ ...prev, endTime: event.target.value }))}
                  required
                />
              </div>
        </div>

        <div className="space-y-2">
              <Label htmlFor="shift-total-hours">Total Hours</Label>
              <Input
                id="shift-total-hours"
                type="number"
                min={0}
                step={0.25}
                value={formState.totalHours}
                onChange={(event) => setFormState(prev => ({ ...prev, totalHours: event.target.value }))}
                required
              />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <Label htmlFor="shift-active">Active</Label>
                <p className="text-sm text-muted-foreground">Inactive templates can be edited without affecting assignments.</p>
              </div>
              <Switch
                id="shift-active"
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState(prev => ({ ...prev, isActive: checked }))}
              />
        </div>

        {rulesError && (
              <Alert variant="destructive">
                <AlertTitle>Unable to load rules</AlertTitle>
                <AlertDescription>
                  We couldn&apos;t load the organization&apos;s break, attendance, or overtime rules. You can continue editing the
                  basic shift details and retry linking rules later.
                </AlertDescription>
              </Alert>
        )}

        <div className="space-y-3 rounded-md border p-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Break Rules</Label>
                <p className="text-xs text-muted-foreground">
                  Select which break policies apply to employees working this shift.
                </p>
              </div>
              {rulesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : shiftRules.breakRules.length ? (
                <div className="space-y-2">
                  {shiftRules.breakRules.map((rule) => (
                    <div key={rule.id} className="flex items-start justify-between gap-4 rounded-md border px-3 py-2">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">
                          {rule.breakType}{!rule.isActive ? ' (inactive)' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Max {rule.maxDuration}m
                          {rule.maxFrequency ? ` · ${rule.maxFrequency} per day` : ''}
                          {rule.requiresApproval ? ' · Approval required' : ''}
                          {rule.penaltyPerMinute ? ` · Penalty ₹${rule.penaltyPerMinute}/min` : ''}
                        </p>
                      </div>
                      <Checkbox
                        checked={formState.breakRuleIds.includes(rule.id)}
                        onCheckedChange={(checked) => toggleBreakRule(rule.id, checked === true)}
                        aria-label={`Toggle break rule ${rule.breakType}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No break rules configured yet. Create break rules from organization settings to link them with shifts.
                </p>
              )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Attendance Rules</Label>
                <p className="text-xs text-muted-foreground">
                  Choose the attendance violation thresholds enforced for this shift.
                </p>
              </div>
              {rulesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : shiftRules.attendanceRules.length ? (
                <div className="space-y-2">
                  {shiftRules.attendanceRules.map((rule) => (
                    <div key={rule.id} className="flex items-start justify-between gap-4 rounded-md border px-3 py-2">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">
                          {rule.ruleType}{!rule.isActive ? ' (inactive)' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {describeAttendanceThreshold(rule.threshold)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Penalty: {describeAttendancePenalty(rule.penalty)}
                        </p>
                      </div>
                      <Checkbox
                        checked={formState.attendanceRuleIds.includes(rule.id)}
                        onCheckedChange={(checked) => toggleAttendanceRule(rule.id, checked === true)}
                        aria-label={`Toggle attendance rule ${rule.ruleType}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No attendance rules found. Configure attendance policies first to attach them here.
                </p>
              )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Overtime Rule</Label>
                <p className="text-xs text-muted-foreground">
                  Pick the overtime calculation logic for this shift. Leave unassigned to use default payroll behaviour.
                </p>
              </div>
              {rulesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : shiftRules.overtimeRules.length ? (
                <RadioGroup
                  value={formState.overtimeRuleId ?? 'none'}
                  onValueChange={(value) =>
                    setFormState(prev => ({ ...prev, overtimeRuleId: value === 'none' ? null : value }))
                  }
                  className="space-y-2"
                >
                  <div className="flex items-start gap-3 rounded-md border px-3 py-2">
                    <RadioGroupItem value="none" id="overtime-none" />
                    <Label htmlFor="overtime-none" className="cursor-pointer space-y-1 text-sm">
                      <span className="font-medium text-foreground">No overtime rule</span>
                      <span className="block text-xs text-muted-foreground">
                        Payroll will use the default overtime configuration for this organization.
                      </span>
                    </Label>
                  </div>
                  {shiftRules.overtimeRules.map((rule) => (
                    <div key={rule.id} className="flex items-start gap-3 rounded-md border px-3 py-2">
                      <RadioGroupItem value={rule.id} id={`overtime-${rule.id}`} />
                      <Label htmlFor={`overtime-${rule.id}`} className="cursor-pointer space-y-1 text-sm">
                        <span className="font-medium text-foreground">
                          {rule.name}{!rule.isActive ? ' (inactive)' : ''}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Rate: {rule.rate ? `${rule.rate}x` : 'default'} · After {rule.applyAfterMinutes ?? 0}m
                          {rule.maxDailyMinutes ? ` · Max ${rule.maxDailyMinutes}m/day` : ''}
                        </span>
                        {rule.description && (
                          <span className="block text-xs text-muted-foreground">{rule.description}</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No overtime rules available. Create overtime rules from organization settings to link them here.
                </p>
              )}
        </div>

        {formError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
                )}
              </div>
              <DialogFooter className="flex-shrink-0 gap-2 border-t px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingShift ? 'Save Changes' : 'Create Shift'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShiftManagement
