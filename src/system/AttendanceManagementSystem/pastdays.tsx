import { APIDictionary } from "@/api/v2/APIdict";
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
    DialogTitle 
} from "@/components/ui/dialog";
import axios from "axios";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

const PastNotCheckedDays = () => {
    const [data, setData] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
    const { toast } = useToast();
    const [openDialogs, setOpenDialogs] = useState<{ [key: string]: boolean }>({});

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            checkOutTime: '',
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
        
        try {
            const checkInDate = new Date(selectedSession.checkInTime);
            const [hours, minutes] = values.checkOutTime.split(':');
            
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0);
            
            // Simple validation for checkout time
            if (checkOutDate <= checkInDate) {
                toast({
                    title: "Error",
                    description: "Check-out time must be after check-in time",
                    variant: "destructive",
                });
                return;
            }

            await axios.post(`${APIDictionary.attendance}/check-out/past`, {
                attendanceId: values.attendanceId,
                checkOutTime: checkOutDate.toISOString(),
                notes: values.notes
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

    return (
        <Card className="mt-4 w-full">
            <CardHeader>
                <CardTitle>Past Unchecked Sessions</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
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
                                                            />
                                                        </div>
                                                        <Button type="submit" className="w-full">
                                                            Submit
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
    );
};

export default PastNotCheckedDays;