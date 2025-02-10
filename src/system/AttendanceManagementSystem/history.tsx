import { APIDictionary } from '@/api/APIdict';
import { useAuth } from '@/services/AuthContext';
import { AttendanceSession } from '@/types/attendance';
import axios from 'axios';
import  { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const fetchAttendanceHistory = async () => {
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
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [user?.id]);

  const calculateTotalDuration = (sessions: AttendanceSession[]) => {
    const totalMinutes = sessions.reduce((acc, session) => {
      // Skip sessions with null duration
      if (!session.duration) {
        return acc;
      }
      return acc + (session.duration.totalMinutes || 0);
    }, 0);
  
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'hh:mm a');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold mb-6">Attendance History</h2>
    {Object.keys(groupedAttendance).length === 0 ? (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No attendance records till now
        </div>
      </Card>
    ) : (
      <Accordion type="single" collapsible className="space-y-4">
        {Object.entries(groupedAttendance).map(([date, sessions]) => (
          <AccordionItem key={date} value={date}>
            <AccordionTrigger className="hover:no-underline">
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {format(new Date(date), 'dd MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      Total Duration: {calculateTotalDuration(sessions)}
                    </Badge>
                    <Badge>
                      {sessions.length} Sessions
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 mt-2">
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold">Session {session.sessionNumber}</p>
                          <p className="text-sm text-gray-500">
                            {formatTime(session.checkInTime)} - {formatTime(session.checkOutTime)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">
                            Duration: {session.duration.hours.toFixed(1)}h
                          </Badge>
                          <Badge variant="outline">{session.status}</Badge>
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
    )}
  </div>
  );
};

export default AttendanceHistory;