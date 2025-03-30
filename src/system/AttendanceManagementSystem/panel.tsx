import  { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeviceInfo, useIpAddress, useGeolocation } from '@/hooks/useAttendance';
import { APIDictionary } from '@/api/v2/APIdict';
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
import LocationViewer from '@/components/Locationviewer';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SessionInfo {
  sessionNumber: number;
  totalHours: number;
  status: string;
}
interface reportData{
  [key: string]: string;
}

const AttendancePanel = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const { deviceInfo } = useDeviceInfo();
  const { ipAddress } = useIpAddress();
  const { location } = useGeolocation();
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [todaySessions, setTodaySessions] = useState([]);
  const router = useNavigate();
  const [PastNotCheckedDayscount, setPastNotCheckedDayscount] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState<boolean>(false);
  const [reportData, setReportData] = useState<reportData>({"Task 1": "Task 1", "Task 2": "Task 2"});
  const [taskCount,setTaskCount] = useState<number>(2);
  const [fallbackDialogVisible, setFallbackDialogVisible] = useState<boolean>(false);
  console.log("Fallback dialog visible:", fallbackDialogVisible);
  
  const fetchData = async () => {
    try {
        const response = await axios.get(`${APIDictionary.attendance}/check-out/past`, {
            withCredentials: true
        });
        setPastNotCheckedDayscount(response.data.length);
        setLoading(false);
    } catch (error) {
        console.error('Failed to fetch past not checked days:', error);
        toast({
            title: "Error",
            description: "Failed to fetch past sessions",
            variant: "destructive",
        });
    }
};

