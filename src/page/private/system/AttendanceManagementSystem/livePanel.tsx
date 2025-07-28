import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Clock, ChevronDown, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTheme } from '@/provider/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [permissionType, setPermissionType] = useState<'all' | 'subordinates' | 'none'>('none');
    const currentSession = getCurrentSession();
    const {toast} = useToast()
    const { theme } = useTheme();
    const [permissionList] = useAtom(permissionListAtom);
    
    // Check if user has permission to view attendance data
    const checkPermissions = (): boolean => {
        if (!permissionList) return false;
        const viewAllPermission = permissionList.some(permission => permission.key === 'view_all_user_attendance');
        const viewSubordinatesPermission = permissionList.some(permission => permission.key === 'view_subordinates_attendance');
        
        if (viewAllPermission) {
            setPermissionType('all');
        } else if (viewSubordinatesPermission) {
            setPermissionType('subordinates');
        } else {
            setPermissionType('none');
        }
        
        return viewAllPermission || viewSubordinatesPermission;
    };
    
    const fetchAttendanceData = async (isRefresh = false) => {
        if (!user) return;
        
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            
            // Select endpoint based on permission level
            let endpoint = '';
            if (permissionList.some(permission => permission.key === 'view_all_user_attendance')) {
                endpoint = `${APIDictionary.attendance}/live/all`;
            } else if (permissionList.some(permission=>permission.key === 'view_subordinates_attendance')) {
                endpoint = `${APIDictionary.attendance}/manager/live/${user.id}`;
            } else {
                // No permission
                setHasPermission(false);
                setLoading(false);
                setRefreshing(false);
                return;
            }
            
            const response = await axios.get(endpoint, {
                withCredentials: true,
            });
            
            setattendanceData(response?.data?.attendanceRecords);
            setUserData(response?.data?.users);
            setHasPermission(true);
            setLastUpdated(new Date());
            
            if (isRefresh) {
                toast({
                    title: "Data refreshed",
                    description: "Attendance data has been updated",
                });
            }
        }
        catch (error: any) {
            console.error('Failed to fetch data:', error);
            toast({
                title: 'Failed to fetch data',
                description: error.response?.data?.message || 'An error occurred while fetching attendance data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    useEffect(() => {
        if (user) {
            const hasRequiredPermissions = checkPermissions();
            setHasPermission(hasRequiredPermissions);
            
            if (hasRequiredPermissions) {
                fetchAttendanceData();
            } else {
                setLoading(false);
            }
        }
    }, [user]);
    
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

    // Helper to determine card status color (now more subtle)
    const getStatusColor = (userId: string): string => {
        const records = attendanceData[userId] || [];
        const currentSessionRecord = records?.find(r => r?.sessionNumber === currentSession);
        const isDark = theme === 'dark';

        if (!currentSessionRecord) return '';

        switch (currentSessionRecord?.status) {
            case 'PRESENT':
                return currentSessionRecord.checkOutTime !== null && currentSessionRecord.checkOutTime !== undefined
                    ? (isDark ? 'bg-blue-50/5 border-blue-200/20' : 'bg-blue-50/50 border-blue-200/50')
                    : (isDark ? 'bg-green-50/5 border-green-200/20' : 'bg-green-50/50 border-green-200/50');
            case 'LATE':
                return isDark ? 'bg-yellow-50/5 border-yellow-200/20' : 'bg-yellow-50/50 border-yellow-200/50';
            case 'ABSENT':
                return isDark ? 'bg-red-50/5 border-red-200/20' : 'bg-red-50/50 border-red-200/50';
            case 'LEAVE':
                return isDark ? 'bg-gray-50/5 border-gray-200/20' : 'bg-gray-50/50 border-gray-200/50';
            default:
                return '';
        }
    };

    // Helper to get status text
    const getStatusText = (userId: string): string => {
        const records = attendanceData[userId] || [];
        const currentSessionRecord = records?.find(r => r?.sessionNumber === currentSession);

        if (!currentSessionRecord) return 'Not Checked In';

        switch (currentSessionRecord?.status) {
            case 'PRESENT':
                return currentSessionRecord.checkOutTime !== null && currentSessionRecord.checkOutTime !== undefined ? 'Checked Out' : 'Checked In';
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
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Employee Attendance</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-muted">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                        <Badge variant="outline" className="ml-2">
                            Session {currentSession}
                        </Badge>
                    </div>
                </div>
                
                {hasPermission && (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => fetchAttendanceData(true)}
                                        disabled={refreshing}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Refresh attendance data</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        
                        {permissionType !== 'none' && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline" className="cursor-help">
                                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                            {permissionType === 'all' ? 'All Access' : 'Team Access'}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{permissionType === 'all' 
                                            ? 'You can view all employees\' attendance' 
                                            : 'You can view your team members\' attendance'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted">
                    {lastUpdated && (
                        <span>Last updated: {format(lastUpdated, 'h:mm a')}</span>
                    )}
                </div>
                {hasPermission && (
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <Input
                            className="pl-8"
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            {hasPermission && userData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {(() => {
                        const stats = userData.reduce((acc, employee) => {
                            const records = attendanceData[employee.id] || [];
                            const currentRecord = records.find(r => r.sessionNumber === currentSession);
                            const status = currentRecord ? getStatusText(employee.id) : 'Not Checked In';
                            
                            if (status === 'Checked In') acc.checkedIn++;
                            else if (status === 'Checked Out') acc.checkedOut++;
                            else if (status === 'Late') acc.late++;
                            else if (status === 'Absent') acc.absent++;
                            else if (status === 'On Leave') acc.onLeave++;
                            else acc.notCheckedIn++;
                            
                            return acc;
                        }, { checkedIn: 0, checkedOut: 0, late: 0, absent: 0, onLeave: 0, notCheckedIn: 0 });

                        return (
                            <>
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Checked In</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.checkedIn}</p>
                                </div>
                                
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Checked Out</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.checkedOut}</p>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Late/Absent</span>
                                    </div>
                                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">{stats.late + stats.absent}</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Not Started</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.notCheckedIn + stats.onLeave}</p>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col justify-center items-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin opacity-70 mb-4" />
                    <p>Loading attendance data...</p>
                </div>
            ) : !hasPermission ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <AlertCircle className="h-12 w-12 text-muted mb-4" />
                    <p className="text-lg font-medium mb-2">No Permission</p>
                    <p className="text-muted-foreground">You don't have permission to view attendance data.</p>
                </div>
            ) : userData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-lg font-medium mb-2">No Data Available</p>
                    <p className="text-muted-foreground">No attendance records found for employees.</p>
                    <Button variant="outline" className="mt-4" onClick={() => fetchAttendanceData(true)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredEmployees?.map((employee, index) => {
                        const isExpanded = expandedCards[employee?.id] || false;
                        const statusColor = employee?.id ? getStatusColor(employee.id) : '';
                        const statusText = employee?.id ? getStatusText(employee.id) : '';
                        const employeeRecords = employee?.id ? (attendanceData[employee.id] || []) : [];
                        const currentSessionRecord = employeeRecords?.find(r => r?.sessionNumber === currentSession);

                        return employee ? (
                            <motion.div
                                key={employee.id}
                                className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02, duration: 0.3 }}
                            >
                                {/* Main card content */}
                                <div 
                                    className={`p-4 cursor-pointer ${statusColor} transition-colors duration-200`}
                                    onClick={() => employee?.id && toggleCard(employee.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Left section - Employee info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={employee?.avatarUrl} alt={employee?.name || ''} />
                                                    <AvatarFallback className="text-sm font-medium">
                                                        {employee?.name ? employee.name.substring(0, 2).toUpperCase() : ''}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Status indicator dot */}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background ${
                                                    statusText === 'Checked In' ? 'bg-green-500' :
                                                    statusText === 'Checked Out' ? 'bg-blue-500' :
                                                    statusText === 'Late' ? 'bg-yellow-500' :
                                                    statusText === 'Absent' ? 'bg-red-500' :
                                                    statusText === 'On Leave' ? 'bg-gray-500' : 'bg-gray-300'
                                                }`} />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-foreground truncate">
                                                        {employee?.name}
                                                    </h3>
                                                    <Badge
                                                        variant={statusText === 'Checked In' ? 'default' : 'secondary'}
                                                        className={`text-xs ${
                                                            statusText === 'Checked In' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                            statusText === 'Checked Out' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                            statusText === 'Late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                            statusText === 'Absent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                        }`}
                                                    >
                                                        {statusText}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {employee?.department} • {employee?.position}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right section - Time and controls */}
                                        <div className="flex items-center gap-4">
                                            {currentSessionRecord?.checkInTime && statusText !== 'Absent' && statusText !== 'On Leave' && (
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Check In</span>
                                                    </div>
                                                    <p className="text-sm font-medium">
                                                        {format(currentSessionRecord.checkInTime, 'h:mm a')}
                                                    </p>
                                                    {currentSessionRecord?.checkOutTime && (
                                                        <div className="mt-1">
                                                            <div className="text-xs text-muted-foreground">Check Out</div>
                                                            <p className="text-xs font-medium">
                                                                {format(currentSessionRecord.checkOutTime, 'h:mm a')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-muted-foreground"
                                            >
                                                <ChevronDown className="h-5 w-5" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 border-t bg-muted/30">
                                                <div className="pt-4">
                                                    <h4 className="font-medium text-sm mb-3 text-foreground">
                                                        Today's Sessions
                                                    </h4>

                                                    {employeeRecords?.length === 0 ? (
                                                        <div className="text-center py-6 text-muted-foreground">
                                                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                            <p className="text-sm">No attendance records for today</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {employeeRecords?.map((record, recordIndex) => record ? (
                                                                <motion.div
                                                                    key={record.id}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: recordIndex * 0.1 }}
                                                                    className="bg-background rounded-lg border p-3"
                                                                >
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div className="flex gap-2">
                                                                            <Badge variant="outline" className="text-xs">
                                                                                Session {record?.sessionNumber}
                                                                            </Badge>
                                                                            {record?.verificationStatus && (
                                                                                <Badge variant="outline" className={`text-xs ${getVerificationBadge(record.verificationStatus)}`}>
                                                                                    {record.verificationStatus}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <Badge variant="outline" className={`text-xs ${
                                                                            record.status === 'PRESENT' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' :
                                                                            record.status === 'LATE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                                            record.status === 'ABSENT' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' :
                                                                            record.status === 'LEAVE' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400' : ''
                                                                        }`}>
                                                                            {record.status}
                                                                        </Badge>
                                                                    </div>

                                                                    {(record?.status !== 'ABSENT' && record?.status !== 'LEAVE') && (
                                                                        <>
                                                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                                                <div>
                                                                                    <p className="text-xs text-muted-foreground mb-1">Check In</p>
                                                                                    <p className="text-sm font-medium">{format(record.checkInTime, 'h:mm a')}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                                                                                    <p className="text-sm font-medium">
                                                                                        {record.checkOutTime ? format(record.checkOutTime, 'h:mm a') : (
                                                                                            <span className="text-yellow-600 dark:text-yellow-400">Ongoing</span>
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {record.duration && (
                                                                                <div className="mb-3">
                                                                                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                                                                    <p className="text-sm font-medium">
                                                                                        {record.duration.hours}h {record.duration.minutes}m
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            <LocationInfo
                                                                                lat={record.checkInLocation.latitude}
                                                                                lon={record.checkInLocation.longitude}
                                                                                address={record.checkInLocation.address}
                                                                            />

                                                                            {record.deviceInfo && (
                                                                                <p className="text-xs text-muted-foreground mt-2">
                                                                                    Device: {record.deviceInfo}
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    )}

                                                                    {record.notes && (
                                                                        <div className="mt-3 pt-3 border-t">
                                                                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                                                            <p className="text-sm">{record.notes}</p>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            ) : null)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : null;
                    })}
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendanceDashboard;