import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext';
import { AttendanceSession } from '@/interface/attendance';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format, isToday } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { CalendarX2, Clock, MapPin, UserCheck } from 'lucide-react';
import { motion } from "framer-motion";
import { DayPicker } from 'react-day-picker';

interface GroupedSessions {
  [date: string]: AttendanceSession[];
}

interface UserOption {
  id: string;
  name: string;
  email?: string;
  department?: string;
}

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [permissionList] = useAtom(permissionListAtom);
  const [groupedAttendance, setGroupedAttendance] = useState<GroupedSessions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDaySessions, setSelectedDaySessions] = useState<AttendanceSession[]>([]);

  // Check permissions
  const hasViewSubordinatesPermission = permissionList.some(p => p.key === 'view_subordinates_attendance');
  const hasViewAllUsersPermission = permissionList.some(p => p.key === 'view_all_user_attendance');
  const canViewOthers = hasViewSubordinatesPermission || hasViewAllUsersPermission;

  // Fetch available users based on permissions
  const fetchAvailableUsers = async () => {
    if (!canViewOthers || !user?.id) return;
    
    setLoadingUsers(true);
    try {
      let endpoint = '';
      if (hasViewAllUsersPermission) {
        endpoint = `${APIDictionary.user}/all`;
      } else if (hasViewSubordinatesPermission) {
        endpoint = `${APIDictionary.user}/subordinates/${user.id}`;
      }

      const response = await axios.get(endpoint, { withCredentials: true });
      const fetchedUsers = response.data
        .filter((u: any) => u.id !== user.id)
        .map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          department: u.department?.name || 'Unassigned'
        }));
      
      const currentUser = {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''} (Me)`.trim(),
        email: user.email
      };
      
      setUsers([currentUser, ...fetchedUsers]);
      setSelectedUserId(user.id);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setSelectedUserId(user.id);
      fetchAvailableUsers();
    }
  }, [user?.id, hasViewSubordinatesPermission, hasViewAllUsersPermission]);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const targetUserId = (canViewOthers && selectedUserId) ? selectedUserId : user?.id;
      const response = await axios.get(`${APIDictionary.attendance}/user/${targetUserId}`, { withCredentials: true });
      const sessions = response.data;
      
      const grouped = sessions.reduce((acc: GroupedSessions, session: AttendanceSession) => {
        const date = format(new Date(session.date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        
        acc[date].push(session);
        return acc;
      }, {});
      
      setGroupedAttendance(grouped);

      if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        setSelectedDaySessions(grouped[formattedDate] || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchAttendanceHistory();
    }
  }, [selectedUserId]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setSelectedDaySessions(groupedAttendance[formattedDate] || []);
    } else {
      setSelectedDaySessions([]);
    }
  };

  const calculateTotalDuration = (sessions: AttendanceSession[]) => {
    const totalMinutes = sessions.reduce((acc, session) => {
      if (!session?.duration) {
        return acc;
      }
      return acc + (session?.duration?.totalMinutes || 0);
    }, 0);
  
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'hh:mm a');
  };

  const getSelectedUserName = () => {
    if (!selectedUserId) return '';
    const selectedUser = users.find(u => u.id === selectedUserId);
    return selectedUser ? selectedUser.name : '';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', accent: '#10b981' };
      case 'PENDING': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: '#f59e0b' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', accent: '#6b7280' };
    }
  };

  const attendanceDates = Object.keys(groupedAttendance).map(dateStr => new Date(dateStr));
  const attendanceModifier = attendanceDates.reduce((acc: Record<string, Date>, date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    acc[dateKey] = date;
    return acc;
  }, {});

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="animate-pulse mb-4 border rounded-lg p-3">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="space-y-3">
          {Array(2).fill(0).map((_, j) => (
            <div key={j} className="border rounded-md p-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              </div>
              <div className="mt-2 h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const renderSelectedDateDetails = () => {
    if (!selectedDate || selectedDaySessions.length === 0) {
      return (
        <div className="text-center text-gray-500 py-6">
          <p className="text-sm">No attendance records for this date</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-2">
        <h3 className="font-medium text-gray-700">
          {format(selectedDate, 'EEEE, dd MMMM yyyy')}
          {isToday(selectedDate) && <Badge className="ml-2 bg-blue-500">Today</Badge>}
        </h3>
        <p className="text-sm text-gray-500 flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          Total time: {calculateTotalDuration(selectedDaySessions)}
        </p>
        <div className="space-y-3 mt-4">
          {selectedDaySessions.map((session) => {
            const statusColor = getStatusColor(session?.status || '');
            return (
              <Card 
                key={session.id} 
                className="overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
                style={{ borderLeftColor: statusColor.accent }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Session {session?.sessionNumber}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                      >
                        {session?.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Check-in</p>
                        <p className="text-sm font-medium">{formatTime(session?.checkInTime)}</p>
                        {session?.checkInLocation && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {typeof session.checkInLocation === 'string' 
                                ? session.checkInLocation 
                                : (session.checkInLocation as any)?.address || 'Location data unavailable'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Check-out</p>
                        <p className={`text-sm font-medium ${!session?.checkOutTime ? 'text-amber-500' : ''}`}>
                          {formatTime(session?.checkOutTime)}
                        </p>
                        {session?.checkOutLocation && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {typeof session.checkOutLocation === 'string' 
                                ? session.checkOutLocation 
                                : (session.checkOutLocation as any)?.address || 'Location data unavailable'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {session?.duration?.hours !== undefined && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Duration: {session?.duration?.hours?.toFixed(1)}h</span>
                      </div>
                    )}
                    
                    {session?.notes && (
                      <div className="text-xs text-gray-600 mt-1 border-t pt-2">
                        <p className="font-medium mb-1">Notes:</p>
                        <p>{session.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full mx-auto overflow-y-scroll">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3"
      >
        <h2 className="text-xl sm:text-2xl font-bold">Attendance History</h2>
        
        {canViewOthers && users.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full sm:w-auto min-w-[250px]"
          >
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loadingUsers}>
              <SelectTrigger className="w-full bg-background shadow-sm">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      {user.department && <span className="text-xs text-muted-foreground">{user.department}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </motion.div>
      
      {canViewOthers && selectedUserId !== user?.id && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-2"
        >
          <UserCheck className="h-4 w-4 text-blue-500" />
          <p className="text-sm text-blue-700">Viewing attendance history for: <span className="font-medium">{getSelectedUserName()}</span></p>
        </motion.div>
      )}
      
      {isLoading ? (
        <div className="space-y-4 mt-4">
          {renderSkeletons()}
        </div>
      ) : Object.keys(groupedAttendance).length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-4 sm:p-6 shadow-sm border-dashed">
            <div className="text-center text-gray-500 py-8 flex flex-col items-center">
              <CalendarX2 className="h-12 w-12 text-gray-300 mb-3" strokeWidth={1.5} />
              <p className="text-lg font-medium mb-2">No attendance records found</p>
              <p className="text-sm max-w-md mx-auto">
                {selectedUserId === user?.id ? 
                  "Your attendance history will appear here once you've checked in." : 
                  "This user has no attendance records in the system."}
              </p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2 overflow-x-auto">
            <Accordion type="single" collapsible className="space-y-3 sm:space-y-4 min-w-full">
              {Object.entries(groupedAttendance)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, sessions], index) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <AccordionItem value={date} className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                      <AccordionTrigger className="hover:no-underline p-3 sm:p-4 w-full group">
                        <div className="w-full overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 sm:gap-4">
                            <h3 className="text-base sm:text-lg font-medium truncate flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                {new Date(date).getDate()}
                              </span>
                              <span>
                                {format(new Date(date), 'EEEE, dd MMMM yyyy')}
                              </span>
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <Badge variant="outline" className="whitespace-nowrap text-xs sm:text-sm flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {calculateTotalDuration(sessions)}
                              </Badge>
                              <Badge className="whitespace-nowrap text-xs sm:text-sm">
                                {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 sm:px-4 pb-3 overflow-x-auto">
                        <div className="space-y-3 mt-2 min-w-[300px]">
                          {sessions.map((session, idx) => {
                            const statusColor = getStatusColor(session?.status || '');
                            return (
                              <motion.div
                                key={session.id} 
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <Card 
                                  key={session.id} 
                                  className="overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
                                  style={{ borderLeftColor: statusColor.accent }}
                                >
                                  <CardContent className="p-4 overflow-x-auto">
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 min-w-[280px]">
                                      <div className="min-w-0 flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm text-primary shrink-0">
                                          {session?.sessionNumber || '-'}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold">Session {session?.sessionNumber}</p>
                                          <div className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span className="font-medium">{formatTime(session?.checkInTime)}</span>
                                            <span className="mx-1">→</span>
                                            <span className={`${!session?.checkOutTime ? 'text-amber-500' : ''} font-medium`}>
                                              {formatTime(session?.checkOutTime)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                                        {session?.duration?.hours !== undefined && (
                                          <Badge variant="secondary" className="text-xs whitespace-nowrap flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {session?.duration?.hours?.toFixed(1)}h
                                          </Badge>
                                        )}
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs whitespace-nowrap ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                                        >
                                          {session?.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
            </Accordion>
          </div>
          
          <div className="lg:w-1/2">
            <Card className="p-4 border shadow-sm">
              <div className="flex flex-col gap-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center"
                >
                  <style dangerouslySetInnerHTML={{ 
                    __html: `
                      .rdp-day_selected:not([disabled]) { 
                        background-color: var(--primary);
                        color: white;
                      }
                      .rdp-day_today:not(.rdp-day_outside) { 
                        font-weight: bold;
                        border: 1px solid var(--primary);
                      }
                      .attendance-day:not(.rdp-day_selected):not([disabled]) {
                        background-color: rgba(16, 185, 129, 0.15);
                        color: rgb(6, 95, 70);
                      }
                    `
                  }} />
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    modifiers={{
                      'attendance-day': Object.values(attendanceModifier)
                    }}
                    modifiersClassNames={{
                      'attendance-day': 'attendance-day'
                    }}
                    className="border-b pb-4"
                    showOutsideDays
                  />
                </motion.div>
                
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 rounded-full border border-green-600"></div>
                    <span>Has Attendance</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                    <span>Today</span>
                  </div>
                </div>
                
                <div className="mt-4 border-t pt-4">
                  {renderSelectedDateDetails()}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;