useEffect(() => {
    fetchData();
}, []);


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

  const submitCheckout = async () => {
    console.log("Submitting checkout with report data:", reportData);
    setLoading(true);
    try {
      const currentDate = new Date();
      const checkOutData = {
        userId: user?.id,
        date: format(currentDate, 'yyyy-MM-dd'),
        checkOutTime: currentDate.toISOString(),
        checkOutLocation: location ? `${location?.latitude},${location?.longitude}` : '',
        notes: JSON.stringify(reportData),
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress,
        reportContent: JSON.stringify(reportData),
      };

      console.log("Sending checkout data:", checkOutData);
      const response = await axios.post(APIDictionary.checkOut, checkOutData, {
        withCredentials: true
      });

      console.log("Checkout response:", response.data);
      setIsCheckedIn(false);
      if (response?.data?.dailyTotal && response?.data?.session) {
        setSessionInfo({
          sessionNumber: response?.data?.session?.sessionNumber,
          totalHours: response?.data?.dailyTotal?.hours,
          status: response?.data?.session?.status
        });
      }
      
      setReportDialogOpen(false);
      setFallbackDialogVisible(false);
      
      toast({
        title: "Checked out successfully",
        description: "Your daily report has been submitted",
        variant: "default"
      });
      
      // Refresh today's sessions after successful checkout
      const today = format(new Date(), 'yyyy-MM-dd');
      const sessionsResponse = await axios.get(`${APIDictionary.todaySessions}${today}`, {
        withCredentials: true
      });
      setTodaySessions(sessionsResponse.data);
      
    } catch (error: AxiosError | any) {
      console.error("Checkout error details:", error.response?.data || error.message);
      toast({
        title: error?.response?.data?.message || "Checkout failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    console.log("Check out button clicked, attempting to open dialog");
    try {
      setReportDialogOpen(true);
      setFallbackDialogVisible(true);
      console.log("Dialog state set to open:", reportDialogOpen);
    } catch (error) {
      console.error("Error opening dialog:", error);
      setFallbackDialogVisible(true);
    }
  };

  const handleTaskInputChange = (index: number, value: string) => {
    console.log(`Updating task ${index + 1} to: ${value}`);
    setReportData(prev => {
      const newReportData = {...prev};
      newReportData[`Task ${index + 1}`] = value;
      return newReportData;
    });
  };

  const addTaskField = () => {
    setTaskCount(prev => prev + 1);
    setReportData(prev => ({
      ...prev,
      [`Task ${taskCount + 1}`]: `Task ${taskCount + 1}`
    }));
  };

  const removeTaskField = (index: number) => {
    setTaskCount(prev => prev - 1);
    setReportData(prev => {
      const newReportData = { ...prev };
      delete newReportData[`Task ${index + 1}`];
      
      const reindexedData: reportData = {};
      let newIndex = 1;
      
      Object.values(newReportData).forEach(value => {
        reindexedData[`Task ${newIndex}`] = value;
        newIndex++;
      });
      
      return reindexedData;
    });
  };

  return (
    <div className="p-4 w-full h-full overflow-y-scroll">
      {fallbackDialogVisible && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={(e) => {
          if (e.target === e.currentTarget) setFallbackDialogVisible(false);
        }}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-[500px] w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Daily Task Report</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please list all the tasks you've completed today before checking out.
            </p>
            
            {Object.keys(reportData).map((key, index) => (
              <div key={key} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={reportData[key]}
                  onChange={(e) => handleTaskInputChange(index, e.target.value)}
                  placeholder={`Task ${index + 1}`}
                  className="flex-grow border p-2 rounded"
                />
                <button 
                  onClick={() => removeTaskField(index)}
                  className="h-10 w-10 p-0 border rounded"
                  disabled={Object.keys(reportData).length <= 1}
                >
                  ×
                </button>
              </div>
            ))}
            
            <button 
              onClick={addTaskField}
              className="mt-2 border p-2 rounded w-full text-center"
            >
              Add Another Task
            </button>
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setFallbackDialogVisible(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  submitCheckout();
                  setFallbackDialogVisible(false);
                }}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                {loading ? 'Processing...' : 'Submit & Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Dialog 
        open={reportDialogOpen} 
        onOpenChange={(open) => {
          console.log("Dialog open state changing to:", open);
          setReportDialogOpen(open);
          setFallbackDialogVisible(open);
        }}
      >
        <DialogTrigger asChild>
          <span id="hiddenDialogTrigger" className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Daily Task Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-500">
              Please list all the tasks you've completed today before checking out.
            </p>
            
            {Object.keys(reportData).map((key, index) => (
              <div key={key} className="flex items-center gap-2">
                <Label htmlFor={`task-${index}`} className="sr-only">
                  Task {index + 1}
                </Label>
                <Input
                  id={`task-${index}`}
                  value={reportData[key]}
                  onChange={(e) => handleTaskInputChange(index, e.target.value)}
                  placeholder={`Task ${index + 1}`}
                  className="flex-grow"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  type="button"
                  onClick={() => removeTaskField(index)}
                  className="h-10 w-10 p-0"
                  disabled={Object.keys(reportData).length <= 1}
                >
                  ×
                </Button>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={addTaskField}
              className="mt-2"
            >
              Add Another Task
            </Button>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={submitCheckout}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Processing...' : 'Submit & Check Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Attendance Panel</h1>
        <div className='flex space-x-4'>

            <Button
            onClick={() => router('/p/attendance/past-not-checked-days')}
            variant="outline"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            >
            Regularize ({PastNotCheckedDayscount})
            </Button>
          <Button
            onClick={() => router('/p/attendance/live')}
            variant="outline"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Live Panel
          </Button>
          <Button
            onClick={() => router('/p/attendance/verification')}
            variant="outline"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Verification Panel
          </Button>
          <Button
            onClick={() => router('/p/attendance/history')}
            variant="outline"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            History
          </Button>
        </div>
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
            {
              location?.latitude && location.longitude &&
            (<LocationViewer lat={location?.latitude.toString()}lon={location?.longitude.toString()}/>)
            }
            {/* <p>Location: {location ? `${location?.latitude}, ${location?.longitude}` : 'Loading...'}</p> */}
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
              {todaySessions?.map((session: AttendanceRecord) => (
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