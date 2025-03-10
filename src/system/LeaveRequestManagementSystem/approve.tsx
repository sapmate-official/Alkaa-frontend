import { APIDictionary } from "@/api/v2/APIdict"
import { LeaveRequest } from "@/interface/general"
import { useAuth } from "@/services/AuthContext"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

const LeaveRequestApprove = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[] | null>([])
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const { user } = useAuth()
    const { toast } = useToast()

    const fetchLeaveRequests = async () => {
        try {
            const response = await axios.get(`${APIDictionary.leave_request}/manager/${user?.id}`, { withCredentials: true })
            if (response.status === 200) {
                setLeaveRequests(response.data)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch leave requests",
                variant: "destructive"
            })
        }
    }

    const handleApprove = async (id: string) => {
        try {
            const response = await axios.post(`${APIDictionary.leave_request}/approve/${id}`, {
                approvedBy: user?.id
            });
            console.log(response.data);

            toast({
                title: "Success",
                description: "Leave request approved successfully",
                variant: "default"
            });
            
            fetchLeaveRequests();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error || "Failed to approve leave request";

                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive"
                });

                // If the request was invalid or not found, refresh the list
                if (error.response?.status === 404 || error.response?.status === 400) {
                    fetchLeaveRequests();
                }
            } else {
                toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive"
                });
            }
        }
    }

    const handleReject = async (id: string) => {
        if (!rejectionReason) {
            toast({
                title: "Error",
                description: "Please provide a rejection reason",
                variant: "destructive"
            })
            return
        }

        try {
            await axios.post(`${APIDictionary.leave_request}/reject/${id}`, {
                approvedBy: user?.id,
                rejectedReason: rejectionReason
            })
            toast({
                title: "Success",
                description: "Leave request rejected"
            })
            setRejectionReason("")
            fetchLeaveRequests()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reject leave request",
                variant: "destructive"
            })
        }
    }

    useEffect(() => {
        fetchLeaveRequests()
    }, [])

    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="h-screen w-full"
        >
            {/* Left Panel - List of Leave Requests */}
            <ResizablePanel defaultSize={25} minSize={20}>
                <div className="h-full p-4">
                    <CardHeader>
                        <CardTitle>Leave Requests</CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-[calc(100vh-120px)]">
                        <div className="mb-6">
                            <h3 className="font-semibold text-md mb-2 px-2">Pending Requests</h3>
                            {leaveRequests?.filter(request => request.status === 'PENDING').map((request) => (
                                <Card
                                    key={request.id}
                                    className={`mb-2 cursor-pointer hover:bg-accent ${selectedRequest?.id === request.id ? 'border-primary' : ''}`}
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold">{request.user?.firstName} {request.user?.lastName}</h4>
                                                <p className="text-sm text-muted-foreground">{request.leaveType?.name}</p>
                                            </div>
                                            <Badge variant="secondary">
                                                {request.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm mt-2">{format(new Date(request?.startDate), 'PP')} - {format(new Date(request?.endDate), 'PP')}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Separator className="my-4" />

                        <div>
                            <h3 className="font-semibold text-md mb-2 px-2">Responded Requests</h3>
                            {leaveRequests?.filter(request => request.status !== 'PENDING').map((request) => (
                                <Card
                                    key={request.id}
                                    className={`mb-2 cursor-pointer hover:bg-accent ${selectedRequest?.id === request.id ? 'border-primary' : ''}`}
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold">{request.user?.firstName} {request.user?.lastName}</h4>
                                                <p className="text-sm text-muted-foreground">{request.leaveType?.name}</p>
                                            </div>
                                            <Badge
                                                variant={request.status === 'APPROVED' ? 'success' : 'destructive'}
                                            >
                                                {request.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm mt-2">{format(new Date(request?.startDate), 'PP')} - {format(new Date(request?.endDate), 'PP')}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right Panel - Selected Leave Request Details */}
            <ResizablePanel defaultSize={75}>
                <div className="h-full p-4">
                    {selectedRequest ? (
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Leave Request Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold">Employee</h4>
                                        <p>{selectedRequest?.user?.firstName} {selectedRequest?.user?.lastName}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Leave Type</h4>
                                        <p>{selectedRequest?.leaveType?.name}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="font-semibold">Duration</h4>
                                    <p>{format(new Date(selectedRequest?.startDate), 'PPP')} - {format(new Date(selectedRequest?.endDate), 'PPP')}</p>
                                    <p className="text-sm text-muted-foreground">({selectedRequest?.numberOfDays} days)</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold">Reason</h4>
                                    <p>{selectedRequest?.reason || 'No reason provided'}</p>
                                </div>

                                {selectedRequest?.status === 'PENDING' && (
                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Enter rejection reason"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="default"
                                                onClick={() => handleApprove(selectedRequest.id)}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleReject(selectedRequest.id)}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a leave request to view details
                        </div>
                    )}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

export default LeaveRequestApprove