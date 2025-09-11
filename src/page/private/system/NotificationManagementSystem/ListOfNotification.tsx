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
import { useNavigate } from 'react-router-dom';
import { NotificationSubscribe } from '@/components/ui/NotificationSubscribe';
import { NotificationTest } from '@/components/ui/NotificationTest';
import RouteDict from '@/routes/RouteDict';
import { useUserNotifications, type Notification } from '@/hooks/queries/useNotifications';

const ListOfNotification = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    
    // Use TanStack Query hook instead of manual state and axios
    const { data: notifications = [], isLoading, error } = useUserNotifications(user?.id || '');

    if (isLoading) {
        return (
            <div className="p-4 w-full h-full overflow-y-scroll">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 w-full h-full overflow-y-scroll">
                <div className="flex justify-center items-center h-64">
                    <p className="text-red-600">Failed to load notifications</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 w-full h-full overflow-y-scroll">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Notifications</h2>
                <div className="flex gap-2">
                    <NotificationTest />
                    <NotificationSubscribe />
                    <Button onClick={()=>navigate(RouteDict.Notification.TemplateCreate)}>
                        Create Template
                    </Button>
                </div>
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
                            <TableCell>
                                <div>
                                    <div className="font-medium">{notification?.title}</div>
                                    <div className="text-sm text-muted-foreground">{notification?.message}</div>
                                </div>
                            </TableCell>
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