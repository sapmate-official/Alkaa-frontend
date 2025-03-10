import { APIDictionary } from '@/api/v2/APIdict';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/services/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import axios from 'axios';
import  { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  metadata: Record<string, any>;
}

const ListOfNotification = () => {
    const {user} = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<Notification[]>([])

    const fetchNotification = async () => {
        try {
            const response = await axios.get(`${APIDictionary.notification}/${user?.id}`);
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notification:', error);
        }
    }

    useEffect(()=>{
        if(user){
            fetchNotification()
        }
    },[user])

    return (
        <div className="p-4 w-full h-full overflow-y-scroll">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Notifications</h2>
                <Button onClick={()=>navigate("/p/notification/template")}>
                    Create Template
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notifications?.map((notification) => (
                        <TableRow key={notification?.id}>
                            <TableCell>
                                <Badge variant={notification?.isRead ? "secondary" : "default"}>
                                    {notification?.isRead ? "Read" : "Unread"}
                                </Badge>
                            </TableCell>
                            <TableCell>{notification?.content}</TableCell>
                            <TableCell>
                                {notification?.createdAt && new Date(notification.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default ListOfNotification