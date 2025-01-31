import { useToast } from '@/hooks/use-toast'
import { User } from '@/interface/general'
import { backendDomain } from '@/lib/constant/Domain'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const ProfileInfo = () => {
    const {id} = useParams()
    const [profileInfo,setProfileInfo] = useState<User>()
    const {toast} = useToast()
    const fetchProfileInfo = async () => {
        try {
            const profileInfo = await axios.get(`${backendDomain}/api/v1/general/profile/${id}`, { withCredentials: true })
            console.log(profileInfo)
            if (profileInfo.status == 200) {
                setProfileInfo(profileInfo.data)
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
        if(id){
            fetchProfileInfo()
        }
    },[id])

    if (!profileInfo) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <div className="container mx-auto p-6">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                            {profileInfo.name && profileInfo?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl">{profileInfo.name}</CardTitle>
                        <Badge variant={profileInfo.status === 'active' ? 'default' : 'destructive'}>
                            {profileInfo.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{profileInfo.email}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="font-medium capitalize">{profileInfo.role.toLowerCase()}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Employee ID</p>
                            <p className="font-medium">{profileInfo.id}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ProfileInfo