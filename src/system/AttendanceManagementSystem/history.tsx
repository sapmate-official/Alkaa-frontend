import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext';
import { AttendanceSession } from '@/types/attendance';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

interface GroupedSessions {
  [date: string]: AttendanceSession[];
}

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [groupedAttendance, setGroupedAttendance] = useState<GroupedSessions>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${APIDictionary.attendance}/user/${user?.id}`, { withCredentials: true });
      const sessions = response.data;
      
      // Group sessions by date
      const grouped = sessions.reduce((acc: GroupedSessions, session: AttendanceSession) => {
        const date = format(new Date(session.date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        
        acc[date].push(session);
        return acc;
      }, {});
      
      setGroupedAttendance(grouped);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAttendanceHistory();
    }
  }, [user?.id]);

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

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full mx-auto  overflow-y-scroll">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Attendance History</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-center">
            <p className="text-gray-500">Loading attendance records...</p>
          </div>
        </div>
      ) : Object.keys(groupedAttendance).length === 0 ? (
        <Card className="p-4 sm:p-6 shadow-sm">
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-medium mb-2">No attendance records found</p>
            <p className="text-sm">Your attendance history will appear here</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4 min-w-full">
            {Object.entries(groupedAttendance)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([date, sessions]) => (
                <AccordionItem key={date} value={date} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="hover:no-underline p-2 sm:p-3 w-full">
                    <div className="w-full overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 sm:gap-4">
                        <h3 className="text-base sm:text-lg font-medium truncate">
                          {format(new Date(date), 'dd MMMM yyyy')}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge variant="outline" className="whitespace-nowrap text-xs sm:text-sm">
                            Duration: {calculateTotalDuration(sessions)}
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
                      {sessions.map((session) => (
                        <Card key={session.id} className="overflow-hidden border-l-4" 
                              style={{ 
                                borderLeftColor: session?.status === 'COMPLETED' ? '#10b981' : 
                                                session?.status === 'PENDING' ? '#f59e0b' : '#6b7280'
                              }}>
                          <CardContent className="p-3 sm:p-4 overflow-x-auto">
                            <div className="flex flex-col sm:flex-row justify-between gap-2 min-w-[280px]">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">Session {session?.sessionNumber}</p>
                                <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                  <span>{formatTime(session?.checkInTime)}</span>
                                  <span className="mx-1">→</span>
                                  <span>{formatTime(session?.checkOutTime)}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                                {session?.duration?.hours && (
                                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                    {session?.duration?.hours?.toFixed(1)}h
                                  </Badge>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs whitespace-nowrap ${
                                    session?.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    session?.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {session?.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;