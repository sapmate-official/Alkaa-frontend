import { useToast } from '@/hooks/use-toast'
import { User, RelationshipData } from '@/types/general'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { BriefcaseIcon, BanknotesIcon, UserIcon, PencilIcon, CalendarIcon, PhoneIcon, MapPinIcon, EnvelopeIcon, IdentificationIcon, CogIcon } from "@heroicons/react/24/outline"
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthContext'
import { Button } from "@/components/ui/button"
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { motion } from 'framer-motion'
import BankDetails from '@/components/BankDetails'
import RouteDict from '@/routes/RouteDict'
import { useProfileQuery, useRelationshipQuery } from '@/hooks/queries/useProfile'

const ProfileInfo = () => {
    const { id } = useParams()
    console.log("Profile ID:", id);
    
    const { user } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [permissionList] = useAtom(permissionListAtom)

    const profileId = id || user?.id || ''
    
    // Use TanStack Query hooks
    const { 
        data: profileInfo, 
        isLoading, 
        error: profileError 
    } = useProfileQuery(profileId)
    
    const { 
        data: relationshipResponse 
    } = useRelationshipQuery(id && id !== user?.id ? id : undefined)
    
    const relationshipData = relationshipResponse?.data as RelationshipData

    // Show error toast if profile fetch fails
    if (profileError) {
        toast({
            title: "Failed to fetch profile info",
            description: "Please try again later",
            variant: "destructive"
        })
    }
    
    const hasPermission = (permissionKey: string) => {
        return permissionList.some(permission => permission.key === permissionKey);
    }

    const canDisplayFinancialInfo = () => {
        // Use relationship API data if available, otherwise fallback to manual checks
        if (relationshipData?.relationship) {
            return relationshipData.relationship.canViewSalary;
        }
        
        // Fallback to manual permission checks
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
        // Use relationship API data if available, otherwise fallback to manual checks
        if (relationshipData?.relationship) {
            return relationshipData.relationship.canViewPersonalInfo;
        }
        
        // Fallback to manual permission checks
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
        // Use relationship API data if available, otherwise fallback to manual checks
        if (relationshipData?.relationship) {
            return relationshipData.relationship.canViewEmploymentInfo;
        }
        
        // Fallback to manual permission checks
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
        // Use relationship API data if available, otherwise fallback to manual checks
        if (relationshipData?.relationship) {
            return relationshipData.relationship.canViewBankDetails;
        }
        
        // Fallback to manual permission checks
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

    const canEditProfile = () => {
        // Use relationship API data if available, otherwise fallback to manual checks
        if (relationshipData?.relationship) {
            return relationshipData.relationship.canEditProfile;
        }
        
        // Fallback to manual checks
        const isOwnProfile = !id || id === user?.id;
        const isManager = user?.id && profileInfo?.managerId && profileInfo?.managerId === user?.id;
        return isOwnProfile || isManager;
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
                            <Button onClick={() => window.location.reload()}>Retry</Button>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    const isOwnProfile = !id || id === user?.id;
    const isManager = relationshipData?.relationship?.isDirectManager || 
                     (user?.id && profileInfo?.managerId && profileInfo?.managerId === user?.id);
    const isOrgAdmin = relationshipData?.isOrgAdmin;
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
                            <div className="flex items-center gap-2">
                                {/* Settings button - only for own profile */}
                                {isOwnProfile && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 hover:bg-secondary/80"
                                        onClick={() => navigate(RouteDict.Profile.Settings)}
                                    >
                                        <CogIcon className="h-4 w-4" />
                                        Settings
                                    </Button>
                                )}
                                
                                {/* Edit Profile button */}
                                {(isManager || isOwnProfile || canEditProfile() || isOrgAdmin) && (
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
                            </div>
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
                            <CardContent className="grid gap-6 sm:grid-cols-2">
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
                                
                                {profileInfo?.roles && profileInfo?.roles?.length > 0 && (
                                    <div className="sm:col-span-2">
                                        <div className="space-y-3">
                                            <p className="text-sm text-muted-foreground font-medium">Roles</p>
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
            </div>
        </div>
    )
}

export default ProfileInfo