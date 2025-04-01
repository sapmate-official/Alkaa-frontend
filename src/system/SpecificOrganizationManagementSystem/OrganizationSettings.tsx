import { APIDictionary } from '@/api/v2/APIdict'
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Info, RefreshCw, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface OrganizationSettingsType {
  id: string;
  orgId: string;
  settings: {
    weekoff?: number[];
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

const OrganizationSettings = () => {
    const { user } = useAuth()
    const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettingsType | OrganizationSettingsType[] | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)
    const [editedWeekoffs, setEditedWeekoffs] = useState<number[]>([])
    const { toast } = useToast()
    const [permissionList] = useAtom(permissionListAtom)
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // Permission check functions
    const hasViewPermission = permissionList.some(permission => permission.key === 'view_org_settings')
    const hasManagePermission = permissionList.some(permission => permission.key === 'manage_org_setting')

    useEffect(() => {
        const fetchOrganisation = async () => {
            // Only fetch if user has at least view permission
            if (!hasViewPermission) return
            
            try {
                setLoading(true)
                const settingsUrl = typeof APIDictionary.OrganizationSettings === 'function' 
                    ? APIDictionary.OrganizationSettings() 
                    : APIDictionary.OrganizationSettings;
                const response = await axios.get(`${settingsUrl}/${user?.organization?.id}`);
                console.log("API Response:", response.data);
                
                setOrganizationSettings(response?.data);
                
                // Handle different possible response structures
                let weekoffData: number[] = [];
                if (Array.isArray(response?.data)) {
                    // If response.data is an array, try to get weekoff from the first item
                    weekoffData = response?.data[0]?.settings?.weekoff || [];
                } else if (response?.data?.settings?.weekoff) {
                    // If response.data is an object with settings.weekoff
                    weekoffData = response.data.settings.weekoff;
                } else if (response?.data?.weekoff) {
                    // If response.data is an object with direct weekoff property
                    weekoffData = response.data.weekoff;
                }
                
                setEditedWeekoffs(weekoffData);
            } catch (error) {
                console.error('Failed to fetch organisation:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch organization settings. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }
        if (user) {
            fetchOrganisation()
        }
    },[user, hasViewPermission])

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

        if (!user?.organization?.id) return
        
        try {
            setSaving(true)
            const settingsUrl = typeof APIDictionary.OrganizationSettings === 'function' 
                ? APIDictionary.OrganizationSettings() 
                : APIDictionary.OrganizationSettings;
            await axios.put(`${settingsUrl}/${user.organization.id}`, {
                settings: {
                    weekoff: editedWeekoffs,
                }
            })
            toast({
                title: "Success",
                description: "Settings saved successfully",
                variant: "default",
            })
            // Update local state after successful save
            if (organizationSettings) {
                // Update in the same structure we received it
                if (Array.isArray(organizationSettings)) {
                    const updatedSettings = [...organizationSettings];
                    if (updatedSettings[0]) {
                        updatedSettings[0] = {
                            ...updatedSettings[0],
                            settings: {
                                ...updatedSettings[0].settings,
                                weekoff: editedWeekoffs
                            }
                        };
                    }
                    setOrganizationSettings(updatedSettings);
                } else {
                    const updatedSettings = {
                        ...organizationSettings,
                        settings: {
                            ...organizationSettings.settings,
                            weekoff: editedWeekoffs
                        }
                    };
                    setOrganizationSettings(updatedSettings);
                }
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
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

        if (!user?.organization?.id) return
        
        try {
            setSaving(true)
            const settingsUrl = typeof APIDictionary.OrganizationSettings === 'function' 
                ? APIDictionary.OrganizationSettings() 
                : APIDictionary.OrganizationSettings;
            await axios.post(`${settingsUrl}/reset/${user.organization.id}`)
            toast({
                title: "Success",
                description: "Settings reset to default successfully",
                variant: "default",
            })
            
            // Refetch the settings
            const response = await axios.get(`${settingsUrl}/${user?.organization?.id}`);
            console.log("Reset response:", response.data);
            setOrganizationSettings(response?.data);
            
            // Handle different possible response structures
            let weekoffData: number[] = [];
            if (Array.isArray(response?.data)) {
                weekoffData = response?.data[0]?.settings?.weekoff || [];
            } else if (response?.data?.settings?.weekoff) {
                weekoffData = response.data.settings.weekoff;
            } else if (response?.data?.weekoff) {
                weekoffData = response.data.weekoff;
            }
            
            setEditedWeekoffs(weekoffData);
        } catch (error) {
            console.error('Failed to reset settings:', error)
            toast({
                title: "Error",
                description: "Failed to reset settings. Please try again.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
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

    if (loading) {
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