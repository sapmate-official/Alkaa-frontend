import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeviceInfo, useIpAddress, useGeolocation } from '@/hooks/useAttendance';
import { APIDictionary } from '@/api/APIdict';
import axios, { AxiosError } from 'axios';
import { useAuth } from '@/services/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow 
} from "@/components/ui/table";
import { AttendanceRecord } from '@/interface/general';
import { useNavigate } from 'react-router-dom';

interface SessionInfo {
  sessionNumber: number;
  totalHours: number;
  status: string;
}

const AttendancePanel = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const { deviceInfo } = useDeviceInfo();
  const { ipAddress } = useIpAddress();
  const { location } = useGeolocation();
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const { user } = useAuth();
  const {toast} = useToast();
  const [todaySessions, setTodaySessions] = useState([]);
  const router = useNavigate();

  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await axios.get(`${APIDictionary.todaySessions}${today}`, {
          withCredentials: true
        });
        
        const sessions = response.data;
        setTodaySessions(sessions);
        
        if (sessions.length > 0) {
          const lastSession = sessions[sessions.length - 1];
          setIsCheckedIn(!lastSession.checkOutTime);
          setSessionInfo({
            sessionNumber: lastSession.sessionNumber,
            totalHours: lastSession.duration?.hours || 0,
            status: lastSession.status
          });
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };
    checkCurrentSession();
  }, []);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(timezone);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const currentDate = new Date();
      
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      const checkInData = {
        date: formattedDate,
        checkInTime: currentDate.toISOString(),
        checkInLocation: location ? `${location?.latitude},${location?.longitude}` : '',
        notes: "",
      };

      const response = await axios.post(APIDictionary.checkIn, checkInData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log(response);
      

      if (response.status === 201) {
        setIsCheckedIn(true);
        setSessionInfo({
          sessionNumber: response.data.sessionNumber,
          totalHours: 0,
          status: response.data.status
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Check-in failed:', error.response?.data?.message || error.message);
      } else {
        console.error('Check-in failed:', error);
      }
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const currentDate = new Date();
      const checkOutData = {
        userId: user?.id,
        date: format(currentDate, 'yyyy-MM-dd'),
        checkOutTime: currentDate.toISOString(),
        checkOutLocation: location ? `${location?.latitude},${location?.longitude}` : '',
        notes: "",
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress
      };

      const response = await axios.post(APIDictionary.checkOut, checkOutData, {
        withCredentials: true
      });
      
      setIsCheckedIn(false);
      if (response?.data?.dailyTotal && response?.data?.session) {
        setSessionInfo({
          sessionNumber: response?.data?.session?.sessionNumber,
          totalHours: response?.data?.dailyTotal?.hours,
          status: response?.data?.session?.status
        });
      }
    } catch (error:AxiosError | any) {
      toast({
        title:error?.response?.data?.message,
        description: "Please try again",
        variant:"destructive"
      })
      console.error('Check-out failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 w-full h-full overflow-y-scroll">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Attendance Panel</h1>
        <Button 
          onClick={() => router('/p/attendance/history')}
          variant="outline"
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          History
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            {sessionInfo && (
              <>
                <p>Status: {sessionInfo.status}</p>
                <p>Total Hours: {sessionInfo.totalHours}</p>
              </>
            )}
            <p>IP Address: {ipAddress || 'Loading...'}</p>
            <p>Location: {location ? `${location?.latitude}, ${location?.longitude}` : 'Loading...'}</p>
            <p>Device: {deviceInfo?.platform}</p>
          </div>
          
          <div className="flex justify-center">
            {!isCheckedIn ? (
              <Button 
                onClick={handleCheckIn} 
                disabled={loading}
                className="bg-green-500 hover:bg-green-600"
              >
                {loading ? 'Processing...' : 'Check In'}
              </Button>
            ) : (
              <Button 
                onClick={handleCheckOut} 
                disabled={loading}
                className="bg-red-500 hover:bg-red-600"
              >
                {loading ? 'Processing...' : 'Check Out'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
            <CardTitle>Today's Sessions</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {todaySessions?.map((session:AttendanceRecord) => (
                        <TableRow key={session?.id}>
                            <TableCell>{session?.sessionNumber}</TableCell>
                            <TableCell>
                                {format(new Date(session?.checkInTime), 'HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                                {session?.checkOutTime ? 
                                    format(new Date(session?.checkOutTime), 'HH:mm:ss') : 
                                    'Active'}
                            </TableCell>
                            <TableCell>
                                {session?.duration?.hours || 0}h
                            </TableCell>
                            <TableCell>{session?.status}</TableCell>
                            <TableCell>
                                {session?.checkInLocation ? 'Yes' : 'No'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePanel;