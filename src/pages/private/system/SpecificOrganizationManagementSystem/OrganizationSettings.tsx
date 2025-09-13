import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthContext'
import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Info, RefreshCw, Save, Clock, Globe } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrganizationSettingsQuery, useSaveOrganizationSettings, useResetOrganizationSettings } from '@/hooks/queries/useOrganizationSettings'

const OrganizationSettings = () => {
    const { user } = useAuth()
    // Local editable fields derived from query data
    const [editedWeekoffs, setEditedWeekoffs] = useState<number[]>([])
    const [editedTimezone, setEditedTimezone] = useState<string>('Asia/Kolkata')
    const [editedWorkingHours, setEditedWorkingHours] = useState<string>('9:00 AM - 6:00 PM')
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()
    const [permissionList] = useAtom(permissionListAtom)
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    // Common timezone options
    const timezoneOptions = [
        { value: 'Asia/Kolkata', label: 'India (IST) - Asia/Kolkata' },
        { value: 'Asia/Dubai', label: 'UAE (GST) - Asia/Dubai' },
        { value: 'Asia/Singapore', label: 'Singapore (SGT) - Asia/Singapore' },
        { value: 'Asia/Tokyo', label: 'Japan (JST) - Asia/Tokyo' },
        { value: 'Europe/London', label: 'UK (GMT/BST) - Europe/London' },
        { value: 'Europe/Paris', label: 'Central Europe (CET) - Europe/Paris' },
        { value: 'America/New_York', label: 'US Eastern (EST/EDT) - America/New_York' },
        { value: 'America/Chicago', label: 'US Central (CST/CDT) - America/Chicago' },
        { value: 'America/Denver', label: 'US Mountain (MST/MDT) - America/Denver' },
        { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT) - America/Los_Angeles' },
        { value: 'Australia/Sydney', label: 'Australia Eastern (AEST) - Australia/Sydney' },
        { value: 'Pacific/Auckland', label: 'New Zealand (NZST) - Pacific/Auckland' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
    ]

    // Permission check functions
    const hasViewPermission = permissionList.some(permission => permission.key === 'view_org_settings')
    const hasManagePermission = permissionList.some(permission => permission.key === 'manage_org_setting')

    // Query: fetch organization settings
    const orgId = user?.organization?.id
    const { data: normalizedSettings, isLoading } = useOrganizationSettingsQuery(orgId, hasViewPermission)

    // Mutations
    const saveMutation = useSaveOrganizationSettings()
    const resetMutation = useResetOrganizationSettings()

    // Sync local editable state when query data arrives
    useEffect(() => {
      if (normalizedSettings) {
        setEditedWeekoffs(normalizedSettings.weekoff)
        setEditedTimezone(normalizedSettings.timezone)
        setEditedWorkingHours(normalizedSettings.workingHours)
        // raw retained in query cache if needed
      }
    }, [normalizedSettings])

    const handleWeekoffChange = (dayIndex: number) => {
        if (editedWeekoffs.includes(dayIndex)) {
            setEditedWeekoffs(editedWeekoffs.filter(day => day !== dayIndex))
        } else {
            setEditedWeekoffs([...editedWeekoffs, dayIndex])
        }
    }

    const saveSettings = async () => {
        // Check for manage permission before saving
        if (!hasManagePermission) {
            toast({
                title: "Permission Denied",
                description: "You don't have permission to change organization settings.",
                variant: "destructive",
            })
            return
        }
        if (!orgId) return
        setSaving(true)
        saveMutation.mutate(
          {
            orgId,
            weekoff: editedWeekoffs,
            timezone: editedTimezone,
            workingHours: editedWorkingHours,
          },
          {
            onSuccess: () => {
              toast({ title: 'Success', description: 'Settings saved successfully' })
            },
            onError: () => {
              toast({ title: 'Error', description: 'Failed to save settings. Please try again.', variant: 'destructive' })
            },
            onSettled: () => setSaving(false)
          }
        )
    }

    const resetSettings = async () => {
        // Check for manage permission before resetting
        if (!hasManagePermission) {
            toast({
                title: "Permission Denied",
                description: "You don't have permission to reset organization settings.",
                variant: "destructive",
            })
            return
        }
        if (!orgId) return
        setSaving(true)
        resetMutation.mutate(orgId, {
          onSuccess: (normalized) => {
            setEditedWeekoffs(normalized.weekoff)
            setEditedTimezone(normalized.timezone)
            setEditedWorkingHours(normalized.workingHours)
            toast({ title: 'Success', description: 'Settings reset to default successfully' })
          },
          onError: () => {
            toast({ title: 'Error', description: 'Failed to reset settings. Please try again.', variant: 'destructive' })
          },
            onSettled: () => setSaving(false)
        })
    }

    // No permission to view
    if (!hasViewPermission) {
        return (
            <div className="flex justify-center items-center h-full p-6">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You don't have permission to view organization settings.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 w-full max-w-5xl mx-auto">
                <Skeleton className="h-8 w-64 mb-6" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48 mb-2" />
                        <Skeleton className="h-5 w-full max-w-md" />
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className='flex items-center space-x-2'>
                                    <Skeleton className="h-5 w-5" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <div className='flex gap-4'>
                            <Skeleton className="h-9 w-32" />
                            <Skeleton className="h-9 w-32" />
                        </div>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className='p-6 max-w-5xl mx-auto'>
            <div className="flex items-center justify-between mb-6">
                <h1 className='text-3xl font-bold'>Organization Settings</h1>
            </div>
            
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Organization Timezone
                    </CardTitle>
                    <CardDescription>
                        Set the timezone for your organization. All timestamps and scheduling will use this timezone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="timezone-select">Select Timezone</Label>
                            <Select 
                                value={editedTimezone} 
                                onValueChange={setEditedTimezone}
                                disabled={!hasManagePermission}
                            >
                                <SelectTrigger id="timezone-select">
                                    <SelectValue placeholder="Select a timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezoneOptions.map((tz) => (
                                        <SelectItem key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Current time in {editedTimezone}: {new Date().toLocaleString('en-US', { timeZone: editedTimezone })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Working Hours
                    </CardTitle>
                    <CardDescription>
                        Define the standard working hours for your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="working-hours">Working Hours</Label>
                        <Input
                            id="working-hours"
                            value={editedWorkingHours}
                            onChange={(e) => setEditedWorkingHours(e.target.value)}
                            placeholder="e.g., 9:00 AM - 6:00 PM"
                            disabled={!hasManagePermission}
                        />
                        <div className="text-sm text-muted-foreground">
                            Enter your organization's standard working hours (e.g., "9:00 AM - 6:00 PM")
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Weekly Off Days</CardTitle>
                    <CardDescription>
                        Select the days that are considered off days for your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {days.map((day, index) => (
                            <div key={index} className='flex items-center space-x-3'>
                                <Checkbox
                                    id={`day-${index}`}
                                    checked={editedWeekoffs.includes(index)}
                                    onCheckedChange={() => handleWeekoffChange(index)}
                                    disabled={!hasManagePermission}
                                />
                                <label 
                                    htmlFor={`day-${index}`} 
                                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                        editedWeekoffs.includes(index) ? 'text-primary' : ''
                                    }`}
                                >
                                    {day}
                                </label>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <Separator />
                <CardFooter className="pt-4">
                    {hasManagePermission ? (
                        <div className='flex flex-col sm:flex-row gap-3 w-full sm:justify-between'>
                            <Button
                                onClick={saveSettings}
                                disabled={saving}
                                className="gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            
                            <Button
                                onClick={resetSettings}
                                disabled={saving}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reset to Default
                            </Button>
                        </div>
                    ) : (
                        <Alert  className="w-full">
                            <Info className="h-4 w-4" />
                            <AlertTitle>View Only Mode</AlertTitle>
                            <AlertDescription>
                                You don't have permission to modify organization settings.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardFooter>
            </Card>
            
        </div>
    )
}

export default OrganizationSettings