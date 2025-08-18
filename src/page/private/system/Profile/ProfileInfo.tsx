import { useToast } from '@/hooks/use-toast'
import { User } from '@/interface/general'
import { APIDictionary } from '@/api/v2/APIdict'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { BriefcaseIcon, BanknotesIcon, UserIcon, PencilIcon, CalendarIcon, PhoneIcon, MapPinIcon, EnvelopeIcon, IdentificationIcon } from "@heroicons/react/24/outline"
import { Building } from 'lucide-react'
import { MultiDepartmentDisplay } from '@/components/ui/MultiDepartmentDisplay'
import DepartmentAssignmentHistory from '@/components/ui/DepartmentAssignmentHistory'
import { Separator } from "@/components/ui/separator"
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/services/AuthContext'
import { Button } from "@/components/ui/button"
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { motion } from 'framer-motion'
import BankDetails from '@/components/BankDetails'
import RouteDict from '@/routes/RouteDict'

const ProfileInfo = () => {
    const { id } = useParams()
    console.log("Profile ID:", id);
    
    const { user } = useAuth()
    const navigate = useNavigate()
    const [profileInfo, setProfileInfo] = useState<User>()
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const [permissionList] = useAtom(permissionListAtom)

    const fetchProfileInfo = async () => {
        setIsLoading(true)
        try {
            const profileId = id ? id : user?.id || '';
            const profileInfo = await axios.get(APIDictionary.userProfile(profileId), { withCredentials: true })
            
            if (profileInfo.status == 200) {
                setProfileInfo(profileInfo.data.user)
            }
            else {
                toast({
                    title: "Failed to fetch profile info",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Failed to fetch profile info",
                description: "Please try again later",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }
    
    useEffect(() => {
        fetchProfileInfo()
    }, [id])
    
    const hasPermission = (permissionKey: string) => {
        return permissionList.some(permission => permission.key === permissionKey);
    }

    const canDisplayFinancialInfo = () => {
        const isOwnProfile = !id || id === user?.id;
        const isSubordinate = user?.id && profileInfo?.managerId === user?.id;

        if (isOwnProfile) {
            return hasPermission('view_salary_slip_to_myself');
        } else if (isSubordinate) {
            return hasPermission('view_salary_slip_of_subordinates');
        } else {
            return hasPermission('view_salary_slip_of_all');
        }
    };
    
    const canDisplayPersonalInfo = () => {
        const isOwnProfile = !id || id === user?.id;
        const isSubordinate = user?.id && profileInfo?.managerId === user?.id;
        if (isOwnProfile) {
            return hasPermission('view_personal_info_to_myself');
        } else if (isSubordinate) {
            return hasPermission('view_personal_info_of_subordinates');
        } else {
            return hasPermission('view_personal_info_of_all');
        }
    }
    
    const canDisplayEmploymentInfo = () => {
        const isOwnProfile = !id || id === user?.id;
        const isSubordinate = user?.id && profileInfo?.managerId === user?.id;
        if (isOwnProfile) {
            return hasPermission('view_employment_info_to_myself');
        } else if (isSubordinate) {
            return hasPermission('view_employment_info_of_subordinates');
        } else {
            return hasPermission('view_employment_info_of_all');
        }
    }

    const canDisplayBankInfo = () => {
        const isOwnProfile = !id || id === user?.id;
        const isSubordinate = user?.id && profileInfo?.managerId === user?.id;

        if (isOwnProfile) {
            return true; // Users can always view their own bank details
        } else if (isSubordinate) {
            return hasPermission('view_bank_subordinates');
        } else {
            return hasPermission('view_bank_all_user');
        }
    };
    
    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-40" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!profileInfo) {
        return (
            <div className="container mx-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="rounded-full bg-muted p-3">
                                <UserIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold">Profile Not Found</h2>
                            <p className="text-muted-foreground">The requested profile information could not be loaded.</p>
                            <Button onClick={() => fetchProfileInfo()}>Retry</Button>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    const isOwnProfile = !id || id === user?.id;
    const isManager = user?.id && profileInfo?.managerId && profileInfo?.managerId === user?.id;
    const hasFinancialInfo = (info?: User) => {
        return (info?.annualPackage ?? 0) > 0 || (info?.monthlySalary ?? 0) > 0;
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="p-6 w-full h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
            <div className="max-w-4xl mx-auto space-y-6">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    transition={{ duration: 0.3 }}
                >
                    <Card className={`shadow-sm hover:shadow transition-shadow duration-300 ${
                        profileInfo?.status !== 'active' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''
                    }`}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className={`h-20 w-20 ring-2 ring-offset-2 ${
                                    profileInfo?.status !== 'active' 
                                        ? 'ring-red-500 ring-offset-red-50 dark:ring-offset-red-950/20' 
                                        : 'ring-primary/20 ring-offset-background'
                                }`}>
                                    <AvatarFallback className={`text-xl font-semibold ${
                                        profileInfo?.status !== 'active' 
                                            ? 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200' 
                                            : ''
                                    }`}>
                                        {profileInfo?.firstName?.charAt(0)} {profileInfo?.lastName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <CardTitle className={`text-2xl font-bold ${
                                        profileInfo?.status !== 'active' ? 'text-red-700 dark:text-red-400' : ''
                                    }`}>
                                        {profileInfo?.firstName} {profileInfo?.lastName}
                                    </CardTitle>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={profileInfo?.status === 'active' ? 'default' : 'destructive'}
                                            className="px-3 py-1 text-xs font-medium uppercase tracking-wider">
                                            {profileInfo?.status}
                                        </Badge>
                                        {profileInfo?.roles && profileInfo.roles[0] && (
                                            <span className="text-sm text-muted-foreground">
                                                {profileInfo.roles[0].role?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {(isManager || isOwnProfile) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 hover:bg-primary/10"
                                    onClick={() => {
                                        const link = isManager ? RouteDict.Profile.Edit(id ?? null) : RouteDict.Profile.Edit(null);
                                        navigate(link)
                                    }}
                                >
                                    <PencilIcon className="h-4 w-4" />
                                    Edit Profile
                                </Button>
                            )}
                        </CardHeader>
                    </Card>
                </motion.div>

                {canDisplayPersonalInfo() && (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2 text-primary/90">
                                    <UserIcon className="w-5 h-5" />
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                                        <EnvelopeIcon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground font-medium">Email</p>
                                        <p className="font-medium">{profileInfo?.email}</p>
                                    </div>
                                </div>
                                
                                {profileInfo?.mobileNumber && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                                            <PhoneIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">Phone</p>
                                            <p className="font-medium">{profileInfo?.mobileNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {profileInfo?.emergencyContact && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                                            <PhoneIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">Emergency Phone Number</p>
                                            <p className="font-medium">{profileInfo?.emergencyContact}</p>
                                        </div>
                                    </div>
                                )}
                                {profileInfo?.dateOfBirth && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                                            <CalendarIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">Date of Birth</p>
                                            <p className="font-medium">
                                                {new Date(profileInfo?.dateOfBirth).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {profileInfo?.address && (
                                    <div className="flex items-start gap-3 sm:col-span-2">
                                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                                            <MapPinIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">Address</p>
                                            <p className="font-medium">{profileInfo?.address}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {canDisplayEmploymentInfo() && (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2 text-primary/90">
                                    <BriefcaseIcon className="w-5 h-5" />
                                    Employment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                                            <IdentificationIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">Employee ID</p>
                                            <p className="font-medium">{profileInfo?.employeeId || profileInfo?.id}</p>
                                        </div>
                                    </div>
                                    
                                    {profileInfo?.hiredDate && (
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-full bg-primary/10 p-2 mt-1">
                                                <CalendarIcon className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground font-medium">Hire Date</p>
                                                <p className="font-medium">
                                                    {new Date(profileInfo?.hiredDate).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Department Information */}
                                <div className="space-y-4">
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium mb-3">Department Assignment</p>
                                        {profileInfo?.userDepartments && profileInfo.userDepartments.length > 0 ? (
                                            <MultiDepartmentDisplay 
                                                user={profileInfo}
                                                showRoles={true}
                                                compact={false}
                                                className="bg-muted/20 rounded-lg p-3"
                                            />
                                        ) : profileInfo?.department ? (
                                            // Fallback for legacy single department display
                                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                                                <div className="rounded-full bg-primary/10 p-2">
                                                    <Building className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{profileInfo.department.name}</p>
                                                    <p className="text-sm text-muted-foreground">Single Department Assignment</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20 text-muted-foreground">
                                                <Building className="w-4 h-4" />
                                                <span>No department assigned</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Roles Information */}
                                {profileInfo?.roles && profileInfo?.roles?.length > 0 && (
                                    <div className="space-y-3">
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium mb-3">System Roles</p>
                                            <div className="flex flex-wrap gap-2">
                                                {profileInfo?.roles?.map((role) => (
                                                    <Badge key={role?.id} variant="secondary" className="px-3 py-1">
                                                        {role?.role?.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {hasFinancialInfo(profileInfo) && canDisplayFinancialInfo() && (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2 text-primary/90">
                                    <BanknotesIcon className="w-5 h-5" />
                                    Financial Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                {(profileInfo?.annualPackage ?? 0) > 0 && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                                            <BanknotesIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">Annual Package</p>
                                            <p className="font-medium text-lg">₹{(profileInfo?.annualPackage ?? 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {(profileInfo?.monthlySalary ?? 0) > 0 && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                                            <BanknotesIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">Monthly Salary</p>
                                            <p className="font-medium text-lg">₹{(profileInfo?.monthlySalary ?? 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {canDisplayBankInfo() && (
                    <BankDetails userId={id || user?.id || ''} />
                )}

                {canDisplayEmploymentInfo() && (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        transition={{ duration: 0.3, delay: 0.4 }}
                    >
                        <DepartmentAssignmentHistory 
                            userId={id || user?.id || ''} 
                            showTitle={true}
                            limit={5}
                            className="shadow-sm hover:shadow-md transition-shadow duration-300"
                        />
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default ProfileInfo