import  { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Laptop, Calendar, UserCheck, ClipboardList, CheckCircle, XCircle, Plus, Minus, Layers, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionInfo {
  sessionNumber: number;
  totalHours: number;
  status: string;
}
interface reportData {
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
  const [todaySessions, setTodaySessions] = useState<AttendanceRecord[]>([]);
  const router = useNavigate();
  const [PastNotCheckedDayscount, setPastNotCheckedDayscount] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState<boolean>(false);
  const [reportData, setReportData] = useState<reportData>({ "Task 1": "Task 1", "Task 2": "Task 2" });
  const [taskCount, setTaskCount] = useState<number>(2);
  const [fallbackDialogVisible, setFallbackDialogVisible] = useState<boolean>(false);
  const [permissionList] = useAtom(permissionListAtom);

  const hasPermission = (key: string) => {
    return permissionList.some(permission => permission.key === key);
  };

  const canMarkAttendance = hasPermission('mark_attendance');
  const canViewOwnAttendance = hasPermission('view_own_attendance');
  const canViewSubordinatesAttendance = hasPermission('view_subordinates_attendance');
  const canViewAllUsersAttendance = hasPermission('view_all_user_attendance');
  const canModifyPastAttendance = hasPermission('modify_past_attendance');

  const canViewOthersAttendance = canViewSubordinatesAttendance || canViewAllUsersAttendance;

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

  const handleCheckIn = async () => {
    if (!canMarkAttendance) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to mark attendance",
        variant: "destructive",
      });
      return;
    }

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
    if (!canMarkAttendance) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to mark attendance",
        variant: "destructive",
      });
      return;
    }

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

      setReportDialogOpen(false);
      setFallbackDialogVisible(false);

      toast({
        title: "Checked out successfully",
        description: "Your daily report has been submitted",
        variant: "default"
      });

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
    try {
      setReportDialogOpen(true);
      setFallbackDialogVisible(true);
    } catch (error) {
      console.error("Error opening dialog:", error);
      setFallbackDialogVisible(true);
    }
  };

  const handleTaskInputChange = (index: number, value: string) => {
    setReportData(prev => {
      const newReportData = { ...prev };
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

  const getStatusColor = (status: string | undefined): string => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTotalHoursToday = () => {
    return todaySessions.reduce((total, session) =>
      total + (session.duration?.hours || 0), 0);
  };

  return (
    <div className="p-6 w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
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

      <Dialog open={reportDialogOpen} onOpenChange={(open) => {
        setReportDialogOpen(open);
        setFallbackDialogVisible(open);
      }}>
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your daily attendance records
          </p>
        </div>

        <div className='flex flex-wrap gap-3'>
          {canModifyPastAttendance && (
            <Button
              onClick={() => router('/p/attendance/past-not-checked-days')}
              variant="outline"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Regularize
              {PastNotCheckedDayscount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white text-indigo-600">
                  {PastNotCheckedDayscount}
                </Badge>
              )}
            </Button>
          )}

          {canViewOthersAttendance && (
            <>
              <Button
                onClick={() => router('/p/attendance/live')}
                variant="outline"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Live Panel
              </Button>
              <Button
                onClick={() => router('/p/attendance/verification')}
                variant="outline"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verification
              </Button>
            </>
          )}

          {(canViewOwnAttendance || canViewOthersAttendance) && (
            <Button
              onClick={() => router('/p/attendance/history')}
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Today's Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {isCheckedIn ? 'Checked In' : 'Checked Out'}
                    </p>
                    {sessionInfo && (
                      <Badge className={`mt-2 ${getStatusColor(sessionInfo.status)}`}>
                        {sessionInfo.status}
                      </Badge>
                    )}
                  </div>
                  {isCheckedIn ?
                    <CheckCircle className="h-8 w-8 text-green-500" /> :
                    <XCircle className="h-8 w-8 text-gray-400" />
                  }
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hours Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {sessionInfo?.totalHours || getTotalHoursToday() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      #{sessionInfo?.sessionNumber || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="mr-2 h-5 w-5" />
                Attendance System
              </CardTitle>
              <CardDescription>Mark your daily attendance and view your status</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Laptop className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Device</p>
                      <p className="text-sm text-muted-foreground">
                        {deviceInfo?.platform || <Skeleton className="h-4 w-24" />}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">IP Address</p>
                      <p className="text-sm text-muted-foreground">
                        {ipAddress || <Skeleton className="h-4 w-32" />}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:border-l md:pl-6 pt-4 md:pt-0">
                  <p className="text-sm font-medium mb-2">Location</p>
                  {location?.latitude && location.longitude ? (
                    <LocationViewer
                      lat={location?.latitude.toString()}
                      lon={location?.longitude.toString()}
                      className="rounded-md overflow-hidden border h-32"
                    />
                  ) : (
                    <div className="h-32 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                {!isCheckedIn ? (
                  <Button
                    onClick={handleCheckIn}
                    disabled={loading || !canMarkAttendance}
                    className="bg-green-600 hover:bg-green-700 text-white py-6 px-8 text-lg"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Check In
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCheckOut}
                    disabled={loading || !canMarkAttendance}
                    className="bg-red-600 hover:bg-red-700 text-white py-6 px-8 text-lg"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-5 w-5" />
                        Check Out
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          {canViewOwnAttendance && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="mr-2 h-5 w-5" />
                  Today's Sessions
                </CardTitle>
                <CardDescription>Record of your attendance today</CardDescription>
              </CardHeader>
              <CardContent>
                {todaySessions?.length > 0 ? (
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
                        <TableRow key={session?.id} className={!session?.checkOutTime ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                          <TableCell className="font-medium">#{session?.sessionNumber}</TableCell>
                          <TableCell>
                            {format(new Date(session?.checkInTime), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            {session?.checkOutTime ?
                              format(new Date(session?.checkOutTime), 'HH:mm:ss') :
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Active</Badge>
                            }
                          </TableCell>
                          <TableCell>
                            {session?.duration?.hours || 0}h
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(session?.status)}>
                              {session?.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session?.checkInLocation ? (
                              <MapPin className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No sessions recorded today</p>
                    {canMarkAttendance && (
                      <Button
                        onClick={handleCheckIn}
                        disabled={loading || isCheckedIn}
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Check In Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendancePanel;