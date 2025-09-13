import { APIDictionary } from "@/services/api/v2/APIdict";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
    Dialog, 
    DialogTrigger, 
    DialogContent, 
    DialogTitle,
    DialogHeader,
    DialogFooter 
} from "@/components/ui/dialog";
import axios from "axios";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useGeolocation } from "@/hooks/useAttendance";

// Simplified interfaces
interface AttendanceSession {
    id: string;
    date: string;
    checkInTime: string;
    sessionNumber: number;
}

// Simplified form schema
const formSchema = z.object({
    attendanceId: z.string(),
    checkOutTime: z.string().min(1, "Check-out time is required"),
    notes: z.string().optional(),
});

// New schema for creating past attendance
const pastAttendanceSchema = z.object({
    date: z.string().min(1, "Date is required"),
    checkInTime: z.string().min(1, "Check-in time is required"),
    checkOutTime: z.string().min(1, "Check-out time is required"),
    notes: z.string().min(1, "Please explain why attendance wasn't given on time"),
});

interface ReportData {
    [key: string]: string;
}

const PastNotCheckedDays = () => {
    const [data, setData] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
    const { toast } = useToast();
    const [openDialogs, setOpenDialogs] = useState<{ [key: string]: boolean }>({});
    const [isAddNewDialogOpen, setIsAddNewDialogOpen] = useState(false);
    const { location } = useGeolocation();
    const [reportData, setReportData] = useState<ReportData>({ "Task 1": "", "Task 2": "" });
    const [taskCount, setTaskCount] = useState<number>(2);
    const [endingSessionId, setEndingSessionId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            checkOutTime: '',
            notes: ''
        }
    });

    const newAttendanceForm = useForm<z.infer<typeof pastAttendanceSchema>>({
        resolver: zodResolver(pastAttendanceSchema),
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            checkInTime: '09:00',
            checkOutTime: '17:00',
            notes: ''
        }
    });

    const fetchData = async () => {
        try {
            const response = await axios.get(`${APIDictionary.attendance}/check-out/past`, {
                withCredentials: true
            });
            setData(response.data);
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

    // Simplified handleEndSession function with manual validation
    const handleEndSession = async (values: z.infer<typeof formSchema>) => {
        if (!selectedSession) return;

        setEndingSessionId(values.attendanceId);

        try {
            const checkInDate = new Date(selectedSession.checkInTime);
            const [hours, minutes] = values.checkOutTime.split(':');

            // Use client-side time for checkout
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0);

            // Simple validation for checkout time
            if (checkOutDate <= checkInDate) {
                toast({
                    title: "Error",
                    description: "Check-out time must be after check-in time",
                    variant: "destructive",
                });
                setEndingSessionId(null);
                return;
            }

            await axios.post(`${APIDictionary.attendance}/check-out/past`, {
                attendanceId: values.attendanceId,
                checkOutTime: checkOutDate.toISOString(), // Client timestamp
                notes: values.notes,
                clientTimestamp: new Date().toISOString(),
                clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }, {
                withCredentials: true
            });

            toast({
                title: "Success",
                description: "Session ended successfully",
            });

            setOpenDialogs(prev => ({ ...prev, [values.attendanceId]: false }));
            fetchData();
        } catch (error) {
            console.error('Failed to end session:', error);
            toast({
                title: "Error",
                description: "Failed to end session",
                variant: "destructive",
            });
        } finally {
            setEndingSessionId(null);
        }
    };

    const handleAddNewAttendance = async (values: z.infer<typeof pastAttendanceSchema>) => {
        if (!location) {
            toast({
                title: "Error",
                description: "Location data is not available yet. Please wait.",
                variant: "destructive",
            });
            return;
        }
        
        try {
            setLoading(true);
            
            // Prepare the date objects using client-side time
            const selectedDate = new Date(values.date);
            const currentClientTime = new Date(); // For reference
            
            // Create check-in datetime using client-side date
            const [checkInHours, checkInMinutes] = values.checkInTime.split(':');
            const checkInDateTime = new Date(selectedDate);
            checkInDateTime.setHours(parseInt(checkInHours), parseInt(checkInMinutes), 0);
            
            // Create check-out datetime using client-side date
            const [checkOutHours, checkOutMinutes] = values.checkOutTime.split(':');
            const checkOutDateTime = new Date(selectedDate);
            checkOutDateTime.setHours(parseInt(checkOutHours), parseInt(checkOutMinutes), 0);
            
            // Simple validation for checkout time
            if (checkOutDateTime <= checkInDateTime) {
                toast({
                    title: "Error",
                    description: "Check-out time must be after check-in time",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }
            
            // Format the location data
            const locationString = `${location.latitude},${location.longitude}`;
            
            // Create payload with client timestamps
            const payload = {
                date: format(selectedDate, 'yyyy-MM-dd'),
                checkInTime: checkInDateTime.toISOString(),
                checkInLocation: locationString,
                checkOutTime: checkOutDateTime.toISOString(),
                checkOutLocation: locationString,
                notes: values.notes,
                reportContent: JSON.stringify(reportData),
                clientTimestamp: currentClientTime.toISOString(), // When the request was made
                clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
             await axios.post(`${APIDictionary.attendance}/past-attendance`, payload, {
                withCredentials: true
            });
            
            toast({
                title: "Success",
                description: "Past attendance record created successfully",
            });
            
            setIsAddNewDialogOpen(false);
            fetchData();
            
        } catch (error: any) {
            console.error('Failed to create past attendance:', error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to create past attendance",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSession = async (id: string) => {
        if (confirm("Are you sure you want to delete this session?")) {
            try {
                await axios.delete(`${APIDictionary.attendance}/${id}`, {
                    withCredentials: true
                });
                toast({
                    title: "Success",
                    description: "Session deleted successfully",
                });
                fetchData();
            } catch (error) {
                console.error('Failed to delete session:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete session",
                    variant: "destructive",
                });
            }
        }
    };

    const handleOpenDialog = (sessionId: string) => {
        setOpenDialogs(prev => ({ ...prev, [sessionId]: true }));
    };

    const handleCloseDialog = (sessionId: string) => {
        setOpenDialogs(prev => ({ ...prev, [sessionId]: false }));
    };

    const handleTaskInputChange = (index: number, value: string) => {
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
            [`Task ${taskCount + 1}`]: ""
        }));
    };

    const removeTaskField = (index: number) => {
        if (Object.keys(reportData).length <= 1) return;
        
        setTaskCount(prev => prev - 1);
        setReportData(prev => {
            const newReportData = { ...prev };
            delete newReportData[`Task ${index + 1}`];
            
            const reindexedData: ReportData = {};
            let newIndex = 1;
            
            Object.values(newReportData).forEach(value => {
                reindexedData[`Task ${newIndex}`] = value;
                newIndex++;
            });
            
            return reindexedData;
        });
    };

    return (
        <div className="w-full p-4 bg-background shadow-md overflow-y-auto h-screen">
            <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold">Past Unchecked Sessions</h2>
                <Button onClick={() => setIsAddNewDialogOpen(true)} variant="default">
                    Add New Past Attendance
                </Button>
            </div>
            
            <Card className="mt-4 w-full flex-grow">
                <CardHeader>
                    <CardTitle>Past Unchecked Sessions</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-4">No unchecked sessions found</div>
                    ) : (
                        <div className="space-y-4">
                            {data.map((session) => (
                                <Card key={session.id} className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">Date: {format(new Date(session.date), 'PPP')}</p>
                                            <p>Check In: {format(new Date(session.checkInTime), 'pp')}</p>
                                            <p>Session: {session.sessionNumber}</p>
                                        </div>
                                        <div className="space-x-2">
                                            <Dialog 
                                                open={openDialogs[session.id]} 
                                                onOpenChange={(open) => {
                                                    if (open) {
                                                        handleOpenDialog(session.id);
                                                    } else {
                                                        handleCloseDialog(session.id);
                                                    }
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedSession(session);
                                                            form.setValue('attendanceId', session.id);
                                                            
                                                            // Set a default value for checkout time
                                                            const checkInDate = new Date(session.checkInTime);
                                                            const defaultCheckoutHour = (checkInDate.getHours() + 1) % 24;
                                                            const defaultTime = `${String(defaultCheckoutHour).padStart(2, '0')}:${String(checkInDate.getMinutes()).padStart(2, '0')}`;
                                                            form.setValue('checkOutTime', defaultTime);
                                                        }}
                                                        variant="default"
                                                    >
                                                        End Session
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogTitle>End Session</DialogTitle>
                                                    <Form {...form}>
                                                        <form onSubmit={form.handleSubmit(handleEndSession)} className="space-y-4">
                                                            <input type="hidden" {...form.register('attendanceId')} />
                                                            <div className="space-y-2">
                                                                <Label htmlFor="checkOutTime">Check Out Time</Label>
                                                                <Input
                                                                    type="time"
                                                                    {...form.register('checkOutTime')}
                                                                    disabled={endingSessionId === session.id}
                                                                />
                                                                {form.formState.errors.checkOutTime && (
                                                                    <p className="text-sm text-red-500">{form.formState.errors.checkOutTime.message}</p>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="notes">Notes</Label>
                                                                <Textarea
                                                                    {...form.register('notes')}
                                                                    placeholder="Why wasn't the session checked out?"
                                                                    disabled={endingSessionId === session.id}
                                                                />
                                                            </div>
                                                            <Button 
                                                                type="submit" 
                                                                className="w-full"
                                                                disabled={endingSessionId === session.id}
                                                            >
                                                                {endingSessionId === session.id ? "Processing..." : "Submit"}
                                                            </Button>
                                                        </form>
                                                    </Form>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleDeleteSession(session.id)}
                                            >
                                                Delete Session
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog for adding new past attendance */}
            <Dialog 
                open={isAddNewDialogOpen} 
                onOpenChange={setIsAddNewDialogOpen}
            >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New Past Attendance</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...newAttendanceForm}>
                        <form onSubmit={newAttendanceForm.handleSubmit(handleAddNewAttendance)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        type="date"
                                        id="date"
                                        max={format(new Date(), 'yyyy-MM-dd')}
                                        {...newAttendanceForm.register('date')}
                                    />
                                    {newAttendanceForm.formState.errors.date && (
                                        <p className="text-sm text-red-500">{newAttendanceForm.formState.errors.date.message}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="checkInTime">Check In Time</Label>
                                    <Input
                                        type="time"
                                        id="checkInTime"
                                        {...newAttendanceForm.register('checkInTime')}
                                    />
                                    {newAttendanceForm.formState.errors.checkInTime && (
                                        <p className="text-sm text-red-500">{newAttendanceForm.formState.errors.checkInTime.message}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="checkOutTime">Check Out Time</Label>
                                    <Input
                                        type="time"
                                        id="checkOutTime"
                                        {...newAttendanceForm.register('checkOutTime')}
                                    />
                                    {newAttendanceForm.formState.errors.checkOutTime && (
                                        <p className="text-sm text-red-500">{newAttendanceForm.formState.errors.checkOutTime.message}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="notes">Reason for past attendance</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Please explain why you couldn't mark your attendance on time"
                                        {...newAttendanceForm.register('notes')}
                                    />
                                    {newAttendanceForm.formState.errors.notes && (
                                        <p className="text-sm text-red-500">{newAttendanceForm.formState.errors.notes.message}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <Label className="mb-2 block">Daily Tasks Report</Label>
                                <p className="text-sm text-gray-500 mb-4">
                                    Please list all the tasks you completed on this day.
                                </p>
                                
                                {Object.keys(reportData).map((key, index) => (
                                    <div key={key} className="flex items-center gap-2 mb-3">
                                        <Input
                                            value={reportData[key]}
                                            onChange={(e) => handleTaskInputChange(index, e.target.value)}
                                            placeholder={`Task ${index + 1}`}
                                            className="flex-grow"
                                        />
                                        <Button 
                                            type="button"
                                            variant="outline" 
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
                                    className="mt-2 w-full"
                                >
                                    Add Another Task
                                </Button>
                            </div>
                            
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsAddNewDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    disabled={loading || !location}
                                >
                                    {loading ? 'Submitting...' : 'Submit Past Attendance'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PastNotCheckedDays;