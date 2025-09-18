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
import { AlertCircle, Info, RefreshCw, Save, Clock, Globe, MapPin, Shield, Bell, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrganizationSettingsQuery, useSaveOrganizationSettings, useResetOrganizationSettings } from '@/hooks/queries/useOrganizationSettings'
import AttendanceRulesManager from '@/components/attendance/rules/AttendanceRulesManager'
import GeofencingManagement from '@/components/attendance/geofencing/GeofencingManagement'
import AttendanceSimulation from '@/components/attendance/simulation/AttendanceSimulation'
import { cn } from '@/lib/utils'

const OrganizationSettings = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('general')
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
            <div className="h-screen overflow-hidden bg-background w-full">
                <div className="h-full max-w-7xl mx-auto p-6 flex flex-col">
                    <Skeleton className="h-8 w-64 mb-6 flex-shrink-0" />
                    <div className="flex-1 flex gap-8">
                        <div className="w-1/5 flex-shrink-0">
                            <div className="space-y-2">
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <Card className="overflow-hidden">
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
                    </div>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: 'general', label: 'General Settings' },
        { id: 'attendance', label: 'Attendance Rules' },
        { id: 'policies', label: 'Policies' },
        { id: 'simulation', label: 'Simulation & Testing' },
    ];

    return (
        <div className='h-screen overflow-hidden bg-background w-full'>
            <div className='h-full max-w-8xl mx-auto p-6 flex flex-col w-full'>
                <div className="mb-8 flex-shrink-0">
                    <h1 className='text-3xl font-bold'>Organization Settings</h1>
                    <p className="text-muted-foreground">Manage your organization's settings and preferences.</p>
                </div>
                
                <div className="flex-1 flex gap-8 overflow-hidden">
                    <aside className="w-1/5 flex-shrink-0">
                        <nav className="flex flex-col space-y-1">
                            {navItems.map((item) => (
                                <Button
                                    key={item.id}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start",
                                        activeTab === item.id && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    <main className="flex-1 overflow-y-auto pr-4" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}>
                        {activeTab === 'general' && (
                            <div className="space-y-6 pb-8">
                                <Card>
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

                                <Card>
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

                                <Card>
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
                                </Card>
                                
                                {hasManagePermission && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className='flex flex-col sm:flex-row gap-3 w-full'>
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
                                        </CardContent>
                                    </Card>
                                )}

                                {!hasManagePermission && (
                                     <Alert  className="w-full">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>View Only Mode</AlertTitle>
                                        <AlertDescription>
                                            You don't have permission to modify organization settings.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="space-y-6 pb-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Attendance Rules Management
                                        </CardTitle>
                                        <CardDescription>
                                            Configure progressive attendance rules, penalties, and policies for your organization
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {hasViewPermission ? (
                                            <div className="p-6 pt-0">
                                                <AttendanceRulesManager orgId={orgId || ''} />
                                            </div>
                                        ) : (
                                            <div className="p-6">
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Access Denied</AlertTitle>
                                                    <AlertDescription>
                                                        You don't have permission to view attendance settings.
                                                    </AlertDescription>
                                                </Alert>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Break Management */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Break Management Policies
                                        </CardTitle>
                                        <CardDescription>
                                            Configure organization-wide break policies and restrictions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="max-break-duration">Maximum Break Duration (minutes)</Label>
                                                <Input
                                                    id="max-break-duration"
                                                    type="number"
                                                    placeholder="60"
                                                    disabled={!hasManagePermission}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="max-daily-breaks">Maximum Daily Breaks</Label>
                                                <Input
                                                    id="max-daily-breaks"
                                                    type="number"
                                                    placeholder="3"
                                                    disabled={!hasManagePermission}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Allowed Break Types</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {['LUNCH', 'TEA', 'REGULAR', 'EMERGENCY', 'PERSONAL'].map((type) => (
                                                    <div key={type} className="flex items-center space-x-2">
                                                        <Checkbox id={`break-${type}`} disabled={!hasManagePermission} />
                                                        <Label htmlFor={`break-${type}`} className="text-sm">{type}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="requires-approval" disabled={!hasManagePermission} />
                                                <Label htmlFor="requires-approval">Requires manager approval for breaks</Label>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="location-tracking" disabled={!hasManagePermission} />
                                                <Label htmlFor="location-tracking">Enable location tracking for breaks</Label>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="auto-end-breaks" disabled={!hasManagePermission} />
                                                <Label htmlFor="auto-end-breaks">Auto-end breaks after maximum duration</Label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Restricted Break Hours</Label>
                                            <div className="text-sm text-muted-foreground mb-2">
                                                Define time periods when breaks are not allowed (e.g., "09:00-10:00", "17:00-18:00")
                                            </div>
                                            <Input 
                                                placeholder="09:00-10:00, 17:00-18:00" 
                                                disabled={!hasManagePermission}
                                            />
                                        </div>

                                        {hasManagePermission && (
                                            <div className="pt-4 border-t">
                                                <Button className="w-full sm:w-auto">
                                                    Save Break Policies
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Geofencing Management */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Geofencing Management
                                        </CardTitle>
                                        <CardDescription>
                                            Configure location-based attendance validation and geofences
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {hasViewPermission ? (
                                            <div className="p-6 pt-0">
                                                <GeofencingManagement orgId={orgId || ''} />
                                            </div>
                                        ) : (
                                            <div className="p-6">
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Access Denied</AlertTitle>
                                                    <AlertDescription>
                                                        You don't have permission to view geofencing settings.
                                                    </AlertDescription>
                                                </Alert>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'policies' && (
                            <div className="space-y-6 pb-8">
                                {/* Alert Configuration */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Bell className="h-5 w-5" />
                                            Alert Configuration
                                        </CardTitle>
                                        <CardDescription>
                                            Configure real-time alerts and notifications for attendance violations
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="enable-alerts" disabled={!hasManagePermission} />
                                            <Label htmlFor="enable-alerts">Enable real-time alerts</Label>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Alert Channels</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Email', 'SMS', 'Push Notifications', 'Dashboard'].map((channel) => (
                                                    <div key={channel} className="flex items-center space-x-2">
                                                        <Checkbox id={`alert-${channel.toLowerCase()}`} disabled={!hasManagePermission} />
                                                        <Label htmlFor={`alert-${channel.toLowerCase()}`} className="text-sm">{channel}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Alert Recipients</Label>
                                            <div className="flex gap-4">
                                                {['Managers', 'HR', 'Self'].map((recipient) => (
                                                    <div key={recipient} className="flex items-center space-x-2">
                                                        <Checkbox id={`recipient-${recipient.toLowerCase()}`} disabled={!hasManagePermission} />
                                                        <Label htmlFor={`recipient-${recipient.toLowerCase()}`} className="text-sm">{recipient}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Security & Compliance */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5" />
                                            Security & Compliance
                                        </CardTitle>
                                        <CardDescription>
                                            Configure security settings and compliance requirements
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="require-face-recognition" disabled={!hasManagePermission} />
                                            <Label htmlFor="require-face-recognition">Require face recognition for attendance</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="device-restriction" disabled={!hasManagePermission} />
                                            <Label htmlFor="device-restriction">Restrict attendance to registered devices</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="manager-approval" disabled={!hasManagePermission} />
                                            <Label htmlFor="manager-approval">Require manager approval for attendance corrections</Label>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="data-retention">Data Retention Period (days)</Label>
                                            <Input
                                                id="data-retention"
                                                type="number"
                                                placeholder="365"
                                                disabled={!hasManagePermission}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'simulation' && (
                            <div className="space-y-6 pb-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5" />
                                            Attendance System Testing
                                        </CardTitle>
                                        <CardDescription>
                                            Test attendance rules, break policies, and payroll calculations with simulated data
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {hasViewPermission ? (
                                            <div className="p-6 pt-0">
                                                <AttendanceSimulation orgId={orgId || ''} />
                                            </div>
                                        ) : (
                                            <div className="p-6">
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Access Denied</AlertTitle>
                                                    <AlertDescription>
                                                        You don't have permission to run simulations.
                                                    </AlertDescription>
                                                </Alert>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default OrganizationSettings