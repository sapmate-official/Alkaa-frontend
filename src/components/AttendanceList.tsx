import { APIDictionary } from '@/lib/APIdict'
import axios from 'axios'
import  { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const AttendanceList = () => {
    const [attendanceList, setAttendanceList] = useState<any[]>([])
    const [expandedUser, setExpandedUser] = useState<string | null>(null)

    const fetchAttendanceList = async () => {
        const response  = await axios.get(APIDictionary.attendanceHistory,{withCredentials:true})
        setAttendanceList(response.data)
        console.log(response.data);
        
    }
    useEffect(()=>{
        fetchAttendanceList()   
    },[])

    const formatDuration = (duration: { hours: number, minutes: number }) => {
        return `${Math.floor(duration.hours)}h ${duration.minutes}m`
    }

    const getStatusBadge = (status: string) => {
        const variants: { [key: string]: "default" | "destructive" | "secondary" | "outline" } = {
            'EARLY_DEPARTURE': 'outline',
            'COMPLETED': 'default',
            'ABSENT': 'destructive'
        }
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>
    }

    const handleExpandClick = (userId: string) => {
        setExpandedUser(expandedUser === userId ? null : userId)
    }

    return (
        <div className="space-y-4 w-full p-4">
            {attendanceList.map((user) => (
                <Card key={user.id} className="w-full">
                    <CardHeader className="p-4">
                        <Button 
                            variant="ghost" 
                            className="w-full flex items-center justify-between"
                            onClick={() => handleExpandClick(user.id)}
                        >
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{user.name}</span>
                                <span className="text-muted-foreground">({user.email})</span>
                            </div>
                            {expandedUser === user.id ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                            }
                        </Button>
                    </CardHeader>
                    {expandedUser === user.id && (
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Session</TableHead>
                                            <TableHead>Check In</TableHead>
                                            <TableHead>Check Out</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {user.attendanceRecords.map((record: any) => (
                                            <TableRow key={record.id}>
                                                <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell>{record.sessionNumber}</TableCell>
                                                <TableCell>{format(new Date(record.checkInTime), 'hh:mm a')}</TableCell>
                                                <TableCell>{format(new Date(record.checkOutTime), 'hh:mm a')}</TableCell>
                                                <TableCell>{formatDuration(record.duration)}</TableCell>
                                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    )
}

export default AttendanceList