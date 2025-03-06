import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/provider/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { APIDictionary } from '@/api/APIdict';
import { useAuth } from '@/services/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
type AttendanceVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';

interface LocationData {
    latitude: number;
    longitude: number;
    address?: string;
}

interface DurationData {
    hours: number;
    minutes: number;
}

interface AttendanceRecord {
    id: string;
    userId: string;
    date: Date;
    sessionNumber: number;
    checkInTime: Date;
    checkOutTime?: Date;
    checkInLocation: LocationData;
    checkOutLocation?: LocationData;
    status: AttendanceStatus;
    notes?: string;
    duration?: DurationData;
    createdAt: Date;
    updatedAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
    verificationStatus?: AttendanceVerificationStatus;
}

interface User {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    avatarUrl?: string;
}

// Location component
const LocationInfo: React.FC<{ lat: number; lon: number; address?: string }> = ({
    lat,
    lon,
    address
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return lat && lon ? (
        <div className={`p-2 rounded-md text-sm ${isDark ? 'bg-card' : 'bg-secondary'}`}>
            <div className="font-medium">Location</div>
            {address && <div className="text-muted-foreground">{address}</div>}
            <div className="text-muted">Lat: {lat?.toFixed(6) ?? 'N/A'}, Lon: {lon?.toFixed(6) ?? 'N/A'}</div>
        </div>
    ) : null;
};

// Mock data for demonstration


// Get current session number based on time of day
const getCurrentSession = (): number => {
    const hour = new Date().getHours();
    return hour < 12 ? 1 : 2;
};

const EmployeeAttendanceDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    const {user} = useAuth();
    const [attendanceData,setattendanceData] = useState<Record<string,AttendanceRecord[]>>({});
    const [userData,setUserData] = useState<User[]>([]);
    const currentSession = getCurrentSession();
    const {toast} = useToast()
    const { theme } = useTheme();
    const fetchAttendanceData = async () => {
        try {
            const response = await axios.get(`${APIDictionary.attendance}/manager/live/${user?.id}`);
            console.log(response?.data);
            
            setattendanceData(response?.data?.attendanceRecords);
            setUserData(response?.data?.users);
        }
        catch (error) {
            console.error('Failed to fetch data:', error);
            toast({
                title: 'Failed to fetch data',
                description: 'An error occurred while fetching attendance data',
                variant: 'destructive'
            })
        }
    }
    useEffect(() => {
        if (user) {
            fetchAttendanceData()
        }
    }, [user])
    // Handle card expansion/collapse
    const toggleCard = (userId: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    // Filter employees based on search query
    const filteredEmployees = userData.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(searchLower) ||
            user.department.toLowerCase().includes(searchLower) ||
            user.position.toLowerCase().includes(searchLower)
        );
    });

    // Helper to determine card status color
    const getStatusColor = (userId: string): string => {
        const records = attendanceData[userId] || [];
        const currentSessionRecord = records?.find(r => r?.sessionNumber === currentSession);
        const isDark = theme === 'dark';

        if (!currentSessionRecord) return isDark ? 'bg-secondary/30' : 'bg-secondary/20';

        console.log(currentSessionRecord.checkOutTime);
        switch (currentSessionRecord?.status) {
            case 'PRESENT':
                return currentSessionRecord.checkOutTime !== undefined
                    ? (isDark ? 'bg-blue-950/50' : 'bg-blue-100')
                    : (isDark ? 'bg-green-950/50' : 'bg-green-100');
            case 'LATE':
                return isDark ? 'bg-yellow-950/50' : 'bg-yellow-100';
            case 'ABSENT':
                return isDark ? 'bg-red-950/50' : 'bg-red-100';
            case 'LEAVE':
                return isDark ? 'bg-gray-950/50' : 'bg-gray-100';
            default:
                return isDark ? 'bg-secondary/30' : 'bg-secondary/20';
        }
    };

    // Helper to get status text
    const getStatusText = (userId: string): string => {
        const records = attendanceData[userId] || [];
        const currentSessionRecord = records?.find(r => r?.sessionNumber === currentSession);

        if (!currentSessionRecord) return 'Not Checked In';

        switch (currentSessionRecord?.status) {
            case 'PRESENT':
                return currentSessionRecord.checkOutTime ? 'Checked Out' : 'Checked In';
            case 'LATE': return 'Late';
            case 'ABSENT': return 'Absent';
            case 'LEAVE': return 'On Leave';
            default: return 'Unknown';
        }
    };

    // Get verification badge variant
    const getVerificationBadge = (status?: AttendanceVerificationStatus) => {
        switch (status) {
            case 'VERIFIED': return 'bg-primary bg-opacity-10 text-primary';
            case 'UNVERIFIED': return 'bg-accent bg-opacity-10 text-accent';
            case 'REJECTED': return 'bg-destructive bg-opacity-10 text-destructive';
            default: return '';
        }
    };

    return (
        <div className="p-6 w-full h-full overflow-y-scroll">
            <h1 className="text-2xl font-bold mb-2">Employee Attendance</h1>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <p className="text-muted">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                    <Badge variant="outline" className="ml-2">
                        Session {currentSession}
                    </Badge>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                        className="pl-8"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees?.map((employee) => {
                    const isExpanded = expandedCards[employee?.id] || false;
                    const statusColor = employee?.id ? getStatusColor(employee.id) : '';
                    const statusText = employee?.id ? getStatusText(employee.id) : '';
                    const employeeRecords = employee?.id ? (attendanceData[employee.id] || []) : [];
                    const currentSessionRecord = employeeRecords?.find(r => r?.sessionNumber === currentSession);

                    return employee ? (
                        // <Card 
                        //   key={employee.id} 
                        //   className={`${statusColor} overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'h-auto' : 'h-32'}`}
                        // >
                        <motion.div
                            key={employee.id}
                            className={`${statusColor} overflow-hidden rounded-lg border`}
                            layout
                            initial={{ borderRadius: 8 }}
                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        >

                            <CardContent className="p-0">
                                <div
                                    className="p-4 cursor-pointer flex justify-between items-center"
                                    onClick={() => employee?.id && toggleCard(employee.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={employee?.avatarUrl} alt={employee?.name || ''} />
                                            <AvatarFallback>{employee?.name ? employee.name.substring(0, 2).toUpperCase() : ''}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{employee?.name}</p>
                                            <p className="text-sm text-muted">{employee?.department} • {employee?.position}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <Badge
                                            variant={statusText === 'Checked In' ? 'default' : 'outline'}
                                            className={statusText === 'Checked In' ? 'bg-primary text-primary-foreground' : ''}
                                        >
                                            {statusText}
                                        </Badge>
                                        {currentSessionRecord?.checkInTime && statusText !== 'Absent' && statusText !== 'On Leave' && (
                                            <div className="flex items-center text-sm mt-1 text-muted">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {format(currentSessionRecord.checkInTime, 'h:mm a')}
                                            </div>
                                        )}
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 mt-1 text-muted" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 mt-1 text-muted" />
                                        )}
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            className="bg-card p-4 border-t"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <div className="bg-card p-4 border-t">
                                                    <h3 className="font-medium mb-3">Today's Sessions</h3>

                                                    {employeeRecords?.length === 0 ? (
                                                        <p className="text-muted">No attendance records for today</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {employeeRecords?.map((record) => record ? (
                                                                <div key={record.id} className="border rounded-md p-3">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <div className="flex gap-2">
                                                                            <Badge>Session {record?.sessionNumber}</Badge>
                                                                            {record?.verificationStatus && (
                                                                                <Badge variant="outline" className={getVerificationBadge(record.verificationStatus)}>
                                                                                    {record.verificationStatus}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <Badge variant="outline" className={
                                                                            record.status === 'PRESENT' ? 'bg-primary bg-opacity-10 text-primary' :
                                                                                record.status === 'LATE' ? 'bg-accent bg-opacity-10 text-accent' :
                                                                                    record.status === 'ABSENT' ? 'bg-destructive bg-opacity-10 text-destructive' :
                                                                                        record.status === 'LEAVE' ? 'bg-secondary bg-opacity-30 text-muted-foreground' : ''
                                                                        }>
                                                                            {record.status}
                                                                        </Badge>
                                                                    </div>

                                                                    {(record?.status !== 'ABSENT' && record?.status !== 'LEAVE') && (
                                                                        <>
                                                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                                                <div>
                                                                                    <p className="text-sm text-muted">Check In</p>
                                                                                    <p>{format(record.checkInTime, 'h:mm a')}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm text-muted">Check Out</p>
                                                                                    <p>{record.checkOutTime ? format(record.checkOutTime, 'h:mm a') : '—'}</p>
                                                                                </div>
                                                                            </div>

                                                                            {record.duration && (
                                                                                <div className="mb-2 text-sm">
                                                                                    <p className="text-muted">Duration</p>
                                                                                    <p>{record.duration.hours}h {record.duration.minutes}m</p>
                                                                                </div>
                                                                            )}

                                                                            <LocationInfo
                                                                                lat={record.checkInLocation.latitude}
                                                                                lon={record.checkInLocation.longitude}
                                                                                address={record.checkInLocation.address}
                                                                            />

                                                                            {record.deviceInfo && (
                                                                                <p className="text-xs text-muted mt-2">
                                                                                    Device: {record.deviceInfo}
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    )}

                                                                    {record.notes && (
                                                                        <div className="mt-2 text-sm">
                                                                            <p className="font-medium">Notes:</p>
                                                                            <p>{record.notes}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : null)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>

                        </motion.div>
                    ) : null;
                })}
            </div>
        </div>
    );
};

export default EmployeeAttendanceDashboard;