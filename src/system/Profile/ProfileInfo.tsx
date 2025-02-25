import { useToast } from '@/hooks/use-toast'
import { User } from '@/interface/general'
import { APIDictionary } from '@/api/APIdict'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {  BriefcaseIcon, BanknotesIcon, UserIcon, PencilIcon } from "@heroicons/react/24/outline"
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/services/AuthContext'
import { Button } from "@/components/ui/button"

const ProfileInfo = () => {
    const {id} = useParams()
    const {user}= useAuth()
    const navigate = useNavigate()
    const [profileInfo,setProfileInfo] = useState<User>()
    const {toast} = useToast()
    
    const fetchProfileInfo = async () => {
        try {
            const profileId = id ? id : user?.id || '';
            const profileInfo = await axios.get(APIDictionary.userProfile(profileId), { withCredentials: true })
            console.log(profileInfo)
            if (profileInfo.status == 200) {
                setProfileInfo(profileInfo.data.user)
                console.log(profileInfo.data.user);
                
            }
            else {
                toast({
                    title: "Failed to fetch profile info",
                    description: "Please try again later",

                    variant: "destructive"
                })
                console.log("Failed to fetch profile info")
            }
        } catch (error) {
            console.log(error)
            toast({
                title: "Failed to fetch profile info",
                description: "Please try again later",
                variant: "destructive"
            })
        }
    }
    useEffect(()=>{
        
            fetchProfileInfo()
        
    },[id])

    // Helper function to safely check numeric values
    const hasFinancialInfo = (info?: User) => {
        return (info?.annualPackage ?? 0) > 0 || (info?.monthlySalary ?? 0) > 0;
    };

    const isOwnProfile = !id || id === user?.id;

    if (!profileInfo) {
        return (
            <div className="container mx-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 w-full h-full overflow-y-scroll">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Main Profile Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">
                                    {profileInfo?.name?.split(' ')?.map(n => n?.[0])?.join('') || profileInfo?.email?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <CardTitle className="text-2xl">{profileInfo?.name || profileInfo?.email}</CardTitle>
                                <Badge variant={profileInfo?.status === 'active' ? 'default' : 'destructive'}>
                                    {profileInfo?.status}
                                </Badge>
                            </div>
                        </div>
                        {isOwnProfile && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => navigate(`/p/profile/edit`)}
                            >
                                <PencilIcon className="h-4 w-4" />
                                Edit Profile
                            </Button>
                        )}
                    </CardHeader>
                </Card>

                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <UserIcon className="w-5 h-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{profileInfo?.email}</p>
                        </div>
                        {profileInfo?.mobileNumber && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{profileInfo?.mobileNumber}</p>
                            </div>
                        )}
                        {profileInfo?.address && (
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{profileInfo?.address}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Employment Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <BriefcaseIcon className="w-5 h-5" />
                            Employment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Employee ID</p>
                            <p className="font-medium">{profileInfo?.employeeId || profileInfo?.id}</p>
                        </div>
                        {profileInfo?.hiredDate && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Hire Date</p>
                                <p className="font-medium">
                                    {new Date(profileInfo?.hiredDate).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        {profileInfo?.roles && profileInfo?.roles?.length > 0 && (
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-sm text-muted-foreground">Roles</p>
                                <div className="flex flex-wrap gap-2">
                                    {profileInfo?.roles?.map((role) => (
                                        <Badge key={role?.id} variant="secondary">
                                            {role?.role?.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Financial Information */}
                {hasFinancialInfo(profileInfo) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <BanknotesIcon className="w-5 h-5" />
                                Financial Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {(profileInfo?.annualPackage ?? 0) > 0 && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Annual Package</p>
                                    <p className="font-medium">₹{(profileInfo?.annualPackage ?? 0).toLocaleString()}</p>
                                </div>
                            )}
                            {(profileInfo?.monthlySalary ?? 0) > 0 && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Monthly Salary</p>
                                    <p className="font-medium">₹{(profileInfo?.monthlySalary ?? 0).toLocaleString()}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default ProfileInfo